const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, getSort, escapeRegex } = require('../utils/pagination');
const { getUserLifecycleDependencies, reassignUserResponsibilities } = require('../services/user.lifecycle.service');

async function countAdmins(excludeId = null, { activeOnly = false } = {}) {
  const filter = { role: 'admin' };
  if (activeOnly) filter.status = 'active';
  if (excludeId) filter._id = { $ne: excludeId };
  return User.countDocuments(filter);
}

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query);
  const filter = {};

  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const regex = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  ApiResponse.list(res, { data: users.map((u) => u.toSafeObject()), page, limit, total });
});

const getById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Usuario no encontrado');
  ApiResponse.success(res, { data: { user: user.toSafeObject() } });
});

const create = asyncHandler(async (req, res) => {
  const { name, email, password, role, status } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('Ya existe un usuario con este email', 'EMAIL_TAKEN');

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'guest',
    status: status || 'active'
  });

  ApiResponse.success(res, { statusCode: 201, message: 'Usuario creado correctamente', data: { user: user.toSafeObject() } });
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, status } = req.body;

  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('Usuario no encontrado');

  if (email && email !== user.email) {
    const existing = await User.findOne({ email, _id: { $ne: id } });
    if (existing) throw ApiError.conflict('Ya existe un usuario con este email', 'EMAIL_TAKEN');
    user.email = email;
  }

  if (name) user.name = name;
  if (password) user.password = password;

  if (role && role !== user.role) {
    if (user.role === 'admin' && role !== 'admin') {
      const remainingAdmins = await countAdmins(user._id);
      if (remainingAdmins < 1) {
        throw ApiError.conflict('No se puede cambiar el rol del último administrador del sistema', 'LAST_ADMIN');
      }
    }
    user.role = role;
  }

  if (status && status !== user.status) {
    if (status === 'inactive' && user.role === 'admin') {
      const remainingAdmins = await countAdmins(user._id, { activeOnly: true });
      if (remainingAdmins < 1) {
        throw ApiError.conflict('No se puede desactivar al último administrador activo', 'LAST_ADMIN');
      }
    }
    user.status = status;
  }

  await user.save();

  ApiResponse.success(res, { message: 'Usuario actualizado correctamente', data: { user: user.toSafeObject() } });
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('Usuario no encontrado');

  if (String(req.user._id) === String(user._id)) {
    throw ApiError.conflict('No puede eliminar su propia cuenta', 'SELF_DELETE');
  }

  if (user.role === 'admin') {
    const remainingAdmins = await countAdmins(user._id);
    if (remainingAdmins < 1) {
      throw ApiError.conflict('No se puede eliminar al último administrador del sistema', 'LAST_ADMIN');
    }
  }

  const dependencies = await getUserLifecycleDependencies(user._id);
  if (dependencies.totalDependencies > 0) {
    throw ApiError.conflict(
      'No se puede eliminar el usuario porque mantiene registros relacionados. Reasigne sus responsabilidades o desactive la cuenta.',
      'USER_HAS_DEPENDENCIES'
    );
  }

  await user.deleteOne();

  ApiResponse.success(res, { message: 'Usuario eliminado correctamente' });
});

const getDependencies = asyncHandler(async (req, res) => {
  const dependencies = await getUserLifecycleDependencies(req.params.id);
  ApiResponse.success(res, { data: dependencies });
});

const reassignResponsibilities = asyncHandler(async (req, res) => {
  const result = await reassignUserResponsibilities(req.params.id, req.body.replacementUserId);
  ApiResponse.success(res, { message: 'Responsabilidades reasignadas correctamente', data: result });
});

module.exports = { list, getById, create, update, remove, getDependencies, reassignResponsibilities };
