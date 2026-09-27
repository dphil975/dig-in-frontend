/* ════════════════════════════════════════════════════════════
   Merged module — originally two files in src/lib/:
     · commutePlanner.js  (grocery-commute route planner)
     · transitAccess.js   (real public-transit awareness)
   ════════════════════════════════════════════════════════════ */

/* ── from commutePlanner.js ────────────────────────────────────
   commutePlanner — ranks a grocery commute across nearby stores.

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

/* ── from transitAccess.js ─────────────────────────────────────
   transitAccess.js — real public-transit awareness for City Explorer.

   Answers two honest questions the store map couldn't before:
     1. Is there public transit near these stores at all?
     2. If transit here is poor, what's the faster way to actually get there?

   The data is REAL and keyless: OpenStreetMap's Overpass API, the same open
   source the store pins and the app's Nominatim geocoding come from. We query
   the actual transit stops (bus stops, subway/metro entrances, tram stops,
   rail/train stations) around wherever you're looking, then measure each store
   to its nearest one. Nothing is fabricated — if Overpass is unreachable or a
   place genuinely has no stops, we say so and point you to the fastest drive
   instead of inventing a bus line.

   One network call per region load (cached), centered on the searched origin. */

const OVERPASS = 'https://overpass-api.de/api/interpreter';
const MAX_STOPS = 800;          // cap the response so a dense city stays light
const WALK_M_PER_MIN = 80;      // ~3 mph average walking

export const TRANSIT_MODE = {
  subway: { icon: '🚇', label: 'Subway / Metro' },
  rail:   { icon: '🚆', label: 'Train' },
  tram:   { icon: '🚊', label: 'Light rail / Tram' },
  bus:    { icon: '🚌', label: 'Bus' },
};

// Rail modes (anything not a bus) are the strong signal of real transit access.
function isRail(mode) { return mode && mode !== 'bus'; }

function classify(tags) {
  if (!tags) return 'bus';
  if (tags.station === 'subway' || tags.subway === 'yes' || tags.railway === 'subway_entrance') return 'subway';
  if (tags.railway === 'tram_stop' || tags.station === 'light_rail' || tags.light_rail === 'yes') return 'tram';
  if (tags.railway === 'station' || tags.railway === 'halt' || tags.train === 'yes' || tags.public_transport === 'station') return 'rail';
  return 'bus';
}

const cache = new Map();   // rounded "lat,lng,radius" -> stops[]  (per session)

/* Fetch real transit stops within `radius` metres of a point. Returns an array
   of { lat, lng, mode, name } or [] on any failure (caller treats [] as "no
   data / drive-to"). Cached per rounded coordinate so re-loading a region you
   already looked at doesn't re-query. */
export async function fetchTransitNear(lat, lng, { radius = 4000 } = {}) {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)},${radius}`;
  if (cache.has(key)) return cache.get(key);

  const q = `[out:json][timeout:20];
