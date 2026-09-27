/* cookReflection.js — the 15-minutes-later "how'd it go?" reflection.

   Was calling a python/vault_routes.py /vault/nudges/* endpoint that was
   never actually implemented anywhere in this repo — meaning nothing ever
   scheduled a reflection, and CookReflectionPrompt (mounted globally in
   App.jsx) never had anything to show. Scheduled locally instead: no live
   in-tab timer — checked on page load/navigation instead (CookReflectionPrompt
   re-checks on every route change), same "pulled on open, no background
   push" honesty convention as every other delayed-reminder feature in this
   app (Nudges, GlobalFood's holiday reminders). */

const KEY = 'dig_in_pending_reflections';
const DELAY_MS = 15 * 60 * 1000;
const EXPIRE_MS = 3 * 24 * 60 * 60 * 1000; // unanswered after 3 days — stop asking

function load() {
  try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; }
  catch { return []; }
}

function persist(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* quota */ }
}

// Drop answered entries and long-stale unanswered ones so this never grows
// without bound.
function prune(list) {
  const now = Date.now();
  return list.filter(r => !r.answered && (now - r.cookedAt) < EXPIRE_MS);
}

/** Called right when a cook completes (RecipeFull's madeThis()) — queues the
    15-minutes-later check-in for that specific dish. */
export function scheduleReflection({ recipeName, cookedAt }) {
  const list = prune(load());
  list.push({
    ref_id: `refl_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    recipeName: recipeName || 'that dish',
    cookedAt: cookedAt || Date.now(),
    answered: false,
  });
  persist(list);
}

/** The oldest due reflection for this device, or null if none. */
export async function checkPendingReflection() {
  const list = prune(load());
  persist(list);
  const now = Date.now();
  const due = list
    .filter(r => (now - r.cookedAt) >= DELAY_MS)
    .sort((a, b) => a.cookedAt - b.cookedAt)[0];
  if (!due) return null;
  return { ref_id: due.ref_id, message: `How'd ${due.recipeName} turn out?` };
}

/** Record the reflection answer so it stops showing. */
export async function answerReflection(refId, { complexity, timingFelt, wouldAgain }) {
  const list = load();
  const idx = list.findIndex(r => r.ref_id === refId);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], answered: true, complexity, timingFelt, wouldAgain, answeredAt: Date.now() };
  persist(list);
  return true;
}
