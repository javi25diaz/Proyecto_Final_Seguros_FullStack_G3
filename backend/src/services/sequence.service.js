const Counter = require('../models/Counter');

// Generates unique, human-readable business identifiers such as POL-2026-000001.
// Uses an atomic $inc on a per-prefix-per-year counter document to avoid collisions
// under concurrent requests, without relying on the frontend.
async function generateBusinessId(prefix) {
  const year = new Date().getFullYear();
  const counterId = `${prefix}-${year}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const sequence = String(counter.seq).padStart(6, '0');
  return `${prefix}-${year}-${sequence}`;
}

module.exports = { generateBusinessId };
