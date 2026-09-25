/* feedSlots.js — compose the feed like a plate, not sort it like a list.

   The reason every feed homogenizes is that ONE number sorts everything, so
   whatever wins that number takes over. The fix (Part 3 of
   docs/product/DIG_IN_ALGORITHM.md) is to stop using one number. The feed is dealt from ten
   slots, each with its own eligibility rule. Content competes WITHIN a slot,
   never across slots — MIR ranks the candidates inside a slot, but it never
   decides which slot type wins, because slot types don't compete for the same
   space. Even if one format got wildly popular it could only ever win the slots
   it's eligible for; nine-tenths of the feed is reserved for other things. That
   is why this structurally cannot collapse into a monoculture.

   Slots 6 (cooking now) and 10 (in person, near you) are the in-person engine —
   20% of the feed by construction — because the whole point is getting an idea
   into a real kitchen, not holding a thumb on glass.

   Honesty: a slot with no real candidate is simply SKIPPED. We never fabricate
   a stranger, a live count, or an event to fill it. Some slots (an account
   you follow, live presence, local events) ship mostly empty today and fill in
   as the real backend arrives — but the slot exists now so the muscle exists
   before we need it. */

import { keyForPost, rankByMIR } from './madeItRate';
import { isAspirational } from './feedContext';
import { pregnancyCaution } from './pregnancyGuide';
import { depthScore, returnsFor } from './depthRank';
import { isActive, isLive, EXPERIMENTS, blendRankings, logShadowDecision } from './rankRollout';

/* The ten slots, with the copy the mockup + a future "why am I seeing this?"
   affordance can show. `n` matches the table in the doc. */
export const SLOTS = [
  { id: 'follow',       n: 1,  label: 'Someone you follow',  rule: 'Accounts you chose' },
  { id: 'local',        n: 2,  label: 'Within 20 miles',     rule: 'Geo-tagged, local. Always present' },
  { id: 'pantry',       n: 3,  label: 'You can make right now', rule: 'Cross-checked against your pantry' },
  { id: 'inSeason',     n: 4,  label: 'In season',           rule: 'Weather + calendar layer' },
  { id: 'ask',          n: 5,  label: 'An ask',              rule: 'A question you can answer in ten seconds' },
  { id: 'cookingNow',   n: 6,  label: 'Cooking now',         rule: 'Someone is mid-recipe right now' },
  { id: 'smallAccount', n: 7,  label: 'Seen by few',         rule: 'Reserved for small / new accounts' },
  { id: 'tagFollow',    n: 8,  label: 'A tag you follow',    rule: 'Sideways travel' },
  { id: 'chain',        n: 9,  label: 'A chain',             rule: 'Someone made someone else\'s dish' },
  { id: 'inPerson',     n: 10, label: 'In person, near you', rule: 'An event you could physically attend' },
];

// The order candidates are dealt in — a pleasant reading rhythm across the ten
// slots, plus three bridge lanes ('dish' = the real judged body, 'nova' = a
// person picking for you, 'editorial' = the reused below-the-fold systems).
// 'reelPreview' is NOT one of the ten — it's the ad-analog lane (a 7-second
// preview standing in for the honest-advertising slot the algorithm doc
// reserves), held to the same 1-in-20 sponsored cap below as a real paid
// placement would be, via its own `sponsored: true` flag.
const DEAL_ORDER = [
  'local', 'viral', 'pantry', 'inSeason', 'ask', 'cookingNow',
  'smallAccount', 'tagFollow', 'dish', 'reelPreview', 'chain', 'inPerson', 'nova', 'dish', 'editorial',
];

const DEFAULT_LIMIT = 30;   // the feed ENDS (Part 7) — thirty posts, then "come back tomorrow"

function recipeOf(post) {
  return post?.recipe || post?.entry?.recipeSnapshot || post?.reel?.recipe || null;
}

