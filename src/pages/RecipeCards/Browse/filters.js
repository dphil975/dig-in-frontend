/* Browse page filter helpers — pure logic for every filter chip on the
   RecipeCards browse view. Pulled out of index.jsx so the main file stays
   focused on the React tree. No JSX, no component state. */

import { FLAVORS, recipeFlavors } from '../../../lib/flavorProfile';
import { totalTimeOf } from '../../../lib/recipeRecommender';
import { priceRecipe } from '../../../lib/tierBudget';
import { nutrientTags } from '../../../lib/wellnessGoals';
import { gutProfile } from '../../../lib/gutHealth';

export const TIME_OPTIONS = [
  { key: '15', label: '≤15 MIN' },
  { key: '30', label: '≤30 MIN' },
  { key: '60', label: '60+ MIN' },
];
export const CRAVING_OPTIONS = FLAVORS; // the shared 8-flavor vocabulary (see lib/flavorProfile)
export const DIET_OPTIONS = ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free'];
export const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'];
export const PREP_OPTIONS = [
  { key: 'quick',  label: 'QUICK ≤20' },
  { key: 'normal', label: 'NORMAL 20–45' },
  { key: 'long',   label: 'LONG 45+' },
];
// Prep-time bucket — uses prepTime when available, else falls back to total time.
export function prepBucket(r) {
  const p = r.prepTime || totalTimeOf(r);
  if (!p) return null;
  if (p <= 20) return 'quick';
  if (p <= 45) return 'normal';
  return 'long';
}

// Ingredients that disqualify a recipe from each diet/allergy tag.
export const DIET_EXCLUDE = {
  'vegan':       ['butter','milk','cream','cheese','egg','honey','gelatin','pork','chicken','beef','fish','lamb','turkey','lard','meat','tuna','salmon','shrimp','bacon','ham','yogurt','dashi','bonito','mayo'],
  'vegetarian':  ['pork','chicken','beef','fish','lamb','turkey','gelatin','lard','meat','tuna','salmon','shrimp','anchovy','bacon','ham','dashi','bonito'],
  'gluten-free': ['flour','spaghetti','pasta','wheat','barley','rye','breadcrumb','panko','couscous','noodle','udon','ramen','orzo','bread','soy sauce'],
  'dairy-free':  ['butter','milk','cream','cheese','yogurt','mayo'],
  'nut-free':    ['almond','peanut','cashew','walnut','pecan','hazelnut','pistachio'],
};
// "Budget Friendly" (Home's Discover Highlights carousel) — a real cost
// filter, not a vibe: under $2/serving at the budget tier's store/brand
// routing (tierBudget.js's priceRecipe). Validated against the real
// 575-recipe corpus before picking $2 — 59.5% qualify, a real filter, not
// "everything is budget friendly."
export const BUDGET_THRESHOLD = 2.00;
export function isBudgetFriendly(recipe) {
  const lines = (recipe.ingredients || []).map(i => (typeof i === 'object' ? (i.text || i.name || '') : i)).filter(Boolean);
  if (!lines.length) return false;
  return priceRecipe(lines, recipe, 'budget').perServing <= BUDGET_THRESHOLD;
}

/* "What can you spend?" — the single, merged budget interface. It used to
   live on Home twice (a preset widget AND SmartFinder's second ZIP slider);
   in the Tumblr rebuild it moved here to Cook, where money is the actual
   question, as ONE control. Costed per serving at budget-tier stores/brands
   via the same priceRecipe engine, memoized because the grid re-filters on
   every keystroke and priceRecipe walks the whole ingredient list. */
export const SPEND_PRESETS = [3, 5, 8, 12];
const _spendCache = new Map();
export function perServingCost(recipe) {
  const key = recipe?.id || recipe?.name;
  if (key && _spendCache.has(key)) return _spendCache.get(key);
  const lines = (recipe?.ingredients || []).map(i => (typeof i === 'object' ? (i.text || i.name || '') : i)).filter(Boolean);
  // No ingredients means we can't honestly price it — never claim it fits.
  const cost = lines.length ? priceRecipe(lines, recipe, 'budget').perServing : Infinity;
  if (key) _spendCache.set(key, cost);
  return cost;
}

// "Boy Dinner" — dinner-type, easy, high-protein (reuses wellnessGoals.js's
// existing nutrient-tag rule rather than a second protein keyword list).
export function isBoyDinner(recipe) {
  const type = (recipe.recipe_type || '').toLowerCase();
  if (type !== 'dinner' && type !== 'lunch') return false;
  if ((recipe.difficulty || '').toLowerCase() === 'hard') return false;
  return nutrientTags(recipe.ingredients).some(t => t.id === 'high-protein');
}

// "Bread" — not one of RecipeCards' 5 meal buckets (breakfast/lunch/dinner/
// snacks/desserts derive from each country file's own top-level arrays, and
// none of them is "bread"), so this is a keyword/recipe_type match over the
// full flattened pool instead of a 6th permanent tab — see activeMeal
// handling in fullList below.
export const BREAD_KEYWORDS = /\bbread\b|\bbun\b|\bbaguette\b|\bfocaccia\b|\bbiscuit\b|\bbagel\b|\bchallah\b|\bbrioche\b|\bnaan\b|flatbread|\bpita\b|\broll\b/i;
export function isBreadRecipe(recipe) {
  if ((recipe.recipe_type || '').toLowerCase() === 'bread') return true;
  return BREAD_KEYWORDS.test(recipe.name || '');
}

export function getDietTags(recipe) {
  const text = (recipe.ingredients || [])
    .map(i => (typeof i === 'object' ? (i.text || i.name || '') : i)).join(' ').toLowerCase();
  if (!text.trim()) return [];   // unknown ingredients → make no diet claims
  return Object.entries(DIET_EXCLUDE)
    .filter(([, excl]) => !excl.some(k => text.includes(k)))
    .map(([tag]) => tag);
}

export function matchesFilters(r, f) {
  if (f.time) {
    const t = totalTimeOf(r);
    if (f.time === '15' && !(t > 0 && t <= 15)) return false;
    if (f.time === '30' && !(t > 0 && t <= 30)) return false;
    if (f.time === '60' && !(t >= 60)) return false;
  }
  if (f.soup) {
    const txt = ((r.name || '') + ' ' + (r.recipe_type || '') + ' ' + (r.mealType || '')).toLowerCase();
    if (!/soup|stew|broth|chowder|bisque/.test(txt)) return false;
  }
  if (f.craving.size) {
    const flavors = recipeFlavors(r);
    if (![...f.craving].some(c => flavors.includes(c))) return false;
  }
  if (f.cuisine.size && !f.cuisine.has((r.country || r.cuisine || '').toLowerCase())) return false;
  if (f.source && f.source.size && !f.source.has((r.source || '').toLowerCase())) return false;
  if (f.difficulty && f.difficulty.size && !f.difficulty.has((r.difficulty || '').toLowerCase())) return false;
  if (f.prep && prepBucket(r) !== f.prep) return false;
  if (f.diet.size) {
    const tags = getDietTags(r);
    if (![...f.diet].every(d => tags.includes(d))) return false;
  }
  if (f.gutFriendly && !gutProfile(r.ingredients)?.isGutFriendly) return false;
  if (f.budgetOnly && !isBudgetFriendly(r)) return false;
  if (f.maxSpend != null && perServingCost(r) > f.maxSpend) return false;
  if (f.highProteinEasy && !isBoyDinner(r)) return false;
  return true;
}
