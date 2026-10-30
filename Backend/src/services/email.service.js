const nodemailer = require('nodemailer');
const { smtp, apiUrl, frontendUrl, superAdminEmail, alertasStockEmail } = require('../config/env');
const { escaparHtml } = require('../utils/html');
const { formatearMetros } = require('../utils/formato');

const smtpConfigurado = Boolean(smtp.user && smtp.pass);

const transporter = smtpConfigurado
  ? nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  })
  : null;

if (!smtpConfigurado) {
  console.warn(
    '[correo] SMTP_USER / SMTP_PASS no están configurados en Backend/.env: ' +
    'los correos (credenciales, aprobaciones y alertas) no se enviarán.'
  );
}

const plantilla = (titulo, cuerpo) => `
  <div style="font-family:Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
    <p style="color:#64748b;font-size:12px;letter-spacing:.08em">CAMISERÍA EUROPEA · INVENTARIO QR</p>
    <h2 style="color:#1e3a8a">${escaparHtml(titulo)}</h2>
    ${cuerpo}
  </div>`;

const boton = (url, texto, color = '#2563eb') => `
  <p><a href="${escaparHtml(url)}" style="display:inline-block;padding:12px 20px;border-radius:8px;
     background:${color};color:#fff;text-decoration:none;font-weight:600">${escaparHtml(texto)}</a></p>`;

/** Envía un correo. Lanza error si falla: quien llama decide si lo ignora. */
const enviar = async ({ para, asunto, html }) => {
  if (!smtpConfigurado) {
    throw new Error('SMTP no configurado.');
  }
  if (!para) {
    throw new Error(`No hay destinatario configurado para "${asunto}".`);
  }
  await transporter.sendMail({ from: `"Inventario Camisería Europea" <${smtp.user}>`, to: para, subject: asunto, html });
};

/** Credenciales para el usuario recién creado (aún pendiente de aprobación). */
const enviarCredenciales = ({ nombre, email, rol }, password) => enviar({
  para: email,
  asunto: 'Tu cuenta en el Inventario QR de Camisería Europea',
  html: plantilla(`Hola, ${nombre}`, `
    <p>Gerencia creó tu cuenta con el rol <b>${escaparHtml(rol)}</b>. Estos son tus datos de acceso:</p>
    <table style="border-collapse:collapse">
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Correo</td><td><b>${escaparHtml(email)}</b></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Contraseña</td><td><b>${escaparHtml(password)}</b></td></tr>
    </table>
    <p>La cuenta se habilitará cuando el Súper Administrador apruebe tu ingreso.
       Inicia sesión una vez para solicitar la aprobación.</p>
    ${boton(`${frontendUrl}/login`, 'Ir al inicio de sesión')}`),
});

/** Enlace de aprobación al Súper Administrador. */
const enviarSolicitudAprobacion = ({ nombre, email, rol }, token) => enviar({
  para: superAdminEmail,
  asunto: `Aprobación pendiente: ${nombre} (${rol})`,
  html: plantilla('Solicitud de acceso', `
    <p><b>${escaparHtml(nombre)}</b> (${escaparHtml(email)}) intentó ingresar con el rol
       <b>${escaparHtml(rol)}</b>, pero su cuenta está pendiente de aprobación.</p>
    <p>Si reconoces a esta persona, aprueba su acceso:</p>
    ${boton(`${apiUrl}/api/usuarios/aprobar/${encodeURIComponent(token)}`, 'Aprobar acceso', '#16a34a')}
    <p style="color:#64748b;font-size:12px">Si no reconoces esta solicitud, ignora este correo: la cuenta seguirá bloqueada.</p>`),
});

/** Alerta de urgencia: el rollo llegó a su stock mínimo. */
const enviarAlertaStock = (rollo) => enviar({
  para: alertasStockEmail,
  asunto: `⚠ Stock crítico: rollo ${rollo.codigo_sku} (${rollo.tipo_tela} ${rollo.color})`,
  html: plantilla('Alerta de stock crítico', `
    <p>El rollo <b>${escaparHtml(rollo.codigo_sku)}</b> (#${rollo.id}) bajó a su stock mínimo y debe reabastecerse.</p>
    <table style="border-collapse:collapse">
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Tela</td><td>${escaparHtml(rollo.tipo_tela)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Color</td><td>${escaparHtml(rollo.color)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Saldo actual</td><td><b style="color:#b91c1c">${formatearMetros(rollo.metraje_actual)}</b></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Stock mínimo</td><td>${formatearMetros(rollo.stock_minimo)}</td></tr>
    </table>
    ${boton(`${frontendUrl}/gerencia?tab=inventario`, 'Ver inventario', '#b91c1c')}`),
});

module.exports = { enviarCredenciales, enviarSolicitudAprobacion, enviarAlertaStock };
