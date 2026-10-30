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
  // URL pública del backend: con ella se arman los enlaces de aprobación.
  apiUrl: (process.env.API_URL || `http://localhost:${Number(process.env.PORT) || 3000}`).replace(/\/$/, ''),
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    user: process.env.SMTP_USER,
    // Gmail muestra la contraseña de aplicación con espacios; se eliminan.
    pass: process.env.SMTP_PASS?.replace(/\s+/g, ''),
  },
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL,
  // Destinatario de las alertas de stock crítico (por defecto, el Súper Administrador).
  alertasStockEmail: process.env.ALERTAS_STOCK_EMAIL || process.env.SUPER_ADMIN_EMAIL,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
};
