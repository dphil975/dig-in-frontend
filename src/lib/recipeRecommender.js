/* ════════════════════════════════════════════════════════════
   RECIPE RECOMMENDER
   Picks one recipe per region for each meal reel, ordered by a
   recommendation score that factors in:
     • time of day  (how long until that meal is normally eaten)
     • weather      (hot day → cool/refreshing, cold → warm/hearty)
     • behaviour    (does this user cook quick or long? plan or rush?)
     • popularity   (top-clicked recipes get a bonus)
   plus a deterministic "numerology / gematria" jitter so the picks
   feel freshly shuffled each day without being truly random.
   ════════════════════════════════════════════════════════════ */

import { REGIONS, REGION_BY_ID, resolveRegion } from './regions';
import { getCurrentPosition } from './native';
import { recipeFlavors } from './flavorProfile';
import { loadGoals, wellnessScore, hasNutrientTag } from './wellnessGoals';
import { loadLastHostedTheme } from './occasions';

/* ── Gematria-seeded PRNG ─────────────────────────────────────── */
// Sum letter values (a=1…z=26) — classic gematria — then use that as a
// seed for a fast deterministic PRNG. Same string → same sequence, so a
// given day's "random" reel is stable but varies day to day / on shuffle.
export function gematria(str = '') {
  let sum = 0;
  for (const ch of String(str).toLowerCase()) {
    const c = ch.charCodeAt(0);
    if (c >= 97 && c <= 122) sum += c - 96;       // a-z
    else if (c >= 48 && c <= 57) sum += c - 48;   // 0-9
  }
  return sum;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function seededRng(seedStr) {
  return mulberry32(gematria(seedStr) + 0x9E3779B9);
}

/* ── Recipe time helper ───────────────────────────────────────── */
export function totalTimeOf(r) {
  return r.totalTime || r.total_time
    || ((r.prepTime || 0) + (r.cookTime || 0))
    || r.time || 0;
}

/* ── Weather (Open-Meteo — free, no API key) ──────────────────── */
const WEATHER_KEY = 'dig_in_weather';
const WEATHER_TTL = 60 * 60 * 1000; // 1 hour

export function getCachedWeather() {
  try {
    const w = JSON.parse(localStorage.getItem(WEATHER_KEY) || 'null');
    if (w && Date.now() - w.ts < WEATHER_TTL) return w;
  } catch {}
  return null;
}

// Northern-hemisphere monthly avg-ish °C, used when we have no location.
function seasonTempEstimate() {
  const table = [3, 5, 10, 15, 21, 26, 29, 28, 24, 17, 10, 5];
  return table[new Date().getMonth()];
}

export async function ensureWeather() {
  const cached = getCachedWeather();
  if (cached) return cached;

  const loc = await new Promise(resolve => {
    try {
      const saved = JSON.parse(localStorage.getItem('userLocation') || 'null');
      if (saved?.lat) return resolve(saved);
    } catch {}
    getCurrentPosition({ enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 })
      .then(({ lat, lng }) => resolve({ lat, lng }))
      .catch(() => resolve(null));
  });

  let tempC = seasonTempEstimate();
  let estimated = true;
  if (loc) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&current=temperature_2m`;
      const j = await (await fetch(url)).json();
      if (typeof j?.current?.temperature_2m === 'number') {
        tempC = j.current.temperature_2m;
        estimated = false;
      }
    } catch {}
  }
  const w = { tempC, ts: Date.now(), estimated };
  try { localStorage.setItem(WEATHER_KEY, JSON.stringify(w)); } catch {}
  return w;
}

/* ── User behaviour profile ───────────────────────────────────── */
// Infers, from the recipes a user has actually opened, whether they lean
// toward quick or long cooks. Grows more confident with more views.
export function getBehavior(allRecipes, hits) {
  const byKey = {};
  for (const r of allRecipes) byKey[r.id || r.name] = r;
  let timeWeighted = 0, n = 0;
  for (const [k, count] of Object.entries(hits || {})) {
    const r = byKey[k];
    if (!r) continue;
    const t = totalTimeOf(r);
    if (t > 0) { timeWeighted += t * count; n += count; }
  }
  const avgTime = n ? Math.round(timeWeighted / n) : 0;
  const speed = !avgTime ? 'any' : avgTime <= 30 ? 'short' : avgTime >= 60 ? 'long' : 'medium';
  return { avgTime, speed, sampleSize: n };
}

/* ── Time of day ──────────────────────────────────────────────── */
export function getDayPart(d = new Date()) {
  const h = d.getHours();
  if (h < 11) return 'morning';
  if (h < 15) return 'midday';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

// Typical meal start (minutes since midnight). Dinner ≈ 5:30pm, etc.
const MEAL_START = { breakfast: 7 * 60, lunch: 12 * 60, snacks: 15.5 * 60, dinner: 17.5 * 60, desserts: 20 * 60 };
export function minutesUntilMeal(meal, d = new Date()) {
  const now = d.getHours() * 60 + d.getMinutes();
  let diff = (MEAL_START[meal] ?? now) - now;
  if (diff < 0) diff += 24 * 60; // next occurrence
  return diff;
}

/* ── Context ──────────────────────────────────────────────────── */
export function buildContext({ weather, behavior, cravings, cravingPrefs, wellnessGoals, hostedRegion } = {}) {
  return {
    now: new Date(),
    dayPart: getDayPart(),
    weather: weather || getCachedWeather() || { tempC: seasonTempEstimate(), estimated: true },
    behavior: behavior || { avgTime: 0, speed: 'any', sampleSize: 0 },
    cravings: cravings || new Set(),       // what the user is actively craving now
    cravingPrefs: cravingPrefs || {},      // flavours the user reaches for over time (learned)
    // Active wellness goals (see wellnessGoals.js) — empty for most users,
    // in which case scoreRecipe()'s wellness step is a no-op and reels stay
    // driven purely by weather/time/behaviour/craving, same as before.
    wellnessGoals: wellnessGoals || loadGoals(),
    // The region of the last theme actually hosted (Occasions page) — null
    // until someone hosts a themed event, then keeps nudging recommendations
    // toward it afterward instead of resetting the moment the event's over.
    hostedRegion: hostedRegion !== undefined ? hostedRegion : (loadLastHostedTheme()?.region || null),
  };
}

/* ── Scoring ──────────────────────────────────────────────────── */
const HOT_WORDS  = ['soup', 'stew', 'broth', 'hot pot', 'porridge', 'baked', 'roast', 'braise', 'casserole', 'chili', 'curry'];
const COOL_WORDS = ['salad', 'cold', 'chilled', 'iced', 'ceviche', 'gazpacho', 'fresh', 'smoothie', 'yogurt', 'raw', 'sushi', 'sashimi', 'citrus'];

function textOf(r) {
  return ((r.name || '') + ' ' + (r.description || '') + ' ' + (r.instructions || []).join(' ')).toLowerCase();
}
// Flavour vocabulary lives in ./flavorProfile — the same 8-flavor model the
// craving filter, the drink pairing, and the Discover feed all read from.

export function scoreRecipe(r, ctx, hits, meal, rng) {
  let score = 50;
  const t = totalTimeOf(r);
  const txt = textOf(r);

  // 1. WEATHER — hot day avoids heavy hot dishes, prefers refreshing
  const temp = ctx.weather?.tempC ?? 18;
  if (temp >= 27) {                                  // ~80°F+
    if (HOT_WORDS.some(w => txt.includes(w)))  score -= 18;
    if (COOL_WORDS.some(w => txt.includes(w))) score += 18;
  } else if (temp <= 8) {                            // cold
    if (HOT_WORDS.some(w => txt.includes(w)))  score += 16;
    if (COOL_WORDS.some(w => txt.includes(w))) score -= 10;
  }

  // 2. TIME PRESSURE — close to mealtime favours quick recipes; lots of
  //    lead time allows longer, plan-ahead cooks (mix of short→long).
  const avail = minutesUntilMeal(meal, ctx.now);
  if (t > 0) {
    if (avail < 60)       score += t <= 30 ? 12 : t <= 60 ? 0 : -14;
    else if (avail > 180) score += t >= 45 ? 8 : 2;
  }

  // 3. BEHAVIOUR — nudge toward the user's usual recipe length
  if (ctx.behavior.speed !== 'any' && t > 0) {
    if (ctx.behavior.speed === 'short')  score += t <= 30 ? 10 : t >= 75 ? -12 : 0;
    if (ctx.behavior.speed === 'long')   score += t >= 60 ? 10 : t <= 20 ? -8 : 0;
    if (ctx.behavior.speed === 'medium') score += (t >= 30 && t <= 60) ? 8 : 0;
  }

  // 4. POPULARITY — top-clicked recipes get a small global boost
  const h = (hits && (hits[r.id] || hits[r.name])) || 0;
  score += Math.min(h, 10) * 1.5;

  // 5. CRAVING — strongly favour what the user is craving right now, and
  //    mildly favour the flavours they reach for over time (learned taste).
  if (ctx.cravings?.size || (ctx.cravingPrefs && Object.keys(ctx.cravingPrefs).length)) {
    const flavors = recipeFlavors(r);
    if (ctx.cravings?.size && flavors.some(f => ctx.cravings.has(f))) score += 22;
    if (ctx.cravingPrefs) {
      for (const f of flavors) score += Math.min(ctx.cravingPrefs[f] || 0, 6) * 1.3;
    }
  }

  // 6. WELLNESS — additive nudge toward recipes matching the user's active
  //    wellness goals (nutrient-dense, more plants, etc.) — 0 for the vast
  //    majority of users who haven't set any, so this changes nothing for
  //    them. Never large enough to bury weather/time/craving on its own.
  if (ctx.wellnessGoals?.length) {
    score += wellnessScore(r.ingredients, ctx.wellnessGoals) * 3;
  }

  // 7. HOSTED THEME — after hosting a themed event, recipes from that same
  //    region get a bonus so recommendations keep leaning into it (an
  //    "Arabian Night" host keeps seeing more Middle Eastern dishes) —
  //    0 for anyone who's never hosted a themed event.
  if (ctx.hostedRegion) {
    const region = r._region || resolveRegion(r.country || r.cuisine, r.region);
    if (region === ctx.hostedRegion) score += 16;
  }

  // 8. NUMEROLOGY JITTER — deterministic per-pick randomness
  score += (rng ? rng() : Math.random()) * 14;

  return score;
}

const keyOf = r => r.id || r.name;
const countryOf = r => (r.country || '').toLowerCase().trim();

// Weighted-random pick among the top candidates, so shuffling produces real
// variety while still leaning on the recommendation score. (A plain argmax
// always returns the same recipe — that's what felt "not random enough".)
function weightedPick(scored, rng, k = 6) {
  if (!scored.length) return null;
  const top = scored.slice(0, Math.min(k, scored.length));
  const floor = top[top.length - 1].s;
  const weights = top.map(x => Math.max(0.01, x.s - floor + 1));
  const sum = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * sum;
  for (let i = 0; i < top.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return top[i].r;
  }
  return top[0].r;
}

// Build ONE reel: one recipe per region, weighted-random, never using a
// country already claimed (globally, via usedCountries, or within this reel).
// avoidKeys — the recipes shown last time this meal was picked — is used to
// guarantee a shuffle always looks different, not just statistically likely
// to: every slot prefers anything NOT in avoidKeys, only falling back to a
// repeat if avoiding it would leave that slot (or the whole reel) empty.
function pickReelUnique(recipes, meal, ctx, hits, seedStr, usedCountries, avoidKeys = new Set()) {
  const rng = seededRng(`${seedStr}-${meal}`);
  // Dropping cravingPrefs for one region's pick keeps the learned flavor bias
  // from fully dominating every reel slot — without this, the top scorer in
  // each region barely changes as the profile grows more lopsided, and
  // shuffling feels like it keeps landing on the same handful of recipes.
  const exploreCtx = { ...ctx, cravingPrefs: {} };
  const exploreRegionIdx = Math.floor(rng() * REGIONS.length);

  const usedKeys = new Set();
  const usedCountryReel = new Set();
  const picks = [];

  const allowed = r => {
    if (usedKeys.has(keyOf(r))) return false;
    const c = countryOf(r);
    if (c && (usedCountries.has(c) || usedCountryReel.has(c))) return false;
    return true;
  };
  const take = (r, meta, bonus) => {
    picks.push({ ...r, _regionMeta: meta, ...(bonus ? { _bonus: true } : {}) });
    usedKeys.add(keyOf(r));
    const c = countryOf(r);
    if (c) usedCountryReel.add(c);
  };
  const scoreSort = (arr, useCtx = ctx) => arr.map(r => ({ r, s: scoreRecipe(r, useCtx, hits, meal, rng) })).sort((a, b) => b.s - a.s);

  // Group the country-eligible recipes by region — both the full pool and a
  // "fresh" pool with avoidKeys stripped out.
  const byRegionAll = {};
  const byRegionFresh = {};
  for (const r of recipes) {
    if (!r._region) continue;
    const c = countryOf(r);
    if (c && usedCountries.has(c)) continue;       // globally locked out
    (byRegionAll[r._region] ||= []).push(r);
    if (!avoidKeys.has(keyOf(r))) (byRegionFresh[r._region] ||= []).push(r);
  }

  // One per region (REGIONS order), weighted-random among the best —
  // fresh pool first, whole pool only if avoiding would empty the region.
  REGIONS.forEach((region, i) => {
    const fresh = (byRegionFresh[region.id] || []).filter(allowed);
    const pool = fresh.length ? fresh : (byRegionAll[region.id] || []).filter(allowed);
    if (!pool.length) return;
    const chosen = weightedPick(scoreSort(pool, i === exploreRegionIdx ? exploreCtx : ctx), rng);
    if (chosen) take(chosen, region, false);
  });

  // Fill to 8 with the best remaining (still globally-unique) countries —
  // fresh candidates first, then whatever's left if fresh ones run out.
  if (picks.length < 8) {
    for (const { r } of scoreSort(recipes.filter(r => allowed(r) && !avoidKeys.has(keyOf(r))))) {
      if (picks.length >= 8) break;
      if (!allowed(r)) continue;   // re-check: a prior take() may have claimed this country
      take(r, REGION_BY_ID[r._region] || null, true);
    }
    if (picks.length < 8) {
      for (const { r } of scoreSort(recipes.filter(allowed))) {
        if (picks.length >= 8) break;
        if (!allowed(r)) continue;
        take(r, REGION_BY_ID[r._region] || null, true);
      }
    }
  }

  // "Sprinkle" — for users with NO active wellness goals, guarantee at
  // least one nutrient-tagged option is visible in the reel when the pool
  // actually has one, so wellness-friendly recipes stay in view without
  // dominating or moralizing about the rest of the picks. Users who HAVE
  // set goals don't need this — their reel already skews their way via
  // scoreRecipe()'s wellness step above.
  if (!ctx.wellnessGoals?.length && picks.length > 0 && !picks.some(p => hasNutrientTag(p.ingredients))) {
    const usedKeysSnapshot = new Set(picks.map(keyOf));
    const sprinkle = recipes
      .filter(r => !usedKeysSnapshot.has(keyOf(r)) && hasNutrientTag(r.ingredients))
      .map(r => ({ r, s: scoreRecipe(r, ctx, hits, meal, rng) }))
      .sort((a, b) => b.s - a.s)[0]?.r;
    if (sprinkle) {
      picks[picks.length - 1] = { ...sprinkle, _regionMeta: REGION_BY_ID[sprinkle._region] || null, _bonus: true, _sprinkle: true };
    }
  }

  // Mark every pick that actually matches an active wellness goal, so the
  // card can show a small "WELLNESS PICK" flag — purely informational,
  // never the only reason a recipe made the reel.
  if (ctx.wellnessGoals?.length) {
    for (const p of picks) {
      if (wellnessScore(p.ingredients, ctx.wellnessGoals) > 0) p._wellnessMatch = true;
    }
  }

  // Lock every country we just used out of all the other meals
  for (const r of picks) {
    const c = countryOf(r);
    if (c) usedCountries.add(c);
  }

  // Mark a single TOP PICK — the most-clicked recipe in the reel
  let topIdx = -1, topHits = 0;
  picks.forEach((r, i) => {
    const h = (hits[r.id] || hits[r.name] || 0);
    if (h > topHits) { topHits = h; topIdx = i; }
  });
  if (topIdx >= 0) picks[topIdx]._topPick = true;

  return picks.slice(0, 8);
}

/**
 * Build EVERY meal reel together, enforcing the rule that a country shown in
 * one meal cannot appear in any other meal — so the user experiences a wide
 * spread of countries across the whole page.
 *
 * @param mealsData  { breakfast:[...], lunch:[...], ... } region-tagged recipes
 * @param mealKeys   order to fill (earlier meals get first pick of countries)
 * @param seedFor    (meal) => seed string  (changes on shuffle)
 * @param avoidByMeal  { [meal]: Set<key> } recipes shown last time, so a
 *   shuffle is guaranteed to look different instead of just likely to
 */
export function pickAllReels(mealsData, mealKeys, ctx, hits, seedFor, avoidByMeal = {}) {
  const usedCountries = new Set();
  const out = {};
  for (const meal of mealKeys) {
    out[meal] = pickReelUnique(mealsData[meal] || [], meal, ctx, hits, seedFor(meal), usedCountries, avoidByMeal[meal]);
  }
  return out;
}
