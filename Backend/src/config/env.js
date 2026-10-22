const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), quiet: true });

if (!process.env.JWT_SECRET) {
  throw new Error('Falta JWT_SECRET en Backend/.env (ver .env.example).');
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
};
