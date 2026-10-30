const formatoMetros = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

const formatearMetros = (valor) => `${formatoMetros.format(Number(valor) || 0)} m`;

module.exports = { formatearMetros };
