import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AuthProvider from './context/AuthProvider';
import useAuth from './hooks/useAuth';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import { rutaInicioPorRol } from './utils/rutas';

// Cada rol descarga solo su vista (el escáner QR es pesado).
const Gerencia = lazy(() => import('./pages/gerencia/Gerencia'));
const Operario = lazy(() => import('./pages/operario/Operario'));

function Rutas() {
  const { usuario, autenticado, cerrarSesion } = useAuth();
  const { pathname } = useLocation();
  const inicio = autenticado ? rutaInicioPorRol(usuario.rol) : '/login';

  return (
    <>
      <Navbar />
      {/* key: al navegar a otra ruta se descarta el error anterior. */}
      <ErrorBoundary key={pathname} onCerrarSesion={autenticado ? cerrarSesion : null}>
        <Suspense fallback={<p className="vacio">Cargando...</p>}>
          <Routes>
            <Route path="/login" element={autenticado ? <Navigate to={inicio} replace /> : <Login />} />
            <Route element={<ProtectedRoute permiso="rollos:listar" />}>
              <Route path="/gerencia" element={<Gerencia />} />
            </Route>
            <Route element={<ProtectedRoute permiso="cortes:registrar" />}>
              <Route path="/operario" element={<Operario />} />
            </Route>
            <Route path="*" element={<Navigate to={inicio} replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Rutas />
      </AuthProvider>
    </BrowserRouter>
  );
}
