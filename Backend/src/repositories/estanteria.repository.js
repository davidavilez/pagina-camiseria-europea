const { pool } = require('../config/db');

const COLUMNAS = 'id, codigo, descripcion';

const listar = async (db = pool) => {
  const { rows } = await db.query(`SELECT ${COLUMNAS} FROM estanterias ORDER BY codigo`);
  return rows;
};

const buscarPorId = async (id, db = pool) => {
  const { rows } = await db.query(`SELECT ${COLUMNAS} FROM estanterias WHERE id = $1`, [id]);
  return rows[0] ?? null;
};

const crear = async ({ codigo, descripcion }, db = pool) => {
  const { rows } = await db.query(
    `INSERT INTO estanterias (codigo, descripcion) VALUES ($1, $2) RETURNING ${COLUMNAS}`,
    [codigo, descripcion]
  );
  return rows[0];
};

module.exports = { listar, buscarPorId, crear };
