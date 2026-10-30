const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const usuarioRepository = require('../repositories/usuario.repository');
const emailService = require('./email.service');
const { ROLES, ESTADOS_USUARIO, GERENTE_GENERAL_EMAIL } = require('../config/constants');
const AppError = require('../utils/AppError');
const validar = require('../utils/validacion');

const BCRYPT_COSTO = 12;
const TOKEN_REGEX = /^[a-f0-9]{64}$/;

const esGerenteGeneral = (usuario) => usuario?.email === GERENTE_GENERAL_EMAIL;

/** `protegido` le indica a la interfaz qué cuenta no admite acciones de baja. */
const listar = async () => (await usuarioRepository.listar())
  .map((usuario) => ({ ...usuario, protegido: esGerenteGeneral(usuario) }));

/**
 * Solo gerencia llega aquí (RBAC en la ruta): no existe auto-registro.
 * La cuenta nace en `pendiente_aprobacion`; el acceso lo habilita el
 * Súper Administrador desde el enlace que recibe por correo.
 */
const crear = async ({ nombre, email, password, rol }) => {
  const datos = {
    nombre: validar.texto(nombre, 'nombre', { min: 2, max: 120 }),
    email: validar.email(email),
    rol: validar.opcion(rol, Object.values(ROLES), 'rol'),
  };

  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    throw AppError.badRequest('La contraseña debe tener entre 8 y 72 caracteres.');
  }

  if (await usuarioRepository.buscarPorEmail(datos.email)) {
    throw AppError.conflict('Ya existe un usuario con ese correo.');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COSTO);
  const aprobacionToken = crypto.randomBytes(32).toString('hex');
  const usuario = await usuarioRepository.crear({ ...datos, passwordHash, aprobacionToken });

  // El usuario ya quedó guardado: si el correo falla no se revierte la creación,
  // solo se informa a gerencia para que entregue las credenciales por otro medio.
  let credencialesEnviadas = true;
  try {
    await emailService.enviarCredenciales(usuario, password);
  } catch (error) {
    credencialesEnviadas = false;
    console.error(`[correo] No se enviaron las credenciales a ${usuario.email}:`, error.message);
  }

  return { ...usuario, credenciales_enviadas: credencialesEnviadas };
};

/** Gerencia puede dar de baja / reactivar, pero nunca saltarse la aprobación dual. */
const cambiarEstadoUsuario = async (id, estado) => {
  const usuarioId = validar.idEntero(id, 'ID del usuario');

  const actual = await usuarioRepository.buscarPorId(usuarioId);
  if (!actual) {
    throw AppError.notFound('El usuario no existe.');
  }
  // Regla de seguridad: la cuenta maestra es inalterable, sin importar el estado pedido.
  if (esGerenteGeneral(actual)) {
    throw AppError.forbidden('Acción prohibida: No se puede dar de baja al Gerente General del sistema.');
  }
  validar.opcion(estado, [ESTADOS_USUARIO.ACTIVO, ESTADOS_USUARIO.INACTIVO], 'estado');
  if (actual.estado === ESTADOS_USUARIO.PENDIENTE) {
    throw AppError.conflict('Esta cuenta solo puede habilitarla el Súper Administrador desde el enlace de aprobación.');
  }

  const actualizado = await usuarioRepository.actualizarEstado(usuarioId, estado);
  if (!actualizado) {
    throw AppError.conflict('No se pudo cambiar el estado del usuario.');
  }
  return actualizado;
};

/**
 * Llamado desde el login fallido de una cuenta pendiente: envía al Súper
 * Administrador el enlace de aprobación (como máximo uno cada 15 minutos).
 * Nunca lanza: un fallo de correo no debe cambiar la respuesta del login.
 */
const notificarSolicitudAprobacion = async (usuario) => {
  try {
    const token = await usuarioRepository.reservarNotificacionAprobacion(usuario.id);
    if (!token) return;
    try {
      await emailService.enviarSolicitudAprobacion(usuario, token);
    } catch (error) {
      await usuarioRepository.liberarNotificacionAprobacion(usuario.id);
      throw error;
    }
  } catch (error) {
    console.error(`[correo] No se envió la solicitud de aprobación de ${usuario.email}:`, error.message);
  }
};

/** Devuelve el usuario aprobado, o null si el enlace es inválido o ya se usó. */
const aprobarPorToken = async (token) => {
  if (typeof token !== 'string' || !TOKEN_REGEX.test(token)) {
    return null;
  }
  return usuarioRepository.aprobarPorToken(token);
};

module.exports = {
  listar,
  crear,
  cambiarEstadoUsuario,
  notificarSolicitudAprobacion,
  aprobarPorToken,
};
