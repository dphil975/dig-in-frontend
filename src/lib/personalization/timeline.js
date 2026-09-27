/* timeline.js — the distribution layer that sits ABOVE feedSlots.

   docs/product/DIG_IN_ALGORITHM.md Part 3 is "slots, not scores": the feed is composed like
   a plate, and content competes only within a slot. This module does NOT add a
   competing scorer. It answers three questions that sit one level up:

     1. Is the app big enough to rank at all yet?   → timelinePhase()
     2. What is this post's real quality signal?    → qualitySignal()
     3. Who gets amplified, and for what behavior?  → generosity + founding

   ── THE PHASED ROLLOUT ──────────────────────────────────────────────────────
   Founder's spec: the first 30 users get everything in chronological order,
   and the algorithm only starts pushing out the first 300 users once there are
   1,000 daily actives.

   The reason this is right and not just cautious: ranking is a claim about
   confidence. With 30 users there is no denominator, so any ordering you show
   is invented — which is the same argument madeItRate.js already makes when it
   refuses to sort below minTotalImpressions. Chronological is the honest
   ordering for a small room. It also means the earliest users experience the
   app as a room where everything they post is seen, which is the only reason
   anyone stays through a cold start.

   ── WHY THERE IS NO PEOPLE LEADERBOARD ──────────────────────────────────────
   Founder's read: existing apps pit women against each other, and women pay for
   exposure rather than for community. Both point the same direction — exposure
   is the actual currency, so the design question is what you have to DO to earn
   it.

   Here, the thing that earns distribution is lifting someone else (see
   GENEROSITY_ACTS). Ranking never reads follower counts, and dishes are ranked
   while people are not — there is deliberately no "top women" list anywhere in
   this module, because a ranked list of people IS the mechanism that turns a
   community into a competition. Slot 7 (accounts under 50 followers) already
   guarantees strangers get seen; this module never overrides that floor.

   ── HOBBIES ARE NOT MONETIZED ───────────────────────────────────────────────
   Founder was explicit. rankInSlot() reads only the fields in RANKING_FIELDS,
   and commercial fields are stripped before scoring, so a sponsored or
   affiliate-bearing post can never out-rank an ordinary one by virtue of being
   commercial. Advertising lives in its own slot (Part 6), not in the ranking.

   Pure functions + localStorage, no network. */

import { mir, keyForPost } from '../madeItRate';

/* ── The 240-character composer ──────────────────────────────────────────────
   Founder: the Twitter 240 model is smart because it forces you to think
   before you speak. Kept as a hard cap rather than a soft warning — a limit
   you can exceed isn't a constraint, it's a suggestion.

   Counted in grapheme clusters, so an emoji or a family-with-skin-tone counts
   as one character the way a person perceives it, not the four-to-seven UTF-16
   units JavaScript's .length would report. */
export const POST_MAX = 240;

const segmenter = (() => {
  try { return new Intl.Segmenter(undefined, { granularity: 'grapheme' }); }
  catch { return null; }
})();

export function countChars(text) {
  const s = String(text ?? '');
  if (!s) return 0;
  if (segmenter) {
    let n = 0;
    for (const _ of segmenter.segment(s)) n += 1;
    return n;
  }
  return [...s].length;   // code points — still emoji-aware enough as a fallback
}

export function validatePost(text) {
  const s = String(text ?? '');
  const trimmed = s.trim();
  const count = countChars(s);
  return {
    count,
    remaining: POST_MAX - count,
    empty: trimmed.length === 0,
    tooLong: count > POST_MAX,
    ok: trimmed.length > 0 && count <= POST_MAX,
  };
}

/* ── Phases ──────────────────────────────────────────────────────────────── */

export const SEED_COHORT     = 30;     // pure chronological, no composition
export const FOUNDING_COHORT = 300;    // amplified once the room is big enough
export const OPEN_AT_DAU     = 1000;   // the threshold that turns ranking on

export const PHASES = {
  /** ≤30 users. Reverse-chronological, nothing else. No slots, no ranking. */
  SEED: 'seed',
  /** Growing, but under 1,000 DAU. Slots compose the plate; order inside a
      slot stays chronological because MIR has no denominator worth trusting. */
  CHRONO: 'chrono',
  /** ≥1,000 DAU. Full slot composition, MIR ranking inside slots, and the
      founding 300 get their amplification. */
  OPEN: 'open',
};

export function timelinePhase({ totalUsers = 0, dau = 0 } = {}) {
  if (dau >= OPEN_AT_DAU) return PHASES.OPEN;
  if (totalUsers <= SEED_COHORT) return PHASES.SEED;
  return PHASES.CHRONO;
}

/** Human-readable, for an about/status surface. Being legible about when
    ranking switches on is the opposite of how every other feed behaves. */
export function phaseExplainer(phase) {
  switch (phase) {
    case PHASES.SEED:
      return `Everything is in the order it was posted. With under ${SEED_COHORT} people there's no honest way to rank — so we don't pretend.`;
    case PHASES.CHRONO:
      return `The feed is composed from slots, but order inside each one is still chronological. Ranking turns on at ${OPEN_AT_DAU.toLocaleString()} daily people.`;
    case PHASES.OPEN:
      return `Ranking is on inside each slot, and the first ${FOUNDING_COHORT} people here get carried further.`;
    default:
      return '';
  }
}

