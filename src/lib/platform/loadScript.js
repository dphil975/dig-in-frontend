/* ════════════════════════════════════════════════════════════
   Merged module — originally two files:
     · src/lib/recentlyShown.js  (persisted no-repeat memory)
     · src/utils/loadScript.js   (loadScriptOnce)
   ════════════════════════════════════════════════════════════ */

/* ── from recentlyShown.js ─────────────────────────────────────
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

/* ── from loadScript.js ────────────────────────────────────────
   loadScriptOnce — append a legacy /public <script> exactly once per document.

   Most of the legacy scripts under /public declare their API with top-level
   `const`/`class` (e.g. `class DigInAnalytics`, `const SUBSTITUTIONS`). Executing
   one of those a second time throws "Identifier '…' has already been declared".

   A naive `document.body.appendChild(script)` inside a useEffect runs twice in
   React 19 StrictMode (dev double-invoke) and again every time you navigate back
   to the page — each run re-executes the script. Removing the <script> node on
   cleanup does NOT undo the globals it defined, so that doesn't help and actually
   triggers the re-execution.

   This helper keys on the src: the script is appended at most once, kept for the
   life of the document, and any onReady callback fires immediately if it already
   loaded. Pass the same src from as many components as you like — it's a no-op
   after the first call. */

const registry = new Map(); // src -> { el, ready, callbacks }

export function loadScriptOnce(src, onReady) {
  let entry = registry.get(src);

  if (!entry) {
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.dataset.loadOnce = src;
    entry = { el, ready: false, callbacks: [] };
    registry.set(src, entry);

    el.addEventListener('load', () => {
      entry.ready = true;
      const callbacks = entry.callbacks;
      entry.callbacks = [];
      callbacks.forEach(cb => { try { cb(); } catch (e) { console.error(e); } });
    });
    el.addEventListener('error', () => {
      // Let a future call retry if the resource failed (e.g. transient 404).
      registry.delete(src);
    });

    document.body.appendChild(el);
  }

  if (typeof onReady === 'function') {
    if (entry.ready) { try { onReady(); } catch (e) { console.error(e); } }
    else entry.callbacks.push(onReady);
  }

  return entry.el;
}