(
  node["highway"="bus_stop"](around:${radius},${lat},${lng});
  node["railway"="station"](around:${radius},${lat},${lng});
  node["railway"="halt"](around:${radius},${lat},${lng});
  node["railway"="tram_stop"](around:${radius},${lat},${lng});
  node["railway"="subway_entrance"](around:${radius},${lat},${lng});
  node["public_transport"="station"](around:${radius},${lat},${lng});
);
out body ${MAX_STOPS};`;

  try {
    const res = await fetch(OVERPASS, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: q,
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;   // null = "couldn't load" (distinct from [] = "none here")
    const data = await res.json();
    const stops = (data?.elements || [])
      .filter((el) => el.lat && el.lon)
      .map((el) => ({ lat: el.lat, lng: el.lon, mode: classify(el.tags), name: el.tags?.name || null }));
    const capped = stops.length >= MAX_STOPS;
    stops.capped = capped;
    cache.set(key, stops);
    return stops;
  } catch {
    return null;
  }
}

/* Nearest transit stop to a store, as { mode, meters, walkMin, name, walkable }.
   `walkable` means it's a reasonable walk (<= 1200 m ≈ 15 min). Null if there
   are no stops at all. */
export function nearestTransit(lat, lng, stops) {
  if (!stops || !stops.length) return null;
  let best = null, bestKm = Infinity;
  for (const s of stops) {
    const km = haversineKm(lat, lng, s.lat, s.lng);
    if (km < bestKm) { bestKm = km; best = s; }
  }
  if (!best) return null;
  const meters = Math.round(bestKm * 1000);
  return {
    mode: best.mode,
    meters,
    walkMin: Math.max(1, Math.round(meters / WALK_M_PER_MIN)),
    name: best.name,
    walkable: meters <= 1200,
  };
}

/* Area-level verdict from the stop set + whether the region is car-dependent.
   Quantity alone isn't honest (a city can have many slow bus stops and still be
   a drive-to place), so rail presence and the app's car-dependency model both
   weigh in. Returns { tier, verdict, count, railCount, hasRail, capped }. */
export function summarizeTransit(stops, { carDependent = false } = {}) {
  if (stops == null) {
    return { tier: 'unknown', verdict: "Couldn't load transit data for this area right now.", count: 0, railCount: 0, hasRail: false, capped: false };
  }
  const count = stops.length;
  const railCount = stops.filter((s) => isRail(s.mode)).length;
  const hasRail = railCount > 0;
  const capped = !!stops.capped;
  const n = capped ? `${MAX_STOPS}+` : String(count);

  let tier, verdict;
  if (count === 0) {
    tier = 'none';
    verdict = 'No transit stops nearby — plan to drive. Tap a store for the fastest route.';
  } else if (hasRail && count >= 12) {
    tier = 'good';
    verdict = `${n} transit stops nearby, rail included — you can get to many of these without a car.`;
  } else if (!carDependent && count >= 25) {
    tier = 'good';
    verdict = `${n} transit stops nearby — solid bus coverage to most of these stores.`;
  } else if (count >= 8) {
    tier = 'limited';
    verdict = `${n} transit stops nearby, ${hasRail ? 'some rail' : 'buses only'} — usable, but driving is often faster here.`;
  } else {
    tier = 'sparse';
    verdict = `Only ${n} transit stop${count === 1 ? '' : 's'} nearby — this is mostly a drive-to area. Store cards show the fastest route.`;
  }
  return { tier, verdict, count, railCount, hasRail, capped };
}

/* Fastest-route links for a store. Driving is the honest default where transit
   is poor; a transit link is offered too so the user can compare. Google Maps
   directions (travelmode) work without a key and open the native app on phones. */
export function routeLinks(store) {
  const dest = `${store.lat},${store.lng}`;
  return {
    drive:   `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`,
    transit: `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=transit`,
    walk:    `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`,
  };
}

/* ── Real transit LINES (Grocery Commute) ─────────────────────────────────
   The stop-lookup above answers "is there transit near this store." This
   answers a different question: "which actual subway/bus lines run through
   here, drawn with their real path and real color." Same source as
   everything above — keyless OpenStreetMap Overpass, this time querying
   PTv2 `type=route` relations instead of point stops. Works anywhere OSM has
   route relations mapped, which is most major-city subway/bus/tram/rail
   networks worldwide — not NYC-specific, and not hardcoded to any one city.

   SCOPE HONESTY: OSM route-relation coverage and quality varies a lot by
   city — well-mapped systems (NYC, London, Chicago, most of Europe) return
   rich data including an official `colour` tag; sparser ones may return
   fewer routes or none, and MODE_FALLBACK_COLOR below is what renders when
   a real route has no tagged color, not a claim that it's the line's actual
   color. PTv2 route relations are directional (one relation per direction of
   travel) and member ways are SUPPOSED to be in travel order, which is what
   directionArrows() below relies on — true for well-mapped systems, not
   guaranteed for a sparsely-mapped one. */

const MAX_ROUTES = 30;
const ROUTE_MODES = ['subway', 'light_rail', 'tram', 'train', 'monorail', 'bus'];
const MAX_PATH_POINTS = 500; // above this, decimate for render performance — see simplifyPath()

export const MODE_FALLBACK_COLOR = {
  subway: '#6E8259', light_rail: '#a32a9e', tram: '#f07c20',
  train: '#194f94', monorail: '#b1723c', bus: '#4A7C59',
};

const HEX_RE = /^#?[0-9a-f]{6}$/i;
function normalizeColor(raw) {
  if (!raw || !HEX_RE.test(raw.trim())) return null;
  const hex = raw.trim();
  return hex.startsWith('#') ? hex : `#${hex}`;
}

