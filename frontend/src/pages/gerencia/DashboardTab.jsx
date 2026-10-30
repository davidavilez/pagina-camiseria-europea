import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileDown, Snail, Star } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import usePolling from '../../hooks/usePolling';
import { obtenerConsumo } from '../../api/reportes.api';
import IndicadorEnVivo from '../../components/IndicadorEnVivo';
import { formatearFecha, formatearMetros } from '../../utils/formato';

const RANGOS = [
  { valor: 'diario', etiqueta: 'Diario' },
  { valor: 'semanal', etiqueta: 'Semanal' },
  { valor: 'quincenal', etiqueta: 'Quincenal' },
  { valor: 'mensual', etiqueta: 'Mensual' },
];

// Paleta categórica validada (orden fijo, CVD-safe en pares adyacentes); "Otros" en gris neutro.
const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'];
const COLOR_OTROS = '#a8a7a1';
const COLOR_BARRA = SERIES[0];
const TEXTO_SUAVE = '#64748b';
const MAX_SEGMENTOS = 5;
const REFRESCO = 30000;

const porcentaje = (parte, total) => (total > 0 ? `${Math.round((parte / total) * 100)} %` : '—');

function TooltipConsumo({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const { nombre, metros_cortados: metros, cortes } = payload[0].payload;
  return (
    <div className="grafico-tooltip">
      <strong>{nombre}</strong>
      <span>{formatearMetros(metros)} · {porcentaje(metros, total)}</span>
      <span className="tenue">{cortes} {cortes === 1 ? 'corte' : 'cortes'}</span>
    </div>
  );
}

function TarjetaKpi({ Icono, titulo, tela, detalle, variante }) {
  return (
    <div className={`kpi kpi--${variante}`}>
      <span className="kpi-titulo"><Icono size={16} /> {titulo}</span>
      <strong className="kpi-valor">{tela ?? '—'}</strong>
      <span className="tenue">{detalle}</span>
    </div>
  );
}

export default function DashboardTab() {
  const [params, setParams] = useSearchParams();
  const rango = RANGOS.some((r) => r.valor === params.get('rango')) ? params.get('rango') : 'semanal';
  const { datos: reporte, error, cargando, ultimaActualizacion } = usePolling(
    () => obtenerConsumo(rango), REFRESCO, rango
  );

  const cambiarRango = (valor) => setParams((actuales) => {
    const siguientes = new URLSearchParams(actuales);
    siguientes.set('rango', valor);
    return siguientes;
  });

  const { topTelas, segmentosColor } = useMemo(() => {
    if (!reporte) return { topTelas: [], segmentosColor: [] };

    const top = reporte.por_tela
      .filter((t) => t.metros_cortados > 0)
      .slice(0, 5)
      .map((t) => ({ ...t, nombre: t.tipo_tela }));

    // Donut: máximo 5 colores + "Otros" para que siga siendo legible.
    const colores = reporte.por_color.map((c) => ({ ...c, nombre: c.color }));
    const principales = colores.slice(0, MAX_SEGMENTOS).map((c, i) => ({ ...c, relleno: SERIES[i] }));
    const resto = colores.slice(MAX_SEGMENTOS);
    if (resto.length) {
      principales.push({
        nombre: `Otros (${resto.length})`,
        metros_cortados: Math.round(resto.reduce((s, c) => s + c.metros_cortados, 0) * 100) / 100,
        cortes: resto.reduce((s, c) => s + c.cortes, 0),
        relleno: COLOR_OTROS,
      });
    }
    return { topTelas: top, segmentosColor: principales };
  }, [reporte]);

  // jsPDF solo se descarga cuando se pide el reporte.
  const descargarPdf = async () => {
    const { descargarReportePdf } = await import('../../utils/reportePdf');
    descargarReportePdf(reporte, { topTelas, porColor: reporte.por_color });
  };

  const total = reporte?.totales.metros_cortados ?? 0;
  const estrella = reporte?.kpis.tela_estrella;
  const estancada = reporte?.kpis.tela_estancada;

  return (
    <>
      <div className="barra-herramientas">
        <label className="selector-etiqueta">
          Periodo
          <select className="selector" value={rango} onChange={(e) => cambiarRango(e.target.value)}>
            {RANGOS.map((r) => <option key={r.valor} value={r.valor}>{r.etiqueta}</option>)}
          </select>
        </label>
        {reporte && (
          <p className="barra-titulo tenue">{reporte.etiqueta} · {formatearFecha(reporte.desde)} – {formatearFecha(reporte.hasta)}</p>
        )}
        <IndicadorEnVivo ultimaActualizacion={ultimaActualizacion} error={error} />
        <button
          type="button"
          className="btn btn--primario"
          disabled={!reporte}
          onClick={descargarPdf}
        >
          <FileDown size={16} /> Descargar Reporte PDF
        </button>
      </div>

      {cargando ? <p className="vacio">Cargando estadísticas...</p> : reporte && (
        <>
          <div className="kpis">
            <div className="kpi">
              <span className="kpi-titulo">Metros cortados</span>
              <strong className="kpi-valor">{formatearMetros(total)}</strong>
              <span className="tenue">{reporte.totales.cortes} cortes en el periodo</span>
            </div>
            <TarjetaKpi
              Icono={Star}
              variante="estrella"
              titulo="Tela Estrella"
              tela={estrella?.tipo_tela}
              detalle={estrella ? `${formatearMetros(estrella.metros_cortados)} cortados · ${porcentaje(estrella.metros_cortados, total)} del total` : 'Sin cortes en el periodo'}
            />
            <TarjetaKpi
              Icono={Snail}
              variante="estancada"
              titulo="Tela Estancada"
              tela={estancada?.tipo_tela}
              detalle={estancada ? `${formatearMetros(estancada.metros_cortados)} cortados · ${formatearMetros(estancada.stock_actual)} en bodega` : 'Ninguna tela con stock sin rotar'}
            />
          </div>

          <div className="graficos">
            <section className="grafico">
              <h3>Top 5 de telas por metros cortados</h3>
              {topTelas.length === 0 ? <p className="vacio">No hubo cortes en este periodo.</p> : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topTelas} layout="vertical" margin={{ top: 4, right: 72, bottom: 4, left: 8 }} barCategoryGap={8}>
                    <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tickFormatter={(v) => `${v} m`} tick={{ fill: TEXTO_SUAVE, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="nombre" width={110} tick={{ fill: '#0f172a', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<TooltipConsumo total={total} />} cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }} />
                    <Bar
                      dataKey="metros_cortados"
                      fill={COLOR_BARRA}
                      radius={[0, 4, 4, 0]}
                      maxBarSize={28}
                      label={{ position: 'right', fill: TEXTO_SUAVE, fontSize: 12, formatter: (v) => formatearMetros(v) }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>

            <section className="grafico">
              <h3>Consumo por color</h3>
              {segmentosColor.length === 0 ? <p className="vacio">No hubo cortes en este periodo.</p> : (
                <div className="grafico-dona">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Tooltip content={<TooltipConsumo total={total} />} />
                      <Pie
                        data={segmentosColor}
                        dataKey="metros_cortados"
                        nameKey="nombre"
                        innerRadius="58%"
                        outerRadius="92%"
                        stroke="#fff"
                        strokeWidth={2}
                        isAnimationActive={false}
                      >
                        {segmentosColor.map((s) => <Cell key={s.nombre} fill={s.relleno} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="leyenda">
                    {segmentosColor.map((s) => (
                      <li key={s.nombre}>
                        <span className="leyenda-muestra" style={{ background: s.relleno }} />
                        <span className="leyenda-nombre">{s.nombre}</span>
                        <span className="leyenda-valor">{formatearMetros(s.metros_cortados)} · {porcentaje(s.metros_cortados, total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          <h3 className="seccion-titulo">Detalle por tela y color</h3>
          <div className="tabla-scroll">
            <table className="tabla tabla--tarjetas">
              <thead>
                <tr>
                  <th>Tela</th>
                  <th>Color</th>
                  <th className="num">Metros cortados</th>
                  <th className="num">Cortes</th>
                  <th className="num">Stock actual</th>
                </tr>
              </thead>
              <tbody>
                {reporte.detalle.map((d) => (
                  <tr key={`${d.tipo_tela}|${d.color}`}>
                    <td data-label="Tela" className="fuerte">{d.tipo_tela}</td>
                    <td data-label="Color">{d.color}</td>
                    <td data-label="Metros cortados" className="num fuerte">{formatearMetros(d.metros_cortados)}</td>
                    <td data-label="Cortes" className="num">{d.cortes}</td>
                    <td data-label="Stock actual" className="num tenue">{formatearMetros(d.stock_actual)}</td>
                  </tr>
                ))}
                {reporte.detalle.length === 0 && <tr><td colSpan={5} className="vacio">No hubo cortes en este periodo.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
