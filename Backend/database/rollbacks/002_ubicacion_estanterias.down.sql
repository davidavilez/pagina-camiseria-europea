-- =====================================================================
-- Reversión de la migración 002 · Ubicación de rollos en estanterías
--
-- CUIDADO: borra las estanterías y la ubicación asignada a cada rollo.
-- No toca el resto de los datos de rollos ni los cortes.
-- Está fuera de database/migrations para que db:migrate nunca la ejecute.
-- =====================================================================

BEGIN;

DROP INDEX IF EXISTS idx_rollos_estanteria_id;
ALTER TABLE rollos DROP COLUMN IF EXISTS estanteria_id;
DROP TABLE IF EXISTS estanterias;

COMMIT;
