/* creatureSnapshot.js — the data layer for Nova's home-screen widget.

   The widget is not a new feature. It's a THIRD RENDERER on top of the same
   Creature lifecycle that the in-app view already draws — alongside the app UI.
   This file is the client-side stand-in for the two backend endpoints that
   renderer talks to, modelled faithfully so the widget UI can be built, wired
   and demoed before any native (WidgetKit / Jetpack Glance) or server code
   exists:

     GET  /v1/creature/snapshot   → getSnapshot()   (+ ETag / If-None-Match)
     POST /v1/creature/interact   → interact(action) (feed | pet, rate-limited)

   Plus the three things that make the widget cheap to refresh at scale:
     · FriendSnapshotCache — a precomputed, denormalized friends row so a
       widget reload never fans out to live per-friend queries.
     · Push-trigger evaluation — decides which state changes are worth a silent
       push + timeline reload, and which are sub-milestone noise to swallow.
     · A friend-notification debounce (≤1/hour) that protects the OS refresh
       budget from flicker.

   SCOPE HONESTY (same posture as novaNudges / happinessEngine): every rule here
   is real and client-side — real XP thresholds, real growth FSM, real rate
   limiter, real ETag, real debounce. What's simulated is only the network: the
   "server" is localStorage, and the friends are a seeded cohort standing in for
   FriendSnapshotCache rows. Swap the two functions' bodies for fetch() the day
   the backend lands; every caller and every trigger stays identical. */

const K = {
  creature: 'dig_in_creature',        // { xp, mood, lastFedAt, lastPetAt, bornAt, stageSeen }
  rate:     'dig_in_creature_rate',   // [epochMs, …] recent interaction timestamps (server backstop)
  pushlog:  'dig_in_creature_pushlog',// [{ kind, at, key }] fired silent-push history (for debounce)
  budget:   'dig_in_creature_budget', // { day: 'YYYY-MM-DD', reloads: n } OS refresh accounting
};

