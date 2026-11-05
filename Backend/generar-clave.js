const crypto = require('crypto');

// AQUÍ ES DONDE PONES TU CONTRASEÑA EN TEXTO NORMAL
const miContrasena = '2313'; // Cámbialo por la que tú quieras

const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(miContrasena, salt, 64).toString('hex');
console.log(`${salt}:${hash}`);