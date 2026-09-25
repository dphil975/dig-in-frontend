/* kindnessProtocol.js — Nova's moderation ladder for the Nest.

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
