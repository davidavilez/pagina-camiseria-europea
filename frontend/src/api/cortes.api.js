import client from './client';

export const registrarCorte = (rolloId, metrosCortados) => client
  .post('/cortes', { rollo_id: rolloId, metros_cortados: metrosCortados })
  .then((r) => r.data);
