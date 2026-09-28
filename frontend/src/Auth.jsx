import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, Shirt } from 'lucide-react';
import api from './api';

export default function Auth({ onAuthenticated }) {
  const [modo, setModo] = useState('login');
  const [rol, setRol] = useState('operario');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigoGerencia, setCodigoGerencia] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const esRegistro = modo === 'registro';

  const enviar = async (event) => {
    event.preventDefault();
    setCargando(true);
    setError('');

    try {
      const endpoint = esRegistro ? '/auth/register' : '/auth/login';
      const payload = esRegistro
        ? { nombre, email, password, rol, codigoGerencia }
        : { email, password };
      const respuesta = await api.post(endpoint, payload);
      onAuthenticated(respuesta.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No fue posible conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-aside" aria-label="Camisería Europea">
        <div className="auth-brand"><Shirt size={25} strokeWidth={1.8} /> <span>CAMISERÍA EUROPEA</span></div>
        <div className="auth-aside-copy">
          <p className="auth-kicker">INVENTARIO · CONTROL · TRAZABILIDAD</p>
          <h1>Todo el taller,<br />en una sola vista.</h1>
          <p>Acceso al inventario y registro de cortes según tu función.</p>
        </div>
        <span className="auth-aside-index">SISTEMA INTERNO / 01</span>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <p className="auth-kicker">SISTEMA DE INVENTARIO QR</p>
          <h2>{esRegistro ? 'Crear cuenta' : 'Bienvenido de nuevo'}</h2>
          <p className="auth-subtitle">{esRegistro ? 'Registra tu acceso al sistema.' : 'Ingresa con tu cuenta para continuar.'}</p>

          <div className="auth-mode" role="tablist" aria-label="Acceso o registro">
            <button type="button" role="tab" aria-selected={!esRegistro} className={!esRegistro ? 'is-active' : ''} onClick={() => { setModo('login'); setError(''); }}>Iniciar sesión</button>
            <button type="button" role="tab" aria-selected={esRegistro} className={esRegistro ? 'is-active' : ''} onClick={() => { setModo('registro'); setError(''); }}>Registrarme</button>
          </div>

          <form className="auth-form" onSubmit={enviar}>
            {esRegistro && (
              <>
                <label htmlFor="nombre">Nombre completo</label>
                <input id="nombre" autoComplete="name" value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Tu nombre" required minLength={2} />

                <label>Tipo de cuenta</label>
                <div className="role-select" role="group" aria-label="Tipo de cuenta">
                  <button type="button" className={rol === 'operario' ? 'is-active' : ''} onClick={() => setRol('operario')}>Operario</button>
                  <button type="button" className={rol === 'gerencia' ? 'is-active' : ''} onClick={() => setRol('gerencia')}>Gerencia</button>
                </div>
                {rol === 'gerencia' && (
                  <>
                    <label htmlFor="codigoGerencia">Código de registro de gerencia</label>
                    <input id="codigoGerencia" autoComplete="off" value={codigoGerencia} onChange={(event) => setCodigoGerencia(event.target.value)} placeholder="Código proporcionado por administración" required />
                  </>
                )}
              </>
            )}

            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@empresa.com" required />

            <label htmlFor="password">Contraseña</label>
            <div className="password-field">
              <input id="password" type={mostrarPassword ? 'text' : 'password'} autoComplete={esRegistro ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={esRegistro ? 'Mínimo 8 caracteres' : 'Tu contraseña'} required minLength={esRegistro ? 8 : undefined} />
              <button type="button" className="password-toggle" aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setMostrarPassword(!mostrarPassword)}>
                {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <p className="auth-error" role="alert"><KeyRound size={16} />{error}</p>}

            <button className="auth-submit" type="submit" disabled={cargando}>
              {cargando ? 'Procesando...' : esRegistro ? 'Crear cuenta' : 'Entrar'}
              {!cargando && <ArrowRight size={18} />}
            </button>
          </form>
          <p className="auth-footnote">{esRegistro ? 'Las cuentas de gerencia requieren un código de autorización.' : 'El acceso y las funciones dependen del rol de tu cuenta.'}</p>
        </div>
      </section>
    </main>
  );
}