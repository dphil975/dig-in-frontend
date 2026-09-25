/* parkAndRide.js — real park & ride infrastructure, starting with Texas.

   The idea "City Explorer" is expanding into: understanding a metro's real
   LAYOUT means knowing where you can leave your car and pick up transit
   instead of driving all the way in and paying for downtown parking. Texas
   metros are heavily car-dependent, so most residents (and almost every
   visitor) genuinely don't know these lots exist — this is meant to teach
   that, not just plot pins.

   TEXAS_METROS — the major metro areas, each with its real transit agency.
   PARK_AND_RIDE — real, named facilities per agency (well-known, long-
   standing lots — DART's and METRO's park & ride networks are large and
   well documented; coordinates are placed at the real neighborhood/station
   the lot serves, not survey-precise, same approximation level as this
   app's other curated real-world location data). VIA (San Antonio) leans on
   express bus routes more than a dedicated park & ride lot network, so it's
   represented honestly with fewer, real entries rather than padded out. */

export const TEXAS_METROS = [
  { id: 'dfw',         name: 'Dallas–Fort Worth', lat: 32.7767, lng: -96.7970, agency: 'DART / Trinity Metro', zoom: 10 },
  { id: 'houston',     name: 'Houston',           lat: 29.7604, lng: -95.3698, agency: 'METRO',                zoom: 10 },
  { id: 'austin',      name: 'Austin',            lat: 30.2672, lng: -97.7431, agency: 'CapMetro',             zoom: 10 },
  { id: 'san-antonio', name: 'San Antonio',       lat: 29.4241, lng: -98.4936, agency: 'VIA',                  zoom: 10 },
  { id: 'el-paso',     name: 'El Paso',           lat: 31.7619, lng: -106.4850, agency: 'Sun Metro',           zoom: 11 },
];

