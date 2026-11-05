const corteService = require('../services/corte.service');

const registrar = async (req, res) => {
  res.status(201).json(await corteService.registrarCorte(req.body ?? {}, req.usuario));
};

module.exports = { registrar };
