/* pantry/freshness.js — consolidated Freshness/Scanned-Item module.
   Merged from: freshness.js + scannedItemRecipes.js (src/lib/ flat directory
   -> src/lib/pantry/). Both old files re-export from this one so every
   existing import path keeps working. No export-name conflicts between the
   two originals.

   Import paths adjusted for the new location one level deeper than src/lib/:
     - ingredientText now comes from '../../components/recipe/RecipeBoostSections'
     - priceRecipe now comes from './budgetTarget' (tierBudget.js, which used
       to hold priceRecipe, was merged into src/lib/pantry/budgetTarget.js)
     - BASE_ITEMS/REGIONS/buildFusion now come from '../fusionEngine'
       (fusionEngine.js itself was not part of this consolidation and stays
       in the flat src/lib/ directory). */

import { ingredientText } from '../../components/recipe/RecipeBoostSections';
import { priceRecipe } from './budgetTarget';
import { BASE_ITEMS, REGIONS, buildFusion } from '../fusionEngine';

// ════════════════════════════════════════════════════════════════════════
// From freshness.js
// ════════════════════════════════════════════════════════════════════════

import { categorize, estimateShelfLife, freshnessFor, freshnessLabel, expiringItems } from './shelfLife';

export { categorize, estimateShelfLife, freshnessFor, freshnessLabel, expiringItems };

// ════════════════════════════════════════════════════════════════════════
// From scannedItemRecipes.js
// ════════════════════════════════════════════════════════════════════════

/* scannedItemRecipes.js — turns a scanned barcode into more than a pantry
   entry: real recipes that use it, what it actually costs to cook with vs.
   buy the finished thing, a few cuisine-fusion takes on it, and a log the
   shopper can come back to.

   Four real pieces, each built on something this app already has and trusts:
     1. recipesForProduct()   — matches the scanned product against the SAME
        575-recipe corpus (recipeBooks.js) RecipeCards/MealPlan already read,
        via a keyword matcher (see productMatchesIngredient — Open Food
        Facts product names are branded/verbose ("Chobani Greek Yogurt"), the
        opposite direction pantryTools.js's itemCoversIngredient() assumes
        (short pantry name found INSIDE a longer ingredient line), so this
        matches on shared significant words instead of substring containment.
     2. priceBreakdownForProduct() — prices each matched recipe with the SAME
        hand-seeded, honestly-labeled-as-ballpark grocery engine RecipeFull's
        TierBudgetPanel already uses (tierBudget.js), against the REAL price
        the shopper entered for the scanned item. No invented numbers.
     3. guessFusionBase() + fusionEngine.js's real buildFusion() — the
        scanned item's category (bread/rice/tortilla/pasta) picks a sensible
        starting BASE_ITEM, region is the shopper's own choice.
     4. saveScanReference()/loadScanReferences() — so "the user can reference
        their requests" is real: every scan's recipe matches + price
        breakdown + fusion pick, kept in a small local log, reopenable. */

const NOISE_WORDS = new Set([
  'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons',
  'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds', 'gram', 'grams', 'kg',
  'ml', 'liter', 'liters', 'clove', 'cloves', 'can', 'cans', 'jar', 'jars',
  'slice', 'slices', 'piece', 'pieces', 'pinch', 'dash', 'large', 'small',
  'medium', 'fresh', 'chopped', 'diced', 'minced', 'sliced', 'ground', 'whole',
  'organic', 'natural', 'original', 'classic', 'the', 'and', 'with', 'for',
]);

function significantWords(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s%]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !NOISE_WORDS.has(w) && !/^\d+$/.test(w));
}

/** A keyword heuristic, not exact matching — same honesty tier as
    tierBudget.js's BUCKETS keyword pricing. A shared word of real length (4+
    for an exact match, or a 5+-letter word contained in a longer compound
    like "yogurt"/"greek-yogurt") counts as a hit; short common words don't,
    so "milk" in a brand name doesn't spuriously match every dairy recipe. */
export function productMatchesIngredient(productName, ingredientLine) {
  const prod = significantWords(productName);
  const ing = significantWords(ingredientLine);
  if (!prod.length || !ing.length) return false;
  return prod.some((pw) => ing.some((iw) =>
    (pw === iw && pw.length >= 4) ||
    (pw.length >= 5 && iw.includes(pw)) ||
    (iw.length >= 5 && pw.includes(iw))
  ));
}

/**
 * Real recipes from the given pool (loadRecipeBooks()'s corpus) that use the
 * scanned product. Ranked by how many real ingredient lines it hits (a
 * product central to the dish, not a garnish) then by fewer total
 * ingredients (the simpler, more approachable recipe first — same "budget
 * tier favors simpler recipes" instinct pantryTools.js's suggestRecipes()
 * already uses). Returns [] rather than a random pick when nothing matches.
 */
