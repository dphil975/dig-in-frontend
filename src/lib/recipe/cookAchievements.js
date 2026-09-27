/* cookAchievements.js — real badges from real cook signals.

   No black box: complexityScore() is computed from the recipe's own fields
   (difficulty, step count, ingredient count, total time). Badge unlocking
   reuses the app's existing real signals — getCookingStats()/cookStreak()
   (saveService.js) and the cook timer's own elapsed/estimate — and awards
   through the SAME local-first + pushBadge() path Home/index.jsx's
   awardBadge() already uses (src/pages/Home/index.jsx), so a cook-earned
   badge lands in the one real, cross-device dig_in_badges store, not a
   second parallel one. */

import { getCookHistory, cookStreak } from '../../services/saveService';
import { pushBadge } from '../syncService';

const BADGES_KEY = 'dig_in_badges';

function loadBadges() {
  try { return JSON.parse(localStorage.getItem(BADGES_KEY)) || []; } catch { return []; }
}

/* Exported so other real earn-paths (storeRun.js's shopping runs) award into
   THIS store rather than standing up a second one — the same argument this
   file's header already makes about Home/index.jsx's awardBadge. Still
   idempotent: re-awarding an id you already hold is a no-op returning null. */
export function awardBadge(id, label, icon) {
  const list = loadBadges();
  if (list.some(b => b.id === id)) return null;
  const badge = { id, label, icon, earnedAt: Date.now() };
  try { localStorage.setItem(BADGES_KEY, JSON.stringify([...list, badge])); } catch { /* quota */ }
  pushBadge(badge);
  return badge;
}

/** Deterministic 0-100 complexity score from the recipe's own real fields. */
export function complexityScore(recipe) {
  if (!recipe) return 0;
  const stepCount = (recipe.instructions || recipe.steps || []).length;
  const ingredientCount = (recipe.ingredients || []).length;
  const totalTime = recipe.totalTime || recipe.total_time
    || ((recipe.prepTime || 0) + (recipe.cookTime || 0)) || recipe.time || 0;
  const difficultyBonus = { easy: 0, medium: 15, hard: 30, advanced: 30 }[
    String(recipe.difficulty || '').toLowerCase()
  ] || 0;
  const score = stepCount * 4 + ingredientCount * 2 + Math.min(totalTime, 90) / 2 + difficultyBonus;
  return Math.round(Math.min(100, score));
}

const STREAK_BADGES = [
  [3,  'streak-3',  '3-Day Streak',     '🔥'],
  [7,  'streak-7',  'Consistency',      '🗓️'],
  [14, 'streak-14', 'Two-Week Streak',  '📅'],
  [30, 'streak-30', 'Monthly Regular',  '🏆'],
];

/**
 * Check real signals after a cook completes and award any newly-unlocked
 * badge. Returns the badges newly awarded (usually 0 or 1) so the caller can
 * surface a "Nova's proud of you" callout.
 */
export function checkAchievements({ recipe, elapsedMin, estimateMin } = {}) {
  const newly = [];
  const streak = cookStreak(getCookHistory());

  if (elapsedMin != null && estimateMin != null && estimateMin > 0 && elapsedMin <= estimateMin - 5) {
    const b = awardBadge('speed-run', 'Speed Run', '⚡');
    if (b) newly.push(b);
  }

  const score = complexityScore(recipe);
  const isHardDifficulty = /hard|advanced/i.test(recipe?.difficulty || '');
  if (isHardDifficulty || score >= 60) {
    const b = awardBadge('complexity-climber', 'Complexity Climber', '🧗');
    if (b) newly.push(b);
  }

  for (const [n, id, label, icon] of STREAK_BADGES) {
    if (streak < n) break; // thresholds are ascending — stop at the first unmet one
    const b = awardBadge(id, label, icon);
    if (b) newly.push(b);
  }

  return newly;
}

/** A self-reported "that was hard" from the 15-min reflection is the same
    complexity signal checkAchievements() reads off the recipe's own fields —
    same badge, either path can award it. */
export function checkReflectionAchievements({ complexity } = {}) {
  const newly = [];
  if (complexity === 'hard') {
    const b = awardBadge('complexity-climber', 'Complexity Climber', '🧗');
    if (b) newly.push(b);
  }
  return newly;
}
