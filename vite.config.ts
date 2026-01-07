import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

// قراءة متغيرات البيئة من ملف .env
dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  define: {
    // يتيح استخدام process.env.API_KEY في الكود
    'process.env': process.env
  }
});
