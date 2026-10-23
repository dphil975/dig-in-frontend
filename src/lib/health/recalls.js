/* recalls.js — real, ongoing FDA recall coverage for the pantry and for recipes.

   Split out of recallWatch.js (which also holds the nutrition and pregnancy
   references) so the Nova home page, the recipe page and the pantry can show a
   recall banner without loading those tables. recallWatch.js re-exports
   everything here, so old imports still work. */

import { checkFoodRecalls } from '../pantry/barcodeLookup';

/* ════════════════════════════════════════════════════════════════════════
   FROM: src/lib/recallWatch.js
   ════════════════════════════════════════════════════════════════════════ */

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

const CACHE_KEY = 'dig_in_recall_cache'; // { [nameKey]: { recalls, checkedAt } }
const RECHECK_MS = 4 * 3600 * 1000;      // recheck every 4 hours for near-real-time coverage
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
   your pantry is empty or nothing you own matches -- so someone can find out
   about the Taylor Farms situation before they've scanned a single thing.

   The server-side endpoint (api/recalls.js) now merges the FDA press-release
   RSS (freshest, within hours) with the openFDA enforcement DB (classified,
   lags by days). We fetch from it first; if it's down, fall back to openFDA
   directly from the browser. Cached for 2 hours so the app stays near
   real-time without hammering the API. Auto-refetches when the user returns
   to the tab (visibilitychange) if the cache is stale. */
const FEED_CACHE_KEY = 'dig_in_recall_feed';   // { recalls, fetchedAt }
const FEED_STALE_MS = 2 * 3600 * 1000;         // 2 hours
const FEED_BASE = 'https://api.fda.gov/food/enforcement.json';
const NOTIFY_KEY = 'dig_in_recall_notified';    // Set of recall ids already shown

function loadFeedCache() {
  try { const v = JSON.parse(localStorage.getItem(FEED_CACHE_KEY)); return v && typeof v === 'object' ? v : null; }
  catch { return null; }
}

function isFeedStale() {
  const cached = loadFeedCache();
  return !cached || (Date.now() - (cached.fetchedAt || 0)) >= FEED_STALE_MS;
}

/** Read-only snapshot of the last fetched general feed -- no network. */
export function cachedRecentRecalls() {
  return loadFeedCache()?.recalls || [];
}

let feedInFlight = null;

export function fetchRecentRecalls({ limit = 15, force = false } = {}) {
  const cached = loadFeedCache();
  if (!force && cached && (Date.now() - (cached.fetchedAt || 0)) < FEED_STALE_MS) {
    return Promise.resolve(cached.recalls || []);
  }
  if (!feedInFlight) {
    feedInFlight = loadRecentFeed(limit, cached).finally(() => { feedInFlight = null; });
  }
  return feedInFlight;
}

