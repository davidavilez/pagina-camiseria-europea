const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto de usuario antes de insertarlo en HTML (correos y páginas). */
const escaparHtml = (valor) => String(valor ?? '').replace(/[&<>"']/g, (c) => ENTIDADES[c]);

/** Página HTML mínima para respuestas que se abren desde un enlace de correo. */
const paginaSimple = ({ titulo, mensaje, exito = true }) => `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escaparHtml(titulo)}</title></head>
<body style="margin:0;font-family:system-ui,Segoe UI,Roboto,sans-serif;background:#f1f5f9;color:#0f172a">
  <main style="max-width:480px;margin:12vh auto;padding:28px;background:#fff;border-radius:12px;border-top:4px solid ${exito ? '#16a34a' : '#dc2626'}">
    <p style="margin:0;color:#64748b;font-size:12px;letter-spacing:.08em">CAMISERÍA EUROPEA · INVENTARIO QR</p>
    <h1 style="font-size:22px;color:#1e3a8a">${escaparHtml(titulo)}</h1>
    <p style="line-height:1.5">${mensaje}</p>
  </main>
</body>
</html>`;

module.exports = { escaparHtml, paginaSimple };
