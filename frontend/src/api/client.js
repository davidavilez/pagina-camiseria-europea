import axios from 'axios';

const SESSION_KEY = 'inventario-session';
export const EVENTO_SESION_EXPIRADA = 'sesion-expirada';

// La sesión vive en sessionStorage (una por pestaña). Con localStorage todas
// las pestañas compartían el token: si el gerente iniciaba sesión en otra
// pestaña, la vista del operario enviaba el token del gerente (403) y,
// peor, un corte podía quedar registrado a nombre de otra persona.
localStorage.removeItem(SESSION_KEY); // limpia sesiones de la versión anterior

export const leerSesion = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const guardarSesion = (sesion) => {
  if (sesion) sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
  else sessionStorage.removeItem(SESSION_KEY);
};

const client = axios.create({
  // Por defecto '/api' pasa por el proxy de Vite: funciona igual desde
  // localhost o desde un celular en la red local, sin problemas de CORS.
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

client.interceptors.request.use((config) => {
  const token = leerSesion()?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Un 401 en una ruta protegida significa token vencido o usuario desactivado.
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }
    return Promise.reject(error);
  }
);

/** Extrae el mensaje de error del backend o uno genérico. */
export const mensajeDeError = (error) => (
  error.response?.data?.error
  || (error.request ? 'No fue posible conectar con el servidor.' : error.message)
);

export default client;
