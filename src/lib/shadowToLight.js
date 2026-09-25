/* shadowToLight.js — Nova's 7-phase emotional recovery protocol.

   When someone posts something negative ("I tried it 3 times and it still sucks,
   I'm a failure"), Nova doesn't shut it down and doesn't rush to fix it. She
   walks them from shadow to light:

     0 DETECT   classify the post before responding (the only costly error)
     1 VALIDATE mirror the feeling back — no advice yet
     2 MIRROR   surface real others who flopped too — "you're not alone"
     3 REFRAME  move the label from "failure" to "persistent learner"
     4 RESET    hand over a genuinely un-messable small win
     5 PIVOT    end up, not neutral — log one gratitude
     6 ANCHOR   ~18h later, an unprompted callback so the lift sticks

   DETECT is a lightweight client-side classifier (sentiment + keyword +
   intensity). It is NOT a diagnosis. Its one job that truly matters: catch
   crisis language and route OUT of the protocol to real human resources. Nova
   de-escalates and redirects cooking despair; she does not counsel crisis.

   Pure logic + localStorage. No network. Swaps onto a real backend classifier
   the day one exists without changing the phase machine downstream. */

// ── Phase model ─────────────────────────────────────────────────
export const PHASES = [
  { id: 'detect',   n: 0, tag: 'Detect',   title: 'Reading the shadow' },
  { id: 'validate', n: 1, tag: 'Validate', title: 'Full validation' },
  { id: 'mirror',   n: 2, tag: 'Mirror',   title: 'The community mirror' },
  { id: 'reframe',  n: 3, tag: 'Reframe',  title: 'Identity reframe' },
  { id: 'reset',    n: 4, tag: 'Reset',    title: 'The small-win reset' },
  { id: 'pivot',    n: 5, tag: 'Pivot',    title: 'The gratitude pivot' },
  { id: 'anchor',   n: 6, tag: 'Anchor',   title: 'The morning-after anchor' },
];
// The walkable sequence (detect happens before, anchor happens next day).
export const WALK = ['validate', 'mirror', 'reframe', 'reset', 'pivot'];

// ── Phase 0: DETECT ─────────────────────────────────────────────
// Crisis terms exit the protocol immediately. Deliberately broad — a false
// positive costs a gentle hotline message; a false negative is the failure mode
// we refuse to have.
const CRISIS_TERMS = [
  'kill myself', 'kill me', 'end it', 'want to die', 'better off dead',
  'suicide', 'suicidal', 'self harm', 'self-harm', 'hurt myself',
  "don't want to be here", 'no reason to live', 'hopeless',
];
const NEG_TERMS = [
  'failure', 'failed', 'suck', 'sucks', 'terrible', 'hate', 'stupid', 'useless',
  'worthless', 'give up', 'giving up', 'ruined', 'disaster', 'can\'t do', 'cant do',
  'frustrated', 'frustrating', 'exhausted', 'defeated', 'embarrass',
];
const SELF_BLAME = ['i\'m a', 'im a', 'i am a', 'i always', 'i never', 'i can\'t', 'i cant', 'why am i', 'what\'s wrong with me'];
const REPEAT_RE = /(\b\d+\s*(times|tries|attempts)|again and again|over and over|every time)\b/i;

function countHits(text, terms) {
  const t = text.toLowerCase();
  return terms.reduce((n, term) => n + (t.includes(term) ? 1 : 0), 0);
}

/** Classify a post. Returns { route, valence, intensity, selfBlame, repeat, crisis }.
    route ∈ 'crisis' | 'protocol' | 'vent' | 'none'. */
