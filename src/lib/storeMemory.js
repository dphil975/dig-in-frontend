/* storeMemory — the Store Memory Profile engine.

   Turns the receipts and pantry purchases the shopper already logs into a
   per-store memory: what you usually buy here, what's probably due for a
   refill, what you tried for the first time (and whether you liked it), and
   whether a familiar item has quietly shrunk. It's the brain behind the
   flip-card "Store Memory" on the map — this module holds no UI.

   Everything here reads/writes the SAME pantry data the Pantry page already
   owns (`dig_in_pantry`, `dig_in_receipts`) plus a few new small stores:
     dig_in_store_aliases     { [storeId]: string[] }        user nicknames
     dig_in_item_sizes        { [itemKey]: SizeEntry[] }     shrinkflation history
     dig_in_item_photos       { [itemKey]: dataUrl }         reference photos
     dig_in_new_item_feedback { [itemKey]: FeedbackEntry }   "did you like it?"

   SCOPE HONESTY: there is no server and no push-notification backend here —
   the "3 days later, remind me" check runs client-side, on app open (Pantry
   mount), same as every other notification in this app (see novaNudges). It
   fires once real Notification permission is granted and the app happens to
   be opened after the window has passed; it is not a guaranteed background
   push. Shrinkflation only compares same-unit sizes (12oz → 10oz) — it does
   not convert between units (oz ↔ g), which would be more fragile than useful. */

const ALIAS_KEY     = 'dig_in_store_aliases';
const SIZES_KEY      = 'dig_in_item_sizes';
const PHOTOS_KEY     = 'dig_in_item_photos';
const FEEDBACK_KEY   = 'dig_in_new_item_feedback';
const SHRINK_KEY      = 'dig_in_shrinkflation_alerts';
const PRICE_KEY       = 'dig_in_price_history';
const PANTRY_KEY     = 'dig_in_pantry';
const RECEIPTS_KEY   = 'dig_in_receipts';

const DAY_MS = 86400000;

function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
  catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

/* ── Item identity ─────────────────────────────────────────────────────────
   One normalized key per item name, shared across stores/purchases so "Ritz
   Crackers" and "ritz crackers " count as the same item everywhere. */
