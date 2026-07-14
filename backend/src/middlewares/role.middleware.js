const ApiError = require('../utils/ApiError');

function requireRole(...allowedRoles) {
  return function roleMiddleware(req, res, next) {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('No posee permisos para esta acción', 'INSUFFICIENT_ROLE'));
    }
    next();
  };
}

module.exports = requireRole;
