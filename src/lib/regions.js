/* ════════════════════════════════════════════════════════════
   REGION NORMALIZER
   The recipe data tags each country file with a `region`, but the
   values are inconsistent ("Asia", "Southeast Asia", "Middle East",
   "Balkans", "Western Europe", "Oceania", "Latin America"…).
   We fold them into 8 canonical regions so every meal reel can show
   exactly one recipe per region.
   ════════════════════════════════════════════════════════════ */

export const REGIONS = [
  { id: 'east-asia',  label: 'East Asia',   emoji: 'EAST' },
  { id: 'sea',        label: 'SE Asia',     emoji: 'SE' },
  { id: 'south-asia', label: 'South Asia',  emoji: 'SOUTH' },
  { id: 'mideast',    label: 'Middle East', emoji: 'MIDDLE' },
  { id: 'europe',     label: 'Europe',      emoji: 'EUROPE' },
  { id: 'africa',     label: 'Africa',      emoji: 'AFRICA' },
  { id: 'americas',   label: 'Americas',    emoji: 'AMERICAS' },
  { id: 'oceania',    label: 'Oceania',     emoji: 'OCEANIA' },
];

export const REGION_BY_ID = Object.fromEntries(REGIONS.map(r => [r.id, r]));

// Country → region. Country is the reliable signal (region strings are messy).
const COUNTRY_REGION = {
  // East Asia
  china: 'east-asia', chinese: 'east-asia', japan: 'east-asia', japanese: 'east-asia',
  korea: 'east-asia', korean: 'east-asia', taiwan: 'east-asia', mongolia: 'east-asia',
  'hong kong': 'east-asia',
  // Southeast Asia
  thailand: 'sea', thai: 'sea', vietnam: 'sea', vietnamese: 'sea', indonesia: 'sea',
  malaysia: 'sea', singapore: 'sea', philippines: 'sea', cambodia: 'sea', laos: 'sea',
  myanmar: 'sea', burma: 'sea', brunei: 'sea',
  // South Asia
  india: 'south-asia', indian: 'south-asia', pakistan: 'south-asia', bangladesh: 'south-asia',
  'sri lanka': 'south-asia', nepal: 'south-asia', afghanistan: 'south-asia', bhutan: 'south-asia',
  // Middle East
  lebanon: 'mideast', lebanese: 'mideast', turkey: 'mideast', turkish: 'mideast',
  iran: 'mideast', persian: 'mideast', iraq: 'mideast', israel: 'mideast', palestine: 'mideast',
  'saudi arabia': 'mideast', saudi_arabia: 'mideast', saudi: 'mideast', uae: 'mideast',
  'united arab emirates': 'mideast', united_arab_emirates: 'mideast', jordan: 'mideast',
  syria: 'mideast', yemen: 'mideast', qatar: 'mideast', kuwait: 'mideast', oman: 'mideast',
  // Africa
  morocco: 'africa', moroccan: 'africa', algeria: 'africa', tunisia: 'africa', libya: 'africa',
  egypt: 'africa', ethiopia: 'africa', nigeria: 'africa', ghana: 'africa', kenya: 'africa',
  senegal: 'africa', 'south africa': 'africa', 'south-africa': 'africa', tanzania: 'africa',
  cameroon: 'africa', 'ivory coast': 'africa', uganda: 'africa', mali: 'africa',
  // Americas
  usa: 'americas', 'united states': 'americas', america: 'americas', american: 'americas',
  canada: 'americas', mexico: 'americas', mexican: 'americas', brazil: 'americas',
  argentina: 'americas', colombia: 'americas', peru: 'americas', chile: 'americas',
  ecuador: 'americas', uruguay: 'americas', 'costa rica': 'americas', 'costa-rica': 'americas',
  jamaica: 'americas', venezuela: 'americas', bolivia: 'americas', cuba: 'americas',
  'puerto rico': 'americas', guatemala: 'americas', honduras: 'americas', panama: 'americas',
  // Oceania
  australia: 'oceania', 'new zealand': 'oceania', 'new-zealand': 'oceania', fiji: 'oceania',
  samoa: 'oceania', tonga: 'oceania', 'papua new guinea': 'oceania',
  // Europe
  italy: 'europe', italian: 'europe', france: 'europe', french: 'europe', spain: 'europe',
  spanish: 'europe', portugal: 'europe', germany: 'europe', german: 'europe', greece: 'europe',
  greek: 'europe', ireland: 'europe', irish: 'europe', 'united kingdom': 'europe', uk: 'europe',
  britain: 'europe', england: 'europe', english: 'europe', scotland: 'europe',
  netherlands: 'europe', belgium: 'europe', austria: 'europe', switzerland: 'europe',
  sweden: 'europe', norway: 'europe', denmark: 'europe', finland: 'europe', iceland: 'europe',
  poland: 'europe', hungary: 'europe', 'czech republic': 'europe', 'czech-republic': 'europe',
  czechia: 'europe', romania: 'europe', bulgaria: 'europe', croatia: 'europe', serbia: 'europe',
  albania: 'europe', russia: 'europe', ukraine: 'europe', estonia: 'europe', latvia: 'europe',
  lithuania: 'europe', slovenia: 'europe', slovakia: 'europe', 'bosnia': 'europe',
};

// Fallback: parse the messy region string.
function fromRegionString(region) {
  const r = (region || '').toLowerCase();
  if (!r) return null;
  if (/southeast|south[- ]?east|se asia/.test(r))           return 'sea';
  if (/south asia|south asian|indian subcontinent/.test(r)) return 'south-asia';
  if (/east asia|east asian/.test(r))                       return 'east-asia';
  if (/middle east|gulf|levant|arabia/.test(r))             return 'mideast';
  if (/africa|maghreb/.test(r))                             return 'africa';
  if (/oceania|pacific|australasia/.test(r))                return 'oceania';
  if (/america|latin|caribbean/.test(r))                    return 'americas';
  if (/europe|balkan|scandinav|nordic|mediterran/.test(r))  return 'europe';
  if (/asia/.test(r))                                       return 'east-asia';
  return null;
}

/**
 * Resolve a canonical region id from a recipe's country + region strings.
 * Returns one of the REGIONS ids, or null if it can't be determined.
 */
export function resolveRegion(country, region) {
  const c = (country || '').toLowerCase().trim();
  if (c) {
    if (COUNTRY_REGION[c]) return COUNTRY_REGION[c];
    // substring match (handles "South Africa", "United Arab Emirates", etc.)
    for (const [key, id] of Object.entries(COUNTRY_REGION)) {
      if (c.includes(key)) return id;
    }
  }
  return fromRegionString(region);
}
