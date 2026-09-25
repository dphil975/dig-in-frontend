/* rankRollout.js — staged, reversible rollout for a NEW ranking signal.

   "Staged ranking rollout: new. Nothing yet. Spec'd in Phase 1." This is
   Phase 1, built: the discipline every real feed team uses before flipping a
   ranking change on for everyone — a % rollout with a kill switch and real
   instrumentation — reimplemented honestly for an app with no backend
   experimentation platform.

   ── The mechanism ───────────────────────────────────────────────────────
   Deterministic per-user bucketing (stable across sessions and reloads — the
   same person doesn't flicker between old and new ranking on every reload),
   independent per experiment (being a canary for one doesn't predict it for
   another), and named STAGES you ramp deliberately:

     off        kill switch. Nothing computed, nothing changed, nothing logged.
     shadow     the new score IS computed and logged, but the feed order
                shown to everyone is untouched. The safest real step: it
                proves the mechanism and the input data work before a single
                person's feed actually changes.
     canary     1% see the real, blended ranking.
     expanding  10%.
     half       50%.
     full       100%.

   There's no remote config server behind `EXPERIMENTS[x].stage` — ramping is
   a deliberate, reviewed code change, the same way real teams gate a rollout
   behind a PR before they have a flag service (and often after).

   ── Why both experiments start at 'shadow' ─────────────────────────────────
   Neither depthRank's lift-aware score nor nurtureScore has ever run against
   real traffic, and their richest inputs (real per-post reply/comment text)
   depend on data this repo can't yet confirm flows all the way through the
   feed read path — see nurture.js's own caveat about the journal backend
   being a separate repo. Shipping either straight to a live percentage would
   mean reordering real people's feeds on an unverified assumption. Shadow
   mode answers "does the input data even exist yet" with real logged
   evidence, at zero risk, before that question gets asked with live traffic. */

// Deliberately NOT reusing recipeRecommender's seededRng here — tried it
// first, and measured it (see the test suite this file shipped with): its
// gematria() seed is a POSITION-INDEPENDENT character sum, which clusters
// narrowly for same-length strings (real ids from syncService.js are all
// ~36-char UUIDs), and mulberry32's first draw from closely-clustered seeds
// isn't guaranteed to scatter — 20,000 real-shaped UUIDs landed 0 of them in
// the bottom percentile and up to 86% off the expected count per decile.
// That's fine for seededRng's actual job (cosmetic jitter, e.g. drink-pairing
// tie-breaks) and wrong for this one, where the entire safety property of a
// staged rollout is "1% actually means 1%." FNV-1a + a finalizer mix below
// is position-DEPENDENT (every character re-multiplies the running hash), so
// near-identical seeds scramble completely differently — the actual property
// bucketing needs.
function hashBucketSeed(str) {
  let h = 0x811c9dc5;               // FNV-1a 32-bit offset basis
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);   // FNV prime
  }
  h ^= h >>> 15;                    // finalizer mix — spreads the low bits
  h = Math.imul(h, 0x85ebca6b);     // further before reducing mod 100
  h ^= h >>> 13;
  return h >>> 0;                   // unsigned 32-bit
}

export const STAGES = [
  { id: 'off',       pct: 0,   label: 'Off — kill switch',                  shadow: false },
  { id: 'shadow',    pct: 0,   label: 'Shadow — computed + logged, changes nothing', shadow: true },
  { id: 'canary',    pct: 1,   label: 'Canary — 1%',                        shadow: false },
  { id: 'expanding', pct: 10,  label: 'Expanding — 10%',                    shadow: false },
  { id: 'half',      pct: 50,  label: 'Half — 50%',                         shadow: false },
  { id: 'full',      pct: 100, label: 'Full — 100%',                        shadow: false },
];
const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s]));

/* ── The experiments ─────────────────────────────────────────────────────
   `blendWeight` is how much the new score influences final order once an
   experiment is actually LIVE (see blendRankings below) — 0 leaves the
   baseline ranking untouched, 1 replaces it outright. 0.35 was chosen the
   same way depthRank.js states its own weights: as a value judgment said out
   loud, not a number a model produced — a new, unproven signal should tilt
   the result, not override the thing already known to work (madeItRate). */
export const EXPERIMENTS = {
  depthRank: {
    id: 'depthRank',
    label: 'depthRank (lift-aware) blended into MIR ranking',
    stage: 'shadow',
    blendWeight: 0.35,
  },
  nurtureScore: {
    id: 'nurtureScore',
    label: 'nurtureScore blended into MIR ranking',
    stage: 'shadow',
    // Registered and stage-tracked so the mechanism is ready — NOT blended
    // into feedSlots.js yet. Wiring two unproven blends into one ranking
    // pass in the same change makes any shadow-log surprise ambiguous about
    // which one caused it. depthRank goes first; nurtureScore is a real,
    // deliberate follow-up, not a forgotten one.
    blendWeight: 0.35,
  },
};

