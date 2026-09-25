/* feedContext.js — the lens every slot passes through before it's ranked.

   This is Part 5 of docs/product/DIG_IN_ALGORITHM.md: environment, calendar, and life
   events don't get their own slot — they MODULATE all the slots. A braise
   isn't wrong in July, it's just not what July wants; a $60 roast isn't wrong,
   it's wrong for someone who told us they're broke this month.

   Three layers, each honest about what it actually knows:

     • SEASON — derived from the calendar (real), not a fabricated temperature.
       We say "in season," not "it's 85° out." If some future module writes a
       real, fresh reading to `dig_in_weather`, we'll upgrade a seasonal tag to
       a true weather tag (#hotday) — but we never invent the reading.

     • CALENDAR — a holiday is a six-week ARC, not a banner. And only for
       holidays the user DECLARED (onboarding). We never infer someone's
       religion from behavior.

     • LIFE MODE — the user tells us what season of life they're in, and the
       feed reshapes for weeks. The grief mode ("someone died") is the most
       important thing here: the feed gets QUIET — fewer posts, no streak
       pressure, no confetti. An app that knows to get quiet is an app that's
       taking care of you. Modes expire and ask to be renewed; nobody should be
       stuck in grief mode six months later. */

import { HOLIDAYS } from './holidayCalendar';

const DAY_MS = 86400000;

/* ── Season ──────────────────────────────────────────────────────────────── */
export function seasonOf(now = new Date()) {
  const m = now.getMonth(); // 0=Jan
  if (m <= 1 || m === 11) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'fall';
}

// A real, fresh weather reading if any module has written one — else null.
// We only trust it for ~6h so a stale reading never drives the feed.
function realWeather() {
  try {
    const w = JSON.parse(localStorage.getItem('dig_in_weather') || 'null');
    if (w && Number.isFinite(w.tempF) && (Date.now() - (w.ts || 0)) < 6 * 3600 * 1000) return w;
  } catch { /* ignore */ }
  return null;
}

/**
 * What the season wants surfaced and pushed down. `suppress` is a regex tested
 * against a recipe's name/type — matched dishes are DEPRIORITIZED, never
 * removed (the doc's "suppress braises above 85°," done seasonally + honestly).
 * `contextTags` are structured chips that ride along on in-season recipes.
 */
export function seasonLens(now = new Date()) {
  const season = seasonOf(now);
  const base = {
    winter: { surface: /soup|stew|braise|roast|chili|bake|bread|dumpling|hot pot|curry/i,
              suppress: /cold noodle|no[- ]?cook|ice[- ]?pop|gazpacho/i,
              softCapMinutes: null, contextTags: ['#soupweather'] },
    spring: { surface: /asparagus|pea|herb|salad|radish|greens|lemon|light/i,
              suppress: null, softCapMinutes: null, contextTags: ['#springpicks'] },
    summer: { surface: /no[- ]?cook|grill|salad|cold noodle|chilled|ceviche|gazpacho|ice|slaw/i,
              suppress: /braise|stew|roast|casserole|slow[- ]?cook|pot roast/i,
              softCapMinutes: 40, contextTags: ['#summereats'] },
    fall:   { surface: /squash|apple|pumpkin|roast|braise|stew|cider|harvest|soup/i,
              suppress: null, softCapMinutes: null, contextTags: ['#fallharvest'] },
  }[season];

  // Upgrade to a TRUE weather tag only when we actually have a fresh reading.
  const w = realWeather();
  const contextTags = [...base.contextTags];
  let softCapMinutes = base.softCapMinutes;
  let suppress = base.suppress;
  if (w) {
    if (w.tempF >= 85) { contextTags.unshift('#hotday'); softCapMinutes = 40; suppress = /braise|stew|roast|casserole|slow[- ]?cook/i; }
    else if (w.tempF <= 32) { contextTags.unshift('#coldsnap'); }
    if (/rain|storm|snow/i.test(w.condition || '')) contextTags.push('#pantrycooking');
  }
  return { season, surface: base.surface, suppress, softCapMinutes, contextTags, live: !!w };
}

