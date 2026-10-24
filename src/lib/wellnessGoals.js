/* wellnessGoals.js — non-diet wellness support: goal toggles, nutrient
   tags derived from ingredient text, and wellness-adaptive recipe scoring
   that uses healthify.js's substitute lists as the ground truth for which
   recipes carry which micronutrients. */

import { SUGAR_SUBSTITUTES, FLOUR_ALTERNATIVES, FAT_SUBSTITUTES, DAIRY_SUBSTITUTES, STARCH_SUBSTITUTES } from './healthify';

// Local null-safe helpers (used across the Health & Safety sibling files;
// each file keeps its own copy to stay self-contained and avoid circular
// imports between siblings).
function ingredientText(ing) {
  return typeof ing === 'object' && ing !== null ? (ing.text || ing.name || '') : (ing || '');
}

function textOf(ingredients) {
  return (ingredients || []).map(ingredientText).join(' ').toLowerCase();
}

/* wellnessGoals.js — non-diet wellness support: goal toggles, nutrient tags,
   healthy swaps, and a mindful-eating journal.

   Deliberately avoids "diet" / "weight loss" language throughout, per the
   spec this was built from — "nourishing," "energizing," "supporting"
   instead. Nutrient tags are derived from ingredient text via keyword
   matching (same pattern as flavorProfile.js's 8 flavors), not hand-tagged
   per recipe — an honest heuristic, not a lab nutrition analysis.

   NOTE: this section originally imported SUGAR_SUBSTITUTES,
   FLOUR_ALTERNATIVES, FAT_SUBSTITUTES, DAIRY_SUBSTITUTES, and
   STARCH_SUBSTITUTES from './healthify' — those are now same-module
   references, defined in the healthify section above. It also originally
   defined its own local `ingredientText()`; that definition now lives in
   "SHARED HELPERS" near the top of this file (see header note). */

export const WELLNESS_GOALS = [
  { id: 'nutrient-dense',    label: 'Nutrient-dense meals',   blurb: 'Lean toward recipes packed with vitamins, fiber and protein.' },
  { id: 'reduce-sugar',      label: 'Reduce added sugar',     blurb: 'Flag recipes heavy on refined sugar; suggest a swap.' },
  { id: 'increase-protein',  label: 'Increase protein',       blurb: 'Highlight recipes and swaps that add protein.' },
  { id: 'reduce-processed',  label: 'Reduce processed food',  blurb: 'Favor whole-ingredient swaps over packaged shortcuts.' },
  { id: 'more-plants',       label: 'Eat more plants',        blurb: 'Nudge toward vegetable-forward recipes and swaps.' },
  { id: 'support-energy',    label: 'Support my energy',      blurb: 'Favor balanced meals — protein, fiber, healthy fat together.' },
  { id: 'support-digestion', label: 'Support my digestion',   blurb: 'Lean toward fiber-rich, whole-food ingredients.' },
];

const GOALS_KEY = 'dig_in_wellness_goals';

export function loadGoals() {
  try { const v = JSON.parse(localStorage.getItem(GOALS_KEY)); return Array.isArray(v) ? v : []; } catch { return []; }
}

