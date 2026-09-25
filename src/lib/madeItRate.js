/* madeItRate.js — the ranking signal no other feed can compute.

   Every other platform ranks on attention, because attention is all that
   happens inside the app. Dig In touches the physical world, so it can rank on
   CONSEQUENCE instead:

     MIR = (people who cooked / went / attended within 7 days) ÷ (people who saw it)

   Views are the DENOMINATOR, not the numerator. A dish with 200 views and 40
   dinners outranks one with 10,000 views and 3. That single inversion quietly
   kills rage bait, fake luxury, and ads-as-content without any moderation
   policy: nobody cooks after being angry, and you can't make a $400 restaurant
   plate at home — so those have no MIR and sink on their own.

   Honesty (house rule: no fabricated numbers — see project memory):
     • The NUMERATOR is read from real events this device already records:
         - dig_in_cook_history        (markCooked, services/saveService.js) — a real cook
         - dig_in_behavior.checkins   (behaviorTracker.js)                  — a real place visited
       We never write a synthetic "conversion." A cook counts because someone
       tapped "I made this," not because we decided it did.
     • The DENOMINATOR (impressions) is logged only when a post actually
       renders on screen (logImpression, called from the feed).
     • On a fresh install both are ~0. rankByMIR therefore REFUSES to sort until
       there's real volume (minTotalImpressions) — a cold feed keeps its
       composed order rather than pretending to have a confident ranking. This
       is build-step #1 of docs/product/DIG_IN_ALGORITHM.md: nothing works without the
       denominator, and a denominator you haven't earned yet is a lie.

   This is intentionally a leaf module: it imports nothing app-specific, only
   reads localStorage keys other modules own, so it can't create an import
   cycle. */

const IMPRESSION_KEY = 'dig_in_mir_impressions';
const HISTORY_KEY    = 'dig_in_cook_history';   // owned by services/saveService.js
const BEHAVIOR_KEY   = 'dig_in_behavior';       // owned by services/behaviorTracker.js

const MAX_KEYS = 800;     // prune the impression ledger so it can't grow forever
const WINDOW_DAYS = 7;    // the MIR conversion window
const DAY_MS = 86400000;

// Beta-prior smoothing. The prior mean (ALPHA/BETA ≈ 0.02) is deliberately LOW
// so a brand-new post with no conversions can never out-rank a proven one just
// by being new — it has to actually convert to climb. A post at 40 cooks / 200
// views smooths to (40.5)/(225) ≈ 0.18, comfortably above the 0.02 floor.
const ALPHA = 0.5;
const BETA  = 25;

const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 40);

/* ── Keys ────────────────────────────────────────────────────────────────
   Impression and conversion must agree on ONE key per thing, or MIR is
   meaningless. A recipe is the unit of consequence (you cook a recipe), so
   recipe-bearing posts key by recipe identity — the same identity the cook log
   stores. Everything else keys by its own post id. */
export function keyForRecipe(recipe) {
  if (!recipe) return null;
  const id = recipe.id ?? recipe.recipeId ?? null;
  return `recipe:${id != null ? id : slug(recipe.name)}`;
}

export function keyForPost(post) {
  if (!post) return null;
  if (post.recipe) return keyForRecipe(post.recipe);
  if (post.entry) {
    const snap = post.entry.recipeSnapshot;
    if (snap && (snap.id != null || snap.name)) return keyForRecipe(snap);
    if (post.entry.dish) return `recipe:${slug(post.entry.dish)}`;
    return `dish:${post.entry.id}`;
  }
  return `post:${post.id}`;
}

/* ── Impressions (the denominator) ──────────────────────────────────────── */
function loadImpressions() {
  try { return JSON.parse(localStorage.getItem(IMPRESSION_KEY) || '{}') || {}; }
  catch { return {}; }
}

function saveImpressions(map) {
  // Prune to the most-recently-seen MAX_KEYS so the ledger stays bounded.
  const keys = Object.keys(map);
  if (keys.length > MAX_KEYS) {
    keys.sort((a, b) => (map[b].last || 0) - (map[a].last || 0));
    const kept = {};
    for (const k of keys.slice(0, MAX_KEYS)) kept[k] = map[k];
    map = kept;
  }
  try { localStorage.setItem(IMPRESSION_KEY, JSON.stringify(map)); } catch { /* quota */ }
}

