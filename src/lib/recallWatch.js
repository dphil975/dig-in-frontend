/* recallWatch.js — real, ONGOING recall coverage for whatever is actually
   sitting in the pantry, not just the moment an item was scanned.

   Before this, checkFoodRecalls() (lib/barcodeLookup.js) only ever ran the
   instant you typed a barcode in — so a receipt-imported item never got
   checked at all, and if the FDA issued a recall a week AFTER you'd already
   stocked something (the exact "Taylor Farms situation" case), you'd never
   find out. This gives every unique item in the pantry a standing, cached,
   periodically-refreshed check against the same real openFDA feed —
   deduped by name so a pantry with 30 items doesn't fire 30 requests every
   time, and throttled so a recheck doesn't happen more than once a day per
   item. Shared by the Pantry page (attaches results back onto each item) and
   the Home feed's info bar (reads the same cache read-only). */

import { checkFoodRecalls } from './barcodeLookup';

const CACHE_KEY = 'dig_in_recall_cache'; // { [nameKey]: { recalls, checkedAt } }
const RECHECK_MS = 24 * 3600 * 1000;     // don't re-hit openFDA for the same item more than once/day
const MAX_CHECKS_PER_PASS = 12;          // keep one pass bounded even for a big pantry

function nameKey(name) {
  return String(name || '').trim().toLowerCase();
}

function loadCache() {
  try { const v = JSON.parse(localStorage.getItem(CACHE_KEY)); return v && typeof v === 'object' ? v : {}; }
  catch { return {}; }
}
function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* ignore */ }
}

/**
 * Bring the recall cache up to date for every DISTINCT item name in the given
 * pantry (dedup so repeats — "Bananas" bought three trips running — cost one
 * lookup, not three). Skips anything checked within the last 24h. Returns
 * { hitsByName: { [nameKey]: recall[] }, newHits: [{ name, recalls }] } —
 * `newHits` is only the ones that are NEWLY flagged this pass, for a
 * "you should know about this" notification; `hitsByName` is the full,
 * current picture (cache + whatever just got checked) for rendering.
 */
export async function refreshPantryRecalls(pantryItems, { maxChecks = MAX_CHECKS_PER_PASS } = {}) {
  const cache = loadCache();
  const now = Date.now();
  const seen = new Set();
  const toCheck = [];
  for (const item of pantryItems || []) {
    const key = nameKey(item?.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const cached = cache[key];
    if (!cached || (now - (cached.checkedAt || 0)) > RECHECK_MS) toCheck.push({ key, name: item.name });
  }

  const newHits = [];
  for (const { key, name } of toCheck.slice(0, maxChecks)) {
    const recalls = await checkFoodRecalls(name);
    const hadHitBefore = (cache[key]?.recalls?.length || 0) > 0;
    cache[key] = { recalls, checkedAt: now, name };
    if (recalls.length && !hadHitBefore) newHits.push({ name, recalls });
  }
  saveCache(cache);

  const hitsByName = {};
  for (const key of seen) {
    if (cache[key]?.recalls?.length) hitsByName[key] = { name: cache[key].name, recalls: cache[key].recalls };
  }
  return { hitsByName, newHits };
}

/* ── The general feed (not tied to your pantry) ───────────────────────────────
   The Fresh tab's Recall Watch shows what's being recalled RIGHT NOW even when
   your pantry is empty or nothing you own matches — so someone can find out
   about the Taylor Farms situation before they've scanned a single thing. Same
   real openFDA food-enforcement feed, just queried broadly (most recent first)
   and cached once a day so opening Fresh doesn't hammer the API. */
const FEED_CACHE_KEY = 'dig_in_recall_feed';   // { recalls, fetchedAt }
const FEED_BASE = 'https://api.fda.gov/food/enforcement.json';

function loadFeedCache() {
  try { const v = JSON.parse(localStorage.getItem(FEED_CACHE_KEY)); return v && typeof v === 'object' ? v : null; }
  catch { return null; }
}

/** Read-only snapshot of the last fetched general feed — no network. */
export function cachedRecentRecalls() {
  return loadFeedCache()?.recalls || [];
}

/**
 * Fetch the most recent U.S. food recalls generally (default: the more serious
 * Class I / II, newest first). Cached for a day; returns the cached list
 * untouched if it's still fresh. Always resolves to an array — [] on any error,
 * same honest-empty rule as the rest of the app.
 */
export async function fetchRecentRecalls({ limit = 12, force = false } = {}) {
  const cached = loadFeedCache();
  if (!force && cached && (Date.now() - (cached.fetchedAt || 0)) < RECHECK_MS) {
    return cached.recalls || [];
  }

  // 1) Preferred source: our own server-side scraper of the FDA's CURRENT
  //    recall press-release feed (api/recalls.js). It's weeks fresher than
  //    openFDA, but has to run server-side because fda.gov sends no CORS header.
  //    In local dev this only answers when `npm run dev:ai` is up; otherwise the
  //    request fails and we fall through to openFDA.
  try {
    const res = await fetch(`/api/recalls?limit=${limit}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.recalls) && json.recalls.length) {
        try { localStorage.setItem(FEED_CACHE_KEY, JSON.stringify({ recalls: json.recalls, fetchedAt: Date.now() })); } catch { /* quota */ }
        return json.recalls;
      }
    }
  } catch { /* scraper unreachable — fall through to the openFDA fallback */ }

  // 2) Fallback: the openFDA enforcement DB, straight from the browser (CORS is
  //    fine here). It lags by weeks because it only lists recalls AFTER they're
  //    classified — but it's better than nothing when the scraper is down.
  try {
    const search = 'status:"Ongoing"+AND+(classification:"Class+I"+classification:"Class+II")';
    const url = `${FEED_BASE}?search=${search}&sort=recall_initiation_date:desc&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return cached?.recalls || [];  // 404 = no matches; keep last good list
    const json = await res.json();
    const recalls = (json.results || []).map((r) => ({
      description: r.product_description,
      reason: r.reason_for_recall,
      classification: r.classification,
      severity: r.classification === 'Class I' ? 'high' : r.classification === 'Class III' ? 'low' : 'medium',
      date: r.recall_initiation_date,
      state: r.state,
      firm: r.recalling_firm,
      link: null,
      source: 'openfda',
    }));
    try { localStorage.setItem(FEED_CACHE_KEY, JSON.stringify({ recalls, fetchedAt: Date.now() })); } catch { /* quota */ }
    return recalls;
  } catch {
    return cached?.recalls || [];
  }
}

/** Read-only: whatever the cache currently says, no network call — what the
    Home feed's info bar uses so opening the feed never itself fires a check. */
export function cachedPantryRecalls(pantryItems) {
  const cache = loadCache();
  const seen = new Set();
  const hits = [];
  for (const item of pantryItems || []) {
    const key = nameKey(item?.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (cache[key]?.recalls?.length) hits.push({ name: cache[key].name, recalls: cache[key].recalls });
  }
  return hits;
}