export function toggleGoal(goalId) {
  const set = new Set(loadGoals());
  if (set.has(goalId)) set.delete(goalId); else set.add(goalId);
  const list = [...set];
  try { localStorage.setItem(GOALS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  return list;
}

// ── Nutrient tags — derived from ingredient text, not hand-tagged ─────────
const NUTRIENT_RULES = [
  { id: 'high-protein', label: 'High-Protein',  test: t => /chicken|beef|pork|salmon|tuna|shrimp|tofu|egg|beans|lentil|chickpea|greek yogurt|cottage cheese|protein powder|whey|casein|collagen|peanut butter|almond butter|protein bar/.test(t) },
  { id: 'high-fiber',   label: 'High-Fiber',     test: t => /beans|lentil|chickpea|oats|whole wheat|quinoa|broccoli|brussels|artichoke|chia|flax/.test(t) },
  { id: 'low-carb',     label: 'Low-Carb',       test: t => !/pasta|rice|bread|flour|potato|sugar|noodles|tortilla/.test(t) && /chicken|beef|salmon|egg|salad|vegetable|zucchini|cauliflower/.test(t) },
  { id: 'vegan',        label: 'Vegan',          test: t => !/chicken|beef|pork|fish|salmon|tuna|shrimp|egg|milk|cream|butter|cheese|yogurt|honey|bacon|lamb/.test(t) && /tofu|vegetable|beans|lentil|quinoa|vegan/.test(t) },
  { id: 'vegetarian',   label: 'Vegetarian',     test: t => !/chicken|beef|pork|fish|salmon|tuna|shrimp|bacon|lamb/.test(t) },
  { id: 'gluten-free',  label: 'Gluten-Free',    test: t => !/flour|wheat|pasta|bread|noodles|panko|breadcrumbs|barley/.test(t) },
];

/** Nutrient tags for a recipe's ingredient list — a small, real derived set. */
export function nutrientTags(ingredients) {
  const text = (ingredients || []).map(ingredientText).join(' ').toLowerCase();
  if (!text) return [];
  return NUTRIENT_RULES.filter(r => r.test(text)).map(r => ({ id: r.id, label: r.label }));
}

// ── Wellness-adaptive recipe scoring — additive weight, not a replacement ──
// Maps each goal to the nutrientTags() ids that count as satisfying it.
// reduce-sugar / reduce-processed have no matching nutrient-tag rule, so
// they're read straight off the ingredient text instead.
const GOAL_NUTRIENT_TAGS = {
  'nutrient-dense':    ['high-protein', 'high-fiber'],
  'increase-protein':  ['high-protein'],
  'more-plants':       ['vegan', 'vegetarian'],
  'support-energy':    ['high-protein', 'high-fiber'],
  'support-digestion': ['high-fiber'],
};

/** How well a recipe's ingredients match a user's active wellness goals —
 * a small additive score (0+), never a hard filter. 0 when there are no
 * active goals, or the recipe just doesn't match any of them. */
export function wellnessScore(ingredients, goals) {
  if (!goals || goals.length === 0) return 0;
  const text = (ingredients || []).map(ingredientText).join(' ').toLowerCase();
  if (!text) return 0;
  const tags = new Set(nutrientTags(ingredients).map(t => t.id));
  let score = 0;
  for (const goalId of goals) {
    if (goalId === 'reduce-sugar') {
      if (!/\bsugar\b|corn syrup|frosting|condensed milk/.test(text)) score += 2;
      continue;
    }
    if (goalId === 'reduce-processed') {
      if (!/\bcanned\b|instant|frozen dinner|packaged|processed/.test(text)) score += 1;
      continue;
    }
    const wantTags = GOAL_NUTRIENT_TAGS[goalId];
    if (wantTags && wantTags.some(t => tags.has(t))) score += 2;
  }
  return score;
}

/** True if a recipe carries any nutrient tag at all — used to guarantee
 * every region reel keeps at least one nutrient-tagged option visible even
 * for users with no wellness goals set, without moralizing about the rest. */
export function hasNutrientTag(ingredients) {
  return nutrientTags(ingredients).length > 0;
}

// ── Healthy swaps — matched against what's actually in the recipe. Option
// labels are sourced from healthify.js's richer canonical substitute data
// (also used by the Healthify Lab builder + HealthifyPanel), so there's one
// sugar/flour/fat/dairy substitute list app-wide, not two. ────────────────
const SWAP_RULES = [
  { trigger: /white flour|all-purpose flour|\bflour\b/, swap: 'White flour', options: FLOUR_ALTERNATIVES.map(o => o.label) },
  { trigger: /\bsugar\b/,       swap: 'White sugar',  options: SUGAR_SUBSTITUTES.map(o => o.label) },
  { trigger: /\bbutter\b/,      swap: 'Butter',        options: FAT_SUBSTITUTES.map(o => o.label) },
  { trigger: /\bheavy cream\b/, swap: 'Heavy cream',   options: DAIRY_SUBSTITUTES.map(o => o.label) },
  { trigger: /\bpasta\b/,       swap: 'Pasta',         options: STARCH_SUBSTITUTES.map(o => o.label) },
];

/** Healthy swaps relevant to this specific recipe's ingredients. */
export function healthySwapsFor(ingredients) {
  const text = (ingredients || []).map(ingredientText).join(' ').toLowerCase();
  if (!text) return [];
  const seen = new Set();
  const out = [];
  for (const rule of SWAP_RULES) {
    if (rule.trigger.test(text) && !seen.has(rule.swap)) {
      seen.add(rule.swap);
      out.push({ swap: rule.swap, options: rule.options });
    }
  }
  return out;
}

// ── "I used this swap" — a real, user-driven counter (not fabricated) ─────
const SWAPS_MADE_KEY = 'dig_in_swaps_made';

export function recordSwapMade() {
  const n = parseInt(localStorage.getItem(SWAPS_MADE_KEY) || '0', 10) + 1;
  try { localStorage.setItem(SWAPS_MADE_KEY, String(n)); } catch { /* ignore */ }
  return n;
}

export function getSwapsMadeCount() {
  return parseInt(localStorage.getItem(SWAPS_MADE_KEY) || '0', 10);
}

// ── Mindful-eating journal ──────────────────────────────────────────────
const JOURNAL_KEY = 'dig_in_mindful_journal';

export function loadMindfulJournal() {
  try { const v = JSON.parse(localStorage.getItem(JOURNAL_KEY)); return Array.isArray(v) ? v : []; } catch { return []; }
}

export function logMindfulEntry({ ate, feltBefore, feltDuring, feltAfter }) {
  const list = loadMindfulJournal();
  list.unshift({
    id: `me_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    ate: (ate || '').trim(),
    feltBefore: feltBefore || '',
    feltDuring: feltDuring || '',
    feltAfter: feltAfter || '',
    ts: Date.now(),
  });
  try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  return list;
}

export function removeMindfulEntry(id) {
  const list = loadMindfulJournal().filter(e => e.id !== id);
  try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  return list;
}

export const FEEL_BEFORE_OPTIONS = ['Hungry', 'Stressed', 'Happy', 'Sad', 'Bored', 'Tired', 'Neutral'];
export const FEEL_DURING_OPTIONS = ['Enjoying it', 'Savoring', 'Rushed', 'Distracted', 'Present'];
export const FEEL_AFTER_OPTIONS  = ['Satisfied', 'Energized', 'Heavy', 'Still hungry', 'Tired'];
