const { Pool, types } = require('pg');
const { db } = require('./env');

// NUMERIC (OID 1700) llega como string por defecto; los metrajes tienen
// 2 decimales, así que convertirlos a Number es seguro.
types.setTypeParser(1700, (valor) => Number.parseFloat(valor));

const pool = new Pool(db);

/**
 * Ejecuta `trabajo(client)` dentro de una transacción.
 * Hace COMMIT si termina bien y ROLLBACK ante cualquier error.
 */
const withTransaction = async (trabajo) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await trabajo(client);
    await client.query('COMMIT');
    return resultado;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const verificarConexion = () => pool.query('SELECT 1');

module.exports = { pool, withTransaction, verificarConexion };
