/* novaNudges.js — Nova's contextual "right-moment" nudge engine.

   The idea: the best time to reach a hungry, undecided person is *just before*
   they default to the drive-thru — and that moment is predictable from the
   clock, not from any live foot-traffic feed. This generalizes the Pantry's
   single "beat the drive-thru" intercept into a full day-long playbook of
   states, each with its own trigger window, Nova line, and call to action.

   HONEST SCOPE — the data reality:
   Live store busyness (SafeGraph / Placer / Google Popular Times / Cuebiq) is
   all paid, restricted, or backend-only, and none of it can run in this React
   app. So the timing here is a *behavioral model* (same basis as shopTiming.js),
   not a real-time signal. Everything downstream — the nudge copy, the routing,
   the convenience tier, the notification scheduling — is real and swaps straight
   onto a live feed the day one exists (scraped Popular Times, crowdsourced
   check-ins, or a Cuebiq baseline). Nothing here claims live data it doesn't have.

   The "monetize procrastination" angle is modeled explicitly: the deeper you are
   into the dinner-decision window, the higher the CONVENIENCE tier, and the more
   Nova leans on fast, premium shelf-stable staples (canned tuna, good olives,
   imported pasta). You're not shamed for waiting — you're sold the convenience of
   not thinking. That's a feature.

   CRAVING-AWARE nudges — the "what to eat right now" windows (lunch-rush,
   stress-craving, dinner-rush, friday-treat, late-night) also read the user's
   real learned flavor profile (flavorProfile.js's dig_in_craving_prefs — the
   same TikTok-style signal every recipe view/save/cook/skip already writes
   to) and bridge it into seasoningPairingEngine.js's CRAVING_ARCHETYPES — the
   same neuroscience-grounded craving decoder CravingCompass uses (brain
   state, body need, a real named recipe). That's what makes these nudges
   "logical": Nova isn't just guessing a generic line for the hour, she's
   citing the actual reason a body reaches for rich/salty/sweet/spicy food and
   naming a specific dish for it. Shop-timing nudges (sunday-prep,
   weekend-calm-shop, tuesday-restock) are left alone — those are about
   crowds and time, not personal craving, so forcing craving language into
   them would be dishonest padding, not logic. New users with no signal yet
   fall back to the original generic copy — never a fabricated craving. */

import { loadFlavorProfile } from './flavorProfile';
import { CRAVING_ARCHETYPES } from '../services/seasoningPairingEngine';
import { stockAheadList } from './cravingTracker';

// The 8-flavor vocabulary flavorProfile.js learns (spicy/sweet/savory/rich/
// light/earthy/smoky/tangy) and the 7 CRAVING_ARCHETYPES (rich/salty/sweet/
// spicy/fresh/umami/warming) come from two different systems built for
// different jobs — this is a nearest-neighbor bridge between them, not a
// scientific claim. savory→umami and rich→rich are near-exact; light/tangy→
// fresh and earthy/smoky→warming are the closest reasonable match among the 7.
const FLAVOR_TO_ARCHETYPE = {
  spicy: 'spicy', sweet: 'sweet', savory: 'umami', rich: 'rich',
  light: 'fresh', tangy: 'fresh', earthy: 'warming', smoky: 'warming',
};

/** The craving archetype (brainState/bodyNeed/a real named recipe) behind
 * whichever flavor this user has actually been gravitating toward — or null
 * for a new user with no learned signal yet. Reused as-is by CravingCompass;
 * this just reads the SAME learned profile to feed Nova's nudges. */
export function dominantCravingArchetype() {
  const profile = loadFlavorProfile();
  const positive = Object.entries(profile).filter(([, v]) => v > 0);
  if (!positive.length) return null;
  positive.sort((a, b) => b[1] - a[1]);
  const [topFlavor] = positive[0];
  const archetypeId = FLAVOR_TO_ARCHETYPE[topFlavor];
  return archetypeId ? CRAVING_ARCHETYPES[archetypeId] : null;
}

