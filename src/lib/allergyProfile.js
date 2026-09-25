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
