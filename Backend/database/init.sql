-- =====================================================================
-- APP-INV-QR-CE-01 · Camisería Europea
-- Script de inicialización de base de datos (PostgreSQL 15+)
--
-- Uso (instalación limpia):
--   docker exec -i camiseria_postgres psql -U admin -d inventario_telas < Backend/database/init.sql
--
-- Es idempotente: puede ejecutarse varias veces sin duplicar datos.
-- NOTA: si la BD ya tiene tablas con el esquema antiguo (codigo_qr,
-- operario_id VARCHAR, creado_en), CREATE TABLE IF NOT EXISTS no las
-- modificará. En ese caso se debe aplicar la migración correspondiente.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- usuarios
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(120) NOT NULL CHECK (char_length(trim(nombre)) >= 2),
  email           VARCHAR(254) NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash   TEXT         NOT NULL,
  rol             VARCHAR(20)  NOT NULL CHECK (rol IN ('gerencia', 'operario')),
  estado          VARCHAR(10)  NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  fecha_creacion  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- rollos
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rollos (
  id               SERIAL PRIMARY KEY,
  codigo_sku       VARCHAR(50)   NOT NULL UNIQUE,
  tipo_tela        VARCHAR(80)   NOT NULL,
  color            VARCHAR(50)   NOT NULL,
  metraje_inicial  NUMERIC(10,2) NOT NULL CHECK (metraje_inicial > 0),
  metraje_actual   NUMERIC(10,2) NOT NULL,
  fecha_ingreso    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  -- Última línea de defensa de la regla de negocio: el saldo nunca es
  -- negativo ni supera lo que ingresó a bodega.
  CONSTRAINT rollos_metraje_actual_rango
    CHECK (metraje_actual >= 0 AND metraje_actual <= metraje_inicial)
);

-- ---------------------------------------------------------------------
-- cortes (historial / trazabilidad)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cortes (
  id               SERIAL PRIMARY KEY,
  rollo_id         INTEGER       NOT NULL REFERENCES rollos(id)   ON DELETE RESTRICT,
  operario_id      INTEGER       NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  metros_cortados  NUMERIC(10,2) NOT NULL CHECK (metros_cortados > 0),
  fecha_corte      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cortes_rollo_id    ON cortes (rollo_id);
CREATE INDEX IF NOT EXISTS idx_cortes_operario_id ON cortes (operario_id);
CREATE INDEX IF NOT EXISTS idx_cortes_fecha_corte ON cortes (fecha_corte DESC);

-- ---------------------------------------------------------------------
-- Seed: Gerente inicial
--   email:      gerente@camiseriaeuropea.com
--   contraseña: Gerente#2026   (bcrypt, cost 12)  -> CAMBIAR tras el primer ingreso
-- ---------------------------------------------------------------------
INSERT INTO usuarios (nombre, email, password_hash, rol)
VALUES (
  'Gerente General',
  'gerente@camiseriaeuropea.com',
  '$2b$12$htOHCts90aPJQWJWpnfX9uPaWi3K0ohw3MEJ3mfYN62oEmPmBUtrq',
  'gerencia'
)
ON CONFLICT (email) DO NOTHING;

COMMIT;
