/* happinessEngine.js — the mechanics that make "happier" something the app can
   actually move, not a vibe.

   Five loops, each wired to an event and a formula:
     🌅 Gratitude Log   one logged gratitude a day → a streak
     🏆 Win Collection  every cooking win saved to a visual Trophy Case
     🔗 Kindness Chain  tag someone you appreciate → both get a lift
     🤲 Helping Hand    a reply marked helpful → altruism badge tier
     📈 Lightness       a rolling index Nova reads to pace her tone

   All client-side (localStorage), all pure. The Kindness Chain and Helping Hand
   notify real other people once a backend exists; until then they record intent
   locally so the loops are testable and the UI is honest about scope. */

const K = {
  gratitude: 'dig_in_nova_gratitude',   // [{ id, text, at }]
  wins:      'dig_in_nova_wins',         // [{ id, title, at, source }]
  kindness:  'dig_in_nova_kindness',     // [{ id, who, note, at }]
  helping:   'dig_in_nova_helping',      // { count, tier }
};

function read(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; }
  catch { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ── 🌅 Gratitude Log ────────────────────────────────────────────
export function logGratitude(text) {
  const list = read(K.gratitude, []);
  list.push({ id: uid(), text: String(text).trim(), at: Date.now() });
  write(K.gratitude, list);
  return list;
}
export function getGratitude() { return read(K.gratitude, []).slice().reverse(); }

/** Consecutive-day streak: each entry within 36h of the previous day's keeps it. */
export function gratitudeStreak(now = Date.now()) {
  const list = read(K.gratitude, []);
  if (!list.length) return 0;
  const days = [...new Set(list.map(e => new Date(e.at).toDateString()))]
    .map(d => new Date(d).getTime())
    .sort((a, b) => b - a);
  const DAY = 86_400_000;
  const today = new Date(now).setHours(0, 0, 0, 0);
  // streak only counts if the most recent entry is today or yesterday
  if (today - days[0] > DAY) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i - 1] - days[i] <= DAY * 1.5) streak++;
    else break;
  }
  return streak;
}

// ── 🏆 Win Collection ───────────────────────────────────────────
export function saveWin(title, source = 'manual') {
  const list = read(K.wins, []);
  list.push({ id: uid(), title: String(title).trim(), at: Date.now(), source });
  write(K.wins, list);
  return list;
}
export function getWins() { return read(K.wins, []).slice().reverse(); }

// ── 🔗 Kindness Chain ───────────────────────────────────────────
export function tagKindness(who, note = '') {
  const list = read(K.kindness, []);
  list.push({ id: uid(), who: String(who).trim(), note: String(note).trim(), at: Date.now() });
  write(K.kindness, list);
  return list;
}
export function getKindness() { return read(K.kindness, []).slice().reverse(); }

// ── 🤲 Helping Hand ─────────────────────────────────────────────
const HELP_TIERS = [0, 1, 5, 15, 40]; // thresholds → tier 0..4
export function recordHelp() {
  const h = read(K.helping, { count: 0, tier: 0 });
  h.count += 1;
  h.tier = HELP_TIERS.reduce((t, thresh, i) => (h.count >= thresh ? i : t), 0);
  write(K.helping, h);
  return h;
}
export function getHelping() { return read(K.helping, { count: 0, tier: 0 }); }

// ── 📈 Lightness index ──────────────────────────────────────────
/* A rolling 0–100 read of how the user is doing, which Nova uses to pace her
   tone: high lightness gets celebration, low gets gentleness. Weighted toward
   the last 7 days so it moves with the person, not their whole history. */
export function lightness(now = Date.now()) {
  const WINDOW = 7 * 86_400_000;
  const recent = (list, key = 'at') => list.filter(e => now - e[key] <= WINDOW).length;

  const g = recent(read(K.gratitude, []));
  const w = recent(read(K.wins, []));
  const k = recent(read(K.kindness, []));
  const help = getHelping().count;

  // gentle diminishing returns so one big day doesn't peg it
  const score =
    Math.min(g, 7) * 6 +
    Math.min(w, 7) * 5 +
    Math.min(k, 5) * 4 +
    Math.min(help, 10) * 1;

  const val = Math.max(0, Math.min(100, 20 + score)); // 20 baseline so nobody sits at rock bottom
  let band = 'steady';
  if (val >= 70) band = 'bright';
  else if (val < 40) band = 'tender';
  return { value: val, band };
}

/** Everything the Nest header needs in one call. */
export function happinessSnapshot(now = Date.now()) {
  return {
    gratitudeStreak: gratitudeStreak(now),
    wins: read(K.wins, []).length,
    kindness: read(K.kindness, []).length,
    helping: getHelping(),
    lightness: lightness(now),
  };
}
