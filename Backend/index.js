const express = require('express');
const cors = require('cors');
const { port } = require('./config/env');
const { iniciarBaseDeDatos } = require('./config/db');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Conectar rutas
app.use('/api/auth', authRoutes);
app.use('/api', inventarioRoutes);

// Iniciar servidor y base de datos
const arrancarServidor = async () => {
  try {
    await iniciarBaseDeDatos();
    app.listen(port, () => {
      console.log(`Servidor de Camisería Europea corriendo por capas en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el backend. Verifica que PostgreSQL esté encendido:', error.message);
    process.exit(1);
  }
};

arrancarServidor();