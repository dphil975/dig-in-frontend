import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StoreMiniMap from '../StoreMiniMap';
import StoreMemoryCard from '../StoreMemoryCard';
import {
  STORE_COLORS, STORE_TYPE_LABELS, BOROUGHS, incomeTier, TIER_LABEL, COUNTY_INCOME,
  STORE_FILE_BY_BOROUGH,
} from '../../data/storeData';
import { foodAccessStress, stressReason } from '../../lib/foodAccessStress';
import { haversineKm, loadLocation, saveLocation, getUserLocation } from '../../services/geoService';
import { hasGeolocation } from '../../lib/native';
import { verifyCheckinLocation, checkinRejectionMessage } from '../../lib/checkinVerify';
import { parseOpenNow, formatHoursDisplay } from '../../lib/storeHours';
import { boroughForZip } from '../../lib/zipToState';
import { recordCheckin as trackCheckin } from '../../services/behaviorTracker';
import { track } from '../../lib/analytics';
import { LIVE_DEALS, LIVE_DEAL_LOCATIONS } from '../../data/liveDeals';
import './FoodMap.css';

/* FoodMap — the full store map (every plotted point) plus the nearby-stores
   ledger, shown on the recipe page so you can see where to shop.

   Now that stores cover every state (not just NYC boroughs), loading ALL
   39+ regional files up front (California alone is 5MB+) on every mount
   would genuinely overload the app — so this loads ONE region's file at a
   time, keyed by STORE_FILE_BY_BOROUGH, and caches each file in a ref so
   revisiting an area you've already seen this session doesn't refetch.
   Your ZIP code (or a previously-picked area) decides which region loads by
   default; "All Areas" in the picker is kept as an explicit, clearly-heavier
   opt-in rather than the default. The active region's real data extent also
   draws a dashed border on the map (see areaBounds below) so it's visually
   obvious what you're — and aren't — looking at.

   Filtering the loaded region down further could still mean hundreds of
   matches — trying to render all of them (even just to the map) is what was
   crashing the page — so the list is paginated to PAGE_SIZE at a time,
   sorted by distance or rating, with the footer's page numbers to move
   through the rest. Only the current page's stores are ever plotted as pins.

   Every store on the current page stays plotted at all times; hovering a
   ledger row (desktop) or scrolling it into view (touch, where there's no
   hover) makes the map pan to that one store and call it out — bigger pin,
   highlight ring, dims the rest — without hiding anything else. Clicking a
   store pops up its hours/open status plus Directions and a GPS-verified
   Check In button, so arriving at the store is what unlocks the check-in. */

const TYPES = ['grocery', 'corner_store', 'bodega', 'deli', 'specialty',
  'asian', 'african', 'middle_eastern', 'latino', 'south_asian', 'rmp'];
const ALL_TYPES_ON = Object.fromEntries(TYPES.map(t => [t, true]));
const PAGE_SIZE = 30;
const NYC_CENTER = [40.7128, -74.006];
const ALL_AREAS = '__all__'; // explicit "load every region" sentinel — distinct from null ("no area chosen yet")

// Compact pager: first, last, current ± 1, with "…" filling any gaps —
// avoids rendering hundreds of page buttons for an unfiltered borough.
function pageWindow(current, total) {
  const pages = [...new Set([0, total - 1, current - 1, current, current + 1])]
    .filter(p => p >= 0 && p < total)
    .sort((a, b) => a - b);
  const withGaps = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) withGaps.push('…');
    withGaps.push(p);
  });
  return withGaps;
}

function BoroughDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setQuery(''); }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selected = BOROUGHS.find(b => b.id === value);
  const q = query.trim().toLowerCase();
  const options = BOROUGHS.filter(b => !q || b.label.toLowerCase().includes(q) || b.county.toLowerCase().includes(q));

  function pick(id) { onChange(id); setOpen(false); setQuery(''); }

  const buttonLabel = value === ALL_AREAS ? 'All Areas' : selected ? selected.label : 'NYC Metro (default)';

  return (
    <div className="fm-borough" ref={wrapRef}>
      <button type="button" className="fm-borough-btn" onClick={() => setOpen(o => !o)}>
        {buttonLabel} <span className="fm-borough-caret">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="fm-borough-panel">
          <input
            className="fm-borough-search"
            placeholder="Search state, borough, or county…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            className={`fm-borough-option${value === ALL_AREAS ? ' active' : ''}`}
            onClick={() => pick(ALL_AREAS)}
          >
            <span className="fm-borough-name">All Areas</span>
            <span className="fm-borough-county">Every region — loads more data, slower</span>
          </button>
          {options.map(b => (
            <button
              key={b.id}
              type="button"
              className={`fm-borough-option${value === b.id ? ' active' : ''}`}
              onClick={() => pick(b.id)}
            >
              <span className="fm-borough-name">{b.label}</span>
              <span className="fm-borough-county">{b.county}</span>
            </button>
          ))}
          {options.length === 0 && <div className="fm-borough-empty">No match</div>}
        </div>
      )}
    </div>
  );
}

