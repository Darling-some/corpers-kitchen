import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/corpers-kitchen/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: "Corpers Kitchen — Fresh Noodles, Potatoes & Weekend Specials",
        short_name: 'Corpers Kitchen',
        description: 'Order food and track the live kitchen queue in real time.',
        theme_color: '#160F2E',
        background_color: '#160F2E',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/corpers-kitchen/',
        scope: '/corpers-kitchen/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [{ urlPattern: ({ url }) => url.pathname.startsWith('/corpers-kitchen/'), handler: 'StaleWhileRevalidate', options: { cacheName: 'ck-app-shell' } }],
      },
    }),
  ],
  build: { sourcemap: false, chunkSizeWarningLimit: 700 },
})