// Short, sentence-ready "why" hook — the archetype's brainState is a full
// paragraph; a nudge card needs one punchy clause, not a lecture.
function cravingWhy(archetype) {
  return archetype.brainState.split('.')[0].trim() + '.';
}

// ── Time helpers ────────────────────────────────────────────────
const hourOf = (d) => d.getHours() + d.getMinutes() / 60;
const isWeekday = (d) => d.getDay() >= 1 && d.getDay() <= 5;
const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

function dayMatch(rule, d) {
  if (rule === 'all') return true;
  if (rule === 'weekday') return isWeekday(d);
  if (rule === 'weekend') return isWeekend(d);
  if (Array.isArray(rule)) return rule.includes(d.getDay());
  return false;
}

function fmtTime(h) {
  const hr = Math.floor(h) % 24;
  const min = Math.round((h - Math.floor(h)) * 60);
  const ampm = hr < 12 ? 'am' : 'pm';
  const h12 = hr % 12 === 0 ? 12 : hr % 12;
  return `${h12}:${String(min).padStart(2, '0')}${ampm}`;
}

/* How deep into the dinner-decision window are we? 0 = plenty of time (chill),
   1 = the rush is on, 2 = drive-thru is basically winning. Drives both Nova's
   tone and how hard she pushes fast/premium pantry recipes. */
export function convenienceLevel(now = new Date()) {
  if (!isWeekday(now)) {
    // Weekends drift later; a light single-step ramp in the evening.
    const t = hourOf(now);
    return t >= 18 ? 1 : 0;
  }
  const t = hourOf(now);
  if (t >= 17.5) return 2;   // 5:30pm+ — you waited, pay for speed
  if (t >= 16.5) return 1;   // 4:30pm  — the rush is starting
  return 0;                  // 4:00pm  — you're early, cook the real thing
}

const CONVENIENCE_COPY = [
  { tag: 'AHEAD OF IT', note: "You've got time — cook the real thing." },
  { tag: 'RUSH IS ON',  note: 'Fast wins now. Grab something 15-minute.' },
  { tag: 'DRIVE-THRU O’CLOCK', note: 'Lean on premium staples — canned tuna, good olives, imported pasta. Pay to not think.' },
];

