function success(res, { statusCode = 200, message = 'Operación completada', data = null } = {}) {
  return res.status(statusCode).json({ success: true, message, data });
}

function list(res, { data = [], page = 1, limit = 10, total = 0 } = {}) {
  return res.status(200).json({
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      pages: limit > 0 ? Math.ceil(total / limit) : 0
    }
  });
}

module.exports = { success, list };
