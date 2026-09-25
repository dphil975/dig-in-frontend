/* budgetTarget.js — a price point you set, and the honest running answer to
   "where am I against it?"

   THE PROBLEM THIS IS FOR: money stops feeling real. You tap a card, a number
   moves somewhere you can't see, and inflation quietly rewrites what every
   number means. The app already knew two things separately — what a recipe
   SHOULD cost (tierBudget.priceRecipe) and what you ACTUALLY paid
   (storeMemory's price history + receipts) — and never put them in the same
   sentence. This does.

   THREE NUMBERS, KEPT DISTINCT ON PURPOSE:
   - `target`   what you decided to spend. Set in $5 increments, because a
                budget you have to think about in cents isn't one you'll keep.
   - `planned`  an ESTIMATE of the cart in front of you (tierBudget's bucket
                pricing). Always labeled an estimate. Recomputed live as
                ingredients change, which is the "the price updates when you
                swap something" behavior.
   - `spent`    real money, only ever from a real receipt or a real logged
                purchase. Never estimated, never inferred.

   Collapsing planned into spent would be the easy version and a lie — you'd
   see a confident number that never matched your bank. They stay separate,
   and `projected` (spent + planned) is clearly derived from both.

   MAKING IT CONCRETE: `mealsLeft()` translates money back into the thing it
   buys. "$23 left" is abstract; "about 3 more dinners" is not. That
   translation only runs off YOUR real logged history — no history, no claim. */

import { priceRecipe, priceIngredientList, getUserTier } from './tierBudget';

const TARGET_KEY  = 'dig_in_budget_target';
const ACTUALS_KEY = 'dig_in_budget_actuals';

/** Budgets are set in $5 steps. Small enough to be precise, big enough to keep. */
export const INCREMENT = 5;
export const MIN_TARGET = 5;
export const MAX_TARGET = 500;

function read(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
  catch { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

/** Snap any number to the nearest $5, clamped to a sane range. */
export function snap(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return MIN_TARGET;
  const stepped = Math.round(n / INCREMENT) * INCREMENT;
  return Math.min(MAX_TARGET, Math.max(MIN_TARGET, stepped));
}

/** The $5 ladder, for a stepper/slider UI. */
export function ladder(max = 200) {
  const out = [];
  for (let v = MIN_TARGET; v <= Math.min(max, MAX_TARGET); v += INCREMENT) out.push(v);
  return out;
}

/* ── the target ───────────────────────────────────────────────────────── */

export function getTarget() {
  const t = read(TARGET_KEY, null);
  return t && Number.isFinite(t.amount) ? t : null;
}

/**
 * Set (or re-set) the price point. Setting a NEW target starts a new period:
 * previously logged spend belongs to the budget it was logged against, and
 * silently carrying it forward would make a fresh budget look pre-spent.
 */
export function setTarget(amount, label = '') {
  const t = { amount: snap(amount), setAt: Date.now(), label: String(label || '').trim() };
  write(TARGET_KEY, t);
  write(ACTUALS_KEY, []);
  return t;
}

export function clearTarget() {
  write(TARGET_KEY, null);
  write(ACTUALS_KEY, []);
}

export function adjustTarget(deltaSteps) {
  const cur = getTarget();
  if (!cur) return null;
  const next = { ...cur, amount: snap(cur.amount + deltaSteps * INCREMENT) };
  write(TARGET_KEY, next);
  return next;   // deliberately does NOT wipe actuals — nudging a target isn't a new period
}

/* ── real spend ───────────────────────────────────────────────────────── */

export function actuals() { return read(ACTUALS_KEY, []); }

/**
 * Log real money spent. `source` records where the number came from so the
 * UI can be honest about its provenance ('receipt' | 'manual' | 'pickup').
 * Receipt-imported totals are the trustworthy ones; a typed number is still
 * real money but the user chose it.
 */
export function logSpend({ total, store = '', source = 'manual', at = Date.now(), id = null }) {
  const amount = Number(total);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const entry = { id: id || `${source}-${at}`, total: +amount.toFixed(2), store: String(store || '').trim(), source, at };
  const list = actuals();
  // Idempotent by id — importing the same receipt twice must not double-count.
  if (list.some(e => e.id === entry.id)) return null;
  write(ACTUALS_KEY, [...list, entry]);
  return entry;
}

export function spent() {
  return +actuals().reduce((s, e) => s + e.total, 0).toFixed(2);
}

/* ── the estimate side ────────────────────────────────────────────────── */

/**
 * Estimated cost of what's in front of you right now. Accepts either a
 * recipe (uses servings for per-serving math) or a bare ingredient list.
 * This is the number that moves when a swap happens.
 */
export function planCost(ingredients, recipe = null, tier = null) {
  const list = (ingredients || []).map(i => (typeof i === 'string' ? i : (i?.name || ''))).filter(Boolean);
  if (!list.length) return { total: 0, rows: [], estimate: true, perServing: null };
  const t = tier || getUserTier();
  const priced = recipe ? priceRecipe(list, recipe, t) : priceIngredientList(list, t);
  return {
    total: priced.total,
    rows: priced.rows,
    perServing: priced.perServing ?? null,
    onHandCount: priced.onHandCount,
    store: priced.store,
    tier: priced.tier,
    estimate: true,
  };
}

/* ── where you stand ──────────────────────────────────────────────────── */

/**
 * @param {number} planned  estimated cost of the current cart (0 if none)
 * @returns null when no target is set — the caller should show the "set one"
 *   state rather than a budget of $0, which would read as "you're over."
 */
export function budgetStatus(planned = 0) {
  const t = getTarget();
  if (!t) return null;

  const realSpent = spent();
  const plan = Math.max(0, Number(planned) || 0);
  const projected = +(realSpent + plan).toFixed(2);
  const remaining = +(t.amount - projected).toFixed(2);
  const pctUsed = t.amount > 0 ? Math.min(999, Math.round((projected / t.amount) * 100)) : 0;

  let verdict;
  if (remaining < 0) verdict = 'over';
  else if (pctUsed >= 85) verdict = 'close';
  else verdict = 'under';

  return {
    target: t.amount,
    label: t.label,
    setAt: t.setAt,
    spent: realSpent,
    planned: plan,
    projected,
    remaining,
    pctUsed,
    verdict,
    entries: actuals().length,
  };
}

/**
 * Money translated back into what it buys — the antidote to "it's just a
 * number." Uses YOUR real average receipt, and returns null rather than
 * guessing when there isn't enough real history to say anything true.
 */
export function mealsLeft(remaining, { minReceipts = 2, servingsPerTrip = 4 } = {}) {
  const list = actuals().filter(e => e.source === 'receipt' || e.source === 'pickup');
  if (list.length < minReceipts || remaining <= 0) return null;
  const avgTrip = list.reduce((s, e) => s + e.total, 0) / list.length;
  if (avgTrip <= 0) return null;
  const perMeal = avgTrip / servingsPerTrip;
  if (perMeal <= 0) return null;
  return {
    meals: Math.floor(remaining / perMeal),
    perMeal: +perMeal.toFixed(2),
    basedOn: list.length,
  };
}
