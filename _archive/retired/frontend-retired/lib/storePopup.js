/* Rich store popup for the recipe-page Food Map — hours/open-now, a
   "Directions" button (opens the device's maps app via geolocation-aware
   Google Maps directions), and a "Check In" button that only succeeds once
   GPS confirms you're actually standing at the store (same ~320m radius the
   Home map's check-in uses, so "arrive, then check in" behaves the same
   everywhere in the app). Popup HTML is plain strings — Leaflet popups
   aren't React-rendered — so buttons are wired imperatively on 'popupopen'. */

import { getCurrentPosition, hasGeolocation } from './native';
import { haversineKm } from '../services/geoService';
import { parseOpenNow, formatHoursDisplay } from './storeHours';
import { busynessAt, busynessLabel, bestWindow, isCarDependent } from './shopTiming';

const CHECKIN_RADIUS_M = 320;

function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function buildStorePopupHTML({ store, color, label, distLabel, visitCount }) {
  const hours = formatHoursDisplay(store.opening_hours || store.hours);
  const isOpen = parseOpenNow(store.opening_hours || store.hours);
  const metaRow = (hours || isOpen !== null) ? `
    <div class="fm-pop-meta">
      ${isOpen !== null ? `<span class="fm-pop-status ${isOpen ? 'open' : 'closed'}">${isOpen ? '● Open now' : '● Closed'}</span>` : ''}
      ${hours ? `<span class="fm-pop-hours">${escapeHTML(hours)}</span>` : ''}
    </div>` : '';

  // Best-time-to-shop line — modeled busyness for right now + when it's calmest.
  // Leans on this most in car-dependent metros (drive + parking peak together).
  const level = busynessAt(store);
  const busyClass = level >= 75 ? 'packed' : level >= 50 ? 'busy' : 'calm';
  const parkNote = isCarDependent(store.borough) && level >= 60 ? ' · lot is slammed too' : '';
  const timingRow = `
    <div class="fm-pop-timing">
      <span class="fm-pop-busy ${busyClass}">● ${busynessLabel(level)} right now${parkNote}</span>
      <span class="fm-pop-best">${bestWindow()}</span>
    </div>`;

  // Benefit badges — only rendered where the dataset carries the flag. SNAP is
  // shown whenever explicitly true; WIC (stricter vendor stocking) likewise.
  const benefitRow = (store.acceptsSNAP || store.acceptsWIC) ? `
    <div class="fm-pop-benefits">
      ${store.acceptsSNAP ? '<span class="fm-pop-benefit snap">SNAP / EBT</span>' : ''}
      ${store.acceptsWIC ? '<span class="fm-pop-benefit wic">WIC</span>' : ''}
    </div>` : '';

  return `
    <div class="fm-pop">
      <div class="fm-pop-header" style="background:${color}">
        <span class="fm-pop-type">${escapeHTML(label)}</span>
        <div class="fm-pop-name">${escapeHTML(store.name || 'Store')}</div>
        ${store.address ? `<div class="fm-pop-addr">${escapeHTML(store.address)}</div>` : ''}
      </div>
      ${metaRow}
      ${timingRow}
      ${benefitRow}
      ${distLabel ? `<div class="fm-pop-dist">${escapeHTML(distLabel)}</div>` : ''}
      <div class="fm-pop-visits">${visitCount > 0 ? `✓ ${visitCount} visit${visitCount !== 1 ? 's' : ''}` : 'No visits yet'}</div>
      <div class="fm-pop-actions">
        <button class="fm-pop-checkin" data-action="checkin" type="button">Check In</button>
        <button class="fm-pop-directions" data-action="directions" type="button">↗ Directions</button>
      </div>
      <button class="fm-pop-memory" data-action="memory" type="button">📇 Store Memory</button>
    </div>`;
}

/** Wire the popup's Directions + Check In + Store Memory buttons once its DOM
    exists. `onOpenMemory` is optional — the button only renders/wires when
    the caller passes one, so plain (non-rich) popups are unaffected. */
export function wireStorePopupButtons(marker, store, { onCheckin, onOpenMemory } = {}) {
  marker.on('popupopen', e => {
    const root = e.popup.getElement();
    if (!root) return;
    const memBtn = root.querySelector('[data-action="memory"]');
    if (memBtn) {
      if (onOpenMemory) memBtn.onclick = () => onOpenMemory(store);
      else memBtn.style.display = 'none';
    }
    const dirBtn = root.querySelector('[data-action="directions"]');
    const ckBtn  = root.querySelector('[data-action="checkin"]');

    if (dirBtn) dirBtn.onclick = () => {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`, '_blank', 'noopener');
    };

    if (ckBtn) ckBtn.onclick = () => {
      if (!hasGeolocation()) { ckBtn.textContent = 'GPS unavailable'; return; }
      ckBtn.textContent = 'Verifying…';
      ckBtn.disabled = true;
      ckBtn.classList.add('verifying');

      const fail = msg => {
        ckBtn.textContent = msg;
        ckBtn.classList.remove('verifying');
        ckBtn.classList.add('error');
        setTimeout(() => {
          ckBtn.textContent = 'Check In';
          ckBtn.disabled = false;
          ckBtn.classList.remove('error');
        }, 4000);
      };

      getCurrentPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 })
        .then(({ lat, lng }) => {
          const distM = haversineKm(lat, lng, store.lat, store.lng) * 1000;
          if (distM > CHECKIN_RADIUS_M) return fail(`Too far · ${Math.round(distM)}m`);
          onCheckin?.(store);
          ckBtn.textContent = '✓ Checked In';
          ckBtn.classList.remove('verifying');
          ckBtn.classList.add('done');
        })
        .catch(() => fail('Location needed'));
    };
  });
}
