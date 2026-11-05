const reporteRepository = require('../repositories/reporte.repository');
const validar = require('../utils/validacion');

// Ventanas móviles hacia atrás desde "ahora" (lista blanca: el interval nunca viene del cliente).
const RANGOS = Object.freeze({
  diario: { dias: 1, etiqueta: 'Últimas 24 horas' },
  semanal: { dias: 7, etiqueta: 'Últimos 7 días' },
  quincenal: { dias: 15, etiqueta: 'Últimos 15 días' },
  mensual: { dias: 30, etiqueta: 'Últimos 30 días' },
});

const sinNivel = ({ nivel, ...fila }) => fila;

/**
 * Tela estrella: la de mayor consumo en el periodo (si hubo cortes).
 * Tela estancada: entre las telas con stock en bodega, la de menor consumo;
 * a igual consumo, la que más metros tiene inmovilizados.
 */
const calcularKpis = (porTela) => {
  const conConsumo = porTela.filter((t) => t.metros_cortados > 0);
  const estrella = conConsumo.reduce((mejor, t) => (!mejor || t.metros_cortados > mejor.metros_cortados ? t : mejor), null);

  const conStock = porTela.filter((t) => t.stock_actual > 0);
  const estancada = conStock.reduce((peor, t) => {
    if (!peor) return t;
    if (t.metros_cortados !== peor.metros_cortados) return t.metros_cortados < peor.metros_cortados ? t : peor;
    return t.stock_actual > peor.stock_actual ? t : peor;
  }, null);

  return {
    tela_estrella: estrella,
    // Si solo hay una tela con stock y es la estrella, no se reporta como estancada.
    tela_estancada: estancada && estancada !== estrella ? estancada : null,
  };
};

const consumo = async ({ rango = 'semanal' } = {}) => {
  const clave = validar.opcion(rango, Object.keys(RANGOS), 'rango');
  const { dias, etiqueta } = RANGOS[clave];

  const filas = await reporteRepository.consumoPorPeriodo({ intervalo: `${dias} days` });
  const porNivel = (nivel) => filas.filter((f) => f.nivel === nivel).map(sinNivel);

  const porTela = porNivel('tela').map(({ color, ...t }) => t);
  const porColor = porNivel('color').map(({ tipo_tela, ...c }) => c);
  const detalle = porNivel('tela_color');

  const totales = porTela.reduce(
    (acc, t) => ({ metros_cortados: acc.metros_cortados + t.metros_cortados, cortes: acc.cortes + t.cortes }),
    { metros_cortados: 0, cortes: 0 }
  );
  totales.metros_cortados = Math.round(totales.metros_cortados * 100) / 100;

  const hasta = new Date();
  const desde = new Date(hasta.getTime() - dias * 24 * 60 * 60 * 1000);

  return {
    rango: clave,
    etiqueta,
    desde,
    hasta,
    totales,
    kpis: calcularKpis(porTela),
    por_tela: porTela,
    por_color: porColor.filter((c) => c.metros_cortados > 0),
    detalle: detalle.filter((d) => d.metros_cortados > 0),
  };
};

module.exports = { consumo, RANGOS };