// ── The playbook ────────────────────────────────────────────────
// priority: higher wins when multiple windows overlap.
// from/to/sendAt are fractional hours (16.5 = 4:30pm). `body(ctx, now)` returns
// the line Nova shows; ctx = { suggestionCount, pantryCount, tier }.
export const NUDGES = [
  {
    // Ambient Recess — the calm daily ritual surfaced gently in the morning, so
    // "one small thing for yourself" reaches you before the day gets loud. Low
    // priority (2) so any real meal-timing window outranks it; and a `when` gate
    // so it never shows once you've already taken recess today — this one is a
    // gentle invitation, not a streak to defend. (See lib/recess.js.)
    id: 'recess-morning',
    category: 'recess',
    icon: '🌤️',
    days: 'all', from: 7, to: 11, sendAt: 8,
    whenText: 'Daily · 8:00am',
    title: 'Two minutes of recess',
    priority: 2,
    when: (ctx) => !ctx?.recessDone,
    cta: { label: 'Take recess', route: '/recess' },
    body: (ctx) => {
      const spy = ctx?.recessSpy;
      if (spy?.spy) {
        return `${spy.spy} ${spy.ask} No streak to protect — just one small thing before the day gets loud.`;
      }
      return 'One small thing before the day gets loud — a round of I Spy, one true thing about food, one kindness to yourself.';
    },
  },
  {
    id: 'breakfast-rush',
    category: 'breakfast',
    icon: '☕',
    days: 'weekday', from: 6.5, to: 8.5, sendAt: 6.5,
    whenText: 'Weekdays · 6:30am',
    title: 'Beat the coffee-shop line',
    priority: 5,
    cta: { label: 'Quick breakfasts', route: '/recipes' },
    body: () => "Before you spend $7 on a muffin — 5-min overnight oats or a 3-min egg wrap does it. Future-you at 8am says thanks.",
  },
  {
    id: 'lunch-rush',
    category: 'lunch-rush',
    icon: '🥪',
    days: 'all', from: 11.5, to: 13.5, sendAt: 11.25,
    whenText: 'Daily · 11:15am',
    title: "It's the lunch rush",
    priority: 6,
    cravingAware: true,
    cta: { label: 'What I can make', route: '/pantry' },
    body: (ctx) => {
      const have = ctx?.suggestionCount > 0
        ? `You can plate ${ctx.suggestionCount} thing${ctx.suggestionCount !== 1 ? 's' : ''} from your pantry in less time than the wait. `
        : '';
      const c = ctx?.craving;
      if (c) {
        const dish = c.recipes?.[0];
        return `The drive-thru line is forming. ${have}You've been leaning ${c.label.toLowerCase()} lately. ${cravingWhy(c)}${dish ? ` ${dish.title} (${dish.totalTime} min) scratches that itch without the wait.` : ''}`;
      }
      return `The drive-thru line is forming. ${have || 'Ten minutes and a pantry beats twenty in a line.'}`;
    },
  },
  {
    id: 'stress-craving',
    category: 'stress-craving',
    icon: '🍫',
    days: 'weekday', from: 14, to: 15.25, sendAt: 14,
    whenText: 'Weekdays · 2:00pm',
    title: 'Post-lunch crash incoming',
    priority: 5,
    cravingAware: true,
    cta: { label: '3-minute fix', route: '/recipes' },
    body: (ctx) => {
      const c = ctx?.craving;
      if (c) {
        const dish = c.recipes?.[0];
        return `Your cortisol's spiking and your brain's offline. ${cravingWhy(c)} ${dish ? `${dish.title} (${dish.totalTime} min) meets it head-on — zero brain cells required.` : `A quick ${c.label.toLowerCase()} fix meets it head-on — zero brain cells required.`}`;
      }
      return "Your cortisol's spiking and your brain's offline. 3-minute chocolate mug cake, zero brain cells required. I won't tell.";
    },
  },
  {
    id: 'dinner-rush',
    category: 'dinner-rush',
    icon: '🍔',
    days: 'weekday', from: 16, to: 18.5, sendAt: 16.25,
    whenText: 'Weekdays · 4:15pm',
    title: 'The drive-thru is about to win',
    priority: 9,
    convenience: true,
    cravingAware: true,
    cta: { label: 'Cook from my pantry', route: '/pantry' },
    body: (ctx, now) => {
      const lvl = convenienceLevel(now);
      const conv = CONVENIENCE_COPY[lvl];
      const have = ctx?.suggestionCount > 0
        ? `You already have ${ctx.suggestionCount} recipe${ctx.suggestionCount !== 1 ? 's' : ''} in reach. `
        : '';
      const c = ctx?.craving;
      if (c) {
        const dish = c.recipes?.[0];
        return `${have}${conv.note} You've been craving ${c.label.toLowerCase()} this week — ${cravingWhy(c)}${dish ? ` ${dish.title} (${dish.totalTime} min) hits it.` : ''}`;
      }
      return `${have}${conv.note}`;
    },
  },
  {
    id: 'friday-treat',
    category: 'treat',
    icon: '🎉',
    days: [5], from: 16, to: 19.5, sendAt: 16.5,
    whenText: 'Fridays · 4:30pm',
    title: "It's Friday — cook what you actually want",
    priority: 10,
    cravingAware: true,
    cta: { label: 'Find a showstopper', route: '/reels' },
    body: (ctx) => {
      const c = ctx?.craving;
      if (c) {
        const dish = c.recipes?.[0];
        return `You made it through the week. Skip the sad takeout — you've been gravitating ${c.label.toLowerCase()} lately, so lean into it. ${dish ? `${dish.title} is the kind of thing you'd screenshot.` : "Make the thing you'd screenshot."}`;
      }
      return "You made it through the week. Skip the sad takeout — make the thing you'd screenshot. 7-second reels for inspo.";
    },
  },
  {
    id: 'stock-ahead',
    category: 'stock-ahead',
    icon: '🫙',
    days: [6], from: 9, to: 11, sendAt: 9.5,
    whenText: 'Saturdays · 9:30am',
    title: 'Stock the pantry before the craving hits',
    priority: 7,
    cta: { label: 'See my Craving Tracker', route: '/cravings' },
    body: (ctx) => {
      const list = ctx?.stockAhead || [];
      if (!list.length) {
        return "Keep logging what you're craving in the Craving Tracker — once a flavor shows up a couple times, I'll start telling you exactly what to stock up on.";
      }
      const top = list[0];
      return `You've reached for ${top.flavor} ${top.count} times now — grab ${top.items.slice(0, 2).join(' and ')} this trip so it's already on hand next time.`;
    },
  },
  {
    id: 'sunday-prep',
    category: 'meal-prep',
    icon: '🥘',
    days: [0], from: 9, to: 11.5, sendAt: 10,
    whenText: 'Sundays · 10:00am',
    title: 'Future-you needs a favor',
    priority: 8,
    cta: { label: 'Batch-cook ideas', route: '/recipes' },
    body: () => "By Wednesday you'll be too tired to think. One 45-minute batch cook now = 4 meals you don't have to decide on later. Go before the stores get slammed.",
  },
  {
    id: 'weekend-calm-shop',
    category: 'shop-timing',
    icon: '🛒',
    days: 'weekend', from: 7, to: 9, sendAt: 7,
    whenText: 'Weekends · 7:00am',
    title: 'The aisles are empty right now',
    priority: 6,
    cta: { label: 'Open the map', route: '/' },
    body: () => "This is the calmest 90-minute window all weekend — beat the late-morning crowd and the parking lot. Shop now, cruise out.",
  },
  {
    id: 'tuesday-restock',
    category: 'shop-timing',
    icon: '📅',
    days: [2], from: 9.5, to: 11.5, sendAt: 10,
    whenText: 'Tuesdays · 10:00am',
    title: 'Tuesday is the quiet run',
    priority: 5,
    cta: { label: 'Plan a run', route: '/' },
    body: () => "Midweek is the least-busy time to shop and the best-converting day to restock. Get ahead of the weekend rush while it's calm.",
  },
  {
    id: 'late-night',
    category: 'late-night',
    icon: '🌙',
    days: 'all', from: 21.5, to: 23.75, sendAt: 21.5,
    whenText: 'Nightly · 9:30pm',
    title: 'Kitchen’s closing, but you’re hungry',
    priority: 4,
    cravingAware: true,
    cta: { label: 'Something light', route: '/pantry' },
    body: (ctx) => {
      const c = ctx?.craving;
      if (c) {
        const dish = c.recipes?.[0];
        return `Don't doom-order at 10pm. ${cravingWhy(c)} ${dish ? `${dish.title} (${dish.totalTime} min) covers the ${c.label.toLowerCase()} craving without the $18 delivery fee.` : `A quick ${c.label.toLowerCase()} fix beats an $18 delivery fee.`} Then bed.`;
      }
      return "Don't doom-order at 10pm. 5-minute something light from what you've got, then bed. You'll sleep better and save $18.";
    },
  },
];

