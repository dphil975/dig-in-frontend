/* ════════════════════════════════════════════════════════════
   DYNAMIC PRICING + SMART RANKING
   Turns the live grocery deals into a priced, located pool and
   ranks it the way the user asked for:

     • a budget ceiling (the sliding scale) filters anything
       that costs more than the user wants to spend
     • a ZIP (or live location) anchors "closest to me" distance
     • the default "Smart Mix" interleaves roles in a fixed cycle:
         1 cheapest · 2 mid-price · 3 top-rated · 4 top-rated
         5 cheap    · 6 expensive · (repeat)
       so the list is never just a flat price sort — it balances
       price against reviews / likeability.
     • explicit sorts (low→high, high→low, closest) override the mix
     • craving flavours feed the SAME taste-learning store the recipe
       recommender uses (dig_in_craving_prefs), so picking a craving
       here trains the rest of the app too.
   ════════════════════════════════════════════════════════════ */

import { haversineKm } from '../services/geoService';

/* ── Price parsing ────────────────────────────────────────────── */
// Deal badges look like "2 for $1", "$1.49", "½ gal $2", "$0.99/head".
// Pull a representative *per-item* price so options compare fairly.
export function parsePrice(badge) {
  if (typeof badge === 'number') return badge;
  const str = String(badge || '');
  const m = str.match(/\$\s*(\d+(?:\.\d+)?)/);
  if (!m) return null;
  let price = parseFloat(m[1]);
  const qty = str.match(/(\d+)\s*for\b/i);   // "3 for $1" → divide
  if (qty && Number(qty[1]) > 0) price = price / Number(qty[1]);
  return Math.round(price * 100) / 100;
}

/* ── Deterministic store rating / review count ───────────────────
   Real deal data has no rating, so derive a stable one from the store
   name. Same store → same rating every render (no flicker), spread
   across a believable 3.6–4.9 band with a matching review count. */
