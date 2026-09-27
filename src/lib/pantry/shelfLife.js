/* shelfLife.js — how long a pantry item has left, and what's worth using up.

   Split out of freshness.js so the Nova home page can ask "what's about to turn?"
   without loading the recipe-boost components, the price engine and the fusion
   engine that the scanned-item half of freshness.js needs. freshness.js
   re-exports everything here, so old imports still work. */

/* freshness — estimate how long a pantry item has left.

   Pantry items only carry { name, location, at/boughtAt } — there's no real
   expiry date anywhere in the app. So this is an HONEST heuristic, not a feed:
   we classify the item by keyword into a food category, look up a typical shelf
   life for where it's stored (fridge / pantry / freezer), and subtract how long
   it's been sitting. Good enough to say "the spinach is about to turn" and nudge
   the cook toward using it up — which is all Bridge 3 needs. */

// Ordered most-perishable / most-specific first — first keyword hit wins, so a
// "carrot" lands in roots (long life) before the broad produce bucket.
const CATEGORIES = [
  { cat: 'leafy',   label: 'greens',  life: { fridge: 5,  pantry: 2,   freezer: 60 },
    kw: ['lettuce', 'spinach', 'arugula', 'kale', 'basil', 'cilantro', 'parsley', 'mint', 'herb', 'salad', 'greens', 'sprout', 'chard', 'romaine'] },
  { cat: 'berries', label: 'berries', life: { fridge: 5,  pantry: 2,   freezer: 180 },
    kw: ['berry', 'berries', 'strawberr', 'raspberr', 'blueberr', 'blackberr'] },
  { cat: 'seafood', label: 'seafood', life: { fridge: 2,  pantry: 0.5, freezer: 120 },
    kw: ['fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'cod', 'tilapia', 'crab', 'lobster', 'scallop', 'clam', 'mussel', 'seafood'] },
  { cat: 'meat',    label: 'meat',    life: { fridge: 3,  pantry: 0.5, freezer: 180 },
    kw: ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'sausage', 'bacon', 'ham', 'steak', 'ground', 'mince', 'meat', 'chop'] },
  { cat: 'leftover',label: 'leftovers',life:{ fridge: 4,  pantry: 0.5, freezer: 60 },
    kw: ['leftover', 'tofu', 'hummus', 'dip', 'salsa', 'guacamole', 'cooked'] },
  { cat: 'dairy',   label: 'dairy',   life: { fridge: 10, pantry: 1,   freezer: 90 },
    kw: ['milk', 'cream', 'yogurt', 'yoghurt', 'cheese', 'butter', 'cottage', 'ricotta'] },
  { cat: 'eggs',    label: 'eggs',    life: { fridge: 24, pantry: 5,   freezer: 120 },
    kw: ['egg'] },
  { cat: 'bread',   label: 'bread',   life: { fridge: 14, pantry: 5,   freezer: 90 },
    kw: ['bread', 'bun', 'bagel', 'tortilla', 'roll', 'pita', 'naan', 'muffin', 'croissant', 'wrap'] },
  { cat: 'roots',   label: 'produce', life: { fridge: 30, pantry: 21,  freezer: 240 },
    kw: ['potato', 'onion', 'garlic', 'ginger', 'beet', 'turnip', 'radish', 'yam', 'carrot'] },
  { cat: 'produce', label: 'produce', life: { fridge: 10, pantry: 6,   freezer: 240 },
    kw: ['tomato', 'pepper', 'cucumber', 'zucchini', 'broccoli', 'cauliflower', 'mushroom', 'avocado',
         'apple', 'banana', 'grape', 'peach', 'pear', 'plum', 'mango', 'melon', 'lemon', 'lime', 'orange',
         'celery', 'corn', 'asparagus', 'eggplant', 'squash', 'fruit', 'veg', 'cabbage', 'peas', 'green bean'] },
  { cat: 'dry',     label: 'staple',  life: { fridge: 120, pantry: 365, freezer: 365 },
    kw: ['rice', 'pasta', 'flour', 'sugar', 'oil', 'vinegar', 'sauce', 'can', 'bean', 'lentil', 'oat',
         'cereal', 'spice', 'salt', 'honey', 'peanut', 'nut', 'cracker', 'chip', 'coffee', 'tea', 'dried', 'jar'] },
];

const DEFAULT_CAT = { cat: 'other', label: 'item', life: { fridge: 12, pantry: 30, freezer: 120 } };

export function categorize(name) {
  const n = String(name || '').toLowerCase();
  for (const c of CATEGORIES) {
    if (c.kw.some(k => n.includes(k))) return c;
  }
  return DEFAULT_CAT;
}

export function estimateShelfLife(name, location = 'pantry') {
  const c = categorize(name);
  return c.life[location] ?? c.life.pantry;
}

const DAY_MS = 86400000;

/** Freshness snapshot for one item. status: fresh | soon | urgent | expired. */
export function freshnessFor(item, now = new Date()) {
  const c = categorize(item?.name);
  const life = c.life[item?.location] ?? c.life.pantry;
  const boughtISO = item?.boughtAt || item?.at;
  const bought = boughtISO ? new Date(boughtISO) : now;
  const ageDays = Math.max(0, (now - bought) / DAY_MS);
  const daysLeft = Math.round(life - ageDays);
  let status;
  if (daysLeft < 0)       status = 'expired';
  else if (daysLeft <= 1) status = 'urgent';
  else if (daysLeft <= 3) status = 'soon';
  else                    status = 'fresh';
  return { daysLeft, status, life, category: c.cat, categoryLabel: c.label };
}

/** Short badge text for a daysLeft value. */
export function freshnessLabel(daysLeft) {
  if (daysLeft < 0)   return 'past best';
  if (daysLeft === 0) return 'use today';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
}

/**
 * Items worth using up: anything perishable at or under `withinDays` left
 * (expired included), soonest-first. Dry staples (365-day life) never qualify.
 * @returns array of { item, daysLeft, status, category, categoryLabel }
 */
export function expiringItems(pantry, { now = new Date(), withinDays = 3 } = {}) {
  return (pantry || [])
    .map(item => ({ item, ...freshnessFor(item, now) }))
    .filter(e => e.daysLeft <= withinDays)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}
