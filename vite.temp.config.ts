import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {olinia} from 'vite-plugin-olinia';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    olinia(),
    VitePWA({ registerType: 'autoUpdate' }),
  ],
  build: {
    outDir: '/tmp/web-build',
    emptyOutDir: true
  },
  base: './',
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
});
