/* pantry/barcodeLookup.js — consolidated barcode/receipt-scan module.
   Merged from: barcodeLookup.js + receiptOcr.js (src/lib/ flat directory ->
   src/lib/pantry/). Both old files re-export from this one so every existing
   import path keeps working. No naming conflicts between the two originals. */

// ════════════════════════════════════════════════════════════════════════
// From barcodeLookup.js
// ════════════════════════════════════════════════════════════════════════

/* barcodeLookup.js — two real, free, keyless public APIs (the same pattern
   this app already uses for weather/geocoding — Open-Meteo, Nominatim):

   - lookupProductByBarcode(): Open Food Facts' product API. Given a UPC/EAN,
     returns the real product name, brand, and package size when Open Food
     Facts has it — or null, honestly, when it doesn't (an obscure or
     store-brand item, or a bad scan).

   - checkFoodRecalls(): the FDA's openFDA Food Enforcement API — real,
     current recall records. Matched by product name/brand text (not a UPC
     lookup — openFDA doesn't offer one), so this is a "possible match,
     verify it's your exact product" signal, not a definitive per-item
     recall check. Framed that way in the UI, same honesty rule as every
     other non-diagnostic panel in this app (AllergyPanel's ANAPHYLAXIS_NOTE,
     the Craving Tracker's MATERNAL_NOTE). */

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product';
const FDA_BASE = 'https://api.fda.gov/food/enforcement.json';

/** Real product info for a scanned barcode, or null if Open Food Facts
 * doesn't have it (not an error — most store-brand/local items won't). */
export async function lookupProductByBarcode(barcode) {
  const code = (barcode || '').replace(/\D/g, '');
  if (!code) return null;
  try {
    const res = await fetch(`${OFF_BASE}/${code}.json?fields=product_name,brands,quantity,image_front_small_url`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 1 || !json.product?.product_name) return null;
    const p = json.product;
    return {
      name: p.product_name,
      brand: (p.brands || '').split(',')[0].trim() || null,
      size: p.quantity || null,
      imageUrl: p.image_front_small_url || null,
    };
  } catch {
    return null;
  }
}

/** Possible FDA recall matches for a product name/brand — [] when openFDA
 * has nothing (the good, common case), never throws. */
export async function checkFoodRecalls(query) {
  const term = (query || '').trim();
  if (!term) return [];
  try {
    const url = `${FDA_BASE}?search=product_description:"${encodeURIComponent(term)}"&limit=5&sort=recall_initiation_date:desc`;
    const res = await fetch(url);
    if (!res.ok) return []; // openFDA 404s on zero matches — that's the common, good case
    const json = await res.json();
    return (json.results || []).map(r => ({
      description: r.product_description,
      reason: r.reason_for_recall,
      classification: r.classification, // Class I (serious) / II / III (least severe)
      date: r.recall_initiation_date,   // YYYYMMDD
      state: r.state,
      firm: r.recalling_firm,
      status: r.status,
      distribution: r.distribution_pattern,
    }));
  } catch {
    return [];
  }
}

export function fmtRecallDate(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd || '';
  return `${yyyymmdd.slice(4, 6)}/${yyyymmdd.slice(6, 8)}/${yyyymmdd.slice(0, 4)}`;
}

// ════════════════════════════════════════════════════════════════════════
// From receiptOcr.js
// ════════════════════════════════════════════════════════════════════════

/* receiptOcr.js — pure image-prep helpers for receipt OCR, extracted out of
   Pantry/index.jsx (which was pushing 1,200+ lines). No React, no state —
   just canvas transforms consumed by Pantry's receipt-import flow before
   handing the result to tesseract.js. */

// Shrink a receipt photo before OCR — a full-res phone photo is slow to read and
// gains no accuracy over ~1600px wide. Returns a canvas Tesseract reads directly.
export function downscaleImage(file, maxW = 1600) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); };
    img.src = url;
  });
}

// Pre-clean for OCR: desaturate to luminance and stretch contrast. Faint thermal
// receipt ink and phone-camera glare read far more reliably as high-contrast
// grayscale. A soft contrast stretch (not a hard threshold) survives the uneven
// lighting you get from a hand-held photo. Mutates + returns the same canvas.
export function preprocessForOcr(canvas, contrast = 1.5) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const intercept = 128 * (1 - contrast);
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    let v = g * contrast + intercept;
    v = v < 0 ? 0 : v > 255 ? 255 : v;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// Self-hosted OCR assets (see public/tesseract) so photo scanning needs no CDN
// and works offline. If they're ever missing we retry against the default CDN.
export const OCR_LOCAL = {
  workerPath: '/tesseract/worker.min.js',
  // Pinned to the WebAssembly-SIMD core (broadly supported since 2021) so we
  // only ship one 3.7 MB variant instead of all three LSTM builds. Older
  // browsers without SIMD fall through to the default CDN retry below.
  corePath: '/tesseract/core/tesseract-core-simd-lstm.wasm.js',
  langPath: '/tesseract/lang',
};
