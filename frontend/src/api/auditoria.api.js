import client from './client';

/** Sin `fecha` trae el historial reciente; con `fecha` (YYYY-MM-DD) solo los cortes de ese día. */
export const listarCortesAuditoria = (fecha) => client
  .get('/auditoria/cortes', { params: fecha ? { fecha } : undefined })
  .then((r) => r.data);
