/* appSkins.js — let people choose how the app presents itself.

   The model is Delta's, and deliberately so: in Delta, a skin is DATA (art +
   where the buttons sit), not a fork of the app, which is why anyone can make
   one and why switching is instant and safe. Same here — a skin is a plain
   object of CSS-variable values and a couple of display flags. No skin can
   change what a number MEANS, only how it's drawn. That boundary is what
   keeps "customize it however you want" from turning into "the app lies
   differently depending on your theme."

   ── THE CASH VIEW IS THE POINT ────────────────────────────────────────────
   Rendering money as physical denominations instead of a numeral is not
   decoration. It's the best-supported idea in this whole file:

   - PAIN OF PAYING: parting with cash is psychologically more painful than
     card or phone, and that friction is why people reliably spend less with
     it. Digital money is easy to spend precisely because it doesn't feel
     like anything.
   - DENOMINATION EFFECT (Raghubir & Srivastava, J. Consumer Research 2009):
     people are LESS likely to spend a sum held as one large bill than the
     same sum as many small ones. The physical form changes the decision.

   Showing "$56.50 left" as two twenties, a ten, a five, a one and two
   quarters gives an abstract number a shape you can count. That's the same
   reason envelope budgeting and Monopoly money work as teaching tools — and
   it's an OPTION, never the default, because plenty of people read the
   numeral just fine and would find bills patronizing.

   ── ACCESSIBILITY IS NOT A SKIN ───────────────────────────────────────────
   A deliberate call: contrast, motion, text scale and spacing are separate
   from skin choice and available inside EVERY skin. Bundling them into one
   "accessible theme" would force someone to give up the look they like in
   order to read comfortably, and would quietly label that theme as the
   disability one. The research points the same way — granular control over
   presentation without overwhelming people with options, which is why this
   is four small toggles and four curated skins rather than forty sliders. */

const SKIN_KEY = 'dig_in_skin';
const PREFS_KEY = 'dig_in_display_prefs';

