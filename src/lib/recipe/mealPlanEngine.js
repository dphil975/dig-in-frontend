/* mealPlanEngine.js — the "same 5 meals" breaker.

   Pure client-side generator over the already-loaded recipe pool
   (recipeBooks.js's loadRecipeBooks() — the same 575-recipe pool AskNova/
   RecipeCards use). Every recipe in that pool carries a real recipe_type
   field (breakfast/lunch/dinner/snack/dessert/drink/bread) — this engine
   uses it to fill all 4 daily meal slots, not just dinner, and to pick a
   real drink recipe (from the same corpus's 131 "drink" entries) to pair
   with each one.

   Persistence: `/api/users/meal-plan` doesn't exist on any backend in this
   repo (checked — not in backend/app.py, api-server.js, or api/*.js), so
   this used to silently fail every save/load. Switched to localStorage,
   same dig_in_* namespace as everything else client-side in this app —
   honest and it actually works, instead of a phantom durable-sync promise. */

import { recipeFlavors } from '../flavorProfile';
import { seededRng } from '../recipeRecommender';
import { bonusRecipesFromList } from '../pantryTools';
import { ingredientText } from '../../components/recipe/RecipeBoostSections';

// Re-exported so MealPlan/index.jsx's existing import keeps working — the
// function itself now lives in pantryTools.js (a leaf module) since
// occasions.js also needs it and importing it from here would create a
// cycle (mealPlanEngine → recipeRecommender → occasions → mealPlanEngine).
export { bonusRecipesFromList };

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PLAN_KEY_PREFIX = 'dig_in_meal_plan_';

export const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch',     label: 'Lunch' },
  { key: 'dinner',    label: 'Dinner' },
  { key: 'snack',     label: 'Snack' },
];

function cuisineOf(recipe) {
  return (recipe?.cuisine || recipe?.country || recipe?.cuisine_type || '').toLowerCase();
}
function typeOf(recipe) {
  return (recipe?.recipe_type || recipe?.mealType || '').toLowerCase();
}
function textOf(r) {
  return ((r?.name || '') + ' ' + (r?.description || '')).toLowerCase();
}

// Drink-specific hot/cold vocabulary — separate from recipeRecommender.js's
// HOT_WORDS/COOL_WORDS (those are food-oriented: soup, roast, casserole).
// A latte or hot chocolate on a 95°F day is the exact "doesn't make sense"
// gap this closes: the drink pairing used to be picked purely on cuisine +
// flavor overlap with zero awareness of the weather the main recipe already
// factors in.
const HOT_DRINK_WORDS  = ['hot chocolate', 'hot cocoa', 'latte', 'cappuccino', 'mulled', 'hot tea', 'chai', 'cider', 'toddy', 'cocoa'];
const COLD_DRINK_WORDS = ['iced', 'ice ', 'frozen', 'smoothie', 'slushie', 'lemonade', 'milkshake', 'cold brew', 'frappe', 'frappuccino', 'sorbet', 'granita'];
function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function poolsByType(recipes) {
  const pools = { breakfast: [], lunch: [], dinner: [], snack: [], drink: [] };
  for (const r of recipes) {
    if (r?.id == null && !r?.name) continue;
    const t = typeOf(r);
    if (pools[t]) pools[t].push(r);
  }
  return pools;
}

/**
 * Best drink-recipe pairing for a meal, scored on real signals: same
 * cuisine as the dish, then flavor-profile overlap (recipeFlavors — the
 * same 8-flavor vocabulary the craving filter and drink pairing already
 * use elsewhere), with a small deterministic jitter so a cuisine doesn't
 * always land the identical drink. `weather` is optional — pass
 * `{ tempC }` (from ensureWeather()) to also keep hot drinks off a hot day
 * and cold drinks off a cold one; omit it and this scores exactly as before
 * (callers that don't have weather in hand, like the weekly meal plan,
 * are unaffected).
 */
