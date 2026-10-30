const rolloRepository = require('../repositories/rollo.repository');
const qrService = require('./qr.service');
const { STOCK_MINIMO_POR_DEFECTO, ESTADOS_STOCK } = require('../config/constants');
const AppError = require('../utils/AppError');
const validar = require('../utils/validacion');
const { validarColor, listarColores } = require('../utils/colores');

/** El umbral de "Stock Bajo" es el stock mínimo propio de cada rollo. */
const calcularEstadoStock = ({ metraje_actual: actual, stock_minimo: minimo }) => {
  if (actual <= 0) return ESTADOS_STOCK.AGOTADO;
  if (actual <= minimo) return ESTADOS_STOCK.BAJO;
  return ESTADOS_STOCK.OPTIMO;
};

const conEstado = (rollo) => ({ ...rollo, estado_stock: calcularEstadoStock(rollo) });

/** Filtro de texto opcional: vacío o ausente => se ignora. */
const filtroOpcional = (valor, campo, max) => {
  if (valor === undefined || valor === null) return undefined;
  if (typeof valor !== 'string') {
    throw AppError.badRequest(`El filtro "${campo}" no es válido.`);
  }
  const limpio = valor.trim();
  if (limpio.length > max) {
    throw AppError.badRequest(`El filtro "${campo}" admite máximo ${max} caracteres.`);
  }
  return limpio || undefined;
};

// Campo sobre el que actúa el texto libre; sin `buscar_por` se busca en todos.
const CAMPOS_BUSQUEDA = ['codigo', 'tela'];

const leerFiltros = ({ search, buscar_por: buscarPor, color, tipo_tela: tipoTela } = {}) => ({
  search: filtroOpcional(search, 'search', 100),
  buscarPor: buscarPor === undefined || buscarPor === ''
    ? undefined
    : validar.opcion(buscarPor, CAMPOS_BUSQUEDA, 'buscar_por'),
  color: filtroOpcional(color, 'color', 50),
  tipoTela: filtroOpcional(tipoTela, 'tipo_tela', 80),
});

const listar = async (query) => (await rolloRepository.listar(leerFiltros(query))).map(conEstado);

const redondear = (metros) => Math.round(metros * 100) / 100;

/**
 * Panel resumen de la búsqueda por tela: metros disponibles por tela y, dentro
 * de cada una, los colores con stock (rollos y metraje acumulado por color).
 */
const resumen = async (query) => {
  const filas = await rolloRepository.resumirPorTelaYColor(leerFiltros(query));

  const telas = new Map();
  for (const fila of filas) {
    if (!telas.has(fila.clave_tela)) {
      telas.set(fila.clave_tela, {
        tipo_tela: fila.tipo_tela, metros_disponibles: 0, rollos_disponibles: 0, rollos_agotados: 0, colores: [],
      });
    }
    const tela = telas.get(fila.clave_tela);
    tela.metros_disponibles = redondear(tela.metros_disponibles + fila.metros);
    tela.rollos_disponibles += fila.rollos;
    tela.rollos_agotados += fila.agotados;
    if (fila.rollos > 0) {
      tela.colores.push({ color: fila.color, rollos: fila.rollos, metros: fila.metros });
    }
  }

  const lista = [...telas.values()];
  return {
    metros_disponibles: redondear(lista.reduce((suma, t) => suma + t.metros_disponibles, 0)),
    rollos_disponibles: lista.reduce((suma, t) => suma + t.rollos_disponibles, 0),
    telas: lista,
  };
};

const opcionesFiltro = () => rolloRepository.listarOpcionesFiltro();

const catalogoColores = () => listarColores();

const obtenerPorId = async (id) => {
  const rollo = await rolloRepository.buscarPorId(validar.idEntero(id, 'ID del rollo'));
  if (!rollo) {
    throw AppError.notFound('El rollo no existe en la bodega.');
  }
  return conEstado(rollo);
};

/** Registra el rollo (metraje_actual = metraje_inicial) y devuelve su etiqueta QR. */
const crear = async ({ codigo_sku, tipo_tela, color, metraje_inicial, stock_minimo }) => {
  const datos = {
    codigoSku: validar.texto(codigo_sku, 'Código/SKU', { min: 1, max: 50 }).toUpperCase(),
    tipoTela: validar.texto(tipo_tela, 'Tipo de tela', { min: 2, max: 80 }),
    color: validarColor(color),
    metrajeInicial: validar.metros(metraje_inicial, 'Metraje inicial'),
    stockMinimo: stock_minimo === undefined || stock_minimo === ''
      ? STOCK_MINIMO_POR_DEFECTO
      : validar.metros(stock_minimo, 'Stock mínimo', { permitirCero: true }),
  };

  if (datos.stockMinimo >= datos.metrajeInicial) {
    throw AppError.badRequest('El stock mínimo debe ser menor que el metraje inicial.');
  }

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

/** Suma metraje al rollo; si supera el stock mínimo, la alerta vuelve a armarse. */
const reabastecer = async (id, { metros }) => {
  const rolloId = validar.idEntero(id, 'ID del rollo');
  const cantidad = validar.metros(metros, 'Metros a ingresar');

  const rollo = await rolloRepository.reabastecer(rolloId, cantidad);
  if (!rollo) {
    throw AppError.notFound('El rollo no existe en la bodega.');
  }
  return conEstado(rollo);
};

const obtenerEtiqueta = async (id) => {
  const rollo = await obtenerPorId(id);
  const qr = await qrService.generarQrRollo(rollo.id);
  return { rollo, qr };
};

module.exports = {
  listar,
  resumen,
  opcionesFiltro,
  catalogoColores,
  obtenerPorId,
  crear,
  reabastecer,
  obtenerEtiqueta,
  calcularEstadoStock,
};
