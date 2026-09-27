/* pantry/budgetTarget.js — consolidated Budget module.
   Merged from: budgetTarget.js + tierBudget.js + affordableProtein.js
   (src/lib/ flat directory -> src/lib/pantry/). All three old files
   re-export from this one so every existing import path keeps working.

   budgetTarget.js originally imported `priceRecipe`, `priceIngredientList`,
   and `getUserTier` from tierBudget.js — now that tierBudget's section lives
   in this same file, those calls are just local function references and the
   import statement is gone. No export-name conflicts among the three. */

import { BOROUGHS, incomeTier } from '../../data/storeData';

// ════════════════════════════════════════════════════════════════════════
// From budgetTarget.js
// ════════════════════════════════════════════════════════════════════════

/* budgetTarget.js — a price point you set, and the honest running answer to
   "where am I against it?"

   THE PROBLEM THIS IS FOR: money stops feeling real. You tap a card, a number
   moves somewhere you can't see, and inflation quietly rewrites what every
   number means. The app already knew two things separately — what a recipe
   SHOULD cost (tierBudget.priceRecipe) and what you ACTUALLY paid
   (storeMemory's price history + receipts) — and never put them in the same
   sentence. This does.

   THREE NUMBERS, KEPT DISTINCT ON PURPOSE:
   - `target`   what you decided to spend. Set in $5 increments, because a
                budget you have to think about in cents isn't one you'll keep.
   - `planned`  an ESTIMATE of the cart in front of you (tierBudget's bucket
                pricing). Always labeled an estimate. Recomputed live as
                ingredients change, which is the "the price updates when you
                swap something" behavior.
   - `spent`    real money, only ever from a real receipt or a real logged
                purchase. Never estimated, never inferred.

   Collapsing planned into spent would be the easy version and a lie — you'd
   see a confident number that never matched your bank. They stay separate,
   and `projected` (spent + planned) is clearly derived from both.

   MAKING IT CONCRETE: `mealsLeft()` translates money back into the thing it
   buys. "$23 left" is abstract; "about 3 more dinners" is not. That
   translation only runs off YOUR real logged history — no history, no claim. */

const TARGET_KEY  = 'dig_in_budget_target';
const ACTUALS_KEY = 'dig_in_budget_actuals';

/** Budgets are set in $5 steps. Small enough to be precise, big enough to keep. */
export const INCREMENT = 5;
export const MIN_TARGET = 5;
export const MAX_TARGET = 500;

