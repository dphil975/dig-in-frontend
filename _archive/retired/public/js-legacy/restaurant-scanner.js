/**
 * Dig In — NYC Restaurant Scanner
 *
 * Continuously rotates through NYC ZIP codes, discovers restaurants
 * via the free OpenStreetMap Overpass API, converts menu items into
 * recipe-training data, and stores everything locally + ships it to
 * the backend for AI model training.
 *
 * Usage:
 *   const scanner = new RestaurantScanner();
 *   scanner.startContinuousScan();          // rotate through all boroughs
 *   scanner.scanByZip('10036');             // scan one specific ZIP
 *   scanner.stopScan();
 *   const recipes = scanner.getDiscoveredRecipes();
 */

/* ── NYC ZIP code database (all 5 boroughs) ─────────────────────── */
const NYC_ZIPS = {
  manhattan: {
    label: 'Manhattan',
    emoji: '🗽',
    zips: [
      '10001','10002','10003','10004','10005','10006','10007','10009',
      '10010','10011','10012','10013','10014','10016','10017','10018',
      '10019','10020','10021','10022','10023','10024','10025','10026',
      '10027','10028','10029','10030','10031','10032','10033','10034',
      '10035','10036','10037','10038','10039','10040','10044',
      '10065','10069','10075','10128',
    ],
  },
  bronx: {
    label: 'Bronx',
    emoji: '🎤',
    zips: [
      '10451','10452','10453','10454','10455','10456','10457','10458',
      '10459','10460','10461','10462','10463','10464','10465','10466',
      '10467','10468','10469','10470','10471','10472','10473','10474',
      '10475',
    ],
  },
  brooklyn: {
    label: 'Brooklyn',
    emoji: '🌉',
    zips: [
      '11201','11203','11204','11205','11206','11207','11208','11209',
      '11210','11211','11212','11213','11214','11215','11216','11217',
      '11218','11219','11220','11221','11222','11223','11224','11225',
      '11226','11228','11229','11230','11231','11232','11233','11234',
      '11235','11236','11237','11238','11239',
    ],
  },
  queens: {
    label: 'Queens',
    emoji: '✈️',
    zips: [
      '11004','11005',
      '11101','11102','11103','11104','11105','11106',
      '11354','11355','11356','11357','11358','11359','11360',
      '11361','11362','11363','11364','11365','11366','11367',
      '11368','11369','11370','11371','11372','11373','11374','11375',
      '11377','11378','11379','11385',
      '11411','11412','11413','11414','11415','11416','11417','11418',
      '11419','11420','11421','11422','11423',
      '11426','11427','11428','11429','11430','11432','11433','11434',
      '11435','11436','11691','11692','11693','11694','11697',
    ],
  },
  staten_island: {
    label: 'Staten Island',
    emoji: '⛴️',
    zips: [
      '10301','10302','10303','10304','10305','10306','10307','10308',
      '10309','10310','10311','10312','10314',
    ],
  },
};

/* Flat list for iteration */
const ALL_NYC_ZIPS = Object.values(NYC_ZIPS).flatMap(b => b.zips);

