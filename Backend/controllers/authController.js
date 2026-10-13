const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, managerCode } = require('../config/env');
const { crearUsuario, buscarUsuarioPorEmail } = require('../models/authModel');

const register = async (req, res) => {
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
  if (rol === 'gerencia' && (!managerCode || codigoGerencia !== managerCode)) {
    return res.status(403).json({ error: 'El código de registro de gerencia no es válido.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const usuario = await crearUsuario(nombreLimpio, emailLimpio, passwordHash, rol);
    
    const token = jwt.sign(
      { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      jwtSecret,
      { subject: String(usuario.id), expiresIn: '8h' }
    );
    return res.status(201).json({ usuario, token });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
    }
    console.error('Error al registrar usuario:', error.message);
    return res.status(500).json({ error: 'No se pudo crear la cuenta.' });
  }
};

const login = async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  try {
    const usuario = await buscarUsuarioPorEmail(email);
    
    if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    const datosUsuario = { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
    const token = jwt.sign(
      { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      jwtSecret,
      { subject: String(usuario.id), expiresIn: '8h' }
    );
    return res.json({ usuario: datosUsuario, token });
  } catch (error) {
    console.error('Error al iniciar sesión:', error.message);
    return res.status(500).json({ error: 'No se pudo iniciar sesión.' });
  }
};

const me = (req, res) => {
  res.json({ usuario: req.usuario });
};

module.exports = { register, login, me };