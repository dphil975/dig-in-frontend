/* cookTimer.js — the visible timer while stepping through a recipe.

   Survives refresh/navigation away (stamped in localStorage, not component
   state) so leaving the step view and coming back doesn't reset it. One
   in-flight timer per recipe id.

   Consolidated (Recipe & Cooking lib reorg): also carries what used to be
   prepTimers.js — the marinade / dough-rise / slow-cooker "smart prepping"
   timers. Both files exported a function named `startTimer` with different
   signatures (this one takes a recipeId; prepTimers' takes a
   {label, minutes, body} options object), so prepTimers' version has been
   renamed to `startPrepTimer` to resolve the collision. The old
   src/lib/prepTimers.js barrel re-exports it back under its original
   `startTimer` name so nothing importing from that path breaks. */

const KEY = (recipeId) => `dig_in_cook_timer_${recipeId}`;

export function startTimer(recipeId) {
  if (!recipeId) return;
  try { localStorage.setItem(KEY(recipeId), String(Date.now())); } catch { /* quota */ }
}

export function elapsedMs(recipeId) {
  if (!recipeId) return 0;
  const started = Number(localStorage.getItem(KEY(recipeId)) || 0);
  return started ? Date.now() - started : 0;
}

export function isRunning(recipeId) {
  if (!recipeId) return false;
  return !!localStorage.getItem(KEY(recipeId));
}

/** Stop the timer and report elapsed minutes. Does not clear the stamp until
    the caller confirms the cook (RecipeFull calls clearTimer after posting),
    so re-opening the page mid-cook still shows a running HUD. */
export function stopTimer(recipeId) {
  const ms = elapsedMs(recipeId);
  return { elapsedMin: ms ? Math.round(ms / 60000) : null };
}

export function clearTimer(recipeId) {
  if (!recipeId) return;
  try { localStorage.removeItem(KEY(recipeId)); } catch { /* ignore */ }
}

/* ════════════════════════════════════════════════════════════════════════
   Originally prepTimers.js — the "smart prepping assistant": marinade /
   dough-rise / slow-cooker timers that survive a page refresh (stored as a
   target timestamp, not a running countdown) so "remind me in 2 hours"
   actually means 2 hours from now, not 2 hours of the tab staying open
   uninterrupted.

   Pure data/state, no DOM access (mirrors geoService.js's "pure utilities,
   components own rendering" split) — the page component is responsible for
   actually firing a Notification when a timer completes, reusing the same
   Notification.requestPermission() / new Notification() pattern already
   used by the retired Nudges page (_archive/retired/frontend-retired/pages/Nudges).
   ════════════════════════════════════════════════════════════════════════ */

const PREP_KEY = 'dig_in_prep_timers';

export const PREP_PRESETS = [
  { id: 'marinade-2h',   label: 'Marinade · 2 hours',        minutes: 120,  body: "Your marinade is ready — time to cook!" },
  { id: 'marinade-12h',  label: 'Marinade · overnight (12h)', minutes: 720,  body: 'Your overnight marinade is ready — time to cook!' },
  { id: 'dough-2h',      label: 'Dough rise · 2 hours',       minutes: 120,  body: 'Your dough is ready. Shape it and add toppings.' },
  { id: 'slow-cooker-6h',label: 'Slow cooker · 6 hours',      minutes: 360,  body: 'Your slow-cooker dinner is ready! Enjoy your meal.' },
];

export function loadTimers() {
  try { const v = JSON.parse(localStorage.getItem(PREP_KEY)); return Array.isArray(v) ? v : []; } catch { return []; }
}

function savePrepTimers(list) {
  try { localStorage.setItem(PREP_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

/** Start a prep timer. minutes: duration; label/body: what to show/notify.
    Renamed from prepTimers.js's original `startTimer` — see file header. */
export function startPrepTimer({ label, minutes, body }) {
  if (!label || !minutes) return loadTimers();
  const list = loadTimers();
  list.push({
    id: `timer_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    label,
    body: body || `${label} is ready.`,
    startedAt: Date.now(),
    targetTs: Date.now() + minutes * 60000,
    notified: false,
  });
  savePrepTimers(list);
  return list;
}

export function dismissTimer(id) {
  const list = loadTimers().filter(t => t.id !== id);
  savePrepTimers(list);
  return list;
}

/** Mark a timer as having already fired its notification, so it isn't re-sent. */
export function markNotified(id) {
  const list = loadTimers().map(t => (t.id === id ? { ...t, notified: true } : t));
  savePrepTimers(list);
  return list;
}

export function remainingMs(timer) {
  return Math.max(0, timer.targetTs - Date.now());
}

export function isDone(timer) {
  return remainingMs(timer) === 0;
}

/** "1h 24m" / "45m" / "Ready" — for a countdown display. */
export function formatRemaining(timer) {
  const ms = remainingMs(timer);
  if (ms === 0) return 'Ready';
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