export const NUDGE_CATEGORIES = [...new Set(NUDGES.map(n => n.category))];

// ── Preferences (which categories the user allows) ──────────────
const PREFS_KEY = 'dig_in_nudge_prefs';       // { disabled: [category, …] }
const DISMISS_KEY = 'dig_in_nudge_dismissed'; // { 'YYYY-MM-DD': [id, …] }

export function loadDisabledCategories() {
  try {
    const v = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    return new Set(Array.isArray(v.disabled) ? v.disabled : []);
  } catch { return new Set(); }
}
export function setCategoryEnabled(category, enabled) {
  const disabled = loadDisabledCategories();
  if (enabled) disabled.delete(category); else disabled.add(category);
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ disabled: [...disabled] })); } catch { /* ignore */ }
  return disabled;
}

const dayKey = (d) => d.toISOString().slice(0, 10);
export function isDismissedToday(id, now = new Date()) {
  try {
    const v = JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}');
    return (v[dayKey(now)] || []).includes(id);
  } catch { return false; }
}
export function dismissNudge(id, now = new Date()) {
  try {
    const v = JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}');
    const k = dayKey(now);
    const list = new Set(v[k] || []); list.add(id);
    localStorage.setItem(DISMISS_KEY, JSON.stringify({ [k]: [...list] })); // keep only today
  } catch { /* ignore */ }
}