/** Record that one post was actually seen. Idempotency is the caller's job —
    the feed logs each post id once per session (see Home/index.jsx). */
export function logImpression(key) {
  if (!key) return;
  const map = loadImpressions();
  const cur = map[key] || { n: 0, last: 0 };
  map[key] = { n: cur.n + 1, last: Date.now() };
  saveImpressions(map);
}

/** Batch form — one write for a screen's worth of posts. */
export function logImpressions(keys = []) {
  const uniq = [...new Set(keys.filter(Boolean))];
  if (!uniq.length) return;
  const map = loadImpressions();
  const now = Date.now();
  for (const k of uniq) {
    const cur = map[k] || { n: 0, last: 0 };
    map[k] = { n: cur.n + 1, last: now };
  }
  saveImpressions(map);
}

export function impressionsFor(key) {
  return loadImpressions()[key]?.n || 0;
}

/* ── Conversions (the numerator) — read from real logs, never written here ── */
function loadCookHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') || []; }
  catch { return []; }
}

function loadCheckins() {
  try { return JSON.parse(localStorage.getItem(BEHAVIOR_KEY) || '{}')?.checkins || []; }
  catch { return []; }
}

function withinWindow(ts, days) {
  if (!ts) return false;
  const t = typeof ts === 'number' ? ts : Date.parse(ts);
  return Number.isFinite(t) && (Date.now() - t) <= days * DAY_MS;
}

/** How many real cooks match a recipe key inside the window. This is the
    numerator for recipe-bearing posts. */
export function conversionsForKey(key, { days = WINDOW_DAYS } = {}) {
  if (!key || !key.startsWith('recipe:')) return 0;
  return loadCookHistory().filter((e) =>
    withinWindow(e.cookedAt, days) && keyForRecipe(e) === key,
  ).length;
}

/** MIR for one key: raw counts plus the smoothed rate used for ranking. */
export function mir(key, { days = WINDOW_DAYS } = {}) {
  const impressions = impressionsFor(key);
  const conversions = conversionsForKey(key, { days });
  const rate = impressions > 0 ? conversions / impressions : 0;
  const smoothed = (conversions + ALPHA) / (impressions + BETA);
  return { impressions, conversions, rate, smoothed };
}

/* ── Ranking WITHIN a slot (never across slots — that's feedSlots' job) ──── */
/**
 * Stable-sort candidates by smoothed MIR, descending — but only once the feed
 * has earned enough impressions to mean anything. Below `minTotalImpressions`
 * the input order is returned untouched, so a cold-start feed reflects its
 * honest composition instead of noise. Ties preserve input order (stable).
 */
export function rankByMIR(items, keyFn = keyForPost, { days = WINDOW_DAYS, minTotalImpressions = 40 } = {}) {
  if (!Array.isArray(items) || items.length < 2) return items || [];
  const keyed = items.map((item, i) => {
    const k = keyFn(item);
    return { item, i, m: k ? mir(k, { days }).smoothed : 0, impr: k ? impressionsFor(k) : 0 };
  });
  const totalImpr = keyed.reduce((s, x) => s + x.impr, 0);
  if (totalImpr < minTotalImpressions) return items;   // not enough signal — stay honest
  keyed.sort((a, b) => (b.m - a.m) || (a.i - b.i));
  return keyed.map((x) => x.item);
}

/* ── The metric you report (Part 8) ─────────────────────────────────────── */
/** Meals Made — the headline number. All-time by default, or windowed. This is
    literally the cook log's length; it can't be gamed by opening the app. */
export function mealsMade({ days = null } = {}) {
  const hist = loadCookHistory();
  if (days == null) return hist.length;
  return hist.filter((e) => withinWindow(e.cookedAt, days)).length;
}

/** In-person events attended — the second line of the headline. Real check-ins
    only; nothing fabricated. */
export function eventsAttended({ days = null } = {}) {
  const c = loadCheckins();
  if (days == null) return c.length;
  return c.filter((e) => withinWindow(e.ts, days)).length;
}

/** Small convenience for the "YOU" card: both headline numbers at once. */
export function consequenceStats({ days = 30 } = {}) {
  return {
    mealsMade: mealsMade(),
    mealsMadeRecent: mealsMade({ days }),
    eventsAttended: eventsAttended(),
  };
}
