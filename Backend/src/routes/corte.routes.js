const { Router } = require('express');
const corteController = require('../controllers/corte.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/', autenticar, autorizar('cortes:registrar'), corteController.registrar);

module.exports = router;
