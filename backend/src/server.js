const app = require('./app');
const env = require('./config/env');
const { connectDatabase } = require('./config/database');
const { ensureDefaultAdmin } = require('./seeds/defaultAdmin.seed');

async function start() {
  await connectDatabase();
  await ensureDefaultAdmin();

  app.listen(env.port, () => {
    console.log(`[server] InsureTech API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
