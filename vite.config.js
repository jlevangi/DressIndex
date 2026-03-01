import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import os from 'node:os'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const allowedHosts = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(',').map(h => h.trim())
    : []
  const cacheDir = path.join(
    os.tmpdir(),
    'vite-cache',
    'dressindex',
    `${process.platform}-${process.arch}`,
  )

  return {
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        registerType: 'autoUpdate',
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          globIgnores: ['**/Gemini_Generated_*.png'],
        },
        manifest: {
          name: 'DressIndex',
          short_name: 'DressIndex',
          description: 'Weather-based clothing recommendations',
          theme_color: '#0a0a0a',
          background_color: '#0a0a0a',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    cacheDir,
    server: {
      host: true,
      allowedHosts,
      watch: {
        usePolling: true,
      },
    },
  }
})
