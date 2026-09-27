/* ════════════════════════════════════════════════════════════
   Life modes — the "season of life" a person declares ("I just moved", "New
   baby", …). Small on purpose: the sidebar, Settings, onboarding and the feed
   all read it, and it used to live inside buildFeed.js, so anything that only
   wanted the list of seasons loaded the whole feed engine. (buildFeed.js
   re-exports these, so old imports still work.)
   ════════════════════════════════════════════════════════════ */

const DAY_MS = 86400000;

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
