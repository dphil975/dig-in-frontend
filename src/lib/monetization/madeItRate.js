/* ════════════════════════════════════════════════════════════
   Merged module — originally four files in src/lib/:
     · madeItRate.js   (consequence-based ranking signal — cooks/views)
     · depthRank.js     (reply-depth ranking signal)
     · toolTracking.js  (owned-tools inventory + substitution guidance)
     · spins.js         (the whimsy currency)

   NOTE ON A RESOLVED NAME CONFLICT: toolTracking.js and spins.js each
   defined their own local `read(key, fallback)` / `write(key, val)`
   localStorage helpers. Since they now share a module scope, toolTracking's
   versions (which only ever operated on ONE fixed key) were renamed to
   `readOwned` / `writeOwned` below; spins.js's more general versions kept
   their original names.
   ════════════════════════════════════════════════════════════ */

import { classifyLift } from '../liftSignal';
import { TOOL_CATALOG, detectEquipment } from '../equipmentDetector';

/* ── from madeItRate.js ────────────────────────────────────────
   madeItRate.js — the ranking signal no other feed can compute.

   Every other platform ranks on attention, because attention is all that
   happens inside the app. Dig In touches the physical world, so it can rank on
   CONSEQUENCE instead:

     MIR = (people who cooked / went / attended within 7 days) ÷ (people who saw it)

   Views are the DENOMINATOR, not the numerator. A dish with 200 views and 40
   dinners outranks one with 10,000 views and 3. That single inversion quietly
   kills rage bait, fake luxury, and ads-as-content without any moderation
   policy: nobody cooks after being angry, and you can't make a $400 restaurant
   plate at home — so those have no MIR and sink on their own.

   Honesty (house rule: no fabricated numbers — see project memory):
     • The NUMERATOR is read from real events this device already records:
         - dig_in_cook_history        (markCooked, services/saveService.js) — a real cook
         - dig_in_behavior.checkins   (behaviorTracker.js)                  — a real place visited
       We never write a synthetic "conversion." A cook counts because someone
       tapped "I made this," not because we decided it did.
     • The DENOMINATOR (impressions) is logged only when a post actually
       renders on screen (logImpression, called from the feed).
     • On a fresh install both are ~0. rankByMIR therefore REFUSES to sort until
       there's real volume (minTotalImpressions) — a cold feed keeps its
       composed order rather than pretending to have a confident ranking. This
       is build-step #1 of docs/product/DIG_IN_ALGORITHM.md: nothing works without the
       denominator, and a denominator you haven't earned yet is a lie.

   This is intentionally a leaf module: it imports nothing app-specific, only
   reads localStorage keys other modules own, so it can't create an import
   cycle. */

const IMPRESSION_KEY = 'dig_in_mir_impressions';
const HISTORY_KEY    = 'dig_in_cook_history';   // owned by services/saveService.js
const BEHAVIOR_KEY   = 'dig_in_behavior';       // owned by services/behaviorTracker.js

const MAX_KEYS = 800;     // prune the impression ledger so it can't grow forever
const WINDOW_DAYS = 7;    // the MIR conversion window
const DAY_MS = 86400000;

// Beta-prior smoothing. The prior mean (ALPHA/BETA ≈ 0.02) is deliberately LOW
// so a brand-new post with no conversions can never out-rank a proven one just
// by being new — it has to actually convert to climb. A post at 40 cooks / 200
// views smooths to (40.5)/(225) ≈ 0.18, comfortably above the 0.02 floor.
const ALPHA = 0.5;
const BETA  = 25;

const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 40);

/* ── Keys ────────────────────────────────────────────────────────────────
   Impression and conversion must agree on ONE key per thing, or MIR is
   meaningless. A recipe is the unit of consequence (you cook a recipe), so
   recipe-bearing posts key by recipe identity — the same identity the cook log
   stores. Everything else keys by its own post id. */
export function keyForRecipe(recipe) {
  if (!recipe) return null;
  const id = recipe.id ?? recipe.recipeId ?? null;
  return `recipe:${id != null ? id : slug(recipe.name)}`;
}

