// Ejecuta database/init.sql contra la BD configurada en .env  ->  npm run db:init
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

const sql = fs.readFileSync(path.join(__dirname, '../database/init.sql'), 'utf8');

pool.query(sql)
  .then(() => console.log('Base de datos inicializada correctamente.'))
  .catch((error) => {
    console.error('Error al inicializar la base de datos:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
