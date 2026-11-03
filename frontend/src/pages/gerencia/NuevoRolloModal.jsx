import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import Alerta from '../../components/Alerta';
import EtiquetaQR from '../../components/EtiquetaQR';
import useDebounce from '../../hooks/useDebounce';
import usePolling from '../../hooks/usePolling';
import { crearRollo, listarRollos, obtenerCatalogoColores } from '../../api/rollos.api';
import { listarEstanterias } from '../../api/estanterias.api';
import { mensajeDeError } from '../../api/client';
import { estaLlena, etiquetaEstanteria } from '../../utils/estanterias';

const FORMULARIO_VACIO = { codigo_sku: '', tipo_tela: '', color: '', metraje_inicial: '', stock_minimo: '20', estanteria_id: '' };

/** IDs de estanterías con rollos con saldo, de más a menos usada; en empate, la del rollo más reciente. */
const estanteriasPorUso = (rollos) => {
  const conteo = new Map();
  for (const { estanteria_id: id, metraje_actual: saldo } of rollos) {
    if (id === null || saldo <= 0) continue;
    conteo.set(id, (conteo.get(id) ?? 0) + 1);
  }
  return [...conteo.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
};

export default function NuevoRolloModal({ onCerrar, onCreado }) {
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const [catalogoColores, setCatalogoColores] = useState([]);
  const [sugerencia, setSugerencia] = useState(null);
  // Con polling la ocupación se mantiene al día mientras el formulario está abierto.
  const { datos: estanterias, error: errorEstanterias, recargar: recargarEstanterias } = usePolling(listarEstanterias);
  const conEspacio = (estanterias ?? []).filter((e) => !estaLlena(e));

  // Solo para sugerir; la validación real del color la hace el backend.
  useEffect(() => {
    obtenerCatalogoColores().then(setCatalogoColores).catch(() => {});
  }, []);

  const tipoTela = formulario.tipo_tela.trim();
  const tipoTelaDebounced = useDebounce(tipoTela);

  useEffect(() => {
    if (tipoTelaDebounced.length < 2) return undefined;
    let activo = true;
    listarRollos({ tipo_tela: tipoTelaDebounced })
      .then((rollos) => { if (activo) setSugerencia({ tela: tipoTelaDebounced, usadas: estanteriasPorUso(rollos) }); })
      .catch(() => {}); // Es solo una sugerencia: sin ella se elige a mano.
    return () => { activo = false; };
  }, [tipoTelaDebounced]);

  // La sugerencia solo aplica a la tela escrita y se salta las estanterías llenas:
  // la más usada con espacio o, si todas las de esa tela están llenas, otra con espacio.
  const usadas = sugerencia?.tela === tipoTela ? sugerencia.usadas : [];
  const usadaConEspacio = usadas.map((id) => conEspacio.find((e) => e.id === id)).find(Boolean);
  const estanteriaSugerida = usadaConEspacio ?? (usadas.length > 0 ? conEspacio[0] : undefined);
  // Nunca pisa lo elegido por el usuario, salvo que esa estantería se haya llenado.
  const elegidaPorUsuario = conEspacio.some((e) => String(e.id) === formulario.estanteria_id) ? formulario.estanteria_id : '';
  const estanteriaElegida = elegidaPorUsuario || String(estanteriaSugerida?.id ?? '');
  const mostrarSugerencia = estanteriaSugerida && estanteriaElegida === String(estanteriaSugerida.id);

  const cambiar = (event) => setFormulario({ ...formulario, [event.target.name]: event.target.value });

  const enviar = async (event) => {
    event.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const respuesta = await crearRollo({
        ...formulario,
        metraje_inicial: Number(formulario.metraje_inicial),
        stock_minimo: Number(formulario.stock_minimo),
        estanteria_id: Number(estanteriaElegida),
      });
      setResultado(respuesta);
      onCreado();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      recargarEstanterias();
      setEnviando(false);
    }
  };

  const otroRollo = () => {
    setFormulario(FORMULARIO_VACIO);
    setResultado(null);
  };

  if (resultado) {
    return (
      <Modal titulo="Rollo registrado · Etiqueta lista para imprimir" onCerrar={onCerrar}>
        <Alerta tipo="exito">El rollo {resultado.rollo.codigo_sku} se guardó con {resultado.rollo.metraje_actual} m disponibles.</Alerta>
        <EtiquetaQR rollo={resultado.rollo} qr={resultado.qr} />
        <button type="button" className="btn btn--secundario btn--bloque" onClick={otroRollo}>Registrar otro rollo</button>
      </Modal>
    );
  }

  return (
    <Modal titulo="Agregar rollo" onCerrar={onCerrar}>
      <form className="formulario" onSubmit={enviar}>
        <label htmlFor="codigo_sku">Código / SKU</label>
        <input id="codigo_sku" name="codigo_sku" value={formulario.codigo_sku} onChange={cambiar} placeholder="Ej. OXF-AZ-001" required maxLength={50} autoFocus />

        <label htmlFor="tipo_tela">Tipo de tela</label>
        <input id="tipo_tela" name="tipo_tela" value={formulario.tipo_tela} onChange={cambiar} placeholder="Ej. Oxford, Popelina, Lino" required minLength={2} maxLength={80} />

        <label htmlFor="color">Color</label>
        <input id="color" name="color" list="catalogo-colores" autoComplete="off" value={formulario.color} onChange={cambiar} placeholder="Ej. Azul cielo" required minLength={2} maxLength={50} />
        <datalist id="catalogo-colores">
          {catalogoColores.map((c) => <option key={c} value={c} />)}
        </datalist>

        <label htmlFor="metraje_inicial">Metraje inicial (m)</label>
        <input id="metraje_inicial" name="metraje_inicial" type="number" min="0.01" step="0.01" inputMode="decimal" value={formulario.metraje_inicial} onChange={cambiar} placeholder="Ej. 50" required />

        <label htmlFor="stock_minimo">Stock mínimo para alerta (m)</label>
        <input id="stock_minimo" name="stock_minimo" type="number" min="0" step="0.01" inputMode="decimal" value={formulario.stock_minimo} onChange={cambiar} required />

        <label htmlFor="estanteria_id">Estantería</label>
        <select id="estanteria_id" name="estanteria_id" className="selector" value={estanteriaElegida} onChange={cambiar} required>
          <option value="" disabled>Selecciona una estantería</option>
          {estanterias?.map((e) => <option key={e.id} value={e.id} disabled={estaLlena(e)}>{etiquetaEstanteria(e)}</option>)}
        </select>
        {mostrarSugerencia && (
          <p className="tenue">
            {usadaConEspacio
              ? `Sugerida: ya hay rollos de ${tipoTela} en ${estanteriaSugerida.codigo}. Puedes cambiarla.`
              : `Las estanterías con ${tipoTela} están llenas. Sugerida: ${estanteriaSugerida.codigo}. Puedes cambiarla.`}
          </p>
        )}
        <Alerta>{errorEstanterias}</Alerta>

        <Alerta>{error}</Alerta>

        <div className="formulario-acciones">
          <button type="button" className="btn btn--secundario" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn btn--primario" disabled={enviando}>{enviando ? 'Guardando...' : 'Guardar y generar QR'}</button>
        </div>
      </form>
    </Modal>
  );
}
