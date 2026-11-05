import client from './client';

/** rango: 'diario' | 'semanal' | 'quincenal' | 'mensual' */
export const obtenerConsumo = (rango) => client.get('/reportes/consumo', { params: { rango } }).then((r) => r.data);
