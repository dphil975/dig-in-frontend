/* archetypeEngine.js — the 12 cooking archetypes, and the mixer that keeps a
   feed from collapsing into one note.

   ── What this is ────────────────────────────────────────────────────────────
   Every recommender eventually learns "this person likes X" and then serves X
   until X is all they see. docs/product/DIG_IN_ALGORITHM.md Part 1 calls this correctly: an
   engagement-ranked feed converges, and the fixed point is a monoculture. This
   module is the counter-pressure. It reads how someone actually cooks, names
   the pattern, and then deliberately spends 40% of the feed on the OPPOSITE of
   that pattern.

   ── What this is NOT ────────────────────────────────────────────────────────
   It is not a psychological assessment. It does not infer trauma, diagnosis,
   attachment style, or a "core wound," and it must never be extended to. Those
   are (a) not inferable from recipe clicks — you'd get confident, wrong labels
   — and (b) sensitive-category personal data the moment you store them, which
   would land squarely in the middle of the B2B data product's diligence. The
   archetype names are borrowed from narrative tradition because they're
   evocative and memorable; what they actually describe is a COOKING
   DISPOSITION, scored only from things the user did inside this app.

   This follows the same rule feedContext.js already set for life mode and
   religion: we act on what a person DID or DECLARED, never on what we think
   their childhood was.

   ── Three commitments this file keeps ───────────────────────────────────────
   1. LEGIBLE — every score traces to specific actions. explainProfile()
      returns them in plain English. No black box.
   2. CORRECTABLE — the user can pin an archetype or mute one and the mixer
      obeys immediately. Their word beats our inference, always.
   3. NON-CAPTURING — the mixer's job is to widen, not narrow. Variety is
      LABELED ("a wildcard, because you've had five sweet things in a row"),
      not smuggled in. A feed that hides its own shape from you is the thing
      we're competing against.

   Pairs with: feedContext.js (the context lens), buildFeed.js (slot builder),
   madeItRate.js (consequence ranking). This is a lens over slots — never an
   eleventh slot, and never a global score that sorts everything. */

/* ── The 12 ─────────────────────────────────────────────────────────────────
   `aligned`  — content tags that match how they already cook
   `counter`  — the deliberate opposite, 40% of the feed, the anti-rut
   `signals`  — observable in-app actions that count as evidence, and weight
   `reads`    — the plain-English sentence shown to the USER about themselves.
                Written to be recognizable and kind. Nobody gets told they're
                manipulative, avoidant, or broken by a recipe app. */
