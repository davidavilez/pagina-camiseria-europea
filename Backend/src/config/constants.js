const ROLES = Object.freeze({
  GERENCIA: 'gerencia',
  OPERARIO: 'operario',
});

// Umbral (en metros) que separa "Stock Óptimo" de "Stock Bajo".
const UMBRAL_STOCK_BAJO = 20;

const ESTADOS_STOCK = Object.freeze({
  OPTIMO: 'optimo',
  BAJO: 'bajo',
  AGOTADO: 'agotado',
});

module.exports = { ROLES, UMBRAL_STOCK_BAJO, ESTADOS_STOCK };
