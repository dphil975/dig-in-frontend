import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const PYTHON_PORT = 5001;
const NODE_PORT   = 5000;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const pythonTarget = env.VITE_FLASK_BASE || `http://localhost:${PYTHON_PORT}`;

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',

        // ── FIX 1: Remove the wrong `filename` override ─────────────
        // `filename` controls the SERVICE WORKER name, not the manifest.
        // Leaving it unset means the SW is `sw.js` (correct).
        // filename: 'manifest.json',   ← REMOVED

        // Set the manifest filename explicitly (default is manifest.webmanifest)
        manifestFilename: 'manifest.json',

        includeAssets: ['icons/icon.svg', 'icons/icon-maskable.svg'],

        manifest: {
          name: 'Dig In',
          short_name: 'Dig In',
          description: 'Discover local stores, cook from your pantry, earn coins',
          theme_color: '#f4a924',
          background_color: '#0f0f1a',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          categories: ['food', 'lifestyle'],
          icons: [
            {
              src: 'icons/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: 'icons/icon-maskable.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'maskable',
            },
          ],
        },

        workbox: {
          // Pre-cache built static assets
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],

          // ── FIX 2: Lower the per-file ceiling from 5 MB → 2 MB ────
          // This prevents the 4 MB three.js chunk from being precached.
          // The chunk still loads on demand, just not during install.
          maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,

          // ── FIX 3: Exclude large runtime-heavy assets ─────────────
          globIgnores: [
            '**/tesseract/**',       // OCR engine (18 MB) — runtime cached
            '**/*-3d*.js',           // 3D chunks if named that way
            '**/voxel*.js',          // Voxel Chef chunks
            '**/three*.js',          // three.js chunks
            'js/**',                 // public/js scripts loaded on demand, not precached
            'data/**',               // recipe JSON data loaded on demand
          ],

          // Don't cache Vercel API routes via navigateFallback
          navigateFallbackDenylist: [/^\/api\//],

          runtimeCaching: [
            {
              // Tesseract OCR engine — cache on first use
              urlPattern: ({ url }) => url.pathname.startsWith('/tesseract/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'tesseract-ocr',
                expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
                rangeRequests: true,
              },
            },
            {
              // Unsplash images
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'unsplash-images',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // three.js and 3D chunks — cache on first use, not on install
              urlPattern: /\/assets\/(three|voxel|.*-3d).*\.js$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'heavy-js-chunks',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 90 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // API calls — network first
              urlPattern: /^\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 10,
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },

        // ── Service worker stays off in dev ────────────────────────
        devOptions: {
          enabled: false,
        },
      }),
    ],

    resolve: {
      alias: { '@': '/src' },
    },

    optimizeDeps: {
      exclude: ['gif.js', 'html2canvas'],
    },

    // ── FIX 4: Split large dependencies into their own chunks ─────
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Split three.js into its own chunk
            'three': ['three'],
            // Split react into its own chunk
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // Split leaflet into its own chunk
            'leaflet': ['leaflet', 'react-leaflet'],
          },
        },
      },
      // Warn if any chunk exceeds 2 MB
      chunkSizeWarningLimit: 2048,
    },

    server: {
      proxy: {
        // Flask / Python routes
        '/api/scan_pantry':   { target: pythonTarget, changeOrigin: true },
        '/api/spin_rolodex':  { target: pythonTarget, changeOrigin: true },
        '/api/substitute':    { target: pythonTarget, changeOrigin: true },
        '/api/search_recipe': { target: pythonTarget, changeOrigin: true },
        '/api/shopping_list': { target: pythonTarget, changeOrigin: true },
        '/api/timeline':      { target: pythonTarget, changeOrigin: true },
        '/api/start_timer':   { target: pythonTarget, changeOrigin: true },

        '/food/recommend':  { target: pythonTarget, changeOrigin: true },
        '/food/search':     { target: pythonTarget, changeOrigin: true },
        '/food/sources':    { target: pythonTarget, changeOrigin: true },
        '/badges/progress': { target: pythonTarget, changeOrigin: true },

        '/api/recipe-ai': { target: 'http://localhost:5003', changeOrigin: true },
        '/api/recalls':   { target: 'http://localhost:5003', changeOrigin: true },

        '/api':    { target: `http://localhost:${NODE_PORT}`, changeOrigin: true },
        '/health': { target: `http://localhost:${NODE_PORT}`, changeOrigin: true },
      },
    },
  };
});