export function currentStage(experimentId) {
  const exp = EXPERIMENTS[experimentId];
  return STAGE_BY_ID[exp?.stage] || STAGES[0];
}

/** Deterministic 0-99 bucket for a user × experiment. Salting by experiment
    id means the SAME user's canary membership in one experiment is
    independent of any other — verified, not assumed (see the test suite). */
export function bucketFor(userId, experimentId) {
  return hashBucketSeed(`${userId || 'anon'}::${experimentId}`) % 100;
}

/** Does this user see the LIVE, blended ranking right now? Always false for
    off/shadow — "live" specifically means "changes what's shown." */
export function isLive(userId, experimentId) {
  const stage = currentStage(experimentId);
  if (stage.pct === 0) return false;
  return bucketFor(userId, experimentId) < stage.pct;
}

/** Should the new score be COMPUTED at all (live or shadow)? Only 'off'
    skips computation entirely. */
export function isActive(experimentId) {
  return currentStage(experimentId).id !== 'off';
}

/**
 * Blend two rank-ORDERED arrays of the same items (matched by keyFn) using
 * rank-POSITION averaging rather than raw scores. Position-blending is what
 * lets this combine rankers with wholly different score scales (MIR's
 * internal magnitude vs. depthRank's few-hundred-point range) without
 * normalizing either one — a well-known, robust way to combine heterogeneous
 * rankers.
 *
 * weight=0 returns `base` completely untouched (an early return, not just a
 * no-op blend) — this is the actual safety guarantee shadow/off rest on: at
 * weight 0 there is no code path that can alter the array.
 *
 * An item present in `base` but missing from `alt` (e.g. a post type
 * depthRank had no real signal for — see feedSlots.js) keeps its `base`
 * position on the alt side, so incomplete alt coverage never quietly evicts
 * something that simply had no signal to score.
 */
export function blendRankings(base, alt, keyFn, weight) {
  if (!weight) return base;
  const basePos = new Map(base.map((item, i) => [keyFn(item), i]));
  const altPos = new Map(alt.map((item, i) => [keyFn(item), i]));
  const scored = base.map((item) => {
    const key = keyFn(item);
    const b = basePos.get(key) ?? 0;
    const a = altPos.has(key) ? altPos.get(key) : b;
    return { item, blended: b * (1 - weight) + a * weight };
  });
  scored.sort((x, y) => x.blended - y.blended);
  return scored.map((s) => s.item);
}

/* ── Shadow logging ──────────────────────────────────────────────────────
   A real, local, inspectable trail of what a shadowed (or live) experiment's
   alternate ranking actually did, capped so it can't grow unbounded. This is
   NOT a cross-user analytics dashboard — that needs a backend this app
   doesn't have, and claiming one would be exactly the kind of fabrication
   the rest of this codebase (nurture.js, feedSlots.js's own header) argues
   against. It's evidence on THIS device, same honesty scope as every other
   localStorage-based measurement already in this app (madeItRate's
   impression log, happinessEngine's win log, etc). */
const LOG_KEY = 'dig_in_rollout_shadow_log';
const LOG_CAP = 200;

export function logShadowDecision(experimentId, { postId, baselineRank, altRank }) {
  if (postId == null || baselineRank == null || altRank == null) return;
  let log = [];
  try { log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { /* ignore */ }
  log.push({ experimentId, postId, baselineRank, altRank, movedBy: Math.abs(baselineRank - altRank), at: Date.now() });
  try { localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-LOG_CAP))); } catch { /* quota */ }
}

/** Per-experiment summary: how often the alternate ranking would actually
    reorder something, and by how much on average — the real question a team
    ramps a stage on. Returns {} when nothing's been logged yet (honest empty,
    not a fabricated baseline). */
export function shadowSummary() {
  let log = [];
  try { log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return {}; }
  const out = {};
  for (const entry of log) {
    const b = out[entry.experimentId] || { decisions: 0, moved: 0, totalShift: 0 };
    b.decisions += 1;
    if (entry.movedBy > 0) { b.moved += 1; b.totalShift += entry.movedBy; }
    out[entry.experimentId] = b;
  }
  for (const id of Object.keys(out)) {
    const b = out[id];
    out[id] = {
      decisions: b.decisions,
      movedPct: Math.round((b.moved / b.decisions) * 100),
      avgShiftWhenMoved: b.moved ? Math.round((b.totalShift / b.moved) * 10) / 10 : 0,
    };
  }
  return out;
}
