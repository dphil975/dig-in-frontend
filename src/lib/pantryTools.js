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

import { ingredientText } from '../components/recipe/RecipeBoostSections';

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
