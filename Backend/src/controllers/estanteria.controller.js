const estanteriaService = require('../services/estanteria.service');

const listar = async (req, res) => {
  res.json(await estanteriaService.listar());
};

const crear = async (req, res) => {
  res.status(201).json(await estanteriaService.crear(req.body ?? {}));
};

module.exports = { listar, crear };
