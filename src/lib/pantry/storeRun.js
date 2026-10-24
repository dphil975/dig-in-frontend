/* pantry/storeRun.js — consolidated Shopping/Store module.
   Merged from: groceryCategories.js + storeRun.js + storeMemory.js +
   storeHours.js + shopTiming.js (src/lib/ flat directory -> src/lib/pantry/).
   Each of the five old files re-exports from this one so every existing
   import path keeps working.

   NOTE ON MERGE CONFLICT: storeRun.js and storeMemory.js both had a private
   (non-exported) helper named `norm`, doing two DIFFERENT things — storeRun's
   normalizes an objective name for matching, storeMemory's normalizes free
   text for store-name matching. storeMemory's copy is renamed `normStoreText`
   below to avoid colliding with storeRun's `norm`; nothing outside this file
   ever referenced either one directly (both were private). */

import { awardBadge } from '../cookAchievements';
import { categorizeShelf } from '../pantryCategories';

// ════════════════════════════════════════════════════════════════════════
// From groceryCategories.js
// ════════════════════════════════════════════════════════════════════════

/* groceryCategories.js — group a flat shopping list into real grocery-aisle
   categories, so "send to shopping list" reads like an organized list
   instead of one long blob. Keyword-heuristic (same honest-heuristic
   pattern as wellnessGoals.js's nutrient tags / flavorProfile.js's flavor
   tags — not a barcode/UPC lookup), validated against the app's actual
   575-recipe, 4,259-ingredient-line corpus at ~97.6% categorized (the rest
   fall into "Other," same as a real list always has a few odd items). */

const GROCERY_CATEGORIES = [
  { id: 'produce', label: 'Produce', re: /lettuce|spinach|kale|arugula|tomato|onion|garlic|potato|carrot|celery|pepper|cucumber|zucchini|squash|broccoli|cauliflower|cabbage|mushroom|avocado|lemon|lime|apple|banana|orange|berry|berries|grape|mango|pineapple|peach|pear|plum|melon|herb|basil|cilantro|parsley|mint|ginger|scallion|leek|corn|sprout|radish|beet|eggplant|pea|raisin|date|fig|apricot|plantain|okra|artichoke|turnip|olive|shallot|greens|sauerkraut|galangal|lemongrass|cherry|cherries|nectarine|kiwi|pomegranate|watermelon|cantaloupe|prune|yam|vegetable|fruit|fennel|dill/i },
  { id: 'meat', label: 'Meat, Seafood & Protein', re: /chicken|beef|pork|turkey|lamb|bacon|sausage|steak|fish|salmon|tuna|shrimp|crab|lobster|cod|tilapia|anchov|veal|\bham\b|meat|goat|hot dog|mussel|clam|oyster|tofu|tempeh|seitan|squid|bratwurst|octopus|\bpig\b/i },
  { id: 'dairy', label: 'Dairy & Eggs', re: /milk|cheese|yogurt|butter|ghee|cream|egg|feta|mozzarella|parmesan|cheddar|ricotta|paneer/i },
  { id: 'bakery', label: 'Bakery & Bread', re: /bread|bun|bagel|tortilla|naan|pita|roll|baguette|croissant|muffin|dough|phyllo|puff pastry|pastry|pie crust|ladyfinger|biscuit/i },
  { id: 'pantry', label: 'Pantry & Dry Goods', re: /flour|sugar|rice|pasta|noodle|lentil|chickpea|bean|quinoa|oat|cereal|cornmeal|wheat|yeast|breadcrumb|panko|honey|syrup|vinegar|\boil\b|nut|almond|walnut|pistachio|cashew|pecan|hazelnut|sesame|peanut|coconut|couscous|cornstarch|baking powder|baking soda|tahini|\bdal\b|granola|nori|seaweed|wasabi|matcha|mirin|kombu|bonito|hummus|shortening|\blard\b/i },
  { id: 'canned', label: 'Canned & Jarred', re: /canned|tomato paste|tomato sauce|coconut milk|broth|stock/i },
  { id: 'frozen', label: 'Frozen', re: /frozen/i },
  { id: 'spices', label: 'Spices & Condiments', re: /\bsalt\b|black pepper|cumin|paprika|cinnamon|nutmeg|turmeric|cardamom|clove|bay leaf|bay leaves|oregano|thyme|rosemary|chili powder|curry powder|curry paste|garam masala|soy sauce|hot sauce|ketchup|mustard|mayo|salsa|\bsauce\b|spice|seasoning|saffron|vanilla|cocoa|chocolate|harissa|tamarind|caraway|coriander|anise|allspice|peppercorn|jam\b|chil(i|e)|cayenne|fenugreek|marjoram|masala|sumac/i },
  { id: 'beverages', label: 'Beverages', re: /\bwater\b|juice|soda|\btea\b|coffee|\bwine\b|\bbeer\b|sparkling|rose water|\bice\b|whisky|whiskey|\brum\b|vodka|\bgin\b|liqueur|brandy|cognac|schnapps|espresso|guinness|prosecco|aperol|champagne/i },
];
const OTHER = { id: 'other', label: 'Other' };

// Aisle-walk order for display — produce/meat/dairy first (perimeter of a
// real store), pantry/canned/frozen/spices/beverages after (center aisles),
// "Other" last.
const DISPLAY_ORDER = [...GROCERY_CATEGORIES.map(c => c.id), 'other'];

function itemText(item) {
  return typeof item === 'string' ? item : (item?.text || item?.name || '');
}

