require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:4200',
  defaultAdmin: {
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@insuretech.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123*',
    name: process.env.DEFAULT_ADMIN_NAME || 'Administrador InsureTech'
  },
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test'
};
