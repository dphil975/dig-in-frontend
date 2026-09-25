import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../../../lib/leafletSetup'; // marker-icon fix — must run before any Marker mounts
import Nav from '../../../../components/shell/Nav';
import ShoutoutCard from '../../../../components/social/ShoutoutCard';
import { stateForZip, boroughForZip } from '../../../../lib/zipToState';
import { haversineKm } from '../../../../lib/commutePlanner';
import { verifyCheckinLocation, checkinRejectionMessage } from '../../../../lib/checkinVerify';
import { recordCheckin } from '../../../../services/behaviorTracker';
import { track } from '../../../../lib/analytics';
import { TEXAS_METROS, parkAndRideForMetro } from '../../../../data/parkAndRide';
import { STORE_COLORS, STORE_TYPE_LABELS, STORE_FILE_BY_BOROUGH, BOROUGHS } from '../../../../data/storeData';
import { fetchTransitNear, nearestTransit, summarizeTransit, routeLinks, TRANSIT_MODE } from '../../../../lib/transitAccess';
import { isCarDependent } from '../../../../lib/shopTiming';
import './CityExplorer.css';

/* ════════════════════════════════════════════════════════════
   CITY EXPLORER — where the food is, everywhere, organized.

   Rebuilt (2026-07-29): the old page hard-coded Texas + NYC metro tabs and
   never plotted the actual stores. Now it's ZIP-driven across every state and
   territory the app has data for — the same region-file system FoodMap uses
   (boroughForZip -> STORE_FILE_BY_BOROUGH) — and it ORGANIZES what was "all
   over the place" by store TYPE: grocery, bodega, deli, specialty, and the
   ethnic markets (Asian, Latino, African/Caribbean, Middle Eastern, South
   Asian) each get a real, color-coded filter. Tap a store to see everything on
   file and check in. Texas keeps its park & ride layer as a bonus.

   Location, not price — this view answers "where are they, and can I walk
   there," never "what does it cost."
   ════════════════════════════════════════════════════════════ */

// Order store-type filters the way a shopper thinks: everyday first, then the
// specialty/ethnic markets. Only types actually present in a region show.
const TYPE_ORDER = ['grocery', 'corner_store', 'bodega', 'deli', 'specialty', 'asian', 'latino', 'african', 'middle_eastern', 'south_asian', 'rmp'];

const iconCache = {};
function storeIconFor(type) {
  if (iconCache[type]) return iconCache[type];
  const color = STORE_COLORS[type] || STORE_COLORS.grocery;
  const ic = L.divIcon({
    className: 'ce-store-icon',
    html: `<div class="ce-store-pin" style="background:${color}"></div>`,
    iconSize: [14, 14], iconAnchor: [7, 7], popupAnchor: [0, -8],
  });
  iconCache[type] = ic;
  return ic;
}

// Reachability from where you're exploring — honest, from real coordinates.
function walkTier(km) {
  if (km == null || !Number.isFinite(km)) return null;
  if (km <= 1.0) return { icon: '🚶', label: 'walkable', cls: 'walk' };
  if (km <= 2.5) return { icon: '🚶', label: 'short walk', cls: 'walk' };
  if (km <= 6) return { icon: '🚲', label: 'quick ride', cls: 'ride' };
  return { icon: '🚗', label: 'a drive', cls: 'drive' };
}

function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 1.2 }); }, [center, map, zoom]);
  return null;
}

// Track where the map is ACTUALLY looking. `mapCenter` state only changes when
// our own code moves it — a user panning/zooming the map by hand doesn't touch
// it. This reports the real Leaflet center after every move so "Search this
// area" searches where you dragged to, not the last ZIP we set. Writes to a
// ref (no re-render) so it never fights the flyTo animation.
function MapTracker({ onMove }) {
  const map = useMap();
  useMapEvents({
    moveend: () => { const c = map.getCenter(); onMove([c.lat, c.lng], map.getZoom()); },
  });
  return null;
}

function loadJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
}