export const ARCHETYPES = [
  {
    id: 'innocent', name: 'The Innocent', emoji: '🍞',
    reads: 'You cook what you know, and you cook it well.',
    strength: 'You have a repertoire. Most people never build one.',
    aligned: ['easy','onepan','nocook','fewingredients','30min','cozy','comfort','savory'],
    counter: ['getoutofyourarea','hard','spicy','slow'],
    counterWhy: 'One genuinely new thing, chosen to be easy enough to survive.',
    signals: { repeatCook: 3, easyDifficulty: 2, lowCuisineVariety: 3, comfortTag: 2 },
  },
  {
    id: 'orphan', name: 'The Orphan', emoji: '🥣',
    reads: 'You cook lean, and you cook for one.',
    strength: 'You can make something good out of almost nothing. That is a real skill.',
    aligned: ['under5','cookingforone','fridgeraid','useitup','feedingthevoid','nokitchen','under10'],
    counter: ['thetable','brokebutfancy','getoutofyourarea','rich'],
    counterWhy: 'Something made with other people — because eating alone is a habit, not a sentence.',
    signals: { budgetFilter: 3, lowSpend: 2, soloServing: 2, noCircle: 2 },
  },
  {
    id: 'hero', name: 'The Hero', emoji: '🔥',
    reads: 'You pick the hard one on purpose.',
    strength: 'You finish things other people talk themselves out of.',
    aligned: ['hard','slow','kitchenwasagainstme','firsttry','rich','spicy'],
    counter: ['15min','nocook','onepan','easy','fewingredients','light'],
    counterWhy: 'Something that asks nothing of you. Rest is not a lesser mode.',
    signals: { hardDifficulty: 3, longCookTime: 2, leaderboardView: 2, challengeDone: 3 },
  },
  {
    id: 'caregiver', name: 'The Caregiver', emoji: '🍲',
    reads: 'You cook for everyone but yourself.',
    strength: 'You are the reason people have somewhere to go.',
    aligned: ['thetable','slow','onepan','30min','savory','rich'],
    counter: ['cookingforone','girldinner','under5','feedingthevoid','light'],
    counterWhy: 'A plate with one serving on it. You are allowed to be the guest.',
    signals: { largeServings: 3, hostingFeature: 3, circlePost: 2, mealPlanOthers: 2 },
  },
  {
    id: 'explorer', name: 'The Explorer', emoji: '🧭',
    reads: 'You almost never make the same thing twice.',
    strength: 'Your range is genuinely wide. Most cooks orbit six dishes.',
    aligned: ['getoutofyourarea','latenightcooking','firsttry','spicy'],
    counter: ['onepan','fewingredients','30min','useitup','savory'],
    counterWhy: 'A dish worth making a second time. Depth is its own kind of travel.',
    signals: { highCuisineVariety: 3, lowRepeatRate: 3, newCountry: 2 },
  },
  {
    id: 'rebel', name: 'The Rebel', emoji: '🥄',
    reads: 'You never met a recipe you followed exactly.',
    strength: 'You cook by instinct. Recipes are a suggestion and you know it.',
    aligned: ['swaps','fridgeraid','useitup','itsfinediateit','nokitchen','under10'],
    counter: ['firsttry','slow','thetable','rich'],
    counterWhy: 'One made exactly as written — so you know what you are changing.',
    signals: { substitutionUse: 3, remixUse: 3, alteredFlag: 2 },
  },
  {
    id: 'lover', name: 'The Lover', emoji: '🌹',
    reads: 'You cook for the pleasure of it, and it should look beautiful.',
    strength: 'You understand that how it looks is part of how it tastes.',
    aligned: ['nofilter','girldinner','slow','brokebutfancy','sweet','rich'],
    counter: ['useitup','under5','fridgeraid','15min','savory'],
    counterWhy: 'Something plain that takes care of you on an ordinary Tuesday.',
    signals: { dateNightOccasion: 3, photoPost: 2, aestheticTag: 2, dessertBias: 2 },
  },
  {
    id: 'creator', name: 'The Creator', emoji: '🧪',
    reads: 'You start ambitious projects.',
    strength: 'You attempt things most people only read about.',
    aligned: ['slow','hard','firsttry','kitchenwasagainstme','rich'],
    counter: ['fewingredients','15min','nocook','easy','light'],
    counterWhy: 'Something you will actually finish tonight. Finished beats perfect.',
    signals: { complexStart: 3, abandonRate: 3, multiDayRecipe: 2 },
  },
  {
    id: 'jester', name: 'The Jester', emoji: '🃏',
    reads: 'You are here for a good time, not a correct time.',
    strength: 'You make cooking fun, which is the only reason anyone keeps doing it.',
    aligned: ['itriedmybest','itsfinediateit','hesaiditwasfine','kitchenwasagainstme','feedingthevoid','latenightcooking','spicy'],
    counter: ['slow','thetable','firsttry','light'],
    counterWhy: 'Something slow and quiet. Not everything has to be a bit.',
    signals: { chaosNight: 3, fusionBuilder: 2, funnyTag: 2 },
  },
  {
    id: 'sage', name: 'The Sage', emoji: '📖',
    reads: 'You want to know why it works before you make it.',
    strength: 'You actually understand what you are doing. That compounds.',
    aligned: ['firsttry','slow','hard','getoutofyourarea','light'],
    counter: ['itsfinediateit','fridgeraid','nocook','itriedmybest','sweet'],
    counterWhy: 'Something with no method at all. Cook it by taste and see.',
    signals: { educationPage: 3, scienceContent: 3, longRead: 2 },
  },
  {
    id: 'magician', name: 'The Magician', emoji: '🎩',
    reads: 'You want the version the restaurant is not telling you about.',
    strength: 'You reverse-engineer things. That is a rare and useful instinct.',
    aligned: ['brokebutfancy','swaps','nofilter','30min','copycat','rich'],
    counter: ['fewingredients','thetable','useitup','light'],
    counterWhy: 'Something worth teaching someone else. Knowledge kept is knowledge lost.',
    signals: { copycatUse: 3, drinkScan: 2, secretTag: 2 },
  },
  {
    id: 'ruler', name: 'The Ruler', emoji: '⏱️',
    reads: 'You run a tight kitchen and the timing is not a suggestion.',
    strength: 'Your food comes out right because you refuse to wing it.',
    aligned: ['30min','15min','onepan','firsttry','fewingredients','light'],
    counter: ['fridgeraid','useitup','itsfinediateit','kitchenwasagainstme','spicy'],
    counterWhy: 'Something that cannot be ruined. Let one dinner be approximate.',
    signals: { timerUse: 3, checklistUse: 2, mealPlanAdherence: 3 },
  },
];

