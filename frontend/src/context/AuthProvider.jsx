import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './auth-context';
import { EVENTO_SESION_EXPIRADA, guardarSesion, leerSesion } from '../api/client';
import * as authApi from '../api/auth.api';

export default function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion);
  const [avisoSesion, setAvisoSesion] = useState('');

  const actualizarSesion = useCallback((nueva) => {
    guardarSesion(nueva);
    setSesion(nueva);
  }, []);

  const iniciarSesion = useCallback(async (email, password) => {
    const datos = await authApi.login(email, password);
    setAvisoSesion('');
    actualizarSesion(datos);
    return datos.usuario;
  }, [actualizarSesion]);

  const cerrarSesion = useCallback(() => actualizarSesion(null), [actualizarSesion]);

  // Al recargar, confirma con el servidor quién es el dueño del token y con
  // qué rol/permisos (pudieron cambiar desde el último inicio de sesión).
  useEffect(() => {
    const token = leerSesion()?.token;
    if (!token) return;
    authApi.obtenerPerfil()
      .then((usuario) => {
        // Solo si la sesión no cambió mientras esperábamos la respuesta.
        if (leerSesion()?.token === token) actualizarSesion({ token, usuario });
      })
      .catch(() => {}); // un 401 ya dispara EVENTO_SESION_EXPIRADA
  }, [actualizarSesion]);

  useEffect(() => {
    const alExpirar = () => {
      cerrarSesion();
      setAvisoSesion('Tu sesión venció. Inicia sesión nuevamente.');
    };
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, [cerrarSesion]);

  const valor = useMemo(() => ({
    usuario: sesion?.usuario ?? null,
    autenticado: Boolean(sesion?.token),
    tienePermiso: (permiso) => Boolean(sesion?.usuario?.permisos?.includes(permiso)),
    avisoSesion,
    iniciarSesion,
    cerrarSesion,
  }), [sesion, avisoSesion, iniciarSesion, cerrarSesion]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
