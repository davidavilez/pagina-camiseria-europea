const AppError = require('../utils/AppError');

// Códigos de error de PostgreSQL que traducimos a mensajes de negocio.
const PG_ERRORES = {
  23505: { status: 409, message: 'Ya existe un registro con ese valor único.' },
  23503: { status: 409, message: 'La operación viola una relación entre registros.' },
  23514: { status: 400, message: 'Los datos no cumplen las reglas del inventario.' },
};

const rutaNoEncontrada = (req, res, next) => {
  next(AppError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
const manejadorErrores = (error, req, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.status).json({ error: error.message });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' });
  }

  const pg = PG_ERRORES[error.code];
  if (pg) {
    return res.status(pg.status).json({ error: pg.message });
  }

  // Nunca exponemos detalles internos al cliente.
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, error);
  return res.status(500).json({ error: 'Ocurrió un error interno. Intenta nuevamente.' });
};

module.exports = { rutaNoEncontrada, manejadorErrores };