async function loadRecentFeed(limit, cached) {

  // 1) Preferred: server-side merged feed (RSS + openFDA). The server merges
  //    both sources, deduplicates, and scores by urgency. Edge-cached for 15
  //    minutes so most requests never hit the FDA at all.
  try {
    const res = await fetch(`/api/recalls?limit=${limit}&sources=all`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.recalls) && json.recalls.length) {
        const now = Date.now();
        try { localStorage.setItem(FEED_CACHE_KEY, JSON.stringify({ recalls: json.recalls, fetchedAt: now })); } catch { /* quota */ }
        notifyNewRecalls(json.recalls, cached?.recalls);
        return json.recalls;
      }
    }
  } catch { /* scraper unreachable -- fall through to openFDA */ }

  // 2) Fallback: openFDA enforcement DB directly from the browser (CORS OK).
  try {
    const search = 'status:"Ongoing"+AND+(classification:"Class+I"+OR+classification:"Class+II")';
    const url = `${FEED_BASE}?search=${search}&sort=recall_initiation_date:desc&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return cached?.recalls || [];
    const json = await res.json();
    const recalls = (json.results || []).map((r) => ({
      id: r.recall_number || null,
      description: r.product_description,
      reason: r.reason_for_recall,
      classification: r.classification,
      severity: r.classification === 'Class I' ? 'high' : r.classification === 'Class III' ? 'low' : 'medium',
      date: r.recall_initiation_date,
      state: r.state,
      firm: r.recalling_firm,
      link: null,
      category: null,
      allergens: null,
      source: 'openfda',
    }));
    try { localStorage.setItem(FEED_CACHE_KEY, JSON.stringify({ recalls, fetchedAt: Date.now() })); } catch { /* quota */ }
    notifyNewRecalls(recalls, cached?.recalls);
    return recalls;
  } catch {
    return cached?.recalls || [];
  }
}

// ── Real-time: refetch when the user returns to the tab ──────────────────────
let visListenerAttached = false;
export function enableAutoRefresh() {
  if (visListenerAttached) return;
  visListenerAttached = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isFeedStale()) {
      fetchRecentRecalls({ force: true });
    }
  });
}

// ── Real-time: background polling ────────────────────────────────────────────
let pollTimer = null;
export function startRecallPolling(intervalMs) {
  stopRecallPolling();
  const ms = intervalMs || FEED_STALE_MS;
  pollTimer = setInterval(() => {
    fetchRecentRecalls({ force: true });
  }, ms);
}
export function stopRecallPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

// ── Notification for new high-severity recalls ───────────────────────────────
const recallListeners = new Set();

export function onNewRecalls(fn) {
  recallListeners.add(fn);
  return () => recallListeners.delete(fn);
}

function loadNotifiedIds() {
  try { return new Set(JSON.parse(localStorage.getItem(NOTIFY_KEY) || '[]')); }
  catch { return new Set(); }
}

function notifyNewRecalls(current, previous) {
  if (!previous || !previous.length) return;
  const prevIds = new Set((previous || []).map(r => r.id || r.description).filter(Boolean));
  const notified = loadNotifiedIds();
  const fresh = current.filter(r => {
    const key = r.id || r.description;
    return key && !prevIds.has(key) && !notified.has(key) && r.severity === 'high';
  });
  if (!fresh.length) return;
  fresh.forEach(r => notified.add(r.id || r.description));
  try {
    const arr = [...notified].slice(-200);
    localStorage.setItem(NOTIFY_KEY, JSON.stringify(arr));
  } catch { /* quota */ }
  for (const fn of recallListeners) {
    try { fn(fresh); } catch { /* listener error */ }
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

/* ── Recipes ─────────────────────────────────────────────────────────────── */

// A recall is worth a banner while it's still live: ongoing, or started recently
// and not closed out. Old, terminated recalls still show on the item itself in the
// Pantry, but they shouldn't put a warning on a dish you're about to cook.
const ACTIVE_WINDOW_DAYS = 180;

export function isActiveRecall(recall, now = Date.now()) {
  const status = String(recall?.status || '').toLowerCase();
  if (status === 'terminated') return false;
  if (status === 'ongoing') return true;
  const d = String(recall?.date || '');
  if (d.length !== 8) return false;
  const started = Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8));
  return now - started < ACTIVE_WINDOW_DAYS * 86400000;
}

/** Keep only live recalls; drop items that have none left. */
export function activeRecallHits(hits) {
  return (hits || [])
    .map((h) => ({ ...h, recalls: (h.recalls || []).filter((r) => isActiveRecall(r)) }))
    .filter((h) => h.recalls.length);
}

const UNIT_WORDS = /\b(cups?|tbsps?|tablespoons?|tsps?|teaspoons?|oz|ounces?|lbs?|pounds?|grams?|g|kg|ml|liters?|l|cloves?|cans?|jars?|slices?|pieces?|pinch|dash|large|small|medium|fresh|chopped|diced|minced|sliced|ground|whole|optional|to taste|of|for|and|or|the|a|an)\b/g;
const SKIP_INGREDIENTS = new Set(['water', 'salt', 'ice', 'pepper', 'black pepper', 'oil', 'cooking spray']);

/** "2 cups chopped fresh spinach" → "spinach" — the food itself, for a recall lookup. */
export function ingredientCore(line) {
  return String(line || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .split(',')[0]
    .replace(/[\d/½¼¾.\-–]+/g, ' ')
    .replace(UNIT_WORDS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The distinct ingredients of a recipe worth checking, as pantry-style items. */
export function recipeRecallItems(lines, max = 10) {
  const seen = new Set();
  const items = [];
  for (const line of lines || []) {
    const core = ingredientCore(typeof line === 'string' ? line : line?.name || line?.text);
    if (core.length < 3 || SKIP_INGREDIENTS.has(core) || seen.has(core)) continue;
    seen.add(core);
    items.push({ name: core });
    if (items.length >= max) break;
  }
  return items;
}

/** Cached recall hits for a recipe's raw ingredient lines ("2 cups spinach" is
    matched by the food word in it). Reads the same cache the pantry fills. */
export function cachedRecipeRecalls(lines) {
  const cache = loadCache();
  const entries = Object.entries(cache).filter(([, e]) => e?.recalls?.length);
  if (!entries.length) return [];
  const hits = [];
  const seen = new Set();
  for (const line of lines || []) {
    const text = String(typeof line === 'string' ? line : line?.name || line?.text || '').toLowerCase();
    if (!text) continue;
    for (const [key, entry] of entries) {
      if (seen.has(key)) continue;
      const rx = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(e?s)?\\b`);
      if (rx.test(text)) {
        seen.add(key);
        hits.push({ key, name: entry.name || key, recalls: entry.recalls });
        break;
      }
    }
  }
  return hits;
}

/* A recipe's banner is about what could actually reach your plate, so it isn't
   raised for every old match on a common word (there is always some recall on
   "cheese"). It shows when a recall matches something in YOUR pantry, or when
   there is a serious, recent recall — Class I, in the last 45 days — that names one
   of the recipe's ingredients in the general recall feed. */
const SEVERE_WINDOW_DAYS = 45;

export function isSevereRecent(recall, now = Date.now()) {
  const severe = String(recall?.classification || '').trim() === 'Class I' || recall?.severity === 'high';
  if (!severe || String(recall?.status || '').toLowerCase() === 'terminated') return false;
  const d = String(recall?.date || '');
  if (d.length !== 8) return true;   // an undated item from the current feed is current by definition
  const started = Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8));
  return now - started < SEVERE_WINDOW_DAYS * 86400000;
}

function feedRecallsForRecipe(lines) {
  const feed = cachedRecentRecalls().filter((r) => isSevereRecent(r));
  if (!feed.length) return [];
  const hits = [];
  for (const { name } of recipeRecallItems(lines, 30)) {
    const rx = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(e?s)?\\b`, 'i');
    const matched = feed.find((r) => rx.test(r.description || ''));
    if (matched) hits.push({ key: name, name, recalls: [matched] });
  }
  return hits;
}

/** The recall hits worth a banner on a recipe. `pantryNames` are lower-cased
    names of what you own. */
export function recipeRecallHits(lines, pantryNames = []) {
  const owned = (hit) => {
    const n = String(hit.key || hit.name || '').toLowerCase();
    return pantryNames.some((p) => p.includes(n) || n.includes(p));
  };
  const fromCache = activeRecallHits(cachedRecipeRecalls(lines))
    .filter((h) => owned(h) || h.recalls.some((r) => isSevereRecent(r)));
  const seen = new Set(fromCache.map((h) => h.key));
  return [...fromCache, ...feedRecallsForRecipe(lines).filter((h) => !seen.has(h.key))];
}
