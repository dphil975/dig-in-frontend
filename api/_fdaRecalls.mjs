/* _fdaRecalls.mjs -- shared, server-side FDA recall fetch + parse.

   Two data sources, merged and deduplicated:

   1. FDA press-release RSS  (fda.gov/…/recalls/rss.xml)
      Publishes within hours of a recall announcement -- the freshest public
      source. No CORS header, so the browser cannot reach it (hence this server
      module). Missing classification (Class I/II/III), firm, and state fields
      because the FDA assigns those later.

   2. openFDA enforcement API (api.fda.gov/food/enforcement.json)
      The classified recall database. Lags the real world by days-to-weeks
      because it only appears after formal classification. Includes firm name,
      state, distribution pattern, UPC codes, and status. CORS-friendly (the
      client uses it as a fallback), but fetching here too lets us merge fields
      the RSS lacks.

   `.mjs` on purpose: the package is CommonJS (no "type":"module"), so a plain
   `.js` with `export` would fail under the CJS dev runner. `.mjs` is always ESM,
   so both the Vercel function (static import) and api-server.js (dynamic
   `await import`) can load it unchanged. */

// ── Sources ──────────────────────────────────────────────────────────────────
const FDA_RSS = 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/recalls/rss.xml';
const OPENFDA_BASE = 'https://api.fda.gov/food/enforcement.json';

// ── Severity heuristics ──────────────────────────────────────────────────────
const HIGH_RX = /listeria|salmonella|\be\.?\s?coli\b|botulism|botulinum|clostridium|cyclospora|norovirus|hepatitis|shiga|cronobacter|campylobacter|stec|contaminant|undeclared|allergen|\bmilk\b|\begg\b|peanut|tree ?nut|\bsoy\b|wheat|gluten|sesame|\bfish\b|shellfish|sulfite|mustard|lupin|foreign (?:material|object|body)|\bmetal\b|\bplastic\b|\bglass\b|life.?threat|death|hospital/i;
const MED_RX = /mislabel|mold|spoil|temperature|packaging|leak|quality|processed|inspect|unfit|decompos|off.?odor|discolor|swollen|bloat|misbranded/i;

// Non-food filter: drop pharma/device/cosmetic recalls
const NONFOOD_RX = /injection|infusion|\bUSP\b|\btablets?\b|\bcapsules?\b|\bmg\s*\/\s*ml\b|sterile|ophthalmic|nasal spray|dextrose|catheter|syringe|implant|\bdevice\b|pharmaceutical(?!.*food)|\beye drops?\b|insulin|vaccine|antibiotic|ointment|suppository|inhal(?:er|ation)|transdermal|topical cream/i;

// ── Food categories ──────────────────────────────────────────────────────────
const CATEGORY_MAP = [
  [/chicken|poultry|turkey|duck|wings|breast|thigh/i, 'poultry'],
  [/beef|steak|ground meat|pork|ham|bacon|sausage|hot dog|jerky|lamb|veal|bison|venison/i, 'meat'],
  [/salmon|tuna|shrimp|crab|lobster|oyster|clam|mussel|sardine|tilapia|cod|fish|seafood|sushi|squid|scallop/i, 'seafood'],
  [/milk|cheese|yogurt|cream|butter|ice cream|whey|casein|dairy/i, 'dairy'],
  [/lettuce|spinach|salad|romaine|kale|arugula|greens|cilantro|parsley|herb|basil|sprout/i, 'produce-leafy'],
  [/tomato|onion|pepper|cucumber|avocado|berry|fruit|apple|melon|peach|grape|mango|papaya|strawberr|blueberr|raspberr|banana|orange|lemon|lime/i, 'produce'],
  [/bread|tortilla|wrap|bun|roll|bakery|cake|cookie|muffin|pastry|pie|croissant|donut|bagel/i, 'bakery'],
  [/cereal|granola|oat|rice|pasta|noodle|flour|grain|quinoa/i, 'grains'],
  [/nut|almond|cashew|walnut|pecan|pistachio|peanut|seed|trail mix/i, 'nuts-seeds'],
  [/sauce|dressing|condiment|ketchup|mustard|mayo|salsa|hummus|dip|spread/i, 'condiments'],
  [/snack|chip|cracker|popcorn|pretzel|bar|candy|chocolate/i, 'snacks'],
  [/juice|drink|water|beverage|soda|tea|coffee|smoothie|kombucha/i, 'beverages'],
  [/soup|broth|stew|chili|chowder/i, 'soups'],
  [/baby|infant|formula|toddler/i, 'baby-food'],
  [/spice|seasoning|cumin|turmeric|cinnamon|paprika|curry|chili powder/i, 'spices'],
  [/supplement|vitamin|protein powder|probiotic/i, 'supplements'],
  [/frozen|ice|popsicle/i, 'frozen'],
  [/canned|jar|preserved|pickled/i, 'canned'],
  [/meal|entree|dinner|lunch|ready.to.eat|prepared|deli/i, 'prepared'],
  [/pet food|dog food|cat food|animal feed/i, 'pet-food'],
];

