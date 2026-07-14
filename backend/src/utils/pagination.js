const MAX_LIMIT = 100;

function getPagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = 10;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function getSort(query, defaultSort = '-createdAt') {
  const sortParam = typeof query.sort === 'string' && query.sort.trim() ? query.sort.trim() : defaultSort;
  const fields = sortParam.split(',').map((field) => field.trim()).filter(Boolean);

  const sort = {};
  for (const field of fields) {
    if (field.startsWith('-')) {
      sort[field.slice(1)] = -1;
    } else {
      sort[field] = 1;
    }
  }
  return sort;
}

// Escapes user input before it is used inside a RegExp to prevent ReDoS / regex injection.
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { getPagination, getSort, escapeRegex, MAX_LIMIT };
