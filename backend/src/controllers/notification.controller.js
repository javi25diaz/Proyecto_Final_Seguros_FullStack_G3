const Notification = require('../models/Notification');
const Client = require('../models/Client');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, getSort, escapeRegex } = require('../utils/pagination');

async function scopeToAgent(req) {
  if (req.user.role === 'admin') return null;
  const assignedClientIds = await Client.find({ assignedAgent: req.user._id }).distinct('_id');
  return { $or: [{ recipientUser: req.user._id }, { client: { $in: assignedClientIds } }] };
}

async function canAccess(notification, req) {
  if (req.user.role === 'admin') return true;
  if (notification.recipientUser && String(notification.recipientUser) === String(req.user._id)) return true;
  if (notification.client) {
    const client = await Client.findById(notification.client);
    if (client && String(client.assignedAgent) === String(req.user._id)) return true;
  }
  return false;
}

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query, '-date');
  const filter = {};

  if (req.query.type) filter.type = req.query.type;
  if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === 'true';
  if (req.query.client) filter.client = req.query.client;
  if (req.query.recipientUser) filter.recipientUser = req.query.recipientUser;
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }
  if (req.query.q) {
    filter.message = new RegExp(escapeRegex(req.query.q), 'i');
  }

  const scope = await scopeToAgent(req);
  const finalFilter = scope ? { $and: [filter, scope] } : filter;

  const [notifications, total] = await Promise.all([
    Notification.find(finalFilter).sort(sort).skip(skip).limit(limit)
      .populate('recipientUser', 'name email')
      .populate('client', 'name identification')
      .populate('createdBy', 'name email'),
    Notification.countDocuments(finalFilter)
  ]);

  ApiResponse.list(res, { data: notifications, page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id)
    .populate('recipientUser', 'name email')
    .populate('client', 'name identification')
    .populate('createdBy', 'name email');
  if (!notification) throw ApiError.notFound('Notificación no encontrada');

  if (!(await canAccess(notification, req))) {
    throw ApiError.forbidden('No posee permisos para consultar esta notificación');
  }

  ApiResponse.success(res, { data: { notification } });
});

const create = asyncHandler(async (req, res) => {
  const { message, type, recipientUser, client, relatedEntityType, relatedEntityId } = req.body;

  const notification = await Notification.create({
    message,
    type,
    recipientUser,
    client,
    relatedEntityType,
    relatedEntityId,
    isAutomatic: false,
    createdBy: req.user._id
  });

  ApiResponse.success(res, { statusCode: 201, message: 'Notificación creada correctamente', data: { notification } });
});

const update = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw ApiError.notFound('Notificación no encontrada');

  if (req.user.role !== 'admin') {
    throw ApiError.forbidden('Solo un administrador puede editar el mensaje o estado de una notificación');
  }

  const { message, isRead } = req.body;
  if (message) notification.message = message;
  if (isRead !== undefined) notification.isRead = isRead;

  await notification.save();

  ApiResponse.success(res, { message: 'Notificación actualizada correctamente', data: { notification } });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw ApiError.notFound('Notificación no encontrada');

  if (!(await canAccess(notification, req))) {
    throw ApiError.forbidden('No posee permisos para modificar esta notificación');
  }

  notification.isRead = true;
  await notification.save();

  ApiResponse.success(res, { message: 'Notificación marcada como leída', data: { notification } });
});

const remove = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw ApiError.notFound('Notificación no encontrada');

  if (!(await canAccess(notification, req))) {
    throw ApiError.forbidden('No posee permisos para eliminar esta notificación');
  }

  await notification.deleteOne();

  ApiResponse.success(res, { message: 'Notificación eliminada correctamente' });
});

module.exports = { list, getById, create, update, markAsRead, remove };
