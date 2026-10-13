const { pool } = require('../config/db');

const crearUsuario = async (nombre, email, passwordHash, rol) => {
  const result = await pool.query(
    'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol',
    [nombre, email, passwordHash, rol]
  );
  return result.rows[0];
};

const buscarUsuarioPorEmail = async (email) => {
  const result = await pool.query(
    'SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE email = $1',
    [email]
  );
  return result.rows[0];
};

module.exports = { crearUsuario, buscarUsuarioPorEmail };