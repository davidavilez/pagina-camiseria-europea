import { Printer } from 'lucide-react';
import { formatearFecha, formatearMetros } from '../utils/formato';

/** Etiqueta lista para imprimir. El CSS de impresión oculta todo lo demás. */
export default function EtiquetaQR({ rollo, qr }) {
  return (
    <div className="etiqueta-contenedor">
      <div className="etiqueta zona-impresion">
        <p className="etiqueta-marca">CAMISERÍA EUROPEA</p>
        <img src={qr} alt={`Código QR del rollo ${rollo.codigo_sku}`} className="etiqueta-qr" />
        <p className="etiqueta-sku">{rollo.codigo_sku}</p>
        <dl className="etiqueta-datos">
          <div><dt>ID</dt><dd>#{rollo.id}</dd></div>
          <div><dt>Tela</dt><dd>{rollo.tipo_tela}</dd></div>
          <div><dt>Color</dt><dd>{rollo.color}</dd></div>
          <div><dt>Metraje</dt><dd>{formatearMetros(rollo.metraje_inicial)}</dd></div>
          <div><dt>Ingreso</dt><dd>{formatearFecha(rollo.fecha_ingreso)}</dd></div>
        </dl>
      </div>
      <button type="button" className="btn btn--primario" onClick={() => window.print()}>
        <Printer size={16} /> Imprimir etiqueta
      </button>
    </div>
  );
}
