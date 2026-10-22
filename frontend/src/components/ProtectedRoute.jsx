import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { rutaInicioPorRol } from '../utils/rutas';

/**
 * Bloquea la ruta si no hay sesión o si el usuario no tiene el permiso.
 * Los permisos vienen del backend (misma matriz RBAC que protege la API).
 */
export default function ProtectedRoute({ permiso }) {
  const { usuario, autenticado, tienePermiso, cerrarSesion } = useAuth();
  const { pathname } = useLocation();

  if (!autenticado) return <Navigate to="/login" replace />;
  if (tienePermiso(permiso)) return <Outlet />;

  const inicio = rutaInicioPorRol(usuario.rol);
  if (inicio !== pathname) return <Navigate to={inicio} replace />;

  // Ni siquiera su página de inicio le está permitida: evitamos un bucle de redirecciones.
  return (
    <main className="pagina pagina--estrecha">
      <section className="tarjeta tarjeta--aviso">
        <ShieldAlert size={40} />
        <h2>Sin acceso</h2>
        <p className="tenue">Tu cuenta ({usuario.rol}) no tiene permisos para esta sección.</p>
        <button type="button" className="btn btn--secundario btn--bloque" onClick={cerrarSesion}>Cerrar sesión</button>
      </section>
    </main>
  );
}
