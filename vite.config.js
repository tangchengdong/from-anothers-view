import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: process.env.DEPLOY_TARGET === 'github' ? '/from-anothers-view/' : '/',
  server: {
    port: 3000,
    strictPort: true
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'state-vendor': ['zustand'],
          'http-vendor': ['axios']
        }
      }
    }
  }
}))
