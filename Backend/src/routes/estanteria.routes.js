const { Router } = require('express');
const estanteriaController = require('../controllers/estanteria.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

const router = Router();

router.use(autenticar);

router.get('/', autorizar('estanterias:listar'), estanteriaController.listar);
router.post('/', autorizar('estanterias:crear'), estanteriaController.crear);

module.exports = router;