export const PARK_AND_RIDE = [
  // ── Dallas–Fort Worth (DART light rail) ──────────────────────────────
  { id: 'dart-parker-road',   metroId: 'dfw', name: 'Parker Road Station',        city: 'Plano',       lat: 33.0512, lng: -96.7297, agency: 'DART', servesLine: 'Red Line',    cost: 'Free', notes: "One of DART's largest park & ride lots — 2,600+ spaces, the northern end of the Red Line." },
  { id: 'dart-downtown-plano',metroId: 'dfw', name: 'Downtown Plano Station',     city: 'Plano',       lat: 33.0198, lng: -96.6989, agency: 'DART', servesLine: 'Red Line',    cost: 'Free', notes: 'Historic downtown Plano — walkable to shops/restaurants before or after your ride.' },
  { id: 'dart-lbj-skillman',  metroId: 'dfw', name: 'LBJ/Skillman Station',       city: 'Dallas',      lat: 32.9126, lng: -96.7519, agency: 'DART', servesLine: 'Blue Line',   cost: 'Free', notes: 'North Dallas, just off LBJ Freeway (I-635).' },
  { id: 'dart-white-rock',    metroId: 'dfw', name: 'White Rock Station',         city: 'Dallas',      lat: 32.8996, lng: -96.7415, agency: 'DART', servesLine: 'Blue Line',   cost: 'Free', notes: 'Near White Rock Lake, East Dallas.' },
  { id: 'dart-forest-lane',   metroId: 'dfw', name: 'Forest Lane Station',        city: 'Dallas',      lat: 32.9186, lng: -96.7726, agency: 'DART', servesLine: 'Red/Blue',    cost: 'Free', notes: 'North Dallas, near US-75 (Central Expressway).' },
  { id: 'dart-trinity-mills', metroId: 'dfw', name: 'Trinity Mills Station',      city: 'Carrollton',  lat: 32.9629, lng: -96.8994, agency: 'DART', servesLine: 'Green/Orange', cost: 'Free', notes: 'A transfer hub — Green and Orange Lines both stop here.' },
  { id: 'dart-downtown-garland', metroId: 'dfw', name: 'Downtown Garland Station', city: 'Garland',    lat: 32.9126, lng: -96.6389, agency: 'DART', servesLine: 'Blue Line',   cost: 'Free', notes: 'Garland Square area, northeast of Dallas.' },
  { id: 'trinity-metro-tcc',  metroId: 'dfw', name: 'TCC Trinity Railway Express', city: 'Fort Worth', lat: 32.7513, lng: -97.3323, agency: 'Trinity Metro', servesLine: 'TRE (Fort Worth–Dallas)', cost: 'Free', notes: 'Fort Worth side — the TRE commuter line links straight into Downtown Dallas Union Station.' },

  // ── Houston (METRO) ───────────────────────────────────────────────────
  { id: 'metro-kingsland',    metroId: 'houston', name: 'Kingsland Park & Ride',   city: 'Katy',        lat: 29.7847, lng: -95.7539, agency: 'METRO', servesLine: 'Katy Freeway Express', cost: 'Free', notes: 'Along I-10 West — one of the busiest express routes into Downtown/Uptown.' },
  { id: 'metro-northwest',    metroId: 'houston', name: 'Northwest Transit Center', city: 'Houston',    lat: 29.8203, lng: -95.4802, agency: 'METRO', servesLine: 'US-290 Express',       cost: 'Free', notes: 'A major hub feeding several express routes from the northwest side.' },
  { id: 'metro-eastex',       metroId: 'houston', name: 'Eastex Park & Ride',      city: 'Houston',     lat: 29.8934, lng: -95.3399, agency: 'METRO', servesLine: 'Eastex Freeway Express', cost: 'Free', notes: 'US-59 North corridor.' },
  { id: 'metro-west-bellfort',metroId: 'houston', name: 'West Bellfort Park & Ride', city: 'Houston',   lat: 29.6754, lng: -95.4977, agency: 'METRO', servesLine: 'US-90A Express',        cost: 'Free', notes: 'Southwest Houston, near the Sharpstown/Meyerland area.' },
  { id: 'metro-missouri-city',metroId: 'houston', name: 'Missouri City Park & Ride', city: 'Missouri City', lat: 29.6186, lng: -95.5377, agency: 'METRO', servesLine: 'US-90A Express', cost: 'Free', notes: 'Fort Bend County commuters heading into Downtown/Texas Medical Center.' },
  { id: 'metro-fuqua',        metroId: 'houston', name: 'Fuqua Park & Ride',       city: 'Houston',     lat: 29.6392, lng: -95.2287, agency: 'METRO', servesLine: 'Gulf Freeway Express',  cost: 'Free', notes: 'Southeast Houston, I-45 Gulf Freeway corridor.' },

  // ── Austin (CapMetro) ─────────────────────────────────────────────────
  { id: 'capmetro-tech-ridge',metroId: 'austin', name: 'Tech Ridge Park & Ride',   city: 'Austin',      lat: 30.3897, lng: -97.6836, agency: 'CapMetro', servesLine: 'MetroRapid / Express', cost: 'Free', notes: 'North Austin near I-35 — feeds several express routes downtown.' },
  { id: 'capmetro-leander',   metroId: 'austin', name: 'Leander Station',         city: 'Leander',     lat: 30.5788, lng: -97.8531, agency: 'CapMetro', servesLine: 'MetroRail Red Line',   cost: 'Free', notes: 'Northern end of the Red Line commuter rail — a real alternative to driving I-35/MoPac into downtown.' },
  { id: 'capmetro-south',     metroId: 'austin', name: 'South Congress Transit Center', city: 'Austin', lat: 30.2181, lng: -97.7897, agency: 'CapMetro', servesLine: 'MetroRapid 801',        cost: 'Free', notes: 'South Austin, along the 801 MetroRapid corridor.' },

  // ── San Antonio (VIA) ─────────────────────────────────────────────────
  // VIA runs Park & Ride Express routes rather than a large dedicated-lot
  // network the way DART/METRO do — represented honestly, not padded out.
  { id: 'via-brooks',         metroId: 'san-antonio', name: 'Brooks City Base Park & Ride', city: 'San Antonio', lat: 29.3417, lng: -98.4636, agency: 'VIA', servesLine: 'Park & Ride Express', cost: 'Free', notes: 'South San Antonio — VIA runs express service from here into Downtown on weekday peak hours.' },

  // ── El Paso (Sun Metro) ───────────────────────────────────────────────
  { id: 'sunmetro-mesa',      metroId: 'el-paso', name: 'Mesa Street Transfer Center', city: 'El Paso', lat: 31.8129, lng: -106.5223, agency: 'Sun Metro', servesLine: 'Brio Rapid Transit', cost: 'Free', notes: 'Northwest El Paso, along the Mesa Brio rapid-transit corridor.' },
];

export function parkAndRideForMetro(metroId) {
  return PARK_AND_RIDE.filter(p => p.metroId === metroId);
}
