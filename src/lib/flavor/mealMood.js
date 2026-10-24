/* ════════════════════════════════════════════════════════════
   MEAL MOOD — merged module.

   Consolidates two formerly-separate lib/ files:
     - mealMood.js    (the "show me dinner" flavor-mood handoff)
     - moodColor.js   (a color-first skin on the same flavor-mood system)

   Each section below is marked with the name of the original file it came
   from. Nothing was renamed — the two files' exports didn't collide. The
   old flat files (src/lib/mealMood.js, src/lib/moodColor.js) now just
   re-export from here so existing imports keep working.
   ════════════════════════════════════════════════════════════ */

import { loadFlavorProfile } from '../flavorProfile';

/* ────────────────────────────────────────────────────────────
   From mealMood.js
   ────────────────────────────────────────────────────────────
   The "show me dinner" handoff.

   When someone opens the app and taps the meal-time prompt, they pick which of
   the 8 flavors they're in the mood for (and, optionally, flag themselves a
   picky eater). That choice is stashed here and read by the swipe feed (the
   Tinder-scroll), which reorders its deck toward those flavors using the SAME
   `cravings` boost the recipe recommender already scores against
   (lib/recipeRecommender.scoreRecipe) — so this isn't a new ranking model, it's
   the existing one, aimed by a one-tap mood. Session-scoped: a mood is for
   right now, not forever, so it lives in sessionStorage and clears when the
   tab does.
   ──────────────────────────────────────────────────────────── */

const KEY = 'dig_in_meal_mood';

// The 8 flavors — the exact vocabulary flavorProfile.FLAVORS / recipeFlavors
// score against, so a picked flavor actually moves the deck.
export const MOOD_FLAVORS = [
  { key: 'spicy',  label: 'Spicy',  emoji: '🌶️' },
  { key: 'sweet',  label: 'Sweet',  emoji: '🍯' },
  { key: 'savory', label: 'Savory', emoji: '🍄' },
  { key: 'rich',   label: 'Rich',   emoji: '🧈' },
  { key: 'light',  label: 'Light',  emoji: '🥗' },
  { key: 'earthy', label: 'Earthy', emoji: '🫘' },
  { key: 'smoky',  label: 'Smoky',  emoji: '🔥' },
  { key: 'tangy',  label: 'Tangy',  emoji: '🍋' },
];

export function saveMealMood({ flavors = [], picky = false, meal = 'dinner' } = {}) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({
      flavors: [...new Set(flavors)].filter(Boolean),
      picky: !!picky,
      meal,
      at: Date.now(),
    }));
  } catch { /* ignore */ }
}

export function loadMealMood() {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY));
    if (v && Array.isArray(v.flavors)) return v;
  } catch { /* ignore */ }
  return null;
}

export function clearMealMood() {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}

/* ────────────────────────────────────────────────────────────
   From moodColor.js
   ────────────────────────────────────────────────────────────
   A color-first skin on the app's existing flavor-mood system.

   The color-picker concept asks users to tap a color instead of a flavor
   word. Rather than invent a parallel taste vocabulary, each color maps onto
   one of the app's existing 8 flavors (flavorProfile.js) — so a color pick
   feeds the exact same recommendation pipeline a flavor-chip pick already
   does. This section only adds the color skin, plus a small honest insight on
   top: how the colors someone reaches for compare to what they actually
   save and cook (loadFlavorProfile — a second, independent signal, not a
   restatement of the color→flavor map below).
   ──────────────────────────────────────────────────────────── */

export const MOOD_COLORS = [
  { id: 'red',    label: 'Red',    emotion: 'Passion / Energy', flavor: 'spicy',  swatch: '#D64545', blurb: 'Bold and fired up.' },
  { id: 'blue',   label: 'Blue',   emotion: 'Calm / Serenity',  flavor: 'light',  swatch: '#3E6FB0', blurb: 'Soothing, easy on the senses.' },
  { id: 'yellow', label: 'Yellow', emotion: 'Optimism',         flavor: 'tangy',  swatch: '#E8B93E', blurb: 'Bright and vibrant.' },
  { id: 'green',  label: 'Green',  emotion: 'Renewal',          flavor: 'earthy', swatch: '#5C8A4A', blurb: 'Fresh, vegetable-forward.' },
  { id: 'purple', label: 'Purple', emotion: 'Creativity',       flavor: 'savory', swatch: '#7A5EA8', blurb: 'Layered and complex.' },
  { id: 'orange', label: 'Orange', emotion: 'Comfort',          flavor: 'rich',   swatch: '#D9822B', blurb: 'Warm and comforting.' },
  { id: 'gray',   label: 'Gray',   emotion: 'Melancholy',       flavor: 'smoky',  swatch: '#767676', blurb: 'Rich, hearty, grounding.' },
];

export const COLOR_BY_ID = Object.fromEntries(MOOD_COLORS.map(c => [c.id, c]));

export function flavorForColor(colorId) {
  return COLOR_BY_ID[colorId]?.flavor || null;
}

const LOG_KEY = 'dig_in_mood_log';
const LOG_CAP = 200;

function loadLog() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return []; }
}
function saveLog(log) {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-LOG_CAP))); } catch { /* ignore */ }
}

/** Record a color mood pick, for the pattern insight below. */
export function recordMoodPick(colorId) {
  const c = COLOR_BY_ID[colorId];
  if (!c) return;
  const log = loadLog();
  log.push({ colorId, flavor: c.flavor, ts: Date.now() });
  saveLog(log);
}

const MIN_SAMPLE = 3; // don't guess at a pattern from 1-2 taps

/**
 * A plain-English read of which color the user reaches for most, cross-checked
 * against their real flavor-engagement profile (what they actually save/cook,
 * tracked independently by flavorProfile.js) — generated from the two real
 * tallies, not fabricated.
 */
export function moodInsight() {
  const log = loadLog();
  if (log.length < MIN_SAMPLE) return null;

  const counts = {};
  for (const e of log) counts[e.colorId] = (counts[e.colorId] || 0) + 1;
  const [topColorId, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const c = COLOR_BY_ID[topColorId];
  if (!c) return null;
  const pct = Math.round((topCount / log.length) * 100);

  const engaged = loadFlavorProfile();
  const engagedEntries = Object.entries(engaged).filter(([, v]) => v > 0);
  const engagedTop = engagedEntries.sort((a, b) => b[1] - a[1])[0]?.[0];

  let text = `${pct}% of your mood check-ins (${topCount} of ${log.length}) have leaned ${c.label} — ${c.emotion.toLowerCase()}.`;
  if (engagedTop && engagedTop !== c.flavor) {
    text += ` But what you actually save and cook skews ${engagedTop} — worth noticing next time you check in.`;
  } else if (engagedTop === c.flavor) {
    text += ` That tracks with what you actually cook, too.`;
  }

  return { colorId: topColorId, color: c, count: topCount, total: log.length, text };
}
