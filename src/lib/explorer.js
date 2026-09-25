/* explorer.js — the discovery engine behind the Explorer page (a Pinterest/
   Tumblr-style browse surface built on THIS app's real recipe corpus).

   Everything here is derived from real recipe data — cuisine from the recipe's
   own country/cuisine, diet/time/budget/effort from the existing structuredTags
   engine, mood from the real 8-flavor profile. A category is only ever offered
   if actual recipes match it (the same "never a dead category" rule discoverFeed
   already follows). No fabricated photos, creators, follower counts, or ratings
   live here — those are honestly out of scope for a corpus with none of them.

   The point of the whole thing (the founder's brief): DISCOVERY over repetition.
   So the ranker actively fights sameness — it demotes what you've already been
   shown, and every few tiles it injects something OFF your usual taste. */

import { recipeFlavors, loadFlavorProfile, FLAVORS } from './flavorProfile';
import { structuredTags } from './structuredTags';
import { getRating } from '../services/saveService';

/* ── recipe field helpers (recipes come from two shapes: API + static) ──── */
export const recipeCuisine = (r) => (r?.country || r?.cuisine || r?.cuisine_type || '').trim();
export const recipeMeal = (r) => (r?.mealType || r?.recipe_type || r?.meal || '').toLowerCase().trim();
export function recipeIngredientNames(r) {
  const list = Array.isArray(r?.ingredients) ? r.ingredients : [];
  return list.map((i) => (typeof i === 'object' ? (i.text || i.name || '') : String(i || ''))).filter(Boolean);
}
const recipeId = (r) => r?.id ?? r?.name;

/* ── The category taxonomy ───────────────────────────────────────────────
   Each group knows how to (a) read a recipe's value(s) for that axis and
   (b) present them. `values` returns the raw category keys a recipe belongs
   to; availableCategories() then keeps only the keys with real matches. */
export const CATEGORY_GROUPS = [
  {
    id: 'cuisine', label: 'Cuisine',
    values: (r) => { const c = recipeCuisine(r); return c ? [c] : []; },
    labelFor: (v) => v,
  },
  {
    id: 'meal', label: 'Meal',
    // Normalize the many meal spellings into a clean set.
    values: (r) => {
      const m = recipeMeal(r);
      if (!m) return [];
      const map = { breakfast: 'Breakfast', brunch: 'Brunch', lunch: 'Lunch', dinner: 'Dinner',
        snack: 'Snacks', snacks: 'Snacks', dessert: 'Desserts', desserts: 'Desserts',
        drink: 'Drinks', drinks: 'Drinks', appetizer: 'Appetizers', side: 'Sides', soup: 'Soups', salad: 'Salads' };
      return [map[m] || (m[0].toUpperCase() + m.slice(1))];
    },
    labelFor: (v) => v,
  },
  {
    id: 'diet', label: 'Diet',
    values: (r) => structuredTags(r).filter((t) => ['#vegan', '#vegetarian', '#dairyfree', '#pescatarian'].includes(t)),
    labelFor: (v) => ({ '#vegan': 'Vegan', '#vegetarian': 'Vegetarian', '#dairyfree': 'Dairy-free', '#pescatarian': 'Pescatarian' }[v] || v),
  },
  {
    id: 'time', label: 'Time',
    values: (r) => structuredTags(r).filter((t) => ['#15min', '#30min', '#slow'].includes(t)),
    labelFor: (v) => ({ '#15min': 'Under 15 min', '#30min': 'Under 30 min', '#slow': 'Weekend project' }[v] || v),
  },
  {
    id: 'budget', label: 'Budget',
    values: (r) => structuredTags(r).filter((t) => ['#under5', '#under10', '#fewingredients'].includes(t)),
    labelFor: (v) => ({ '#under5': 'Under $5', '#under10': 'Under $10', '#fewingredients': 'Few ingredients' }[v] || v),
  },
  {
    id: 'method', label: 'Method',
    values: (r) => structuredTags(r).filter((t) => ['#onepan', '#nocook', '#nokitchen'].includes(t)),
    labelFor: (v) => ({ '#onepan': 'One-pan', '#nocook': 'No-cook', '#nokitchen': 'No kitchen' }[v] || v),
  },
  {
    id: 'mood', label: 'Mood & flavor',
    values: (r) => recipeFlavors(r),
    labelFor: (v) => v[0].toUpperCase() + v.slice(1),
  },
];

/** All categories that actually have matches in the given pool, grouped and
    ranked by frequency. Never returns a zero-match category. */
