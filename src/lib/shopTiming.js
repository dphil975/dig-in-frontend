/* "Best time to shop" — a behavioral model, NOT a live feed.

   There is no free, open-source live foot-traffic API (SafeGraph / Placer /
   Google Popular Times are all proprietary), so this encodes the well-known
   grocery "popular times" shape: quiet early mornings, a midday bump, and a big
   after-work 4–7pm peak on weekdays; a late-morning peak on weekends. It's used
   to tell a shopper when the aisles (and the parking lot) are calmest.

   This matters most in car-dependent metros — Dallas, Houston, most of the
   Sun Belt — where you can't just walk over off-peak; you drive, and the lot
   peaks with the crowd. Those boroughs get sharper peaks + a parking note.

   The fast-food-rush windows (lunch/dinner) are when people default to a
   drive-thru — often not because they want to, but because they don't know what
   to make. fastFoodSpike() flags those moments so the app can intercept with a
   "here's what you can cook right now" nudge instead. */

// Relative busyness 0–100 by hour, weekday vs weekend. Hand-shaped to match
// typical US grocery popular-times curves.
const WEEKDAY = [5, 4, 3, 3, 4, 8, 15, 24, 34, 42, 48, 55, 60, 55, 50, 54, 66, 82, 88, 78, 60, 42, 26, 12];
const WEEKEND = [6, 4, 3, 3, 4, 7, 14, 26, 42, 60, 78, 88, 90, 84, 76, 70, 66, 60, 52, 44, 34, 24, 15, 9];

// Boroughs where you drive to the store and the lot peaks with the crowd —
// the Sun Belt / non-walkable set we've plotted. Sharper peaks + parking note.
const CAR_DEPENDENT = new Set([
  'texas', 'florida', 'georgia', 'alabama', 'mississippi', 'louisiana',
  'tennessee', 'south-carolina', 'north-carolina', 'kentucky', 'west-virginia',
]);

export function isCarDependent(borough) { return CAR_DEPENDENT.has(borough); }

/** Busyness 0–100 for a store at a given time (default now). */
export function busynessAt(store, date = new Date()) {
  const day = date.getDay();       // 0 Sun … 6 Sat
  const hour = date.getHours();
  const weekend = day === 0 || day === 6;
  let level = (weekend ? WEEKEND : WEEKDAY)[hour];
  // Car-dependent metros: exaggerate the peaks (everyone arrives in the same
  // narrow after-work / weekend-midday window).
  if (store && isCarDependent(store.borough) && level > 55) {
    level = Math.min(100, Math.round(level * 1.12));
  }
  return level;
}

export function busynessLabel(level) {
  if (level < 25) return 'Quiet';
  if (level < 50) return 'Steady';
  if (level < 75) return 'Busy';
  return 'Packed';
}

// The calmest windows to recommend, phrased for a shopper.
export function bestWindow(date = new Date()) {
  const day = date.getDay();
  if (day === 0) return 'Sunday gets busy 11am–2pm — go before 10am or after 6pm.';
  if (day === 6) return 'Saturday peaks late morning — go before 9am or after 6pm.';
  return 'Weekdays are calmest before 10am or after 8pm — dodge the 4–7pm rush.';
}

/** Is it a fast-food rush right now? Lunch and dinner drive-thru peaks. */
export function fastFoodSpike(date = new Date()) {
  const h = date.getHours(), m = date.getMinutes();
  const t = h + m / 60;
  if (t >= 11.5 && t <= 13.5) return { active: true, meal: 'lunch' };
  if (t >= 17 && t <= 19.5) return { active: true, meal: 'dinner' };
  return { active: false, meal: null };
}
