const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function normalizeError(err) {
  if (err instanceof ApiError) return err;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new ApiError(400, 'Error de validación', 'VALIDATION_ERROR', errors);
  }

  // Mongoose invalid ObjectId / cast error
  if (err.name === 'CastError') {
    return new ApiError(400, `Identificador inválido: ${err.value}`, 'INVALID_ID');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'campo';
    const value = err.keyValue ? err.keyValue[field] : '';
    return new ApiError(409, `Ya existe un registro con ${field}: ${value}`, 'DUPLICATE_KEY');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiError.unauthorized('Token inválido', 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Token expirado', 'TOKEN_EXPIRED');
  }

  return new ApiError(500, env.isProduction ? 'Error interno del servidor' : err.message, 'INTERNAL_ERROR');
}

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  const apiError = normalizeError(err);

  if (apiError.statusCode >= 500) {
    console.error('[error]', err);
  }

  const payload = {
    success: false,
    message: apiError.message,
    code: apiError.code
  };

  if (apiError.errors && apiError.errors.length > 0) {
    payload.errors = apiError.errors;
  }

  if (!env.isProduction && apiError.statusCode >= 500) {
    payload.stack = err.stack;
  }

  res.status(apiError.statusCode).json(payload);
}

module.exports = errorMiddleware;