function minutesOf(recipe) {
  const t = recipe?.totalTime ?? recipe?.total_time
    ?? ((recipe?.prepTime || 0) + (recipe?.cookTime || 0)) ?? recipe?.time;
  if (typeof t === 'number' && t > 0) return t;
  const m = String(t || '').match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

// A real, stable author id when one exists (dish/viral/chain posts carry the
// journal entry's real userId); null for post shapes with no stable id today
// (write-ups key authorship by a free-text display name, not an id — scoring
// those against a fabricated id would let two different people named the
// same thing collide, so they're honestly skipped rather than guessed at).
function authorIdOf(post) {
  return post?.entry?.userId || null;
}

// depthRank's ranking of the SAME pool, for the staged rollout below. Real
// inputs only: `likes` from the entry's actual ratingCount, `returns` from
// depthRank's own local return-log. `replies` stays honestly empty — no
// per-post reply/comment list flows through the feed read path yet (see
// rankRollout.js's header) — so today this mostly reduces to likes+returns
// until that data is real. Posts with no extractable authorId are left out
// entirely; blendRankings keeps them at their baseline MIR position.
function depthRankOrder(pool) {
  return pool
    .map((post) => {
      const authorId = authorIdOf(post);
      if (!authorId) return null;
      const likes = post.entry?.ratingCount || 0;
      const { score } = depthScore({ authorId }, { replies: [], likes, returns: returnsFor(authorId) });
      return { post, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.post);
}

/* ── Context modulation, applied to one slot's candidates before ranking ──── */
function processPool(list, ctx) {
  if (!Array.isArray(list) || !list.length) return [];

  // 1. Hard filters — the mode said "not this," so it doesn't enter.
  let pool = list.filter((post) => {
    const r = recipeOf(post);
    if (!r) return true;                                   // non-recipe posts (ask/editorial) pass
    if (ctx.capMinutes) { const m = minutesOf(r); if (m != null && m > ctx.capMinutes) return false; }
    if (ctx.suppressAspirational && isAspirational(r)) return false;
    return true;
  });
  if (!pool.length) return [];

  // 2. MIR ranks within the slot (identity on a cold feed — see madeItRate).
  pool = rankByMIR(pool, keyForPost);

  // 2b. Staged ranking rollout (rankRollout.js) — depthRank starts at
  // 'shadow': computed and logged against every real candidate in this slot,
  // but blendWeight resolves to 0 until the experiment is actually live for
  // this user, and blendRankings(..., 0) returns `pool` untouched by an early
  // return — not a no-op blend, an actual skipped code path. Ramping the
  // stage in rankRollout.js is the only thing that ever changes that.
  if (isActive('depthRank')) {
    const alt = depthRankOrder(pool);
    if (alt.length) {
      const basePos = new Map(pool.map((p, i) => [keyForPost(p), i]));
      const altPos = new Map(alt.map((p, i) => [keyForPost(p), i]));
      for (const [key, altRank] of altPos) {
        const baselineRank = basePos.get(key);
        if (baselineRank != null) logShadowDecision('depthRank', { postId: key, baselineRank, altRank });
      }
      const weight = isLive(ctx.userId, 'depthRank') ? EXPERIMENTS.depthRank.blendWeight : 0;
      pool = blendRankings(pool, alt, keyForPost, weight);
    }
  }

  // 3. Context WEIGHTS (soft) — stable-sorted so MIR order survives ties.
  const forced = new Set(ctx.forceTags || []);
  const followed = new Set(ctx.followedTags || []);
  const scored = pool.map((post, i) => {
    const r = recipeOf(post);
    let s = 0;
    if (r) {
      const hay = `${r.name || ''} ${r.description || ''}`;
      if (ctx.seasonSuppress && ctx.seasonSuppress.test(hay)) s -= 2;
      if (ctx.seasonSurface && ctx.seasonSurface.test(hay)) s += 1;
      if (ctx.softCapMinutes) { const m = minutesOf(r); if (m != null && m > ctx.softCapMinutes) s -= 1; }
      // Pregnant / new-baby: common food-safety categories quietly pushed
      // down, never removed (see lib/pregnancyGuide.js) — the user still
      // decides, this just doesn't lead with them.
      if (ctx.pregnancyAware && pregnancyCaution(r)) s -= 2;
    }
    for (const t of post.tags || []) if (forced.has(t)) s += 2;
    // Followed hashtags lean the whole feed (every slot) toward them — a soft
    // nudge (+1.5/tag, capped) so followed content surfaces more often
    // everywhere WITHOUT ever crowding out the discovery the other slots deal.
    if (followed.size) {
      let fb = 0;
      for (const t of post.tags || []) if (followed.has(t)) fb += 1.5;
      s += Math.min(fb, 4.5);
    }
    return { post, i, s };
  });
  scored.sort((a, b) => (b.s - a.s) || (a.i - b.i));   // stable within equal weight
  return scored.map((x) => x.post);
}

// The deal pattern, boosted: a life mode can make a lane appear twice per pass
// (≈2× presence) — e.g. "cooking for one" boosts cookingNow, "just moved"
// boosts local + pantry.
function dealPattern(ctx) {
  const pattern = [...DEAL_ORDER];
  for (const slot of ctx.boostSlots || []) {
    if (pattern.includes(slot)) pattern.splice(pattern.indexOf(slot) + 1, 0, slot);
  }
  return pattern;
}

/**
 * Deal the feed body from the slot pools.
 * @param pools  { [slotId|'dish'|'nova'|'editorial']: post[] } — honest, pre-built candidates
 * @param ctx    from feedContext.buildContext()
 * @param opts   { limit }
 * @returns ordered post[] — quota-fair, MIR-ranked-within-slot, context-modulated
 */
export function allocateSlots(pools = {}, ctx = {}, opts = {}) {
  const limit = Math.min(opts.limit || DEFAULT_LIMIT, ctx.maxPosts || DEFAULT_LIMIT);
  const pattern = dealPattern(ctx);

  const ranked = {};
  for (const id of new Set(pattern)) ranked[id] = processPool(pools[id] || [], ctx);

  const cursors = {};
  const out = [];
  const seenId = new Set();
  const seenKey = new Set();
  let lastSponsoredAt = -Infinity;   // 1-in-20 ad cap (Part 6), enforced here

  let guard = 0;
  while (out.length < limit && guard < limit * 4) {
    let progressed = false;
    for (const id of pattern) {
      if (out.length >= limit) break;
      const list = ranked[id];
      if (!list) continue;
      let idx = cursors[id] || 0;
      // advance to the next not-yet-shown, ad-cap-legal candidate in this slot
      while (idx < list.length) {
        const post = list[idx];
        idx += 1;
        const k = keyForPost(post);
        if (seenId.has(post.id) || (k && seenKey.has(k))) continue;
        if (post.sponsored && (out.length - lastSponsoredAt) < 20) continue;   // hold sponsored back
        // take it
        cursors[id] = idx;
        out.push(post);
        seenId.add(post.id);
        if (k) seenKey.add(k);
        if (post.sponsored) lastSponsoredAt = out.length;
        progressed = true;
        break;
      }
      if (idx >= list.length) cursors[id] = idx;   // slot exhausted
    }
    if (!progressed) break;
    guard += 1;
  }
  return out;
}

/** For the "why you're seeing this" label — the slot a post was dealt from.
    Keyed strictly on the slot id so a regular body dish (slot 'dish') stays
    unlabelled and only the slot-7 floor reads "Seen by few". Null = no label. */
// Only the placements a reader would actually wonder about — the ones whose own
// card doesn't already state why it's here. The self-explaining cards (Nova, in
// season with its weather kicker, cooking-now's live banner, place's "popular
// near you") get no chip, so the label never just echoes the headline.
const SLOT_LABELS = {
  smallAccount: 'Seen by few',
  tagFollow:    'A tag you follow',
  inPerson:     'In person, near you',
};
export function slotLabelFor(post) {
  return SLOT_LABELS[post?.slot] || null;
}
