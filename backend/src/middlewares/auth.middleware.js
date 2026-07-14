const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const authMiddleware = asyncHandler(async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Token no proporcionado', 'NO_TOKEN');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token expirado', 'TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Token inválido', 'INVALID_TOKEN');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw ApiError.unauthorized('Usuario no encontrado', 'USER_NOT_FOUND');
  }
  if (user.status !== 'active') {
    throw ApiError.unauthorized('Cuenta inactiva', 'INACTIVE_ACCOUNT');
  }

  req.user = user;
  next();
});

module.exports = authMiddleware;
