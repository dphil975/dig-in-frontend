/* localFlavor.js — "popular near you," so home cooking feels incentivized
   instead of like a downgrade from what's actually around you.

   The idea: if someone lives somewhere dense — a real food city with a real
   food identity — the app should say so and hand them a real recipe from
   that identity, not a generic pick. Seeing "this is what your neighborhood
   is known for, and here's how to make it at home for a fraction of the
   price" is the incentive; a bodega on every corner isn't a reason to never
   cook, it's proof the flavor is already popular where you live.

   ZIP3 prefixes below are the same public, decades-stable USPS three-digit
   assignment table used elsewhere in this app (see ruralMetrics.js's
   RURAL_PREFIXES) — real ranges for real dense metro cores, not exhaustive
   suburbs. Matching against the recipe pool by keyword (same technique
   recipeRecommender.js uses for weather words) means the result is always a
   real, cookable recipe from this app's own catalogue — never a fabricated
   dish name that can't actually be opened. */

export const DENSE_METROS = [
  { zip3: [100, 101, 102, 103, 104], city: 'New York',     keywords: ['bagel', 'deli', 'pizza', 'bacon egg and cheese', 'halal', 'pastrami'] },
  { zip3: [21, 22],                  city: 'Boston',       keywords: ['clam chowder', 'lobster roll', 'chowder'] },
  { zip3: [191],                     city: 'Philadelphia', keywords: ['cheesesteak', 'soft pretzel', 'hoagie'] },
  { zip3: [200, 201, 202, 203, 204, 205], city: 'Washington D.C.', keywords: ['half smoke', 'mumbo sauce', 'chili bowl'] },
  { zip3: [331, 332, 333],           city: 'Miami',        keywords: ['cuban sandwich', 'croqueta', 'cafecito', 'plantain'] },
  { zip3: [606, 607, 608],           city: 'Chicago',      keywords: ['deep dish', 'italian beef', 'hot dog'] },
  { zip3: [700, 701],                city: 'New Orleans',  keywords: ['gumbo', 'po boy', 'beignet', 'jambalaya'] },
  { zip3: [750, 751, 752],           city: 'Dallas',       keywords: ['brisket', 'tex-mex', 'queso'] },
  { zip3: [900, 901, 902],           city: 'Los Angeles',  keywords: ['taco', 'birria', 'poke', 'avocado toast'] },
  { zip3: [941],                     city: 'San Francisco', keywords: ['sourdough', 'dim sum', 'burrito'] },
  { zip3: [981],                     city: 'Seattle',      keywords: ['salmon', 'teriyaki', 'coffee'] },
];

function toZip3(zip) {
  const digits = String(zip || '').replace(/\D/g, '');
  if (digits.length < 3) return null;
  return parseInt(digits.slice(0, 3), 10);
}

/** Which dense metro a ZIP falls in, or null when it isn't one of the cores
    this app knows by name — an honest "no local flavor data here yet." */
export function metroForZip(zip) {
  const z3 = toZip3(zip);
  if (z3 == null) return null;
  return DENSE_METROS.find((m) => m.zip3.includes(z3)) || null;
}

function textOf(r) {
  return ((r?.name || '') + ' ' + (r?.description || '')).toLowerCase();
}

/** A real recipe from the already-loaded pool matching the metro's known
    food identity, or null if nothing in the catalogue matches — never
    invents a dish that can't actually be opened and cooked. Deterministic
    per day so it doesn't reshuffle on every render. */
export function pickLocalFavorite(recipes, zip, seedStr = '') {
  const metro = metroForZip(zip);
  if (!metro || !recipes?.length) return null;

  const matches = recipes.filter((r) => metro.keywords.some((k) => textOf(r).includes(k)));
  if (!matches.length) return null;

  const dayKey = new Date().toDateString();
  const idx = Math.abs(hashStr(`${dayKey}-${metro.city}-${seedStr}`)) % matches.length;
  return { recipe: matches[idx], metro };
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
