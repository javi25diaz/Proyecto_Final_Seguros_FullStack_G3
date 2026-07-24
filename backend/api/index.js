const app = require('../src/app');
const { connectDatabase } = require('../src/config/database');
const { ensureDefaultAdmin } = require('../src/seeds/defaultAdmin.seed');

let ready;

function ensureReady() {
  if (!ready) {
    ready = connectDatabase().then(ensureDefaultAdmin);
  }
  return ready;
}

module.exports = async (req, res) => {
  try {
    await ensureReady();
  } catch (err) {
    ready = undefined;
    console.error('[api] Startup failed:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Service unavailable' }));
    return;
  }

  app(req, res);
};