export default function FoodMap() {
  const navigate = useNavigate();
  const [user, setUser] = useState(loadLocation);
  const [locating, setLocating] = useState(false);
  const [locGen, setLocGen] = useState(0); // bumped to remount the map's user-location dot
  const [types, setTypes] = useState(ALL_TYPES_ON);
  // Initialize from whatever area was last picked (directly, or via a ZIP
  // resolving to one) — otherwise null, meaning "not chosen yet," which the
  // loading effect below treats as "just load the NYC default," not "load
  // everything."
  const [borough, setBorough] = useState(() => {
    try { return localStorage.getItem('dig_in_area') || null; } catch { return null; }
  });
  const [zipInput, setZipInput] = useState(() => {
    try { return localStorage.getItem('dig_in_zip') || ''; } catch { return ''; }
  });
  const [zipError, setZipError] = useState(false);
  const [areaLoading, setAreaLoading] = useState(true);
  // Benefit filters — off by default (show everything). SNAP treats a missing
  // flag as eligible (SNAP authorization is near-universal for food stores, and
  // most of the dataset predates the per-store flag); WIC is the strict filter,
  // matching only stores explicitly flagged as WIC vendors.
  const [benefits, setBenefits] = useState({ snap: false, wic: false });
  const [checkins, setCheckins] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dig_in_checkins') || '{}'); } catch { return {}; }
  });
  // Coins/badges — moved here from the old Home-page map hub (see checkin()
  // below); same localStorage keys, so Profile's stats keep working exactly
  // as before, just earned from this map instead of that one.
  const [coins, setCoins] = useState(() => parseInt(localStorage.getItem('dig_in_coins') || '0', 10));
  const [badges, setBadges] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dig_in_badges') || '[]'); } catch { return []; }
  });
  const [badgeToast, setBadgeToast] = useState(null);
  const [checkinMsg, setCheckinMsg] = useState(null); // transient status for a rejected/unverified check-in
  const [checkinBusy, setCheckinBusy] = useState(null); // store id currently verifying location
  const [activeDealId, setActiveDealId] = useState(null);
  const [memoryStore, setMemoryStore] = useState(null);   // store the flip-card Memory view is open for
  const [allStores, setAllStores] = useState([]);
  // Per-file cache so switching back to an area you've already loaded this
  // session (or the shared /stores.json every NYC-metro id maps to) is
  // instant, not a refetch.
  const fileCacheRef = useRef(new Map());

  useEffect(() => {
    let alive = true;
    const loadFile = async (url) => {
      if (fileCacheRef.current.has(url)) return fileCacheRef.current.get(url);
      const stores = await fetch(url).then(r => r.json()).then(d => d.stores || []).catch(() => []);
      fileCacheRef.current.set(url, stores);
      return stores;
    };

    (async () => {
      setAreaLoading(true);
      const urls = borough === ALL_AREAS
        ? [...new Set(Object.values(STORE_FILE_BY_BOROUGH))]
        : [STORE_FILE_BY_BOROUGH[borough] || '/stores.json'];
      const lists = await Promise.all(urls.map(loadFile));
      if (!alive) return;
      setAllStores(lists.flat());
      setAreaLoading(false);
    })();

    return () => { alive = false; };
  }, [borough]);

  function submitZip(e) {
    e?.preventDefault();
    const resolved = boroughForZip(zipInput);
    if (!resolved) { setZipError(true); return; }
    setZipError(false);
    setBorough(resolved);
    try { localStorage.setItem('dig_in_zip', zipInput); } catch {}
  }

  async function handleUseLocation() {
    if (!hasGeolocation() || locating) return;
    setLocating(true);
    try {
      const { lat, lng } = await getUserLocation();
      saveLocation(lat, lng);
      setUser({ lat, lng });
      setLocGen(g => g + 1);
    } catch {
      // denied or unavailable — leave the ledger unsorted, same as before
    } finally {
      setLocating(false);
    }
  }

  // The store currently "focused" — from a hover (desktop) or, on touch
  // devices with no hover, whichever row the ledger scroll has centered.
  const [hoveredId, setHoveredId] = useState(null);
  const [scrollActiveId, setScrollActiveId] = useState(null);
  const rowsRef = useRef(null);
  const rowElsRef = useRef({});
  // Real mouse+hover devices rely on onMouseEnter alone; touch devices have no
  // hover event at all, so scrolling the list is the only signal they give us.
  const hasHover = useMemo(
    () => (typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
      : true),
    []
  );

  const [sortBy, setSortBy] = useState('distance'); // 'distance' | 'rating'
  const [page, setPage] = useState(0);

  const visible = useMemo(
    () => allStores.filter(s =>
      types[s.type]
      && (!borough || borough === ALL_AREAS || s.borough === borough)
      && (!benefits.snap || s.acceptsSNAP !== false)
      && (!benefits.wic || s.acceptsWIC === true)
    ),
    [allStores, types, borough, benefits]
  );
  // The full filtered set can run into the thousands, so it's sorted once
  // here and then paginated below — only the current page is ever handed to
  // the map or rendered as rows. Distance sort silently falls back to rating
  // when there's no known location yet (nothing to measure distance from).
  const sorted = useMemo(() => {
    const list = visible.map(s => ({ ...s, dist: user ? haversineKm(user.lat, user.lng, s.lat, s.lng) : null }));
    return sortBy === 'distance' && user
      ? list.sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity))
      : list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [visible, user, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  // Back to page 1 whenever the filter/sort criteria change the set's shape.
  useEffect(() => { setPage(0); }, [visible, sortBy]);
  const pageItems = useMemo(
    () => sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [sorted, page]
  );

  function selectSort(next) {
    if (next === 'distance' && !user) handleUseLocation();
    setSortBy(next);
    setPage(0);
  }

  // Watch the ledger rows scroll past the list viewport and track whichever
  // one is most in view — this is what stands in for "hover" on iOS/Android,
  // where scrolling the list is the only signal we get.
  useEffect(() => {
    if (hasHover) return; // hover devices never fall back to scroll-tracking
    const root = rowsRef.current;
    if (!root) return;
    const ratios = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => ratios.set(e.target.dataset.storeId, e.intersectionRatio));
        let bestId = null, bestRatio = 0.5;
        ratios.forEach((ratio, id) => { if (ratio > bestRatio) { bestRatio = ratio; bestId = id; } });
        setScrollActiveId(bestId);
      },
      { root, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    Object.values(rowElsRef.current).forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, [pageItems, hasHover]);

  const activeStore = useMemo(() => {
    const id = hoveredId ?? scrollActiveId;
    // scrollActiveId comes off a DOM dataset attribute, which is always a
    // string, while store ids from stores.json are numbers — compare as
    // strings so the touch/scroll path still matches.
    return id == null ? null : pageItems.find(s => String(s.id) === String(id)) || null;
  }, [pageItems, hoveredId, scrollActiveId]);

  const boroughMeta = (borough && borough !== ALL_AREAS) ? BOROUGHS.find(b => b.id === borough) : null;

  // Remember the area the shopper is browsing so the Pantry can tailor recipe
  // suggestions to the local income tier (see suggestRecipes()), and so the
  // next visit loads straight into it instead of re-defaulting to NYC.
  useEffect(() => {
    try {
      if (borough && borough !== ALL_AREAS) localStorage.setItem('dig_in_area', borough);
      else localStorage.removeItem('dig_in_area');
    } catch {}
  }, [borough]);

  function giveCoins(amount) {
    setCoins(total0 => {
      const total = total0 + amount;
      try { localStorage.setItem('dig_in_coins', String(total)); } catch { /* ignore */ }
      return total;
    });
  }

  function awardBadge(id, label, icon) {
    setBadges(prev => {
      if (prev.find(b => b.id === id)) return prev;
      const badge = { id, label, icon, earnedAt: Date.now() };
      const next = [...prev, badge];
      try { localStorage.setItem('dig_in_badges', JSON.stringify(next)); } catch { /* ignore */ }
      track('badge_earned', { badge_id: id, badge_label: label });
      setBadgeToast({ label, icon });
      setTimeout(() => setBadgeToast(null), 3000);
      return next;
    });
  }

  // GPS-verified check-in (within 150m of the store) that awards coins and
  // badges. Requires a real, accurate GPS fix that confirms you're actually
  // there — no silent fallback that awards the check-in when location can't
  // be confirmed.
  async function checkin(s) {
    setCheckinBusy(s.id);
    const result = await verifyCheckinLocation(s.lat, s.lng);
    setCheckinBusy(null);
    if (!result.ok) {
      setCheckinMsg({ id: s.id, text: checkinRejectionMessage(result, s.name) });
      setTimeout(() => setCheckinMsg(null), 4000);
      return;
    }

    const next = { ...checkins, [s.id]: (checkins[s.id] || 0) + 1 };
    setCheckins(next);
    try { localStorage.setItem('dig_in_checkins', JSON.stringify(next)); } catch { /* ignore */ }
    trackCheckin({ id: String(s.id), name: s.name, type: 'store' });
    track('checkin', { store_id: s.id, store_name: s.name, store_type: s.type, borough: s.borough });

    const uniqueVisited = Object.keys(next).length;
    const homeBorough = localStorage.getItem('dig_in_home_borough');
    let coinAmt = 50;
    if (homeBorough && borough && borough !== ALL_AREAS && borough !== homeBorough) coinAmt += 25;
    giveCoins(coinAmt);

    if (uniqueVisited >= 1)  awardBadge('first-checkin', 'First Check-In', '1ST');
    if (uniqueVisited >= 3)  awardBadge('explorer',      'Explorer',       'EXP');
    if (uniqueVisited >= 10) awardBadge('city-crawler',  'City Crawler',   'PRO');
  }

  // Live Deals — which of today's sample deals actually has a store in the
  // CURRENTLY loaded region (deals reference a small hand-curated NYC set;
  // the real per-state store files loaded here may or may not include that
  // exact store) — matched by exact name or close coordinates, honestly
  // reflecting when a deal isn't in view rather than guessing.
  const dealMatches = useMemo(() => {
    const map = new Map();
    for (const loc of LIVE_DEAL_LOCATIONS) {
      if (map.has(loc.deal.id)) continue;
      const lname = loc.name.toLowerCase();
      let match = allStores.find(s => (s.name || '').toLowerCase() === lname);
      if (!match) {
        let bestDist = 0.15; // 150m
        for (const s of allStores) {
          const d = haversineKm(loc.lat, loc.lng, s.lat, s.lng);
          if (d < bestDist) { bestDist = d; match = s; }
        }
      }
      if (match) map.set(loc.deal.id, match);
    }
    return map;
  }, [allStores]);

  function handleDealClick(deal) {
    setActiveDealId(id => (id === deal.id ? null : deal.id));
  }

  const activeDeal = LIVE_DEALS.find(d => d.id === activeDealId) || null;
  const dealHighlight = activeDeal ? dealMatches.get(activeDeal.id) : null;

  return (
    <section className="fm">
      <div className="fm-head">
        <div>
          <p className="fm-eyebrow">SHOP NEARBY</p>
          <h2 className="fm-title">The <span>Food Map.</span></h2>
        </div>
        <div className="fm-filters">
          <form className="fm-zip" onSubmit={submitZip}>
            <input
              className="fm-zip-input"
              placeholder="ZIP code"
              inputMode="numeric"
              maxLength={5}
              value={zipInput}
              onChange={e => { setZipInput(e.target.value.replace(/\D/g, '')); setZipError(false); }}
            />
            <button type="submit" className="fm-zip-go">Go</button>
          </form>
          {zipError && <span className="fm-zip-error">No store data for that ZIP yet</span>}
          <BoroughDropdown value={borough} onChange={setBorough} />
          {TYPES.map(t => (
            <button
              key={t}
              className={`fm-type${types[t] ? ' active' : ''}`}
              style={{ '--c': STORE_COLORS[t] }}
              onClick={() => setTypes(p => ({ ...p, [t]: !p[t] }))}
            >
              <span className="fm-dot" />{STORE_TYPE_LABELS[t]}
            </button>
          ))}
          <button
            type="button"
            className={`fm-benefit fm-benefit-snap${benefits.snap ? ' active' : ''}`}
            aria-pressed={benefits.snap}
            onClick={() => setBenefits(b => ({ ...b, snap: !b.snap }))}
            title="Show only stores that accept SNAP / EBT"
          >
            SNAP / EBT
          </button>
          <button
            type="button"
            className={`fm-benefit fm-benefit-wic${benefits.wic ? ' active' : ''}`}
            aria-pressed={benefits.wic}
            onClick={() => setBenefits(b => ({ ...b, wic: !b.wic }))}
            title="Show only WIC-authorized vendors"
          >
            WIC
          </button>
          <button type="button" className="fm-locate" onClick={handleUseLocation} disabled={locating}>
            {locating ? 'Locating…' : 'Use my location'}
          </button>
          <button type="button" className="fm-commute" onClick={() => navigate('/craving-compass')}>
            Find it near me
          </button>
        </div>
        {boroughMeta?.income != null && (
          <div className="fm-income">
            <span className="fm-income-num">
              {boroughMeta.label} median household income · ${boroughMeta.income.toLocaleString()}
            </span>
            <span className="fm-income-note">{TIER_LABEL[incomeTier(boroughMeta.income)]}</span>
          </div>
        )}
        {boroughMeta?.income != null && (() => {
          // Area food-access stress — how far the food budget really stretches
          // here once cost-of-food and food insecurity are accounted for.
          const fas = foodAccessStress(boroughMeta.income, { boroughId: boroughMeta.id });
          // The state median hides the crisis: find the poorest county/area in
          // this state and, if its stress is meaningfully worse, surface it.
          const counties = COUNTY_INCOME[boroughMeta.id];
          const worst = counties?.length
            ? counties.reduce((a, b) => (b.median < a.median ? b : a)) : null;
          const worstFas = worst ? foodAccessStress(worst.median, { boroughId: boroughMeta.id }) : null;
          return (
            <div className="fm-access" style={{ '--fas': fas.color }}>
              <span className="fm-access-badge">FOOD ACCESS · {fas.label.toUpperCase()}</span>
              <span className="fm-access-note">
                {stressReason(fas)}
                {Math.abs(fas.costPremium - 1) > 0.01 &&
                  ` · food costs ~${Math.round(Math.abs(fas.costPremium - 1) * 100)}% ${fas.costPremium > 1 ? 'above' : 'below'} US avg`}
                {Math.abs(fas.costPremium - 1) > 0.01 && fas.costAdjustedIncome &&
                  ` · effective food budget ≈ $${fas.costAdjustedIncome.toLocaleString()}`}
                {` · ~${fas.insecurityPct}% food-insecure`}
              </span>
              {worstFas && worstFas.score >= fas.score + 12 && (
                <span className="fm-access-sub" style={{ '--fas': worstFas.color }}>
                  Behind the median — {worst.county}: {worstFas.label.toLowerCase()} stress (median ${worst.median.toLocaleString()})
                </span>
              )}
            </div>
          );
        })()}
      </div>

      <div className="fm-layout">
        <div className="fm-map">
          {areaLoading && <div className="fm-map-loading">Loading {boroughMeta ? boroughMeta.label : 'this area'}…</div>}
          <StoreMiniMap
            key={locGen}
            stores={pageItems}
            areaStores={borough === ALL_AREAS ? null : allStores}
            height={380}
            center={boroughMeta ? boroughMeta.center : NYC_CENTER}
            zoom={boroughMeta ? 13 : 11}
            zoomable
            richPopups
            highlight={activeStore || dealHighlight}
            checkins={checkins}
            onCheckin={checkin}
            onOpenMemory={setMemoryStore}
          />
        </div>

        <div className="fm-ledger">
          <div className="fm-ledger-head">
            <span className="fm-ledger-title">NEARBY STORES</span>
            <div className="fm-sort">
              <button
                type="button"
                className={`fm-sort-btn${sortBy === 'distance' ? ' active' : ''}`}
                onClick={() => selectSort('distance')}
              >
                Closest
              </button>
              <button
                type="button"
                className={`fm-sort-btn${sortBy === 'rating' ? ' active' : ''}`}
                onClick={() => selectSort('rating')}
              >
                Top Rated
              </button>
            </div>
            <span className="fm-ledger-count">
              {sorted.length} match{sorted.length !== 1 ? 'es' : ''}{sortBy === 'distance' && user ? ' · nearest first' : ' · top rated'}
            </span>
          </div>
          <div className="fm-rows" ref={rowsRef}>
            {pageItems.length === 0
              ? <div className="fm-empty">No stores match — turn a filter back on.</div>
              : pageItems.map(s => {
                  const v = checkins[s.id] || 0;
                  const dist = s.dist == null ? null
                    : s.dist < 1 ? `${(s.dist * 1000).toFixed(0)}m` : `${s.dist.toFixed(1)}km`;
                  const openNow = parseOpenNow(s.opening_hours);
                  const hoursTxt = formatHoursDisplay(s.opening_hours);
                  return (
                    <div
                      key={s.id}
                      className={`fm-row${activeStore?.id === s.id ? ' active' : ''}`}
                      data-store-id={s.id}
                      ref={el => { if (el) rowElsRef.current[s.id] = el; else delete rowElsRef.current[s.id]; }}
                      onMouseEnter={() => setHoveredId(s.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <span className="fm-row-dot" style={{ background: STORE_COLORS[s.type] }} />
                      <div className="fm-row-info">
                        <div className="fm-row-name">
                          <span className="fm-row-name-txt">{s.name}</span>
                          {s.acceptsSNAP && <span className="fm-row-badge snap">SNAP</span>}
                          {s.acceptsWIC && <span className="fm-row-badge wic">WIC</span>}
                        </div>
                        <div className="fm-row-addr">
                          {s.address}{v > 0 ? ` · ${v} visit${v !== 1 ? 's' : ''}` : ''}
                        </div>
                        {(openNow !== null || hoursTxt) && (
                          <div className="fm-row-hours">
                            {openNow !== null && (
                              <span className={`fm-row-open ${openNow ? 'open' : 'closed'}`}>
                                {openNow ? '● Open now' : '● Closed'}
                              </span>
                            )}
                            {hoursTxt && <span className="fm-row-hours-txt">{hoursTxt}</span>}
                          </div>
                        )}
                      </div>
                      {dist && <span className="fm-row-dist">{dist}</span>}
                      {checkinMsg?.id === s.id && <div className="fm-row-checkin-msg">{checkinMsg.text}</div>}
                      <div className="fm-row-actions">
                        <button className={`fm-row-checkin${v > 0 ? ' done' : ''}`} onClick={() => checkin(s)} disabled={checkinBusy === s.id}>
                          {checkinBusy === s.id ? 'Locating…' : (v > 0 ? '✓ Check In' : 'Check In')}
                        </button>
                        <button
                          type="button"
                          className="fm-row-directions"
                          onClick={() => window.open(
                            `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`,
                            '_blank', 'noopener'
                          )}
                        >
                          ↗ Directions
                        </button>
                        <button
                          type="button"
                          className="fm-row-memory"
                          onClick={() => setMemoryStore(s)}
                          title="Flip for store memory — receipts, regulars, and what's running low"
                        >
                          📇 Memory
                        </button>
                      </div>
                    </div>
                  );
                })}
          </div>
          {totalPages > 1 && (
            <div className="fm-pager">
              <button
                type="button"
                className="fm-pager-btn"
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                ← Prev
              </button>
              {pageWindow(page, totalPages).map((p, i) =>
                p === '…'
                  ? <span key={`gap-${i}`} className="fm-pager-gap">…</span>
                  : (
                    <button
                      key={p}
                      type="button"
                      className={`fm-pager-num${p === page ? ' active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p + 1}
                    </button>
                  )
              )}
              <button
                type="button"
                className="fm-pager-btn"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live deals — moved here from the old Home-page map hub, "where the
          leaflet map is" now lives. Tapping one highlights a matching real
          store in the ledger/map above if this region's loaded data has
          one; otherwise says so honestly instead of guessing. */}
      <div className="fm-deals">
        <div className="fm-deals-head">
          <span>LIVE DEALS</span>
          <span className="fm-deals-count">{LIVE_DEALS.length} today</span>
        </div>
        <div className="fm-deals-row">
          {LIVE_DEALS.map(d => (
            <button
              key={d.id}
              type="button"
              className={`fm-deal${activeDealId === d.id ? ' on' : ''}`}
              style={{ '--accent': d.accent }}
              onClick={() => handleDealClick(d)}
            >
              <span className="fm-deal-swatch" />
              <span className="fm-deal-title">{d.title}</span>
              <span className="fm-deal-badge">{d.badge}</span>
            </button>
          ))}
        </div>
        {activeDeal && (
          <div className="fm-deal-detail">
            {dealHighlight
              ? <span>“{activeDeal.title}” — highlighted above at <strong>{dealHighlight.name}</strong>.</span>
              : <span>“{activeDeal.title}” isn't at a store in the currently loaded area — try a different ZIP or "All Areas" above.</span>}
          </div>
        )}
      </div>

      {badgeToast && (
        <div className="fm-badge-toast">
          <span className="fm-badge-toast-icon">{badgeToast.icon}</span> BADGE EARNED: {badgeToast.label}
        </div>
      )}

      {memoryStore && (
        <StoreMemoryCard store={memoryStore} onClose={() => setMemoryStore(null)} />
      )}
    </section>
  );
}
