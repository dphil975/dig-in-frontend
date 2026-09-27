/* thread.js — "the thread": the one running, timestamped record of what has
   happened between you and Nova. Check-ins, the dish she picked, what you saved,
   swapped or cooked, how it went, and every time you came back.

   Everything Nova does on the home screen reads from and writes to this log:
     • the pick engine reads it to avoid repeats (what was shown, swapped, cooked)
     • a negative check-in is kept here with its timestamp, and comes back as a
       follow-up the next time you open the app on a later day
     • the ♥ counter is the number of days you've come back

   Nova's logic is meant to move to a backend eventually. This is the local-first
   store behind it: plain functions over localStorage, no React. */

import { recordCheckIn } from './kindnessProtocol';

const KEY = 'dig_in_thread';
const SHOWN_KEY = 'dig_in_nova_shown';
const RETURNS_KEY = 'dig_in_returns';
const MAX_EVENTS = 500;
const MAX_SHOWN = 80;
const DAY_MS = 86400000;

function readJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; }
  catch { return fallback; }
}
function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

export function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const recipeKeyOf = (recipe) => String(recipe?.id ?? recipe?.name ?? '');

/* ── The log ─────────────────────────────────────────────────────────────── */

export function logThread(type, data = {}) {
  const ev = {
    id: `t_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    type,
    at: Date.now(),
    ...data,
  };
  const list = readJSON(KEY, []);
  list.push(ev);
  writeJSON(KEY, list.slice(-MAX_EVENTS));
  try { window.dispatchEvent(new Event('dig_in_thread')); } catch { /* ignore */ }
  return ev;
}

/** Newest first. `types` narrows to a few event types. */
export function threadEvents({ limit = 100, types = null } = {}) {
  const list = readJSON(KEY, []);
  const out = [];
  for (let i = list.length - 1; i >= 0 && out.length < limit; i--) {
    if (!types || types.includes(list[i].type)) out.push(list[i]);
  }
  return out;
}

export function threadIsEmpty() {
  return readJSON(KEY, []).length === 0;
}

/* ── Check-ins ───────────────────────────────────────────────────────────── */

// Anything that isn't calm, happy, good or okay is a mood Nova circles back to.
export const NEGATIVE_MOODS = ['tired', 'stressed', 'angry', 'sad', 'anxious', 'overwhelmed', 'lonely'];
export const isNegativeMood = (id) => NEGATIVE_MOODS.includes(id);

// The four the check-in leads with; everything else sits behind "more feelings".
export const PRIMARY_MOODS = ['calm', 'stressed', 'tired', 'happy'];

export function logCheckIn(mood, note = '') {
  const entry = recordCheckIn(mood, note);   // the older log, which the Nest reads
  if (!entry) return null;
  return logThread('checkin', { mood, note: entry.note, negative: isNegativeMood(mood) });
}

export function todaysCheckIn(now = Date.now()) {
  const today = dayKey(now);
  for (const e of threadEvents({ limit: 60, types: ['checkin'] })) {
    if (dayKey(e.at) === today) return e;
    if (now - e.at > DAY_MS * 2) break;
  }
  return null;
}

export const logCheckInSkip = () => logThread('skip', { about: 'checkin' });

export function skippedCheckInToday(now = Date.now()) {
  const today = dayKey(now);
  for (const e of threadEvents({ limit: 30, types: ['skip', 'checkin'] })) {
    if (dayKey(e.at) !== today) break;
    return e.type === 'skip' && e.about === 'checkin';   // the latest one today decides
  }
  return false;
}

/** The latest check-in from an EARLIER day, if it was a heavy one Nova hasn't
    asked about yet (and it's recent enough to still matter). This is the
    "circle back" — she asks the next time you open the app, not the same day. */
export function pendingFollowUp(now = Date.now()) {
  const list = readJSON(KEY, []);
  const asked = new Set(list.filter((e) => e.type === 'followup').map((e) => e.about));
  const today = dayKey(now);
  for (let i = list.length - 1; i >= 0; i--) {
    const e = list[i];
    if (e.type !== 'checkin' || dayKey(e.at) === today) continue;
    if (now - e.at > DAY_MS * 3) return null;
    return e.negative && !asked.has(e.id) ? e : null;
  }
  return null;
}

/** answer: 'better' | 'same' | 'rough' | 'skip' */
export function logFollowUp(about, answer) {
  return logThread('followup', { about, answer });
}

/* ── Picks, saves, swaps ─────────────────────────────────────────────────── */

const recipeFields = (recipe) => ({
  recipeId: recipe?.id ?? null,
  name: recipe?.name || 'a recipe',
  cuisine: recipe?.cuisine || recipe?.country || null,
});

export const logPick = (recipe, reason) => logThread('pick', { ...recipeFields(recipe), reason });
export const logSwap = (recipe) => logThread('swap', recipeFields(recipe));
export const logSave = (recipe) => logThread('save', recipeFields(recipe));

/** Remember that a dish was put in front of you, so tomorrow's pick isn't the
    same one. Once per dish per day. */
export function markShown(recipe) {
  const key = recipeKeyOf(recipe);
  if (!key) return;
  const list = readJSON(SHOWN_KEY, []);
  const today = dayKey();
  if (list.some((s) => s.key === key && s.day === today)) return;
  list.push({ key, day: today, at: Date.now() });
  writeJSON(SHOWN_KEY, list.slice(-MAX_SHOWN));
}

/** What the pick engine should steer away from, and which cuisines it has been
    leaning on lately. */
export function recentSignals(now = Date.now()) {
  const shown = new Set();
  const cooked = new Set();
  const swapped = new Set();
  const cuisines = [];
  // Only dishes shown on an earlier day count — today's pick must not push itself out.
  const today = dayKey(now);
  for (const s of readJSON(SHOWN_KEY, [])) {
    if (s.day !== today && now - s.at < DAY_MS * 3) shown.add(s.key);
  }
  for (const e of threadEvents({ limit: 200 })) {
    if (now - e.at > DAY_MS * 14) break;
    const key = String(e.recipeId ?? e.name ?? '');
    if (!key) continue;
    if (e.type === 'cook') { cooked.add(key); if (e.cuisine) cuisines.push(e.cuisine); }
    else if (e.type === 'swap') swapped.add(key);
    else if (e.type === 'pick' && e.cuisine && cuisines.length < 3) cuisines.push(e.cuisine);
  }
  return { shown, cooked, swapped, cuisines };
}

/* ── Cooking, and how it went ────────────────────────────────────────────── */

export const logCook = (recipe) => logThread('cook', recipeFields(recipe));

export function lastCook() {
  return threadEvents({ limit: 300, types: ['cook'] })[0] || null;
}

/** The most recent cook (within 3 days) you haven't told Nova about yet. */
export function pendingCookReflection(now = Date.now()) {
  const list = readJSON(KEY, []);
  const told = new Set(list.filter((e) => e.type === 'reflect').map((e) => e.about));
  for (let i = list.length - 1; i >= 0; i--) {
    const e = list[i];
    if (e.type !== 'cook') continue;
    if (now - e.at > DAY_MS * 3) return null;
    return told.has(e.id) ? null : e;
  }
  return null;
}

/** verdict: 'loved' | 'fine' | 'no' | 'skip' */
export function logReflection(about, verdict, recipe = null) {
  return logThread('reflect', { about, verdict, ...(recipe ? recipeFields(recipe) : {}) });
}

/* ── Coming back ─────────────────────────────────────────────────────────── */

/** Read-only look at where the return count stands, so it's safe to call while
    rendering. isNewDay is true on the first open of a day, which is when
    "Welcome back" is worth saying; isFirst is true when Nova has never seen you. */
export function peekReturn(now = Date.now()) {
  const rec = readJSON(RETURNS_KEY, null);
  if (!rec) return { count: 0, isFirst: true, isNewDay: false };
  return { count: rec.count, isFirst: false, isNewDay: rec.lastDay !== dayKey(now) };
}

/** Record today's visit. Counts a return at most once a day, so it's safe to
    call from an effect that runs more than once. Returns the new count. */
export function commitReturn(now = Date.now()) {
  const rec = readJSON(RETURNS_KEY, null);
  const today = dayKey(now);
  if (!rec) {
    writeJSON(RETURNS_KEY, { count: 1, lastDay: today, firstAt: now, lastAt: now });
    return 1;
  }
  if (rec.lastDay === today) return rec.count;
  writeJSON(RETURNS_KEY, { ...rec, count: rec.count + 1, lastDay: today, lastAt: now });
  return rec.count + 1;
}

export function returnCount() {
  return readJSON(RETURNS_KEY, null)?.count || 0;
}
