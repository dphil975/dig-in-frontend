/* voice.js — every line Nova says on the home screen, in one place.

   How she talks: first person, positive but not fake. No exclamation points, no
   cheerleading, and she never talks about herself in the third person ("Nova
   picked this for you" is "Here's my pick"). She also never announces that she
   is "learning" — she just says what she noticed and what she's doing about it.

   Pure strings and small functions; the UI (and, later, a backend) decides
   when to use them. */

import { currentMealWindow } from '../recipe/mealWindows';

export const NOVA_SAYS = {
  firstVisit: "I'm Nova. I'm here to learn what you like.",
  checkInPrompt: 'How are you feeling?',
  pickIntro: 'A good place to start while I learn what you like.',
  afterCook: "How'd it go?",
  afterSkip: "That's okay. I'll learn another way.",
  afterSave: "I'll remember this one.",
  swap: 'How about this one?',
};

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const numWord = (n) => (n >= 0 && n < WORDS.length ? WORDS[n] : String(n));

/* ── Time of day ─────────────────────────────────────────────────────────── */

const WINDOW_LINE = {
  breakfast: "It's breakfast time.",
  lunch: "It's lunch time.",
  dinner: "It's dinner time.",
  'late-night': "It's late. Something small?",
};

export function windowLine(date = new Date()) {
  return WINDOW_LINE[currentMealWindow(date).id];
}

export function hello(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'Good morning.';
  if (h >= 12 && h < 17) return 'Good afternoon.';
  if (h >= 17 && h < 24) return 'Good evening.';
  return 'Up late?';
}

/** "Good afternoon. It's lunch time." */
export function timeGreeting(date = new Date()) {
  return { hello: hello(date), meal: windowLine(date) };
}

/* ── Coming back ─────────────────────────────────────────────────────────── */

function agoPhrase(days) {
  if (days <= 1) return 'yesterday';
  if (days <= 12) return `${numWord(days)} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return 'a while ago';
}

/** "Welcome back. You cooked three days ago." — the cook part only when there
    was one, and not on the day of the cook itself. */
export function welcomeBack(lastCookAt, now = Date.now()) {
  if (!lastCookAt) return 'Welcome back.';
  const days = Math.floor((now - lastCookAt) / 86400000);
  if (days < 1) return 'Welcome back.';
  return `Welcome back. You cooked ${agoPhrase(days)}.`;
}

/* ── The check-in ────────────────────────────────────────────────────────── */

/** "You checked in as: tired. It's lunch time. You have 30 minutes." */
export function checkedInLine(moodLabel, date = new Date(), minutes = 0) {
  const parts = [`You checked in as: ${String(moodLabel).toLowerCase()}.`, windowLine(date)];
  if (minutes > 0) parts.push(`You have ${minutes} minutes.`);
  return parts.join(' ');
}

// What the pick is aiming for, per mood — finishes "Because you're X, I picked …".
const MOOD_PICK = {
  calm: 'something worth taking your time over',
  happy: 'something to celebrate with',
  good: "something you'll enjoy",
  okay: 'something easy and good',
  tired: 'something quick',
  stressed: 'something simple',
  angry: 'something with a little fire',
  sad: 'something warm',
  anxious: 'something simple and steady',
  overwhelmed: 'one easy dish',
  lonely: 'something warm to share',
};

/** "Because you're tired, I picked something quick." */
export function becauseMood(moodId, moodLabel) {
  const what = MOOD_PICK[moodId] || 'something good';
  return `Because you're ${String(moodLabel || moodId).toLowerCase()}, I picked ${what}.`;
}

/* ── Circling back after a heavy day ─────────────────────────────────────── */

export function followUpAsk(moodLabel) {
  return `Last time you told me you were ${String(moodLabel).toLowerCase()}. Feeling any better?`;
}

export const FOLLOW_UP_OPTIONS = [
  { id: 'better', label: 'Yes, better' },
  { id: 'same', label: 'About the same' },
  { id: 'rough', label: 'Still rough' },
];

export function followUpReply(answer) {
  if (answer === 'better') return "Good. I'm glad.";
  return "Then let's do something kind for you.";
}

/** Reason for a pick-me-up: names the ingredients doing the work. */
export function pickMeUpReason(moodLabel, ingredients = []) {
  const list = ingredients.slice(0, 2).join(' and ');
  const lead = `Because you were ${String(moodLabel).toLowerCase()} last time, I picked something`;
  return list ? `${lead} with ${list}. Easy food that looks after you.` : `${lead} gentle. Easy food that looks after you.`;
}

/* ── After a cook ────────────────────────────────────────────────────────── */

export const REFLECT_OPTIONS = [
  { id: 'loved', label: 'Loved it' },
  { id: 'fine', label: 'It was fine' },
  { id: 'no', label: 'Not for me' },
];

export function reflectReply(verdict) {
  if (verdict === 'loved') return "Then I'll bring you more like it.";
  if (verdict === 'no') return "Thanks for telling me. I'll steer away from it.";
  return "Noted. I'll keep that in mind.";
}

/* ── Why this pick ───────────────────────────────────────────────────────── */

export const useItUpReason = (name) => `Your ${name} won't last much longer, and this uses it.`;
export const tasteReason = (flavor) => `You keep reaching for ${flavor} food, so I picked this one.`;
export const windowReason = (windowId) => ({
  breakfast: 'A good way to start the day.',
  lunch: 'Right for a lunch break.',
  dinner: 'Right for tonight.',
  'late-night': 'Small enough for this hour.',
})[windowId] || NOVA_SAYS.pickIntro;
