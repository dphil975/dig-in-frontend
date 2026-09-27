/* health/allergyProfile.js — consolidated Health & Safety module.
   Merged from src/lib/allergyProfile.js + src/lib/foodSafety.js as part of
   the lib/ → lib/health/ reorganization. The old flat files now re-export
   from here so nothing else in the app needs to change. No import
   conflicts between the two originals — this is a straight concatenation,
   each section marked with its source file below. */

/* ════════════════════════════════════════════════════════════════════════
   FROM: src/lib/allergyProfile.js
   ════════════════════════════════════════════════════════════════════════ */

/* allergyProfile.js — the 9 major food allergens, a user's flagged
   sensitivities/allergies, a symptom journal, and recipe scanning.

   Allergen presence is derived from ingredient text via keyword matching —
   the same pattern flavorProfile.js uses for its 8 flavors — not hand-tagged
   per recipe. That's a real limitation, not a live medical feed: keyword
   matching can miss indirect sources (a sauce that contains wheat without
   saying "wheat") and can't catch cross-contamination. detectPatterns() flags
   an ingredient logged in ≥2 reactions as "worth tracking further" — it is
   NOT a diagnosis. Nothing here should be read as medical advice; see
   ANAPHYLAXIS_NOTE below. */

export const ALLERGENS = [
  { id: 'milk',       label: 'Milk / Dairy' },
  { id: 'eggs',       label: 'Eggs' },
  { id: 'peanuts',    label: 'Peanuts' },
  { id: 'tree_nuts',  label: 'Tree Nuts' },
  { id: 'soy',        label: 'Soy' },
  { id: 'wheat',      label: 'Wheat / Gluten' },
  { id: 'fish',       label: 'Fish' },
  { id: 'shellfish',  label: 'Crustacean Shellfish' },
  { id: 'sesame',     label: 'Sesame' },
];

// Most (not all) soy sauce contains wheat — tamari is the wheat-free
// exception. Flagging "soy sauce" under both is the honest, conservative
// call for a keyword scanner that can't read a specific bottle's label.
// Exported so recipeTransform.js's "make this allergy-safe" rewrite can
// detect the exact same keywords scanRecipeAllergens() does below — one
// detection list, not two that could drift apart.
export const ALLERGEN_KW = {
  milk:      ['milk', 'cream', 'butter', 'cheese', 'yogurt', 'buttermilk', 'ghee', 'whey', 'casein', 'half and half', 'half-and-half'],
  eggs:      ['egg', 'eggs', 'egg white', 'egg yolk', 'mayonnaise', 'mayo', 'meringue'],
  peanuts:   ['peanut', 'peanuts', 'peanut butter', 'peanut oil'],
  tree_nuts: ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'brazil nut', 'pine nut'],
  soy:       ['soy', 'soy sauce', 'soybean', 'tofu', 'edamame', 'miso', 'tempeh', 'soy milk'],
  wheat:     ['wheat', 'flour', 'all-purpose flour', 'bread', 'pasta', 'noodles', 'panko', 'breadcrumbs', 'soy sauce'],
  fish:      ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'anchovies', 'fish sauce', 'bonito'],
  shellfish: ['shrimp', 'crab', 'lobster', 'prawns', 'crawfish', 'crayfish'],
  sesame:    ['sesame', 'sesame oil', 'sesame seeds', 'tahini'],
};

export const SUBSTITUTIONS = {
  peanuts:   ['Sunflower seed butter', 'Sesame seeds', 'Sunflower seeds', 'Pumpkin seeds (pepitas)'],
  tree_nuts: ['Roasted chickpeas', 'Sunflower seeds', 'Pumpkin seeds', 'Peanut butter (if not peanut-allergic)'],
  milk:      ['Soy milk', 'Oat milk', 'Almond milk', 'Cashew milk', 'Coconut milk', 'Rice milk'],
  eggs:      ['¼ cup applesauce', '½ mashed banana', '1 chia egg (1 tsp chia seeds + 1 tbsp water)', '1 flax egg (1 tsp ground flax + 1 tbsp water)'],
  fish:      ['Chicken, beef, or pork', 'Plant-based protein (soy, beans)'],
  shellfish: ['Chicken, beef, pork, or fish (if not fish-allergic)', 'Plant-based protein (soy, beans)'],
  soy:       ['Coconut aminos (instead of soy sauce)', 'Canola oil (instead of soybean oil)', 'Olive oil (instead of soybean oil)'],
  wheat:     ['Gluten-free flour blend', 'Corn flour', 'Rice flour', 'Oat flour', 'Potato flour', 'Quinoa flour'],
  sesame:    ['Sunflower seeds', 'Chia seeds', 'Hemp seeds', 'Safflower oil (instead of sesame oil)'],
};

