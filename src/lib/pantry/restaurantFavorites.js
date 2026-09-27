/* restaurantFavorites.js — save a dish you loved (from a restaurant, a photo
   you took, wherever) as a short ingredient profile, then see how close your
   pantry already is to recreating it.

   This app has no Vision API key/backend, so there's no real photo→ingredient
   recognition — same honesty convention as parseReceipt() ("no OCR, paste the
   text"). A favorite is typed, not scanned: name + where it's from + the key
   ingredients that make it what it is. Matching reuses itemCoversIngredient()
   from pantryTools.js, so a favorite is scored against the pantry exactly the
   way suggestRecipes() scores a real recipe — one matching engine, not two. */

import { itemCoversIngredient } from '../pantryTools';

const KEY = 'dig_in_restaurant_favorites';

export function loadFavorites() {
  try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch { return []; }
}

function saveFavorites(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

/** Add a saved dish. keyIngredients: array of ingredient name strings. */
export function addFavorite({ name, source, cuisine, keyIngredients }) {
  const clean = (keyIngredients || []).map(s => s.trim()).filter(Boolean);
  if (!name?.trim() || clean.length === 0) return loadFavorites();
  const list = loadFavorites();
  list.unshift({
    id: `fav_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    source: (source || '').trim(),
    cuisine: (cuisine || '').trim(),
    keyIngredients: clean,
    addedAt: Date.now(),
  });
  saveFavorites(list);
  return list;
}

export function removeFavorite(id) {
  const list = loadFavorites().filter(f => f.id !== id);
  saveFavorites(list);
  return list;
}

/**
 * Score every saved favorite against the current pantry, same shape as
 * suggestRecipes()'s results: { favorite, have, missing, coverage }, best
 * match first. Staples aren't assumed here (unlike recipes) — a typed
 * favorite's ingredient list is short and specific by design.
 */
export function matchFavorites(pantryItems) {
  const names = (pantryItems || []).map(i => i.name).filter(Boolean);
  const favorites = loadFavorites();
  return favorites
    .map(fav => {
      const have = fav.keyIngredients.filter(ing => names.some(n => itemCoversIngredient(n, ing)));
      const missing = fav.keyIngredients.filter(ing => !have.includes(ing));
      const coverage = have.length / fav.keyIngredients.length;
      return { favorite: fav, have, missing, coverage };
    })
    .sort((a, b) => b.coverage - a.coverage);
}
