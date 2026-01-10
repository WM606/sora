
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // نستخدم fallback لضمان عدم تمرير undefined كقيمة نصية
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  server: {
    host: true, 
    port: 5173,
    strictPort: true,
  },
  build: {
    target: 'esnext'
  }
});
