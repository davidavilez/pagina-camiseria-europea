const corteRepository = require('../repositories/corte.repository');
const validar = require('../utils/validacion');

const LIMITE_POR_DEFECTO = 200;
const LIMITE_MAXIMO = 1000;

/** Con `fecha` (YYYY-MM-DD) devuelve los cortes de ese día; sin ella, el historial reciente. */
const listarCortes = ({ limite, fecha } = {}) => {
  if (fecha !== undefined) {
    return corteRepository.listarPorDia({ fecha: validar.fecha(fecha) });
  }
  const numero = Number.parseInt(limite, 10);
  const limiteSeguro = Number.isInteger(numero) && numero > 0
    ? Math.min(numero, LIMITE_MAXIMO)
    : LIMITE_POR_DEFECTO;
  return corteRepository.listarAuditoria({ limite: limiteSeguro });
};

module.exports = { listarCortes };