export function availableCategories(recipes, perGroup = 12) {
  const pool = recipes || [];
  return CATEGORY_GROUPS.map((g) => {
    const counts = new Map();
    for (const r of pool) for (const v of g.values(r)) counts.set(v, (counts.get(v) || 0) + 1);
    const cats = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, perGroup)
      .map(([value, count]) => ({ group: g.id, groupLabel: g.label, value, label: g.labelFor(value), count }));
    return { id: g.id, label: g.label, categories: cats };
  }).filter((grp) => grp.categories.length > 0);
}

/** Does a recipe belong to a chosen category? */
export function matchesExplorerCategory(recipe, cat) {
  if (!cat) return true;
  const g = CATEGORY_GROUPS.find((x) => x.id === cat.group);
  if (!g) return true;
  return g.values(recipe).includes(cat.value);
}

/* ── Anti-repeat: what this device has already been shown ─────────────────
   Persisted with timestamps so we can demote recently-seen recipes across
   sessions (the "why am I seeing the same 10 things every day" fix), pruned
   to 30 days so the store can't grow forever. */
const SEEN_KEY = 'dig_in_explorer_seen';
const SEEN_WINDOW_MS = 30 * 24 * 3600 * 1000;

export function loadSeen() {
  try {
    const v = JSON.parse(localStorage.getItem(SEEN_KEY)) || {};
    const now = Date.now();
    let changed = false;
    for (const k of Object.keys(v)) if (now - v[k] > SEEN_WINDOW_MS) { delete v[k]; changed = true; }
    if (changed) { try { localStorage.setItem(SEEN_KEY, JSON.stringify(v)); } catch { /* quota */ } }
    return v;
  } catch { return {}; }
}
export function markSeen(ids) {
  try {
    const v = JSON.parse(localStorage.getItem(SEEN_KEY)) || {};
    const now = Date.now();
    for (const id of ids) if (id != null) v[String(id)] = now;
    localStorage.setItem(SEEN_KEY, JSON.stringify(v));
  } catch { /* quota */ }
}
export function seenCount() { return Object.keys(loadSeen()).length; }

/* ── Ranking per tab ─────────────────────────────────────────────────────
   For You  — leans into your learned taste (flavorProfile).
   Surprise — deliberately the OPPOSITE: recipes whose flavors you rate lowest,
              plus cuisines you've barely seen. The discovery tab.
   Trending — your real star ratings + view counts ("by you", honestly).
   New      — freshest first (highest id / reverse), lightly shuffled.
   All tabs demote what you've been shown recently, and For You/Surprise splice
   in an off-taste "discovery" pick every few tiles so it never ossifies. */
function tasteScore(recipe, profile) {
  const fl = recipeFlavors(recipe);
  if (!fl.length) return 0;
  return fl.reduce((s, f) => s + (profile[f] || 0), 0) / fl.length;
}

function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function rankForTab(recipes, tab, { profile = null, hits = {}, seed = 1 } = {}) {
  const pool = [...(recipes || [])];
  const prof = profile || loadFlavorProfile();
  const seen = loadSeen();
  const now = Date.now();
  const seenPenalty = (r) => {
    const t = seen[String(recipeId(r))];
    if (!t) return 0;
    // Fully demoted right after being seen, fading back over ~10 days.
    const days = (now - t) / (24 * 3600 * 1000);
    return Math.max(0, 1 - days / 10);
  };

  let ranked;
  if (tab === 'trending') {
    ranked = pool.sort((a, b) => {
      const rd = getRating(recipeId(b)) - getRating(recipeId(a));
      if (rd !== 0) return rd;
      const hd = (hits[recipeId(b)] || 0) - (hits[recipeId(a)] || 0);
      if (hd !== 0) return hd;
      return seenPenalty(a) - seenPenalty(b);
    });
  } else if (tab === 'new') {
    ranked = seededShuffle(pool, seed).sort((a, b) => {
      const idd = (Number(b.id) || 0) - (Number(a.id) || 0);
      if (idd !== 0) return idd;
      return seenPenalty(a) - seenPenalty(b);
    });
  } else if (tab === 'surprise') {
    // Lowest-taste-fit first = the opposite of what you usually get.
    ranked = seededShuffle(pool, seed).sort((a, b) =>
      (tasteScore(a, prof) - tasteScore(b, prof)) || (seenPenalty(a) - seenPenalty(b)));
  } else {
    // For You: taste-fit desc, minus the seen penalty so today ≠ yesterday.
    ranked = seededShuffle(pool, seed).sort((a, b) =>
      (tasteScore(b, prof) - seenPenalty(b) * 2) - (tasteScore(a, prof) - seenPenalty(a) * 2));
  }

  // Discovery injection (For You / Surprise): every 4th slot, pull a recipe
  // from a cuisine that's under-represented so far, so the column keeps opening
  // doors instead of narrowing. Cheap + deterministic per seed.
  if (tab === 'foryou' || tab === 'surprise') {
    const byCuisineSeen = new Set();
    const out = [];
    const rest = [...ranked];
    while (rest.length) {
      if (out.length % 4 === 3) {
        const idx = rest.findIndex((r) => { const c = recipeCuisine(r); return c && !byCuisineSeen.has(c); });
        if (idx >= 0) { const [pick] = rest.splice(idx, 1); byCuisineSeen.add(recipeCuisine(pick)); out.push({ ...pick, _discovery: true }); continue; }
      }
      const next = rest.shift();
      const c = recipeCuisine(next); if (c) byCuisineSeen.add(c);
      out.push(next);
    }
    return out;
  }
  return ranked;
}

