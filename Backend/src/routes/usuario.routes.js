const { Router } = require('express');
const usuarioController = require('../controllers/usuario.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

const router = Router();

// Pública: la autoriza el token de un solo uso que recibe el Súper Administrador por correo.
router.get('/aprobar/:token', usuarioController.aprobar);

router.use(autenticar, autorizar('usuarios:gestionar'));

router.get('/', usuarioController.listar);
router.post('/', usuarioController.crear);
router.patch('/:id/estado', usuarioController.cambiarEstado);

module.exports = router;
