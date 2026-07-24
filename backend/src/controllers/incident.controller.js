const Incident = require('../models/Incident');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, getSort, escapeRegex } = require('../utils/pagination');
const { generateBusinessId } = require('../services/sequence.service');
const { createAutomaticNotification } = require('../services/notification.service');

function assertEventDateWithinCoverage(eventDate, policy) {
  const event = new Date(eventDate);
  if (event < policy.startDate || event > policy.endDate) {
    throw ApiError.badRequest('La fecha del siniestro debe estar dentro de la vigencia de la póliza', 'EVENT_OUTSIDE_COVERAGE');
  }
}

function assertValidIncidentTransition(currentStatus, nextStatus) {
  const allowedTransitions = {
    reported: ['under_review'],
    under_review: ['closed'],
    closed: []
  };

  if (currentStatus === nextStatus) return;
  if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
    throw ApiError.conflict('No es posible realizar esta transición de estado del siniestro', 'INVALID_INCIDENT_TRANSITION');
  }
}

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query);
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.client) filter.client = req.query.client;
  if (req.query.policy) filter.policy = req.query.policy;
  if (req.query.from || req.query.to) {
    filter.eventDate = {};
    if (req.query.from) filter.eventDate.$gte = new Date(req.query.from);
    if (req.query.to) filter.eventDate.$lte = new Date(req.query.to);
  }
  if (req.query.q) {
    const regex = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ incidentNumber: regex }, { description: regex }];
  }

  const [incidents, total] = await Promise.all([
    Incident.find(filter).sort(sort).skip(skip).limit(limit)
      .populate('client', 'name identification')
      .populate('policy', 'policyNumber'),
    Incident.countDocuments(filter)
  ]);

  ApiResponse.list(res, { data: incidents, page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id)
    .populate('client', 'name identification')
    .populate('policy', 'policyNumber');
  if (!incident) throw ApiError.notFound('Siniestro no encontrado');
  ApiResponse.success(res, { data: { incident } });
});

const create = asyncHandler(async (req, res) => {
  const { policy: policyId, description, eventDate, evidenceUrl, status } = req.body;

  const policy = await Policy.findById(policyId);
  if (!policy) throw ApiError.badRequest('La póliza indicada no existe', 'POLICY_NOT_FOUND');
  if (policy.status === 'cancelled') {
    throw ApiError.badRequest('No se puede registrar un siniestro sobre una póliza cancelada', 'POLICY_CANCELLED');
  }

  assertEventDateWithinCoverage(eventDate, policy);

  const incidentNumber = await generateBusinessId('INC');

  const incident = await Incident.create({
    incidentNumber,
    client: policy.client,
    policy: policy._id,
    description,
    eventDate,
    evidenceUrl,
    status: status || 'reported',
    reportedBy: req.user._id
  });

  await createAutomaticNotification({
    message: `Se reportó el siniestro ${incident.incidentNumber}.`,
    type: 'incident',
    recipientUser: policy.assignedAgent,
    client: policy.client,
    relatedEntityType: 'Incident',
    relatedEntityId: incident._id
  });

  ApiResponse.success(res, { statusCode: 201, message: 'Siniestro registrado correctamente', data: { incident } });
});

const update = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);
  if (!incident) throw ApiError.notFound('Siniestro no encontrado');

  const { description, eventDate, evidenceUrl, status } = req.body;

  if (eventDate) {
    const policy = await Policy.findById(incident.policy);
    assertEventDateWithinCoverage(eventDate, policy);
    incident.eventDate = eventDate;
  }

  if (description) incident.description = description;
  if (evidenceUrl !== undefined) incident.evidenceUrl = evidenceUrl;

  const statusChanged = status && status !== incident.status;
  if (statusChanged) {
    assertValidIncidentTransition(incident.status, status);
    incident.status = status;
  }

  await incident.save();

  if (statusChanged) {
    await createAutomaticNotification({
      message: `El siniestro ${incident.incidentNumber} cambió de estado a ${status}.`,
      type: 'incident',
      recipientUser: incident.reportedBy,
      client: incident.client,
      relatedEntityType: 'Incident',
      relatedEntityId: incident._id
    });
  }

  ApiResponse.success(res, { message: 'Siniestro actualizado correctamente', data: { incident } });
});

const changeStatus = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);
  if (!incident) throw ApiError.notFound('Siniestro no encontrado');

  const { status } = req.body;
  const statusChanged = status !== incident.status;

  if (statusChanged) {
    assertValidIncidentTransition(incident.status, status);
    incident.status = status;
  }

  await incident.save();

  if (statusChanged) {
    await createAutomaticNotification({
      message: `El siniestro ${incident.incidentNumber} cambió de estado a ${status}.`,
      type: 'incident',
      recipientUser: incident.reportedBy,
      client: incident.client,
      relatedEntityType: 'Incident',
      relatedEntityId: incident._id
    });
  }

  ApiResponse.success(res, { message: 'Estado del siniestro actualizado correctamente', data: { incident } });
});

const remove = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);
  if (!incident) throw ApiError.notFound('Siniestro no encontrado');

  const hasClaims = await Claim.exists({ incident: incident._id });
  if (hasClaims) {
    throw ApiError.conflict('No se puede eliminar el siniestro porque posee reclamaciones asociadas', 'INCIDENT_HAS_CLAIMS');
  }

  await incident.deleteOne();

  ApiResponse.success(res, { message: 'Siniestro eliminado correctamente' });
});

module.exports = { list, getById, create, update, changeStatus, remove };