export const ARCHETYPE_BY_ID = Object.fromEntries(ARCHETYPES.map((a) => [a.id, a]));

/* ── The mix ────────────────────────────────────────────────────────────────
   40 aligned / 40 counterweight / 20 wildcard. This is a QUOTA, in the same
   spirit as the slot system in docs/product/DIG_IN_ALGORITHM.md Part 3: content competes
   inside its band and never across, so no single disposition can take the
   whole feed even if every engagement signal says it should. */
export const MIX = { aligned: 0.4, counter: 0.4, wildcard: 0.2 };

/* Anti-spiral. A negative reaction is information, not an invitation to push
   harder. Nothing here escalates: every response either calms the feed or
   changes the subject. */
export const REACTIONS = {
  downvote:  { next: 'neutral',  count: 3, note: 'Three calm dishes — nothing pointed.' },
  hide:      { next: 'neutral',  count: 3, note: 'Three calm dishes — nothing pointed.' },
  negative:  { next: 'counter',  count: 1, note: 'One deliberate change of direction.' },
  skip:      { next: 'wildcard', count: 1, note: 'Something unrelated.' },
  bounce:    { next: 'aligned',  count: 2, note: 'Back to familiar ground.' },
};

const STORE_KEY = 'dig_in_archetype';
const HALF_LIFE_DAYS = 45;   // evidence fades; people change and the model must too
const MIN_EVIDENCE = 8;      // below this we make no claim at all
const SMOOTHING = 0.6;       // Laplace prior — keeps thin evidence from reading as certainty

/* ── Store ─────────────────────────────────────────────────────────────────── */
function emptyProfile() {
  return {
    scores: {},        // archetypeId -> weighted evidence
    events: [],        // recent evidence, for explainProfile()
    pinned: null,      // user override — beats inference
    muted: [],         // archetypes the user rejected
    streak: null,      // { band, remaining, note } — the anti-spiral state
    seen: [],          // recent tags, for rut detection
    updatedAt: Date.now(),
  };
}

export function loadProfile() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY));
    return raw && typeof raw === 'object' ? { ...emptyProfile(), ...raw } : emptyProfile();
  } catch { return emptyProfile(); }
}

export function saveProfile(p) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ ...p, updatedAt: Date.now() })); } catch { /* ignore */ }
  return p;
}

export function resetProfile() { return saveProfile(emptyProfile()); }

/* Exponential decay so a phase you went through in March stops defining you
   in June. Mirrors the "modes expire and ask to be renewed" rule in
   feedContext.js — no one should be stuck in a label they've outgrown. */
function decayed(score, updatedAt) {
  const days = (Date.now() - (updatedAt || Date.now())) / 86400000;
  return score * Math.pow(0.5, days / HALF_LIFE_DAYS);
}

