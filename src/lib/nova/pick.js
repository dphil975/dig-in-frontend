/* pick.js — how Nova picks the right recipe.

   One dish, chosen from what she knows:
     • the check-in       today's mood shapes time, effort and comfort
     • the meal window    breakfast / lunch / dinner / late night, by the clock
     • life context       the season of life you set, and who you usually cook for
     • the biofield       how well a dish resonates with your welcome answers
     • taste              the flavor profile built from what you save, cook and skip
     • the thread         nothing shown, swapped or cooked lately comes back
     • the pantry         a dish that uses something about to turn gets a lift
   Allergens you've flagged and ingredients on a recall never make the list.

   Pure logic over the recipe list — no React. It's meant to move server-side
   eventually; the home screen only calls pickForNow() and renders the answer. */

import { currentMealWindow } from '../recipe/mealWindows';
import { recipeFlavors, loadFlavorProfile } from '../flavor/flavorProfile';
import { MorphogeneticField, checkRecipeRecalls } from '../recipe/starterEngine';
import { flaggedAllergensInRecipe } from '../health/allergyProfile';
import { activeLifeMode } from '../personalization/lifeMode';
import { getAnswers } from '../personalization/onboarding';
import { expiringItems } from '../pantry/shelfLife';
import { MOOD_BY_ID } from './kindnessProtocol';
import { recentSignals, dayKey } from './thread';
import { NOVA_SAYS, becauseMood, pickMeUpReason, useItUpReason, tasteReason, windowReason } from './voice';

/* ── Reading a recipe ────────────────────────────────────────────────────── */

const minutesOf = (r) => r.total_time || r.totalTime || r.time || ((r.prepTime || 0) + (r.cookTime || 0)) || 0;
const linesOf = (r) => (r.ingredients || []).map((i) => (typeof i === 'string' ? i : i?.name || i?.text || '')).filter(Boolean);
const keyOf = (r) => String(r.id ?? r.name ?? '');
const isEasy = (r) => /easy/i.test(r.difficulty || '');

// Which recipe types fit each window, and how well.
const TYPE_FIT = {
  breakfast: { breakfast: 6 },
  lunch: { lunch: 6, dinner: 2, snack: 1 },
  dinner: { dinner: 6, lunch: 2 },
  'late-night': { snack: 6, dessert: 3 },
};

// A little day-stable variety so near-equal dishes don't win every day.
function jitter(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
}

/* ── Pick-me-up ingredients ──────────────────────────────────────────────── */

// The ingredients people reach for on a given kind of day. Comfort and ease,
// not medicine — Nova offers food, never a treatment.
const PICK_ME_UP = {
  tired: ['egg', 'spinach', 'lentil', 'oat', 'banana', 'almond', 'yogurt', 'quinoa', 'sweet potato', 'bean'],
  stressed: ['oat', 'almond', 'spinach', 'avocado', 'salmon', 'banana', 'yogurt', 'sweet potato'],
  anxious: ['oat', 'banana', 'almond', 'turkey', 'spinach', 'avocado', 'yogurt'],
  overwhelmed: ['egg', 'rice', 'toast', 'soup', 'pasta', 'potato'],
  sad: ['chocolate', 'pasta', 'bread', 'cinnamon', 'rice', 'potato', 'cheese', 'butter'],
  lonely: ['soup', 'stew', 'bread', 'pasta', 'rice', 'dumpling', 'potato'],
  angry: ['mint', 'cucumber', 'lemon', 'lime', 'ginger', 'chili', 'yogurt'],
};
const PICK_ME_UP_RX = Object.fromEntries(
  Object.entries(PICK_ME_UP).map(([mood, keys]) => [mood, keys.map((k) => ({ k, rx: new RegExp(`\\b${k}(e?s)?\\b`, 'i') }))]),
);

/** Which pick-me-up ingredients a recipe actually contains for a mood. */
export function pickMeUpMatches(recipe, moodId) {
  const table = PICK_ME_UP_RX[moodId];
  if (!table) return [];
  const text = linesOf(recipe).join(' | ');
  return table.filter(({ rx }) => rx.test(text)).map(({ k }) => k);
}

