import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import { lookupProductByBarcode, checkFoodRecalls } from '../../../lib/barcodeLookup';
import {
  guessLocation, guessSnap, guessWic, LOCATIONS, LOCATION_LABEL,
  loadShoppingContext, saveShoppingContext, addToHolding,
} from '../../../lib/pantryTools';
import { hasGeolocation, getCurrentPosition, reverseGeocodeZip } from '../../../lib/native';
import RecallAlert from '../../../components/health/RecallAlert';
import { loadRecipeBooks } from '../../../lib/recipeBooks';
import { getUserTier } from '../../../lib/tierBudget';
import {
  recipesForProduct, priceBreakdownForProduct, guessFusionBase, fusionBaseLabel,
  buildFusion, FUSION_REGIONS, saveScanReference, loadScanReferences,
  removeScanReference, resolveReference,
} from '../../../lib/scannedItemRecipes';
import './BarcodeScanner.css';

/* ════════════════════════════════════════════════════════════
   SCAN & ADD — the barcode scanner's real job: turn a UPC into a
   pantry item, the same shape and the same "deciding" tray Pantry's
   own pick-up form uses (see lib/pantryTools.js's addToHolding/
   guessLocation/guessSnap/guessWic). No separate nutrition tracker,
   no disconnected "pairing intelligence" — one aligned upload path.

   Per item, this captures what Pantry's own form captures: when
   (timestamp), where (store + store ZIP), how much (price), and how
   much of it (size/oz-lb) — plus a real product lookup (Open Food
   Facts) and a real FDA recall check (openFDA) that runs the moment
   a barcode resolves, before the item ever reaches the pantry.

   Manual UPC entry (typed/pasted) rather than live camera decoding —
   works everywhere today with no new dependency; the lookup + recall
   check are exactly as real either way.
   ════════════════════════════════════════════════════════════ */

function emptyForm(ctx) {
  return {
    barcode: '', name: '', brand: '', size: '', price: '',
    store: ctx.store, storeZip: ctx.storeZip,
    location: 'pantry', snap: true, wic: false,
  };
}

