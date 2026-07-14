const User = require('../models/User');
const env = require('../config/env');

async function ensureDefaultAdmin() {
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) return;

  await User.create({
    name: env.defaultAdmin.name,
    email: env.defaultAdmin.email,
    password: env.defaultAdmin.password,
    role: 'admin',
    status: 'active'
  });

  console.log(`[seed] Default admin created: ${env.defaultAdmin.email}`);
}

module.exports = { ensureDefaultAdmin };
