/* ============================================================================
   Merged module: src/lib/nova/kindnessProtocol.js
   Combines the original src/lib/kindnessProtocol.js, src/lib/complaintDetector.js,
   src/lib/liftSignal.js, and src/lib/nurture.js. The old top-level files now
   re-export from here — see those files.

   Import path fix: nurture.js's `import { detect, CRISIS_RESOURCES } from
   './shadowToLight'` became `from '../shadowToLight'` since this file now
   lives one directory deeper (src/lib/nova/ instead of src/lib/). The old
   src/lib/shadowToLight.js still exists (as a re-export stub pointing at its
   own new home, src/lib/personalization/whimsyWeek.js), so this import keeps
   resolving correctly either way.
   ============================================================================ */

import { detect, CRISIS_RESOURCES } from '../shadowToLight';

/* ── From kindnessProtocol.js ────────────────────────────────────────────────

   kindnessProtocol.js — Nova's moderation ladder for the Nest.

   The real threat to the community isn't negativity — it's toxicity disguised
   as honesty. This is a four-rung ladder that always offers the door back
   before it closes one:

     name-calling      → warning + edit offered (no penalty if fixed)
     bullying          → 15-min mute (a breather, framed gently)
     repeated bullying → 24-hr ban (door stays open, appeal available)
     hate speech       → permanent (the one place Nova is immovable)

   `classify()` is a lightweight client-side check — a real deployment pairs it
   with server-side moderation. It exists so the Nest UI can demonstrate the
   protocol and so obvious attacks get caught before they land. It is NOT a
   substitute for human review on real infractions.

   Note: self-harm / crisis is NOT handled here — that routes out via
   shadowToLight.detect() to real resources. This module is about protecting
   *other* people in the room. */

// ── The rungs ───────────────────────────────────────────────────
export const RUNGS = [
  {
    id: 'name-calling', severity: 'name-calling', level: 1, cooldownMs: 0,
    action: 'warn', actionLabel: 'Warning · edit offered',
    script: "Hey — I see you're frustrated. But we don't attack people here. Can you reframe that?",
    outcome: 'Post held for edit. No penalty if you fix it. Nova assumes the good version of you.',
  },
  {
    id: 'bullying', severity: 'bullying', level: 2, cooldownMs: 15 * 60_000,
    action: 'mute', actionLabel: 'Mute · 15 min',
    script: "That wasn't kind. You're better than that. Take a break and come back when you're ready.",
    outcome: 'Temporary mute — a breather, not a punishment. It lifts itself.',
  },
  {
    id: 'repeat-bullying', severity: 'repeated bullying', level: 3, cooldownMs: 24 * 3600_000,
    action: 'ban', actionLabel: 'Ban · 24 hr',
    script: "I've given you chances. This isn't who you are. You can choose kindness, or you can choose to leave.",
    outcome: '24-hour ban. The door back stays open. Appeal available.',
  },
  {
    id: 'hate-speech', severity: 'hate speech', level: 4, cooldownMs: Infinity,
    action: 'permaban', actionLabel: 'Permanent · no cooldown',
    script: "That's not allowed here. Ever. This is your only warning.",
    outcome: 'Permanent ban. The one place Nova is immovable. It protects everyone else.',
  },
];

export const REPEAT_OFFENDER_SCRIPT =
  "I know you're capable of more than this. I've seen you be kind. I've seen you help people. That's who you really are — the anger is a mask, and you don't need it here. You're welcome back when you're ready to be the person I know you can be.";

// ── Signals (illustrative; server-side moderation is the real backstop) ──
const HATE_TERMS = ['[slur]']; // real deployments use a maintained list + ML; kept empty of actual slurs here
const NAME_CALL_TERMS = ['idiot', 'stupid', 'moron', 'loser', 'pathetic', 'dumb', 'trash', 'worthless'];
const BULLY_MARKERS = ['you people', 'shut up', 'nobody likes you', 'go away', 'you always', 'you never'];

function has(text, terms) {
  const t = text.toLowerCase();
  return terms.some(term => t.includes(term));
}

