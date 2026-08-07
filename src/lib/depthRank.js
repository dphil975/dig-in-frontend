/* depthRank.js — what gets lifted, when reach is no longer the reward.

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

   Pairs with madeItRate.js, which measures consequence in the physical world
   (did anyone actually cook it). MIR answers "did this matter"; this module
   answers "did anyone show up for the person who posted it." */

const RETURN_KEY = 'dig_in_author_returns';

/* ── Weights ────────────────────────────────────────────────────────────────
   A reply is worth ~12 likes. That ratio is a value judgment stated out loud
   rather than buried in a model: writing a sentence to a stranger costs
   something, and the ranking should pay for what costs something. */
export const WEIGHTS = {
  reply: 12,          // a distinct person wrote words
  replyFromNew: 18,   // ...someone who had never replied to this author before
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
