/* ════════════════════════════════════════════════════════════
   Merged module — originally two files in src/lib/:
     · rankRollout.js  (staged, reversible ranking-signal rollout)
     · reachControl.js (author-controlled reach / reshare permissions)
   ════════════════════════════════════════════════════════════ */

/* ── from rankRollout.js ───────────────────────────────────────
   rankRollout.js — staged, reversible rollout for a NEW ranking signal.

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

/* ── from reachControl.js ──────────────────────────────────────
   reachControl.js — "I want to be seen, not distributed."

   ── The history this is arguing with ────────────────────────────────────────
   Twitter had no retweet button for its first three and a half years. People
   typed "RT @someone" by hand, which meant redistribution cost effort and
   passed through a human every single time. Twitter shipped the one-click
   retweet in November 2009, and frictionless redistribution became the
   platform's core mechanic. Its virality metric followed: retweet VOLUME and
   retweet SPEED — how many, how fast. Everything people hate about that era
   comes downstream of optimizing those two numbers.

   Tumblr's primitive was the reblog, which also redistributes — but it carries
   the whole thread with it, and Tumblr never put a follower count on the front
   of your identity, so the incentive to farm reach was weaker.

   Bridging the two isn't a visual question. It's this: WHO CONTROLS
   REDISTRIBUTION — the person resharing, or the person who wrote it?
   On every major platform the answer is the resharer. Here it's the author.

   ── The primitive ──────────────────────────────────────────────────────────
   Every post carries a reach ceiling its author sets, and reshare is a REQUEST
   below the top level rather than a button. Being read and being spread are
   separated into two different permissions, which is the thing people actually
   want and no mainstream platform offers.

   ── What this honestly cannot do ───────────────────────────────────────────
   It cannot stop a screenshot. Nothing can. What it can do is refuse to build
   the highway: no reshare without consent, no external link, no search index,
   no trending eligibility, no recommendation to strangers. A determined person
   can always copy something by hand — the same way they could before 2009 —
   and that friction is the entire point.

   Pairs with: archetypeEngine.js (feed lens), madeItRate.js (consequence
   ranking), circlesApi.js (the small-group backend). */

/* ── The ladder ─────────────────────────────────────────────────────────────
   Ordered narrow → wide. `rank` lets code compare ceilings numerically.
   Copy is written to be read by a person deciding how exposed to be, so it
   says what actually happens rather than naming a privacy tier. */
export const REACH = {
  circle: {
    id: 'circle', rank: 0, label: 'Just my circle',
    blurb: 'The people you chose. Nobody else, not now, not later.',
    reshare: 'no',            // cannot be reshared at all
    searchable: false,
    trending: false,          // never counted toward what's popular
    strangers: false,         // never recommended to someone who doesn't follow you
    external: false,          // no shareable link off-app
  },
  room: {
    id: 'room', rank: 1, label: 'People who follow me',
    blurb: 'Your regulars can read it. Anyone who wants to pass it on has to ask you first.',
    reshare: 'ask',           // reshare requires author approval
    searchable: false,
    trending: false,
    strangers: false,
    external: false,
  },
  open: {
    id: 'open', rank: 2, label: 'Anyone',
    blurb: 'Fully public. It can travel, be searched, and be reshared without asking.',
    reshare: 'yes',
    searchable: true,
    trending: true,
    strangers: true,
    external: true,
  },
};

export const REACH_ORDER = ['circle', 'room', 'open'];
export const reachOf = (post) => REACH[post?.reach] || REACH.room;

/* ── Defaults lean quiet ────────────────────────────────────────────────────
   Every platform defaults to maximum distribution because distribution is
   their revenue. The default here is the middle rung, and anything the author
   flagged as personal defaults to the narrowest one. Going wider is always a
   deliberate act; nothing drifts outward on its own. */
export function defaultReachFor({ tender = false, hasCircle = false } = {}) {
  if (tender) return 'circle';
  return hasCircle ? 'room' : 'room';
}

/* ── Reshare ────────────────────────────────────────────────────────────────
   Returns 'yes' | 'ask' | 'no'. The 'ask' case is the whole invention: the
   reshare button doesn't move the post, it sends the author a request. */
export function canReshare(post, { isAuthor = false } = {}) {
  if (isAuthor) return 'yes';
  return reachOf(post).reshare;
}

const REQ_KEY = 'dig_in_reshare_requests';

function loadRequests() {
  try { const v = JSON.parse(localStorage.getItem(REQ_KEY)); return Array.isArray(v) ? v : []; }
  catch { return []; }
}
function saveRequests(list) {
  try { localStorage.setItem(REQ_KEY, JSON.stringify(list.slice(0, 200))); } catch { /* quota */ }
  return list;
}

/* Ask the author. Deliberately carries a `note` — "why do you want to pass
   this on" — because a request with a reason is answerable, and a bare
   notification is just pressure. */
