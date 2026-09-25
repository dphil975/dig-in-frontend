/* buildBar.js — the salad/pizza/pasta bar experience: watch each ingredient
   get added and see the real nutrition total update as you go, the same way
   watching a salad bar line assemble your bowl in front of you shows you
   exactly what's going in. Three "stations," each built from real per-
   ingredient macro data in nutritionFacts.js — nothing here is decorative,
   every add changes the totals panel for real. */

import {
  sumMacros,
  SALAD_BASES, SALAD_PROTEINS, SALAD_TOPPINGS, SALAD_CRUNCH, SALAD_DRESSINGS,
  PIZZA_CRUSTS, PIZZA_SAUCES, PIZZA_CHEESES, PIZZA_TOPPINGS,
  PASTA_BASES, PASTA_SAUCES, PASTA_PROTEINS, PASTA_MIXINS,
} from './nutritionFacts';
import { ingredientText } from '../components/recipe/RecipeBoostSections';

export const STATIONS = {
  salad: {
    id: 'salad', label: 'Salad Bar', emoji: '🥗',
    vessel: 'bowl',
    slots: [
      { key: 'base',     label: 'Base (pick 1)',    options: SALAD_BASES,     multi: false, required: true },
      { key: 'protein',  label: 'Protein',          options: SALAD_PROTEINS, multi: false },
      { key: 'toppings', label: 'Toppings',         options: SALAD_TOPPINGS, multi: true },
      { key: 'crunch',   label: 'Crunch',           options: SALAD_CRUNCH,   multi: true },
      { key: 'dressing', label: 'Dressing (pick 1)', options: SALAD_DRESSINGS, multi: false },
    ],
  },
  pizza: {
    id: 'pizza', label: 'Pizza Bar', emoji: '🍕',
    vessel: 'crust',
    slots: [
      { key: 'base',     label: 'Crust (pick 1)', options: PIZZA_CRUSTS,   multi: false, required: true },
      { key: 'sauce',    label: 'Sauce (pick 1)', options: PIZZA_SAUCES,   multi: false },
      { key: 'cheese',   label: 'Cheese (pick 1)', options: PIZZA_CHEESES, multi: false },
      { key: 'toppings', label: 'Toppings',        options: PIZZA_TOPPINGS, multi: true },
    ],
  },
  pasta: {
    id: 'pasta', label: 'Pasta Bar', emoji: '🍝',
    vessel: 'plate',
    slots: [
      { key: 'base',    label: 'Noodle (pick 1)', options: PASTA_BASES,    multi: false, required: true },
      { key: 'sauce',   label: 'Sauce (pick 1)',  options: PASTA_SAUCES,   multi: false },
      { key: 'protein', label: 'Protein',         options: PASTA_PROTEINS, multi: false },
      { key: 'mixins',  label: 'Mix-ins',         options: PASTA_MIXINS,   multi: true },
    ],
  },
};

/* ── Quick picks — predetermined builds, made of the exact same ingredient
   ids as the free-build palette, so a quick pick's totals are computed the
   identical way a custom build's are (no separate "hardcoded calories"
   fudge for the presets). Fully editable after loading. ── */
export const QUICK_PICKS = {
  salad: [
    { id: 'greek', name: 'Classic Greek', picks: { base: 'spring-mix', protein: 'chickpeas', toppings: ['cherry-tomatoes', 'cucumber', 'red-onion', 'black-olives-salad'], crunch: [], dressing: 'olive-oil-lemon' } },
    { id: 'southwest', name: 'Southwest Chicken', picks: { base: 'romaine', protein: 'grilled-chicken', toppings: ['corn', 'black-beans', 'bell-pepper'], crunch: ['tortilla-strips'], dressing: 'greek-yogurt-ranch' } },
    { id: 'mediterranean', name: 'Mediterranean Chickpea', picks: { base: 'spinach', protein: 'chickpeas', toppings: ['cucumber', 'cherry-tomatoes', 'red-onion'], crunch: [], dressing: 'olive-oil-lemon' } },
    { id: 'salmon-power', name: 'Salmon Power Bowl', picks: { base: 'kale', protein: 'grilled-salmon', toppings: ['avocado', 'roasted-sweet-potato'], crunch: ['sliced-almonds'], dressing: 'balsamic-vinaigrette' } },
  ],
  pizza: [
    { id: 'margherita', name: 'Margherita, Lightened', picks: { base: 'whole-wheat-crust', sauce: 'marinara-pizza', cheese: 'mozzarella-part-skim', toppings: ['basil-pizza'] } },
    { id: 'veggie-supreme', name: 'Veggie Supreme', picks: { base: 'cauliflower-crust', sauce: 'marinara-pizza', cheese: 'mozzarella-part-skim', toppings: ['mushroom-pizza', 'bell-pepper-pizza', 'red-onion-pizza', 'spinach-pizza'] } },
    { id: 'bbq-chicken', name: 'BBQ Chicken', picks: { base: 'whole-wheat-crust', sauce: 'bbq-pizza', cheese: 'mozzarella-part-skim', toppings: ['grilled-chicken-pizza', 'red-onion-pizza'] } },
    { id: 'high-protein', name: 'High-Protein Chickpea Crust', picks: { base: 'chickpea-crust', sauce: 'pesto-pizza', cheese: 'feta-pizza', toppings: ['basil-pizza'] } },
  ],
  pasta: [
    { id: 'classic-marinara', name: 'Classic Marinara', picks: { base: 'whole-wheat-pasta', sauce: 'marinara-pasta', protein: null, mixins: ['cherry-tomatoes-pasta', 'garlic-pasta'] } },
    { id: 'protein-pesto', name: 'Protein Pesto', picks: { base: 'chickpea-pasta', sauce: 'pesto-pasta', protein: 'grilled-chicken-pasta', mixins: ['parmesan'] } },
    { id: 'lightened-alfredo', name: 'Lightened Alfredo', picks: { base: 'zucchini-noodles', sauce: 'alfredo', protein: 'shrimp-pasta', mixins: ['parmesan'] } },
    { id: 'lentil-bolognese', name: 'Lentil Pasta & Meatballs', picks: { base: 'lentil-pasta', sauce: 'marinara-pasta', protein: 'meatballs', mixins: ['parmesan'] } },
  ],
};

