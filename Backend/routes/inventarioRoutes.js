const express = require('express');
const router = express.Router();
const { obtenerRollos, descontarMetraje } = require('../controllers/inventarioController');
const { autenticar, permitirRoles } = require('../middlewares/authMiddleware');

router.get('/rollos', autenticar, permitirRoles('gerencia'), obtenerRollos);
router.post('/cortes', autenticar, permitirRoles('operario'), descontarMetraje);

module.exports = router;