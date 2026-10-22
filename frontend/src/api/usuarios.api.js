import client from './client';

export const listarUsuarios = () => client.get('/usuarios').then((r) => r.data);

export const crearUsuario = (datos) => client.post('/usuarios', datos).then((r) => r.data);