export function recipesForProduct(productName, pool = [], limit = 6) {
  const name = String(productName || '').trim();
  if (!name || !pool.length) return [];

  const scored = [];
  for (const recipe of pool) {
    const lines = (recipe.ingredients || []).map(ingredientText).filter(Boolean);
    if (!lines.length) continue;
    const hits = lines.filter((line) => productMatchesIngredient(name, line));
    if (!hits.length) continue;
    scored.push({ recipe, hitCount: hits.length, matchedLines: hits, ingredientCount: lines.length });
  }

  scored.sort((a, b) => b.hitCount - a.hitCount || a.ingredientCount - b.ingredientCount);
  return scored.slice(0, limit);
}

/* ── Price breakdown: this item alone vs. cooking with it ─────────────── */

/**
 * For each matched recipe, what the WHOLE dish costs (tierBudget.js's real
 * ballpark-priced engine) next to the actual price the shopper entered for
 * just this one item — the "buy it separately" comparison. Returns null
 * when there's no real price to compare against; a comparison with a
 * fabricated price would be worse than no comparison.
 */
export function priceBreakdownForProduct({ price, matchedRecipes = [], tier = 'mid', limit = 3 } = {}) {
  // Number('') is 0, not NaN — an explicit empty-string/null/undefined check
  // is required here, or a blank price field would render "$0.00" instead
  // of no comparison at all.
  if (price === '' || price == null) return null;
  const itemPrice = Number(price);
  if (!Number.isFinite(itemPrice)) return null;

  const recipes = matchedRecipes.slice(0, limit).map(({ recipe }) => {
    const ings = (recipe.ingredients || []).map(ingredientText).filter(Boolean);
    return { recipe, priced: priceRecipe(ings, recipe, tier) };
  });

  return { itemPrice, tier, recipes };
}

/* ── Fusion: which base this item probably belongs in ───────────────────── */

const BASE_GUESS_RULES = [
  { base: 'taco', re: /tortilla|taco shell/i },
  { base: 'pasta', re: /pasta|spaghetti|noodle|macaroni|penne|rigatoni|linguine|fettuccine|ramen|udon|orzo/i },
  { base: 'sandwich', re: /\bbread\b|\bbun\b|\broll\b|bagel|baguette|brioche|\bpita\b|hoagie|ciabatta/i },
  { base: 'bowl', re: /\brice\b|quinoa|farro|couscous|\bgrain\b/i },
];

/** Which fusionEngine BASE_ITEM this product most plausibly builds into.
    Defaults to 'bowl' — the most flexible base, so a fusion is always
    constructible even for an ingredient with no obvious carb signal (a
    protein, a sauce, a spice). Never a claim about what the product
    literally IS, just a reasonable generative starting point. */
export function guessFusionBase(productName) {
  const n = String(productName || '');
  for (const rule of BASE_GUESS_RULES) if (rule.re.test(n)) return rule.base;
  return 'bowl';
}

export function fusionBaseLabel(baseId) {
  return BASE_ITEMS.find((b) => b.id === baseId)?.label || 'Bowl';
}

/** Thin re-export so BarcodeScanner only needs one import line for the
    fusion half of this feature. */
export { buildFusion };
export const FUSION_REGIONS = REGIONS;

/* ── Reference log — "the user can reference their requests" ────────────── */

const REF_KEY = 'dig_in_scan_references';
const MAX_REFS = 60;

function loadRefs() {
  try { const v = JSON.parse(localStorage.getItem(REF_KEY) || '[]'); return Array.isArray(v) ? v : []; }
  catch { return []; }
}
function saveRefs(list) {
  try { localStorage.setItem(REF_KEY, JSON.stringify(list)); } catch { /* quota */ }
}

/**
 * Saves one scan's whole bundle — product info, which real recipes matched,
 * and any fusion the shopper picked — as a reference they can reopen later.
 * Stores recipe IDS, not full recipe objects (the corpus is loaded fresh
 * each time anyway, and this keeps the log small). No-ops on an empty name.
 */
export function saveScanReference({ barcode, name, brand, price, size, matchedRecipeIds = [], fusion = null }) {
  const clean = String(name || '').trim();
  if (!clean) return loadRefs();
  const list = loadRefs();
  const entry = {
    id: `ref_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    at: Date.now(),
    barcode: barcode || '',
    name: clean,
    brand: brand || '',
    price: price ?? null,
    size: size || '',
    matchedRecipeIds,
    fusion,
  };
  list.unshift(entry);
  saveRefs(list.slice(0, MAX_REFS));
  return list;
}

export function loadScanReferences() { return loadRefs(); }

export function removeScanReference(id) {
  const list = loadRefs().filter((r) => r.id !== id);
  saveRefs(list);
  return list;
}

/** Re-resolves a saved reference's recipe ids against a currently-loaded
    pool, so reopening one shows the real matched recipes again (not a
    cached snapshot that could drift from the corpus). Recipes the corpus no
    longer has are just dropped, not shown as broken links. */
export function resolveReference(ref, pool = []) {
  const byId = new Map(pool.map((r) => [r.id, r]));
  const recipes = (ref.matchedRecipeIds || []).map((id) => byId.get(id)).filter(Boolean);
  return { ...ref, recipes };
}