function read(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
  catch { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

/* ── the skins ────────────────────────────────────────────────────────────
   `vars` are CSS custom properties applied to :root. Every skin must define
   the same keys so switching can never leave a variable undefined. */
export const SKINS = [
  {
    id: 'paper',
    name: 'Paper',
    blurb: 'The default. Warm, plain, out of your way.',
    tagline: 'No game, just the app.',
    money: 'numeric',
    vars: {
      '--skin-surface': '#ffffff',
      '--skin-ink': '#33302A',
      '--skin-accent': '#6E8259',
      '--skin-edge': '#33302A',
      '--skin-radius': '14px',
      '--skin-border': '2px',
      '--skin-shadow': '4px 4px 0 rgba(51,48,42,.14)',
    },
  },
  {
    id: 'tabletop',
    name: 'Tabletop',
    blurb: 'Money shows up as bills you can count, like a board game bank.',
    tagline: 'For when a number does not feel like anything.',
    money: 'cash',
    vars: {
      '--skin-surface': '#fdf6e3',
      '--skin-ink': '#2b2a26',
      '--skin-accent': '#2f7d54',
      '--skin-edge': '#2b2a26',
      '--skin-radius': '10px',
      '--skin-border': '2px',
      '--skin-shadow': '5px 5px 0 rgba(43,42,38,.20)',
    },
  },
  {
    id: 'handheld',
    name: 'Handheld',
    blurb: 'Chunky, high-contrast, built like a cartridge menu.',
    tagline: 'The one that looks like the thing under your bed.',
    money: 'cash',
    vars: {
      '--skin-surface': '#e8f0d8',
      '--skin-ink': '#1c2415',
      '--skin-accent': '#3d6b2e',
      '--skin-edge': '#1c2415',
      '--skin-radius': '4px',
      '--skin-border': '3px',
      '--skin-shadow': '4px 4px 0 #1c2415',
    },
  },
  {
    id: 'quiet',
    name: 'Quiet',
    blurb: 'Low stimulation. Soft edges, no motion, more room to breathe.',
    tagline: 'Fewer things shouting at once.',
    money: 'numeric',
    motion: 'reduced',
    spacing: 'roomy',
    vars: {
      '--skin-surface': '#fbfaf7',
      '--skin-ink': '#3a3833',
      '--skin-accent': '#6b7f6a',
      '--skin-edge': '#d8d3c8',
      '--skin-radius': '16px',
      '--skin-border': '1px',
      '--skin-shadow': 'none',
    },
  },
];

export const SKIN_BY_ID = Object.fromEntries(SKINS.map(s => [s.id, s]));
export const DEFAULT_SKIN = 'paper';

/* ── display prefs — independent of skin, on purpose ───────────────────── */
export const DEFAULT_PREFS = {
  money: null,        // null = follow the skin; 'numeric' | 'cash' to override
  motion: 'full',     // 'full' | 'reduced'
  textScale: 1,       // 1 | 1.15 | 1.3
  spacing: 'normal',  // 'normal' | 'roomy'
  contrast: 'normal', // 'normal' | 'high'
};

export const PREF_OPTIONS = {
  money: [
    { id: null, label: 'Match my skin' },
    { id: 'numeric', label: 'Plain numbers', hint: '$56.50' },
    /* No worked example baked in here — an earlier hardcoded one ("two 20s, a
       10, a 5, a 1") was simply wrong for the amount shown beside it, and a
       money feature cannot afford a wrong number in its own UI. The live
       preview next to these buttons shows the real breakdown. */
    { id: 'cash', label: 'Bills I can count', hint: 'Drawn as bills and coins' },
  ],
  motion: [
    { id: 'full', label: 'Normal motion' },
    { id: 'reduced', label: 'Reduce motion', hint: 'Stops animations and transitions.' },
  ],
  textScale: [
    { id: 1, label: 'Normal text' },
    { id: 1.15, label: 'Larger' },
    { id: 1.3, label: 'Largest' },
  ],
  spacing: [
    { id: 'normal', label: 'Normal spacing' },
    { id: 'roomy', label: 'More spacing', hint: 'More line and letter spacing — easier to track a line.' },
  ],
  contrast: [
    { id: 'normal', label: 'Normal contrast' },
    { id: 'high', label: 'High contrast', hint: 'Stronger text and borders.' },
  ],
};

export function getSkinId() {
  const id = read(SKIN_KEY, DEFAULT_SKIN);
  return SKIN_BY_ID[id] ? id : DEFAULT_SKIN;
}
export function getSkin() { return SKIN_BY_ID[getSkinId()]; }
export function setSkin(id) {
  if (!SKIN_BY_ID[id]) return getSkinId();
  write(SKIN_KEY, id);
  applyDisplay();
  return id;
}

export function getPrefs() {
  return { ...DEFAULT_PREFS, ...read(PREFS_KEY, {}) };
}
export function setPref(key, value) {
  if (!(key in DEFAULT_PREFS)) return getPrefs();
  const next = { ...getPrefs(), [key]: value };
  write(PREFS_KEY, next);
  applyDisplay();
  return next;
}
export function resetDisplay() {
  write(SKIN_KEY, DEFAULT_SKIN);
  write(PREFS_KEY, {});
  applyDisplay();
}

/** Which money rendering is in force: an explicit pref beats the skin's default. */
export function moneyMode() {
  const p = getPrefs();
  if (p.money === 'numeric' || p.money === 'cash') return p.money;
  return getSkin().money || 'numeric';
}

/** Motion: an explicit "reduce" from EITHER the pref or the skin wins. */
export function motionMode() {
  const p = getPrefs();
  if (p.motion === 'reduced') return 'reduced';
  return getSkin().motion === 'reduced' ? 'reduced' : 'full';
}

/**
 * Push the active skin + prefs onto the document as CSS variables and data
 * attributes. Called once at startup and after any change — no component
 * needs to know a skin exists, which is what keeps this from spreading
 * conditionals through the whole app.
 */
export function applyDisplay(doc = (typeof document !== 'undefined' ? document : null)) {
  if (!doc) return;
  const root = doc.documentElement;
  const skin = getSkin();
  const prefs = getPrefs();

  for (const [k, v] of Object.entries(skin.vars)) root.style.setProperty(k, v);

  const spacing = prefs.spacing === 'roomy' || skin.spacing === 'roomy' ? 'roomy' : 'normal';
  root.style.setProperty('--skin-text-scale', String(prefs.textScale));
  root.style.setProperty('--skin-line', spacing === 'roomy' ? '1.85' : '1.5');
  root.style.setProperty('--skin-letter', spacing === 'roomy' ? '0.02em' : '0');

  root.dataset.skin = skin.id;
  root.dataset.motion = motionMode();
  root.dataset.spacing = spacing;
  root.dataset.contrast = prefs.contrast;
  root.dataset.money = moneyMode();
}

/* ── money as something you can count ─────────────────────────────────── */

/* Real US denominations. $2 bills are deliberately omitted — they exist but
   almost nobody pictures one, and the whole point is a shape people can
   recognize at a glance. */
export const DENOMINATIONS = [
  { value: 100, label: '$100', kind: 'bill', one: 'hundred',  many: 'hundreds' },
  { value: 50,  label: '$50',  kind: 'bill', one: 'fifty',    many: 'fifties' },
  { value: 20,  label: '$20',  kind: 'bill', one: 'twenty',   many: 'twenties' },
  { value: 10,  label: '$10',  kind: 'bill', one: 'ten',      many: 'tens' },
  { value: 5,   label: '$5',   kind: 'bill', one: 'five',     many: 'fives' },
  { value: 1,   label: '$1',   kind: 'bill', one: 'one',      many: 'ones' },
  { value: 0.25, label: '25¢', kind: 'coin', one: 'quarter',  many: 'quarters' },
  { value: 0.10, label: '10¢', kind: 'coin', one: 'dime',     many: 'dimes' },
  { value: 0.05, label: '5¢',  kind: 'coin', one: 'nickel',   many: 'nickels' },
  { value: 0.01, label: '1¢',  kind: 'coin', one: 'penny',    many: 'pennies' },
];

// Spoken counts. Read aloud, "2 25¢s" is noise; "two quarters" is money.
const COUNT_WORDS = ['zero', 'a', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/**
 * Break an amount into the fewest real bills and coins — the "count it out
 * on the table" view.
 *
 * @returns {{ total, negative, stacks: [{value,label,kind,count}] }}
 *   `negative: true` for money owed/overspent, so the UI can show it as a
 *   debt pile rather than silently dropping the sign. Understanding what you
 *   owe is exactly what this view is for.
 */
export function cashBreakdown(amount) {
  const negative = Number(amount) < 0;
  // Work in cents — floating-point dollars will happily produce 1¢ ghosts.
  let cents = Math.round(Math.abs(Number(amount) || 0) * 100);
  const stacks = [];
  for (const d of DENOMINATIONS) {
    const unit = Math.round(d.value * 100);
    const count = Math.floor(cents / unit);
    if (count > 0) {
      stacks.push({ ...d, count });
      cents -= count * unit;
    }
  }
  return { total: Math.abs(Number(amount) || 0), negative, stacks };
}

/**
 * "a fifty, a five, a one and two quarters" — the spoken form, used for the
 * screen-reader label on the cash view. Uses real coin names and spelled
 * counts because this string exists to be HEARD; "2 25¢s" is not money, it's
 * noise.
 */
export function cashInWords(amount) {
  const { stacks, negative } = cashBreakdown(amount);
  if (!stacks.length) return 'nothing';
  const parts = stacks.map(s => {
    const count = s.count <= 10 ? COUNT_WORDS[s.count] : String(s.count);
    return s.count === 1 ? `a ${s.one}` : `${count} ${s.many}`;
  });
  const joined = parts.length === 1
    ? parts[0]
    : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return negative ? `${joined} short` : joined;
}