export const isFounding = (user) =>
  Number.isFinite(user?.joinRank) && user.joinRank <= FOUNDING_COHORT;

/** The founding-cohort multiplier. Deliberately modest and phase-gated: it
    thanks the people who showed up to an empty room, it does not hand them the
    feed permanently. Never applies before OPEN — amplifying 300 people inside
    a room of 200 would just BE the feed. */
export function foundingBoost(post, phase) {
  return phase === PHASES.OPEN && isFounding(post?.author) ? 1.15 : 1;
}

/* ── Quality vs. engagement ──────────────────────────────────────────────────
   Founder: "just because someone interacts with the post doesn't mean it's
   viral worthy."

   So engagement is reported and never ranked on. The ranking signal is MIR —
   did anyone actually cook it — which madeItRate.js already computes with a
   beta prior and a cold-start refusal. A post with 500 likes and no cooks is,
   by this app's definition, a post that failed. */

/** Fields ranking is allowed to see. Everything else — including every
    commercial field — is invisible to the scorer by construction. */
export const RANKING_FIELDS = Object.freeze(['id', 'recipe', 'entry', 'createdAt', 'author']);

const COMMERCIAL_FIELDS = Object.freeze([
  'sponsored', 'promoted', 'affiliate', 'affiliateUrl', 'adUnit', 'cpm', 'brandDeal', 'paid',
]);

function forRanking(post) {
  const clean = {};
  RANKING_FIELDS.forEach((f) => { if (post?.[f] !== undefined) clean[f] = post[f]; });
  return clean;
}

/** Is this post carrying commercial payload? Used to route it to the ad slot
    (Part 6) rather than to suppress it — disclosure, not punishment. */
export const isCommercial = (post) =>
  COMMERCIAL_FIELDS.some((f) => Boolean(post?.[f]));

/**
 * The honest read on a post: what it converted, and — separately — what it
 * merely collected. `quality` is the only member used for ordering.
 */
export function qualitySignal(post, { days = 7 } = {}) {
  const key = keyForPost(forRanking(post));
  const m = key ? mir(key, { days }) : { impressions: 0, conversions: 0, rate: 0, smoothed: 0 };
  const engagement = (post?.likes ?? 0) + (post?.comments ?? 0);
  return {
    quality: m.smoothed,          // ranks
    cooked: m.conversions,        // the number worth showing a human
    seen: m.impressions,
    engagement,                   // reported, never ranked
    // True when a post is popular but nobody acted on it. Not a penalty —
    // a flag the UI can use to stop calling it "trending."
    hollow: engagement >= 25 && m.impressions >= 40 && m.conversions === 0,
  };
}

/* ── Generosity — the thing that actually earns distribution ─────────────────
   Founder: women should be rewarded and applauded for interacting with each
   other positively, rather than pitted against one another.

   The acts below all share one property: you cannot perform them alone, and
   each one makes SOMEONE ELSE more visible. That's the whole design. Crediting
   another cook is already a first-class object in the algorithm (slot 9, "a
   chain"), so this rewards the behavior the feed was already built to carry.

   Decayed over 30 days so it reflects how you're behaving now, not a balance
   you banked once. Capped so it lifts a good citizen without ever becoming the
   dominant term — generosity should not be farmable. */

export const GENEROSITY_ACTS = Object.freeze({
  credit:      { weight: 3, label: 'Credited whose recipe you cooked' },
  substitute:  { weight: 2, label: 'Shared a tool or ingredient swap that worked' },
  answer:      { weight: 2, label: 'Answered someone\'s ask' },
  welcome:     { weight: 2, label: 'Welcomed someone posting for the first time' },
  reshare:     { weight: 1, label: 'Passed on someone else\'s dish' },
});

const GEN_KEY = 'dig_in_generosity';
const GEN_WINDOW_DAYS = 30;
const DAY_MS = 86400000;
const GEN_CAP = 1.25;   // the most generosity can ever multiply your reach

function readGen() {
  try { const v = JSON.parse(localStorage.getItem(GEN_KEY) || '[]'); return Array.isArray(v) ? v : []; }
  catch { return []; }
}
function writeGen(list) {
  try { localStorage.setItem(GEN_KEY, JSON.stringify(list.slice(0, 500))); } catch { /* ignore */ }
}

/** Record a generous act. `toUserId` is required — an act that doesn't name
    who it lifted isn't one of these acts. */
export function creditGenerosity(actId, toUserId, now = Date.now()) {
  if (!GENEROSITY_ACTS[actId] || !toUserId) return readGen();
  const list = readGen();
  list.unshift({ act: actId, to: String(toUserId), at: now });
  writeGen(list);
  return list;
}

/** Decayed generosity total over the window. Linear decay: an act is worth its
    full weight today and nothing on day 30. */
