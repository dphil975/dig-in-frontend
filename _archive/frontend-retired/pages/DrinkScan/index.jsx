import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Loader2, ArrowLeft, Coffee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import {
  DRINK_DB, BRANDS, detectDrinkFromImage, ALL_DRINK_KEYS,
} from './drinkKnowledgeBase';
import './DrinkScan.css';

const SIZE_ORDER = ['12oz', '16oz', '20oz', '22oz', '24oz', '28oz', '32oz'];

const SENSITIVITY_CLASS = {
  'High': 'ds-sens-high',
  'Very High': 'ds-sens-very',
  'Extreme': 'ds-sens-extreme',
  'Extreme — 0.5 ppb threshold': 'ds-sens-extreme',
  'Extreme — 2 ppb threshold, cumulative exposure concerns at high levels': 'ds-sens-extreme',
  'Extreme — detectable at 1 ppb': 'ds-sens-extreme',
  'Extreme — detectable at 2 ppb': 'ds-sens-extreme',
  'Medium': 'ds-sens-medium',
  'Low': 'ds-sens-low',
  'Low daily impact': 'ds-sens-low',
  'Varies by lactase expression': 'ds-sens-medium',
  'High — drives orange scent recognition': 'ds-sens-high',
};

function sensClass(s) {
  if (!s) return 'ds-sens-medium';
  if (s.startsWith('Extreme')) return 'ds-sens-extreme';
  if (s.startsWith('Very High')) return 'ds-sens-very';
  if (s.startsWith('High')) return 'ds-sens-high';
  if (s.startsWith('Low')) return 'ds-sens-low';
  return 'ds-sens-medium';
}

function getAvailableSizes(drink) {
  return SIZE_ORDER.filter(s => drink.sizePrices[s] != null);
}

// Fixed size key extraction (original bug: replace chain didn't produce correct key)
function getPriceForSize(drink, sizeKey) {
  return drink.sizePrices[sizeKey] != null
    ? `$${drink.sizePrices[sizeKey].toFixed(2)}`
    : 'N/A';
}

const FLAVOR_AXES = ['sweet', 'bitter', 'sour', 'salty', 'umami', 'creamy'];
const FLAVOR_COLORS = {
  sweet: '#ff6d8b',
  bitter: '#5a3a8a',
  sour: '#ffbc51',
  salty: '#4a90d9',
  umami: '#2a8a5a',
  creamy: '#ac6226',
};

