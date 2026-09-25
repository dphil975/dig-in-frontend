/* foodSafety.js — the core knowledge a food handler certification course
   (ServSafe-style) actually tests: safe minimum internal cooking
   temperatures, the "danger zone," cross-contamination, time limits, and
   safe cooling/storage — adapted for a home kitchen rather than commercial
   food service (no receiving-dock or employee-illness-policy content, just
   the science that keeps a home cook's food safe).

   Real, standard reference data (USDA FoodSafety.gov / FDA Food Code
   minimums — the same numbers every food handler exam is built on), not
   fabricated. This is the single source of truth for the actual numbers —
   novaKnowledge.js's Q&A entries and FoodSafetyPanel (on RecipeFull) both
   read from here, so a temperature can't drift out of sync between them. */

export const SAFE_COOK_TEMPS = [
  { id: 'poultry', label: 'Poultry (chicken, turkey, duck — whole, parts, ground)', tempF: 165, tempC: 74, rest: 0,
    keywords: ['chicken', 'turkey', 'duck', 'poultry', 'wing', 'thigh', 'drumstick'] },
  { id: 'ground-meat', label: 'Ground beef, pork, veal, lamb', tempF: 160, tempC: 71, rest: 0,
    keywords: ['ground beef', 'ground pork', 'ground veal', 'ground lamb', 'burger', 'meatball', 'meatloaf', 'sausage'] },
  { id: 'whole-cuts', label: 'Beef, pork, veal, lamb (steaks, roasts, chops)', tempF: 145, tempC: 63, rest: 3,
    keywords: ['steak', 'pork chop', 'pork loin', 'roast', 'lamb chop', 'veal', 'brisket', 'tenderloin'] },
  { id: 'fish', label: 'Fish & shellfish', tempF: 145, tempC: 63, rest: 0,
    keywords: ['fish', 'salmon', 'tuna', 'cod', 'shrimp', 'scallop', 'shellfish', 'tilapia', 'halibut'] },
  { id: 'eggs-dish', label: 'Egg dishes (casseroles, quiche)', tempF: 160, tempC: 71, rest: 0,
    keywords: ['quiche', 'frittata', 'egg casserole', 'egg bake'] },
  { id: 'leftovers', label: 'Leftovers & casseroles (reheating)', tempF: 165, tempC: 74, rest: 0,
    keywords: ['leftover', 'reheat', 'casserole'] },
  { id: 'ham-fresh', label: 'Fresh or smoked (uncooked) ham', tempF: 145, tempC: 63, rest: 3,
    keywords: ['fresh ham', 'smoked ham', 'uncooked ham'] },
  { id: 'ham-precooked', label: 'Precooked ham (to reheat)', tempF: 140, tempC: 60, rest: 0,
    keywords: ['precooked ham', 'spiral ham', 'cooked ham'] },
];

// The "danger zone" — the range bacteria grow fastest in. Can double in
// number in as little as 20 minutes here. Core of nearly every food-handler
// exam question about time limits.
export const DANGER_ZONE_F = [40, 140];
export const DANGER_ZONE_C = [4, 60];

export const STORAGE_TEMPS = { fridgeF: 40, fridgeC: 4, freezerF: 0, freezerC: -18 };

// Perishable food out at room temp: 2 hours max, 1 hour if it's hot out.
export const TIME_LIMITS = { roomTempHours: 2, hotRoomTempHours: 1, hotThresholdF: 90 };

/** The safe-temp entry for a food, by keyword match against its name/description. */
export function safeTempFor(text) {
  const t = String(text || '').toLowerCase();
  return SAFE_COOK_TEMPS.find(s => s.keywords.some(kw => t.includes(kw))) || null;
}

/** Every distinct safe-temp entry relevant to a recipe's ingredient list —
    the specific numbers that actually apply to THIS dish, not a generic list. */
export function safeTempsForRecipe(ingredients) {
  const text = (ingredients || []).join(' ').toLowerCase();
  const seen = new Set();
  const out = [];
  for (const s of SAFE_COOK_TEMPS) {
    if (seen.has(s.id)) continue;
    if (s.keywords.some(kw => text.includes(kw))) { seen.add(s.id); out.push(s); }
  }
  return out;
}

/** "165°F (74°C)" / "145°F (63°C), rest 3 min" */
export function formatTemp(entry) {
  return `${entry.tempF}°F (${entry.tempC}°C)${entry.rest ? `, rest ${entry.rest} min` : ''}`;
}

/* ── KB-shaped entries for novaKnowledge.js's keyword-retrieval Q&A ────────
   Same { id, category, keywords, title, answer } shape as novaKnowledge's
   own KNOWLEDGE array, built with formatTemp()/the tables above so the
   numbers can't drift. novaKnowledge.js's existing chicken-temp/leftovers/
   rice-safety/thaw entries are untouched — these fill the gaps a real
   food-handler exam covers that weren't in the KB yet. */
