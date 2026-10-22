import usePolling from '../../hooks/usePolling';
import { listarCortesAuditoria } from '../../api/auditoria.api';
import IndicadorEnVivo from '../../components/IndicadorEnVivo';
import { formatearFecha, formatearMetros } from '../../utils/formato';

export default function AuditoriaTab() {
  const { datos: cortes, error, cargando, ultimaActualizacion } = usePolling(listarCortesAuditoria);

  return (
    <>
      <div className="barra-herramientas">
        <p className="barra-titulo">Trazabilidad de cortes {cortes ? `· ${cortes.length} registros` : ''}</p>
        <IndicadorEnVivo ultimaActualizacion={ultimaActualizacion} error={error} />
      </div>

      {cargando ? <p className="vacio">Cargando historial...</p> : (
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha del corte</th>
                <th>ID rollo</th>
                <th>Rollo</th>
                <th className="num">Metros descontados</th>
                <th className="num">Saldo restante</th>
                <th>Operario</th>
              </tr>
            </thead>
            <tbody>
              {(cortes ?? []).map((c) => (
                <tr key={c.id}>
                  <td>{formatearFecha(c.fecha_corte)}</td>
                  <td className="mono">#{c.rollo_id}</td>
                  <td><span className="fuerte">{c.codigo_sku}</span> <span className="tenue">· {c.tipo_tela} {c.color}</span></td>
                  <td className="num texto-rojo">−{formatearMetros(c.metros_cortados)}</td>
                  <td className="num fuerte">{formatearMetros(c.saldo_restante)}</td>
                  <td>{c.operario_nombre}</td>
                </tr>
              ))}
              {cortes?.length === 0 && <tr><td colSpan={6} className="vacio">Todavía no se han registrado cortes.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
