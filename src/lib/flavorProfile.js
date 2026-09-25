/* ════════════════════════════════════════════════════════════
   FLAVOR PROFILE — the app's single 8-flavor vocabulary
   (spicy, sweet, savory, rich, light, earthy, smoky, tangy).

   Every recipe is tagged with 0+ of these by keyword-matching its name /
   description / ingredients / instructions. Every user interaction —
   viewing a recipe, lingering on it in the Discover feed, saving it,
   opening the full recipe, sharing it, or skipping past it fast — nudges
   the user's profile toward or away from those flavors. This mirrors how
   TikTok's For You algorithm treats every watch, rewatch, like, share and
   fast-skip as a vote for or against a video's attributes, re-ranking the
   very next recommendation on it instead of waiting for an explicit rating.
   ════════════════════════════════════════════════════════════ */

export const FLAVORS = ['spicy', 'sweet', 'savory', 'rich', 'light', 'earthy', 'smoky', 'tangy'];

const FLAVOR_KW = {
  spicy:  ['spicy', 'chili', 'chilli', 'jalapeño', 'pepper', 'hot sauce', 'cayenne', 'sriracha', 'gochujang'],
  sweet:  ['sugar', 'honey', 'maple', 'chocolate', 'vanilla', 'fruit', 'mango', 'berry', 'caramel', 'dessert'],
  savory: ['soy sauce', 'miso', 'umami', 'mushroom', 'broth', 'parmesan', 'dashi', 'anchovy'],
  rich:   ['butter', 'cream', 'cheese', 'beef', 'pork', 'lamb', 'coconut milk', 'fried', 'lard'],
  light:  ['salad', 'lemon', 'lime', 'citrus', 'herb', 'mint', 'cucumber', 'steamed', 'fresh'],
  earthy: ['lentil', 'bean', 'root', 'beet', 'squash', 'potato', 'truffle'],
  smoky:  ['smoked', 'barbecue', 'chipotle', 'paprika', 'grill', 'roasted', 'char'],
  tangy:  ['vinegar', 'pickle', 'yogurt', 'tamarind', 'fermented', 'kimchi', 'sour'],
};

function textOf(r) {
  return [r.name || '', r.description || '', ...(r.ingredients || []), ...(r.instructions || [])]
    .join(' ').toLowerCase();
}

/** Which of the 8 flavors a raw string of text reads as — the same keyword
    vocabulary recipeFlavors() uses on a recipe object, just callable on
    plain text directly (e.g. a typed craving) instead of requiring a
    name/description/ingredients/instructions shape. */
export function flavorsInText(text) {
  const t = String(text || '').toLowerCase();
  return FLAVORS.filter(f => FLAVOR_KW[f].some(kw => t.includes(kw)));
}

export function recipeFlavors(r) {
  return flavorsInText(textOf(r));
}

/* ── Persisted taste profile ─────────────────────────────────── */
// Reuses the storage key the craving filter already wrote to (clicking
// "SPICY" in the filter bar was already a first, explicit version of this
// signal) — the Discover feed just adds many more implicit ones on top of
// that same running total, so the grid and the feed learn from each other.
const PROFILE_KEY = 'dig_in_craving_prefs';

export function loadFlavorProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); } catch { return {}; }
}

function saveFlavorProfile(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
}

// ── Swipe-feed learning toggle ─────────────────────────────────────────
// Gates ONLY the Tinder-style Discover feed's (TikTokRecipeFeed.jsx, used by
// both /feed and RecipeCards' "Discover" button) calls into
// recordFlavorSignal() below — not the function itself, which stays wired
// up everywhere else (reel likes, craving reverse-engineering, the taste
// quiz, etc.). Default on: swiping there is the app's main "recalibrate my
// taste" entry point, so it should teach the profile unless a shopper
// deliberately turns that off from Profile settings.
const SWIPE_LEARNING_KEY = 'dig_in_swipe_learning';

export function isSwipeLearningEnabled() {
  try {
    const v = localStorage.getItem(SWIPE_LEARNING_KEY);
    return v === null ? true : v === 'true';
  } catch { return true; }
}

export function setSwipeLearningEnabled(on) {
  try { localStorage.setItem(SWIPE_LEARNING_KEY, on ? 'true' : 'false'); } catch { /* ignore */ }
}

// Positive signals build affinity; a fast skip / swipe-left is the one
// negative signal — mirrors "not interested" being the strongest down-vote
// on TikTok. superlike (Discover's swipe-up) is the strongest explicit
// positive — it's a deliberate favorite, stronger than just opening a recipe.
export const SIGNAL_WEIGHT = { view: 1, dwell: 2, save: 6, cook: 8, share: 5, superlike: 10, skip: -3 };

// `overrideFlavors` lets a caller that already KNOWS the flavor(s) (e.g. a
// reel's own hand-tagged `flavor` chip) skip keyword-detection entirely —
// a flavor's own name isn't always a literal keyword in its own bucket
// (e.g. "rich" isn't in FLAVOR_KW.rich, which lists butter/cream/cheese/…
// instead), so text-matching a label against itself can silently miss.
export function recordFlavorSignal(recipe, signal, overrideFlavors) {
  const weight = SIGNAL_WEIGHT[signal];
  const profile = loadFlavorProfile();
  if (!weight || !recipe) return profile;
  const flavors = overrideFlavors?.length ? overrideFlavors : recipeFlavors(recipe);
  if (!flavors.length) return profile;
  const next = { ...profile };
  for (const f of flavors) next[f] = Math.max(-20, Math.min(80, (next[f] || 0) + weight));
  saveFlavorProfile(next);
  return next;
}

// Bulk-seed the profile from explicit answers (the flavor onboarding quiz,
// or a restaurant-hint match) instead of waiting on implicit swipe signals
// to slowly build one up. A moderate starting weight (roughly what ~3
// superlikes would earn) so day-1 recommendations already lean toward it
// without drowning out what the user does after.
const SEED_WEIGHT = 25;

export function seedFlavorProfile(flavors) {
  if (!flavors || !flavors.length) return loadFlavorProfile();
  const next = { ...loadFlavorProfile() };
  for (const f of flavors) {
    if (!FLAVORS.includes(f)) continue;
    next[f] = Math.max(-20, Math.min(80, (next[f] || 0) + SEED_WEIGHT));
  }
  saveFlavorProfile(next);
  return next;
}
