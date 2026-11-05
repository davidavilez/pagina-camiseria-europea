const { pool } = require('../config/db');
const { GERENTE_GENERAL_EMAIL } = require('../config/constants');

const COLUMNAS_PUBLICAS = 'id, nombre, email, rol, estado, fecha_creacion';

// Tiempo mínimo entre dos correos de aprobación para el mismo usuario.
const INTERVALO_REENVIO_APROBACION = '15 minutes';

const buscarPorEmail = async (email, db = pool) => {
  const { rows } = await db.query(
    `SELECT ${COLUMNAS_PUBLICAS}, password_hash FROM usuarios WHERE email = $1`,
    [email]
  );
  return rows[0] ?? null;
};

const buscarPorId = async (id, db = pool) => {
  const { rows } = await db.query(
    `SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
};

const listar = async (db = pool) => {
  const { rows } = await db.query(
    `SELECT ${COLUMNAS_PUBLICAS} FROM usuarios ORDER BY fecha_creacion DESC, id DESC`
  );
  return rows;
};

/** Toda cuenta creada por gerencia nace en `pendiente_aprobacion` con su token. */
const crear = async ({ nombre, email, passwordHash, rol, aprobacionToken }, db = pool) => {
  const { rows } = await db.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol, estado, aprobacion_token)
     VALUES ($1, $2, $3, $4, 'pendiente_aprobacion', $5)
     RETURNING ${COLUMNAS_PUBLICAS}`,
    [nombre, email, passwordHash, rol, aprobacionToken]
  );
  return rows[0];
};

/**
 * Alterna activo/inactivo. Nunca toca cuentas pendientes de aprobación ni la
 * cuenta del Gerente General (segunda barrera, además de la del servicio).
 */
const actualizarEstado = async (id, estado, db = pool) => {
  const { rows } = await db.query(
    `UPDATE usuarios SET estado = $1
      WHERE id = $2 AND estado <> 'pendiente_aprobacion' AND email <> $3
      RETURNING ${COLUMNAS_PUBLICAS}`,
    [estado, id, GERENTE_GENERAL_EMAIL]
  );
  return rows[0] ?? null;
};

/**
 * Registra que se notificó al Súper Administrador y devuelve el token de
 * aprobación, o null si ya se notificó hace menos de INTERVALO_REENVIO_APROBACION.
 * Es atómico: dos logins simultáneos no generan dos correos.
 */
const reservarNotificacionAprobacion = async (id, db = pool) => {
  const { rows } = await db.query(
    `UPDATE usuarios SET aprobacion_notificada_en = NOW()
      WHERE id = $1
        AND estado = 'pendiente_aprobacion'
        AND aprobacion_token IS NOT NULL
        AND (aprobacion_notificada_en IS NULL
             OR aprobacion_notificada_en < NOW() - $2::interval)
      RETURNING aprobacion_token`,
    [id, INTERVALO_REENVIO_APROBACION]
  );
  return rows[0]?.aprobacion_token ?? null;
};

/** Libera la reserva si el correo falló, para reintentar en el próximo login. */
const liberarNotificacionAprobacion = async (id, db = pool) => {
  await db.query('UPDATE usuarios SET aprobacion_notificada_en = NULL WHERE id = $1', [id]);
};

/** Activa la cuenta dueña del token y elimina el token (un solo uso). */
const aprobarPorToken = async (token, db = pool) => {
  const { rows } = await db.query(
    `UPDATE usuarios
        SET estado = 'activo', aprobacion_token = NULL, aprobacion_notificada_en = NULL
      WHERE aprobacion_token = $1 AND estado = 'pendiente_aprobacion'
      RETURNING ${COLUMNAS_PUBLICAS}`,
    [token]
  );
  return rows[0] ?? null;
};

/** Bloquea la fila del usuario hasta el fin de la transacción (eliminación). */
const buscarPorIdParaActualizar = async (id, db = pool) => {
  const { rows } = await db.query(
    `SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id = $1 FOR UPDATE`,
    [id]
  );
  return rows[0] ?? null;
};

/**
 * Cuenta los gerentes activos bloqueando sus filas: dos gerentes que se
 * eliminan entre sí al mismo tiempo no pueden dejar el sistema sin gerencia.
 */
const contarGerentesActivos = async (db = pool) => {
  const { rows } = await db.query(
    `SELECT id FROM usuarios WHERE rol = 'gerencia' AND estado = 'activo' FOR UPDATE`
  );
  return rows.length;
};

const tieneCortes = async (id, db = pool) => {
  const { rows } = await db.query(
    'SELECT EXISTS (SELECT 1 FROM cortes WHERE operario_id = $1) AS tiene',
    [id]
  );
  return rows[0].tiene;
};

/** DELETE real: solo para usuarios sin historial (la FK de cortes es RESTRICT). */
const eliminar = async (id, db = pool) => {
  const { rows } = await db.query(
    `DELETE FROM usuarios WHERE id = $1 AND email <> $2 RETURNING ${COLUMNAS_PUBLICAS}`,
    [id, GERENTE_GENERAL_EMAIL]
  );
  return rows[0] ?? null;
};

/**
 * Borrado lógico de un usuario con cortes: conserva el historial, libera el
 * correo (prefijo "borrado<id>.") para poder reutilizarlo y bloquea el acceso.
 * LEFT respeta el límite de VARCHAR(254); el id en el prefijo mantiene la unicidad.
 */
const desactivarYLiberarEmail = async (id, db = pool) => {
  const { rows } = await db.query(
    `UPDATE usuarios
        SET email = LEFT('borrado' || id || '.' || email, 254),
            estado = 'inactivo',
            aprobacion_token = NULL,
            aprobacion_notificada_en = NULL
      WHERE id = $1 AND email <> $2
      RETURNING ${COLUMNAS_PUBLICAS}`,
    [id, GERENTE_GENERAL_EMAIL]
  );
  return rows[0] ?? null;
};

module.exports = {
  buscarPorEmail,
  buscarPorId,
  listar,
  crear,
  actualizarEstado,
  reservarNotificacionAprobacion,
  liberarNotificacionAprobacion,
  aprobarPorToken,
  buscarPorIdParaActualizar,
  contarGerentesActivos,
  tieneCortes,
  eliminar,
  desactivarYLiberarEmail,
};
