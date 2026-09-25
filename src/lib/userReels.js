/* userReels.js — persistence + economy for user-published reels.

   Everything here is client-only (localStorage) because this frontend has no
   upload backend yet — it's the swappable stand-in for a real reels API. Reels
   the user publishes are stored newest-first and merged in front of the
   built-in seed reels on the feed.

   Two currencies move on publish:
   - Nova Coins (`dig_in_nova_coins`, shared with the feed's like reward): each
     upload pays COINS_PER_UPLOAD.
   - Founding Creator spots (`dig_in_founding_count`): the first FOUNDING_CAP
     uploaders ever get a permanent number (see REEL_FIRST_100_INCENTIVE_PLAN).
     Seeded partway so the launch counter already feels alive. */

const REELS_KEY    = 'dig_in_user_reels';
const COINS_KEY    = 'dig_in_nova_coins';
const FOUNDING_KEY = 'dig_in_founding_count';

export const FOUNDING_CAP   = 100;
export const FOUNDING_SEED  = 63;   // spots already claimed at launch (demo)
export const COINS_PER_UPLOAD = 100;
const MAX_STORED = 12;              // cap persisted user reels so we never blow quota

export function loadUserReels() {
  try {
    const arr = JSON.parse(localStorage.getItem(REELS_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function getFoundingCount() {
  const n = Number(localStorage.getItem(FOUNDING_KEY));
  return Number.isFinite(n) && n > 0 ? n : FOUNDING_SEED;
}

export function getFoundingSpotsLeft() {
  return Math.max(0, FOUNDING_CAP - getFoundingCount());
}

export function getCoins() {
  const n = Number(localStorage.getItem(COINS_KEY));
  return Number.isFinite(n) ? n : 0;
}

// Save newest-first, dropping the oldest reels until it fits under quota.
function saveReels(list) {
  let arr = [...list];
  while (arr.length) {
    try { localStorage.setItem(REELS_KEY, JSON.stringify(arr)); return; }
    catch { arr = arr.slice(0, -1); }   // drop oldest (tail); newest stay at head
  }
  try { localStorage.removeItem(REELS_KEY); } catch { /* ignore */ }
}

function awardCoins(delta) {
  const n = getCoins() + delta;
  try { localStorage.setItem(COINS_KEY, String(n)); } catch { /* private mode */ }
  return n;
}

/* Publish a draft reel. Assigns a Founding Creator number (if any spots left),
   persists the reel, and pays the upload coin reward. Returns everything the
   success screen needs. */
export function publishUserReel(draft) {
  const prev = getFoundingCount();
  const foundingNumber = prev < FOUNDING_CAP ? prev + 1 : null;
  const next = prev + 1;
  try { localStorage.setItem(FOUNDING_KEY, String(next)); } catch { /* ignore */ }

  const reel = {
    ...draft,
    id: draft.id || `u-${Date.now()}`,
    isUser: true,
    foundingNumber,
    publishedAt: Date.now(),
    likes: 0,
  };
  saveReels([reel, ...loadUserReels()].slice(0, MAX_STORED));

  return {
    reel,
    foundingNumber,
    coins: awardCoins(COINS_PER_UPLOAD),
    coinsEarned: COINS_PER_UPLOAD,
    spotsLeft: Math.max(0, FOUNDING_CAP - next),
  };
}
