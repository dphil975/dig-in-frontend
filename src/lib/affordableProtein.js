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
