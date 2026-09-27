/* ════════════════════════════════════════════════════════════
   Merged module — originally five files:
     · src/lib/localFlavor.js    ("popular near you" local-flavor picks)
     · src/data/cityFoodData.js  (curated food-identity content)
     · src/lib/movingGuide.js    ("I just moved" timeline)
     · src/lib/zipToState.js     (ZIP → state/borough resolver)
     · src/lib/checkinVerify.js  (GPS check-in verification)
   ════════════════════════════════════════════════════════════ */

import { ingredientCount } from '../structuredTags';
import { proteinBudgetScore, isMeaty, hasCheapProtein } from '../affordableProtein';
import { getCurrentPosition, hasGeolocation } from '../platform/native';
import { haversineKm } from './commutePlanner';

/* ── from localFlavor.js ───────────────────────────────────────
   localFlavor.js — "popular near you," so home cooking feels incentivized
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

import { DENSE_METROS, metroForZip } from './metros';
export { DENSE_METROS, metroForZip };

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

/* ── from src/data/cityFoodData.js ─────────────────────────────
   cityFoodData.js — real, curated food-identity content, keyed by the SAME
   BOROUGHS ids used everywhere else in the app (storeData.js, FoodMap,
   zipToState.js's boroughForZip). Not every region has a write-up yet —
   FoodPassport shows an honest "haven't written this one yet" state for any
   id missing here, same posture as CityExplorer's "the layout guide for X
   isn't built yet."

   cuisineTags match against a recipe's own `country`/`cuisine` field (same
   fields RecipeFull/cookAchievements already read) so "recipes you've cooked
   from here" is real personal cook history, never a fabricated community
   number. storeTypes are real STORE_TYPE_LABELS keys (storeData.js) used to
   filter the region's actual store file down to relevant "local spots" —
   never a named restaurant we made up. */

