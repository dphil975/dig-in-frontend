/* novaVoice.js — Nova's tone engine for the Shadow-to-Light system.

   Nova already has a voice in the app: hype-woman quips on reels (novaQuips.js)
   and right-moment nudge copy (novaNudges.js). This module is the *emotional*
   register of that same character — the one who meets you at your lowest cooking
   moment and walks you back to capable.

   The user picks a TONE personality (Listener / Calm / Coach / Cheerleader /
   Sassy) and a REFRAME INTENSITY (gentle / balanced / direct). Given a protocol
   phase + those settings, `novaLine()` returns the line Nova says. Everything is
   scripted — Nova's warmth is real design, her empathy is modeled, not felt. The
   spec keeps that line bright and never claims to be therapy.

   Voice bank is data; add lines freely and `novaLine` just reads whatever's here. */

// ── The five tone personalities ─────────────────────────────────
export const TONES = [
  { id: 'listener',   label: 'Listener',   swatch: '#7c5daf', blurb: 'Quiet, present, unhurried. Holds space before anything else.' },
  { id: 'calm',       label: 'Calm',       swatch: '#4E9A6B', blurb: 'Grounding and slow. Lowers the temperature.' },
  { id: 'coach',      label: 'Coach',      swatch: '#d4a574', blurb: 'Warm but pointed. Finds the variable, names the next rep.' },
  { id: 'cheerleader',label: 'Cheerleader',swatch: '#E68A4E', blurb: 'Loud belief in you. Big energy, bigger faith.' },
  { id: 'sassy',      label: 'Sassy',      swatch: '#BE5563', blurb: 'A little unhinged, deeply on your side. Comfort with teeth.' },
];
export const DEFAULT_TONE = 'listener';           // defaults lead with safety
export const REFRAME_INTENSITIES = ['gentle', 'balanced', 'direct'];
export const DEFAULT_REFRAME = 'balanced';

// ── The script bank ─────────────────────────────────────────────
// Keyed by phase → tone → [lines]. `pick` chooses one (seeded = stable).
// `{n}` is interpolated from ctx (fail cohort count, streak, etc.).
const SCRIPTS = {
  validate: {
    listener: [
      "I hear you. You put in the time, you followed the steps, and it still didn't work. That's genuinely hard. I'm here — tell me what happened.",
      "That sounds exhausting. You're allowed to be frustrated. I'm not going anywhere. What went wrong?",
    ],
    calm: [
      "Okay. Breathe with me for a second. It didn't work yet — that's all this is right now. Walk me through it.",
      "Let's slow this down. Nothing's broken that can't be understood. What happened, step by step?",
    ],
    coach: [
      "Three tries means you actually care about getting this right. That's not failure — that's data. Let's find the variable. What did it do?",
      "You showed up three times. Most people quit at one. Tell me the symptom — burnt, didn't set, wrong texture?",
    ],
    cheerleader: [
      "Hey — I need you to hear me: this is not you failing. This is you TRYING, which is the whole game. Tell me everything, I'm right here.",
      "You're still standing after three rounds with this recipe. That's grit. Now let's talk — what happened?",
    ],
    sassy: [
      "Okay first of all, that recipe is on thin ice with me. You did nothing wrong by trying. Tell me what it pulled this time.",
      "Three times? The recipe's the problem, not you — and we're about to prove it. Spill. What went sideways?",
    ],
  },
  mirror: {
    _all: [
      "Let me show you something. {n} people in the Nest tried this exact recipe. {f} of them flopped the first time too. You're in extremely good company.",
      "You are so far from alone on this. {f} people here messed this up before they got it — some of them twice. Here's what they said.",
    ],
    _solo: [
      "You might be the first one here to wrestle with this one — but if there's one thing I know, it's that first tries are brutal for everyone. That's the recipe, not you.",
    ],
  },
  reframe: {
    gentle: [
      "Here's the thing I want you to see: you came back. That's not failure — that's persistence, quietly. And I'm proud of you for still being here.",
      "You didn't quit. You're still in it. That already tells me something true about you.",
    ],
    balanced: [
      "You didn't quit after the first flop. You came back. That's not failure — that's persistence, and failure is just tuition. You're paying your dues, and I'm proud of you.",
      "Read this back to yourself: you tried something hard, it didn't work, and you came back anyway. That's not a failure's story. That's a learner's.",
    ],
    direct: [
      "Stop calling yourself a failure. A failure quits at one. You're on three. That's not who's failing — that's who's learning the hard way, on purpose. Own it.",
      "No. You don't get to say that word about yourself. You came back three times. That's persistence, full stop. Say it with me: this is data, not defeat.",
    ],
  },
  reset: {
    _all: [
      "Here's what we're doing tonight: 3 ingredients, 5 minutes, zero heat. Not the recipe you wanted — the one you need. Because you deserve a win. Ready?",
      "New plan. Something impossible to mess up: three things, five minutes, no stove. You've earned an easy win, and I'm going to hand you one.",
    ],
  },
  pivot: {
    _all: [
      "You made it. How do you feel? Now — one thing you're grateful for. Anything. That you tried. That you're still here. That there's food in your kitchen. I'll wait.",
      "That's a win, and it counts. Before you go: name one thing you're grateful for right now, however small. I'm listening.",
    ],
  },
  anchor: {
    _all: [
      "Yesterday you were ready to quit. Then you made that thing anyway. I've been thinking about it. That's who you are when it's hard — you show up. Want to take another swing at the one that beat you?",
      "Morning. Just so you know — I remember yesterday. You turned a rough night into a win. That wasn't luck, that was you. Ready to face the boss recipe again?",
    ],
  },
  crisis: {
    _all: [
      "What you're carrying sounds bigger than a recipe, and you deserve real support — the kind I can't give you alone. Please reach out to people trained for exactly this. You matter, and I mean that.",
    ],
  },
};

