const { Router } = require('express');
const reporteController = require('../controllers/reporte.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

const router = Router();

// GET /api/reportes/consumo?rango=diario|semanal|quincenal|mensual
router.get('/consumo', autenticar, autorizar('reportes:ver'), reporteController.consumo);

module.exports = router;