/* ── Calendar ramps ──────────────────────────────────────────────────────── */
const RAMP_PHASES = [
  { id: 'planning',  from: 42,  to: 15,  label: 'planning',  copy: 'starts coming into view' },
  { id: 'shopping',  from: 14,  to: 4,   label: 'shopping',  copy: 'time to shop' },
  { id: 'prepping',  from: 3,   to: 1,   label: 'prepping',  copy: 'prep days' },
  { id: 'day',       from: 0,   to: 0,   label: 'the day',   copy: 'today' },
  { id: 'leftovers', from: -1,  to: -3,  label: 'leftovers', copy: 'the leftovers window' },
  { id: 'aftermath', from: -4,  to: -10, label: 'aftermath', copy: 'winding down' },
];

function daysBetween(iso, now) {
  if (!iso) return null;
  const target = new Date(iso + 'T00:00:00').setHours(0, 0, 0, 0);
  return Math.round((target - new Date(now).setHours(0, 0, 0, 0)) / DAY_MS);
}

/** Which declared holiday's arc are we inside right now, and which phase.
    `declaredIds` comes from onboarding (localStorage 'dig_in_holidays') — we
    only ramp holidays the user claimed as theirs. Returns null otherwise. */
export function holidayRamp(now = new Date(), declaredIds = null) {
  const declared = declaredIds || loadDeclaredHolidays();
  if (!declared.length) return null;
  let best = null;
  for (const h of HOLIDAYS) {
    if (!declared.includes(h.id) || !h.dateISO) continue;
    const d = daysBetween(h.dateISO, now);
    if (d == null) continue;
    const phase = RAMP_PHASES.find((p) => d <= p.from && d >= p.to);
    if (!phase) continue;
    // Prefer the arc whose "peak" is nearest (smallest |days|).
    if (!best || Math.abs(d) < Math.abs(best.daysAway)) {
      best = { holiday: h, phase, daysAway: d, contextTags: [`#${h.id.replace(/-/g, '')}`] };
    }
  }
  return best;
}

export function loadDeclaredHolidays() {
  try { const v = JSON.parse(localStorage.getItem('dig_in_holidays') || '[]'); return Array.isArray(v) ? v : []; }
  catch { return []; }
}
export function saveDeclaredHolidays(ids) {
  try { localStorage.setItem('dig_in_holidays', JSON.stringify([...new Set(ids)])); } catch { /* quota */ }
}

/* ── Life modes ──────────────────────────────────────────────────────────── */
export const LIFE_MODES = {
  moved: {
    id: 'moved', label: 'I just moved', emoji: '📦',
    blurb: 'Building a kitchen from zero — the simplest, cheapest cooks: few ingredients, one pot, non-meat protein that stretches, and stuff that freezes. Start easy, adjust later.',
    shape: { boostSlots: ['local', 'pantry'], forceTags: ['#fewingredients', '#onepan', '#under5', '#under10', '#batchcook', '#freezerfriendly'], defaultDays: 21 },
  },
  broke: {
    id: 'broke', label: "I'm broke this month", emoji: '🫙',
    blurb: '#under5 leads, deals surface, and nothing aspirational — no $60 roast when you\'re counting dollars.',
    shape: { budgetTier: 'budget', suppressAspirational: true, forceTags: ['#under5'], defaultDays: 30 },
  },
  one: {
    id: 'one', label: 'Cooking for one now', emoji: '🍜',
    blurb: 'Smaller portions, leftovers-forward, and Cooking Now turned up — so the kitchen isn\'t empty.',
    shape: { boostSlots: ['cookingNow'], scaleServings: 1, forceTags: ['#cookingforone'], defaultDays: 30 },
  },
  grief: {
    id: 'grief', label: 'Someone died', emoji: '🕯️',
    blurb: 'Freezer meals and food people can bring you. The feed goes quiet — no streaks, no confetti.',
    shape: { quiet: true, maxPosts: 12, noGamification: true, forceTags: ['#onepan'], defaultDays: 30 },
  },
  baby: {
    id: 'baby', label: 'New baby', emoji: '🍼',
    blurb: 'One-handed, 15 minutes or less, freezer batches — and real iron/folate-forward picks pushed up front, since recovery and (if you\'re nursing) baby both draw on them.',
    shape: { capMinutes: 15, forceTags: ['#15min', '#ironrich', '#folate'], pregnancyAware: true, defaultDays: 45 },
  },
  pregnant: {
    id: 'pregnant', label: 'Pregnant', emoji: '🤰',
    blurb: 'Real iron- and folate-forward recipes pushed up front; the common food-safety categories (raw fish, unpasteurized soft cheese, deli meat, alcohol) quietly pushed back, never hidden — a nudge, not a doctor.',
    shape: { forceTags: ['#ironrich', '#folate'], pregnancyAware: true, defaultDays: 30 },
  },
  better: {
    id: 'better', label: 'Trying to be better', emoji: '🌱',
    blurb: 'Protein-forward, prep-ahead, and streaks turned up if that\'s what keeps you going.',
    shape: { boostGamification: true, forceTags: ['#protein'], defaultDays: 30 },
  },
};