// ── pick / interpolate ──────────────────────────────────────────
function choose(bank, seed) {
  if (!bank || !bank.length) return '';
  const i = typeof seed === 'number'
    ? Math.abs(Math.floor(seed)) % bank.length
    : Math.floor(Math.random() * bank.length);
  return bank[i];
}

function fill(line, ctx = {}) {
  return line
    .replace(/\{n\}/g, ctx.cohort ?? '—')
    .replace(/\{f\}/g, ctx.fails ?? '—')
    .replace(/\{streak\}/g, ctx.streak ?? '—');
}

/** The line Nova says for a phase, given tone + reframe intensity + ctx.
    - validate uses the tone bank
    - reframe uses the reframe-intensity bank
    - mirror picks cohort vs solo based on ctx.cohort
    - other phases share one bank across tones */
export function novaLine(phase, { tone = DEFAULT_TONE, reframe = DEFAULT_REFRAME, ctx = {}, seed } = {}) {
  const P = SCRIPTS[phase];
  if (!P) return '';
  let bank;
  if (phase === 'validate') bank = P[tone] || P[DEFAULT_TONE];
  else if (phase === 'reframe') bank = P[reframe] || P[DEFAULT_REFRAME];
  else if (phase === 'mirror') bank = (ctx.cohort > 0) ? P._all : P._solo;
  else bank = P._all;
  return fill(choose(bank, seed), ctx);
}

export function toneMeta(id) {
  return TONES.find(t => t.id === id) || TONES[0];
}

/**
 * A standalone empathy line in the given tone — the same `validate` bank the
 * Shadow-to-Light protocol uses for a failed-recipe check-in, but callable
 * from anywhere (Ask Nova, a complaint) without the rest of the phase
 * machine. `intensity` ('mild' | 'frustrated') just picks which of the two
 * lines in the bank reads better; both are already validate-first, no fix.
 */
export function empathyLine(tone = DEFAULT_TONE, { intensity = 'mild', seed } = {}) {
  const bank = SCRIPTS.validate[tone] || SCRIPTS.validate[DEFAULT_TONE];
  const i = typeof seed === 'number' ? Math.abs(Math.floor(seed)) % bank.length
    : intensity === 'frustrated' ? 0 : bank.length - 1;
  return bank[i] || bank[0];
}