// Concatenates an Overpass relation's member way geometries into one ordered
// path. Member order in a PTv2 route relation is the travel order — see
// SCOPE HONESTY above for how reliable that is in practice.
function flattenGeometry(members) {
  const pts = [];
  for (const m of members || []) {
    if (!Array.isArray(m.geometry)) continue;
    for (const g of m.geometry) {
      if (g?.lat != null && g?.lon != null) pts.push([g.lat, g.lon]);
    }
  }
  return pts;
}

/** Decimates a long path to at most MAX_PATH_POINTS for render performance —
    a display simplification, not a claim about the line's true shape. Keeps
    the first and last point so the route's real endpoints are preserved. */
export function simplifyPath(path, maxPoints = MAX_PATH_POINTS) {
  if (path.length <= maxPoints) return path;
  const step = Math.ceil(path.length / maxPoints);
  const out = path.filter((_, i) => i % step === 0);
  const last = path[path.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

const routeCache = new Map();

/**
 * Real subway/light-rail/tram/train/bus LINES near a point, with their real
 * path and real (or honestly-defaulted) color. Returns [] when Overpass
 * genuinely has nothing mapped there, null on a fetch failure — same
 * null-vs-[] contract as fetchTransitNear.
 */
export async function fetchTransitRoutesNear(lat, lng, { radius = 2500 } = {}) {
  const key = `route:${lat.toFixed(2)},${lng.toFixed(2)},${radius}`;
  if (routeCache.has(key)) return routeCache.get(key);

  const modeFilter = ROUTE_MODES.join('|');
  const q = `[out:json][timeout:25];
relation["type"="route"]["route"~"^(${modeFilter})$"](around:${radius},${lat},${lng});
out geom ${MAX_ROUTES * 3};`;

  try {
    const res = await fetch(OVERPASS, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: q,
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;
    const data = await res.json();

    const seen = new Set();
    const routes = [];
    for (const el of data?.elements || []) {
      if (el.type !== 'relation') continue;
      const tags = el.tags || {};
      const mode = ROUTE_MODES.includes(tags.route) ? tags.route : 'bus';
      const rawPath = flattenGeometry(el.members);
      if (rawPath.length < 2) continue;

      const ref = tags.ref || tags.name || `Route ${el.id}`;
      const name = tags.name || `${mode} ${ref}`;
      const dedupeKey = `${ref}::${name}`;
      if (seen.has(dedupeKey)) continue; // overlapping member ways can surface the same relation twice
      seen.add(dedupeKey);

      const taggedColor = normalizeColor(tags.colour);
      routes.push({
        id: el.id,
        ref, name, mode,
        color: taggedColor || MODE_FALLBACK_COLOR[mode],
        colorSource: taggedColor ? 'osm' : 'default',
        path: simplifyPath(rawPath),
      });
      if (routes.length >= MAX_ROUTES) break;
    }

    routeCache.set(key, routes);
    return routes;
  } catch {
    return null;
  }
}

function toRad(deg) { return (deg * Math.PI) / 180; }
function toDeg(rad) { return (rad * 180) / Math.PI; }

/** Compass bearing (0-360°, 0 = north) from one lat/lng point to another. */
export function bearingDeg(lat1, lng1, lat2, lng2) {
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * A handful of evenly-spaced points along a route path, each with the
 * compass bearing of travel at that point — what a map draws as small
 * direction arrowheads along a colored line. `count` arrows, spread across
 * the path (never at the very first/last point, so an arrow always has a
 * clear "next point" to aim at).
 */
export function directionArrows(path, count = 4) {
  if (!path || path.length < 2) return [];
  const n = Math.min(count, path.length - 1);
  const arrows = [];
  for (let i = 1; i <= n; i++) {
    const idx = Math.min(path.length - 2, Math.floor(((path.length - 1) * i) / (n + 1)));
    const [lat1, lng1] = path[idx];
    const [lat2, lng2] = path[idx + 1];
    arrows.push({ lat: lat1, lng: lng1, bearing: bearingDeg(lat1, lng1, lat2, lng2) });
  }
  return arrows;
}