/* Known approximate centers for major NYC ZIP codes — avoids geocoding delay */
const ZIP_CENTERS = {
  /* Manhattan */
  '10001': [40.7484, -73.9967], '10002': [40.7157, -73.9863], '10003': [40.7317, -73.9895],
  '10004': [40.7006, -74.0429], '10005': [40.7081, -74.0115], '10006': [40.7090, -74.0131],
  '10007': [40.7135, -74.0078], '10009': [40.7264, -73.9775], '10010': [40.7390, -73.9832],
  '10011': [40.7455, -74.0008], '10012': [40.7256, -74.0011], '10013': [40.7196, -74.0049],
  '10014': [40.7341, -74.0037], '10016': [40.7450, -73.9790], '10017': [40.7527, -73.9741],
  '10018': [40.7561, -73.9920], '10019': [40.7651, -73.9852], '10020': [40.7587, -73.9777],
  '10021': [40.7699, -73.9579], '10022': [40.7576, -73.9681], '10023': [40.7754, -73.9827],
  '10024': [40.7839, -73.9745], '10025': [40.7988, -73.9664], '10026': [40.8049, -73.9521],
  '10027': [40.8118, -73.9561], '10028': [40.7764, -73.9527], '10029': [40.7921, -73.9472],
  '10030': [40.8179, -73.9456], '10031': [40.8237, -73.9488], '10032': [40.8359, -73.9408],
  '10033': [40.8494, -73.9322], '10034': [40.8673, -73.9246], '10035': [40.7978, -73.9329],
  '10036': [40.7599, -73.9945], '10037': [40.8114, -73.9367], '10038': [40.7079, -74.0000],
  '10039': [40.8281, -73.9390], '10040': [40.8606, -73.9284], '10044': [40.7619, -73.9507],
  '10065': [40.7636, -73.9624], '10069': [40.7764, -73.9914], '10075': [40.7736, -73.9528],
  '10128': [40.7789, -73.9474],
  /* Bronx */
  '10451': [40.8191, -73.9254], '10452': [40.8357, -73.9186], '10453': [40.8491, -73.9103],
  '10454': [40.8043, -73.9182], '10455': [40.8100, -73.9099], '10456': [40.8290, -73.9103],
  '10457': [40.8441, -73.9016], '10458': [40.8627, -73.8898], '10459': [40.8239, -73.8945],
  '10460': [40.8376, -73.8810], '10461': [40.8483, -73.8494], '10462': [40.8379, -73.8608],
  '10463': [40.8804, -73.9068], '10464': [40.8674, -73.7942], '10465': [40.8258, -73.8066],
  '10466': [40.8980, -73.8494], '10467': [40.8823, -73.8735], '10468': [40.8697, -73.9020],
  '10469': [40.8728, -73.8491], '10470': [40.9003, -73.8726], '10471': [40.9002, -73.9094],
  '10472': [40.8201, -73.8724], '10473': [40.8163, -73.8556], '10474': [40.8128, -73.8869],
  '10475': [40.8738, -73.8272],
  /* Brooklyn */
  '11201': [40.6943, -73.9905], '11203': [40.6521, -73.9417], '11204': [40.6202, -73.9867],
  '11205': [40.6951, -73.9685], '11206': [40.7038, -73.9376], '11207': [40.6752, -73.8896],
  '11208': [40.6626, -73.8714], '11209': [40.6218, -74.0305], '11210': [40.6348, -73.9437],
  '11211': [40.7148, -73.9561], '11212': [40.6624, -73.9193], '11213': [40.6697, -73.9367],
  '11214': [40.6011, -73.9980], '11215': [40.6607, -73.9879], '11216': [40.6789, -73.9489],
  '11217': [40.6836, -73.9780], '11218': [40.6447, -73.9770], '11219': [40.6339, -73.9977],
  '11220': [40.6392, -74.0126], '11221': [40.6893, -73.9198], '11222': [40.7247, -73.9490],
  '11223': [40.5985, -73.9723], '11224': [40.5760, -73.9942], '11225': [40.6592, -73.9529],
  '11226': [40.6437, -73.9558], '11228': [40.6155, -74.0218], '11229': [40.5993, -73.9512],
  '11230': [40.6209, -73.9618], '11231': [40.6762, -74.0047], '11232': [40.6588, -74.0037],
  '11233': [40.6708, -73.9120], '11234': [40.6124, -73.9221], '11235': [40.5839, -73.9428],
  '11236': [40.6326, -73.9089], '11237': [40.7039, -73.9239], '11238': [40.6766, -73.9647],
  '11239': [40.6347, -73.8763],
  /* Queens */
  '11101': [40.7484, -73.9376], '11102': [40.7694, -73.9276], '11103': [40.7633, -73.9183],
  '11104': [40.7444, -73.9233], '11105': [40.7774, -73.9002], '11106': [40.7577, -73.9291],
  '11354': [40.7680, -73.8286], '11355': [40.7524, -73.8209], '11356': [40.7835, -73.8398],
  '11357': [40.7899, -73.8133], '11358': [40.7635, -73.7984], '11360': [40.7864, -73.7897],
  '11361': [40.7750, -73.7721], '11362': [40.7680, -73.7458], '11363': [40.7700, -73.7466],
  '11364': [40.7472, -73.7565], '11365': [40.7361, -73.7971], '11366': [40.7270, -73.7952],
  '11367': [40.7258, -73.8277], '11368': [40.7481, -73.8621], '11369': [40.7659, -73.8685],
  '11370': [40.7726, -73.8778], '11372': [40.7450, -73.8937], '11373': [40.7351, -73.8837],
  '11374': [40.7282, -73.8620], '11375': [40.7215, -73.8503], '11377': [40.7422, -73.9148],
  '11378': [40.7278, -73.9079], '11379': [40.7174, -73.8817], '11385': [40.7056, -73.8881],
  '11411': [40.6972, -73.7394], '11412': [40.6970, -73.7575], '11413': [40.6699, -73.7499],
  '11414': [40.6577, -73.8413], '11415': [40.7113, -73.8291], '11416': [40.6940, -73.8455],
  '11417': [40.6834, -73.8471], '11418': [40.7051, -73.8331], '11419': [40.6961, -73.8193],
  '11420': [40.6782, -73.8105], '11421': [40.6960, -73.8622], '11422': [40.6650, -73.7371],
  '11423': [40.7188, -73.7649], '11432': [40.7139, -73.7895], '11433': [40.7013, -73.7814],
  '11434': [40.6756, -73.7758], '11435': [40.7010, -73.7980], '11436': [40.6852, -73.7939],
  '11691': [40.5993, -73.7582], '11692': [40.5941, -73.7826], '11693': [40.5894, -73.8178],
  '11694': [40.5762, -73.8450], '11697': [40.5571, -73.9024],
  /* Staten Island */
  '10301': [40.6344, -74.1012], '10302': [40.6299, -74.1275], '10303': [40.6284, -74.1507],
  '10304': [40.6139, -74.0915], '10305': [40.5967, -74.0793], '10306': [40.5728, -74.1186],
  '10307': [40.5150, -74.2271], '10308': [40.5513, -74.1528], '10309': [40.5437, -74.1871],
  '10310': [40.6337, -74.1220], '10311': [40.6108, -74.1686], '10312': [40.5529, -74.1751],
  '10314': [40.6070, -74.1593],
};