export default function DrinkScan({ embedded = false } = {}) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeBrand, setActiveBrand] = useState(null); // null = all brands
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingMsg, setAnalyzingMsg] = useState('');
  const [drink, setDrink] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeTab, setActiveTab] = useState('recipe');

  function loadDrink(drinkKey) {
    const d = DRINK_DB[drinkKey];
    if (!d) return;
    setDrink(d);
    const sizes = getAvailableSizes(d);
    setSelectedSize(sizes[1] ?? sizes[0]);
    setActiveTab('recipe');
  }

  function simulateAnalysis(file, brandFilter) {
    setAnalyzing(true);
    setDrink(null);
    const msgs = [
      'Scanning drink…',
      'Identifying brand…',
      'Matching flavor compounds…',
      'Building chemistry profile…',
    ];
    let i = 0;
    setAnalyzingMsg(msgs[0]);
    const iv = setInterval(() => {
      i++;
      if (i < msgs.length) {
        setAnalyzingMsg(msgs[i]);
      } else {
        clearInterval(iv);
        const key = detectDrinkFromImage(file, brandFilter);
        setAnalyzing(false);
        loadDrink(key);
      }
    }, 700);
  }

  function handleFile(file) {
    if (!file) return;
    simulateAnalysis(file, activeBrand);
  }

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [activeBrand]);

  const onDragOver = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);

  function handleDemoClick(drinkKey) {
    simulateAnalysis({ name: drinkKey }, null);
  }

  // Drinks to show as demo buttons based on active brand filter
  const demoDrinks = ALL_DRINK_KEYS.filter(k =>
    activeBrand == null || DRINK_DB[k].brand === activeBrand
  );

  const brand = drink ? BRANDS[drink.brand] : null;
  const sizes = drink ? getAvailableSizes(drink) : [];

  return (
    <div className="ds-page">
      {!embedded && <Nav />}
      <div className="ds-header">
        {!embedded && (
          <button className="ds-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
        )}
        <div>
          <div className="ds-header-title">DRINK SCAN</div>
          <span className="ds-header-sub">Secret recipes + taste chemistry</span>
        </div>
      </div>

      <div className="ds-body">

        {/* Cross-links to the copycat lab + alcohol-free cocktail builder */}
        <button className="ds-zeroproof-link" onClick={() => navigate('/copycat')}>
          <span className="ds-zeroproof-emoji">💸</span>
          <span className="ds-zeroproof-text">
            <b>Make it at home, keep the money.</b>
            Copycat Lab — exact reverse-engineered formulas + what you save per year.
          </span>
          <span className="ds-zeroproof-arrow">→</span>
        </button>
        <button className="ds-zeroproof-link" onClick={() => navigate('/zero-proof')}>
          <span className="ds-zeroproof-emoji">🍸</span>
          <span className="ds-zeroproof-text">
            <b>Want a classic cocktail, made virgin?</b>
            Open the Zero-Proof Bar — flavor + the “happy feeling”, no alcohol.
          </span>
          <span className="ds-zeroproof-arrow">→</span>
        </button>

        {/* Brand filter tabs */}
        <div className="ds-brand-tabs">
          <button
            className={`ds-brand-tab${activeBrand == null ? ' active' : ''}`}
            style={activeBrand == null
              ? { background: '#33302A', color: '#F3EADA' }
              : {}}
            onClick={() => setActiveBrand(null)}
          >All Brands</button>
          {Object.entries(BRANDS).map(([key, b]) => (
            <button
              key={key}
              className={`ds-brand-tab${activeBrand === key ? ' active' : ''}`}
              style={activeBrand === key
                ? { background: b.color, color: '#fff', borderColor: b.color }
                : { borderColor: b.color, color: b.color }}
              onClick={() => setActiveBrand(key)}
            >{b.label}</button>
          ))}
        </div>

        {/* Upload zone */}
        {!analyzing && !drink && (
          <>
            <div
              className={`ds-upload-card${dragging ? ' dragging' : ''}`}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
            >
              <div className="ds-upload-icon">
                <Camera size={28} strokeWidth={1.5} />
                <span style={{ fontSize: 20, color: '#ede8f5' }}>|</span>
                <Upload size={22} strokeWidth={1.5} />
              </div>
              <div className="ds-upload-headline">Upload a drink photo</div>
              <div className="ds-upload-sub">
                Drop an image or click to browse.<br />
                We'll detect the brand and unlock the secret recipe.
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="ds-upload-input"
                onChange={e => handleFile(e.target.files[0])}
              />
              <button
                className="ds-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Photo
              </button>
            </div>

            <div className="ds-demo-row">
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: '#9b8ea0', alignSelf: 'center' }}>
                TRY DEMO →
              </span>
              {demoDrinks.slice(0, 5).map(key => (
                <button key={key} className="ds-demo-btn" onClick={() => handleDemoClick(key)}>
                  {DRINK_DB[key].name.split(' ').slice(0, 2).join(' ')}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Analyzing spinner */}
        {analyzing && (
          <div className="ds-analyzing">
            <div className="ds-spin" />
            <div className="ds-analyzing-label">{analyzingMsg}</div>
            <div className="ds-analyzing-sub">AI taste model running…</div>
          </div>
        )}

        {/* Result */}
        {!analyzing && drink && (
          <>
            <div className="ds-result">

              {/* Brand banner */}
              <div
                className="ds-brand-banner"
                style={{ background: brand?.bg ?? '#f0e8ff' }}
              >
                <span
                  className="ds-brand-badge"
                  style={{ color: brand?.color ?? '#5a3a8a', borderColor: brand?.color ?? '#5a3a8a' }}
                >
                  {brand?.label ?? drink.brand}
                </span>
                <div>
                  <div className="ds-result-name">{drink.name}</div>
                </div>
                <div className="ds-result-cal">{drink.calories} cal</div>
              </div>

              {/* Size selector */}
              <div className="ds-size-section">
                <div className="ds-size-label">Select Size</div>
                <div className="ds-size-row">
                  {sizes.map(sz => (
                    <button
                      key={sz}
                      className={`ds-size-btn${selectedSize === sz ? ' selected' : ''}`}
                      onClick={() => setSelectedSize(sz)}
                    >
                      {sz}
                      <span className="ds-size-price">{getPriceForSize(drink, sz)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inner tabs */}
              <div className="ds-tabs">
                {[
                  { key: 'recipe', label: 'Recipe' },
                  { key: 'chemistry', label: 'Chemistry' },
                  { key: 'timeline', label: 'Timeline' },
                ].map(t => (
                  <button
                    key={t.key}
                    className={`ds-tab-btn${activeTab === t.key ? ' active' : ''}`}
                    onClick={() => setActiveTab(t.key)}
                  >{t.label}</button>
                ))}
              </div>

              {/* RECIPE TAB */}
              {activeTab === 'recipe' && (
                <div className="ds-panel">
                  {drink.secretRecipe && (
                    <div className="ds-secret-box">
                      <div className="ds-secret-title">Secret Method</div>
                      <div className="ds-secret-body">{drink.secretRecipe.ratios}</div>
                      {drink.secretRecipe.textureTip && (
                        <div className="ds-secret-body" style={{ marginTop: 6, color: '#ffbc51' }}>
                          Texture tip: {drink.secretRecipe.textureTip}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="ds-ingredients-title">Ingredients</div>
                  <ul className="ds-ingredients-list">
                    {drink.ingredients.map((ing, i) => (
                      <li key={i} className="ds-ingredient-chip">{ing}</li>
                    ))}
                  </ul>

                  <div className="ds-steps-title">Step-by-Step</div>
                  <ol className="ds-steps-list">
                    {drink.steps.map((step, i) => (
                      <li key={i} className="ds-step">
                        <span className="ds-step-num">{i + 1}</span>
                        <span className="ds-step-text">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* CHEMISTRY TAB */}
              {activeTab === 'chemistry' && (
                <div className="ds-panel">
                  {drink.chemistry?.tasteNotes && (
                    <div className="ds-taste-notes">
                      <span className="ds-taste-notes-label">Why it tastes this way</span>
                      {drink.chemistry.tasteNotes}
                    </div>
                  )}

                  {/* Flavor profile bars */}
                  {drink.chemistry?.flavorProfile && (
                    <>
                      <div className="ds-flavor-title">Flavor Profile</div>
                      <div className="ds-flavor-bars">
                        {FLAVOR_AXES.filter(ax => drink.chemistry.flavorProfile[ax] != null).map(ax => (
                          <div key={ax} className="ds-flavor-row">
                            <span className="ds-flavor-axis">{ax}</span>
                            <div className="ds-flavor-track">
                              <div
                                className="ds-flavor-fill"
                                style={{
                                  width: `${drink.chemistry.flavorProfile[ax]}%`,
                                  background: FLAVOR_COLORS[ax] ?? '#ff6d8b',
                                }}
                              />
                            </div>
                            <span className="ds-flavor-val">{drink.chemistry.flavorProfile[ax]}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Compounds */}
                  {drink.chemistry?.compounds?.length > 0 && (
                    <>
                      <div className="ds-compounds-title">Active Compounds</div>
                      <div className="ds-compound-list">
                        {drink.chemistry.compounds.map((c, i) => (
                          <div key={i} className="ds-compound">
                            <div className="ds-compound-header">
                              <span className="ds-compound-name">{c.name}</span>
                              <span className="ds-compound-amount">{c.amount}</span>
                            </div>
                            <div className="ds-compound-receptor">
                              Receptor: {c.receptors}
                            </div>
                            <div className="ds-compound-effect">{c.effect}</div>
                            {c.sensitivity && (
                              <span className={`ds-sensitivity ${sensClass(c.sensitivity)}`}>
                                {c.sensitivity}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === 'timeline' && (
                <div className="ds-panel">
                  {drink.chemistry?.tasteNotes && (
                    <div className="ds-chem-note">{drink.chemistry.tasteNotes}</div>
                  )}

                  {drink.chemistry?.physiologicalTimeline?.length > 0 && (
                    <div className="ds-timeline">
                      {drink.chemistry.physiologicalTimeline.map((item, i) => (
                        <div key={i} className="ds-timeline-item">
                          <div className="ds-timeline-left">
                            <span className="ds-tl-icon">{item.bodyIcon}</span>
                            <div className="ds-tl-line" />
                          </div>
                          <div className="ds-timeline-content">
                            <div className="ds-tl-time">{item.time}</div>
                            <div className="ds-tl-event">{item.event}</div>
                            <div className="ds-tl-detail">{item.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Try another */}
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <button
                className="ds-upload-btn"
                style={{ flex: 1 }}
                onClick={() => { setDrink(null); setAnalyzing(false); }}
              >
                Scan Another Drink
              </button>
            </div>

            <div className="ds-disclaimer">
              Recipes are crowd-sourced copycat approximations, not official formulas.
              Chemical compound data is based on published food science research.
              Physiological effects vary by individual.
            </div>
          </>
        )}

        {/* Empty state when brand filtered with no result yet */}
        {!analyzing && !drink && activeBrand && demoDrinks.length === 0 && (
          <div className="ds-empty">
            <div className="ds-empty-title">No drinks yet</div>
            <div className="ds-empty-sub">No entries for this brand. Upload a photo to analyze.</div>
          </div>
        )}

      </div>
    </div>
  );
}
