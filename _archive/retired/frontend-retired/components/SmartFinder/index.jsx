import { useState, useMemo, useEffect } from 'react';
import { geocodeAddress, loadLocation } from '../../services/geoService';
import {
  buildPricePool, filterPool, sortPool, parsePrice,
  FLAVORS, loadCravingPrefs, learnCraving,
} from '../../lib/dynamicPricing';
import { track } from '../../lib/analytics';
import './SmartFinder.css';

/* Craving · Rural Bridge · Scan — all on the home page, sharing one
   budget slider + ZIP + the smart price ranking. */

const SUBTABS = [
  { key: 'craving', label: 'CRAVING' },
  { key: 'rural',   label: 'RURAL BRIDGE' },
  { key: 'scan',    label: 'SCAN' },
];

const SORTS = [
  { key: 'smart',     label: 'SMART MIX' },
  { key: 'low-high',  label: 'PRICE ↑' },
  { key: 'high-low',  label: 'PRICE ↓' },
  { key: 'closest',   label: 'CLOSEST' },
];

const ROLE_CLASS = {
  cheapest:  'sf-role-cheap',
  cheap:     'sf-role-cheap',
  mid:       'sf-role-mid',
  rated:     'sf-role-rated',
  expensive: 'sf-role-premium',
};

export default function SmartFinder({ deals = [] }) {
  const [tab, setTab]               = useState('craving');
  const [budget, setBudget]         = useState(15);
  const [zip, setZip]               = useState('');
  const [origin, setOrigin]         = useState(() => loadLocation());
  const [geoMsg, setGeoMsg]         = useState(origin ? 'Using your saved location' : '');
  const [searching, setSearching]   = useState(false);
  const [sortMode, setSortMode]     = useState('smart');
  const [cravings, setCravings]     = useState(() => new Set());
  const [cravingPrefs, setPrefs]    = useState(() => loadCravingPrefs());
  const [snapOnly, setSnapOnly]     = useState(false);
  const [scanItems, setScanItems]   = useState([]);
  const [scanName, setScanName]     = useState('');
  const [scanPrice, setScanPrice]   = useState('');
  const [searched, setSearched]     = useState(false);

  // The priced + located pool (deals + anything the user scanned in)
  const pool = useMemo(() => {
    const base = buildPricePool(deals, origin);
    const scanned = scanItems.map((s, i) => ({
      id: `scan-${i}-${s.name}`.replace(/\s+/g, '-').toLowerCase(),
      dealId: 'scan', item: s.name, emoji: 'DISH', storeType: 'scanned',
      storeName: 'Your scan', address: '', borough: '', lat: null, lng: null,
      price: s.price, priceLabel: s.price != null ? `$${s.price.toFixed(2)}` : '—',
      rating: 0, reviews: 0, dist: null, flavors: [], snapEligible: true, _scanned: true,
    }));
    return [...scanned, ...base];
  }, [deals, origin, scanItems]);

  // Apply budget + craving/SNAP filters, then the active sort / smart mix
  const results = useMemo(() => {
    const filtered = filterPool(pool, {
      budget,
      snapOnly: tab === 'rural' && snapOnly,
      cravingFilter: tab === 'craving' ? cravings : null,
    });
    return sortPool(filtered, sortMode, { activeCravings: cravings, cravingPrefs });
  }, [pool, budget, snapOnly, tab, cravings, sortMode, cravingPrefs]);

  const withinBudget = useMemo(
    () => pool.filter(o => o.price != null && o.price <= budget).length,
    [pool, budget],
  );

  async function findPrices() {
    const q = zip.trim();
    setSearching(true);
    setSearched(true);
    try {
      if (q) {
        const coords = await geocodeAddress(/^\d{5}$/.test(q) ? `${q}, USA` : q);
        if (coords) {
          setOrigin(coords);
          setGeoMsg(`Prices near ${q}`);
          track('smartfinder_search', { zip: q, budget, tab });
        } else {
          setGeoMsg("Couldn't find that ZIP — showing all areas");
        }
      } else if (origin) {
        setGeoMsg('Using your saved location');
      } else {
        setGeoMsg('Enter a ZIP to rank by distance');
      }
    } catch {
      setGeoMsg('Lookup failed — showing all areas');
    } finally {
      setSearching(false);
    }
  }

  function toggleCraving(f) {
    setCravings(prev => {
      const next = new Set(prev);
      if (next.has(f)) { next.delete(f); }
      else { next.add(f); setPrefs(learnCraving(f)); }  // the AI learns your taste
      return next;
    });
  }

  function addScan() {
    if (!scanName.trim()) return;
    setScanItems(prev => [...prev, { name: scanName.trim(), price: parsePrice(scanPrice) }]);
    setScanName(''); setScanPrice('');
    track('smartfinder_scan_add', { name: scanName.trim() });
  }
  function removeScan(idx) {
    setScanItems(prev => prev.filter((_, i) => i !== idx));
  }

  // Reset to smart mix whenever the tab changes (each tab leads with the mix)
  useEffect(() => { setSortMode('smart'); }, [tab]);

  return (
    <section className="smart-finder">
      <div className="sf-head">
        <h3 className="sf-title">SMART FINDER</h3>
        <p className="sf-sub">Craving, Rural Bridge & Scan — priced for your budget, ranked for right now</p>
      </div>

      {/* Sub-tabs */}
      <div className="sf-tabs">
        {SUBTABS.map(t => (
          <button
            key={t.key}
            className={`sf-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >{t.label}</button>
        ))}
      </div>

      {/* Shared spine: budget slider + ZIP */}
      <div className="sf-controls">
        <div className="sf-budget">
          <div className="sf-budget-row">
            <span className="sf-ctl-label">MAX SPEND</span>
            <span className="sf-budget-val">${budget}</span>
          </div>
          <input
            type="range" min={1} max={50} step={1} value={budget}
            className="sf-slider"
            onChange={e => setBudget(parseInt(e.target.value, 10))}
          />
          <div className="sf-budget-scale"><span>$1</span><span>$25</span><span>$50</span></div>
        </div>

        <div className="sf-zip">
          <span className="sf-ctl-label">ZIP / AREA</span>
          <div className="sf-zip-row">
            <input
              className="sf-zip-input"
              placeholder="e.g. 11201"
              value={zip}
              maxLength={20}
              onChange={e => setZip(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && findPrices()}
            />
            <button className="sf-zip-btn" onClick={findPrices} disabled={searching}>
              {searching ? '…' : 'FIND PRICES'}
            </button>
          </div>
          {geoMsg && <div className="sf-geo-msg">{geoMsg}</div>}
        </div>
      </div>

      {/* Per-tab controls */}
      {tab === 'craving' && (
        <div className="sf-panel">
          <span className="sf-ctl-label">CRAVING COMPASS</span>
          <div className="sf-chips">
            {FLAVORS.map(f => (
              <button
                key={f}
                className={`sf-chip${cravings.has(f) ? ' active' : ''}`}
                onClick={() => toggleCraving(f)}
              >
                {f.toUpperCase()}
                {cravingPrefs[f] ? <span className="sf-chip-count">{cravingPrefs[f]}</span> : null}
              </button>
            ))}
          </div>
          <p className="sf-hint">Picks here train your taste profile across the whole app.</p>
        </div>
      )}

      {tab === 'rural' && (
        <div className="sf-panel">
          <span className="sf-ctl-label">FOOD-ACCESS FILTERS</span>
          <label className="sf-toggle">
            <input type="checkbox" checked={snapOnly} onChange={() => setSnapOnly(v => !v)} />
            SNAP-eligible stores only
          </label>
          <p className="sf-hint">
            Bridges rural & urban access — set a tight budget and we surface the cheapest
            eligible staples closest to your ZIP first.
          </p>
        </div>
      )}

      {tab === 'scan' && (
        <div className="sf-panel">
          <span className="sf-ctl-label">SCAN / ADD AN ITEM</span>
          <div className="sf-scan-row">
            <input
              className="sf-scan-name"
              placeholder="Item (e.g. Oat milk)"
              value={scanName}
              onChange={e => setScanName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addScan()}
            />
            <input
              className="sf-scan-price"
              placeholder="$ price"
              value={scanPrice}
              onChange={e => setScanPrice(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addScan()}
            />
            <button className="sf-scan-btn" onClick={addScan}>ADD</button>
          </div>
          {scanItems.length > 0 && (
            <div className="sf-scan-list">
              {scanItems.map((s, i) => (
                <span key={i} className="sf-scan-tag">
                  {s.name}{s.price != null ? ` · $${s.price.toFixed(2)}` : ''}
                  <button onClick={() => removeScan(i)} aria-label="Remove">×</button>
                </span>
              ))}
            </div>
          )}
          <p className="sf-hint">Scanned items join the ranking so you can compare them against local deals.</p>
        </div>
      )}

      {/* Sort toggles */}
      <div className="sf-sortbar">
        <span className="sf-ctl-label">SORT</span>
        {SORTS.map(s => (
          <button
            key={s.key}
            className={`sf-sort${sortMode === s.key ? ' active' : ''}`}
            onClick={() => setSortMode(s.key)}
            disabled={s.key === 'closest' && !origin}
            title={s.key === 'closest' && !origin ? 'Set a ZIP first' : ''}
          >{s.label}</button>
        ))}
        <span className="sf-count">{withinBudget} within ${budget}</span>
      </div>

      {/* Results */}
      <div className="sf-results">
        {results.length === 0 ? (
          <div className="sf-empty">
            {searched
              ? 'No options under that budget — nudge the slider up.'
              : 'Set your budget and a ZIP, then pick a craving to see ranked local prices.'}
          </div>
        ) : (
          results.map((o, i) => (
            <div key={o.id} className={`sf-card ${ROLE_CLASS[o._role] || ''}`}>
              <div className="sf-rank">{i + 1}</div>
              <div className="sf-emoji">{o.emoji}</div>
              <div className="sf-card-main">
                <div className="sf-card-top">
                  <span className="sf-item">{o.item}</span>
                  {sortMode === 'smart' && o._roleLabel && (
                    <span className="sf-role">{o._roleLabel}</span>
                  )}
                </div>
                <div className="sf-card-store">{o.storeName}{o.address ? ` · ${o.address}` : ''}</div>
                <div className="sf-card-meta">
                  {o.rating > 0 && <span className="sf-rating">★ {o.rating} ({o.reviews})</span>}
                  {o.dist != null && <span className="sf-dist">{o.dist < 1 ? `${(o.dist*1000).toFixed(0)}m` : `${o.dist.toFixed(1)}km`}</span>}
                  {o.snapEligible && <span className="sf-snap">SNAP</span>}
                  {o.flavors.slice(0, 2).map(f => <span key={f} className="sf-flavor">{f}</span>)}
                </div>
              </div>
              <div className="sf-price">
                <div className="sf-price-val">{o.price != null ? `$${o.price.toFixed(2)}` : '—'}</div>
                <div className="sf-price-label">{o.priceLabel}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
