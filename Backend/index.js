const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

const jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// Conexión a PostgreSQL (Docker)
const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'inventario_telas',
  password: 'password123',
  port: 5432,
});

const autenticar = (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Inicia sesión para continuar.' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.usuario = {
      id: Number(payload.sub),
      nombre: payload.nombre,
      email: payload.email,
      rol: payload.rol,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'La sesión venció. Inicia sesión nuevamente.' });
  }
};

const permitirRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario.rol)) {
    return res.status(403).json({ error: 'No tienes permiso para acceder a esta función.' });
  }
  next();
};

app.post('/api/auth/register', async (req, res) => {
  const { nombre, email, password, rol, codigoGerencia } = req.body;
  const nombreLimpio = typeof nombre === 'string' ? nombre.trim() : '';
  const emailLimpio = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (nombreLimpio.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
    return res.status(400).json({ error: 'Ingresa un nombre y correo válidos.' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  }
  if (!['operario', 'gerencia'].includes(rol)) {
    return res.status(400).json({ error: 'Selecciona un rol válido.' });
  }
  if (rol === 'gerencia' && (!process.env.MANAGER_REGISTRATION_CODE || codigoGerencia !== process.env.MANAGER_REGISTRATION_CODE)) {
    return res.status(403).json({ error: 'El código de registro de gerencia no es válido.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol',
      [nombreLimpio, emailLimpio, passwordHash, rol],
    );
    const usuario = result.rows[0];
    const token = jwt.sign(
      { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      jwtSecret,
      { subject: String(usuario.id), expiresIn: '8h' },
    );
    return res.status(201).json({ usuario, token });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
    }
    console.error('Error al registrar usuario:', error.message);
    return res.status(500).json({ error: 'No se pudo crear la cuenta.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  try {
    const result = await pool.query(
      'SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE email = $1',
      [email],
    );
    const usuario = result.rows[0];
    if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    const datosUsuario = { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
    const token = jwt.sign(
      { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      jwtSecret,
      { subject: String(usuario.id), expiresIn: '8h' },
    );
    return res.json({ usuario: datosUsuario, token });
  } catch (error) {
    console.error('Error al iniciar sesión:', error.message);
    return res.status(500).json({ error: 'No se pudo iniciar sesión.' });
  }
});

app.get('/api/auth/me', autenticar, (req, res) => {
  res.json({ usuario: req.usuario });
});

// Endpoint 1: Ver todos los rollos (Para el Dashboard Gerencial)
app.get('/api/rollos', autenticar, permitirRoles('gerencia'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rollos ORDER BY fecha_ingreso DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint 2: Descontar metraje (El que usará el operario al escanear)
app.post('/api/cortes', autenticar, permitirRoles('operario'), async (req, res) => {
  const { codigo_qr, metros_cortados } = req.body;
  const cantidad = Number(metros_cortados);
  if (typeof codigo_qr !== 'string' || !Number.isFinite(cantidad) || cantidad <= 0) {
    return res.status(400).json({ error: 'Ingresa un código QR y una cantidad válida.' });
  }
  
  try {
    // 1. Validar que el rollo exista
    const rolloQuery = await pool.query('SELECT id, metraje_actual FROM rollos WHERE codigo_qr = $1', [codigo_qr.trim()]);
    if (rolloQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Rollo no encontrado en la bodega' });
    }
    
    const rollo = rolloQuery.rows[0];
    const nuevo_metraje = rollo.metraje_actual - cantidad;

    // 2. Validar que haya tela suficiente
    if (nuevo_metraje < 0) {
        return res.status(400).json({ error: `Metraje insuficiente. Solo quedan ${rollo.metraje_actual} metros.` });
    }

    // 3. Actualizar el saldo del rollo y guardar el historial (Transacción)
    await pool.query('UPDATE rollos SET metraje_actual = $1 WHERE id = $2', [nuevo_metraje, rollo.id]);
    await pool.query('INSERT INTO cortes (rollo_id, metros_cortados, operario_id) VALUES ($1, $2, $3)', [rollo.id, cantidad, req.usuario.email]);

    res.json({ 
        mensaje: 'Corte registrado con éxito', 
        metros_descontados: cantidad,
        nuevo_saldo: nuevo_metraje 
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;

async function iniciarServidor() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      email VARCHAR(254) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      rol VARCHAR(20) NOT NULL CHECK (rol IN ('operario', 'gerencia')),
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  app.listen(PORT, () => {
    console.log(`Servidor de Camisería Europea corriendo en http://localhost:${PORT}`);
  });
}

iniciarServidor().catch((error) => {
  console.error('No se pudo iniciar el backend. Verifica que PostgreSQL esté encendido:', error.message);
  process.exit(1);
});