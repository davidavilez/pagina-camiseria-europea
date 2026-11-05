// Asegúrate de estar dentro de tu carpeta 'Backend'
const QRCode = require('qrcode');

// El dato que queremos ocultar dentro del QR.
// Para que tu diagrama de actividades funcione (FR-02), 
// este texto debería ser el ID único de un rollo en tu tabla PostgreSQL.
const rolloIdParaProbar = "QR-10001"; 

// Generar el código en formato texto (terminal)
QRCode.toString(rolloIdParaProbar, { type: 'terminal' }, function (err, qrText) {
  if (err) {
      console.error("Error al generar el QR:", err);
      return;
  }
  console.log("¡Código generado! Escanéalo con la vista del operario:");
  console.log(qrText);
});   