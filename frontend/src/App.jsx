import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Shirt } from 'lucide-react';
import Auth from './Auth';
import Operario from './Operario';
import Gerencia from './Gerencia';

const SESSION_KEY = 'inventario-session';

function AppContent() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  });
  const location = useLocation();
  const navigate = useNavigate();
  const destinoRol = session?.usuario?.rol === 'gerencia' ? '/dashboard' : '/escaner';

  const iniciarSesion = (datos) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(datos));
    setSession(datos);
    navigate(datos.usuario.rol === 'gerencia' ? '/dashboard' : '/escaner', { replace: true });
  };

  const cerrarSesion = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    navigate('/', { replace: true });
  };

  const proteger = (rol, elemento) => {
    if (!session?.token) return <Navigate to="/" replace state={{ from: location }} />;
    if (session.usuario?.rol !== rol) return <Navigate to={destinoRol} replace />;
    return elemento;
  };

  return (
    <>
      <nav className="navbar">
        <Link to={session ? destinoRol : '/'} className="nav-brand"><Shirt size={20} /> Camisería Europea</Link>
        {session && <div className="nav-session">
          <span>{session.usuario.nombre} <small>{session.usuario.rol}</small></span>
          {session.usuario.rol === 'operario' && <Link to="/escaner" className="nav-link">Escáner</Link>}
          {session.usuario.rol === 'gerencia' && <Link to="/dashboard" className="nav-link">Inventario</Link>}
          <button type="button" className="nav-logout" onClick={cerrarSesion} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={18} /></button>
        </div>}
      </nav>

      <Routes>
        <Route path="/" element={session?.token ? <Navigate to={destinoRol} replace /> : <Auth onAuthenticated={iniciarSesion} />} />
        <Route path="/escaner" element={proteger('operario', <Operario />)} />
        <Route path="/dashboard" element={proteger('gerencia', <Gerencia />)} />
        <Route path="*" element={<Navigate to={session?.token ? destinoRol : '/'} replace />} />
      </Routes>
    </>
  );
}

function App() {
  return <BrowserRouter><AppContent /></BrowserRouter>;
}

export default App;