function categorize(text) {
  for (const [rx, cat] of CATEGORY_MAP) {
    if (rx.test(text)) return cat;
  }
  return 'other';
}

// ── Allergen extraction ──────────────────────────────────────────────────────
const ALLERGEN_PATTERNS = [
  [/\bmilk\b|dairy|casein|whey|lactose/i, 'milk'],
  [/\beggs?\b|albumin/i, 'eggs'],
  [/\bpeanuts?\b/i, 'peanuts'],
  [/tree\s*nuts?|almond|cashew|walnut|pecan|pistachio|hazelnut|macadamia|brazil\s*nut/i, 'tree-nuts'],
  [/\bsoy\b|soybean|soja/i, 'soy'],
  [/\bwheat\b|\bgluten\b/i, 'wheat'],
  [/\bfish\b|anchov|cod|haddock|pollock|bass|trout/i, 'fish'],
  [/shellfish|shrimp|crab|lobster|crawfish|prawn/i, 'shellfish'],
  [/\bsesame\b/i, 'sesame'],
  [/\bsulfite/i, 'sulfites'],
  [/\bmustard\b/i, 'mustard'],
];

function extractAllergens(text) {
  const found = [];
  for (const [rx, name] of ALLERGEN_PATTERNS) {
    if (rx.test(text)) found.push(name);
  }
  return found;
}

// ── Firm name extraction from RSS headlines ──────────────────────────────────
const FIRM_RX = [
  /^(.+?)\s+(?:voluntarily\s+)?recalls?\s/i,
  /^(.+?)\s+issues?\s+(?:voluntary\s+)?recall/i,
  /^(.+?)\s+(?:is\s+)?recalling\s/i,
];

function extractFirm(title) {
  for (const rx of FIRM_RX) {
    const m = rx.exec(title || '');
    if (m) {
      let firm = m[1].trim();
      if (firm.length > 3 && firm.length < 80) return firm;
    }
  }
  return null;
}

// ── State extraction from description ────────────────────────────────────────
const STATE_ABBREVS = 'AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|PR|GU|VI';
const STATE_RX = new RegExp(`\\b(${STATE_ABBREVS})\\b`);
const NATIONWIDE_RX = /nationwide|all\s+(?:50\s+)?states|throughout\s+the\s+(?:united\s+states|US|U\.S)/i;

function extractStates(text) {
  if (NATIONWIDE_RX.test(text)) return ['nationwide'];
  const matches = [];
  const seen = new Set();
  let m;
  const rx = new RegExp(`\\b(${STATE_ABBREVS})\\b`, 'g');
  while ((m = rx.exec(text)) !== null) {
    if (!seen.has(m[1])) { seen.add(m[1]); matches.push(m[1]); }
  }
  return matches;
}

// ── XML helpers ──────────────────────────────────────────────────────────────
function decode(s = '') {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/¬(?=[—–-])/g, '').replace(/Â/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(m[1]) : '';
}

