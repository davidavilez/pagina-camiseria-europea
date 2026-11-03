import client from './client';

/** [{ id, codigo, descripcion }] ordenadas por código. */
export const listarEstanterias = () => client.get('/estanterias').then((r) => r.data);
