import client from './client';

export const listarCortesAuditoria = () => client.get('/auditoria/cortes').then((r) => r.data);
