import { useState, useEffect, useRef } from 'react';
import { RECIPES_STATIC } from '../../../data/recipesStatic';
import './InteractiveHeroRecipe.css';

/* ════════════════════════════════════════════════════════════
   INTERACTIVE HERO RECIPE
   One random dish from the DB. Pick ONE of 8 flavour profiles and
   the card transforms in real time — exact ingredient swaps + the
   eating experience you'll get. Apple-style scroll-snap flavour
   carousel, recipe-card visual language.
   ════════════════════════════════════════════════════════════ */

const MEAL_BUCKETS = ['breakfast', 'lunch', 'dinner', 'snacks', 'desserts'];

const DISH_KEYWORDS = [
  'pasta', 'soup', 'stew', 'rice', 'bread', 'cake', 'cookie', 'pie', 'salad',
  'chicken', 'beef', 'fish', 'shrimp', 'curry', 'noodle', 'ramen', 'taco',
  'burger', 'sandwich', 'egg', 'dumpling', 'pancake', 'tofu',
];
/** Short pixel-text tag standing in for a dish photo — the DB has no photos,
 *  so the showcase card names the closest dish category instead. */
function dishTag(recipe) {
  const t = ((recipe?.name || '') + ' ' + (recipe?.country || '')).toLowerCase();
  const hit = DISH_KEYWORDS.find(k => t.includes(k));
  return (hit || 'dish').toUpperCase();
}

const cleanTitle = (n = '') => n.replace(/\s*\([^)]*\)/g, '').trim() || n;
const ingText = (i) => (typeof i === 'object' ? (i.text || i.name || '') : String(i || ''));
function findIng(recipe, kws, fallback) {
  const hit = (recipe?.ingredients || []).map(ingText)
    .find(t => kws.some(k => t.toLowerCase().includes(k)));
  return hit ? hit.toLowerCase() : fallback;
}
const fatOf    = (r) => findIng(r, ['oil', 'butter', 'ghee', 'lard'], 'the cooking oil');
const liquidOf = (r) => findIng(r, ['water', 'broth', 'stock', 'milk', 'sauce'], 'the cooking liquid');

/* ── 8 flavour profiles — each rewrites the dish in real time ──── */
const FLAVORS = [
  { key: 'spicy', label: 'SPICY', color: '#E0A32E',
    build: (r) => ({
      swaps: [
        '+ 2 tsp gochugaru or red chili flakes',
        `Bloom a sliced chili in ${fatOf(r)} first`,
        'Finish with a spoon of chili crisp',
      ],
      exp: 'A slow-building heat that wakes up every bite — lips tingling, nose just barely running, and you keep reaching back for more.',
    }) },
  { key: 'umami', label: 'UMAMI', color: '#7a5fa0',
    build: (r) => ({
      swaps: [
        '+ 1 tbsp white miso stirred into the base',
        'Swap the salt → soy or fish sauce',
        'Grate over aged parmesan or dried-mushroom dust',
      ],
      exp: 'Deep, savoury, almost meaty — it coats the tongue and lingers, the moreish kind of depth that makes the plate vanish.',
    }) },
  { key: 'fresh', label: 'FRESH', color: '#96B36B',
    build: () => ({
      swaps: [
        '+ a fistful of torn herbs (basil, mint, cilantro)',
        'A squeeze of lime over the top',
        'Shave in raw cucumber or fennel to finish',
      ],
      exp: 'Bright and clean — it lifts the whole dish, crisp and green on the palate like a window thrown open.',
    }) },
  { key: 'sweet', label: 'SWEET', color: '#E0A32E',
    build: () => ({
      swaps: [
        'Drizzle in 1 tbsp honey or maple',
        'Caramelize the onions low and slow',
        '+ a pinch of cinnamon or a few raisins',
      ],
      exp: 'A gentle sweetness that rounds the edges — warm and comforting, savoury and sweet playing off each other in every forkful.',
    }) },
  { key: 'rich', label: 'RICH', color: '#d9a93f',
    build: (r) => ({
      swaps: [
        'Finish with a knob of butter or swirl of cream',
        '+ a handful of melted cheese',
        `Swap ${liquidOf(r)} → whole milk or coconut milk`,
      ],
      exp: 'Velvety and indulgent — it slides across the tongue and fills the whole mouth, the richness you feel in your shoulders dropping.',
    }) },
  { key: 'smoky', label: 'SMOKY', color: '#D8CAB4',
    build: () => ({
      swaps: [
        '+ 1 tsp smoked paprika or chipotle',
        'Char the veg in a dry, screaming-hot pan first',
        'A drop of liquid smoke — or grill the protein',
      ],
      exp: 'Campfire depth — smoky and a little charred, it tastes like late-summer evenings and food cooked over low embers.',
    }) },
  { key: 'tangy', label: 'TANGY', color: '#FF6D8B',
    build: () => ({
      swaps: [
        'A splash of vinegar (rice, sherry, or cider)',
        '+ a spoon of yogurt or crème fraîche',
        'Zest + juice of half a lemon at the end',
      ],
      exp: 'A sharp, mouth-watering zing that cuts the richness — it puckers your cheeks just slightly and resets your palate for the next bite.',
    }) },
  { key: 'savory', label: 'SAVORY', color: '#5d61a8',
    build: (r) => ({
      swaps: [
        'Build a base of garlic + onion sweated in fat',
        `Deglaze with stock instead of ${liquidOf(r)}`,
        '+ a bay leaf and a fresh crack of black pepper',
      ],
      exp: 'Grounded, hearty and full — the deep-seasoned flavour that tastes like someone has been cooking it all afternoon.',
    }) },
];

