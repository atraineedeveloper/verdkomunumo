import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-512x512.png'
      ],
      manifest: {
        id: '/',
        name: 'Verdkomunumo',
        short_name: 'Verdkomunumo',
        description: 'La verda komunumo de Esperantujo.',
        theme_color: '#00923f',
        background_color: '#f5faf7',
        display: 'standalone',
        start_url: '/',
        lang: 'eo',
        scope: '/',
        orientation: 'portrait',
        categories: ['social', 'education', 'community'],
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
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/_/, /\/[^/?]+\.[^/]+$/],
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor'
          if (id.includes('@tanstack/react-query')) return 'query-vendor'
          if (id.includes('@supabase/')) return 'supabase-vendor'
          if (id.includes('react-router-dom')) return 'router-vendor'
          if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n-vendor'
          if (id.includes('lucide-react')) return 'icons-vendor'
          if (id.includes('zod')) return 'validation-vendor'

          return undefined
        },
      },
    },
  },
  server: { port: 5174 }
})
