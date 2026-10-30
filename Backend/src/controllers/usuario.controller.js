const usuarioService = require('../services/usuario.service');
const { escaparHtml, paginaSimple } = require('../utils/html');

const listar = async (req, res) => {
  res.json(await usuarioService.listar());
};

const crear = async (req, res) => {
  res.status(201).json(await usuarioService.crear(req.body ?? {}));
};

const cambiarEstado = async (req, res) => {
  const usuario = await usuarioService.cambiarEstadoUsuario(req.params.id, req.body?.estado);
  res.json({ usuario, mensaje: `El estado del usuario ahora es ${usuario.estado}.` });
};

/** Se abre desde el correo del Súper Administrador: responde con una página HTML. */
const aprobar = async (req, res) => {
  const usuario = await usuarioService.aprobarPorToken(req.params.token);

  if (!usuario) {
    return res.status(404).type('html').send(paginaSimple({
      titulo: 'Enlace no válido',
      mensaje: 'El enlace de aprobación no existe o ya fue utilizado.',
      exito: false,
    }));
  }

  return res.type('html').send(paginaSimple({
    titulo: 'Acceso aprobado',
    mensaje: `La cuenta de <b>${escaparHtml(usuario.nombre)}</b> (${escaparHtml(usuario.email)}) ` +
      'quedó activa. Ya puede iniciar sesión.',
  }));
};

module.exports = { listar, crear, cambiarEstado, aprobar };
