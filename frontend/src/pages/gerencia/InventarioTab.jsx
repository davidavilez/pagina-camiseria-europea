import { useMemo, useState } from 'react';
import { FilterX, PackagePlus, Plus, QrCode, Search } from 'lucide-react';
import usePolling from '../../hooks/usePolling';
import useDebounce from '../../hooks/useDebounce';
import { listarRollos, obtenerEtiqueta, obtenerOpcionesFiltro } from '../../api/rollos.api';
import { mensajeDeError } from '../../api/client';
import StockBadge from '../../components/StockBadge';
import Modal from '../../components/Modal';
import EtiquetaQR from '../../components/EtiquetaQR';
import Alerta from '../../components/Alerta';
import IndicadorEnVivo from '../../components/IndicadorEnVivo';
import NuevoRolloModal from './NuevoRolloModal';
import ReabastecerModal from './ReabastecerModal';
import ResumenTela from './ResumenTela';
import { ESTADOS_STOCK } from '../../utils/stock';
import { formatearFecha, formatearMetros } from '../../utils/formato';

const OPCIONES_REFRESCO = 30000;

// El texto libre se aplica al campo elegido (el backend arma el WHERE).
const CAMPOS_BUSQUEDA = {
  tela: { etiqueta: 'Tipo de tela', placeholder: 'Ej.: Popelina, Oxford, Lino...' },
  codigo: { etiqueta: 'Código / ID', placeholder: 'Ej.: OXF-001 o #12' },
};

