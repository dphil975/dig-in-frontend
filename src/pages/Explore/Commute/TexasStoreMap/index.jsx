import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Navigation } from 'lucide-react';
import Nav from '../../../../components/shell/Nav';
import TexasRegionSelector from './TexasRegionSelector';
import { TEXAS_REGIONS } from './texasRegions';
import { STORE_TYPE_LABELS } from '../../../../data/storeData';
import 'leaflet/dist/leaflet.css';
import '../../../../lib/leafletSetup'; // marker-icon fix — must run before any Marker mounts

/* TexasStoreMap — real Texas store data (public/stores-tx.json, the same
   ~3,065-store OSM dataset FoodMap uses for the "texas" region), filtered to
   whichever of the 5 metro regions is picked. Previously rendered 3
   hardcoded fake stores ("Dollar General", "H Mart"...) as a placeholder —
   swapped for the real dataset so this doesn't show invented store names as
   if they were real, matching the rest of the app's "no fabricated data"
   rule. */

function haversineMi(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- 1. HELPER COMPONENT FOR MAP FLYING ---
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom);
  }, [center, map, zoom]);
  return null;
}

// --- 2. THE TEXAS STORE MAP APP ---
export default function TexasStoreMap() {
  const [currentRegion, setCurrentRegion] = useState('North Texas (DFW)');
  const [mapCenter, setMapCenter] = useState(TEXAS_REGIONS['North Texas (DFW)']);
  const [allStores, setAllStores] = useState(null); // null = not loaded yet
  const [stores, setStores] = useState([]);
  const loadedRef = useRef(false);

  // Load the real Texas dataset once, then reuse it for every region switch.
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    fetch('/stores-tx.json')
      .then((res) => res.json())
      .then((data) => setAllStores(data.stores || []))
      .catch(() => setAllStores([]));
  }, []);

  useEffect(() => {
    const center = TEXAS_REGIONS[currentRegion];
    setMapCenter(center);
    if (!allStores) return;
    const [lat, lng] = center;
    const nearby = allStores
      .map((s) => ({ ...s, dist: haversineMi(lat, lng, s.lat, s.lng) }))
      .filter((s) => s.dist <= 20)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 25);
    setStores(nearby);
  }, [currentRegion, allStores]);

  return (
    <div className="min-h-screen bg-[#F3EADA] p-4 font-sans">
      <Nav />

      {/* Region Selector */}
      <TexasRegionSelector onRegionSelect={setCurrentRegion} />

      {/* The Map */}
      <div className="w-full h-[600px] border-[6px] border-[#33302A] shadow-[8px_8px_0px_rgba(0,0,0,0.3)] relative bg-white overflow-hidden">
        <MapContainer center={mapCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={mapCenter} zoom={10} />

          {/* Render real Texas stores near the selected region */}
          {stores.map((store) => (
            <Marker key={store.id} position={[store.lat, store.lng]}>
              <Popup>
                <div className="font-mono text-[#33302A] p-2">
                  <div className="font-bold">{store.name}</div>
                  <div className="text-[10px] text-gray-500">{STORE_TYPE_LABELS[store.type] || store.type}</div>
                  <div className="text-xs text-gray-500">{store.address}</div>
                  <div className="text-xs mt-1 flex items-center gap-1">
                    <Navigation size={12} /> {store.dist < 1 ? `${(store.dist * 5280).toFixed(0)} ft` : `${store.dist.toFixed(1)} mi`}
                  </div>
                  <button
                    type="button"
                    className="mt-2 w-full bg-[#33302A] text-white text-xs py-1 border border-[#555] shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
                    onClick={() => window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`,
                      '_blank', 'noopener'
                    )}
                  >
                    Get Directions
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Data Card */}
        <div className="absolute bottom-4 left-4 z-[500] bg-white border-[3px] border-[#33302A] p-3 shadow-[4px_4px_0px_rgba(0,0,0,0.3)] font-mono text-xs">
          <div className="font-bold text-lg">{allStores === null ? '…' : stores.length}</div>
          <div className="text-gray-500">Stores located</div>
        </div>
      </div>
    </div>
  );
}
