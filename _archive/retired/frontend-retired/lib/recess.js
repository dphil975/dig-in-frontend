/* recess.js — the calm daily ritual (childhood-simple).

   Implements the contract already committed against this module:
     todaysRitual()   → { showedUp, spy } ......... NovaNudge's 'recess-morning'
     todaysHandoff()  → null | { text } ........... Home's HandoffStrip
     resolveHandoff() → clears it ................. Home's "made it ✓"
     recessStreak(now) → number ................... Nova's "{n}-day recess"

   The shape of the ritual is set by novaNudges.js's own copy: "a round of
   I Spy, one true thing about food, one kindness to yourself." Three steps,
   two minutes, in that order.

   WHY THIS EXISTS, per the founder: adults got taught that practice is for
   celebrities, planning ahead is for uptight people, and understanding your
   own food is something you buy a course to learn. Kindergarten gave you the
   opposite of all three — clear information, a game, and a gold star for
   trying. Recess hands those back, pointed at food.

   Four rules this file holds itself to:

   1. NO LOSING STATE. novaNudges.js calls this "a gentle invitation, not a
      streak to defend," and the nudge gates itself OFF once you've shown up.
      So: the streak is celebrated when it exists and never mentioned when it
      breaks, nothing expires, and a missed day is just a missed day.

   2. NO BODY METRICS. Nothing about weight, size, or appearance. The villain
      is over-processing and hidden sodium — a supply-side problem you can
      actually see and act on, not a personal failing. nutritionFacts.js
      already frames it exactly this way.

   3. NO INVENTED NUMBERS. Every fact is either matched against the sourced
      keyword tables in gutHealth.js, or is a named public-health figure.
      Nothing gets estimated into existence to make a game feel smarter.

   4. SHOWING UP IS THE UNIT. One step counts as showing up. The ritual is
      two minutes; treating it as all-or-nothing would make it another chore.

   Each completed step files a win into happinessEngine, which is what lets
   Nova read Recess as a lift in Lightness (see Nova/index.jsx's note — that
   import direction is deliberate, recess → happinessEngine, never back). */

import { DAILY_VALUES } from '../nutritionFacts';
import { FIBER_SOURCES, FERMENTED_FOODS, POLYPHENOL_SOURCES, GUT_DISRUPTORS } from '../gutHealth';
import { saveWin, logGratitude } from '../happinessEngine';
import { activeLifeMode } from '../feedContext';

const K = {
  days:    'dig_in_recess_days',      // { [dateStr]: { steps:[], spyFood, truth, kindness } }
  handoff: 'dig_in_recess_handoff',   // { text, forDate, resolved }
};

function read(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; }
  catch { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}
const dayKey = (d = new Date()) => new Date(d).toDateString();

/** Stable index for a given day, so everyone's round/fact rotates daily but
    doesn't reshuffle on every render or reload. */
function daySeed(now = new Date()) {
  const d = new Date(now);
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86_400_000);
}

function today(now = new Date()) {
  return read(K.days, {})[dayKey(now)] || { steps: [], spyFood: '', truth: null, kindness: '' };
}
function saveToday(patch, now = new Date()) {
  const all = read(K.days, {});
  const key = dayKey(now);
  all[key] = { ...today(now), ...patch };
  write(K.days, all);
  return all[key];
}

export const STEPS = ['spy', 'truth', 'kindness'];

/* ── Step 1 · 👀 I Spy ───────────────────────────────────────────────────────
   A looking game. Each round names a real category and you go find something
   that fits — in your pantry, your fridge, or the aisle you're standing in.

   Every round's `list` is one of gutHealth.js's already-sourced keyword tables,
   so "is this a fiber food" is answered by the same matcher the recipe scanner
   uses, not by a second, looser set of rules invented for a game. */

export const SPY_ROUNDS = [
  {
    id: 'fiber',
    emoji: '👀',
    spy: 'I spy something with real fiber in it.',
    ask: 'What have you got?',
    hint: 'Beans, oats, berries, anything with a skin you didn\'t peel.',
    list: FIBER_SOURCES,
    teach: `Fiber is the one that makes food actually hold you. It slows digestion down, which is why a bowl of beans sits with you and the same calories of white bread don't. Most US adults get nowhere near the ${DAILY_VALUES.fiber}g on the label.`,
  },
  {
    id: 'fermented',
    emoji: '🫙',
    spy: 'I spy something with live cultures in it.',
    ask: 'Anything in the fridge door?',
    hint: 'Yogurt, kefir, kimchi, real sauerkraut, miso.',
    list: FERMENTED_FOODS,
    teach: 'Fermented food carries live bacteria into your gut. It\'s one of the few things in nutrition where the mechanism is simple and the evidence is decent — you eat the bacteria, and they show up.',
  },
  {
    id: 'polyphenol',
    emoji: '🌿',
    spy: 'I spy something a plant made to protect itself.',
    ask: 'Check the spice shelf?',
    hint: 'Herbs, spices, olive oil, dark chocolate, tea, garlic.',
    list: POLYPHENOL_SOURCES,
    teach: 'Polyphenols are the bitter, aromatic compounds plants make in their own defense. They\'re why a spice rack isn\'t decoration — tiny serving, enormous concentration.',
  },
  {
    id: 'disruptor',
    emoji: '🔍',
    spy: 'I spy something that\'s mostly refined starch or added sugar.',
    ask: 'What\'s at the front of the cabinet?',
    hint: 'White bread, white rice, anything with corn syrup high on the label.',
    list: GUT_DISRUPTORS,
    // Finding one IS the win — deliberately not a gotcha. Naming the thing in
    // your own cabinet without flinching is the skill being practiced.
    teach: 'Finding one is the win, not a confession. Refining strips out the bran and germ, where nearly all of a grain\'s fiber lived. You\'re not in trouble — you just found out what\'s actually in your cabinet.',
  },
];

