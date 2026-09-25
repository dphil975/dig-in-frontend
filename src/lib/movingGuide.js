/* movingGuide.js — the "I just moved" timeline: what to get, what to cook, and
   how to stock a freezer while you're building a kitchen from zero.

   The "moved" life mode (feedContext.js) already reshapes the feed. This turns
   the mode's DAYS-SINCE-YOU-MOVED into a real timeline: week one you're cooking
   out of boxes, week two you're setting up a pantry and starting the freezer,
   after that you're batch-cooking to fill it. Each phase recommends different
   gear and different recipes.

   Honesty: the gear here is real product CATEGORIES with honest "what to look
   for" guidance — never a fabricated brand or a fake affiliate link. When a real
   moving/kitchen-gear sponsor is signed it drops into the card's
   <ShoutoutCard placement="moved"/> slot (which ships empty today). The recipes
   are real recipes from the loaded pool, matched to how well they freeze and
   store, framed as good first cooks — not invented inventory. */

import { ingredientCount } from './structuredTags';
import { proteinBudgetScore, isMeaty, hasCheapProtein } from './affordableProtein';

const DAY_MS = 86400000;

/* The timeline. `from`/`to` are days since the move (inclusive). Gear is
   category + why, no brands. `match` selects real recipes that fit the phase;
   `avoid` keeps obviously-wrong ones out. */
export const MOVING_PHASES = [
  {
    id: 'boxes',
    from: 0, to: 4,
    label: 'Week one · boxes everywhere',
    headline: "Cook without unpacking the whole kitchen.",
    sub: "One pan, a knife, and meals that don't need a stocked kitchen yet.",
    gear: [
      { cat: 'One good nonstick pan', tip: 'The single pan that does eggs, stir-fries, and one-pot dinners while everything else is still boxed.' },
      { cat: "A chef's knife + flexible cutting board", tip: 'The two tools you reach for before anything else is unpacked.' },
      { cat: 'Paper goods for week one', tip: "Plates and cups so a not-yet-hooked-up dishwasher isn't dinner's problem." },
    ],
    match: /one[- ]?pot|one[- ]?pan|skillet|no[- ]?cook|sandwich|wrap|salad|stir[- ]?fry|pasta|quesadilla|toast|egg|rice bowl/i,
    avoid: /sous vide|smoker|deep[- ]?fry|proof overnight|48 hours/i,
    storageAngle: 'Keep a few labeled freezer bags out — leftovers from these first meals become next-day lunches.',
    keepSimple: "Five ingredients or fewer this week. You're not behind — a new kitchen just needs easy wins first.",
  },
  {
    id: 'setup',
    from: 5, to: 12,
    label: 'Settling in · setting up the kitchen',
    headline: 'Stock a real pantry and start the freezer.',
    sub: 'The shelf-stable base and the containers that make a moved-in kitchen work.',
    gear: [
      { cat: 'Freezer-safe containers or deli quarts', tip: 'Stackable, see-through, freezer-to-microwave — the backbone of a settled kitchen.' },
      { cat: 'A sheet pan', tip: 'Roast a big batch of veg or a sheet dinner, then freeze it in portions.' },
      { cat: 'Airtight pantry jars', tip: 'Rice, beans, pasta, flour — the shelf-stable base you rebuild first.' },
    ],
    match: /soup|stew|chili|sauce|stock|broth|beans|batch|make[- ]?ahead|casserole|curry|dal|marinara|bolognese/i,
    avoid: /no[- ]?cook|raw|assembly only/i,
    storageAngle: 'Freeze in single portions, flat in bags — they thaw fast and stack thin.',
    keepSimple: 'A pot of beans or lentils is the cheapest meal you can make — no meat needed, and it stretches for days.',
  },
  {
    id: 'stocked',
    from: 13, to: 9999,
    label: 'Settled · stock the freezer',
    headline: 'Batch-cook now so you never come home to an empty kitchen.',
    sub: 'Cook once, eat four times — soups, stews, and sauces that keep for months.',
    gear: [
      { cat: 'A big pot or Dutch oven', tip: 'The one-vessel batch cooker for soups, stews, and sauces you freeze by the quart.' },
      { cat: 'A freezer thermometer + masking tape', tip: 'Keep it at 0°F and date everything — a stocked freezer is only good if you trust it.' },
      { cat: 'Silicone freezer trays', tip: 'Portion sauces, stocks, and broths into cubes you pop out one at a time.' },
    ],
    match: /batch|freezer|meal[- ]?prep|stew|chili|curry|casserole|lasagna|bolognese|soup|braise|pulled|ragu|enchilada/i,
    avoid: /no[- ]?cook|crisp|fried|soufflé|meringue/i,
    storageAngle: 'Most soups and braises keep about 3 months frozen — cool fully, then freeze flat.',
    keepSimple: 'One big cook = a week of dinners. Make it once, adjust the seasoning to taste, freeze the rest.',
  },
];

/** Days since the move started, from the life-mode record's `since` timestamp. */
export function daysSinceMoved(mode, now = new Date()) {
  if (!mode?.since) return 0;
  return Math.max(0, Math.floor((now.getTime() - mode.since) / DAY_MS));
}

/** Which phase of the move the user is in, by days elapsed. */
export function movingPhase(days = 0) {
  return MOVING_PHASES.find((p) => days >= p.from && days <= p.to) || MOVING_PHASES[MOVING_PHASES.length - 1];
}

function recipeText(r) {
  const ings = (r.ingredients || []).map((i) => (typeof i === 'object' ? i.text || i.name : i)).join(' ');
  return `${r.name || ''} ${r.description || ''} ${ings}`;
}

/** Real recipes that fit the phase, ranked for someone rebuilding a kitchen on
    little money: FEWER ingredients wins, cheap non-meat protein wins, meat-heavy
    loses, and freezer/batch-friendly wins. All real signals off the recipe's own
    data (ingredient count + keyword protein detection). Returns recipe objects
    annotated with `_ingredientCount` and `_meatFree` so the card can show them. */
export function freezerStorageRecipes(recipes = [], phase = MOVING_PHASES[0], { limit = 3 } = {}) {
  const hits = [];
  for (const r of recipes) {
    const hay = recipeText(r);
    if (phase.avoid && phase.avoid.test(hay)) continue;
    if (!phase.match.test(hay)) continue;
    const n = ingredientCount(r);
    let score = 0;
    // Freezer/batch fit for the phase.
    if (/freez|batch|make[- ]?ahead|meal[- ]?prep|leftover|stew|soup|chili|sauce|stock|braise/i.test(hay)) score += 2;
    // Fewer ingredients = less to buy, less overwhelm — "the less the better."
    if (n > 0) { if (n <= 5) score += 3; else if (n <= 8) score += 1; else if (n >= 14) score -= 1; }
    // Cheap non-meat protein up, meat-heavy down (money's tight when you just moved).
    score += proteinBudgetScore(r);
    hits.push({ r, score, n });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit).map((h) => ({ ...h.r, _ingredientCount: h.n, _meatFree: !isMeaty(h.r), _cheapProtein: hasCheapProtein(h.r) }));
}
