/* mealPrepFavorites.js — "ate it all? save this for a future meal-prep day."

   Same list-persistence shape as restaurantFavorites.js, but backed by the
   backend (node/routes/users.js's /api/users/meal-prep, → meal_prep_favorites)
   instead of localStorage-only, since a meal-prep list is exactly the kind of
   thing you want on your phone next weekend, not just this device today. */

import { getUserId } from './syncService';

const KEY = 'dig_in_meal_prep_favorites';
const API = '/api/users/meal-prep';

function load() {
  try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; }
  catch { return []; }
}

function persist(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* quota */ }
}

function recipeKey(recipe) {
  return recipe?.id || recipe?.name || null;
}

export function getMealPrepFavorites() {
  return load();
}

export function isMealPrepFavorite(recipe) {
  const key = recipeKey(recipe);
  return load().some(r => recipeKey(r) === key);
}

/** Save a recipe for a future meal-prep day. Fire-and-forget backend push,
    localStorage-first for instant UI, same pattern as saveService.saveRecipe. */
export function saveMealPrepFavorite(recipe) {
  const key = recipeKey(recipe);
  if (!key) return false;
  const list = load();
  if (list.some(r => recipeKey(r) === key)) return false;
  persist([...list, recipe]);

  (async () => {
    const user_id = await getUserId();
    if (!user_id) return;
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, recipe }),
      signal: AbortSignal.timeout(6000),
    }).catch(() => null);
  })();

  return true;
}

export function removeMealPrepFavorite(recipe) {
  const key = recipeKey(recipe);
  persist(load().filter(r => recipeKey(r) !== key));

  (async () => {
    const user_id = await getUserId();
    if (!user_id) return;
    fetch(API, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, recipe_id: key }),
      signal: AbortSignal.timeout(6000),
    }).catch(() => null);
  })();
}
