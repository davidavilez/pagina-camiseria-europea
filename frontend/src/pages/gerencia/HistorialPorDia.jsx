import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import usePolling from '../../hooks/usePolling';
import { listarCortesAuditoria } from '../../api/auditoria.api';
import Alerta from '../../components/Alerta';
import { formatearHoraColombia, formatearMetros, hoyEnColombia } from '../../utils/formato';

const REFRESCO = 30000;

/**
 * Calendario de cortes: muestra los cortes de un día (hora de Colombia).
 * Cada respuesta se etiqueta con su fecha para no mostrar los cortes del
 * día anterior mientras llega la consulta del día recién elegido.
 */
export default function HistorialPorDia() {
  const hoy = hoyEnColombia();
  const [fecha, setFecha] = useState(hoy);
  const { datos, error } = usePolling(
    async () => ({ fecha, cortes: await listarCortesAuditoria(fecha) }), REFRESCO, fecha
  );

  const cortes = datos?.fecha === fecha ? datos.cortes : null;
  const metrosDelDia = Math.round((cortes ?? []).reduce((s, c) => s + c.metros_cortados, 0) * 100) / 100;

  let contenido;
  if (!cortes && error) {
    contenido = <Alerta>{error}</Alerta>;
  } else if (!cortes) {
    contenido = <p className="vacio">Cargando cortes del día...</p>;
  } else if (cortes.length === 0) {
    contenido = <p className="vacio">No hubo cortes este día</p>;
  } else {
    contenido = (
      <div className="tabla-scroll">
        <table className="tabla tabla--tarjetas">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Operario</th>
              <th>Rollo/SKU</th>
              <th>Tela</th>
              <th>Color</th>
              <th className="num">Metros</th>
            </tr>
          </thead>
          <tbody>
            {cortes.map((c) => (
              <tr key={c.id}>
                <td data-label="Hora" className="mono">{formatearHoraColombia(c.fecha_corte)}</td>
                <td data-label="Operario">{c.operario_nombre}</td>
                <td data-label="Rollo/SKU" className="fuerte">{c.codigo_sku}</td>
                <td data-label="Tela">{c.tipo_tela}</td>
                <td data-label="Color">{c.color}</td>
                <td data-label="Metros" className="num fuerte">{formatearMetros(c.metros_cortados)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="grafico historial-dia">
      <div className="historial-dia-cabecera">
        <h3><CalendarDays size={16} /> Historial por día</h3>
        <label className="selector-etiqueta">
          Fecha
          <input
            type="date"
            className="selector"
            value={fecha}
            max={hoy}
            required
            onChange={(e) => { if (e.target.value) setFecha(e.target.value); }}
          />
        </label>
      </div>

      {cortes && (
        <p className="tenue historial-dia-totales">
          <b>{cortes.length}</b> {cortes.length === 1 ? 'corte' : 'cortes'} · <b>{formatearMetros(metrosDelDia)}</b> cortados
        </p>
      )}

      {contenido}
    </section>
  );
}
