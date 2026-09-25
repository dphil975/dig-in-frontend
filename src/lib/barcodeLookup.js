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
