const rolloService = require('../services/rollo.service');

const listar = async (req, res) => {
  res.json(await rolloService.listar(req.query));
};

const resumen = async (req, res) => {
  res.json(await rolloService.resumen(req.query));
};

const opcionesFiltro = async (req, res) => {
  res.json(await rolloService.opcionesFiltro());
};

const catalogoColores = (req, res) => {
  res.json(rolloService.catalogoColores());
};

const obtenerPorId = async (req, res) => {
  res.json(await rolloService.obtenerPorId(req.params.id));
};

const crear = async (req, res) => {
  res.status(201).json(await rolloService.crear(req.body ?? {}));
};

const reabastecer = async (req, res) => {
  res.json(await rolloService.reabastecer(req.params.id, req.body ?? {}));
};

const obtenerEtiqueta = async (req, res) => {
  res.json(await rolloService.obtenerEtiqueta(req.params.id));
};

module.exports = { listar, resumen, opcionesFiltro, catalogoColores, obtenerPorId, crear, reabastecer, obtenerEtiqueta };
