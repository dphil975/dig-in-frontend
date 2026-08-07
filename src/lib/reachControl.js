/* reachControl.js — "I want to be seen, not distributed."

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
