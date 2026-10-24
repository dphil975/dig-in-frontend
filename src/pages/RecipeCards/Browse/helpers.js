/* Browse page helpers — pure constants and functions pulled out of
   RecipeCards/Browse/index.jsx so the main file stays focused on the
   React component tree. No JSX, no component state. */

import { resolveRegion } from '../../../lib/regions';

export const MEAL_KEYS = ['breakfast', 'lunch', 'dinner', 'snacks', 'desserts'];

export const MEALS = [
  { key: 'breakfast', label: 'Breakfast', emoji: 'BREAKFAST' },
  { key: 'lunch',     label: 'Lunch',     emoji: 'LUNCH' },
  { key: 'snacks',    label: 'Snacks',    emoji: 'SNACKS' },
  { key: 'dinner',    label: 'Dinner',    emoji: 'DINNER' },
  { key: 'desserts',  label: 'Dessert',   emoji: 'DESSERT' },
];

export function normalizeRecipeFile(raw) {
  const nested = Object.values(raw)[0];
  return (nested && typeof nested === 'object' && !Array.isArray(nested) && MEAL_KEYS.some(k => k in nested))
    ? nested
    : raw;
}

export const EMOJI_MAP = {
  pasta: 'PASTA', soup: 'SOUP', stew: 'STEW', rice: 'RICE', bread: 'BREAD',
  cake: 'CAKE', cookie: 'COOKIE', pie: 'PIE', salad: 'SALAD',
  chicken: 'CHICKEN', beef: 'BEEF', fish: 'FISH', shrimp: 'SHRIMP',
  curry: 'CURRY', noodle: 'NOODLE', ramen: 'RAMEN', taco: 'TACO',
  burger: 'BURGER', sandwich: 'SANDWICH', default: 'DEFAULT'
};

export const FLAVOR_DRINK = {
  spicy:  ['cooling','refreshing','milk-based','fruity','sweet'],
  sweet:  ['bitter','coffee','tea','light','floral'],
  savory: ['acidic','sparkling','light','citrus'],
  rich:   ['acidic','sparkling','bitter','coffee'],
  light:  ['floral','tea','citrus','sparkling'],
  earthy: ['coffee','roasted','tea','spiced'],
  smoky:  ['bold','roasted','malty'],
  tangy:  ['sweet','fruity','sparkling'],
};

export const STAGE_LABELS = ['PREP', 'BUILDING', 'COOKING', 'FINISHING', 'PLATING'];

// Tag every recipe with its file's country + region, and keep meal buckets
// separate (snacks ≠ desserts). Region is resolved to one of 8 canonical ids.
export function tagAndMerge(fileObjects) {
  const merged = { breakfast: [], lunch: [], dinner: [], snacks: [], desserts: [] };
  for (const top of fileObjects) {
    if (!top) continue;
    const country = top.country || '';
    const region  = top.region  || '';
    const _region = resolveRegion(country, region);
    const tag = (arr, bucket) =>
      (arr || []).forEach(r => merged[bucket].push({ ...r, country, region, _region }));
    tag(top.breakfast, 'breakfast');
    tag(top.lunch,     'lunch');
    tag(top.dinner,    'dinner');
    tag(top.snacks,    'snacks');
    tag(top.desserts,  'desserts');
  }
  return merged;
}

export function hasRecipes(d) {
  return d && MEAL_KEYS.some(k => (d[k] || []).length > 0);
}

export function getEmoji(recipe) {
  const text = ((recipe.name || '') + ' ' + (recipe.cuisine || '')).toLowerCase();
  for (const [k, v] of Object.entries(EMOJI_MAP)) {
    if (k !== 'default' && text.includes(k)) return v;
  }
  return EMOJI_MAP.default;
}

// Scores a drink against a recipe using every signal the menu data actually
// carries — not just a flavor-tag/description keyword match. `pairsWith`
// (cuisines/mealTypes/flavorContrast/mood) sits on every drink in
// cafe-menu.json and `pairingRules.cuisineTodrinkStyle` sits at the
// top of that same file; both used to be dead data. Wiring them in is what
// makes this "know what flavors pair well together" instead of "know one
// coffee shop's tag list."
export function scoreDrink(drink, recipe, flavors, seed, pairingRules) {
  const tags = (drink.pairingTags || drink.flavorProfile || []).map(t => t.toLowerCase());
  const desc = (drink.description || '').toLowerCase();
  const pairsWith = drink.pairsWith || {};
  const cuisine = (recipe?.country || recipe?.cuisine || '').toLowerCase();
  let score = 0;

  // Broad flavor-category match (spicy → cooling/refreshing drinks, etc.)
  flavors.forEach(f => {
    (FLAVOR_DRINK[f] || []).forEach(t => { if (tags.includes(t) || desc.includes(t)) score += 2; });
  });

  // This drink explicitly lists the recipe's cuisine as a pairing
  if (cuisine && (pairsWith.cuisines || []).map(c => c.toLowerCase()).includes(cuisine)) score += 4;

  // The recipe's cuisine calls for this drink's style (coffee/tea/matcha/...)
  const styleMatches = pairingRules?.cuisineTodrinkStyle?.[cuisine] || [];
  if (styleMatches.some(s => (drink.categories || []).includes(s))) score += 3;

  // This drink is designed to cut through a flavor quality the recipe has
  (pairsWith.flavorContrast || []).forEach(c => { if (flavors.includes(c)) score += 2; });

  score += (seed * 7 + (drink.name.charCodeAt(0) || 0)) % 5 * 0.1;
  return score;
}

export function generateDrinkSteps(drink) {
  const name = drink.name.toLowerCase();
  const isIced = drink.temperature === 'cold' || name.includes('iced') || name.includes('cold');
  const isEspresso = name.includes('espresso') || name.includes('americano') || name.includes('latte') || name.includes('cappuccino');
  const isTea = name.includes('tea') || name.includes('matcha') || name.includes('chai');
  const isJuice = name.includes('juice') || name.includes('smoothie');
  const isChocolate = name.includes('chocolate') || name.includes('mocha') || name.includes('cocoa');
  if (isEspresso && !isIced) return ['Pull a fresh espresso shot, about 25–30 seconds.', 'Steam milk to 65°C with silky microfoam.', `Combine in the correct ratio for a ${drink.name}.`, 'Serve immediately while hot.'];
  if (isEspresso && isIced) return ['Pull 1–2 espresso shots and cool for 1 minute.', 'Fill a glass with ice.', 'Pour espresso over ice.', name.includes('latte') ? 'Add cold milk to taste.' : 'Add cold water or milk and serve.'];
  if (isTea) return ['Heat water to the correct temperature.', `Steep ${drink.name} for 2–4 minutes.`, isIced ? 'Pour over ice and sweeten if desired.' : 'Remove tea and serve hot.'];
  if (isJuice) return ['Gather and wash ingredients.', 'Juice or blend until smooth.', 'Strain if desired, pour over ice.', 'Serve immediately.'];
  if (isChocolate) return ['Heat milk until steaming.', 'Whisk in cocoa powder or melted chocolate.', 'Sweeten to taste.', 'Top with whipped cream and serve.'];
  return [`Prepare all ingredients for ${drink.name}.`, 'Combine in the correct proportions.', 'Stir or shake gently.', 'Serve at the appropriate temperature.'];
}
