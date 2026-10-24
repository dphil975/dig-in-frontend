/* Occasions engine — "cook for a reason."

   Turns the recipe pool into a full menu for a moment: a date night, or
   hosting — the real focus here. Hosting is treated as its own skill: a
   guest-count toggle (up to 20), a themed menu drawn from the app's real
   8-region system (see lib/regions.js — the same one meal reels/CityFood
   use), a real prep timeline (make-ahead vs. day-of, the core lesson any
   host eventually learns), and theme MEMORY — once you commit to hosting a
   themed night, that theme keeps nudging recommendations afterward instead
   of resetting the moment the event's over (see saveHostedTheme, read by
   recipeRecommender.js's scoreRecipe()).

   Each menu is priced for the cook's income tier (via tierBudget) and set
   against what the same night costs eaten out — so hosting reads as an
   opportunity you can afford, not a splurge you can't. */

import { RECIPES_STATIC, RECIPE_INGREDIENTS } from '../../data/recipesStatic';
import { priceRecipe, getUserTier } from '../tierBudget';
import { REGIONS, REGION_BY_ID, resolveRegion } from '../regions';
import { bonusRecipesFromList } from '../pantryTools';
import { scaleIngredientsToServings } from '../recipeTransform';
import { getCookHistory } from '../../services/saveService';

