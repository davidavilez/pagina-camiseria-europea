const { Router } = require('express');

const router = Router();

router.use('/auth', require('./auth.routes'));
router.use('/usuarios', require('./usuario.routes'));
router.use('/rollos', require('./rollo.routes'));
router.use('/cortes', require('./corte.routes'));
router.use('/auditoria', require('./auditoria.routes'));
router.use('/reportes', require('./reporte.routes'));

module.exports = router;
