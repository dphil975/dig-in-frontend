/* foodPassport.js — City Food Passport: real region detection, a real
   stamp collection, and two real per-region reads (your own cook history,
   the actual store file for that region). No fabricated community data, no
   fabricated named restaurants — see cityFoodData.js's header for why.

   Detection chains three functions that already exist elsewhere in the app
   (native.js's geolocation + reverse-geocode, zipToState.js's boroughForZip)
   rather than inventing a new location pipeline — the exact same path
   FoodMap already uses to pick which region's store file to load. */

import { hasGeolocation, getCurrentPosition, reverseGeocodeZip } from './native';
import { boroughForZip } from './zipToState';
import { BOROUGHS, STORE_FILE_BY_BOROUGH, STORE_TYPE_LABELS } from '../data/storeData';
import { cityFoodDataFor } from '../data/cityFoodData';
import { getCookHistory } from '../services/saveService';
import { pushBadge } from './syncService';

const PASSPORT_KEY = 'dig_in_food_passport';
const BADGES_KEY = 'dig_in_badges';
const STAMP_COINS = 40;

/* ── Region detection ─────────────────────────────────────────── */

/** Try the device's real GPS → ZIP → BOROUGHS id. Returns null at any step
    that fails (permission denied, offline, unrecognized ZIP) — callers
    should fall back to manual ZIP entry, same as FoodMap/Pantry already do. */
export async function detectRegionFromDevice() {
  if (!hasGeolocation()) return null;
  try {
    const { lat, lng } = await getCurrentPosition({ timeout: 8000 });
    const zip = await reverseGeocodeZip(lat, lng);
    return zip ? boroughForZip(zip) : null;
  } catch {
    return null;
  }
}

/** Manual ZIP fallback — the same boroughForZip lookup, no network call. */
export function detectRegionFromZip(zip) {
  return boroughForZip(zip);
}

export function regionMeta(regionId) {
  return BOROUGHS.find(b => b.id === regionId) || null;
}

/* ── Passport (stamp collection) ──────────────────────────────── */

function loadRaw() {
  try { return JSON.parse(localStorage.getItem(PASSPORT_KEY) || '{"stamps":[]}'); }
  catch { return { stamps: [] }; }
}
function saveRaw(p) {
  try { localStorage.setItem(PASSPORT_KEY, JSON.stringify(p)); } catch { /* quota */ }
}

export function loadPassport() {
  return loadRaw();
}

function loadBadges() {
  try { return JSON.parse(localStorage.getItem(BADGES_KEY)) || []; } catch { return []; }
}
function awardBadge(id, label, icon) {
  const list = loadBadges();
  if (list.some(b => b.id === id)) return null;
  const badge = { id, label, icon, earnedAt: Date.now() };
  try { localStorage.setItem(BADGES_KEY, JSON.stringify([...list, badge])); } catch { /* quota */ }
  pushBadge(badge);
  return badge;
}

function addCoins(n) {
  try {
    const cur = parseInt(localStorage.getItem('dig_in_coins') || '0', 10);
    localStorage.setItem('dig_in_coins', String(cur + n));
  } catch { /* ignore */ }
}

/** Idempotent: stamping a region you already hold does nothing new.
    Returns { isNew, stamp, coinsEarned, badge }. */
export function stampRegion(regionId) {
  if (!regionId) return { isNew: false };
  const passport = loadRaw();
  const already = passport.stamps.find(s => s.regionId === regionId);
  if (already) return { isNew: false, stamp: already };

  const stamp = { regionId, firstVisitISO: new Date().toISOString() };
  passport.stamps = [...passport.stamps, stamp];
  saveRaw(passport);
  addCoins(STAMP_COINS);

  let badge = null;
  const count = passport.stamps.length;
  if (count === 1) badge = awardBadge('passport-first-stamp', 'First Stamp', '🛂');
  if (count === 5) badge = awardBadge('passport-5', 'Five Regions', '🗺️');
  if (count === 10) badge = awardBadge('passport-10', 'Ten Regions', '🌎');

  return { isNew: true, stamp, coinsEarned: STAMP_COINS, badge };
}

/* ── Per-region reads (real, honest) ──────────────────────────── */

/** Recipes YOU have actually cooked that match this region's real cuisine
    tags — personal cook history, never a fabricated community count. */
export function dishesCookedFromRegion(regionId) {
  const data = cityFoodDataFor(regionId);
  if (!data) return [];
  const tags = data.cuisineTags.map(t => t.toLowerCase());
  const history = getCookHistory();
  return history.filter(entry => {
    const c = String(entry.cuisine || entry.country || '').toLowerCase();
    return tags.some(t => c.includes(t) || t.includes(c));
  });
}

const fileCache = new Map();

/** Real stores from the region's actual store file, filtered to the store
    types cityFoodData.js associates with that region's food identity. Never
    a named restaurant we made up — these are the same OSM-sourced points
    FoodMap plots. Capped so a huge state file doesn't overwhelm the card. */
export async function localSpotsForRegion(regionId, { limit = 8 } = {}) {
  const data = cityFoodDataFor(regionId);
  const file = STORE_FILE_BY_BOROUGH[regionId];
  if (!file) return [];

  let stores = fileCache.get(file);
  if (!stores) {
    stores = await fetch(file).then(r => r.json()).then(d => d.stores || []).catch(() => []);
    fileCache.set(file, stores);
  }

  const wantTypes = data?.storeTypes || [];
  const filtered = wantTypes.length ? stores.filter(s => wantTypes.includes(s.type)) : stores;
  return filtered.slice(0, limit).map(s => ({
    name: s.name,
    type: STORE_TYPE_LABELS[s.type] || s.type,
    neighborhood: s.neighborhood || '',
    address: s.address || '',
  }));
}
