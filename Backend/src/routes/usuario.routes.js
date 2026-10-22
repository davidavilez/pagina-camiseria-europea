const { Router } = require('express');
const usuarioController = require('../controllers/usuario.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

const router = Router();

router.use(autenticar, autorizar('usuarios:gestionar'));

router.get('/', usuarioController.listar);
router.post('/', usuarioController.crear);

module.exports = router;
