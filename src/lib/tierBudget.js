/* Income-tier-aware brand & cost engine.

   The Food Map already knows a shopper's local income tier (budget / mid /
   premium) from the area they last browsed (localStorage 'dig_in_area' ->
   BOROUGHS income -> incomeTier). This turns that signal into something a cook
   can see on every recipe: the same dish, routed to the brands, stores and
   price point that fit their tier — plus what that plate would cost eaten out.

   Everyone gets the aspirational dish; the tier only picks the affordable path
   to it. Prices are realistic US-grocery ballparks (hand-seeded, not a live
   feed — same honesty caveat as storeData.js), used per-serving so the point
   is the comparison, not a to-the-cent quote. */

import { BOROUGHS, incomeTier } from '../data/storeData';

const TIER_OVERRIDE_KEY = 'dig_in_tier_override';
const AREA_KEY = 'dig_in_area';

export const TIERS = ['budget', 'mid', 'premium'];
export const TIER_NAME = { budget: 'Budget', mid: 'Everyday', premium: 'Premium' };

// The store/brand each tier is routed to, and a rough price multiplier applied
// to the baseline (mid) ingredient prices below.
const TIER_STORE = {
  budget:  { store: 'Aldi / Save-A-Lot / Walmart', mult: 0.78 },
  mid:     { store: 'Kroger / Giant / Food Lion',   mult: 1.0 },
  premium: { store: 'Whole Foods / specialty markets', mult: 1.45 },
};