// Cuisine label for a recipe — prefers the real region system (via country/
// cuisine/region fields the full 575-recipe corpus carries) so a theme like
// "Middle East" (Arabian Night) is actually representable, not just the 3
// keyword-guessed cuisines the old static-set-only version could see.
// Falls back to those keyword rules + Sweets/Comfort only for recipes with
// no resolvable region (mainly the small bundled static set).
const CUISINE_RULES = [
  ['East Asian', /mochi|matcha|mapo|kung pao|bulgogi|japchae|miso|ramen|katsu|okonomiyaki|kimchi|onigiri|sushi|lion'?s head|daifuku|lychee/i],
  ['Italian',    /cacio|pepe|carbonara|cannoli|tiramisu|risotto|pasta/i],
  ['Mexican',    /taco|pastor|salsa|churro|elote/i],
];
export function cuisineOf(recipe) {
  const region = recipe._region || resolveRegion(recipe.country || recipe.cuisine, recipe.region);
  if (region && REGION_BY_ID[region]) return REGION_BY_ID[region].label;
  const n = recipe.name || '';
  for (const [label, re] of CUISINE_RULES) if (re.test(n)) return label;
  if (recipe.recipe_type === 'dessert' || recipe.recipe_type === 'snack') return 'Sweets';
  return 'Comfort';
}

// Course a recipe can fill. Snacks read as appetizers/starters here — most
// hosts' biggest planning gap is realizing a party needs something to eat
// *before* the main hits the table, not just a main and a dessert.
function courseOf(recipe) {
  const t = recipe.recipe_type;
  if (t === 'dinner' || t === 'lunch') return 'main';
  if (t === 'dessert') return 'dessert';
  if (t === 'drink') return 'drink';
  if (t === 'breakfast') return 'brunch';
  if (t === 'snack') return 'appetizer';
  return 'sweet'; // bread / cookies / anything else — a small extra course
}

function ingredientsFor(recipe) {
  return (recipe.ingredients?.length ? recipe.ingredients : (RECIPE_INGREDIENTS[recipe.id] || []))
    .map(x => (typeof x === 'string' ? x : x?.name || '')).filter(Boolean);
}

function byCourseFrom(recipes) {
  const m = { main: [], dessert: [], drink: [], sweet: [], brunch: [], appetizer: [] };
  for (const r of recipes) (m[courseOf(r)] || m.sweet).push(r);
  return m;
}

export const OCCASIONS = {
  'date-night': {
    label: 'Date Night', emoji: '🕯️', defaultCount: 2, fixedCount: true,
    blurb: 'A two-plate night in that beats the reservation.',
    courses: ['main', 'dessert'],
  },
  'host': {
    label: 'Host an Event', emoji: '🎉', defaultCount: 6, fixedCount: false, maxCount: 20,
    blurb: 'Hosting is an art form — the menu, the timeline, and a theme worth remembering.',
    // A real party menu, not just "a main and a dessert": a starter so
    // people have something the moment they walk in, two distinct mains
    // (most hosts underbuild variety — one dish, one option, no choice),
    // a drink, and something sweet on top of the formal dessert.
    courses: ['appetizer', 'main', 'main', 'drink', 'sweet', 'dessert'],
  },
};

// theme (a label like "Middle East") → the canonical region id ("mideast"),
// so a hosted theme can be stored/matched against recipes by id, not label
// text. Only real regions resolve — the keyword-fallback labels (Sweets,
// Comfort, etc.) correctly return null, since they're not a place.
const LABEL_TO_REGION = Object.fromEntries(REGIONS.map(r => [r.label, r.id]));
export function regionIdForTheme(themeLabel) {
  return LABEL_TO_REGION[themeLabel] || null;
}

// Cuisines/regions that have at least one main — the themes worth offering.
export function availableThemes(recipes) {
  const mains = byCourseFrom(recipes).main;
  const counts = {};
  for (const r of mains) counts[cuisineOf(r)] = (counts[cuisineOf(r)] || 0) + 1;
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
}

function pick(list, seed, filterCuisine) {
  let pool = list;
  if (filterCuisine) {
    const matched = list.filter(r => cuisineOf(r) === filterCuisine);
    if (matched.length) pool = matched;
  }
  if (!pool.length) return null;
  return pool[seed % pool.length];
}

/**
 * Build a priced menu for an occasion.
 * @param opts { recipes, occasion, headcount, theme, tier, seed }
 */
export function buildMenu({ recipes, occasion = 'date-night', headcount, theme = null, tier, seed = 0 } = {}) {
  const pool = recipes?.length ? recipes : RECIPES_STATIC;
  const cfg = OCCASIONS[occasion] || OCCASIONS['date-night'];
  const t = tier || getUserTier();
  const cap = cfg.maxCount || 40;
  const count = cfg.fixedCount ? cfg.defaultCount : Math.min(cap, Math.max(1, headcount || cfg.defaultCount));
  const byCourse = byCourseFrom(pool);
  const cuisine = occasion === 'host' ? theme : null;

  const courses = [];
  const seenIds = new Set();
  cfg.courses.forEach((course, i) => {
    let recipe = pick(byCourse[course] || [], seed + i, cuisine);
    // avoid repeating the same dish across courses
    if (recipe && seenIds.has(recipe.id ?? recipe.name)) recipe = pick(byCourse[course] || [], seed + i + 1, cuisine);
    if (!recipe) return;
    seenIds.add(recipe.id ?? recipe.name);
    const priced = priceRecipe(ingredientsFor(recipe), recipe, t);
    courses.push({ course, recipe, perServing: priced.perServing, dineOutPer: priced.dineOutPer });
  });

  const menuPerPerson = +courses.reduce((s, c) => s + c.perServing, 0).toFixed(2);
  const dineOutPerPerson = courses.reduce((s, c) => s + c.dineOutPer, 0);
  const groupTotal = +(menuPerPerson * count).toFixed(2);
  const dineOutGroup = dineOutPerPerson * count;

  // Combined shopping list across the whole menu (deduped, case-insensitive).
  const shopping = [];
  const seenIng = new Set();
  for (const c of courses) for (const ing of ingredientsFor(c.recipe)) {
    const k = ing.toLowerCase();
    if (!seenIng.has(k)) { seenIng.add(k); shopping.push(ing); }
  }

  return {
    occasion, tier: t, headcount: count, maxCount: cap, theme: cuisine,
    courses, menuPerPerson, groupTotal,
    dineOutPerPerson, dineOutGroup,
    savingsGroup: Math.max(0, +(dineOutGroup - groupTotal).toFixed(2)),
    shopping,
  };
}

export const COURSE_LABEL = { main: 'Main', dessert: 'Dessert', drink: 'Drink', sweet: 'Something sweet', brunch: 'Brunch', appetizer: 'Starter' };

// ── Prep timeline — real hosting wisdom, not just a recipe list ──────────
// The core lesson any host eventually learns: split tasks into make-ahead
// vs. day-of so you're not doing everything at once while guests arrive.
// Scaled by how big the menu/guest list actually is. When a real event date
// is set, each step also gets a real calendar date/weekday — "know when to
// start prepping" only lands if it's an actual date, not just "2 days before".
const DAY_MS = 24 * 60 * 60 * 1000;
function fmtStepDate(eventDate, daysBefore) {
  if (!eventDate) return null;
  const d = new Date(eventDate + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  d.setTime(d.getTime() - daysBefore * DAY_MS);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function buildPrepTimeline(menu, eventDate = null) {
  const courseCount = menu.courses.length;
  const big = menu.headcount >= 10 || courseCount >= 4;
  const shelfDays = big ? 4 : 2;
  const aheadDays = big ? 2 : 1;
  const steps = [
    {
      when: big ? '4–5 days before' : '2–3 days before',
      date: fmtStepDate(eventDate, shelfDays),
      title: 'Plan & shop shelf-stable',
      tasks: [
        'Lock the final menu and headcount — one more guest changes your shopping list.',
        'Check for allergies or dietary restrictions before you buy anything.',
        'Buy pantry staples, spices, and anything shelf-stable (rice, dried goods, canned items).',
      ],
    },
    {
      when: big ? '2 days before' : '1 day before',
      date: fmtStepDate(eventDate, aheadDays),
      title: 'Make-ahead prep',
      tasks: [
        'Make sauces, marinades, or doughs — anything that improves overnight in the fridge.',
        'Marinate proteins now, so they’re ready to cook, not ready to start marinating.',
        'Chop anything that holds (onions, aromatics) and store it airtight.',
      ],
    },
    {
      when: 'Day before',
      date: fmtStepDate(eventDate, 1),
      title: 'Fresh shop & set the scene',
      tasks: [
        'Buy perishables — produce, dairy, fresh herbs — the day before, not a week out.',
        'Chill drinks, set the table, count seats and serving dishes.',
        'Write a run sheet for tomorrow: what goes in the oven, and when.',
      ],
    },
    {
      when: 'Morning of',
      date: fmtStepDate(eventDate, 0),
      title: 'Final prep',
      tasks: [
        'Prep vegetables and garnishes — anything that just needs assembling later.',
        'Pull proteins out to come to room temperature before they hit heat.',
        courseCount > 2
          ? 'Stagger your cook times backward from when you want to serve — slowest dish first.'
          : 'Double-check your timeline against when guests actually arrive.',
      ],
    },
    {
      when: big ? '2–3 hours before' : '1 hour before',
      date: fmtStepDate(eventDate, 0),
      title: 'Cook the mains',
      tasks: [
        'Start anything long-cooking now (roasts, braises, breads).',
        'Two mains on the menu means two different timers — cook the one that takes longer first.',
        'Clean the kitchen as you go — a clear counter makes for a calmer host.',
      ],
    },
    {
      when: '30 minutes before',
      date: fmtStepDate(eventDate, 0),
      title: 'Plate & polish',
      tasks: [
        'Final garnishes, warm the serving dishes, plate anything served cold.',
        'Set out the starter first — it buys you the last stretch of kitchen time.',
        'Light the candles, put music on — the cooking is done, the hosting starts now.',
      ],
    },
  ];
  return steps;
}

// ── "Not just food for the party" — the same haul, more recipes ──────────
// A host's shopping trip buys a lot more than the 6-course menu accounts
// for — extras, backups for picky eaters, and next-day leftovers-remixed
// meals. Reuses the same validated overlap logic Meal Plan's "buy once,
// cook more" uses (bonusRecipesFromList, now homed in pantryTools.js
// specifically so both features could share it without a circular import).
export function hostingBonusRecipes(menu, recipes, limit = 8) {
  const excludeIds = menu.courses.map(c => c.recipe.id ?? c.recipe.name);
  return bonusRecipesFromList(menu.shopping, recipes, excludeIds, limit);
}

// ── Practice timeline — hosting is a lost art because nobody tests a menu
// before running it live in front of guests. The blocker is real: nobody
// wants to cook a full 6-serving batch of a recipe they're only "trying
// out," just to have 5 servings of a dish they may not even keep. So every
// practice session is scaled to a single serving (recipeScale.js) — a real
// taste-test, not a wasted party-sized batch. Only recipes the user hasn't
// actually cooked before (per the real cook log, saveService.js — nothing
// fabricated) get scheduled; a dish you've already made doesn't need a
// practice run. ────────────────────────────────────────────────────────
const PRACTICE_COURSE_PRIORITY = { main: 0, appetizer: 1, dessert: 2, sweet: 3, brunch: 4, drink: 5 };
const PRACTICE_RESERVE_DAYS = 7; // leave the final week for buildPrepTimeline's real shop/cook plan

/**
 * Build a practice run for every not-yet-cooked dish on the menu, working
 * backward from the event date (or relative "Week N" labels without one).
 * Mains are practiced first — the highest-stakes, highest-effort dishes get
 * the most attempts before the real thing.
 */
export function buildPracticeTimeline(menu, eventDate = null) {
  if (!menu?.courses?.length) return { sessions: [], allFamiliar: false, alreadyKnown: [], tight: false };

  const cooked = new Set(getCookHistory().map(e => e.id ?? e.name));
  const seen = new Set();
  const candidates = [];
  const alreadyKnown = [];
  for (const c of menu.courses) {
    const key = c.recipe.id ?? c.recipe.name;
    if (seen.has(key)) continue;
    seen.add(key);
    (cooked.has(key) ? alreadyKnown : candidates).push(c);
  }
  if (!candidates.length) return { sessions: [], allFamiliar: true, alreadyKnown, tight: false };

  candidates.sort((a, b) => (PRACTICE_COURSE_PRIORITY[a.course] ?? 9) - (PRACTICE_COURSE_PRIORITY[b.course] ?? 9));
  const n = candidates.length;

  let dates = null;
  let tight = false;
  if (eventDate) {
    const event = new Date(eventDate + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (!Number.isNaN(event.getTime())) {
      const daysUntil = Math.max(0, Math.round((event - today) / DAY_MS));
      const reserve = Math.min(PRACTICE_RESERVE_DAYS, Math.floor(daysUntil / 2));
      const window = Math.max(daysUntil - reserve, 1);
      tight = window < n;
      const spacing = window / (n + 1);
      dates = candidates.map((_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + Math.max(1, Math.round(spacing * (i + 1))));
        return d;
      });
    }
  }

  const sessions = candidates.map((c, i) => {
    const recipe = c.recipe;
    const originalServings = recipe.servings || 4;
    const scaledIngredients = scaleIngredientsToServings(ingredientsFor(recipe), originalServings, 1);
    const when = dates
      ? dates[i].toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : `Week ${i + 1}`;
    return {
      recipe, course: c.course, when, originalServings, scaledIngredients,
      reason: `You haven't made this before — a single-serving test run means you can taste and adjust it before committing a full batch for guests.`,
    };
  });

  return { sessions, allFamiliar: false, alreadyKnown, tight };
}

// ── Practice log — real, user-driven progress ("N of M dishes practiced"),
// not a fabricated skill score. Keyed by recipe id/name, same identity key
// used everywhere else in this file. ──────────────────────────────────────
const PRACTICE_LOG_KEY = 'dig_in_practice_log';

export function loadPracticeLog() {
  try { return JSON.parse(localStorage.getItem(PRACTICE_LOG_KEY) || '{}'); } catch { return {}; }
}

export function markPracticed(recipeKey) {
  const log = loadPracticeLog();
  log[recipeKey] = { practicedAt: Date.now() };
  try { localStorage.setItem(PRACTICE_LOG_KEY, JSON.stringify(log)); } catch { /* ignore */ }
  return log;
}

export function isPracticed(recipeKey, log) {
  return !!(log || loadPracticeLog())[recipeKey];
}

// ── Theme memory — hosting doesn't end when the event does ───────────────
const HOSTED_THEME_KEY = 'dig_in_hosted_theme';

/** Remember the theme you actually committed to hosting. Read by
 * recipeRecommender.js's scoreRecipe() so recommendations keep leaning
 * toward it afterward — an "Arabian Night" host keeps seeing more Middle
 * Eastern dishes surfaced, not just while this page is open. */
export function saveHostedTheme(theme, region) {
  const record = { theme, region, at: Date.now() };
  try { localStorage.setItem(HOSTED_THEME_KEY, JSON.stringify(record)); } catch { /* ignore */ }
  return record;
}

export function loadLastHostedTheme() {
  try { return JSON.parse(localStorage.getItem(HOSTED_THEME_KEY) || 'null'); } catch { return null; }
}

export function clearHostedTheme() {
  try { localStorage.removeItem(HOSTED_THEME_KEY); } catch { /* ignore */ }
}