// One store's transit indicator: the walk to its nearest real stop, or — when
// there's none close — an honest "best by car" flag. `t` is nearestTransit()'s
// result (or null / undefined when transit hasn't loaded).
function TransitBadge({ t, loading }) {
  if (loading) return <span className="ce-transit ce-transit-wait">🚏 checking transit…</span>;
  if (!t) return null;
  const m = TRANSIT_MODE[t.mode] || TRANSIT_MODE.bus;
  if (t.walkable) {
    return <span className="ce-transit ce-transit-ok">{m.icon} {t.walkMin} min to {t.mode === 'bus' ? 'bus' : m.label.split(' ')[0].toLowerCase()}</span>;
  }
  return <span className="ce-transit ce-transit-car">🚗 best by car · nearest stop {(t.meters / 1000).toFixed(1)} km</span>;
}

export default function CityExplorer({ embedded = false } = {}) {
  const [query, setQuery]       = useState(() => { try { return localStorage.getItem('dig_in_zip') || '10001'; } catch { return '10001'; } });
  const [regionLabel, setRegionLabel] = useState('');
  const [stores, setStores]     = useState([]);
  const [origin, setOrigin]     = useState(null);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.006]);
  const [mapZoom, setMapZoom]   = useState(12);
  const [activeType, setActiveType] = useState('all');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [txMetro, setTxMetro]   = useState(null);
  // Real public-transit stops around the searched area (OSM Overpass), plus its
  // loading state. `null` = not loaded / unavailable; [] = loaded, none here.
  const [transitStops, setTransitStops] = useState(null);
  const [transitLoading, setTransitLoading] = useState(false);

  // Check-in state (same rewards as the old map hub, just organized here).
  const [checkins, setCheckins] = useState(() => loadJSON('dig_in_checkins', {}));
  const [coins, setCoins]       = useState(() => parseInt(localStorage.getItem('dig_in_coins') || '0', 10));
  const [toast, setToast]       = useState(null);
  const [checkinMsg, setCheckinMsg] = useState(null);
  const [checkinBusy, setCheckinBusy] = useState(null); // store id currently verifying location

  const fileCache = useRef(new Map());
  const markersRef = useRef(new Map());   // store id -> leaflet marker, so a card can open its popup
  const mapWrapRef = useRef(null);
  const liveCenterRef = useRef([40.7128, -74.006]);   // where the map is ACTUALLY looking (updates on pan/zoom)
  const liveZoomRef = useRef(12);

  // ── Geocoding (keyless OSM, same as elsewhere in the app) ───────────────
  async function geocodeQuery(q) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=us&q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(8000) });
      const d = await res.json();
      if (!d?.[0]) return null;
      const a = d[0].address || {};
      return {
        lat: +d[0].lat, lng: +d[0].lon, postcode: a.postcode || null, state: a.state || null,
        label: [a.city || a.town || a.village || a.county, a.state].filter(Boolean).join(', ')
          || d[0].display_name?.split(',').slice(0, 2).join(','),
      };
    } catch { return null; }
  }
  async function reverseGeocode(lat, lng) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`, { signal: AbortSignal.timeout(8000) });
      const d = await res.json();
      const a = d?.address || {};
      return { postcode: a.postcode || null, state: a.state || null, label: [a.city || a.town || a.village || a.county, a.state].filter(Boolean).join(', ') };
    } catch { return { postcode: null, state: null, label: '' }; }
  }
  function nearestRegion(lat, lng) {
    let best = null, bestKm = Infinity;
    for (const b of BOROUGHS) { const km = haversineKm(lat, lng, b.center[0], b.center[1]); if (km < bestKm) { bestKm = km; best = b; } }
    return best;
  }

  // Load whatever region a resolved place falls in, centered on that point.
  async function loadAt({ point, postcode, state, label }) {
    let id = postcode ? boroughForZip(postcode) : null;
    let meta = id ? BOROUGHS.find(b => b.id === id) : null;
    if (!meta && point) { meta = nearestRegion(point.lat, point.lng); id = meta?.id; }
    if (!meta) { setError('No store data near there yet — coverage is growing.'); setLoading(false); return; }
    setError(null);
    setLoading(true);
    setRegionLabel(label || meta.label);

    const file = STORE_FILE_BY_BOROUGH[id] || '/stores.json';
    let arr = fileCache.current.get(file);
    if (!arr) { arr = await fetch(file).then(r => r.json()).then(d => d.stores || []).catch(() => []); fileCache.current.set(file, arr); }
    setStores(arr);

    const o = point || { lat: meta.center[0], lng: meta.center[1] };
    setOrigin(o);
    setMapCenter([o.lat, o.lng]);
    setMapZoom(13);

    const isTx = state === 'Texas' || (postcode && stateForZip(postcode) === 'TX');
    if (isTx) {
      const nearest = [...TEXAS_METROS].sort((a, b) => haversineKm(o.lat, o.lng, a.lat, a.lng) - haversineKm(o.lat, o.lng, b.lat, b.lng))[0];
      setTxMetro(nearest || null);
    } else setTxMetro(null);

    setActiveType('all');
    setLoading(false);
    if (postcode) { try { localStorage.setItem('dig_in_zip', postcode); } catch { /* ignore */ } }

    // Pull real transit stops around this area (OSM Overpass) so we can tell the
    // user whether these stores are reachable without a car — and flag the
    // fastest route where they're not. Async + best-effort; never blocks stores.
    loadTransit(o);
  }

  async function loadTransit(o) {
    setTransitStops(null);
    setTransitLoading(true);
    try {
      const stops = await fetchTransitNear(o.lat, o.lng, { radius: 4000 });
      setTransitStops(stops);   // array (maybe empty) or null on failure
    } catch {
      setTransitStops(null);
    } finally {
      setTransitLoading(false);
    }
  }

  // Free-text search — a ZIP, a city, or an address, ANYWHERE (not just your own ZIP).
  async function runSearch(q) {
    const clean = String(q || '').trim();
    if (!clean) return;
    setLoading(true);
    const g = await geocodeQuery(clean);
    if (!g) { setError(`Couldn't find "${clean}" — try a ZIP, city, or address.`); setLoading(false); return; }
    await loadAt({ point: { lat: g.lat, lng: g.lng }, postcode: g.postcode || (/^\d{5}$/.test(clean) ? clean : null), state: g.state, label: g.label });
  }

  // "Search this area" — reload stores wherever the map is NOW looking. Reads
  // the LIVE center the user panned/zoomed to (liveCenterRef), not mapCenter
  // state (which only reflects the last place our code moved to, i.e. the ZIP).
  async function searchThisArea() {
    setLoading(true);
    const [lat, lng] = liveCenterRef.current || mapCenter;
    const r = await reverseGeocode(lat, lng);
    // Reflect the new area in the search bar so it stops showing the old ZIP.
    if (r.label || r.postcode) setQuery(r.postcode || r.label);
    await loadAt({ point: { lat, lng }, postcode: r.postcode, state: r.state, label: r.label });
  }

  useEffect(() => { runSearch(query); /* on mount */ /* eslint-disable-next-line */ }, []);

  function submitSearch(e) { e?.preventDefault(); runSearch(query); }

  // Locate a store ON THE MAP: fly to it and pop its marker open.
  function focusStore(s) {
    setMapCenter([s.lat, s.lng]);
    setMapZoom(16);
    const inst = markersRef.current.get(s.id);
    if (inst) setTimeout(() => { try { inst.openPopup(); } catch { /* ignore */ } }, 400);
    mapWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Stores with distance, then type counts, then the active filter.
  const withDist = useMemo(() => stores
    .filter(s => s.lat && s.lng)
    .map(s => ({ ...s, _km: origin ? haversineKm(origin.lat, origin.lng, s.lat, s.lng) : null })),
  [stores, origin]);

  const typeCounts = useMemo(() => {
    const c = {};
    for (const s of withDist) { const t = s.type || 'grocery'; c[t] = (c[t] || 0) + 1; }
    return c;
  }, [withDist]);

  const presentTypes = useMemo(() => TYPE_ORDER.filter(t => typeCounts[t]), [typeCounts]);

  // "All" means "everywhere you can shop for groceries" — the SNAP Restaurant
  // Meals Program (prepared meals at approved restaurants, real CA program)
  // stays real data but only shows up when its own tab is picked, so it
  // doesn't drown out actual grocery/corner/specialty stores by default.
  const allCount = withDist.length - (typeCounts.rmp || 0);
  const filtered = useMemo(() => {
    let list = activeType === 'all'
      ? withDist.filter(s => (s.type || 'grocery') !== 'rmp')
      : withDist.filter(s => (s.type || 'grocery') === activeType);
    if (origin) list = [...list].sort((a, b) => a._km - b._km);
    return list.slice(0, 200);
  }, [withDist, activeType, origin]);

  const activeParkRide = txMetro ? parkAndRideForMetro(txMetro.id) : [];

  // ── Transit awareness ────────────────────────────────────────────────────
  // Is this a car-dependent region? Read from the loaded stores' borough (the
  // app's existing Sun-Belt model) — weighs into the honest area verdict.
  const carDependent = useMemo(() => {
    const b = stores[0]?.borough;
    return b ? isCarDependent(b) : false;
  }, [stores]);

  const transitSummary = useMemo(
    () => summarizeTransit(transitStops, { carDependent }),
    [transitStops, carDependent],
  );

  // Nearest real transit stop for each store shown — measured to the OSM stops
  // we pulled around this area. Keyed by store id for the card + modal.
  const transitByStore = useMemo(() => {
    const map = new Map();
    if (!transitStops || !transitStops.length) return map;
    for (const s of filtered) map.set(s.id, nearestTransit(s.lat, s.lng, transitStops));
    return map;
  }, [filtered, transitStops]);

  // Nearest stop for the store whose detail modal is open (measured fresh — the
  // modal store may be one the carousel wasn't showing).
  const selectedTransit = useMemo(
    () => (selected && transitStops?.length ? nearestTransit(selected.lat, selected.lng, transitStops) : null),
    [selected, transitStops],
  );

  // ── Check-in (organized into the store detail) ──────────────────────────
  function giveCoins(amount) {
    setCoins(c => { const t = c + amount; try { localStorage.setItem('dig_in_coins', String(t)); } catch { /* ignore */ } return t; });
  }
  function awardBadge(id, label, icon) {
    const badges = loadJSON('dig_in_badges', []);
    if (badges.find(b => b.id === id)) return;
    const next = [...badges, { id, label, icon, earnedAt: Date.now() }];
    try { localStorage.setItem('dig_in_badges', JSON.stringify(next)); } catch { /* ignore */ }
    track('badge_earned', { badge_id: id, badge_label: label });
    setToast({ label, icon });
    setTimeout(() => setToast(null), 3000);
  }
  async function checkin(s) {
    setCheckinBusy(s.id);
    const result = await verifyCheckinLocation(s.lat, s.lng);
    setCheckinBusy(null);
    if (!result.ok) {
      setCheckinMsg(checkinRejectionMessage(result, s.name));
      setTimeout(() => setCheckinMsg(null), 4000);
      return;
    }
    const next = { ...checkins, [s.id]: (checkins[s.id] || 0) + 1 };
    setCheckins(next);
    try { localStorage.setItem('dig_in_checkins', JSON.stringify(next)); } catch { /* ignore */ }
    recordCheckin({ id: String(s.id), name: s.name, type: 'store' });
    track('checkin', { store_id: s.id, store_name: s.name, store_type: s.type });

    const uniqueVisited = Object.keys(next).length;
    giveCoins(50);
    if (uniqueVisited >= 1) awardBadge('first-checkin', 'First Check-In', '1ST');
    if (uniqueVisited >= 3) awardBadge('explorer', 'Explorer', 'EXP');
    if (uniqueVisited >= 10) awardBadge('city-crawler', 'City Crawler', 'PRO');
  }

  return (
    <div className="ce-page">
      {!embedded && <Nav />}

      <div className="ce-container">
        <header className="ce-header">
          <h1 className="ce-title">CITY EXPLORER</h1>
          <p className="ce-sub">Every store on the map, wherever you are — organized by type, ranked by how close. Where the food is, not what it costs.</p>
        </header>

        {/* ── ZIP bar ─────────────────────────────────────────────────── */}
        <form className="ce-ziprow" onSubmit={submitSearch}>
          <span className="ce-zip-pin">🔎</span>
          <input
            type="text"
            className="ce-zip-field" value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search a ZIP, city, or address — anywhere you want to look"
            aria-label="Search a place"
          />
          <button type="submit" className="ce-zip-go" disabled={loading}>{loading ? '…' : 'SEARCH'}</button>
          {regionLabel && !loading && <span className="ce-region">{regionLabel}</span>}
        </form>
        {error && <p className="ce-zip-error">{error}</p>}

        {/* ── Store-type filter bar (the real "tabs") ─────────────────── */}
        {presentTypes.length > 0 && (
          <div className="ce-typebar" role="tablist" aria-label="Store types">
            <button
              type="button" role="tab" aria-selected={activeType === 'all'}
              className={`ce-type${activeType === 'all' ? ' active' : ''}`}
              onClick={() => setActiveType('all')}
            >
              All <span className="ce-type-n">{allCount}</span>
            </button>
            {presentTypes.map(t => (
              <button
                key={t} type="button" role="tab" aria-selected={activeType === t}
                className={`ce-type${activeType === t ? ' active' : ''}`}
                onClick={() => setActiveType(t)}
                style={{ '--type-color': STORE_COLORS[t] }}
              >
                <span className="ce-type-dot" />{STORE_TYPE_LABELS[t]} <span className="ce-type-n">{typeCounts[t]}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Map ─────────────────────────────────────────────────────── */}
        <div className="ce-map-wrap" ref={mapWrapRef}>
          <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom className="ce-map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyTo center={mapCenter} zoom={mapZoom} />
            <MapTracker onMove={(c, z) => { liveCenterRef.current = c; liveZoomRef.current = z; }} />
            {filtered.map(s => (
              <Marker
                key={`m-${s.id}`}
                position={[s.lat, s.lng]}
                icon={storeIconFor(s.type || 'grocery')}
                ref={(inst) => { if (inst) markersRef.current.set(s.id, inst); }}
              >
                <Popup>
                  <div style={{ fontFamily: 'sans-serif', minWidth: 150 }}>
                    <strong>{s.name}</strong><br />
                    <span style={{ fontSize: 11, color: STORE_COLORS[s.type] || '#666', fontWeight: 700 }}>
                      {STORE_TYPE_LABELS[s.type] || 'Store'}
                    </span>
                    {s._km != null && <><br /><span style={{ fontSize: 11, color: '#6E8259' }}>{s._km.toFixed(1)} km away</span></>}
                    <br /><button className="ce-pop-btn" onClick={() => setSelected(s)}>Details & check in →</button>
                  </div>
                </Popup>
              </Marker>
            ))}
            {activeParkRide.map(lot => (
              <Marker key={`pr-${lot.id}`} position={[lot.lat, lot.lng]}
                icon={L.divIcon({ className: 'ce-pr-icon', html: '<div class="ce-pr-pin">P</div>', iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -14] })}>
                <Popup><div style={{ fontFamily: 'sans-serif', textAlign: 'center', minWidth: 150 }}><strong>{lot.name}</strong><br /><span style={{ fontSize: 11, color: '#666' }}>{lot.agency} · {lot.servesLine}</span></div></Popup>
              </Marker>
            ))}
          </MapContainer>
          <button type="button" className="ce-search-area" onClick={searchThisArea} disabled={loading}>
            ⟳ Search this area
          </button>
          <div className="ce-map-badge">
            {filtered.length} {activeType === 'all' ? 'STORE' : (STORE_TYPE_LABELS[activeType] || 'STORE').toUpperCase()}{filtered.length !== 1 ? 'S' : ''} SHOWN
          </div>
        </div>

        {/* ── Store carousel — names under the map, 5 at a time ─────────── */}
        <section className="ce-stores">
          <div className="ce-stores-head">
            <h2 className="ce-stores-title">
              {activeType === 'all' ? 'Stores' : STORE_TYPE_LABELS[activeType]} near {regionLabel || 'you'}
            </h2>
            <span className="ce-stores-count">{filtered.length ? `${filtered.length} · closest first` : (loading ? 'loading…' : 'none here')}</span>
          </div>

          {/* Transit awareness — can you get to these stores without a car? */}
          {filtered.length > 0 && (
            <div className={`ce-transit-summary ce-transit-${transitLoading ? 'wait' : transitSummary.tier}`}>
              <span className="ce-transit-summary-ic">
                {transitLoading ? '🚏' : transitSummary.tier === 'good' ? '🚉'
                  : transitSummary.tier === 'unknown' ? '❔' : transitSummary.tier === 'none' ? '🚗' : '🚌'}
              </span>
              <span className="ce-transit-summary-txt">
                {transitLoading ? 'Checking public transit near these stores…' : transitSummary.verdict}
              </span>
            </div>
          )}
          {filtered.length > 0 ? (
            <div className="ce-store-track">
              {filtered.map(s => {
                const tier = walkTier(s._km);
                const visited = checkins[s.id];
                return (
                  <button key={`c-${s.id}`} className="ce-store-card" onClick={() => focusStore(s)}
                    title="Show on the map">

                    <span className="ce-store-type" style={{ '--type-color': STORE_COLORS[s.type] || STORE_COLORS.grocery }}>
                      <span className="ce-type-dot" />{STORE_TYPE_LABELS[s.type] || 'Store'}
                    </span>
                    <span className="ce-store-name">{s.name}</span>
                    {s.address && <span className="ce-store-addr">{s.address}</span>}
                    <span className="ce-store-foot">
                      {tier && <span className={`ce-walk ce-walk-${tier.cls}`}>{tier.icon} {tier.label}</span>}
                      {s._km != null && <span className="ce-store-km">{s._km.toFixed(1)} km</span>}
                    </span>
                    <TransitBadge t={transitByStore.get(s.id)} loading={transitLoading} />
                    {visited ? <span className="ce-store-visited">✓ checked in{visited > 1 ? ` ×${visited}` : ''}</span> : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="ce-stores-empty">{loading ? `Pulling in stores near ${regionLabel}…` : 'No stores of this type here — try “All” or another ZIP.'}</p>
          )}
          <p className="ce-stores-note">
            Ranked by walking distance from your ZIP. Step-level accessibility isn't in the open data yet — we'll add it when it is, rather than guess.
          </p>
        </section>

        {/* ── Park & Ride (Texas bonus) ───────────────────────────────── */}
        {txMetro && activeParkRide.length > 0 && (
          <section className="ce-parkride">
            <div className="ce-parkride-head">
              <h2 className="ce-parkride-title">Park &amp; Ride near {txMetro.name}</h2>
              <p className="ce-parkride-sub">Drop your car at one of these real {txMetro.agency} lots and ride in — no downtown parking.</p>
            </div>
            <div className="ce-parkride-grid">
              {activeParkRide.map(lot => (
                <button className="ce-lot-card" key={lot.id} onClick={() => setMapCenter([lot.lat, lot.lng])}>
                  <div className="ce-lot-top"><span className="ce-lot-name">{lot.name}</span><span className="ce-lot-cost">{lot.cost}</span></div>
                  <div className="ce-lot-city">{lot.city}</div>
                  <div className="ce-lot-line">{lot.agency} · {lot.servesLine}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        <ShoutoutCard placement="city-explorer" />
      </div>

      {/* ── Store detail modal — everything on file + check in ─────────── */}
      {selected && (
        <div className="ce-modal-overlay" onClick={() => setSelected(null)}>
          <div className="ce-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label={selected.name}>
            <button className="ce-modal-x" onClick={() => setSelected(null)} aria-label="Close">✕</button>
            <span className="ce-modal-type" style={{ '--type-color': STORE_COLORS[selected.type] || STORE_COLORS.grocery }}>
              <span className="ce-type-dot" />{STORE_TYPE_LABELS[selected.type] || 'Store'}
            </span>
            <h3 className="ce-modal-name">{selected.name}</h3>
            {selected.address && <p className="ce-modal-addr">{selected.address}</p>}

            <div className="ce-modal-facts">
              {selected._km != null && (() => { const t = walkTier(selected._km); return (
                <div className="ce-fact"><span className="ce-fact-k">Distance</span><span className="ce-fact-v">{t ? `${t.icon} ${t.label} · ` : ''}{selected._km.toFixed(1)} km</span></div>
              ); })()}
              {(selected.acceptsSNAP || selected.acceptsWIC) && (
                <div className="ce-fact"><span className="ce-fact-k">Accepts</span><span className="ce-fact-v">{[selected.acceptsSNAP && 'SNAP/EBT', selected.acceptsWIC && 'WIC'].filter(Boolean).join(' · ')}</span></div>
              )}
              {selected.phone && <div className="ce-fact"><span className="ce-fact-k">Phone</span><span className="ce-fact-v">{selected.phone}</span></div>}
              {selected.hours && <div className="ce-fact"><span className="ce-fact-k">Hours</span><span className="ce-fact-v">{selected.hours}</span></div>}
              {/* Getting there — real nearest transit stop, or an honest "by car." */}
              {selectedTransit && (() => { const m = TRANSIT_MODE[selectedTransit.mode] || TRANSIT_MODE.bus; return (
                <div className="ce-fact"><span className="ce-fact-k">Transit</span><span className="ce-fact-v">
                  {selectedTransit.walkable
                    ? `${m.icon} ${m.label} ${selectedTransit.walkMin} min walk (${selectedTransit.meters} m)${selectedTransit.name ? ` · ${selectedTransit.name}` : ''}`
                    : `🚗 Nearest stop ${(selectedTransit.meters / 1000).toFixed(1)} km — faster by car`}
                </span></div>
              ); })()}
              {checkins[selected.id] && <div className="ce-fact"><span className="ce-fact-k">You</span><span className="ce-fact-v">✓ checked in {checkins[selected.id]}×</span></div>}
            </div>

            <div className="ce-modal-actions">
              <button className="ce-checkin-btn" onClick={() => checkin(selected)} disabled={checkinBusy === selected.id}>
                {checkinBusy === selected.id ? '📍 Confirming location…' : `📍 Check in ${checkins[selected.id] ? 'again' : 'here'} · +50 coins`}
              </button>
            </div>

            {/* Fastest route — driving leads where transit is poor (no walkable
                stop), transit leads where you can realistically ride. Both real
                Google Maps directions, so you can compare either way. */}
            {(selected.lat && selected.lng) && (() => {
              const r = routeLinks(selected);
              const carFirst = !selectedTransit || !selectedTransit.walkable;
              return (
                <div className="ce-routes">
                  <span className="ce-routes-label">{carFirst ? 'Fastest route' : 'Get there'}</span>
                  <div className="ce-routes-links">
                    {carFirst ? (
                      <>
                        <a className="ce-route ce-route-primary" href={r.drive} target="_blank" rel="noreferrer">🚗 Drive (fastest)</a>
                        <a className="ce-route" href={r.transit} target="_blank" rel="noreferrer">🚌 Transit</a>
                      </>
                    ) : (
                      <>
                        <a className="ce-route ce-route-primary" href={r.transit} target="_blank" rel="noreferrer">🚉 Transit</a>
                        <a className="ce-route" href={r.walk} target="_blank" rel="noreferrer">🚶 Walk</a>
                        <a className="ce-route" href={r.drive} target="_blank" rel="noreferrer">🚗 Drive</a>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
            {checkinMsg && <p className="ce-checkin-msg">{checkinMsg}</p>}
          </div>
        </div>
      )}

      {/* Badge toast */}
      {toast && (
        <div className="ce-toast"><span className="ce-toast-icon">{toast.icon}</span> Badge earned: <b>{toast.label}</b></div>
      )}
    </div>
  );
}
