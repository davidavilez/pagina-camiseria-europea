const { ROLES } = require('./constants');

/**
 * Matriz RBAC: única fuente de verdad de qué rol puede hacer qué.
 * Para cambiar un permiso basta editar esta tabla.
 */
const PERMISOS = Object.freeze({
  'usuarios:gestionar': { descripcion: 'gestionar usuarios', roles: [ROLES.GERENCIA] },
  'rollos:listar': { descripcion: 'ver el inventario completo', roles: [ROLES.GERENCIA] },
  'rollos:crear': { descripcion: 'registrar rollos', roles: [ROLES.GERENCIA] },
  'rollos:etiqueta': { descripcion: 'generar etiquetas QR', roles: [ROLES.GERENCIA] },
  'rollos:consultar': { descripcion: 'consultar la ficha de un rollo', roles: [ROLES.GERENCIA, ROLES.OPERARIO] },
  'cortes:registrar': { descripcion: 'registrar cortes de tela', roles: [ROLES.OPERARIO] },
  'auditoria:ver': { descripcion: 'ver el historial de cortes', roles: [ROLES.GERENCIA] },
  'reportes:ver': { descripcion: 'ver el dashboard y los reportes', roles: [ROLES.GERENCIA] },
});

const tienePermiso = (rol, permiso) => Boolean(PERMISOS[permiso]?.roles.includes(rol));

const permisosDeRol = (rol) => Object.keys(PERMISOS).filter((permiso) => tienePermiso(rol, permiso));

module.exports = { PERMISOS, tienePermiso, permisosDeRol };
