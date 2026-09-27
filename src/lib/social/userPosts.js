/* ============================================================================
   Merged module: src/lib/social/userPosts.js
   Combines the original src/lib/userPosts.js and src/lib/userReels.js.
   The old top-level files now re-export from here — see those files.
   ============================================================================ */

/* ── From userPosts.js ───────────────────────────────────────────────────────

   userPosts.js — persistence for user-written text / "Substack" posts.

   This is the feed's long-form text post: a title, a written body, and an
   optional numbered METHOD (the same step-by-step shape the recipe cards use,
   see RecipeStepViewer) — brought into the feed so a post can be a whole little
   write-up in a larger square, not just a photo of a dish.

   Client-only (localStorage), same swappable stand-in pattern as userReels.js:
   there's no posts backend yet, so these live on the device, newest-first, and
   are merged into the Home feed by buildFeed. Swap this module for a real posts
   API later and PostTypes/buildFeed don't change. Honesty: these are the user's
   OWN real posts — never fabricated authors or counts. */

const KEY = 'dig_in_user_posts';
const MAX_STORED = 30;                 // cap so we never blow localStorage quota
export const MAX_BODY = 4000;          // the WRITE-UP mode's ceiling — a real long piece, still storage-safe
export const MAX_QUICK_BODY = 240;     // the QUICK mode's ceiling — one line, Twitter-length, no title required
export const MAX_STEPS = 30;

export function loadUserPosts() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

// Save newest-first, dropping the oldest until it fits under quota.
function save(list) {
  let arr = [...list];
  while (arr.length) {
    try { localStorage.setItem(KEY, JSON.stringify(arr)); return; }
    catch { arr = arr.slice(0, -1); }   // drop oldest (tail); newest stay at head
  }
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

// Normalize a free-text tag into the app's #hashtag form (matches structuredTags'
// hashify so these posts join the same tag-search union as everything else).
export function normalizeTag(raw) {
  const t = String(raw || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return t ? `#${t}` : null;
}

export function tagsFromInput(str) {
  return [...new Set(
    String(str || '').split(/[,\s]+/).map(normalizeTag).filter(Boolean),
  )].slice(0, 8);
}

/* Publish a user write-up. `steps` is the optional numbered method. `origin` is
   an optional attribution ("Kitchen Alchemist", "Ask Nova") shown as a reblog
   credit, and `recipe` an optional full recipe object so the card can offer a
   real "Cook this →" handoff. Returns the stored post so the caller can drop it
   straight into the feed.

   `quick: true` is the Twitter-length mode — one short line, no title, capped
   at MAX_QUICK_BODY rather than MAX_BODY. Clamped here too (not just in the
   composer's live counter) so nothing can call this with a longer body and
   quietly get the write-up ceiling instead. */
export function publishUserPost({ title, body, steps = [], tags = [], author, origin = null, recipe = null, quick = false }) {
  const cap = quick ? MAX_QUICK_BODY : MAX_BODY;
  const clean = {
    id: `up-${Date.now()}`,
    kind: 'writeup',
    quick: !!quick,
    title: quick ? '' : String(title || '').trim().slice(0, 120),
    body: String(body || '').trim().slice(0, cap),
    steps: quick ? [] : (Array.isArray(steps) ? steps : [])
      .map((s) => String(s || '').trim())
      .filter(Boolean)
      .slice(0, MAX_STEPS),
    tags: Array.isArray(tags) ? tags.filter(Boolean).slice(0, 8) : [],
    author: String(author || '').trim() || 'you',
    origin: origin ? String(origin).slice(0, 40) : null,
    recipe: recipe || null,
    publishedAt: Date.now(),
    mine: true,
  };
  save([clean, ...loadUserPosts()].slice(0, MAX_STORED));
  return clean;
}

/* Reblog an invented/AI recipe into your community feed — the safe path the
   founder wants: instead of arbitrary UGC, you publish a recipe you generated
   in Kitchen Alchemist / the educational AI, credited to its origin, tagged
   with its own flavors PLUS the hashtags you follow (so it lands in the
   communities you're actually part of). Reuses the write-up post shape, so it
   flows straight into the Home feed and every matching tag page. Followed tags
   are read here so the caller doesn't have to. */
export function reblogRecipeToCommunity(recipe, { origin = 'Kitchen Alchemist', flavorTags = [], author } = {}) {
  if (!recipe) return null;
  let followed = [];
  try { const v = JSON.parse(localStorage.getItem('dig_in_followed_tags') || '[]'); followed = Array.isArray(v) ? v : []; }
  catch { /* ignore */ }
  const tags = [...new Set([...(flavorTags || []), ...followed])].slice(0, 8);
  const steps = (recipe.instructions || recipe.steps || []).map((s) => (typeof s === 'object' ? s.text || '' : s));
  const ingredients = (recipe.ingredients || []).map((i) => (typeof i === 'object' ? i.text || i.name : i)).filter(Boolean);
  const body = [
    recipe.summary || recipe.description || '',
    ingredients.length ? `Needs: ${ingredients.slice(0, 12).join(', ')}.` : '',
  ].filter(Boolean).join('\n\n');
  return publishUserPost({
    title: recipe.name || 'A recipe I made',
    body, steps, tags, author, origin, recipe,
  });
}

export function deleteUserPost(id) {
  save(loadUserPosts().filter((p) => p.id !== id));
}

/* ── From userReels.js ───────────────────────────────────────────────────────

   userReels.js — persistence + economy for user-published reels.

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
// Renamed from MAX_STORED (userReels.js's original name) to avoid colliding
// with userPosts.js's own private MAX_STORED constant above.
const MAX_STORED_REELS = 12;        // cap persisted user reels so we never blow quota

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
  saveReels([reel, ...loadUserReels()].slice(0, MAX_STORED_REELS));

  return {
    reel,
    foundingNumber,
    coins: awardCoins(COINS_PER_UPLOAD),
    coinsEarned: COINS_PER_UPLOAD,
    spotsLeft: Math.max(0, FOUNDING_CAP - next),
  };
}
