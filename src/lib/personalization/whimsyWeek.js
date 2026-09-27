/* whimsyWeek.js — Nova's 7-day, mood-built lifestyle plan.

   A real deterministic engine (same posture as fusionEngine/remixEngine): the
   week is seeded by your current mood flavor + your learned taste profile +
   a start date, so it's stable across reloads and regenerable, never random
   noise. Nova's tone (novaSettings) colors the framing; nothing here calls an
   LLM or a backend.

   The seven days follow one honest arc — ease in, explore, comfort, adventure,
   share, treat, reflect — with each day carrying 3 real items:
     • cook     — a real recipe from the corpus, mood- + taste-ranked
     • adventure — an honest challenge grounded in a surface that EXISTS
                   (the Food Map, Global Food, a real check-in) — never a
                   fabricated named café, since the app has no café database
     • reflect / share — tied to the real mood log, happiness engine, Circles

   The finished plan encodes into a self-contained share URL (the "gift kit"),
   copying boardsService.js's base64url pattern so a shared card needs no
   corpus load. */

import { FLAVORS, recipeFlavors, loadFlavorProfile } from '../flavorProfile';

const STORE_KEY = 'dig_in_whimsy_week';
const MOOD_LOG_KEY = 'dig_in_mood_log';

/* ── Seeded PRNG (mulberry32 off a char-sum seed) ──────────────── */
function seedFrom(str) {
  let h = 1779033703 ^ String(str).length;
  for (let i = 0; i < String(str).length; i++) {
    h = Math.imul(h ^ String(str).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── The 7-day arc ─────────────────────────────────────────────── */
const DAY_ARC = [
  { key: 'ease',      label: 'Ease In',   line: "start gentle — a dish that asks nothing of you but shows up warm." },
  { key: 'explore',   label: 'Explore',   line: "stretch a little today — somewhere, or something, you haven't tried." },
  { key: 'comfort',   label: 'Comfort',   line: "a soft middle-of-the-week day. Cook the thing that feels like a hug." },
  { key: 'adventure', label: 'Adventure', line: "go further out — a flavor from a place you've never cooked from." },
  { key: 'share',     label: 'Share',     line: "food's better passed around. Make something worth handing to someone." },
  { key: 'treat',     label: 'Treat',     line: "you've earned a small indulgence. No notes, just something sweet." },
  { key: 'reflect',   label: 'Reflect',   line: "look back at the week you built. Name one win and wrap it up." },
];

// Nova's tone lead-ins (novaSettings tone ids) — combined with the day line
// so the whole week stays in one chosen voice, real content, no LLM.
const TONE_PREFIX = {
  listener:    "I'm right here with you —",
  calm:        "No rush today.",
  coach:       "Here's the rep for today:",
  cheerleader: "Okay let's GO —",
  sassy:       "Trust me on this one:",
};
function novaIntro(dayLine, tone) {
  const prefix = TONE_PREFIX[tone] || TONE_PREFIX.listener;
  return `${prefix} ${dayLine}`;
}

/* ── Adventure bank — honest prompts on surfaces that actually exist ── */
const ADVENTURES = [
  { text: "Shop a store type you've never tried — pull up the map and filter for a bodega, specialty grocer, or halal market near you.", cta: { label: 'Open the Food Map', to: '/' } },
  { text: "Cook one dish from a country you've never cooked from before.", cta: { label: 'Browse Global Food', to: '/explore?tab=global' } },
  { text: "Find a café or bakery you keep walking past, actually go in, and log it as a check-in.", cta: { label: 'Log a check-in', to: '/checkin' } },
  { text: "Take the long way home past a produce stand or farmers market and pick up one thing you can't name yet.", cta: { label: 'Open the Food Map', to: '/' } },
  { text: "Explore your own city's food layout — one neighborhood you've never eaten your way through.", cta: { label: 'Open City Explorer', to: '/explore?tab=city' } },
];

/* ── Reflect bank — tied to the real mood log / happiness engine ── */
const REFLECTS = [
  { kind: 'mood',      prompt: 'Check in with your mood — tap the color that matches how today felt.' },
  { kind: 'gratitude', prompt: "Name one thing about today's meal you're grateful for." },
  { kind: 'win',       prompt: 'Log one small kitchen win from this week — however tiny.' },
];

/* ── Recipe selection ──────────────────────────────────────────── */
function slimRecipe(r) {
  return {
    id: r.id,
    name: r.name || r.full_name || 'A dish',
    country: r.country || r.cuisine || '',
    image: r.image || '',
    time: r.time || r.total_time || (r.prepTime || 0) + (r.cookTime || 0) || null,
    recipe_type: r.recipe_type || '',
  };
}

// Score a recipe for this week: strong bonus if it hits the mood flavor,
// plus the user's real learned affinity for its flavors, plus a stable
// seeded jitter so ties break the same way every rebuild.
function scoreRecipe(r, moodFlavor, profile, jitter) {
  const flavors = recipeFlavors(r);
  let s = 0;
  if (moodFlavor && flavors.includes(moodFlavor)) s += 40;
  for (const f of flavors) s += (profile[f] || 0);
  return s + jitter * 8;
}

const TREAT_TYPES = ['dessert', 'snack', 'drink', 'sweet'];

function pickRecipes(pool, moodFlavor, rand) {
  const profile = loadFlavorProfile();
  const usable = (Array.isArray(pool) ? pool : []).filter(r => r && (r.name || r.full_name));
  const scored = usable
    .map(r => ({ r, score: scoreRecipe(r, moodFlavor, profile, rand()) }))
    .sort((a, b) => b.score - a.score);

  const chosen = [];
  const usedIds = new Set();
  const usedCuisines = new Set();

  function take(pred) {
    const hit = scored.find(({ r }) => !usedIds.has(r.id) && (!pred || pred(r)));
    const pickObj = hit || scored.find(({ r }) => !usedIds.has(r.id));
    if (!pickObj) return null;
    usedIds.add(pickObj.r.id);
    usedCuisines.add((pickObj.r.country || pickObj.r.cuisine || '').toLowerCase());
    chosen.push(slimRecipe(pickObj.r));
    return pickObj.r;
  }

  DAY_ARC.forEach((day) => {
    if (day.key === 'treat') {
      take(r => TREAT_TYPES.includes((r.recipe_type || '').toLowerCase()));
    } else if (day.key === 'adventure' || day.key === 'explore') {
      // Prefer a cuisine we haven't used yet, to make the week feel like range.
      take(r => !usedCuisines.has((r.country || r.cuisine || '').toLowerCase()));
    } else {
      take(null);
    }
  });

  return chosen;
}

/* ── Build ─────────────────────────────────────────────────────── */
export function buildWhimsyWeek(recipePool, { moodFlavor = null, startDateISO, seed } = {}) {
  const start = startDateISO || todayISO();
  const s = seed != null ? seed : seedFrom(`${moodFlavor || 'any'}:${start}`);
  const rand = rng(s);
  const recipes = pickRecipes(recipePool, moodFlavor, rand);

  const days = DAY_ARC.map((day, i) => {
    const dateISO = addDaysISO(start, i);
    const items = [];

    // Cook item (every day has one).
    if (recipes[i]) items.push({ type: 'cook', recipe: recipes[i] });

    // A themed second/third item per day.
    if (day.key === 'explore' || day.key === 'adventure') {
      items.push({ type: 'adventure', ...ADVENTURES[Math.floor(rand() * ADVENTURES.length)] });
    } else if (day.key === 'treat') {
      items.push({ type: 'adventure', ...ADVENTURES[2] }); // the café/bakery one
    }

    if (day.key === 'ease') items.push({ type: 'reflect', ...REFLECTS[0] });
    if (day.key === 'comfort') items.push({ type: 'reflect', ...REFLECTS[1] });
    if (day.key === 'reflect') items.push({ type: 'reflect', ...REFLECTS[2] });

    if (day.key === 'share') items.push({ type: 'share', text: "Share today's dish with your circle." });
    if (day.key === 'reflect') items.push({ type: 'giftkit', text: 'Wrap your week into a gift and send it to someone.' });

    return { dayIndex: i, dateISO, key: day.key, theme: day.label, line: day.line, items };
  });

  return { version: 1, startDateISO: start, moodFlavor, seed: s, days };
}

/* ── Persistence + calendar-day tracking ───────────────────────── */
export function saveWhimsyWeek(plan) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(plan)); } catch { /* ignore */ }
  return plan;
}
export function loadWhimsyWeek() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch { return null; }
}
export function clearWhimsyWeek() {
  try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
}