export default function BarcodeScanner({ embedded = false } = {}) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => emptyForm(loadShoppingContext()));
  const [dirty, setDirty] = useState({ loc: false, snap: false, wic: false });
  const [lookupState, setLookupState] = useState('idle'); // idle | loading | found | notfound
  const [recalls, setRecalls] = useState([]);
  const [zipLoading, setZipLoading] = useState(false);
  const [sessionAdds, setSessionAdds] = useState([]);
  const [flash, setFlash] = useState('');

  // The real 575-recipe corpus (recipeBooks.js — same one RecipeCards/
  // MealPlan/DishSubmissionModal already read), loaded once and reused for
  // every scan this session — recipesForProduct() just filters it in memory.
  const [pool, setPool] = useState([]);
  useEffect(() => { loadRecipeBooks().then(setPool); }, []);

  const [fusionRegionId, setFusionRegionId] = useState(null);
  const [references, setReferences] = useState(() => loadScanReferences());

  // Real recipes that use whatever's currently in the name field — works off
  // a manual name too, not just a resolved Open Food Facts lookup, so the
  // feature doesn't go dark on a store-brand item Open Food Facts has never
  // heard of (same "notfound → enter manually, still works" honesty the
  // rest of this page already holds itself to).
  const matchedRecipes = useMemo(
    () => recipesForProduct(form.name, pool, 6),
    [form.name, pool]
  );

  const priceBreakdown = useMemo(
    () => priceBreakdownForProduct({ price: form.price, matchedRecipes, tier: getUserTier() }),
    [form.price, matchedRecipes]
  );

  const guessedBase = useMemo(() => guessFusionBase(form.name), [form.name]);
  const fusionResult = useMemo(
    () => (fusionRegionId ? buildFusion(guessedBase, fusionRegionId) : null),
    [guessedBase, fusionRegionId]
  );

  // Store + ZIP stay sticky for the whole trip, and follow you into Pantry
  // (and back) since both read/write the same shared context.
  useEffect(() => {
    saveShoppingContext({ store: form.store, storeZip: form.storeZip });
  }, [form.store, form.storeZip]);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  function toast(msg) { setFlash(msg); setTimeout(() => setFlash(''), 2400); }

  function onNameChange(v) {
    set('name', v);
    if (!dirty.loc)  set('location', guessLocation(v));
    if (!dirty.snap) set('snap', guessSnap(v));
    if (!dirty.wic)  set('wic', guessWic(v));
  }

  async function lookupBarcode() {
    const code = form.barcode.trim();
    setRecalls([]);
    if (code.length < 8) { setLookupState('idle'); return; }
    setLookupState('loading');
    const product = await lookupProductByBarcode(code);
    if (!product) {
      setLookupState('notfound');
      return;
    }
    setLookupState('found');
    setForm(f => ({
      ...f,
      name: product.name,
      brand: product.brand || '',
      size: product.size || f.size,
    }));
    setDirty(d => ({ ...d, loc: false, snap: false, wic: false }));
    onNameChange(product.name);

    const hits = await checkFoodRecalls(product.brand || product.name);
    if (hits.length) setRecalls(hits);
  }

  async function detectZip() {
    if (!hasGeolocation() || zipLoading) return;
    setZipLoading(true);
    try {
      const { lat, lng } = await getCurrentPosition({ enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 });
      const zip = await reverseGeocodeZip(lat, lng);
      if (zip) set('storeZip', zip); else toast("Couldn't detect a ZIP — enter it manually");
    } catch {
      toast("Couldn't detect a ZIP — enter it manually");
    } finally {
      setZipLoading(false);
    }
  }

  // Saves the current scan — product info + whichever real recipes matched
  // + the fusion pick, if any — into the reference log so it's genuinely
  // findable later, not just something that flashed on screen this session.
  function persistReference() {
    const clean = form.name.trim();
    if (!clean) return;
    const list = saveScanReference({
      barcode: form.barcode.trim(),
      name: clean,
      brand: form.brand.trim(),
      price: form.price === '' ? null : parseFloat(form.price),
      size: form.size.trim(),
      matchedRecipeIds: matchedRecipes.map(m => m.recipe.id),
      fusion: fusionRegionId ? { baseId: guessedBase, regionId: fusionRegionId } : null,
    });
    setReferences(list);
  }

  function saveReferenceOnly() {
    const clean = form.name.trim();
    if (!clean) { toast('Look up a barcode or type the item name first'); return; }
    persistReference();
    toast(`Saved — find it under "Your References" below`);
  }

  function addToPantry(e) {
    e?.preventDefault?.();
    const clean = form.name.trim();
    if (!clean) { toast('Look up a barcode or type the item name first'); return; }
    const item = {
      id: Date.now(),
      name: clean,
      barcode: form.barcode.trim(),
      brand: form.brand.trim() || null,
      price: form.price === '' ? null : parseFloat(form.price),
      size: form.size.trim() || null,
      store: form.store.trim() || null,
      storeZip: form.storeZip.trim() || null,
      location: form.location,
      snap: form.snap,
      wic: form.wic,
      at: new Date().toISOString(),
      recall: recalls.length ? recalls : null,
    };
    addToHolding(item);
    setSessionAdds(prev => [item, ...prev]);
    persistReference();
    toast(`Added ${clean} — decide buy/put-back in the Pantry`);

    // Clear the per-item fields; store/ZIP stay sticky for the rest of the trip.
    setForm(f => ({ ...emptyForm({ store: f.store, storeZip: f.storeZip }) }));
    setDirty({ loc: false, snap: false, wic: false });
    setLookupState('idle');
    setRecalls([]);
    setFusionRegionId(null);
  }

  // Opens a real matched recipe in the full recipe view — same sessionStorage
  // handoff RecipeFull already reads everywhere else this app opens a recipe
  // from a non-URL source (Pantry's "cook" button, Home feed posts, etc.).
  function openRecipe(recipe) {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    } catch { /* ignore */ }
    navigate('/recipe');
  }

  // Reloads a saved reference back into the form so its recipes/price
  // breakdown/fusion recompute live against the current corpus, instead of
  // showing a frozen snapshot that could drift as the corpus changes.
  function openReference(ref) {
    setForm(f => ({
      ...f,
      barcode: ref.barcode || '',
      name: ref.name,
      brand: ref.brand || '',
      price: ref.price != null ? String(ref.price) : '',
      size: ref.size || '',
    }));
    setFusionRegionId(ref.fusion?.regionId || null);
    setLookupState('idle');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function deleteReference(id) {
    setReferences(removeScanReference(id));
  }

  return (
    <div className="barcode-page">
      {!embedded && <Nav />}

      <div className="container">
        <header>
          <h1>SCAN & ADD</h1>
          <p className="bc-sub">Scan a barcode — it lands in your Virtual Pantry's deciding tray, checked against real FDA recalls first.</p>
        </header>

        {flash && <div className="success-message">{flash}</div>}

        {/* Barcode lookup */}
        <div className="scanner-section">
          <div className="scanner-hint">Type or paste the UPC/barcode</div>
          <div className="bc-lookup-row">
            <input
              className="bc-input bc-input-barcode"
              placeholder="e.g. 3017620422003"
              inputMode="numeric"
              value={form.barcode}
              onChange={e => set('barcode', e.target.value)}
              onBlur={lookupBarcode}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), lookupBarcode())}
            />
            <button type="button" onClick={lookupBarcode}>LOOK UP</button>
          </div>
          {lookupState === 'loading' && <p className="bc-lookup-msg">Looking up…</p>}
          {lookupState === 'found' && (
            <p className="bc-lookup-msg bc-lookup-found">
              Found: {form.name}{form.brand ? ` (${form.brand})` : ''}{form.size ? ` — ${form.size}` : ''}
            </p>
          )}
          {lookupState === 'notfound' && (
            <p className="bc-lookup-msg bc-lookup-notfound">
              Not found in Open Food Facts — enter the details manually below.
            </p>
          )}
          <RecallAlert recalls={recalls} />
        </div>

        {/* Item details form */}
        <form className="bc-form" onSubmit={addToPantry}>
          <div className="bc-form-title">ITEM DETAILS</div>
          <div className="bc-form-row">
            <input
              className="bc-input"
              placeholder="Item name"
              value={form.name}
              onChange={e => onNameChange(e.target.value)}
            />
            <input
              className="bc-input bc-input-narrow"
              type="number" inputMode="decimal" step="0.01" min="0"
              placeholder="$ price"
              value={form.price}
              onChange={e => set('price', e.target.value)}
            />
            <input
              className="bc-input bc-input-narrow"
              placeholder="Size (e.g. 12 oz)"
              value={form.size}
              onChange={e => set('size', e.target.value)}
              title="oz/lb or whatever's on the package — tracked over time so we can flag shrinkflation"
            />
          </div>

          <div className="bc-form-row">
            <input
              className="bc-input"
              placeholder="Store (e.g. Trader Joe's)"
              value={form.store}
              onChange={e => set('store', e.target.value)}
            />
            <input
              className="bc-input bc-input-narrow"
              placeholder="Store ZIP"
              value={form.storeZip}
              onChange={e => set('storeZip', e.target.value)}
              maxLength={10}
            />
            <button type="button" className="bc-zip-btn" onClick={detectZip} disabled={zipLoading || !hasGeolocation()}>
              {zipLoading ? 'Locating…' : '📍 Use my location'}
            </button>
          </div>

          <div className="bc-form-row bc-form-meta">
            <label className="bc-loc">
              Store in
              <select className="bc-select" value={form.location} onChange={e => { set('location', e.target.value); setDirty(d => ({ ...d, loc: true })); }}>
                {LOCATIONS.map(l => <option key={l} value={l}>{LOCATION_LABEL[l]}</option>)}
              </select>
            </label>
            <button
              type="button"
              className={`bc-chip bc-chip-snap${form.snap ? ' on' : ''}`}
              onClick={() => { set('snap', !form.snap); setDirty(d => ({ ...d, snap: true })); }}
            >
              SNAP {form.snap ? '✓' : ''}
            </button>
            <button
              type="button"
              className={`bc-chip bc-chip-wic${form.wic ? ' on' : ''}`}
              onClick={() => { set('wic', !form.wic); setDirty(d => ({ ...d, wic: true })); }}
            >
              WIC {form.wic ? '✓' : ''}
            </button>
            <button type="submit" className="bc-submit">＋ ADD TO PANTRY</button>
          </div>
          {form.name.trim() && (
            <button type="button" className="bc-save-ref" onClick={saveReferenceOnly}>
              💾 Save this reference (without adding to pantry)
            </button>
          )}
        </form>

        {/* Real recipes that use this item — the 575-recipe corpus, keyword-
            matched, not a fabricated suggestion. Works off manual name entry
            too, not just a resolved barcode. */}
        {form.name.trim() && (
          <div className="scanner-section bc-recipes">
            <div className="section-title">Recipes Using This</div>
            {pool.length === 0 ? (
              <p className="bc-lookup-msg">Loading the recipe index…</p>
            ) : matchedRecipes.length === 0 ? (
              <p className="empty-state">No real recipe in our index calls for this — try a shorter or more common name.</p>
            ) : (
              <div className="bc-recipe-list">
                {matchedRecipes.map(({ recipe, hitCount }) => (
                  <button key={recipe.id} type="button" className="bc-recipe-card" onClick={() => openRecipe(recipe)}>
                    <div className="bc-recipe-name">{recipe.name || recipe.full_name}</div>
                    <div className="bc-recipe-meta">
                      {recipe.cuisine ? `${recipe.cuisine} · ` : ''}{recipe.recipe_type || 'recipe'}
                      {hitCount > 1 ? ` · used ${hitCount}×` : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Price breakdown — this item's real entered price vs. what the
                whole matched recipe actually costs to make, using the same
                hand-seeded ballpark grocery engine TierBudgetPanel already
                uses on every recipe page. Only renders once a real price is
                entered; no comparison is better than a fabricated one. */}
            {priceBreakdown && (
              <div className="bc-price-breakdown">
                <div className="bc-pb-title">Price Breakdown</div>
                <p className="bc-pb-item">This item alone: <strong>${priceBreakdown.itemPrice.toFixed(2)}</strong></p>
                {priceBreakdown.recipes.map(({ recipe, priced }) => (
                  <div className="bc-pb-row" key={recipe.id}>
                    <span className="bc-pb-recipe">{recipe.name || recipe.full_name}</span>
                    <span className="bc-pb-figures">
                      ${priced.total.toFixed(2)} total · ${priced.perServing.toFixed(2)}/serving ({priced.servings} servings)
                      {priced.savingsPer > 0 && <> · saves ~${priced.savingsPer.toFixed(2)}/serving vs. eating out</>}
                    </span>
                  </div>
                ))}
                <p className="bc-pb-note">
                  Ballpark US grocery pricing at your {priceBreakdown.tier} tier — a real comparison, not a to-the-cent quote.
                </p>
              </div>
            )}

            {/* Fusion it — real generative recipe (fusionEngine.js), built
                from this item's guessed base (bread→sandwich, rice→bowl,
                etc.) and whichever cuisine the shopper picks. */}
            <div className="bc-fusion">
              <div className="bc-pb-title">Make It a Fusion</div>
              <p className="bc-fusion-base">Starting point: <strong>{fusionBaseLabel(guessedBase)}</strong></p>
              <div className="bc-fusion-chips">
                {FUSION_REGIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`bc-fusion-chip${fusionRegionId === r.id ? ' on' : ''}`}
                    onClick={() => setFusionRegionId(fusionRegionId === r.id ? null : r.id)}
                  >
                    {r.emoji} {r.label}
                  </button>
                ))}
              </div>
              {fusionResult && (
                <div className="bc-fusion-result">
                  <div className="bc-fusion-name">{fusionResult.fusion_name}</div>
                  <ol className="bc-fusion-steps">
                    {fusionResult.recipe_steps.map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                  <p className="bc-fusion-bridge">{fusionResult.flavor_bridge}</p>
                  <p className="bc-fusion-macros">
                    ~{fusionResult.nutritional_macros.calories} cal ·
                    {' '}{fusionResult.nutritional_macros.protein_g}g protein ·
                    {' '}{fusionResult.nutritional_macros.carbs_g}g carbs ·
                    {' '}{fusionResult.nutritional_macros.fat_g}g fat
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* This session's scans */}
        <div className="scanned-items">
          <div className="section-title">Scanned this session</div>
          {sessionAdds.length === 0 ? (
            <div className="empty-state">Nothing scanned yet — look up a barcode above.</div>
          ) : (
            <>
              {sessionAdds.map(item => (
                <div className="item-card" key={item.id}>
                  <div className="item-info">
                    <div className="item-name">
                      {item.name}
                      {item.recall && <span className="badge-recall-inline">⚠ RECALL</span>}
                    </div>
                    <div className="item-details">
                      {LOCATION_LABEL[item.location]}
                      {item.price != null && ` · $${item.price.toFixed(2)}`}
                      {item.size && ` · ${item.size}`}
                      {item.store && ` · 🏪 ${item.store}`}
                    </div>
                  </div>
                </div>
              ))}
              <button className="bc-view-pantry" onClick={() => navigate('/pantry')}>
                VIEW IN PANTRY →
              </button>
            </>
          )}
        </div>

        {/* "The user can reference their requests" — every scan's product
            info + matched recipes + fusion pick, saved and reopenable, not
            just something that flashed on screen for one session. */}
        {references.length > 0 && (
          <div className="scanned-items bc-references">
            <div className="section-title">Your Scan References</div>
            {references.map((ref) => {
              const resolved = resolveReference(ref, pool);
              return (
                <div className="item-card bc-ref-card" key={ref.id}>
                  <div className="item-info">
                    <div className="item-name">{ref.name}{ref.brand ? ` (${ref.brand})` : ''}</div>
                    <div className="item-details">
                      {new Date(ref.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      {ref.price != null && ` · $${ref.price.toFixed(2)}`}
                      {resolved.recipes.length > 0 && ` · ${resolved.recipes.length} recipe${resolved.recipes.length !== 1 ? 's' : ''} matched`}
                      {ref.fusion && ` · ${fusionBaseLabel(ref.fusion.baseId)} fusion saved`}
                    </div>
                  </div>
                  <div className="bc-ref-actions">
                    <button type="button" className="bc-ref-reopen" onClick={() => openReference(ref)}>Reopen</button>
                    <button type="button" className="bc-ref-delete" onClick={() => deleteReference(ref.id)} aria-label="Remove this reference">✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
