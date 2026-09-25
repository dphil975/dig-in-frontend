/* nurture.js — the Nurture layer. The app's argument, in code: hear the problem,
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

import { detect, CRISIS_RESOURCES } from './shadowToLight';

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
      { route: '/recess', label: 'Two minutes of Recess', why: 'one small kind thing, no pressure, no streak to protect' },
    ],
  },
  {
    id: 'overwhelmed',
    emotional: true,
    test: /\b(overwhelm(ed|ing)?|too much|drowning|can'?t keep up|so behind|falling apart|can'?t breathe|spiraling)\b/i,
    reflect: "that's a lot to hold at once. you don't have to solve all of it — just the very next small thing, and the rest can wait.",
    solutions: [
      { route: '/recess', label: 'Recess — just one thing', why: 'permission to do only the next small thing, and stop there' },
      { route: '/nibblers', label: 'The simplest possible meal', why: 'one decision, already made for you' },
    ],
  },
  {
    id: 'sad',
    emotional: true,
    test: /\b(sad|depress(ed|ing)?|numb|can'?t stop crying|hopeless|so low|miserable|feel awful|feeling low)\b|feeling\b[^.!?]{0,14}\bdown\b|\bso down\b/i,
    reflect: "i'm sorry it's this heavy. you don't have to explain it or fix it right now — being here is allowed to be the whole thing you do.",
    solutions: [
      { route: '/nova', label: 'Sit with Nova', why: "she won't rush to fix it — she'll stay in the feeling with you first" },
      { route: '/recess', label: 'One small kindness', why: 'something gentle for yourself, that\'s the entire ask' },
    ],
  },
  {
    id: 'anxious',
    emotional: true,
    test: /\b(anxious|anxiety|panic(king)?|nervous|worried|racing thoughts?|on edge|freaking out|can'?t calm)\b/i,
    reflect: "anxiety is so tiring to carry. you're safe here. we can slow the whole thing down — one breath, then the next.",
    solutions: [
      { route: '/recess', label: 'A breathing minute', why: 'the breathing pace-setter, to bring it down a notch' },
      { route: '/nova', label: 'Talk it through with Nova', why: 'somewhere to set the worry down for a second' },
    ],
  },
  {
    id: 'grief',
    emotional: true,
    test: /\b(died|death|passed away|lost (my|her|him|them)|grief|grieving|funeral|miss (her|him|them) so)\b/i,
    reflect: "i'm so sorry. there's no timeline on this and nothing to fix — the app will get quieter and ask less of you.",
    solutions: [
      { lifeMode: 'grief', label: 'Turn on a gentler mode', why: 'the app softens and stops pushing while you\'re in it' },
      { route: '/nova', label: 'Nova can sit with this', why: 'no fixing, no rushing — just company' },
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
