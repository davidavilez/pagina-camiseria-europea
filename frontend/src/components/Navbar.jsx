import { Link } from 'react-router-dom';
import { LogOut, Shirt } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { rutaInicioPorRol } from '../utils/rutas';

export default function Navbar() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <nav className="navbar">
      <Link to={usuario ? rutaInicioPorRol(usuario.rol) : '/login'} className="nav-brand">
        <Shirt size={20} /> Camisería Europea
      </Link>
      {usuario && (
        <div className="nav-session">
          <span>{usuario.nombre} <small>{usuario.rol}</small></span>
          <button type="button" className="nav-logout" onClick={cerrarSesion} aria-label="Cerrar sesión" title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      )}
    </nav>
  );
}