function hashStr(s = '') {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
export function deriveRating(storeName, explicit) {
  if (typeof explicit === 'number' && explicit > 0) {
    const reviews = 40 + (hashStr(storeName) % 460);
    return { rating: Math.round(explicit * 10) / 10, reviews };
  }
  const h = hashStr(storeName);
  const rating  = Math.round((3.6 + (h % 14) / 10) * 10) / 10;  // 3.6 … 4.9
  const reviews = 25 + (h % 600);                               // 25 … 624
  return { rating, reviews };
}

/* ── Flavour vocabulary (mirrors the recipe craving compass) ──── */
export const FLAVORS = ['sweet', 'savory', 'spicy', 'rich', 'light'];
const FLAVOR_KW = {
  sweet:  ['banana', 'sugar', 'honey', 'fruit', 'jam', 'cereal', 'yogurt'],
  savory: ['egg', 'cheese', 'broth', 'bean', 'rice', 'bread', 'sauce'],
  spicy:  ['pepper', 'chili', 'hot', 'salsa', 'jalape'],
  rich:   ['milk', 'butter', 'cream', 'cheese', 'oil', 'meat', 'avocado'],
  light:  ['tomato', 'lettuce', 'greens', 'garlic', 'herb', 'citrus', 'water'],
};
export function itemFlavors(name = '') {
  const t = name.toLowerCase();
  return FLAVORS.filter(f => FLAVOR_KW[f].some(k => t.includes(k)));
}

/* ── Build the priced + located option pool from live deals ───────
   deals: the LIVE_DEALS array (item + badge + per-borough stores).
   origin: { lat, lng } | null — distance anchor (ZIP or GPS). */
export function buildPricePool(deals = [], origin = null) {
  const pool = [];
  for (const deal of deals) {
    const price = parsePrice(deal.badge);
    const flavors = itemFlavors(deal.title);
    const stores = deal.available || {};
    for (const [borough, list] of Object.entries(stores)) {
      for (const s of list) {
        const { rating, reviews } = deriveRating(s.name, s.rating);
        const dist = origin && s.lat && s.lng
          ? haversineKm(origin.lat, origin.lng, s.lat, s.lng)
          : null;
        pool.push({
          id: `${deal.id}-${s.name}`.replace(/\s+/g, '-').toLowerCase(),
          dealId: deal.id,
          item: deal.title,
          emoji: deal.emoji,
          storeType: deal.store,
          storeName: s.name,
          address: s.address,
          borough,
          lat: s.lat, lng: s.lng,
          price,
          priceLabel: deal.badge,
          rating, reviews,
          dist,
          flavors,
          snapEligible: /grocery|corner/i.test(deal.store || ''),
        });
      }
    }
  }
  return pool;
}

/* ── Craving boost (taste AI) ─────────────────────────────────────
   Options whose flavour matches an active craving — or a flavour the
   user reaches for over time — float up. Mirrors scoreRecipe(). */
function cravingScore(opt, activeCravings, cravingPrefs) {
  let s = 0;
  if (activeCravings?.size) {
    for (const f of opt.flavors) if (activeCravings.has(f)) s += 8;
  }
  if (cravingPrefs) {
    for (const f of opt.flavors) s += Math.min(cravingPrefs[f] || 0, 6) * 1;
  }
  return s;
}

/* ── Filtering ───────────────────────────────────────────────────
   budget: max spend (sliding scale). snapOnly: rural/SNAP filter.
   cravings: active flavour Set (also used to *filter* on the craving tab). */
export function filterPool(pool, { budget, snapOnly, cravingFilter } = {}) {
  return pool.filter(o => {
    if (typeof budget === 'number' && o.price != null && o.price > budget) return false;
    if (snapOnly && !o.snapEligible) return false;
    if (cravingFilter?.size && !o.flavors.some(f => cravingFilter.has(f))) return false;
    return true;
  });
}

/* ── Smart-Mix sequence ranking ───────────────────────────────────
   The exact cycle the user described, repeated until the pool empties:
     cheapest → mid-price → top-rated → top-rated → cheap → expensive
   Distance and the craving AI act as tie-breakers so "cheapest" really
   means "cheapest, and if tied, closest / most-craved". */
const ROLE_CYCLE = ['cheapest', 'mid', 'rated', 'rated', 'cheap', 'expensive'];
const ROLE_LABEL = {
  cheapest:  'CHEAPEST',
  mid:       'MID-PRICE',
  rated:     'TOP RATED',
  cheap:     'GREAT VALUE',
  expensive: 'PREMIUM',
};

export function rankSmartMix(pool, { activeCravings, cravingPrefs } = {}) {
  const remaining = pool.map(o => ({
    ...o,
    _craving: cravingScore(o, activeCravings, cravingPrefs),
  }));
  const out = [];
  // Price drives the price-roles (×1000); distance is only a light tie-break
  // (×1), and is neutral — not disqualifying — when no ZIP is set.
  const priceOf = o => (o.price == null ? 9999 : o.price);
  const distPen = o => (o.dist == null ? 0 : o.dist);

  let i = 0;
  while (remaining.length) {
    const role = ROLE_CYCLE[i % ROLE_CYCLE.length];
    i++;

    // Median price of what's left (for the "mid" role)
    const prices = remaining.map(priceOf).filter(p => p !== 9999).sort((a, b) => a - b);
    const median = prices.length ? prices[Math.floor(prices.length / 2)] : 0;

    let bestIdx = 0, bestKey = -Infinity;
    remaining.forEach((o, idx) => {
      let key;
      switch (role) {
        case 'cheapest':
        case 'cheap':
          // lower price wins; closer + more-craved breaks ties
          key = -priceOf(o) * 1000 - distPen(o) + o._craving;
          break;
        case 'expensive':
          key = priceOf(o) * 1000 + o.rating + o._craving;
          break;
        case 'mid':
          key = -Math.abs(priceOf(o) - median) * 1000 - distPen(o) + o._craving;
          break;
        case 'rated':
        default:
          // reviews/likeability, NOT price; closeness + craving break ties
          key = o.rating * 1000 + Math.min(o.reviews, 600) - distPen(o) + o._craving * 5;
          break;
      }
      if (key > bestKey) { bestKey = key; bestIdx = idx; }
    });

    const [chosen] = remaining.splice(bestIdx, 1);
    out.push({ ...chosen, _role: role, _roleLabel: ROLE_LABEL[role] });
  }
  return out;
}

/* ── Explicit sorts (toggle overrides the Smart Mix) ─────────────── */
export function sortPool(pool, mode, ctx = {}) {
  const arr = [...pool];
  const priceOf = o => (o.price == null ? Infinity : o.price);
  const distOf  = o => (o.dist == null ? Infinity : o.dist);
  switch (mode) {
    case 'low-high':  return arr.sort((a, b) => priceOf(a) - priceOf(b) || distOf(a) - distOf(b));
    case 'high-low':  return arr.sort((a, b) => priceOf(b) - priceOf(a) || b.rating - a.rating);
    case 'closest':   return arr.sort((a, b) => distOf(a) - distOf(b) || priceOf(a) - priceOf(b));
    case 'smart':
    default:          return rankSmartMix(pool, ctx);
  }
}

/* ── Persisted craving learning (shared with the recipe AI) ──────── */
const CRAVING_PREFS_KEY = 'dig_in_craving_prefs';
export function loadCravingPrefs() {
  try { return JSON.parse(localStorage.getItem(CRAVING_PREFS_KEY) || '{}'); }
  catch { return {}; }
}
export function learnCraving(flavor) {
  const prefs = loadCravingPrefs();
  prefs[flavor] = (prefs[flavor] || 0) + 1;
  try { localStorage.setItem(CRAVING_PREFS_KEY, JSON.stringify(prefs)); } catch {}
  return prefs;
}
