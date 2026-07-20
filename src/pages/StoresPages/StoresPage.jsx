import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../styles/StoresPage.css';

// ── Store data ─────────────────────────────────────────────────────────────────
const STORES = [
  { id:1,  name:"Tito's Bodega",           type:"bodega",       lat:40.7282, lng:-73.9942, address:"214 W 14th St, New York, NY",      neighborhood:"Chelsea",       deal:"Coffee and roll for $2.50",            rating:4.6 },
  { id:2,  name:"Key Food Supermarket",    type:"grocery",      lat:40.6501, lng:-73.9496, address:"792 Flatbush Ave, Brooklyn, NY",   neighborhood:"Flatbush",      deal:"Double points on produce Wednesdays",  rating:4.2 },
  { id:3,  name:"C-Town Supermarkets",     type:"grocery",      lat:40.7489, lng:-73.9680, address:"452 9th Ave, New York, NY",        neighborhood:"Hell's Kitchen", deal:"10% off store brand items",           rating:3.9 },
  { id:4,  name:"Associated Supermarket",  type:"grocery",      lat:40.7282, lng:-73.7949, address:"186-02 Jamaica Ave, Queens, NY",   neighborhood:"Jamaica",       deal:"Free reusable bag with $25+ purchase", rating:4.0 },
  { id:5,  name:"La Esquina Corner Store", type:"corner_store", lat:40.7831, lng:-73.9442, address:"2187 3rd Ave, New York, NY",       neighborhood:"Harlem",        deal:null,                                   rating:4.4 },
  { id:6,  name:"Met Foods",               type:"grocery",      lat:40.8200, lng:-73.9249, address:"731 Melrose Ave, Bronx, NY",       neighborhood:"Melrose",       deal:"Senior discount 5% on Tuesdays",       rating:4.1 },
  { id:7,  name:"Compare Foods",           type:"grocery",      lat:40.6647, lng:-73.9445, address:"490 Nostrand Ave, Brooklyn, NY",   neighborhood:"Crown Heights", deal:"Buy 2 get 1 free on canned goods",    rating:4.3 },
  { id:8,  name:"Western Beef",            type:"grocery",      lat:40.7023, lng:-73.9971, address:"36-05 Woodside Ave, Queens, NY",   neighborhood:"Woodside",      deal:"Weekend butcher specials",             rating:4.5 },
  { id:9,  name:"El Barrio Deli & Grocery",type:"bodega",       lat:40.7969, lng:-73.9380, address:"1654 Lexington Ave, New York, NY", neighborhood:"East Harlem",   deal:"Daily lunch special $6.99",           rating:4.7 },
  { id:10, name:"Park Slope Food Coop",    type:"grocery",      lat:40.6685, lng:-73.9797, address:"782 Union St, Brooklyn, NY",       neighborhood:"Park Slope",    deal:"Member prices up to 40% below retail", rating:4.8 },
];

const TYPE_COLORS  = { bodega:'#c0392b', corner_store:'#8e44ad', grocery:'#27ae60' };
const TYPE_LABELS  = { bodega:'Bodega', corner_store:'Corner Store', grocery:'Grocery' };

// ── Store specialties ──────────────────────────────────────────────────────────
const STORE_SPECIALTIES = {
  1:  ['snack','coffee','pantry','quick'],
  2:  ['produce','dairy','protein','pantry','meat'],
  3:  ['produce','dairy','protein','pantry','bulk'],
  4:  ['produce','international','pantry','caribbean','meat'],
  5:  ['snack','quick','drink'],
  6:  ['produce','dairy','protein','pantry','international'],
  7:  ['caribbean','produce','international','spice'],
  8:  ['meat','protein','seafood','butcher'],
  9:  ['quick','coffee','snack','deli'],
  10: ['organic','specialty','produce','dairy','bulk'],
};

