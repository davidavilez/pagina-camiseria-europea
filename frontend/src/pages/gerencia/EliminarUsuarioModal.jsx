import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import Alerta from '../../components/Alerta';
import { eliminarUsuario } from '../../api/usuarios.api';
import { mensajeDeError } from '../../api/client';

export default function EliminarUsuarioModal({ usuario, onCerrar, onEliminado }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const confirmar = async () => {
    setEnviando(true);
    setError('');
    try {
      const resultado = await eliminarUsuario(usuario.id);
      onEliminado(resultado);
      onCerrar();
    } catch (err) {
      setError(mensajeDeError(err));
      setEnviando(false);
    }
  };

  return (
    <Modal titulo="Eliminar usuario" onCerrar={onCerrar}>
      <div className="formulario">
        <p>
          ¿Eliminar la cuenta de <b>{usuario.nombre}</b> ({usuario.email})?
        </p>
        <p className="tenue">
          Si no tiene cortes registrados se borra definitivamente. Si tiene cortes, se conserva su
          historial: la cuenta queda desactivada y su correo libre para crear una cuenta nueva.
        </p>

        <Alerta>{error}</Alerta>

        <div className="formulario-acciones">
          <button type="button" className="btn btn--secundario" onClick={onCerrar}>Cancelar</button>
          <button type="button" className="btn btn--peligro" onClick={confirmar} disabled={enviando}>
            <Trash2 size={16} /> {enviando ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
