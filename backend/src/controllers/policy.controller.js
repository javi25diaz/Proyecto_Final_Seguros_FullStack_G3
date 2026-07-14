const Policy = require('../models/Policy');
const Client = require('../models/Client');
const Payment = require('../models/Payment');
const Incident = require('../models/Incident');
const Claim = require('../models/Claim');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, getSort, escapeRegex } = require('../utils/pagination');
const { generateBusinessId } = require('../services/sequence.service');
const { createAutomaticNotification } = require('../services/notification.service');

async function resolveAssignedAgent(requestedAgentId, requestUser) {
  if (requestUser.role !== 'admin') {
    if (requestedAgentId && String(requestedAgentId) !== String(requestUser._id)) {
      throw ApiError.forbidden('Un agente solo puede asignarse a sí mismo como responsable', 'AGENT_SELF_ONLY');
    }
    return requestUser._id;
  }

  const agentId = requestedAgentId || requestUser._id;
  const agent = await User.findById(agentId);
  if (!agent || agent.status !== 'active' || !['user', 'admin'].includes(agent.role)) {
    throw ApiError.badRequest('El agente responsable debe ser un usuario activo con rol user o admin', 'INVALID_AGENT');
  }
  return agent._id;
}

function assertValidDateRange(startDate, endDate) {
  if (new Date(startDate) > new Date(endDate)) {
    throw ApiError.badRequest('La fecha de inicio no puede ser posterior a la fecha final', 'INVALID_DATE_RANGE');
  }
}

// Lazily transitions active policies whose coverage period has ended into "expired".
async function syncExpiredStatus(policy) {
  if (policy.status === 'active' && policy.endDate < new Date()) {
    policy.status = 'expired';
    await policy.save();
    await createAutomaticNotification({
      message: `La póliza ${policy.policyNumber} cambió a Vencida.`,
      type: 'policy',
      recipientUser: policy.assignedAgent,
      client: policy.client,
      relatedEntityType: 'Policy',
      relatedEntityId: policy._id
    });
  }
  return policy;
}

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query);
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.insuranceType) filter.insuranceType = req.query.insuranceType;
  if (req.query.client) filter.client = req.query.client;
  if (req.query.q) {
    const regex = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ policyNumber: regex }, { coverage: regex }];
  }

  const [policies, total] = await Promise.all([
    Policy.find(filter).sort(sort).skip(skip).limit(limit).populate('client', 'name identification').populate('assignedAgent', 'name email'),
    Policy.countDocuments(filter)
  ]);

  ApiResponse.list(res, { data: policies, page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  let policy = await Policy.findById(req.params.id).populate('client', 'name identification status').populate('assignedAgent', 'name email');
  if (!policy) throw ApiError.notFound('Póliza no encontrada');
  policy = await syncExpiredStatus(policy);
  ApiResponse.success(res, { data: { policy } });
});

const create = asyncHandler(async (req, res) => {
  const { client: clientId, insuranceType, coverage, premium, startDate, endDate, status, notes } = req.body;

  const client = await Client.findById(clientId);
  if (!client) throw ApiError.badRequest('El cliente indicado no existe', 'CLIENT_NOT_FOUND');
  if (client.status !== 'active') {
    throw ApiError.badRequest('No se puede crear una póliza para un cliente inactivo', 'CLIENT_INACTIVE');
  }

  assertValidDateRange(startDate, endDate);

  const assignedAgent = await resolveAssignedAgent(req.body.assignedAgent, req.user);
  const policyNumber = await generateBusinessId('POL');

  const policy = await Policy.create({
    policyNumber,
    client: client._id,
    insuranceType,
    coverage,
    premium,
    startDate,
    endDate,
    status: status || 'draft',
    assignedAgent,
    notes,
    createdBy: req.user._id
  });

  await createAutomaticNotification({
    message: `Se creó la póliza ${policy.policyNumber} para ${client.name}.`,
    type: 'policy',
    recipientUser: assignedAgent,
    client: client._id,
    relatedEntityType: 'Policy',
    relatedEntityId: policy._id
  });

  ApiResponse.success(res, { statusCode: 201, message: 'Póliza creada correctamente', data: { policy } });
});

const update = asyncHandler(async (req, res) => {
  const policy = await Policy.findById(req.params.id);
  if (!policy) throw ApiError.notFound('Póliza no encontrada');

  const { insuranceType, coverage, premium, startDate, endDate, status, notes } = req.body;

  const nextStartDate = startDate || policy.startDate;
  const nextEndDate = endDate || policy.endDate;
  assertValidDateRange(nextStartDate, nextEndDate);

  if (req.body.assignedAgent !== undefined) {
    policy.assignedAgent = await resolveAssignedAgent(req.body.assignedAgent, req.user);
  }

  if (insuranceType) policy.insuranceType = insuranceType;
  if (coverage) policy.coverage = coverage;
  if (premium !== undefined) policy.premium = premium;
  if (startDate) policy.startDate = startDate;
  if (endDate) policy.endDate = endDate;
  if (notes !== undefined) policy.notes = notes;

  const statusChanged = status && status !== policy.status;
  if (statusChanged) {
    if (status === 'active' && (!policy.coverage || nextStartDate > nextEndDate)) {
      throw ApiError.badRequest('Para activar la póliza las fechas y la cobertura deben ser válidas', 'INVALID_POLICY_STATE');
    }
    policy.status = status;
  }

  await policy.save();

  if (statusChanged) {
    await createAutomaticNotification({
      message: `La póliza ${policy.policyNumber} cambió de estado a ${status}.`,
      type: 'policy',
      recipientUser: policy.assignedAgent,
      client: policy.client,
      relatedEntityType: 'Policy',
      relatedEntityId: policy._id
    });
  }

  ApiResponse.success(res, { message: 'Póliza actualizada correctamente', data: { policy } });
});

const remove = asyncHandler(async (req, res) => {
  const policy = await Policy.findById(req.params.id);
  if (!policy) throw ApiError.notFound('Póliza no encontrada');

  const [hasPayments, hasIncidents, hasClaims] = await Promise.all([
    Payment.exists({ policy: policy._id }),
    Incident.exists({ policy: policy._id }),
    Claim.exists({ policy: policy._id })
  ]);

  if (hasPayments || hasIncidents || hasClaims) {
    throw ApiError.conflict('No se puede eliminar la póliza porque posee pagos, siniestros o reclamaciones asociadas', 'POLICY_HAS_DEPENDENCIES');
  }

  await policy.deleteOne();

  ApiResponse.success(res, { message: 'Póliza eliminada correctamente' });
});

module.exports = { list, getById, create, update, remove };
