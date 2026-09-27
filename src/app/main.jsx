import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../lib/analytics';
import '../styles/fonts.css';
import '../styles/tailwind.css';
import '../styles/styles.css';
import '../styles/catalog.css';
import '../styles/theme.css';
import { applyDisplay } from '../lib/appSkins';

applyDisplay();

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
