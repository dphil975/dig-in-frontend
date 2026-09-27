/* ============================================================================
   Merged module: src/lib/social/reelFeedback.js
   Combines the original src/lib/reelFeedback.js and src/lib/virality.js.
   The old top-level files now re-export from here — see those files.
   ============================================================================ */

/* ── From reelFeedback.js ────────────────────────────────────────────────────

   reelFeedback.js — persisted like/dislike state for the reel feed.

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

/* ── From virality.js ────────────────────────────────────────────────────────

   virality.js — how a real post "goes viral" and reaches everyone's feed.

   The rule the founder set: a post needs more than ~30 people to view AND
   interact before it takes off; once enough people interact, it spreads to
   everyone's feed. The honest way to build that on this app is to anchor it on
   the ONE genuinely multi-user signal that already exists — the judged-cook
   feed (node/routes/journal.js, listJudgedFeed): every entry carries a REAL
   `ratingCount` (how many different people rated/weighed in on that dish) and a
   REAL `ratingAvg`, written by the backend, not this device. That count IS the
   "people who interacted" number — so a dish crossing the threshold genuinely
   IS spreading across the community, and because the judged feed is the same
   for everyone, promoting it here promotes it in everyone's feed for real. No
   fabricated view counts, no phantom "3.2k people watching" — the number shown
   is the number the backend actually recorded.

   Tiers:
     • catching  — real early traction (≥ CATCHING_MIN interactions), a genuine
                   "this is starting to move" without over-claiming.
     • viral     — crossed the founder's threshold (> VIRAL_MIN = 30 people),
                   AND people actually like it (ratingAvg gate), so "viral" here
                   means "spreading because it's good," not rage-bait spreading
                   because it's infuriating (the MIR philosophy — nobody cooks
                   angry — applied to spread, not just ranking).

   Ships mostly empty until real dishes accrue real ratings — same honest
   posture as the feed's other backend-fed lanes. */

export const CATCHING_MIN = 10;   // real interactions to be "catching on"
export const VIRAL_MIN = 30;      // the founder's "> 30 people" threshold
const VIRAL_AVG_GATE = 3.4;       // out of 5 — spreading BECAUSE people like it
const CATCHING_AVG_GATE = 3.0;

function ratingCountOf(entry) {
  const n = Number(entry?.ratingCount);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function ratingAvgOf(entry) {
  const a = Number(entry?.ratingAvg);
  return Number.isFinite(a) ? a : 0;
}

/** Virality read for one judged entry, or null if it hasn't taken off.
    { tier: 'viral' | 'catching', count, avg } — count/avg are the REAL numbers
    the backend recorded, safe to show verbatim. */
export function viralityOf(entry) {
  const count = ratingCountOf(entry);
  if (count < CATCHING_MIN) return null;
  const avg = ratingAvgOf(entry);
  if (count >= VIRAL_MIN && avg >= VIRAL_AVG_GATE) return { tier: 'viral', count, avg };
  if (avg >= CATCHING_AVG_GATE) return { tier: 'catching', count, avg };
  return null;
}

/** The honest, verbatim community line for a viral/catching entry. */
export function viralLine(v) {
  if (!v) return '';
  const people = `${v.count} ${v.count === 1 ? 'person has' : 'people have'} weighed in`;
  return v.tier === 'viral'
    ? `Going viral — ${people} and it's climbing.`
    : `Catching on — ${people}.`;
}

/** Score for ordering the viral lane — spread first, then how well-liked. */
export function viralScore(v) {
  if (!v) return 0;
  return (v.tier === 'viral' ? 1000 : 0) + v.count + v.avg;
}
