const { pool } = require('../config/db');

const obtenerTodosLosRollos = async () => {
  const result = await pool.query('SELECT * FROM rollos ORDER BY fecha_ingreso DESC');
  return result.rows;
};

const buscarRolloPorQr = async (codigo_qr) => {
  const result = await pool.query(
    'SELECT id, metraje_actual FROM rollos WHERE codigo_qr = $1', 
    [codigo_qr]
  );
  return result.rows[0];
};

const registrarCorte = async (rolloId, nuevoMetraje, cantidad, operarioEmail) => {
  // Se ejecutan ambas consultas para actualizar el saldo y dejar el historial
  await pool.query('UPDATE rollos SET metraje_actual = $1 WHERE id = $2', [nuevoMetraje, rolloId]);
  await pool.query(
    'INSERT INTO cortes (rollo_id, metros_cortados, operario_id) VALUES ($1, $2, $3)', 
    [rolloId, cantidad, operarioEmail]
  );
};

module.exports = { obtenerTodosLosRollos, buscarRolloPorQr, registrarCorte };