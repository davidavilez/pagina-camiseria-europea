const express = require('express');
const cors = require('cors');
// const { corsOrigin } = require('./config/env');
const apiRoutes = require('./routes');
const { rutaNoEncontrada, manejadorErrores } = require('./middlewares/error.middleware');

const app = express();

app.disable('x-powered-by');
// TEMPORAL: presentación remota, revertir después (restaurar la línea comentada y el require de corsOrigin).
// app.use(cors({ origin: corsOrigin.split(',').map((origen) => origen.trim()) }));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ estado: 'ok' }));
app.use('/api', apiRoutes);

app.use(rutaNoEncontrada);
app.use(manejadorErrores);

module.exports = app;
