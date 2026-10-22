const usuarioService = require('../services/usuario.service');

const listar = async (req, res) => {
  res.json(await usuarioService.listar());
};

const crear = async (req, res) => {
  res.status(201).json(await usuarioService.crear(req.body ?? {}));
};

module.exports = { listar, crear };
