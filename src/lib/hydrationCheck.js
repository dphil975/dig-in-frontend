/* hydrationCheck.js — "this meal will make you thirsty, and here's the
   actual reason" — ingredient-driven cues keyed to real mechanisms. */

import { DISCLAIMER } from './hydrationDIY';

// Local null-safe helpers (used across the Health & Safety sibling files;
// each file keeps its own copy to stay self-contained and avoid circular
// imports between siblings).
function ingredientText(ing) {
  return typeof ing === 'object' && ing !== null ? (ing.text || ing.name || '') : (ing || '');
}

function textOf(ingredients) {
  return (ingredients || []).map(ingredientText).join(' ').toLowerCase();
}

/* hydrationCheck.js — "this meal will make you thirsty, and here's the actual
   reason why."

   hydrationDIY.js already held real electrolyte science, but it lived alone in
   Kitchen Skills: you had to go looking for it. Nothing ever connected it to
   the food you were about to cook. This does — it reads a recipe's own
   ingredient list and names the real mechanisms in it.

   EVERY DRIVER BELOW IS A GENUINE, CITED-IN-PLAIN-LANGUAGE MECHANISM. Two
   deliberate choices keep this from drifting into wellness noise:

   1. Fiber is the honest centerpiece. Soluble fiber (psyllium, chia, oats,
      beans) works BY absorbing water and forming a gel — so a big fiber load
      without enough fluid can genuinely do the opposite of what you wanted.
      That is a real, mechanical "you need water for this to work," not a
      vibe. It's also the least-known one, which makes it the most worth
      saying.

   2. Caffeine is deliberately DE-escalated. Its diuretic reputation is
      bigger than its effect — for habitual drinkers a coffee still nets you
      fluid. Saying so costs us a scary-sounding warning and buys the whole
      feature its credibility. An app that cries wolf about coffee doesn't
      get believed about fiber.

   No numbers are invented. There is no "drink 3.2 cups" output, because the
   real answer depends on body size, heat, and activity, and a fabricated
   precise number would be worse than an honest qualitative one.

   NOTE: DISCLAIMER referenced below is hydrationDIY.js's export, defined
   just above in this same file (originally imported from './hydrationDIY';
   now a same-module reference — see file header). */

/* Keyword → mechanism. Ordered by how much a cook actually needs to hear it.
   Matching is substring-on-the-ingredient-line, same approach as the app's
   other real keyword classifiers (freshness.js, pantryCategories.js). */
