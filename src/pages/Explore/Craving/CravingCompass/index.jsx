import { useState, useEffect } from 'react';
import {
  Search, MapPin, Clock, ShoppingCart, Car,
  ChefHat, Sparkles, ArrowRight, Loader2, Zap, Compass, Navigation,
  Brain, Layers, Lightbulb,
} from 'lucide-react';
import Nav from '../../../../components/shell/Nav';
import { getCurrentPosition, hasGeolocation } from '../../../../lib/native';
import { decodeCraving, SEASONING_LAYERS } from '../../../../services/seasoningPairingEngine';
import './CravingCompass.css';

// ── Store database with real NYC coordinates ──────────────────────
const STORES = [
  {
    id: 'wholefoods', name: 'Whole Foods Market',
    neighborhood: 'Union Square', borough: 'Manhattan',
    lat: 40.7340, lng: -73.9923, totalCost: 26.50, type: 'premium',
    items: [
      { name: 'Organic Chicken Thighs', price: '$9.99/lb' },
      { name: 'Heavy Cream',            price: '$4.99'    },
      { name: 'Fresh Spinach',          price: '$3.99'    },
    ],
  },
  {
    id: 'traderjoes', name: "Trader Joe's",
    neighborhood: 'Gramercy', borough: 'Manhattan',
    lat: 40.7380, lng: -73.9870, totalCost: 18.25, type: 'mid',
    items: [
      { name: 'Boneless Chicken', price: '$5.99/lb' },
      { name: 'Heavy Cream',      price: '$3.49'    },
      { name: 'Spinach Mix',      price: '$2.99'    },
    ],
  },
  {
    id: 'aldi', name: 'ALDI',
    neighborhood: 'Flatbush', borough: 'Brooklyn',
    lat: 40.6451, lng: -73.9530, totalCost: 14.75, type: 'budget',
    items: [
      { name: 'Chicken Thighs', price: '$3.99/lb' },
      { name: 'Heavy Cream',    price: '$2.89'    },
      { name: 'Fresh Spinach',  price: '$1.99'    },
    ],
  },
  {
    id: 'keyfood', name: 'Key Food',
    neighborhood: 'Park Slope', borough: 'Brooklyn',
    lat: 40.6733, lng: -73.9782, totalCost: 15.50, type: 'budget',
    items: [
      { name: 'Chicken Legs',  price: '$2.99/lb' },
      { name: 'Heavy Cream',   price: '$3.19'    },
      { name: 'Baby Spinach',  price: '$2.49'    },
    ],
  },
  {
    id: 'ctown', name: 'C-Town Supermarket',
    neighborhood: 'Tremont', borough: 'The Bronx',
    lat: 40.8375, lng: -73.8558, totalCost: 12.90, type: 'budget',
    items: [
      { name: 'Chicken Thighs', price: '$2.79/lb' },
      { name: 'Heavy Cream',    price: '$2.69'    },
      { name: 'Spinach Bag',    price: '$1.79'    },
    ],
  },
  {
    id: 'nymart', name: 'New York Mart',
    neighborhood: 'Flushing', borough: 'Queens',
    lat: 40.7580, lng: -73.8318, totalCost: 11.20, type: 'international',
    items: [
      { name: 'Chicken Drumsticks', price: '$1.99/lb' },
      { name: 'Coconut Cream',      price: '$2.29'    },
      { name: 'Bok Choy',           price: '$1.49'    },
    ],
  },
];

// What makes each neighborhood worth wandering to
const WANDER_NOTES = {
  'Flatbush':     'Flatbush has incredible Caribbean bakeries and halal markets steps away',
  'Park Slope':   'Park Slope Coop members get 21% off — grab a guest pass at the door',
  'Flushing':     "Flushing's food court next door has legendary hand-pulled noodles",
  'Tremont':      'Arthur Ave (the real Little Italy) is 10 minutes from here',
  'Gramercy':     'Quick in-and-out — perfect if you just need to get home fast',
  'Union Square': 'GreenMarket runs Sat/Sun here — pick up fresh produce while you shop',
};

