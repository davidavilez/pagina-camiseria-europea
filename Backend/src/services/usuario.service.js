const bcrypt = require('bcryptjs');
const usuarioRepository = require('../repositories/usuario.repository');
const { ROLES } = require('../config/constants');
const AppError = require('../utils/AppError');
const validar = require('../utils/validacion');

const BCRYPT_COSTO = 12;

const listar = () => usuarioRepository.listar();

/** Solo gerencia llega aquí (RBAC en la ruta): no existe auto-registro. */
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
  return usuarioRepository.crear({ ...datos, passwordHash });
};

module.exports = { listar, crear };
