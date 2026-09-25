import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../lib/leafletSetup'; // marker-icon fix — must run before any Marker mounts
import { NYC_STORES, STORE_COLORS, STORE_TYPE_LABELS } from '../../data/storeData';
import { haversineKm } from '../../services/geoService';
import { buildStorePopupHTML, wireStorePopupButtons } from '../../lib/storePopup';

/* StoreMiniMap — a small, imperative Leaflet map of nearby grocery stores.
   Reused for the Food Map on the recipe page and inside the slip card.

   The map instance mounts once; a second effect below reacts to `stores`,
   `highlight`, `center` and `zoom` changing and updates markers/view in
   place (pan/fly, not remount) so callers can swap which single store is
   plotted — e.g. on hover — without the map flickering.

   Callers are expected to pass a small, already-paged/filtered `stores` list
   (the recipe page's Food Map paginates to ~30 at a time) rather than a
   whole city's worth of points — this component always draws every store
   it's given, with no internal capping.

   Two opt-in flags (off by default so existing small, curated-list callers
   like RecipeSlipCard are unchanged):
     - `zoomable` turns on real zoom (wheel/pinch/controls) instead of the
       fixed-zoom preview.
     - `richPopups` swaps the plain name-only popup for one with hours/open
       status, a Directions button, and a GPS-verified Check In button. */

const DEFAULT_STORES = NYC_STORES;
const COLORS = STORE_COLORS;

// `state` lets a caller keep every store plotted but visually call one out —
// e.g. hovering a row in a ledger list: the rest stay put and dim slightly,
// the hovered one grows and rings so it reads as "this one" on the map.
// One-letter pin glyph per store type (falls back to G for anything unknown).
const TYPE_LETTER = {
  grocery: 'G', corner_store: 'C', bodega: 'B', deli: 'D', specialty: 'S',
  asian: 'A', african: 'F', middle_eastern: 'M', latino: 'L',
};
function storeIcon(type, state = 'normal') {
  const color = COLORS[type] || COLORS.grocery;
  const letter = TYPE_LETTER[type] || 'G';
  const active = state === 'active';
  const size = active ? 26 : 18;
  const opacity = state === 'dim' ? 0.45 : 1;
  const shadow = active ? '0 0 0 4px rgba(255,205,60,.65), 2px 2px 0 #33302A' : '2px 2px 0 #33302A';
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2.5px solid #33302A;box-shadow:${shadow};display:flex;align-items:center;justify-content:center;font-family:'Press Start 2P',monospace;font-size:${active ? 9 : 7}px;color:#33302A;opacity:${opacity}">${letter}</div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}

function loadUserCenter() {
  try {
    const u = JSON.parse(localStorage.getItem('userLocation') || 'null');
    if (u?.lat) return { lat: u.lat, lng: u.lng };
  } catch {}
  return null;
}

// Plain min/max over lat/lng, so fitting bounds doesn't depend on markers
// already being drawn.
function boundsOf(list) {
  if (!list.length) return null;
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const s of list) {
    if (s.lat < minLat) minLat = s.lat;
    if (s.lat > maxLat) maxLat = s.lat;
    if (s.lng < minLng) minLng = s.lng;
    if (s.lng > maxLng) maxLng = s.lng;
  }
  return L.latLngBounds([minLat, minLng], [maxLat, maxLng]);
}

