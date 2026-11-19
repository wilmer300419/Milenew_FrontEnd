import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // URL del BackEnd Flask para el proxy de desarrollo (solo la usa Vite, no el navegador)
  const backendUrl = env.BACKEND_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      css: false,
      restoreMocks: true,
    },
    server: {
      port: 5173,
      proxy: {
        // El navegador llama a /api/... en el mismo origen y Vite lo reenvía a Flask
        '/api': { target: backendUrl, changeOrigin: true },
      },
    },
  }
})
