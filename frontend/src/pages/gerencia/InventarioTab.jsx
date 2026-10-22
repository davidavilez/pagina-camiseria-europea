import { useMemo, useState } from 'react';
import { Plus, QrCode, Search } from 'lucide-react';
import usePolling from '../../hooks/usePolling';
import { listarRollos, obtenerEtiqueta } from '../../api/rollos.api';
import { mensajeDeError } from '../../api/client';
import StockBadge from '../../components/StockBadge';
import Modal from '../../components/Modal';
import EtiquetaQR from '../../components/EtiquetaQR';
import Alerta from '../../components/Alerta';
import IndicadorEnVivo from '../../components/IndicadorEnVivo';
import NuevoRolloModal from './NuevoRolloModal';
import { ESTADOS_STOCK } from '../../utils/stock';
import { formatearFecha, formatearMetros } from '../../utils/formato';

export default function InventarioTab() {
  const { datos: rollos, error, cargando, ultimaActualizacion, recargar } = usePolling(listarRollos);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [creando, setCreando] = useState(false);
  const [etiqueta, setEtiqueta] = useState(null);
  const [errorEtiqueta, setErrorEtiqueta] = useState('');

  const resumen = useMemo(() => {
    const conteo = { optimo: 0, bajo: 0, agotado: 0 };
    rollos?.forEach((r) => { conteo[r.estado_stock] += 1; });
    return conteo;
  }, [rollos]);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return (rollos ?? []).filter((r) => (
      (!filtroEstado || r.estado_stock === filtroEstado)
      && (!texto || `${r.id} ${r.codigo_sku} ${r.tipo_tela} ${r.color}`.toLowerCase().includes(texto))
    ));
  }, [rollos, busqueda, filtroEstado]);

  const verEtiqueta = async (id) => {
    setErrorEtiqueta('');
    try {
      setEtiqueta(await obtenerEtiqueta(id));
    } catch (err) {
      setErrorEtiqueta(mensajeDeError(err));
    }
  };

  return (
    <>
      <div className="resumen">
        <button type="button" className={`resumen-tarjeta ${!filtroEstado ? 'is-active' : ''}`} onClick={() => setFiltroEstado(null)}>
          <span>Total rollos</span><strong>{rollos?.length ?? '—'}</strong>
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
        <label className="buscador">
          <Search size={16} />
          <input type="search" placeholder="Buscar por ID, SKU, tela o color" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </label>
        <IndicadorEnVivo ultimaActualizacion={ultimaActualizacion} error={error} />
        <button type="button" className="btn btn--primario" onClick={() => setCreando(true)}>
          <Plus size={16} /> Agregar Rollo
        </button>
      </div>

      <Alerta>{errorEtiqueta}</Alerta>

      {cargando ? <p className="vacio">Cargando inventario...</p> : (
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Código/SKU</th>
                <th>Tela</th>
                <th>Color</th>
                <th className="num">Inicial</th>
                <th className="num">Actual</th>
                <th>Estado</th>
                <th>Ingreso</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {visibles.map((rollo) => (
                <tr key={rollo.id}>
                  <td className="mono">#{rollo.id}</td>
                  <td className="fuerte">{rollo.codigo_sku}</td>
                  <td>{rollo.tipo_tela}</td>
                  <td>{rollo.color}</td>
                  <td className="num">{formatearMetros(rollo.metraje_inicial)}</td>
                  <td className="num fuerte">{formatearMetros(rollo.metraje_actual)}</td>
                  <td><StockBadge estado={rollo.estado_stock} /></td>
                  <td className="tenue">{formatearFecha(rollo.fecha_ingreso)}</td>
                  <td>
                    <button type="button" className="btn-icono" title="Ver etiqueta QR" aria-label={`Ver etiqueta QR de ${rollo.codigo_sku}`} onClick={() => verEtiqueta(rollo.id)}>
                      <QrCode size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr><td colSpan={9} className="vacio">{rollos?.length ? 'Ningún rollo coincide con el filtro.' : 'Aún no hay rollos registrados. Usa "Agregar Rollo".'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {creando && <NuevoRolloModal onCerrar={() => setCreando(false)} onCreado={recargar} />}
      {etiqueta && (
        <Modal titulo={`Etiqueta del rollo ${etiqueta.rollo.codigo_sku}`} onCerrar={() => setEtiqueta(null)}>
          <EtiquetaQR rollo={etiqueta.rollo} qr={etiqueta.qr} />
        </Modal>
      )}
    </>
  );
}