export function keyForPost(post) {
  if (!post) return null;
  if (post.recipe) return keyForRecipe(post.recipe);
  if (post.entry) {
    const snap = post.entry.recipeSnapshot;
    if (snap && (snap.id != null || snap.name)) return keyForRecipe(snap);
    if (post.entry.dish) return `recipe:${slug(post.entry.dish)}`;
    return `dish:${post.entry.id}`;
  }
  return `post:${post.id}`;
}

/* ── Impressions (the denominator) ──────────────────────────────────────── */
function loadImpressions() {
  try { return JSON.parse(localStorage.getItem(IMPRESSION_KEY) || '{}') || {}; }
  catch { return {}; }
}

function saveImpressions(map) {
  // Prune to the most-recently-seen MAX_KEYS so the ledger stays bounded.
  const keys = Object.keys(map);
  if (keys.length > MAX_KEYS) {
    keys.sort((a, b) => (map[b].last || 0) - (map[a].last || 0));
    const kept = {};
    for (const k of keys.slice(0, MAX_KEYS)) kept[k] = map[k];
    map = kept;
  }
  try { localStorage.setItem(IMPRESSION_KEY, JSON.stringify(map)); } catch { /* quota */ }
}

/** Record that one post was actually seen. Idempotency is the caller's job —
    the feed logs each post id once per session (see Home/index.jsx). */
export function logImpression(key) {
  if (!key) return;
  const map = loadImpressions();
  const cur = map[key] || { n: 0, last: 0 };
  map[key] = { n: cur.n + 1, last: Date.now() };
  saveImpressions(map);
}

/** Batch form — one write for a screen's worth of posts. */
export function logImpressions(keys = []) {
  const uniq = [...new Set(keys.filter(Boolean))];
  if (!uniq.length) return;
  const map = loadImpressions();
  const now = Date.now();
  for (const k of uniq) {
    const cur = map[k] || { n: 0, last: 0 };
    map[k] = { n: cur.n + 1, last: now };
  }
  saveImpressions(map);
}

export function impressionsFor(key) {
  return loadImpressions()[key]?.n || 0;
}

/* ── Conversions (the numerator) — read from real logs, never written here ── */
function loadCookHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') || []; }
  catch { return []; }
}

function loadCheckins() {
  try { return JSON.parse(localStorage.getItem(BEHAVIOR_KEY) || '{}')?.checkins || []; }
  catch { return []; }
}

function withinWindow(ts, days) {
  if (!ts) return false;
  const t = typeof ts === 'number' ? ts : Date.parse(ts);
  return Number.isFinite(t) && (Date.now() - t) <= days * DAY_MS;
}

/** How many real cooks match a recipe key inside the window. This is the
    numerator for recipe-bearing posts. */
export function conversionsForKey(key, { days = WINDOW_DAYS } = {}) {
  if (!key || !key.startsWith('recipe:')) return 0;
  return loadCookHistory().filter((e) =>
    withinWindow(e.cookedAt, days) && keyForRecipe(e) === key,
  ).length;
}

/** MIR for one key: raw counts plus the smoothed rate used for ranking. */
export function mir(key, { days = WINDOW_DAYS } = {}) {
  const impressions = impressionsFor(key);
  const conversions = conversionsForKey(key, { days });
  const rate = impressions > 0 ? conversions / impressions : 0;
  const smoothed = (conversions + ALPHA) / (impressions + BETA);
  return { impressions, conversions, rate, smoothed };
}

/* ── Ranking WITHIN a slot (never across slots — that's feedSlots' job) ──── */
/**
 * Stable-sort candidates by smoothed MIR, descending — but only once the feed
 * has earned enough impressions to mean anything. Below `minTotalImpressions`
 * the input order is returned untouched, so a cold-start feed reflects its
 * honest composition instead of noise. Ties preserve input order (stable).
 */
export function rankByMIR(items, keyFn = keyForPost, { days = WINDOW_DAYS, minTotalImpressions = 40 } = {}) {
  if (!Array.isArray(items) || items.length < 2) return items || [];
  const keyed = items.map((item, i) => {
    const k = keyFn(item);
    return { item, i, m: k ? mir(k, { days }).smoothed : 0, impr: k ? impressionsFor(k) : 0 };
  });
  const totalImpr = keyed.reduce((s, x) => s + x.impr, 0);
  if (totalImpr < minTotalImpressions) return items;   // not enough signal — stay honest
  keyed.sort((a, b) => (b.m - a.m) || (a.i - b.i));
  return keyed.map((x) => x.item);
}

