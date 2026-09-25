/* memoryVault — Nova's keepsakes over time (the premium hook).

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