export const CITY_FOOD_DATA = {
  manhattan: {
    label: 'Manhattan', emoji: '🥯',
    signatureDishes: ['New York bagel with lox', 'Dollar slice pizza', 'Pastrami on rye'],
    cuisineTags: ['jewish', 'italian', 'new york', 'deli'],
    storeTypes: ['deli', 'specialty'],
  },
  brooklyn: {
    label: 'Brooklyn', emoji: '🍕',
    signatureDishes: ['Coal-oven pizza', 'Egg cream', 'Caribbean roti'],
    cuisineTags: ['italian', 'caribbean', 'jewish'],
    storeTypes: ['deli', 'african', 'specialty'],
  },
  queens: {
    label: 'Queens', emoji: '🥟',
    signatureDishes: ['Dumplings (Flushing)', 'Arepas (Jackson Heights)', 'Thai boat noodles'],
    cuisineTags: ['chinese', 'colombian', 'thai', 'korean'],
    storeTypes: ['asian', 'south_asian', 'latino'],
  },
  bronx: {
    label: 'The Bronx', emoji: '🍫',
    signatureDishes: ["Egg cream", "Arthur Avenue Italian classics", 'Mofongo'],
    cuisineTags: ['italian', 'puerto rican', 'dominican'],
    storeTypes: ['latino', 'specialty'],
  },
  'staten-island': {
    label: 'Staten Island', emoji: '🍝',
    signatureDishes: ['Sicilian pizza', 'Italian pastries'],
    cuisineTags: ['italian'],
    storeTypes: ['specialty', 'deli'],
  },
  'new-jersey': {
    label: 'New Jersey', emoji: '🌭',
    signatureDishes: ['Taylor ham, egg & cheese', 'Disco fries', 'Italian hot dogs'],
    cuisineTags: ['italian', 'american'],
    storeTypes: ['deli', 'specialty'],
  },
  pennsylvania: {
    label: 'Pennsylvania', emoji: '🥪',
    signatureDishes: ['Philly cheesesteak', 'Soft pretzels', 'Scrapple'],
    cuisineTags: ['american', 'german'],
    storeTypes: ['deli', 'specialty'],
  },
  massachusetts: {
    label: 'Massachusetts', emoji: '🦞',
    signatureDishes: ['New England clam chowder', 'Lobster roll', 'Boston baked beans'],
    cuisineTags: ['seafood', 'american'],
    storeTypes: ['specialty', 'grocery'],
  },
  maryland: {
    label: 'Maryland', emoji: '🦀',
    signatureDishes: ['Maryland blue crab', 'Old Bay everything', 'Crab cakes'],
    cuisineTags: ['seafood', 'american'],
    storeTypes: ['specialty', 'grocery'],
  },
  dc: {
    label: 'Washington, D.C.', emoji: '🌶️',
    signatureDishes: ['Half-smoke', 'Mumbo sauce wings', 'Ethiopian combo platter'],
    cuisineTags: ['ethiopian', 'american'],
    storeTypes: ['african', 'specialty'],
  },
  virginia: {
    label: 'Virginia', emoji: '🐖',
    signatureDishes: ['Virginia ham', 'Brunswick stew', 'Peanut soup'],
    cuisineTags: ['southern', 'american'],
    storeTypes: ['specialty', 'grocery'],
  },
  'north-carolina': {
    label: 'North Carolina', emoji: '🍖',
    signatureDishes: ['Eastern-style whole-hog BBQ', 'Vinegar-based BBQ sauce', 'Hush puppies'],
    cuisineTags: ['southern', 'bbq'],
    storeTypes: ['specialty', 'grocery'],
  },
  'south-carolina': {
    label: 'South Carolina', emoji: '🍚',
    signatureDishes: ['Lowcountry shrimp and grits', 'Carolina Gold rice', 'She-crab soup'],
    cuisineTags: ['southern', 'seafood'],
    storeTypes: ['specialty', 'grocery'],
  },
  georgia: {
    label: 'Georgia', emoji: '🍑',
    signatureDishes: ['Peach cobbler', 'Fried chicken', 'Pimento cheese'],
    cuisineTags: ['southern'],
    storeTypes: ['specialty', 'grocery'],
  },
  florida: {
    label: 'Florida', emoji: '🍋',
    signatureDishes: ['Key lime pie', 'Cuban sandwich', 'Stone crab claws'],
    cuisineTags: ['cuban', 'caribbean', 'seafood'],
    storeTypes: ['latino', 'specialty'],
  },
  tennessee: {
    label: 'Tennessee', emoji: '🔥',
    signatureDishes: ['Nashville hot chicken', 'Memphis dry-rub ribs', 'Biscuits and gravy'],
    cuisineTags: ['southern', 'bbq'],
    storeTypes: ['specialty', 'grocery'],
  },
  alabama: {
    label: 'Alabama', emoji: '🍗',
    signatureDishes: ['White BBQ sauce chicken', 'Fried green tomatoes'],
    cuisineTags: ['southern', 'bbq'],
    storeTypes: ['specialty', 'grocery'],
  },
  louisiana: {
    label: 'Louisiana', emoji: '🦐',
    signatureDishes: ['Gumbo', 'Jambalaya', 'Beignets', 'Crawfish étouffée'],
    cuisineTags: ['cajun', 'creole', 'southern'],
    storeTypes: ['specialty', 'grocery'],
  },
  texas: {
    label: 'Texas', emoji: '🌮',
    signatureDishes: ['Texas brisket', 'Tex-Mex breakfast tacos', 'Chili con carne'],
    cuisineTags: ['tex-mex', 'mexican', 'bbq'],
    storeTypes: ['latino', 'specialty'],
  },
  oklahoma: {
    label: 'Oklahoma', emoji: '🌾',
    signatureDishes: ['Fried onion burger', 'Chicken fried steak'],
    cuisineTags: ['southern', 'american'],
    storeTypes: ['specialty', 'grocery'],
  },
  'new_mexico': {
    label: 'New Mexico', emoji: '🌶️',
    signatureDishes: ['Green chile stew', 'Sopapillas', 'Carne adovada'],
    cuisineTags: ['new mexican', 'mexican'],
    storeTypes: ['latino', 'specialty'],
  },
  arizona: {
    label: 'Arizona', emoji: '🫓',
    signatureDishes: ['Sonoran hot dog', 'Chimichanga', 'Navajo fry bread'],
    cuisineTags: ['mexican', 'southwestern'],
    storeTypes: ['latino', 'specialty'],
  },
  colorado: {
    label: 'Colorado', emoji: '🌿',
    signatureDishes: ['Rocky Mountain trout', 'Green chile smothered everything', 'Palisade peaches'],
    cuisineTags: ['southwestern', 'american'],
    storeTypes: ['specialty', 'grocery'],
  },
  nevada: {
    label: 'Nevada', emoji: '🎰',
    signatureDishes: ['Vegas buffet classics', 'Basque-style lamb (Elko)'],
    cuisineTags: ['american'],
    storeTypes: ['specialty', 'grocery'],
  },
  california: {
    label: 'California', emoji: '🥑',
    signatureDishes: ['California burrito', 'Fish tacos', 'Loaded griddle fries', 'Farm-to-table produce'],
    cuisineTags: ['mexican', 'californian', 'asian'],
    storeTypes: ['latino', 'asian', 'specialty'],
  },
  washington: {
    label: 'Washington', emoji: '☕',
    signatureDishes: ['Dungeness crab', 'Salmon', 'Third-wave coffee'],
    cuisineTags: ['seafood', 'pacific northwest'],
    storeTypes: ['asian', 'specialty'],
  },
  oregon: {
    label: 'Oregon', emoji: '🍩',
    signatureDishes: ['Marionberry pie', 'Food-cart Korean-Mexican fusion', 'Hazelnut everything'],
    cuisineTags: ['pacific northwest', 'fusion'],
    storeTypes: ['specialty', 'asian'],
  },
  hawaii: {
    label: 'Hawaii', emoji: '🍍',
    signatureDishes: ['Poke bowl', 'Plate lunch (loco moco)', 'Spam musubi'],
    cuisineTags: ['hawaiian', 'japanese', 'filipino'],
    storeTypes: ['asian', 'specialty'],
  },
  puerto_rico: {
    label: 'Puerto Rico', emoji: '🍌',
    signatureDishes: ['Mofongo', 'Lechón', 'Arroz con gandules'],
    cuisineTags: ['puerto rican', 'caribbean'],
    storeTypes: ['latino', 'specialty'],
  },
  kentucky: {
    label: 'Kentucky', emoji: '🍗',
    signatureDishes: ['Hot brown sandwich', 'Kentucky fried chicken', 'Burgoo stew'],
    cuisineTags: ['southern'],
    storeTypes: ['specialty', 'grocery'],
  },
  connecticut: {
    label: 'Connecticut', emoji: '🍕',
    signatureDishes: ['New Haven apizza', 'Lobster roll (hot buttered)'],
    cuisineTags: ['italian', 'seafood'],
    storeTypes: ['specialty', 'deli'],
  },
};