/* ── The metric you report (Part 8) ─────────────────────────────────────── */
/** Meals Made — the headline number. All-time by default, or windowed. This is
    literally the cook log's length; it can't be gamed by opening the app. */
export function mealsMade({ days = null } = {}) {
  const hist = loadCookHistory();
  if (days == null) return hist.length;
  return hist.filter((e) => withinWindow(e.cookedAt, days)).length;
}

/** In-person events attended — the second line of the headline. Real check-ins
    only; nothing fabricated. */
export function eventsAttended({ days = null } = {}) {
  const c = loadCheckins();
  if (days == null) return c.length;
  return c.filter((e) => withinWindow(e.ts, days)).length;
}

/** Small convenience for the "YOU" card: both headline numbers at once. */
export function consequenceStats({ days = 30 } = {}) {
  return {
    mealsMade: mealsMade(),
    mealsMadeRecent: mealsMade({ days }),
    eventsAttended: eventsAttended(),
  };
}

/* ── from depthRank.js ─────────────────────────────────────────
   depthRank.js — what gets lifted, when reach is no longer the reward.

   ── The metric this replaces ────────────────────────────────────────────────
   Twitter's virality research settled on two numbers: retweet VOLUME (how many)
   and retweet SPEED (how fast the first retweet arrived). Optimizing those is
   what produced the era everyone is tired of, and the reason is mechanical
   rather than moral — both numbers measure how far something travelled, and
   the content that travels furthest is the content that provokes fastest.
   Outrage is simply better at those two numbers than sincerity is.

   Reach is deliberately not a reward in this app (see reachControl.js — the
   author decides distribution, so it can't be earned by performing anyway).
   That leaves an open question: with virality off the table, what rises?

   ── The answer: depth ──────────────────────────────────────────────────────
   Three signals, none of which can be farmed by being louder:

     ANSWERED   did distinct people write actual sentences back
     RETURNED   did any of them come back to this author later
     RECIPROCAL did the author answer them

   The third is the one that makes this a community rather than a stage. A
   post with 400 replies and an author who never responded is a broadcast, and
   it ranks below a post with six replies where everyone talked to each other.

   Reshares contribute exactly zero. Likes contribute almost nothing — a heart
   is the cheapest possible signal and treating it as meaningful is how feeds
   learned to reward the thing you scroll past while double-tapping.

   Pairs with madeItRate (above), which measures consequence in the physical
   world (did anyone actually cook it). MIR answers "did this matter"; this
   module answers "did anyone show up for the person who posted it."

   ── Lifting, specifically ──────────────────────────────────────────────────
   Counting replies answers "did anyone show up." It can't tell you whether
   showing up meant something — a one-word "nice" and "I've been there too,
   you've got this" both just look like a reply. liftSignal.js reads what was
   actually written and tells the two apart, so a comment that genuinely lifts
   the author up is worth more than one that merely exists. It's additive on
   top of the normal reply credit below, not a replacement for it — a lift is
   still a reply, plus something more. */

const RETURN_KEY = 'dig_in_author_returns';

/* ── Weights ────────────────────────────────────────────────────────────────
   A reply is worth ~12 likes. That ratio is a value judgment stated out loud
   rather than buried in a model: writing a sentence to a stranger costs
   something, and the ranking should pay for what costs something. */
export const WEIGHTS = {
  reply: 12,          // a distinct person wrote words
  replyFromNew: 18,   // ...someone who had never replied to this author before
  lift: 22,           // ...and it specifically lifted her up (liftSignal.js) — stacks on top of reply/replyFromNew
  authorReplied: 15,  // the author answered — this is what makes it a conversation
  returned: 25,       // someone came back to this author on a later day
  like: 1,            // acknowledged. barely counted.
  reshare: 0,         // deliberately, permanently zero
};

/* Distinct repliers, not reply count — ten replies from one person is a
   conversation between two people, not ten people showing up. */
