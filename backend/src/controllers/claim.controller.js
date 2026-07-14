const Claim = require('../models/Claim');
const Incident = require('../models/Incident');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, getSort, escapeRegex } = require('../utils/pagination');
const { generateBusinessId } = require('../services/sequence.service');
const { createAutomaticNotification } = require('../services/notification.service');

function assertStatusConsistency({ status, amountRequested, amountApproved, resolutionNotes }) {
  if (amountApproved !== undefined && amountApproved !== null && amountApproved > amountRequested) {
    throw ApiError.badRequest('El monto aprobado no puede superar el monto solicitado', 'AMOUNT_APPROVED_EXCEEDS_REQUESTED');
  }
  if (status === 'approved' && (amountApproved === undefined || amountApproved === null)) {
    throw ApiError.badRequest('El monto aprobado es obligatorio cuando la reclamación es aprobada', 'AMOUNT_APPROVED_REQUIRED');
  }
  if (status === 'rejected' && !resolutionNotes) {
    throw ApiError.badRequest('Las notas de resolución son obligatorias cuando la reclamación es rechazada', 'RESOLUTION_NOTES_REQUIRED');
  }
}

const CLAIM_STATUS_LABELS = {
  received: 'Recibida',
  under_analysis: 'En análisis',
  approved: 'Aprobada',
  rejected: 'Rechazada'
};

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query);
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.client) filter.client = req.query.client;
  if (req.query.policy) filter.policy = req.query.policy;
  if (req.query.from || req.query.to) {
    filter.claimDate = {};
    if (req.query.from) filter.claimDate.$gte = new Date(req.query.from);
    if (req.query.to) filter.claimDate.$lte = new Date(req.query.to);
  }
  if (req.query.q) {
    const regex = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ claimNumber: regex }, { description: regex }];
  }

  const [claims, total] = await Promise.all([
    Claim.find(filter).sort(sort).skip(skip).limit(limit)
      .populate('client', 'name identification')
      .populate('policy', 'policyNumber')
      .populate('incident', 'incidentNumber'),
    Claim.countDocuments(filter)
  ]);

  ApiResponse.list(res, { data: claims, page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const claim = await Claim.findById(req.params.id)
    .populate('client', 'name identification')
    .populate('policy', 'policyNumber')
    .populate('incident', 'incidentNumber');
  if (!claim) throw ApiError.notFound('Reclamación no encontrada');
  ApiResponse.success(res, { data: { claim } });
});

const create = asyncHandler(async (req, res) => {
  const { incident: incidentId, claimDate, amountRequested, amountApproved, description, documentUrls, resolutionNotes, status } = req.body;

  const incident = await Incident.findById(incidentId);
  if (!incident) throw ApiError.badRequest('El siniestro indicado no existe', 'INCIDENT_NOT_FOUND');

  const resolvedStatus = status || 'received';
  assertStatusConsistency({ status: resolvedStatus, amountRequested, amountApproved, resolutionNotes });

  const claimNumber = await generateBusinessId('CLM');

  const claim = await Claim.create({
    claimNumber,
    client: incident.client,
    policy: incident.policy,
    incident: incident._id,
    claimDate: claimDate || new Date(),
    status: resolvedStatus,
    amountRequested,
    amountApproved,
    description,
    documentUrls: documentUrls || [],
    resolutionNotes,
    handledBy: req.user._id
  });

  await createAutomaticNotification({
    message: `Se creó la reclamación ${claim.claimNumber}.`,
    type: 'claim',
    recipientUser: req.user._id,
    client: claim.client,
    relatedEntityType: 'Claim',
    relatedEntityId: claim._id
  });

  ApiResponse.success(res, { statusCode: 201, message: 'Reclamación creada correctamente', data: { claim } });
});

const update = asyncHandler(async (req, res) => {
  const claim = await Claim.findById(req.params.id);
  if (!claim) throw ApiError.notFound('Reclamación no encontrada');

  const { amountRequested, amountApproved, description, documentUrls, resolutionNotes, status } = req.body;

  const nextAmountRequested = amountRequested !== undefined ? amountRequested : claim.amountRequested;
  const nextAmountApproved = amountApproved !== undefined ? amountApproved : claim.amountApproved;
  const nextResolutionNotes = resolutionNotes !== undefined ? resolutionNotes : claim.resolutionNotes;
  const nextStatus = status || claim.status;

  assertStatusConsistency({
    status: nextStatus,
    amountRequested: nextAmountRequested,
    amountApproved: nextAmountApproved,
    resolutionNotes: nextResolutionNotes
  });

  const statusChanged = status && status !== claim.status;

  if (amountRequested !== undefined) claim.amountRequested = amountRequested;
  if (amountApproved !== undefined) claim.amountApproved = amountApproved;
  if (description) claim.description = description;
  if (documentUrls) claim.documentUrls = documentUrls;
  if (resolutionNotes !== undefined) claim.resolutionNotes = resolutionNotes;
  if (status) claim.status = status;

  await claim.save();

  if (statusChanged) {
    await createAutomaticNotification({
      message: `La reclamación ${claim.claimNumber} cambió a ${CLAIM_STATUS_LABELS[claim.status]}.`,
      type: 'claim',
      recipientUser: claim.handledBy,
      client: claim.client,
      relatedEntityType: 'Claim',
      relatedEntityId: claim._id
    });
  }

  ApiResponse.success(res, { message: 'Reclamación actualizada correctamente', data: { claim } });
});

const changeStatus = asyncHandler(async (req, res) => {
  const claim = await Claim.findById(req.params.id);
  if (!claim) throw ApiError.notFound('Reclamación no encontrada');

  const { status, amountApproved, resolutionNotes } = req.body;

  const nextAmountApproved = amountApproved !== undefined ? amountApproved : claim.amountApproved;
  const nextResolutionNotes = resolutionNotes !== undefined ? resolutionNotes : claim.resolutionNotes;

  assertStatusConsistency({
    status,
    amountRequested: claim.amountRequested,
    amountApproved: nextAmountApproved,
    resolutionNotes: nextResolutionNotes
  });

  const statusChanged = status !== claim.status;

  claim.status = status;
  if (amountApproved !== undefined) claim.amountApproved = amountApproved;
  if (resolutionNotes !== undefined) claim.resolutionNotes = resolutionNotes;

  await claim.save();

  if (statusChanged) {
    await createAutomaticNotification({
      message: `La reclamación ${claim.claimNumber} cambió a ${CLAIM_STATUS_LABELS[claim.status]}.`,
      type: 'claim',
      recipientUser: claim.handledBy,
      client: claim.client,
      relatedEntityType: 'Claim',
      relatedEntityId: claim._id
    });
  }

  ApiResponse.success(res, { message: 'Estado de la reclamación actualizado correctamente', data: { claim } });
});

const remove = asyncHandler(async (req, res) => {
  const claim = await Claim.findById(req.params.id);
  if (!claim) throw ApiError.notFound('Reclamación no encontrada');

  await claim.deleteOne();

  ApiResponse.success(res, { message: 'Reclamación eliminada correctamente' });
});

module.exports = { list, getById, create, update, changeStatus, remove };
