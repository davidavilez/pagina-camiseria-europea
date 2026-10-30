import client from './client';

export const listarUsuarios = () => client.get('/usuarios').then((r) => r.data);

export const crearUsuario = (datos) => client.post('/usuarios', datos).then((r) => r.data);

export const cambiarEstadoUsuario = (id, estado) => client.patch(`/usuarios/${id}/estado`, { estado }).then((r) => r.data);