/** Today's round. Rotates daily, stable within the day. */
export function todaysSpy(now = new Date()) {
  return SPY_ROUNDS[daySeed(now) % SPY_ROUNDS.length];
}

/** Does `food` satisfy round `roundId`? Reuses that round's sourced keyword
    table — the same matching rule the recipe scanner uses. Returns the matched
    entry (so the UI can show its real note) or null. */
export function checkSpy(roundId, food) {
  const round = SPY_ROUNDS.find((r) => r.id === roundId);
  if (!round) return null;
  const text = String(food || '').toLowerCase().trim();
  if (!text) return null;
  return round.list.find((entry) => entry.keywords.some((kw) => text.includes(kw))) || null;
}

/** Pantry item names, lowercased — used to offer tappable shortcuts. Empty is
    fine: every round is also answerable by typing, so I Spy works on an empty
    pantry. */
export function pantryNames() {
  const items = read('dig_in_pantry', []);
  if (!Array.isArray(items)) return [];
  return items.map((i) => String(i?.name || i || '').toLowerCase()).filter(Boolean);
}

export function completeSpy(food, now = new Date()) {
  const t = today(now);
  const state = saveToday({ steps: [...new Set([...t.steps, 'spy'])], spyFood: String(food || '').trim() }, now);
  try { saveWin('Played a round of I Spy', 'recess'); } catch { /* ignore */ }
  return state;
}

/* ── Step 2 · 🧂 One true thing ──────────────────────────────────────────────
   One fact, one sentence, no jargon — the kindergarten standard. The founder
   named sodium specifically, and it leads here because it's the clearest case
   of a food problem that is genuinely upstream of the person eating it.

   Deliberately no per-food milligram claims: a real sodium number depends on
   the brand and is printed on the package, and inventing one here to make this
   feel precise would be a lie. The instruction is go read the label. */

export const TRUE_THINGS = [
  {
    id: 'sodium-upstream',
    emoji: '🧂',
    truth: 'Most of the salt you eat was already in the food when you bought it.',
    body: `Packaged goods and restaurant meals, not the shaker on the table — CDC and FDA both put that share above 70%. It's why "just stop adding salt" barely moves the number, and why the day's ${DAILY_VALUES.sodium}mg label value is so easy to pass without tasting anything salty.`,
  },
  {
    id: 'bread-salt',
    emoji: '🍞',
    truth: 'Bread is one of the biggest sodium sources in the average diet.',
    body: 'Not because any slice is especially salty — it isn\'t — but because it gets eaten several times a day without registering. That\'s the whole mechanism: frequency, not intensity.',
  },
  {
    id: 'fiber-satiety',
    emoji: '🌾',
    truth: 'Fiber is most of why some food holds you and some doesn\'t.',
    body: `It slows digestion down, so the same calories land differently. The label target is ${DAILY_VALUES.fiber}g a day and most US adults are well under it. This is also why "high fiber" shows up in so much weight advice — it's a mechanical effect, not a marketing word.`,
  },
  {
    id: 'cravings-signal',
    emoji: '🌊',
    truth: 'A craving is information, not a character flaw.',
    body: 'It usually shows up downstream of something else — skipped meals, low sleep, stress, or a habit doing a job you haven\'t replaced yet. Fighting the craving directly tends to lose. Finding what it\'s standing in for tends to work.',
  },
  {
    id: 'variety',
    emoji: '🌱',
    truth: 'Variety of plants matters more than any single "superfood."',
    body: 'The research people cite here is about the number of different plants in a week, not the virtue of one of them. Herbs, spices, beans, and frozen vegetables all count — which makes this one of the cheapest health levers there is.',
  },
  {
    id: 'skipping',
    emoji: '🥜',
    truth: 'Not eating during the day is what makes the evening feel out of control.',
    body: 'Going without food for most of the day isn\'t discipline paying off — it\'s a debt, and it gets collected at 8pm with interest. A stocked drawer is maintenance, not indulgence.',
  },
  {
    id: 'practice',
    emoji: '🔁',
    truth: 'Everyone you think is naturally good at cooking has reps.',
    body: 'The first attempt is supposed to be bad — that\'s information about attempt one, not about you. People generally stop needing the recipe somewhere around the fifth time they make a thing.',
  },
];