export function requestReshare({ postId, authorId, requesterId, requesterName, note = '' }) {
  if (!postId || !requesterId) return null;
  const existing = loadRequests();
  if (existing.some((r) => r.postId === postId && r.requesterId === requesterId && r.state === 'pending')) {
    return { duplicate: true };
  }
  const req = {
    id: `rs-${Date.now()}`,
    postId, authorId, requesterId,
    requesterName: String(requesterName || 'someone').slice(0, 60),
    note: String(note || '').trim().slice(0, 200),
    state: 'pending',
    askedAt: Date.now(),
  };
  saveRequests([req, ...existing]);
  return req;
}

export function pendingRequestsFor(authorId) {
  return loadRequests().filter((r) => r.authorId === authorId && r.state === 'pending');
}

/* Answering is symmetric and final. There is no "maybe" and no reminder nag —
   an unanswered request simply stays unanswered, which is itself an answer and
   costs the author nothing to give. */
export function answerReshare(requestId, allow) {
  const list = loadRequests().map((r) => (
    r.id === requestId ? { ...r, state: allow ? 'allowed' : 'declined', answeredAt: Date.now() } : r
  ));
  saveRequests(list);
  return list.find((r) => r.id === requestId) || null;
}

export function reshareAllowed(postId, requesterId) {
  return loadRequests().some(
    (r) => r.postId === postId && r.requesterId === requesterId && r.state === 'allowed',
  );
}

/* ── Distribution gates ─────────────────────────────────────────────────────
   One place every surface asks "am I allowed to spread this?" so a new feature
   can't accidentally leak a circle post into search six months from now. */
export function isSearchable(post)   { return reachOf(post).searchable; }
export function isTrendable(post)    { return reachOf(post).trending && !post?.tender; }
export function canShowToStrangers(post) { return reachOf(post).strangers; }
export function hasExternalLink(post) { return reachOf(post).external; }

/* Filter any candidate list down to what this viewer is actually permitted to
   see. Fails CLOSED — an unknown relationship sees nothing rather than
   everything, which is the opposite of how most feed code is written. */
export function visibleTo(posts = [], viewer = {}) {
  const { id = null, follows = new Set(), circles = new Set() } = viewer;
  return posts.filter((p) => {
    if (!p) return false;
    if (p.authorId && p.authorId === id) return true;         // always see your own
    const r = reachOf(p);
    if (r.id === 'open') return true;
    if (r.id === 'room') return p.authorId ? follows.has(p.authorId) : false;
    if (r.id === 'circle') {
      const cs = Array.isArray(p.circleIds) ? p.circleIds : (p.circleId ? [p.circleId] : []);
      return cs.some((c) => circles.has(c));
    }
    return false;
  });
}

/* ── Tender posts ───────────────────────────────────────────────────────────
   The hard design problem underneath "reward vulnerability": if reach is the
   reward for disclosure, you have built a machine that pays people to expose
   themselves, and it ratchets — each week has to be rawer than the last to
   earn the same distribution. That is the trauma-farming economy, and it hurts
   the people who use it most.

   The fix is to separate the two things that got fused. A tender post should
   not be BURIED under polished content — but its reward should be CARE, not
   REACH. So marking a post tender:
     • lowers its ceiling instead of raising it (it does not go viral)
     • removes it from trending and from stranger recommendation entirely
     • lifts it inside the circle that already knows you, where a response
       means something
     • asks for replies rather than likes, because a heart is not an answer

   Depth, not distribution. */
export function markTender(post) {
  return {
    ...post,
    tender: true,
    reach: REACH_ORDER[Math.min(
      REACH[post?.reach || 'room'].rank,
      REACH.circle.rank,
    )] || 'circle',
  };
}

/* Ranking weight for a post inside a circle feed. Tender posts get lifted
   here — and ONLY here, where the audience is people who know the author. */
export function circleWeight(post, { repliesByOthers = 0 } = {}) {
  let w = 1;
  if (post?.tender) w += 1.5;                        // don't let it sink under polish
  if (post?.tender && repliesByOthers === 0) w += 1; // unanswered tender post goes first
  return w;
}

/* The prompt shown under a tender post. Nudges toward a sentence instead of a
   reaction — the difference between being acknowledged and being answered. */
export function responsePromptFor(post) {
  if (!post?.tender) return null;
  return {
    hint: 'She asked for people, not applause.',
    action: 'Say something back',
    discourage: 'like',   // the UI hides the like button on tender posts
  };
}

/* ── Copy for the composer ──────────────────────────────────────────────────
   Written to make the quiet option feel like the confident one. Most products
   phrase privacy as something you lose; here going narrow is the default and
   the language treats it as a choice with dignity. */
export const REACH_PICKER_COPY = {
  title: 'Who is this for?',
  sub: 'You can be read without being passed around. These are different things and you get to pick both.',
  tenderLabel: 'This one is tender',
  tenderHelp: 'Keeps it to your circle, hides the like button so people reply instead, and keeps it out of anything that trends.',
  askNote: 'Someone asking to share your post has to say why. You can ignore it and nothing happens.',
};