// second person + an insult ≈ directed at a person, not self-talk
const SECOND_PERSON = /\byou('?re| are)?\b/i;

/** Classify a comment against the ladder. Returns the matched rung or null.
    `priorStrikes` bumps bullying → repeat-bullying. */
export function classify(text = '', priorStrikes = 0) {
  const clean = String(text);
  if (!clean.trim()) return null;

  if (has(clean, HATE_TERMS)) return RUNGS.find(r => r.id === 'hate-speech');

  const directed = SECOND_PERSON.test(clean);
  if (has(clean, BULLY_MARKERS) || (directed && has(clean, NAME_CALL_TERMS))) {
    return priorStrikes >= 2
      ? RUNGS.find(r => r.id === 'repeat-bullying')
      : RUNGS.find(r => r.id === 'bullying');
  }
  if (has(clean, NAME_CALL_TERMS)) return RUNGS.find(r => r.id === 'name-calling');
  return null;
}

// ── Strike tracking (localStorage) ──────────────────────────────
const STRIKES_KEY = 'dig_in_nova_strikes'; // { count, mutedUntil }

function read() { try { return JSON.parse(localStorage.getItem(STRIKES_KEY) || 'null') || { count: 0, mutedUntil: 0 }; } catch { return { count: 0, mutedUntil: 0 }; } }
function write(v) { try { localStorage.setItem(STRIKES_KEY, JSON.stringify(v)); } catch { /* ignore */ } }

export function getStrikes() { return read(); }
export function isMuted(now = Date.now()) { return read().mutedUntil > now; }

/** Apply a rung's consequence: record a strike and set any cooldown. */
export function applyRung(rung, now = Date.now()) {
  const s = read();
  if (rung.action !== 'warn') s.count += 1;
  if (rung.cooldownMs && rung.cooldownMs !== Infinity) s.mutedUntil = now + rung.cooldownMs;
  if (rung.cooldownMs === Infinity) s.mutedUntil = Infinity;
  write(s);
  return s;
}

export function resetStrikes() { write({ count: 0, mutedUntil: 0 }); }

/* ── From complaintDetector.js ───────────────────────────────────────────────

   complaintDetector.js — does this message sound like frustration/venting,
   not just a plain question? A small deterministic keyword/punctuation
   heuristic, same style as novaKnowledge.js's classify() — not a model, not
   sentiment AI. Lets Ask Nova lead with empathy before the technical fix. */

const FRUSTRATED_WORDS = [
  'ruined', 'wasted', 'trash', 'garbage', 'hate', 'stupid', 'worst',
  'never works', "won't work", 'terrible', 'awful', 'furious', 'so mad',
  'sick of', 'done with', 'give up', "can't believe",
];

const MILD_WORDS = [
  'broke', 'broken', 'burnt', 'burned', 'wrong', 'messed up', 'screwed up',
  'failed', 'flopped', 'annoying', 'annoyed', 'frustrated', 'ugh', 'why won\'t',
  'why does', 'again', 'disappointed', 'upset', 'sucks',
];

/** Rough complaint intensity from message text: 'none' | 'mild' | 'frustrated'. */
export function complaintLevel(text) {
  const q = String(text || '').toLowerCase();
  if (!q.trim()) return 'none';

  let score = 0;
  for (const w of FRUSTRATED_WORDS) if (q.includes(w)) score += 2;
  for (const w of MILD_WORDS) if (q.includes(w)) score += 1;

  // Punctuation signals: repeated "!" or "?", or ALL CAPS words (3+ letters).
  if (/!{2,}/.test(text)) score += 2;
  if (/\?{2,}/.test(text)) score += 1;
  if (/\b[A-Z]{3,}\b/.test(String(text || ''))) score += 1;

  if (score >= 3) return 'frustrated';
  if (score >= 1) return 'mild';
  return 'none';
}

export function isComplaint(text) {
  return complaintLevel(text) !== 'none';
}

/* ── From liftSignal.js ──────────────────────────────────────────────────────

   liftSignal.js — the thing reply-counting alone can't see: not just that
   someone wrote back, but that they lifted the person up when they did it.

   Born from a straight ask: "depthRank.js already rewards replying and
   answering. Needs the lifting-another-woman signal specifically." The app's
   whole thesis is that community here isn't paid for or performed — it's
   built by people showing up for each other, the way the original product
   brief put it: women don't scroll past each other, they answer.

   Kept gender-neutral IN THE ACTUAL MATCHING on purpose. A text-only detector
   has no honest way to know who's on either end of a comment — the choices
   are either invent a gender field nothing else in this app has, or guess
   from a name, and guessing from a name is worse than not gating at all. So
   this recognizes the ACT — encouragement, solidarity — not who's doing it,
   which is the only version of "reward lifting each other up" that doesn't
   quietly misjudge someone. depthRank.js, which already speaks in "she" for
   its example author, keeps that voice where it already lives; the matching
   logic here just doesn't require it to fire.

   Two recognized kinds, each pointing at something the app already half-built
   and had nothing real to feed:

     ENCOURAGE   cheering someone on, directed at them, not the dish —
                 "proud of you," "you've got this," "so happy for you."
                 Feeds happinessEngine.js's Kindness Chain + Helping Hand
                 (both fully wired, zero callers before this).
     RELATE      "I've been there too" — solidarity, not praise. This is the
                 "We've Been There" reaction the original brief named and
                 nothing had built. Feeds nurture.js's resonance signal once a
                 caller can read real comment text per post.

   Same honesty posture as kindnessProtocol.js's classify(): a lightweight
   keyword/pattern net, not a sentiment model, and not a claim to be one. It
   will miss real lifts and occasionally flag a borderline one. The failure
   mode is deliberately "count a little less than you should" — never invent
   support that wasn't actually written. */

// Multi-word phrases, matched as substrings against lowercased text. Almost
// all of these already contain "you/your" — genuine encouragement is
// person-directed by nature, which is exactly what separates this from
// generic food praise ("looks delicious," "yum") that depthRank.js's plain
// reply weight already covers without needing to call it a lift.
const ENCOURAGE_PHRASES = [
  'proud of you', 'so proud', "you've got this", 'you got this',
  'you can do this', 'keep going', "you're doing great", 'you are doing great',
  "you're doing amazing", 'you are doing amazing', "you're amazing", 'you are amazing',
  "you're inspiring", 'you are inspiring', 'you inspire me', 'you inspired me',
  'so happy for you', 'happy for you', "you've come so far", 'look how far you',
  'rooting for you', 'in your corner', 'i believe in you', 'sending love',
  'sending you love', 'this made my day', 'you deserve this', 'well deserved',
  "you're so strong", 'you are so strong', 'i see you', 'so inspired by you',
  'thank you for sharing this', "you should be proud", 'i\'m proud of you',
  'you\'re killing it', 'you are killing it', 'go you', 'yes girl', 'yes queen',
  "you're glowing", 'so happy for u', 'proud of u',
];

const RELATE_PHRASES = [
  "i've been there", 'ive been there', 'been there too', "we've all been there",
  'weve all been there', 'same here', 'story of my life', 'this is so relatable',
  'i needed this', 'needed to hear this', 'needed to see this', 'felt this in my soul',
  'this is literally me', 'this is so me', "we've all struggled", 'weve all struggled',
  "you're not alone", 'you are not alone', "i'm right there with you",
  'im right there with you', 'this hit home', 'this hits home', 'i relate to this',
  'i relate so much', 'this is me too', 'same boat', 'in the same boat',
];

function hasAny(text, phrases) {
  return phrases.some((p) => text.includes(p));
}

/**
 * Read a piece of reply/comment text. Returns:
 *   { isLift: false, kind: null, why: null }
 *   { isLift: true, kind: 'encourage'|'relate', why: '<one-line reason>' }
 *
 * `kind` matters downstream — encourage feeds Kindness Chain / Helping Hand
 * (an act of support offered), relate feeds resonance (a shared experience
 * named). Checked in that order because "I've been there, you've got this"
 * — a comment can honestly be read as relate even when it also encourages;
 * relate is the harder, more specific thing to say, so it takes priority
 * when both are present rather than being swallowed by the more common one.
 */
export function classifyLift(text = '') {
  const clean = String(text || '').trim();
  if (!clean) return { isLift: false, kind: null, why: null };
  const t = clean.toLowerCase();

  if (hasAny(t, RELATE_PHRASES)) {
    return {
      isLift: true,
      kind: 'relate',
      why: 'reads as "I\'ve been there too" — solidarity, not just a compliment.',
    };
  }
  if (hasAny(t, ENCOURAGE_PHRASES)) {
    return {
      isLift: true,
      kind: 'encourage',
      why: 'reads as encouragement aimed at the person, not just the dish.',
    };
  }
  return { isLift: false, kind: null, why: null };
}

/** Does this text read as a lift at all? Convenience for callers that only
    need the boolean (e.g. a UI deciding whether to show a small confirmation). */
export function isLiftingReply(text) {
  return classifyLift(text).isLift;
}

/* ── From nurture.js ─────────────────────────────────────────────────────────

   nurture.js — the Nurture layer. The app's argument, in code: hear the problem,
   reflect it back, and only THEN — if the person actually wants it — point to
   real help that already exists inside the app. Nobody is forced toward a
   solution; the default is to be heard.

   Three jobs:
     1. CHECK-IN        "How are you?" → a warm, non-fixing response. ("I'm not
                        okay" is one tap; no performance required.)
     2. SOLUTION-AWARE  solveQuery() turns the search bar into a listener: a
        SEARCH           feeling or problem typed in ("I'm exhausted", "I can't
                        afford groceries", "I feel alone") is recognized as a
                        problem, reflected back gently, and — behind a "want a
                        few ideas?" gate — mapped to REAL in-app destinations.
                        Crisis language always surfaces real hotlines first,
                        regardless of the no-solutions preference.
     3. NURTURE SCORE   the feed's objective function, re-weighted away from
                        virality toward emotional resonance (see below).

   HONEST SCOPE: this reuses the app's real emotion classifier (shadowToLight.
   detect) and routes only to pages/modes that actually exist. The "how many
   people offered comfort" inputs to nurtureScore are wired to real reaction
   data the day a reactions backend exists; until then they're 0 and the score
   degrades to the honest signals we already have — never fabricated counts. */

// A supplementary crisis net on TOP of shadowToLight.detect — because this is
// the one classification we cannot afford to miss. Covers common phrasings of
// suicidal ideation / self-harm that a keyword list can under-catch. Erring
// toward showing real hotlines is the correct failure mode here.
const CRISIS_EXTRA = /\b(kill myself|end it all|end my life|take my (own )?life|don'?t want to (be alive|be here|live|wake up)|not want to be alive|want to die|wanna die|better off dead|no reason to live|hurt(ing)? myself|harm(ing)? myself|self ?harm|suicid)/i;

const K_CHECKIN = 'dig_in_nurture_checkin';  // [{ mood, note, at }]
const K_PREFS   = 'dig_in_nurture_prefs';    // { noSolutions }

function readJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; }
  catch { return fallback; }
}
function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

