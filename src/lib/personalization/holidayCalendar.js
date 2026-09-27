/* holidayCalendar.js — cultural & religious food holidays, and how to shop
   for them.

   Dates are real, verified 2026 calendar dates where a holiday falls on a
   fixed or externally-published date. Where a holiday depends on moon
   sighting (Ramadan/Eid, the Islamic calendar generally) or has no fixed
   single day (Hanami — cherry blossom season), that's marked explicitly with
   a `dateCaveat` instead of a fabricated precise date — same honesty
   convention as the rest of this app's "estimate, not a live feed" data
   (see shopTiming.js, foodAccessStress.js).

   `ethnicStoreTypes` maps a holiday to FoodMap's real store `type` values
   (see storeData.js STORE_COLORS) so "find nearby stores" is a real filter,
   not a stub. Left empty where no FoodMap type fits (there's no dedicated
   "kosher" or general "European" store type yet) rather than force a wrong
   mapping. `countryIds` links to GlobalFood's country cards for the food
   content itself, since the static recipe set's cuisine detection
   (occasions.js's cuisineOf()) is too narrow to cover most of these. */

import { BOROUGHS, STORE_FILE_BY_BOROUGH } from '../../data/storeData';
import { haversineKm, loadLocation } from '../../services/geoService';

export const HOLIDAYS = [
  { id: 'lunar-new-year', label: 'Lunar New Year', dateISO: '2026-02-17', region: 'East & Southeast Asia',
    blurb: 'Dumplings, nian gao, whole fish for abundance.', ethnicStoreTypes: ['asian'], countryIds: ['china', 'japan', 'korea', 'vietnam'] },
  { id: 'ramadan-start', label: 'Ramadan begins', dateISO: '2026-02-17', dateCaveat: 'Start depends on moon sighting — official date may shift by a day.',
    region: 'Global Muslim communities', blurb: 'Dates and iftar staples for the fasting month ahead.', ethnicStoreTypes: ['middle_eastern', 'south_asian'], countryIds: ['lebanon', 'morocco'] },
  { id: 'st-patricks', label: "St. Patrick's Day", dateISO: '2026-03-17', region: 'Ireland / Irish diaspora',
    blurb: 'Corned beef, cabbage, soda bread.', ethnicStoreTypes: [], countryIds: [] },
  { id: 'eid-al-fitr', label: 'Eid al-Fitr', dateISO: '2026-03-19', dateCaveat: 'Depends on moon sighting at the end of Ramadan — may land a day earlier or later.',
    region: 'Global Muslim communities', blurb: 'The fast-breaking feast — dates, baklava, festive rice dishes.', ethnicStoreTypes: ['middle_eastern', 'south_asian'], countryIds: ['lebanon', 'morocco'] },
  { id: 'easter', label: 'Easter', dateISO: '2026-04-05', region: 'Global Christian communities',
    blurb: 'Hot cross buns, lamb, Easter bread.', ethnicStoreTypes: [], countryIds: ['italy', 'greece'] },
  { id: 'cinco-de-mayo', label: 'Cinco de Mayo', dateISO: '2026-05-05', region: 'Mexico / Mexican diaspora',
    blurb: 'Tacos, guacamole, chiles rellenos.', ethnicStoreTypes: ['latino'], countryIds: ['mexico'] },
  { id: 'juneteenth', label: 'Juneteenth', dateISO: '2026-06-19', region: 'African American communities (US)',
    blurb: 'Red foods — red drink, watermelon, barbecue — mark freedom and resilience.', ethnicStoreTypes: ['african'], countryIds: ['jamaica', 'ethiopia'] },
  { id: 'hanami', label: 'Hanami (Cherry Blossom)', dateISO: null, dateCaveat: 'No fixed date — cherry blossom season, roughly late March through April across most of Japan.',
    region: 'Japan', blurb: 'Sakura mochi, bento boxes, hanami dango under the blossoms.', ethnicStoreTypes: ['asian'], countryIds: ['japan'] },
  { id: 'rosh-hashanah', label: 'Rosh Hashanah', dateISO: '2026-09-12', region: 'Jewish communities',
    blurb: 'Challah, apples and honey, brisket for a sweet new year.', ethnicStoreTypes: [], countryIds: [] },
  { id: 'dia-de-los-muertos', label: 'Día de los Muertos', dateISO: '2026-11-01', region: 'Mexico / Mexican diaspora',
    blurb: 'Pan de muerto, mole, marigolds and altars.', ethnicStoreTypes: ['latino'], countryIds: ['mexico'] },
  { id: 'diwali', label: 'Diwali', dateISO: '2026-11-08', region: 'India / South Asian diaspora',
    blurb: 'Samosas, chana masala, gulab jamun — festival of lights.', ethnicStoreTypes: ['south_asian'], countryIds: ['india'] },
  { id: 'thanksgiving', label: 'Thanksgiving', dateISO: '2026-11-26', region: 'United States',
    blurb: 'Roast turkey, cranberry sauce, pumpkin pie.', ethnicStoreTypes: [], countryIds: [] },
  { id: 'hanukkah', label: 'Hanukkah', dateISO: '2026-12-04', dateCaveat: 'Begins at sundown Dec 4 and runs through the evening of Dec 12.',
    region: 'Jewish communities', blurb: 'Latkes and sufganiyot, fried in oil for the miracle of light.', ethnicStoreTypes: [], countryIds: [] },
  { id: 'christmas', label: 'Christmas', dateISO: '2026-12-25', region: 'Global Christian communities',
    blurb: 'Roast turkey, Christmas pudding, gingerbread.', ethnicStoreTypes: [], countryIds: ['italy', 'greece'] },
  { id: 'kwanzaa', label: 'Kwanzaa', dateISO: '2026-12-26', dateCaveat: 'Runs Dec 26 – Jan 1.',
    region: 'African diaspora', blurb: 'Jollof rice, black-eyed peas, plantains.', ethnicStoreTypes: ['african'], countryIds: ['ethiopia', 'jamaica'] },
];