export default function StoreMiniMap({
  stores = DEFAULT_STORES, height = 200, interactive = true,
  highlight = null, center = null, zoom = 13,
  zoomable = false, richPopups = false, checkins = {}, onCheckin = null, onOpenMemory = null,
  areaStores = null,
}) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerGroupRef = useRef(null);
  const boundsLayerRef = useRef(null); // the dashed "this is your area" border rectangle
  const firstMoveRef = useRef(true);
  const propsRef = useRef();
  propsRef.current = { stores, highlight, center, zoom, richPopups, checkins, onCheckin, onOpenMemory, areaStores };

  function move(pos, zm) {
    const map = mapRef.current;
    if (!map) return;
    if (firstMoveRef.current) map.setView(pos, zm);
    else map.flyTo(pos, zm, { duration: 0.4 });
    firstMoveRef.current = false;
  }

  // Pans/zooms to the highlighted store. Called only when a highlight is
  // gained (or changes to a different store) — never on losing one, so
  // un-hovering a ledger row doesn't yank the map back out to the wide view.
  function panToHighlight() {
    const { highlight: h } = propsRef.current;
    if (h) move([h.lat, h.lng], 15);
  }

  // The "nothing hovered" resting view — fit everyone, or the given
  // center/zoom. Only called when the candidate store list or explicit
  // center/zoom target actually changes, not merely when a hover ends, so
  // the map stays put (still showing whatever was last highlighted) instead
  // of resetting every time the mouse leaves a row.
  function applyDefaultView() {
    const map = mapRef.current;
    if (!map) return;
    const { stores: s, highlight: h, center: c, zoom: z } = propsRef.current;
    if (h) return; // something's actively highlighted — leave the view alone
    if (s.length === 1) move([s[0].lat, s[0].lng], 15);
    else if (s.length > 1) {
      try { map.fitBounds(boundsOf(s).pad(0.15)); firstMoveRef.current = false; } catch {}
    } else if (c) move(c, z);
  }

  // Repaint markers for the current `stores` list (dimming everyone but the
  // highlighted one, when there is one).
  function redraw() {
    const layerGroup = layerGroupRef.current;
    if (!mapRef.current || !layerGroup) return;
    const { stores: list, highlight: h, richPopups: rich, checkins: ck, onCheckin: cb, onOpenMemory: mem } = propsRef.current;

    layerGroup.clearLayers();
    const user = loadUserCenter();

    list.forEach(s => {
      const isActive = !!h && h.id === s.id;
      const state = isActive ? 'active' : h ? 'dim' : 'normal';
      const marker = L.marker([s.lat, s.lng], { icon: storeIcon(s.type, state), zIndexOffset: isActive ? 1000 : 0 })
        .addTo(layerGroup);

      if (rich) {
        let distLabel = null;
        if (user) {
          const km = haversineKm(user.lat, user.lng, s.lat, s.lng);
          distLabel = km < 1 ? `${Math.round(km * 1000)}m away` : `${km.toFixed(1)}km away`;
        }
        marker.bindPopup(
          buildStorePopupHTML({
            store: s,
            color: COLORS[s.type] || COLORS.grocery,
            label: STORE_TYPE_LABELS[s.type] || 'Store',
            distLabel,
            visitCount: ck[s.id] || 0,
          }),
          { maxWidth: 260, minWidth: 210, className: 'fm-leaflet-popup', autoPanPadding: [16, 16] }
        );
        wireStorePopupButtons(marker, s, { onCheckin: cb, onOpenMemory: mem });
      } else {
        marker.bindPopup(`<b>${s.name}</b>`);
      }
      if (isActive) marker.openPopup();
    });
  }

  // Draws a dashed rectangle around the real lat/lng extent of the current
  // area's full store set (not just the paginated page shown as pins) — a
  // visible, data-derived answer to "what am I looking at right now," so
  // switching states/ZIPs reads as a bounded region, not an unbounded pin
  // cluster with no context. Skipped entirely when the caller passes no
  // areaStores (e.g. the "All Areas" view, where a single box around the
  // whole country wouldn't mean anything).
  function redrawBounds() {
    const map = mapRef.current;
    if (!map) return;
    if (boundsLayerRef.current) { map.removeLayer(boundsLayerRef.current); boundsLayerRef.current = null; }
    const { areaStores: list } = propsRef.current;
    if (!list?.length) return;
    const bounds = boundsOf(list);
    if (!bounds) return;
    boundsLayerRef.current = L.rectangle(bounds, {
      color: '#6E8259', weight: 2, dashArray: '6, 6', fill: false, interactive: false,
    }).addTo(map);
  }

  // Mount the map once.
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const user = loadUserCenter();
    const { stores: s, highlight: h, center: c, zoom: z } = propsRef.current;
    const initial = h ? [h.lat, h.lng]
      : c || (user ? [user.lat, user.lng] : s[0] ? [s[0].lat, s[0].lng] : [40.7128, -74.006]);

    const map = L.map(elRef.current, {
      zoomControl: zoomable,
      attributionControl: false,
      scrollWheelZoom: zoomable,
      dragging: interactive,
      doubleClickZoom: zoomable || interactive,
      minZoom: zoomable ? 9 : 0,
      maxZoom: 19,
    }).setView(initial, h ? 15 : z);
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map);

    if (user) {
      L.circleMarker([user.lat, user.lng], { radius: 6, color: '#1a73e8', fillColor: '#4d9fff', fillOpacity: 1, weight: 2 })
        .addTo(map).bindPopup('<b>You</b>');
    }

    layerGroupRef.current = L.featureGroup().addTo(map);
    firstMoveRef.current = false; // initial setView above already placed it

    // Container often hasn't settled its real size yet on first paint (flex/grid
    // cells resize after mount) — invalidate once it has, then re-fit + redraw.
    const t = setTimeout(() => {
      map.invalidateSize();
      redraw();
      redrawBounds();
      if (propsRef.current.highlight) panToHighlight(); else applyDefaultView();
    }, 150);
    return () => { clearTimeout(t); map.remove(); mapRef.current = null; layerGroupRef.current = null; boundsLayerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw the area border whenever the caller hands us a different area's
  // full store set (a real, infrequent event — switching ZIP/state), not on
  // every render or hover.
  useEffect(() => {
    if (!mapRef.current) return;
    redrawBounds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaStores]);

  // React to store/highlight/mode changes without tearing the map down.
  // Memoized on the `stores` reference so a stable (memoized) array from the
  // caller doesn't re-stringify every id on every render — e.g. every hover —
  // when the list itself hasn't actually changed.
  const storeKey = useMemo(() => stores.map(s => s.id).join(','), [stores]);
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return;
    redraw();
    if (highlight) panToHighlight();
    // Deliberately NOT calling applyDefaultView() here when highlight is
    // null — see applyDefaultView's own effect below for why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeKey, highlight?.id, richPopups]);

  // The resting/default view only resets when the underlying candidate list
  // or an explicit center/zoom target changes (new page, new borough) — not
  // just because a hover ended, which is what used to make the map zoom
  // back out every time the mouse left a row.
  useEffect(() => {
    if (!mapRef.current) return;
    applyDefaultView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeKey, center && center[0], center && center[1], zoom]);

  return <div ref={elRef} className="store-mini-map" style={{ width: '100%', height }} />;
}
