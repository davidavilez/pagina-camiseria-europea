const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

const autenticar = (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Inicia sesión para continuar.' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.usuario = {
      id: Number(payload.sub),
      nombre: payload.nombre,
      email: payload.email,
      rol: payload.rol,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'La sesión venció. Inicia sesión nuevamente.' });
  }
};

const permitirRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario.rol)) {
    return res.status(403).json({ error: 'No tienes permiso para acceder a esta función.' });
  }
  next();
};

module.exports = { autenticar, permitirRoles };