import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { X, Navigation, Clock, MapPin, Store, ShieldCheck, Star } from 'lucide-react';
import L from 'leaflet';
import Nav from '../../../../components/shell/Nav';
import 'leaflet/dist/leaflet.css';
import '../../../../lib/leafletSetup'; // marker-icon fix — must run before any Marker mounts

// --- 1. PIXEL POPUP CSS OVERRIDE (From your earlier request) ---
const pixelStyles = `
  .leaflet-popup-content-wrapper, .leaflet-popup-tip {
    background: #F3EADA !important;
    border: 4px solid #33302A !important;
    border-radius: 0px !important;
    box-shadow: 8px 8px 0px rgba(0,0,0,0.25) !important;
    font-family: 'Courier New', monospace !important;
    padding: 0px !important;
  }
  .leaflet-popup-content { margin: 0px !important; width: 380px !important; }
  .leaflet-popup-close-button { display: none !important; }
`;

// --- 2. HELPER COMPONENT (Fly to location) ---
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom); }, [center, map, zoom]);
  return null;
}

// --- 3. THE STORE POPUP COMPONENT ---
const StorePopup = ({ store, onClose }) => {
  // If there are user-reported deals, display them
  const hasDeal = store.currentDeals && store.currentDeals.length > 0;
  const deal = hasDeal ? store.currentDeals[0] : null;

  return (
    <div className="bg-[#F3EADA] font-mono relative w-full min-h-[250px] flex flex-col p-4">
      <button onClick={onClose} className="absolute top-2 right-2 text-[#33302A] hover:text-[#ff6d8b] z-50">
        <X size={20} strokeWidth={3} />
      </button>

      {/* If there is a deal, show the Deal Header (The Cheese) */}
      {hasDeal ? (
        <div className="mb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="bg-[#ffbc51] border-2 border-[#33302A] w-8 h-8 flex items-center justify-center text-lg font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                $
              </div>
              <h3 className="text-[#ac6226] font-bold text-lg uppercase leading-tight">{deal.item_name}:</h3>
            </div>
            <div className="bg-[#ffbc51] border-2 border-[#33302A] px-2 py-0.5 font-bold text-sm shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              {deal.price}
            </div>
          </div>
          <p className="text-[#522e1c] text-sm leading-snug mb-2 mt-1">
            {deal.description}
            <br />
            <span className="text-[#33302A]/60 text-xs">Until {deal.expiry}</span>
          </p>
        </div>
      ) : (
        <div className="bg-[#33302A] text-[#eaff66] text-[10px] p-2 mb-3 border-2 border-[#ffbc51] text-center uppercase font-bold tracking-widest">
          No Deals Reported. Be the first to Check In!
        </div>
      )}

      {/* Store Meta */}
      <div className="mt-2 pt-3 border-t-2 border-[#33302A]/20">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[#ff6d8b] font-bold uppercase text-xs tracking-widest flex items-center gap-1">
            <Store size={14} /> {store.type}
          </span>
          {store.type === "Grocery Store" && <Star size={12} className="text-[#a8d672]" />}
        </div>
        <div className="font-bold text-base text-[#33302A]">{store.name}</div>
        <div className="text-xs text-[#33302A]/60">{store.address}</div>
        <div className="flex items-center gap-1 text-xs text-[#33302A]/80 mt-1 border-b border-[#d4cfc4] pb-2">
          <Clock size={12} /> {store.hours}
        </div>
        
        <div className="mt-3 flex flex-col gap-2">
          {store.website && (
            <a href={store.website} target="_blank" rel="noreferrer">
              <button className="w-full border-[2px] border-[#ff6d8b] bg-transparent text-[#33302A] font-bold py-2 text-xs shadow-[2px_2px_0px_rgba(255,109,139,0.5)] hover:bg-[#ff6d8b] hover:text-white transition-colors">
                Visit website
              </button>
            </a>
          )}
          <button
            type="button"
            className="w-full bg-[#33302A] text-white font-bold py-3 flex justify-center items-center gap-2 border-[3px] border-[#555] shadow-[4px_4px_0px_rgba(0,0,0,0.5)] active:translate-x-[3px] active:translate-y-[3px] transition-all text-sm"
            onClick={() => window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`,
              '_blank', 'noopener'
            )}
          >
            <Navigation size={16} strokeWidth={3} /> Get Directions
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 4. THE CUSTOM MARKER ---
const CustomMapMarker = ({ store }) => {
  // Color code the markers based on type
  let bgColor = "#e0e0e0"; // Default gray
  let label = "S";
  
  if (store.type === "Grocery Store") { bgColor = "#4a90e2"; label = "G"; }
  if (store.type === "Corner Store") { bgColor = "#f5a623"; label = "C"; }
  if (store.type === "Specialty Store") { bgColor = "#8b4513"; label = "Spec"; }
  if (store.type === "Wawa's Style") { bgColor = "#eaff66"; label = "WAWA"; }

  const pixelIcon = new L.DivIcon({
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    html: `
      <div style="
        background: ${bgColor}; 
        border: 3px solid #33302A; 
        width: 44px; 
        height: 44px;
        display: flex; 
        align-items: center; 
        justify-content: center;
        box-shadow: 4px 4px 0px rgba(0,0,0,0.5);
        cursor: pointer;
        font-family: 'Courier New', monospace;
        font-weight: bold;
        font-size: 12px;
        color: #33302A;
        border-radius: 4px;
        position: relative;
      ">${label}</div>
    `
  });

  return (
    <Marker position={[store.lat, store.lng]} icon={pixelIcon}>
      <Popup closeButton={false}>
        <StorePopup store={store} onClose={() => {}} />
      </Popup>
    </Marker>
  );
};

// --- 5. MAIN APP ---
export default function ChicagoStoreMap() {
  const [center] = useState([41.8781, -87.6298]); // Chicago Center
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real backend call (relative path → Vite proxy in dev, VITE_API_BASE /
    // same-origin in prod) — /api/stores/nearby, filtered to a real radius
    // around Chicago. The app has no Illinois store dataset yet (only NYC +
    // the OSM-sourced state files FoodMap uses), so this will honestly come
    // back empty until real Chicago stores are added — better than the old
    // /api/stores/all call, which returned unrelated NYC stores under a
    // "Chicago Store Ledger" header.
    const base = import.meta.env.VITE_API_BASE ?? '';
    fetch(`${base}/api/stores/nearby?lat=41.8781&lng=-87.6298&radius=25`)
      .then(res => res.json())
      .then(data => {
        setStores(data.stores || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load stores. Is the Python service running?', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f2eb] flex flex-col items-center p-4 relative">
      <Nav />
      <style>{pixelStyles}</style>

      {/* Header */}
      <div className="w-full max-w-5xl bg-white border-[4px] border-[#33302A] p-4 shadow-[6px_6px_0px_rgba(0,0,0,0.25)] mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[#33302A]">Chicago Store Ledger</h1>
          <p className="text-[10px] text-gray-500 font-mono">{loading ? "Loading OpenStreetMap data..." : `${stores.length} verified stores loaded`}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 text-[10px]"><div className="w-3 h-3 bg-[#4a90e2] border border-[#33302A]"></div> Grocery</div>
          <div className="flex items-center gap-1 text-[10px]"><div className="w-3 h-3 bg-[#f5a623] border border-[#33302A]"></div> Corner</div>
          <div className="flex items-center gap-1 text-[10px]"><div className="w-3 h-3 bg-[#eaff66] border border-[#33302A]"></div> Wawa's</div>
        </div>
      </div>

      {!loading && stores.length === 0 && (
        <div className="w-full max-w-5xl bg-[#33302A] text-[#eaff66] text-xs p-3 mb-4 border-2 border-[#ffbc51] text-center font-mono">
          No verified Chicago stores yet — this app's real store data currently covers NYC + several other states, not Illinois. The map below still works and will populate as soon as real Chicago data is added.
        </div>
      )}

      {/* Map */}
      <div className="w-full max-w-5xl h-[700px] border-[6px] border-[#33302A] shadow-[10px_10px_0px_rgba(0,0,0,0.3)] relative z-0 bg-white overflow-hidden">
        <MapContainer center={center} zoom={12} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={center} zoom={12} />
          
          {/* Render Real Stores */}
          {stores.map((store) => (
            <CustomMapMarker key={store.id} store={store} />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}