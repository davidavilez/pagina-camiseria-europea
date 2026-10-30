const { Router } = require('express');
const rolloController = require('../controllers/rollo.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

const router = Router();

router.use(autenticar);

// GET /api/rollos?search=...&buscar_por=codigo|tela&color=...&tipo_tela=...  (filtros acumulativos y opcionales)
router.get('/', autorizar('rollos:listar'), rolloController.listar);
// Mismos filtros: metros disponibles agrupados por tela y color.
router.get('/resumen', autorizar('rollos:listar'), rolloController.resumen);
router.get('/filtros', autorizar('rollos:listar'), rolloController.opcionesFiltro);
router.get('/catalogo-colores', autorizar('rollos:crear'), rolloController.catalogoColores);
router.post('/', autorizar('rollos:crear'), rolloController.crear);
router.patch('/:id/reabastecer', autorizar('rollos:crear'), rolloController.reabastecer);
router.get('/:id/etiqueta', autorizar('rollos:etiqueta'), rolloController.obtenerEtiqueta);
// El operario consulta la ficha del rollo tras escanear su QR.
router.get('/:id', autorizar('rollos:consultar'), rolloController.obtenerPorId);

module.exports = router;
