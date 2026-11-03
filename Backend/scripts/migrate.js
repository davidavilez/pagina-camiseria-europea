// Aplica en orden todas las migraciones de database/migrations  ->  npm run db:migrate
// Cada migración es idempotente, así que se pueden volver a ejecutar sin riesgo.
// Para aplicar solo una:  npm run db:migrate -- 002_ubicacion_estanterias.sql
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

const carpeta = path.join(__dirname, '../database/migrations');
const soloArchivo = process.argv[2];

const migrar = async () => {
  const archivos = fs.readdirSync(carpeta)
    .filter((archivo) => archivo.endsWith('.sql') && (!soloArchivo || archivo === soloArchivo))
    .sort();
  if (soloArchivo && archivos.length === 0) {
    throw new Error(`No existe la migración ${soloArchivo}.`);
  }
  for (const archivo of archivos) {
    await pool.query(fs.readFileSync(path.join(carpeta, archivo), 'utf8'));
    console.log(`Migración aplicada: ${archivo}`);
  }
};

migrar()
  .catch((error) => {
    console.error('Error al aplicar migraciones:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