// ── OSRM open-source routing (no API key) ────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getOSRMRoute(oLat, oLng, dLat, dLng) {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${oLng},${oLat};${dLng},${dLat}?overview=false`;
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 6000);
    const res  = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes?.[0]) {
      return { durationSec: data.routes[0].duration, distanceM: data.routes[0].distance };
    }
  } catch {}
  return null;
}

// ── Time-of-day traffic factor ────────────────────────────────────
function getTrafficNow() {
  const h = new Date().getHours();
  if (h >= 7  && h < 9)  return { factor: 1.45, label: 'Morning Rush',  severity: 'bad'  };
  if (h >= 9  && h < 16) return { factor: 1.0,  label: 'Clear Roads',   severity: 'good' };
  if (h >= 16 && h < 19) return { factor: 1.55, label: 'Evening Rush',  severity: 'bad'  };
  if (h >= 19 && h < 22) return { factor: 1.1,  label: 'Light Traffic', severity: 'ok'   };
  return                         { factor: 0.85, label: 'Night Roads',   severity: 'good' };
}

// ── Recipe mock ───────────────────────────────────────────────────
async function generateRecipeFromCraving(ramble) {
  await new Promise(r => setTimeout(r, 1000));
  if (ramble.toLowerCase().includes('spicy') || ramble.toLowerCase().includes('creamy')) {
    return {
      title: 'Spicy Cajun Chicken Alfredo',
      totalTime: 28,
      description: 'Creamy pasta tossed with blackened chicken and a spicy kick. Rich, indulgent, ready in under 30 minutes.',
      ingredientsList: ['Chicken Thighs', 'Heavy Cream', 'Pasta', 'Parmesan', 'Cajun Seasoning', 'Spinach'],
      instructions: [
        'Season chicken generously with Cajun spice and sear in a hot cast iron for 6 mins per side. Rest and slice.',
        'In the same pan, deglaze with heavy cream and parmesan. Simmer until thick.',
        'Boil pasta al dente. Toss into the creamy sauce.',
        'Top with sliced spicy chicken and fresh spinach.',
      ],
    };
  }
  return {
    title: 'Lemon Garlic Herb Salmon',
    totalTime: 17,
    description: 'Flaky pan-seared salmon with fresh herbs, butter, and a squeeze of bright lemon.',
    ingredientsList: ['Salmon Fillets', 'Butter', 'Garlic', 'Lemon', 'Fresh Parsley'],
    instructions: [
      'Pat salmon dry. Season with salt and pepper.',
      'Pan-sear skin-side down for 6 mins, flip, and cook 4 more.',
      'Add butter and garlic to the pan; baste the salmon.',
      'Finish with fresh lemon juice and parsley.',
    ],
  };
}