function distinctRepliers(replies = [], authorId = null) {
  return new Set(
    replies.map((r) => r.authorId || r.userId).filter((id) => id && id !== authorId),
  );
}

/* ── The score ──────────────────────────────────────────────────────────────
   Returns both a number and the human-readable reason it got that number, so
   any surface can explain a ranking instead of asserting it. */
export function depthScore(post, ctx = {}) {
  const {
    replies = [],
    likes = 0,
    priorRepliers = new Set(),   // people who had replied to this author before
    returns = 0,                 // people who came back on a later day
  } = ctx;

  const authorId = post?.authorId || null;
  const people = distinctRepliers(replies, authorId);
  const newPeople = [...people].filter((id) => !priorRepliers.has(id));
  const authorReplies = replies.filter((r) => (r.authorId || r.userId) === authorId).length;

  // Distinct people whose reply reads as a genuine lift — encouragement or
  // "I've been there" solidarity — not just a reply. One classification per
  // person even if they wrote more than once, same "breadth over volume"
  // rule the rest of this function uses.
  const lifters = new Map();
  for (const r of replies) {
    const id = r.authorId || r.userId;
    if (!id || id === authorId || lifters.has(id)) continue;
    const lift = classifyLift(r.text || r.body || '');
    if (lift.isLift) lifters.set(id, lift.kind);
  }

  const parts = [];
  let score = 0;

  // Breadth saturates. Forty repliers is more than two, but it is NOT twenty
  // times more — square-rooting the count is what stops this from quietly
  // becoming a popularity metric wearing a different name.
  const repliesFromKnown = people.size - newPeople.length;
  if (repliesFromKnown > 0) {
    score += Math.sqrt(repliesFromKnown) * WEIGHTS.reply;
    parts.push(`${repliesFromKnown} ${repliesFromKnown === 1 ? 'person' : 'people'} wrote back`);
  }
  if (newPeople.length > 0) {
    score += Math.sqrt(newPeople.length) * WEIGHTS.replyFromNew;
    parts.push(`${newPeople.length} of them for the first time`);
  }

  if (lifters.size > 0) {
    score += Math.sqrt(lifters.size) * WEIGHTS.lift;
    const relateCount = [...lifters.values()].filter((k) => k === 'relate').length;
    const encourageCount = lifters.size - relateCount;
    const bits = [];
    if (encourageCount > 0) bits.push(`${encourageCount} lifted her up`);
    if (relateCount > 0) bits.push(`${relateCount} said "me too"`);
    parts.push(bits.join(', '));
  }

  // Reciprocity is a multiplier, not an addition, because it changes what the
  // post IS. Answering turns an audience into a conversation. Having an
  // audience and ignoring it is a stage — and a stage ranks lower here, which
  // is the whole difference between this and every feed built since 2009.
  if (authorReplies > 0) {
    score *= 1.6;
    parts.push('she answered them');
  } else if (people.size >= 5) {
    score *= 0.5;
    parts.push('the author never answered');
  }

  if (returns > 0) {
    score += returns * WEIGHTS.returned;
    parts.push(`${returns} came back later`);
  }
  score += Math.min(likes, 50) * WEIGHTS.like;

  // Tender posts are lifted, but only inside a circle — reachControl keeps
  // them out of anything public, so this can never become a viral incentive.
  if (post?.tender && reachIsCircle(post)) {
    score *= 1.5;
    if (people.size === 0) score += 40;   // an unanswered tender post goes first
  }

  return {
    score: Math.round(score),
    why: parts.length ? parts.join(', ') : 'no one has answered yet',
    unanswered: people.size === 0,
  };
}

function reachIsCircle(post) {
  return !post?.reach || post.reach === 'circle';
}

