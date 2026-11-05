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

/** Lee la estantería indicada para un rollo. Vacío => null ("Sin asignar"). */
const leerId = (valor) => {
  if (valor === undefined || valor === null || valor === '') return null;
  return validar.idEntero(valor, 'ID de la estantería');
};

/**
 * Exige que la estantería exista y tenga un lugar libre. Debe llamarse dentro de
 * la transacción que guarda el rollo: el bloqueo se mantiene hasta su COMMIT, y el
 * conteo es una consulta posterior al bloqueo para ver lo que confirmó la anterior.
 */
const reservarLugar = async (id, client) => {
  const estanteria = await estanteriaRepository.buscarPorIdParaActualizar(id, client);
  if (!estanteria) {
    throw AppError.badRequest(`La estantería con ID ${id} no existe.`);
  }

  const ocupacion = await estanteriaRepository.contarOcupacion(id, client);
  if (ocupacion >= estanteria.capacidad) {
    throw AppError.conflict(
      `Estantería llena: ${estanteria.codigo} ya tiene ${ocupacion} de ${estanteria.capacidad} rollos.`
    );
  }
};

module.exports = { listar, crear, leerId, reservarLugar };
