/**
 * Dig In API Client
 * Node.js backend  (localhost:5000) — recipes DB, uploads, knowledge
 * Python service   (localhost:5001) — extraction, ML, menu parsing
 * Flask backend    (localhost:5002) — pantry, rolodex, grocery, timers
 */

// Backend base URLs. Empty by default so the deployed site (which has no backend
// yet) doesn't hang trying to reach localhost. When a backend is deployed, set
// VITE_API_BASE / VITE_PYTHON_BASE / VITE_FLASK_BASE in a .env file (locally) or
// in the Vercel project's Environment Variables — no code change needed.
const API_BASE    = import.meta.env.VITE_API_BASE    ?? '';
const PYTHON_BASE = import.meta.env.VITE_PYTHON_BASE ?? '';
const FLASK_BASE  = import.meta.env.VITE_FLASK_BASE  ?? '';

// Static recipe database shipped with the app (public/data/recipes_full.json).
// Used as the source of truth whenever no live backend is configured, so the
// core browse/search experience works on the deployed site with zero servers.
let _staticRecipesPromise = null;
function loadStaticRecipes() {
  if (!_staticRecipesPromise) {
    _staticRecipesPromise = fetch('/data/recipes_full.json')
      .then(r => (r.ok ? r.json() : { recipes: [] }))
      .then(d => (Array.isArray(d) ? d : (d.recipes || [])))
      .catch(() => []);
  }
  return _staticRecipesPromise;
}

