const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');
const usuarioRepository = require('../repositories/usuario.repository');
const usuarioService = require('./usuario.service');
const { permisosDeRol } = require('../config/permisos');
const { ESTADOS_USUARIO } = require('../config/constants');
const AppError = require('../utils/AppError');

// Hash de relleno: si el correo no existe igual se ejecuta bcrypt.compare,
// así el tiempo de respuesta no revela qué correos están registrados.
const HASH_RELLENO = '$2b$12$cLt8sitDpSkGMU48d2bcKuT9zR2ExjAitx4BqfdXnz1ceaVFp6NPG';

const aUsuarioPublico = ({ id, nombre, email, rol }) => ({
  id, nombre, email, rol, permisos: permisosDeRol(rol),
});

const firmarToken = (usuario) => jwt.sign(
  { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
  jwtConfig.secret,
  { subject: String(usuario.id), expiresIn: jwtConfig.expiresIn }
);

const login = async ({ email, password }) => {
  const emailLimpio = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const passwordTexto = typeof password === 'string' ? password : '';

  if (!emailLimpio || !passwordTexto) {
    throw AppError.badRequest('Ingresa tu correo y contraseña.');
  }

  const usuario = await usuarioRepository.buscarPorEmail(emailLimpio);
  const passwordValida = await bcrypt.compare(passwordTexto, usuario?.password_hash ?? HASH_RELLENO);

  if (!usuario || !passwordValida) {
    throw AppError.unauthorized('Correo o contraseña incorrectos.');
  }
  // Solo se llega aquí con la contraseña correcta, así nadie que conozca un
  // correo ajeno puede disparar solicitudes de aprobación.
  if (usuario.estado === ESTADOS_USUARIO.PENDIENTE) {
    usuarioService.notificarSolicitudAprobacion(usuario); // no se espera: el login responde de inmediato
    throw AppError.forbidden('Esperando aprobación de Gerencia');
  }
  if (usuario.estado !== ESTADOS_USUARIO.ACTIVO) {
    throw AppError.forbidden('Tu cuenta está desactivada. Contacta a gerencia.');
  }

  return { usuario: aUsuarioPublico(usuario), token: firmarToken(usuario) };
};

/** Devuelve el usuario del token si la firma es válida y la cuenta sigue activa. */
const verificarToken = async (token) => {
  let payload;
  try {
    payload = jwt.verify(token, jwtConfig.secret);
  } catch {
    throw AppError.unauthorized('La sesión venció. Inicia sesión nuevamente.');
  }

  const usuario = await usuarioRepository.buscarPorId(Number(payload.sub));
  if (!usuario || usuario.estado !== ESTADOS_USUARIO.ACTIVO) {
    throw AppError.unauthorized('Tu sesión ya no es válida. Inicia sesión nuevamente.');
  }
  return aUsuarioPublico(usuario);
};

module.exports = { login, verificarToken };
