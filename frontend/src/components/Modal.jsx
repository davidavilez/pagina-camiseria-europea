import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ titulo, onCerrar, children, ancho = 480 }) {
  useEffect(() => {
    const alPresionar = (event) => { if (event.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [onCerrar]);

  return (
    <div className="modal-fondo" onMouseDown={(event) => { if (event.target === event.currentTarget) onCerrar(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" style={{ maxWidth: ancho }}>
        <header className="modal-cabecera">
          <h3 id="modal-titulo">{titulo}</h3>
          <button type="button" className="btn-icono" onClick={onCerrar} aria-label="Cerrar"><X size={18} /></button>
        </header>
        <div className="modal-cuerpo">{children}</div>
      </div>
    </div>
  );
}
