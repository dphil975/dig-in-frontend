import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../../components/shell/Nav';
import {
  parseReceiptFull, suggestRecipes, guessLocation, guessSnap, guessWic, LOCATIONS, LOCATION_LABEL,
  loadShoppingContext, saveShoppingContext,
} from '../../../../lib/pantryTools';
import { RECIPE_INGREDIENTS, RECIPES_STATIC } from '../../../../data/recipesStatic';
import { BOROUGHS, incomeTier } from '../../../../data/storeData';
import { fastFoodSpike } from '../../../../lib/shopTiming';
import { expiringItems } from '../../../../lib/freshness';
import NovaUseItUp from '../../../../components/nova/NovaUseItUp';
import { capturePhoto, hasGeolocation, getCurrentPosition, reverseGeocodeZip } from '../../../../lib/native';
import { refreshPantryRecalls } from '../../../../lib/recallWatch';
import RecallAlert from '../../../../components/health/RecallAlert';
import {
  registerFirstPurchase, recordSizeAndCheckShrinkflation, logShrinkflationAlert,
  checkNewItemReminders, saveItemPhoto, recordPrice, priceMatchFor,
} from '../../../../lib/storeMemory';
import { downscaleImage, preprocessForOcr, OCR_LOCAL } from '../../../../lib/receiptOcr';
import RestaurantFavorites from '../../../../components/pantry/RestaurantFavorites';
import SmartPrepping from '../../../../components/pantry/SmartPrepping';
import ShoppingTrips from '../../../../components/pantry/ShoppingTrips';
import PutbackInsight from '../../../../components/pantry/PutbackInsight';
import CookFromPantry from '../../../../components/pantry/CookFromPantry';
import PantryBuckets from '../../../../components/pantry/PantryBuckets';
import PantryCategoryGrid from '../../../../components/pantry/PantryCategoryGrid';
import StoreRun from '../../../../components/pantry/StoreRun';
import { categorizeShelf, categoryById } from '../../../../lib/pantryCategories';
import BudgetPanel from '../../../../components/pantry/BudgetPanel';
import { logSpend, planCost } from '../../../../lib/budgetTarget';
import { award as awardSpins } from '../../../../lib/spins';
import './Pantry.css';

/* Virtual Pantry — the in-store shopping companion.
   You scan (or key in) each item the moment you pick it up; it lands in a
   "deciding" tray. From there you either BUY it — which files it into your
   virtual Pantry / Fridge / Freezer — or PUT IT BACK, which asks *why* (price,
   etc.) and drops it on the spot so there's nothing to reconcile at checkout.
   Throughout, we count how many of your items are SNAP- and WIC-eligible.

   This file used to be ~1,160 lines — Restaurant Favorites, Smart Prepping
   (timers), Shopping Trips, Put-back Insight, Cook-From-Pantry, and the
   Pantry/Fridge/Freezer buckets display are now their own components under
   src/components/ (each was either fully self-contained or only needed
   props/callbacks, not a deeper state lift). The deciding-tray flow, the
   scan/pick-up form, and receipt import stay here — they're genuinely
   coupled to this component's own `holding`/`pantry`/`receipts` state. */

const PANTRY_KEY  = 'dig_in_pantry';
const HOLDING_KEY = 'dig_in_pantry_holding';
const PUTBACK_KEY = 'dig_in_putback_log';
const SHOPPING_KEY = 'dig_in_shopping_mode';
const RECEIPTS_KEY = 'dig_in_receipts';   // saved shopping trips (store/date/total/items)
const AREA_KEY     = 'dig_in_area';

// Why a shopper sets something back down — the toggle's dropdown options.
const PUTBACK_REASONS = [
  'Too expensive',
  'Found a cheaper option',
  'Over my budget this trip',
  'Not SNAP / WIC eligible',
  'Changed my mind',
  "Didn't need it after all",
  'Quality / expiration concern',
];

function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
  catch { return fallback; }
}

// Turns storeMemory's priceMatchFor() result into one honest line. Prefers
// comparing against a purchase AT THE SAME STORE (if there is one) over the
// most recent purchase anywhere — "$0.30 more than last time HERE" is a more
// useful signal than "$0.30 more than last time at some other store." Only
// adds the "best you've paid" clause when that's actually a different,
// cheaper number than the one already being quoted — no point repeating
// the same figure twice.
function formatPriceMatch(pm) {
  if (!pm) return null;
  const cmp = pm.lastAtStore || pm.lastAnywhere;
  const cmpWhere = pm.comparedAtStore ? '' : cmp.store ? ` at ${cmp.store}` : '';
  const base = pm.verdict === 'same'
    ? `Same as last time${cmpWhere} — $${cmp.price.toFixed(2)}`
    : `${pm.verdict === 'higher' ? '↑' : '↓'} $${Math.abs(pm.diff).toFixed(2)} ${pm.verdict === 'higher' ? 'more' : 'less'} than ${pm.comparedAtStore ? 'last time here' : `last time${cmpWhere}`} ($${cmp.price.toFixed(2)})`;
  const showBest = pm.best && pm.best.price < cmp.price;
  const bestClause = showBest
    ? ` · best you've paid: $${pm.best.price.toFixed(2)}${pm.best.store ? ` at ${pm.best.store}` : ''}`
    : '';
  return base + bestClause;
}

