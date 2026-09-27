/* discoverFeed.js — the Pinterest-style layer behind Home's search grid.

   Four real, non-fabricated signals, composed the way Pinterest composes a
   search-results page:
     1. Related categories — cuisines + flavors actually present in the
        current result set, counted and ranked (never invented).
     2. "Ideas you might love" — the same category pool, but biased toward
        whatever flavor the CURRENT search text reads as (flavorProfile.js's
        8-flavor keyword vocabulary), so it personalizes to the search
        instead of being generic.
     3. Top Rated — sorted by this device's own star ratings (saveService's
        rateRecipe/getRating — real, but previously dead code with no UI
        anywhere) with real view-count (dig_in_hits) as the tiebreaker. This
        is honestly "top rated by you," not a fabricated cross-user vote —
        this app has no backend aggregate-rating pipeline to draw a real
        community number from.
     4. Kitchen Alchemist cards woven into the grid — generated via
        recipeAlchemist.js's recreateDish() (the pure generator, deliberately
        NOT alchemize(), which would pollute the user's real Kitchen
        Alchemist learning store with synthetic background calls they never
        asked for). Clearly tagged _isAlchemistCard so the UI can label them
        as generated rather than passing them off as catalogue dishes. */

import { FLAVORS, flavorsInText, recipeFlavors } from '../flavorProfile';
import { getRating } from '../../services/saveService';
import { recreateDish } from '../recipeAlchemist';

function cuisineOf(r) {
  return (r?.country || r?.cuisine || '').trim();
}

/** Cuisines + flavors actually present in a result set, ranked by frequency.
    Never returns a category with zero real matches. */
export function deriveRelatedCategories(recipes, limit = 8) {
  const cuisineCounts = new Map();
  const flavorCounts = new Map();

  for (const r of recipes || []) {
    const c = cuisineOf(r);
    if (c) cuisineCounts.set(c, (cuisineCounts.get(c) || 0) + 1);
    for (const f of recipeFlavors(r)) flavorCounts.set(f, (flavorCounts.get(f) || 0) + 1);
  }

  const cuisines = [...cuisineCounts.entries()].map(([value, count]) => ({ type: 'cuisine', value, label: value, count }));
  const flavors = [...flavorCounts.entries()].map(([value, count]) => ({ type: 'flavor', value, label: `${value[0].toUpperCase()}${value.slice(1)}`, count }));

  return [...cuisines, ...flavors].sort((a, b) => b.count - a.count).slice(0, limit);
}

/** 5 categories to show as "Ideas you might love" — flavors detected in the
    active search text are boosted to the front (real personalization to
    what was searched), the rest fills in from whatever's actually popular
    in the pool. */
export function ideasYouMightLove(pool, query, limit = 5) {
  const queryFlavors = query ? flavorsInText(query) : [];
  const ranked = deriveRelatedCategories(pool, 20);

  const boosted = ranked.filter((c) => c.type === 'flavor' && queryFlavors.includes(c.value));
  const rest = ranked.filter((c) => !boosted.includes(c));

  return [...boosted, ...rest].slice(0, limit);
}

/** Does a recipe belong to a derived category (cuisine or flavor)? */
export function matchesCategory(recipe, category) {
  if (!category) return true;
  if (category.type === 'cuisine') return cuisineOf(recipe) === category.value;
  return recipeFlavors(recipe).includes(category.value);
}

/** Sort by this device's real star ratings (desc), then real view count —
    "Top Rated (by you)," never a fabricated crowd number. */
export function sortByTopRated(recipes, hits = {}) {
  return [...(recipes || [])].sort((a, b) => {
    const keyA = a.id || a.name, keyB = b.id || b.name;
    const ratingDiff = getRating(keyA) - getRating(keyB);
    if (ratingDiff !== 0) return -ratingDiff;
    return (hits[keyB] || 0) - (hits[keyA] || 0);
  });
}

/** True once at least one recipe on this device has a real star rating —
    otherwise "Top Rated" would silently do nothing and confuse the filter. */
export function hasAnyRatings(recipes) {
  return (recipes || []).some((r) => getRating(r.id || r.name) > 0);
}

// Rotating, harmless seed dishes for when there's no active search to
// generate an Alchemist card from — real dish names, not fabricated brands.
const DEFAULT_SEEDS = ['birria tacos', 'garlic butter shrimp', 'miso ramen', 'lemon herb chicken', 'spicy peanut noodles'];

/** 1-2 Kitchen Alchemist cards generated from the search query (or a
    rotating default), tagged so the UI can label them as generated. Uses
    recreateDish() directly — no side effects on the real Alchemist store. */
export function alchemistFeedCards(query, count = 1) {
  const seeds = query?.trim()
    ? [query.trim()]
    : DEFAULT_SEEDS.slice(0, count);
  return seeds.slice(0, count).map((seed) => ({
    ...recreateDish(seed),
    _isAlchemistCard: true,
  }));
}

/** Splice extras into a list at a fixed interval, matching Pinterest's
    "sponsored/related pin every N results" pattern. Skips splicing if the
    list is too short to make it feel natural. */
export function interleaveCards(list, extras, every = 8) {
  if (!extras?.length || (list?.length || 0) < every) return list || [];
  const out = [...list];
  extras.forEach((extra, i) => {
    const pos = Math.min(out.length, every * (i + 1) + i);
    out.splice(pos, 0, extra);
  });
  return out;
}

export { FLAVORS };
