const { pool } = require('../config/db');

const COLUMNAS = `id, codigo_sku, tipo_tela, color, metraje_inicial, metraje_actual,
  stock_minimo, alerta_enviada, fecha_ingreso`;

/** Escapa los comodines de LIKE para que el texto del usuario se busque literal. */
const escaparLike = (texto) => texto.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Condición del texto libre según el campo elegido ('codigo', 'tela' o todos). */
const condicionBusqueda = (search, buscarPor, valores) => {
  valores.push(`%${escaparLike(search)}%`);
  const p = `$${valores.length}`;

  if (buscarPor === 'tela') {
    return `tipo_tela ILIKE ${p}`;
  }
  if (buscarPor === 'codigo') {
    // "12" o "#12" busca el ID exacto; el SKU admite coincidencia parcial.
    const id = /^#?\d{1,9}$/.test(search) ? Number(search.replace('#', '')) : null;
    if (id === null) return `codigo_sku ILIKE ${p}`;
    valores.push(id);
    return `(codigo_sku ILIKE ${p} OR id = $${valores.length})`;
  }
  return `(codigo_sku ILIKE ${p} OR tipo_tela ILIKE ${p} OR color ILIKE ${p} OR id::text ILIKE ${p})`;
};

/**
 * Filtros acumulativos. Cada filtro solo se agrega al WHERE si viene
 * informado; los valores siempre viajan como parámetros ($n).
 */
const construirWhere = ({ search, buscarPor, color, tipoTela } = {}) => {
  const condiciones = [];
  const valores = [];

  if (search) {
    condiciones.push(condicionBusqueda(search, buscarPor, valores));
  }
  if (color) {
    valores.push(color);
    condiciones.push(`lower(color) = lower($${valores.length})`);
  }
  if (tipoTela) {
    valores.push(tipoTela);
    condiciones.push(`lower(tipo_tela) = lower($${valores.length})`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  return { where, valores };
};

const listar = async (filtros, db = pool) => {
  const { where, valores } = construirWhere(filtros);
  const { rows } = await db.query(
    `SELECT ${COLUMNAS} FROM rollos ${where} ORDER BY fecha_ingreso DESC, id DESC`,
    valores
  );
  return rows;
};

/**
 * Existencias agrupadas por tela y color (mismos filtros que `listar`).
 * Solo los rollos con saldo cuentan como disponibles; los agotados se informan aparte.
 */
const resumirPorTelaYColor = async (filtros, db = pool) => {
  const { where, valores } = construirWhere(filtros);
  const { rows } = await db.query(
    `SELECT lower(tipo_tela)                                  AS clave_tela,
            min(tipo_tela)                                    AS tipo_tela,
            min(color)                                        AS color,
            COUNT(*) FILTER (WHERE metraje_actual > 0)::int   AS rollos,
            COUNT(*) FILTER (WHERE metraje_actual <= 0)::int  AS agotados,
            COALESCE(SUM(metraje_actual), 0)                  AS metros
       FROM rollos ${where}
      GROUP BY lower(tipo_tela), lower(color)
      ORDER BY lower(tipo_tela), metros DESC, lower(color)`,
    valores
  );
  return rows;
};

/** Valores distintos presentes en bodega, para poblar los selectores de filtro. */
const listarOpcionesFiltro = async (db = pool) => {
  const { rows } = await db.query(
    `SELECT
       ARRAY(SELECT DISTINCT color     FROM rollos ORDER BY color)     AS colores,
       ARRAY(SELECT DISTINCT tipo_tela FROM rollos ORDER BY tipo_tela) AS tipos_tela`
  );
  return rows[0];
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

const crear = async ({ codigoSku, tipoTela, color, metrajeInicial, stockMinimo }, db = pool) => {
  const { rows } = await db.query(
    `INSERT INTO rollos (codigo_sku, tipo_tela, color, metraje_inicial, metraje_actual, stock_minimo)
     VALUES ($1, $2, $3, $4, $4, $5)
     RETURNING ${COLUMNAS}`,
    [codigoSku, tipoTela, color, metrajeInicial, stockMinimo]
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

const marcarAlertaEnviada = async (id, enviada, db = pool) => {
  const { rows } = await db.query(
    `UPDATE rollos SET alerta_enviada = $2 WHERE id = $1 RETURNING ${COLUMNAS}`,
    [id, enviada]
  );
  return rows[0] ?? null;
};

/**
 * Reabastece el rollo. `metraje_inicial` acumula todo lo ingresado a bodega
 * (así se mantiene metraje_actual <= metraje_inicial). Si el saldo vuelve a
 * superar el stock mínimo, la alerta se rearma (alerta_enviada = false).
 */
const reabastecer = async (id, metros, db = pool) => {
  const { rows } = await db.query(
    `UPDATE rollos
        SET metraje_actual  = metraje_actual + $2,
            metraje_inicial = metraje_inicial + $2,
            alerta_enviada  = CASE WHEN metraje_actual + $2 > stock_minimo THEN FALSE ELSE alerta_enviada END
      WHERE id = $1
      RETURNING ${COLUMNAS}`,
    [id, metros]
  );
  return rows[0] ?? null;
};

module.exports = {
  listar,
  resumirPorTelaYColor,
  listarOpcionesFiltro,
  buscarPorId,
  buscarPorIdParaActualizar,
  crear,
  descontarMetraje,
  marcarAlertaEnviada,
  reabastecer,
};
