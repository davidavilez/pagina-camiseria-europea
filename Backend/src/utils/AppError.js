/** Error de negocio con código HTTP; su mensaje es seguro de mostrar al cliente. */
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }

  static badRequest(message) { return new AppError(400, message); }
  static unauthorized(message) { return new AppError(401, message); }
  static forbidden(message) { return new AppError(403, message); }
  static notFound(message) { return new AppError(404, message); }
  static conflict(message) { return new AppError(409, message); }
}

module.exports = AppError;
