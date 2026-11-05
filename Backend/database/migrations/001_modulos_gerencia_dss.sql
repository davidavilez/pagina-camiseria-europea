-- =====================================================================
-- Migración 001 · Módulos de Gerencia / DSS
--   - Aprobación dual de usuarios (estado pendiente_aprobacion + token)
--   - Stock mínimo por rollo y flag de alerta enviada
--   - Índices para búsqueda y reportes
--
-- Uso:  npm run db:migrate   (desde Backend/)
-- Es idempotente: puede ejecutarse varias veces sin efectos adicionales.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- usuarios: aprobación dual
-- ---------------------------------------------------------------------
ALTER TABLE usuarios ALTER COLUMN estado TYPE VARCHAR(25);

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_estado_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_estado_check
  CHECK (estado IN ('pendiente_aprobacion', 'activo', 'inactivo'));

-- Toda cuenta nueva nace bloqueada hasta que el Súper Administrador la apruebe.
ALTER TABLE usuarios ALTER COLUMN estado SET DEFAULT 'pendiente_aprobacion';

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS aprobacion_token VARCHAR(64) UNIQUE;
-- Evita inundar al Súper Administrador si el usuario reintenta el login.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS aprobacion_notificada_en TIMESTAMPTZ;

-- ---------------------------------------------------------------------
-- rollos: soporte a decisiones (alertas de stock crítico)
-- ---------------------------------------------------------------------
ALTER TABLE rollos ADD COLUMN IF NOT EXISTS stock_minimo NUMERIC(10,2) NOT NULL DEFAULT 20;
ALTER TABLE rollos ADD COLUMN IF NOT EXISTS alerta_enviada BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE rollos DROP CONSTRAINT IF EXISTS rollos_stock_minimo_check;
ALTER TABLE rollos ADD CONSTRAINT rollos_stock_minimo_check CHECK (stock_minimo >= 0);

-- Rollos que ya estaban en stock crítico antes de la migración: no se les
-- envía una alerta retroactiva, se marcan como ya notificados.
UPDATE rollos SET alerta_enviada = TRUE
 WHERE metraje_actual <= stock_minimo AND alerta_enviada = FALSE;

-- ---------------------------------------------------------------------
-- Índices para filtros de inventario y reportes
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_rollos_color_lower     ON rollos (lower(color));
CREATE INDEX IF NOT EXISTS idx_rollos_tipo_tela_lower ON rollos (lower(tipo_tela));

COMMIT;
