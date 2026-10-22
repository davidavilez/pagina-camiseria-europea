import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

let contador = 0;

/**
 * Lector QR con la cámara trasera. Llama a `onLectura(texto)` una sola vez.
 * Cada montaje crea su propio nodo DOM para que el doble montaje de
 * StrictMode no deje dos lectores compitiendo por el mismo elemento.
 */
export default function EscanerQR({ onLectura }) {
  const contenedorRef = useRef(null);
  const onLecturaRef = useRef(onLectura);
  const [error, setError] = useState('');

  useEffect(() => {
    onLecturaRef.current = onLectura;
  });

  useEffect(() => {
    const nodo = document.createElement('div');
    nodo.id = `lector-qr-${++contador}`;
    contenedorRef.current.appendChild(nodo);

    const lector = new Html5Qrcode(nodo.id, { verbose: false });
    let leido = false;

    const arranque = lector.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (texto) => {
        if (leido) return;
        leido = true;
        onLecturaRef.current(texto);
      },
      () => {}
    ).catch(() => {
      setError('No se pudo acceder a la cámara. Revisa los permisos o ingresa el ID manualmente.');
    });

    return () => {
      arranque
        .then(() => (lector.isScanning ? lector.stop() : null))
        .catch(() => {})
        .finally(() => nodo.remove());
    };
  }, []);

  return (
    <div className="escaner">
      <div ref={contenedorRef} className="escaner-video" />
      {error && <p className="escaner-error">{error}</p>}
    </div>
  );
}