export function generosityScore(now = Date.now()) {
  return readGen().reduce((sum, e) => {
    const age = (now - e.at) / DAY_MS;
    if (age < 0 || age > GEN_WINDOW_DAYS) return sum;
    const w = GENEROSITY_ACTS[e.act]?.weight ?? 0;
    return sum + w * (1 - age / GEN_WINDOW_DAYS);
  }, 0);
}

/** Generosity as a reach multiplier, saturating toward GEN_CAP. */
export function generosityBoost(now = Date.now()) {
  const s = generosityScore(now);
  return 1 + (GEN_CAP - 1) * (s / (s + 10));
}

/** What to actually say to someone about it — applause, not a score. The
    founder's word was "applauded," and a number would just be a leaderboard
    with one row. */
export function generosityNote(now = Date.now()) {
  const recent = readGen().filter((e) => now - e.at <= GEN_WINDOW_DAYS * DAY_MS);
  if (!recent.length) return null;
  const people = new Set(recent.map((e) => e.to)).size;
  return people === 1
    ? 'You put someone else forward this month. That\'s the part that travels.'
    : `You put ${people} other people forward this month. That's the part that travels.`;
}

/* ── Time range + sort ───────────────────────────────────────────────────────
   Founder's toggle: 24 hours, 1 week, 1 month, 1 year, newest, oldest. Range
   and direction are separate controls on purpose — "last week, oldest first"
   is a real way to read a community you just joined from the beginning. */

export const TIME_RANGES = [
  { id: 'day',   label: '24 hours', ms: DAY_MS },
  { id: 'week',  label: '1 week',   ms: 7 * DAY_MS },
  { id: 'month', label: '1 month',  ms: 30 * DAY_MS },
  { id: 'year',  label: '1 year',   ms: 365 * DAY_MS },
  { id: 'all',   label: 'All time', ms: null },
];

export const SORTS = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
];

const timeOf = (p) => {
  const t = p?.createdAt ?? p?.at ?? p?.created_at;
  const n = typeof t === 'number' ? t : Date.parse(t);
  return Number.isFinite(n) ? n : 0;
};

export function filterByRange(posts, rangeId = 'all', now = Date.now()) {
  const range = TIME_RANGES.find((r) => r.id === rangeId);
  if (!range || range.ms == null) return [...(posts || [])];
  return (posts || []).filter((p) => now - timeOf(p) <= range.ms);
}

export function sortPosts(posts, sortId = 'newest') {
  const list = [...(posts || [])];
  // Stable: equal timestamps keep input order in both directions.
  return sortId === 'oldest'
    ? list.sort((a, b) => timeOf(a) - timeOf(b))
    : list.sort((a, b) => timeOf(b) - timeOf(a));
}

/* ── Composition ─────────────────────────────────────────────────────────── */

/**
 * Order a set of candidates for display.
 *
 * SEED and CHRONO both return pure chronological order — that is the whole
 * point of the phase gate. Only OPEN applies the quality/generosity/founding
 * terms, and even then this orders candidates WITHIN one slot; it never
 * decides which slot wins. That stays feedSlots' job.
 */
export function composeTimeline(posts, {
  phase = PHASES.SEED,
  range = 'all',
  sort = 'newest',
  now = Date.now(),
  days = 7,
} = {}) {
  const windowed = filterByRange(posts, range, now);

  if (phase !== PHASES.OPEN) return sortPosts(windowed, sort);

  // Respect an explicit "oldest" even when ranking is on — the user asked a
  // direct question about chronology and an algorithm shouldn't talk over it.
  if (sort === 'oldest') return sortPosts(windowed, sort);

  return windowed
    .map((post, i) => ({
      post,
      i,
      score: qualitySignal(post, { days }).quality
        * foundingBoost(post, phase)
        * generosityBoost(now),
    }))
    .sort((a, b) => (b.score - a.score) || (a.i - b.i))
    .map((x) => x.post);
}

/* ── The community carousel ──────────────────────────────────────────────────
   Founder: expanding a post reveals a carousel of communities that align with
   it, and tapping one travels sideways into that community.

   Overlap is computed on tags only. Deliberately not personalized: this is a
   map of what the post is adjacent to, and personalizing it would quietly turn
   a wayfinding device into another recommender. */

const norm = (t) => String(t || '').toLowerCase().replace(/^#/, '').trim();

export function relatedCommunities(post, communities = [], limit = 6) {
  const tags = new Set((post?.tags || []).map(norm).filter(Boolean));
  if (!tags.size) return [];

  return communities
    .map((c) => {
      const ctags = (c?.tags || []).map(norm);
      const shared = ctags.filter((t) => tags.has(t));
      return { community: c, shared, overlap: shared.length };
    })
    .filter((x) => x.overlap > 0)
    // Ties break toward the SMALLER community, so sideways travel discovers
    // rooms instead of funnelling everyone into the biggest one — the same
    // instinct as slot 7.
    .sort((a, b) => (b.overlap - a.overlap) || ((a.community.memberCount ?? 0) - (b.community.memberCount ?? 0)))
    .slice(0, limit);
}
