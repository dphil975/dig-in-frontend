/* ════════════════════════════════════════════════════════════
   RESTAURANT HINTS — a small curated lookup from well-known restaurant
   names (typed into the flavor quiz) to a region + flavor tags + a
   "style" hint (fusion / deconstructed-friendly). This is a tag-based
   nudge only: it boosts matching *existing* recipes and lets the UI
   label them ("Because you like Nobu-style sushi") — it does not
   author any new recipe content.

   Matching is substring-based and case-insensitive against the raw text
   the user typed, so "I love Nobu" or "nobu downtown" both match "nobu".
   ════════════════════════════════════════════════════════════ */

export const RESTAURANT_HINTS = [
  { match: 'nobu',         region: 'east-asia', flavors: ['savory', 'light', 'tangy'], style: 'fusion' },
  { match: 'momofuku',     region: 'east-asia', flavors: ['savory', 'rich', 'spicy'],   style: 'fusion' },
  { match: 'sushi',        region: 'east-asia', flavors: ['savory', 'light'],           style: 'deconstructed' },
  { match: 'katsu',        region: 'east-asia', flavors: ['savory', 'rich'],            style: null },
  { match: 'din tai fung', region: 'east-asia', flavors: ['savory', 'light'],           style: null },
  { match: 'shake shack',  region: 'americas',  flavors: ['rich', 'savory'],            style: null },
  { match: 'chipotle',     region: 'americas',  flavors: ['spicy', 'savory'],           style: null },
  { match: 'joes pizza',   region: 'europe',    flavors: ['savory', 'rich'],            style: null },
  { match: 'carbone',      region: 'europe',    flavors: ['rich', 'savory'],            style: 'fusion' },
  { match: 'ilili',        region: 'mideast',   flavors: ['savory', 'smoky', 'tangy'],  style: 'fusion' },
  { match: 'tanoreen',     region: 'mideast',   flavors: ['savory', 'smoky'],           style: 'deconstructed' },
  { match: 'thai',         region: 'sea',       flavors: ['spicy', 'sweet', 'tangy'],   style: null },
  { match: 'pok pok',      region: 'sea',       flavors: ['spicy', 'tangy', 'smoky'],   style: null },
  { match: 'indian accent',region: 'south-asia',flavors: ['spicy', 'rich', 'earthy'],   style: 'fusion' },
  { match: 'junoon',       region: 'south-asia',flavors: ['spicy', 'rich'],             style: 'fusion' },
  { match: 'jollibee',     region: 'sea',       flavors: ['sweet', 'savory'],           style: null },
  { match: 'nandos',       region: 'africa',    flavors: ['spicy', 'smoky'],            style: null },
];

/**
 * Resolve free-text restaurant answers (from the flavor quiz) into the
 * union of region/flavor/style hints for whichever entries matched.
 * Returns { regions: Set, flavors: Set, styles: Set } — all empty if
 * nothing in the list matched (an unrecognized restaurant is not an error,
 * it's just not something we have a tag for yet).
 */
export function resolveRestaurantHints(answers = []) {
  const regions = new Set();
  const flavors = new Set();
  const styles = new Set();
  const text = answers.join(' ').toLowerCase();
  for (const hint of RESTAURANT_HINTS) {
    if (!text.includes(hint.match)) continue;
    if (hint.region) regions.add(hint.region);
    for (const f of hint.flavors || []) flavors.add(f);
    if (hint.style) styles.add(hint.style);
  }
  return { regions, flavors, styles };
}