/* ── Ingest ─────────────────────────────────────────────────────────────────
   Call with things the user DID: recordSignal('hardDifficulty'),
   recordSignal('substitutionUse'). Anything not in an archetype's `signals`
   map is ignored, so no free-text or inferred category can leak in. */
export function recordSignal(signal, weight = 1, profile = loadProfile()) {
  const p = { ...profile, scores: { ...profile.scores }, events: [...profile.events] };
  let matched = false;

  for (const a of ARCHETYPES) {
    const w = a.signals[signal];
    if (!w) continue;
    matched = true;
    p.scores[a.id] = decayed(p.scores[a.id] || 0, p.updatedAt) + w * weight;
  }
  if (!matched) return profile;

  p.events.unshift({ signal, at: Date.now() });
  p.events = p.events.slice(0, 60);
  return saveProfile(p);
}

/* ── The main ingest point ──────────────────────────────────────────────────
   A finished cook is the richest, most honest signal this app has: it's a
   record of consequence, not attention (docs/product/DIG_IN_ALGORITHM.md Part 2). One call
   from saveService.markCooked() derives everything observable from the dish
   plus the user's own history — difficulty chosen, who they cooked for,
   whether they returned to something or reached for something new.

   Everything here is a fact about a dish that was actually made. Nothing is
   inferred about the person beyond how they cook. */
export function recordCook(recipe, history = []) {
  if (!recipe) return loadProfile();
  let p = loadProfile();
  const push = (sig, w = 1) => { p = recordSignal(sig, w, p); };

  const difficulty = String(recipe.difficulty || '').toLowerCase();
  if (/easy|beginner|simple/.test(difficulty)) push('easyDifficulty');
  if (/hard|advanced|difficult/.test(difficulty)) push('hardDifficulty');

  const mins = Number(recipe.totalTime || recipe.total_time || recipe.time) || 0;
  if (mins >= 60) push('longCookTime');
  if (mins >= 150) push('multiDayRecipe');

  const servings = Number(recipe.servings) || 0;
  if (servings > 0 && servings <= 2) push('soloServing');
  if (servings >= 6) push('largeServings');

  const name = String(recipe.name || '').toLowerCase();
  const cuisine = String(recipe.cuisine || recipe.country || '').toLowerCase();

  // Repeat vs. reach — measured against their own history, not a population.
  const cooked = history.map((h) => String(h.name || '').toLowerCase());
  if (name && cooked.includes(name)) push('repeatCook');

  const cuisines = new Set(history.map((h) => String(h.cuisine || '').toLowerCase()).filter(Boolean));
  if (cuisine && !cuisines.has(cuisine) && history.length >= 3) push('newCountry');
  if (history.length >= 8) {
    // Breadth relative to how much they've cooked: many cuisines across few
    // cooks is range; few cuisines across many cooks is a repertoire.
    const ratio = cuisines.size / history.length;
    if (ratio >= 0.55) push('highCuisineVariety');
    if (ratio <= 0.25) push('lowCuisineVariety');
  }

  return p;
}

/* A reaction to a specific item. Sets the anti-spiral streak — the ONLY
   thing in this module that can override the standing 40/40/20 mix. */
export function recordReaction(kind, profile = loadProfile()) {
  const rule = REACTIONS[kind];
  if (!rule) return profile;
  return saveProfile({ ...profile, streak: { band: rule.next, remaining: rule.count, note: rule.note } });
}

/* ── Read ───────────────────────────────────────────────────────────────────
   Returns the full distribution, not a single label. People are mixtures, and
   a mixture is both more accurate and much harder to misuse than a verdict. */
