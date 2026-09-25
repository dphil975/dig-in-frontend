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

import { awardBadge } from './cookAchievements';
import { categorizeShelf } from './pantryCategories';

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