// ── 1. Check-in ─────────────────────────────────────────────────────────────
// A small emotional vocabulary. `need` paces how much holding the response does.
export const MOODS = [
  { id: 'calm',        label: 'Calm',          emoji: '🌿', need: 'low' },
  { id: 'happy',       label: 'Happy',         emoji: '😊', need: 'low' },
  { id: 'good',        label: 'Actually good', emoji: '🌤️', need: 'low' },
  { id: 'okay',        label: "I'm okay",      emoji: '🙂', need: 'low' },
  { id: 'tired',       label: 'Tired',         emoji: '🥱', need: 'medium' },
  { id: 'stressed',    label: 'Stressed',      emoji: '😮‍💨', need: 'medium' },
  { id: 'angry',       label: 'Angry',         emoji: '🔥', need: 'medium' },
  { id: 'sad',         label: 'Sad',           emoji: '🌧️', need: 'high' },
  { id: 'anxious',     label: 'Anxious',       emoji: '🫧', need: 'high' },
  { id: 'overwhelmed', label: 'Overwhelmed',   emoji: '🌊', need: 'high' },
  { id: 'lonely',      label: 'Lonely',        emoji: '🕯️', need: 'high' },
];
export const MOOD_BY_ID = Object.fromEntries(MOODS.map((m) => [m.id, m]));

