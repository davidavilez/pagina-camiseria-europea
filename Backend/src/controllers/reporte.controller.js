const reporteService = require('../services/reporte.service');

const consumo = async (req, res) => {
  res.json(await reporteService.consumo({ rango: req.query.rango }));
};

module.exports = { consumo };
