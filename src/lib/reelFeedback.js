/* reelFeedback.js — persisted like/dislike state for the reel feed.

   Likes used to be an in-memory Set that reset on every reload; this
   persists both directions so "liked" and "disliked" survive a refresh.
   A disliked reel is remembered (with the reason) and filtered out of
   future feed loads — a real "don't show me this" effect, not just a
   cosmetic un-heart — while the reason itself is there for the user to
   see back, not just logged into a void. */

const LIKES_KEY = 'dig_in_reel_likes';
const DISLIKES_KEY = 'dig_in_reel_dislikes'; // { [reelId]: { reason, at } }

export const DISLIKE_REASONS = [
  'Not my flavor',
  'Too complicated',
  "Don't have the ingredients",
  'Seen this too many times',
  'Just not feeling it',
];

function loadJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
}
function saveJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ } }

export function loadLikedReels() {
  const arr = loadJSON(LIKES_KEY, []);
  return new Set(Array.isArray(arr) ? arr : []);
}
export function saveLikedReels(set) { saveJSON(LIKES_KEY, [...set]); }

export function loadDislikedReels() {
  const v = loadJSON(DISLIKES_KEY, {});
  return v && typeof v === 'object' ? v : {};
}

/** Mark a reel disliked with a reason (freeform or one of DISLIKE_REASONS). */
export function dislikeReel(reelId, reason) {
  const map = loadDislikedReels();
  map[reelId] = { reason: (reason || '').trim() || 'Not specified', at: Date.now() };
  saveJSON(DISLIKES_KEY, map);
  return map;
}

/** Undo a dislike (e.g. from a "manage my feedback" screen later). */
export function undislikeReel(reelId) {
  const map = loadDislikedReels();
  delete map[reelId];
  saveJSON(DISLIKES_KEY, map);
  return map;
}
