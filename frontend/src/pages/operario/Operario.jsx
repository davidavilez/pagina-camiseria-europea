import { useRef, useState } from 'react';
import { CheckCircle2, Keyboard, ScanLine, Scissors } from 'lucide-react';
import EscanerQR from '../../components/EscanerQR';
import StockBadge from '../../components/StockBadge';
import Alerta from '../../components/Alerta';
import { obtenerRollo } from '../../api/rollos.api';
import { registrarCorte } from '../../api/cortes.api';
import { mensajeDeError } from '../../api/client';
import { formatearMetros } from '../../utils/formato';

/** El QR contiene solo el ID numérico del rollo. */
const extraerIdRollo = (texto) => {
  const limpio = String(texto).trim();
  return /^\d+$/.test(limpio) ? Number(limpio) : null;
};

export default function Operario() {
  const [rollo, setRollo] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [idManual, setIdManual] = useState('');
  const [metros, setMetros] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  // Cambiar la key reinicia el lector tras una lectura fallida.
  const [intentoEscaneo, setIntentoEscaneo] = useState(0);
  // Evita registrar el mismo corte dos veces por un doble clic.
  const enviandoRef = useRef(false);

  const reiniciar = () => {
    setRollo(null);
    setResultado(null);
    setMetros('');
    setIdManual('');
    setError('');
  };

  const cargarRollo = async (texto) => {
    const id = extraerIdRollo(texto);
    if (!id) {
      setError(`El código "${texto}" no corresponde a un rollo de Camisería Europea.`);
      setIntentoEscaneo((n) => n + 1);
      return;
    }
    setCargando(true);
    setError('');
    try {
      setRollo(await obtenerRollo(id));
    } catch (err) {
      setError(mensajeDeError(err));
      setIntentoEscaneo((n) => n + 1);
    } finally {
      setCargando(false);
    }
  };

  const cantidad = Number(metros);
  const excedeSaldo = rollo && metros !== '' && cantidad > rollo.metraje_actual;
  const cantidadValida = metros !== '' && cantidad > 0 && !excedeSaldo;

  const confirmarCorte = async (event) => {
    event.preventDefault();
    if (!cantidadValida || enviandoRef.current) return;
    enviandoRef.current = true;
    setCargando(true);
    setError('');
    try {
      setResultado(await registrarCorte(rollo.id, cantidad));
    } catch (err) {
      setError(mensajeDeError(err));
      // El saldo pudo cambiar por otro operario: refrescamos la ficha.
      obtenerRollo(rollo.id).then(setRollo).catch(() => {});
    } finally {
      enviandoRef.current = false;
      setCargando(false);
    }
  };

  return (
    <main className="pagina pagina--estrecha">
      <header className="pagina-cabecera">
        <div>
          <p className="pagina-kicker">PANEL OPERATIVO</p>
          <h1>Registro de cortes</h1>
        </div>
      </header>

      {resultado ? (
        <section className="tarjeta tarjeta--exito">
          <CheckCircle2 size={44} />
          <h2>Corte registrado</h2>
          <p>Se descontaron <strong>{formatearMetros(resultado.corte.metros_cortados)}</strong> del rollo <strong>{resultado.rollo.codigo_sku}</strong>.</p>
          <p className="saldo-grande">{formatearMetros(resultado.rollo.metraje_actual)}</p>
          <p className="tenue">Saldo restante</p>
          <StockBadge estado={resultado.rollo.estado_stock} />
          <button type="button" className="btn btn--primario btn--bloque" onClick={reiniciar}><ScanLine size={16} /> Escanear otro rollo</button>
        </section>
      ) : rollo ? (
        <section className="tarjeta">
          <div className="ficha-cabecera">
            <div>
              <p className="tenue mono">Rollo #{rollo.id}</p>
              <h2>{rollo.codigo_sku}</h2>
            </div>
            <StockBadge estado={rollo.estado_stock} />
          </div>
          <dl className="ficha-datos">
            <div><dt>Tipo de tela</dt><dd>{rollo.tipo_tela}</dd></div>
            <div><dt>Color</dt><dd>{rollo.color}</dd></div>
            <div><dt>Metraje inicial</dt><dd>{formatearMetros(rollo.metraje_inicial)}</dd></div>
            <div><dt>Disponible</dt><dd className="fuerte">{formatearMetros(rollo.metraje_actual)}</dd></div>
          </dl>

          {rollo.metraje_actual <= 0 ? (
            <Alerta>Este rollo está agotado. No se pueden registrar más cortes.</Alerta>
          ) : (
            <form className="formulario" onSubmit={confirmarCorte}>
              <label htmlFor="metros">Metros a cortar</label>
              <input
                id="metros"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                max={rollo.metraje_actual}
                value={metros}
                onChange={(e) => setMetros(e.target.value)}
                placeholder={`Máximo ${formatearMetros(rollo.metraje_actual)}`}
                className="input-grande"
                required
                autoFocus
              />
              {excedeSaldo && <Alerta>No puedes cortar {formatearMetros(cantidad)}: el rollo solo tiene {formatearMetros(rollo.metraje_actual)}.</Alerta>}
              {cantidadValida && <p className="tenue">Saldo tras el corte: <strong>{formatearMetros(rollo.metraje_actual - cantidad)}</strong></p>}
              <Alerta>{error}</Alerta>
              <button type="submit" className="btn btn--primario btn--bloque" disabled={cargando || !cantidadValida}>
                <Scissors size={16} /> {cargando ? 'Registrando...' : 'Descontar metraje'}
              </button>
            </form>
          )}
          <button type="button" className="btn btn--secundario btn--bloque" onClick={reiniciar}>Cancelar y escanear otro</button>
        </section>
      ) : (
        <section className="tarjeta">
          <EscanerQR key={intentoEscaneo} onLectura={cargarRollo} />
          <p className="tenue centrado">Apunta la cámara al código QR de la etiqueta del rollo.</p>
          <form className="ingreso-manual" onSubmit={(e) => { e.preventDefault(); cargarRollo(idManual); }}>
            <Keyboard size={16} />
            <input type="text" inputMode="numeric" placeholder="o escribe el ID del rollo" value={idManual} onChange={(e) => setIdManual(e.target.value)} aria-label="ID del rollo" />
            <button type="submit" className="btn btn--secundario" disabled={!idManual.trim() || cargando}>Buscar</button>
          </form>
          {cargando && <p className="tenue centrado">Buscando rollo...</p>}
          <Alerta>{error}</Alerta>
        </section>
      )}
    </main>
  );
}
