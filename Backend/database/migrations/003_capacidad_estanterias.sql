-- =====================================================================
-- Migración 003 · Capacidad de las estanterías
--   - estanterias.capacidad: máximo de rollos por estantería (60 por defecto)
--
-- Uso:  node scripts/migrate.js 003_capacidad_estanterias.sql   (desde Backend/)
-- Es idempotente. Una estantería que ya supere su capacidad queda como está:
-- la regla se valida en el backend al ocupar un lugar nuevo, nunca sobre lo existente.
-- Reversión: database/rollbacks/003_capacidad_estanterias.down.sql
-- =====================================================================

BEGIN;

ALTER TABLE estanterias ADD COLUMN IF NOT EXISTS capacidad INTEGER NOT NULL DEFAULT 60 CHECK (capacidad > 0);

COMMIT;