// Warm, non-fixing responses. These sit WITH the feeling first — no "here's what
// to do." (Section IV / XI of the brief.) A gentle offer of a next step is
// appended only for the higher-need moods, and always as an option.
const MOOD_RESPONSE = {
  calm:  "calm is a good place to cook from. let's use it.",
  happy: "happy looks good on you. let's cook something that matches.",
  good:  'good. glad it found you today — let it be easy while it lasts.',
  okay:  "okay is a real answer. you don't have to be more than okay to belong here.",
  tired: "tired is allowed. you don't have to earn rest — take it first, food can be small.",
  stressed: "that tightness is real. nothing here needs to be done fast. one thing at a time.",
  angry: "anger usually means something mattered. you're allowed to feel it all the way through — no one here will rush you off it.",
  sad:   "i'm sorry it's heavy today. you don't have to explain it or fix it. i'm here either way.",
  anxious: "anxiety is exhausting. you're safe here. slow the pace down — one breath, then the next.",
  overwhelmed: 'that sounds like a lot to carry. you don\'t have to carry it alone, and you don\'t have to do all of it — just the next small thing.',
  lonely: "lonely is one of the hardest ones, and it's not because anything's wrong with you. there are people here in the same week you're in.",
};

export function nurtureResponse(moodId) {
  return MOOD_RESPONSE[moodId] || MOOD_RESPONSE.okay;
}

