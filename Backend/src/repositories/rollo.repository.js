const { pool } = require('../config/db');

const COLUMNAS = 'id, codigo_sku, tipo_tela, color, metraje_inicial, metraje_actual, fecha_ingreso';

const listar = async (db = pool) => {
  const { rows } = await db.query(
    `SELECT ${COLUMNAS} FROM rollos ORDER BY fecha_ingreso DESC, id DESC`
  );
  return rows;
};

const buscarPorId = async (id, db = pool) => {
  const { rows } = await db.query(`SELECT ${COLUMNAS} FROM rollos WHERE id = $1`, [id]);
  return rows[0] ?? null;
};

/**
 * Lee el rollo y bloquea su fila hasta el fin de la transacción, para que
 * dos cortes simultáneos sobre el mismo rollo se ejecuten en serie.
 * Debe llamarse con un `client` dentro de `withTransaction`.
 */
const buscarPorIdParaActualizar = async (id, client) => {
  const { rows } = await client.query(
    `SELECT ${COLUMNAS} FROM rollos WHERE id = $1 FOR UPDATE`,
    [id]
  );
  return rows[0] ?? null;
};

const crear = async ({ codigoSku, tipoTela, color, metrajeInicial }, db = pool) => {
  const { rows } = await db.query(
    `INSERT INTO rollos (codigo_sku, tipo_tela, color, metraje_inicial, metraje_actual)
     VALUES ($1, $2, $3, $4, $4)
     RETURNING ${COLUMNAS}`,
    [codigoSku, tipoTela, color, metrajeInicial]
  );
  return rows[0];
};

const descontarMetraje = async (id, metros, client) => {
  const { rows } = await client.query(
    `UPDATE rollos
        SET metraje_actual = metraje_actual - $2
      WHERE id = $1
      RETURNING ${COLUMNAS}`,
    [id, metros]
  );
  return rows[0];
};

module.exports = { listar, buscarPorId, buscarPorIdParaActualizar, crear, descontarMetraje };
