/* weatherService.js — the "one API" of the context layer (build-step 4).

   The feed already feels alive from SEASON alone (feedContext.seasonLens), but
   season can't tell a 60° July evening from a 95° one. This fills that gap with
   a real, current reading so #hotday / #coldsnap become true instead of
   seasonal guesses — the difference between "summer" and "it is actually 96° at
   your house right now, don't turn the oven on."

   Honesty + privacy choices, on purpose:
     • Open-Meteo — genuinely keyless and free, the same class of external call
       the app already makes to Nominatim/OSM in geoService.js. No account, no
       token, nothing to leak.
     • We ONLY refresh when a location already exists (geoService.loadLocation).
       We never call getUserLocation() here, so this can never trigger a
       permission prompt on its own — no reading, no weather, season-only. That
       keeps feedContext honest: it upgrades to a real weather tag only when a
       real reading exists (see realWeather() there).
     • Cached for 2h; a stale reading never drives the feed.

   Writes exactly the shape feedContext.realWeather() expects:
     dig_in_weather = { tempF:Number, condition:String, ts:Number } */

import { loadLocation } from '../../services/geoService';

const KEY = 'dig_in_weather';
const FRESH_MS = 2 * 3600 * 1000;   // don't re-fetch within 2h

// WMO weather codes → the coarse buckets feedContext reasons about.
function conditionFor(code) {
  if (code === 0) return 'clear';
  if (code <= 3) return 'cloud';
  if (code === 45 || code === 48) return 'cloud';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'clear';
}

function readCache() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
  catch { return null; }
}

/**
 * Refresh the cached reading if we have a location and the cache is stale.
 * Silent on every failure (offline, blocked, no location) — the feed simply
 * stays season-only. Returns the reading in use, or null.
 */
export async function refreshWeather({ force = false } = {}) {
  const cached = readCache();
  if (!force && cached && (Date.now() - (cached.ts || 0)) < FRESH_MS) return cached;

  const loc = loadLocation();
  if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return cached || null;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}`
      + `&longitude=${loc.lng}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
    const res = await fetch(url);
    if (!res.ok) return cached || null;
    const data = await res.json();
    const tempF = data?.current?.temperature_2m;
    const code = data?.current?.weather_code;
    if (!Number.isFinite(tempF)) return cached || null;
    const reading = { tempF: Math.round(tempF), condition: conditionFor(code), ts: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(reading)); } catch { /* quota */ }
    return reading;
  } catch {
    return cached || null;   // offline / blocked — season-only, no complaint
  }
}

/** The current reading if it's fresh enough to trust, else null. Sync — safe to
    call from render. Mirrors feedContext.realWeather()'s freshness rule. */
export function currentWeather() {
  const w = readCache();
  if (w && Number.isFinite(w.tempF) && (Date.now() - (w.ts || 0)) < 6 * 3600 * 1000) return w;
  return null;
}

/** A short, human label for display — "96°, clear". Null when no fresh reading. */
export function weatherLabel() {
  const w = currentWeather();
  if (!w) return null;
  return `${w.tempF}°, ${w.condition}`;
}