/** Days between now and a holiday's date (fractional-day safe, floor'd). Null for undated (Hanami). */
function daysUntil(iso, now) {
  if (!iso) return null;
  const target = new Date(iso + 'T00:00:00');
  const diffMs = target.setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0);
  return Math.round(diffMs / 86400000);
}

/**
 * The nearest upcoming holiday within `daysAhead` (default 21 — wide enough
 * that the GlobalFood banner isn't empty most of the year; the "3 days
 * before" push-notification concept is a separate, tighter window handled
 * by the caller). Already-passed-today holidays (daysUntil === 0) still
 * count as "today." Returns null if nothing falls in the window.
 */
export function nextUpcoming(daysAhead = 21, now = new Date()) {
  let best = null;
  for (const h of HOLIDAYS) {
    const d = daysUntil(h.dateISO, now);
    if (d == null || d < 0 || d > daysAhead) continue;
    if (!best || d < best.daysAway) best = { ...h, daysAway: d };
  }
  return best;
}

// ── "Ethnic stores near you" — real store data, one region file at a time ──
// STORE_FILE_BY_BOROUGH now lives in storeData.js (FoodMap also uses it for
// its own lazy per-area loading) — imported above, not redefined here.

/** Nearest region's store file to a lat/lng, or the saved location if none given. Null if no location known. */
export function nearestStoreFile(lat, lng) {
  let point = (lat != null && lng != null) ? { lat, lng } : loadLocation();
  if (!point) return null;
  let best = null, bestKm = Infinity;
  for (const b of BOROUGHS) {
    const km = haversineKm(point.lat, point.lng, b.center[0], b.center[1]);
    if (km < bestKm) { bestKm = km; best = b; }
  }
  return best ? STORE_FILE_BY_BOROUGH[best.id] || null : null;
}

/** Fetch the nearest region's stores and filter to the types a holiday needs. */
export async function findEthnicStoresNearby(ethnicStoreTypes, lat, lng, limit = 6) {
  if (!ethnicStoreTypes?.length) return [];
  const file = nearestStoreFile(lat, lng);
  if (!file) return [];
  try {
    const res = await fetch(file);
    const data = await res.json();
    const stores = data.stores || [];
    const point = (lat != null && lng != null) ? { lat, lng } : loadLocation();
    let matches = stores.filter(s => ethnicStoreTypes.includes(s.type));
    if (point) {
      matches = matches
        .map(s => ({ ...s, _km: haversineKm(point.lat, point.lng, s.lat, s.lng) }))
        .sort((a, b) => a._km - b._km);
    }
    return matches.slice(0, limit);
  } catch {
    return [];
  }
}