export function cityFoodDataFor(regionId) {
  return CITY_FOOD_DATA[regionId] || null;
}

/* ── from movingGuide.js ───────────────────────────────────────
   movingGuide.js — the "I just moved" timeline: what to get, what to cook, and
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

/* ── from zipToState.js ────────────────────────────────────────
   zipToState.js — resolve a US ZIP code to one of the app's real store
   regions (a BOROUGHS id), so FoodMap can default to "your state" instead of
   either an arbitrary NYC default or eagerly loading every region.

   The ZIP3-prefix → state table below is the standard, decades-stable USPS
   three-digit ZIP prefix assignment (the same public reference table used
   everywhere this kind of lookup is done) — real data, not fabricated. It's
   deliberately approximate at a few internal sub-ranges (military APO/FPO
   codes, tiny prefix gaps) since those don't change which state a real
   civilian ZIP falls in. States this app has no store file for yet (OH, IN,
   MI, IA, WI, MN, SD, ND, IL, MO, KS, NE, UT, WY, and a few small others)
   resolve to null — an honest "no data yet," not a wrong guess. */

const ZIP3_RANGES = [
  [6, 9, 'PR'],
  [10, 27, 'MA'], [28, 29, 'RI'], [30, 38, 'NH'], [39, 49, 'ME'], [50, 59, 'VT'],
  [60, 69, 'CT'], [70, 89, 'NJ'],
  [100, 149, 'NY'],
  [150, 196, 'PA'], [197, 199, 'DE'],
  [200, 205, 'DC'], [206, 219, 'MD'], [220, 246, 'VA'], [247, 268, 'WV'],
  [270, 289, 'NC'], [290, 299, 'SC'],
  [300, 319, 'GA'], [398, 399, 'GA'],
  [320, 349, 'FL'],
  [350, 369, 'AL'],
  [370, 385, 'TN'],
  [386, 397, 'MS'],
  [400, 427, 'KY'],
  [430, 459, 'OH'], [460, 479, 'IN'], [480, 499, 'MI'],
  [500, 528, 'IA'], [530, 549, 'WI'], [550, 567, 'MN'], [570, 577, 'SD'], [580, 588, 'ND'],
  [590, 599, 'MT'],
  [600, 629, 'IL'], [630, 658, 'MO'], [660, 679, 'KS'], [680, 693, 'NE'],
  [700, 714, 'LA'], [716, 729, 'AR'],
  [730, 749, 'OK'],
  [750, 799, 'TX'], [885, 885, 'TX'],
  [800, 816, 'CO'], [820, 831, 'WY'], [832, 838, 'ID'], [840, 847, 'UT'],
  [850, 865, 'AZ'], [870, 884, 'NM'],
  [889, 898, 'NV'],
  [900, 961, 'CA'],
  [967, 968, 'HI'],
  [970, 979, 'OR'],
  [980, 994, 'WA'],
  [995, 999, 'AK'],
];

