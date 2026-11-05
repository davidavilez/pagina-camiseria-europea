import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Modal from '../../components/Modal';
import Alerta from '../../components/Alerta';
import { crearUsuario } from '../../api/usuarios.api';
import { mensajeDeError } from '../../api/client';

export default function NuevoUsuarioModal({ onCerrar, onCreado }) {
  const [formulario, setFormulario] = useState({ nombre: '', email: '', password: '', rol: 'operario' });
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const cambiar = (event) => setFormulario({ ...formulario, [event.target.name]: event.target.value });

  const enviar = async (event) => {
    event.preventDefault();
    setEnviando(true);
    setError('');
    try {
      onCreado(await crearUsuario(formulario));
      onCerrar();
    } catch (err) {
      setError(mensajeDeError(err));
      setEnviando(false);
    }
  };

  return (
    <Modal titulo="Crear usuario" onCerrar={onCerrar}>
      <form className="formulario" onSubmit={enviar}>
        <label htmlFor="nombre">Nombre completo</label>
        <input id="nombre" name="nombre" autoComplete="off" value={formulario.nombre} onChange={cambiar} required minLength={2} maxLength={120} autoFocus />

        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="off" value={formulario.email} onChange={cambiar} required />

        <label htmlFor="password">Contraseña</label>
        <div className="password-field">
          <input id="password" name="password" type={mostrarPassword ? 'text' : 'password'} autoComplete="new-password" value={formulario.password} onChange={cambiar} placeholder="Mínimo 8 caracteres" required minLength={8} maxLength={72} />
          <button type="button" className="password-toggle" aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setMostrarPassword(!mostrarPassword)}>
            {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <span className="formulario-etiqueta">Rol</span>
        <div className="selector-rol" role="radiogroup" aria-label="Rol">
          {[['operario', 'Operario'], ['gerencia', 'Gerente']].map(([valor, nombre]) => (
            <label key={valor} className={formulario.rol === valor ? 'is-active' : ''}>
              <input type="radio" name="rol" value={valor} checked={formulario.rol === valor} onChange={cambiar} />
              {nombre}
            </label>
          ))}
        </div>

        <p className="tenue">
          La cuenta quedará <b>pendiente de aprobación</b>: el usuario recibirá sus credenciales por correo
          y podrá ingresar cuando el Súper Administrador apruebe el acceso.
        </p>

        <Alerta>{error}</Alerta>

        <div className="formulario-acciones">
          <button type="button" className="btn btn--secundario" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn btn--primario" disabled={enviando}>{enviando ? 'Creando...' : 'Crear usuario'}</button>
        </div>
      </form>
    </Modal>
  );
}