export function itemKey(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}
function titleCase(s) {
  return String(s || '').replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

/* ── Store aliases ──────────────────────────────────────────────────────────
   User-entered nicknames for a store ("Tony's", "the corner spot"). A store
   can have several; they're also used to match free-text receipt/pantry store
   names back to this store. */
export function getAliases(storeId) {
  return load(ALIAS_KEY, {})[storeId] || [];
}
export function addAlias(storeId, alias) {
  const clean = String(alias || '').trim();
  if (!clean) return getAliases(storeId);
  const all = load(ALIAS_KEY, {});
  const list = all[storeId] || [];
  if (!list.some(a => a.toLowerCase() === clean.toLowerCase())) list.push(clean);
  all[storeId] = list;
  save(ALIAS_KEY, all);
  return list;
}
export function removeAlias(storeId, alias) {
  const all = load(ALIAS_KEY, {});
  all[storeId] = (all[storeId] || []).filter(a => a !== alias);
  save(ALIAS_KEY, all);
  return all[storeId];
}

// Strip apostrophes without leaving a gap ("Tony's" → "tonys") so it still
// matches "Tonys" with no punctuation at all; everything else becomes a space.
const norm = s => String(s || '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

/** Does this free-text store name (from a receipt or pantry item) refer to
    `store` — by canonical name or any user alias? Loose substring match either
    direction, so "KROGER #4521" matches an alias of just "Kroger". */
export function matchesStore(text, store, aliases = []) {
  const t = norm(text);
  if (!t || !store) return false;
  // A 2-char floor, not 3 — aliases are something the shopper deliberately
  // typed for this exact store ("WF", "CVS"), so a short one is still a
  // meaningful, intentional identifier, not noise to filter out.
  const candidates = [store.name, ...aliases].map(norm).filter(Boolean);
  return candidates.some(c => c.length >= 2 && (t.includes(c) || c.includes(t)));
}

/** Every pantry item ever logged against this store (by name or alias match). */
export function itemsForStore(store) {
  if (!store) return [];
  const aliases = getAliases(store.id);
  const pantry = load(PANTRY_KEY, []);
  return pantry.filter(i => i.store && matchesStore(i.store, store, aliases));
}

/** Every receipt trip logged against this store (by name or alias match). */
export function receiptsForStore(store) {
  if (!store) return [];
  const aliases = getAliases(store.id);
  const receipts = load(RECEIPTS_KEY, []);
  return receipts.filter(r => r.store && matchesStore(r.store, store, aliases));
}

/* ── Purchase-pattern intelligence ────────────────────────────────────────── */

/**
 * Analyze a store's purchase history.
 * @returns { frequent: [{name,count,lastBoughtAt}], dueToRepurchase: [{name,daysOverdue,avgIntervalDays}],
 *            newItems: [{name,boughtAt}] }
 */
export function analyzeStorePurchases(store, now = new Date()) {
  const items = itemsForStore(store);
  const allPantry = load(PANTRY_KEY, []);

  const byName = new Map();
  for (const item of items) {
    const k = itemKey(item.name);
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(item);
  }

  const frequent = [];
  const dueToRepurchase = [];
  const newItems = [];

  for (const [k, purchases] of byName) {
    const sorted = [...purchases].sort((a, b) => new Date(a.boughtAt || a.at) - new Date(b.boughtAt || b.at));
    const name = titleCase(sorted[0].name);
    const lastBoughtAt = sorted[sorted.length - 1].boughtAt || sorted[sorted.length - 1].at;

    if (sorted.length >= 2) {
      frequent.push({ key: k, name, count: sorted.length, lastBoughtAt });

      // Average interval between purchases → is a repurchase probably due?
      const times = sorted.map(p => new Date(p.boughtAt || p.at).getTime());
      let gaps = 0, gapSum = 0;
      for (let i = 1; i < times.length; i++) { gapSum += times[i] - times[i - 1]; gaps++; }
      const avgIntervalDays = gaps ? gapSum / gaps / DAY_MS : null;
      const daysSince = (now - new Date(lastBoughtAt)) / DAY_MS;
      if (avgIntervalDays && daysSince >= avgIntervalDays * 0.85) {
        dueToRepurchase.push({ key: k, name, daysOverdue: Math.round(daysSince - avgIntervalDays), avgIntervalDays: Math.round(avgIntervalDays), lastBoughtAt });
      }
    } else {
      // "New" here at this store — but only truly new if it's never appeared
      // anywhere else in pantry history either (a first-time purchase, not
      // just a first-time-at-this-store repeat of something familiar).
      const everywhereCount = allPantry.filter(i => itemKey(i.name) === k).length;
      if (everywhereCount <= 1) newItems.push({ key: k, name, boughtAt: lastBoughtAt });
    }
  }

  frequent.sort((a, b) => b.count - a.count);
  dueToRepurchase.sort((a, b) => b.daysOverdue - a.daysOverdue);
  newItems.sort((a, b) => new Date(b.boughtAt) - new Date(a.boughtAt));

  return { frequent: frequent.slice(0, 8), dueToRepurchase: dueToRepurchase.slice(0, 6), newItems: newItems.slice(0, 6) };
}

/* ── "Did you like it?" new-item feedback ─────────────────────────────────── */

function loadFeedback() { return load(FEEDBACK_KEY, {}); }
function saveFeedback(v) { save(FEEDBACK_KEY, v); }

/** Called from Pantry's buy()/importReceipt() on every purchase — registers a
    first-time item for the "did you like it?" loop. If the item is already
    tracked and still unanswered, a REPEAT purchase counts as an implicit yes
    (you kept buying it) so the prompt naturally stops — the shopper only ever
    gets asked about something they bought exactly once. */
export function registerFirstPurchase(name, storeText, now = new Date()) {
  const nowDate = now instanceof Date ? now : new Date(now);
  const k = itemKey(name);
  const all = loadFeedback();
  if (!all[k]) {
    all[k] = { name: titleCase(name), storeText: storeText || null, boughtAt: nowDate.toISOString(), liked: null, promptedAt: null, notifiedAt: null };
    saveFeedback(all);
    return;
  }
  if (all[k].liked === null) {
    all[k].liked = true;
    saveFeedback(all);
  }
}

/** Unanswered new items to prompt "did you like it?" for, scoped to a store. */
export function pendingFeedbackForStore(store) {
  const all = loadFeedback();
  const aliases = getAliases(store.id);
  return Object.entries(all)
    .filter(([, f]) => f.liked === null && f.storeText && matchesStore(f.storeText, store, aliases))
    .map(([key, f]) => ({ key, ...f }));
}

export function answerFeedback(key, liked) {
  const all = loadFeedback();
  if (!all[key]) return;
  all[key].liked = liked;
  saveFeedback(all);
}

/**
 * Client-side check for "it's been 3+ days and you never said" — call this on
 * app open (Pantry mount). Fires a browser Notification for each item that
 * qualifies, using the exact permission pattern novaNudges uses, and marks it
 * notified so it only fires once. Also looks up a recipe that uses the
 * ingredient (if `suggestFn` is given) so the nudge is actionable, not just a
 * reminder. Returns the list of items notified this call (for a UI toast too).
 */
export function checkNewItemReminders(now = new Date(), suggestFn = null) {
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const all = loadFeedback();
  const due = [];
  for (const [key, f] of Object.entries(all)) {
    if (f.liked !== null || f.notifiedAt) continue;
    const daysSince = (now - new Date(f.boughtAt)) / DAY_MS;
    if (daysSince >= 3) due.push({ key, ...f });
  }
  if (!due.length) return [];

  for (const item of due) {
    all[item.key].notifiedAt = now.toISOString();
    if (supported && window.Notification.permission === 'granted') {
      let body = `You picked up ${item.name} a few days ago — how was it?`;
      if (suggestFn) {
        const recipe = suggestFn(item.name);
        if (recipe) body = `Still have that ${item.name}? ${recipe} would use it up.`;
      }
      try { new window.Notification('Dig In · New item check-in', { body }); } catch { /* ignore */ }
    }
  }
  saveFeedback(all);
  return due;
}

/* ── Shrinkflation tracking ────────────────────────────────────────────────
   Free-text size like "12 oz" / "500g" / "1 lb" / "24 ct" parsed into a
   {value, unit} pair. Comparisons only ever happen within the same unit. */
export function parseSize(text) {
  const m = String(text || '').trim().match(/^([\d.]+)\s*(fl\s*oz|oz|lb|lbs|g|kg|ct|count|pk|pack)$/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  let unit = m[2].toLowerCase().replace(/\s+/g, '');
  if (unit === 'lbs') unit = 'lb';
  if (unit === 'count' || unit === 'pk' || unit === 'pack') unit = 'ct';
  return { value, unit };
}

function loadSizes() { return load(SIZES_KEY, {}); }
function saveSizes(v) { save(SIZES_KEY, v); }

/** Record a purchase's size (if the shopper entered one) and return a
    shrinkflation alert if this purchase is smaller-for-same-or-more money
    than the last recorded purchase of the same item. */
export function recordSizeAndCheckShrinkflation(name, sizeText, price, now = new Date()) {
  const parsed = parseSize(sizeText);
  if (!parsed) return null;
  const nowDate = now instanceof Date ? now : new Date(now);
  const k = itemKey(name);
  const all = loadSizes();
  const history = all[k] || [];
  const prior = [...history].reverse().find(h => h.unit === parsed.unit);

  let alert = null;
  if (prior && parsed.value < prior.value && (price == null || prior.price == null || price >= prior.price)) {
    alert = {
      name: titleCase(name),
      wasSize: `${prior.value}${prior.unit}`, wasPrice: prior.price,
      nowSize: `${parsed.value}${parsed.unit}`, nowPrice: price,
      percentSmaller: Math.round((1 - parsed.value / prior.value) * 100),
    };
  }

  history.push({ value: parsed.value, unit: parsed.unit, price: price ?? null, at: nowDate.toISOString() });
  all[k] = history.slice(-12); // keep recent history bounded
  saveSizes(all);
  return alert;
}

export function shrinkflationHistory(name) {
  return loadSizes()[itemKey(name)] || [];
}

/** Persist a detected shrinkflation alert (called from Pantry's buy() flow the
    moment `recordSizeAndCheckShrinkflation` returns one) so it's still visible
    later in the Store Memory Card — not just as a one-time toast. */
export function logShrinkflationAlert(alert, storeText, now = new Date()) {
  const nowDate = now instanceof Date ? now : new Date(now);
  const all = load(SHRINK_KEY, []);
  all.unshift({ ...alert, storeText: storeText || null, at: nowDate.toISOString() });
  save(SHRINK_KEY, all.slice(0, 50));
}

/** Past shrinkflation alerts logged against this store. */
export function shrinkflationAlertsForStore(store) {
  if (!store) return [];
  const aliases = getAliases(store.id);
  return load(SHRINK_KEY, []).filter(a => a.storeText && matchesStore(a.storeText, store, aliases));
}

/* ── Price history & price match ───────────────────────────────────────────
   Separate from shrinkflation tracking above on purpose: shrinkflation needs
   a parsed SIZE to mean anything (smaller-for-the-money only makes sense
   comparing the same unit), which is why recordSizeAndCheckShrinkflation
   silently no-ops without one. A price alone is still worth remembering even
   when no size was entered — which is every receipt-imported item, since a
   receipt line has a name and a price but never a size. This log records
   price on EVERY purchase (one-by-one pickup or receipt import) regardless of
   whether a size was given, and priceMatchFor() reads it back to tell the
   shopper how today's price compares to what they've actually paid before —
   both anywhere, and at this exact store if they've bought it there before.

   Free-text store matching here is deliberately loose (case/punctuation-
   insensitive substring, via the same `norm()` this file already uses for
   matchesStore) rather than the store-ID-based matching those functions use
   — the pickup form and receipt parser only ever have a typed/OCR'd store
   NAME on hand, not a resolved store record. */
function loadPriceHistory() { return load(PRICE_KEY, {}); }
function savePriceHistory(v) { save(PRICE_KEY, v); }

/** Record one purchase's price. No-ops silently on a missing name/price —
    callers don't need to guard the call themselves. */
export function recordPrice(name, price, storeText, now = new Date()) {
  if (price == null || !Number.isFinite(Number(price))) return;
  const nowDate = now instanceof Date ? now : new Date(now);
  const k = itemKey(name);
  const all = loadPriceHistory();
  const history = all[k] || [];
  history.push({ price: Number(price), store: storeText ? String(storeText).trim() : null, at: nowDate.toISOString() });
  all[k] = history.slice(-24); // bounded, same spirit as shrinkflation history
  savePriceHistory(all);
}

export function priceHistoryFor(name) {
  return loadPriceHistory()[itemKey(name)] || [];
}

/**
 * How today's price for `name` compares to what's actually been paid before.
 * Read-only — safe to call live as someone types a price, before they submit.
 * Returns null when there's no prior history to compare against (a genuinely
 * first-time item shouldn't render a comparison it can't back up).
 *
 * @returns {
 *   best:        { price, store, at } | null   the lowest price ever paid
 *   lastAnywhere:{ price, store, at }           the most recent prior purchase
 *   lastAtStore: { price, store, at } | null    most recent prior purchase AT storeText, if given and matched
 *   verdict:     'best' | 'higher' | 'lower' | 'same'   vs. the most relevant comparison (lastAtStore if we have one, else lastAnywhere)
 *   diff:        number                         signed difference driving `verdict` (current − comparison)
 * }
 */
export function priceMatchFor(name, price, storeText = null) {
  const history = priceHistoryFor(name);
  if (!history.length || price == null || !Number.isFinite(Number(price))) return null;
  const current = Number(price);

  const sorted = [...history].sort((a, b) => new Date(a.at) - new Date(b.at));
  const best = sorted.reduce((min, h) => (min == null || h.price < min.price ? h : min), null);
  const lastAnywhere = sorted[sorted.length - 1];
  const lastAtStore = storeText
    ? [...sorted].reverse().find(h => h.store && norm(h.store) === norm(storeText))
    : null;

  const comparison = lastAtStore || lastAnywhere;
  const diff = Math.round((current - comparison.price) * 100) / 100;
  const verdict = diff === 0 ? 'same' : diff > 0 ? 'higher' : 'lower';

  return { best, lastAnywhere, lastAtStore: lastAtStore || null, verdict, diff, comparedAtStore: !!lastAtStore };
}

/* ── Item reference photos ───────────────────────────────────────────────── */
export function getItemPhoto(name) {
  return load(PHOTOS_KEY, {})[itemKey(name)] || null;
}
export function saveItemPhoto(name, dataUrl) {
  const all = load(PHOTOS_KEY, {});
  all[itemKey(name)] = dataUrl;
  save(PHOTOS_KEY, all);
}
export function removeItemPhoto(name) {
  const all = load(PHOTOS_KEY, {});
  delete all[itemKey(name)];
  save(PHOTOS_KEY, all);
}

/* ── Receipt photo/PDF attachments ─────────────────────────────────────────
   Attaches proof-of-purchase to a receipt trip already in dig_in_receipts
   (Pantry owns writing new trips; this just patches one by id). */
export function attachReceiptFile(tripId, { dataUrl, fileType, fileName }) {
  const receipts = load(RECEIPTS_KEY, []);
  const next = receipts.map(r => (r.id === tripId ? { ...r, attachment: { dataUrl, fileType, fileName } } : r));
  save(RECEIPTS_KEY, next);
}
