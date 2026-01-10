
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // تمرير مفتاح الـ API بشكل آمن
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  server: {
    host: true, // مهم جداً للتشغيل في Termux والوصول من متصفح الهاتف
    port: 5173,
    strictPort: true,
  },
  build: {
    target: 'esnext'
  }
});
