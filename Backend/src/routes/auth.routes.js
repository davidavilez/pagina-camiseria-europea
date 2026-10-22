const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = Router();

// No existe /register: las cuentas solo las crea gerencia en /api/usuarios.
router.post('/login', authController.login);
router.get('/me', autenticar, authController.perfil);

module.exports = router;
