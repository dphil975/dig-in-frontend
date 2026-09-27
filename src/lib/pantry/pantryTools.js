/* pantry/pantryTools.js — consolidated Pantry module.
   Merged from: pantryTools.js + pantryCategories.js + pantryPixelIcons.js
   (src/lib/ flat directory -> src/lib/pantry/). The three old files each
   re-export from this one so every existing import path keeps working. */

// ════════════════════════════════════════════════════════════════════════
// From pantryTools.js
// ════════════════════════════════════════════════════════════════════════

/* Helpers for the Virtual Pantry:
   - parseReceipt(): turn pasted/printed receipt text into {name, price} line
     items, skipping the header/total/tax noise. No OCR backend is wired in, so
     this works on text the shopper pastes or a .txt they upload (an uploaded
     photo falls back to "type what it says").
   - suggestRecipes(): match what's in the pantry against the static recipe set
     and rank recipes by how much of each you already have, optionally nudged by
     the local income tier so budget areas surface simpler/cheaper cooks first.
   - guessLocation/guessSnap/guessWic + LOCATIONS/LOCATION_LABEL: shared between
     Pantry's own pick-up form and BarcodeScanner, so a scanned item and a
     manually-typed one get the same storage-bucket/SNAP/WIC guesses instead of
     two different heuristics drifting apart. */

import { ingredientText } from '../../components/recipe/RecipeBoostSections';

export const LOCATIONS = ['pantry', 'fridge', 'freezer'];
export const LOCATION_LABEL = { pantry: 'Pantry', fridge: 'Fridge', freezer: 'Freezer' };

// --- lightweight guesses so a form pre-fills sensibly; all user-overridable ---
export function guessLocation(name) {
  const n = (name || '').toLowerCase();
  if (/frozen|ice cream|freezer|popsicle|frozen pizza|tater tot|frozen veg/.test(n)) return 'freezer';
  if (/milk|yogurt|cheese|egg|butter|meat|chicken|beef|pork|fish|salmon|deli|lettuce|spinach|produce|fruit|juice|cream|tofu|hummus|berries/.test(n)) return 'fridge';
  return 'pantry';
}
// SNAP covers most groceries EXCEPT alcohol, hot/prepared foods, supplements & non-food.
export function guessSnap(name) {
  const n = (name || '').toLowerCase();
  return !/beer|wine|liquor|alcohol|vitamin|supplement|soap|shampoo|paper towel|detergent|cleaner|cigarette|tobacco|hot bar|rotisserie|hot food/.test(n);
}
// WIC is a narrow, health-focused list (dairy, eggs, cereal, produce, beans, whole grains, formula…).
export function guessWic(name) {
  const n = (name || '').toLowerCase();
  return /milk|formula|infant|baby food|cereal|egg|cheese|yogurt|bean|lentil|peanut butter|100% juice|whole grain|whole wheat|bread|tortilla|brown rice|oats?|produce|fruit|vegetable|carrot|apple|banana|tofu|tuna|canned fish|salmon/.test(n);
}

// Lines that are clearly not grocery items on a receipt.
const RECEIPT_NOISE = /\b(subtotal|total|tax|change|cash|debit|credit|balance|tender|visa|mastercard|amex|account|auth|ref|approval|savings|you saved|loyalty|member|points|receipt|thank you|store|cashier|register|lane|order|invoice|date|time|phone|tel|www\.|http|survey|return policy|customer copy|qty|item count|supercenter|superstore|marketplace)\b/i;

// Transaction/register header codes like "ST# 02460 OP# 009 TE# 12" or "REG#".
const RECEIPT_CODE_LINE = /\b(st|op|te|tc|reg|trans|tr|term)\s*#?\s*\d/i;

// Common staples we assume every kitchen has — they shouldn't make a recipe
// look "makeable" on their own, but they don't count against it either.
const STAPLES = new Set(['salt', 'pepper', 'black pepper', 'water', 'pasta water', 'oil', 'olive oil', 'vegetable oil', 'sugar', 'granulated sugar', 'flour', 'all-purpose flour', 'baking soda', 'baking powder']);

// Address shapes — used both to read the header and to keep those lines OUT of
// the item list.
const STREET_RE = /\b\d{1,6}\s+[\w.\s]+?\b(st|street|ave|avenue|rd|road|blvd|dr|drive|ln|lane|way|hwy|highway|pkwy|parkway|pike|ct|court|pl|place|sq|square|ste|suite|unit|trail|trl|cir|circle|ter|terrace)\b\.?/i;
const CITYSTZIP_RE = /\b[\w.\s]+,?\s+[A-Z]{2}\s+\d{5}(-\d{4})?\b/;
const CLOCK_RE = /\b\d{1,2}:\d{2}\b/;                 // a time only appears in the header
const MONTH_YEAR_RE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+20\d{2}\b/i;