const MONTHS = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
function toYmd(pubDate) {
  const m = /(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\s+(\d{4})/.exec(pubDate || '');
  if (m) {
    const mm = MONTHS[m[2].toLowerCase()];
    if (mm) return `${m[3]}${mm}${String(m[1]).padStart(2, '0')}`;
  }
  const d = new Date(pubDate);
  return isNaN(d) ? '' : `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

function severityOf(text) {
  if (HIGH_RX.test(text)) return 'high';
  if (MED_RX.test(text)) return 'medium';
  return 'medium';
}

function daysAgo(ymd) {
  if (!ymd || ymd.length !== 8) return null;
  const then = Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8));
  return Math.floor((Date.now() - then) / 86400000);
}

function urgencyScore(recall) {
  let score = 0;
  if (recall.severity === 'high') score += 50;
  else if (recall.severity === 'medium') score += 20;
  const age = daysAgo(recall.date);
  if (age !== null) {
    if (age <= 1) score += 40;
    else if (age <= 3) score += 30;
    else if (age <= 7) score += 20;
    else if (age <= 14) score += 10;
  }
  if (recall.allergens && recall.allergens.length) score += 10;
  if (recall.classification === 'Class I') score += 20;
  return score;
}

// ── RSS parsing ──────────────────────────────────────────────────────────────
export function parseRecalls(xml, { limit = 25 } = {}) {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];
  const out = [];
  for (const raw of items) {
    const title = tag(raw, 'title');
    if (!title || /Recalls\/Safety Alerts/i.test(title)) continue;
    const description = tag(raw, 'description');
    const hay = `${title} ${description}`;
    if (NONFOOD_RX.test(hay)) continue;
    const link = tag(raw, 'link');
    const date = toYmd(tag(raw, 'pubDate'));
    const allergens = extractAllergens(hay);
    const states = extractStates(description);
    out.push({
      id: `rss-${date}-${out.length}`,
      description: title,
      reason: description || null,
      classification: null,
      severity: severityOf(hay),
      date,
      firm: extractFirm(title),
      state: states.length ? states.join(', ') : null,
      distributionStates: states,
      link: link || null,
      category: categorize(hay),
      allergens: allergens.length ? allergens : null,
      source: 'fda-rss',
    });
  }
  const rank = { high: 0, medium: 1, low: 2 };
  out.sort((a, b) =>
    (b.date || '').localeCompare(a.date || '') ||
    ((rank[a.severity] ?? 1) - (rank[b.severity] ?? 1)),
  );
  return out.slice(0, limit);
}

// ── openFDA enforcement fetch ────────────────────────────────────────────────
async function fetchOpenFda({ limit = 25 } = {}) {
  const search = 'status:"Ongoing"+AND+(classification:"Class+I"+OR+classification:"Class+II")';
  const url = `${OPENFDA_BASE}?search=${search}&sort=recall_initiation_date:desc&limit=${limit}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'DigInApp/1.0 (+recall-watch)' },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.results || []).map((r) => {
    const hay = `${r.product_description || ''} ${r.reason_for_recall || ''}`;
    const distStates = extractStates(r.distribution_pattern || '');
    return {
      id: r.recall_number || `openfda-${r.recall_initiation_date}-${r.recalling_firm}`,
      description: r.product_description,
      reason: r.reason_for_recall,
      classification: r.classification,
      severity: r.classification === 'Class I' ? 'high'
        : r.classification === 'Class III' ? 'low'
        : severityOf(hay),
      date: r.recall_initiation_date,
      firm: r.recalling_firm || null,
      state: r.state || null,
      distributionStates: distStates,
      link: null,
      category: categorize(hay),
      allergens: extractAllergens(hay) || null,
      status: r.status || null,
      productQuantity: r.product_quantity || null,
      distributionPattern: r.distribution_pattern || null,
      source: 'openfda',
    };
  });
}

// ── RSS fetch ────────────────────────────────────────────────────────────────
export async function fetchFdaRss({ limit = 25 } = {}) {
  const res = await fetch(FDA_RSS, {
    headers: { 'User-Agent': 'DigInApp/1.0 (+recall-watch)' },
  });
  if (!res.ok) throw new Error(`FDA RSS ${res.status}`);
  const xml = await res.text();
  return parseRecalls(xml, { limit });
}

// ── Merge + dedup ────────────────────────────────────────────────────────────
function mergeRecalls(rssRecalls, openFdaRecalls) {
  const merged = new Map();

  for (const r of openFdaRecalls) {
    merged.set(r.id, r);
  }

  for (const r of rssRecalls) {
    const existingKey = [...merged.keys()].find((k) => {
      const existing = merged.get(k);
      if (!existing) return false;
      const descA = (existing.description || '').toLowerCase().slice(0, 60);
      const descB = (r.description || '').toLowerCase().slice(0, 60);
      if (existing.date === r.date && descA && descB) {
        const wordsA = descA.split(/\s+/);
        const wordsB = descB.split(/\s+/);
        const overlap = wordsA.filter((w) => wordsB.includes(w)).length;
        return overlap >= Math.min(3, Math.floor(wordsA.length * 0.4));
      }
      return false;
    });

    if (existingKey) {
      const existing = merged.get(existingKey);
      merged.set(existingKey, {
        ...existing,
        link: existing.link || r.link,
        firm: existing.firm || r.firm,
        allergens: existing.allergens || r.allergens,
        category: existing.category !== 'other' ? existing.category : r.category,
        source: 'merged',
      });
    } else {
      merged.set(r.id, r);
    }
  }

  return [...merged.values()];
}

// ── Primary export: fetch all sources, merge, score ──────────────────────────
export async function fetchFdaRecalls({ limit = 25, sources = 'all' } = {}) {
  let rssRecalls = [];
  let openFdaRecalls = [];

  const fetches = [];

  if (sources === 'all' || sources === 'rss') {
    fetches.push(
      fetchFdaRss({ limit: limit + 10 })
        .then((r) => { rssRecalls = r; })
        .catch(() => {}),
    );
  }

  if (sources === 'all' || sources === 'openfda') {
    fetches.push(
      fetchOpenFda({ limit: limit + 10 })
        .then((r) => { openFdaRecalls = r; })
        .catch(() => {}),
    );
  }

  await Promise.all(fetches);

  let combined;
  if (sources === 'all') {
    combined = mergeRecalls(rssRecalls, openFdaRecalls);
  } else {
    combined = [...rssRecalls, ...openFdaRecalls];
  }

  combined.forEach((r) => { r.urgency = urgencyScore(r); });

  combined.sort((a, b) => (b.urgency - a.urgency) || (b.date || '').localeCompare(a.date || ''));

  return combined.slice(0, limit);
}

export { fetchOpenFda, extractFirm, extractAllergens, extractStates, categorize, urgencyScore, daysAgo };
