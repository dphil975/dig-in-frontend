/* ════════════════════════════════════════════════════════════
   CRAVING TRACKER — merged module.

   Consolidates two formerly-separate lib/ files:
     - cravingTracker.js    (the craving journal + learned-taste tie-in)
     - cravingMealPrep.js   (the bridge from a logged craving to an actual
                             meal-plan slot, and back to "did I ever make it")

   Each section below is marked with the name of the original file it came
   from. Nothing was renamed — the two files' exports didn't collide. The
   old flat files (src/lib/cravingTracker.js, src/lib/cravingMealPrep.js)
   now just re-export from here so existing imports keep working.
   ════════════════════════════════════════════════════════════ */

import { flavorsInText, recipeFlavors, recordFlavorSignal } from '../flavorProfile';
import { cravingInsight } from '../pregnancyGuide';
import { placeMealSlot } from '../mealPlanEngine';

/* ────────────────────────────────────────────────────────────
   From cravingTracker.js
   ────────────────────────────────────────────────────────────
   A craving journal that remembers over time, and turns recurring patterns
   into a "keep the pantry stocked" prep list — the homestead instinct of
   having what you'll want on hand before you have to ask for it, instead
   of a reactive scramble.

   Every logged craving is auto-tagged with the same 8-flavor vocabulary
   (flavorProfile.js, in this same directory) and fed into
   recordFlavorSignal() — the SAME learned taste profile
   (dig_in_craving_prefs) that RecipeCards' recommendations and
   novaNudges.js's craving-aware nudges already read. One profile, not a
   second parallel one — logging a craving here measurably shifts what gets
   recommended and what Nova says, the same afternoon.

   Includes an optional life-stage tag (pregnancy/postpartum/general).
   MATERNAL_PATTERNS below are well-known, commonly-reported craving shapes
   during pregnancy — comfort-and-flavor matching, NOT a nutrient
   prescription or a diagnosis. See MATERNAL_NOTE.
   ──────────────────────────────────────────────────────────── */

const LOG_KEY = 'dig_in_craving_log';

export const LIFE_STAGES = [
  { id: 'general',    label: 'Just craving it' },
  { id: 'pregnancy',  label: 'Pregnancy' },
  { id: 'postpartum', label: 'Postpartum / nursing' },
];

export const INTENSITIES = ['mild', 'medium', 'strong'];

export const MATERNAL_NOTE =
  'These are commonly reported patterns, not a nutrient prescription or medical guidance — cravings (and aversions) vary a lot person to person. Talk to your OB or midwife about actual prenatal or postpartum nutrition.';

// Widely-reported craving shapes during pregnancy, mapped onto the SAME
// 8-flavor vocabulary flavorProfile.js already tags every recipe with, so
// they slot straight into recipe matching instead of needing their own list.
export const MATERNAL_PATTERNS = [
  { id: 'sour',    label: 'Sour & tart',            flavors: ['tangy'],          note: 'Very commonly reported, especially early on — lemon, pickles, sour candy.' },
  { id: 'salty',   label: 'Salty',                  flavors: ['savory'],         note: 'Pickles, chips, salty snacks — one of the most classically reported cravings.' },
  { id: 'sweet',   label: 'Sweet',                  flavors: ['sweet'],          note: 'Fruit, chocolate, something sugary — common throughout, especially later on.' },
  { id: 'cold',    label: 'Cold & icy',             flavors: ['light'],          note: 'Ice, popsicles, cold drinks — if it specifically feels like a pull toward chewing ice, mention it to your doctor.' },
  { id: 'comfort', label: 'Nostalgic comfort food', flavors: ['rich', 'earthy'], note: 'Something from childhood or a family recipe — comfort cravings are just as real as flavor ones.' },
];

function load() {
  try { const v = JSON.parse(localStorage.getItem(LOG_KEY)); return Array.isArray(v) ? v : []; } catch { return []; }
}
function save(list) { try { localStorage.setItem(LOG_KEY, JSON.stringify(list)); } catch { /* ignore */ } }

export function loadCravingLog() { return load(); }

/** Log a craving. Auto-tags it with the 8-flavor vocabulary and records the
 * same learned-taste signal every recipe save already writes to, so this
 * one log entry measurably shapes recommendations and nudges too. */