function cleanName(raw) {
  return raw
    .replace(/\$?\d+\.\d{2}\b/g, ' ')      // prices
    .replace(/\b\d{6,}\b/g, ' ')            // UPC / SKU codes
    .replace(/\b\d+\s*(oz|lb|lbs|g|kg|ct|pk|pack|ea|each|x)\b/gi, ' ') // sizes
    .replace(/\b[A-Z]\b/g, ' ')             // stray tax flags (T, F, N)
    .replace(/[*#@]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function parseReceipt(text) {
  if (!text) return [];
  const out = [];
  const seen = new Set();
  let bodyStarted = false;   // have we passed the store/address/date header block?
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length < 3) continue;
    if (RECEIPT_NOISE.test(line)) continue;
    if (RECEIPT_CODE_LINE.test(line)) continue;   // register/transaction header
    if (!/[a-z]/i.test(line)) continue;           // needs letters (not a code line)
    if (CITYSTZIP_RE.test(line)) continue;        // "Pittsburgh, PA 15237"
    if (STREET_RE.test(line)) continue;           // "1231 Marketplace Dr"
    if (CLOCK_RE.test(line) || MONTH_YEAR_RE.test(line)) continue; // date/time header lines
    // Use the LAST money-like number on the line — on weighed items the first
    // decimal is the weight (e.g. "BANANAS 2.14 LB  1.18") and the price trails.
    const priceMatches = line.match(/\$?\s*\d+\.\d{2}\b/g);
    const price = priceMatches ? parseFloat(priceMatches[priceMatches.length - 1].replace(/[^\d.]/g, '')) : null;
    // The header (store name, slogan, phone) is the run of price-less lines
    // before the first priced line — skip it so it never lands as a fake item.
    if (price == null && !bodyStarted) continue;
    if (price != null) bodyStarted = true;
    const name = cleanName(line);
    if (name.length < 2) continue;
    if (/^[a-z]$/i.test(name)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;                   // collapse dupes
    seen.add(key);
    out.push({ name: titleCase(name), price });
  }
  return out;
}

function titleCase(s) {
  return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

// ── Receipt HEADER parsing ────────────────────────────────────────────────
// A receipt isn't just a list of items — it's a record of a shopping trip:
// where, when, and what. parseReceiptFull() pulls that whole record so the
// pantry can keep it (store + address + date + time + total + items) instead of
// throwing the context away.

// Grocery chains we can name-match anywhere in the header block.
const KNOWN_STORES = [
  "Trader Joe's", 'Whole Foods', 'Sam\'s Club', 'H-E-B', 'HEB', 'Stop & Shop', 'Stop and Shop',
  'Walmart', 'Wal-Mart', 'Target', 'Kroger', 'Safeway', 'Albertsons', 'Vons', 'Ralphs',
  'Costco', 'Publix', 'Wegmans', 'ShopRite', 'Shop Rite', 'Giant Eagle', 'Giant', 'Food Lion',
  'Meijer', 'Aldi', 'Lidl', 'Sprouts', 'Winn-Dixie', 'Hannaford', 'Price Chopper',
  'Market Basket', 'Harris Teeter', 'Fry\'s', 'King Soopers', 'Smith\'s', 'QFC', 'Acme',
  'Fresh Market', 'Piggly Wiggly', 'WinCo', 'Save A Lot', 'Grocery Outlet', 'Food 4 Less',
];

function detectStore(lines) {
  const head = lines.slice(0, 8).join('  ');
  for (const s of KNOWN_STORES) {
    if (new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(head)) {
      // normalise a couple of aliases
      if (/wal-?mart/i.test(s)) return 'Walmart';
      if (/^heb$/i.test(s)) return 'H-E-B';
      if (/stop (and|&) shop/i.test(s)) return 'Stop & Shop';
      return s;
    }
  }
  // Fallback: first meaningful line that isn't a code/number/noise.
  for (const line of lines.slice(0, 4)) {
    const t = line.trim();
    if (t.length < 3) continue;
    if (RECEIPT_NOISE.test(t) || RECEIPT_CODE_LINE.test(t)) continue;
    if (!/[a-z]/i.test(t)) continue;
    if (/\d+\.\d{2}/.test(t)) continue;           // looks like an item/price line
    return titleCase(t.replace(/[#*]+/g, '').trim()).slice(0, 40);
  }
  return null;
}

function detectAddress(lines) {
  let street = null, csz = null;
  for (const line of lines.slice(0, 10)) {
    const t = line.trim();
    if (!street) { const m = t.match(STREET_RE); if (m) street = m[0].replace(/\s{2,}/g, ' ').trim(); }
    if (!csz)    { const m = t.match(CITYSTZIP_RE); if (m) csz = m[0].replace(/\s{2,}/g, ' ').trim(); }
  }
  return [street, csz].filter(Boolean).join(', ') || null;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
function pad(n) { return String(n).padStart(2, '0'); }

function detectDate(text) {
  // ISO first (unambiguous)
  let m = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  // Month name: "Jul 5, 2026" / "July 5 2026"
  m = text.match(new RegExp(`\\b(${MONTHS.join('|')})[a-z]*\\.?\\s+(\\d{1,2}),?\\s+(20\\d{2})\\b`, 'i'));
  if (m) return `${m[3]}-${pad(MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) + 1)}-${pad(m[2])}`;
  // MM/DD/YYYY or MM-DD-YY (assume US order)
  m = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (m) {
    let [, mo, d, y] = m;
    if (y.length === 2) y = (Number(y) > 70 ? '19' : '20') + y;
    if (Number(mo) >= 1 && Number(mo) <= 12 && Number(d) >= 1 && Number(d) <= 31)
      return `${y}-${pad(mo)}-${pad(d)}`;
  }
  return null;
}

function detectTime(text) {
  // colon distinguishes time from prices; capture optional am/pm
  const m = text.match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]\.?m\.?)?\b/i);
  if (!m) return null;
  let hh = Number(m[1]);
  const mm = m[2];
  const ap = m[3] ? m[3].replace(/\./g, '').toLowerCase() : null;
  if (ap === 'pm' && hh < 12) hh += 12;
  if (ap === 'am' && hh === 12) hh = 0;
  if (hh > 23 || Number(mm) > 59) return null;
  return `${pad(hh)}:${mm}`;
}

function detectTotal(lines) {
  // Prefer an explicit "total" line that isn't a subtotal; else the largest money value.
  let total = null;
  for (const line of lines) {
    if (/\bsub\s*total\b/i.test(line)) continue;
    if (/\b(total|balance due|amount due|grand total)\b/i.test(line)) {
      const nums = line.match(/\d+\.\d{2}/g);
      if (nums) total = parseFloat(nums[nums.length - 1]);
    }
  }
  return total;
}

/**
 * Parse a whole receipt into a trip record — the store, where and when it
 * happened, the total, and the itemized list. Everything the pantry keeps so
 * the shopper never has to add items one at a time.
 * @returns {{ store, address, date, time, total, items }}
 */
export function parseReceiptFull(text) {
  if (!text) return { store: null, address: null, date: null, time: null, total: null, items: [] };
  const lines = text.split(/\r?\n/);
  return {
    store:   detectStore(lines),
    address: detectAddress(lines),
    date:    detectDate(text),
    time:    detectTime(text),
    total:   detectTotal(lines),
    items:   parseReceipt(text),
  };
}

// Does a pantry item satisfy a recipe ingredient? Loose two-way substring on
// significant words so "2% Milk" matches "milk" and "Boneless Chicken Breast"
// matches "chicken breast". Exported so restaurantFavorites.js can score a
// saved dish against the pantry the same way recipes are scored.
export function itemCoversIngredient(itemName, ingredient) {
  const a = itemName.toLowerCase();
  const b = ingredient.toLowerCase();
  if (a.includes(b) || b.includes(a)) return true;
  const bWords = b.split(/\s+/).filter(w => w.length > 2);
  return bWords.length > 0 && bWords.every(w => a.includes(w));
}

/**
 * Rank recipes by how much of each the pantry already covers.
 * @param pantryItems array of { name }
 * @param recipeIngredients map id -> string[]
 * @param recipes array of recipe objects (need id, name)
 * @param tier 'budget' | 'mid' | 'premium' | null — light ordering nudge
 * @returns array of { recipe, have[], missing[], coverage } sorted best-first
 */
export function suggestRecipes(pantryItems, recipeIngredients, recipes, tier = null, limit = 8) {
  const names = pantryItems.map(i => i.name).filter(Boolean);
  if (names.length === 0) return [];
  const byId = new Map(recipes.map(r => [r.id, r]));
  const scored = [];

  for (const [idStr, ingredients] of Object.entries(recipeIngredients)) {
    const recipe = byId.get(Number(idStr));
    if (!recipe || !ingredients?.length) continue;
    const have = [];
    const missing = [];
    for (const ing of ingredients) {
      const covered = names.some(n => itemCoversIngredient(n, ing)) || STAPLES.has(ing.toLowerCase());
      (covered ? have : missing).push(ing);
    }
    // Real (non-staple) hits are what make a suggestion meaningful.
    const realHits = have.filter(h => !STAPLES.has(h.toLowerCase())).length;
    if (realHits === 0) continue;
    const coverage = have.length / ingredients.length;
    let score = coverage * 100 + realHits * 4;
    // Budget areas: nudge simpler, fewer-ingredient, easier recipes up.
    if (tier === 'budget') {
      if (ingredients.length <= 6) score += 6;
      if (recipe.difficulty === 'easy') score += 4;
    } else if (tier === 'premium') {
      if (recipe.difficulty === 'hard' || recipe.difficulty === 'medium') score += 2;
    }
    scored.push({ recipe, have, missing, coverage, realHits, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * Build the full "Pantry Rolodex" — every recipe the pantry can reach, bucketed
 * by how close it is, so the user can flip through and pick from what they have.
 * Unlike suggestRecipes (a capped top-N teaser), this returns the whole set with
 * filtering + bucketing, and is meant to be the always-with-you index.
 *
 * Buckets:
 *   ready   — nothing missing (staples assumed on hand): cook tonight
 *   almost  — 1–2 real ingredients short
 *   stretch — 3+ short, but you already own the core of it
 *
 * @returns { cards, counts } — cards sorted ready→almost→stretch, best coverage first
 */
export function buildRolodex(pantryItems, recipeIngredients, recipes, opts = {}) {
  const { tier = null, mealType = null, query = null, bucket = null } = opts;
  const names = (pantryItems || []).map(i => i.name).filter(Boolean);
  const byId = new Map(recipes.map(r => [r.id, r]));
  const cards = [];

  for (const [idStr, ingredients] of Object.entries(recipeIngredients)) {
    const recipe = byId.get(Number(idStr));
    if (!recipe || !ingredients?.length) continue;
    const have = [];
    const missing = [];              // never includes staples — staples are auto-covered
    for (const ing of ingredients) {
      const isStaple = STAPLES.has(ing.toLowerCase());
      const covered = isStaple || names.some(n => itemCoversIngredient(n, ing));
      if (covered) have.push(ing);
      else missing.push(ing);
    }
    const realHave = have.filter(h => !STAPLES.has(h.toLowerCase())).length;
    // Only surface recipes the pantry actually reaches — one real hit minimum.
    if (names.length > 0 && realHave === 0) continue;

    const coverage = have.length / ingredients.length;
    const b = missing.length === 0 ? 'ready' : missing.length <= 2 ? 'almost' : 'stretch';
    cards.push({
      recipe, ingredients, have, missing,
      realHave, missingCount: missing.length, coverage, bucket: b,
    });
  }

  const counts = { all: cards.length, ready: 0, almost: 0, stretch: 0 };
  for (const c of cards) counts[c.bucket] += 1;

  let list = cards;
  if (mealType) {
    list = list.filter(c => c.recipe.mealType === mealType || c.recipe.recipe_type === mealType);
  }
  if (bucket && bucket !== 'all') list = list.filter(c => c.bucket === bucket);
  if (query) {
    const q = query.trim().toLowerCase();
    if (q) list = list.filter(c =>
      c.recipe.name.toLowerCase().includes(q) ||
      c.ingredients.some(i => i.toLowerCase().includes(q)));
  }

  const rank = { ready: 0, almost: 1, stretch: 2 };
  list.sort((a, b2) =>
    rank[a.bucket] - rank[b2.bucket] ||
    b2.coverage - a.coverage ||
    a.missingCount - b2.missingCount ||
    (tier === 'budget' ? a.ingredients.length - b2.ingredients.length : 0));

  return { cards: list, counts };
}

/** Append ingredient names to the shared shopping list (array of strings),
    de-duped case-insensitively against what's already there. Returns # added. */
export function addToShoppingList(ingredientNames, key = 'dig_in_shopping_list') {
  let list = [];
  try { const v = JSON.parse(localStorage.getItem(key)); if (Array.isArray(v)) list = v; } catch { /* ignore */ }
  const seen = new Set(list.map(s => String(s).toLowerCase()));
  let added = 0;
  for (const raw of ingredientNames) {
    const name = titleCase(String(raw).trim());
    if (!name) continue;
    if (seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    list.push(name);
    added += 1;
  }
  try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* ignore */ }
  return added;
}

// ── Shopping context — "where am I right now" ─────────────────────────────
// Sticky across the whole trip AND across pages: Pantry's own pick-up form
// and BarcodeScanner both read/write this so switching between them
// mid-shop doesn't lose the store/ZIP you already set.
const SHOPPING_CONTEXT_KEY = 'dig_in_shopping_context';

export function loadShoppingContext() {
  try {
    const v = JSON.parse(localStorage.getItem(SHOPPING_CONTEXT_KEY));
    return { store: v?.store || '', storeZip: v?.storeZip || '' };
  } catch { return { store: '', storeZip: '' }; }
}

export function saveShoppingContext({ store, storeZip }) {
  try { localStorage.setItem(SHOPPING_CONTEXT_KEY, JSON.stringify({ store, storeZip })); } catch { /* ignore */ }
}

// ── Holding tray — the "deciding" pile scanned/typed items land in ────────
// The single write path both Pantry's own form and BarcodeScanner use, so
// "scan it in" always means the exact same thing: it shows up in Pantry's
// DECIDING tray, ready for the real buy/put-back decision — never silently
// bypassing it.
const HOLDING_KEY = 'dig_in_pantry_holding';

export function addToHolding(item) {
  let list = [];
  try { const v = JSON.parse(localStorage.getItem(HOLDING_KEY)); if (Array.isArray(v)) list = v; } catch { /* ignore */ }
  const next = [item, ...list];
  try { localStorage.setItem(HOLDING_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

// ── "Buy once, cook more" — the ingredient-overlap payoff ─────────────────
// Lives here (not mealPlanEngine.js, its original home) specifically because
// it's a leaf module — mealPlanEngine.js imports recipeRecommender.js, which
// imports occasions.js (for the hosted-theme memory), and occasions.js needs
// this same function for "other recipes from this same shopping trip" on a
// hosted event — importing it from mealPlanEngine.js would create a cycle.
// mealPlanEngine.js re-exports this so MealPlan's own import is unaffected.

/** Beyond a given set of "already accounted for" recipes, which OTHER
 * recipes from the pool become makeable (or at most 1 ingredient short)
 * from a shopping list — the real "buy these, make all of this" payoff.
 * Reuses itemCoversIngredient() above, the same loose ingredient-name
 * matching the Pantry Rolodex uses, so a recipe that shows up here would
 * also show up as "ready"/"almost" in buildRolodex().
 * @returns { recipes: recipe[] (top `limit`, best coverage first), total }
 */
export function bonusRecipesFromList(shoppingList, recipes, excludeIds, limit = 12) {
  const excluded = new Set(excludeIds);
  const scored = [];
  for (const r of recipes) {
    const id = r.id ?? r.name;
    if (excluded.has(id)) continue;
    const ingredients = (r.ingredients || []).map(ingredientText).filter(Boolean);
    // A big shopping list is large enough that even a loose bar finds
    // hundreds of "matches" among simple/short recipes, which reads as
    // gimmicky more than useful. Requiring at least 4 real ingredients AND
    // 90%+ coverage (at most one real ingredient short) is a claim worth
    // making — validated against the real 575-recipe corpus with a real
    // simulated week before picking these numbers (see project notes).
    if (ingredients.length < 4) continue;
    const have = ingredients.filter(ing => shoppingList.some(n => itemCoversIngredient(n, ing)));
    const coverage = have.length / ingredients.length;
    if (coverage < 0.9) continue;
    scored.push({ recipe: r, coverage, missing: ingredients.length - have.length });
  }
  scored.sort((a, b) => b.coverage - a.coverage || a.missing - b.missing);
  return { recipes: scored.slice(0, limit).map(s => s.recipe), total: scored.length };
}

// ════════════════════════════════════════════════════════════════════════
// From pantryCategories.js
// ════════════════════════════════════════════════════════════════════════

/* pantryCategories — the shelf taxonomy the Virtual Pantry is browsed by.

   This is deliberately SEPARATE from freshness.js's `categorize()`. That one
   answers "how long does this last where it's stored" and only needs a dozen
   coarse buckets (leafy / dairy / dry / …). This one answers a different
   question — "where on my shelves does this live, and what do I have a lot
   of?" — which is how a person actually browses a pantry: seasonings,
   beverages, plant-based, fruits & berries, cookies & sweets, teas & cocoa,
   pasta, canned goods, ramen. Both run off the item's real name; neither
   invents data. Merging them would have wrecked the shelf-life estimates
   (a jar of cinnamon and a bag of rice are one "dry staple" to freshness.js,
   but two very different shelves to a cook).

   Matching is LONGEST-KEYWORD-WINS, not first-category-wins. That's what lets
   "iced tea" land in Beverages while "tea" lands in Teas & Cocoa, and
   "cocoa powder" land in Baking while "cocoa" lands in Teas & Cocoa —
   without having to hand-order 24 categories against each other.

   A few categories also carry a `head` list: head nouns that win over any
   longer keyword elsewhere. Length alone got "chocolate chip cookies" wrong
   (Baking's "chocolate chip" is longer than Sweets' "cookie") and would have
   done the same to "peanut butter cookies" — but the last noun is what the
   thing actually IS. Head lists resolve among themselves by length too, so
   "cake mix" still beats "cake".

   `examples` are shown when a shelf is empty, so the grid still reads as a
   real reference ("what belongs here") instead of a dead tile. */

export const PANTRY_CATEGORIES = [
  {
    id: 'veggies',
    label: 'Veggies',
    blurb: 'Fresh vegetables and the herbs that go with them.',
    examples: ['broccoli', 'carrots', 'onion', 'spinach', 'bell pepper'],
    kw: ['broccoli', 'carrot', 'potato', 'sweet potato', 'onion', 'scallion', 'green onion', 'garlic',
      // Fresh chiles by variety name. These matter more than they look: the
      // whole point of the hunt cards in StoreRun is showing someone what an
      // unfamiliar ingredient looks like, and "poblano" was landing in
      // Everything Else — a generic crate — which is exactly the moment the
      // feature had to work and didn't. Bare "pepper" stays OUT (black pepper
      // is a seasoning); named varieties are unambiguous produce.
      'poblano', 'serrano pepper', 'habanero', 'anaheim', 'shishito', 'banana pepper',
      'chile pepper', 'chili pepper', 'tomatillo', 'plantain', 'napa cabbage', 'daikon',
      'fennel', 'endive', 'watercress', 'collard', 'kohlrabi', 'parsnip', 'rutabaga',
      'chayote', 'nopales', 'snow pea', 'sugar snap', 'butternut', 'acorn squash',
      'spaghetti squash', 'delicata',
      'bell pepper', 'jalapeno', 'tomato', 'cucumber', 'zucchini', 'lettuce', 'romaine', 'spinach',
      'kale', 'arugula', 'chard', 'cabbage', 'bok choy', 'celery', 'corn', 'mushroom', 'squash',
      'eggplant', 'asparagus', 'cauliflower', 'brussels', 'green bean', 'snap pea', 'beet', 'radish',
      'turnip', 'leek', 'shallot', 'ginger', 'okra', 'artichoke', 'sprouts', 'basil', 'cilantro',
      'parsley', 'mint', 'rosemary', 'dill', 'salad', 'greens', 'veggie', 'vegetable', 'produce'],
  },
  {
    id: 'fruits',
    label: 'Fruits & Berries',
    blurb: 'Everything sweet that grew on a tree, vine or bush.',
    examples: ['strawberries', 'bananas', 'apples', 'blueberries', 'lemons'],
    kw: ['apple', 'banana', 'orange', 'clementine', 'mandarin', 'grapefruit', 'grape', 'berry',
      'berries', 'strawberr', 'blueberr', 'raspberr', 'blackberr', 'cranberr', 'peach', 'nectarine',
      'pear', 'plum', 'mango', 'melon', 'watermelon', 'cantaloupe', 'honeydew', 'pineapple', 'kiwi',
      'cherry', 'cherries', 'apricot', 'fig', 'pomegranate', 'papaya', 'guava', 'lychee',
      'persimmon', 'lemon', 'lime', 'avocado', 'raisin', 'dried fruit', 'fruit'],
  },
  {
    id: 'seasoning',
    label: 'Seasonings',
    blurb: 'Spices, dried herbs, salt and the little jars that carry a dish.',
    examples: ['paprika', 'cumin', 'black pepper', 'cinnamon', 'garlic powder'],
    kw: ['salt', 'pepper corn', 'peppercorn', 'black pepper', 'paprika', 'cumin', 'coriander',
      'oregano', 'thyme', 'sage', 'bay leaf', 'cinnamon', 'nutmeg', 'clove', 'cardamom', 'allspice',
      'chili powder', 'chile powder', 'cayenne', 'red pepper flake', 'garlic powder', 'onion powder',
      'turmeric', 'curry powder', 'garam masala', 'za\'atar', 'sumac', 'saffron', 'star anise',
      'fennel seed', 'mustard seed', 'seasoning', 'spice', 'herbs de provence', 'italian seasoning',
      'everything bagel seasoning', 'msg', 'bouillon', 'stock cube', 'vanilla extract', 'extract'],
  },
  {
    id: 'teas_cocoa',
    label: 'Teas & Cocoa',
    blurb: 'The warm-mug shelf — leaves, bags and drinking chocolate.',
    examples: ['green tea', 'chamomile', 'chai', 'hot cocoa', 'matcha'],
    kw: ['tea', 'tea bag', 'matcha', 'chai', 'chamomile', 'rooibos', 'oolong', 'earl grey',
      'green tea', 'black tea', 'herbal tea', 'peppermint tea', 'hibiscus', 'cocoa',
      'hot chocolate', 'drinking chocolate', 'chocolate mix'],
  },
  {
    id: 'coffee',
    label: 'Coffee',
    blurb: 'Beans, grounds, pods and everything that starts the morning.',
    examples: ['ground coffee', 'espresso', 'k-cups', 'cold brew'],
    kw: ['coffee', 'coffee bean', 'ground coffee', 'espresso', 'k-cup', 'k cup', 'coffee pod',
      'instant coffee', 'cold brew', 'chicory', 'decaf'],
  },
  {
    id: 'beverages',
    label: 'Beverages',
    blurb: 'Cold drinks — juice, soda, seltzer and water.',
    examples: ['orange juice', 'seltzer', 'lemonade', 'sparkling water'],
    kw: ['soda', 'cola', 'pop', 'juice', 'orange juice', 'apple juice', 'lemonade', 'limeade',
      'seltzer', 'sparkling water', 'club soda', 'tonic', 'mineral water', 'water bottle',
      'bottled water', 'iced tea', 'sweet tea', 'kombucha', 'energy drink', 'sports drink',
      'gatorade', 'electrolyte', 'smoothie', 'horchata', 'agua fresca', 'ginger ale', 'root beer',
      'cider', 'drink mix', 'beverage'],
  },
  {
    id: 'plant_based',
    label: 'Plant-Based',
    blurb: 'Dairy and meat alternatives — the swap shelf.',
    examples: ['tofu', 'oat milk', 'tempeh', 'nutritional yeast'],
    head: ['tofu', 'tempeh', 'seitan', 'vegan', 'plant based', 'plant-based', 'meatless'],
    kw: ['tofu', 'tempeh', 'seitan', 'oat milk', 'almond milk', 'soy milk', 'cashew milk',
      'coconut milk beverage', 'rice milk', 'pea milk', 'plant based', 'plant-based', 'vegan',
      'meatless', 'meat alternative', 'beyond meat', 'impossible', 'jackfruit',
      'nutritional yeast', 'edamame', 'soy curl', 'vegan cheese', 'oat creamer', 'aquafaba'],
  },
  {
    id: 'pasta',
    label: 'Pasta',
    blurb: 'Dried and fresh pasta, and the shapes worth keeping around.',
    examples: ['spaghetti', 'penne', 'orzo', 'lasagna sheets'],
    head: ['pasta', 'spaghetti', 'lasagna', 'macaroni'],
    kw: ['pasta', 'spaghetti', 'penne', 'macaroni', 'elbow', 'fusilli', 'rotini', 'rigatoni',
      'linguine', 'fettuccine', 'tagliatelle', 'pappardelle', 'bucatini', 'lasagna', 'orzo',
      'ravioli', 'tortellini', 'gnocchi', 'farfalle', 'shells', 'ziti', 'angel hair', 'orecchiette'],
  },
  {
    id: 'ramen',
    label: 'Ramen & Noodles',
    blurb: 'Instant packs, fresh noodles and everything slurpable.',
    examples: ['ramen', 'udon', 'rice noodles', 'soba'],
    head: ['ramen', 'noodle', 'noodles'],
    kw: ['ramen', 'instant noodle', 'cup noodle', 'soba', 'udon', 'somen', 'rice noodle',
      'pho noodle', 'lo mein', 'chow mein', 'vermicelli', 'glass noodle', 'sweet potato noodle',
      'egg noodle', 'noodle', 'wonton wrapper', 'dumpling wrapper'],
  },
  {
    id: 'canned',
    label: 'Canned Goods',
    blurb: 'Tins and jars that turn into dinner on a bad night.',
    examples: ['canned tomatoes', 'chickpeas', 'black beans', 'coconut milk'],
    head: ['canned', 'tinned', 'can of'],
    kw: ['canned', 'can of', 'tinned', 'tin of', 'chickpea', 'garbanzo', 'black bean',
      'kidney bean', 'pinto bean', 'cannellini', 'white bean', 'baked bean', 'refried bean',
      'canned tomato', 'crushed tomato', 'diced tomato', 'tomato paste', 'coconut milk',
      'evaporated milk', 'canned corn', 'canned tuna', 'canned salmon', 'sardine', 'anchovy',
      'broth', 'stock', 'soup', 'canned soup', 'olives', 'capers', 'artichoke heart',
      'green chile', 'pumpkin puree'],
  },
  {
    id: 'sweets',
    label: 'Cookies & Sweets',
    blurb: 'Cookies, chocolate, candy — the shelf nobody forgets.',
    examples: ['chocolate chip cookies', 'dark chocolate', 'gummies', 'brownies'],
    head: ['cookie', 'cookies', 'brownie', 'candy', 'cupcake', 'cake', 'chocolate bar'],
    kw: ['cookie', 'biscuit', 'oreo', 'shortbread', 'macaron', 'brownie', 'candy', 'chocolate',
      'chocolate bar', 'dark chocolate', 'milk chocolate', 'gummy', 'gummies', 'marshmallow',
      'caramel', 'toffee', 'fudge', 'cake', 'cupcake', 'donut', 'doughnut', 'pie', 'pastry',
      'wafer', 'sweets', 'dessert', 'licorice', 'lollipop', 'mochi', 'halva'],
  },
  {
    id: 'snacks',
    label: 'Snacks & Chips',
    blurb: 'Salty, crunchy, straight-from-the-bag food.',
    examples: ['tortilla chips', 'pretzels', 'popcorn', 'crackers'],
    // "chips" is safe as a head noun because Baking claims the longer
    // "chocolate chips" in the same tier — but it LOSES to Bakery's longer
    // "tortilla", so the compound chip forms are listed explicitly too.
    head: ['chips', 'tortilla chips', 'pita chips', 'cracker', 'crackers', 'pretzel', 'popcorn'],
    kw: ['chips', 'potato chip', 'tortilla chip', 'corn chip', 'pita chip', 'pretzel', 'popcorn',
      'cracker', 'granola bar', 'protein bar', 'trail mix', 'jerky', 'puffs', 'cheese puff',
      'rice cake', 'seaweed snack', 'plantain chip', 'veggie straw', 'snack'],
  },
  {
    id: 'dairy',
    label: 'Dairy & Eggs',
    blurb: 'Milk, cheese, butter, yogurt and the egg carton.',
    examples: ['milk', 'eggs', 'cheddar', 'greek yogurt', 'butter'],
    kw: ['milk', 'whole milk', 'skim milk', 'cream', 'heavy cream', 'half and half', 'sour cream',
      'butter', 'ghee', 'cheese', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'ricotta',
      'cottage cheese', 'cream cheese', 'gouda', 'swiss', 'brie',
      // Cheeses the original English-only list missed. "queso fresco" was
      // landing in Everything Else for the same reason "poblano" was — the
      // taxonomy only spoke one grocery store's language.
      'queso', 'queso fresco', 'cotija', 'oaxaca', 'manchego', 'provolone', 'gruyere',
      'gruyère', 'mascarpone', 'burrata', 'paneer', 'monterey jack', 'colby', 'havarti',
      'asiago', 'blue cheese', 'goat cheese', 'chevre', 'chèvre', 'creme fraiche',
      'crème fraîche', 'string cheese', 'mexican crema',
      'yogurt', 'yoghurt', 'greek yogurt',
      'kefir', 'whipped cream', 'egg', 'eggs', 'egg white', 'buttermilk'],
  },
  {
    id: 'meat',
    label: 'Meat & Poultry',
    blurb: 'The protein drawer — fresh, cured and deli.',
    examples: ['chicken thighs', 'ground beef', 'bacon', 'sausage'],
    kw: ['chicken', 'beef', 'steak', 'ground beef', 'pork', 'pork chop', 'lamb', 'veal', 'turkey',
      'sausage', 'bacon', 'ham', 'prosciutto', 'salami', 'pepperoni', 'deli meat', 'ground turkey',
      'ground pork', 'brisket', 'ribs', 'meatball', 'hot dog', 'chorizo', 'duck', 'meat'],
  },
  {
    id: 'seafood',
    label: 'Seafood',
    blurb: 'Fish and shellfish, fresh or frozen.',
    examples: ['salmon', 'shrimp', 'cod', 'mussels'],
    kw: ['fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'cod', 'tilapia', 'snapper',
      'trout', 'mackerel', 'crab', 'lobster', 'scallop', 'clam', 'mussel', 'oyster', 'squid',
      'calamari', 'octopus', 'seafood', 'nori', 'seaweed'],
  },
  {
    id: 'bakery',
    label: 'Bread & Bakery',
    blurb: 'Loaves, buns, wraps and everything from the bread aisle.',
    examples: ['sourdough', 'tortillas', 'bagels', 'pita'],
    head: ['bread', 'bagel', 'baguette', 'croissant', 'tortilla'],
    kw: ['bread', 'sourdough', 'baguette', 'brioche', 'loaf', 'bun', 'bagel', 'tortilla', 'roll',
      'pita', 'naan', 'flatbread', 'croissant', 'muffin', 'english muffin', 'wrap', 'focaccia',
      'challah', 'rye', 'breadcrumb', 'crouton'],
  },
  {
    id: 'grains',
    label: 'Grains & Rice',
    blurb: 'Bulk carbs and dried legumes — the cheapest shelf you own.',
    examples: ['jasmine rice', 'quinoa', 'lentils', 'rolled oats'],
    kw: ['rice', 'jasmine rice', 'basmati', 'brown rice', 'arborio', 'sushi rice', 'quinoa', 'oat',
      'rolled oats', 'oatmeal', 'steel cut', 'barley', 'farro', 'bulgur', 'couscous', 'millet',
      'buckwheat', 'cornmeal', 'grits', 'polenta', 'lentil', 'dried bean', 'split pea', 'wheat berry'],
  },
  {
    id: 'baking',
    label: 'Baking',
    blurb: 'Flour, sugar, leaveners — the ingredients that become something else.',
    examples: ['all-purpose flour', 'baking soda', 'brown sugar', 'yeast'],
    head: ['cake mix', 'brownie mix', 'cookie mix', 'cocoa powder', 'chocolate chips'],
    kw: ['flour', 'all purpose flour', 'all-purpose flour', 'bread flour', 'almond flour',
      'sugar', 'brown sugar', 'powdered sugar', 'confectioners', 'baking soda', 'baking powder',
      'yeast', 'cocoa powder', 'cornstarch', 'corn starch', 'condensed milk', 'chocolate chip',
      'sprinkles', 'molasses', 'shortening', 'cake mix', 'brownie mix', 'gelatin', 'food coloring'],
  },
  {
    id: 'condiments',
    label: 'Condiments & Sauces',
    blurb: 'Bottles and jars in the fridge door.',
    examples: ['soy sauce', 'hot sauce', 'mustard', 'peanut butter'],
    kw: ['ketchup', 'mustard', 'dijon', 'mayo', 'mayonnaise', 'aioli', 'hot sauce', 'sriracha',
      'soy sauce', 'tamari', 'fish sauce', 'oyster sauce', 'hoisin', 'teriyaki', 'bbq sauce',
      'barbecue sauce', 'worcestershire', 'salsa', 'hummus', 'guacamole', 'dressing', 'ranch',
      'relish', 'pickle', 'jam', 'jelly', 'preserves', 'marmalade', 'honey', 'peanut butter',
      'almond butter', 'nutella', 'tahini', 'miso', 'gochujang', 'harissa', 'chimichurri',
      'marinara', 'pasta sauce', 'pesto', 'curry paste', 'chutney', 'sauce', 'dip', 'spread'],
  },
  {
    id: 'oils',
    label: 'Oils & Vinegars',
    blurb: 'What the pan starts with, and what finishes the salad.',
    examples: ['olive oil', 'sesame oil', 'balsamic', 'rice vinegar'],
    kw: ['olive oil', 'extra virgin', 'vegetable oil', 'canola', 'sesame oil', 'coconut oil',
      'avocado oil', 'peanut oil', 'sunflower oil', 'grapeseed', 'cooking spray', 'oil',
      'vinegar', 'balsamic', 'rice vinegar', 'apple cider vinegar', 'red wine vinegar', 'lard'],
  },
  {
    id: 'frozen',
    label: 'Frozen',
    blurb: "The freezer shelf — dinner you don't have to plan.",
    examples: ['frozen peas', 'frozen pizza', 'ice cream', 'frozen berries'],
    head: ['frozen', 'ice cream', 'popsicle'],
    kw: ['frozen', 'frozen pizza', 'frozen veg', 'frozen fruit', 'ice cream', 'gelato', 'sorbet',
      'popsicle', 'frozen waffle', 'frozen dinner', 'tater tot', 'french fries', 'ice pop',
      'freezer meal'],
  },
  {
    id: 'breakfast',
    label: 'Breakfast',
    blurb: 'Cereal, granola, syrup — the first shelf of the day.',
    examples: ['granola', 'cereal', 'maple syrup', 'pancake mix'],
    kw: ['cereal', 'granola', 'muesli', 'pancake mix', 'waffle mix', 'maple syrup', 'syrup',
      'pop tart', 'breakfast bar', 'instant oatmeal', 'cream of wheat', 'toaster pastry'],
  },
  {
    id: 'nuts',
    label: 'Nuts & Seeds',
    blurb: 'Small, expensive, worth keeping sealed.',
    examples: ['almonds', 'walnuts', 'chia seeds', 'sesame seeds'],
    kw: ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'peanut', 'hazelnut', 'macadamia',
      'pine nut', 'brazil nut', 'sunflower seed', 'pumpkin seed', 'pepita', 'chia', 'flax',
      'sesame seed', 'hemp seed', 'poppy seed', 'nuts', 'seeds'],
  },
];

// Everything that didn't match a real keyword. Never a guess dressed up as one.
export const OTHER_CATEGORY = {
  id: 'other',
  label: 'Everything Else',
  blurb: "Items whose names we can't confidently shelve — nothing invented.",
  examples: [],
  kw: [],
};

export const ALL_CATEGORIES = [...PANTRY_CATEGORIES, OTHER_CATEGORY];

const BY_ID = new Map(ALL_CATEGORIES.map(c => [c.id, c]));
export function categoryById(id) { return BY_ID.get(id) || OTHER_CATEGORY; }

/* Head nouns first (what the thing IS), then longest-keyword-wins. "chocolate
   chip cookies" is a cookie, not baking chocolate; "iced tea" (8 chars) beats
   "tea" (3) so it shelves as a Beverage; "cocoa powder" beats "cocoa" so it
   shelves as Baking. Ties go to the earlier category in the list. */
function longestMatch(n, listKey) {
  let best = null;
  let bestLen = 0;
  for (const c of PANTRY_CATEGORIES) {
    for (const k of (c[listKey] || [])) {
      if (k.length > bestLen && n.includes(k)) { best = c; bestLen = k.length; }
    }
  }
  return best;
}

export function categorizeShelf(name) {
  const n = String(name || '').toLowerCase();
  if (!n.trim()) return OTHER_CATEGORY;
  return longestMatch(n, 'head') || longestMatch(n, 'kw') || OTHER_CATEGORY;
}

/** Count real pantry items per shelf category. Returns { [catId]: n }. */
export function countByCategory(items) {
  const counts = {};
  for (const it of items || []) {
    const c = categorizeShelf(it?.name);
    counts[c.id] = (counts[c.id] || 0) + 1;
  }
  return counts;
}

/* `itemsInCategory(items, catId)` used to live here and was never called by
   anything — PantryCategoryGrid filters inline and StoreRun groups its own
   objectives. Removed rather than left as decoration; it's two lines to
   restore if a real caller ever turns up. */

// ════════════════════════════════════════════════════════════════════════
// From pantryPixelIcons.js
// ════════════════════════════════════════════════════════════════════════

/* pantryPixelIcons — the pixel art on the Virtual Pantry's shelf tiles.

   Every icon here is DRAWN, not fetched: each shelf category has a scene
   function that paints a 32×32 grid on a canvas (a woven basket of veggies, a
   plate of three differently-coloured cookies, a ramen bowl with a noodle
   swirl and half an egg…) and the result is exported as a PNG data URL. No
   image files, no network, no generated-image service — which is what keeps
   this honest: the tile can never show a photo of food you don't have, and it
   renders identically offline.

   "Generative" here means the scene grammar is shared and parameterised —
   vessels (basket / jar / bowl / can / carton / mug / bottle / bag / plate /
   crate) composed with contents (mounds of shaded balls, noodle swirls, chip
   specks, steam, leaf tops) — with a per-category seeded PRNG placing the
   pieces. Same category always renders the same picture (the seed is the
   category id), so the shelf you learned yesterday looks like itself today.

   Grid/scale conventions: 32×32 cells, object baseline at y=26, floor band
   below it. Cell helpers come from the app's existing pixelArt engine so
   these icons are made of the same primitives as the Pixel Creator's output. */

import { cell, row } from '../pixelArt';

const G = 32;              // grid resolution
const BASE_Y = 26;         // every vessel's bottom row sits here
const DEFAULT_SIZE = 160;  // rendered px (32 × 5)

// ── low-level cells ───────────────────────────────────────────────────────
function px(ctx, x, y, c, s) {
  x = Math.round(x); y = Math.round(y);
  if (!c || x < 0 || y < 0 || x >= G || y >= G) return;
  cell(ctx, x, y, c, s);
}
function hline(ctx, y, x0, x1, c, s) {
  y = Math.round(y);
  if (!c || y < 0 || y >= G) return;
  const a = Math.max(0, Math.round(x0));
  const b = Math.min(G - 1, Math.round(x1));
  if (b < a) return;
  row(ctx, y, a, b, c, s);
}
function vline(ctx, x, y0, y1, c, s) {
  for (let y = Math.round(y0); y <= Math.round(y1); y++) px(ctx, x, y, c, s);
}
function box(ctx, x0, y0, x1, y1, c, s) {
  for (let y = Math.round(y0); y <= Math.round(y1); y++) hline(ctx, y, x0, x1, c, s);
}

function shade(hex, amt) {
  const n = parseInt(String(hex).slice(1), 16);
  const cl = v => Math.max(0, Math.min(255, v + amt));
  return `rgb(${cl((n >> 16) & 255)},${cl((n >> 8) & 255)},${cl(n & 255)})`;
}

/** A shaded sphere — the workhorse for fruit, veg, cookies, nuts, berries. */
function ball(ctx, cx, cy, r, c, s) {
  const dark = shade(c, -45);
  const hi = shade(c, 50);
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy > r * r + r * 0.35) continue;
      px(ctx, x, y, (dx + dy > r * 0.6) ? dark : c, s);
    }
  }
  if (r >= 2) px(ctx, cx - Math.round(r * 0.4), cy - Math.round(r * 0.45), hi, s);
}

// ── seeded randomness (stable per category) ───────────────────────────────
function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── vessels ───────────────────────────────────────────────────────────────
function basket(ctx, s, { x0 = 5, x1 = 26, y0 = 17, light = '#C98A3E', dark = '#8F5B1E', rim = '#B0762C' } = {}) {
  hline(ctx, y0, x0, x1, rim, s);
  hline(ctx, y0 + 1, x0, x1, light, s);
  const h = BASE_Y - y0 - 1;
  for (let i = 2; i <= h + 1; i++) {
    const y = y0 + i;
    const inset = Math.round(((i - 2) / Math.max(1, h - 1)) * 3);
    const weft = (i % 2) ? light : dark;
    hline(ctx, y, x0 + inset, x1 - inset, weft, s);
    for (let x = x0 + inset + ((i % 2) ? 1 : 2); x <= x1 - inset; x += 3) {
      px(ctx, x, y, (i % 2) ? dark : light, s);
    }
  }
  vline(ctx, x0, y0, y0 + 2, dark, s);
  vline(ctx, x1, y0, y0 + 2, dark, s);
}

function bowl(ctx, s, { cx = 16, rx = 12, y0 = 18, color = '#EFE7D4', dark = '#C3B79B', rim = '#8B7C5F' } = {}) {
  const h = BASE_Y - y0;
  for (let i = 0; i <= h; i++) {
    const t = i / h;
    const w = Math.max(3, Math.round(rx * Math.sqrt(Math.max(0, 1 - 0.82 * t * t))));
    hline(ctx, y0 + i, cx - w, cx + w, i === 0 ? rim : (i > h - 2 ? dark : color), s);
  }
}

function jar(ctx, s, { x0 = 10, x1 = 21, y0 = 12, glass = '#DCE9E2', lid = '#8C6A3F' } = {}) {
  box(ctx, x0 - 1, y0 - 4, x1 + 1, y0 - 2, lid, s);            // lid
  hline(ctx, y0 - 4, x0 - 1, x1 + 1, shade(lid, 35), s);
  hline(ctx, y0 - 1, x0, x1, shade(glass, -35), s);            // neck ring
  box(ctx, x0, y0, x1, BASE_Y, glass, s);                      // body
  vline(ctx, x1, y0, BASE_Y, shade(glass, -40), s);            // right shadow
  vline(ctx, x0 + 1, y0 + 1, BASE_Y - 2, shade(glass, 40), s); // left glare
  hline(ctx, BASE_Y, x0, x1, shade(glass, -40), s);
}

function tinCan(ctx, s, { x0 = 10, x1 = 21, y0 = 13, body = '#B9BEC4', band = '#C0392B' } = {}) {
  hline(ctx, y0, x0, x1, shade(body, 45), s);
  hline(ctx, y0 + 1, x0, x1, body, s);
  box(ctx, x0, y0 + 2, x1, BASE_Y, body, s);
  box(ctx, x0, y0 + 4, x1, BASE_Y - 3, band, s);               // label
  hline(ctx, y0 + 4, x0, x1, shade(band, 35), s);
  for (let y = y0 + 6; y <= BASE_Y - 5; y += 2) hline(ctx, y, x0 + 2, x1 - 2, shade(band, 55), s);
  vline(ctx, x1, y0 + 2, BASE_Y, shade(body, -45), s);
  vline(ctx, x0 + 1, y0 + 2, BASE_Y, shade(body, 40), s);
  hline(ctx, BASE_Y, x0, x1, shade(body, -45), s);
}

function carton(ctx, s, { x0 = 10, x1 = 21, y0 = 9, body = '#F2EDE0', accent = '#6E8259' } = {}) {
  for (let i = 0; i < 3; i++) hline(ctx, y0 + i, x0 + 3 - i, x1 - 3 + i, shade(body, -20), s); // peak
  box(ctx, x0, y0 + 3, x1, BASE_Y, body, s);
  box(ctx, x0 + 1, y0 + 6, x1 - 1, y0 + 12, accent, s);        // label panel
  vline(ctx, x1, y0 + 3, BASE_Y, shade(body, -35), s);
  hline(ctx, BASE_Y, x0, x1, shade(body, -35), s);
}

function mug(ctx, s, { x0 = 9, x1 = 21, y0 = 15, body = '#E8E2D2', handle } = {}) {
  const hc = handle || shade(body, -30);
  box(ctx, x0, y0, x1, BASE_Y, body, s);
  hline(ctx, y0, x0, x1, shade(body, -35), s);
  vline(ctx, x1, y0, BASE_Y, shade(body, -35), s);
  vline(ctx, x0 + 1, y0 + 2, BASE_Y - 2, shade(body, 35), s);
  hline(ctx, BASE_Y, x0, x1, shade(body, -35), s);
  // handle
  vline(ctx, x1 + 3, y0 + 3, y0 + 7, hc, s);
  px(ctx, x1 + 1, y0 + 2, hc, s); px(ctx, x1 + 2, y0 + 2, hc, s);
  px(ctx, x1 + 1, y0 + 8, hc, s); px(ctx, x1 + 2, y0 + 8, hc, s);
}

function bottle(ctx, s, { cx = 16, w = 5, y0 = 5, body = '#7FA05A', cap = '#33302A', labelC = '#F3EADA' } = {}) {
  box(ctx, cx - 1, y0, cx + 1, y0 + 1, cap, s);                // cap
  box(ctx, cx - 1, y0 + 2, cx + 1, y0 + 6, body, s);           // neck
  for (let i = 0; i < 3; i++) hline(ctx, y0 + 7 + i, cx - 2 - i, cx + 2 + i, body, s); // shoulder
  box(ctx, cx - w, y0 + 10, cx + w, BASE_Y, body, s);
  box(ctx, cx - w, y0 + 13, cx + w, y0 + 18, labelC, s);       // label
  vline(ctx, cx + w, y0 + 10, BASE_Y, shade(body, -45), s);
  vline(ctx, cx - w + 1, y0 + 11, BASE_Y - 1, shade(body, 45), s);
  hline(ctx, BASE_Y, cx - w, cx + w, shade(body, -45), s);
}

function bag(ctx, s, { x0 = 8, x1 = 23, y0 = 10, body = '#E0A32E', accent = '#33302A' } = {}) {
  for (let x = x0; x <= x1; x += 2) { px(ctx, x, y0, shade(body, -40), s); px(ctx, x + 1, y0 + 1, shade(body, -40), s); }
  hline(ctx, y0 + 1, x0, x1, shade(body, -25), s);             // crimp
  box(ctx, x0, y0 + 2, x1, BASE_Y, body, s);
  box(ctx, x0 + 2, y0 + 6, x1 - 2, y0 + 11, accent, s);        // label block
  vline(ctx, x1, y0 + 2, BASE_Y, shade(body, -45), s);
  vline(ctx, x0 + 1, y0 + 3, BASE_Y - 1, shade(body, 40), s);
  hline(ctx, BASE_Y, x0, x1, shade(body, -45), s);
}

function packBox(ctx, s, { x0 = 9, x1 = 22, y0 = 8, body = '#C0392B', panel = '#F3EADA' } = {}) {
  box(ctx, x0, y0, x1, BASE_Y, body, s);
  hline(ctx, y0, x0, x1, shade(body, 40), s);
  box(ctx, x0 + 2, y0 + 4, x1 - 2, y0 + 11, panel, s);
  vline(ctx, x1, y0, BASE_Y, shade(body, -45), s);
  hline(ctx, BASE_Y, x0, x1, shade(body, -45), s);
}

function plate(ctx, s, { cx = 16, rx = 13, y0 = 23, color = '#F5F1E6' } = {}) {
  hline(ctx, y0, cx - rx + 3, cx + rx - 3, shade(color, 25), s);
  hline(ctx, y0 + 1, cx - rx, cx + rx, color, s);
  hline(ctx, y0 + 2, cx - rx + 1, cx + rx - 1, shade(color, -25), s);
  hline(ctx, y0 + 3, cx - rx + 4, cx + rx - 4, shade(color, -45), s);
}

function sack(ctx, s, { cx = 16, y0 = 12, body = '#DCCBA4', tie = '#8F5B1E' } = {}) {
  box(ctx, cx - 3, y0, cx + 3, y0 + 2, body, s);               // gathered top
  hline(ctx, y0 + 3, cx - 4, cx + 4, tie, s);                  // tie
  for (let i = 0; i <= BASE_Y - y0 - 4; i++) {
    const w = Math.min(9, 4 + i);
    hline(ctx, y0 + 4 + i, cx - w, cx + w, i % 4 === 3 ? shade(body, -22) : body, s);
  }
  vline(ctx, cx + 9, y0 + 9, BASE_Y, shade(body, -45), s);
  hline(ctx, BASE_Y, cx - 9, cx + 9, shade(body, -45), s);
}

function crate(ctx, s, { x0 = 7, x1 = 24, y0 = 14, body = '#B98A55' } = {}) {
  box(ctx, x0, y0, x1, BASE_Y, body, s);
  for (let y = y0 + 3; y < BASE_Y; y += 4) hline(ctx, y, x0, x1, shade(body, -40), s);
  vline(ctx, x0, y0, BASE_Y, shade(body, -50), s);
  vline(ctx, x1, y0, BASE_Y, shade(body, -50), s);
  hline(ctx, y0, x0, x1, shade(body, 35), s);
  hline(ctx, BASE_Y, x0, x1, shade(body, -50), s);
}

// ── contents ──────────────────────────────────────────────────────────────
/** A heaped pile of shaded balls sitting on a rim — produce, nuts, candy. */
function mound(ctx, s, rng, { cx = 16, rimY = 17, spread = 9, colors, count = 7, rMin = 2, rMax = 3 }) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;
    const r = rMin + Math.floor(rng() * (rMax - rMin + 1));
    pts.push({
      x: cx + Math.round(t * spread),
      y: rimY - 1 - Math.round((1 - t * t) * 3) - Math.round(rng() * 1.4),
      r,
      c: colors[i % colors.length],
      k: Math.abs(t),
    });
  }
  pts.sort((a, b) => b.k - a.k);   // outside first so the middle overlaps forward
  for (const p of pts) ball(ctx, p.x, p.y, p.r, p.c, s);
  return pts;
}

function leafTop(ctx, s, x, y, c = '#5E8A3C') {
  px(ctx, x, y, c, s); px(ctx, x - 1, y - 1, c, s); px(ctx, x + 1, y - 1, c, s);
  px(ctx, x, y - 2, shade(c, 30), s);
}

function steam(ctx, s, { cx = 16, y = 12, color = 'rgba(255,255,255,0.75)' }) {
  for (const dx of [-4, 0, 4]) {
    for (let i = 0; i < 4; i++) px(ctx, cx + dx + (i % 2 ? 1 : 0), y - i * 2, color, s);
  }
}

function specks(ctx, s, rng, { cx, cy, r, color, n = 4 }) {
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2;
    const d = rng() * (r - 0.6);
    px(ctx, Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), color, s);
  }
}

function noodleSwirl(ctx, s, { cx = 16, y0 = 19, rows = 4, color = '#F2D98B' }) {
  for (let i = 0; i < rows; i++) {
    const y = y0 + i;
    const w = 9 - i;
    for (let x = cx - w; x <= cx + w; x++) {
      px(ctx, x, y + ((x + i) % 3 === 0 ? -1 : 0), (x + i) % 2 ? color : shade(color, -30), s);
    }
  }
}

// ── backdrops ─────────────────────────────────────────────────────────────
function backdrop(ctx, s, wall, floor) {
  box(ctx, 0, 0, G - 1, BASE_Y, wall, s);
  hline(ctx, 3, 0, G - 1, shade(wall, 18), s);
  hline(ctx, 4, 0, G - 1, shade(wall, 10), s);
  box(ctx, 0, BASE_Y + 1, G - 1, G - 1, floor, s);
  hline(ctx, BASE_Y + 1, 0, G - 1, shade(floor, -35), s);
  hline(ctx, BASE_Y + 1, 6, 25, shade(floor, -60), s);   // contact shadow
  hline(ctx, BASE_Y + 2, 9, 22, shade(floor, -45), s);
}

// ── the scenes, one per shelf category ────────────────────────────────────
export const SCENES = {
  veggies: (ctx, s, rng) => {
    backdrop(ctx, s, '#DCE7CC', '#B7C79E');
    const pts = mound(ctx, s, rng, {
      rimY: 17, colors: ['#D94F3D', '#E8892B', '#6FA83C', '#8CC152', '#C0392B', '#4F8A2E', '#E5B93C'],
      count: 7, rMin: 2, rMax: 3,
    });
    for (const p of pts.slice(0, 3)) leafTop(ctx, s, p.x, p.y - p.r);
    basket(ctx, s, {});
    // a carrot leaning out over the rim
    for (let i = 0; i < 4; i++) hline(ctx, 15 + i, 22 + i, 25 - i, '#E8892B', s);
    leafTop(ctx, s, 24, 14);
  },

  fruits: (ctx, s, rng) => {
    backdrop(ctx, s, '#F6E2DC', '#D8B7AC');
    mound(ctx, s, rng, {
      rimY: 17, colors: ['#D0342C', '#F0A03A', '#E8C33B', '#8E4FA8', '#D94F6A', '#E86A2B', '#C0392B'],
      count: 7, rMin: 2, rMax: 3,
    });
    leafTop(ctx, s, 13, 11); leafTop(ctx, s, 20, 12);
    basket(ctx, s, {});
    // loose berries spilling in front of the basket
    ball(ctx, 6, 24, 1.6, '#4B2E83', s);
    ball(ctx, 9, 25, 1.4, '#2F4E9B', s);
    ball(ctx, 25, 24, 1.6, '#B02A4A', s);
    ball(ctx, 27, 25, 1.3, '#4B2E83', s);
  },

  seasoning: (ctx, s) => {
    backdrop(ctx, s, '#EFE0C4', '#CDB489');
    const jars = [[6, '#C0392B', 15], [16, '#E0A32E', 13], [26, '#7B4B2A', 16]];
    for (const [cx, fill, top] of jars) {
      box(ctx, cx - 3, top - 3, cx + 3, top - 2, '#8C6A3F', s);          // cork
      hline(ctx, top - 3, cx - 3, cx + 3, '#A9855A', s);
      box(ctx, cx - 3, top - 1, cx + 3, BASE_Y, '#DCE9E2', s);           // glass
      box(ctx, cx - 3, top + 2, cx + 3, BASE_Y - 1, fill, s);            // ground spice
      for (let y = top + 3; y < BASE_Y - 1; y += 2) px(ctx, cx + ((y % 4) ? 1 : -1), y, shade(fill, 40), s);
      vline(ctx, cx - 2, top, BASE_Y - 1, 'rgba(255,255,255,0.45)', s);  // glare
      vline(ctx, cx + 3, top - 1, BASE_Y, shade('#DCE9E2', -45), s);
      hline(ctx, BASE_Y, cx - 3, cx + 3, '#8A7F68', s);
    }
    // a scatter of loose spice on the counter
    for (const [x, c] of [[11, '#C0392B'], [12, '#E0A32E'], [21, '#7B4B2A'], [20, '#E0A32E']]) px(ctx, x, BASE_Y, c, s);
  },

  teas_cocoa: (ctx, s) => {
    backdrop(ctx, s, '#E6DCC6', '#C2AF8B');
    steam(ctx, s, { cx: 15, y: 13 });
    mug(ctx, s, { body: '#F0EAD8' });
    box(ctx, 10, 16, 20, 18, '#8C5A2B', s);                              // the brew
    hline(ctx, 16, 10, 20, '#A9723A', s);
    // tea-bag string and tag over the rim
    vline(ctx, 19, 16, 20, '#EFE7D4', s);
    box(ctx, 18, 20, 21, 22, '#E0A32E', s);
    leafTop(ctx, s, 24, 24, '#4F8A2E'); leafTop(ctx, s, 7, 25, '#4F8A2E');
  },

  coffee: (ctx, s, rng) => {
    backdrop(ctx, s, '#E3D6C3', '#BCA383');
    steam(ctx, s, { cx: 15, y: 13 });
    mug(ctx, s, { body: '#F3EADA' });
    box(ctx, 10, 16, 20, 18, '#4A2C17', s);
    hline(ctx, 16, 11, 19, '#6B4023', s);
    for (const [x, y] of [[5, 24], [8, 25], [25, 24], [27, 25], [23, 25]]) {
      ball(ctx, x, y, 1.6, '#5B3418', s);
      px(ctx, x, y, '#3A2110', s);                                       // the bean's crease
      if (rng() > 0.5) px(ctx, x, y - 1, '#3A2110', s);
    }
  },

  beverages: (ctx, s) => {
    backdrop(ctx, s, '#D5E6EC', '#A9C4CE');
    bottle(ctx, s, { cx: 8, w: 3, y0: 6, body: '#4A8FBF', labelC: '#F3EADA' });
    tinCan(ctx, s, { x0: 14, x1: 21, y0: 15, body: '#C9CDD2', band: '#C0392B' });
    // a glass with a straw
    box(ctx, 24, 16, 29, BASE_Y, 'rgba(255,255,255,0.55)', s);
    box(ctx, 24, 19, 29, BASE_Y - 1, '#E0A32E', s);
    vline(ctx, 24, 16, BASE_Y, '#EFF6F8', s);
    vline(ctx, 29, 16, BASE_Y, shade('#A9C4CE', -30), s);
    for (let i = 0; i < 5; i++) px(ctx, 27 + (i % 2 ? 0 : 1), 13 + i, '#C0392B', s);
  },

  plant_based: (ctx, s) => {
    backdrop(ctx, s, '#DCE9D2', '#B0C69B');
    carton(ctx, s, { x0: 11, x1: 22, y0: 8, body: '#F2EDE0', accent: '#6E8259' });
    // sprout emblem on the carton panel
    vline(ctx, 16, 16, 20, '#3F6B24', s);
    for (const d of [-1, 1]) {
      px(ctx, 16 + d, 17, '#8CC152', s);
      px(ctx, 16 + d * 2, 16, '#8CC152', s);
      px(ctx, 16 + d * 2, 17, '#6FA83C', s);
    }
    // a block of tofu in front, one slice cut off it
    box(ctx, 3, 19, 10, BASE_Y, '#F6F1E2', s);
    hline(ctx, 19, 3, 10, '#FFFDF4', s);
    vline(ctx, 7, 20, BASE_Y - 1, '#E2DAC4', s);        // the cut
    vline(ctx, 10, 19, BASE_Y, '#D6CDB4', s);
    hline(ctx, BASE_Y, 3, 10, '#C4B99C', s);
    leafTop(ctx, s, 25, 25, '#4F8A2E');
  },

  pasta: (ctx, s, rng) => {
    backdrop(ctx, s, '#EFE3C8', '#CBB68C');
    jar(ctx, s, { x0: 10, x1: 21, y0: 10, glass: '#E4EFE9', lid: '#8C6A3F' });
    for (let x = 11; x <= 20; x++) {                                      // dry strands
      const top = 11 + (rng() > 0.5 ? 0 : 1);
      vline(ctx, x, top, BASE_Y - 1, x % 2 ? '#EFCF7E' : '#E0B85C', s);
    }
    vline(ctx, 11, 12, BASE_Y - 2, 'rgba(255,255,255,0.4)', s);
    // a piece of penne and a bow-tie resting on the counter
    for (let i = 0; i < 3; i++) hline(ctx, 24 + i, 4 + i, 8 + i, '#EFCF7E', s);
    px(ctx, 24, 24, '#E0A32E', s); px(ctx, 26, 24, '#E0A32E', s);
    px(ctx, 25, 25, '#EFCF7E', s); px(ctx, 24, BASE_Y, '#E0A32E', s); px(ctx, 26, BASE_Y, '#E0A32E', s);
  },

  ramen: (ctx, s) => {
    backdrop(ctx, s, '#E9D8C6', '#C4A98B');
    steam(ctx, s, { cx: 16, y: 15 });
    box(ctx, 6, 18, 26, 19, '#8C4A22', s);                                // broth
    noodleSwirl(ctx, s, { cx: 16, y0: 19, rows: 3, color: '#F2D98B' });
    ball(ctx, 10, 20, 2.4, '#FBF3DC', s);                                 // half an egg
    ball(ctx, 10, 20, 1.2, '#E8A33A', s);
    box(ctx, 20, 18, 24, 21, '#2E3A2A', s);                               // nori
    px(ctx, 24, 18, '#46583F', s);
    ball(ctx, 16, 18, 1.6, '#6FA83C', s);                                 // scallion
    bowl(ctx, s, { cx: 16, rx: 12, y0: 20, color: '#C0392B', dark: '#8E2A20', rim: '#F3EADA' });
    // a pair of chopsticks standing in the bowl
    for (let i = 0; i < 12; i++) {
      const y = 9 + i;
      px(ctx, 22 + Math.round(i * 0.35), y, '#C9A06A', s);
      px(ctx, 24 + Math.round(i * 0.35), y, '#A97A45', s);
    }
  },

  canned: (ctx, s) => {
    backdrop(ctx, s, '#E2E5E8', '#B4BAC0');
    tinCan(ctx, s, { x0: 2, x1: 9, y0: 16, body: '#B9BEC4', band: '#6E8259' });
    tinCan(ctx, s, { x0: 12, x1: 19, y0: 12, body: '#C6CBD0', band: '#C0392B' });
    tinCan(ctx, s, { x0: 22, x1: 29, y0: 17, body: '#B9BEC4', band: '#E0A32E' });
  },

  sweets: (ctx, s, rng) => {
    backdrop(ctx, s, '#F3E0E4', '#D5B4B9');
    plate(ctx, s, { cx: 16, rx: 13, y0: 22, color: '#F8F4EA' });
    // three cookies, deliberately three different doughs
    const cookies = [[8, 20, '#C98A3E', '#4A2C17'], [16, 18, '#E3B673', '#7B4B2A'], [24, 20, '#8C5A3C', '#F3EADA']];
    for (const [cx, cy, dough, chip] of cookies) {
      ball(ctx, cx, cy, 3.4, dough, s);
      specks(ctx, s, rng, { cx, cy, r: 2.6, color: chip, n: 5 });
    }
    // a couple of candies at the front
    ball(ctx, 5, 24, 1.6, '#D94F6A', s);
    ball(ctx, 27, 24, 1.6, '#8E4FA8', s);
  },

  snacks: (ctx, s) => {
    backdrop(ctx, s, '#F0E4C8', '#CFB98A');
    bag(ctx, s, { x0: 9, x1: 23, y0: 9, body: '#E0A32E', accent: '#33302A' });
    hline(ctx, 20, 11, 21, '#F6DCA0', s);
    // chips that fell out
    for (const [x, y, c] of [[4, 23, '#E8C77A'], [6, BASE_Y, '#D9B15E'], [26, 24, '#E8C77A'], [28, BASE_Y, '#D9B15E']]) {
      px(ctx, x, y, c, s); px(ctx, x + 1, y, c, s); px(ctx, x, y - 1, shade(c, 30), s);
    }
  },

  dairy: (ctx, s) => {
    backdrop(ctx, s, '#E4EAF0', '#B7C2CE');
    carton(ctx, s, { x0: 6, x1: 16, y0: 8, body: '#FAF7EE', accent: '#4A8FBF' });
    // cheese wedge
    for (let i = 0; i < 7; i++) hline(ctx, 20 + i, 19, 19 + i * 1.4, '#E8B93C', s);
    px(ctx, 22, 23, '#C79A24', s); px(ctx, 24, 25, '#C79A24', s);
    // an egg
    ball(ctx, 28, 24, 2.2, '#F6ECD8', s);
  },

  meat: (ctx, s, rng) => {
    backdrop(ctx, s, '#EFDCD8', '#CFA9A2');
    plate(ctx, s, { cx: 16, rx: 12, y0: 22 });
    // a bone-in steak: a rounded cut with a cream fat rim and a bone through it
    const widths = [5, 7, 8, 8, 8, 7, 5];
    widths.forEach((w, i) => {
      const y = 14 + i;
      hline(ctx, y, 13 - w, 13 + w, '#A83A30', s);
      px(ctx, 13 - w, y, '#F0E2C8', s);
      px(ctx, 13 + w, y, '#F0E2C8', s);
    });
    hline(ctx, 14, 8, 18, '#F0E2C8', s);                                   // fat cap along the top
    hline(ctx, 20, 8, 18, '#7E241F', s);                                   // seared underside
    for (let i = 0; i < 7; i++) {                                          // marbling
      px(ctx, 9 + Math.floor(rng() * 9), 15 + Math.floor(rng() * 5), '#C9564C', s);
    }
    box(ctx, 20, 16, 24, 18, '#F5EFE0', s);                                // the bone
    px(ctx, 24, 15, '#F5EFE0', s); px(ctx, 24, 19, '#F5EFE0', s);
    px(ctx, 25, 16, '#E0D6C0', s); px(ctx, 25, 18, '#E0D6C0', s);
    hline(ctx, 18, 20, 24, '#DED2B8', s);
  },

  seafood: (ctx, s) => {
    backdrop(ctx, s, '#D8E8EC', '#AAC6CE');
    plate(ctx, s, { cx: 16, rx: 13, y0: 23 });
    // fish body
    for (let i = 0; i < 7; i++) {
      const w = Math.round(9 - Math.abs(3 - i) * 2.4);
      hline(ctx, 16 + i, 14 - w, 14 + w, i < 3 ? '#7FB3C8' : '#5C93AC', s);
    }
    for (let i = 0; i < 4; i++) hline(ctx, 17 + i, 23 + Math.abs(1.5 - i), 26, '#7FB3C8', s);  // tail
    px(ctx, 9, 18, '#33302A', s);                                          // eye
    for (const [x, y] of [[14, 19], [17, 20], [12, 21]]) px(ctx, x, y, '#3E6E86', s);
    ball(ctx, 26, 24, 2, '#E8C33B', s);                                    // lemon wedge
  },

  bakery: (ctx, s) => {
    backdrop(ctx, s, '#EEE0C6', '#CBAF85');
    // a domed loaf: narrow at the crown, square-shouldered at the board
    const widths = [4, 6, 7, 8, 8, 8, 8, 8];
    widths.forEach((w, i) => {
      const y = 19 + i;
      hline(ctx, y, 11 - w, 11 + w, i === 0 ? '#DFAF6A' : '#C88C44', s);
    });
    hline(ctx, BASE_Y, 3, 19, '#9C6A2C', s);                              // baked base
    for (let i = 0; i < 3; i++) {                                          // scored slashes
      px(ctx, 7 + i * 4, 20 + i, '#8C5A2B', s);
      px(ctx, 8 + i * 4, 20 + i, '#8C5A2B', s);
      px(ctx, 8 + i * 4, 21 + i, '#8C5A2B', s);
    }
    // two cut slices standing behind the loaf
    for (const sx of [21, 26]) {
      box(ctx, sx, 15, sx + 4, BASE_Y, '#F0DDB4', s);                      // crumb
      hline(ctx, 15, sx, sx + 4, '#C88C44', s);                            // crust top
      vline(ctx, sx, 15, BASE_Y, '#C88C44', s);
      vline(ctx, sx + 4, 15, BASE_Y, '#A9702F', s);
      hline(ctx, BASE_Y, sx, sx + 4, '#A9702F', s);
      px(ctx, sx + 2, 19, '#E2CBA0', s); px(ctx, sx + 1, 22, '#E2CBA0', s);
    }
  },

  grains: (ctx, s, rng) => {
    backdrop(ctx, s, '#EDE6D2', '#C8BC9A');
    sack(ctx, s, { cx: 15, y0: 11, body: '#DCCBA4', tie: '#8F5B1E' });
    box(ctx, 12, 15, 18, 19, '#F4EEDC', s);                                // open mouth of the sack
    for (let i = 0; i < 14; i++) px(ctx, 12 + Math.floor(rng() * 7), 15 + Math.floor(rng() * 5), '#E6DCBE', s);
    // a heap of loose grain poured out beside it, individual kernels visible
    const heap = [[24, BASE_Y, 6], [24, BASE_Y - 1, 5], [25, BASE_Y - 2, 3], [25, BASE_Y - 3, 2]];
    for (const [x, y, w] of heap) hline(ctx, y, x, x + w, '#F2EAD2', s);
    for (let i = 0; i < 9; i++) {
      px(ctx, 24 + Math.floor(rng() * 6), BASE_Y - Math.floor(rng() * 3), '#D8CBA6', s);
    }
    hline(ctx, BASE_Y + 1, 24, 30, '#C8BC9A', s);
  },

  baking: (ctx, s, rng) => {
    backdrop(ctx, s, '#F2EBDD', '#D2C6AC');
    // a paper flour sack with a folded top and a banded label
    box(ctx, 4, 11, 16, BASE_Y, '#E9DCBE', s);
    hline(ctx, 11, 4, 16, '#CDBD99', s);                                   // folded seam
    hline(ctx, 12, 4, 16, '#D9CAA8', s);
    box(ctx, 5, 15, 15, 21, '#F7F1E2', s);                                 // label panel
    hline(ctx, 16, 5, 15, '#C0392B', s);
    hline(ctx, 20, 5, 15, '#C0392B', s);
    for (let x = 7; x <= 13; x += 2) px(ctx, x, 18, '#B9A987', s);         // label lettering
    vline(ctx, 16, 11, BASE_Y, '#C6B692', s);
    hline(ctx, BASE_Y, 4, 16, '#B6A582', s);
    // flour dusted across the counter
    for (let i = 0; i < 14; i++) px(ctx, 3 + Math.floor(rng() * 22), 24 + Math.floor(rng() * 3), '#FBF7EC', s);
    // rolling pin above, egg in front
    box(ctx, 20, 14, 28, 16, '#C98A3E', s);
    hline(ctx, 14, 21, 27, '#DDA45C', s);
    box(ctx, 18, 15, 19, 15, '#8C6A3F', s); box(ctx, 29, 15, 30, 15, '#8C6A3F', s);
    ball(ctx, 24, 22, 2.6, '#EFDCB4', s);                                  // egg — warm enough to read against the flour
  },

  condiments: (ctx, s) => {
    backdrop(ctx, s, '#EDE7D6', '#C9C0A4');
    bottle(ctx, s, { cx: 6, w: 3, y0: 8, body: '#C0392B', cap: '#33302A', labelC: '#F3EADA' });
    bottle(ctx, s, { cx: 16, w: 3, y0: 6, body: '#E0A32E', cap: '#33302A', labelC: '#F3EADA' });
    bottle(ctx, s, { cx: 26, w: 3, y0: 9, body: '#4A2C17', cap: '#33302A', labelC: '#F3EADA' });
  },

  oils: (ctx, s) => {
    backdrop(ctx, s, '#E8EBD6', '#C2C79E');
    bottle(ctx, s, { cx: 11, w: 4, y0: 4, body: '#8FA83C', cap: '#33302A', labelC: '#F3EADA' });
    bottle(ctx, s, { cx: 23, w: 3, y0: 10, body: '#6B3A1E', cap: '#33302A', labelC: '#F3EADA' });
    // a pour catching the light
    for (let i = 0; i < 4; i++) px(ctx, 16 + i, 12 + i, '#E8C33B', s);
  },

  frozen: (ctx, s) => {
    backdrop(ctx, s, '#D8EAF2', '#A9C8D8');
    // a frosted block
    box(ctx, 8, 12, 24, BASE_Y, '#CFE6F2', s);
    hline(ctx, 12, 8, 24, '#EAF6FC', s);
    vline(ctx, 9, 13, BASE_Y - 1, '#EAF6FC', s);
    vline(ctx, 24, 12, BASE_Y, '#8FB6CC', s);
    hline(ctx, BASE_Y, 8, 24, '#8FB6CC', s);
    // snowflake
    const cx = 16, cy = 19;
    vline(ctx, cx, cy - 4, cy + 4, '#5C93AC', s);
    hline(ctx, cy, cx - 4, cx + 4, '#5C93AC', s);
    for (let i = 1; i <= 3; i++) {
      px(ctx, cx - i, cy - i, '#5C93AC', s); px(ctx, cx + i, cy + i, '#5C93AC', s);
      px(ctx, cx + i, cy - i, '#5C93AC', s); px(ctx, cx - i, cy + i, '#5C93AC', s);
    }
    for (const [x, y] of [[4, 16], [28, 14], [5, 22], [27, 21]]) px(ctx, x, y, '#FFFFFF', s);
  },

  breakfast: (ctx, s, rng) => {
    backdrop(ctx, s, '#F0E2C8', '#CFB78C');
    packBox(ctx, s, { x0: 3, x1: 15, y0: 8, body: '#C0392B', panel: '#F3EADA' });
    for (let i = 0; i < 5; i++) px(ctx, 6 + i * 2, 14 + (i % 2), '#E0A32E', s);
    // a bowl of cereal loops
    for (const [x, y, c] of [[20, 20, '#E0A32E'], [24, 20, '#C0392B'], [22, 18, '#8CC152'], [26, 21, '#8E4FA8']]) {
      ball(ctx, x, y, 1.8, c, s);
      px(ctx, x, y, '#F0E2C8', s);                                         // the hole in the loop
    }
    bowl(ctx, s, { cx: 23, rx: 8, y0: 21, color: '#F0EAD8', dark: '#CBBFA4', rim: '#8B7C5F' });
    if (rng() > 0.5) px(ctx, 19, 22, '#FFFFFF', s);
  },

  nuts: (ctx, s, rng) => {
    backdrop(ctx, s, '#EDE0C8', '#CBB48A');
    mound(ctx, s, rng, {
      cx: 16, rimY: 19, spread: 7,
      colors: ['#B07C4A', '#8C5A2B', '#D6B27A', '#A9713F', '#6B4423', '#C79A5E'],
      count: 7, rMin: 1, rMax: 2,
    });
    bowl(ctx, s, { cx: 16, rx: 10, y0: 19, color: '#B98A55', dark: '#8F6538', rim: '#D8AE76' });
    ball(ctx, 6, 24, 1.6, '#8C5A2B', s);
    ball(ctx, 26, 25, 1.6, '#D6B27A', s);
  },

  other: (ctx, s) => {
    backdrop(ctx, s, '#E7E1D3', '#C2B9A2');
    crate(ctx, s, { x0: 7, x1: 24, y0: 14, body: '#B98A55' });
    // an unlabelled tag — nothing claimed about what's inside
    box(ctx, 12, 17, 19, 21, '#F3EADA', s);
    hline(ctx, 19, 13, 18, '#B4A98E', s);
  },
};

// ── render + cache ────────────────────────────────────────────────────────
const cache = new Map();

/**
 * A PNG data URL of the pixel scene for one shelf category.
 * Cached per (category, size) — drawing is cheap but a grid of 25 tiles
 * re-rendering on every keystroke in the pantry is not.
 */
export function categoryIconUrl(catId, { size = DEFAULT_SIZE } = {}) {
  if (typeof document === 'undefined') return '';
  const key = `${catId}:${size}`;
  if (cache.has(key)) return cache.get(key);

  const scene = SCENES[catId] || SCENES.other;
  const s = Math.max(1, Math.round(size / G));
  const canvas = document.createElement('canvas');
  canvas.width = G * s;
  canvas.height = G * s;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let url = '';
  try {
    scene(ctx, s, mulberry32(hashStr(String(catId))));
    url = canvas.toDataURL('image/png');
  } catch { url = ''; }

  cache.set(key, url);
  return url;
}

export { G as ICON_GRID };
