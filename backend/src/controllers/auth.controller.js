const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/jwt');
const env = require('../config/env');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('Ya existe una cuenta con este email', 'EMAIL_TAKEN');
  }

  // Public registration always creates a guest account, regardless of any role field sent by the client.
  const user = await User.create({ name, email, password, role: 'guest', status: 'active' });

  ApiResponse.success(res, {
    statusCode: 201,
    message: 'Cuenta creada correctamente. Ahora puede iniciar sesión.',
    data: { user: user.toSafeObject() }
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  const genericError = () => ApiError.unauthorized('Credenciales inválidas', 'INVALID_CREDENTIALS');

  if (!user) throw genericError();

  const matches = await user.comparePassword(password);
  if (!matches) throw genericError();

  if (user.status !== 'active') {
    throw ApiError.unauthorized('La cuenta se encuentra inactiva', 'INACTIVE_ACCOUNT');
  }

  const token = signToken(user);

  ApiResponse.success(res, {
    message: 'Inicio de sesión exitoso',
    data: {
      token,
      expiresIn: env.jwtExpiresIn,
      user: user.toSafeObject()
    }
  });
});

const me = asyncHandler(async (req, res) => {
  ApiResponse.success(res, { data: { user: req.user.toSafeObject() } });
});

module.exports = { register, login, me };
