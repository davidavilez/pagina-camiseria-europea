const formatoMetros = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
const formatoFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

export const formatearMetros = (valor) => `${formatoMetros.format(Number(valor) || 0)} m`;

export const formatearFecha = (valor) => (valor ? formatoFecha.format(new Date(valor)) : '—');

export const formatearHora = (fecha) => (fecha ? fecha.toLocaleTimeString('es-CO') : '—');

// Los cortes se agrupan por día en hora de Colombia, sin importar la zona del navegador.
const ZONA_COLOMBIA = 'America/Bogota';
const formatoDiaIso = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_COLOMBIA });

/** Fecha de hoy en Colombia como YYYY-MM-DD (el formato de <input type="date">). */
export const hoyEnColombia = () => formatoDiaIso.format(new Date());

/** Hora HH:mm en 24 h y hora de Colombia. */
export const formatearHoraColombia = (valor) => (valor
  ? new Date(valor).toLocaleTimeString('es-CO', {
    timeZone: ZONA_COLOMBIA, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  })
  : '—');