const DRIVERS = [
  {
    id: 'fiber',
    label: 'A real fiber load',
    why: 'Soluble fiber works by absorbing water and forming a gel — that\'s the mechanism, not a side effect. Eat a big fiber load without drinking alongside it and you can get the opposite of what you were going for. This is the one that genuinely needs the water to work.',
    advice: 'Drink a full glass with the meal, and keep water nearby for the next few hours.',
    kw: ['psyllium', 'chia', 'flaxseed', 'flax seed', 'ground flax', 'bran', 'oat bran',
      'black bean', 'kidney bean', 'pinto bean', 'chickpea', 'garbanzo', 'lentil', 'split pea',
      'navy bean', 'cannellini', 'rolled oats', 'steel cut oat', 'whole wheat', 'barley', 'farro'],
  },
  {
    id: 'sodium',
    label: 'Salty by design',
    why: 'Sodium draws water into your bloodstream, and your kidneys need water to clear what\'s extra. The thirst after a salty meal is a real signal doing a real job — it isn\'t you being dramatic.',
    advice: 'Water with dinner, and expect to want more later tonight.',
    kw: ['soy sauce', 'tamari', 'fish sauce', 'oyster sauce', 'miso', 'bouillon', 'stock cube',
      'anchovy', 'capers', 'olives', 'brine', 'pickle', 'kimchi', 'sauerkraut', 'bacon',
      'pancetta', 'prosciutto', 'salami', 'pepperoni', 'ham', 'cured', 'parmesan', 'pecorino',
      'feta', 'halloumi', 'salted', 'kosher salt', 'sea salt', 'soy'],
  },
  {
    id: 'capsaicin',
    label: 'Actual heat',
    why: 'Capsaicin triggers real thermoregulatory sweating — your body cools itself as though it were genuinely hot. The sweat is real, so the fluid you lose to it is too.',
    advice: 'Keep a glass going through the meal. Something with a little salt or sugar in it works better than plain ice water.',
    kw: ['chili', 'chilli', 'chile', 'jalapeno', 'jalapeño', 'serrano', 'habanero', 'ghost pepper',
      'cayenne', 'sriracha', 'gochujang', 'gochugaru', 'harissa', 'hot sauce', 'red pepper flake',
      'chipotle', 'scotch bonnet', 'sambal', 'peri peri'],
  },
  {
    id: 'alcohol',
    label: 'Alcohol in the pan or the glass',
    why: 'Alcohol suppresses vasopressin — the hormone that tells your kidneys to hold onto water. That\'s a real, mechanical diuretic effect, and it\'s the actual reason a hangover feels like drought.',
    advice: 'Alternate with water as you go. Cooked-off wine in a sauce is negligible; a glass alongside is not.',
    kw: ['wine', 'red wine', 'white wine', 'beer', 'vodka', 'rum', 'bourbon', 'whiskey', 'whisky',
      'tequila', 'brandy', 'sherry', 'vermouth', 'sake', 'mirin', 'liqueur', 'cognac'],
  },
  {
    id: 'protein',
    label: 'A big protein load',
    why: 'Clearing the nitrogen from a lot of protein takes water. Real, but modest — worth a glass with dinner, not worth worrying about.',
    advice: 'A glass with the meal covers it.',
    kw: ['protein powder', 'whey', 'casein', 'ribeye', 'sirloin', 'brisket', 'pork shoulder',
      'whole chicken', 'ground beef', 'steak'],
  },
  {
    id: 'caffeine',
    label: 'Caffeine (a smaller deal than you\'ve heard)',
    why: 'Mildly diuretic, but the effect is well short of its reputation — for a habitual drinker, a coffee still leaves you net ahead on fluid. Worth knowing, not worth worrying about.',
    advice: 'No action needed. Just don\'t count on it instead of water in the heat.',
    kw: ['espresso', 'coffee', 'cold brew', 'matcha', 'black tea', 'green tea', 'yerba mate'],
  },
];

function linesOf(recipe) {
  if (Array.isArray(recipe)) return recipe.map(String);
  const ings = recipe?.ingredients || [];
  return ings.map(i => (typeof i === 'string' ? i : (i?.name || i?.item || i?.ingredient || '')));
}

/**
 * Real hydration read on a recipe, from its own ingredient list.
 *
 * @returns {{drivers: Array, level: 'none'|'mild'|'notable', headline: string|null, disclaimer: string}}
 *   `drivers` carries which ingredient lines actually matched, so the UI can
 *   show its work ("soy sauce, miso") rather than assert a conclusion.
 *   Returns level 'none' with an empty list when nothing genuinely matches —
 *   silence is the correct output for a plain bowl of pasta, and a feature
 *   that fires on everything teaches people to ignore it.
 */
export function hydrationFor(recipe) {
  const lines = linesOf(recipe).filter(Boolean);
  const lower = lines.map(l => l.toLowerCase());

  const drivers = [];
  for (const d of DRIVERS) {
    const matched = [];
    lines.forEach((line, i) => {
      if (d.kw.some(k => lower[i].includes(k))) matched.push(line.trim());
    });
    if (matched.length) drivers.push({ ...d, matched, kw: undefined });
  }

  // "Notable" means either a driver that genuinely needs water to work
  // (fiber), or enough separate mechanisms stacking that thirst is a real
  // prediction rather than a guess. Caffeine alone never escalates — see the
  // header's second design note.
  const ids = new Set(drivers.map(d => d.id));
  const serious = drivers.filter(d => d.id !== 'caffeine' && d.id !== 'protein');
  const level = (ids.has('fiber') || serious.length >= 2) ? 'notable'
    : drivers.length ? 'mild'
    : 'none';

  let headline = null;
  if (level === 'notable') {
    headline = ids.has('fiber')
      ? 'This one actually needs the water to work.'
      : 'This is going to make you thirsty, and here\'s why.';
  } else if (level === 'mild') {
    headline = 'One thing worth a glass of water.';
  }

  return { drivers, level, headline, disclaimer: DISCLAIMER };
}

/** One-line version for a compact surface (a recipe card, a run summary). */
export function hydrationLine(recipe) {
  const { drivers, level } = hydrationFor(recipe);
  if (level === 'none') return null;
  const names = drivers.map(d => d.label.toLowerCase());
  const list = names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `Keep water close — ${list}.`;
}
