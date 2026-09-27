/* mealWindows.js — which meal window is "now".

   Split out of mealTimeBanner.js so the Nova home page (and anything else that
   only needs the clock) doesn't pull in the recommender and meal-plan engine.
   mealTimeBanner.js re-exports these, so old imports still work.

   4 windows, gapless across 24 hours:
     Breakfast    4:31am–11:30am
     Lunch        11:31am–4:00pm  (also the Happy Hour window)
     Dinner       4:01pm–9:00pm
     Late Night   9:00pm–4:30am */

const MIN = (h, m = 0) => h * 60 + m;

export const MEAL_WINDOWS = [
  { id: 'breakfast',  label: 'Breakfast',  recipeType: 'breakfast', startMin: MIN(4, 31),  endMin: MIN(11, 30) },
  { id: 'lunch',      label: 'Lunch',      recipeType: 'lunch',     startMin: MIN(11, 31), endMin: MIN(16, 0), happyHour: true },
  { id: 'dinner',     label: 'Dinner',     recipeType: 'dinner',    startMin: MIN(16, 1),  endMin: MIN(21, 0) },
  { id: 'late-night', label: 'Late Night', recipeType: 'snack',     startMin: MIN(21, 0),  endMin: MIN(4, 30) }, // wraps past midnight
];

function minutesOf(date) { return date.getHours() * 60 + date.getMinutes(); }

/** Which window is active right now (or for a given date, for testing). */
export function currentMealWindow(date = new Date()) {
  const m = minutesOf(date);
  for (const w of MEAL_WINDOWS) {
    if (w.startMin <= w.endMin) {
      if (m >= w.startMin && m <= w.endMin) return w;
    } else if (m >= w.startMin || m <= w.endMin) {
      return w;
    }
  }
  return MEAL_WINDOWS[0];
}