function read(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; }
  catch { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

/* ── Growth FSM ──────────────────────────────────────────────────
   Server-authoritative in production; the thresholds live here so the widget
   can render xp/xpToNext without a second call. Cumulative XP gates each stage;
   `next` is the delta the progress ring fills toward. */
/* Growth reads as a Y2K style glow-up — a Pixel-Chix-bodied, Ulala-pigtailed
   dancer whose outfit levels up through the Space Channel 5 colour run
   (blush → hot pink → orange → electric blue → chrome → holo). `look` keys the
   NovaSprite palette; keys stay stable for the FSM. */
export const STAGES = [
  { key: 'egg',       label: 'Trainee',  look: 'blush',  glyph: '🌸', at: 0,    next: 60,   blurb: 'Just plugged in.' },
  { key: 'hatchling', label: 'Popstar',  look: 'pink',   glyph: '🎀', at: 60,   next: 120,  blurb: 'Found her signature pink.' },
  { key: 'sprout',    label: 'Groovy',   look: 'orange', glyph: '🧡', at: 180,  next: 220,  blurb: 'Turning up the heat.' },
  { key: 'juvenile',  label: 'Neon',     look: 'blue',   glyph: '💠', at: 400,  next: 350,  blurb: 'Electric and unstoppable.' },
  { key: 'adult',     label: 'Chrome',   look: 'white',  glyph: '🤍', at: 750,  next: 550,  blurb: 'Cool, polished, iconic.' },
  { key: 'radiant',   label: 'Hologram', look: 'silver', glyph: '✨', at: 1300, next: null, blurb: 'Fully holographic. Maxed.' },
];

export function stageForXp(xp) {
  let s = STAGES[0];
  for (const st of STAGES) if (xp >= st.at) s = st;
  return s;
}
function xpToNext(xp) {
  const s = stageForXp(xp);
  if (s.next == null) return { into: 0, need: 0, ring: 1 };
  const into = xp - s.at;
  return { into, need: s.next, ring: Math.min(1, into / s.next) };
}

/* ── Mood ────────────────────────────────────────────────────────
   A read-only function of time since the last feed/pet — the widget shows it,
   it never sets it. Hunger climbs with neglect; a recent pet reads playful. */
export const MOODS = {
  excited: { label: 'excited', face: '◕‿◕', tone: '#e68a4e' },
  content: { label: 'content', face: '◡‿◡', tone: '#7c5daf' },
  playful: { label: 'playful', face: '≧◡≦', tone: '#3a9d8f' },
  sleepy:  { label: 'sleepy',  face: '－‿－', tone: '#8b8194' },
  hungry:  { label: 'hungry',  face: '◉︵◉', tone: '#c26a6a' },
};
const HOUR = 3_600_000;
function moodFor(c, now) {
  const sinceFed = now - (c.lastFedAt || c.bornAt);
  const sincePet = now - (c.lastPetAt || 0);
  if (sincePet < 30_000) return 'playful';           // pet in the last 30s
  if (sinceFed < 2 * HOUR) return 'excited';         // freshly fed
  if (sinceFed > 20 * HOUR) return 'hungry';         // long neglect
  const hr = new Date(now).getHours();
  if (hr >= 23 || hr < 6) return 'sleepy';
  return 'content';
}

function loadCreature() {
  const now = Date.now();
  return read(K.creature, {
    xp: 150, mood: 'content', lastFedAt: now - 5 * HOUR, lastPetAt: 0,
    bornAt: now - 26 * HOUR, stageSeen: 'sprout',
  });
}

/* ── Reminder ────────────────────────────────────────────────────
   At most ONE reminder rides in a snapshot — the single most relevant nudge.
   Computed server-side from last-known state (never live location, per the
   privacy note): streak-at-risk wins, then a discovered nearby store, then a
   fresh badge. Returns null when nothing is worth the widget's attention. */
function computeReminder(c, now) {
  const sinceFed = now - (c.lastFedAt || c.bornAt);
  if (sinceFed > 18 * HOUR) {
    const hrsLeft = Math.max(1, Math.round((24 * HOUR - sinceFed) / HOUR));
    return { type: 'streak_risk', text: `Streak resets in ${hrsLeft}h`, expiresAt: c.lastFedAt + 24 * HOUR };
  }
  if (c.nearbyStore) {
    return { type: 'nearby_store', text: `${c.nearbyStore} is 4 min away`, expiresAt: now + 2 * HOUR };
  }
  if (c.freshBadge) {
    return { type: 'badge_earned', text: `Badge earned: ${c.freshBadge}`, expiresAt: now + 6 * HOUR };
  }
  return null;
}

/* ── FriendSnapshotCache (denormalized read model) ───────────────
   In production these are precomputed rows refreshed by the debounce logic
   below — never a live per-friend query on the widget's hot path. Here they're
   a stable seeded cohort so the friends row renders identically every reload. */
const FRIEND_SEED = [
  { id: 'f_mara',  initial: 'M', level: 5, mood: 'content', stage: 'adult' },
  { id: 'f_theo',  initial: 'T', level: 3, mood: 'hungry',  stage: 'juvenile' },
  { id: 'f_rue',   initial: 'R', level: 7, mood: 'excited', stage: 'radiant' },
  { id: 'f_juno',  initial: 'J', level: 2, mood: 'sleepy',  stage: 'sprout' },
  { id: 'f_kwan',  initial: 'K', level: 4, mood: 'playful', stage: 'juvenile' },
];
export function friendCache() { return FRIEND_SEED.map(f => ({ ...f })); }

/* ── ETag ────────────────────────────────────────────────────────
   Cheap stable hash of the payload so a reload that finds nothing changed can
   answer 304 and cost next to nothing — the whole point of a battery path. */
function etagOf(payload) {
  const s = JSON.stringify(payload);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `W/"${h.toString(36)}"`;
}

/* ════════════════════════════════════════════════════════════════
   GET /v1/creature/snapshot
   Deliberately small (well under 2KB). Pass the last ETag as `ifNoneMatch`;
   an unchanged snapshot comes back { notModified: true } with no body — model
   the 304 so the caller's refresh-budget accounting is honest.
   ════════════════════════════════════════════════════════════════ */
export function getSnapshot({ ifNoneMatch, withFriends = true } = {}) {
  const now = Date.now();
  const c = loadCreature();
  const st = stageForXp(c.xp);
  const ring = xpToNext(c.xp);
  const body = {
    creature: {
      stage: st.key, glyph: st.glyph, mood: moodFor(c, now),
      xp: c.xp, xpToNext: ring.need, xpInto: ring.into,
    },
    reminder: computeReminder(c, now),
    friends: withFriends ? friendCache().map(({ stage, ...mini }) => mini) : [],
  };
  const etag = etagOf(body);
  countReload(now);
  if (ifNoneMatch && ifNoneMatch === etag) return { notModified: true, etag, status: 304 };
  return { ...body, etag, status: 200, bytes: JSON.stringify(body).length };
}

/* ════════════════════════════════════════════════════════════════
   POST /v1/creature/interact  { action: 'feed' | 'pet' }
   The SAME mutation the in-app buttons call — no divergent logic. The widget
   bypasses the app's UI throttling, so the SERVER is the rate-limit backstop:
   a handful of calls/minute, enforced here regardless of which renderer asked.
   ════════════════════════════════════════════════════════════════ */
export const RATE = { max: 6, windowMs: 60_000 };

export function rateState(now = Date.now()) {
  const hits = read(K.rate, []).filter(t => now - t < RATE.windowMs);
  return { used: hits.length, remaining: Math.max(0, RATE.max - hits.length), max: RATE.max };
}

const GAIN = { feed: 35, pet: 8 };

export function interact(action, now = Date.now()) {
  if (action !== 'feed' && action !== 'pet') {
    return { ok: false, error: 'unknown_action' };
  }
  const hits = read(K.rate, []).filter(t => now - t < RATE.windowMs);
  if (hits.length >= RATE.max) {
    const retryMs = RATE.windowMs - (now - hits[0]);
    return { ok: false, error: 'rate_limited', retryAfterMs: retryMs, status: 429 };
  }
  const before = loadCreature();
  const prevStage = stageForXp(before.xp).key;
  const c = { ...before, xp: before.xp + GAIN[action] };
  if (action === 'feed') c.lastFedAt = now;
  if (action === 'pet') c.lastPetAt = now;
  const nextStage = stageForXp(c.xp).key;
  c.stageSeen = nextStage;
  write(K.creature, c);
  write(K.rate, [...hits, now]);

  const evolved = nextStage !== prevStage;
  const triggers = evaluateTriggers({ prevStage, nextStage, evolved }, now);
  return {
    ok: true, status: 200, action, gained: GAIN[action],
    evolved, prevStage, nextStage, triggers,
    snapshot: getSnapshot(),
  };
}

/* ── Push-trigger evaluation + debounce ──────────────────────────
   Which state changes earn a silent push (content-available:1 / data-only FCM)
   that wakes the extension to refetch + reload the timeline — and which are
   swallowed as sub-milestone noise. Friend-originated pushes are batched to at
   most one/hour so several friends updating together can't burn the budget or
   flicker the widget. Returns the pushes that would actually fire. */
export function evaluateTriggers({ prevStage, nextStage, evolved }, now = Date.now()) {
  const log = read(K.pushlog, []);
  const out = [];
  const fire = (kind, key, text) => {
    // debounce: one push per (kind) per hour, keyed so identical events collapse
    const recent = log.find(p => p.kind === kind && now - p.at < HOUR);
    if (recent) return;
    const evt = { kind, key, text, at: now };
    log.push(evt); out.push(evt);
  };
  if (evolved) fire('evolve', nextStage, `Nova evolved to ${nextStage}`);
  const c = loadCreature();
  const rem = computeReminder(c, now);
  if (rem?.type === 'streak_risk') fire('streak_risk', rem.expiresAt, rem.text);
  write(K.pushlog, log.slice(-40));
  return out;
}

/** Simulate a followed friend's creature hitting a milestone — exercises the
    ≤1/hour friend-notification debounce without a real social backend. */
export function simulateFriendMilestone(name = 'a friend', now = Date.now()) {
  const log = read(K.pushlog, []);
  const recent = log.find(p => p.kind === 'friend' && now - p.at < HOUR);
  if (recent) {
    const waitMin = Math.ceil((HOUR - (now - recent.at)) / 60000);
    return { fired: false, reason: 'debounced', retryInMin: waitMin };
  }
  const evt = { kind: 'friend', key: name, text: `${name}'s creature evolved`, at: now };
  log.push(evt); write(K.pushlog, log.slice(-40));
  return { fired: true, event: evt };
}

export function pushLog() { return read(K.pushlog, []).slice().reverse(); }

/* ── OS refresh-budget accounting ────────────────────────────────
   The system, not the app, controls how often a home-screen widget reloads
   (~40–70/day). We can't force reloads; we can only spend them well. This
   counts snapshot reads against a daily budget so the UI can show how close
   the design runs to the ceiling. */
export const BUDGET_CEIL = 70;
function dayKey(now) { return new Date(now).toISOString().slice(0, 10); }
function countReload(now) {
  const b = read(K.budget, { day: dayKey(now), reloads: 0 });
  if (b.day !== dayKey(now)) { b.day = dayKey(now); b.reloads = 0; }
  b.reloads += 1; write(K.budget, b);
}
export function budgetState(now = Date.now()) {
  const b = read(K.budget, { day: dayKey(now), reloads: 0 });
  if (b.day !== dayKey(now)) return { day: dayKey(now), reloads: 0, ceil: BUDGET_CEIL };
  return { ...b, ceil: BUDGET_CEIL };
}

/** Test/demo helper: wind the creature back to a chosen state. */
export function resetCreature(patch = {}) {
  const now = Date.now();
  write(K.creature, {
    xp: 150, mood: 'content', lastFedAt: now - 5 * HOUR, lastPetAt: 0,
    bornAt: now - 26 * HOUR, stageSeen: 'sprout', ...patch,
  });
  write(K.rate, []);
  return getSnapshot();
}

/** Force the streak into the risk window so the reminder path is demoable. */
export function forceStreakRisk() {
  const c = loadCreature();
  c.lastFedAt = Date.now() - 19 * HOUR;
  write(K.creature, c);
  return getSnapshot();
}
