/* mealMood.js — the "show me dinner" handoff.

   When someone opens the app and taps the meal-time prompt, they pick which of
   the 8 flavors they're in the mood for (and, optionally, flag themselves a
   picky eater). That choice is stashed here and read by the swipe feed (the
   Tinder-scroll), which reorders its deck toward those flavors using the SAME
   `cravings` boost the recipe recommender already scores against
   (lib/recipeRecommender.scoreRecipe) — so this isn't a new ranking model, it's
   the existing one, aimed by a one-tap mood. Session-scoped: a mood is for
   right now, not forever, so it lives in sessionStorage and clears when the
   tab does. */

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
