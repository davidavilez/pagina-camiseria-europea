const auditoriaService = require('../services/auditoria.service');

const listarCortes = async (req, res) => {
  res.json(await auditoriaService.listarCortes({ limite: req.query.limite, fecha: req.query.fecha }));
};

module.exports = { listarCortes };
