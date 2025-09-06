import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://automazo-production.up.railway.app',
        changeOrigin: true,
      },
    },
  },
});
