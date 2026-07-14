const mongoose = require('mongoose');
const env = require('./env');

async function connectDatabase() {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    console.log('[database] MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[database] MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[database] MongoDB disconnected');
  });

  await mongoose.connect(env.mongoUri);
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase };
