const auditoriaService = require('../services/auditoria.service');

const listarCortes = async (req, res) => {
  res.json(await auditoriaService.listarCortes({ limite: req.query.limite }));
};

module.exports = { listarCortes };
