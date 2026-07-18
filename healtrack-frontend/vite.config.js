import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Automatically updates the service worker when new content is available
      registerType: 'autoUpdate',

      // Includes all source assets in the service worker build
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'maskable-icon.png'],

      // Web App Manifest configuration
      manifest: {
        name: 'Healtrack',
        short_name: 'Heal',
        description: 'A fully functional healthcare app',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },

      // Workbox options for fine-tuning caching strategies
      workbox: {
        maximumFileSizeToCacheInBytes: 4000000,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-data-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          }
        ]
      },

      // Enable developer mode to test the service worker locally
      devOptions: {
        enabled: true
      }
    })
  ]
})
