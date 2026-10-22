import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, KeyRound, Shirt } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { mensajeDeError } from '../api/client';
import { rutaInicioPorRol } from '../utils/rutas';

export default function Login() {
  const { iniciarSesion, avisoSesion } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const enviar = async (event) => {
    event.preventDefault();
    setCargando(true);
    setError('');
    try {
      const usuario = await iniciarSesion(email, password);
      navigate(rutaInicioPorRol(usuario.rol), { replace: true });
    } catch (err) {
      setError(mensajeDeError(err));
      setCargando(false);
    }
  };

  const mensaje = error || avisoSesion;

  return (
    <main className="auth-shell">
      <section className="auth-aside" aria-label="Camisería Europea">
        <div className="auth-brand"><Shirt size={25} strokeWidth={1.8} /> <span>CAMISERÍA EUROPEA</span></div>
        <div className="auth-aside-copy">
          <p className="auth-kicker">INVENTARIO · CONTROL · TRAZABILIDAD</p>
          <h1>Camisería Europea,<br />sistema de inventario QR</h1>
          <p>Acceso al inventario y registro de cortes según tu función.</p>
        </div>
        <span className="auth-aside-index">SISTEMA INTERNO / 01</span>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <p className="auth-kicker">SISTEMA DE INVENTARIO QR</p>
          <h2>Iniciar sesión</h2>
          <p className="auth-subtitle">Ingresa con la cuenta asignada por gerencia.</p>

          <form className="auth-form" onSubmit={enviar}>
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@empresa.com" required autoFocus />

            <label htmlFor="password">Contraseña</label>
            <div className="password-field">
              <input id="password" type={mostrarPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tu contraseña" required />
              <button type="button" className="password-toggle" aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setMostrarPassword(!mostrarPassword)}>
                {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {mensaje && <p className="auth-error" role="alert"><KeyRound size={16} />{mensaje}</p>}

            <button className="auth-submit" type="submit" disabled={cargando}>
              {cargando ? 'Verificando...' : 'Entrar'}
              {!cargando && <ArrowRight size={18} />}
            </button>
          </form>
          <p className="auth-footnote">¿No tienes cuenta? Solicítala a gerencia. Las cuentas solo pueden ser creadas por un gerente.</p>
        </div>
      </section>
    </main>
  );
}