export function logCraving({ text, lifeStage = 'general', intensity = 'medium' }) {
  const clean = (text || '').trim();
  if (!clean) return load();
  const flavors = flavorsInText(clean);
  const list = load();
  list.unshift({
    id: `cr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    text: clean, lifeStage, intensity, flavors, loggedAt: Date.now(),
  });
  save(list);
  if (flavors.length) recordFlavorSignal({ name: clean, ingredients: [], description: clean }, 'save');
  return list;
}

export function removeCravingEntry(id) {
  const list = load().filter(e => e.id !== id);
  save(list);
  return list;
}

/** Which flavors keep showing up in the log — same "≥2 mentions" bar
 * allergyProfile.js's detectPatterns() uses, so a one-off doesn't read as
 * a pattern. */
export function cravingPatterns() {
  const counts = {};
  for (const entry of load()) {
    for (const f of entry.flavors || []) counts[f] = (counts[f] || 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([flavor, count]) => ({ flavor, count }));
}

// What's worth keeping on hand per flavor, so next time the craving hits
// it's already covered — real pantry items, not a vague "eat healthier."
const STOCK_SUGGESTIONS = {
  spicy:  ['hot sauce', 'chili flakes', 'jalapeños', 'sriracha'],
  sweet:  ['honey', 'dates', 'dark chocolate', 'maple syrup'],
  savory: ['parmesan', 'soy sauce', 'miso paste', 'good broth'],
  rich:   ['butter', 'heavy cream', 'good cheese'],
  light:  ['lemons', 'fresh herbs', 'cucumbers'],
  earthy: ['lentils', 'canned beans', 'root vegetables'],
  smoky:  ['smoked paprika', 'chipotle in adobo'],
  tangy:  ['pickles', 'vinegar', 'plain yogurt'],
};

/** The "keep it stocked" list — pantry items worth having on hand for
 * whichever flavors have actually shown up ≥2 times, so the next craving
 * is already covered instead of a store run. */
export function stockAheadList() {
  return cravingPatterns()
    .map(p => ({ flavor: p.flavor, count: p.count, items: STOCK_SUGGESTIONS[p.flavor] || [] }))
    .filter(p => p.items.length);
}

/* ────────────────────────────────────────────────────────────
   From cravingMealPrep.js
   ────────────────────────────────────────────────────────────
   The bridge the craving log never had: from a logged craving to an actual
   slot in this week's meal plan, and back to "did I ever make it."

   The section above already remembers what you craved and feeds a learned
   taste profile. pregnancyGuide.js's cravingInsight() reads a craving's shape
   and — for pregnancy/postpartum — what it's likely standing in for.
   mealPlanEngine.js already builds and edits a real weekly plan. Nothing
   before this connected the three: logging a craving was a dead end, not a
   plan.

   The loop this closes:
     1. logCraving()                              (above, unchanged)
     2. recipesForCraving()                        real recipes that answer it
     3. placeCravingInPlan()                       actually into this week's plan
     4. cravingTrackingView()                      "logged → planned → made"
     5. markCravingFulfilled()                     closes the loop

   Step 5 is intentionally a plain function, not auto-detected from the cook
   journal — this app's house style (see recipeDiff.js) is to avoid inferring
   things a person didn't actually say. A "made this" tap is one wire-up away
   wherever the UI wants it; this file doesn't guess on its own.
   ──────────────────────────────────────────────────────────── */

const LINK_KEY = 'dig_in_craving_links';   // { [cravingId]: { recipeId, recipeName, weekStart, dayIndex, mealKey, plannedAt, fulfilledAt } }

function readLinks() {
  try { const v = JSON.parse(localStorage.getItem(LINK_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; }
  catch { return {}; }
}
function writeLinks(links) {
  try { localStorage.setItem(LINK_KEY, JSON.stringify(links)); } catch { /* ignore */ }
}

function textOf(r) {
  return `${r?.name || ''} ${r?.description || ''}`.toLowerCase();
}

/**
 * Rank real recipes against a logged craving. Two signals, both real:
 *   - flavor overlap, same 8-flavor vocabulary flavorProfile.js already tags
 *     every recipe with (the same vocabulary RecipeCards' recommendations and
 *     novaNudges read, so this stays consistent with what the rest of the app
 *     already believes about a recipe's flavor)
 *   - a keyword bonus when the recipe's name/description mentions one of
 *     pregnancyGuide's "satisfy" words for that craving shape (e.g. a "sour"
 *     craving bonuses a recipe whose text mentions pickles or citrus)
 * Returns [] rather than guessing when nothing in the pool shares a flavor —
 * an empty result is more honest than a random recipe attached to a craving
 * that has nothing to do with it.
 */
export function recipesForCraving(text, pool = [], { lifeStage = null, limit = 6 } = {}) {
  const craveFlavors = flavorsInText(text);
  if (!craveFlavors.length || !pool.length) return [];

  const insight = cravingInsight(text, lifeStage);
  const satisfyWords = (insight?.shape?.satisfy || []).map((w) => w.toLowerCase());

  const scored = pool
    .map((recipe) => {
      const flavors = recipeFlavors(recipe);
      const overlap = flavors.filter((f) => craveFlavors.includes(f)).length;
      if (!overlap) return null;
      const hay = textOf(recipe);
      const keywordHit = satisfyWords.some((w) => hay.includes(w));
      return { recipe, score: overlap * 2 + (keywordHit ? 3 : 0) };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.recipe);
}

/**
 * Put a chosen recipe into this week's plan for a craving, and remember the
 * link so cravingTrackingView() can report "planned" instead of just
 * "logged." Delegates the actual plan mutation to mealPlanEngine's
 * placeMealSlot — this module never touches plan storage directly, so the
 * two stay consistent by construction rather than by convention.
 */
export function placeCravingInPlan(cravingId, recipe, plan, dayIndex, mealKey, { recipes = [], weekStart = '' } = {}) {
  const nextPlan = placeMealSlot(plan, dayIndex, mealKey, recipe, { recipes });
  if (nextPlan === plan) return { plan, linked: false };  // placeMealSlot no-ops on bad input

  const links = readLinks();
  links[cravingId] = {
    recipeId: recipe.id ?? recipe.name,
    recipeName: recipe.name || 'Recipe',
    weekStart, dayIndex, mealKey,
    plannedAt: Date.now(),
    fulfilledAt: links[cravingId]?.fulfilledAt || null,
  };
  writeLinks(links);
  return { plan: nextPlan, linked: true };
}

/** Close the loop: mark a craving as actually made. Plain and explicit —
    see file header for why this isn't auto-detected. */
export function markCravingFulfilled(cravingId, now = Date.now()) {
  const links = readLinks();
  if (!links[cravingId]) return false;
  links[cravingId] = { ...links[cravingId], fulfilledAt: now };
  writeLinks(links);
  return true;
}

/**
 * The tracking view: every logged craving with its current status. This is
 * the "track your cravings through meal prep" surface — one list, three
 * states, no separate screens to reconcile:
 *   logged   — craving recorded, nothing planned yet
 *   planned  — sitting in a specific day/slot of a real week's plan
 *   made     — actually cooked
 */
export function cravingTrackingView() {
  const links = readLinks();
  return loadCravingLog().map((entry) => {
    const link = links[entry.id] || null;
    const status = link?.fulfilledAt ? 'made' : link ? 'planned' : 'logged';
    return { ...entry, status, link };
  });
}

/** Quick counts for a compact summary chip ("3 logged, 1 planned, 2 made"). */
export function cravingTrackingSummary() {
  const view = cravingTrackingView();
  return {
    total: view.length,
    logged: view.filter((c) => c.status === 'logged').length,
    planned: view.filter((c) => c.status === 'planned').length,
    made: view.filter((c) => c.status === 'made').length,
  };
}

/**
 * The reverse lookup: given a specific plan slot (the shape MealPlan/index.jsx
 * already has on hand — weekStart + dayIndex + mealKey), which craving, if
 * any, landed there. Lets the meal-plan grid itself show "from a craving"
 * without MealPlan needing to know anything about craving storage — it just
 * asks about the slot it's already rendering. */
export function linkedCravingForSlot(weekStart, dayIndex, mealKey) {
  const links = readLinks();
  const hit = Object.entries(links).find(
    ([, l]) => l.weekStart === weekStart && l.dayIndex === dayIndex && l.mealKey === mealKey,
  );
  if (!hit) return null;
  const [cravingId, link] = hit;
  const entry = loadCravingLog().find((c) => c.id === cravingId);
  return { cravingId, text: entry?.text || link.recipeName, ...link };
}

/**
 * Drop the link for a specific slot, if one exists — called from the meal-
 * plan UI whenever that slot's recipe changes out from under it (a swap or a
 * day reroll). Without this, "from a craving" would keep pointing at whatever
 * recipe now sits in that slot, which is exactly the kind of claim this app
 * doesn't make about things it can't verify. The craving itself is untouched
 * and simply reverts to "logged" — nothing was lost, just unlinked.
 */
export function clearLinkForSlot(weekStart, dayIndex, mealKey) {
  const links = readLinks();
  let changed = false;
  for (const [id, l] of Object.entries(links)) {
    if (l.weekStart === weekStart && l.dayIndex === dayIndex && l.mealKey === mealKey) {
      delete links[id];
      changed = true;
    }
  }
  if (changed) writeLinks(links);
  return changed;
}
