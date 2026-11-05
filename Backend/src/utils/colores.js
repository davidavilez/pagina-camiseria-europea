const AppError = require('./AppError');

/**
 * Catálogo parametrizado de colores textiles válidos.
 * Para aceptar un color nuevo basta agregarlo aquí (en minúsculas, con tildes).
 */
const CATALOGO_COLORES = Object.freeze([
  'blanco', 'blanco hueso', 'marfil', 'crema', 'beige', 'arena', 'caqui', 'camel',
  'negro', 'gris', 'gris claro', 'gris oscuro', 'gris perla', 'plata', 'antracita',
  'azul', 'azul cielo', 'azul celeste', 'azul claro', 'azul oscuro', 'azul marino',
  'azul rey', 'azul petróleo', 'azul acero', 'azul índigo', 'celeste', 'turquesa', 'aguamarina',
  'verde', 'verde claro', 'verde oscuro', 'verde oliva', 'verde menta', 'verde militar',
  'verde esmeralda', 'verde botella',
  'rojo', 'rojo vino', 'vinotinto', 'burdeos', 'granate', 'coral', 'salmón',
  'rosado', 'rosa', 'rosa palo', 'fucsia', 'magenta',
  'morado', 'lila', 'lavanda', 'violeta', 'berenjena',
  'amarillo', 'amarillo pastel', 'mostaza', 'dorado', 'naranja', 'terracota',
  'café', 'marrón', 'chocolate', 'tabaco', 'cobre',
]);

// Solo letras (con tildes/ñ/ü) y espacios: rechaza números y caracteres especiales.
const SOLO_LETRAS = /^[a-záéíóúüñ ]+$/;

/** Clave de comparación: minúsculas, sin tildes y con espacios simples. */
const clave = (texto) => texto
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

const CATALOGO_POR_CLAVE = new Map(CATALOGO_COLORES.map((color) => [clave(color), color]));

const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

/**
 * Normaliza el color ingresado y lo valida contra el catálogo.
 * Devuelve el nombre canónico ("azul  CIELO" -> "Azul cielo") o lanza 400.
 */
const validarColor = (valor) => {
  const original = typeof valor === 'string' ? valor : String(valor ?? '');
  const texto = original.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
  const canonico = SOLO_LETRAS.test(texto) ? CATALOGO_POR_CLAVE.get(clave(texto)) : undefined;

  if (!canonico) {
    throw AppError.badRequest(`Error: '${original.trim()}' no es un color válido.`);
  }
  return capitalizar(canonico);
};

const listarColores = () => CATALOGO_COLORES.map(capitalizar);

module.exports = { CATALOGO_COLORES, validarColor, listarColores };