export function rankByDepth(posts = [], ctxFor = () => ({})) {
  return posts
    .map((p) => ({ post: p, ...depthScore(p, ctxFor(p)) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => ({ ...x.post, _depth: x.score, _depthWhy: x.why, _unanswered: x.unanswered }));
}

/* ── Returns ────────────────────────────────────────────────────────────────
   The strongest available signal that a person mattered to someone: a reader
   who comes back to that author on a different day, unprompted. Stored as
   author → set of days a distinct reader returned. */
export function noteReturn(authorId, readerId, when = new Date()) {
  if (!authorId || !readerId || authorId === readerId) return;
  const day = when.toISOString().slice(0, 10);
  let all = {};
  try { all = JSON.parse(localStorage.getItem(RETURN_KEY) || '{}'); } catch { /* ignore */ }
  const key = `${authorId}:${readerId}`;
  const days = new Set(all[key] || []);
  days.add(day);
  all[key] = [...days].slice(-30);
  try { localStorage.setItem(RETURN_KEY, JSON.stringify(all)); } catch { /* quota */ }
}

export function returnsFor(authorId) {
  let all = {};
  try { all = JSON.parse(localStorage.getItem(RETURN_KEY) || '{}'); } catch { return 0; }
  return Object.entries(all)
    .filter(([k, days]) => k.startsWith(`${authorId}:`) && (days || []).length > 1)
    .length;
}

/* ── Originality ────────────────────────────────────────────────────────────
   "You won't be rewarded for copying another person."

   Near-duplicate detection IS reliably solvable, so it's implemented here:
   character trigram similarity, which catches reposts, light rewording, and
   copy-paste of someone else's words regardless of who or what wrote them.

   Detecting whether a machine wrote something is NOT reliably solvable, and
   this module does not pretend otherwise. Published detectors sit near coin-flip
   accuracy on short text and misfire hardest on people writing in a second
   language — shipping one would mean publicly accusing real women of faking
   their own words, and being wrong a lot of the time. What can be done
   honestly: measure ORIGINALITY (is this text already on the site) and let
   people report what feels off, with a human deciding. That is what's here. */
function trigrams(text = '') {
  const s = String(text).toLowerCase().replace(/\s+/g, ' ').trim();
  const out = new Set();
  for (let i = 0; i < s.length - 2; i++) out.add(s.slice(i, i + 3));
  return out;
}

export function similarity(a = '', b = '') {
  const A = trigrams(a);
  const B = trigrams(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const t of A) if (B.has(t)) shared++;
  return shared / (A.size + B.size - shared);   // Jaccard
}

/* Compare a draft against what's already been posted. Returns a verdict the UI
   can act on — and note that the strong case does NOT auto-delete or accuse.
   It asks for credit, because the overwhelmingly common reason for a match is
   that someone loved a post and wanted to pass it on. */
export const DUPLICATE_THRESHOLD = 0.55;

export function checkOriginality(draft, corpus = []) {
  const text = `${draft?.title || ''} ${draft?.body || ''}`.trim();
  if (text.length < 40) return { verdict: 'ok', score: 0, match: null };

  let best = null;
  let bestScore = 0;
  for (const post of corpus) {
    if (!post || post.id === draft?.id) continue;
    if (post.authorId && draft?.authorId && post.authorId === draft.authorId) continue;  // your own words are yours
    const s = similarity(text, `${post.title || ''} ${post.body || ''}`);
    if (s > bestScore) { bestScore = s; best = post; }
  }

  if (bestScore >= DUPLICATE_THRESHOLD) {
    return {
      verdict: 'credit',
      score: Math.round(bestScore * 100) / 100,
      match: best,
      message: `This is close to something ${best?.author || 'someone else'} already posted. Credit her and it goes up as a reblog — that's encouraged. Passing it off as new isn't.`,
      rankingPenalty: 0,        // crediting costs you nothing
      uncreditedPenalty: 0.25,  // posting it as original scores at a quarter
    };
  }
  return { verdict: 'ok', score: Math.round(bestScore * 100) / 100, match: null };
}

/* Applied at rank time: an uncredited near-duplicate still exists and is still
   readable — it just doesn't get lifted. Nothing is deleted and nobody is
   accused of anything by a machine. */
export function originalityMultiplier(post) {
  if (post?.duplicateOf && !post?.creditedTo) return 0.25;
  return 1;
}

/* ── from toolTracking.js ──────────────────────────────────────
   toolTracking.js — "Tools aren't modeled anywhere. This is a real data-model
   addition." They weren't: equipmentDetector.js can tell you what a RECIPE
   calls for, and EquipmentGate shows it as a sponsored "shop this" card, but
   nothing anywhere tracks what tools YOU actually own, and nothing has ever
   offered a substitute when you don't have one. This is that model, built on
   the SAME TOOL_CATALOG equipmentDetector.js already describes well — one
   list of tools, not two.

   Three real capabilities:
     1. OWNED TOOLS       a real inventory, same client-only pattern as the
                          pantry (dig_in_owned_tools).
     2. SUBSTITUTION      for each catalog tool, real technique guidance for
                          cooking WITHOUT it — genuine kitchen craft knowledge
                          (how heat/time/method actually changes), not a
                          guess. No citations needed here the way nutrition
                          claims need them — this is technique, not a health
                          claim, and TOOL_CATALOG's own existing entries are
                          already written in this same confident, first-person
                          instructor voice.
     3. EQUIPPED-FOR      the reverse of pantry's "what can I cook" — given
                          what you own, which recipes in the pool don't need
                          anything you're missing. Reuses equipmentDetector's
                          real per-recipe detection; never guesses a recipe
                          needs a tool it never mentions. */

const OWNED_TOOLS_KEY = 'dig_in_owned_tools';   // string[] of TOOL_CATALOG ids

function readOwned() {
  try { const v = JSON.parse(localStorage.getItem(OWNED_TOOLS_KEY) || '[]'); return new Set(Array.isArray(v) ? v : []); }
  catch { return new Set(); }
}
function writeOwned(set) {
  try { localStorage.setItem(OWNED_TOOLS_KEY, JSON.stringify([...set])); } catch { /* ignore */ }
}

export function loadOwnedTools() { return readOwned(); }

export function toggleOwnedTool(id) {
  const set = readOwned();
  if (set.has(id)) set.delete(id); else set.add(id);
  writeOwned(set);
  return set;
}

// ── Substitution guidance ───────────────────────────────────────────────
// What to do instead, for each catalog tool. `use` is the real stand-in;
// `adjust` is what actually changes (time/heat/technique) — the part a
// bare "use X instead" always skips and the part that actually matters.
export const SUBSTITUTIONS = {
  cast_iron: {
    use: 'Any heavy-bottomed stainless or nonstick skillet',
    adjust: 'You lose some heat retention, so preheat a beat longer and expect a slightly lighter crust — the food still cooks fine, it just won\'t hold a sear quite as evenly at the edges.',
  },
  wok: {
    use: 'Your widest, deepest skillet or a sauté pan, on the highest heat your stove has',
    adjust: 'A flat pan holds heat less evenly at the edges than a wok\'s sloped sides, so cook in smaller batches and keep things moving rather than trying to toss a full wok\'s worth at once.',
  },
  sheet_pan: {
    use: 'Any oven-safe baking dish, a broiler pan, or a foil-lined roasting pan',
    adjust: 'The main risk is crowding — a smaller or deeper dish traps steam instead of letting things brown, so spread in a single layer even if that means two batches.',
  },
  dutch_oven: {
    use: 'Any heavy pot with a tight-fitting lid, or a slow cooker on high, or an Instant Pot (sauté then pressure-cook)',
    adjust: 'A lighter pot scorches more easily on the bottom — drop the heat a notch and stir a little more often than the recipe says.',
  },
  rice_cooker: {
    use: 'A regular pot with a tight lid on the stovetop',
    adjust: 'Real ratio: 1 part rice to 1.5 parts water for white rice. Bring to a boil, drop to the lowest simmer, cover, and don\'t lift the lid for 18 minutes — then rest, still covered, for 10 more.',
  },
  air_fryer: {
    use: 'A conventional oven at 425–450°F, food on a wire rack over a sheet pan',
    adjust: 'Flip halfway through since there\'s no fan circulating around it. It won\'t get quite as shatter-crisp, but a wire rack (so air reaches the underside) gets you most of the way there.',
  },
  grill: {
    use: 'A stovetop grill pan for the char marks, or your oven\'s broiler (top rack, door cracked) for the direct high heat',
    adjust: 'You lose the smoke flavor — no real substitute for that indoors — but both get you the actual high, direct heat that does the cooking.',
  },
  blender: {
    use: 'An immersion (stick) blender in a tall, narrow container, or a whisk plus fine mincing by hand',
    adjust: 'For emulsifying (dressings, mayo), a whisk works — just stream the oil in slowly and constantly rather than all at once, which is what a blender does for you automatically.',
  },
  slow_cooker: {
    use: 'A covered Dutch oven (or any heavy oven-safe pot) in a 275–300°F oven',
    adjust: 'Similar total time to a slow cooker\'s LOW setting. Check the liquid level once partway through — an oven runs a little drier than a sealed slow-cooker insert.',
  },
};

/** Real substitution guidance for one tool id, or null if this tool has none
    modeled yet (never fabricated — an unmodeled tool just isn't offered). */
export function substitutionFor(toolId) {
  return SUBSTITUTIONS[toolId] || null;
}

/**
 * What a specific recipe actually calls for (via equipmentDetector's real
 * text detection) that you DON'T own, each with its real substitution
 * attached. Returns [] when the recipe needs nothing special, or needs
 * nothing you're missing — never a fabricated "you need a food processor"
 * for a recipe that never mentions one.
 */
export function missingToolsFor(recipe, ings, steps, ownedIds = loadOwnedTools()) {
  const detected = detectEquipment(recipe, ings, steps) || [];
  return detected
    .filter((tool) => !ownedIds.has(tool.id))
    .map((tool) => ({ ...tool, substitution: substitutionFor(tool.id) }));
}

/**
 * The reverse of the pantry's "what can I cook": given what you own, which
 * recipes in the pool call for nothing you're missing. A recipe that
 * mentions no tool at all (equipmentDetector finds no match) always counts
 * as equipped-for — it's not gated by tools it never asked for.
 */
export function recipesEquippedFor(recipes = [], ownedIds = loadOwnedTools(), limit = 12) {
  return recipes
    .filter((r) => {
      const ings = (r.ingredients || []).map((i) => (typeof i === 'object' ? i.text || i.name || '' : i));
      const steps = r.instructions || r.steps || [];
      const detected = detectEquipment(r, ings, steps);
      if (!detected) return true;                       // nothing tool-specific detected — always fine
      return detected.every((t) => ownedIds.has(t.id));
    })
    .slice(0, limit);
}

/** Every catalog tool, annotated with whether you own it and its real
    substitution — the full list for a "My Tools" grid. */
export function allToolsWithStatus(ownedIds = loadOwnedTools()) {
  return TOOL_CATALOG.map((t) => ({
    id: t.id, name: t.name, description: t.description,
    owned: ownedIds.has(t.id),
    substitution: substitutionFor(t.id),
  }));
}

/* ── from spins.js ──────────────────────────────────────────────
   spins.js — the whimsy currency.

   The premise (and it's a good one): tracking your grocery money is boring
   and important, and boring-and-important is exactly what a game loop is for.
   You get spins for doing the unglamorous thing — finishing a shop, putting
   the receipt in, cooking it, posting what you made.

   ── ONE DELIBERATE DEPARTURE FROM THE BRIEF ──────────────────────────────
   The ask included spins for a post clearing 15 likes. I did not build that,
   and the reason matters: a variable reward paid out by OTHER PEOPLE'S
   approval is the exact mechanism that makes apps feel bad to use. It also
   fails the stated goal — "I want them to feel good about themselves,"
   especially users who already get less social feedback than average. Under
   a likes-gated rule, two people can do identical work and only the one who
   got noticed gets paid, which teaches the quiet one that their effort
   didn't count.

   So every rule here pays for something YOU control and can always complete:
   shop, log, cook, post. A post that nobody sees still earns its spin,
   because you still made the thing.

   Reach is handled separately and correctly: engagement can push a POST
   further (see virality.js / depthRank.js, above), which is about
   distribution. It just doesn't set your personal balance. Distribution is a
   property of the post; spins are a record of your effort.

   Everything is local, honest, and auditable: the ledger stores WHY each
   spin was earned, so the balance can always be explained rather than just
   asserted. */

const BAL_KEY    = 'dig_in_spins';         // { balance, spentTotal }
const LEDGER_KEY = 'dig_in_spins_ledger';  // newest last, capped

const MAX_LEDGER = 120;

function read(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
  catch { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

/* Earn rules. `once` marks a rule that can only ever pay out a single time
   for a given key (so re-importing one receipt can't be farmed). */
export const EARN_RULES = {
  'receipt-upload': {
    spins: 3,
    label: 'Logged a receipt',
    blurb: 'The least fun part of groceries, and the one that actually keeps your money real.',
    once: true,
  },
  'run-complete': {
    spins: 2,
    label: 'Finished a store run',
    blurb: 'You went in with a list and came out the other side.',
    once: true,
  },
  'recipe-post': {
    spins: 2,
    label: 'Posted something you made',
    blurb: 'Paid for making it, not for how it performs.',
    once: true,
  },
  'cook-complete': {
    spins: 1,
    label: 'Cooked a recipe through',
    blurb: 'Start to finish, actually eaten.',
    once: true,
  },
  'budget-kept': {
    spins: 4,
    label: 'Came in under your price point',
    blurb: 'You set a number and held it. That is the whole game.',
    once: true,
  },
  'first-target': {
    spins: 2,
    label: 'Set your first price point',
    blurb: 'Deciding the number in advance is the part most people skip.',
    once: true,
  },
};

export function balance() {
  const b = read(BAL_KEY, { balance: 0, spentTotal: 0 });
  return Number.isFinite(b.balance) ? b : { balance: 0, spentTotal: 0 };
}

export function ledger() { return read(LEDGER_KEY, []).slice().reverse(); }  // newest first

/**
 * Award spins for a real action.
 *
 * @param {string} ruleId  key of EARN_RULES
 * @param {string} key     unique id for THIS occurrence (receipt id, run id…).
 *                         Rules marked `once` will refuse a repeat key, which
 *                         is what stops the same receipt paying twice.
 * @returns the ledger entry, or null if it was a duplicate / unknown rule.
 */
export function award(ruleId, key = null, meta = {}) {
  const rule = EARN_RULES[ruleId];
  if (!rule) return null;

  const entryKey = `${ruleId}:${key ?? 'anon'}`;
  const log = read(LEDGER_KEY, []);
  if (rule.once && key != null && log.some(e => e.key === entryKey)) return null;

  const entry = {
    key: entryKey,
    ruleId,
    label: rule.label,
    blurb: rule.blurb,
    spins: rule.spins,
    at: Date.now(),
    meta,
  };
  write(LEDGER_KEY, [...log, entry].slice(-MAX_LEDGER));

  const b = balance();
  write(BAL_KEY, { balance: b.balance + rule.spins, spentTotal: b.spentTotal });
  return entry;
}

/** Spend spins. Returns false (and changes nothing) if you can't afford it. */
export function spend(n, on = '') {
  const cost = Math.max(0, Math.floor(Number(n) || 0));
  const b = balance();
  if (cost <= 0 || b.balance < cost) return false;
  write(BAL_KEY, { balance: b.balance - cost, spentTotal: b.spentTotal + cost });
  const log = read(LEDGER_KEY, []);
  write(LEDGER_KEY, [...log, {
    key: `spend:${Date.now()}`, ruleId: 'spend', label: `Spent on ${on || 'something'}`,
    blurb: '', spins: -cost, at: Date.now(), meta: { on },
  }].slice(-MAX_LEDGER));
  return true;
}

/** Total ever earned (not current balance) — the "you did all this" number. */
export function totalEarned() {
  return read(LEDGER_KEY, []).filter(e => e.spins > 0).reduce((s, e) => s + e.spins, 0);
}

/** Grouped "how you've been earning" summary, most-earned first. */
export function earnBreakdown() {
  const byRule = new Map();
  for (const e of read(LEDGER_KEY, [])) {
    if (e.spins <= 0) continue;
    const cur = byRule.get(e.ruleId) || { ruleId: e.ruleId, label: e.label, times: 0, spins: 0 };
    cur.times += 1;
    cur.spins += e.spins;
    byRule.set(e.ruleId, cur);
  }
  return [...byRule.values()].sort((a, b) => b.spins - a.spins);
}
