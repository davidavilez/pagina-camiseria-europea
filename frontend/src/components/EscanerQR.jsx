import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

let contador = 0;

// Promesa que se resuelve cuando el lector anterior soltó la cámara. Cada lector
// nuevo la espera antes de arrancar: así nunca hay dos aperturas simultáneas
// (StrictMode monta dos veces y muchos celulares rechazan la segunda apertura).
let camaraLiberada = Promise.resolve();

/** Traduce el error del navegador / html5-qrcode a una instrucción para el operario. */
const mensajeDeCamara = (error) => {
  const texto = String(error?.name ?? '') + ' ' + String(error?.message ?? error);
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    return 'El navegador bloquea la cámara porque la página no se abrió con HTTPS. ' +
      'Ábrela con https:// (o desde localhost en el computador).';
  }
  if (/NotAllowedError|Permission|denied/i.test(texto)) {
    return 'Permiso de cámara denegado. Habilítalo en los ajustes del sitio (ícono del candado) y recarga la página.';
  }
  if (/NotFoundError|OverconstrainedError|Requested device not found/i.test(texto)) {
    return 'No se encontró una cámara en este dispositivo. Ingresa el ID manualmente.';
  }
  if (/NotReadableError|TrackStartError|Could not start video source/i.test(texto)) {
    return 'La cámara está siendo usada por otra aplicación o pestaña. Ciérrala e inténtalo de nuevo.';
  }
  return 'No se pudo iniciar la cámara. Ingresa el ID manualmente.';
};

/**
 * Lector QR con la cámara trasera. Llama a `onLectura(texto)` una sola vez.
 * Cada montaje crea su propio nodo DOM (ya insertado en el documento antes de
 * arrancar) para que el doble montaje de StrictMode no comparta elemento.
 */
export default function EscanerQR({ onLectura }) {
  const contenedorRef = useRef(null);
  const onLecturaRef = useRef(onLectura);
  const [error, setError] = useState('');
  const [reintento, setReintento] = useState(0);

  useEffect(() => {
    onLecturaRef.current = onLectura;
  });

  useEffect(() => {
    let desmontado = false;
    const nodo = document.createElement('div');
    nodo.id = `lector-qr-${++contador}`;
    contenedorRef.current.appendChild(nodo);

    const lector = new Html5Qrcode(nodo.id, { verbose: false });
    let leido = false;

    const arranque = camaraLiberada
      .then(() => {
        // Desmontado mientras esperaba su turno (primer montaje de StrictMode): no abre la cámara.
        if (desmontado) return;
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          throw new Error('Contexto no seguro');
        }
        setError('');
        return lector.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: (ancho, alto) => {
            const lado = Math.max(150, Math.floor(Math.min(ancho, alto) * 0.7));
            return { width: lado, height: lado };
          } },
          (texto) => {
            if (leido) return;
            leido = true;
            onLecturaRef.current(texto);
          },
          () => {}
        );
      })
      .catch((err) => {
        if (!desmontado) setError(mensajeDeCamara(err));
      });

    return () => {
      desmontado = true;
      // Se apaga la cámara (cuando termine de arrancar, si estaba arrancando) y
      // recién entonces el siguiente lector puede abrirla.
      camaraLiberada = arranque
        .then(() => (lector.isScanning ? lector.stop() : null))
        .catch(() => {})
        .finally(() => nodo.remove());
    };
  }, [reintento]);

  return (
    <div className="escaner">
      <div ref={contenedorRef} className="escaner-video" />
      {error && (
        <div className="escaner-error">
          <p>{error}</p>
          <button type="button" className="btn btn--secundario" onClick={() => setReintento((n) => n + 1)}>
            Reintentar cámara
          </button>
        </div>
      )}
    </div>
  );
}