// State (or NY sub-region) abbreviation → this app's BOROUGHS id. States with
// no store file yet are simply absent, so lookups fall through to null.
const STATE_TO_BOROUGH_ID = {
  NJ: 'new-jersey', PA: 'pennsylvania', CT: 'connecticut', MA: 'massachusetts',
  NH: 'new-hampshire', RI: 'rhode-island', VT: 'vermont', ME: 'maine',
  VA: 'virginia', DE: 'delaware', MD: 'maryland', WV: 'west-virginia', DC: 'dc',
  'SC': 'south-carolina', 'NC': 'north-carolina', GA: 'georgia', FL: 'florida',
  TN: 'tennessee', AL: 'alabama', MS: 'mississippi', LA: 'louisiana',
  KY: 'kentucky', TX: 'texas', OK: 'oklahoma', AR: 'arkansas', AZ: 'arizona',
  CO: 'colorado', ID: 'idaho', MT: 'montana', NV: 'nevada', NM: 'new_mexico',
  AK: 'alaska', CA: 'california', WA: 'washington', OR: 'oregon', HI: 'hawaii',
  PR: 'puerto_rico',
};

// NY is the one state this app splits into sub-regions (5 boroughs + LI +
// Hudson Valley + upstate) rather than one file — approximate by ZIP3, since
// county lines don't align neatly to 3-digit prefixes. Good enough to pick
// the right *file* (which is all this drives); not meant as a precise
// borough/county lookup.
const NY_ZIP3_TO_BOROUGH = {
  100: 'manhattan', 101: 'manhattan', 102: 'manhattan',
  103: 'staten-island',
  104: 'bronx',
  112: 'brooklyn',
  110: 'queens', 111: 'queens', 113: 'queens', 114: 'queens', 116: 'queens',
  115: 'nassau', 117: 'nassau', 118: 'nassau', 119: 'suffolk',
  105: 'westchester', 107: 'westchester', 108: 'westchester', 109: 'westchester',
  106: 'rockland',
};

function stateForZip3(n) {
  for (const [lo, hi, state] of ZIP3_RANGES) {
    if (n >= lo && n <= hi) return state;
  }
  return null;
}

/** 2-letter state code for a US ZIP code, or null if unrecognized. */
export function stateForZip(zip) {
  const digits = String(zip || '').match(/^\d{3}/);
  if (!digits) return null;
  return stateForZip3(parseInt(digits[0], 10));
}

/**
 * The BOROUGHS id this app should show for a ZIP code — the file-selection
 * key FoodMap/holidayCalendar.js key off — or null if it's a real ZIP this
 * app just doesn't have store data for yet.
 */
export function boroughForZip(zip) {
  const digits = String(zip || '').match(/^\d{3}/);
  if (!digits) return null;
  const n = parseInt(digits[0], 10);
  const state = stateForZip3(n);
  if (state === 'NY') return NY_ZIP3_TO_BOROUGH[n] || 'upstate-ny';
  return state ? (STATE_TO_BOROUGH_ID[state] || null) : null;
}

/* ── from checkinVerify.js ─────────────────────────────────────
   Require a real GPS fix within CHECKIN_RADIUS_M of the store. No silent
   fallback — if location can't be confirmed, the check-in is rejected with a
   specific reason instead of being awarded anyway. */

const CHECKIN_RADIUS_M = 150;
const MAX_ACCURACY_M = 300; // a fix this noisy can't reliably confirm "at the store"

export async function verifyCheckinLocation(storeLat, storeLng) {
  if (typeof storeLat !== 'number' || typeof storeLng !== 'number') {
    return { ok: false, reason: 'no-store-coords' };
  }
  if (!hasGeolocation()) {
    return { ok: false, reason: 'no-geo' };
  }
  let pos;
  try {
    pos = await getCurrentPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  } catch (err) {
    return { ok: false, reason: err?.code === 1 ? 'denied' : 'timeout' };
  }
  if (pos.accuracy != null && pos.accuracy > MAX_ACCURACY_M) {
    return { ok: false, reason: 'low-accuracy', accuracy: Math.round(pos.accuracy) };
  }
  const distKm = haversineKm(pos.lat, pos.lng, storeLat, storeLng);
  const distM = distKm * 1000;
  if (distM > CHECKIN_RADIUS_M) {
    return { ok: false, reason: 'too-far', distM: Math.round(distM) };
  }
  return { ok: true, distM: Math.round(distM) };
}

export function checkinRejectionMessage(result, storeName) {
  switch (result?.reason) {
    case 'too-far': return `You need to be at ${storeName} to check in (you're ${result.distM}m away).`;
    case 'low-accuracy': return `GPS signal too weak to confirm you're there (accuracy ${result.accuracy}m) — step outside or try again.`;
    case 'denied': return 'Location access is required to check in — enable it in your browser/device settings.';
    case 'no-geo': return "This device/browser doesn't support location, so check-in can't be verified here.";
    case 'timeout': return 'Location timed out — move to an open area and try again.';
    case 'no-store-coords': return "This store doesn't have map coordinates on file, so check-in can't be verified.";
    default: return "Couldn't verify your location — try again.";
  }
}
