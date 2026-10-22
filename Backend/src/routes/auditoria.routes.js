const { Router } = require('express');
const auditoriaController = require('../controllers/auditoria.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

const router = Router();

router.get('/cortes', autenticar, autorizar('auditoria:ver'), auditoriaController.listarCortes);

module.exports = router;
