import client from './client';

/** Filtros acumulativos: solo se envían los que tienen valor. */
const paramsDeFiltros = ({ search, buscar_por: buscarPor, color, tipo_tela: tipoTela } = {}) => {
  const params = {};
  if (search) {
    params.search = search;
    if (buscarPor) params.buscar_por = buscarPor;
  }
  if (color) params.color = color;
  if (tipoTela) params.tipo_tela = tipoTela;
  return params;
};

export const listarRollos = (filtros) => client.get('/rollos', { params: paramsDeFiltros(filtros) }).then((r) => r.data);

/** { metros_disponibles, rollos_disponibles, telas: [{ tipo_tela, ..., colores: [{ color, rollos, metros }] }] } */
export const obtenerResumenInventario = (filtros) => client.get('/rollos/resumen', { params: paramsDeFiltros(filtros) }).then((r) => r.data);

/** { colores, tipos_tela } presentes en bodega, para los selectores de filtro. */
export const obtenerOpcionesFiltro = () => client.get('/rollos/filtros').then((r) => r.data);

/** Catálogo de colores textiles que acepta el backend. */
export const obtenerCatalogoColores = () => client.get('/rollos/catalogo-colores').then((r) => r.data);

export const obtenerRollo = (id) => client.get(`/rollos/${encodeURIComponent(id)}`).then((r) => r.data);

/** Devuelve { rollo, qr } donde qr es un PNG en data URL. */
export const crearRollo = (datos) => client.post('/rollos', datos).then((r) => r.data);

export const reabastecerRollo = (id, metros) => client.patch(`/rollos/${id}/reabastecer`, { metros }).then((r) => r.data);

export const obtenerEtiqueta = (id) => client.get(`/rollos/${id}/etiqueta`).then((r) => r.data);
