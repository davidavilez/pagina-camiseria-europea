-- =====================================================================
-- Reversión de la migración 003 · Capacidad de las estanterías
--
-- CUIDADO: el código de esta funcionalidad lee `capacidad`; revertir la
-- base exige volver antes a un commit anterior a la regla de capacidad.
-- No toca las estanterías ni los rollos. Está fuera de database/migrations
-- para que db:migrate nunca la ejecute.
-- =====================================================================

BEGIN;

ALTER TABLE estanterias DROP COLUMN IF EXISTS capacidad;

COMMIT;
