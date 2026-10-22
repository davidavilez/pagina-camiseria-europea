const rolloRepository = require('../repositories/rollo.repository');
const qrService = require('./qr.service');
const { UMBRAL_STOCK_BAJO, ESTADOS_STOCK } = require('../config/constants');
const AppError = require('../utils/AppError');
const validar = require('../utils/validacion');

const calcularEstadoStock = (metrajeActual) => {
  if (metrajeActual <= 0) return ESTADOS_STOCK.AGOTADO;
  if (metrajeActual <= UMBRAL_STOCK_BAJO) return ESTADOS_STOCK.BAJO;
  return ESTADOS_STOCK.OPTIMO;
};

const conEstado = (rollo) => ({ ...rollo, estado_stock: calcularEstadoStock(rollo.metraje_actual) });

const listar = async () => (await rolloRepository.listar()).map(conEstado);

const obtenerPorId = async (id) => {
  const rollo = await rolloRepository.buscarPorId(validar.idEntero(id, 'ID del rollo'));
  if (!rollo) {
    throw AppError.notFound('El rollo no existe en la bodega.');
  }
  return conEstado(rollo);
};

/** Registra el rollo (metraje_actual = metraje_inicial) y devuelve su etiqueta QR. */
const crear = async ({ codigo_sku, tipo_tela, color, metraje_inicial }) => {
  const datos = {
    codigoSku: validar.texto(codigo_sku, 'Código/SKU', { min: 1, max: 50 }).toUpperCase(),
    tipoTela: validar.texto(tipo_tela, 'Tipo de tela', { min: 2, max: 80 }),
    color: validar.texto(color, 'Color', { min: 2, max: 50 }),
    metrajeInicial: validar.metros(metraje_inicial, 'Metraje inicial'),
  };

  let rollo;
  try {
    rollo = await rolloRepository.crear(datos);
  } catch (error) {
    if (error.code === '23505') {
      throw AppError.conflict(`Ya existe un rollo con el código ${datos.codigoSku}.`);
    }
    throw error;
  }

  const qr = await qrService.generarQrRollo(rollo.id);
  return { rollo: conEstado(rollo), qr };
};

const obtenerEtiqueta = async (id) => {
  const rollo = await obtenerPorId(id);
  const qr = await qrService.generarQrRollo(rollo.id);
  return { rollo, qr };
};

module.exports = { listar, obtenerPorId, crear, obtenerEtiqueta, calcularEstadoStock };
