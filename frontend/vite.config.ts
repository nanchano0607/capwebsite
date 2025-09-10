import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/cap': {
        target: 'http://localhost:8080', // 스프링 서버 주소
        changeOrigin: true,
      },'/cart': {
        target: 'http://localhost:8080', // 스프링 서버 주소
        changeOrigin: true,
      },'/api': {
        target: 'http://localhost:8080', // 스프링 서버 주소
        changeOrigin: true,
      },
    },
  },
})