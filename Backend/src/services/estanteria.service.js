const estanteriaRepository = require('../repositories/estanteria.repository');
const AppError = require('../utils/AppError');
const validar = require('../utils/validacion');

const listar = () => estanteriaRepository.listar();

const crear = async ({ codigo, descripcion }) => {
  const datos = {
    codigo: validar.codigoEstanteria(codigo),
    descripcion: descripcion === undefined || descripcion === null || descripcion === ''
      ? null
      : validar.texto(descripcion, 'Descripción', { max: 255 }),
  };

  try {
    return await estanteriaRepository.crear(datos);
  } catch (error) {
    if (error.code === '23505') {
      throw AppError.conflict(`Ya existe la estantería ${datos.codigo}.`);
    }
    throw error;
  }
};

/** Valida la estantería indicada para un rollo. Vacío => null ("Sin asignar"). */
const resolverId = async (valor) => {
  if (valor === undefined || valor === null || valor === '') return null;

  const id = validar.idEntero(valor, 'ID de la estantería');
  if (!await estanteriaRepository.buscarPorId(id)) {
    throw AppError.badRequest(`La estantería con ID ${id} no existe.`);
  }
  return id;
};

module.exports = { listar, crear, resolverId };
