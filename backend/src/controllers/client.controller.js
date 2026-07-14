const Client = require('../models/Client');
const Policy = require('../models/Policy');
const Payment = require('../models/Payment');
const Incident = require('../models/Incident');
const Claim = require('../models/Claim');
const Notification = require('../models/Notification');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, getSort, escapeRegex } = require('../utils/pagination');

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

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query);
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.assignedAgent) filter.assignedAgent = req.query.assignedAgent;
  if (req.query.q) {
    const regex = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: regex }, { identification: regex }, { email: regex }, { phone: regex }];
  }

  const [clients, total] = await Promise.all([
    Client.find(filter).sort(sort).skip(skip).limit(limit).populate('assignedAgent', 'name email').populate('createdBy', 'name email'),
    Client.countDocuments(filter)
  ]);

  ApiResponse.list(res, { data: clients, page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id).populate('assignedAgent', 'name email').populate('createdBy', 'name email');
  if (!client) throw ApiError.notFound('Cliente no encontrado');
  ApiResponse.success(res, { data: { client } });
});

const getHistory = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id).populate('assignedAgent', 'name email');
  if (!client) throw ApiError.notFound('Cliente no encontrado');

  const [policies, payments, incidents, claims, notifications] = await Promise.all([
    Policy.find({ client: client._id }).sort('-createdAt'),
    Payment.find({ client: client._id }).sort('-createdAt'),
    Incident.find({ client: client._id }).sort('-createdAt'),
    Claim.find({ client: client._id }).sort('-createdAt'),
    Notification.find({ client: client._id }).sort('-date')
  ]);

  const totals = {
    policies: policies.length,
    activePolicies: policies.filter((p) => p.status === 'active').length,
    totalPaid: payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    openIncidents: incidents.filter((i) => i.status !== 'closed').length,
    pendingClaims: claims.filter((c) => ['received', 'under_analysis'].includes(c.status)).length
  };

  ApiResponse.success(res, {
    data: { client, policies, payments, incidents, claims, notifications, totals }
  });
});

const create = asyncHandler(async (req, res) => {
  const { name, identification, phone, email, address, status, notes } = req.body;

  const existing = await Client.findOne({ identification });
  if (existing) throw ApiError.conflict('Ya existe un cliente con esta identificación', 'IDENTIFICATION_TAKEN');

  const assignedAgent = await resolveAssignedAgent(req.body.assignedAgent, req.user);

  const client = await Client.create({
    name,
    identification,
    phone,
    email,
    address,
    status: status || 'active',
    assignedAgent,
    notes,
    createdBy: req.user._id
  });

  ApiResponse.success(res, { statusCode: 201, message: 'Cliente creado correctamente', data: { client } });
});

const update = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) throw ApiError.notFound('Cliente no encontrado');

  const { name, identification, phone, email, address, status, notes } = req.body;

  if (identification && identification !== client.identification) {
    const existing = await Client.findOne({ identification, _id: { $ne: client._id } });
    if (existing) throw ApiError.conflict('Ya existe un cliente con esta identificación', 'IDENTIFICATION_TAKEN');
    client.identification = identification;
  }

  if (req.body.assignedAgent !== undefined) {
    client.assignedAgent = await resolveAssignedAgent(req.body.assignedAgent, req.user);
  }

  if (name) client.name = name;
  if (phone) client.phone = phone;
  if (email) client.email = email;
  if (address) client.address = address;
  if (status) client.status = status;
  if (notes !== undefined) client.notes = notes;

  await client.save();

  ApiResponse.success(res, { message: 'Cliente actualizado correctamente', data: { client } });
});

const remove = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) throw ApiError.notFound('Cliente no encontrado');

  const hasPolicies = await Policy.exists({ client: client._id });
  if (hasPolicies) {
    throw ApiError.conflict('No se puede eliminar el cliente porque posee pólizas asociadas', 'CLIENT_HAS_POLICIES');
  }

  await client.deleteOne();

  ApiResponse.success(res, { message: 'Cliente eliminado correctamente' });
});

module.exports = { list, getById, getHistory, create, update, remove };
