import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // base relativo: el build funciona en GitHub Pages (user.github.io/repo/) y en cualquier subcarpeta
  base: './',
  plugins: [react()],
  server: { port: 5173, host: true },
})
