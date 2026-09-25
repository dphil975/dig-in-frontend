/* commutePlanner — ranks a grocery commute across nearby stores.

   The route follows a fixed price "suit" the product wants, by stop position:
     1 medium · 2 pricey · 3 medium · 4 cheapest · 5 pricey · 6 cheapest · 7 medium
   so a trip is never monotonous and always lands a couple of cheap stops. The
   user's budget decides how many stops fit and flags when the plan runs over.

   It also carries the "Wander" idea: if the start is in a tourist area and the
   traveller is on public transit, we surface ONE scenic stop so the trip is a
   little fun without wasting their time — plus a per-stop neighborhood Quest. */

export const PRICE_PATTERN = ['$$', '$$$', '$$', '$', '$$$', '$', '$$'];

export const TIER = {
  '$':   { label: 'Cheapest', mult: 0.78, color: '#7DAE5C' },
  '$$':  { label: 'Medium',   mult: 1.0,  color: '#f4a924' },
  '$$$': { label: 'Pricey',   mult: 1.34, color: '#C8001E' },
};

const QUESTS = [
  'Describe one mural, sign, or storefront you pass on the way in.',
  'What does this block smell like right now? Jot it down.',
  'Count the languages you can spot on signs near this stop.',
  'Find the oldest-looking building on the street and note it.',
  'Spot one local shop the chains haven’t replaced yet.',
  'What is this neighborhood clearly proud of? One line.',
  'Describe the soundtrack of this corner in three words.',
];

// A few well-known tourist anchors. If the start sits within ~2.5km of one and
// the traveller is on transit, the Wander route is offered.
const TOURIST_ANCHORS = [
  { name: 'Times Square',        lat: 40.7580, lng: -73.9855 },
  { name: 'SoHo',                lat: 40.7233, lng: -74.0030 },
  { name: 'Lower East Side',     lat: 40.7150, lng: -73.9843 },
  { name: 'DUMBO',               lat: 40.7033, lng: -73.9881 },
  { name: 'Williamsburg',        lat: 40.7081, lng: -73.9571 },
  { name: 'Central Park South',  lat: 40.7660, lng: -73.9776 },
  { name: 'Coney Island',        lat: 40.5749, lng: -73.9857 },
  { name: 'Flushing Meadows',    lat: 40.7466, lng: -73.8445 },
];

// Scenic waypoints we can route a detour through (parks, waterfronts, bridges).
const SCENIC_WAYPOINTS = [
  { name: 'Hudson River Greenway', lat: 40.7484, lng: -74.0090, blurb: 'river views the whole walk' },
  { name: 'Brooklyn Bridge Park',  lat: 40.7003, lng: -73.9967, blurb: 'skyline + waterfront' },
  { name: 'The High Line',         lat: 40.7480, lng: -74.0048, blurb: 'elevated garden path' },
  { name: 'Central Park',          lat: 40.7812, lng: -73.9665, blurb: 'cut through the green' },
  { name: 'Prospect Park',         lat: 40.6602, lng: -73.9690, blurb: 'meadow shortcut' },
];

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestTouristAnchor(start) {
  let best = null;
  for (const a of TOURIST_ANCHORS) {
    const d = haversineKm(start.lat, start.lng, a.lat, a.lng);
    if (!best || d < best.dist) best = { ...a, dist: d };
  }
  return best;
}

export function isTouristArea(start) {
  const a = nearestTouristAnchor(start);
  return !!a && a.dist <= 2.5;
}

// Build the optional scenic leg: pick the nearest scenic waypoint to the route's
// midpoint so the detour doesn't backtrack and waste the traveller's time.
function buildScenic(start, lastStop) {
  const mid = {
    lat: (start.lat + (lastStop?.lat ?? start.lat)) / 2,
    lng: (start.lng + (lastStop?.lng ?? start.lng)) / 2,
  };
  let best = null;
  for (const w of SCENIC_WAYPOINTS) {
    const d = haversineKm(mid.lat, mid.lng, w.lat, w.lng);
    if (!best || d < best.dist) best = { ...w, dist: d };
  }
  const anchor = nearestTouristAnchor(start);
  return {
    ...best,
    note: `Since you're near ${anchor?.name || 'a tourist spot'} and riding transit, take the scenic way through ${best.name} — ${best.blurb}. Adds ~${Math.max(4, Math.round(best.dist * 9))} min, worth it.`,
  };
}

/* Plan the route.
   stores   – array of { name, type, lat, lng, address, neighborhood, rating,
                          acceptsSNAP?, acceptsWIC? }
   start    – { lat, lng }
   budget   – dollars the user is willing to spend
   ingredients – string[] they're shopping for (drives the cost estimate)
   wander   – boolean (only meaningful with transit + tourist area)
   transit  – boolean (public transportation)
   snapOnly / wicOnly – restrict the route to stores flagged as accepting
     SNAP/EBT or WIC, for users shopping on those benefits */
export function planGroceryRoute({
  stores, start, budget = 40, ingredients = [], wander = false, transit = true,
  snapOnly = false, wicOnly = false,
}) {
  if (!start || !stores?.length) return { stops: [], totalCost: 0, withinBudget: true, scenic: null, overBy: 0 };

  const eligible = stores.filter(s => (!snapOnly || s.acceptsSNAP) && (!wicOnly || s.acceptsWIC));

  // Nearest distinct stores to the start, de-duped by name so the route varies.
  const ranked = eligible
    .filter(s => s.lat && s.lng)
    .map(s => ({ ...s, dist: haversineKm(start.lat, start.lng, s.lat, s.lng) }))
    .sort((a, b) => a.dist - b.dist);

  const seen = new Set();
  const picks = [];
  for (const s of ranked) {
    const key = (s.name || '').toLowerCase() + '|' + (s.neighborhood || '');
    if (seen.has(key)) continue;
    seen.add(key);
    picks.push(s);
    if (picks.length >= PRICE_PATTERN.length) break;
  }

  // Baseline per-stop spend scales with how many ingredients you're hunting.
  const baseline = ingredients.length ? Math.max(4, ingredients.length * 2.4) : 7;

  const stops = picks.map((s, i) => {
    const tierKey = PRICE_PATTERN[i] || '$$';
    const tier = TIER[tierKey];
    const estCost = +(baseline * tier.mult).toFixed(2);
    return {
      n: i + 1,
      store: s,
      tier: tierKey,
      tierLabel: tier.label,
      tierColor: tier.color,
      estCost,
      distKm: s.dist,
      quest: QUESTS[i % QUESTS.length],
    };
  });

  const totalCost = +stops.reduce((a, s) => a + s.estCost, 0).toFixed(2);
  const withinBudget = totalCost <= budget;
  const scenic = wander && transit && isTouristArea(start)
    ? buildScenic(start, picks[picks.length - 1])
    : null;

  return {
    stops,
    totalCost,
    withinBudget,
    overBy: withinBudget ? 0 : +(totalCost - budget).toFixed(2),
    scenic,
  };
}