export default function InventarioTab() {
  const [busqueda, setBusqueda] = useState('');
  const [buscarPor, setBuscarPor] = useState('tela');
  const [color, setColor] = useState('');
  const [tipoTela, setTipoTela] = useState('');
  const [filtroEstado, setFiltroEstado] = useState(null);
  const busquedaDebounced = useDebounce(busqueda.trim());

  // Los filtros de texto, color y tela se resuelven en el backend (SQL dinámico).
  const filtros = useMemo(
    () => ({ search: busquedaDebounced, buscar_por: buscarPor, color, tipo_tela: tipoTela }),
    [busquedaDebounced, buscarPor, color, tipoTela]
  );
  // Buscar una tela (por texto o con el selector) muestra su panel de existencias.
  const buscandoTela = Boolean((buscarPor === 'tela' && busquedaDebounced) || tipoTela);
  const { datos: rollos, error, cargando, ultimaActualizacion, recargar } = usePolling(
    () => listarRollos(filtros), undefined, JSON.stringify(filtros)
  );
  const { datos: opciones, recargar: recargarOpciones } = usePolling(obtenerOpcionesFiltro, OPCIONES_REFRESCO);

  const [creando, setCreando] = useState(false);
  const [reabasteciendo, setReabasteciendo] = useState(null);
  const [etiqueta, setEtiqueta] = useState(null);
  const [errorEtiqueta, setErrorEtiqueta] = useState('');

  const hayFiltros = Boolean(busqueda || color || tipoTela || filtroEstado);

  const limpiarFiltros = () => {
    setBusqueda('');
    setColor('');
    setTipoTela('');
    setFiltroEstado(null);
  };

  const resumen = useMemo(() => {
    const conteo = { optimo: 0, bajo: 0, agotado: 0 };
    rollos?.forEach((r) => { conteo[r.estado_stock] += 1; });
    return conteo;
  }, [rollos]);

  const visibles = useMemo(
    () => (rollos ?? []).filter((r) => !filtroEstado || r.estado_stock === filtroEstado),
    [rollos, filtroEstado]
  );

  const verEtiqueta = async (id) => {
    setErrorEtiqueta('');
    try {
      setEtiqueta(await obtenerEtiqueta(id));
    } catch (err) {
      setErrorEtiqueta(mensajeDeError(err));
    }
  };

  const alCrear = () => {
    recargar();
    recargarOpciones();
  };

  return (
    <>
      <div className="resumen">
        <button type="button" className={`resumen-tarjeta ${!filtroEstado ? 'is-active' : ''}`} onClick={() => setFiltroEstado(null)}>
          <span>{hayFiltros ? 'Rollos encontrados' : 'Total rollos'}</span><strong>{rollos?.length ?? '—'}</strong>
        </button>
        {Object.entries(ESTADOS_STOCK).map(([estado, { etiqueta: nombre }]) => (
          <button
            key={estado}
            type="button"
            className={`resumen-tarjeta resumen-tarjeta--${estado} ${filtroEstado === estado ? 'is-active' : ''}`}
            onClick={() => setFiltroEstado(filtroEstado === estado ? null : estado)}
          >
            <span>{nombre}</span><strong>{rollos ? resumen[estado] : '—'}</strong>
          </button>
        ))}
      </div>

      <div className="barra-herramientas">
        <div className="buscador-grupo">
          <select className="selector" aria-label="Buscar por" value={buscarPor} onChange={(e) => setBuscarPor(e.target.value)}>
            {Object.entries(CAMPOS_BUSQUEDA).map(([campo, { etiqueta }]) => <option key={campo} value={campo}>{etiqueta}</option>)}
          </select>
          <label className="buscador">
            <Search size={16} />
            <input
              type="search"
              placeholder={CAMPOS_BUSQUEDA[buscarPor].placeholder}
              aria-label={`Buscar rollos por ${CAMPOS_BUSQUEDA[buscarPor].etiqueta.toLowerCase()}`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </label>
        </div>
        <select className="selector" aria-label="Filtrar por color" value={color} onChange={(e) => setColor(e.target.value)}>
          <option value="">Todos los colores</option>
          {opciones?.colores.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="selector" aria-label="Filtrar por tipo de tela" value={tipoTela} onChange={(e) => setTipoTela(e.target.value)}>
          <option value="">Todas las telas</option>
          {opciones?.tipos_tela.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="button" className="btn btn--secundario" onClick={limpiarFiltros} disabled={!hayFiltros}>
          <FilterX size={16} /> Limpiar filtros
        </button>
      </div>

      <div className="barra-herramientas barra-herramientas--fin">
        <IndicadorEnVivo ultimaActualizacion={ultimaActualizacion} error={error} />
        <button type="button" className="btn btn--primario" onClick={() => setCreando(true)}>
          <Plus size={16} /> Agregar Rollo
        </button>
      </div>

      {buscandoTela && <ResumenTela filtros={filtros} />}

      <Alerta>{errorEtiqueta}</Alerta>

      {cargando ? <p className="vacio">Cargando inventario...</p> : (
        <div className="tabla-scroll">
          <table className="tabla tabla--tarjetas">
            <thead>
              <tr>
                <th>ID</th>
                <th>Código/SKU</th>
                <th>Tela</th>
                <th>Color</th>
                <th className="num">Inicial</th>
                <th className="num">Actual</th>
                <th className="num">Mínimo</th>
                <th>Estado</th>
                <th>Ingreso</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {visibles.map((rollo) => (
                <tr key={rollo.id}>
                  <td data-label="ID" className="mono fuerte">#{rollo.id}</td>
                  <td data-label="Código/SKU" className="fuerte">{rollo.codigo_sku}</td>
                  <td data-label="Tela">{rollo.tipo_tela}</td>
                  <td data-label="Color">{rollo.color}</td>
                  <td data-label="Inicial" className="num">{formatearMetros(rollo.metraje_inicial)}</td>
                  <td data-label="Actual" className="num fuerte">{formatearMetros(rollo.metraje_actual)}</td>
                  <td data-label="Mínimo" className="num tenue">{formatearMetros(rollo.stock_minimo)}</td>
                  <td data-label="Estado"><StockBadge estado={rollo.estado_stock} /></td>
                  <td data-label="Ingreso" className="tenue">{formatearFecha(rollo.fecha_ingreso)}</td>
                  <td className="acciones">
                    <button type="button" className="btn-icono" title="Reabastecer" aria-label={`Reabastecer ${rollo.codigo_sku}`} onClick={() => setReabasteciendo(rollo)}>
                      <PackagePlus size={18} />
                    </button>
                    <button type="button" className="btn-icono" title="Ver etiqueta QR" aria-label={`Ver etiqueta QR de ${rollo.codigo_sku}`} onClick={() => verEtiqueta(rollo.id)}>
                      <QrCode size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr><td colSpan={10} className="vacio">{hayFiltros ? 'Ningún rollo coincide con los filtros.' : 'Aún no hay rollos registrados. Usa "Agregar Rollo".'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {creando && <NuevoRolloModal onCerrar={() => setCreando(false)} onCreado={alCrear} />}
      {reabasteciendo && <ReabastecerModal rollo={reabasteciendo} onCerrar={() => setReabasteciendo(null)} onReabastecido={recargar} />}
      {etiqueta && (
        <Modal titulo={`Etiqueta del rollo ${etiqueta.rollo.codigo_sku}`} onCerrar={() => setEtiqueta(null)}>
          <EtiquetaQR rollo={etiqueta.rollo} qr={etiqueta.qr} />
        </Modal>
      )}
    </>
  );
}