export function detect(text = '') {
  const clean = String(text).trim();
  if (!clean) return { route: 'none', valence: 0, intensity: 0, selfBlame: false, repeat: false, crisis: false };

  const crisis = countHits(clean, CRISIS_TERMS) > 0;
  const neg = countHits(clean, NEG_TERMS);
  const selfBlame = SELF_BLAME.some(p => clean.toLowerCase().includes(p));
  const repeat = REPEAT_RE.test(clean);

  // intensity 0–3: how deep the spiral reads
  let intensity = 0;
  if (neg >= 1) intensity = 1;
  if (neg >= 2 || selfBlame) intensity = 2;
  if ((neg >= 2 && selfBlame) || (selfBlame && repeat)) intensity = 3;

  const valence = crisis ? -3 : neg > 0 ? -Math.min(neg, 2) : 0;

  let route = 'none';
  if (crisis) route = 'crisis';
  else if (selfBlame || intensity >= 2) route = 'protocol'; // spiral → full walk
  else if (neg > 0) route = 'vent';                          // light vent → validate only

  return { route, valence, intensity, selfBlame, repeat, crisis };
}

// Real, vetted resources. Not exhaustive — the point is to route OUT, fast.
export const CRISIS_RESOURCES = [
  { label: '988 Suicide & Crisis Lifeline', detail: 'Call or text 988 (US) · 24/7', href: 'tel:988' },
  { label: 'Crisis Text Line', detail: 'Text HOME to 741741 (US)', href: 'sms:741741' },
  { label: 'Find a line near you', detail: 'findahelpline.com — international', href: 'https://findahelpline.com' },
];

// ── Session state (localStorage) ────────────────────────────────
const SESSION_KEY = 'dig_in_nova_session';  // active/last protocol run
const ANCHOR_KEY  = 'dig_in_nova_anchors';  // scheduled next-day callbacks

function read(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; }
  catch { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

/** Start a protocol run from a post. Persists a session and, on completion,
    schedules the anchor. Returns the session object. */
export function startSession(text, detection = detect(text)) {
  const session = {
    id: `nova_${Date.now()}`,
    startedAt: Date.now(),
    text,
    detection,
    phaseIndex: 0,       // index into WALK
    completedAt: null,
    recipeTried: text,   // the recipe/attempt that beat them (for the anchor)
  };
  write(SESSION_KEY, session);
  return session;
}

export function currentPhase(session) {
  if (!session) return null;
  return WALK[session.phaseIndex] || null;
}

/** Advance one phase. On finishing the last walkable phase, mark complete
    and schedule the ~18h anchor. */
export function advance(session) {
  if (!session) return session;
  const next = { ...session, phaseIndex: session.phaseIndex + 1 };
  if (next.phaseIndex >= WALK.length && !next.completedAt) {
    next.completedAt = Date.now();
    scheduleAnchor(next);
  }
  write(SESSION_KEY, next);
  return next;
}

export function loadSession() { return read(SESSION_KEY, null); }
export function clearSession() { write(SESSION_KEY, null); }

// ── Phase 6: ANCHOR scheduling ──────────────────────────────────
const ANCHOR_DELAY_MS = 18 * 3600_000; // ~18h later

function scheduleAnchor(session) {
  const anchors = read(ANCHOR_KEY, []);
  anchors.push({
    id: session.id,
    dueAt: Date.now() + ANCHOR_DELAY_MS,
    recipeTried: session.recipeTried,
    delivered: false,
  });
  write(ANCHOR_KEY, anchors.slice(-20)); // keep it bounded
}

/** Any anchor whose time has come and hasn't been delivered (for the callback). */
export function dueAnchor(now = Date.now()) {
  const anchors = read(ANCHOR_KEY, []);
  return anchors.find(a => !a.delivered && a.dueAt <= now) || null;
}

export function markAnchorDelivered(id) {
  const anchors = read(ANCHOR_KEY, []).map(a => a.id === id ? { ...a, delivered: true } : a);
  write(ANCHOR_KEY, anchors);
}

/* DEV/DEMO: with no backend, anchors would take 18h to appear. This lets the
   UI offer a "preview the morning-after" button without faking the real timer. */
export function forceAnchorDue() {
  const anchors = read(ANCHOR_KEY, []);
  if (!anchors.length) return null;
  const last = anchors[anchors.length - 1];
  last.dueAt = Date.now() - 1000;
  last.delivered = false;
  write(ANCHOR_KEY, anchors);
  return last;
}
