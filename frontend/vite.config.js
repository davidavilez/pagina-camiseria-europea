import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// Reenvía /api al backend: el navegador solo habla con Vite (mismo origen),
// así el backend puede seguir en HTTP aunque la página se sirva en HTTPS y,
// con un túnel, basta exponer el puerto del frontend.
const proxy = {
  '/api': 'http://localhost:3000',
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // HTTPS con certificado autofirmado (por defecto). Los navegadores solo
    // permiten la cámara en HTTPS o localhost, así que el celular lo necesita
    // para escanear QR (https://<IP-del-PC>:5173). `npm run dev:http` lo desactiva
    // (necesario con el túnel de Cloudflare, que ya entrega HTTPS).
    ...(mode === 'http' ? [] : [basicSsl()]),
  ],
  server: {
    port: 5173,
    // Si el 5173 está ocupado falla en vez de cambiar de puerto (el túnel apunta a 5173).
    strictPort: true,
    // Escucha en todas las interfaces: permite abrir la app desde el celular
    // en la misma red Wi-Fi.
    host: true,
    // TEMPORAL: presentación remota, revertir después. Acepta cualquier Host
    // (dominios aleatorios *.trycloudflare.com del túnel).
    allowedHosts: true,
    proxy,
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
    allowedHosts: true,
    proxy,
  },
}))