export function recordCheckIn(moodId, note = '') {
  if (!MOOD_BY_ID[moodId]) return null;
  const log = readJSON(K_CHECKIN, []);
  const entry = { mood: moodId, note: String(note || '').trim(), at: Date.now() };
  log.push(entry);
  writeJSON(K_CHECKIN, log.slice(-300));
  return entry;
}
export function lastCheckIn() {
  const log = readJSON(K_CHECKIN, []);
  return log.length ? log[log.length - 1] : null;
}
export function checkedInToday(now = Date.now()) {
  const last = lastCheckIn();
  return !!last && new Date(last.at).toDateString() === new Date(now).toDateString();
}
// Newest first — the Profile's Check-ins tab lists these.
export function checkInHistory(limit = 30) {
  return readJSON(K_CHECKIN, []).slice().reverse().slice(0, limit);
}

// ── No-solutions preference — the whole "I just need to vent" principle. ─────
export function getNoSolutions() {
  return !!readJSON(K_PREFS, {}).noSolutions;
}
export function setNoSolutions(on) {
  const prefs = readJSON(K_PREFS, {});
  prefs.noSolutions = !!on;
  writeJSON(K_PREFS, prefs);
  return prefs.noSolutions;
}

// ── 2. Solution-aware search ────────────────────────────────────────────────
// Each NEED maps a kind of struggle to a gentle reflection + REAL in-app help.
// A solution has a `route` (a page) OR a `lifeMode` (flips feedContext's mode);
// `why` says, in plain words, what it actually does — no overselling.
export const NEEDS = [
  {
    id: 'money',
    test: /\b(broke|afford|can'?t pay|money|cheap(er)?|expensive|cost(s|ing)?|budget|paycheck|rent|bills?|poor|so tight|no cash|food ?stamps?|snap|wic)\b/i,
    reflect: "money stress is exhausting, and it is not a character flaw — you're playing on a harder map, not doing it wrong.",
    solutions: [
      { lifeMode: 'broke', label: 'Turn on "broke this month"', why: 'the whole feed shifts to cheap, filling, real food — nothing else changes about you' },
      { route: '/nibblers', label: 'Low-cost nibbler plates', why: 'genuinely good food that costs next to nothing' },
      { route: '/deals', label: 'Deals near you', why: 'real discounts where you already shop' },
    ],
  },
  {
    id: 'lonely',
    emotional: true,
    test: /\b(lonely|alone|isolat(ed|ing)?|no one|nobody|by myself|no friends?|disconnected|left out|nobody gets)\b/i,
    reflect: "lonely is one of the heaviest ones, and it says nothing bad about you. other people are in this same week — you don't have to do it by yourself.",
    solutions: [
      { route: '/out-there', label: 'Find a table or a circle', why: 'people eating together near you — showing up is enough, no performance' },
      { route: '/feed', label: 'The community feed', why: 'others going through the same thing, in their own words' },
    ],
  },
  {
    id: 'exhausted',
    emotional: true,
    test: /\b(exhaust(ed|ing)?|so tired|no energy|drained|burn(t|ed)? ?out|burnout|can'?t even|too tired|wiped)\b/i,
    reflect: "you sound worn all the way down. eating doesn't have to mean cooking today, and doing one small thing counts as enough.",
    solutions: [
      { route: '/nibblers', label: 'Zero-effort plates', why: 'get fed without cooking — no stove, no cleanup' },
    ],
  },
  {
    id: 'overwhelmed',
    emotional: true,
    test: /\b(overwhelm(ed|ing)?|too much|drowning|can'?t keep up|so behind|falling apart|can'?t breathe|spiraling)\b/i,
    reflect: "that's a lot to hold at once. you don't have to solve all of it — just the very next small thing, and the rest can wait.",
    solutions: [
      { route: '/nibblers', label: 'The simplest possible meal', why: 'one decision, already made for you' },
    ],
  },
  {
    id: 'sad',
    emotional: true,
    test: /\b(sad|depress(ed|ing)?|numb|can'?t stop crying|hopeless|so low|miserable|feel awful|feeling low)\b|feeling\b[^.!?]{0,14}\bdown\b|\bso down\b/i,
    reflect: "i'm sorry it's this heavy. you don't have to explain it or fix it right now — being here is allowed to be the whole thing you do.",
    solutions: [
      { route: '/nest', label: 'Sit with Nova', why: "I won't rush to fix it — I'll stay in the feeling with you first" },
    ],
  },
  {
    id: 'anxious',
    emotional: true,
    test: /\b(anxious|anxiety|panic(king)?|nervous|worried|racing thoughts?|on edge|freaking out|can'?t calm)\b/i,
    reflect: "anxiety is so tiring to carry. you're safe here. we can slow the whole thing down — one breath, then the next.",
    solutions: [
      { route: '/nest', label: 'Talk it through with Nova', why: 'somewhere to set the worry down for a second' },
    ],
  },
  {
    id: 'grief',
    emotional: true,
    test: /\b(died|death|passed away|lost (my|her|him|them)|grief|grieving|funeral|miss (her|him|them) so)\b/i,
    reflect: "i'm so sorry. there's no timeline on this and nothing to fix — the app will get quieter and ask less of you.",
    solutions: [
      { lifeMode: 'grief', label: 'Turn on a gentler mode', why: 'the app softens and stops pushing while you\'re in it' },
      { route: '/nest', label: 'Nova can sit with this', why: 'no fixing, no rushing — just company' },
    ],
  },
  {
    id: 'moved',
    test: /\b(just moved|new (city|town|place|apartment|to town|to the|here)|don'?t know where|new here|relocat(ed|ing))\b/i,
    reflect: "landing somewhere new is disorienting, especially the food part. let's make the first week smaller.",
    solutions: [
      { lifeMode: 'moved', label: '"I just moved" mode', why: 'a phase-by-phase settle-in: kitchen gear, freezer meals, first shop' },
      { route: '/commute', label: 'Find your store', why: 'where to actually buy food near your new place' },
    ],
  },
  {
    id: 'undecided',
    test: /(what (should|do|can) i\b[^?]{0,12}?(eat|make|cook)|don'?t know what to (eat|make|cook)|no idea what to|can'?t decide|nothing sounds good)/i,
    reflect: "decision fatigue is real — sometimes the hardest part is just picking. let something else carry that for a minute.",
    solutions: [
      { route: '/craving', label: 'Let a craving decide', why: 'answer one feeling and get a real, specific dish back' },
      { route: '/pantry', label: 'What you can make right now', why: 'real recipes from what\'s already in your kitchen' },
    ],
  },
  {
    id: 'hungry',
    test: /\b(hungry|starving|haven'?t eaten|nothing to eat|empty fridge|no food|need to eat)\b/i,
    reflect: "let's just get you fed — that comes first, and it can be simple.",
    solutions: [
      { route: '/pantry', label: 'Cook from what you have', why: 'real recipes from your actual kitchen, right now' },
      { route: '/nibblers', label: 'Something small, now', why: 'five minutes to fed, no real cooking' },
    ],
  },
];

// A light cue that the query is about the PERSON, not just a food noun — so a
// plain recipe search ("cheap dinner", "comfort food") isn't hijacked into a
// feelings flow, but "I'm broke" or "i feel alone" is.
const FEELING_CUE = /\b(i['’]?m|im|i feel|i'?m feeling|feeling|i can'?t|i cant|help me|need help|so |really |myself|i am|i've been|ive been|i just|hate|scared|done|nobody|no one|alone)\b/i;

/** Reflect the person's words back, first — the reflection is never a fix. */
function reflectionFor(matched, d) {
  if (matched.length) return matched[0].reflect;
  if (d.intensity >= 2 || d.selfBlame) return "that sounds really heavy, and you don't have to carry it alone here.";
  return "i hear you. you don't have to have it figured out to say it out loud.";
}

/**
 * Classify a search query and, if it reads as a problem, return the nurture
 * response. Shape:
 *   { kind:'empty' }
 *   { kind:'crisis',  reflection, resources }        // always, ignores noSolutions
 *   { kind:'problem', reflection, needs:[id], solutions:[…], noSolutions, feeling:true }
 *   { kind:'recipe' }                                 // let normal search run
 */
export function solveQuery(query, opts = {}) {
  const clean = String(query || '').trim();
  if (!clean) return { kind: 'empty' };

  const d = detect(clean);
  if (d.crisis || CRISIS_EXTRA.test(clean)) {
    return {
      kind: 'crisis',
      reflection: "i'm really glad you said that out loud. you matter, and you deserve real support right now — please reach out to one of these. i can stay with you too.",
      resources: CRISIS_RESOURCES,
    };
  }

  const matched = NEEDS.filter((n) => n.test.test(clean));
  const feeling = FEELING_CUE.test(clean) || d.route !== 'none';
  // An EMOTIONAL need (naming a feeling — lonely, sad, overwhelmed…) is itself
  // the signal, so it counts even with no pronoun. An INSTRUMENTAL need (money,
  // moved, "what to make") only becomes a problem when there's a feeling cue —
  // otherwise "cheap dinner" or "what should I make" is just a recipe search.
  const emotionalMatch = matched.some((n) => n.emotional);
  const isProblem = (d.route !== 'none') || emotionalMatch || (matched.length > 0 && feeling);
  if (!isProblem) return { kind: 'recipe' };

  const noSolutions = opts.noSolutions ?? getNoSolutions();
  // Dedupe solutions across matched needs (by route|lifeMode), cap at 3.
  const seen = new Set();
  const solutions = [];
  for (const n of matched) {
    for (const s of n.solutions) {
      const key = s.route || `mode:${s.lifeMode}`;
      if (seen.has(key)) continue;
      seen.add(key);
      solutions.push(s);
    }
  }
  return {
    kind: 'problem',
    reflection: reflectionFor(matched, d),
    needs: matched.map((n) => n.id),
    solutions: noSolutions ? [] : solutions.slice(0, 3),
    noSolutions,
    feeling,
  };
}

// ── 3. Nurture Score — the objective function, re-weighted off virality ─────
// Twitter's heavy ranker weights amplification (follow 4.0, repost 1.0, like
// 0.5) and heavily penalizes report (-5.0) to protect long-term retention. This
// keeps the "rank on real outcomes, cap virality" spirit the app already uses
// (madeItRate) and points it at EMOTIONAL outcomes: 40% resonance ("I relate"),
// 30% holding (comfort + shared experience), 20% freshness, 10% virality. The
// resonance/holding inputs come from a real reactions backend when one exists;
// today they're 0 and the score honestly leans on freshness + capped virality.
// liftSignal.js's classifyLift() (built for depthRank.js) is the real
// classifier a future caller should use to compute relateCount/comfortCount
// from actual comment text once a feed pass can read per-post comments back —
// it already distinguishes 'relate' ("I've been there") from 'encourage'
// (comfort/support), the same split this function's 40/30 weighting expects.
// Not wired here: this repo has no visibility into whether the journal
// backend's comment field round-trips into the feed read path yet (it's a
// separate repo — see journalApi.js), so claiming that wiring without
// verifying it would be exactly the fabrication this file argues against.
export function nurtureScore(post, s = {}) {
  const resonance = Math.min(s.relateCount ?? 0, 10) / 10;                 // 0..1
  const holding   = Math.min((s.comfortCount ?? 0) + (s.sharedCount ?? 0), 10) / 10; // 0..1
  const freshness = s.freshnessHours != null ? Math.max(0, 1 - s.freshnessHours / 48) : 0; // 0..1
  const virality  = Math.min(Math.max(s.viralScore ?? 0, 0), 1);          // 0..1, capped upstream
  return Math.round(resonance * 40 + holding * 30 + freshness * 20 + virality * 10);
}

// The published weighting, exported so a feed ranker (or a test) reads one
// source of truth instead of re-hardcoding the split.
export const NURTURE_WEIGHTS = { resonance: 40, holding: 30, freshness: 20, virality: 10 };