export const SYMPTOM_CATEGORIES = [
  { id: 'skin',        label: 'Skin',        symptoms: ['Rash', 'Hives', 'Eczema', 'Swelling', 'Itching'] },
  { id: 'respiratory', label: 'Respiratory', symptoms: ['Wheezing', 'Coughing', 'Runny nose', 'Throat tightness'] },
  { id: 'digestive',   label: 'Digestive',   symptoms: ['Belly pain', 'Nausea', 'Vomiting', 'Diarrhea'] },
  { id: 'severe',      label: 'Severe — seek emergency care', symptoms: ['Airway tightening', 'Swollen throat', 'Drop in blood pressure', 'Rapid pulse', 'Confusion', 'Dizziness'] },
];

export const SEVERITY_LEVELS = ['mild', 'moderate', 'severe'];
export const TIMING_OPTIONS = ['immediate', 'within 1–2 hours', 'delayed (2+ hours)'];

export const ANAPHYLAXIS_NOTE =
  'Anaphylaxis is life-threatening and needs emergency treatment (epinephrine). This is a personal tracking tool, not medical advice — talk to a doctor or allergist about diagnosis, testing, and an emergency action plan.';

// ── User's flagged allergens: grey (unflagged/safe) / yellow (sensitivity) / red (allergy) ──
const PROFILE_KEY = 'dig_in_allergy_profile'; // { [allergenId]: 'sensitivity' | 'allergy' }

export function loadAllergyProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); } catch { return {}; }
}

/** status: 'sensitivity' | 'allergy' | null (clears the flag — back to "safe"). */
export function setAllergenStatus(allergenId, status) {
  const profile = loadAllergyProfile();
  if (status) profile[allergenId] = status;
  else delete profile[allergenId];
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch { /* ignore */ }
  return profile;
}

// ── Symptom journal ─────────────────────────────────────────────────────
const JOURNAL_KEY = 'dig_in_allergy_journal';

export function loadJournal() {
  try { const v = JSON.parse(localStorage.getItem(JOURNAL_KEY)); return Array.isArray(v) ? v : []; } catch { return []; }
}

function saveJournal(list) {
  try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export function logReaction({ mealName, suspectedIngredients, symptoms, severity, timing }) {
  const list = loadJournal();
  list.unshift({
    id: `rxn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    mealName: (mealName || '').trim(),
    suspectedIngredients: (suspectedIngredients || []).map(s => s.trim()).filter(Boolean),
    symptoms: symptoms || [],
    severity: severity || 'mild',
    timing: timing || 'within 1–2 hours',
    ts: Date.now(),
  });
  saveJournal(list);
  return list;
}

export function removeJournalEntry(id) {
  const list = loadJournal().filter(e => e.id !== id);
  saveJournal(list);
  return list;
}

/**
 * Ingredients logged as a suspected cause in 2+ separate journal entries —
 * "worth tracking further," never phrased as a diagnosis.
 */
export function detectPatterns() {
  const counts = {};
  for (const entry of loadJournal()) {
    for (const ing of entry.suspectedIngredients || []) {
      const k = ing.trim().toLowerCase();
      if (!k) continue;
      counts[k] = (counts[k] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([ingredient, count]) => ({ ingredient, count }));
}

// ── Recipe scanning ──────────────────────────────────────────────────────
/**
 * Every allergen detected in an ingredient list, with the user's own flagged
 * status (if any) and substitution ideas. Detection isn't gated on the user
 * having flagged the allergen — this returns the full picture; callers that
 * only want warnings should filter to `userStatus` being set.
 */
export function scanRecipeAllergens(ingredients) {
  const text = (ingredients || []).join(' ').toLowerCase();
  if (!text) return [];
  const profile = loadAllergyProfile();
  const detected = [];
  for (const a of ALLERGENS) {
    const kws = ALLERGEN_KW[a.id] || [];
    const matched = [...new Set(kws.filter(kw => text.includes(kw)))];
    if (!matched.length) continue;
    detected.push({
      allergen: a.id,
      label: a.label,
      matchedKeywords: matched,
      userStatus: profile[a.id] || null,
      substitutions: SUBSTITUTIONS[a.id] || [],
    });
  }
  return detected;
}

/** Only the allergens the user has actually flagged — the real warning set. */
export function flaggedAllergensInRecipe(ingredients) {
  return scanRecipeAllergens(ingredients).filter(d => d.userStatus);
}

/* ════════════════════════════════════════════════════════════════════════
   FROM: src/lib/foodSafety.js
   ════════════════════════════════════════════════════════════════════════ */

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
