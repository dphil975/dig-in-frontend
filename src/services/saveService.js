/**
 * Dig In Save Service
 *
 * Single source of truth: `dig_in_saved` localStorage key (array of full recipe objects).
 * This is the same key used by RecipeCards so both paths stay in sync.
 * Supabase is kept current via syncService (fire-and-forget).
 *
 * Unrelated user data (ratings, cooking history, achievements) still live in `digInData`.
 */

import { pushSavedRecipe, pushUnsavedRecipe } from '../lib/syncService';
import { recordCook } from '../lib/archetypeEngine';
import { scheduleSync } from '../lib/archetypeApi';

const SAVED_KEY   = 'dig_in_saved';
const META_KEY    = 'digInData';
const HISTORY_KEY = 'dig_in_cook_history';   // full recipe objects, newest-first (Vault reads this)

/* ── Saved recipes (full objects) ─────────────────────────────────────────── */

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; }
  catch { return []; }
}

function persistSaved(recipes) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(recipes)); } catch { /* quota */ }
}

function recipeKey(recipe) {
  return recipe?.id || recipe?.name || null;
}

export function getSavedRecipes() {
  return loadSaved();
}

/** Save a full recipe object. Returns true if newly saved, false if already saved.
    Stamps `savedAt` (ISO) when it isn't already present so the Archive can group
    saves by the month you liked them — old saves without it fall under "Earlier". */
export function saveRecipe(recipe) {
  const key  = recipeKey(recipe);
  if (!key) return false;
  const list = loadSaved();
  if (list.some(r => recipeKey(r) === key)) return false;
  const stamped = recipe && !recipe.savedAt ? { ...recipe, savedAt: new Date().toISOString() } : recipe;
  const next = [...list, stamped];
  persistSaved(next);
  pushSavedRecipe(stamped);
  return true;
}

/** Remove by recipe id or name. */
export function unsaveRecipe(recipe) {
  const key  = typeof recipe === 'string' ? recipe : recipeKey(recipe);
  if (!key) return;
  const list = loadSaved();
  persistSaved(list.filter(r => recipeKey(r) !== key));
  pushUnsavedRecipe(typeof recipe === 'string' ? { id: recipe, name: recipe } : recipe);
}

export function isSaved(recipe) {
  const key = typeof recipe === 'string' ? recipe : recipeKey(recipe);
  return loadSaved().some(r => recipeKey(r) === key);
}

export function toggleSave(recipe) {
  if (isSaved(recipe)) { unsaveRecipe(recipe); return false; }
  else                 { saveRecipe(recipe);   return true; }
}

/* ── Cooking history / ratings / achievements (unchanged) ─────────────────── */

const DEFAULT_META = () => ({
  recipeRatings: {},
  cookingHistory: [],
  unlockedCountries: ['japan', 'italy', 'mexico'],
  achievements: {},
  totalRecipesCooked: 0,
  joinDate: new Date().toISOString(),
});

function loadMeta() {
  try { return { ...DEFAULT_META(), ...JSON.parse(localStorage.getItem(META_KEY)) }; }
  catch { return DEFAULT_META(); }
}

function persistMeta(data) {
  try { localStorage.setItem(META_KEY, JSON.stringify(data)); } catch { /* quota */ }
}

export function rateRecipe(recipeId, rating) {
  const data = loadMeta();
  data.recipeRatings[recipeId] = rating;
  persistMeta(data);
}

export function getRating(recipeId) {
  return loadMeta().recipeRatings[recipeId] || 0;
}

export function logCookedRecipe(recipeId) {
  const data = loadMeta();
  data.cookingHistory.push({ recipeId, timestamp: new Date().toISOString() });
  data.totalRecipesCooked++;
  const thresholds = [
    [3, 'france'], [6, 'china'], [9, 'india'], [12, 'thailand'], [15, 'greece'],
  ];
  for (const [n, country] of thresholds) {
    if (data.totalRecipesCooked >= n && !data.unlockedCountries.includes(country)) {
      data.unlockedCountries.push(country);
    }
  }
  persistMeta(data);
}

export function getCookingStats() {
  const meta = loadMeta();
  return {
    totalSaved:          loadSaved().length,
    totalCooked:         meta.totalRecipesCooked,
    unlockedCountries:   meta.unlockedCountries.length,
    joinDate:            meta.joinDate,
  };
}

/* ── Cook log (the "I made this" bridge) ──────────────────────────────────────

   Two representations of "cooked" existed and never met: the Vault panel
   (CookedRecipes) reads full recipe objects from `dig_in_cook_history`, while
   logCookedRecipe() only ever wrote ID-level stats into `digInData`. markCooked()
   is the single tap that writes BOTH, so the Vault fills up and the stats /
   country unlocks stay in sync — and it returns a summary the celebration uses. */

function loadCookHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}

export function getCookHistory() {
  return loadCookHistory();
}

// Consecutive calendar days (local time) ending today that have ≥1 cook.
export function cookStreak(history) {
  const days = new Set(
    history.map(e => e.cookedAt).filter(Boolean).map(iso => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );
  let streak = 0;
  const cur = new Date();
  while (days.has(`${cur.getFullYear()}-${cur.getMonth()}-${cur.getDate()}`)) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

/**
 * One-tap "I made this". Appends a full recipe entry to the cook history the
 * Vault renders, bumps the stats/achievement store, and reports what changed so
 * the celebration moment can show streak, total, and any newly-unlocked cuisine.
 * @returns { entry, totalCooked, streak, newCountries } | null
 */
export function markCooked(recipe) {
  if (!recipe) return null;
  const now = new Date();
  const entry = {
    id:          recipe.id ?? null,
    name:        recipe.name || 'Recipe',
    cuisine:     recipe.cuisine || recipe.country || recipe.cuisine_type || null,
    totalTime:   recipe.totalTime || recipe.total_time
                   || ((recipe.prepTime || 0) + (recipe.cookTime || 0)) || recipe.time || null,
    servings:    recipe.servings || null,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    image:       recipe.image || null,
    date:        now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    cookedAt:    now.toISOString(),
  };

  const priorHistory = loadCookHistory();
  const history = [entry, ...priorHistory];
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch { /* quota */ }

  // Teach the archetype lens how this person cooks, so the feed can spend 40%
  // of itself on the counterweight to their habit instead of compounding it.
  // Reads the dish + their own prior history; never blocks the cook if it
  // throws. See lib/archetypeEngine.js.
  try {
    recordCook(recipe, priorHistory);
    scheduleSync();
  } catch { /* the cook is what matters — never fail it over a profile write */ }

  // Keep the older stats/country-unlock representation in lockstep.
  const before = new Set(loadMeta().unlockedCountries);
  logCookedRecipe(recipe.id ?? entry.name);
  const newCountries = loadMeta().unlockedCountries.filter(c => !before.has(c));

  return {
    entry,
    totalCooked: getCookingStats().totalCooked,
    streak:      cookStreak(history),
    newCountries,
  };
}

export function exportData() {
  const payload = { savedRecipes: loadSaved(), ...loadMeta() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dig-in-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