export function readProfile(profile = loadProfile()) {
  const scores = {};
  let total = 0;
  for (const a of ARCHETYPES) {
    if (profile.muted.includes(a.id)) continue;
    const v = Math.max(0, decayed(profile.scores[a.id] || 0, profile.updatedAt));
    scores[a.id] = v;
    total += v;
  }

  const confident = total >= MIN_EVIDENCE;
  // Additive (Laplace) smoothing. Without it, a user who has only ever done
  // Hero-ish things reads as "100% The Hero" off four clicks — a confident
  // label that the evidence doesn't earn. The prior keeps the distribution
  // honestly diffuse when evidence is thin and lets it sharpen as it grows,
  // so the number on screen tracks how much we actually know.
  const n = Object.keys(scores).length || 1;
  const denom = total + SMOOTHING * n;
  const ranked = Object.entries(scores)
    .sort((x, y) => y[1] - x[1])
    .map(([id, v]) => ({ id, weight: (v + SMOOTHING) / denom, ...ARCHETYPE_BY_ID[id] }));

  const primary = profile.pinned
    ? { ...ARCHETYPE_BY_ID[profile.pinned], weight: 1, pinned: true }
    : (confident ? ranked[0] : null);

  return {
    primary,
    secondary: confident && !profile.pinned ? ranked[1] : null,
    ranked,
    total,
    confident,
    // Honest about not knowing yet — a new user is not "The Innocent by
    // default", they're simply unread.
    status: profile.pinned ? 'declared' : confident ? 'observed' : 'listening',
  };
}

/* Plain-English evidence. This is what makes the whole thing legible: the user
   can open it, see exactly which of their own actions produced the read, and
   disagree. */
export function explainProfile(profile = loadProfile()) {
  const read = readProfile(profile);
  if (!read.confident && !profile.pinned) {
    return {
      headline: 'Still listening.',
      body: `We don't have enough to say yet — that's on purpose. Cook a few more things and this fills in. (${Math.round(read.total)} of ${MIN_EVIDENCE} signals.)`,
      evidence: [],
    };
  }
  const counts = {};
  for (const e of profile.events) counts[e.signal] = (counts[e.signal] || 0) + 1;
  const evidence = Object.entries(counts)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([signal, n]) => ({ signal, n, label: SIGNAL_LABELS[signal] || signal }));

  return {
    headline: profile.pinned
      ? `You told us: ${read.primary.name}.`
      : `${read.primary.emoji} ${read.primary.name} — ${read.primary.reads}`,
    body: read.primary.strength,
    evidence,
    counterWhy: read.primary.counterWhy,
  };
}

const SIGNAL_LABELS = {
  repeatCook: 'cooked the same dish again',
  easyDifficulty: 'chose an easy recipe',
  hardDifficulty: 'chose a hard recipe',
  lowCuisineVariety: 'stayed in familiar cuisines',
  highCuisineVariety: 'cooked across many cuisines',
  budgetFilter: 'set a spending limit',
  lowSpend: 'picked a low-cost dish',
  soloServing: 'cooked for one',
  largeServings: 'cooked for a crowd',
  hostingFeature: 'used the hosting tools',
  circlePost: 'posted to a circle',
  substitutionUse: 'swapped an ingredient',
  remixUse: 'remixed a recipe',
  alteredFlag: 'marked a dish as altered',
  longCookTime: 'picked a long cook',
  challengeDone: 'finished a challenge',
  complexStart: 'started something complex',
  abandonRate: 'left a recipe unfinished',
  timerUse: 'used a timer',
  checklistUse: 'used a checklist',
  educationPage: 'read the technique notes',
  scienceContent: 'opened the cooking science',
  copycatUse: 'used a restaurant copycat',
  chaosNight: 'played Chaos Night',
  dateNightOccasion: 'planned a date night',
  photoPost: 'posted a photo of a dish',
  newCountry: 'cooked from a new country',
};

/* ── Mix ────────────────────────────────────────────────────────────────────
   Sort candidates into three bands and interleave to the quota. Every returned
   item carries `_band` and `_why` so the UI can SAY why it's there. A feed that
   can't explain itself is the thing we're replacing. */
function tagsOf(item) {
  const raw = item?.tags || item?._tags || [];
  const list = Array.isArray(raw) ? raw : [];
  const extra = [item?.difficulty, item?.mealBucket, item?.country, item?.cuisine];
  return [...list, ...extra].filter(Boolean).map((t) => String(t).toLowerCase());
}

function overlaps(item, vocabulary) {
  const t = tagsOf(item);
  return vocabulary.some((v) => t.some((x) => x.includes(v)));
}

