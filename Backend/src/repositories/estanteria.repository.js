const { pool } = require('../config/db');

const COLUMNAS = 'id, codigo, descripcion, capacidad';

// DECISIÓN DE NEGOCIO (único lugar): todo rollo asignado ocupa un lugar en la
// estantería, incluidos los de metraje 0, porque el rollo agotado sigue ahí hasta
// que alguien lo retira. Para no contarlos, cambiar por 'r.metraje_actual > 0'.
const ROLLO_OCUPA_LUGAR = 'TRUE';

const listar = async (db = pool) => {
  const { rows } = await db.query(
    `SELECT e.id, e.codigo, e.descripcion, e.capacidad,
            COUNT(r.id)::int                            AS ocupacion,
            GREATEST(e.capacidad - COUNT(r.id), 0)::int AS disponibles
       FROM estanterias e
       LEFT JOIN rollos r ON r.estanteria_id = e.id AND ${ROLLO_OCUPA_LUGAR}
      GROUP BY e.id
      ORDER BY e.codigo`
  );
  return rows;
};

/**
 * Lee la estantería y bloquea su fila hasta el fin de la transacción, para que
 * dos peticiones que ocupan un lugar en ella se ejecuten en serie.
 * Debe llamarse con un `client` dentro de `withTransaction`.
 */
const buscarPorIdParaActualizar = async (id, client) => {
  const { rows } = await client.query(`SELECT ${COLUMNAS} FROM estanterias WHERE id = $1 FOR UPDATE`, [id]);
  return rows[0] ?? null;
};

const contarOcupacion = async (id, db = pool) => {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS ocupacion FROM rollos r WHERE r.estanteria_id = $1 AND ${ROLLO_OCUPA_LUGAR}`,
    [id]
  );
  return rows[0].ocupacion;
};

const crear = async ({ codigo, descripcion }, db = pool) => {
  const { rows } = await db.query(
    `INSERT INTO estanterias (codigo, descripcion) VALUES ($1, $2)
     RETURNING ${COLUMNAS}, 0 AS ocupacion, capacidad AS disponibles`,
    [codigo, descripcion]
  );
  return rows[0];
};

module.exports = { listar, buscarPorIdParaActualizar, contarOcupacion, crear };
