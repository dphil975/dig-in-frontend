/* prepTimers.js — the "smart prepping assistant": marinade / dough-rise /
   slow-cooker timers that survive a page refresh (stored as a target
   timestamp, not a running countdown) so "remind me in 2 hours" actually
   means 2 hours from now, not 2 hours of the tab staying open uninterrupted.

   Pure data/state, no DOM access (mirrors geoService.js's "pure utilities,
   components own rendering" split) — the page component is responsible for
   actually firing a Notification when a timer completes, reusing the same
   Notification.requestPermission() / new Notification() pattern already
   used by the retired Nudges page (_archive/frontend-retired/pages/Nudges). */

const KEY = 'dig_in_prep_timers';

export const PREP_PRESETS = [
  { id: 'marinade-2h',   label: 'Marinade · 2 hours',        minutes: 120,  body: "Your marinade is ready — time to cook!" },
  { id: 'marinade-12h',  label: 'Marinade · overnight (12h)', minutes: 720,  body: 'Your overnight marinade is ready — time to cook!' },
  { id: 'dough-2h',      label: 'Dough rise · 2 hours',       minutes: 120,  body: 'Your dough is ready. Shape it and add toppings.' },
  { id: 'slow-cooker-6h',label: 'Slow cooker · 6 hours',      minutes: 360,  body: 'Your slow-cooker dinner is ready! Enjoy your meal.' },
];

export function loadTimers() {
  try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch { return []; }
}

function saveTimers(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

/** Start a prep timer. minutes: duration; label/body: what to show/notify. */
export function startTimer({ label, minutes, body }) {
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
  saveTimers(list);
  return list;
}

export function dismissTimer(id) {
  const list = loadTimers().filter(t => t.id !== id);
  saveTimers(list);
  return list;
}

/** Mark a timer as having already fired its notification, so it isn't re-sent. */
export function markNotified(id) {
  const list = loadTimers().map(t => (t.id === id ? { ...t, notified: true } : t));
  saveTimers(list);
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
