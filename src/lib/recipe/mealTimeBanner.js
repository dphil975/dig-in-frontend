/* mealTimeBanner.js — the fast-food-menu-board idea: whatever time it is
   right now, there's exactly one real window active, with one recommended
   recipe (+ a complementary drink) for it. A behavioral model built on the
   same recommendation engine every other reel/discover surface uses
   (scoreRecipe/buildContext from recipeRecommender.js) — not a live feed,
   same honesty framing as shopTiming.js elsewhere in this app.

   4 windows, gapless across 24 hours:
     Breakfast    4:31am–11:30am
     Lunch        11:31am–4:00pm  (also the Happy Hour window)
     Dinner       4:01pm–9:00pm
     Late Night   9:00pm–4:30am

   Happy Hour (lunch window only, opt-in toggle) swaps the pick for a
   snack-portioned, nibbler-style bite instead of a full lunch. */

import { scoreRecipe, buildContext, seededRng } from '../recipeRecommender';
import { pickDrinkPairing } from '../mealPlanEngine';

import { MEAL_WINDOWS, currentMealWindow } from './mealWindows';

export { MEAL_WINDOWS, currentMealWindow };

const MEAL_KEY_FOR_SCORING = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner', snack: 'snacks' };

/** Best-scoring recipe (+ a paired drink) for a window, reusing the exact
 * same scoreRecipe/pickDrinkPairing every other reel already uses. Reseeded
 * once per real calendar day (not per render) so the pick stays put as you
 * browse, but genuinely changes day to day. `weather` (from ensureWeather())
 * keeps both halves honest about temperature: scoreRecipe already avoided
 * heavy hot dishes on a hot day, and now the drink pairing does the same —
 * no hot lattes recommended on a 90°F afternoon. */
export function pickWindowRecipe(recipes, window, { happyHour = false, weather } = {}) {
  const wantType = happyHour && window.happyHour ? 'snack' : window.recipeType;
  const pool = recipes.filter(r => (r.recipe_type || '').toLowerCase() === wantType);
  const drinkPool = recipes.filter(r => (r.recipe_type || '').toLowerCase() === 'drink');
  if (!pool.length) return null;

  const ctx = buildContext({ weather });
  const seedStr = `meal-banner-${new Date().toDateString()}-${window.id}-${happyHour}`;
  const rng = seededRng(seedStr);
  const mealKey = MEAL_KEY_FOR_SCORING[wantType] || wantType;

  let best = null, bestScore = -Infinity;
  for (const r of pool) {
    const s = scoreRecipe(r, ctx, {}, mealKey, rng);
    if (s > bestScore) { bestScore = s; best = r; }
  }
  if (!best) return null;

  const drink = pickDrinkPairing(best, drinkPool, seedStr, weather);
  return { recipe: best, drink };
}
