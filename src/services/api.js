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
