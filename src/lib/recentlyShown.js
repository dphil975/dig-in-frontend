/* ════════════════════════════════════════════════════════════
   RECENTLY SHOWN — persisted no-repeat memory shared by the grid
   reels (RecipeCards) and the Discover swipe feed (TikTokRecipeFeed).

   Both surfaces used to track "what was just shown" only in memory
   (a ref that resets on remount), so closing and reopening Discover,
   or shuffling twice, could show the exact same recipes again since
   scoreRecipe's weather/time/behavior/craving terms dominate over the
   small random jitter. This persists shown recipe keys to localStorage
   with timestamps so "avoid" carries across sessions, pruning entries
   older than a week so the pool eventually opens back up.
   ════════════════════════════════════════════════════════════ */

const KEY = 'dig_in_recently_shown';
const MAX_ENTRIES = 300;
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

function save(map) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch {}
}

function prune(map) {
  const now = Date.now();
  const entries = Object.entries(map).filter(([, ts]) => now - ts < TTL_MS);
  entries.sort((a, b) => b[1] - a[1]); // newest first
  return Object.fromEntries(entries.slice(0, MAX_ENTRIES));
}

/** Set of recipe keys shown recently (across sessions), not yet expired. */
export function getRecentlyShown() {
  return new Set(Object.keys(prune(load())));
}

/** Record recipe keys as shown just now. */
export function markShown(keys) {
  if (!keys || !keys.length) return;
  const map = load();
  const now = Date.now();
  for (const k of keys) if (k) map[k] = now;
  save(prune(map));
}
