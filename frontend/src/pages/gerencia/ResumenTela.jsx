import { Layers } from 'lucide-react';
import usePolling from '../../hooks/usePolling';
import { obtenerResumenInventario } from '../../api/rollos.api';
import Alerta from '../../components/Alerta';
import { formatearMetros } from '../../utils/formato';

const plural = (n, singular, varios) => `${n} ${n === 1 ? singular : varios}`;

/**
 * Dashboard dinámico de la búsqueda por tipo de tela: solo se monta mientras
 * esa búsqueda está activa y usa los mismos filtros que la tabla.
 */
export default function ResumenTela({ filtros }) {
  const { datos: resumen, error } = usePolling(
    () => obtenerResumenInventario(filtros), undefined, JSON.stringify(filtros)
  );

  if (error && !resumen) return <Alerta>{error}</Alerta>;
  if (!resumen) return <p className="vacio">Calculando existencias...</p>;
  if (resumen.telas.length === 0) return null;

  return (
    <section className="resumen-telas" aria-live="polite">
      {resumen.telas.length > 1 && (
        <p className="tenue">
          {resumen.telas.length} telas coinciden · {formatearMetros(resumen.metros_disponibles)} disponibles en total
        </p>
      )}
      {resumen.telas.map((tela) => (
        <article key={tela.tipo_tela} className="resumen-tela">
          <header className="resumen-tela-cabecera">
            <div>
              <p className="pagina-kicker"><Layers size={12} /> TIPO DE TELA</p>
              <h3>{tela.tipo_tela}</h3>
            </div>
            <div className="resumen-tela-total">
              <strong>{formatearMetros(tela.metros_disponibles)}</strong>
              <span className="tenue">
                disponibles en {plural(tela.rollos_disponibles, 'rollo', 'rollos')}
                {tela.rollos_agotados > 0 && ` · ${plural(tela.rollos_agotados, 'agotado', 'agotados')}`}
              </span>
            </div>
          </header>

          {tela.colores.length === 0 ? (
            <p className="tenue">No quedan rollos con saldo de esta tela.</p>
          ) : (
            <>
              <p className="resumen-tela-subtitulo">{plural(tela.colores.length, 'color disponible', 'colores disponibles')}</p>
              <ul className="resumen-colores">
                {tela.colores.map((c) => (
                  <li key={c.color} className="resumen-color">
                    <span className="fuerte">{c.color}</span>
                    <span className="tenue">{plural(c.rollos, 'rollo', 'rollos')}</span>
                    <strong className="num">{formatearMetros(c.metros)}</strong>
                  </li>
                ))}
              </ul>
            </>
          )}
        </article>
      ))}
    </section>
  );
}