export function categoryOf(item) {
  const t = itemText(item);
  if (!t) return OTHER;
  for (const cat of GROCERY_CATEGORIES) if (cat.re.test(t)) return cat;
  return OTHER;
}

/** Group a flat item list into [{id, label, items}] in aisle-walk order,
 * skipping any category with nothing in it. */
export function groupByCategory(items) {
  const groups = new Map();
  for (const raw of items || []) {
    const text = itemText(raw);
    if (!text) continue;
    const cat = categoryOf(raw);
    if (!groups.has(cat.id)) groups.set(cat.id, { id: cat.id, label: cat.label, items: [] });
    groups.get(cat.id).items.push(text);
  }
  return DISPLAY_ORDER.map(id => groups.get(id)).filter(Boolean);
}

// ════════════════════════════════════════════════════════════════════════
// From storeRun.js
// ════════════════════════════════════════════════════════════════════════

/* storeRun.js — a shopping trip as a real, timed run.

   The pantry already had a "shopping mode," but it was a bare boolean: on or
   off, remembering nothing. This turns a trip into an actual run with a
   start, a clock, a list of things to find, and a record when it's over.

   The design constraint that shaped this: SOME PEOPLE WILL NOT ASK FOR HELP.
   Not won't-as-in-stubborn — won't as in they'd rather leave without the
   ingredient than flag down an employee and say "what does a poblano look
   like." So every objective carries a picture (a saved reference photo if
   there is one, otherwise the shelf's pixel art), and the answer is on screen
   before anyone has to ask for it. That's the whole feature. A hunt you can
   finish alone, on purpose.

   WHAT'S REAL HERE, AND WHAT ISN'T:
   - The clock is real: startedAt is a wall-clock timestamp, elapsed is
     measured, and finished runs keep their true duration. "You were in there
     23 minutes" is a measured fact, not an estimate.
   - `store`/`storeZip` are recorded once, from what the shopper already typed
     into the pantry form. There is NO continuous location tracking, no
     background geolocation, no foot-traffic collection, and nothing leaves
     the device — the whole log lives in localStorage. A duration and a ZIP
     answer "how long does my grocery run actually take" without following
     anybody around. (shopTiming.js's busyness model is likewise a behavioral
     model, not a live feed — same honesty rule, stated there too.)
   - "Found it" vs "couldn't find it" is a real self-report with real
     consequences: only a run where you found EVERYTHING earns the badge.
     Marking something missing is not a failure state — it's data, and it's
     what makes the badge mean anything when you do get it.

   Badges award through cookAchievements.js's exported awardBadge(), so a
   run-earned badge lands in the same dig_in_badges store (and the same
   pushBadge sync) as every cook-earned one — not a second parallel wallet.
   That file already made this argument for itself; this just honors it. */

const RUN_KEY = 'dig_in_store_run';       // the active run, or null
const LOG_KEY = 'dig_in_store_run_log';   // completed runs, newest last

const MAX_LOG = 60;   // keep the last ~60 trips; plenty for an average, bounded for quota

