import { useState } from 'react';
import Modal from '../../components/Modal';
import Alerta from '../../components/Alerta';
import { reabastecerRollo } from '../../api/rollos.api';
import { mensajeDeError } from '../../api/client';
import { formatearMetros } from '../../utils/formato';

export default function ReabastecerModal({ rollo, onCerrar, onReabastecido }) {
  const [metros, setMetros] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const enviar = async (event) => {
    event.preventDefault();
    setEnviando(true);
    setError('');
    try {
      await reabastecerRollo(rollo.id, Number(metros));
      onReabastecido();
      onCerrar();
    } catch (err) {
      setError(mensajeDeError(err));
      setEnviando(false);
    }
  };

  return (
    <Modal titulo={`Reabastecer rollo ${rollo.codigo_sku}`} onCerrar={onCerrar}>
      <form className="formulario" onSubmit={enviar}>
        <p className="tenue">
          Saldo actual: <b>{formatearMetros(rollo.metraje_actual)}</b> · Stock mínimo: {formatearMetros(rollo.stock_minimo)}.
          Si el nuevo saldo supera el mínimo, la alerta de stock vuelve a quedar activa.
        </p>

        <label htmlFor="metros">Metros que ingresan a bodega</label>
        <input id="metros" type="number" min="0.01" step="0.01" inputMode="decimal" value={metros} onChange={(e) => setMetros(e.target.value)} placeholder="Ej. 50" required autoFocus />

        <Alerta>{error}</Alerta>

        <div className="formulario-acciones">
          <button type="button" className="btn btn--secundario" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn btn--primario" disabled={enviando}>{enviando ? 'Guardando...' : 'Reabastecer'}</button>
        </div>
      </form>
    </Modal>
  );
}
