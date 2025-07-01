import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  build: {
    target: 'es2015', // for better compatibility
    minify: 'esbuild', // fast and efficient
    sourcemap: false, // disable source maps in prod
    outDir: 'dist', // default
    chunkSizeWarningLimit: 500, // to detect big chunks
  },
  server: {
    port: 5173,
    open: false,
  }
})
