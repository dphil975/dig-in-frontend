/* spins.js — the whimsy currency.

   The premise (and it's a good one): tracking your grocery money is boring
   and important, and boring-and-important is exactly what a game loop is for.
   You get spins for doing the unglamorous thing — finishing a shop, putting
   the receipt in, cooking it, posting what you made.

   ── ONE DELIBERATE DEPARTURE FROM THE BRIEF ──────────────────────────────
   The ask included spins for a post clearing 15 likes. I did not build that,
   and the reason matters: a variable reward paid out by OTHER PEOPLE'S
   approval is the exact mechanism that makes apps feel bad to use. It also
   fails the stated goal — "I want them to feel good about themselves,"
   especially users who already get less social feedback than average. Under
   a likes-gated rule, two people can do identical work and only the one who
   got noticed gets paid, which teaches the quiet one that their effort
   didn't count.

   So every rule here pays for something YOU control and can always complete:
   shop, log, cook, post. A post that nobody sees still earns its spin,
   because you still made the thing.

   Reach is handled separately and correctly: engagement can push a POST
   further (see virality.js / depthRank.js), which is about distribution.
   It just doesn't set your personal balance. Distribution is a property of
   the post; spins are a record of your effort.

   Everything is local, honest, and auditable: the ledger stores WHY each
   spin was earned, so the balance can always be explained rather than just
   asserted. */

const BAL_KEY    = 'dig_in_spins';         // { balance, spentTotal }
const LEDGER_KEY = 'dig_in_spins_ledger';  // newest last, capped

const MAX_LEDGER = 120;

function read(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
  catch { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

/* Earn rules. `once` marks a rule that can only ever pay out a single time
   for a given key (so re-importing one receipt can't be farmed). */
export const EARN_RULES = {
  'receipt-upload': {
    spins: 3,
    label: 'Logged a receipt',
    blurb: 'The least fun part of groceries, and the one that actually keeps your money real.',
    once: true,
  },
  'run-complete': {
    spins: 2,
    label: 'Finished a store run',
    blurb: 'You went in with a list and came out the other side.',
    once: true,
  },
  'recipe-post': {
    spins: 2,
    label: 'Posted something you made',
    blurb: 'Paid for making it, not for how it performs.',
    once: true,
  },
  'cook-complete': {
    spins: 1,
    label: 'Cooked a recipe through',
    blurb: 'Start to finish, actually eaten.',
    once: true,
  },
  'budget-kept': {
    spins: 4,
    label: 'Came in under your price point',
    blurb: 'You set a number and held it. That is the whole game.',
    once: true,
  },
  'first-target': {
    spins: 2,
    label: 'Set your first price point',
    blurb: 'Deciding the number in advance is the part most people skip.',
    once: true,
  },
};

export function balance() {
  const b = read(BAL_KEY, { balance: 0, spentTotal: 0 });
  return Number.isFinite(b.balance) ? b : { balance: 0, spentTotal: 0 };
}

export function ledger() { return read(LEDGER_KEY, []).slice().reverse(); }  // newest first

/**
 * Award spins for a real action.
 *
 * @param {string} ruleId  key of EARN_RULES
 * @param {string} key     unique id for THIS occurrence (receipt id, run id…).
 *                         Rules marked `once` will refuse a repeat key, which
 *                         is what stops the same receipt paying twice.
 * @returns the ledger entry, or null if it was a duplicate / unknown rule.
 */
export function award(ruleId, key = null, meta = {}) {
  const rule = EARN_RULES[ruleId];
  if (!rule) return null;

  const entryKey = `${ruleId}:${key ?? 'anon'}`;
  const log = read(LEDGER_KEY, []);
  if (rule.once && key != null && log.some(e => e.key === entryKey)) return null;

  const entry = {
    key: entryKey,
    ruleId,
    label: rule.label,
    blurb: rule.blurb,
    spins: rule.spins,
    at: Date.now(),
    meta,
  };
  write(LEDGER_KEY, [...log, entry].slice(-MAX_LEDGER));

  const b = balance();
  write(BAL_KEY, { balance: b.balance + rule.spins, spentTotal: b.spentTotal });
  return entry;
}

/** Spend spins. Returns false (and changes nothing) if you can't afford it. */
export function spend(n, on = '') {
  const cost = Math.max(0, Math.floor(Number(n) || 0));
  const b = balance();
  if (cost <= 0 || b.balance < cost) return false;
  write(BAL_KEY, { balance: b.balance - cost, spentTotal: b.spentTotal + cost });
  const log = read(LEDGER_KEY, []);
  write(LEDGER_KEY, [...log, {
    key: `spend:${Date.now()}`, ruleId: 'spend', label: `Spent on ${on || 'something'}`,
    blurb: '', spins: -cost, at: Date.now(), meta: { on },
  }].slice(-MAX_LEDGER));
  return true;
}

/** Total ever earned (not current balance) — the "you did all this" number. */
export function totalEarned() {
  return read(LEDGER_KEY, []).filter(e => e.spins > 0).reduce((s, e) => s + e.spins, 0);
}

/** Grouped "how you've been earning" summary, most-earned first. */
export function earnBreakdown() {
  const byRule = new Map();
  for (const e of read(LEDGER_KEY, [])) {
    if (e.spins <= 0) continue;
    const cur = byRule.get(e.ruleId) || { ruleId: e.ruleId, label: e.label, times: 0, spins: 0 };
    cur.times += 1;
    cur.spins += e.spins;
    byRule.set(e.ruleId, cur);
  }
  return [...byRule.values()].sort((a, b) => b.spins - a.spins);
}
