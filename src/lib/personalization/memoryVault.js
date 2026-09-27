/* ============================================================================
   Merged module: src/lib/personalization/memoryVault.js
   Combines the original src/lib/memoryVault.js and src/lib/cookJournal.js.
   The old top-level files now re-export from here — see those files.

   Naming conflict resolved: both files declared a private top-level
   `function load()`. cookJournal.js's has been renamed to
   `loadJournalRaw()` (and its `save()` to `saveJournal()`) throughout its
   section below; memoryVault.js's own `load()`/`persist()` are untouched.
   ============================================================================ */

/* ── From memoryVault.js ─────────────────────────────────────────────────────

   memoryVault — Nova's keepsakes over time (the premium hook).

   Every warm moment Nova has with the cook — a cook celebration, a love-letter
   about their taste, a streak milestone — can be saved here and re-read later.
   It's deliberately a scrapbook of the relationship, not a feed of nudges:
   only `saveable` reactions and celebrations land here.

   Storage: `dig_in_nova_memories` — newest-first array of
   { id, kind, text, context, dedupeKey, createdAt }. */

const KEY = 'dig_in_nova_memories';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}
function persist(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* quota */ }
}

export function getMemories() { return load(); }
export function memoryCount() { return load().length; }

/**
 * Save a keepsake. `dedupeKey` prevents the same moment stacking up (e.g. the
 * same daily love-letter). Returns the saved memory, or null if it was a dupe.
 */
export function saveMemory({ kind = 'love', text, context = null, dedupeKey = null }) {
  if (!text) return null;
  const list = load();
  if (dedupeKey && list.some(m => m.dedupeKey === dedupeKey)) return null;
  const mem = {
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    kind, text, context, dedupeKey,
    createdAt: new Date().toISOString(),
  };
  persist([mem, ...list]);
  return mem;
}

/** Has a keepsake with this dedupeKey already been saved? */
export function hasMemory(dedupeKey) {
  if (!dedupeKey) return false;
  return load().some(m => m.dedupeKey === dedupeKey);
}

export function deleteMemory(id) {
  persist(load().filter(m => m.id !== id));
}

/** A stable per-day dedupe key for a reaction, so a love-letter saves once a day. */
export function dailyKey(reactionId) {
  return `${reactionId}:${new Date().toISOString().slice(0, 10)}`;
}

/* ── From cookJournal.js ─────────────────────────────────────────────────────

   cookJournal.js — "document without performing."

   The gap this closes: this app already has a real leveling system (the
   Leaderboard's home-cook score reads real cook history/streak/badges — see
   Leaderboard/index.jsx's useRealHomeCookScore), and it already generates a
   pixel-art portrait of a finished dish (FinishedDishPixelator). What it
   didn't have was a place that stitches those into a personal timeline —
   the thing that makes "food blogging" feel possible for someone who wants
   to document their cooking but doesn't want an audience. Private by
   default. Sharing a specific entry to a real friend Circle (this app's
   actual multi-user backend, see circlesApi.js) is one deliberate tap, never
   automatic and never public-by-default.

   Snapping the photo already happens (FinishedDishPixelator runs right on
   the recipe page) — this just keeps what was already made instead of
   letting it evaporate into a single localStorage key per recipe. */

const JOURNAL_KEY = 'dig_in_cook_journal';
const PIXEL_PREFIX = 'dig_in_finished_dish_pixel_';

// Renamed from load()/save() (cookJournal.js's original names) to avoid
// colliding with memoryVault.js's own private load() above.
function loadJournalRaw() {
  try { const v = JSON.parse(localStorage.getItem(JOURNAL_KEY)); return Array.isArray(v) ? v : []; }
  catch { return []; }
}
function saveJournal(list) { try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(list)); } catch { /* ignore */ } }

/** The pixel art already generated for this recipe (FinishedDishPixelator),
    if any — reused rather than asking for a second photo. */
function existingPixelFor(recipeId) {
  if (!recipeId) return null;
  try {
    const raw = JSON.parse(localStorage.getItem(`${PIXEL_PREFIX}${recipeId}`) || 'null');
    return raw?.dataUrl || null;
  } catch { return null; }
}

/** Record a cook in the personal journal. Idempotent-ish: calling it again
    for the same recipe the same day just updates the note/pixel rather than
    stacking duplicate entries for one sitting at the stove. `photoUrl` is the
    real "I made this" capture from RecipeFull (always present the moment
    someone finishes cooking); the FinishedDishPixelator's pixel art is used
    instead when it exists, since it's the nicer of the two, but nothing here
    ever requires a second photo. */
export function addJournalEntry(recipe, { note = '', photoUrl = null } = {}) {
  if (!recipe) return loadJournalRaw();
  const list = loadJournalRaw();
  const dayKey = new Date().toDateString();
  const recipeId = recipe.id ?? recipe.name;
  const pixelUrl = existingPixelFor(recipeId) || photoUrl || null;

  const existingIdx = list.findIndex((e) => e.recipeId === recipeId && e.dayKey === dayKey);
  const entry = {
    id: existingIdx >= 0 ? list[existingIdx].id : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    recipeId,
    recipeName: recipe.name || 'A dish',
    country: recipe.country || recipe.cuisine || null,
    at: Date.now(),
    dayKey,
    pixelUrl,
    note,
    sharedTo: existingIdx >= 0 ? list[existingIdx].sharedTo || [] : [],
  };

  if (existingIdx >= 0) list[existingIdx] = entry;
  else list.unshift(entry);

  saveJournal(list);
  return list;
}

export function loadJournal() {
  return loadJournalRaw().slice().sort((a, b) => b.at - a.at);
}

export function removeJournalEntry(id) {
  const list = loadJournalRaw().filter((e) => e.id !== id);
  saveJournal(list);
  return list;
}

/** Attach a lightweight note to an entry after the fact — no photo required
    twice, just the reflection. */
export function updateJournalNote(id, note) {
  const list = loadJournalRaw();
  const idx = list.findIndex((e) => e.id === id);
  if (idx >= 0) { list[idx] = { ...list[idx], note }; saveJournal(list); }
  return list;
}

/** Mark an entry as shared to a given circle id — purely a local record of
    intent; the actual post goes through circlesApi.createPost separately so
    this file never needs to know about auth/network. */
export function markSharedToCircle(id, circleId) {
  const list = loadJournalRaw();
  const idx = list.findIndex((e) => e.id === id);
  if (idx >= 0 && !list[idx].sharedTo.includes(circleId)) {
    list[idx] = { ...list[idx], sharedTo: [...list[idx].sharedTo, circleId] };
    saveJournal(list);
  }
  return list;
}

/** Simple, non-shaming stats for the journal header — count and this-month
    count, nothing that implies a streak you can "break." */
export function journalStats() {
  const list = loadJournalRaw();
  const now = new Date();
  const thisMonth = list.filter((e) => {
    const d = new Date(e.at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  return { total: list.length, thisMonth };
}