/* ── The "protein problem", honestly ─────────────────────────────────────
   The founder's point: "protein doesn't work if a lot of carbs follow." These
   recipes carry no macro numbers, so we DON'T fake grams. We read the
   ingredient list for protein / starch / vegetable presence and give an honest,
   qualitative balance read — the thing an eater actually needs to glance at. */
const PROTEIN_RX = /chicken|beef|pork|bacon|sausage|turkey|lamb|steak|fish|salmon|tuna|shrimp|prawn|cod|tofu|tempeh|seitan|egg|beans?|lentil|chickpea|edamame|yogurt|greek yogurt|cottage cheese|paneer|\bnuts?\b|peanut|almond|protein/i;
const STARCH_RX  = /rice|pasta|noodle|spaghetti|bread|\bbun\b|tortilla|potato|flour|dough|oats?|quinoa|couscous|cornmeal|cracker|cereal|bagel|naan|pita|gnocchi|polenta|\bwrap\b/i;
const VEG_RX     = /spinach|kale|broccoli|carrot|tomato|pepper|onion|garlic|zucchini|cucumber|lettuce|cabbage|mushroom|greens|celery|asparagus|cauliflower|pea\b|green bean|eggplant|squash|beet|radish|herb|cilantro|basil|arugula/i;

export function balanceRead(recipe) {
  const hay = recipeIngredientNames(recipe).join(' ').toLowerCase() + ' ' + (recipe?.name || '').toLowerCase();
  if (!hay.trim()) return null;
  const protein = PROTEIN_RX.test(hay);
  const starch = STARCH_RX.test(hay);
  const veg = VEG_RX.test(hay);
  if (protein && starch && veg) return { key: 'balanced', label: 'Balanced plate', note: 'Protein, carbs, and vegetables together — energy that also holds you.' };
  if (protein && starch)        return { key: 'add-veg', label: 'Protein + carbs', note: 'Solid fuel; a handful of vegetables rounds it into a full plate.' };
  if (starch && !protein)       return { key: 'carb', label: 'Carb-forward', note: 'Mostly carbs — add a protein so it actually keeps you full.' };
  if (protein && !starch)       return { key: 'protein', label: 'Protein-forward', note: 'Protein-led. A smart carb (rice, a grain) turns it into lasting energy.' };
  if (veg && !protein && !starch) return { key: 'light', label: 'Light & fresh', note: 'A lighter, vegetable-forward bite — pair it with a protein to make a meal.' };
  return null;
}

/* ── "Why you're seeing this" — the anti-black-box line ─────────────────── */
export function whySeeing(recipe, { tab, activeCat = null, profile = null } = {}) {
  if (recipe?._discovery) return "A door you haven't opened — a cuisine you rarely see.";
  if (activeCat) return `Because you're exploring ${activeCat.label}.`;
  if (tab === 'surprise') return 'In your Surprise tab — the opposite of your usual taste, on purpose.';
  if (tab === 'trending') return getRating(recipeId(recipe)) > 0 ? 'You rated this highly before.' : 'Rising in what people are cooking right now.';
  if (tab === 'new') return 'Fresh in the catalogue.';
  const prof = profile || loadFlavorProfile();
  const fl = recipeFlavors(recipe).filter((f) => (prof[f] || 0) > 0);
  if (fl.length) return `Because you lean ${fl.slice(0, 2).join(' & ')}.`;
  return 'A new direction to try.';
}

/** Deterministic tile size for masonry variety — some pins run tall so the
    column doesn't read as a uniform grid (Pinterest's visual rhythm). */
export function tileSpan(recipe) {
  const s = String(recipeId(recipe));
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
  return h % 3 === 0 ? 'tall' : '';
}

export { FLAVORS };
