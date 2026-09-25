/* zipToState.js — resolve a US ZIP code to one of the app's real store
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
