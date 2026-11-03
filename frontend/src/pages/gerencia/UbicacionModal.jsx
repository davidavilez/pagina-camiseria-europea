import { useState } from 'react';
import Modal from '../../components/Modal';
import Alerta from '../../components/Alerta';
import { cambiarUbicacionRollo } from '../../api/rollos.api';
import { mensajeDeError } from '../../api/client';
import { estaLlena, etiquetaEstanteria } from '../../utils/estanterias';

export default function UbicacionModal({ rollo, estanterias, onCerrar, onReubicado, onRechazado }) {
  const [estanteria, setEstanteria] = useState(String(rollo.estanteria_id ?? ''));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  // La estantería actual sigue seleccionable aunque esté llena: el rollo ya ocupa su lugar ahí.
  const noDisponible = (e) => estaLlena(e) && e.id !== rollo.estanteria_id;
  const destinoLleno = estanterias.some((e) => String(e.id) === estanteria && noDisponible(e));

  const enviar = async (event) => {
    event.preventDefault();
    setEnviando(true);
    setError('');
    try {
      await cambiarUbicacionRollo(rollo.id, estanteria ? Number(estanteria) : null);
      onReubicado();
      onCerrar();
    } catch (err) {
      setError(mensajeDeError(err));
      setEnviando(false);
      onRechazado();
    }
  };

  return (
    <Modal titulo={`Ubicación del rollo ${rollo.codigo_sku}`} onCerrar={onCerrar}>
      <form className="formulario" onSubmit={enviar}>
        <label htmlFor="ubicacion">Estantería</label>
        <select id="ubicacion" className="selector" value={estanteria} onChange={(e) => setEstanteria(e.target.value)} autoFocus>
          <option value="">Sin asignar</option>
          {estanterias.map((e) => <option key={e.id} value={e.id} disabled={noDisponible(e)}>{etiquetaEstanteria(e)}</option>)}
        </select>

        <Alerta>{error}</Alerta>

        <div className="formulario-acciones">
          <button type="button" className="btn btn--secundario" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn btn--primario" disabled={enviando || destinoLleno}>{enviando ? 'Guardando...' : 'Guardar ubicación'}</button>
        </div>
      </form>
    </Modal>
  );
}
