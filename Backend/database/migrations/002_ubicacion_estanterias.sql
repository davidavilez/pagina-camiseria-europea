-- =====================================================================
-- Migración 002 · Ubicación de rollos en estanterías
--   - Tabla estanterias (con estanterías de ejemplo)
--   - rollos.estanteria_id: NULL significa "Sin asignar"
--
-- Uso:  npm run db:migrate -- 002_ubicacion_estanterias.sql   (desde Backend/)
-- Es idempotente: no borra ni modifica los datos actuales de los rollos.
-- Reversión: database/rollbacks/002_ubicacion_estanterias.down.sql
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS estanterias (
  id           SERIAL PRIMARY KEY,
  codigo       VARCHAR(20)  NOT NULL UNIQUE,
  descripcion  VARCHAR(255)
);

ALTER TABLE rollos ADD COLUMN IF NOT EXISTS estanteria_id INTEGER
  REFERENCES estanterias(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_rollos_estanteria_id ON rollos (estanteria_id);

INSERT INTO estanterias (codigo, descripcion) VALUES
  ('A-01', 'Pasillo A, estantería 1'),
  ('A-02', 'Pasillo A, estantería 2'),
  ('B-01', 'Pasillo B, estantería 1'),
  ('B-02', 'Pasillo B, estantería 2')
ON CONFLICT (codigo) DO NOTHING;

COMMIT;
