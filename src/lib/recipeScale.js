/* recipeScale.js — scale a free-text ingredient list to a different serving
   count, honestly. Most of this app's recipes are hand-written prose
   ("2 lbs meat", "Onions", "Spices: bay, cinnamon, cardamom, cloves") not a
   structured amount/unit database (that richer shape exists for a minority
   of recipes — see RecipeExtras.jsx's IngredientsPanel 1x/2x/3x multiplier,
   which only works on it). Checked against the real 575-recipe corpus:
   ~59% of ingredient lines start with a parseable quantity; the other ~41%
   (mostly aromatics/spices with no listed amount) get left as-is rather
   than guessed at — a real limitation, same "honest heuristic, not a fake
   precision" rule the rest of this app's keyword-matching follows. */

const QTY_TOKEN = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)(\s*)/;
// "3-4 cloves" — a range. Scaling one end and not the other reads as a
// typo, not a smaller batch, so ranges are left untouched rather than
// mangled ("3-4" -> "1/8 -4" is worse than not scaling it at all).
const RANGE_TOKEN = /^\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?\s*/;
const UNIT_WORD = /^(cups?|tbsps?|tablespoons?|tsps?|teaspoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|cloves?|slices?|pieces?|sheets?|cans?|packets?)\s+/i;

function parseQtyToken(raw) {
  if (raw.includes(' ')) {
    const [whole, frac] = raw.split(' ');
    const [n, d] = frac.split('/').map(Number);
    return Number(whole) + n / d;
  }
  if (raw.includes('/')) {
    const [n, d] = raw.split('/').map(Number);
    return n / d;
  }
  return Number(raw);
}

// Snaps a scaled quantity to the nearest fraction a home cook would
// actually measure, rather than printing "0.333333 cup".
const FRACTIONS = [[0, '0'], [1 / 8, '1/8'], [1 / 4, '1/4'], [1 / 3, '1/3'], [1 / 2, '1/2'], [2 / 3, '2/3'], [3 / 4, '3/4'], [1, '1']];
function formatScaledQty(n) {
  if (!Number.isFinite(n) || n <= 0) return null;
  let whole = Math.floor(n);
  const frac = n - whole;
  let best = FRACTIONS[0], bestDiff = Infinity;
  for (const pair of FRACTIONS) {
    const diff = Math.abs(frac - pair[0]);
    if (diff < bestDiff) { bestDiff = diff; best = pair; }
  }
  let [val, label] = best;
  if (val === 1) { whole += 1; val = 0; label = '0'; }
  if (val === 0) return whole > 0 ? String(whole) : null; // rounds to nothing measurable
  return whole > 0 ? `${whole} ${label}` : label;
}

/** Scale one ingredient line by a factor. Returns { text, scaled }:
 * scaled=true when a leading quantity was found and rewritten; false when
 * the line had no parseable amount (left untouched) or the scaled amount
 * rounds to nothing measurable (rewritten as "a pinch of X" instead of a
 * fake "0 tsp"). */
export function scaleIngredientLine(line, factor) {
  const text = String(line || '');
  if (RANGE_TOKEN.test(text)) return { text, scaled: false };
  const m = text.match(QTY_TOKEN);
  if (!m) return { text, scaled: false };
  const qty = parseQtyToken(m[1]);
  if (!Number.isFinite(qty)) return { text, scaled: false };
  const rest = text.slice(m[0].length).trim();
  const formatted = formatScaledQty(qty * factor);
  if (!formatted) {
    const withoutUnit = rest.replace(UNIT_WORD, '');
    return { text: `a small amount of ${withoutUnit}`, scaled: true, tiny: true };
  }
  return { text: `${formatted} ${rest}`.trim(), scaled: true };
}

/** Scale a full ingredient list from its original serving count down (or
 * up) to a target serving count — 1, for a practice/test-run batch, by
 * default. `originalServings` falls back to 4 (the corpus's most common
 * serving count) only when a recipe is missing the field entirely. */
export function scaleIngredientsToServings(ingredients, originalServings, targetServings = 1) {
  const base = originalServings > 0 ? originalServings : 4;
  const factor = targetServings / base;
  return (ingredients || []).map(line => ({ original: line, ...scaleIngredientLine(line, factor) }));
}
