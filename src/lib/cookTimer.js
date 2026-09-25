/* cookTimer.js — the visible timer while stepping through a recipe.

   Survives refresh/navigation away (stamped in localStorage, not component
   state) so leaving the step view and coming back doesn't reset it. One
   in-flight timer per recipe id. */

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
