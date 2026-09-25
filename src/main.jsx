import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Leaflet marker-icon fix (see src/lib/leafletSetup.js) is imported directly by
// each component that uses Leaflet instead of eagerly here — importing it at
// startup forced leaflet's ~250KB (gzipped) into the main entry chunk for every
// user, including ones who never open a map.
import './lib/analytics';
import './styles/tailwind.css';   // Tailwind utilities (preflight disabled — see tailwind.config.js)
import './styles/styles.css';
import './styles/catalog.css';
import './styles/theme.css';
import { applyDisplay } from './lib/appSkins';

// Apply the saved skin + display preferences (contrast, motion, text size,
// spacing) BEFORE first paint, so nobody sees a flash of the default theme
// before their own settings land.
applyDisplay();

// Dev-only guard against a recurring false-positive: vite-plugin-pwa's dev
// service worker (vite.config.js's VitePWA devOptions.enabled) precaches
// against Vite's dev module graph, whose URLs aren't content-hashed like a
// real build's — so a tab that already has the SW installed keeps serving
// code from before your latest edit, survives a normal refresh, and reads as
// "the page is broken" when the source is actually fine. devOptions is meant
// to stay OFF, but it's a plain boolean in an untracked config file with
// nothing enforcing it, and it has already been flipped back on by accident
// once. This unregisters any SW already installed from a past `enabled: true`
// stint — flipping the config back off only stops NEW installs, it doesn't
// remove one already sitting in the browser (a hard refresh doesn't either;
// normally only DevTools → Application → Unregister does). Production is
// unaffected: this whole block is compiled out when import.meta.env.DEV is
// false, and the real PWA service worker there is unrelated to devOptions.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => Promise.all(regs.map(r => r.unregister())))
    .catch(() => {});
  if (window.caches) {
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .catch(() => {});
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
