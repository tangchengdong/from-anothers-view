import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/from-anothers-view/' : '/',
  server: {
    port: 3000,
    strictPort: true
  }
}))
