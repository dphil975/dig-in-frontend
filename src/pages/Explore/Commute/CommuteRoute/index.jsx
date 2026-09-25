import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../../../lib/leafletSetup'; // marker-icon fix — must run before any Marker mounts
import Nav from '../../../../components/shell/Nav';
import { getCurrentPosition, hasGeolocation } from '../../../../lib/native';
import { geocodeAddress } from '../../../../services/geoService';
import { NYC_STORES } from '../../../../data/storeData';
import { planGroceryRoute } from '../../../../lib/commutePlanner';
import { groupByCategory } from '../../../../lib/groceryCategories';
import { track } from '../../../../lib/analytics';
import { fetchTransitRoutesNear, directionArrows } from '../../../../lib/transitAccess';
import '../../../Home/Home.css';
import './CommuteRoute.css';

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Rail-family OSM route= values render under "Subway / Rail Lines"; bus is
// its own group. Separate icon set from transitAccess's TRANSIT_MODE — that
// one classifies STOPS (bus/rail/tram/subway); this classifies real route
// relations, which use OSM's own finer route= vocabulary (light_rail, train,
// monorail are each their own tag, not folded into a generic "rail").
const RAIL_MODES = new Set(['subway', 'light_rail', 'train', 'monorail']);
const ROUTE_MODE_ICON = {
  subway: '🚇', light_rail: '🚈', tram: '🚊', train: '🚆', monorail: '🚝', bus: '🚌',
};
const modeIcon = (mode) => ROUTE_MODE_ICON[mode] || ROUTE_MODE_ICON.bus;

const NYC = { lat: 40.7128, lng: -74.006 };
const parseItems = (s) => (s || '').split(',').map(x => x.trim()).filter(Boolean);

