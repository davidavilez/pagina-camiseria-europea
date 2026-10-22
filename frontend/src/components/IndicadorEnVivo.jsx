import { formatearHora } from '../utils/formato';

export default function IndicadorEnVivo({ ultimaActualizacion, error }) {
  return (
    <span className={`en-vivo ${error ? 'en-vivo--error' : ''}`} title={error || undefined}>
      <span className="en-vivo-punto" />
      {error ? 'Sin conexión' : `En vivo · ${formatearHora(ultimaActualizacion)}`}
    </span>
  );
}