/* ── Scoring pieces ──────────────────────────────────────────────────────── */

function moodScore(mood, { minutes, easy, nIng, flavors }) {
  const has = (f) => flavors.includes(f);
  switch (mood) {
    case 'tired':
      return (minutes <= 20 ? 4 : minutes <= 30 ? 2 : minutes > 45 ? -4 : 0) + (easy ? 2 : -1) + (nIng <= 8 ? 1 : 0);
    case 'stressed':
      return (easy ? 3 : -1) + (minutes <= 30 ? 2 : minutes > 60 ? -2 : 0) + (has('savory') || has('rich') ? 1 : 0);
    case 'anxious':
    case 'overwhelmed':
      return (easy ? 3 : -2) + (minutes <= 25 ? 2 : minutes > 45 ? -3 : 0) + (nIng <= 8 ? 2 : 0);
    case 'sad':
    case 'lonely':
      return (has('rich') || has('savory') ? 3 : 0) + (minutes <= 60 ? 1 : 0) + (easy ? 1 : 0);
    case 'angry':
      return (has('spicy') || has('tangy') ? 2 : 0) + (minutes <= 45 ? 1 : 0);
    case 'happy':
      return (minutes >= 25 ? 1 : 0) + (has('sweet') || has('rich') ? 1 : 0);
    case 'calm':
      return (minutes >= 20 && minutes <= 75 ? 2 : 0) + (has('light') || has('earthy') ? 1 : 0);
    default:
      return 0;
  }
}

function lifeScore(mode, { minutes, easy, nIng, servings, flavors }) {
  const comfort = flavors.includes('rich') || flavors.includes('savory');
  switch (mode?.id) {
    case 'moved': return (easy ? 2 : 0) + (nIng <= 8 ? 2 : 0);
    case 'broke': return (nIng <= 7 ? 2 : 0) + (easy ? 1 : 0);
    case 'one': return servings ? (servings <= 2 ? 2 : servings >= 6 ? -2 : 0) : 0;
    case 'grief': return (easy ? 3 : -2) + (comfort ? 1 : 0);
    case 'baby': return minutes <= 15 ? 4 : minutes <= 30 ? 1 : -3;
    default: return 0;
  }
}

function tasteScore(flavors, profile) {
  let s = 0;
  for (const f of flavors) s += Math.max(-20, Math.min(80, profile[f] || 0)) / 15;
  return Math.max(-3, Math.min(4, s));
}

const singular = (w) => w.replace(/(e?s)$/i, '');
function usesPantryItem(lines, itemName) {
  const word = singular(String(itemName || '').toLowerCase().replace(/[^a-z\s]/g, ' ').trim());
  if (word.length < 3) return false;
  const rx = new RegExp(`\\b${word}(e?s)?\\b`, 'i');
  return lines.some((l) => rx.test(l));
}

/* ── What Nova knows about you ───────────────────────────────────────────── */

function loadPantry() {
  try { const v = JSON.parse(localStorage.getItem('dig_in_pantry')); return Array.isArray(v) ? v : []; }
  catch { return []; }
}

function savedKeys() {
  try {
    const v = JSON.parse(localStorage.getItem('dig_in_saved') || '[]');
    return new Set((Array.isArray(v) ? v : []).map((r) => String(r?.id ?? r?.name ?? '')));
  } catch { return new Set(); }
}

const SOCIAL_LABEL = { solo: 'solo', couple: 'for two', group: 'for a group', batch: 'meal prep' };

/** The pieces of you the engine reads, gathered once per pick. */
export function loadNovaContext(now = new Date()) {
  const answers = getAnswers();
  const biofield = answers ? MorphogeneticField.fromAnswers(answers) : null;
  const pantry = loadPantry();
  const likedCuisines = Array.isArray(answers?.cuisine) ? new Set(answers.cuisine.map((c) => c.toLowerCase())) : new Set();
  return {
    answers,
    biofield,
    available: answers?.time ? biofield.time : 0,
    social: biofield ? SOCIAL_LABEL[biofield.social] || '' : '',
    lifeMode: activeLifeMode(now),
    profile: loadFlavorProfile(),
    likedCuisines,
    signals: recentSignals(now.getTime()),
    pantry,
    expiring: expiringItems(pantry, { now, withinDays: 3 }).filter((e) => e.daysLeft >= -1),
    saved: savedKeys(),
  };
}

