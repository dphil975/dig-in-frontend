import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// In production (Vercel) there is no dev-server proxy — the frontend calls
// VITE_FLASK_BASE directly (absolute URL).  In local dev VITE_FLASK_BASE is
// empty, so these proxy rules route the Flask paths to localhost:5001 instead.
const PYTHON_PORT = 5001;
const NODE_PORT   = 5000;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // When VITE_FLASK_BASE is set we're running against a deployed backend;
  // the proxy rules below are dev-only and won't be used.
  const pythonTarget = env.VITE_FLASK_BASE || `http://localhost:${PYTHON_PORT}`;

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        filename: 'manifest.json',
        includeAssets: ['icons/icon.svg', 'icons/icon-maskable.svg'],
        manifest: {
          name: 'Dig In',
          short_name: 'Dig In',
          description: 'Pixel-art NYC food app — discover local stores, cook from your pantry, earn coins',
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
          // Pre-cache all built static assets
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
          // Default 2 MiB cap is too small once three.js is in the main
          // bundle (the 3D Voxel Chef builder) — raise it so that chunk
          // still gets precached instead of silently falling out of the SW.
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          // The Tesseract OCR engine (large wasm/model) is runtime-cached on
          // first use, not precached — keep it out of the install manifest.
          globIgnores: ['**/tesseract/**'],
          // Don't cache the Vercel API routes or Leaflet tile URLs
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              // Self-hosted Tesseract OCR engine (worker + wasm core + language
              // model). CacheFirst so it downloads once on the first receipt
              // scan, then the pantry's photo OCR works fully offline — without
              // bloating the SW install with ~18MB of precache upfront.
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
              // Google Fonts stylesheets
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Google Fonts files
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Unsplash images (Social Feed photos) — cache up to 50
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'unsplash-images',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // API calls — network first, fall back to cache for offline resilience
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
        // A service worker in the dev server is a trap: Vite's dev module URLs
        // aren't content-hashed the way a production build's are, so a
        // workbox precache/navigateFallback in an already-open tab can keep
        // serving code from before your latest edits — and a hard refresh
        // alone doesn't fix it, only DevTools → Application → Unregister does.
        // That's caused "the page won't render" reports that didn't reproduce
        // in any fresh browser session. Nothing in dev currently depends on
        // it (push notifications aren't wired to a real SW yet — see
        // src/pages/Nudges). To test real PWA/offline behavior, use
        // `npm run build && npm run preview`, which still runs the full
        // production service worker below.
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: { '@': '/src' },
    },
    server: {
      proxy: {
        // ── Flask / Python routes (must come before the generic /api rule) ──────
        // These paths all resolve to PYTHON_PORT in dev.
        '/api/scan_pantry':   { target: pythonTarget, changeOrigin: true },
        '/api/spin_rolodex':  { target: pythonTarget, changeOrigin: true },
        '/api/substitute':    { target: pythonTarget, changeOrigin: true },
        '/api/search_recipe': { target: pythonTarget, changeOrigin: true },
        '/api/shopping_list': { target: pythonTarget, changeOrigin: true },
        '/api/timeline':      { target: pythonTarget, changeOrigin: true },
        '/api/start_timer':   { target: pythonTarget, changeOrigin: true },

        // Specific Flask API sub-paths the frontend calls directly (CravingSearch
        // → /food/recommend, badge progress → /badges/progress). These are deeper
        // than the bare client routes (/social, /badges, /pixel-*), so they proxy
        // to Python WITHOUT swallowing those SPA navigations. Add new Flask API
        // sub-paths here (never the bare namespace) as the frontend grows.
        '/food/recommend':  { target: pythonTarget, changeOrigin: true },
        '/food/search':     { target: pythonTarget, changeOrigin: true },
        '/food/sources':    { target: pythonTarget, changeOrigin: true },
        '/badges/progress': { target: pythonTarget, changeOrigin: true },

        // ── AI recipe handler + FDA recall scraper (Vercel functions, local
        //    dev runner on 5003 via `npm run dev:ai`) ───────────────────────────
        '/api/recipe-ai': { target: 'http://localhost:5003', changeOrigin: true },
        '/api/recalls':   { target: 'http://localhost:5003', changeOrigin: true },

        // ── Node backend (generic /api catch-all — must be last) ────────────────
        '/api':    { target: `http://localhost:${NODE_PORT}`, changeOrigin: true },
        '/health': { target: `http://localhost:${NODE_PORT}`, changeOrigin: true },
      },
    },
  };
});
