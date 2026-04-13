import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { UserConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'mask-icon.svg'],
      manifest: {
        name: 'Tick Tack Boom Greek',
        short_name: 'TickTackBoom',
        description: 'The Greek version of the classic Tick Tack Boom board game',
        lang: 'el',
        background_color: '#020617',
        theme_color: '#020617',
        icons: [
          {
            src: 'icon.svg',
            sizes: '1024x1024',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.tsx',
  },
  server: {
    watch: {
      usePolling: true,
    },
    host: true, // needed for the Docker Container port mapping to work
    strictPort: true,
    port: 5173, 
  }
} as any)