async function loadRandomRecipe() {
  try {
    const idx = await (await fetch('/data/recipes-index.json')).json();
    const files = idx.recipeFiles || [];
    for (let attempt = 0; attempt < 6 && files.length; attempt++) {
      const file = files[Math.floor(Math.random() * files.length)];
      const data = await (await fetch(`/data/${file}`)).json().catch(() => null);
      if (!data) continue;
      const nonEmpty = MEAL_BUCKETS.filter(b => Array.isArray(data[b]) && data[b].length);
      if (!nonEmpty.length) continue;
      const bucket = nonEmpty[Math.floor(Math.random() * nonEmpty.length)];
      const list = data[bucket];
      const r = list[Math.floor(Math.random() * list.length)];
      if (r?.name) return { ...r, country: data.country || '', region: data.region || '', _bucket: bucket };
    }
  } catch {}
  // Fallback: bundled static recipes (works fully offline)
  const r = RECIPES_STATIC[Math.floor(Math.random() * RECIPES_STATIC.length)];
  return r ? { ...r, country: r.country || r.cuisine || '' } : null;
}

const FORMATS = ['Recipe', 'Reel', 'Card', 'Steps', 'Story'];

export default function InteractiveHeroRecipe() {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const trackRef = useRef(null);

  async function shuffle() {
    setLoading(true);
    setActive(null);
    const r = await loadRandomRecipe();
    setRecipe(r);
    setLoading(false);
  }
  useEffect(() => { shuffle(); }, []);

  function scroll(dir) {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * 260, behavior: 'smooth' });
  }

  const title    = recipe ? cleanTitle(recipe.name) : '';
  const country  = recipe?.country || '';
  const flavor   = active ? FLAVORS.find(f => f.key === active) : null;
  const transform = flavor ? flavor.build(recipe) : null;

  return (
    <section className="hero-recipe">
      <div className="hero-inner">

        {/* The recipe showcase card */}
        <div className="hero-card" style={flavor ? { '--hero-accent': flavor.color } : undefined}>
          <div className="hero-image" style={flavor ? { '--hero-accent': flavor.color } : undefined}>
            <div className="hero-image-tag">{loading ? 'DISH' : dishTag(recipe)}</div>
            {country && <span className="hero-country-chip">{country}</span>}
            {flavor && <span className="hero-active-flavor" style={{ background: flavor.color }}>{flavor.label}</span>}
          </div>

          <div className="hero-body">
            {loading ? (
              <div className="hero-headline hero-loading">Plating something delicious…</div>
            ) : (
              <h2 className="hero-headline">
                This is <span className="hero-dish">{title}</span>
                {country && <> from <span className="hero-from">{country}</span></>}
              </h2>
            )}

            {/* 8 flavour profiles — Apple-style scroll-snap carousel */}
            <div className="hero-flavor-head">
              <span className="hero-flavor-label">PICK A FLAVOR PROFILE</span>
              <div className="hero-flavor-ctrls">
                <button className="hero-arrow" onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>
                <button className="hero-arrow" onClick={() => scroll(1)} aria-label="Scroll right">›</button>
              </div>
            </div>
            <div className="hero-flavor-track" ref={trackRef}>
              {FLAVORS.map(f => (
                <button
                  key={f.key}
                  className={`hero-flavor-btn${active === f.key ? ' active' : ''}`}
                  style={{ '--f-color': f.color }}
                  onClick={() => setActive(a => (a === f.key ? null : f.key))}
                  disabled={loading}
                >
                  <span className="hero-flavor-swatch" style={{ background: f.color }} />
                  <span className="hero-flavor-name">{f.label}</span>
                </button>
              ))}
            </div>

            {/* Real-time transformation */}
            {transform ? (
              <div className="hero-transform" key={active}>
                <div className="hero-transform-head" style={{ color: flavor.color }}>
                  {flavor.label} · {title}
                </div>
                <div className="hero-swaps-title">EXACT INGREDIENT SWAPS</div>
                <ul className="hero-swaps">
                  {transform.swaps.map((s, i) => (
                    <li key={i} className="hero-swap">
                      <span className="hero-swap-mark" style={{ background: flavor.color }} />
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="hero-exp-title">THE EATING EXPERIENCE</div>
                <p className="hero-exp">{transform.exp}</p>
              </div>
            ) : (
              !loading && <div className="hero-transform-hint">Tap a flavor — watch the dish transform</div>
            )}

            <button className="hero-shuffle" onClick={shuffle} disabled={loading}>
              {loading ? 'FINDING…' : 'TRY ANOTHER RECIPE'}
            </button>
          </div>
        </div>

        {/* The pitch */}
        <p className="hero-tagline">
          One recipe. <b>8 flavor profiles.</b> 5 formats. <b>Infinite combinations.</b>
        </p>
        <div className="hero-formats">
          {FORMATS.map(f => <span key={f} className="hero-format-chip">{f}</span>)}
        </div>
      </div>
    </section>
  );
}