// Numbered, tier-colored stop marker with small SNAP/WIC corner badges —
// same visual language as the Food Map's own store pins (STORE_COLORS /
// the "$" deal badge), just extended with the route's stop number + tier.
function buildStopIcon(stop) {
  const s = stop.store;
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:34px;height:42px">
      <div style="width:34px;height:34px;background:${stop.tierColor};border:3px solid #33302A;border-radius:8px;box-shadow:2px 2px 0 #33302A;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1">
        <span style="font-family:'Press Start 2P',monospace;font-size:11px;color:#33302A">${stop.n}</span>
        <span style="font-family:'Press Start 2P',monospace;font-size:6px;color:#33302A;margin-top:2px">${stop.tier}</span>
      </div>
      <div style="width:4px;height:8px;background:#33302A;margin:0 auto"></div>
      ${s.acceptsSNAP ? `<div style="position:absolute;top:-6px;left:-6px;width:15px;height:15px;background:#4A7C59;border:2px solid #33302A;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:6px;font-family:'Press Start 2P',monospace;color:#fff">S</div>` : ''}
      ${s.acceptsWIC ? `<div style="position:absolute;top:-6px;right:-6px;width:15px;height:15px;background:#6E8259;border:2px solid #33302A;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:6px;font-family:'Press Start 2P',monospace;color:#fff">W</div>` : ''}
    </div>`,
    iconSize: [34, 42], iconAnchor: [17, 42], popupAnchor: [0, -42],
  });
}

function stopPopupHTML(stop) {
  const s = stop.store;
  const benefits = [s.acceptsSNAP && 'SNAP/EBT', s.acceptsWIC && 'WIC'].filter(Boolean);
  return `
    <div class="cr-pop">
      <div class="cr-pop-name">STOP ${stop.n} · ${esc(stop.tierLabel)}</div>
      <div class="cr-pop-name" style="font-size:13px;margin-top:2px">${esc(s.name)}</div>
      ${s.address ? `<div class="cr-pop-addr">${esc(s.address)}</div>` : ''}
      <div class="cr-pop-deal">
        <div class="cr-pop-item"><div class="cr-pop-item-name">Est. cost</div><div class="cr-pop-stock in">${stop.distKm.toFixed(1)} km away</div></div>
        <span class="cr-pop-price">$${stop.estCost.toFixed(2)}</span>
      </div>
      ${benefits.length ? `<div class="cr-pop-addr" style="margin-top:8px">Accepts ${esc(benefits.join(' + '))}</div>` : ''}
    </div>`;
}

export default function CommuteRoute({ embedded = false } = {}) {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const originMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  // Real transit LINES drawn on the SAME map as the grocery route — a
  // separate layer group from the grocery-plan refs above so toggling a
  // subway/bus line on and off never touches the store markers/route line,
  // and vice versa. Keyed by route id so each drawn line + its direction
  // arrows can be removed individually.
  const transitLayerRef = useRef({});

  const initialList = (() => {
    try { return JSON.parse(localStorage.getItem('dig_in_shopping_list') || '[]'); } catch { return []; }
  })();

  const [zip, setZip]           = useState(() => { try { return localStorage.getItem('dig_in_zip') || ''; } catch { return ''; } });
  const [product, setProduct]   = useState(initialList.join(', '));
  const [budget, setBudget]     = useState(40);
  const [snapOnly, setSnapOnly] = useState(false);
  const [wicOnly, setWicOnly]   = useState(false);
  const [origin, setOrigin]     = useState(null);
  const [plan, setPlan]         = useState(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [msg, setMsg]           = useState('');
  // Real subway/light-rail/tram/train/bus LINES near the current origin —
  // fetched live from OpenStreetMap (transitAccess.js), not hardcoded to any
  // one city. null = still loading / failed to load; [] = loaded, none here.
  const [transitRoutes, setTransitRoutes]   = useState(null);
  const [transitLoading, setTransitLoading] = useState(false);
  const [selectedRoutes, setSelectedRoutes] = useState(() => new Set());

  // Build a route from NYC_STORES — the exact same 27 real, plotted stores
  // shown on the Food Map — instead of inventing fake ones around the ZIP.
  function buildPlan(org, snap = snapOnly, wic = wicOnly, budgetVal = budget) {
    const items = parseItems(product);
    return planGroceryRoute({
      stores: NYC_STORES, start: org, budget: Number(budgetVal) || 40,
      ingredients: items, transit: true, snapOnly: snap, wicOnly: wic,
    });
  }

  function trackPlan(result, extra) {
    track('commute_planned', {
      stops: result.stops.length, budget, items: parseItems(product).length,
      snapOnly, wicOnly, totalCost: result.totalCost, withinBudget: result.withinBudget,
      ...extra,
    });
  }

  // ── Run a ZIP + product search ───────────────────────────────────
  async function runSearch(e) {
    e?.preventDefault();
    setSearching(true);
    setSearched(true);

    let org = origin;
    const z = zip.trim();
    if (z) {
      try {
        const coords = await geocodeAddress(/^\d{5}$/.test(z) ? `${z}, USA` : z);
        if (coords) { org = coords; setMsg(`Showing your route near ${z}`); }
        else { setMsg(`Couldn't find ZIP ${z} — showing your last area`); }
      } catch { setMsg('Lookup failed — showing your last area'); }
      try { localStorage.setItem('dig_in_zip', z); } catch {}
    }
    if (!org) org = NYC;

    const result = buildPlan(org);
    if (!result.stops.length) {
      setMsg(`No ${snapOnly || wicOnly ? 'SNAP/WIC-eligible ' : ''}stores found near ${z || 'you'} — try another ZIP or clear the filters.`);
    } else if (!z) {
      setMsg(`${result.stops.length}-stop route planned`);
    }

    setOrigin(org);
    setPlan(result);
    setSearching(false);
    trackPlan(result, { source: 'search' });
  }

  // First load: geocode the saved ZIP, or geolocate, else default to NYC.
  useEffect(() => {
    let alive = true;
    (async () => {
      const z = zip.trim();
      if (z) { runSearch(); return; }
      if (hasGeolocation()) {
        getCurrentPosition({ enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }).then(async ({ lat, lng }) => {
          if (!alive) return;
          const org = { lat, lng };
          // reverse-geocode to fill the ZIP box (keyless)
          try {
            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${org.lat}&lon=${org.lng}&zoom=18`, { headers: { Accept: 'application/json' } });
            const j = await r.json();
            if (alive && j?.address?.postcode) { setZip(j.address.postcode); try { localStorage.setItem('dig_in_zip', j.address.postcode); } catch {} }
          } catch {}
          const result = buildPlan(org);
          setOrigin(org);
          setPlan(result);
          setSearched(true);
          setMsg(result.stops.length ? `${result.stops.length}-stop route near you` : 'No stores found nearby yet');
          trackPlan(result, { source: 'geolocation' });
        }).catch(() => {
          if (!alive) return;
          const result = buildPlan(NYC);
          setOrigin(NYC); setPlan(result); setSearched(true);
        });
      } else {
        const result = buildPlan(NYC);
        setOrigin(NYC); setPlan(result); setSearched(true);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-run whenever the SNAP/WIC filters change (once a route already exists).
  useEffect(() => {
    if (!origin) return;
    const result = buildPlan(origin);
    setPlan(result);
    trackPlan(result, { source: 'filter_toggle' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapOnly, wicOnly]);

  function focusStore(store) {
    const map = mapInstance.current;
    if (!map) return;
    map.setView([store.lat, store.lng], 15, { animate: true });
    markersRef.current[store.id]?.openPopup();
    track('commute_stop_clicked', { store_id: store.id, store_name: store.name });
  }

  // Create the map once.
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, { scrollWheelZoom: true, zoomControl: false }).setView([NYC.lat, NYC.lng], 13);
    L.control.zoom({ position: 'bottomright' }).addTo(map); // top-left is where the stop-count pill lives
    mapInstance.current = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map);
    const t = setTimeout(() => map.invalidateSize(), 120);
    return () => { clearTimeout(t); map.remove(); mapInstance.current = null; markersRef.current = {}; originMarkerRef.current = null; routeLineRef.current = null; transitLayerRef.current = {}; };
  }, []);

  // Re-draw the route (origin dot + numbered stops + connecting line)
  // whenever the plan or origin changes.
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    Object.values(markersRef.current).forEach(m => map.removeLayer(m));
    markersRef.current = {};
    if (originMarkerRef.current) { map.removeLayer(originMarkerRef.current); originMarkerRef.current = null; }
    if (routeLineRef.current) { map.removeLayer(routeLineRef.current); routeLineRef.current = null; }
    if (!origin) return;

    const layers = [];
    originMarkerRef.current = L.circleMarker([origin.lat, origin.lng], {
      radius: 8, color: '#1a73e8', fillColor: '#4d9fff', fillOpacity: 1, weight: 3,
    }).addTo(map).bindPopup('<b>Start — you are here</b>');
    layers.push(originMarkerRef.current);

    const linePts = [[origin.lat, origin.lng]];
    (plan?.stops || []).forEach(stop => {
      const s = stop.store;
      linePts.push([s.lat, s.lng]);
      const m = L.marker([s.lat, s.lng], { icon: buildStopIcon(stop) })
        .addTo(map)
        .bindPopup(stopPopupHTML(stop), { maxWidth: 280, className: 'dig-popup' });
      markersRef.current[s.id] = m;
      layers.push(m);
    });

    if (plan?.stops?.length) {
      routeLineRef.current = L.polyline(linePts, { color: '#6E8259', weight: 4, opacity: 0.85, dashArray: '2 8' }).addTo(map);
      layers.push(routeLineRef.current);
    }

    if (layers.length > 1) map.fitBounds(L.featureGroup(layers).getBounds().pad(0.25));
    else map.setView([origin.lat, origin.lng], 14);
  }, [plan, origin]);

  // Real transit lines near wherever the grocery route is centered — fetched
  // fresh each time origin moves, so this is genuinely region-agnostic (NYC,
  // Chicago, a small town, anywhere OSM has route relations mapped) instead
  // of a fixed city's hardcoded list. Clears the prior selection too: a line
  // id from the old area has no meaning once we've moved.
  useEffect(() => {
    if (!origin) return;
    let alive = true;
    setTransitLoading(true);
    setTransitRoutes(null);
    setSelectedRoutes(new Set());
    fetchTransitRoutesNear(origin.lat, origin.lng, { radius: 2500 }).then((routes) => {
      if (!alive) return;
      setTransitRoutes(routes);
      setTransitLoading(false);
    });
    return () => { alive = false; };
  }, [origin]);

  function toggleRoute(routeId) {
    setSelectedRoutes((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) next.delete(routeId);
      else next.add(routeId);
      return next;
    });
    track('commute_transit_line_toggled', { route_id: routeId });
  }

  // Draw/remove selected transit lines on the SAME map the grocery route and
  // store stops already live on — this is the "blend together" part: one
  // map, one shared visual language, not a separate view. Direction arrows
  // are small triangles rotated to each line's real travel bearing
  // (transitAccess's directionArrows(), built off the route's own ordered
  // geometry) so a color alone isn't the only way the direction reads.
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !transitRoutes) return;

    // Remove anything no longer selected.
    for (const [id, layers] of Object.entries(transitLayerRef.current)) {
      if (!selectedRoutes.has(Number(id))) {
        layers.forEach((l) => map.removeLayer(l));
        delete transitLayerRef.current[id];
      }
    }

    // Add anything newly selected.
    selectedRoutes.forEach((id) => {
      if (transitLayerRef.current[id]) return; // already drawn
      const route = transitRoutes.find((r) => r.id === id);
      if (!route) return;

      const layers = [];
      const line = L.polyline(route.path, { color: route.color, weight: 5, opacity: 0.85 })
        .addTo(map)
        .bindPopup(
          `<div class="cr-pop">
             <div class="cr-pop-name">${modeIcon(route.mode)} ${esc(route.ref)}</div>
             <div class="cr-pop-addr">${esc(route.name)}</div>
             <div class="cr-pop-addr" style="margin-top:6px">
               ${route.colorSource === 'osm' ? 'Color from OpenStreetMap' : 'Default color — not tagged in OpenStreetMap'}
             </div>
           </div>`,
          { className: 'dig-popup' }
        );
      layers.push(line);

      directionArrows(route.path, 4).forEach((a) => {
        const arrowIcon = L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;transform:rotate(${a.bearing}deg);color:${route.color};font-size:14px;line-height:14px;text-shadow:0 0 2px #fff, 0 0 2px #fff">▲</div>`,
          iconSize: [14, 14], iconAnchor: [7, 7],
        });
        layers.push(L.marker([a.lat, a.lng], { icon: arrowIcon, interactive: false }).addTo(map));
      });

      transitLayerRef.current[id] = layers;
    });
  }, [selectedRoutes, transitRoutes]);

  const items = parseItems(product);
  const stops = plan?.stops || [];
  // Organized like a real grocery list — produce/meat/dairy first (the
  // perimeter of a real store), pantry/spices/beverages after — instead of
  // one flat row of chips. See lib/groceryCategories.js.
  const categorizedItems = groupByCategory(items);

  return (
    <div>
      {!embedded && <Nav />}
      <div className={`cr-page${embedded ? ' cr-embedded' : ''}`}>
        {/* ── Left panel ──────────────────────────────────────────── */}
        <div className="cr-card">
          <div className="cr-header">
            <div className="cr-header-row">
              <div>
                <h1 className="cr-title">Grocery Commute</h1>
                <p className="cr-subtitle">Enter your ZIP and what you need — we'll route a real trip</p>
              </div>
              {/* In the hub the SideRail is the way back — no full-page close X. */}
              {!embedded && <button className="cr-close-btn" aria-label="Close" onClick={() => navigate('/')}><X size={24} strokeWidth={3} /></button>}
            </div>
          </div>

          <div className="cr-content">
            {/* ── ZIP + product + budget search ─────────────────────── */}
            <form className="cr-search" onSubmit={runSearch}>
              <label className="cr-field-label">WHAT ARE YOU LOOKING FOR?</label>
              <input
                type="text"
                className="cr-zip-input"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="e.g. eggs, oat milk, fresh basil"
                aria-label="Product"
              />
              <label className="cr-field-label" style={{ marginTop: 10 }}>YOUR ZIP CODE</label>
              <div className="cr-zip-row">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  className="cr-zip-input"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="e.g. 11201"
                  aria-label="ZIP code"
                />
                <button type="submit" className="cr-find-btn" disabled={searching}>
                  {searching ? '…' : 'PLAN ROUTE'}
                </button>
              </div>

              <label className="cr-field-label" style={{ marginTop: 10 }}>BUDGET</label>
              <div className="cr-zip-row">
                <span className="cr-budget-dollar">$</span>
                <input
                  type="number" min="5" step="5"
                  className="cr-zip-input" style={{ flex: 1 }}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  aria-label="Budget"
                />
              </div>

              <div className="cr-filter-row">
                <label className={`cr-filter-toggle${snapOnly ? ' on' : ''}`}>
                  <input type="checkbox" checked={snapOnly} onChange={e => setSnapOnly(e.target.checked)} />
                  SNAP/EBT stores only
                </label>
                <label className={`cr-filter-toggle${wicOnly ? ' on' : ''}`}>
                  <input type="checkbox" checked={wicOnly} onChange={e => setWicOnly(e.target.checked)} />
                  WIC stores only
                </label>
              </div>

              {msg && <p className="cr-hint">{msg}</p>}
            </form>

            {/* ── Route breakdown ───────────────────────────────────── */}
            <section className="cr-results">
              <h3 className="cr-section-title">
                {stops.length ? `${stops.length}-stop route` : 'No route yet'}
              </h3>

              {categorizedItems.length > 0 && (
                <div className="cr-categories">
                  <div className="cr-categories-label">YOUR GROCERY LIST · {items.length} ITEM{items.length !== 1 ? 'S' : ''}</div>
                  {categorizedItems.map(group => (
                    <div className="cr-cat-group" key={group.id}>
                      <div className="cr-cat-label">{group.label.toUpperCase()} <span className="cr-cat-count">{group.items.length}</span></div>
                      <div className="cr-item-chips">
                        {group.items.map((it, i) => <span key={i} className="cr-item-chip">{it}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {stops.length > 0 && (
                <div className={`cr-budget-banner${plan.withinBudget ? '' : ' over'}`}>
                  {plan.withinBudget
                    ? `Est. total $${plan.totalCost.toFixed(2)} — within your $${Number(budget) || 40} budget`
                    : `Est. total $${plan.totalCost.toFixed(2)} — $${plan.overBy.toFixed(2)} over your $${Number(budget) || 40} budget`}
                </div>
              )}

              <div className="cr-result-list">
                {stops.length ? stops.map(stop => {
                  const s = stop.store;
                  return (
                    <button key={s.id} className="cr-result-card" onClick={() => focusStore(s)}>
                      <div className="cr-result-top">
                        <span className="cr-result-name">STOP {stop.n} · {s.name}</span>
                        <span className="cr-result-walk" style={{ background: stop.tierColor }}>{stop.tierLabel}</span>
                      </div>
                      <div className="cr-result-addr">{s.address} · {stop.distKm.toFixed(1)} km · est. ${stop.estCost.toFixed(2)}</div>
                      {(s.acceptsSNAP || s.acceptsWIC) && (
                        <div className="cr-result-items">
                          {s.acceptsSNAP && <span className="cr-snap-badge">SNAP/EBT</span>}
                          {s.acceptsWIC && <span className="cr-wic-badge">WIC</span>}
                        </div>
                      )}
                    </button>
                  );
                }) : (
                  <p className="cr-hint">
                    {searched ? 'No matching stores — try a different ZIP, budget, or clear the SNAP/WIC filters.' : 'Enter a ZIP, then tap Plan Route.'}
                  </p>
                )}
              </div>
            </section>

            {/* Real transit lines near this route — fetched live from
                OpenStreetMap (transitAccess.js), so this works for any
                region the grocery route is centered on, not just NYC.
                Tap a line to draw its real path + direction arrows on the
                map above, in its real (or honestly-defaulted) color. */}
            {(() => {
              const rail = (transitRoutes || []).filter(r => RAIL_MODES.has(r.mode));
              const bus  = (transitRoutes || []).filter(r => r.mode === 'bus');
              const renderGroup = (routes, emptyText) => {
                if (transitLoading) return <p className="cr-hint">Loading real transit lines near you…</p>;
                if (transitRoutes === null) return <p className="cr-hint">Couldn't load transit lines right now.</p>;
                if (!routes.length) return <p className="cr-hint">{emptyText}</p>;
                return (
                  <div className="cr-transit-grid">
                    {routes.map(route => (
                      <button
                        key={route.id}
                        type="button"
                        className={`cr-transit-btn${selectedRoutes.has(route.id) ? ' active' : ''}${route.colorSource === 'default' ? ' cr-transit-default-color' : ''}`}
                        style={{ backgroundColor: route.color }}
                        title={`${route.name}${route.colorSource === 'default' ? ' (default color — not tagged in OpenStreetMap)' : ''}`}
                        aria-pressed={selectedRoutes.has(route.id)}
                        onClick={() => toggleRoute(route.id)}
                      >
                        {modeIcon(route.mode)} {route.ref}
                      </button>
                    ))}
                  </div>
                );
              };
              return (
                <>
                  <section>
                    <h3 className="cr-section-title">Subway / Rail Lines</h3>
                    {renderGroup(rail, 'No subway/rail lines mapped near here yet.')}
                  </section>
                  <section>
                    <h3 className="cr-section-title">Bus Routes</h3>
                    {renderGroup(bus, 'No bus routes mapped near here yet.')}
                  </section>
                </>
              );
            })()}
          </div>
        </div>

        {/* ── Map panel ───────────────────────────────────────────── */}
        <div className="cr-map-panel">
          <div ref={mapRef} className="cr-map" />
          <div className="cr-map-count">
            {stops.length ? `${stops.length} stop${stops.length !== 1 ? 's' : ''} on this route` : 'No route yet'}
          </div>
        </div>
      </div>
    </div>
  );
}