// ── Query API ───────────────────────────────────────────────────
function windowMatches(nudge, now) {
  const t = hourOf(now);
  return dayMatch(nudge.days, now) && t >= nudge.from && t < nudge.to;
}

/** A nudge may carry an optional `when(ctx, now) => boolean` gate on top of its
    time window — used to suppress a nudge when its point is already moot (e.g.
    don't surface the Recess nudge to someone who already took recess today).
    No `when` means always-eligible, so every existing nudge is unaffected. */
function whenMatches(nudge, ctx, now) {
  return typeof nudge.when !== 'function' || nudge.when(ctx, now);
}

/** All nudges whose window is open right now, honoring category prefs, highest priority first. */
export function getActiveNudges(now = new Date(), ctx = {}) {
  const disabled = loadDisabledCategories();
  return NUDGES
    .filter(n => !disabled.has(n.category) && windowMatches(n, now) && whenMatches(n, ctx, now))
    .sort((a, b) => b.priority - a.priority)
    .map(n => render(n, ctx, now));
}

/** The single nudge to surface now (or null), skipping ones dismissed today. */
export function getTopNudge(now = new Date(), ctx = {}) {
  const disabled = loadDisabledCategories();
  const hit = NUDGES
    .filter(n => !disabled.has(n.category) && windowMatches(n, now) && whenMatches(n, ctx, now) && !isDismissedToday(n.id, now))
    .sort((a, b) => b.priority - a.priority)[0];
  return hit ? render(hit, ctx, now) : null;
}

/** The next nudge later today (for "nothing now — next up at…"). */
export function getNextNudge(now = new Date()) {
  const disabled = loadDisabledCategories();
  const t = hourOf(now);
  const upcoming = NUDGES
    .filter(n => !disabled.has(n.category) && dayMatch(n.days, now) && n.sendAt > t)
    .sort((a, b) => a.sendAt - b.sendAt)[0];
  return upcoming ? { ...renderMeta(upcoming), atText: fmtTime(upcoming.sendAt) } : null;
}

/** Today's full schedule (for the playbook timeline + notification scheduling). */
export function todaySchedule(now = new Date(), ctx = {}) {
  const disabled = loadDisabledCategories();
  return NUDGES
    .filter(n => !disabled.has(n.category) && dayMatch(n.days, now))
    .sort((a, b) => a.sendAt - b.sendAt)
    .map(n => ({ ...render(n, ctx, now), atHour: n.sendAt, atText: fmtTime(n.sendAt) }));
}

/** The whole playbook, every day, for a reference/preview table. */
export function fullPlaybook(ctx = {}, now = new Date()) {
  return NUDGES
    .slice()
    .sort((a, b) => a.sendAt - b.sendAt)
    .map(n => render(n, ctx, now));
}

function renderMeta(n) {
  return {
    id: n.id, category: n.category, icon: n.icon, title: n.title,
    whenText: n.whenText, cta: n.cta, convenience: !!n.convenience, priority: n.priority,
  };
}
function render(n, ctx, now) {
  const meta = renderMeta(n);
  const out = { ...meta, body: n.body(ctx, now) };
  if (n.convenience) {
    const lvl = convenienceLevel(now);
    out.convenienceTag = CONVENIENCE_COPY[lvl].tag;
    out.convenienceLevel = lvl;
  }
  // Only attach craving metadata on nudges that actually used it in their
  // body copy above — so the tag never shows without the text backing it up.
  if (n.cravingAware && ctx?.craving) {
    out.craving = { id: ctx.craving.id, label: ctx.craving.label, emoji: ctx.craving.emoji };
  }
  return out;
}