const CUISINE_EMOJI = {
  italian: 'ITALIAN', mexican: 'MEXICAN', japanese: 'JAPANESE',
  indian: 'INDIAN', thai: 'THAI', chinese: 'CHINESE', french: 'FRENCH',
};
const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function pythonRequest(path, options = {}) {
  const res = await fetch(`${PYTHON_BASE}${path}`, options);
  if (!res.ok) throw new Error(`Python API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function flaskRequest(path, options = {}) {
  const res = await fetch(`${FLASK_BASE}${path}`, options);
  if (!res.ok) throw new Error(`Flask API ${res.status}: ${await res.text()}`);
  return res.json();
}

function normalizeIngredients(raw = []) {
  return raw.map(ing => {
    if (typeof ing === 'string') return ing;
    const qty = ing.quantity
      ? `${ing.quantity}${ing.unit ? ' ' + ing.unit : ''}`
      : (ing.amount || '');
    return qty ? `${qty} ${ing.name || ing}` : (ing.name || String(ing));
  });
}

function normalizeSteps(raw = []) {
  return raw.map(s => (typeof s === 'string' ? s : s.text || s.instruction || String(s)));
}

export function normalizeRecipe(r) {
  const cuisineRaw    = r.cuisine || r.cuisine_type || '';
  const difficultyRaw = (r.difficulty || r.difficulty_level || 'easy').toLowerCase();
  const dietaryTags   = r.dietary_tags || r.diet_tags || [];
  const cuisineKey    = cuisineRaw.toLowerCase();
  const diffLabel     = DIFFICULTY_LABEL[difficultyRaw] || 'Easy';
  const cuisineDisplay = cuisineRaw ? cuisineRaw.charAt(0).toUpperCase() + cuisineRaw.slice(1) : 'World';
  // Recipes in recipes_full.json carry `source_file` (the book/collection they
  // were extracted from); `source_book` was the old key and no longer exists.
  const sourceBook = r.source_book || r.source_file || 'cookbook';
  const description = r.description || (dietaryTags.length
    ? `${dietaryTags.join(', ')} · from ${sourceBook}`
    : `From ${sourceBook}`);

  return {
    id: r.id,
    name: r.name,
    cuisine: cuisineDisplay,
    description,
    pixelEmoji: CUISINE_EMOJI[cuisineKey] || 'DISH',
    difficulty: diffLabel,
    time: r.total_time || (r.prep_time || 0) + (r.cook_time || 0) || 25,
    skillLevel: diffLabel,
    prepTime: r.prep_time || 10,
    cookTime: r.cook_time || 15,
    totalTime: r.total_time || (r.prep_time || 0) + (r.cook_time || 0) || 25,
    rating: 4,
    ingredients: normalizeIngredients(r.ingredients),
    instructions: normalizeSteps(r.instructions),
    tips: Array.isArray(r.tips) ? r.tips : (r.tips ? [r.tips] : []),
    substitutions: r.substitutions || null,
    dietary_tags: dietaryTags,
  };
}

export function normalizeMenuRecipe(r) {
  const diffLabel = r.difficulty
    ? r.difficulty.charAt(0).toUpperCase() + r.difficulty.slice(1) : 'Easy';
  return {
    id: `menu_${Date.now()}`,
    name: r.original_name || r.name || 'Recreated Dish',
    cuisine: r.restaurant || 'Restaurant',
    description: `Recreated from ${r.restaurant || 'restaurant'} · Est. $${r.cost_estimate || '?'}`,
    pixelEmoji: 'DISH',
    difficulty: diffLabel,
    time: r.total_time || 30,
    skillLevel: diffLabel,
    prepTime: null, cookTime: null,
    totalTime: r.total_time || 30,
    rating: 4,
    ingredients: normalizeIngredients(r.ingredients),
    instructions: normalizeSteps(r.instructions),
    tips: Array.isArray(r.tips) ? r.tips : (r.tips ? [r.tips] : []),
    substitutions: r.substitutions || null,
    shopping_list: r.shopping_list || [],
    store_suggestions: r.store_suggestions || [],
    cost_estimate: r.cost_estimate,
  };
}

// ── Recipes ──────────────────────────────────────────────────────────────────
// When a backend is configured (API_BASE set) we use it; otherwise we read the
// static recipe database that ships with the app. Either way the callers get the
// same normalized shape.
async function staticFetchRecipes(limit, cuisine) {
  let rows = await loadStaticRecipes();
  if (cuisine) {
    const c = String(cuisine).toLowerCase();
    rows = rows.filter(r =>
      (r.cuisine || r.cuisine_type || '').toLowerCase().includes(c) ||
      (r.recipe_type || '').toLowerCase().includes(c));
  }
  return rows.slice(0, limit).map(normalizeRecipe);
}

export async function fetchRecipes(limit = 100, cuisine = null) {
  if (API_BASE) {
    try {
      const params = new URLSearchParams({ limit });
      if (cuisine) params.set('type', cuisine);
      const data = await request(`/api/recipes?${params}`);
      const rows = Array.isArray(data) ? data : (data.recipes || []);
      if (rows.length) return rows.map(normalizeRecipe);
    } catch { /* fall through to static */ }
  }
  return staticFetchRecipes(limit, cuisine);
}

export async function searchRecipes(query) {
  if (API_BASE) {
    try {
      const data = await request(`/api/recipes/search/${encodeURIComponent(query)}`);
      const rows = Array.isArray(data) ? data : (data.results || []);
      if (rows.length) return rows.map(normalizeRecipe);
    } catch { /* fall through to static */ }
  }
  const q = String(query || '').toLowerCase().trim();
  const rows = await loadStaticRecipes();
  return rows
    .filter(r =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.full_name || '').toLowerCase().includes(q) ||
      (r.cuisine || '').toLowerCase().includes(q) ||
      (r.ingredients || []).some(i => String(i).toLowerCase().includes(q)))
    .slice(0, 30)
    .map(normalizeRecipe);
}

export async function checkHealth() { return request('/health'); }

// ── Menu Recreation ───────────────────────────────────────────────────────────
export async function recreateMenuItem(name, description, restaurant) {
  const data = await pythonRequest('/api/extract-menu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ menuText: description ? `${name}: ${description}` : name, menuType: 'restaurant' }),
  });
  const first = (data.recipes || [])[0] || {};
  return normalizeMenuRecipe({ ...first, original_name: name, restaurant });
}

// ── Uploads ───────────────────────────────────────────────────────────────────
async function uploadAndPoll(file) {
  const form = new FormData();
  form.append('file', file);
  const result = await request('/api/uploads', { method: 'POST', body: form });
  return {
    uploadId: result.uploadId,
    book: result.book || file.name.replace(/\.[^.]+$/, ''),
    book_type: result.book_type || ['cookbook'],
    recipes_extracted: result.recipes_extracted || 0,
    recipes: result.recipes || [],
    science_concepts_extracted: result.science_concepts_extracted || 0,
  };
}
export const uploadPDF       = (file) => uploadAndPoll(file);
export const uploadEPUB      = (file) => uploadAndPoll(file);
export const uploadMenuImage = (file) => uploadAndPoll(file);

// ── Knowledge ─────────────────────────────────────────────────────────────────
export const getFoodScience     = (concept)    => request(`/api/knowledge/reactions?ingredient=${encodeURIComponent(concept)}`);
export const getSubstitutions   = (ingredient) => request(`/api/knowledge/ingredients/${encodeURIComponent(ingredient)}/substitutes`);

// ── Flask (pantry / rolodex / timers) ────────────────────────────────────────
export const checkFlaskHealth    = ()  => flaskRequest('/api/health');
export const scanPantry          = (ingredients) => flaskRequest('/api/scan_pantry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ingredients }) });
export const getIngredientSubstitute = (missing, available) => flaskRequest('/api/substitute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ missing_ingredient: missing, available_ingredients: available }) });
export const spinRolodex         = (filters = {}) => flaskRequest(`/api/spin_rolodex?${new URLSearchParams(filters)}`);
export const searchByIngredient  = (ingredient)   => flaskRequest(`/api/search_recipe?q=${encodeURIComponent(ingredient)}`);
export const getShoppingList     = (ingredients, location) => flaskRequest('/api/shopping_list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ingredients, location }) });
export const getCookingTimeline  = (recipeName)   => flaskRequest('/api/timeline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipe_name: recipeName }) });
export const startCookingTimer   = (durationSeconds, stepName) => flaskRequest('/api/start_timer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ duration_seconds: durationSeconds, step_name: stepName }) });

// ── Rural Trend / Impact Logistics ───────────────────────────────────────────
// Live rotating deals (22 per 5-min slot, seeded by time)
export const getLiveDeals = () => request('/api/live-deals');

// Nearest stores — Node proxies to Python service
export const getNearbyStores = (lat, lng, radiusKm = 25) =>
  request(`/api/stores/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`);

// Optimized shopping list from Flask service
export const planShoppingList = (ingredients, location) =>
  flaskRequest('/api/shopping_list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredients, location }),
  });

// A/B impact event — fire-and-forget, never rejects
export const trackImpactEvent = (flagName, variant, eventType, metadata = {}) =>
  request('/api/ab/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ flagName, variant, eventType, metadata }),
  }).catch(() => {});

/* ═══════════════════════════════════════════════════════════════════════════
   Seasoning Pairing Engine (merged from seasoningPairingEngine)
   Seasoning layers, missing elements, neuroscience of taste, craving archetypes.
   ═══════════════════════════════════════════════════════════════════════════ */

export const SEASONING_LAYERS = [
  {
    stage: 0, name: 'Foundation — The Primer',
    timing: '30 min to 24 hrs before cooking', makeup: 'Primer', emoji: 'FOUNDATION',
    what: 'Dry brine (salt directly on protein or veg)',
    why: 'Salt applied early travels through the food via osmosis, seasoning it from the inside.',
    rule: "Salt earlier than feels right. A 30-minute sit beats a 30-second toss every single time.",
    howMuch: '¾ tsp kosher salt per pound of protein. ¼ tsp per cup of vegetables.',
    doNot: 'Do not cover tightly — moisture needs to evaporate off the surface. Dry skin = better crust.',
  },
  {
    stage: 1, name: 'Aromatics — The Base Coat',
    timing: 'First 2-3 minutes of cooking, in fat', makeup: 'Base coat / foundation', emoji: 'AROMATICS',
    what: 'Onion, shallot, garlic, ginger, whole spices (bloom in oil or butter)',
    why: "Aromatics build the direction of the dish. Their most powerful flavor compounds are fat-soluble. You can't add this layer later.",
    rule: "Cook aromatics until soft and golden, not until done.",
    howMuch: '1 medium onion and 3 garlic cloves is a base for 2-4 servings.',
    doNot: "Don't rush this step. Undercooked raw garlic tastes sharp and unpleasant.",
  },
  {
    stage: 2, name: 'Primary Spices — The Color',
    timing: '60-90 seconds in the hot fat, before any liquid', makeup: 'Eye shadow / the main color story', emoji: 'PRIMARY',
    what: 'Dried spices (cumin, turmeric, paprika, chili, coriander, garam masala)',
    why: 'Blooming dried spices in oil for 60 seconds makes them 4–10× more potent than if added later.',
    rule: 'Add spices after aromatics have softened, before stock or water. Stir constantly for 60-90 seconds.',
    howMuch: 'Start with half the amount you expect. You can always add more.',
    doNot: "Don't add chili powder to raw oil over high heat — it burns in under 30 seconds.",
  },
  {
    stage: 3, name: 'Depth Builders — The Contour',
    timing: 'Mid-cook, with your main liquid or protein', makeup: 'Contouring / bronzer', emoji: 'DEPTH',
    what: 'Tomato paste, miso, soy sauce, fish sauce, worcestershire, anchovies, parmesan rind, mushroom powder',
    why: "Concentrated glutamates that make flavor 3D instead of flat.",
    rule: 'Pick one or two, not five. These are concentrates — treat them like makeup, not paint.',
    howMuch: '1 tbsp tomato paste per cup of sauce. 1 tsp soy per serving. Start small.',
    doNot: "Don't add all your umami sources at once. Layer them in.",
  },
  {
    stage: 4, name: 'Final Seasoning — The Setting Spray',
    timing: 'Last 2 minutes, or off heat', makeup: 'Setting spray', emoji: 'FINAL',
    what: 'Acid (lemon, lime, vinegar, wine), final salt adjustment, black pepper',
    why: "Acid is the most overlooked seasoning. It brightens, lifts, and sharpens. It evaporates fast under heat, so add at the end.",
    rule: "Taste before you add acid. You are looking for the moment when things come into focus.",
    howMuch: '½ tsp per serving as a starting point.',
    doNot: "Never add lemon juice to a cream sauce while it is boiling — it will curdle.",
  },
  {
    stage: 5, name: 'Finishing Touches — The Highlighter',
    timing: 'On the plate, right before it hits the table', makeup: 'Highlighter / finishing touches', emoji: 'FINISHING',
    what: 'Fresh herbs, flaky sea salt, finishing-grade olive oil, chili crisp, toasted nuts, citrus zest',
    why: "Aroma and texture compounds that disappear under heat. They elevate the dish from 'cooked' to 'presented.'",
    rule: 'Everything in this layer goes on cold, raw, and last.',
    howMuch: '5-6 torn basil leaves, a 3-second drizzle of finishing oil, a pinch of Maldon, ½ tsp lemon zest.',
    doNot: "Never cook with finishing olive oil — heat destroys its aroma compounds.",
  },
];

export const MISSING_ELEMENTS = {
  pasta:      { emoji: 'DISH', secret: 'Reserve pasta water — the real sauce emulsifier',      why: 'Pasta water is starchy, salty water that acts as a natural emulsifier.',                                      technique: 'Scoop out ½ cup just before draining. Add 1-2 tbsp at a time while tossing.', stage: 4 },
  curry:      { emoji: 'DISH', secret: 'Bloom whole spices in ghee before anything else',      why: 'Fat-soluble compounds in whole spices cannot be replicated by powdered spice.',                               technique: 'Heat ghee. Add whole spices. Wait for sizzle (30-60 seconds). Then add onion.', stage: 1 },
  steak:      { emoji: 'DISH', secret: 'Compound butter baste in the final 90 seconds',        why: 'Cold butter creates a self-basting foam; milk solids brown and coat the crust.',                               technique: 'Add 2 tbsp cold butter + smashed garlic + thyme. Spoon foaming butter over the steak for 90 seconds.', stage: 5 },
  soup:       { emoji: 'DISH', secret: 'Parmesan rind simmered in the broth',                  why: "Releases glutamates into the broth — deeper flavor without obvious dairy.",                                    technique: "Add 1-2 parmesan rinds at start of simmer. Remove before serving.", stage: 3 },
  rice:       { emoji: 'DISH', secret: 'Toast dry in butter before adding water',              why: "Triggers the Maillard reaction — nutty, popcorn-like flavor compounds.",                                      technique: 'Stir dry rice in butter over medium heat for 2-3 minutes. Then add liquid.', stage: 1 },
  chicken:    { emoji: 'DISH', secret: 'Dry brine uncovered in the fridge',                    why: "Salt draws out surface moisture via osmosis, which reabsorbs with the salt. Dries the skin for crispy sear.",  technique: 'Salt generously. Rack in fridge uncovered 30 min to 24 hours. Pat dry before cooking.', stage: 0 },
  fish:       { emoji: 'DISH', secret: 'Start in a cold pan, bring the heat up slowly',        why: 'Cooks more evenly, builds crust gradually without shocking the protein.',                                      technique: 'Pat dry. Skin-side down in cold non-stick pan. Medium heat. Do not touch for 4-5 minutes.', stage: 0 },
  beans:      { emoji: 'DISH', secret: 'Salt the cooking water + add epazote herb',            why: "Early salting seasons the interior deeply while keeping the skin intact.",                                      technique: "1 tsp kosher salt + 2 epazote leaves per cup of dried beans from the start.", stage: 0 },
  eggs:       { emoji: 'DISH', secret: 'Low heat, cold butter, constant motion — pull off early', why: "Low heat keeps protein curds small and creamy.",                                                              technique: 'Medium-low heat. Stir constantly. Add cold butter halfway. Remove at 80% set.', stage: 4 },
  bread:      { emoji: 'DISH', secret: 'Steam in the oven for the first 15 minutes',          why: "Steam keeps the crust pliable, allowing full oven spring before it sets.",                                      technique: "Cast iron skillet on bottom rack. Pour ½ cup boiling water in when bread goes in. Remove at 15 min.", stage: 2 },
  sauce:      { emoji: 'DISH', secret: 'Deglaze the pan — never waste the brown bits',         why: "Brown bits are concentrated Maillard compounds — pure concentrated flavor.",                                    technique: 'With pan still hot, add ¼ cup wine/stock/acid. Scrape the bottom vigorously.', stage: 3 },
  vegetables: { emoji: 'DISH', secret: 'High heat, single layer, do not stir — let them brown', why: "Caramelization turns sugars into hundreds of flavor compounds.",                                                technique: '425°F+. Single layer, 1 inch spacing. Do not stir until 20-minute mark.', stage: 2 },
};

export const NEURO_TASTE_FACTS = [
  { id: 'smell-is-flavor',      title: '80% of what you taste is actually smell',                  body: "Your tongue detects only five basic qualities. Everything else comes from retronasal olfaction.",                          brain: 'Olfactory bulb → orbitofrontal cortex → amygdala', applies: ['all'] },
  { id: 'dopamine-reward',      title: 'High fat + high sugar is the dopamine jackpot',            body: "The combination triggers a disproportionately large dopamine spike.",                                                     brain: 'VTA → nucleus accumbens → prefrontal cortex', applies: ['rich', 'sweet'] },
  { id: 'ghrelin-anticipation', title: 'Hunger is learned — ghrelin spikes on your usual schedule', body: "Ghrelin rises at your usual mealtimes even if you just ate.",                                                             brain: 'Stomach → bloodstream → hypothalamus', applies: ['all'] },
  { id: 'capsaicin-endorphin',  title: "Chili heat is pain — and the brain responds with endorphins", body: "Capsaicin binds to TRPV1 receptors. The brain releases endorphins in response.",                                         brain: 'TRPV1 → trigeminal nerve → brain stem → endorphin release', applies: ['spicy'] },
  { id: 'umami-satiety',        title: 'Umami tells your brain protein has arrived',               body: "T1R1+T1R3 receptors send 'protein detected' signals, modulating satiety hormones.",                                       brain: 'T1R1+T1R3 → nucleus of the solitary tract → hypothalamus', applies: ['umami', 'savory'] },
  { id: 'crunch-amplifies',     title: 'The sound of crunch makes food taste better',              body: "Chips with louder crunch sounds were rated significantly crisper (Zampini & Spence 2004).",                                brain: 'Auditory + somatosensory + gustatory cortex → multisensory integration', applies: ['crunchy', 'texture'] },
  { id: 'salt-stress',          title: 'Salt cravings can signal elevated cortisol',               body: "Chronic stress disrupts aldosterone signaling, causing increased sodium excretion.",                                        brain: 'Adrenal axis → aldosterone → renal sodium sensing → nucleus accumbens', applies: ['salty'] },
  { id: 'sweet-serotonin',      title: 'Sugar cravings are often the brain asking for serotonin',  body: "Complex carbohydrates help tryptophan cross the blood-brain barrier for serotonin synthesis.",                             brain: 'Gut tryptophan → insulin → blood-brain barrier → raphe nuclei', applies: ['sweet'] },
  { id: 'memory-flavor',        title: "A flavor can unlock a memory before the brain knows why",  body: "The olfactory bulb has direct projections to amygdala and hippocampus — no other sense does this.",                        brain: 'Olfactory bulb → amygdala + hippocampus (direct)', applies: ['comfort', 'rich', 'all'] },
  { id: 'gut-brain-axis',       title: 'Your gut bacteria influence what you crave',               body: "Gut bacteria produce signaling molecules via the vagal nerve that influence food preference.",                             brain: 'Gut microbiome → vagal nerve → nucleus of the solitary tract → hypothalamus', applies: ['all'] },
];

export const CRAVING_ARCHETYPES = {
  rich: {
    id: 'rich', label: 'Rich & Comforting', emoji: 'RICH',
    keywords: ['creamy','rich','heavy','comfort','mac','cheese','potato','cheesy','pasta','butter','filling','warm','cozy','heavy cream','thick'],
    brainState: 'Dopamine + serotonin seeking. Cold weather, stress, or emotional fatigue push toward calorie-dense food.',
    bodyNeed: 'Tryptophan (serotonin precursor) + complex carbohydrates.',
    seasoningFocus: ['Foundation (salt) — season aggressively early', 'Depth builders (parmesan, miso, worcestershire)', 'Acid at the end — cuts the heaviness'],
    layersToFocus: [0, 3, 4], missingElementCategory: 'pasta',
    recipeDirection: 'lean into fat + starch, umami depth, finish with acid',
    recipes: [
      { title: 'Spicy Cajun Chicken Alfredo', totalTime: 28, description: 'Creamy pasta with blackened chicken.', ingredientsList: ['Chicken thighs','Heavy cream','Pappardelle','Parmesan','Cajun seasoning','Lemon','Parsley'], instructions: ['Dry brine chicken 30 min.','Sear 6 min/side. Rest and slice.','Garlic → tomato paste bloom 60s.','Cream + parmesan, toss with pasta + pasta water.','Off heat: lemon, parsley, flaky salt.'], missingElement: 'pasta', flavorNotes: 'The lemon is not optional.' },
      { title: 'Brown Butter Sage Gnocchi', totalTime: 22, description: 'Pan-fried gnocchi in nutty brown butter.', ingredientsList: ['Gnocchi','Butter','Sage','Parmesan','Lemon zest','Black pepper'], instructions: ['Boil gnocchi. Reserve ¼ cup pasta water.','Brown butter until nutty and amber.','Crisp sage 30 seconds.','Add gnocchi, do not stir 2 min.','Add pasta water, parmesan, lemon zest.'], missingElement: 'pasta', flavorNotes: 'Brown butter converts dairy into 100+ Maillard compounds.' },
    ],
  },
  salty: {
    id: 'salty', label: 'Salty & Crunchy', emoji: 'SALTY',
    keywords: ['salty','crunchy','crispy','chips','crackers','pretzels','popcorn','pickle','fried','crisp','snack','peanut','nachos','salt'],
    brainState: 'Elevated cortisol or electrolyte depletion.',
    bodyNeed: 'Sodium + potassium + magnesium.',
    seasoningFocus: ['Umami over pure salt', 'Textural contrast', 'Acid as counterpoint'],
    layersToFocus: [2, 3, 5], missingElementCategory: 'vegetables',
    recipeDirection: 'textural contrast and umami-heavy seasoning',
    recipes: [
      { title: 'Miso-Glazed Roasted Chickpeas + Greens Bowl', totalTime: 35, description: 'Crispy chickpeas in miso glaze.', ingredientsList: ['Chickpeas','White miso','Sesame oil','Soy sauce','Rice vinegar','Rice','Leafy green'], instructions: ['Dry chickpeas. Dry brine 20 min.','Roast 425°F, single layer, 25 min.','Mix miso + soy + sesame oil + vinegar.','Toss hot chickpeas in glaze.','Serve over rice and greens.'], missingElement: 'vegetables', flavorNotes: 'Miso satisfies at half the sodium of straight salt.' },
      { title: 'Shoyu Popcorn with Nori', totalTime: 12, description: 'Stovetop popcorn with soy butter and nori.', ingredientsList: ['Popcorn kernels','Oil','Butter','Soy sauce','Nori','Sesame seeds'], instructions: ['Pop corn. Transfer to bowl.','Melt butter + ½ tsp soy.','Pour over hot popcorn. Toss.','Crumble nori. Add sesame seeds.'], missingElement: 'vegetables', flavorNotes: 'Nori and soy double the glutamate sources.' },
    ],
  },
  sweet: {
    id: 'sweet', label: 'Sweet & Indulgent', emoji: 'SWEET',
    keywords: ['sweet','chocolate','dessert','candy','caramel','sugar','cake','cookie','ice cream','brownie','sweet tooth','honey','vanilla','maple'],
    brainState: 'Low blood glucose, low serotonin, or emotional eating trigger.',
    bodyNeed: 'Tryptophan access or acute glucose.',
    seasoningFocus: ['Salt amplifies sweetness', 'Acid brightens sweet', 'Brown the butter'],
    layersToFocus: [0, 5], missingElementCategory: 'bread',
    recipeDirection: 'add contrasting layer (salt, acid, bitterness)',
    recipes: [
      { title: 'Salted Dark Chocolate Oat Cookies', totalTime: 25, description: 'Chewy oat cookies with dark chocolate and flaky salt.', ingredientsList: ['Oats','Browned butter','Brown sugar','Egg','70% chocolate','Vanilla','Flaky salt'], instructions: ['Brown butter 5 min. Cool.','Whisk butter + sugar + egg + vanilla.','Mix in oats and chocolate chunks. Chill 10 min.','Bake 375°F, 11-13 min.','Flaky salt on each while hot.'], missingElement: 'bread', flavorNotes: 'Brown butter is the biggest upgrade here.' },
      { title: 'Miso Caramel Sweet Potato', totalTime: 40, description: 'Roasted sweet potato with miso-honey glaze.', ingredientsList: ['Sweet potatoes','White miso','Honey','Butter','Vanilla','Flaky salt','Sesame'], instructions: ['Halve. Oil. Roast cut-side down 425°F 25 min.','Mix miso + honey + water.','Flip. Brush glaze. 10 more min.','Finish with cold butter and flaky salt.'], missingElement: 'vegetables', flavorNotes: 'Miso + honey at 1:2 reads both sweet and savory.' },
    ],
  },
  spicy: {
    id: 'spicy', label: 'Spicy & Bold', emoji: 'SPICY',
    keywords: ['spicy','hot','jalapeño','sriracha','fire','burn','chili','pepper','tabasco','habanero','buffalo','heat','kick'],
    brainState: 'Endorphin-seeking via capsaicin.',
    bodyNeed: 'Endorphin stimulation. Mild anti-inflammatory properties.',
    seasoningFocus: ['Bloom dried chili in oil (Stage 2)', 'Fresh chili at end (Stage 5)', 'Acid balances spice', 'Fat carries capsaicin'],
    layersToFocus: [2, 4, 5], missingElementCategory: 'sauce',
    recipeDirection: 'layer heat at multiple stages',
    recipes: [
      { title: 'Mapo Tofu', totalTime: 30, description: 'Silken tofu in numbing, spicy, savory sauce.', ingredientsList: ['Silken tofu','Ground pork','Doubanjiang','Sichuan peppercorn','Garlic','Ginger','Soy sauce','Sesame oil','Cornstarch slurry','Green onion'], instructions: ['Toast + grind Sichuan peppercorn.','Bloom doubanjiang in oil 2 min.','Add garlic + ginger.','Add pork. Cook. Add soy sauce.','Add tofu. Simmer. Thicken. Finish with sesame oil + peppercorn + green onion.'], missingElement: 'sauce', flavorNotes: 'Doubanjiang is fermented chili + soybean — umami and heat together.' },
    ],
  },
  fresh: {
    id: 'fresh', label: 'Fresh & Light', emoji: 'FRESH',
    keywords: ['fresh','light','salad','clean','healthy','green','crisp','bright','raw','detox','citrus','herb','simple'],
    brainState: 'Micronutrient-seeking or hedonic reset.',
    bodyNeed: 'Vitamin C, folate, magnesium, chlorophyll.',
    seasoningFocus: ['Acid is primary', 'Fresh herbs are load-bearing', 'Salt last and lightly', 'Texture contrast'],
    layersToFocus: [4, 5], missingElementCategory: 'vegetables',
    recipeDirection: 'let acid and fresh herbs carry the flavor',
    recipes: [
      { title: 'Herb-Forward Grain Bowl', totalTime: 20, description: 'Farro or quinoa with loads of herbs and lemon-tahini.', ingredientsList: ['Farro/quinoa','Cucumber','Tomatoes','Mint','Parsley','Dill','Feta','Lemon','Tahini','Olive oil','Flaky salt'], instructions: ['Cook grain. Cool.','Chop herbs aggressively — 1 cup per 2 servings.','Whisk lemon + tahini + water + salt.','Combine. Dress right before eating.','Top with feta, finishing oil, flaky salt.'], missingElement: 'vegetables', flavorNotes: 'Herbs at this volume are transformative.' },
    ],
  },
  umami: {
    id: 'umami', label: 'Umami & Savory Depth', emoji: 'UMAMI',
    keywords: ['umami','savory','broth','ramen','miso','mushroom','soy','steak','meat','deep','rich umami','salty savory','parmesan','anchovy'],
    brainState: 'Protein-sensing hypothalamic signaling.',
    bodyNeed: 'Amino acids, particularly glutamate and cysteine.',
    seasoningFocus: ['Layer glutamate sources', 'Long slow heat develops glutamates', 'Acid sharpens umami'],
    layersToFocus: [1, 3, 4], missingElementCategory: 'soup',
    recipeDirection: 'stack glutamate sources and long cooking techniques',
    recipes: [
      { title: 'Mushroom + Miso Ramen Broth', totalTime: 45, description: 'Vegetarian broth from dried mushroom, kombu, miso, and soy.', ingredientsList: ['Dried shiitake','Kombu','White + red miso','Soy sauce','Mirin','Garlic','Ginger','Ramen noodles'], instructions: ['Cold-soak kombu + shiitake 30 min.','Heat to 140°F, hold 20 min. Do not boil kombu.','Remove kombu. Simmer. Add garlic + ginger.','Whisk in miso off heat.','Add soy + mirin. Taste.'], missingElement: 'soup', flavorNotes: 'Kombu + shiitake create umami 8× stronger than either alone.' },
    ],
  },
  warming: {
    id: 'warming', label: 'Warming & Spiced', emoji: 'WARMING',
    keywords: ['warming','spiced','cinnamon','cloves','turmeric','curry','ginger','cardamom','chai','stew','braised','autumn','winter','comfort spice'],
    brainState: 'Circulatory self-regulation and anti-inflammatory signaling.',
    bodyNeed: 'Circulation support, anti-inflammatory compounds.',
    seasoningFocus: ['Warming spices are fat-soluble — bloom in fat', 'Whole before ground', 'Black pepper + turmeric = 2000% curcumin bioavailability', 'Use both fresh and dried ginger'],
    layersToFocus: [1, 2], missingElementCategory: 'curry',
    recipeDirection: 'fat-soluble spice blooming and long simmer times',
    recipes: [
      { title: 'Golden Turmeric Lentil Soup', totalTime: 40, description: 'Red lentil soup with whole spice bloom.', ingredientsList: ['Red lentils','Ghee','Cumin seeds','Coriander','Turmeric','Ginger','Garlic','Onion','Coconut milk','Lemon','Cilantro'], instructions: ['Heat ghee. Whole cumin + coriander. Wait for sizzle.','Ginger + garlic 90s.','Turmeric + black pepper. Bloom 60s.','Onion until soft. Lentils + water.','Simmer 20 min. Coconut milk. Off heat: lemon + salt. Cilantro on top.'], missingElement: 'curry', flavorNotes: 'Whole cumin in hot fat creates pyrazines that ground cumin cannot.' },
    ],
  },
};

export function decodeCraving(text) {
  if (!text || text.trim().length < 2) return null;
  const lower = text.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const [, archetype] of Object.entries(CRAVING_ARCHETYPES)) {
    const score = archetype.keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; bestMatch = archetype; }
  }

  if (!bestMatch || bestScore === 0) {
    if (/spic|hot|chili|heat/i.test(text)) bestMatch = CRAVING_ARCHETYPES.spicy;
    else if (/sweet|choc|sugar|cake/i.test(text)) bestMatch = CRAVING_ARCHETYPES.sweet;
    else if (/salt|crunch|crisp/i.test(text)) bestMatch = CRAVING_ARCHETYPES.salty;
    else if (/fresh|light|salad|green/i.test(text)) bestMatch = CRAVING_ARCHETYPES.fresh;
    else bestMatch = CRAVING_ARCHETYPES.rich;
  }

  const missingEl = MISSING_ELEMENTS[bestMatch.missingElementCategory] || MISSING_ELEMENTS.sauce;
  const neuroFacts = NEURO_TASTE_FACTS.filter(f =>
    f.applies.includes('all') || f.applies.some(a => bestMatch.id.includes(a)),
  ).slice(0, 2);
  const seasoningGuide = SEASONING_LAYERS.filter(l => bestMatch.layersToFocus.includes(l.stage));

  return { archetype: bestMatch, missingEl, neuroFacts, seasoningGuide, recipes: bestMatch.recipes || [] };
}

export function getMissingElement(dishType) {
  const key = (dishType || '').toLowerCase();
  for (const [k, v] of Object.entries(MISSING_ELEMENTS)) {
    if (key.includes(k)) return v;
  }
  return MISSING_ELEMENTS.sauce;
}

export function getSeasoningLayersForDish() {
  return SEASONING_LAYERS;
}
