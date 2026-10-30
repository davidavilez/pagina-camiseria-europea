const AppError = require('./AppError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const texto = (valor, campo, { min = 1, max = 255 } = {}) => {
  const limpio = typeof valor === 'string' ? valor.trim() : '';
  if (limpio.length < min || limpio.length > max) {
    throw AppError.badRequest(`El campo "${campo}" debe tener entre ${min} y ${max} caracteres.`);
  }
  return limpio;
};

const email = (valor) => {
  const limpio = typeof valor === 'string' ? valor.trim().toLowerCase() : '';
  if (!EMAIL_REGEX.test(limpio) || limpio.length > 254) {
    throw AppError.badRequest('Ingresa un correo electrónico válido.');
  }
  return limpio;
};

/** Número positivo (o >= 0 con `permitirCero`) con máximo 2 decimales (metros). */
const metros = (valor, campo, { permitirCero = false } = {}) => {
  const numero = valor === '' || valor === null ? Number.NaN : Number(valor);
  if (!Number.isFinite(numero) || numero < 0 || (numero === 0 && !permitirCero)) {
    throw AppError.badRequest(
      `El campo "${campo}" debe ser un número ${permitirCero ? 'mayor o igual a' : 'mayor que'} 0.`
    );
  }
  const centimetros = Math.round(numero * 100);
  if (Math.abs(centimetros - numero * 100) > 1e-6) {
    throw AppError.badRequest(`El campo "${campo}" admite máximo 2 decimales.`);
  }
  if (numero >= 100000000) {
    throw AppError.badRequest(`El campo "${campo}" excede el máximo permitido.`);
  }
  return centimetros / 100;
};

const idEntero = (valor, campo = 'id') => {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw AppError.badRequest(`El ${campo} no es válido.`);
  }
  return numero;
};

const opcion = (valor, opciones, campo) => {
  if (!opciones.includes(valor)) {
    throw AppError.badRequest(`El campo "${campo}" debe ser uno de: ${opciones.join(', ')}.`);
  }
  return valor;
};

module.exports = { texto, email, metros, idEntero, opcion };