/* ── Borough lookup from ZIP ─────────────────────────────────────── */
function boroughFromZip(zip) {
  for (const [key, data] of Object.entries(NYC_ZIPS)) {
    if (data.zips.includes(zip)) return { key, label: data.label, emoji: data.emoji };
  }
  return { key: 'unknown', label: 'NYC', emoji: '🗺️' };
}

/* ── Recipe type inference from restaurant cuisine ───────────────── */
const CUISINE_TO_TYPE = {
  burger: 'dinner', pizza: 'dinner', sushi: 'dinner', ramen: 'dinner',
  bbq: 'dinner', steakhouse: 'dinner', seafood: 'dinner', italian: 'dinner',
  chinese: 'dinner', japanese: 'dinner', mexican: 'dinner', indian: 'dinner',
  thai: 'dinner', vietnamese: 'dinner', korean: 'dinner', greek: 'dinner',
  mediterranean: 'dinner', turkish: 'dinner', ethiopian: 'dinner',
  diner: 'breakfast', brunch: 'breakfast', bakery: 'breakfast', cafe: 'breakfast',
  coffee: 'breakfast', donut: 'breakfast',
  sandwich: 'lunch', salad: 'lunch', deli: 'lunch', wrap: 'lunch', poke: 'lunch',
  bubble_tea: 'drink', juice: 'drink', smoothie: 'drink', ice_cream: 'dessert',
  dessert: 'dessert', pastry: 'dessert', cake: 'dessert',
  soup: 'soup', noodle: 'soup', ramen: 'soup', pho: 'soup',
};

function inferRecipeType(cuisineTag) {
  if (!cuisineTag) return 'dinner';
  const c = cuisineTag.toLowerCase();
  for (const [kw, type] of Object.entries(CUISINE_TO_TYPE)) {
    if (c.includes(kw)) return type;
  }
  return 'dinner';
}