export function pickDrinkPairing(recipe, drinkPool, seedStr, weather) {
  if (!drinkPool?.length) return null;
  const rng = seededRng(seedStr);
  const cuisine = cuisineOf(recipe);
  const flavors = recipeFlavors(recipe);
  const temp = weather?.tempC;
  let best = null, bestScore = -Infinity;
  for (const d of drinkPool) {
    let score = 0;
    if (cuisine && cuisineOf(d) === cuisine) score += 6;
    score += recipeFlavors(d).filter(f => flavors.includes(f)).length * 2;
    if (typeof temp === 'number') {
      const txt = textOf(d);
      if (temp >= 27) {                                   // ~80°F+: no hot drinks
        if (HOT_DRINK_WORDS.some(w => txt.includes(w)))  score -= 30;
        if (COLD_DRINK_WORDS.some(w => txt.includes(w))) score += 14;
      } else if (temp <= 8) {                             // cold: no iced drinks
        if (COLD_DRINK_WORDS.some(w => txt.includes(w))) score -= 20;
        if (HOT_DRINK_WORDS.some(w => txt.includes(w)))  score += 12;
      }
    }
    score += rng() * 3;
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}

function buildMealSlot(recipe, drinkPool, seedStr) {
  const drink = pickDrinkPairing(recipe, drinkPool, seedStr);
  return {
    recipeId: recipe.id ?? recipe.name,
    recipeName: recipe.name || recipe.full_name || 'Recipe',
    drinkId: drink ? (drink.id ?? drink.name) : null,
    drinkName: drink ? (drink.name || drink.full_name || 'Drink') : null,
  };
}

/** Monday-anchored week start (YYYY-MM-DD) for a given date. */
export function weekStartFor(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/**
 * Assign all 4 meal slots (breakfast/lunch/dinner/snack) across the week,
 * each from its own recipe_type pool. Per slot: skip recentRecipeIds when
 * there's enough pool left, avoid repeating a recipe within the week, and
 * avoid the same cuisine on consecutive days for that slot when an
 * alternative remains. Each meal also gets a paired drink recipe.
 */
export function generateWeekPlan({ recipes = [], recentRecipeIds = new Set() } = {}) {
  const rawPools = poolsByType(recipes);
  if (!MEAL_SLOTS.some(m => rawPools[m.key].length)) return [];

  const pools = {};
  for (const { key } of MEAL_SLOTS) {
    const pool = rawPools[key];
    const fresh = pool.filter(r => !recentRecipeIds.has(r.id ?? r.name));
    pools[key] = shuffled(fresh.length >= 7 ? fresh : pool);
  }

  const plan = [];
  const lastCuisineByMeal = {};
  for (let i = 0; i < 7; i++) {
    const meals = {};
    for (const { key } of MEAL_SLOTS) {
      if (!pools[key].length) pools[key] = shuffled(rawPools[key]); // refill if exhausted
      const pool = pools[key];
      if (!pool.length) { meals[key] = null; continue; }
      let idx = pool.findIndex(r => cuisineOf(r) !== lastCuisineByMeal[key]);
      if (idx === -1) idx = 0;
      const [pick] = pool.splice(idx, 1);
      lastCuisineByMeal[key] = cuisineOf(pick);
      meals[key] = buildMealSlot(pick, rawPools.drink, `${DAYS[i]}-${key}`);
    }
    plan.push({ day: DAYS[i], meals });
  }
  return plan;
}

/** Re-roll a single meal slot on one day, avoiding recipes already used
 * elsewhere in the plan (any day, any slot) and re-pairing a fresh drink. */
export function swapMeal(plan, dayIndex, mealKey, { recipes = [] } = {}) {
  const pools = poolsByType(recipes);
  const pool = pools[mealKey] || [];
  if (!pool.length) return plan;
  const usedIds = new Set(
    plan.flatMap(day => Object.values(day.meals || {})).filter(Boolean).map(m => m.recipeId),
  );
  const current = plan[dayIndex]?.meals?.[mealKey]?.recipeId;
  const options = pool.filter(r => !usedIds.has(r.id ?? r.name) && (r.id ?? r.name) !== current);
  const candidates = options.length ? options : pool;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return plan.map((day, i) => (i !== dayIndex ? day : {
    ...day,
    meals: { ...day.meals, [mealKey]: buildMealSlot(pick, pools.drink, `${day.day}-${mealKey}-${Date.now()}`) },
  }));
}

/** Place a SPECIFIC recipe into one slot, pairing a drink the same way
 * generateWeekPlan does. Unlike swapMeal (which picks randomly from the
 * slot's pool), the recipe here is already chosen by the caller — used when
 * something outside this engine's rotation should decide it, e.g. a logged
 * craving matched to a real recipe (see cravingMealPrep.js). */
export function placeMealSlot(plan, dayIndex, mealKey, recipe, { recipes = [] } = {}) {
  if (!recipe || !plan[dayIndex]) return plan;
  const drinkPool = poolsByType(recipes).drink || [];
  const slot = buildMealSlot(recipe, drinkPool, `${plan[dayIndex].day}-${mealKey}-craving-${Date.now()}`);
  return plan.map((day, i) => (i !== dayIndex ? day : {
    ...day,
    meals: { ...day.meals, [mealKey]: slot },
  }));
}

/** Re-roll every meal slot for one day (the old "reroll the whole day"). */
export function swapDayAll(plan, dayIndex, { recipes = [] } = {}) {
  let next = plan;
  for (const { key } of MEAL_SLOTS) next = swapMeal(next, dayIndex, key, { recipes });
  return next;
}

/** Swap just the drink paired with one meal, keeping the meal itself. */
export function swapDrink(plan, dayIndex, mealKey, { recipes = [] } = {}) {
  const drinkPool = poolsByType(recipes).drink || [];
  if (!drinkPool.length) return plan;
  const slot = plan[dayIndex]?.meals?.[mealKey];
  if (!slot) return plan;
  const options = drinkPool.filter(d => (d.id ?? d.name) !== slot.drinkId);
  const candidates = options.length ? options : drinkPool;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return plan.map((day, i) => (i !== dayIndex ? day : {
    ...day,
    meals: { ...day.meals, [mealKey]: { ...day.meals[mealKey], drinkId: pick.id ?? pick.name, drinkName: pick.name || pick.full_name || 'Drink' } },
  }));
}

/** Drop the drink pairing for one meal — pairing is an option, not a requirement. */
export function removeDrink(plan, dayIndex, mealKey) {
  return plan.map((day, i) => (i !== dayIndex ? day : {
    ...day,
    meals: { ...day.meals, [mealKey]: { ...day.meals[mealKey], drinkId: null, drinkName: null } },
  }));
}

export function loadWeekPlan(weekStart) {
  try {
    const v = JSON.parse(localStorage.getItem(PLAN_KEY_PREFIX + weekStart) || 'null');
    return Array.isArray(v) && v.every(day => day?.meals) ? v : null;
  } catch { return null; }
}

export function saveWeekPlan(weekStart, plan) {
  try { localStorage.setItem(PLAN_KEY_PREFIX + weekStart, JSON.stringify(plan)); return true; }
  catch { return false; }
}

// ── "Buy once, cook more" — the ingredient-overlap payoff ─────────────────
// The whole point of planning a week instead of picking dinners one at a
// time: the same shopping trip covers more than just what's scheduled.

/** Every real ingredient line across the whole week — every meal, every
 * paired drink — deduped. The one shopping trip this feature is built
 * around (distinct from sendToShoppingList()'s pantry-aware version in
 * MealPlan/index.jsx, which subtracts what you already own — this is the
 * FULL set, since "what recipes does this haul unlock" has to count
 * on-hand ingredients too, not just what's left to buy). */
export function weekIngredients(plan, recipes) {
  const byId = new Map(recipes.map(r => [r.id ?? r.name, r]));
  const seen = new Set();
  const out = [];
  for (const day of plan) {
    for (const meal of Object.values(day.meals || {})) {
      if (!meal) continue;
      for (const recipeId of [meal.recipeId, meal.drinkId].filter(Boolean)) {
        const recipe = byId.get(recipeId);
        if (!recipe) continue;
        for (const ing of recipe.ingredients || []) {
          const text = ingredientText(ing);
          if (!text) continue;
          const key = text.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(text);
        }
      }
    }
  }
  return out;
}