// Ingredient -> staple bucket. Buckets carry a baseline (mid-tier) price for the
// amount a recipe realistically uses, plus a per-tier brand label. Matching is
// keyword-based since recipe ingredients are free text.
const BUCKETS = [
  { key: 'pasta',    re: /pasta|spaghetti|noodle|macaroni|penne|ramen|udon|linguine/, price: 1.60, brand: { budget: 'store-brand dry pasta', mid: 'Barilla', premium: 'De Cecco / fresh' } },
  { key: 'rice',     re: /rice|sushi rice|basmati|jasmine/, price: 1.40, brand: { budget: 'store-brand rice', mid: 'name-brand rice', premium: 'imported / specialty rice' } },
  { key: 'cheese',   re: /cheese|pecorino|parmes|parmigiano|mozzarella|cheddar|provolone|feta|cotija/, price: 4.20, brand: { budget: 'store-brand block', mid: 'Sargento / deli', premium: 'imported wheel / cheese counter' } },
  { key: 'chicken',  re: /chicken|poultry/, price: 5.50, brand: { budget: 'value pack thighs', mid: 'fresh breasts', premium: 'organic / air-chilled' } },
  { key: 'beef',     re: /beef|steak|ribeye|ground beef|brisket|chuck/, price: 8.50, brand: { budget: 'value ground / chuck', mid: 'choice cut', premium: 'grass-fed / dry-aged' } },
  { key: 'pork',     re: /pork|bacon|sausage|ham|prosciutto|pancetta|guanciale/, price: 5.00, brand: { budget: 'store-brand', mid: 'name-brand', premium: 'butcher / cured import' } },
  { key: 'seafood',  re: /fish|salmon|tuna|shrimp|seafood|cod|tilapia|crab|clam|oyster/, price: 7.00, brand: { budget: 'frozen fillets / canned', mid: 'fresh counter', premium: 'wild-caught / day-boat' } },
  { key: 'tofu',     re: /tofu|tempeh|seitan/, price: 2.20, brand: { budget: 'store-brand tofu', mid: 'name-brand', premium: 'organic / local' } },
  { key: 'eggs',     re: /\begg\b|eggs/, price: 2.50, brand: { budget: 'store-brand dozen', mid: 'grade-A large', premium: 'pasture-raised' } },
  { key: 'milk',     re: /milk|cream|half-and-half|buttermilk/, price: 2.00, brand: { budget: 'store-brand', mid: 'name-brand', premium: 'organic / local dairy' } },
  { key: 'butter',   re: /butter|ghee/, price: 2.60, brand: { budget: 'store-brand stick', mid: 'Land O’Lakes', premium: 'European cultured' } },
  { key: 'yogurt',   re: /yogurt|labneh|sour cream/, price: 1.80, brand: { budget: 'store-brand tub', mid: 'Chobani', premium: 'organic Greek' } },
  { key: 'produce',  re: /onion|garlic|ginger|tomato|pepper|lettuce|spinach|carrot|potato|cabbage|scallion|green onion|cilantro|lime|lemon|herb|basil|mushroom|zucchini|cucumber|celery|kale|broccoli|avocado|corn|pea/, price: 1.10, brand: { budget: 'loose / in-season', mid: 'fresh produce', premium: 'organic / farmers-market' } },
  { key: 'fruit',    re: /apple|banana|berry|berries|strawberr|mango|pineapple|peach|pear|grape|lychee|citrus/, price: 1.80, brand: { budget: 'in-season / frozen', mid: 'fresh', premium: 'organic / specialty' } },
  { key: 'beans',    re: /bean|lentil|chickpea|legume|edamame/, price: 1.10, brand: { budget: 'dried / store-brand can', mid: 'name-brand can', premium: 'organic / heirloom' } },
  { key: 'flour',    re: /flour|cornstarch|baking soda|baking powder|yeast|mochiko|semolina|panko|breadcrumb/, price: 0.90, brand: { budget: 'store-brand', mid: 'King Arthur', premium: 'organic / specialty flour' } },
  { key: 'sugar',    re: /sugar|honey|syrup|molasses|agave|powdered sugar/, price: 1.00, brand: { budget: 'store-brand', mid: 'name-brand', premium: 'raw / local honey' } },
  { key: 'oil',      re: /oil|olive oil|sesame oil|vegetable oil|shortening/, price: 1.30, brand: { budget: 'store-brand', mid: 'name-brand', premium: 'first-press / specialty oil' } },
  { key: 'sauce',    re: /soy sauce|fish sauce|vinegar|mirin|sauce|paste|gochujang|doubanjiang|miso|tahini|oyster sauce|hoisin|sriracha|ketchup|mustard|mayo|mayonnaise/, price: 1.20, brand: { budget: 'store-brand', mid: 'name-brand', premium: 'imported / artisan' } },
  { key: 'spice',    re: /salt|pepper|spice|cumin|paprika|cinnamon|nutmeg|chili|cayenne|turmeric|coriander|matcha|vanilla|sesame seed|peppercorn|bay leaf|oregano|thyme|cardamom|saffron|gochugaru/, price: 0.60, brand: { budget: 'store-brand', mid: 'McCormick', premium: 'whole / single-origin' } },
  { key: 'nuts',     re: /almond|cashew|walnut|pecan|peanut|hazelnut|pine nut|macadamia|nut\b/, price: 2.40, brand: { budget: 'store-brand', mid: 'name-brand', premium: 'raw / organic' } },
  { key: 'chocolate',re: /chocolate|cocoa|wafer|toffee|candy|marshmallow/, price: 2.20, brand: { budget: 'store-brand', mid: 'name-brand', premium: 'couverture / craft' } },
  { key: 'bread',    re: /bread|tortilla|nori|wrapper|bun|pita|naan|dough/, price: 1.80, brand: { budget: 'store-brand', mid: 'bakery aisle', premium: 'artisan / fresh-baked' } },
];

// Pantry staples most kitchens already have — flagged so we don't imply you
// must buy them again, and they count toward "you likely have this".
const LIKELY_ON_HAND = /salt|pepper|water|sugar|flour|oil|baking soda|baking powder|vanilla/;

// Restaurant per-serving comparison by dish kind. What you'd pay for the plate
// out (entree / dessert / etc.), so the home cost lands against something real.
const DINE_OUT = { dinner: 24, lunch: 16, breakfast: 13, dessert: 9, drink: 8, appetizer: 12, side: 7, snack: 6, default: 20 };

