import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // HTTPS con certificado autofirmado (por defecto). Los navegadores solo
    // permiten la cámara en HTTPS o localhost, así que el celular lo necesita
    // para escanear QR (https://<IP-del-PC>:5173). `npm run dev:http` lo desactiva.
    ...(mode === 'http' ? [] : [basicSsl()]),
  ],
  server: {
    // Escucha en todas las interfaces: permite abrir la app desde el celular
    // en la misma red Wi-Fi.
    host: true,
    // Dominios de túneles (ngrok / localtunnel) para pruebas fuera de la red local.
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.loca.lt'],
    // Reenvía /api al backend: el navegador solo habla con Vite (mismo origen),
    // así el backend puede seguir en HTTP aunque la página se sirva en HTTPS.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
}))