function midnight(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); }
export function todayISO() { return new Date().toISOString().slice(0, 10); }
function addDaysISO(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Which day (0-6) the plan is on today, by real calendar date. */
export function currentDayIndex(plan) {
  if (!plan?.startDateISO) return 0;
  const diff = Math.floor((midnight(new Date()) - midnight(plan.startDateISO + 'T00:00:00')) / 86400000);
  return Math.max(0, Math.min(6, diff));
}

/** The user's most recent mood pick (flavor), for pre-seeding. */
export function latestMoodFlavor() {
  try {
    const log = JSON.parse(localStorage.getItem(MOOD_LOG_KEY) || '[]');
    const last = log[log.length - 1];
    return last?.flavor && FLAVORS.includes(last.flavor) ? last.flavor : null;
  } catch { return null; }
}

/* ── Gift-kit share (base64url, mirrors boardsService.js) ───────── */
function b64encode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64decode(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(s)));
}

export function encodeWhimsyForShare(plan) {
  // The plan is already self-contained (slimmed recipes + inline text), so the
  // whole thing travels in the URL — the shared card needs no corpus.
  return b64encode(JSON.stringify({ m: plan.moodFlavor, s: plan.startDateISO, d: plan.days }));
}
export function decodeSharedWhimsy(param) {
  try {
    const obj = JSON.parse(b64decode(param));
    if (!Array.isArray(obj.d)) return null;
    return { moodFlavor: obj.m || null, startDateISO: obj.s || todayISO(), days: obj.d };
  } catch { return null; }
}
export function buildWhimsyShareUrl(plan) {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/whimsy-card?w=${encodeWhimsyForShare(plan)}`;
}