function read(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
  catch { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

/** Objectives are matched by name, loosely — "2 ripe avocados" finds "avocado". */
function norm(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

/* An ingredient line is rarely a bare noun — it's "2 tbsp olive oil, divided".
   Strip the quantity/unit/prep noise so the objective reads like the thing
   you're actually looking for on a shelf. Deliberately conservative: if
   stripping leaves nothing, keep the original line rather than show a blank
   objective. */
const UNITS = /^(\d+[\d/.\-–\s]*)?\s*(cups?|tbsp|tablespoons?|tsp|teaspoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|l|liters?|litres?|cloves?|cans?|jars?|packages?|pkg|bunch(es)?|sprigs?|slices?|pieces?|heads?|stalks?|pinch(es)?|dash(es)?|quarts?|pints?|sticks?)\b/i;
const PREP_TAIL = /,\s*(divided|chopped|minced|diced|sliced|to taste|optional|softened|melted|drained|rinsed|beaten|room temperature|finely.*|roughly.*|thinly.*|plus more.*)$/i;

export function objectiveName(line) {
  let s = String(line || '').trim();
  if (!s) return '';
  const original = s;
  s = s.replace(PREP_TAIL, '');
  s = s.replace(/^\d+[\d/.\-–\s]*/, '');       // leading quantity
  s = s.replace(UNITS, '');                     // unit word
  s = s.replace(/^(of|a|an)\s+/i, '');
  s = s.replace(/\([^)]*\)/g, '');              // parentheticals
  s = s.replace(/\s+/g, ' ').trim();
  return s || original;
}

function makeObjective(line) {
  const name = objectiveName(line);
  return {
    name,
    raw: String(line || '').trim(),
    category: categorizeShelf(name).id,   // drives which pixel scene the hunt card shows
    status: 'open',                        // 'open' | 'found' | 'missing'
    at: null,
  };
}

/* ── the active run ──────────────────────────────────────────────────── */

export function activeRun() {
  const r = read(RUN_KEY, null);
  return r && r.startedAt ? r : null;
}

/**
 * Begin a run. `items` is any list of ingredient lines (a recipe's
 * ingredients, a shopping list, or hand-typed) — each becomes one objective.
 * Starting a new run replaces any run already in progress; the caller is
 * expected to confirm that, since abandoning silently would lose a trip.
 */
export function startRun({ store = '', storeZip = '', items = [], source = 'list', recipeName = '' } = {}) {
  const seen = new Set();
  const objectives = [];
  for (const line of items) {
    const o = makeObjective(line);
    if (!o.name) continue;
    const key = norm(o.name);
    if (seen.has(key)) continue;    // the same ingredient twice is one thing to find
    seen.add(key);
    objectives.push(o);
  }
  const run = {
    id: Date.now(),
    store: String(store || '').trim(),
    storeZip: String(storeZip || '').trim(),
    source,
    recipeName: String(recipeName || '').trim(),
    startedAt: Date.now(),
    objectives,
  };
  write(RUN_KEY, run);
  return run;
}

/** Live elapsed milliseconds for a run (active or finished). */
export function elapsedMs(run, now = Date.now()) {
  if (!run?.startedAt) return 0;
  return Math.max(0, (run.endedAt || now) - run.startedAt);
}

/** "0:42" / "23:07" — a clock, because a clock is what makes it a run. */
export function elapsedLabel(run, now = Date.now()) {
  const total = Math.floor(elapsedMs(run, now) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function updateObjective(name, patch) {
  const run = activeRun();
  if (!run) return null;
  const key = norm(name);
  let hit = false;
  run.objectives = run.objectives.map(o => {
    if (norm(o.name) !== key) return o;
    hit = true;
    return { ...o, ...patch };
  });
  if (!hit) return null;
  write(RUN_KEY, run);
  return run;
}

export function markFound(name)   { return updateObjective(name, { status: 'found',   at: Date.now() }); }
export function markMissing(name) { return updateObjective(name, { status: 'missing', at: Date.now() }); }
export function reopen(name)      { return updateObjective(name, { status: 'open',    at: null, swappedTo: null }); }

/**
 * They couldn't find it, took a suggested substitute, and got THAT instead.
 * Counts as found — because it is: the cook solved the problem and the dish
 * is still happening. Keeping `name` as the objective's identity (rather than
 * renaming it) preserves what they originally set out for, so the record
 * honestly reads "wanted spinach, came home with chard."
 */
export function markSwapped(name, substituteLabel) {
  return updateObjective(name, {
    status: 'found',
    at: Date.now(),
    swappedTo: String(substituteLabel || '').trim() || null,
  });
}

/** Every substitution made on a finished run — the real "what changed" list. */
export function swapsIn(run) {
  return (run?.objectives || [])
    .filter(o => o.swappedTo)
    .map(o => ({ from: o.name, to: o.swappedTo }));
}

/** Add something to the hunt mid-trip — you remembered you were out of eggs. */
export function addObjective(line) {
  const run = activeRun();
  if (!run) return null;
  const o = makeObjective(line);
  if (!o.name) return run;
  if (run.objectives.some(x => norm(x.name) === norm(o.name))) return run;
  run.objectives = [...run.objectives, o];
  write(RUN_KEY, run);
  return run;
}

/** Counts for the progress bar. */
export function runProgress(run) {
  const list = run?.objectives || [];
  const found = list.filter(o => o.status === 'found').length;
  const missing = list.filter(o => o.status === 'missing').length;
  return {
    total: list.length,
    found,
    missing,
    open: list.length - found - missing,
    settled: found + missing,
    pct: list.length ? Math.round(((found + missing) / list.length) * 100) : 0,
  };
}

/* ── finishing ───────────────────────────────────────────────────────── */

const RUN_COUNT_BADGES = [
  [1,  'run-first',  'First Run',      '🛒'],
  [5,  'run-5',      'Regular Runner', '🏃'],
  [20, 'run-20',     'Store Native',   '🗺️'],
];

/**
 * End the run: stamp it, file it in the log, and award anything genuinely
 * earned. Returns { run, minutes, progress, badges } so the caller can show a
 * real summary instead of a generic "nice job".
 */
export function endRun({ now = Date.now() } = {}) {
  const run = activeRun();
  if (!run) return null;

  run.endedAt = now;
  // Keep the precise duration, not just the rounded minutes — rounding is a
  // display concern, and rounding FIRST silently turned every sub-30-second
  // run into "0 minutes", which then got filtered out of the stats entirely
  // and lost the trip from its store's count.
  run.ms = elapsedMs(run, now);
  const minutes = Math.round(run.ms / 60000);
  run.minutes = minutes;
  const progress = runProgress(run);
  run.progress = progress;

  const log = [...read(LOG_KEY, []), run].slice(-MAX_LOG);
  write(LOG_KEY, log);
  write(RUN_KEY, null);

  const badges = [];
  const push = b => { if (b) badges.push(b); };

  // How many trips you've actually completed — ascending thresholds, so stop
  // at the first unmet one (same shape as cookAchievements' streak ladder).
  for (const [n, id, label, icon] of RUN_COUNT_BADGES) {
    if (log.length < n) break;
    push(awardBadge(id, label, icon));
  }

  // THE one this whole feature exists for: you went in with a list, and you
  // found every single thing on it yourself. Requires a real list (2+) so a
  // one-item run can't trivially unlock it.
  if (progress.total >= 2 && progress.found === progress.total) {
    push(awardBadge('found-it-myself', 'Found It Myself', '🔍'));
  }

  // A real list, cleared quickly. Needs enough items that speed means
  // something, and every item settled (found or honestly marked missing).
  if (progress.total >= 5 && progress.settled === progress.total && minutes > 0 && minutes <= 20) {
    push(awardBadge('clean-sweep', 'Clean Sweep', '⚡'));
  }

  return { run, minutes, progress, badges };
}

/** Walk away without recording a trip (mis-tap, changed plans). */
export function cancelRun() { write(RUN_KEY, null); }

/* ── the log: "how long does this actually take me?" ─────────────────── */

/* Newest first. NOTE: nothing renders this yet — the finish screen shows
   aggregates from runStats() instead. Kept because the log is genuinely
   recorded and a "your past trips" view is the obvious next surface; if that
   never gets built, this should go rather than sit here looking wired. */
export function runLog() { return read(LOG_KEY, []).slice().reverse(); }

/* Under a minute isn't a shopping trip, it's a mis-tap or a test. Such runs
   still COUNT as trips (a count is a count) but are excluded from duration
   averages, where they'd otherwise drag the number toward a lie. */
const REAL_RUN_MS = 60000;

function durationMinutes(run) {
  const ms = typeof run?.ms === 'number' ? run.ms : null;
  if (ms == null || ms < REAL_RUN_MS) return null;
  return Math.max(1, Math.round(ms / 60000));
}

/**
 * Real stats over completed runs. Every number here is measured, and anything
 * without enough data to be honest comes back null rather than 0 — an average
 * over one trip is not an average, and a store you've been to once has a trip
 * count but no meaningful average yet.
 */
export function runStats() {
  const log = read(LOG_KEY, []);
  if (!log.length) return { runs: 0, avgMinutes: null, fastest: null, foundRate: null, byStore: [] };

  const mins = log.map(durationMinutes).filter(m => m != null);
  const totals = log.reduce((acc, r) => {
    const p = r.progress || runProgress(r);
    acc.found += p.found;
    acc.total += p.total;
    return acc;
  }, { found: 0, total: 0 });

  // Per store: every trip counts toward `runs`, but only real-duration trips
  // feed `avgMinutes` — answers "is the far one actually slower?" without
  // inventing a number for a store you've only just started using.
  const stores = new Map();
  for (const r of log) {
    const name = (r.store || '').trim();
    if (!name) continue;
    const cur = stores.get(name) || { store: name, runs: 0, timedRuns: 0, totalMin: 0 };
    cur.runs += 1;
    const m = durationMinutes(r);
    if (m != null) { cur.timedRuns += 1; cur.totalMin += m; }
    stores.set(name, cur);
  }

  return {
    runs: log.length,
    avgMinutes: mins.length >= 2 ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length) : null,
    fastest: mins.length ? Math.min(...mins) : null,
    foundRate: totals.total ? Math.round((totals.found / totals.total) * 100) : null,
    byStore: [...stores.values()]
      .map(s => ({
        store: s.store,
        runs: s.runs,
        avgMinutes: s.timedRuns ? Math.round(s.totalMin / s.timedRuns) : null,
      }))
      .sort((a, b) => b.runs - a.runs),
  };
}

// ════════════════════════════════════════════════════════════════════════
// From storeMemory.js
// ════════════════════════════════════════════════════════════════════════

/* storeMemory — the Store Memory Profile engine.

   Turns the receipts and pantry purchases the shopper already logs into a
   per-store memory: what you usually buy here, what's probably due for a
   refill, what you tried for the first time (and whether you liked it), and
   whether a familiar item has quietly shrunk. It's the brain behind the
   flip-card "Store Memory" on the map — this module holds no UI.

   Everything here reads/writes the SAME pantry data the Pantry page already
   owns (`dig_in_pantry`, `dig_in_receipts`) plus a few new small stores:
     dig_in_store_aliases     { [storeId]: string[] }        user nicknames
     dig_in_item_sizes        { [itemKey]: SizeEntry[] }     shrinkflation history
     dig_in_item_photos       { [itemKey]: dataUrl }         reference photos
     dig_in_new_item_feedback { [itemKey]: FeedbackEntry }   "did you like it?"

   SCOPE HONESTY: there is no server and no push-notification backend here —
   the "3 days later, remind me" check runs client-side, on app open (Pantry
   mount), same as every other notification in this app (see novaNudges). It
   fires once real Notification permission is granted and the app happens to
   be opened after the window has passed; it is not a guaranteed background
   push. Shrinkflation only compares same-unit sizes (12oz → 10oz) — it does
   not convert between units (oz ↔ g), which would be more fragile than useful. */

const ALIAS_KEY     = 'dig_in_store_aliases';
const SIZES_KEY      = 'dig_in_item_sizes';
const PHOTOS_KEY     = 'dig_in_item_photos';
const FEEDBACK_KEY   = 'dig_in_new_item_feedback';
const SHRINK_KEY      = 'dig_in_shrinkflation_alerts';
const PRICE_KEY       = 'dig_in_price_history';
const PANTRY_KEY     = 'dig_in_pantry';
const RECEIPTS_KEY   = 'dig_in_receipts';

const DAY_MS = 86400000;

function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
  catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

/* ── Item identity ─────────────────────────────────────────────────────────
   One normalized key per item name, shared across stores/purchases so "Ritz
   Crackers" and "ritz crackers " count as the same item everywhere. */
export function itemKey(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}
function titleCase(s) {
  return String(s || '').replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

/* ── Store aliases ──────────────────────────────────────────────────────────
   User-entered nicknames for a store ("Tony's", "the corner spot"). A store
   can have several; they're also used to match free-text receipt/pantry store
   names back to this store. */
export function getAliases(storeId) {
  return load(ALIAS_KEY, {})[storeId] || [];
}
export function addAlias(storeId, alias) {
  const clean = String(alias || '').trim();
  if (!clean) return getAliases(storeId);
  const all = load(ALIAS_KEY, {});
  const list = all[storeId] || [];
  if (!list.some(a => a.toLowerCase() === clean.toLowerCase())) list.push(clean);
  all[storeId] = list;
  save(ALIAS_KEY, all);
  return list;
}
export function removeAlias(storeId, alias) {
  const all = load(ALIAS_KEY, {});
  all[storeId] = (all[storeId] || []).filter(a => a !== alias);
  save(ALIAS_KEY, all);
  return all[storeId];
}

// Strip apostrophes without leaving a gap ("Tony's" → "tonys") so it still
// matches "Tonys" with no punctuation at all; everything else becomes a space.
// NOTE: renamed from `norm` (its name in the original storeMemory.js) to
// `normStoreText` to avoid colliding with storeRun.js's own private `norm`
// helper above — the two do different things and both were merged into this
// one module's scope. Never referenced outside this file either way.
const normStoreText = s => String(s || '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

/** Does this free-text store name (from a receipt or pantry item) refer to
    `store` — by canonical name or any user alias? Loose substring match either
    direction, so "KROGER #4521" matches an alias of just "Kroger". */
export function matchesStore(text, store, aliases = []) {
  const t = normStoreText(text);
  if (!t || !store) return false;
  // A 2-char floor, not 3 — aliases are something the shopper deliberately
  // typed for this exact store ("WF", "CVS"), so a short one is still a
  // meaningful, intentional identifier, not noise to filter out.
  const candidates = [store.name, ...aliases].map(normStoreText).filter(Boolean);
  return candidates.some(c => c.length >= 2 && (t.includes(c) || c.includes(t)));
}

/** Every pantry item ever logged against this store (by name or alias match). */
export function itemsForStore(store) {
  if (!store) return [];
  const aliases = getAliases(store.id);
  const pantry = load(PANTRY_KEY, []);
  return pantry.filter(i => i.store && matchesStore(i.store, store, aliases));
}

/** Every receipt trip logged against this store (by name or alias match). */
export function receiptsForStore(store) {
  if (!store) return [];
  const aliases = getAliases(store.id);
  const receipts = load(RECEIPTS_KEY, []);
  return receipts.filter(r => r.store && matchesStore(r.store, store, aliases));
}

/* ── Purchase-pattern intelligence ────────────────────────────────────────── */

/**
 * Analyze a store's purchase history.
 * @returns { frequent: [{name,count,lastBoughtAt}], dueToRepurchase: [{name,daysOverdue,avgIntervalDays}],
 *            newItems: [{name,boughtAt}] }
 */
export function analyzeStorePurchases(store, now = new Date()) {
  const items = itemsForStore(store);
  const allPantry = load(PANTRY_KEY, []);

  const byName = new Map();
  for (const item of items) {
    const k = itemKey(item.name);
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(item);
  }

  const frequent = [];
  const dueToRepurchase = [];
  const newItems = [];

  for (const [k, purchases] of byName) {
    const sorted = [...purchases].sort((a, b) => new Date(a.boughtAt || a.at) - new Date(b.boughtAt || b.at));
    const name = titleCase(sorted[0].name);
    const lastBoughtAt = sorted[sorted.length - 1].boughtAt || sorted[sorted.length - 1].at;

    if (sorted.length >= 2) {
      frequent.push({ key: k, name, count: sorted.length, lastBoughtAt });

      // Average interval between purchases → is a repurchase probably due?
      const times = sorted.map(p => new Date(p.boughtAt || p.at).getTime());
      let gaps = 0, gapSum = 0;
      for (let i = 1; i < times.length; i++) { gapSum += times[i] - times[i - 1]; gaps++; }
      const avgIntervalDays = gaps ? gapSum / gaps / DAY_MS : null;
      const daysSince = (now - new Date(lastBoughtAt)) / DAY_MS;
      if (avgIntervalDays && daysSince >= avgIntervalDays * 0.85) {
        dueToRepurchase.push({ key: k, name, daysOverdue: Math.round(daysSince - avgIntervalDays), avgIntervalDays: Math.round(avgIntervalDays), lastBoughtAt });
      }
    } else {
      // "New" here at this store — but only truly new if it's never appeared
      // anywhere else in pantry history either (a first-time purchase, not
      // just a first-time-at-this-store repeat of something familiar).
      const everywhereCount = allPantry.filter(i => itemKey(i.name) === k).length;
      if (everywhereCount <= 1) newItems.push({ key: k, name, boughtAt: lastBoughtAt });
    }
  }

  frequent.sort((a, b) => b.count - a.count);
  dueToRepurchase.sort((a, b) => b.daysOverdue - a.daysOverdue);
  newItems.sort((a, b) => new Date(b.boughtAt) - new Date(a.boughtAt));

  return { frequent: frequent.slice(0, 8), dueToRepurchase: dueToRepurchase.slice(0, 6), newItems: newItems.slice(0, 6) };
}

/* ── "Did you like it?" new-item feedback ─────────────────────────────────── */

function loadFeedback() { return load(FEEDBACK_KEY, {}); }
function saveFeedback(v) { save(FEEDBACK_KEY, v); }

/** Called from Pantry's buy()/importReceipt() on every purchase — registers a
    first-time item for the "did you like it?" loop. If the item is already
    tracked and still unanswered, a REPEAT purchase counts as an implicit yes
    (you kept buying it) so the prompt naturally stops — the shopper only ever
    gets asked about something they bought exactly once. */
export function registerFirstPurchase(name, storeText, now = new Date()) {
  const nowDate = now instanceof Date ? now : new Date(now);
  const k = itemKey(name);
  const all = loadFeedback();
  if (!all[k]) {
    all[k] = { name: titleCase(name), storeText: storeText || null, boughtAt: nowDate.toISOString(), liked: null, promptedAt: null, notifiedAt: null };
    saveFeedback(all);
    return;
  }
  if (all[k].liked === null) {
    all[k].liked = true;
    saveFeedback(all);
  }
}

/** Unanswered new items to prompt "did you like it?" for, scoped to a store. */
export function pendingFeedbackForStore(store) {
  const all = loadFeedback();
  const aliases = getAliases(store.id);
  return Object.entries(all)
    .filter(([, f]) => f.liked === null && f.storeText && matchesStore(f.storeText, store, aliases))
    .map(([key, f]) => ({ key, ...f }));
}

export function answerFeedback(key, liked) {
  const all = loadFeedback();
  if (!all[key]) return;
  all[key].liked = liked;
  saveFeedback(all);
}

/**
 * Client-side check for "it's been 3+ days and you never said" — call this on
 * app open (Pantry mount). Fires a browser Notification for each item that
 * qualifies, using the exact permission pattern novaNudges uses, and marks it
 * notified so it only fires once. Also looks up a recipe that uses the
 * ingredient (if `suggestFn` is given) so the nudge is actionable, not just a
 * reminder. Returns the list of items notified this call (for a UI toast too).
 */
export function checkNewItemReminders(now = new Date(), suggestFn = null) {
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const all = loadFeedback();
  const due = [];
  for (const [key, f] of Object.entries(all)) {
    if (f.liked !== null || f.notifiedAt) continue;
    const daysSince = (now - new Date(f.boughtAt)) / DAY_MS;
    if (daysSince >= 3) due.push({ key, ...f });
  }
  if (!due.length) return [];

  for (const item of due) {
    all[item.key].notifiedAt = now.toISOString();
    if (supported && window.Notification.permission === 'granted') {
      let body = `You picked up ${item.name} a few days ago — how was it?`;
      if (suggestFn) {
        const recipe = suggestFn(item.name);
        if (recipe) body = `Still have that ${item.name}? ${recipe} would use it up.`;
      }
      try { new window.Notification('Dig In · New item check-in', { body }); } catch { /* ignore */ }
    }
  }
  saveFeedback(all);
  return due;
}

/* ── Shrinkflation tracking ────────────────────────────────────────────────
   Free-text size like "12 oz" / "500g" / "1 lb" / "24 ct" parsed into a
   {value, unit} pair. Comparisons only ever happen within the same unit. */
export function parseSize(text) {
  const m = String(text || '').trim().match(/^([\d.]+)\s*(fl\s*oz|oz|lb|lbs|g|kg|ct|count|pk|pack)$/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  let unit = m[2].toLowerCase().replace(/\s+/g, '');
  if (unit === 'lbs') unit = 'lb';
  if (unit === 'count' || unit === 'pk' || unit === 'pack') unit = 'ct';
  return { value, unit };
}

function loadSizes() { return load(SIZES_KEY, {}); }
function saveSizes(v) { save(SIZES_KEY, v); }

/** Record a purchase's size (if the shopper entered one) and return a
    shrinkflation alert if this purchase is smaller-for-same-or-more money
    than the last recorded purchase of the same item. */
export function recordSizeAndCheckShrinkflation(name, sizeText, price, now = new Date()) {
  const parsed = parseSize(sizeText);
  if (!parsed) return null;
  const nowDate = now instanceof Date ? now : new Date(now);
  const k = itemKey(name);
  const all = loadSizes();
  const history = all[k] || [];
  const prior = [...history].reverse().find(h => h.unit === parsed.unit);

  let alert = null;
  if (prior && parsed.value < prior.value && (price == null || prior.price == null || price >= prior.price)) {
    alert = {
      name: titleCase(name),
      wasSize: `${prior.value}${prior.unit}`, wasPrice: prior.price,
      nowSize: `${parsed.value}${parsed.unit}`, nowPrice: price,
      percentSmaller: Math.round((1 - parsed.value / prior.value) * 100),
    };
  }

  history.push({ value: parsed.value, unit: parsed.unit, price: price ?? null, at: nowDate.toISOString() });
  all[k] = history.slice(-12); // keep recent history bounded
  saveSizes(all);
  return alert;
}

export function shrinkflationHistory(name) {
  return loadSizes()[itemKey(name)] || [];
}

/** Persist a detected shrinkflation alert (called from Pantry's buy() flow the
    moment `recordSizeAndCheckShrinkflation` returns one) so it's still visible
    later in the Store Memory Card — not just as a one-time toast. */
export function logShrinkflationAlert(alert, storeText, now = new Date()) {
  const nowDate = now instanceof Date ? now : new Date(now);
  const all = load(SHRINK_KEY, []);
  all.unshift({ ...alert, storeText: storeText || null, at: nowDate.toISOString() });
  save(SHRINK_KEY, all.slice(0, 50));
}

/** Past shrinkflation alerts logged against this store. */
export function shrinkflationAlertsForStore(store) {
  if (!store) return [];
  const aliases = getAliases(store.id);
  return load(SHRINK_KEY, []).filter(a => a.storeText && matchesStore(a.storeText, store, aliases));
}

/* ── Price history & price match ───────────────────────────────────────────
   Separate from shrinkflation tracking above on purpose: shrinkflation needs
   a parsed SIZE to mean anything (smaller-for-the-money only makes sense
   comparing the same unit), which is why recordSizeAndCheckShrinkflation
   silently no-ops without one. A price alone is still worth remembering even
   when no size was entered — which is every receipt-imported item, since a
   receipt line has a name and a price but never a size. This log records
   price on EVERY purchase (one-by-one pickup or receipt import) regardless of
   whether a size was given, and priceMatchFor() reads it back to tell the
   shopper how today's price compares to what they've actually paid before —
   both anywhere, and at this exact store if they've bought it there before.

   Free-text store matching here is deliberately loose (case/punctuation-
   insensitive substring, via the same `normStoreText()` this file already
   uses for matchesStore) rather than the store-ID-based matching those
   functions use — the pickup form and receipt parser only ever have a
   typed/OCR'd store NAME on hand, not a resolved store record. */
function loadPriceHistory() { return load(PRICE_KEY, {}); }
function savePriceHistory(v) { save(PRICE_KEY, v); }

/** Record one purchase's price. No-ops silently on a missing name/price —
    callers don't need to guard the call themselves. */
export function recordPrice(name, price, storeText, now = new Date()) {
  if (price == null || !Number.isFinite(Number(price))) return;
  const nowDate = now instanceof Date ? now : new Date(now);
  const k = itemKey(name);
  const all = loadPriceHistory();
  const history = all[k] || [];
  history.push({ price: Number(price), store: storeText ? String(storeText).trim() : null, at: nowDate.toISOString() });
  all[k] = history.slice(-24); // bounded, same spirit as shrinkflation history
  savePriceHistory(all);
}

export function priceHistoryFor(name) {
  return loadPriceHistory()[itemKey(name)] || [];
}

/**
 * How today's price for `name` compares to what's actually been paid before.
 * Read-only — safe to call live as someone types a price, before they submit.
 * Returns null when there's no prior history to compare against (a genuinely
 * first-time item shouldn't render a comparison it can't back up).
 *
 * @returns {
 *   best:        { price, store, at } | null   the lowest price ever paid
 *   lastAnywhere:{ price, store, at }           the most recent prior purchase
 *   lastAtStore: { price, store, at } | null    most recent prior purchase AT storeText, if given and matched
 *   verdict:     'best' | 'higher' | 'lower' | 'same'   vs. the most relevant comparison (lastAtStore if we have one, else lastAnywhere)
 *   diff:        number                         signed difference driving `verdict` (current − comparison)
 */
export function priceMatchFor(name, price, storeText = null) {
  const history = priceHistoryFor(name);
  if (!history.length || price == null || !Number.isFinite(Number(price))) return null;
  const current = Number(price);

  const sorted = [...history].sort((a, b) => new Date(a.at) - new Date(b.at));
  const best = sorted.reduce((min, h) => (min == null || h.price < min.price ? h : min), null);
  const lastAnywhere = sorted[sorted.length - 1];
  const lastAtStore = storeText
    ? [...sorted].reverse().find(h => h.store && normStoreText(h.store) === normStoreText(storeText))
    : null;

  const comparison = lastAtStore || lastAnywhere;
  const diff = Math.round((current - comparison.price) * 100) / 100;
  const verdict = diff === 0 ? 'same' : diff > 0 ? 'higher' : 'lower';

  return { best, lastAnywhere, lastAtStore: lastAtStore || null, verdict, diff, comparedAtStore: !!lastAtStore };
}

/* ── Item reference photos ───────────────────────────────────────────────── */
export function getItemPhoto(name) {
  return load(PHOTOS_KEY, {})[itemKey(name)] || null;
}
export function saveItemPhoto(name, dataUrl) {
  const all = load(PHOTOS_KEY, {});
  all[itemKey(name)] = dataUrl;
  save(PHOTOS_KEY, all);
}
export function removeItemPhoto(name) {
  const all = load(PHOTOS_KEY, {});
  delete all[itemKey(name)];
  save(PHOTOS_KEY, all);
}

/* ── Receipt photo/PDF attachments ─────────────────────────────────────────
   Attaches proof-of-purchase to a receipt trip already in dig_in_receipts
   (Pantry owns writing new trips; this just patches one by id). */
export function attachReceiptFile(tripId, { dataUrl, fileType, fileName }) {
  const receipts = load(RECEIPTS_KEY, []);
  const next = receipts.map(r => (r.id === tripId ? { ...r, attachment: { dataUrl, fileType, fileName } } : r));
  save(RECEIPTS_KEY, next);
}

// ════════════════════════════════════════════════════════════════════════
// From storeHours.js
// ════════════════════════════════════════════════════════════════════════

/* Store hours — parses the OSM opening_hours mini-format (e.g.
   "Mo-Su 07:00-22:00", segments separated by ";") just enough to answer
   "open right now?" and to print a friendly display string. Shared by the
   Home map and the recipe-page Food Map so both pop-ups agree. */

const DAY = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };

/** OSM opening_hours string -> true (open), false (closed), null (unparsed/unknown). */
export function parseOpenNow(hoursStr) {
  if (!hoursStr) return null;
  const now = new Date();
  const todayIdx = now.getDay();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  for (const seg of hoursStr.split(';').map(s => s.trim())) {
    const m = seg.match(/^([A-Za-z,\-]+)\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
    if (!m) continue;
    const [, dayPart, sh, sm, eh, em] = m;
    const startMins = parseInt(sh) * 60 + parseInt(sm);
    const endMins   = parseInt(eh) * 60 + parseInt(em);
    let dayMatch = false;
    if (dayPart.includes('-')) {
      const [f, t] = dayPart.split('-');
      const fi = DAY[f], ti = DAY[t];
      if (fi !== undefined && ti !== undefined)
        dayMatch = fi <= ti ? (todayIdx >= fi && todayIdx <= ti) : (todayIdx >= fi || todayIdx <= ti);
    } else {
      dayMatch = dayPart.split(',').some(d => DAY[d.trim()] === todayIdx);
    }
    if (!dayMatch) continue;
    return endMins <= startMins
      ? (nowMins >= startMins || nowMins < endMins)   // overnight
      : (nowMins >= startMins && nowMins < endMins);
  }
  return null;
}

/** "07:00-22:00" -> "7am – 10pm" */
export function formatHoursDisplay(hoursStr) {
  if (!hoursStr) return null;
  return hoursStr.replace(/(\d{1,2}):(\d{2})/g, (_, h, m) => {
    const hr = parseInt(h), mn = parseInt(m);
    if (hr === 0 && mn === 0)  return '12am';
    if (hr === 24 && mn === 0) return '12am';
    if (hr === 12 && mn === 0) return '12pm';
    const period = hr >= 12 ? 'pm' : 'am';
    const h12 = hr % 12 || 12;
    return mn === 0 ? `${h12}${period}` : `${h12}:${String(mn).padStart(2, '0')}${period}`;
  }).replace(/-/g, ' – ');
}

// ════════════════════════════════════════════════════════════════════════
// From shopTiming.js
// ════════════════════════════════════════════════════════════════════════

/* "Best time to shop" — a behavioral model, NOT a live feed.

   There is no free, open-source live foot-traffic API (SafeGraph / Placer /
   Google Popular Times are all proprietary), so this encodes the well-known
   grocery "popular times" shape: quiet early mornings, a midday bump, and a big
   after-work 4–7pm peak on weekdays; a late-morning peak on weekends. It's used
   to tell a shopper when the aisles (and the parking lot) are calmest.

   This matters most in car-dependent metros — Dallas, Houston, most of the
   Sun Belt — where you can't just walk over off-peak; you drive, and the lot
   peaks with the crowd. Those boroughs get sharper peaks + a parking note.

   The fast-food-rush windows (lunch/dinner) are when people default to a
   drive-thru — often not because they want to, but because they don't know what
   to make. fastFoodSpike() flags those moments so the app can intercept with a
   "here's what you can cook right now" nudge instead. */

// Relative busyness 0–100 by hour, weekday vs weekend. Hand-shaped to match
// typical US grocery popular-times curves.
const WEEKDAY = [5, 4, 3, 3, 4, 8, 15, 24, 34, 42, 48, 55, 60, 55, 50, 54, 66, 82, 88, 78, 60, 42, 26, 12];
const WEEKEND = [6, 4, 3, 3, 4, 7, 14, 26, 42, 60, 78, 88, 90, 84, 76, 70, 66, 60, 52, 44, 34, 24, 15, 9];

// Boroughs where you drive to the store and the lot peaks with the crowd —
// the Sun Belt / non-walkable set we've plotted. Sharper peaks + parking note.
const CAR_DEPENDENT = new Set([
  'texas', 'florida', 'georgia', 'alabama', 'mississippi', 'louisiana',
  'tennessee', 'south-carolina', 'north-carolina', 'kentucky', 'west-virginia',
]);

export function isCarDependent(borough) { return CAR_DEPENDENT.has(borough); }

/** Busyness 0–100 for a store at a given time (default now). */
export function busynessAt(store, date = new Date()) {
  const day = date.getDay();       // 0 Sun … 6 Sat
  const hour = date.getHours();
  const weekend = day === 0 || day === 6;
  let level = (weekend ? WEEKEND : WEEKDAY)[hour];
  // Car-dependent metros: exaggerate the peaks (everyone arrives in the same
  // narrow after-work / weekend-midday window).
  if (store && isCarDependent(store.borough) && level > 55) {
    level = Math.min(100, Math.round(level * 1.12));
  }
  return level;
}

export function busynessLabel(level) {
  if (level < 25) return 'Quiet';
  if (level < 50) return 'Steady';
  if (level < 75) return 'Busy';
  return 'Packed';
}

// The calmest windows to recommend, phrased for a shopper.
export function bestWindow(date = new Date()) {
  const day = date.getDay();
  if (day === 0) return 'Sunday gets busy 11am–2pm — go before 10am or after 6pm.';
  if (day === 6) return 'Saturday peaks late morning — go before 9am or after 6pm.';
  return 'Weekdays are calmest before 10am or after 8pm — dodge the 4–7pm rush.';
}

/** Is it a fast-food rush right now? Lunch and dinner drive-thru peaks. */
export function fastFoodSpike(date = new Date()) {
  const h = date.getHours(), m = date.getMinutes();
  const t = h + m / 60;
  if (t >= 11.5 && t <= 13.5) return { active: true, meal: 'lunch' };
  if (t >= 17 && t <= 19.5) return { active: true, meal: 'dinner' };
  return { active: false, meal: null };
}
