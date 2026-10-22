const rolloService = require('../services/rollo.service');

const listar = async (req, res) => {
  res.json(await rolloService.listar());
};

const obtenerPorId = async (req, res) => {
  res.json(await rolloService.obtenerPorId(req.params.id));
};

const crear = async (req, res) => {
  res.status(201).json(await rolloService.crear(req.body ?? {}));
};

const obtenerEtiqueta = async (req, res) => {
  res.json(await rolloService.obtenerEtiqueta(req.params.id));
};

module.exports = { listar, obtenerPorId, crear, obtenerEtiqueta };
