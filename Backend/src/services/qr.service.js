const QRCode = require('qrcode');

/**
 * Genera el QR del rollo como imagen PNG (data URL base64).
 * El QR contiene únicamente el ID único del rollo; la vista del operario
 * lo lee y consulta la ficha completa al backend.
 */
const generarQrRollo = (rolloId) => QRCode.toDataURL(String(rolloId), {
  errorCorrectionLevel: 'H',
  margin: 2,
  width: 320,
});

module.exports = { generarQrRollo };