const INGREDIENT_TAG_MAP = [
  { words:['chicken','beef','pork','lamb','turkey','steak','ground beef','veal','duck','bacon','sausage'], tag:'meat' },
  { words:['salmon','shrimp','fish','tuna','cod','tilapia','scallop','lobster','crab','clam','mussel'],    tag:'seafood' },
  { words:['milk','cream','butter','cheese','yogurt','parmesan','mozzarella','cheddar','sour cream','cream cheese','heavy cream','ricotta'], tag:'dairy' },
  { words:['lettuce','tomato','onion','garlic','pepper','carrot','spinach','kale','celery','cucumber','broccoli','potato','sweet potato','avocado','lime','lemon','cilantro','parsley','basil','ginger','mushroom','zucchini','eggplant','corn','peas','bean','apple','banana','orange','berry','mango','pineapple','peach','scallion','shallot','fennel','cabbage','arugula','beet'], tag:'produce' },
  { words:['plantain','yuca','sofrito','adobo','sazon','culantro','scotch bonnet','ackee','callaloo'],     tag:'caribbean' },
  { words:['organic','natural','vegan','gluten-free','non-gmo','plant-based'],                             tag:'organic' },
  { words:['rice','pasta','flour','sugar','salt','oil','olive oil','vinegar','honey','mustard','ketchup','soy sauce','broth','stock','canned','tomato sauce','coconut milk','spice','seasoning','baking powder','baking soda','cornstarch'], tag:'pantry' },
  { words:['coffee','espresso','tea'],                                                                     tag:'coffee' },
  { words:['chip','cracker','cookie','candy','chocolate','nut','almond','cashew','granola'],               tag:'snack' },
  { words:['tofu','tempeh','seitan','nutritional yeast'],                                                  tag:'specialty' },
];

// ── Utilities ──────────────────────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function optimizeRoute(stores) {
  if (stores.length <= 2) return [...stores];
  const remaining = [...stores];
  const ordered   = [remaining.splice(0,1)[0]];
  while (remaining.length > 0) {
    const last = ordered[ordered.length-1];
    let ni = 0, nd = Infinity;
    remaining.forEach((s,i) => { const d = haversine(last.lat,last.lng,s.lat,s.lng); if (d<nd){nd=d;ni=i;} });
    ordered.push(remaining.splice(ni,1)[0]);
  }
  return ordered;
}

function getIngredientTags(list) {
  const text = list.join(' ').toLowerCase();
  const tags = new Set();
  INGREDIENT_TAG_MAP.forEach(({ words, tag }) => { if (words.some(w => text.includes(w))) tags.add(tag); });
  return tags;
}

function starsText(r) {
  return '★'.repeat(Math.floor(r)) + (r%1>=0.5 ? '½' : '') + ` (${r})`;
}

// ── IndexedDB ─────────────────────────────────────────────────────────────────
const DB_NAME = 'dig-in-react', DB_VER = 1, STORE_KEY = 'checkins';
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_KEY))
        db.createObjectStore(STORE_KEY, { keyPath:'id', autoIncrement:true });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}