const LIFE_MODE_KEY = 'dig_in_life_mode';

export function setLifeMode(id, days = null) {
  const mode = LIFE_MODES[id];
  if (!mode) return;
  const span = days || mode.shape.defaultDays || 30;
  const rec = { id, since: Date.now(), until: Date.now() + span * DAY_MS };
  try { localStorage.setItem(LIFE_MODE_KEY, JSON.stringify(rec)); } catch { /* quota */ }
}

export function clearLifeMode() {
  try { localStorage.removeItem(LIFE_MODE_KEY); } catch { /* ignore */ }
}

/** The active mode (def + timing), or null. Expired modes auto-clear — this is
    the "modes expire and ask to be renewed" rule enforced at read time. */
export function activeLifeMode(now = new Date()) {
  let rec;
  try { rec = JSON.parse(localStorage.getItem(LIFE_MODE_KEY) || 'null'); }
  catch { rec = null; }
  if (!rec || !LIFE_MODES[rec.id]) return null;
  const t = now.getTime();
  if (rec.until && rec.until < t) { clearLifeMode(); return null; }
  const daysLeft = rec.until ? Math.max(0, Math.round((rec.until - t) / DAY_MS)) : null;
  return { ...LIFE_MODES[rec.id], since: rec.since, until: rec.until, daysLeft, expiringSoon: daysLeft != null && daysLeft <= 3 };
}

/* ── Aspirational check (for the broke-mode suppression) ─────────────────── */
const LUXURY = /truffle|caviar|foie gras|wagyu|lobster|king crab|saffron|dry[- ]?aged|a5|osetra|uni\b|gold leaf/i;
export function isAspirational(recipe) {
  const hay = `${recipe?.name || ''} ${(recipe?.ingredients || []).map((i) => (typeof i === 'object' ? i.text || i.name : i)).join(' ')}`;
  return LUXURY.test(hay);
}

/* ── The one object the allocator + tag layer consume ────────────────────── */
/**
 * Assemble the full context lens for a feed build. Everything downstream reads
 * from this — the allocator for weighting/suppression, structuredTags for the
 * context chips. Pure w.r.t. its inputs (reads localStorage + `now`).
 */
export function buildContext({ now = new Date(), followed = null } = {}) {
  const lens = seasonLens(now);
  const holiday = holidayRamp(now);
  const mode = activeLifeMode(now);
  const shape = mode?.shape || {};

  const contextTags = [...lens.contextTags];
  if (holiday) contextTags.push(...holiday.contextTags);

  // Tags the user follows lean the WHOLE feed toward them — not as a hard
  // filter (that's the "Your Tags" tab), but as a soft weight applied across
  // every slot (feedSlots.processPool) PLUS an extra deal of the tag-follow
  // lane, so followed content shows up more everywhere while the ten slots
  // still deal you randomized discovery you didn't ask for. Following is a
  // dial, not a wall.
  const followedTags = followed instanceof Set ? [...followed] : (Array.isArray(followed) ? followed : []);
  const followBoost = followedTags.length ? ['tagFollow'] : [];

  return {
    now,
    season: lens.season,
    seasonSurface: lens.surface,
    seasonSuppress: lens.suppress,
    softCapMinutes: shape.capMinutes || lens.softCapMinutes || null,
    capMinutes: shape.capMinutes || null,
    contextTags,
    holiday,
    lifeMode: mode,
    followedTags,
    // Flattened shape hints the allocator reads directly:
    quiet: !!shape.quiet,
    noGamification: !!shape.noGamification,
    maxPosts: shape.maxPosts || null,
    budgetTier: shape.budgetTier || null,
    suppressAspirational: !!shape.suppressAspirational,
    boostSlots: [...(shape.boostSlots || []), ...followBoost],
    forceTags: shape.forceTags || [],
    // Pregnant / new-baby: real iron+folate tagging turns on (see
    // buildFeed.tagsForRecipe → lib/pregnancyGuide.js) and the common
    // pregnancy food-safety categories get softly deprioritized (feedSlots.js).
    pregnancyAware: !!shape.pregnancyAware,
  };
}
