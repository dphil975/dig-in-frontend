/**
 * Behavior Tracker — localStorage-based learning engine
 * Tracks departure times, store/restaurant check-ins, and recipe views.
 * Used to personalize recipe recommendations on the home slider.
 */

const KEY          = 'dig_in_behavior';
const MAX_DEPS     = 30;
const MAX_CHECKINS = 100;
const MAX_VIEWS    = 50;

// Keyword expansion for restaurant cuisine types → recipe search terms
const RESTAURANT_KEYWORDS = {
  Steakhouse:       ['steak', 'beef', 'ribeye', 'filet', 'grill', 'brisket'],
  BBQ:              ['bbq', 'barbecue', 'smoked', 'ribs', 'pulled pork'],
  Seafood:          ['fish', 'salmon', 'shrimp', 'lobster', 'clam', 'seafood'],
  Italian:          ['pasta', 'pizza', 'risotto', 'gnocchi', 'lasagna'],
  Japanese:         ['ramen', 'sushi', 'teriyaki', 'miso', 'udon', 'tempura'],
  Mexican:          ['taco', 'burrito', 'enchilada', 'quesadilla', 'tamale'],
  Indian:           ['curry', 'biryani', 'tikka', 'dal', 'naan', 'korma'],
  Thai:             ['pad thai', 'green curry', 'tom yum', 'satay'],
  Chinese:          ['fried rice', 'dim sum', 'noodle', 'wonton', 'mapo'],
  French:           ['crepe', 'ratatouille', 'quiche', 'boeuf', 'bisque'],
  Korean:           ['bibimbap', 'bulgogi', 'kimchi', 'gochujang', 'japchae'],
  Vietnamese:       ['pho', 'banh mi', 'spring roll', 'bun bo'],
  Greek:            ['gyro', 'moussaka', 'souvlaki', 'spanakopita', 'tzatziki'],
  Mediterranean:    ['hummus', 'falafel', 'shakshuka', 'tabbouleh'],
  'Middle Eastern': ['shawarma', 'kebab', 'pita', 'tahini', 'falafel'],
  American:         ['burger', 'mac and cheese', 'hot dog', 'chili', 'meatloaf'],
};

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
  catch { return {}; }
}

function persist(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

// ── Write ─────────────────────────────────────────────────────────────────────

export function recordDeparture() {
  const now  = new Date();
  const data = load();
  const deps = (data.departures || []);
  deps.push({ hour: now.getHours(), dow: now.getDay(), ts: Date.now() });
  if (deps.length > MAX_DEPS) deps.splice(0, deps.length - MAX_DEPS);
  persist({ ...data, departures: deps });
}

export function recordCheckin({ id = '', name = '', type = 'store', cuisine = null } = {}) {
  const data     = load();
  const checkins = (data.checkins || []);
  checkins.push({ id, name, type, cuisine, ts: Date.now() });
  if (checkins.length > MAX_CHECKINS) checkins.splice(0, checkins.length - MAX_CHECKINS);
  persist({ ...data, checkins });
}

export function recordRecipeView({ id = '', name = '', cuisine = '' } = {}) {
  const data  = load();
  const views = (data.recipeViews || []);
  views.push({ id, name, cuisine, ts: Date.now() });
  if (views.length > MAX_VIEWS) views.splice(0, views.length - MAX_VIEWS);
  persist({ ...data, recipeViews: views });
}

// ── Read ──────────────────────────────────────────────────────────────────────

export function getPredictedDepartureHour() {
  const { departures = [] } = load();
  if (departures.length < 3) return null;
  const now = Date.now();
  const votes = {};
  departures.forEach(d => {
    const ageDays = (now - d.ts) / 86400000;
    const weight  = ageDays < 7 ? 3 : ageDays < 14 ? 2 : 1;
    // Each departure votes for itself and adjacent hours
    for (let delta = -1; delta <= 1; delta++) {
      const h = ((d.hour + delta) + 24) % 24;
      votes[h] = (votes[h] || 0) + weight * (delta === 0 ? 2 : 1);
    }
  });
  const [bestHour] = Object.entries(votes).sort(([, a], [, b]) => b - a)[0];
  return parseInt(bestHour);
}

export function formatDepartureHint(hour) {
  if (hour === null || hour === undefined) return null;
  const suffix = hour >= 12 ? 'pm' : 'am';
  const h      = hour % 12 || 12;
  return `${h}${suffix}`;
}

export function getTrafficLabelForHour(hour) {
  if (hour >= 7  && hour < 9)  return { label: 'morning rush', severity: 'bad' };
  if (hour >= 9  && hour < 16) return { label: 'clear roads',  severity: 'good' };
  if (hour >= 16 && hour < 19) return { label: 'evening rush', severity: 'bad' };
  if (hour >= 19 && hour < 22) return { label: 'light traffic', severity: 'ok' };
  return                               { label: 'night roads',  severity: 'good' };
}

export function getCuisinePreferences() {
  const { checkins = [], recipeViews = [] } = load();
  const counts = {};
  // Restaurant visits are the strongest signal (3×)
  checkins
    .filter(c => c.type === 'restaurant' && c.cuisine)
    .forEach(c => { counts[c.cuisine] = (counts[c.cuisine] || 0) + 3; });
  // Recipe views (1×)
  recipeViews
    .filter(v => v.cuisine)
    .forEach(v => { counts[v.cuisine] = (counts[v.cuisine] || 0) + 1; });
  const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([cuisine, count]) => ({ cuisine, count, pct: Math.round(count / total * 100) }));
}

export function getRecommendedRecipes(pool = [], limit = 5) {
  if (!pool.length) return [];
  const prefs = getCuisinePreferences();

  if (!prefs.length) {
    // No history yet — return a random 5
    return [...pool].sort(() => Math.random() - 0.5).slice(0, limit);
  }

  // Preference rank score (top = highest)
  const prefScore = {};
  prefs.forEach((p, i) => { prefScore[p.cuisine.toLowerCase()] = prefs.length - i; });

  // Keyword set from top 3 cuisines
  const topCuisines = prefs.slice(0, 3).map(p => p.cuisine);
  const keywords    = topCuisines.flatMap(c => RESTAURANT_KEYWORDS[c] || [c.toLowerCase()]);

  const scored = pool.map(r => {
    const cuisineScore  = prefScore[(r.cuisine || '').toLowerCase()] || 0;
    const haystack      = `${r.name} ${r.description || ''}`.toLowerCase();
    const keywordScore  = keywords.filter(kw => haystack.includes(kw)).length;
    return { ...r, _recScore: cuisineScore * 3 + keywordScore * 2 };
  });

  return scored.sort((a, b) => b._recScore - a._recScore).slice(0, limit);
}

export function getRecentRestaurants(n = 8) {
  const { checkins = [] } = load();
  return checkins
    .filter(c => c.type === 'restaurant')
    .sort((a, b) => b.ts - a.ts)
    .slice(0, n);
}
