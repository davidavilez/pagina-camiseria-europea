const authService = require('../services/auth.service');
const { PERMISOS, tienePermiso } = require('../config/permisos');
const AppError = require('../utils/AppError');

/** Verifica el JWT y que el usuario siga existiendo y activo. */
const autenticar = async (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    throw AppError.unauthorized('Inicia sesión para continuar.');
  }

  req.usuario = await authService.verificarToken(token);
  next();
};

/** RBAC: exige un permiso de la matriz en config/permisos.js. Usar después de `autenticar`. */
const autorizar = (permiso) => {
  if (!PERMISOS[permiso]) {
    throw new Error(`Permiso desconocido: ${permiso}`);
  }

  return (req, res, next) => {
    if (!tienePermiso(req.usuario?.rol, permiso)) {
      const { descripcion, roles } = PERMISOS[permiso];
      // Mensaje explícito: dice qué rol hace falta y con qué cuenta se hizo la petición.
      throw AppError.forbidden(
        `Solo el rol ${roles.join(' o ')} puede ${descripcion}. ` +
        `La sesión activa es de ${req.usuario.nombre} (${req.usuario.rol}).`
      );
    }
    next();
  };
};

module.exports = { autenticar, autorizar };
