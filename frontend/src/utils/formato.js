const formatoMetros = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
const formatoFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

export const formatearMetros = (valor) => `${formatoMetros.format(Number(valor) || 0)} m`;

export const formatearFecha = (valor) => (valor ? formatoFecha.format(new Date(valor)) : '—');

export const formatearHora = (fecha) => (fecha ? fecha.toLocaleTimeString('es-CO') : '—');