/* ═══════════════════════════════════════════════════════════════════
   RestaurantScanner class
   ═══════════════════════════════════════════════════════════════════ */
class RestaurantScanner {
  constructor(options = {}) {
    this.apiBase         = options.apiBase         || 'http://localhost:5000';
    this.overpassApi     = options.overpassApi     || 'https://overpass-api.de/api/interpreter';
    this.radiusMeters    = options.radiusMeters    || 800;       // ~0.5 mile
    this.defaultInterval = options.intervalMs      || 45000;     // 45 s between ZIPs
    this.maxPerZip       = options.maxPerZip       || 20;

    this._timer          = null;
    this._zipQueue       = [];
    this._zipIndex       = 0;
    this._running        = false;
    this._stats          = { zipsScanned: 0, restaurantsFound: 0, recipesGenerated: 0 };

    this._log('RestaurantScanner ready. NYC ZIP codes loaded: ' + ALL_NYC_ZIPS.length);
  }

  /* ── Public API ─────────────────────────────────────────────────── */

  /** Scan a single ZIP code and return restaurant data */
  async scanByZip(zip) {
    const center = await this._getZipCenter(zip);
    if (!center) {
      this._log(`Could not locate ZIP ${zip}`);
      return [];
    }
    const borough = boroughFromZip(zip);
    this._log(`Scanning ${borough.emoji} ${zip} (${borough.label}) at ${center}`);

    const restaurants = await this._queryOverpass(center[0], center[1]);
    if (!restaurants.length) return [];

    const recipes = restaurants.flatMap(r => this._convertToRecipes(r, zip, borough));
    this._saveDiscoveries(restaurants, recipes, zip, borough);
    this._stats.zipsScanned++;
    this._stats.restaurantsFound += restaurants.length;
    this._stats.recipesGenerated += recipes.length;
    return recipes;
  }

  /**
   * Start continuous scanning. Rotates through boroughs in order,
   * one ZIP per interval. Optionally filter to specific boroughs.
   */
  startContinuousScan(boroughKeys = null, intervalMs = null) {
    if (this._running) return;
    const keys = boroughKeys || Object.keys(NYC_ZIPS);
    this._zipQueue = keys.flatMap(k => (NYC_ZIPS[k]?.zips || []));
    this._zipIndex = this._randomStartIndex();
    this._running  = true;
    const delay    = intervalMs || this.defaultInterval;

    this._log(`Starting continuous scan — ${this._zipQueue.length} ZIPs, ${delay / 1000}s interval`);
    this._tick();
    this._timer = setInterval(() => this._tick(), delay);
  }

  /** Stop continuous scanning */
  stopScan() {
    if (this._timer) clearInterval(this._timer);
    this._timer  = null;
    this._running = false;
    this._log('Scan stopped. Stats:', this._stats);
  }

  /** Is a scan running? */
  isRunning() { return this._running; }

  /** Get all discovered recipes from storage */
  getDiscoveredRecipes() {
    try {
      return JSON.parse(localStorage.getItem('dig_scanned_recipes') || '[]');
    } catch (_) { return []; }
  }

  /** Get all discovered restaurants from storage */
  getDiscoveredRestaurants() {
    try {
      return JSON.parse(localStorage.getItem('dig_scanned_restaurants') || '[]');
    } catch (_) { return []; }
  }

  /** Get current scan statistics */
  getStats() {
    return {
      ...this._stats,
      totalStoredRecipes: this.getDiscoveredRecipes().length,
      totalStoredRestaurants: this.getDiscoveredRestaurants().length,
      isRunning: this._running,
      queueLength: this._zipQueue.length,
    };
  }

  /** Get the full NYC ZIP code map */
  getZipMap() { return NYC_ZIPS; }

  /* ── Internal scan tick ──────────────────────────────────────────── */

  _tick() {
    if (!this._zipQueue.length) return;
    const zip = this._zipQueue[this._zipIndex % this._zipQueue.length];
    this._zipIndex++;
    // Scan async, don't block the interval
    this.scanByZip(zip).catch(err => this._log('Scan error:', err));
  }

