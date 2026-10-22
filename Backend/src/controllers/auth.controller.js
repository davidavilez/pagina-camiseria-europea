const authService = require('../services/auth.service');

const login = async (req, res) => {
  res.json(await authService.login(req.body ?? {}));
};

const perfil = (req, res) => {
  res.json({ usuario: req.usuario });
};

module.exports = { login, perfil };
