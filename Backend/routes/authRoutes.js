const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/authController');
const { autenticar, permitirRoles } = require('../seguridad/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', autenticar, me);

module.exports = router;