/** How many minutes Nova assumes you have — from your welcome answer, if any. */
export function minutesAvailable() {
  const a = getAnswers();
  return a?.time ? MorphogeneticField.fromAnswers(a).time : 0;
}

/* ── The pick ────────────────────────────────────────────────────────────── */

// Safety runs last, on the ranked list, so it only touches the few dishes that
// are actually in the running: nothing you've flagged as an allergen and nothing
// with an ingredient on a recall is ever offered.
function isSafe(recipe) {
  const lines = linesOf(recipe);
  return !flaggedAllergensInRecipe(lines).length && !checkRecipeRecalls(lines).length;
}

function scoreOne(r, ctx, { window, mood, pickMeUp, today }) {
  const fit = TYPE_FIT[window.id]?.[(r.recipe_type || '').toLowerCase()];
  if (fit == null) return null;

  const lines = linesOf(r);
  const minutes = minutesOf(r);
  const flavors = recipeFlavors(r);
  const parts = { minutes, easy: isEasy(r), nIng: lines.length, servings: Number(r.servings) || 0, flavors };
  const key = keyOf(r);
  const why = {};
  let score = fit;

  // Left alone, a meal pick should be something you can actually make tonight.
  score += parts.easy ? 1.5 : /medium/i.test(r.difficulty || '') ? 0.5 : -1;
  if (minutes) score += minutes <= 45 ? 1 : minutes > 90 ? -2 : 0;

  score += moodScore(mood, parts);
  score += lifeScore(ctx.lifeMode, parts);

  if (ctx.available && minutes) {
    score += minutes <= ctx.available ? 1 : minutes <= ctx.available * 1.5 ? -1 : -3;
  }
  if (ctx.biofield) score += MorphogeneticField.resonance(ctx.biofield, r) * 4;
  if (ctx.biofield?.social === 'solo' && parts.servings) score += parts.servings <= 2 ? 1.5 : 0;
  if ((ctx.biofield?.social === 'group' || ctx.biofield?.social === 'batch') && parts.servings) score += parts.servings >= 4 ? 1.5 : 0;

  score += tasteScore(flavors, ctx.profile);
  const topFlavor = flavors
    .map((f) => [f, ctx.profile[f] || 0])
    .sort((a, b) => b[1] - a[1])[0];
  if (topFlavor && topFlavor[1] >= 12) why.taste = topFlavor[0];

  // Cuisine affinity: lift dishes from cuisines the user said they love.
  if (ctx.likedCuisines?.size) {
    const rc = (r.cuisine || r.country || '').toLowerCase();
    if (rc && ctx.likedCuisines.has(rc)) { score += 2.5; why.cuisine = rc; }
  }

  // Pick-me-up: after a rough day, lean on the ingredients that help.
  const helpers = pickMeUpMatches(r, pickMeUp || mood);
  if (pickMeUp && helpers.length) { score += Math.min(3, helpers.length) * 2; why.helpers = helpers; }
  else if (helpers.length) score += Math.min(2, helpers.length) * 0.5;

  // Use what's about to turn.
  const usesUp = ctx.expiring.find((e) => usesPantryItem(lines, e.item.name));
  if (usesUp) { score += 3; why.usesUp = usesUp.item.name; }

  if (ctx.saved.has(key)) score += 1;

  // Don't repeat yourself.
  if (ctx.signals.shown.has(key)) score -= 6;
  if (ctx.signals.cooked.has(key)) score -= 10;
  if (ctx.signals.swapped.has(key)) score -= 8;
  const cuisine = r.cuisine || r.country;
  if (cuisine && ctx.signals.cuisines[0] === cuisine) score -= 1;

  score += jitter(`${today}:${key}`) * 1.2;
  return { recipe: r, score, why, minutes };
}