export function todaysTruth(now = new Date()) {
  return TRUE_THINGS[daySeed(now) % TRUE_THINGS.length];
}

export function completeTruth(now = new Date()) {
  const t = today(now);
  const state = saveToday({ steps: [...new Set([...t.steps, 'truth'])], truth: todaysTruth(now).id }, now);
  try { saveWin('Learned one true thing about food', 'recess'); } catch { /* ignore */ }
  return state;
}

/* ── Step 3 · 🤍 One kindness to yourself ────────────────────────────────────
   Free text, and deliberately the lowest-effort step in the ritual. It also
   files into happinessEngine's gratitude log, which is what feeds the
   Lightness index Nova paces her tone from. */

export const KINDNESS_PROMPTS = [
  'What\'s one thing you did today that you\'d have thanked someone else for?',
  'Name one thing you\'re not going to be hard on yourself about today.',
  'What did you feed yourself today? Anything counts.',
  'One thing that was easier today than it used to be.',
  'What would you tell a friend who had the day you just had?',
];

export function todaysKindnessPrompt(now = new Date()) {
  return KINDNESS_PROMPTS[daySeed(now) % KINDNESS_PROMPTS.length];
}

export function completeKindness(text, now = new Date()) {
  const t = today(now);
  const clean = String(text || '').trim();
  const state = saveToday({ steps: [...new Set([...t.steps, 'kindness'])], kindness: clean }, now);
  try {
    saveWin('Was kind to myself', 'recess');
    if (clean) logGratitude(clean);
  } catch { /* ignore */ }
  return state;
}

/* ── 🌤️ The handoff — yesterday-you plans for today-you ─────────────────────
   The founder's point that being organized ahead of time is the actual
   mechanism behind looking effortless, and that the 6pm decision gets made by
   whoever delivers fastest.

   So the ritual ends by planning ONE thing for tomorrow, and Home surfaces it
   the next morning as "from yesterday-you" (see Home's HandoffStrip). It's
   freetext on purpose — a dish, a defrost, a phone call. It clears itself the
   moment you tap "made it," and it never nags: an unresolved handoff simply
   stops showing once its day has passed. */

/** Store a plan for tomorrow. */
export function setHandoff(text, now = new Date()) {
  const clean = String(text || '').trim();
  if (!clean) return null;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const rec = { text: clean, forDate: dayKey(tomorrow), resolved: false };
  write(K.handoff, rec);
  return rec;
}

/** The plan yesterday-you left for today, or null. Returns null once resolved,
    and null for a stale plan whose day has passed — a plan you didn't get to
    is not a debt that follows you around. */
export function todaysHandoff(now = new Date()) {
  const rec = read(K.handoff, null);
  if (!rec || rec.resolved) return null;
  if (rec.forDate !== dayKey(now)) return null;
  return rec;
}

/** "made it ✓" — files a win and clears the strip. */
export function resolveHandoff(now = new Date()) {
  const rec = read(K.handoff, null);
  if (!rec) return null;
  write(K.handoff, { ...rec, resolved: true, resolvedAt: now.getTime() });
  try { saveWin(`Made what I planned: ${rec.text}`, 'recess'); } catch { /* ignore */ }
  return null;
}

/** The pending plan regardless of date — so the Recess page can show you what
    you already set without duplicating it. */
export function pendingHandoff() {
  const rec = read(K.handoff, null);
  return rec && !rec.resolved ? rec : null;
}

/* ── The public contract ────────────────────────────────────────────────── */

/** NovaNudge's morning gate. `showedUp` turns the 8am invitation off once
    you've done any step today; `spy` gives the nudge today's round to quote. */
export function todaysRitual(now = new Date()) {
  const t = today(now);
  return {
    showedUp: t.steps.length > 0,
    done:     STEPS.every((s) => t.steps.includes(s)),
    steps:    t.steps,
    spy:      todaysSpy(now),
    truth:    todaysTruth(now),
  };
}

/** Consecutive days you showed up, counting back from today. Mirrors
    happinessEngine's gratitudeStreak: the streak survives if the most recent
    day is today OR yesterday, so it doesn't break at midnight before you've
    had a chance to take it. Returns 0 rather than a negative signal — Nova
    only ever renders this when it's above zero. */
export function recessStreak(now = new Date()) {
  const all = read(K.days, {});
  const showed = (d) => (all[dayKey(d)]?.steps || []).length > 0;

  const start = new Date(now);
  if (!showed(start)) {
    start.setDate(start.getDate() - 1);
    if (!showed(start)) return 0;
  }

  let streak = 0;
  const cursor = new Date(start);
  while (showed(cursor)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/* ── The money override ──────────────────────────────────────────────────────
   The founder's line: "some people don't need motivation they need money."

   If someone has told the app they're broke this month (LIFE_MODES 'broke' in
   feedContext.js), gamifying harder at them is the wrong move and slightly
   insulting. The Recess page demotes itself in that state and leads with the
   spend trail instead. This is the one place the app should be willing to turn
   its own engagement layer down. */
export function moneyFirst() {
  try { return activeLifeMode()?.id === 'broke'; }
  catch { return false; }
}
