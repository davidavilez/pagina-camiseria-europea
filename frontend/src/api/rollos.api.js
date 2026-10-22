import client from './client';

export const listarRollos = () => client.get('/rollos').then((r) => r.data);

export const obtenerRollo = (id) => client.get(`/rollos/${encodeURIComponent(id)}`).then((r) => r.data);

/** Devuelve { rollo, qr } donde qr es un PNG en data URL. */
export const crearRollo = (datos) => client.post('/rollos', datos).then((r) => r.data);

export const obtenerEtiqueta = (id) => client.get(`/rollos/${id}/etiqueta`).then((r) => r.data);