export const FOOD_SAFETY_TOPICS = [
  {
    id: 'danger-zone', category: 'food-safety',
    keywords: ['danger zone', 'room temperature', 'left out', 'how long can food sit', 'sitting out', 'counter safe', 'left out overnight'],
    title: 'The "danger zone"',
    answer: `Bacteria grow fastest between ${DANGER_ZONE_F[0]}°F and ${DANGER_ZONE_F[1]}°F (${DANGER_ZONE_C[0]}–${DANGER_ZONE_C[1]}°C) — they can double in number in as little as 20 minutes in that range. Perishable food shouldn't sit at room temperature more than ${TIME_LIMITS.roomTempHours} hours — cut that to ${TIME_LIMITS.hotRoomTempHours} hour if it's hot out (above ${TIME_LIMITS.hotThresholdF}°F/32°C — think a picnic or a hot kitchen). Past that, refrigerate it or toss it; don't taste-test to check.`,
  },
  {
    id: 'safe-temps-general', category: 'food-safety',
    keywords: [
      'safe temperature', 'internal temp', 'is it done', 'meat thermometer', "how do i know it's cooked",
      'safe to eat temp', 'what temp', 'safe temp for', 'temp for this', 'temp should it be',
      "what's the temp", 'what temperature should',
    ],
    title: 'Safe minimum cooking temperatures',
    answer: `The only reliable test is a food thermometer in the thickest part, not touching bone: ${SAFE_COOK_TEMPS.map(s => `${s.label} — ${formatTemp(s)}`).join('; ')}. Color and juices running clear are rough signs, not proof.`,
  },
  {
    id: 'cross-contamination', category: 'food-safety',
    keywords: ['cross contamination', 'cross-contamination', 'raw meat cutting board', 'same cutting board', 'contaminate'],
    title: 'Avoiding cross-contamination',
    answer: `Use separate cutting boards — one for raw meat/poultry/seafood, another for produce and anything ready to eat. Store raw meat on the bottom shelf of the fridge, sealed, so juices can't drip onto other food below it. Wash your hands, knife, and cutting board with hot soapy water after touching raw meat, before touching anything else.`,
  },
  {
    id: 'hand-washing', category: 'food-safety',
    keywords: ['wash hands', 'handwashing', 'hand washing', 'clean hands'],
    title: 'Washing your hands',
    answer: `Wet your hands, soap up, and scrub for at least 20 seconds — backs of hands, between fingers, under nails — then rinse and dry with a clean towel. Wash before you start cooking, after handling raw meat/poultry/seafood/eggs, and after touching your phone, face, pets, or trash.`,
  },
  {
    id: 'marinade-reuse', category: 'food-safety',
    keywords: ['reuse marinade', 'marinade sauce', 'marinade safe', 'basting sauce'],
    title: 'Reusing a marinade',
    answer: `Never pour a marinade that touched raw meat, poultry, or seafood over the cooked dish as a sauce — it's carrying whatever was on the raw food. If you want to use it as a sauce, boil it hard for at least 1 minute first. Safer bet: set aside a separate portion before it ever touches raw meat.`,
  },
  {
    id: 'produce-washing', category: 'food-safety',
    keywords: ['wash produce', 'wash vegetables', 'wash fruit', 'rinse produce'],
    title: 'Washing produce',
    answer: `Rinse fresh fruits and vegetables under running water before eating, cutting, or cooking — even ones you're going to peel. A knife can drag whatever's on the skin into the flesh as you cut through it.`,
  },
  {
    id: 'sanitizing', category: 'food-safety',
    keywords: ['sanitize', 'sanitizing', 'disinfect cutting board', 'clean vs sanitize'],
    title: 'Cleaning vs. sanitizing',
    answer: `Cleaning removes visible dirt and food debris (soap and water). Sanitizing knocks germs down to a safe level on top of that — a solution of 1 tablespoon unscented bleach per gallon of water works; leave it wet on the surface for about a minute, then air-dry. Anything that touched raw meat, poultry, seafood, or eggs should get both.`,
  },
  {
    id: 'storage-temps', category: 'food-safety',
    keywords: ['fridge temperature', 'refrigerator temperature', 'freezer temperature', 'how cold should my fridge be'],
    title: 'Fridge & freezer temperatures',
    answer: `Keep your fridge at or below ${STORAGE_TEMPS.fridgeF}°F (${STORAGE_TEMPS.fridgeC}°C) and your freezer at or below ${STORAGE_TEMPS.freezerF}°F (${STORAGE_TEMPS.freezerC}°C). An appliance thermometer is the only way to know for sure — the dial settings aren't actual temperatures.`,
  },
];