  _randomStartIndex() {
    return Math.floor(Math.random() * this._zipQueue.length);
  }

  /* ── ZIP → lat/lng ───────────────────────────────────────────────── */

  async _getZipCenter(zip) {
    if (ZIP_CENTERS[zip]) return ZIP_CENTERS[zip];

    // Fall back to Nominatim geocoding (rate-limited to 1 req/sec by OSM policy)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&postalcode=${zip}&countrycodes=us&limit=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'DigIn-App/1.0' } });
      const data = await res.json();
      if (data.length) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    } catch (_) {}
    return null;
  }

  /* ── Overpass API query ──────────────────────────────────────────── */

  async _queryOverpass(lat, lng) {
    const r = this.radiusMeters;
    const query = `
      [out:json][timeout:20];
      (
        node["amenity"="restaurant"](around:${r},${lat},${lng});
        node["amenity"="cafe"](around:${r},${lat},${lng});
        node["amenity"="fast_food"](around:${r},${lat},${lng});
        node["amenity"="food_court"](around:${r},${lat},${lng});
      );
      out body ${this.maxPerZip};
    `;

    try {
      const res = await fetch(this.overpassApi, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
      });
      if (!res.ok) return [];
      const json = await res.json();

      return (json.elements || []).map(el => ({
        osm_id:   el.id,
        name:     el.tags?.name || 'Unnamed Restaurant',
        cuisine:  el.tags?.cuisine || '',
        amenity:  el.tags?.amenity || 'restaurant',
        phone:    el.tags?.phone || '',
        website:  el.tags?.website || '',
        address:  [
          el.tags?.['addr:housenumber'],
          el.tags?.['addr:street'],
          el.tags?.['addr:city'] || 'New York',
        ].filter(Boolean).join(' '),
        lat:      el.lat,
        lng:      el.lon,
        opening_hours: el.tags?.opening_hours || '',
        diet_vegan: el.tags?.['diet:vegan'] || '',
        diet_vegetarian: el.tags?.['diet:vegetarian'] || '',
        takeaway: el.tags?.takeaway || '',
        delivery: el.tags?.delivery || '',
      }));
    } catch (err) {
      this._log('Overpass error:', err);
      return [];
    }
  }

  /* ── Convert OSM restaurant to recipe-training entries ───────────── */

  _convertToRecipes(restaurant, zip, borough) {
    const cuisines = (restaurant.cuisine || '').split(';').map(c => c.trim()).filter(Boolean);
    if (!cuisines.length) cuisines.push('');

    return cuisines.map(cuisine => ({
      id:           `scan_${restaurant.osm_id}_${Date.now()}`,
      source:       'restaurant_scan',
      scanned_at:   new Date().toISOString(),
      zip_code:     zip,
      borough:      borough.label,
      restaurant: {
        name:       restaurant.name,
        osm_id:     restaurant.osm_id,
        address:    restaurant.address,
        cuisine,
        lat:        restaurant.lat,
        lng:        restaurant.lng,
        phone:      restaurant.phone,
        website:    restaurant.website,
      },
      recipe: this._generateBaseRecipe(restaurant.name, cuisine, borough),
    }));
  }

  /**
   * Generate a base recipe template from restaurant metadata.
   * Real menu data would come from a backend enrichment call,
   * but this structure feeds the AI training pipeline even without it.
   */
  _generateBaseRecipe(restaurantName, cuisine, borough) {
    const type = inferRecipeType(cuisine);
    const cuisineLabel = cuisine
      ? cuisine.charAt(0).toUpperCase() + cuisine.replace(/_/g, ' ').slice(1)
      : 'NYC';

    return {
      name:         `${cuisineLabel} Style (inspired by ${restaurantName})`,
      cuisine,
      cuisine_type: cuisine,
      recipe_type:  type,
      source_type:  'restaurant_inspiration',
      borough:      borough.label,
      description:  `A home recreation inspired by the ${cuisineLabel.toLowerCase()} cuisine found at ${restaurantName} in ${borough.label}, NYC.`,
      ingredients:  [],   // enriched by backend
      instructions: [],   // enriched by backend
      tips:         [`Original restaurant: ${restaurantName}`, `Borough: ${borough.label}`],
      allergens:    [],
      is_training_seed: true,
    };
  }

  /* ── Persist discoveries ──────────────────────────────────────────── */

  _saveDiscoveries(restaurants, recipes, zip, borough) {
    try {
      // Restaurants
      const stored = JSON.parse(localStorage.getItem('dig_scanned_restaurants') || '[]');
      const existingIds = new Set(stored.map(r => r.osm_id));
      const newOnes = restaurants.filter(r => !existingIds.has(r.osm_id));
      const merged = [...stored, ...newOnes.map(r => ({ ...r, zip, borough: borough.label }))];
      // Keep last 500
      if (merged.length > 500) merged.splice(0, merged.length - 500);
      localStorage.setItem('dig_scanned_restaurants', JSON.stringify(merged));

      // Recipes
      const storedRecipes = JSON.parse(localStorage.getItem('dig_scanned_recipes') || '[]');
      const mergedRecipes = [...storedRecipes, ...recipes];
      if (mergedRecipes.length > 1000) mergedRecipes.splice(0, mergedRecipes.length - 1000);
      localStorage.setItem('dig_scanned_recipes', JSON.stringify(mergedRecipes));
    } catch (_) {}

    // Ship to backend for enrichment + model training (fire-and-forget)
    this._sendToBackend(restaurants, zip, borough);
  }

  async _sendToBackend(restaurants, zip, borough) {
    try {
      await fetch(`${this.apiBase}/api/scanner/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip,
          borough: borough.label,
          scanned_at: new Date().toISOString(),
          restaurants: restaurants.map(r => ({
            osm_id:  r.osm_id,
            name:    r.name,
            cuisine: r.cuisine,
            address: r.address,
            lat:     r.lat,
            lng:     r.lng,
          })),
        }),
      });
    } catch (_) { /* offline — data is in localStorage */ }
  }

  /* ── Status display (can be mounted into any container) ─────────── */

  mountStatusPanel(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const render = () => {
      const s = this.getStats();
      const currentZip = this._zipQueue[this._zipIndex % this._zipQueue.length];
      const borough = boroughFromZip(currentZip || '');
      el.innerHTML = `
        <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#f4a924;margin-bottom:8px;">
          ${s.isRunning ? '🟢 SCANNING' : '⚫ IDLE'} · ${borough.emoji} ${currentZip || '—'}
        </div>
        <div style="font-family:'DotGothic16',monospace;font-size:12px;color:#ccc;line-height:1.8;">
          ZIPs scanned: ${s.zipsScanned}<br>
          Restaurants found: ${s.restaurantsFound}<br>
          Recipes generated: ${s.recipesGenerated}<br>
          Stored: ${s.totalStoredRestaurants} restaurants · ${s.totalStoredRecipes} recipes
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;">
          <button onclick="window.__digScanner?.${s.isRunning ? 'stopScan' : 'startContinuousScan'}()"
            style="font-family:'Press Start 2P',monospace;font-size:6px;background:#f4a924;color:#1a1a1a;
                   border:2px solid #1a1a1a;border-radius:4px;padding:6px 10px;cursor:pointer;">
            ${s.isRunning ? '⏹ STOP' : '▶ START'}
          </button>
        </div>
      `;
    };

    render();
    setInterval(render, 5000);
  }

  /* ── Utility ────────────────────────────────────────────────────── */

  _log(...args) {
    if (typeof console !== 'undefined') {
      console.log('[RestaurantScanner]', ...args);
    }
  }
}

/* ── Auto-init as a global for use anywhere in the app ─────────── */
if (typeof window !== 'undefined') {
  window.__digScanner = new RestaurantScanner();
}

/* Export for Node / CommonJS contexts */
if (typeof module !== 'undefined') module.exports = { RestaurantScanner, NYC_ZIPS, ALL_NYC_ZIPS };
