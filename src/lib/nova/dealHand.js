/* dealHand.js — Nova's dealer. Picks 5 flavors from the 8-flavor vocabulary
   (weighted by the user's learned taste), then surfaces the best recipe for
   each flavor. The hand changes every shuffle because the 5-of-8 flavor
   choice is weighted-random, not fixed — C(8,5) = 56 flavor combinations
   before you even start choosing recipes within each flavor.

   Separate from pick.js because pickForNow is a best-of-one scorer tuned
   for a single hero pick; a hand of five needs a different shape: one card
   per flavor, no duplicates, and a deterministic seed so React re-renders
   don't re-deal mid-animation. */

import { FLAVORS, recipeFlavors, loadFlavorProfile } from '../flavorProfile';
import { getAnswers } from '../personalization/onboarding';
import { currentMealWindow } from '../recipe/mealWindows';

const HAND_SIZE = 5;

/* ── Seeded random ───────────────────────────────────────────
   Mulberry32 — tiny, fast, deterministic. Lets a given seed produce the
   same hand every time (so React can memoize the deal without re-rolling
   on every state change) while a new seed shuffles the deck. */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashSeed(s) {
  let h = 2166136261 >>> 0;
  const str = String(s);
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/* ── Flavor selection ────────────────────────────────────────
   Efraimidis–Spirakis weighted sampling without replacement. Each flavor's
   weight = (learned profile score + 1), so unlearned flavors still get a
   fair chance (+1 floor) while taught flavors (spicy=12, say) rise. The
   top 5 scored keys are the hand's flavor slots. */
function chooseFlavors(profile, rand) {
  const keyed = FLAVORS.map((f) => {
    const w = Math.max(0.1, (profile?.[f] || 0) + 1);
    const u = rand() || 0.0001;
    return { flavor: f, key: Math.pow(u, 1 / w) };
  });
  keyed.sort((a, b) => b.key - a.key);
  return keyed.slice(0, HAND_SIZE).map((x) => x.flavor);
}

/* ── Per-flavor scoring ──────────────────────────────────────
   Only recipes whose own flavor tags include the slot flavor are eligible.
   Then: prefer the "clearest" expression of that flavor (fewer competing
   flavors), prefer easy/medium difficulty, favor the current meal window,
   and nudge up for liked cuisines from onboarding. */
function scoreForFlavor(r, flavor, { mealWindow, likedCuisines }) {
  const flavors = recipeFlavors(r);
  if (!flavors.includes(flavor)) return -Infinity;

  let score = 10 - flavors.length; // clearer identity = higher score

  const diff = (r.difficulty || '').toLowerCase();
  if (diff === 'easy') score += 2;
  else if (diff === 'medium') score += 1;
  else if (diff === 'hard') score -= 2;

  const type = (r.recipe_type || '').toLowerCase();
  const windowId = mealWindow?.id;
  if (windowId === 'breakfast' && type === 'breakfast') score += 2;
  else if (windowId === 'lunch' && (type === 'lunch' || type === 'snack')) score += 2;
  else if (windowId === 'dinner' && (type === 'dinner' || type === 'lunch')) score += 2;
  else if (windowId === 'late-night' && (type === 'snack' || type === 'dessert' || type === 'drink')) score += 2;

  const cuisine = (r.cuisine || r.country || '').toLowerCase();
  if (likedCuisines?.has(cuisine)) score += 1.5;

  return score;
}

/* ── The deal ────────────────────────────────────────────────
   Returns up to HAND_SIZE cards, each tagged with the flavor slot it fills.
   Cards never repeat (a recipe can score for multiple flavors; the `used`
   set claims it for whichever flavor it serves first in the hand order). */
export function dealHand(recipes, {
  profile, likedCuisines, seed, now = new Date(), skipIds = [],
} = {}) {
  if (!Array.isArray(recipes) || !recipes.length) {
    return { cards: [], flavors: [], seed: 0 };
  }

  const prof = profile || loadFlavorProfile();
  const liked = likedCuisines || (() => {
    const a = getAnswers();
    return new Set(Array.isArray(a?.cuisine) ? a.cuisine.map((c) => c.toLowerCase()) : []);
  })();
  const seedNum = typeof seed === 'number' ? seed : hashSeed(seed ?? Date.now());
  const rand = mulberry32(seedNum);
  const mealWindow = currentMealWindow(now);
  const skip = new Set(skipIds.map(String));

  const flavors = chooseFlavors(prof, rand);
  const used = new Set();
  const cards = [];

  for (const flavor of flavors) {
    let bestScore = -Infinity;
    let bestRecipe = null;
    for (const r of recipes) {
      const key = String(r.id ?? r.name ?? '');
      if (!key || used.has(key) || skip.has(key)) continue;
      const base = scoreForFlavor(r, flavor, { mealWindow, likedCuisines: liked });
      if (base === -Infinity) continue;
      const jittered = base + rand() * 0.5;
      if (jittered > bestScore) {
        bestScore = jittered;
        bestRecipe = r;
      }
    }
    if (bestRecipe) {
      used.add(String(bestRecipe.id ?? bestRecipe.name ?? ''));
      cards.push({ recipe: bestRecipe, flavor, score: bestScore });
    }
  }

  return { cards, flavors, seed: seedNum };
}
