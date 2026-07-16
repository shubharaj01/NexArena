import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../static'),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/chat': 'http://127.0.0.1:8000',
      '/faq': 'http://127.0.0.1:8000',
      '/announcement': 'http://127.0.0.1:8000',
      '/translation': 'http://127.0.0.1:8000',
      '/planner': 'http://127.0.0.1:8000',
    }
  }
})