export function mixFeed(candidates = [], opts = {}) {
  const profile = opts.profile || loadProfile();
  const size = opts.size || 10;
  const read = readProfile(profile);

  // No confident read yet → don't pretend. Serve variety and say so.
  if (!read.primary) {
    return candidates.slice(0, size).map((item) => ({
      ...item, _band: 'wildcard', _why: 'Getting to know you — this is a spread, not a guess.',
    }));
  }

  const a = read.primary;
  const aligned = [], counter = [], wildcard = [];
  for (const item of candidates) {
    if (overlaps(item, a.aligned)) aligned.push(item);
    else if (overlaps(item, a.counter)) counter.push(item);
    else wildcard.push(item);
  }

  // Anti-spiral overrides the standing mix, briefly.
  const streak = profile.streak;
  if (streak && streak.remaining > 0) {
    const pool = streak.band === 'counter' ? counter
      : streak.band === 'aligned' ? aligned
        : wildcard;                                  // 'neutral' and 'wildcard' both mean "change the subject"
    const chosen = pool.slice(0, Math.min(streak.remaining, size));
    // If nothing in the pool can satisfy the calming band, don't recurse on an
    // unchanged candidate list — that spun forever. Drop the streak and fall
    // through to the normal mix instead.
    if (chosen.length === 0) {
      saveProfile({ ...profile, streak: null });
    } else {
      const take = chosen.map((item) => ({ ...item, _band: streak.band, _why: streak.note }));
      const nextProfile = saveProfile({
        ...profile,
        streak: streak.remaining - take.length > 0
          ? { ...streak, remaining: streak.remaining - take.length }
          : null,
      });
      const remainingSize = size - take.length;
      if (remainingSize <= 0) return take;
      const taken = new Set(chosen);
      const rest = mixFeed(candidates.filter((c) => !taken.has(c)), {
        ...opts, size: remainingSize, profile: nextProfile,
      });
      return [...take, ...rest];
    }
  }

  const want = {
    aligned: Math.round(size * MIX.aligned),
    counter: Math.round(size * MIX.counter),
    wildcard: size - Math.round(size * MIX.aligned) - Math.round(size * MIX.counter),
  };

  const out = [
    ...aligned.slice(0, want.aligned).map((i) => ({ ...i, _band: 'aligned', _why: `Because you cook like ${a.name}.` })),
    ...counter.slice(0, want.counter).map((i) => ({ ...i, _band: 'counter', _why: a.counterWhy })),
    ...wildcard.slice(0, want.wildcard).map((i) => ({ ...i, _band: 'wildcard', _why: 'A wildcard — deliberately unrelated, so the feed keeps surprising you.' })),
  ];

  // Interleave rather than serving three blocks, so the counterweight is
  // encountered as part of the meal instead of as a lecture at the end.
  const woven = [];
  const lanes = [
    out.filter((i) => i._band === 'aligned'),
    out.filter((i) => i._band === 'counter'),
    out.filter((i) => i._band === 'wildcard'),
  ];
  for (let i = 0; woven.length < out.length; i++) {
    for (const lane of lanes) if (lane[i]) woven.push(lane[i]);
    if (i > size) break;
  }
  return woven.slice(0, size);
}

/* ── The lens ───────────────────────────────────────────────────────────────
   The integration point for an already-allocated feed (feedSlots.allocateSlots
   has run, quotas are satisfied, MIR has ranked inside each slot).

   This is deliberately NOT mixFeed. mixFeed selects to a quota, which would
   undo the slot allocator's fairness guarantee — the thing docs/product/DIG_IN_ALGORITHM.md
   Part 3 says protects the feed from becoming a monoculture. A lens must not
   overrule a slot.

   So lensFeed drops nothing. It labels every post with its band and reorders
   so the visible run alternates instead of stacking five aligned posts before
   the first counterweight. The 40/40/20 shape shows up in what you encounter
   first; every post the allocator dealt is still in the column.

   Posts the archetype has no opinion about keep their place and stay unlabeled
   — an honest "no comment" rather than a manufactured reason. */
