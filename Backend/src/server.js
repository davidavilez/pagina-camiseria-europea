const app = require('./app');
const { port, apiUrl, frontendUrl } = require('./config/env');
const { verificarConexion } = require('./config/db');

const arrancarServidor = async () => {
  try {
    await verificarConexion();
  } catch (error) {
    console.error('No se pudo conectar a PostgreSQL. ¿Está encendido el contenedor?', error.message);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`API de Camisería Europea en http://localhost:${port}/api`);
    // Base de los enlaces que viajan por correo: debe ser accesible desde el celular.
    console.log(`Enlaces de correo -> aprobación: ${apiUrl}/api/usuarios/aprobar/... · login: ${frontendUrl}/login`);
  });
};

arrancarServidor();
