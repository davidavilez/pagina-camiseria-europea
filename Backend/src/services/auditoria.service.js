const corteRepository = require('../repositories/corte.repository');

const LIMITE_POR_DEFECTO = 200;
const LIMITE_MAXIMO = 1000;

const listarCortes = ({ limite } = {}) => {
  const numero = Number.parseInt(limite, 10);
  const limiteSeguro = Number.isInteger(numero) && numero > 0
    ? Math.min(numero, LIMITE_MAXIMO)
    : LIMITE_POR_DEFECTO;
  return corteRepository.listarAuditoria({ limite: limiteSeguro });
};

module.exports = { listarCortes };
