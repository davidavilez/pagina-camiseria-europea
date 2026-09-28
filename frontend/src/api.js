import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  try {
    const session = JSON.parse(localStorage.getItem('inventario-session') || 'null');
    if (session?.token) {
      config.headers.Authorization = `Bearer ${session.token}`;
    }
  } catch {
    localStorage.removeItem('inventario-session');
  }
  return config;
});

export default api;