/* cravingMealPrep.js — the bridge cravingTracker.js's log never had: from a
   logged craving to an actual slot in this week's meal plan, and back to
   "did I ever make it."

   cravingTracker.js already remembers what you craved and feeds a learned
   taste profile. pregnancyGuide.js's cravingInsight() reads a craving's shape
   and — for pregnancy/postpartum — what it's likely standing in for.
   mealPlanEngine.js already builds and edits a real weekly plan. Nothing
   before this connected the three: logging a craving was a dead end, not a
   plan.

   The loop this closes:
     1. logCraving()                              (cravingTracker.js, unchanged)
     2. recipesForCraving()                        real recipes that answer it
     3. placeCravingInPlan()                       actually into this week's plan
     4. cravingTrackingView()                      "logged → planned → made"
     5. markCravingFulfilled()                     closes the loop

   Step 5 is intentionally a plain function, not auto-detected from the cook
   journal — this app's house style (see recipeDiff.js) is to avoid inferring
   things a person didn't actually say. A "made this" tap is one wire-up away
   wherever the UI wants it; this file doesn't guess on its own. */

import { loadCravingLog } from './cravingTracker';
import { flavorsInText, recipeFlavors } from './flavorProfile';
import { cravingInsight } from './pregnancyGuide';
import { placeMealSlot } from './mealPlanEngine';

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