// ── Store card ────────────────────────────────────────────────────
function StoreCard({ store, rank, wanderMode, traffic }) {
  const maxCost = Math.max(...STORES.map(s => s.totalCost));
  const savings  = (maxCost - store.totalCost).toFixed(2);
  const isTop    = rank === 0;
  const note     = WANDER_NOTES[store.neighborhood] || null;

  return (
    <div className={`cc-store-card${isTop ? ' cc-store-recommended' : ''}`}>
      <div className="cc-store-rank-pill">
        {isTop
          ? (wanderMode ? '★ Best Value Trip' : '★ Fastest Route')
          : `#${rank + 1}`}
      </div>

      <div className="cc-store-header">
        <div>
          <span className="cc-store-name">{store.name}</span>
          <div className="cc-store-neighborhood">
            <MapPin size={9} /> {store.neighborhood}, {store.borough}
          </div>
        </div>
        {isTop && (
          <span className="cc-best-badge">
            {wanderMode ? 'Best Balance' : 'Fastest'}
          </span>
        )}
      </div>

      <div className="cc-travel-info">
        <Clock size={13} color="#E0A32E" />
        <span>{store.adjustedMins} min drive</span>
        {store.distanceKm && (
          <>
            <div className="cc-travel-dot" />
            <Navigation size={11} color="#aaa" />
            <span style={{ fontSize: 11, color: '#aaa' }}>{store.distanceKm} km</span>
          </>
        )}
        <div className="cc-travel-dot" />
        <span className={`cc-traffic-tag cc-traffic-tag-${traffic.severity}`}>{traffic.label}</span>
      </div>

      {wanderMode && note && (
        <div className="cc-wander-note">
          <Compass size={10} /> {note}
        </div>
      )}

      <div className="cc-price-list">
        <div className="cc-price-header">
          <span>Ingredient</span>
          <span>Price</span>
        </div>
        {store.items.map((item, idx) => (
          <div key={idx} className="cc-price-row">
            <span className="cc-price-item">{item.name}</span>
            <span className="cc-price-val">{item.price}</span>
          </div>
        ))}
      </div>

      <div className="cc-total-row">
        <span className="cc-total-label">Estimated Total</span>
        <div style={{ textAlign: 'right' }}>
          <span className="cc-total-val">${store.totalCost.toFixed(2)}</span>
          {parseFloat(savings) > 0 && (
            <div className="cc-savings-tag">save ${savings} vs premium</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function CravingCompass({ embedded = false } = {}) {
  const [craving,      setCraving]      = useState('');
  const [zip,          setZip]          = useState('');
  const [wanderMode,   setWanderMode]   = useState(false);
  const [searching,    setSearching]    = useState(false);
  const [geoLoading,   setGeoLoading]   = useState(false);
  const [geoError,     setGeoError]     = useState(null);
  const [userCoords,   setUserCoords]   = useState(null);
  const [recipe,       setRecipe]       = useState(null);
  const [decoded,      setDecoded]      = useState(null);
  const [rankedStores, setRankedStores] = useState([]);
  const [showNeuro,    setShowNeuro]    = useState(false);
  const [showLayers,   setShowLayers]   = useState(false);

  const traffic = getTrafficNow();

  async function detectLocation() {
    if (!hasGeolocation()) { setGeoError('Browser geolocation not supported'); return; }
    setGeoLoading(true);
    setGeoError(null);
    try {
      const { lat, lng } = await getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
      setUserCoords({ lat, lng });
    } catch {
      setGeoError('Location access denied — enter a zip code below.');
    } finally {
      setGeoLoading(false);
    }
  }

  // Attempt silent detection on mount; failure is non-fatal
  useEffect(() => { detectLocation(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e) {
    e.preventDefault();
    if (!craving.trim()) return;
    setSearching(true);
    setRecipe(null);
    setDecoded(null);
    setRankedStores([]);
    setShowNeuro(false);
    setShowLayers(false);

    try {
      // Decode the craving through the seasoning + neuroscience engine first.
      // If the engine has a matching recipe archetype, use it (richer data).
      // Fall back to the simple mock only when the engine has no match.
      const decodedResult = decodeCraving(craving);
      setDecoded(decodedResult);
      const recipeData = decodedResult?.recipes?.[0]
        || await generateRecipeFromCraving(craving);
      setRecipe(recipeData);

      // Resolve origin: GPS first, then Nominatim zip lookup, then NYC default
      let origin = userCoords;
      if (!origin && zip.trim()) {
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(zip)}&limit=1`
          );
          const d = await r.json();
          if (d[0]) origin = { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
        } catch {}
      }
      if (!origin) origin = { lat: 40.7128, lng: -74.0060 }; // NYC fallback

      // Route to every store via OSRM; degrade gracefully if rate-limited
      const routedStores = await Promise.all(
        STORES.map(async (store) => {
          const route      = await getOSRMRoute(origin.lat, origin.lng, store.lat, store.lng);
          const straightKm = haversineKm(origin.lat, origin.lng, store.lat, store.lng);
          const baseMins   = route
            ? Math.ceil(route.durationSec / 60)
            : Math.ceil((straightKm * 1.4 / 25) * 60); // fallback: road-factor / avg city speed
          return {
            ...store,
            baseMins,
            adjustedMins: Math.ceil(baseMins * traffic.factor),
            distanceKm:   route ? (route.distanceM / 1000).toFixed(1) : null,
          };
        })
      );

      const sorted = [...routedStores].sort((a, b) => {
        if (wanderMode) {
          // Value score: how much you save per minute of adjusted drive time.
          // Rewards stores that are cheap even if slightly farther.
          const maxCost = Math.max(...routedStores.map(s => s.totalCost));
          const aScore  = (maxCost - a.totalCost) / Math.max(a.adjustedMins, 1);
          const bScore  = (maxCost - b.totalCost) / Math.max(b.adjustedMins, 1);
          return bScore - aScore;
        }
        return a.adjustedMins - b.adjustedMins; // fast mode: shortest drive first
      });

      setRankedStores(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  }

  const top  = rankedStores[0] ?? null;
  const plan = recipe && top ? {
    commuteMin:     top.adjustedMins,
    startCookingAt: new Date(Date.now() + top.adjustedMins * 60_000),
    doneEatingAt:   new Date(Date.now() + (top.adjustedMins + recipe.totalTime) * 60_000),
    totalMin:       top.adjustedMins + recipe.totalTime,
  } : null;

  const trafficAdvisory = (() => {
    if (traffic.factor === 1) return null;
    const pct = Math.abs(Math.round((traffic.factor - 1) * 100));
    return traffic.factor > 1
      ? `${traffic.label} adds ~${pct}% to drive times right now`
      : `${traffic.label} — roads are ~${pct}% faster than usual`;
  })();

  const fmt = t => t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      {!embedded && <Nav />}
      <div className="cc-page">

        {/* Header */}
        <div className="cc-header">
          <div className="cc-header-orb" />
          <div className="cc-header-orb2" />
          <div className="cc-header-inner">
            <h1 className="cc-title"><ChefHat size={20} /> Craving Compass</h1>
            <p className="cc-subtitle">Real routes · live traffic · grocery logistics</p>
          </div>
        </div>

        <div className="cc-body">

          {/* Mode toggle + traffic pill */}
          <div className="cc-mode-bar">
            <button
              className={`cc-mode-btn${!wanderMode ? ' active' : ''}`}
              onClick={() => setWanderMode(false)}
            >
              <Zap size={11} /> Fast Mode
            </button>
            <button
              className={`cc-mode-btn${wanderMode ? ' active' : ''}`}
              onClick={() => setWanderMode(true)}
            >
              <Compass size={11} /> Wander Mode
            </button>
            <div className={`cc-traffic-pill cc-traffic-pill-${traffic.severity}`}>
              <Car size={10} /> {traffic.label}
            </div>
          </div>

          {wanderMode && (
            <div className="cc-wander-banner">
              <Compass size={13} />
              <span>
                <strong>Wander Mode</strong> — we'll route you through neighborhoods with
                the best price-per-minute, not just closest. Discover what's around you.
              </span>
            </div>
          )}

          {/* Geolocation status row */}
          <div className="cc-geo-row">
            {userCoords ? (
              <span className="cc-geo-ok"><MapPin size={11} /> Location detected</span>
            ) : geoLoading ? (
              <span className="cc-geo-loading">
                <Loader2 size={11} className="cc-spinner-inline" /> Detecting...
              </span>
            ) : (
              <button className="cc-geo-btn" onClick={detectLocation}>
                <MapPin size={11} /> Use My Location
              </button>
            )}
            {geoError && <span className="cc-geo-err">{geoError}</span>}
          </div>

          {/* Input form */}
          <form className="cc-form-card" onSubmit={handleSubmit}>
            <div>
              <label className="cc-label"><Sparkles size={11} /> Describe your craving</label>
              <textarea
                className="cc-textarea"
                value={craving}
                onChange={e => setCraving(e.target.value)}
                placeholder="e.g. 'I want something spicy, creamy, and cheap for dinner tonight...'"
              />
            </div>

            {!userCoords && (
              <div className="cc-input-group">
                <label className="cc-label"><MapPin size={11} /> Zip Code (fallback)</label>
                <input
                  type="text"
                  className="cc-input"
                  value={zip}
                  onChange={e => setZip(e.target.value)}
                  placeholder="10001"
                />
              </div>
            )}

            <button type="submit" className="cc-submit-btn" disabled={searching}>
              {searching ? <Loader2 className="cc-spinner" size={16} /> : <Search size={16} />}
              {searching ? 'Routing...' : 'Find My Meal'}
            </button>
          </form>

          {/* Loading */}
          {searching && (
            <div className="cc-loading-card">
              <Loader2 className="cc-spinner" size={32} />
              <p className="cc-loading-title">Routing to {STORES.length} stores...</p>
              <p className="cc-loading-sub">
                {traffic.label.toLowerCase()} via open-source OSRM routing
              </p>
            </div>
          )}

          {/* Results */}
          {recipe && rankedStores.length > 0 && plan && (
            <div className="cc-results">

              {/* ── Brain State Card ── */}
              {decoded && (
                <div className="cc-brain-state-card">
                  <div className="cc-brain-state-header">
                    <span className="cc-brain-state-emoji">{decoded.archetype.emoji}</span>
                    <div>
                      <div className="cc-brain-state-label">
                        <Brain size={9} /> WHAT YOUR BRAIN IS DOING
                      </div>
                      <div className="cc-brain-state-title">{decoded.archetype.label}</div>
                    </div>
                  </div>
                  <p className="cc-brain-state-body">{decoded.archetype.brainState}</p>
                  <div className="cc-brain-state-need">
                    <strong>What your body may actually need:</strong><br />
                    {decoded.archetype.bodyNeed}
                  </div>

                  {/* Expand / collapse neuroscience facts */}
                  <button className="cc-neuro-toggle" onClick={() => setShowNeuro(v => !v)}>
                    <Brain size={10} />
                    {showNeuro ? 'Hide neuroscience' : 'Why does this craving happen? (neuroscience)'}
                  </button>

                  {showNeuro && decoded.neuroFacts.map(fact => (
                    <div key={fact.id} className="cc-neuro-fact">
                      <div className="cc-neuro-fact-title">{fact.title}</div>
                      <p className="cc-neuro-fact-body">{fact.body}</p>
                      <div className="cc-neuro-fact-brain">Brain pathway: {fact.brain}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Recipe card ── */}
              <div className="cc-recipe-card">
                <div className="cc-recipe-card-header">
                  <h2 className="cc-recipe-title">{recipe.title}</h2>
                  <div className="cc-time-badge"><Clock size={11} /> {recipe.totalTime} min</div>
                </div>
                <p className="cc-recipe-desc">{recipe.description}</p>
                <div className="cc-ingredients-list">
                  {recipe.ingredientsList.map((item, i) => (
                    <span key={i} className="cc-ingredient-tag">{item}</span>
                  ))}
                </div>

                {/* Flavor profile note — engine-driven if available */}
                <div className="cc-flavor-note">
                  <p className="cc-flavor-label"><ChefHat size={13} /> Flavor Profile Match</p>
                  <p className="cc-flavor-text">
                    {recipe.flavorNotes
                      || (decoded?.archetype
                        ? `Matched to ${decoded.archetype.label.toLowerCase()} — ${decoded.archetype.recipeDirection || 'tailored to your craving'}.`
                        : 'Matched to your craving description.')}
                  </p>
                </div>

                <span className="cc-steps-label">Steps</span>
                <div className="cc-steps">
                  {recipe.instructions.map((step, i) => (
                    <div key={i} className="cc-step">
                      <span className="cc-step-num">{i + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                {/* ── The Missing Element ── */}
                {decoded?.missingEl && (
                  <div className="cc-missing-element">
                    <div className="cc-missing-el-header">
                      <span className="cc-missing-el-icon">{decoded.missingEl.emoji}</span>
                      <div>
                        <div className="cc-missing-el-label">
                          <Lightbulb size={9} /> THE MISSING ELEMENT
                        </div>
                        <div className="cc-missing-el-secret">{decoded.missingEl.secret}</div>
                      </div>
                    </div>
                    <p className="cc-missing-el-why">{decoded.missingEl.why}</p>
                    <div className="cc-missing-el-how">
                      <strong>HOW:</strong> {decoded.missingEl.technique}
                    </div>
                  </div>
                )}

                {/* ── Seasoning Layer Guide ── */}
                {decoded?.seasoningGuide?.length > 0 && (
                  <div className="cc-seasoning-wrap">
                    <button className="cc-layers-toggle" onClick={() => setShowLayers(v => !v)}>
                      <Layers size={10} />
                      {showLayers ? 'Hide seasoning layers' : `Seasoning this dish — the layering guide (${decoded.seasoningGuide.length} key stages)`}
                    </button>

                    {showLayers && (
                      <div className="cc-seasoning-layers">
                        <div className="cc-seasoning-intro">
                          Seasoning is like putting on makeup — you do not do it all at once.
                          You build in layers. Each stage has a job. Miss one and the dish falls flat.
                        </div>
                        {decoded.seasoningGuide.map(layer => (
                          <div key={layer.stage} className="cc-seasoning-layer">
                            <div className="cc-seasoning-layer-top">
                              <span className="cc-seasoning-emoji">{layer.emoji}</span>
                              <div className="cc-seasoning-layer-info">
                                <div className="cc-seasoning-name">
                                  {layer.name}
                                  <span className="cc-makeup-tag">{layer.makeup}</span>
                                </div>
                                <div className="cc-seasoning-timing">{layer.timing}</div>
                              </div>
                            </div>
                            <div className="cc-seasoning-what">{layer.what}</div>
                            <p className="cc-seasoning-why">{layer.why}</p>
                            <div className="cc-seasoning-rule">↳ {layer.rule}</div>
                            {layer.doNot && (
                              <div className="cc-seasoning-donot">✕ {layer.doNot}</div>
                            )}
                          </div>
                        ))}

                        {/* Full 6-layer cheat sheet */}
                        <div className="cc-layer-cheatsheet">
                          <div className="cc-layer-cheatsheet-title">All 6 Layers — Quick Reference</div>
                          {SEASONING_LAYERS.map(l => (
                            <div key={l.stage} className="cc-cheat-row">
                              <span className="cc-cheat-emoji">{l.emoji}</span>
                              <span className="cc-cheat-stage">{l.stage}</span>
                              <span className="cc-cheat-name">{l.name.split('—')[0].trim()}</span>
                              <span className="cc-cheat-when">{l.timing.split(',')[0]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Timing dashboard */}
              <div className="cc-traffic-card">
                <div className="cc-traffic-bg-icon"><Car size={90} /></div>
                <div className="cc-traffic-inner">
                  <h3 className="cc-traffic-title"><Clock size={15} /> Real-Time Cook Schedule</h3>

                  <div className="cc-stats-grid">
                    <div className="cc-stat-box">
                      <span className="cc-stat-label">Drive to Store</span>
                      <span className="cc-stat-val">{plan.commuteMin}</span>
                      <span style={{ fontSize: 9, opacity: .6 }}>min</span>
                    </div>
                    <div className="cc-stat-box">
                      <span className="cc-stat-label">Prep + Cook</span>
                      <span className="cc-stat-val">{recipe.totalTime}</span>
                      <span style={{ fontSize: 9, opacity: .6 }}>min</span>
                    </div>
                    <div className="cc-stat-box-highlight">
                      <span className="cc-stat-label">Total Time</span>
                      <span className="cc-stat-val">{plan.totalMin}</span>
                      <span style={{ fontSize: 9, opacity: .6 }}>min</span>
                    </div>
                  </div>

                  {trafficAdvisory && (
                    <div className={`cc-traffic-advisory cc-traffic-advisory-${traffic.severity}`}>
                      <Car size={10} /> {trafficAdvisory}
                    </div>
                  )}

                  <div className="cc-start-box">
                    <div>
                      <span className="cc-start-label">Start Cooking At:</span>
                      <span className="cc-start-time">{fmt(plan.startCookingAt)}</span>
                      <p className="cc-start-hint">
                        Leave now → shop → cook → eating by {fmt(plan.doneEatingAt)}
                      </p>
                    </div>
                    <ArrowRight size={22} color="#6E8259" opacity={.4} />
                  </div>
                </div>
              </div>

              {/* Store comparison */}
              <div className="cc-stores-section">
                <h3 className="cc-stores-title">
                  {wanderMode
                    ? <><Compass size={16} /> Best Value Trips</>
                    : <><ShoppingCart size={16} /> Fastest Routes</>}
                </h3>
                {rankedStores.map((store, i) => (
                  <StoreCard
                    key={store.id}
                    store={store}
                    rank={i}
                    wanderMode={wanderMode}
                    traffic={traffic}
                  />
                ))}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
