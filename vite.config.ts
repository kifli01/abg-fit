import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  publicDir: 'assets',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['app-icons/abgFit-180.png'],
      manifest: {
        name: 'abgFit',
        short_name: 'abgFit',
        description: 'Your AI-powered fitness companion',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/app-icons/abgFit-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/app-icons/abgFit-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/app-icons/abgFit-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ]
});
