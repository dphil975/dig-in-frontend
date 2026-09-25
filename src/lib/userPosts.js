/* userPosts.js — persistence for user-written text / "Substack" posts.

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
