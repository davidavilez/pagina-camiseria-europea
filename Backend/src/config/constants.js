const ROLES = Object.freeze({
  GERENCIA: 'gerencia',
  OPERARIO: 'operario',
});

const ESTADOS_USUARIO = Object.freeze({
  PENDIENTE: 'pendiente_aprobacion',
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
});

// Cuenta maestra del sistema: nunca puede darse de baja ni cambiar de estado.
const GERENTE_GENERAL_EMAIL = 'gerente@camiseriaeuropea.com';

// Stock mínimo (en metros) que se asigna a un rollo si gerencia no indica otro.
// Al llegar a él el rollo pasa a "Stock Bajo" y se dispara la alerta por correo.
const STOCK_MINIMO_POR_DEFECTO = 20;

const ESTADOS_STOCK = Object.freeze({
  OPTIMO: 'optimo',
  BAJO: 'bajo',
  AGOTADO: 'agotado',
});

module.exports = { ROLES, ESTADOS_USUARIO, GERENTE_GENERAL_EMAIL, STOCK_MINIMO_POR_DEFECTO, ESTADOS_STOCK };
