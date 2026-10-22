const { pool } = require('../config/db');

const COLUMNAS_PUBLICAS = 'id, nombre, email, rol, estado, fecha_creacion';

const buscarPorEmail = async (email, db = pool) => {
  const { rows } = await db.query(
    `SELECT ${COLUMNAS_PUBLICAS}, password_hash FROM usuarios WHERE email = $1`,
    [email]
  );
  return rows[0] ?? null;
};

const buscarPorId = async (id, db = pool) => {
  const { rows } = await db.query(
    `SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
};

const listar = async (db = pool) => {
  const { rows } = await db.query(
    `SELECT ${COLUMNAS_PUBLICAS} FROM usuarios ORDER BY fecha_creacion DESC, id DESC`
  );
  return rows;
};

const crear = async ({ nombre, email, passwordHash, rol }, db = pool) => {
  const { rows } = await db.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNAS_PUBLICAS}`,
    [nombre, email, passwordHash, rol]
  );
  return rows[0];
};

module.exports = { buscarPorEmail, buscarPorId, listar, crear };
