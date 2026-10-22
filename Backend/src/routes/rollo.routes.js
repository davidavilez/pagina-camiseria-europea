const { Router } = require('express');
const rolloController = require('../controllers/rollo.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

const router = Router();

router.use(autenticar);

router.get('/', autorizar('rollos:listar'), rolloController.listar);
router.post('/', autorizar('rollos:crear'), rolloController.crear);
router.get('/:id/etiqueta', autorizar('rollos:etiqueta'), rolloController.obtenerEtiqueta);
// El operario consulta la ficha del rollo tras escanear su QR.
router.get('/:id', autorizar('rollos:consultar'), rolloController.obtenerPorId);

module.exports = router;
