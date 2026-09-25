/* _fdaRecalls.mjs — shared, server-side FDA recall fetch + parse.

   WHY A SERVER: the openFDA enforcement API the browser can call directly lags
   the real world by weeks — it only lists a recall AFTER the FDA has formally
   classified it (Class I/II/III). The FDA's *press-release* recall RSS is
   current (this week's recalls), but fda.gov sends no CORS header, so a browser
   fetch is blocked. This module runs on the server (Vercel function + the local
   dev runner), pulls that current RSS, and normalizes it into the exact shape
   the client already renders.

   `.mjs` on purpose: the package is CommonJS (no "type":"module"), so a plain
   `.js` with `export` would fail under the CJS dev runner. `.mjs` is always ESM,
   so both the Vercel function (static import) and api-server.js (dynamic
   `await import`) can load it unchanged. */

const FDA_RSS = 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/recalls/rss.xml';

// The RSS carries no Class I/II/III yet (that's assigned later — the whole
// reason it's fresher than openFDA), so we infer urgency from the hazard
// wording. Pathogens, undeclared allergens, and foreign material are the
// life-threatening tiers; everything else is a real recall but not "serious".
const HIGH_RX = /listeria|salmonella|\be\.?\s?coli\b|botulism|botulinum|contaminat|undeclared|allergen|\bmilk\b|\begg\b|peanut|tree ?nut|\bsoy\b|wheat|gluten|sesame|\bfish\b|shellfish|foreign (?:material|object)|\bmetal\b|\bplastic\b|glass/i;
const MED_RX  = /mislabel|mold|spoil|temperature|packaging|leak|quality|processed|inspect/i;

// The FDA recalls feed is all-category (food, drug, device, cosmetic). This is
// a FOOD stewardship tab, so drop the obvious pharma/device recalls — someone
// looking at "keep my food safe" doesn't need an injectable-drug recall in the
// list. Heuristic, but the giveaways (injection, USP, sterile, tablets…) are
// distinctive and rarely appear on real food recalls.
const NONFOOD_RX = /injection|infusion|\bUSP\b|\btablets?\b|\bcapsules?\b|\bmg\s*\/\s*ml\b|sterile|ophthalmic|nasal spray|dextrose|catheter|syringe|implant|\bdevice\b|pharmaceutical(?!.*food)|\beye drops?\b/i;

function decode(s = '') {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    // The FDA feed carries a few mojibake artifacts (a stray ¬/Â before dashes).
    .replace(/¬(?=[—–-])/g, '').replace(/Â/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(m[1]) : '';
}

// "Wed, 29 Jul 2026 00:00:00 EDT" -> "20260729" (matches the client's
// fmtRecallDate YYYYMMDD). Parsed straight from the RFC-822 string parts so the
// FDA's stated date is preserved exactly — going through `new Date()` and local
// getters shifts a midnight-EDT date back a day in western timezones.
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
  if (MED_RX.test(text))  return 'medium';
  return 'medium'; // an FDA recall is never treated as "low" unless it's an actual Class III (openFDA path)
}

export function parseRecalls(xml, { limit = 20 } = {}) {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];
  const out = [];
  for (const raw of items) {
    const title = tag(raw, 'title');
    // Skip the feed's own channel-echo entry and anything empty.
    if (!title || /Recalls\/Safety Alerts/i.test(title)) continue;
    const description = tag(raw, 'description');
    const hay = `${title} ${description}`;
    if (NONFOOD_RX.test(hay)) continue;   // drop drug/device/cosmetic recalls
    const link = tag(raw, 'link');
    const date = toYmd(tag(raw, 'pubDate'));
    out.push({
      description: title,          // the human headline already names the company + product + reason
      reason: description || null, // the fuller summary paragraph
      classification: null,        // not classified in the press-release feed yet
      severity: severityOf(hay),
      date,
      firm: null,                  // headline already carries the company; no unreliable guessing
      state: null,
      link: link || null,
      source: 'fda-rss',
    });
  }
  // Newest first; within the same day, most serious first ("most serious newest").
  const rank = { high: 0, medium: 1, low: 2 };
  out.sort((a, b) =>
    (b.date || '').localeCompare(a.date || '') ||
    ((rank[a.severity] ?? 1) - (rank[b.severity] ?? 1)),
  );
  return out.slice(0, limit);
}

export async function fetchFdaRecalls({ limit = 20 } = {}) {
  const res = await fetch(FDA_RSS, { headers: { 'User-Agent': 'DigInApp/1.0 (+recall-watch)' } });
  if (!res.ok) throw new Error(`FDA RSS ${res.status}`);
  const xml = await res.text();
  return parseRecalls(xml, { limit });
}
