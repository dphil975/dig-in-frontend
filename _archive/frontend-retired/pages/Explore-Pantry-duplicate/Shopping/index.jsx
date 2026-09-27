import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../../components/shell/Nav';
import './Shopping.css';

const LIST_KEY    = 'dig_in_shopping_list';
const PICKED_KEY  = 'dig_in_shopping_picked';
const HISTORY_KEY = 'dig_in_price_history';

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

// Shrink a captured receipt photo so it fits comfortably in localStorage.
function downscale(dataUrl, max = 720) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function Shopping() {
  const navigate = useNavigate();
  const items = useRef(load(LIST_KEY, [])).current;

  const [picked, setPicked]     = useState(() => new Set(load(PICKED_KEY, [])));
  const [showReceipt, setShow]  = useState(false);
  const [store, setStore]       = useState('');
  const [total, setTotal]       = useState('');
  const [photo, setPhoto]       = useState(null);
  const [alert, setAlert]       = useState(null);
  const [saved, setSaved]       = useState(false);
  const [err, setErr]           = useState('');
  const trackRef = useRef(null);

  const history = useRef(load(HISTORY_KEY, {})).current;
  const knownStores = Object.keys(history);

  // Persist pick-ups so they survive a reload while you're in the store
  useEffect(() => {
    try { localStorage.setItem(PICKED_KEY, JSON.stringify([...picked])); } catch {}
  }, [picked]);

  // Once everything is grabbed, nudge toward the receipt step
  useEffect(() => {
    if (items.length && picked.size === items.length) setShow(true);
  }, [picked, items.length]);

  function togglePick(item) {
    setPicked(s => { const n = new Set(s); n.has(item) ? n.delete(item) : n.add(item); return n; });
  }

  function scroll(dir) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('.shop-card');
    el.scrollBy({ left: dir * ((card ? card.offsetWidth + 14 : 220) * 2), behavior: 'smooth' });
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => setPhoto(await downscale(reader.result));
    reader.readAsDataURL(file);
  }

  // Hint: the last price we recorded for the store being typed
  const lastForStore = store.trim() && history[store.trim()]?.entries?.slice(-1)[0];

  function saveReceipt() {
    const name = store.trim();
    const t = parseFloat(total);
    if (!name)        { setErr('Enter the store name.'); return; }
    if (!(t > 0))     { setErr('Enter the total from your receipt.'); return; }
    setErr('');

    const rec = history[name] || { entries: [] };
    const last = rec.entries[rec.entries.length - 1];
    let priceAlert = null;
    if (last && t > last.total) {
      priceAlert = {
        store: name,
        prev: last.total.toFixed(2),
        now: t.toFixed(2),
        diff: (t - last.total).toFixed(2),
        prevDate: last.date,
      };
    }
    rec.entries.push({ date: new Date().toISOString().slice(0, 10), total: t });
    if (photo) rec.lastPhoto = photo;
    history[name] = rec;
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }
    catch { delete rec.lastPhoto; try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {} }

    setAlert(priceAlert);
    setSaved(true);
  }

  function startOver() {
    setPicked(new Set());
    try { localStorage.removeItem(PICKED_KEY); } catch {}
    setShow(false); setSaved(false); setAlert(null);
    setStore(''); setTotal(''); setPhoto(null);
  }

  const pickedCount = picked.size;

  return (
    <div>
      <Nav />
      <div className="shop-page">
        <button className="shop-back" onClick={() => navigate(-1)}>← BACK</button>

        <div className="shop-head">
          <h1 className="shop-title">SHOPPING LIST</h1>
          <p className="shop-sub">Tap an item once you've grabbed it. We'll line them up store-aisle style.</p>
        </div>

        {items.length === 0 ? (
          <div className="shop-empty">
            Your list is empty.
            <button className="shop-btn shop-btn-ghost" onClick={() => navigate('/recipe-cards')}>BROWSE RECIPES</button>
          </div>
        ) : (
          <>
            <div className="shop-progress">
              <div className="shop-progress-bar">
                <span style={{ width: `${(pickedCount / items.length) * 100}%` }} />
              </div>
              <div className="shop-progress-label">{pickedCount} / {items.length} picked up</div>
            </div>

            {/* Carousel reel of the items you're missing */}
            <div className="shop-reel-wrap">
              <button className="shop-arrow" onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>
              <div className="shop-reel" ref={trackRef}>
                {items.map((item, i) => {
                  const got = picked.has(item);
                  return (
                    <button
                      key={`${item}-${i}`}
                      className={`shop-card${got ? ' got' : ''}`}
                      onClick={() => togglePick(item)}
                    >
                      <span className="shop-card-check">{got ? '✓' : ''}</span>
                      <span className="shop-card-name">{item}</span>
                      <span className="shop-card-state">{got ? 'GOT IT' : 'TAP WHEN FOUND'}</span>
                    </button>
                  );
                })}
              </div>
              <button className="shop-arrow" onClick={() => scroll(1)} aria-label="Scroll right">›</button>
            </div>

            <div className="shop-actions">
              <button className="shop-btn shop-btn-ghost" onClick={() => navigate('/')}>FIND ON MAP</button>
              <button className="shop-btn shop-btn-primary" onClick={() => setShow(true)}>
                FINISH & ADD RECEIPT
              </button>
            </div>
          </>
        )}

        {/* Receipt + price tracking */}
        {showReceipt && !saved && (
          <div className="shop-receipt">
            <div className="shop-receipt-title">TAKE A PHOTO OF YOUR RECEIPT</div>
            <p className="shop-receipt-why">
              We'll remember today's total. Next time you shop here, if prices have gone up, we'll flag it for you.
            </p>

            <label className="shop-photo-drop">
              {photo
                ? <img src={photo} alt="Receipt" className="shop-photo-preview" />
                : <span className="shop-photo-cta">+ TAKE / UPLOAD PHOTO</span>}
              <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} hidden />
            </label>

            <div className="shop-field">
              <label>Store</label>
              <input
                list="shop-stores"
                value={store}
                onChange={e => setStore(e.target.value)}
                placeholder="e.g. Trader Joe's"
              />
              <datalist id="shop-stores">
                {knownStores.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div className="shop-field">
              <label>Receipt total ($)</label>
              <input
                type="number" inputMode="decimal" step="0.01" min="0"
                value={total}
                onChange={e => setTotal(e.target.value)}
                placeholder="0.00"
              />
              {lastForStore && (
                <div className="shop-last-price">Last time here: ${lastForStore.total.toFixed(2)} on {lastForStore.date}</div>
              )}
            </div>

            {err && <div className="shop-err">{err}</div>}

            <button className="shop-btn shop-btn-primary shop-save" onClick={saveReceipt}>SAVE RECEIPT</button>
          </div>
        )}

        {/* Confirmation + price-increase flag */}
        {saved && (
          <div className="shop-done">
            {alert ? (
              <div className="shop-price-alert">
                <div className="shop-price-alert-head">PRICE UP AT {alert.store.toUpperCase()}</div>
                <div className="shop-price-alert-body">
                  Last time here ({alert.prevDate}) it was <strong>${alert.prev}</strong>.
                  Today it's <strong>${alert.now}</strong> — up <strong>${alert.diff}</strong>.
                </div>
              </div>
            ) : (
              <div className="shop-saved-ok">
                Saved. We'll watch {store.trim()}'s prices and flag any increase next time.
              </div>
            )}
            <button className="shop-btn shop-btn-primary" onClick={startOver}>NEW SHOPPING TRIP</button>
            <button className="shop-btn shop-btn-ghost" onClick={() => navigate('/recipe-cards')}>BACK TO RECIPES</button>
          </div>
        )}
      </div>
    </div>
  );
}