async function dbSave(record) {
  const db = await openDB();
  return new Promise((resolve,reject) => {
    const tx = db.transaction(STORE_KEY,'readwrite');
    const r  = tx.objectStore(STORE_KEY).add(record);
    r.onsuccess = () => resolve(r.result);
    r.onerror   = () => reject(r.error);
  });
}
async function dbGetAll() {
  const db = await openDB();
  return new Promise((resolve,reject) => {
    const tx = db.transaction(STORE_KEY,'readonly');
    const r  = tx.objectStore(STORE_KEY).getAll();
    r.onsuccess = () => resolve([...r.result].reverse());
    r.onerror   = () => reject(r.error);
  });
}
async function dbDelete(id) {
  const db = await openDB();
  return new Promise((resolve,reject) => {
    const tx = db.transaction(STORE_KEY,'readwrite');
    const r  = tx.objectStore(STORE_KEY).delete(id);
    r.onsuccess = () => resolve();
    r.onerror   = () => reject(r.error);
  });
}
function resizeImage(file, maxWidth = 600) {
  return new Promise(resolve => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth/img.width);
      const c = document.createElement('canvas');
      c.width = img.width*scale; c.height = img.height*scale;
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg',0.75));
    };
    img.src = url;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function StoresPage() {
  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const markerMapRef    = useRef({});
  const polylineRef     = useRef(null);
  const numMarkersRef   = useRef([]);
  const visitCounts     = useRef(Object.fromEntries(STORES.map(s => [s.id, 0])));

  const [activeTab,      setActiveTab]      = useState('stores');
  const [storeFilter,    setStoreFilter]    = useState('');
  const [routeStores,    setRouteStores]    = useState([]);
  const [ingredientText, setIngredientText] = useState('');
  const [parsedIngr,     setParsedIngr]     = useState([]);
  const [routeStats,     setRouteStats]     = useState(null);
  const [shopList,       setShopList]       = useState([]);

  // Check-in modal
  const [checkinStore,  setCheckinStore]  = useState(null);
  const [photo,         setPhoto]         = useState(null);
  const [checkinMsg,    setCheckinMsg]    = useState('');
  const [checkinDone,   setCheckinDone]   = useState(false);
  const photoInputRef = useRef(null);

  // History panel
  const [historyOpen,    setHistoryOpen]    = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyCount,   setHistoryCount]   = useState(0);

  // ── Map init ──────────────────────────────────────────────────────────────
  const buildPopup = useCallback((store) => {
    const visits = visitCounts.current[store.id] || 0;
    return `
      <div class="sp-popup">
        <strong class="sp-popup-name">${store.name}</strong>
        <span class="sp-popup-badge" style="background:${TYPE_COLORS[store.type]}">${TYPE_LABELS[store.type]}</span>
        <div class="sp-popup-addr">${store.address}<br/><em>${store.neighborhood}</em></div>
        ${store.deal ? `<div class="sp-popup-deal">${store.deal}</div>` : ''}
        <div class="sp-popup-rating">${starsText(store.rating)}</div>
        <div class="sp-popup-visits" id="sp-vc-${store.id}">${visits} visit${visits!==1?'s':''} this session</div>
        <button class="sp-popup-checkin" onclick="window.__spCheckin(${store.id})">Check In</button>
      </div>`;
  }, []);

  const makeIcon = (type) => {
    const color = TYPE_COLORS[type] || '#1a1a1a';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 22 14 22S28 23.33 28 14C28 6.27 21.73 0 14 0z"
            fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="6" fill="#fff"/>
    </svg>`;
    return window.L.divIcon({ html:svg, className:'', iconSize:[28,36], iconAnchor:[14,36], popupAnchor:[0,-38] });
  };

  useEffect(() => {
    if (!window.L || mapRef.current) return;
    const map = window.L.map(mapContainerRef.current).setView([40.7282,-73.9442], 12);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:'&copy; OpenStreetMap contributors', maxZoom:19
    }).addTo(map);
    mapRef.current = map;

    STORES.forEach(store => {
      const marker = window.L.marker([store.lat,store.lng], { icon:makeIcon(store.type) })
        .bindPopup(buildPopup(store))
        .addTo(map);
      markerMapRef.current[store.id] = marker;
    });

    // Expose check-in trigger to popup button (vanilla HTML in Leaflet popup)
    window.__spCheckin = (id) => {
      setCheckinStore(STORES.find(s => s.id===id));
      setPhoto(null);
      setCheckinMsg('');
      setCheckinDone(false);
    };

    return () => { delete window.__spCheckin; };
  }, [buildPopup]);

  const refreshHistoryCount = async () => {
    const recs = await dbGetAll();
    setHistoryCount(recs.length);
  };

  useEffect(() => { refreshHistoryCount(); }, []);

  // ── Sidebar: focus store ───────────────────────────────────────────────────
  const focusStore = (store) => {
    if (!mapRef.current) return;
    mapRef.current.setView([store.lat, store.lng], 15, { animate:true });
    markerMapRef.current[store.id]?.openPopup();
  };

  // ── Route management ───────────────────────────────────────────────────────
  const toggleRouteStore = (store) => {
    setRouteStores(prev => {
      const exists = prev.some(s => s.id===store.id);
      return exists ? prev.filter(s => s.id!==store.id) : [...prev, store];
    });
    clearRouteVisuals();
    setRouteStats(null);
    setShopList([]);
  };

  const clearRouteVisuals = () => {
    if (polylineRef.current) { mapRef.current?.removeLayer(polylineRef.current); polylineRef.current = null; }
    numMarkersRef.current.forEach(m => mapRef.current?.removeLayer(m));
    numMarkersRef.current = [];
  };

  const drawRoute = () => {
    const ordered = optimizeRoute([...routeStores]);
    setRouteStores(ordered);
    clearRouteVisuals();

    const latlngs = ordered.map(s => [s.lat, s.lng]);
    polylineRef.current = window.L.polyline(latlngs, {
      color:'#f4a924', weight:4, opacity:0.85, dashArray:'10 6',
    }).addTo(mapRef.current);
    mapRef.current.fitBounds(polylineRef.current.getBounds(), { padding:[60,60] });

    ordered.forEach((store, i) => {
      const icon = window.L.divIcon({
        html:`<div style="background:#f4a924;color:#111;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)">${i+1}</div>`,
        className:'', iconSize:[22,22], iconAnchor:[11,11],
      });
      numMarkersRef.current.push(window.L.marker([store.lat,store.lng],{icon,zIndexOffset:1000}).addTo(mapRef.current));
    });

    let totalMi = 0;
    for (let i=0;i<ordered.length-1;i++) totalMi += haversine(ordered[i].lat,ordered[i].lng,ordered[i+1].lat,ordered[i+1].lng);
    const mins = Math.round(totalMi*20);
    setRouteStats({ stops:ordered.length, dist:totalMi.toFixed(1), time: mins>=60?`${Math.floor(mins/60)}h ${mins%60}m`:`~${mins} min` });

    buildShopList(ordered, parsedIngr);
  };

  const clearRoute = () => {
    setRouteStores([]);
    setParsedIngr([]);
    setIngredientText('');
    setRouteStats(null);
    setShopList([]);
    clearRouteVisuals();
  };

  // ── Ingredient → stores ────────────────────────────────────────────────────
  const findStores = () => {
    const items = ingredientText.split(/[\n,]+/).map(s=>s.trim()).filter(Boolean);
    if (!items.length) return;
    setParsedIngr(items);
    const tags = getIngredientTags(items);

    const scored = STORES.map(store => {
      const spec = STORE_SPECIALTIES[store.id];
      const overlap = spec.filter(t=>tags.has(t)).length;
      const full = spec.includes('produce') && spec.includes('pantry');
      return { store, score: overlap + (full?2:0) };
    }).sort((a,b)=>b.score-a.score);

    const top = scored.filter(s=>s.score>0).slice(0,3).map(s=>s.store);
    const selected = top.length > 0 ? top : STORES.filter(s=>s.type==='grocery').slice(0,2);

    setRouteStores(prev => {
      const deduped = [...prev];
      selected.forEach(s => { if (!deduped.some(r=>r.id===s.id)) deduped.push(s); });
      return deduped;
    });
    setActiveTab('commute');
    clearRouteVisuals();
    setRouteStats(null);
    setShopList([]);
  };

  const buildShopList = (ordered, items) => {
    if (!items.length) { setShopList([]); return; }
    const storeItems = {};
    ordered.forEach(s => { storeItems[s.id] = []; });

    items.forEach(ing => {
      const lower = ing.toLowerCase();
      const ingTags = new Set();
      INGREDIENT_TAG_MAP.forEach(({words,tag}) => { if (words.some(w=>lower.includes(w))) ingTags.add(tag); });
      let best = ordered[0], bestScore = -1;
      ordered.forEach(store => {
        const match = STORE_SPECIALTIES[store.id].filter(t=>ingTags.has(t)).length;
        if (match>bestScore){bestScore=match;best=store;}
      });
      storeItems[best.id].push(ing);
    });

    const fullGrocery = ordered.find(s => {
      const sp = STORE_SPECIALTIES[s.id];
      return sp.includes('produce') && sp.includes('pantry');
    }) || ordered[0];

    const assigned = new Set(Object.values(storeItems).flat());
    items.filter(i=>!assigned.has(i)).forEach(i => { storeItems[fullGrocery.id].push(i); });

    setShopList(ordered.map((store,i) => ({ store, items:storeItems[store.id]||[], num:i+1 })).filter(e=>e.items.length>0));
  };

  // ── Check-in ───────────────────────────────────────────────────────────────
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(await resizeImage(file));
  };

  const handleCheckin = async () => {
    if (!checkinStore) return;
    let serverData = null;
    try {
      // Matches src/services/api.js's convention: relative in dev (vite proxy
      // or same-origin deploy), VITE_API_BASE when the backend is elsewhere.
      const API_BASE = import.meta.env.VITE_API_BASE ?? '';
      const res = await fetch(`${API_BASE}/api/stores/${checkinStore.id}/checkin`, {
        method:'POST', headers:{'Content-Type':'application/json'},
      });
      if (res.ok) serverData = await res.json();
    } catch (_) {}

    const coins = serverData?.coins_earned ?? 50;
    visitCounts.current[checkinStore.id] = serverData?.visit_count ?? (visitCounts.current[checkinStore.id]+1);
    markerMapRef.current[checkinStore.id]?.setPopupContent(buildPopup(checkinStore));

    await dbSave({
      store_id:checkinStore.id, store_name:checkinStore.name,
      neighborhood:checkinStore.neighborhood, type:checkinStore.type,
      photo, timestamp:new Date().toISOString(), coins, synced:!!serverData,
    });

    setCheckinMsg(`Checked in! +${coins} coins earned.`);
    setCheckinDone(true);
    refreshHistoryCount();
  };

  const openHistory = async () => {
    setHistoryRecords(await dbGetAll());
    setHistoryOpen(true);
  };

  const deleteHistoryRecord = async (id) => {
    await dbDelete(id);
    setHistoryRecords(await dbGetAll());
    refreshHistoryCount();
  };

  // ── Filtered store list ────────────────────────────────────────────────────
  const filteredStores = storeFilter ? STORES.filter(s=>s.type===storeFilter) : STORES;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="sp-page">

      {/* ── Header ── */}
      <header className="sp-header">
        <span className="sp-logo">DIG <span>IN</span></span>
        <nav className="sp-nav">
          <Link to="/" className="sp-nav-link">Home</Link>
          <Link to="/recipes" className="sp-nav-link">Recipes</Link>
          <button className="sp-history-btn" onClick={openHistory}>
            History {historyCount > 0 && <span className="sp-history-badge">{historyCount}</span>}
          </button>
        </nav>
      </header>

      <div className="sp-body">

        {/* ── Sidebar ── */}
        <aside className="sp-sidebar">
          {/* Tabs */}
          <div className="sp-tabs">
            <button
              className={`sp-tab${activeTab==='stores'?' active':''}`}
              onClick={() => setActiveTab('stores')}
            >
              Stores
            </button>
            <button
              className={`sp-tab${activeTab==='commute'?' active':''}`}
              onClick={() => setActiveTab('commute')}
            >
              Plan Route
            </button>
          </div>

          {/* ── STORES TAB ── */}
          {activeTab === 'stores' && (
            <div className="sp-tab-panel">
              <div className="sp-filters">
                {['','bodega','corner_store','grocery'].map(type => (
                  <button
                    key={type}
                    className={`sp-filter-pill${storeFilter===type?' active':''} ${type}`}
                    onClick={() => setStoreFilter(type)}
                  >
                    {type==='' ? 'All' : TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              <div className="sp-store-list">
                {filteredStores.map(store => {
                  const inRoute = routeStores.some(s=>s.id===store.id);
                  return (
                    <div
                      key={store.id}
                      className={`sp-store-card${inRoute?' in-route':''}`}
                      onClick={() => focusStore(store)}
                    >
                      <div className="sp-card-top">
                        <span className="sp-card-name">{store.name}</span>
                        <span className="sp-card-badge" style={{background:TYPE_COLORS[store.type]}}>
                          {TYPE_LABELS[store.type]}
                        </span>
                      </div>
                      <div className="sp-card-hood">{store.neighborhood}</div>
                      {store.deal && <div className="sp-card-deal">{store.deal}</div>}
                      <div className="sp-card-footer">
                        <span className="sp-card-rating">{starsText(store.rating)}</span>
                        <button
                          className={`sp-add-btn${inRoute?' added':''}`}
                          onClick={e => { e.stopPropagation(); toggleRouteStore(store); }}
                        >
                          {inRoute ? '✓ In Route' : '+ Add to Route'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PLAN ROUTE TAB ── */}
          {activeTab === 'commute' && (
            <div className="sp-tab-panel">
              <div className="sp-commute">

                <div className="sp-section">
                  <div className="sp-section-label">What are you shopping for?</div>
                  <textarea
                    className="sp-ingr-input"
                    placeholder={"Paste your ingredient list here…\ne.g. chicken, garlic, olive oil, tomatoes, basil"}
                    value={ingredientText}
                    onChange={e => setIngredientText(e.target.value)}
                  />
                  <button className="sp-find-btn" onClick={findStores}>
                    Find Best Stores →
                  </button>
                </div>

                <div className="sp-section">
                  <div className="sp-section-label">
                    Your Route{' '}
                    {routeStores.length > 0 && (
                      <span className="sp-route-count">({routeStores.length} stop{routeStores.length!==1?'s':''})</span>
                    )}
                  </div>

                  {routeStores.length === 0 ? (
                    <div className="sp-empty">Add stores from the Stores tab,<br/>or paste ingredients above.</div>
                  ) : (
                    <div className="sp-route-list">
                      {routeStores.map((store,i) => (
                        <div key={store.id}>
                          <div className="sp-route-stop">
                            <span className="sp-stop-num">{i+1}</span>
                            <div className="sp-stop-info">
                              <div className="sp-stop-name">{store.name}</div>
                              <div className="sp-stop-meta">{store.neighborhood} · {TYPE_LABELS[store.type]}</div>
                            </div>
                            <button className="sp-remove-stop" onClick={() => toggleRouteStore(store)}>×</button>
                          </div>
                          {i < routeStores.length-1 && <div className="sp-connector">↓ continue to next stop</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    className="sp-draw-btn"
                    onClick={drawRoute}
                    disabled={routeStores.length < 2}
                  >
                    Draw Route on Map
                  </button>
                  <button className="sp-clear-btn" onClick={clearRoute}>Clear Route</button>
                </div>

                {routeStats && (
                  <div className="sp-section">
                    <div className="sp-section-label">Route Summary</div>
                    <div className="sp-summary">
                      <div className="sp-summary-row"><span>Stops</span><strong>{routeStats.stops}</strong></div>
                      <div className="sp-summary-row"><span>Total distance</span><strong>{routeStats.dist} mi</strong></div>
                      <div className="sp-summary-row"><span>Est. walking</span><strong>{routeStats.time} walking</strong></div>
                    </div>
                  </div>
                )}

                {shopList.length > 0 && (
                  <div className="sp-section">
                    <div className="sp-section-label">Shopping List by Store</div>
                    {shopList.map(({ store, items, num }) => (
                      <div key={store.id} className="sp-shop-block">
                        <div className="sp-shop-header">
                          <span className="sp-shop-num">{num}</span>
                          {store.name}
                        </div>
                        <ul className="sp-shop-items">
                          {items.map((item,i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          )}
        </aside>

        {/* ── Map ── */}
        <div ref={mapContainerRef} className="sp-map" />
      </div>

      {/* ── Check-in Modal ── */}
      {checkinStore && (
        <div className="sp-modal-overlay" onClick={e => { if (e.target===e.currentTarget) setCheckinStore(null); }}>
          <div className="sp-modal">
            {checkinMsg && <div className="sp-checkin-success">{checkinMsg}</div>}
            <div className="sp-modal-title">{checkinStore.name}</div>
            <div className="sp-modal-sub">{checkinStore.neighborhood} · {TYPE_LABELS[checkinStore.type]}</div>

            {!photo ? (
              <div className="sp-photo-drop" onClick={() => photoInputRef.current?.click()}>
                <div className="sp-photo-icon">PHOTO</div>
                <p>Tap to add a photo<br /><small>optional</small></p>
              </div>
            ) : (
              <div className="sp-photo-preview-wrap">
                <img src={photo} alt="preview" className="sp-photo-preview" />
                <button className="sp-remove-photo" onClick={() => setPhoto(null)}>✕ Remove photo</button>
              </div>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" capture="environment"
              style={{display:'none'}} onChange={handlePhotoSelect} />

            <div className="sp-modal-actions">
              <button className="sp-btn-cancel" onClick={() => setCheckinStore(null)}>
                {checkinDone ? 'Done' : 'Cancel'}
              </button>
              {!checkinDone && (
                <button className="sp-btn-checkin" onClick={handleCheckin}>Check In</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── History Panel ── */}
      {historyOpen && (
        <div className="sp-history-panel">
          <div className="sp-history-header">
            <span className="sp-history-title">Check-in History</span>
            <button className="sp-history-close" onClick={() => setHistoryOpen(false)}>×</button>
          </div>
          <div className="sp-history-list">
            {historyRecords.length === 0 ? (
              <div className="sp-empty">No check-ins yet.<br/>Visit a store to get started!</div>
            ) : historyRecords.map(r => (
              <div key={r.id} className="sp-history-card">
                {r.photo
                  ? <img src={r.photo} alt={r.store_name} className="sp-hc-photo" />
                  : <div className="sp-hc-nophoto">STORE</div>}
                <div className="sp-hc-info">
                  <div className="sp-hc-name">{r.store_name}</div>
                  <div className="sp-hc-meta">{r.neighborhood} · {new Date(r.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                  <div className="sp-hc-coins">+{r.coins} coins</div>
                </div>
                <button className="sp-hc-delete" onClick={() => deleteHistoryRecord(r.id)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}