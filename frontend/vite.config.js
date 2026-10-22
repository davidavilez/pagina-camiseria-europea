import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Reenvía /api al backend: el navegador solo habla con Vite (mismo origen).
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
