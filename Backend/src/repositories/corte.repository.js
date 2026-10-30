const { pool } = require('../config/db');

const crear = async ({ rolloId, operarioId, metrosCortados }, db = pool) => {
  const { rows } = await db.query(
    `INSERT INTO cortes (rollo_id, operario_id, metros_cortados)
     VALUES ($1, $2, $3)
     RETURNING id, rollo_id, operario_id, metros_cortados, fecha_corte`,
    [rolloId, operarioId, metrosCortados]
  );
  return rows[0];
};

/**
 * Historial de cortes (cortes ⋈ rollos ⋈ usuarios).
 * El saldo restante tras cada corte se reconstruye con una suma acumulada
 * por rollo, así el historial es exacto aunque el rollo haya seguido cortándose.
 */
const listarAuditoria = async ({ limite }, db = pool) => {
  const { rows } = await db.query(
    `SELECT *
       FROM (
         SELECT c.id,
                c.fecha_corte,
                r.id               AS rollo_id,
                r.codigo_sku,
                r.tipo_tela,
                r.color,
                c.metros_cortados,
                r.metraje_inicial - SUM(c.metros_cortados) OVER (
                  PARTITION BY c.rollo_id
                  ORDER BY c.fecha_corte, c.id
                ) AS saldo_restante,
                u.id               AS operario_id,
                u.nombre           AS operario_nombre
           FROM cortes c
           JOIN rollos   r ON r.id = c.rollo_id
           JOIN usuarios u ON u.id = c.operario_id
       ) historial
      ORDER BY fecha_corte DESC, id DESC
      LIMIT $1`,
    [limite]
  );
  return rows;
};

// Los días del calendario de gerencia se cuentan en hora de Colombia.
const ZONA_HORARIA = 'America/Bogota';

/** Cortes de un día (YYYY-MM-DD en hora de Colombia), del más temprano al más tarde. */
const listarPorDia = async ({ fecha }, db = pool) => {
  const { rows } = await db.query(
    `SELECT c.id,
            c.fecha_corte,
            to_char(c.fecha_corte AT TIME ZONE $2, 'HH24:MI') AS hora,
            u.id               AS operario_id,
            u.nombre           AS operario_nombre,
            r.id               AS rollo_id,
            r.codigo_sku,
            r.tipo_tela,
            r.color,
            c.metros_cortados
       FROM cortes c
       JOIN rollos   r ON r.id = c.rollo_id
       JOIN usuarios u ON u.id = c.operario_id
      WHERE (c.fecha_corte AT TIME ZONE $2)::date = $1::date
      ORDER BY c.fecha_corte ASC, c.id ASC`,
    [fecha, ZONA_HORARIA]
  );
  return rows;
};

module.exports = { crear, listarAuditoria, listarPorDia };
