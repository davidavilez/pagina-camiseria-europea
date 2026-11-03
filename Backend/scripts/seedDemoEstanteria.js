// SOLO DESARROLLO. Deja la estantería de demostración a un rollo de llenarse.
//   node scripts/seedDemoEstanteria.js             -> la deja en capacidad - 1 (59 de 60)
//   node scripts/seedDemoEstanteria.js --limpiar   -> borra los rollos DEMO-*
// Los rollos con cortes registrados no se borran: el historial no se toca.
const { db: configDb } = require('../src/config/env'); // carga antes Backend/.env, que puede definir NODE_ENV

// Normaliza porque en Windows `set NODE_ENV=production && node ...` deja un espacio final.
if ((process.env.NODE_ENV ?? '').trim().toLowerCase() === 'production') {
  console.error('seedDemoEstanteria es solo para desarrollo: se niega a correr con NODE_ENV=production.');
  process.exit(1);
}

const { pool, withTransaction } = require('../src/config/db');

const CODIGO_ESTANTERIA = 'DEM-01';
const PREFIJO = 'DEMO-';

/** Borra los rollos DEMO-* sin cortes que cumplan `filtro`; los más recientes primero. */
const borrarRollosDemo = async (client, { estanteriaId = null, limite = null } = {}) => {
  const { rows } = await client.query(
    `DELETE FROM rollos
      WHERE id IN (
        SELECT r.id FROM rollos r
         WHERE r.codigo_sku LIKE $1
           AND ($2::int IS NULL OR r.estanteria_id = $2)
           AND NOT EXISTS (SELECT 1 FROM cortes c WHERE c.rollo_id = r.id)
         ORDER BY r.id DESC
         LIMIT $3
      )
      RETURNING id`,
    [`${PREFIJO}%`, estanteriaId, limite]
  );
  return rows.length;
};

const sembrar = () => withTransaction(async (client) => {
  await client.query(
    `INSERT INTO estanterias (codigo, descripcion)
     VALUES ($1, 'Estantería de demostración (seedDemoEstanteria.js)')
     ON CONFLICT (codigo) DO NOTHING`,
    [CODIGO_ESTANTERIA]
  );
  const { rows: [estanteria] } = await client.query(
    'SELECT id, capacidad FROM estanterias WHERE codigo = $1 FOR UPDATE',
    [CODIGO_ESTANTERIA]
  );

  const contar = async () => {
    const { rows } = await client.query('SELECT COUNT(*)::int AS total FROM rollos WHERE estanteria_id = $1', [estanteria.id]);
    return rows[0].total;
  };

  const objetivo = estanteria.capacidad - 1;
  const inicial = await contar();

  if (inicial > objetivo) {
    await borrarRollosDemo(client, { estanteriaId: estanteria.id, limite: inicial - objetivo });
  }
  let faltan = objetivo - inicial;
  for (let n = 1; faltan > 0; n += 1) {
    const { rowCount } = await client.query(
      `INSERT INTO rollos (codigo_sku, tipo_tela, color, metraje_inicial, metraje_actual, stock_minimo, estanteria_id)
       VALUES ($1, 'Demo', 'Gris', 100, 100, 20, $2)
       ON CONFLICT (codigo_sku) DO NOTHING`,
      [`${PREFIJO}${String(n).padStart(3, '0')}`, estanteria.id]
    );
    faltan -= rowCount;
  }

  console.log(`Estantería ${CODIGO_ESTANTERIA}: ${await contar()} de ${estanteria.capacidad} rollos (base ${configDb.database}).`);
});

const limpiar = () => withTransaction(async (client) => {
  const borrados = await borrarRollosDemo(client);
  const { rows } = await client.query(
    `SELECT r.codigo_sku FROM rollos r
      WHERE r.codigo_sku LIKE $1 ORDER BY r.codigo_sku`,
    [`${PREFIJO}%`]
  );
  console.log(`Rollos ${PREFIJO}* borrados: ${borrados} (base ${configDb.database}).`);
  if (rows.length) {
    console.log(`Conservados porque tienen cortes: ${rows.map((r) => r.codigo_sku).join(', ')}.`);
  }
});

(process.argv.includes('--limpiar') ? limpiar() : sembrar())
  .catch((error) => {
    console.error('Error en seedDemoEstanteria:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
