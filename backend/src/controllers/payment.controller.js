const Payment = require('../models/Payment');
const Policy = require('../models/Policy');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, getSort, escapeRegex } = require('../utils/pagination');
const { generateBusinessId } = require('../services/sequence.service');
const { createAutomaticNotification } = require('../services/notification.service');

function assertValidPaymentDate(paymentDate) {
  if (!paymentDate) {
    throw ApiError.badRequest('La fecha de pago es obligatoria', 'PAYMENT_DATE_REQUIRED');
  }

  const parsedPaymentDate = new Date(paymentDate);
  if (Number.isNaN(parsedPaymentDate.getTime())) {
    throw ApiError.badRequest('Fecha de pago inválida', 'INVALID_PAYMENT_DATE');
  }

  return parsedPaymentDate;
}

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query);
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.method) filter.method = req.query.method;
  if (req.query.client) filter.client = req.query.client;
  if (req.query.policy) filter.policy = req.query.policy;
  if (req.query.from || req.query.to) {
    filter.paymentDate = {};
    if (req.query.from) filter.paymentDate.$gte = new Date(req.query.from);
    if (req.query.to) filter.paymentDate.$lte = new Date(req.query.to);
  }
  if (req.query.q) {
    const regex = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ receiptNumber: regex }, { reference: regex }];
  }

  const [payments, total] = await Promise.all([
    Payment.find(filter).sort(sort).skip(skip).limit(limit)
      .populate('client', 'name identification')
      .populate('policy', 'policyNumber'),
    Payment.countDocuments(filter)
  ]);

  ApiResponse.list(res, { data: payments, page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('client', 'name identification')
    .populate('policy', 'policyNumber');
  if (!payment) throw ApiError.notFound('Pago no encontrado');
  ApiResponse.success(res, { data: { payment } });
});

const create = asyncHandler(async (req, res) => {
  const { policy: policyId, amount, paymentDate, status, method, reference, notes } = req.body;

  const policy = await Policy.findById(policyId);
  if (!policy) throw ApiError.badRequest('La póliza indicada no existe', 'POLICY_NOT_FOUND');
  if (policy.status === 'cancelled') {
    throw ApiError.conflict('La póliza está cancelada y no admite pagos.', 'POLICY_CANCELLED');
  }

  const parsedPaymentDate = assertValidPaymentDate(paymentDate);

  const receiptNumber = await generateBusinessId('PAY');

  const payment = await Payment.create({
    receiptNumber,
    client: policy.client,
    policy: policy._id,
    amount,
    paymentDate,
    status: status || 'pending',
    method,
    reference,
    notes,
    registeredBy: req.user._id
  });

  if (payment.status === 'paid') {
    await createAutomaticNotification({
      message: `Se registró el pago ${payment.receiptNumber} por B/. ${payment.amount.toFixed(2)}.`,
      type: 'payment',
      recipientUser: policy.assignedAgent,
      client: policy.client,
      relatedEntityType: 'Payment',
      relatedEntityId: payment._id
    });
  }

  ApiResponse.success(res, { statusCode: 201, message: 'Pago registrado correctamente', data: { payment } });
});

const update = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw ApiError.notFound('Pago no encontrado');

  const { amount, paymentDate, status, method, reference, notes } = req.body;
  const wasPaid = payment.status === 'paid';

  if (amount !== undefined) payment.amount = amount;
  if (paymentDate) payment.paymentDate = paymentDate;
  if (method) payment.method = method;
  if (reference !== undefined) payment.reference = reference;
  if (notes !== undefined) payment.notes = notes;
  if (status) payment.status = status;

  await payment.save();

  if (!wasPaid && payment.status === 'paid') {
    const policy = await Policy.findById(payment.policy);
    await createAutomaticNotification({
      message: `Se registró el pago ${payment.receiptNumber} por B/. ${payment.amount.toFixed(2)}.`,
      type: 'payment',
      recipientUser: policy ? policy.assignedAgent : undefined,
      client: payment.client,
      relatedEntityType: 'Payment',
      relatedEntityId: payment._id
    });
  }

  ApiResponse.success(res, { message: 'Pago actualizado correctamente', data: { payment } });
});

const remove = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw ApiError.notFound('Pago no encontrado');

  await payment.deleteOne();

  ApiResponse.success(res, { message: 'Pago eliminado correctamente' });
});

module.exports = { list, getById, create, update, remove };