/**
 * Pick one dish for right now.
 *   mood     today's check-in (a mood id), or null when skipped / not yet
 *   pickMeUp a mood id carried over from a follow-up ("still rough"), or null
 *   skipIds  dishes already shown or swapped away this visit
 * Returns { recipe, reason, tone, minutes, social } or null if nothing fits.
 */
export function pickForNow(recipes, { now = new Date(), mood = null, pickMeUp = null, skipIds = [], ctx = null } = {}) {
  if (!Array.isArray(recipes) || !recipes.length) return null;
  const context = ctx || loadNovaContext(now);
  const window = currentMealWindow(now);
  const skip = new Set(skipIds.map(String));
  const today = dayKey(now.getTime());

  const ranked = [];
  for (const r of recipes) {
    if (skip.has(keyOf(r))) continue;
    const s = scoreOne(r, context, { window, mood, pickMeUp, today });
    if (s) ranked.push(s);
  }
  ranked.sort((a, b) => b.score - a.score);
  const best = ranked.find((x) => isSafe(x.recipe));
  if (!best) return null;

  const moodLabel = MOOD_BY_ID[mood]?.label;
  const followLabel = MOOD_BY_ID[pickMeUp]?.label;
  // She has your welcome answers, but hasn't learned anything from what you do yet.
  const knowsLittle = !Object.keys(context.profile).length && context.signals.cooked.size === 0
    && !context.likedCuisines?.size;

  let reason; let tone;
  if (pickMeUp && best.why.helpers) { reason = pickMeUpReason(followLabel, best.why.helpers); tone = 'pickmeup'; }
  else if (mood) { reason = becauseMood(mood, moodLabel); tone = 'mood'; }
  else if (best.why.usesUp) { reason = useItUpReason(best.why.usesUp); tone = 'pantry'; }
  else if (best.why.taste) { reason = tasteReason(best.why.taste); tone = 'taste'; }
  else if (best.why.cuisine) { reason = windowReason(window.id); tone = 'window'; }
  else if (knowsLittle) { reason = NOVA_SAYS.pickIntro; tone = 'intro'; }
  else { reason = windowReason(window.id); tone = 'window'; }

  return { recipe: best.recipe, reason, tone, minutes: best.minutes, social: context.social };
}

/** A few quick, easy dishes for right now — Nova's quick picks on the Recipes
    page. Dishes that suit the current meal window come first, so at dinner time
    they are dinners, not a 5-minute snack. */
export function quickPicks(recipes, { count = 3, now = new Date() } = {}) {
  if (!Array.isArray(recipes)) return [];
  const ctx = loadNovaContext(now);
  const window = currentMealWindow(now);
  const today = dayKey(now.getTime());
  const out = [];
  for (const r of recipes) {
    const type = (r.recipe_type || '').toLowerCase();
    if (type === 'drink' || type === 'dessert') continue;
    const minutes = minutesOf(r);
    // Allow up to 45 min so the pool is large enough for taste-scoring to matter;
    // medium-difficulty recipes also qualify so cuisine/flavor signals can surface.
    if (!minutes || minutes > 45) continue;
    if (!/easy|medium/i.test(r.difficulty || 'easy')) continue;
    const key = keyOf(r);
    const fit = TYPE_FIT[window.id]?.[type] || 0;
    const rc = (r.cuisine || r.country || '').toLowerCase();
    const cuisineBoost = ctx.likedCuisines?.size && rc && ctx.likedCuisines.has(rc) ? 1.5 : 0;
    let score = fit + (10 - minutes / 5) * 0.3 + tasteScore(recipeFlavors(r), ctx.profile) + cuisineBoost + jitter(`${today}:q:${key}`);
    if (ctx.signals.cooked.has(key)) score -= 10;
    out.push({ recipe: r, score });
  }
  return out
    .sort((a, b) => b.score - a.score)
    .map((x) => x.recipe)
    .filter(isSafe)
    .slice(0, count);
}
