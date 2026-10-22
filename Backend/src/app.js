const express = require('express');
const cors = require('cors');
const { corsOrigin } = require('./config/env');
const apiRoutes = require('./routes');
const { rutaNoEncontrada, manejadorErrores } = require('./middlewares/error.middleware');

const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: corsOrigin.split(',').map((origen) => origen.trim()) }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ estado: 'ok' }));
app.use('/api', apiRoutes);

app.use(rutaNoEncontrada);
app.use(manejadorErrores);

module.exports = app;
