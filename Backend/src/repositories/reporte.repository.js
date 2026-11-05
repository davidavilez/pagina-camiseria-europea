const { pool } = require('../config/db');

/**
 * Consumo de tela en una ventana de tiempo, agregado 100 % en PostgreSQL.
 * GROUPING SETS devuelve en una sola consulta tres niveles:
 *   'tela_color' -> (tipo_tela, color)
 *   'tela'       -> (tipo_tela)
 *   'color'      -> (color)
 * Parte de `rollos` (LEFT JOIN) para incluir también las telas sin cortes,
 * necesarias para detectar la "tela estancada".
 */
const consumoPorPeriodo = async ({ intervalo }, db = pool) => {
  const { rows } = await db.query(
    `WITH consumo AS (
       SELECT rollo_id,
              SUM(metros_cortados) AS metros,
              COUNT(*)             AS cortes
         FROM cortes
        WHERE fecha_corte >= NOW() - $1::interval
        GROUP BY rollo_id
     )
     SELECT CASE
              WHEN GROUPING(r.tipo_tela) = 0 AND GROUPING(r.color) = 0 THEN 'tela_color'
              WHEN GROUPING(r.tipo_tela) = 0 THEN 'tela'
              ELSE 'color'
            END                                AS nivel,
            r.tipo_tela,
            r.color,
            COALESCE(SUM(c.metros), 0)         AS metros_cortados,
            COALESCE(SUM(c.cortes), 0)::int    AS cortes,
            SUM(r.metraje_actual)              AS stock_actual,
            COUNT(*)::int                      AS rollos
       FROM rollos r
       LEFT JOIN consumo c ON c.rollo_id = r.id
      GROUP BY GROUPING SETS ((r.tipo_tela, r.color), (r.tipo_tela), (r.color))
      ORDER BY metros_cortados DESC, stock_actual DESC`,
    [intervalo]
  );
  return rows;
};

module.exports = { consumoPorPeriodo };