function read(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
  catch { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

/** Snap any number to the nearest $5, clamped to a sane range. */
export function snap(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return MIN_TARGET;
  const stepped = Math.round(n / INCREMENT) * INCREMENT;
  return Math.min(MAX_TARGET, Math.max(MIN_TARGET, stepped));
}

/** The $5 ladder, for a stepper/slider UI. */
export function ladder(max = 200) {
  const out = [];
  for (let v = MIN_TARGET; v <= Math.min(max, MAX_TARGET); v += INCREMENT) out.push(v);
  return out;
}

/* ── the target ───────────────────────────────────────────────────────── */

export function getTarget() {
  const t = read(TARGET_KEY, null);
  return t && Number.isFinite(t.amount) ? t : null;
}

/**
 * Set (or re-set) the price point. Setting a NEW target starts a new period:
 * previously logged spend belongs to the budget it was logged against, and
 * silently carrying it forward would make a fresh budget look pre-spent.
 */
export function setTarget(amount, label = '') {
  const t = { amount: snap(amount), setAt: Date.now(), label: String(label || '').trim() };
  write(TARGET_KEY, t);
  write(ACTUALS_KEY, []);
  return t;
}

export function clearTarget() {
  write(TARGET_KEY, null);
  write(ACTUALS_KEY, []);
}

export function adjustTarget(deltaSteps) {
  const cur = getTarget();
  if (!cur) return null;
  const next = { ...cur, amount: snap(cur.amount + deltaSteps * INCREMENT) };
  write(TARGET_KEY, next);
  return next;   // deliberately does NOT wipe actuals — nudging a target isn't a new period
}

/* ── real spend ───────────────────────────────────────────────────────── */

export function actuals() { return read(ACTUALS_KEY, []); }

/**
 * Log real money spent. `source` records where the number came from so the
 * UI can be honest about its provenance ('receipt' | 'manual' | 'pickup').
 * Receipt-imported totals are the trustworthy ones; a typed number is still
 * real money but the user chose it.
 */
export function logSpend({ total, store = '', source = 'manual', at = Date.now(), id = null }) {
  const amount = Number(total);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const entry = { id: id || `${source}-${at}`, total: +amount.toFixed(2), store: String(store || '').trim(), source, at };
  const list = actuals();
  // Idempotent by id — importing the same receipt twice must not double-count.
  if (list.some(e => e.id === entry.id)) return null;
  write(ACTUALS_KEY, [...list, entry]);
  return entry;
}

export function spent() {
  return +actuals().reduce((s, e) => s + e.total, 0).toFixed(2);
}

/* ── the estimate side ────────────────────────────────────────────────── */

/**
 * Estimated cost of what's in front of you right now. Accepts either a
 * recipe (uses servings for per-serving math) or a bare ingredient list.
 * This is the number that moves when a swap happens.
 */
export function planCost(ingredients, recipe = null, tier = null) {
  const list = (ingredients || []).map(i => (typeof i === 'string' ? i : (i?.name || ''))).filter(Boolean);
  if (!list.length) return { total: 0, rows: [], estimate: true, perServing: null };
  const t = tier || getUserTier();
  const priced = recipe ? priceRecipe(list, recipe, t) : priceIngredientList(list, t);
  return {
    total: priced.total,
    rows: priced.rows,
    perServing: priced.perServing ?? null,
    onHandCount: priced.onHandCount,
    store: priced.store,
    tier: priced.tier,
    estimate: true,
  };
}

/* ── where you stand ──────────────────────────────────────────────────── */

/**
 * @param {number} planned  estimated cost of the current cart (0 if none)
 * @returns null when no target is set — the caller should show the "set one"
 *   state rather than a budget of $0, which would read as "you're over."
 */
export function budgetStatus(planned = 0) {
  const t = getTarget();
  if (!t) return null;

  const realSpent = spent();
  const plan = Math.max(0, Number(planned) || 0);
  const projected = +(realSpent + plan).toFixed(2);
  const remaining = +(t.amount - projected).toFixed(2);
  const pctUsed = t.amount > 0 ? Math.min(999, Math.round((projected / t.amount) * 100)) : 0;

  let verdict;
  if (remaining < 0) verdict = 'over';
  else if (pctUsed >= 85) verdict = 'close';
  else verdict = 'under';

  return {
    target: t.amount,
    label: t.label,
    setAt: t.setAt,
    spent: realSpent,
    planned: plan,
    projected,
    remaining,
    pctUsed,
    verdict,
    entries: actuals().length,
  };
}

/**
 * Money translated back into what it buys — the antidote to "it's just a
 * number." Uses YOUR real average receipt, and returns null rather than
 * guessing when there isn't enough real history to say anything true.
 */
export function mealsLeft(remaining, { minReceipts = 2, servingsPerTrip = 4 } = {}) {
  const list = actuals().filter(e => e.source === 'receipt' || e.source === 'pickup');
  if (list.length < minReceipts || remaining <= 0) return null;
  const avgTrip = list.reduce((s, e) => s + e.total, 0) / list.length;
  if (avgTrip <= 0) return null;
  const perMeal = avgTrip / servingsPerTrip;
  if (perMeal <= 0) return null;
  return {
    meals: Math.floor(remaining / perMeal),
    perMeal: +perMeal.toFixed(2),
    basedOn: list.length,
  };
}

// ════════════════════════════════════════════════════════════════════════
// From tierBudget.js
// ════════════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════════════
// From affordableProtein.js
// ════════════════════════════════════════════════════════════════════════

/* affordableProtein.js — cheap protein that isn't meat.

   The reality the founder wants the app to feed: meat is usually the most
   expensive thing in a cart, and a lot of people don't have the money for it —
   but protein still matters for growth, energy, and staying full. So this is a
   small, honest education layer: the cheapest non-meat proteins, why they're
   cheap, and the easiest way to actually use each one. It's directional, real
   guidance — no fabricated exact prices (they vary by store and week), so
   figures are hedged ("about", "often") and stated as rough yields, not claims.

   Used by the "I just moved" card (movingGuide) and available to broke mode /
   any budget surface. Also a simple detector so the feed can tell whether a
   recipe already leans on cheap non-meat protein (to surface it) or leans on
   meat (so the swap tip is worth showing). */

// The picks — category + the honest why + the lowest-effort way in.
export const CHEAP_PROTEINS = [
  { key: 'beans',   emoji: '🫘', name: 'Dried beans & lentils',
    why: 'The cheapest protein there is — a bag runs a couple dollars and makes about 10–13 servings. Lentils need no soaking.',
    use: 'Simmer with an onion, garlic, salt. Freezes perfectly in portions.' },
  { key: 'eggs',    emoji: '🥚', name: 'Eggs',
    why: 'Protein and fat in one, cheap by the serving, and they keep for weeks.',
    use: 'Scramble, fry, or hard-boil a batch for the week.' },
  { key: 'peanut',  emoji: '🥜', name: 'Peanut butter',
    why: "A jar of protein that doesn't spoil — spoon it, spread it, stir it into sauce.",
    use: 'Toast + PB is a real meal; PB + soy + garlic is a noodle sauce.' },
  { key: 'canned',  emoji: '🐟', name: 'Canned fish',
    why: 'Tuna, sardines, mackerel — shelf-stable protein, often under $1.50 a can.',
    use: 'Straight onto rice, into pasta, or mashed with mayo for a sandwich.' },
  { key: 'tofu',    emoji: '⬜', name: 'Tofu & tempeh',
    why: 'A block is a few dollars and soaks up whatever flavor you give it.',
    use: 'Press, cube, pan-fry till golden; sauce it however you like.' },
  { key: 'frozen',  emoji: '🧊', name: 'Frozen peas & edamame',
    why: 'Protein in the freezer aisle that never goes bad and cooks in minutes.',
    use: 'Toss straight into rice, pasta, soup, or a stir-fry.' },
];

const MEAT_RE = /chicken|beef|pork|bacon|sausage|\bham\b|turkey|lamb|steak|\bmeat\b|salmon|shrimp|prawn|ground beef|ribs?\b|brisket|chorizo|pepperoni|prosciutto|veal|duck/i;
const CHEAP_PROTEIN_RE = /\bbeans?\b|lentil|chickpea|\bdal\b|\btofu\b|tempeh|\begg|peanut butter|\bpeanut\b|canned (tuna|fish|sardine)|\btuna\b|sardine|edamame|\bpeas\b|hummus|\bnuts?\b|seeds?\b/i;

function recipeText(r) {
  const ings = (r?.ingredients || []).map((i) => (typeof i === 'object' ? i.text || i.name : i)).join(' ');
  return `${r?.name || ''} ${r?.description || ''} ${ings}`;
}

/** Does the recipe lean on meat (the expensive line)? */
export function isMeaty(recipe) {
  return MEAT_RE.test(recipeText(recipe));
}

/** Does the recipe already use a cheap non-meat protein? */
export function hasCheapProtein(recipe) {
  return CHEAP_PROTEIN_RE.test(recipeText(recipe));
}

/** A budget-protein score for ranking: reward cheap non-meat protein, gently
    penalize meat-forward recipes when money is the constraint. */
export function proteinBudgetScore(recipe) {
  let s = 0;
  if (hasCheapProtein(recipe)) s += 2;
  if (isMeaty(recipe)) s -= 1;
  return s;
}

/** The few picks to show as education, optionally biased toward what pairs with
    a phase (kept simple — just the first N, they're all broadly useful). */
export function cheapProteinPicks(limit = 3) {
  return CHEAP_PROTEINS.slice(0, limit);
}