export function getUserTier() {
  try {
    const override = localStorage.getItem(TIER_OVERRIDE_KEY);
    if (override && TIERS.includes(override)) return override;
    const area = localStorage.getItem(AREA_KEY);
    const meta = BOROUGHS.find(b => b.id === area);
    const t = meta?.income != null ? incomeTier(meta.income) : null;
    return t || 'mid';
  } catch { return 'mid'; }
}

export function setUserTier(tier) {
  try {
    if (TIERS.includes(tier)) localStorage.setItem(TIER_OVERRIDE_KEY, tier);
  } catch {}
}

function bucketFor(ingredient) {
  const n = ingredient.toLowerCase();
  return BUCKETS.find(b => b.re.test(n)) || null;
}

function dineOutPer(recipe) {
  const kind = (recipe.recipe_type || recipe.mealType || recipe.type || '').toLowerCase();
  for (const key of Object.keys(DINE_OUT)) if (kind.includes(key)) return DINE_OUT[key];
  return DINE_OUT.default;
}

// Parse a serving count out of "12 pieces" / "2 servings" / 4 -> integer >= 1.
export function servingsOf(recipe) {
  const s = recipe.servings ?? recipe.serves ?? recipe.yield;
  if (typeof s === 'number' && s > 0) return Math.round(s);
  const m = String(s || '').match(/\d+/);
  return m ? Math.max(1, parseInt(m[0], 10)) : 4;
}

/**
 * Price a recipe for a tier.
 * @returns { tier, store, rows[], total, perServing, dineOutPer, dineOutTotal,
 *            savingsPer, onHandCount }
 * rows: { name, brand, price, onHand, bucket }
 */
export function priceRecipe(ingredients, recipe, tier) {
  const t = TIERS.includes(tier) ? tier : 'mid';
  const { store, mult } = TIER_STORE[t];
  const servings = servingsOf(recipe);
  let total = 0;
  let onHandCount = 0;
  const rows = ingredients.map(name => {
    const bucket = bucketFor(name);
    const onHand = LIKELY_ON_HAND.test(name.toLowerCase());
    const base = bucket ? bucket.price : 1.5; // unknown ingredient ballpark
    const price = +(base * mult).toFixed(2);
    const brand = bucket ? bucket.brand[t] : (t === 'budget' ? 'store-brand' : t === 'premium' ? 'specialty' : 'name-brand');
    if (onHand) onHandCount++;
    else total += price;
    return { name, brand, price, onHand, bucket: bucket?.key || null };
  });
  total = +total.toFixed(2);
  const perServing = +(total / servings).toFixed(2);
  const dop = dineOutPer(recipe);
  return {
    tier: t,
    store,
    rows,
    total,
    servings,
    perServing,
    dineOutPer: dop,
    dineOutTotal: dop * servings,
    savingsPer: Math.max(0, +(dop - perServing).toFixed(2)),
    onHandCount,
  };
}

/**
 * Price a raw ingredient list at a tier with no single recipe/servings
 * context — the "whole shopping list" cost, same bucket pricing and
 * on-hand-staple exclusion as priceRecipe(), just not tied to one dish.
 * Powers the Weekly Meal Plan's "buy once, cook more" summary — the
 * dynamic pricing scaler applied to a whole week's ingredients instead of
 * one recipe at a time.
 * @returns { tier, store, rows[], total, onHandCount }
 */
export function priceIngredientList(ingredients, tier) {
  const t = TIERS.includes(tier) ? tier : 'mid';
  const { store, mult } = TIER_STORE[t];
  let total = 0;
  let onHandCount = 0;
  const rows = ingredients.map(name => {
    const bucket = bucketFor(name);
    const onHand = LIKELY_ON_HAND.test(name.toLowerCase());
    const base = bucket ? bucket.price : 1.5;
    const price = +(base * mult).toFixed(2);
    const brand = bucket ? bucket.brand[t] : (t === 'budget' ? 'store-brand' : t === 'premium' ? 'specialty' : 'name-brand');
    if (onHand) onHandCount++;
    else total += price;
    return { name, brand, price, onHand, bucket: bucket?.key || null };
  });
  return { tier: t, store, rows, total: +total.toFixed(2), onHandCount };
}