export function lensFeed(posts = [], opts = {}) {
  const profile = opts.profile || loadProfile();
  const read = readProfile(profile);
  if (!read.primary || posts.length < 4) return posts;

  const a = read.primary;
  // Structural posts (the meal-time lead, the end card, whimsy) are furniture,
  // not content — they must not be reordered or labeled.
  const isFurniture = (p) => ['mealTime', 'end', 'whimsy', 'onboard'].includes(p?.type);

  const lanes = { aligned: [], counter: [], wildcard: [] };
  const order = [];
  posts.forEach((p, i) => {
    if (isFurniture(p)) { order.push({ fixed: i }); return; }
    const band = overlaps(p, a.aligned) ? 'aligned'
      : overlaps(p, a.counter) ? 'counter'
        : 'wildcard';
    lanes[band].push({
      ...p,
      _band: band,
      _why: band === 'aligned' ? `Because you cook like ${a.name}.`
        : band === 'counter' ? a.counterWhy
          : null,   // no invented reason for a post we simply had no read on
    });
    order.push({ lane: true });
  });

  // Anti-spiral: a calming band leads for the next few posts.
  const streak = profile.streak;
  let head = [];
  if (streak && streak.remaining > 0) {
    const pool = streak.band === 'counter' ? lanes.counter
      : streak.band === 'aligned' ? lanes.aligned
        : lanes.wildcard;
    head = pool.splice(0, Math.min(streak.remaining, pool.length))
      .map((p) => ({ ...p, _band: streak.band, _why: streak.note }));
    saveProfile({
      ...profile,
      streak: streak.remaining - head.length > 0
        ? { ...streak, remaining: streak.remaining - head.length }
        : null,
    });
  }

  // Weave the three lanes in the 40/40/20 rhythm: two aligned, two counter,
  // one wildcard, repeat — so the counterweight arrives early and often
  // without ever becoming a block of vegetables at the end.
  const pattern = ['aligned', 'aligned', 'counter', 'counter', 'wildcard'];
  const woven = [];
  let guard = 0;
  while ((lanes.aligned.length || lanes.counter.length || lanes.wildcard.length) && guard < 10000) {
    const band = pattern[woven.length % pattern.length];
    const take = lanes[band].length ? lanes[band]
      : lanes.aligned.length ? lanes.aligned
        : lanes.counter.length ? lanes.counter : lanes.wildcard;
    woven.push(take.shift());
    guard++;
  }

  // Re-lay the column, leaving furniture exactly where the builder put it.
  const queue = [...head, ...woven];
  return order.map((slot, i) => (slot.fixed !== undefined ? posts[slot.fixed] : queue.shift()))
    .filter(Boolean);
}

/* Rut detection — the honest version of "keep it unpredictable". If the last
   several items all rhyme, say so out loud and hand over a wildcard. The user
   is told this is happening; that's the whole difference between widening
   someone's world and managing them. */
export function noticeRut(tags = [], profile = loadProfile()) {
  const seen = [...tags.map((t) => String(t).toLowerCase()), ...profile.seen].slice(0, 12);
  saveProfile({ ...profile, seen });
  if (seen.length < 6) return null;
  const counts = {};
  for (const t of seen.slice(0, 6)) counts[t] = (counts[t] || 0) + 1;
  const [tag, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
  if (n >= 5) return { tag, message: `That's five ${tag} things in a row. Here's something else.` };
  return null;
}

/* ── User control — always wins ─────────────────────────────────────────── */
export function pinArchetype(id, profile = loadProfile()) {
  return saveProfile({ ...profile, pinned: ARCHETYPE_BY_ID[id] ? id : null });
}
export function muteArchetype(id, profile = loadProfile()) {
  const muted = profile.muted.includes(id) ? profile.muted : [...profile.muted, id];
  return saveProfile({ ...profile, muted, pinned: profile.pinned === id ? null : profile.pinned });
}
export function unmuteArchetype(id, profile = loadProfile()) {
  return saveProfile({ ...profile, muted: profile.muted.filter((m) => m !== id) });
}