export default function Pantry({ embedded = false } = {}) {
  const navigate = useNavigate();
  const [pantry, setPantry]       = useState(() => load(PANTRY_KEY, []));
  const [holding, setHolding]     = useState(() => load(HOLDING_KEY, []));
  const [putbackLog, setPutback]  = useState(() => load(PUTBACK_KEY, []));
  const [receipts, setReceipts]   = useState(() => load(RECEIPTS_KEY, []));

  // "picked up an item" form
  const [name, setName]         = useState('');
  const [price, setPrice]       = useState('');
  const [size, setSize]         = useState('');    // e.g. "12 oz" — optional, feeds shrinkflation tracking
  // "Shopping at" — sticky across the whole trip (not reset per item) so
  // scan-in purchases carry a store, same as receipt imports do, and can
  // feed the Store Memory card's frequent/repurchase/shrinkflation views.
  // Seeded from the shared shopping context so switching over from
  // BarcodeScanner mid-trip doesn't lose it, and kept in sync the other way.
  const [store, setStore]       = useState(() => loadShoppingContext().store);
  // ZIP of the store you're actually standing in — sticky across the trip
  // like `store`. "Use my location" reverse-geocodes it; still freely
  // editable, since the phone's GPS fix and the store's mailing ZIP aren't
  // always the same one.
  const [storeZip, setStoreZip] = useState(() => loadShoppingContext().storeZip);
  const [zipLoading, setZipLoading] = useState(false);
  const [location, setLocation] = useState('pantry');
  const [snap, setSnap]         = useState(true);
  const [wic, setWic]           = useState(false);
  // track manual overrides so live name-guessing doesn't stomp them
  const [dirty, setDirty]       = useState({ loc: false, snap: false, wic: false });

  // Live price match — read-only, computed as you type, before you've even
  // submitted. Null (renders nothing) until there's a real name + price to
  // compare AND actual prior history for that item; a first-time item has
  // nothing honest to compare against yet.
  const priceMatch = useMemo(() => {
    const cleanName = name.trim();
    if (!cleanName || price === '' || Number.isNaN(Number(price))) return null;
    return priceMatchFor(cleanName, Number(price), store.trim() || null);
  }, [name, price, store]);

  const [putbackFor, setPutbackFor] = useState(null); // holding id whose reason menu is open
  const [flash, setFlash]           = useState('');
  // Recalls that turned up JUST NOW for something already stocked — covers the
  // two gaps a scan-time-only check leaves: receipt-imported items (never
  // checked before) and anything recalled AFTER it was already in the pantry
  // (the "found out weeks later" case). Dismissible; the item's own ⚠ badge
  // and RecallAlert detail persist regardless of whether this banner is closed.
  const [newRecallHits, setNewRecallHits] = useState([]);

  // Are we actively shopping? When on, we nudge "scan as you go" and keep the
  // "cook from your pantry" prompt front-and-center. Persisted so the reminder
  // survives navigating around the app mid-trip.
  const [shopping, setShopping] = useState(() => load(SHOPPING_KEY, false));
  // How items get in: scan/key them one-by-one, or drop in a whole receipt.
  const [inputMode, setInputMode] = useState('scan'); // 'scan' | 'receipt'
  const [receiptText, setReceiptText] = useState('');
  const [receiptNote, setReceiptNote] = useState('');
  const [ocrBusy, setOcrBusy]         = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  // Photo/PDF of the physical receipt — proof of purchase, shown in the Store
  // Memory card. Independent of OCR: an image still gets OCR'd for the text
  // pipeline above, a PDF can't be OCR'd here so it's just attached as-is.
  const [receiptAttachment, setReceiptAttachment] = useState(null); // { dataUrl, fileType, fileName }
  const [attachOnlyStore, setAttachOnlyStore]     = useState('');  // store name when there's no parsed text at all
  const [photoTick, setPhotoTick] = useState(0);   // bumped to re-read item reference photos after a capture
  // Which shelf category (seasonings, beverages, pasta, …) the inventory below
  // is narrowed to. null = every shelf. Deliberately NOT persisted: a filter
  // you forgot you left on reads as "my pantry is empty" next visit.
  const [shelfCat, setShelfCat] = useState(null);

  useEffect(() => { try { localStorage.setItem(PANTRY_KEY, JSON.stringify(pantry)); } catch {} }, [pantry]);
  useEffect(() => { try { localStorage.setItem(HOLDING_KEY, JSON.stringify(holding)); } catch {} }, [holding]);
  useEffect(() => { try { localStorage.setItem(PUTBACK_KEY, JSON.stringify(putbackLog)); } catch {} }, [putbackLog]);
  useEffect(() => { try { localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts)); } catch {} }, [receipts]);
  useEffect(() => { try { localStorage.setItem(SHOPPING_KEY, JSON.stringify(shopping)); } catch {} }, [shopping]);
  // Shared with BarcodeScanner — whichever page you set the store/ZIP on
  // last is what the other one sees next.
  useEffect(() => { saveShoppingContext({ store, storeZip }); }, [store, storeZip]);

  // "It's been 3 days and you never said if you liked it" — checked once when
  // the Pantry page opens (this app has no background push service; like every
  // other notification here, it only fires if the browser already granted
  // permission and the app happens to be open past the 3-day mark).
  useEffect(() => {
    const findRecipeUsing = (ingredientName) => {
      const n = ingredientName.toLowerCase();
      for (const [idStr, ings] of Object.entries(RECIPE_INGREDIENTS)) {
        if (ings.some(ing => ing.toLowerCase().includes(n) || n.includes(ing.toLowerCase()))) {
          const recipe = RECIPES_STATIC.find(r => r.id === Number(idStr));
          if (recipe) return recipe.name;
        }
      }
      return null;
    };
    checkNewItemReminders(new Date(), findRecipeUsing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real, ongoing recall coverage — checked once when the page opens, against
  // the REAL openFDA feed (lib/recallWatch.js), throttled to once/day per
  // item and deduped across repeat purchases. Covers both gaps the scan-time
  // check leaves: receipt-imported items, and anything recalled after it was
  // already sitting in the pantry.
  useEffect(() => {
    let alive = true;
    refreshPantryRecalls(pantry).then(({ hitsByName, newHits }) => {
      if (!alive) return;
      if (Object.keys(hitsByName).length) {
        setPantry(prev => prev.map(it => {
          const hit = hitsByName[String(it.name || '').trim().toLowerCase()];
          return hit ? { ...it, recall: hit.recalls } : it;
        }));
      }
      if (newHits.length) setNewRecallHits(newHits);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Local income tier (from the area last browsed on the Food Map) — used to
  // tilt recipe suggestions toward what's realistically affordable there.
  const areaTier = useMemo(() => {
    try {
      const area = localStorage.getItem(AREA_KEY);
      const meta = BOROUGHS.find(b => b.id === area);
      return meta?.income != null ? incomeTier(meta.income) : null;
    } catch { return null; }
  }, []);

  function toast(msg) { setFlash(msg); setTimeout(() => setFlash(''), 2200); }

  function onNameChange(v) {
    setName(v);
    if (!dirty.loc)  setLocation(guessLocation(v));
    if (!dirty.snap) setSnap(guessSnap(v));
    if (!dirty.wic)  setWic(guessWic(v));
  }

  function resetForm() {
    setName(''); setPrice(''); setSize('');
    setLocation('pantry'); setSnap(true); setWic(false);
    setDirty({ loc: false, snap: false, wic: false });
    // `store` and `storeZip` are deliberately left alone — you're shopping
    // at the same place for the whole trip, so both stay filled in for the
    // next item.
  }

  // "Use my location" — reverse-geocode once, editable after.
  async function detectStoreZip() {
    if (!hasGeolocation() || zipLoading) return;
    setZipLoading(true);
    try {
      const { lat, lng } = await getCurrentPosition({ enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 });
      const zip = await reverseGeocodeZip(lat, lng);
      if (zip) setStoreZip(zip); else toast("Couldn't detect a ZIP — enter it manually");
    } catch {
      toast("Couldn't detect a ZIP — enter it manually");
    } finally {
      setZipLoading(false);
    }
  }

  // Scan-in: the item you just picked up lands in the "deciding" tray. Every
  // pick-up — scanned or typed — carries the same real record: when (`at`),
  // where (`store` + `storeZip`), how much (`price`), and how much of it
  // (`size`), not just the name.
  function pickUp(e) {
    e?.preventDefault?.();
    const clean = name.trim();
    if (!clean) { toast('Add the item name first'); return; }
    const item = {
      id: Date.now(),
      name: clean,
      price: price === '' ? null : parseFloat(price),
      size: size.trim() || null,
      store: store.trim() || null,
      storeZip: storeZip.trim() || null,
      location,
      snap,
      wic,
      at: new Date().toISOString(),
    };
    setHolding(prev => [item, ...prev]);
    resetForm();
    toast(`Picked up ${clean}`);
  }

  // Bought it — file it into the matching Pantry / Fridge / Freezer bucket.
  // Also feeds the Store Memory system: registers a true first-time item for
  // the "did you like it?" loop, records the price for price-match (every
  // purchase, whether or not a size was entered), and — if a size WAS logged
  // — checks whether this purchase is quietly smaller than last time
  // (shrinkflation, which needs a size to mean anything).
  function buy(item) {
    setPantry(prev => [{ ...item, boughtAt: new Date().toISOString() }, ...prev]);
    setHolding(prev => prev.filter(i => i.id !== item.id));
    registerFirstPurchase(item.name, item.store);
    if (item.price != null) recordPrice(item.name, item.price, item.store);
    if (item.size) {
      const alert = recordSizeAndCheckShrinkflation(item.name, item.size, item.price);
      if (alert) {
        logShrinkflationAlert(alert, item.store);
        toast(`${alert.name} shrank: ${alert.wasSize} → ${alert.nowSize} (${alert.percentSmaller}% less)`);
        return;
      }
    }
    toast(`Added ${item.name} to your ${LOCATION_LABEL[item.location]}`);
  }

  // Put it back — record *why*, then drop it now so there's nothing to undo later.
  function confirmPutback(item, reason) {
    setPutback(prev => [{ id: item.id, name: item.name, reason, price: item.price, at: new Date().toISOString() }, ...prev]);
    setHolding(prev => prev.filter(i => i.id !== item.id));
    setPutbackFor(null);
    toast(`Put back ${item.name} — ${reason}`);
  }

  function removeFromPantry(id) { setPantry(prev => prev.filter(i => i.id !== id)); }

  // A reference photo of the actual item on the shelf — so next time (or if
  // someone else is doing the shopping) there's no guessing which brand/box it
  // was. Optional, one tap, works for any item — not gated on guessing which
  // ones are "brand-name enough" to bother with.
  async function captureItemPhoto(name) {
    const dataUrl = await capturePhoto({ source: 'prompt' });
    if (!dataUrl) return;
    saveItemPhoto(name, dataUrl);
    setPhotoTick(t => t + 1);
  }

  // --- receipt import ---------------------------------------------------------
  // A receipt is the whole record of a shopping trip — the store, where and when
  // it happened, the total, and every line item. We keep that trip AND file the
  // items straight into the pantry (not the "deciding" tray), each pre-sorted
  // into a Pantry/Fridge/Freezer bucket with SNAP/WIC guessed the same way
  // scanning does. So one upload replaces adding everything one at a time.
  const parsed = useMemo(() => parseReceiptFull(receiptText), [receiptText]);

  // A receipt photo/PDF with no readable text still counts as a record — the
  // shopper just needs to say which store it's from so it's findable later.
  function saveAttachmentOnly() {
    const storeName = attachOnlyStore.trim();
    if (!storeName) { toast('Add the store name first'); return; }
    const trip = {
      id: Date.now(),
      store: storeName,
      address: null, date: null, time: null, total: null,
      itemCount: 0, items: [],
      attachment: receiptAttachment,
      importedAt: new Date().toISOString(),
    };
    setReceipts(prev => [trip, ...prev]);
    /* Earns the same spins as a fully-parsed import: filing the receipt took
       the same effort whether or not OCR could read a total out of it. No
       logSpend here — there's no real number, and inventing one would be
       exactly the dishonesty the split between spent/planned exists to
       prevent. */
    const paidAttach = awardSpins('receipt-upload', `trip-${trip.id}`);
    if (paidAttach) toast(`Receipt filed — +${paidAttach.spins} spins`);
    setReceiptAttachment(null);
    setAttachOnlyStore('');
    setReceiptNote('');
    toast(`Saved receipt for ${storeName}`);
  }

  function importReceipt() {
    if (parsed.items.length === 0) {
      if (receiptAttachment) { toast('Add a store name below to save this receipt photo/PDF'); return; }
      toast('No items found — paste the receipt text first');
      return;
    }
    const now = Date.now();
    const boughtAt = parsed.date
      ? new Date(`${parsed.date}T${parsed.time || '12:00'}:00`).toISOString()
      : new Date().toISOString();
    const tripId = now;
    const items = parsed.items.map((it, idx) => ({
      id: now + idx,
      name: it.name,
      price: it.price,
      location: guessLocation(it.name),
      snap: guessSnap(it.name),
      wic: guessWic(it.name),
      at: new Date().toISOString(),
      boughtAt,
      fromReceipt: true,
      store: parsed.store || null,
      storeAddress: parsed.address || null,
      tripId,
    }));
    setPantry(prev => [...items, ...prev]);

    // Keep the trip itself — the shopper's own record of where/when/what/how much.
    const trip = {
      id: tripId,
      store: parsed.store || 'Unknown store',
      address: parsed.address || null,
      date: parsed.date || null,
      time: parsed.time || null,
      total: parsed.total ?? (items.reduce((s, i) => s + (i.price || 0), 0) || null),
      itemCount: items.length,
      items: items.map(i => i.name),
      attachment: receiptAttachment,
      importedAt: new Date().toISOString(),
    };
    setReceipts(prev => [trip, ...prev]);

    /* Real money against the price point, plus the spins that pay for the
       least-fun step in the whole app. Keyed by tripId so re-importing the
       same receipt can neither double-count the spend nor farm the spins —
       both guards live in the libs; this only has to pass a stable id. */
    if (trip.total != null) {
      logSpend({ total: trip.total, store: trip.store, source: 'receipt', id: `trip-${tripId}` });
    }
    const paidImport = awardSpins('receipt-upload', `trip-${tripId}`);
    if (paidImport) toast(`Receipt logged — +${paidImport.spins} spins`);

    // Feed the "did you like it?" loop, and price-match history — a receipt
    // line never has a size, so shrinkflation can't run here, but the price
    // itself is real and worth remembering the exact same way a one-by-one
    // pickup is (see buy() above). Without this, price-match only ever knew
    // about items entered one at a time — a receipt import used to leave the
    // whole trip invisible to it.
    for (const it of items) {
      registerFirstPurchase(it.name, it.store);
      if (it.price != null) recordPrice(it.name, it.price, it.store, boughtAt);
    }

    setReceiptText('');
    setReceiptNote('');
    setReceiptAttachment(null);
    toast(`Stocked ${items.length} item${items.length !== 1 ? 's' : ''} into your pantry from ${trip.store}`);
  }

  function removeReceipt(id) { setReceipts(prev => prev.filter(r => r.id !== id)); }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function onReceiptFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    // A PDF or image is kept as the actual proof-of-purchase attachment on the
    // trip (shown later in the Store Memory card) — independent of whether we
    // can also pull text out of it below.
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        setReceiptAttachment({ dataUrl, fileType: file.type, fileName: file.name });
      } catch { /* attachment is a nice-to-have — OCR/paste still works without it */ }
    }

    // PDFs aren't OCR'd here (no PDF text-extraction dependency in this app) —
    // it's attached as proof, and the shopper can paste the item lines below
    // or just save the photo/PDF on its own as a record.
    if (file.type === 'application/pdf') {
      setReceiptNote(`Attached "${file.name}". Paste the item lines below to also stock your pantry, or save it as a receipt record on its own.`);
      return;
    }

    // Photo of a receipt → OCR it in-browser (Tesseract.js, lazy-loaded so it
    // never weighs down the rest of the app). The recognized text flows into the
    // same parseReceiptFull pipeline as pasted text — no typing required.
    if (file.type.startsWith('image/')) {
      setOcrBusy(true);
      setOcrProgress(0);
      setReceiptNote(`Reading "${file.name}"…`);
      try {
        const canvas = preprocessForOcr(await downscaleImage(file));
        const { recognize } = await import('tesseract.js');
        const logger = m => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        };
        let data;
        try {
          ({ data } = await recognize(canvas, 'eng', { ...OCR_LOCAL, logger }));
        } catch {
          // Local engine assets unavailable — fall back to the bundled CDN paths.
          ({ data } = await recognize(canvas, 'eng', { logger }));
        }
        const text = String(data?.text || '').trim();
        if (!text) {
          setReceiptNote(`Couldn't read any text from "${file.name}". Try a flatter, well-lit photo — or paste the lines below. The photo's still attached as your receipt.`);
        } else {
          setReceiptText(text);
          setReceiptNote('Read your receipt photo — check the items below and fix anything that looks off, then stock your pantry.');
        }
      } catch {
        setReceiptNote(`Couldn't process that image. Paste the receipt lines below instead. The photo's still attached as your receipt.`);
      } finally {
        setOcrBusy(false);
      }
      return;
    }

    // Plain-text receipt (.txt) — read straight in.
    const reader = new FileReader();
    reader.onload = () => { setReceiptText(String(reader.result || '')); setReceiptNote(`Loaded "${file.name}".`); };
    reader.readAsText(file);
  }

  function removeReceiptAttachment() { setReceiptAttachment(null); }

  // --- recipes you can make from what's in the pantry ------------------------
  const suggestions = useMemo(
    () => suggestRecipes(pantry, RECIPE_INGREDIENTS, RECIPES_STATIC, areaTier),
    [pantry, areaTier]
  );

  // --- "Nova, what do I make?" — items about to turn + recipes that use them --
  const expiring = useMemo(() => expiringItems(pantry, { withinDays: 3 }), [pantry]);
  const useItUp = useMemo(
    () => suggestRecipes(expiring.map(e => e.item), RECIPE_INGREDIENTS, RECIPES_STATIC, areaTier, 3),
    [expiring, areaTier]
  );

  // Is it a fast-food rush right now? That's the moment people default to a
  // drive-thru — often just because they don't know what to make. Intercept it.
  const spike = useMemo(() => fastFoodSpike(), []);

  function cook(recipe) {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    } catch {}
    navigate('/recipe');
  }

  // --- running tallies ---
  const snapCount = useMemo(() => pantry.filter(i => i.snap).length, [pantry]);
  const wicCount  = useMemo(() => pantry.filter(i => i.wic).length, [pantry]);
  // The Pantry/Fridge/Freezer shelves, narrowed to one shelf category when the
  // polaroid grid above has one selected. The counts on the tiles come from the
  // WHOLE pantry (countByCategory in the grid) — only what's displayed here is
  // filtered, so the grid never lies about what you own.
  /* What's in hand but not yet bought, as money. Prefers the REAL price the
     shopper typed for an item; only falls back to a bucket estimate for the
     ones with no price on them yet. That mix is why BudgetPanel labels this
     whole figure an estimate — part of it genuinely is. */
  const holdingEstimate = useMemo(() => {
    const priced = holding.filter(i => i.price != null)
      .reduce((s, i) => s + Number(i.price || 0), 0);
    const unpriced = holding.filter(i => i.price == null).map(i => i.name);
    const guessed = unpriced.length ? planCost(unpriced).total : 0;
    return +(priced + guessed).toFixed(2);
  }, [holding]);

  const buckets = useMemo(() => {
    const b = { pantry: [], fridge: [], freezer: [] };
    for (const i of pantry) {
      if (shelfCat && categorizeShelf(i.name).id !== shelfCat) continue;
      (b[i.location] || b.pantry).push(i);
    }
    return b;
  }, [pantry, shelfCat]);

  return (
    <div className="pantry-page">
      {!embedded && <Nav />}
      <div className="pantry-wrap">
        {!embedded && <button className="pantry-back" onClick={() => navigate(-1)}>← BACK</button>}

        <header className="pantry-head">
          <div className="pantry-head-row">
            <h1 className="pantry-title">VIRTUAL PANTRY</h1>
            <button
              type="button"
              className={`pantry-shopmode${shopping ? ' on' : ''}`}
              aria-pressed={shopping}
              onClick={() => { setShopping(s => !s); toast(shopping ? 'Shopping mode off' : "Shopping mode on — scan as you go, or add your receipt after"); }}
            >
              {shopping ? '🛒 Shopping now' : "I'm shopping"}
            </button>
          </div>
          <p className="pantry-sub">
            Scan each item as you pick it up. Buy it and it stocks your fridge, freezer or
            pantry — put it back and we'll log why, right here in the aisle.
          </p>
        </header>

        {shopping && (
          <div className="pantry-shopbanner">
            <span className="pantry-shopbanner-dot" />
            <div>
              <strong>You're shopping.</strong> Scan items as you pick them up so nothing's forgotten
              — or skip it and drop your receipt in when you're done. Then check
              <button type="button" className="pantry-inline-link" onClick={() => document.getElementById('pantry-cook')?.scrollIntoView({ behavior: 'smooth' })}> what you can cook</button> from what you have.
            </div>
          </div>
        )}

        {/* The trip as a timed hunt. Only while you're actually shopping —
            a clock that runs when you're sitting at home is just noise. It
            carries the store/ZIP you already typed above so the run gets
            filed against a real place without asking twice. */}
        {shopping && (
          <StoreRun
            store={store}
            storeZip={storeZip}
            /* Finishing a run offers "add the receipt" — this is what makes
               that button actually land somewhere: flip to receipt mode and
               scroll to it, rather than leaving the user to find it. */
            onAddReceipt={() => {
              setInputMode('receipt');
              setTimeout(() => {
                document.querySelector('.pantry-receipt')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 60);
            }}
          />
        )}

        {flash && <div className="pantry-flash">{flash}</div>}

        {/* Real, just-found recall matches — the "found out weeks later" and
            "receipt items were never checked" gaps, closed. Dismissing this
            only clears the banner; the item's own ⚠ badge below stays. */}
        {newRecallHits.length > 0 && (
          <div className="pantry-recall-banner">
            <div className="pantry-recall-banner-head">
              <span>⚠ {newRecallHits.length} item{newRecallHits.length !== 1 ? 's' : ''} in your pantry may be affected by a real FDA recall</span>
              <button type="button" className="pantry-recall-dismiss" onClick={() => setNewRecallHits([])} aria-label="Dismiss">✕</button>
            </div>
            {newRecallHits.map((h, i) => (
              <div key={i} className="pantry-recall-banner-item">
                <b>{h.name}</b>
                <RecallAlert recalls={h.recalls} />
              </div>
            ))}
          </div>
        )}

        {/* Beat-the-drive-thru intercept — fires at the lunch/dinner fast-food
            rush, when defaulting to takeout is easiest. Points you at what you
            can already make instead of guessing hungry. */}
        {spike.active && (
          <div className="pantry-spike">
            <span className="pantry-spike-emoji">🍔</span>
            <div>
              <strong>It's the {spike.meal} rush.</strong> Before the drive-thru wins — {suggestions.length > 0
                ? <>you can already make <button type="button" className="pantry-inline-link" onClick={() => document.getElementById('pantry-cook')?.scrollIntoView({ behavior: 'smooth' })}>{suggestions.length} thing{suggestions.length !== 1 ? 's' : ''}</button> from your pantry.</>
                : <>stock a few staples and next rush you'll have an answer ready.</>}
            </div>
          </div>
        )}

        {/* Price point + spins. `plannedTotal` is the live estimate for what's
            still in the deciding tray — swap or put something back and this
            number moves, which is the whole "the price updates when you change
            ingredients" behavior. Items already bought are counted as real
            spend from their receipt instead, never estimated twice. */}
        <BudgetPanel plannedTotal={holdingEstimate} />

        {/* SNAP / WIC / put-back tallies */}
        <div className="pantry-stats">
          <div className="pstat pstat-snap">
            <div className="pstat-num">{snapCount}</div>
            <div className="pstat-label">SNAP-eligible in pantry</div>
          </div>
          <div className="pstat pstat-wic">
            <div className="pstat-num">{wicCount}</div>
            <div className="pstat-label">WIC-eligible in pantry</div>
          </div>
          <div className="pstat pstat-back">
            <div className="pstat-num">{putbackLog.length}</div>
            <div className="pstat-label">Put back this session</div>
          </div>
        </div>

        {/* How do you want to add items? Scan one-by-one, or import a receipt. */}
        <div className="pantry-mode">
          <button
            type="button"
            className={`pantry-mode-btn${inputMode === 'scan' ? ' active' : ''}`}
            onClick={() => setInputMode('scan')}
          >
            Scan as I shop
          </button>
          <button
            type="button"
            className={`pantry-mode-btn${inputMode === 'receipt' ? ' active' : ''}`}
            onClick={() => setInputMode('receipt')}
          >
            Upload a receipt instead
          </button>
        </div>

        {inputMode === 'receipt' && (
          <section className="pantry-receipt">
            <div className="pantry-add-title">YOUR RECEIPT IS YOUR PANTRY</div>
            <p className="pantry-receipt-help">
              Don't want to add items one by one? <strong>Snap a photo of your receipt</strong> (or paste the
              text) — we read the <strong>store, address, date, time</strong> and <strong>every item</strong> right
              on your device, then stock your whole pantry in one go. Each trip is saved so you always have a
              record of where, when, and what you bought.
            </p>
            <div className="pantry-receipt-controls">
              <label className={`pantry-receipt-file${ocrBusy ? ' is-busy' : ''}`}>
                {ocrBusy ? 'Reading…' : '📷 Scan / upload receipt'}
                <input type="file" accept=".txt,text/plain,image/*,application/pdf" capture="environment" onChange={onReceiptFile} hidden disabled={ocrBusy} />
              </label>
              <span className="pantry-receipt-or">or paste below</span>
            </div>
            {receiptAttachment && (
              <div className="pantry-attachment-chip">
                {receiptAttachment.fileType === 'application/pdf' ? '📄' : '🖼️'} {receiptAttachment.fileName}
                <button type="button" className="pantry-attachment-remove" onClick={removeReceiptAttachment} aria-label="Remove attachment">✕</button>
              </div>
            )}
            {ocrBusy && (
              <div className="pantry-ocr">
                <div className="pantry-ocr-label">Reading your receipt… {ocrProgress}%</div>
                <div className="pantry-ocr-bar"><span style={{ width: `${ocrProgress}%` }} /></div>
              </div>
            )}
            {receiptNote && <div className="pantry-receipt-note">{receiptNote}</div>}
            <textarea
              className="pantry-receipt-text"
              placeholder={"Paste your whole receipt, e.g.\nWALMART SUPERCENTER\n1231 Marketplace Dr, Pittsburgh PA 15237\n07/05/2026 14:32\n2% MILK GALLON        3.49\nBANANAS 2LB           1.18\nCHICKEN BREAST        7.92\nTOTAL                12.59"}
              value={receiptText}
              onChange={e => setReceiptText(e.target.value)}
              rows={7}
            />
            {(parsed.items.length > 0 || parsed.store) && (
              <div className="pantry-receipt-preview">
                {(parsed.store || parsed.date || parsed.total != null) && (
                  <div className="pantry-receipt-header">
                    {parsed.store && <span className="pantry-receipt-store">🏪 {parsed.store}</span>}
                    {parsed.address && <span className="pantry-receipt-addr">📍 {parsed.address}</span>}
                    {(parsed.date || parsed.time) && (
                      <span className="pantry-receipt-when">🕐 {[parsed.date, parsed.time].filter(Boolean).join(' · ')}</span>
                    )}
                    {parsed.total != null && <span className="pantry-receipt-total">Total ${parsed.total.toFixed(2)}</span>}
                  </div>
                )}
                <div className="pantry-receipt-preview-head">
                  Found {parsed.items.length} item{parsed.items.length !== 1 ? 's' : ''}:
                </div>
                <div className="pantry-receipt-chips">
                  {parsed.items.slice(0, 30).map((it, i) => (
                    <span className="pantry-receipt-chip" key={i}>
                      {it.name}{it.price != null ? ` · $${it.price.toFixed(2)}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {receiptAttachment && parsed.items.length === 0 ? (
              <div className="pantry-attach-only">
                <input
                  className="pantry-input"
                  placeholder="Which store is this receipt from?"
                  value={attachOnlyStore}
                  onChange={e => setAttachOnlyStore(e.target.value)}
                />
                <button type="button" className="pantry-btn pantry-btn-primary" onClick={saveAttachmentOnly}>
                  📎 SAVE RECEIPT AS PROOF
                </button>
              </div>
            ) : (
              <button type="button" className="pantry-btn pantry-btn-primary" onClick={importReceipt}>
                ＋ STOCK {parsed.items.length || ''} INTO MY PANTRY
              </button>
            )}
          </section>
        )}

        {/* Pick-up / scan-in form — fields grouped by what they're actually
            about (Item / Where / Eligibility, Apple's "group by meaning, not
            by row" spec-sheet habit). Restaurant Favorites now lives in this
            same "Scan as I shop" lineup — it's the same in-the-moment
            mindset (what am I picking up / what am I trying to recreate),
            unlike the bulk after-the-fact receipt-upload flow. */}
        {inputMode === 'scan' && (
        <>
        <form className="receipt-card" onSubmit={pickUp}>
          <div className="receipt-notch receipt-notch-top" aria-hidden="true" />

          <header className="receipt-head">
            <h2 className="receipt-title">Just picked something up?</h2>
            <p className="receipt-head-meta">
              <span>{store ? `🏪 ${store}` : "Add where you're shopping below"}</span>
              <span className="receipt-head-dot" aria-hidden="true">·</span>
              <span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </p>
          </header>

          <div className="receipt-rule" aria-hidden="true" />

          <section className="receipt-section">
            <h3 className="receipt-label">Item</h3>
            <div className="receipt-field">
              <label htmlFor="pk-name">Name</label>
              <input
                id="pk-name"
                className="receipt-input"
                placeholder="e.g. 2% Milk"
                value={name}
                onChange={e => onNameChange(e.target.value)}
              />
            </div>
            <div className="receipt-field-row">
              <div className="receipt-field">
                <label htmlFor="pk-size">Size</label>
                <input
                  id="pk-size"
                  className="receipt-input"
                  placeholder="e.g. 12 oz"
                  value={size}
                  onChange={e => setSize(e.target.value)}
                  title="Optional — tracked over time so we can flag shrinkflation and price-match against past trips"
                />
              </div>
              <div className="receipt-field">
                <label htmlFor="pk-price">Price</label>
                <div className="receipt-price-input">
                  <span aria-hidden="true">$</span>
                  <input
                    id="pk-price"
                    type="number" inputMode="decimal" step="0.01" min="0"
                    placeholder="0.00"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    title="Tracked over time so we can price-match against what you've paid before"
                  />
                </div>
              </div>
            </div>
            {priceMatch && (
              <p className={`receipt-price-match receipt-price-match-${priceMatch.verdict}`}>
                {formatPriceMatch(priceMatch)}
              </p>
            )}
          </section>

          <div className="receipt-rule receipt-rule-dashed" aria-hidden="true" />

          <section className="receipt-section">
            <h3 className="receipt-label">Where</h3>
            <div className="receipt-field">
              <label htmlFor="pk-store">Shopping at</label>
              <input
                id="pk-store"
                className="receipt-input"
                placeholder="Store name (stays filled for the trip)"
                value={store}
                onChange={e => setStore(e.target.value)}
              />
            </div>
            <div className="receipt-field-row">
              <div className="receipt-field">
                <label htmlFor="pk-zip">Store ZIP</label>
                <input
                  id="pk-zip"
                  className="receipt-input"
                  placeholder="Optional"
                  value={storeZip}
                  onChange={e => setStoreZip(e.target.value)}
                  maxLength={10}
                />
              </div>
              <button
                type="button"
                className="receipt-locate-btn"
                onClick={detectStoreZip}
                disabled={zipLoading || !hasGeolocation()}
              >
                {zipLoading ? 'Locating…' : '📍 Use my location'}
              </button>
            </div>
            <div className="receipt-field">
              <label htmlFor="pk-loc">Store in</label>
              <select
                id="pk-loc"
                className="receipt-select"
                value={location}
                onChange={e => { setLocation(e.target.value); setDirty(d => ({ ...d, loc: true })); }}
              >
                {LOCATIONS.map(l => <option key={l} value={l}>{LOCATION_LABEL[l]}</option>)}
              </select>
            </div>
          </section>

          <div className="receipt-rule receipt-rule-dashed" aria-hidden="true" />

          <section className="receipt-section">
            <h3 className="receipt-label">Eligibility</h3>
            <div className="receipt-eligibility">
              <button
                type="button"
                className={`pantry-chip pantry-chip-snap${snap ? ' on' : ''}`}
                aria-pressed={snap}
                onClick={() => { setSnap(s => !s); setDirty(d => ({ ...d, snap: true })); }}
              >
                SNAP {snap ? '✓' : ''}
              </button>
              <button
                type="button"
                className={`pantry-chip pantry-chip-wic${wic ? ' on' : ''}`}
                aria-pressed={wic}
                onClick={() => { setWic(w => !w); setDirty(d => ({ ...d, wic: true })); }}
              >
                WIC {wic ? '✓' : ''}
              </button>
            </div>
          </section>

          <div className="receipt-rule receipt-rule-solid" aria-hidden="true" />

          <div className="receipt-total-row">
            <span>Adding to your {LOCATION_LABEL[location].toLowerCase()}</span>
            <span className="receipt-total-price">
              {price !== '' && !Number.isNaN(Number(price)) ? `$${Number(price).toFixed(2)}` : ''}
            </span>
          </div>

          <button type="submit" className="receipt-submit">＋ Picked It Up</button>

          <div className="receipt-notch receipt-notch-bottom" aria-hidden="true" />
        </form>

        <RestaurantFavorites pantry={pantry} />
        </>
        )}

        {/* Deciding tray — buy or put back */}
        <section className="pantry-holding">
          <div className="pantry-section-title">
            DECIDING <span className="pantry-count">{holding.length}</span>
          </div>
          {holding.length === 0 ? (
            <div className="pantry-empty">Nothing in hand. Pick up an item above to start.</div>
          ) : (
            holding.map(item => (
              <div className="hold-card" key={item.id}>
                <div className="hold-main">
                  <div className="hold-name">{item.name}</div>
                  <div className="hold-meta">
                    <span className="hold-loc">{LOCATION_LABEL[item.location]}</span>
                    {item.price != null && <span className="hold-price">${item.price.toFixed(2)}</span>}
                    {item.size && <span className="hold-size">{item.size}</span>}
                    {item.store && <span className="hold-store">🏪 {item.store}</span>}
                    {item.snap && <span className="badge badge-snap">SNAP</span>}
                    {item.wic && <span className="badge badge-wic">WIC</span>}
                    {item.recall?.length > 0 && <span className="badge badge-recall">⚠ RECALL</span>}
                  </div>
                  {item.recall?.length > 0 && <RecallAlert recalls={item.recall} />}
                </div>

                {putbackFor === item.id ? (
                  <div className="hold-reasons">
                    <div className="hold-reasons-title">Why are you putting it back?</div>
                    <div className="hold-reasons-list">
                      {PUTBACK_REASONS.map(r => (
                        <button key={r} className="reason-btn" onClick={() => confirmPutback(item, r)}>
                          {r}
                        </button>
                      ))}
                    </div>
                    <button className="reason-cancel" onClick={() => setPutbackFor(null)}>cancel</button>
                  </div>
                ) : (
                  <div className="hold-actions">
                    <button className="pantry-btn pantry-btn-buy" onClick={() => buy(item)}>BOUGHT ✓</button>
                    <button className="pantry-btn pantry-btn-back" onClick={() => setPutbackFor(item.id)}>PUT BACK</button>
                  </div>
                )}
              </div>
            ))
          )}
        </section>

        {/* Nova rescues what's about to turn — only shows when something is */}
        <NovaUseItUp expiring={expiring} suggestions={useItUp} onCook={cook} />

        {/* The shelf wall — every category as a polaroid, tap one to narrow
            the inventory below to it. */}
        <PantryCategoryGrid items={pantry} selected={shelfCat} onSelect={setShelfCat} />

        <PantryBuckets
          buckets={buckets}
          onRemove={removeFromPantry}
          onCapturePhoto={captureItemPhoto}
          photoTick={photoTick}
          filterLabel={shelfCat ? categoryById(shelfCat).label : null}
        />

        <CookFromPantry suggestions={suggestions} pantryCount={pantry.length} areaTier={areaTier} onCook={cook} />

        <SmartPrepping />

        <ShoppingTrips receipts={receipts} onRemove={removeReceipt} />

        <PutbackInsight putbackLog={putbackLog} />
      </div>
    </div>
  );
}
