const { Pool } = require('pg');

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'inventario_telas',
  password: 'password123',
  port: 5432,
});

const iniciarBaseDeDatos = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      email VARCHAR(254) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      rol VARCHAR(20) NOT NULL CHECK (rol IN ('operario', 'gerencia')),
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

module.exports = { pool, iniciarBaseDeDatos };