function findIngredient(station, slotKey, id) {
  const slot = STATIONS[station].slots.find((s) => s.key === slotKey);
  return slot?.options.find((o) => o.id === id) || null;
}

/** Picks state shape: { [slotKey]: id | id[] }. Converts a quick pick's
 * `picks` object (which may hold nulls/empty arrays for unused slots) into
 * clean picks state. */
export function loadQuickPick(station, quickPickId) {
  const qp = QUICK_PICKS[station]?.find((q) => q.id === quickPickId);
  if (!qp) return {};
  const out = {};
  for (const [slotKey, val] of Object.entries(qp.picks)) {
    if (val == null) continue;
    if (Array.isArray(val)) { if (val.length) out[slotKey] = [...val]; }
    else out[slotKey] = val;
  }
  return out;
}

export function setSinglePick(picks, slotKey, id) {
  const next = { ...picks };
  if (next[slotKey] === id) delete next[slotKey]; // tap again to remove
  else next[slotKey] = id;
  return next;
}

export function toggleMultiPick(picks, slotKey, id) {
  const current = picks[slotKey] || [];
  const has = current.includes(id);
  const nextList = has ? current.filter((x) => x !== id) : [...current, id];
  const next = { ...picks };
  if (nextList.length) next[slotKey] = nextList; else delete next[slotKey];
  return next;
}

/** Ordered list of picked ingredient objects (each tagged with its slotKey)
 * — order roughly follows slot order, which is what drives the visual
 * "drop into the bowl" order too. */
export function pickedItems(station, picks) {
  const out = [];
  for (const slot of STATIONS[station].slots) {
    const val = picks[slot.key];
    if (!val) continue;
    const ids = slot.multi ? val : [val];
    for (const id of ids) {
      const item = findIngredient(station, slot.key, id);
      if (item) out.push({ ...item, slotKey: slot.key });
    }
  }
  return out;
}

export function buildTotals(station, picks) {
  return sumMacros(pickedItems(station, picks));
}

// ── Contextual launcher — "Build something like this →" on RecipeFull.
// Fuzzy-matches the viewed recipe's real ingredient lines against each
// station's own option lists (nutritionFacts.js) and pre-fills whichever
// station it resembles most, so BuildBar opens already seeded instead of
// starting from a blank palette. No new ingredient data — just a mapper
// over what STATIONS already has. ───────────────────────────────────────
function normalizeLabel(label = '') {
  return label.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
}

function labelMatchesText(label, text) {
  const norm = normalizeLabel(label);
  if (!norm) return false;
  if (text.includes(norm)) return true;
  return norm.split(/\s+/).some(word => word.length > 3 && text.includes(word));
}

/** Given a real recipe (any shape with an `ingredients` array), guess which
 * station it resembles and pre-fill picks for it. Returns null when no
 * station gets a confident enough match (fewer than 2 slots hit) — better
 * to open BuildBar blank than to seed a wrong-feeling guess. */
export function matchRecipeToBuildBar(recipe) {
  const text = (recipe?.ingredients || []).map(ingredientText).filter(Boolean).join(' | ').toLowerCase();
  if (!text.trim()) return null;

  let best = null;
  for (const stationId of Object.keys(STATIONS)) {
    const station = STATIONS[stationId];
    const picks = {};
    let score = 0;
    for (const slot of station.slots) {
      const hits = slot.options.filter(opt => labelMatchesText(opt.label, text));
      if (!hits.length) continue;
      score += hits.length;
      picks[slot.key] = slot.multi ? hits.map(h => h.id) : hits[0].id;
    }
    if (!picks.base) continue; // a build isn't real without its required base slot filled
    if (!best || score > best.score) best = { station: stationId, picks, score };
  }
  if (!best || best.score < 2) return null;

  return {
    station: best.station,
    picks: best.picks,
    name: recipe?.name ? `${recipe.name}-Style` : '',
  };
}

/** Turn a finished build into the same recipe-object shape recipeAlchemist's
 * recreateDish() produces, so it saves/displays through the exact same
 * saved-recipe + boards infrastructure as every other recipe in the app —
 * no parallel "built items" storage needed. */
export function buildToRecipe(station, picks, name, id) {
  const items = pickedItems(station, picks);
  const stationMeta = STATIONS[station];
  const ingredients = items.map((i) => `${i.unit} ${i.label}`);
  const totals = sumMacros(items);
  const title = (name || '').trim() || `Custom ${stationMeta.label.replace(' Bar', '')}`;
  return {
    id: id || `build-${station}-${Date.now().toString(36)}`,
    name: title,
    format: 'build-bar',
    formatLabel: stationMeta.label,
    emoji: stationMeta.emoji,
    cuisine: 'build-bar',
    difficulty: 'Easy',
    time: 10, totalTime: 10, servings: 1,
    summary: `Built ingredient-by-ingredient in the ${stationMeta.label}.`,
    description: `Built ingredient-by-ingredient in the ${stationMeta.label}: ${ingredients.join(', ')}.`,
    ingredients,
    instructions: [`Assemble in this order: ${ingredients.join(' → ')}.`],
    nutrition: totals,
    _builtInBuildBar: true,
  };
}
