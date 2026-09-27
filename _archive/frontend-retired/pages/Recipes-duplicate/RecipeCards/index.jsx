import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import AlchemistTeaser from '../../../components/recipe/RecipeAlchemist/Teaser';
import RecipeSlipCard from '../../../components/recipe/RecipeSlipCard';
import TikTokRecipeFeed from '../../../components/recipe/RecipeReelFeed/index';
import MoodPrompt from '../../../components/recipe/MoodPrompt';
import RankRecipesModal from '../../../components/recipe/RankRecipesModal';
import { saveRecipe, getSavedRecipes } from '../../../services/saveService';
import './RecipeCards.css';
import {
  MissingIngredients, VeggieBoost, AdaptRecipe, ingredientText,
  ChangeRecipeToggle, applyAdaptations, changesList, SensoryCues,
} from '../../../components/recipe/RecipeBoostSections';
import { pushSavedRecipe, pushUnsavedRecipe } from '../../../lib/syncService';
import { track } from '../../../lib/analytics';
import { captureElement, shareOrDownload } from '../../../utils/shareImage';
import { RECIPES_STATIC, RECIPE_INGREDIENTS } from '../../../data/recipesStatic';
import { EXTRA_RECIPES } from '../../../data/extraRecipes';
import { REGIONS, REGION_BY_ID, resolveRegion } from '../../../lib/regions';
import { hydrationLine } from '../../../lib/hydrationCheck';
import {
  buildContext, getBehavior, ensureWeather, getCachedWeather,
  pickAllReels, totalTimeOf,
} from '../../../lib/recipeRecommender';
import { FLAVORS, recipeFlavors, loadFlavorProfile } from '../../../lib/flavorProfile';
import { loadGoals, wellnessScore, nutrientTags } from '../../../lib/wellnessGoals';
import { gutProfile } from '../../../lib/gutHealth';
import { loadAllergyProfile } from '../../../lib/allergyProfile';
import { priceRecipe } from '../../../lib/tierBudget';
import { getRecentlyShown, markShown } from '../../../lib/recentlyShown';
import { cleanTitle, seoDescription } from '../../../lib/seo';
import { pairingReason } from '../../../lib/flavorPairing';

/* ── Constants & Helpers ─────────────────────────────────────── */
const MEAL_KEYS = ['breakfast', 'lunch', 'dinner', 'snacks', 'desserts'];

const MEALS = [
  { key: 'breakfast', label: 'Breakfast', emoji: 'BREAKFAST' },
  { key: 'lunch',     label: 'Lunch',     emoji: 'LUNCH' },
  { key: 'snacks',    label: 'Snacks',    emoji: 'SNACKS' },
  { key: 'dinner',    label: 'Dinner',    emoji: 'DINNER' },
  { key: 'desserts',  label: 'Dessert',   emoji: 'DESSERT' },
];

function normalizeRecipeFile(raw) {
  const nested = Object.values(raw)[0];
  return (nested && typeof nested === 'object' && !Array.isArray(nested) && MEAL_KEYS.some(k => k in nested))
    ? nested
    : raw;
}

const EMOJI_MAP = {
  pasta: 'PASTA', soup: 'SOUP', stew: 'STEW', rice: 'RICE', bread: 'BREAD',
  cake: 'CAKE', cookie: 'COOKIE', pie: 'PIE', salad: 'SALAD',
  chicken: 'CHICKEN', beef: 'BEEF', fish: 'FISH', shrimp: 'SHRIMP',
  curry: 'CURRY', noodle: 'NOODLE', ramen: 'RAMEN', taco: 'TACO',
  burger: 'BURGER', sandwich: 'SANDWICH', default: 'DEFAULT'
};

const FLAVOR_DRINK = {
  spicy:  ['cooling','refreshing','milk-based','fruity','sweet'],
  sweet:  ['bitter','coffee','tea','light','floral'],
  savory: ['acidic','sparkling','light','citrus'],
  rich:   ['acidic','sparkling','bitter','coffee'],
  light:  ['floral','tea','citrus','sparkling'],
  earthy: ['coffee','roasted','tea','spiced'],
  smoky:  ['bold','roasted','malty'],
  tangy:  ['sweet','fruity','sparkling'],
};

const STAGE_LABELS = ['PREP', 'BUILDING', 'COOKING', 'FINISHING', 'PLATING'];

// Tag every recipe with its file's country + region, and keep meal buckets
// separate (snacks ≠ desserts). Region is resolved to one of 8 canonical ids.
function tagAndMerge(fileObjects) {
  const merged = { breakfast: [], lunch: [], dinner: [], snacks: [], desserts: [] };
  for (const top of fileObjects) {
    if (!top) continue;
    const country = top.country || '';
    const region  = top.region  || '';
    const _region = resolveRegion(country, region);
    const tag = (arr, bucket) =>
      (arr || []).forEach(r => merged[bucket].push({ ...r, country, region, _region }));
    tag(top.breakfast, 'breakfast');
    tag(top.lunch,     'lunch');
    tag(top.dinner,    'dinner');
    tag(top.snacks,    'snacks');
    tag(top.desserts,  'desserts');
  }
  return merged;
}

function hasRecipes(d) {
  return d && MEAL_KEYS.some(k => (d[k] || []).length > 0);
}

function getEmoji(recipe) {
  const text = ((recipe.name || '') + ' ' + (recipe.cuisine || '')).toLowerCase();
  for (const [k, v] of Object.entries(EMOJI_MAP)) {
    if (k !== 'default' && text.includes(k)) return v;
  }
  return EMOJI_MAP.default;
}

// Scores a drink against a recipe using every signal the menu data actually
// carries — not just a flavor-tag/description keyword match. `pairsWith`
// (cuisines/mealTypes/flavorContrast/mood) sits on every drink in
// cafe-menu.json and `pairingRules.cuisineTodrinkStyle` sits at the
// top of that same file; both used to be dead data. Wiring them in is what
// makes this "know what flavors pair well together" instead of "know one
// coffee shop's tag list."
function scoreDrink(drink, recipe, flavors, seed, pairingRules) {
  const tags = (drink.pairingTags || drink.flavorProfile || []).map(t => t.toLowerCase());
  const desc = (drink.description || '').toLowerCase();
  const pairsWith = drink.pairsWith || {};
  const cuisine = (recipe?.country || recipe?.cuisine || '').toLowerCase();
  let score = 0;

  // Broad flavor-category match (spicy → cooling/refreshing drinks, etc.)
  flavors.forEach(f => {
    (FLAVOR_DRINK[f] || []).forEach(t => { if (tags.includes(t) || desc.includes(t)) score += 2; });
  });

  // This drink explicitly lists the recipe's cuisine as a pairing
  if (cuisine && (pairsWith.cuisines || []).map(c => c.toLowerCase()).includes(cuisine)) score += 4;

  // The recipe's cuisine calls for this drink's style (coffee/tea/matcha/...)
  const styleMatches = pairingRules?.cuisineTodrinkStyle?.[cuisine] || [];
  if (styleMatches.some(s => (drink.categories || []).includes(s))) score += 3;

  // This drink is designed to cut through a flavor quality the recipe has
  (pairsWith.flavorContrast || []).forEach(c => { if (flavors.includes(c)) score += 2; });

  score += (seed * 7 + (drink.name.charCodeAt(0) || 0)) % 5 * 0.1;
  return score;
}

function generateDrinkSteps(drink) {
  const name = drink.name.toLowerCase();
  const isIced = drink.temperature === 'cold' || name.includes('iced') || name.includes('cold');
  const isEspresso = name.includes('espresso') || name.includes('americano') || name.includes('latte') || name.includes('cappuccino');
  const isTea = name.includes('tea') || name.includes('matcha') || name.includes('chai');
  const isJuice = name.includes('juice') || name.includes('smoothie');
  const isChocolate = name.includes('chocolate') || name.includes('mocha') || name.includes('cocoa');
  if (isEspresso && !isIced) return ['Pull a fresh espresso shot, about 25–30 seconds.', 'Steam milk to 65°C with silky microfoam.', `Combine in the correct ratio for a ${drink.name}.`, 'Serve immediately while hot.'];
  if (isEspresso && isIced) return ['Pull 1–2 espresso shots and cool for 1 minute.', 'Fill a glass with ice.', 'Pour espresso over ice.', name.includes('latte') ? 'Add cold milk to taste.' : 'Add cold water or milk and serve.'];
  if (isTea) return ['Heat water to the correct temperature.', `Steep ${drink.name} for 2–4 minutes.`, isIced ? 'Pour over ice and sweeten if desired.' : 'Remove tea and serve hot.'];
  if (isJuice) return ['Gather and wash ingredients.', 'Juice or blend until smooth.', 'Strain if desired, pour over ice.', 'Serve immediately.'];
  if (isChocolate) return ['Heat milk until steaming.', 'Whisk in cocoa powder or melted chocolate.', 'Sweeten to taste.', 'Top with whipped cream and serve.'];
  return [`Prepare all ingredients for ${drink.name}.`, 'Combine in the correct proportions.', 'Stir or shake gently.', 'Serve at the appropriate temperature.'];
}

/* ── StepItem ───────────────────────────────────────────────── */
function StepItem({ step, index }) {
  const [done, setDone] = useState(false);
  return (
    <div className={`step-item${done ? ' done' : ''}`} onClick={() => setDone(!done)}>
      <div className="step-num">{index + 1}</div>
      <div className="step-text">{step}</div>
    </div>
  );
}

/* ── FlipCard ───────────────────────────────────────────────── */
function FlipCard({ step, index, total, recipe, isActive }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!isActive) setFlipped(false);
  }, [isActive]);

  const ratio = index / Math.max(total - 1, 1);
  const stage = STAGE_LABELS[Math.min(Math.floor(ratio * STAGE_LABELS.length), STAGE_LABELS.length - 1)];
  const emoji = getEmoji(recipe);

  return (
    <div className={`flip-card${flipped ? ' flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
      <div className="flip-inner">
        <div className="flip-front">
          <div className="flip-step-header">STEP {index + 1} OF {total}</div>
          <div className="flip-step-text">{step}</div>
          <div className="flip-hint">TAP TO FLIP</div>
        </div>
        <div className="flip-back">
          <div className="flip-stage-emoji">{emoji}</div>
          <div className="flip-stage-label">{stage}</div>
          <div className="flip-visual-text">You're in the {stage.toLowerCase()} phase — keep going!</div>
        </div>
      </div>
    </div>
  );
}

/* ── RecipeDetailModal — the tap-to-open recipe experience ───── */
function RecipeDetailModal({ recipe, onClose, onAllDrinksClick, onFindStores, onFullRecipe }) {
  const [missing, setMissing] = useState(() => new Set());
  const [veggies, setVeggies] = useState(() => new Set());
  const [adapt, setAdapt] = useState(() => new Set());
  const [applied, setApplied] = useState(false);

  const ingsRaw = recipe.ingredients?.length ? recipe.ingredients : (RECIPE_INGREDIENTS[recipe.id] || []);
  const ings = ingsRaw.map(ingredientText).filter(Boolean);
  const totalTime = totalTimeOf(recipe);
  const changes = changesList(veggies, adapt);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const toggleSet = (setter) => (key) => setter(s => {
    const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n;
  });

  const shoppingList = [...[...missing].map(i => ings[i]), ...veggies].filter(Boolean);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-head">
          <div className="modal-head-title">{recipe.name || 'Recipe'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">

          {/* Quick facts (emoji-free) */}
          <div className="modal-facts">
            {recipe._regionMeta && <span className="modal-fact">{recipe._regionMeta.label}</span>}
            {recipe.country && <span className="modal-fact">{recipe.country}</span>}
            {recipe.difficulty && <span className="modal-fact">{recipe.difficulty}</span>}
            {totalTime > 0 && <span className="modal-fact">{totalTime} min</span>}
            {recipe.servings && <span className="modal-fact">Serves {recipe.servings}</span>}
          </div>

          {(recipe.description || recipe.notes) && <p className="modal-desc">{recipe.description || recipe.notes}</p>}

          {/* One-line hydration read — the compact counterpart to RecipeFull's
              HydrationPanel, off the same engine so the two surfaces can't
              disagree. Renders nothing unless this recipe has a real driver. */}
          {hydrationLine({ ingredients: ings }) && (
            <p className="modal-hydration">💧 {hydrationLine({ ingredients: ings })}</p>
          )}

          {/* Interactive sections */}
          <MissingIngredients ings={ings} missing={missing} onToggle={toggleSet(setMissing)} />
          <VeggieBoost added={veggies} onToggle={toggleSet(setVeggies)} />
          <AdaptRecipe active={adapt} onToggle={toggleSet(setAdapt)} />
          <SensoryCues recipe={recipe} />

          {/* Change-the-recipe toggle — your choices carry into the full recipe */}
          <ChangeRecipeToggle on={applied} count={changes.length} onToggle={() => setApplied(a => !a)} />

          {/* Steps now live on the full recipe page, where the finished dish and
              method render properly. This modal stays a quick-customize view. */}
          <div className="rd-steps-moved">
            <span className="rd-steps-moved-txt">
              {changes.length
                ? `${changes.length} change${changes.length !== 1 ? 's' : ''} ready — open the full recipe to cook with them.`
                : 'Open the full recipe for the step-by-step method.'}
            </span>
          </div>

          {/* Bottom actions */}
          <div className="rd-actions">
            {onAllDrinksClick && (
              <button className="rd-btn rd-drinks-alt" onClick={() => onAllDrinksClick(recipe)}>DRINKS</button>
            )}
            <button className="rd-btn rd-find-stores" onClick={() => onFindStores(shoppingList)}>
              FIND STORES{shoppingList.length ? ` · ${shoppingList.length}` : ''}
            </button>
            <button
              className="rd-btn rd-full-recipe"
              onClick={() => onFullRecipe(recipe, {
                missing: [...missing], veggies: [...veggies], adapt: [...adapt], applied,
              })}
            >
              FULL RECIPE →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── DrinkDetailModal ───────────────────────────────────────── */
function DrinkDetailModal({ drink, onClose }) {
  const steps = generateDrinkSteps(drink);
  const tags = [...(drink.flavorProfile || []), ...(drink.pairingTags || [])].slice(0, 6);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="drink-detail-box">
        <div className="drink-detail-head">
          <div className="drink-detail-title">{drink.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="drink-detail-body">
          <p className="drink-detail-desc">{drink.description || ''}</p>
          <ol className="drink-detail-steps">
            {steps.map((s, i) => (
              <li key={i}>
                <span className="drink-step-num">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <div className="drink-detail-tags">
            {tags.map(t => <span key={t} className="drink-detail-tag">{t}</span>)}
          </div>
          {drink.price && <div className="drink-detail-price">${drink.price.toFixed(2)}</div>}
        </div>
      </div>
    </div>
  );
}

/* ── DrinksModal ────────────────────────────────────────────── */
function DrinksModal({ recipe, drinksData, onClose, onDrinkClick }) {
  const [activeCat, setActiveCat] = useState('all');
  const [drinkSeed, setDrinkSeed] = useState(Date.now());

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const flavors = recipeFlavors(recipe);
  const cats = [
    { id: 'all', label: 'ALL' },
    ...(drinksData?.drinkCategories || []).map(c => ({ id: c.id, label: c.label }))
  ];

  let drinks = (drinksData?.drinks || []).filter(d => d.available !== false);
  if (activeCat !== 'all') {
    drinks = drinks.filter(d =>
      (d.category || d.section || '') === activeCat || (d.categories || []).includes(activeCat)
    );
  }
  // Show every drink that matches the filter, ranked best-pairing-first —
  // "ALL DRINKS" used to mean "the top 9," capped regardless of how many
  // actually matched. The grid itself scrolls, so there's no reason to
  // truncate the list before the user even sees it.
  drinks = drinks
    .map(d => ({ ...d, _score: scoreDrink(d, recipe, flavors, drinkSeed, drinksData?.pairingRules) }))
    .sort((a, b) => b._score - a._score);

  return (
    <div className="modal-overlay drinks-drawer-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="drinks-modal-box" role="dialog" aria-label={`Drink pairings for ${recipe.name}`}>
        <div className="drinks-modal-head">
          <div className="drinks-modal-title">DRINKS · {recipe.name}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="drinks-flavor-strip">
          {flavors.length
            ? flavors.map(f => <span key={f} className="flavor-tag">{f.toUpperCase()}</span>)
            : <span style={{fontSize:'12px',color:'rgba(250,235,215,0.7)'}}>Neutral — all drinks pair well</span>
          }
        </div>

        <div className="drinks-cat-bar">
          {cats.map(c => (
            <button
              key={c.id}
              className={`drinks-cat-pill${c.id === activeCat ? ' active' : ''}`}
              onClick={() => setActiveCat(c.id)}
            >
              {c.label.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="drinks-grid-modal">
          {drinks.length ? drinks.map(d => (
            <div
              key={d.id}
              className={`drink-modal-card${d.featured ? ' featured' : ''}`}
              onClick={() => onDrinkClick(d)}
            >
              <div className="dmc-head">
                <span className="dmc-name">{d.name}</span>
                <span style={{fontSize:'9px', color:'#999'}}>{d.temp === 'hot' ? 'HOT' : d.temp === 'iced' || d.temp === 'cold' ? 'ICED' : ''}</span>
              </div>
              <div className="dmc-body">{d.description || ''}</div>
              <div className="dmc-reason">{pairingReason(d, recipe, flavors)}</div>
              {d.price && <div className="dmc-price">${d.price.toFixed(2)}</div>}
            </div>
          )) : (
            <p style={{color:'#999',fontSize:'12px',padding:'10px'}}>No drinks match this filter.</p>
          )}
        </div>

        <button className="drinks-remix-btn" onClick={() => setDrinkSeed(Date.now() + Math.random() * 9999)}>
          Remix Pairings
        </button>
      </div>
    </div>
  );
}

/* ── Share icon (crisp inline SVG — no emoji, no external asset) ─ */
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
      <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
    </svg>
  );
}

/* ── RegionCard — detailed recipe card (carousel + grid) ──────
   Exported so Home's discover grid can render the exact same card
   (same markup, same RecipeCards.css rules) instead of a second,
   drifting card style. */
export function RegionCard({ recipe, hits, savedRecipes, drinksData, onHit, onSave, onOpen, onDrinksClick }) {
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const isSaved = savedRecipes.some(r => r.name === recipe.name);
  const t = totalTimeOf(recipe);
  const region = recipe._regionMeta;
  const cuisine = recipe.country || recipe.cuisine || '';
  const seo = seoDescription(recipe);
  const flavors = recipeFlavors(recipe);

  const cardSeed = useRef(Date.now()).current;
  const previewDrinks = drinksData
    ? (drinksData.drinks || [])
        .map(d => ({ ...d, _s: scoreDrink(d, recipe, flavors, cardSeed, drinksData.pairingRules) }))
        .sort((a, b) => b._s - a._s)
        .slice(0, 2)
    : [];

  function open() { onHit(recipe); onOpen(recipe); }

  async function handleShare(e) {
    e.stopPropagation();
    if (!cardRef.current || sharing) return;
    setSharing(true);
    try {
      const slug = (recipe.name || 'recipe').replace(/\s+/g, '-').toLowerCase();
      const dataUrl = await captureElement(cardRef.current, { backgroundColor: '#221a33' });
      await shareOrDownload(dataUrl, {
        filename: `dig-in-${slug}.png`,
        title:    recipe.name || 'Dig In Recipe',
        text:     `${recipe.name} — found on Dig In`,
      });
    } catch {} finally { setSharing(false); }
  }

  return (
    <div className="reel-card" ref={cardRef} onClick={open} role="button" tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && open()}>

      {/* Header */}
      <div className="rcard-header">
        {recipe._topPick && <span className="rcard-flag rcard-flag-top">TOP PICK</span>}
        {recipe._wellnessMatch && !recipe._topPick && <span className="rcard-flag rcard-flag-wellness">WELLNESS PICK</span>}
        {recipe._gutFriendly && !recipe._topPick && !recipe._wellnessMatch && <span className="rcard-flag rcard-flag-gut">GUT-FRIENDLY</span>}
        {recipe._bonus && !recipe._topPick && !recipe._wellnessMatch && !recipe._gutFriendly && <span className="rcard-flag rcard-flag-bonus">BONUS</span>}
        <div className="rcard-name">{cleanTitle(recipe.name) || 'Recipe'}</div>
        {seo && <p className="rcard-seo-head">{seo}</p>}
        <div className="rcard-tags">
          {region && <span className="rcard-tag">{region.label}</span>}
          {t > 0 && <span className="rcard-tag">{t}min</span>}
        </div>
      </div>

      {/* Image area — reserved space, shows a photo when available */}
      <div className="rcard-image">
        {recipe.image && <img src={recipe.image} alt={recipe.name} loading="lazy"
          onError={(e) => { e.target.style.display = 'none'; }} />}
        <div className="rcard-image-ph" style={recipe.image ? { position: 'absolute', inset: 0 , zIndex: -1 } : undefined}>
          {cuisine || 'DIG IN'}
        </div>
      </div>

      {/* Body */}
      <div className="rcard-body">
        <div className="rcard-stats">
          <div className="rcard-stat">
            <div className="rcard-stat-l">PREP</div>
            <div className="rcard-stat-v">{recipe.prepTime ? recipe.prepTime + ' min' : '—'}</div>
          </div>
          <div className="rcard-stat">
            <div className="rcard-stat-l">COOK</div>
            <div className="rcard-stat-v">{recipe.cookTime ? recipe.cookTime + ' min' : '—'}</div>
          </div>
          <div className="rcard-stat">
            <div className="rcard-stat-l">DIFFICULTY</div>
            <div className="rcard-stat-v">{recipe.difficulty || '—'}</div>
          </div>
          <div className="rcard-stat">
            <div className="rcard-stat-l">SERVING</div>
            <div className="rcard-stat-v">{recipe.servings || '—'}</div>
          </div>
        </div>

        {previewDrinks.length > 0 && (
          <div className="rcard-section">
            <div className="rcard-pairs-head">
              <span className="rcard-section-title">PAIRS WITH</span>
              {flavors.length > 0 && <span className="rcard-flavors">{flavors.slice(0, 3).join(' · ')}</span>}
            </div>
            <div className="rcard-drinks">
              {previewDrinks.map(d => (
                <button key={d.id} className="rcard-drink"
                  onClick={e => { e.stopPropagation(); onDrinksClick(recipe); }}
                  title={pairingReason(d, recipe, flavors)}>
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="rcard-spacer" />

        <div className="rcard-actions" onClick={e => e.stopPropagation()}>
          <button className="rcard-btn rcard-btn-steps" onClick={open}>OPEN</button>
          {drinksData && (
            <button className="rcard-btn rcard-btn-drinks" onClick={() => onDrinksClick(recipe)}>ALL DRINKS</button>
          )}
          <button className="rcard-btn-icon" onClick={handleShare} disabled={sharing} title="Share">
            <ShareIcon />
          </button>
          <button
            className={`rcard-btn-icon${isSaved ? ' liked' : ''}`}
            onClick={() => onSave(recipe)}
            title={isSaved ? 'Saved' : 'Save'}
          >
            {isSaved ? '♥' : '♡'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Reel — one horizontal, Apple-style carousel per meal ───── */
// A meal is a COMPACT carousel: at most this many cards in the peek strip,
// with an "expand all" that opens the full scrolling catalogue for that meal.
const REEL_PEEK = 8;

function Reel({ meal, recipes, total = 0, onShuffle, onExpandAll, cardProps }) {
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const shown = recipes.slice(0, REEL_PEEK);
  const more = Math.max(0, (total || recipes.length) - shown.length);
  const canExpand = more > 0;

  function updateEdges() {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }
  useEffect(() => { updateEdges(); }, [recipes]);

  function scroll(dir) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('.reel-card');
    const step = card ? card.offsetWidth + 18 : 300;
    el.scrollBy({ left: dir * step * 2, behavior: 'smooth' });
  }

  return (
    <section className="mreel">
      <div className="mreel-head">
        <h2 className="mreel-title">{meal.label}{total ? <span className="mreel-count"> · {total}</span> : null}</h2>
        <div className="reel-controls">
          {canExpand && (
            <button className="reel-expand" onClick={() => onExpandAll(meal.key)} title={`See all ${total} ${meal.label.toLowerCase()}`}>
              EXPAND ALL
            </button>
          )}
          <button className="reel-shuffle" onClick={() => onShuffle(meal.key)} title="Re-roll picks">SHUFFLE</button>
          <button className="reel-arrow" onClick={() => scroll(-1)} disabled={atStart} aria-label="Scroll left">‹</button>
          <button className="reel-arrow" onClick={() => scroll(1)} disabled={atEnd} aria-label="Scroll right">›</button>
        </div>
      </div>

      <div className="reel-track" ref={trackRef} onScroll={updateEdges}>
        {shown.length
          ? shown.map((r, i) => (
              <RegionCard key={`${meal.key}-${r.id || r.name}-${i}`} recipe={r} {...cardProps} />
            ))
          : <div className="reel-empty">No {meal.label.toLowerCase()} recipes loaded yet.</div>}
        {/* The last card in the peek strip opens the full scrolling list. */}
        {canExpand && (
          <button className="reel-more-card" onClick={() => onExpandAll(meal.key)}>
            <span className="reel-more-plus">+{more}</span>
            <span className="reel-more-txt">see all<br />{meal.label.toLowerCase()}</span>
          </button>
        )}
      </div>
    </section>
  );
}

/* ── Filtering (time / craving / soup / cuisine / dietary) ───── */
const TIME_OPTIONS = [
  { key: '15', label: '≤15 MIN' },
  { key: '30', label: '≤30 MIN' },
  { key: '60', label: '60+ MIN' },
];
const CRAVING_OPTIONS = FLAVORS; // the shared 8-flavor vocabulary (see lib/flavorProfile)
const DIET_OPTIONS = ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free'];
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'];
const PREP_OPTIONS = [
  { key: 'quick',  label: 'QUICK ≤20' },
  { key: 'normal', label: 'NORMAL 20–45' },
  { key: 'long',   label: 'LONG 45+' },
];
// Prep-time bucket — uses prepTime when available, else falls back to total time.
function prepBucket(r) {
  const p = r.prepTime || totalTimeOf(r);
  if (!p) return null;
  if (p <= 20) return 'quick';
  if (p <= 45) return 'normal';
  return 'long';
}

// Ingredients that disqualify a recipe from each diet/allergy tag.
const DIET_EXCLUDE = {
  'vegan':       ['butter','milk','cream','cheese','egg','honey','gelatin','pork','chicken','beef','fish','lamb','turkey','lard','meat','tuna','salmon','shrimp','bacon','ham','yogurt','dashi','bonito','mayo'],
  'vegetarian':  ['pork','chicken','beef','fish','lamb','turkey','gelatin','lard','meat','tuna','salmon','shrimp','anchovy','bacon','ham','dashi','bonito'],
  'gluten-free': ['flour','spaghetti','pasta','wheat','barley','rye','breadcrumb','panko','couscous','noodle','udon','ramen','orzo','bread','soy sauce'],
  'dairy-free':  ['butter','milk','cream','cheese','yogurt','mayo'],
  'nut-free':    ['almond','peanut','cashew','walnut','pecan','hazelnut','pistachio'],
};
// "Budget Friendly" (Home's Discover Highlights carousel) — a real cost
// filter, not a vibe: under $2/serving at the budget tier's store/brand
// routing (tierBudget.js's priceRecipe). Validated against the real
// 575-recipe corpus before picking $2 — 59.5% qualify, a real filter, not
// "everything is budget friendly."
const BUDGET_THRESHOLD = 2.00;
function isBudgetFriendly(recipe) {
  const lines = (recipe.ingredients || []).map(i => (typeof i === 'object' ? (i.text || i.name || '') : i)).filter(Boolean);
  if (!lines.length) return false;
  return priceRecipe(lines, recipe, 'budget').perServing <= BUDGET_THRESHOLD;
}

/* "What can you spend?" — the single, merged budget interface. It used to
   live on Home twice (a preset widget AND SmartFinder's second ZIP slider);
   in the Tumblr rebuild it moved here to Cook, where money is the actual
   question, as ONE control. Costed per serving at budget-tier stores/brands
   via the same priceRecipe engine, memoized because the grid re-filters on
   every keystroke and priceRecipe walks the whole ingredient list. */
const SPEND_PRESETS = [3, 5, 8, 12];
const _spendCache = new Map();
function perServingCost(recipe) {
  const key = recipe?.id || recipe?.name;
  if (key && _spendCache.has(key)) return _spendCache.get(key);
  const lines = (recipe?.ingredients || []).map(i => (typeof i === 'object' ? (i.text || i.name || '') : i)).filter(Boolean);
  // No ingredients means we can't honestly price it — never claim it fits.
  const cost = lines.length ? priceRecipe(lines, recipe, 'budget').perServing : Infinity;
  if (key) _spendCache.set(key, cost);
  return cost;
}

// "Boy Dinner" — dinner-type, easy, high-protein (reuses wellnessGoals.js's
// existing nutrient-tag rule rather than a second protein keyword list).
function isBoyDinner(recipe) {
  const type = (recipe.recipe_type || '').toLowerCase();
  if (type !== 'dinner' && type !== 'lunch') return false;
  if ((recipe.difficulty || '').toLowerCase() === 'hard') return false;
  return nutrientTags(recipe.ingredients).some(t => t.id === 'high-protein');
}

// "Bread" — not one of RecipeCards' 5 meal buckets (breakfast/lunch/dinner/
// snacks/desserts derive from each country file's own top-level arrays, and
// none of them is "bread"), so this is a keyword/recipe_type match over the
// full flattened pool instead of a 6th permanent tab — see activeMeal
// handling in fullList below.
const BREAD_KEYWORDS = /\bbread\b|\bbun\b|\bbaguette\b|\bfocaccia\b|\bbiscuit\b|\bbagel\b|\bchallah\b|\bbrioche\b|\bnaan\b|flatbread|\bpita\b|\broll\b/i;
function isBreadRecipe(recipe) {
  if ((recipe.recipe_type || '').toLowerCase() === 'bread') return true;
  return BREAD_KEYWORDS.test(recipe.name || '');
}

function getDietTags(recipe) {
  const text = (recipe.ingredients || [])
    .map(i => (typeof i === 'object' ? (i.text || i.name || '') : i)).join(' ').toLowerCase();
  if (!text.trim()) return [];   // unknown ingredients → make no diet claims
  return Object.entries(DIET_EXCLUDE)
    .filter(([, excl]) => !excl.some(k => text.includes(k)))
    .map(([tag]) => tag);
}

function matchesFilters(r, f) {
  if (f.time) {
    const t = totalTimeOf(r);
    if (f.time === '15' && !(t > 0 && t <= 15)) return false;
    if (f.time === '30' && !(t > 0 && t <= 30)) return false;
    if (f.time === '60' && !(t >= 60)) return false;
  }
  if (f.soup) {
    const txt = ((r.name || '') + ' ' + (r.recipe_type || '') + ' ' + (r.mealType || '')).toLowerCase();
    if (!/soup|stew|broth|chowder|bisque/.test(txt)) return false;
  }
  if (f.craving.size) {
    const flavors = recipeFlavors(r);
    if (![...f.craving].some(c => flavors.includes(c))) return false;
  }
  if (f.cuisine.size && !f.cuisine.has((r.country || r.cuisine || '').toLowerCase())) return false;
  if (f.source && f.source.size && !f.source.has((r.source || '').toLowerCase())) return false;
  if (f.difficulty && f.difficulty.size && !f.difficulty.has((r.difficulty || '').toLowerCase())) return false;
  if (f.prep && prepBucket(r) !== f.prep) return false;
  if (f.diet.size) {
    const tags = getDietTags(r);
    if (![...f.diet].every(d => tags.includes(d))) return false;
  }
  if (f.gutFriendly && !gutProfile(r.ingredients)?.isGutFriendly) return false;
  if (f.budgetOnly && !isBudgetFriendly(r)) return false;
  if (f.maxSpend != null && perServingCost(r) > f.maxSpend) return false;
  if (f.highProteinEasy && !isBoyDinner(r)) return false;
  return true;
}

/* ── Main RecipeCards page ──────────────────────────────────── */
export default function RecipeCards({ embedded = false } = {}) {
  const [allData, setAllData]           = useState(null);
  const [drinksData, setDrinksData]     = useState(null);
  const [loading, setLoading]           = useState(true);
  const [activeMeal, setActiveMeal]     = useState('all');
  const [hits, setHits]                 = useState(() => JSON.parse(localStorage.getItem('dig_in_hits') || '{}'));
  const [saved, setSaved]               = useState(() => JSON.parse(localStorage.getItem('dig_in_saved') || '[]'));
  const [seeds, setSeeds]               = useState({});
  const [weather, setWeather]           = useState(() => getCachedWeather());
  const [stepsRecipe, setStepsRecipe]   = useState(null);
  const [slipRecipe, setSlipRecipe]     = useState(null);
  const [drinksRecipe, setDrinksRecipe] = useState(null);
  const [drinkDetail, setDrinkDetail]   = useState(null);
  const [filters, setFilters]           = useState({ time: null, prep: null, soup: false, gutFriendly: false, budgetOnly: false, maxSpend: null, highProteinEasy: false, difficulty: new Set(), craving: new Set(), cuisine: new Set(), diet: new Set(), source: new Set() });
  const [spendDraft, setSpendDraft]     = useState('');
  const [openPanel, setOpenPanel]       = useState(null);   // 'cuisine' | 'diet' | 'source' | null
  const [cravingPrefs, setCravingPrefs] = useState(() => loadFlavorProfile());
  const [gridPage, setGridPage]         = useState(1);
  const [visitSeed]                     = useState(() => Math.random().toString(36).slice(2, 10));
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [moodPromptOpen, setMoodPromptOpen] = useState(false);
  const [rankRecipes, setRankRecipes] = useState(null); // the 5 picked recipes, awaiting rank
  const navigate = useNavigate();
  const location = useLocation();

  /* ── Filter setters ───────────────────────────────────────── */
  const setTime    = (t) => setFilters(f => ({ ...f, time: f.time === t ? null : t }));
  const setPrep    = (p) => setFilters(f => ({ ...f, prep: f.prep === p ? null : p }));
  const toggleSoup = ()  => setFilters(f => ({ ...f, soup: !f.soup }));
  const toggleGutFriendly = () => setFilters(f => ({ ...f, gutFriendly: !f.gutFriendly }));
  const toggleInSet = (key, val) => setFilters(f => {
    const n = new Set(f[key]); n.has(val) ? n.delete(val) : n.add(val); return { ...f, [key]: n };
  });
  const toggleCraving = (c) => {
    const adding = !filters.craving.has(c);
    toggleInSet('craving', c);
    // The AI learns: each time you reach for a craving, it remembers.
    if (adding) setCravingPrefs(p => {
      const np = { ...p, [c]: (p[c] || 0) + 1 };
      try { localStorage.setItem('dig_in_craving_prefs', JSON.stringify(np)); } catch {}
      return np;
    });
  };
  const hasFlaggedAllergens = useMemo(() => Object.keys(loadAllergyProfile()).length > 0, []);
  const setMaxSpend = (n) => {
    setFilters(f => ({ ...f, maxSpend: n }));
    setSpendDraft(n == null ? '' : String(n));
  };
  const clearFilters = () => { setFilters({ time: null, prep: null, soup: false, gutFriendly: false, budgetOnly: false, maxSpend: null, highProteinEasy: false, difficulty: new Set(), craving: new Set(), cuisine: new Set(), diet: new Set(), source: new Set() }); setSpendDraft(''); };
  const activeFilterCount = (filters.time ? 1 : 0) + (filters.prep ? 1 : 0) + (filters.soup ? 1 : 0) + (filters.gutFriendly ? 1 : 0)
    + (filters.budgetOnly ? 1 : 0) + (filters.maxSpend != null ? 1 : 0) + (filters.highProteinEasy ? 1 : 0)
    + filters.difficulty.size + filters.craving.size + filters.cuisine.size + filters.diet.size + filters.source.size;

  useEffect(() => { boot(); }, []);
  useEffect(() => { setGridPage(1); }, [activeMeal]);

  // Deep-link support for Home's Discover Highlights carousel — a real
  // filter pre-applied, not just a link to an unfiltered page. Reads once on
  // mount; ?diet=gluten-free / ?time=15 map straight onto existing filters,
  // ?special=... covers the carousel items that don't have a 1:1 filter
  // (Nibblers/Boy Dinner, Bread, Budget Friendly).
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const diet = params.get('diet');
    const time = params.get('time');
    const special = params.get('special');
    if (!diet && !time && !special) return;

    setFilters(f => {
      const next = { ...f, diet: new Set(f.diet) };
      if (diet) next.diet.add(diet);
      if (time) next.time = time;
      if (special === 'budget') next.budgetOnly = true;
      if (special === 'boy-dinner') next.highProteinEasy = true;
      if (special === 'nibblers') next.time = '15';
      return next;
    });
    if (special === 'nibblers') setActiveMeal('snacks');
    else if (special === 'boy-dinner') setActiveMeal('dinner');
    else if (special === 'bread') setActiveMeal('bread');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save the shopping list and head to the commute-route map, which finds
  // stores that carry these items near the user's ZIP.
  function handleFindStores(items) {
    try {
      localStorage.setItem('dig_in_shopping_list', JSON.stringify(items || []));
      localStorage.removeItem('dig_in_shopping_picked');   // fresh trip
    } catch {}
    navigate('/craving-compass');
  }

  // Open the dedicated full-page recipe view, carrying the user's customizations
  // (missing ingredients, veggie boosts, adaptations) so the full recipe shows
  // the added ingredients and the updated steps.
  function handleFullRecipe(recipe, adaptations) {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.setItem('dig_in_full_recipe_adapt', JSON.stringify(adaptations || null));
    } catch {}
    navigate('/recipe');
  }

  // Fetch real weather (Open-Meteo, keyless) once, then re-rank reels
  useEffect(() => {
    let alive = true;
    ensureWeather().then(w => { if (alive) setWeather(w); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  async function boot() {
    let fileObjects = null;
    const params = new URLSearchParams(window.location.search);
    const dataFile = params.get('data');

    // Optional single-file override (?data=foo.json)
    if (dataFile) {
      try {
        const raw = await (await fetch(`/data/${dataFile}`)).json();
        fileObjects = [normalizeRecipeFile(raw)];
      } catch {}
    }

    // Primary: load the full country index and merge (tagging region)
    let data = fileObjects ? tagAndMerge(fileObjects) : null;
    if (!hasRecipes(data)) {
      try {
        const idx = await (await fetch('/data/recipes-index.json')).json();
        const results = await Promise.allSettled(
          (idx.recipeFiles || []).map(f =>
            fetch(`/data/${f}`).then(r => r.json()).then(normalizeRecipeFile)
          )
        );
        data = tagAndMerge(results.filter(r => r.status === 'fulfilled').map(r => r.value));
      } catch {}
    }

    // Fallback: localStorage + bundled static recipes
    if (!hasRecipes(data)) {
      const lsRecipes = JSON.parse(localStorage.getItem('dig_in_recipes') || '[]');
      const combined = [...lsRecipes];
      const existing = new Set(combined.map(r => (r.name || '').toLowerCase()));
      for (const r of RECIPES_STATIC) {
        if (!existing.has(r.name.toLowerCase())) {
          combined.push({ ...r, ingredients: r.ingredients || RECIPE_INGREDIENTS[r.id] || [] });
        }
      }
      const inBucket = (r, ...kw) => {
        const rt = (r.recipe_type || '').toLowerCase();
        const mt = (r.mealType || '').toLowerCase();
        return kw.some(k => rt.includes(k) || mt.includes(k));
      };
      const withRegion = r => ({ ...r, _region: resolveRegion(r.country || r.cuisine, r.region) });
      data = {
        breakfast: combined.filter(r => inBucket(r, 'breakfast')).map(withRegion),
        lunch:     combined.filter(r => inBucket(r, 'lunch')).map(withRegion),
        dinner:    combined.filter(r => inBucket(r, 'dinner', 'soup')).map(withRegion),
        snacks:    combined.filter(r => inBucket(r, 'snack')).map(withRegion),
        desserts:  combined.filter(r => inBucket(r, 'dessert', 'drink')).map(withRegion),
      };
    }

    // Fold in the extra (former cookbook) recipes — region-tagged, deduped by name
    if (data) {
      const seen = new Set(MEALS.flatMap(m => (data[m.key] || []).map(r => (r.name || '').toLowerCase())));
      for (const r of EXTRA_RECIPES) {
        const key = (r.name || '').toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const bucket = r.mealBucket || 'dinner';
        (data[bucket] = data[bucket] || []).push({ ...r, _region: resolveRegion(r.country, r.region) });
      }
    }

    setAllData(data);

    try {
      setDrinksData(await (await fetch('/data/cafe-menu.json')).json());
    } catch {}

    setLoading(false);
  }

  function recordHit(recipe) {
    const key = recipe.id || recipe.name;
    const newHits = { ...hits, [key]: (hits[key] || 0) + 1 };
    setHits(newHits);
    localStorage.setItem('dig_in_hits', JSON.stringify(newHits));
    track('recipe_viewed', { recipe_id: key, recipe_name: recipe.name, region: recipe._region });
  }

  // Mood prompt (shown before Discover opens): sets today's craving filter,
  // reusing the exact same filters.craving → ctx.cravings → scoreRecipe
  // pipeline the craving chips already drive.
  function applyMood(mood) {
    if (mood) {
      setFilters(f => ({ ...f, craving: new Set([mood]) }));
      setCravingPrefs(p => {
        const np = { ...p, [mood]: (p[mood] || 0) + 1 };
        try { localStorage.setItem('dig_in_craving_prefs', JSON.stringify(np)); } catch {}
        return np;
      });
    }
    setMoodPromptOpen(false);
    setDiscoverOpen(true);
  }

  // After the swipe feed collects PICK_TARGET picks and the user ranks them:
  // #1 opens the full recipe, the rest get auto-saved to Profile so nothing's lost.
  function confirmRanking(ranked) {
    const [first, ...rest] = ranked;
    rest.forEach(r => saveRecipe(r));
    setSaved(getSavedRecipes());
    setRankRecipes(null);
    setCravingPrefs(loadFlavorProfile());
    if (first) handleFullRecipe(first);
  }

  function toggleSave(recipe) {
    const idx = saved.findIndex(r => r.name === recipe.name);
    const saving = idx === -1;
    const newSaved = saving ? [...saved, recipe] : saved.filter((_, i) => i !== idx);
    setSaved(newSaved);
    localStorage.setItem('dig_in_saved', JSON.stringify(newSaved));
    if (saving) {
      pushSavedRecipe(recipe);
      track('recipe_saved', { recipe_name: recipe.name, region: recipe._region });
    } else {
      pushUnsavedRecipe(recipe);
    }
  }

  // All recipes flat — used to learn behaviour
  const allFlat = useMemo(() => {
    if (!allData) return [];
    return MEALS.flatMap(m => allData[m.key] || []);
  }, [allData]);

  const behavior = useMemo(() => getBehavior(allFlat, hits), [allFlat, hits]);
  const ctx = useMemo(
    () => buildContext({ weather, behavior, cravings: filters.craving, cravingPrefs }),
    [weather, behavior, filters.craving, cravingPrefs],
  );

  // Distinct cuisines present in the data (for the cuisine filter chips)
  const cuisineOptions = useMemo(() => {
    const set = new Set();
    for (const r of allFlat) { const c = (r.country || r.cuisine || '').trim(); if (c) set.add(c); }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [allFlat]);

  // Distinct "sources" present (e.g. fast-casual copycats) for the Source filter
  const sourceOptions = useMemo(() => {
    const set = new Set();
    for (const r of allFlat) { const s = (r.source || '').trim(); if (s) set.add(s); }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [allFlat]);

  // Apply the active filters to every meal bucket
  const filteredData = useMemo(() => {
    if (!allData) return null;
    if (!activeFilterCount) return allData;
    const out = {};
    for (const m of MEALS) out[m.key] = (allData[m.key] || []).filter(r => matchesFilters(r, filters));
    return out;
  }, [allData, filters, activeFilterCount]);

  // Build all 5 reels — recompute when data, context, hits or shuffle change.
  // The seed is picked fresh on every mount (not just once per day) so the
  // recipes on display actually change each time you land on this page —
  // still weighted by scoreRecipe (weather/behavior/popularity/flavor
  // profile), just never the same static picks visit after visit.
  //
  // lastReelKeysRef holds whatever was on screen before this recompute, fed
  // in as an avoid-list so hitting SHUFFLE is *guaranteed* to swap every
  // meal's recipes rather than just being statistically likely to.
  const lastReelKeysRef = useRef({});
  const reels = useMemo(() => {
    if (!filteredData) return {};
    // Union this render's immediate avoid-list with the cross-session
    // "recently shown" log — otherwise a recipe avoided on one shuffle can
    // simply reappear on the next, since lastReelKeysRef only remembers the
    // single prior render.
    const recent = getRecentlyShown();
    const avoidByMeal = {};
    for (const m of MEALS) {
      avoidByMeal[m.key] = new Set([...(lastReelKeysRef.current[m.key] || []), ...recent]);
    }
    return pickAllReels(
      filteredData,
      MEALS.map(m => m.key),
      ctx, hits,
      meal => `${visitSeed}-${seeds[meal] || 0}`,
      avoidByMeal,
    );
  }, [filteredData, ctx, hits, seeds, visitSeed]);

  useEffect(() => {
    const next = {};
    const allKeys = [];
    for (const m of MEALS) {
      const keys = (reels[m.key] || []).map(r => r.id || r.name);
      next[m.key] = new Set(keys);
      allKeys.push(...keys);
    }
    lastReelKeysRef.current = next;
    markShown(allKeys);
  }, [reels]);

  const totalRecipes = allFlat.length;
  const shuffle = (meal) => setSeeds(s => ({ ...s, [meal]: (s[meal] || 0) + 1 }));

  const cardProps = {
    hits, savedRecipes: saved, drinksData,
    onHit: recordHit, onSave: toggleSave,
    onOpen: setSlipRecipe, onDrinksClick: setDrinksRecipe,
  };

  // Recommendation banner bits
  const tempF = Math.round((ctx.weather.tempC * 9) / 5 + 32);
  const timeLabel = ctx.now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const behaviorLabel = {
    short:  'You usually cook quick',
    long:   'You go for big cook-ups',
    medium: 'You like mid-length recipes',
    any:    'Learning your taste…',
  }[behavior.speed];

  // When a single meal is selected, build the FULL list of every recipe in
  // that bucket (not just the 8-per-region reel), grouped by region order
  // then by popularity then name.
  const fullList = useMemo(() => {
    if (!filteredData || activeMeal === 'all') return [];
    const order = Object.fromEntries(REGIONS.map((r, i) => [r.id, i]));
    // Active wellness goals nudge the within-region ranking (additive, on
    // top of hits) — 0 for the majority of users who haven't set any, so
    // the sort is identical to before for them. See lib/wellnessGoals.js.
    const goals = loadGoals();
    // "Bread" isn't one of the 5 real meal buckets (see isBreadRecipe's
    // comment) — sourced from the full flattened pool instead, with the
    // normal filters still applied on top.
    const baseList = activeMeal === 'bread'
      ? allFlat.filter(r => isBreadRecipe(r) && matchesFilters(r, filters))
      : (filteredData[activeMeal] || []);
    return baseList
      .map(r => {
        const wMatch = goals.length > 0 && wellnessScore(r.ingredients, goals) > 0;
        const gutMatch = gutProfile(r.ingredients)?.isGutFriendly === true;
        return { ...r, _regionMeta: REGION_BY_ID[r._region] || null, _wellnessMatch: wMatch, _gutFriendly: gutMatch };
      })
      .sort((a, b) => {
        const ra = order[a._region] ?? 99, rb = order[b._region] ?? 99;
        if (ra !== rb) return ra - rb;
        const wa = goals.length ? wellnessScore(a.ingredients, goals) * 2 : 0;
        const wb = goals.length ? wellnessScore(b.ingredients, goals) * 2 : 0;
        const ha = (hits[a.id || a.name] || 0) + wa, hb = (hits[b.id || b.name] || 0) + wb;
        if (hb !== ha) return hb - ha;
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [filteredData, activeMeal, hits, allFlat, filters]);

  const activeMealMeta = MEALS.find(m => m.key === activeMeal)
    || (activeMeal === 'bread' ? { key: 'bread', label: 'Bread', emoji: 'BREAD' } : null);

  return (
    <div>
      {!embedded && <Nav />}
      <div className="recipe-cards-page">
        <div className="page-header">
          <div className="page-title">DIG-IN RECIPES</div>
          <div className="page-sub">8 picks per region · refreshed for right now</div>
        </div>

        {/* What can you spend? — the single, merged budget interface, now at
            the top of Cook (it used to sit on Home twice). Costed per serving
            at budget-tier stores; the grid below only shows what actually
            fits. FoodMap's store deals cover the "cheapest place to buy"
            half — this covers the "what can I cook for $X" half. */}
        <div className="spendbar">
          <span className="spendbar-q">What can you spend?</span>
          <div className="spendbar-controls">
            {SPEND_PRESETS.map(n => (
              <button
                key={n}
                type="button"
                className={`spendbar-chip${filters.maxSpend === n ? ' active' : ''}`}
                onClick={() => setMaxSpend(filters.maxSpend === n ? null : n)}
              >${n}</button>
            ))}
            <span className="spendbar-or">or</span>
            <div className="spendbar-input">
              <span>$</span>
              <input
                type="number" min="1" step="0.50" inputMode="decimal" placeholder="your number"
                aria-label="Maximum spend per serving"
                value={spendDraft}
                onChange={(e) => {
                  const v = e.target.value; setSpendDraft(v);
                  const n = parseFloat(v);
                  setFilters(f => ({ ...f, maxSpend: Number.isFinite(n) && n > 0 ? n : null }));
                }}
              />
              <span className="spendbar-unit">a serving</span>
            </div>
            {filters.maxSpend != null && (
              <button type="button" className="spendbar-reset" onClick={() => setMaxSpend(null)}>Any price</button>
            )}
          </div>
          {filters.maxSpend != null && (
            <p className="spendbar-result">
              {fullList.length > 0
                ? <>Showing <b>{fullList.length}</b> {fullList.length === 1 ? 'recipe' : 'recipes'} you can make for <b>${filters.maxSpend.toFixed(2)} a serving</b> or less.</>
                : <>Nothing comes in under ${filters.maxSpend.toFixed(2)} a serving yet — try a little higher.</>}
            </p>
          )}
        </div>

        {/* Recommendation context banner */}
        <div className="reco-banner">
          <span className="reco-chip">{timeLabel}</span>
          <span className="reco-chip">{tempF}°F{ctx.weather.estimated ? ' · est' : ''}</span>
          <span className="reco-chip">{behaviorLabel}</span>
          {totalRecipes > 0 && <span className="reco-chip reco-chip-count">{totalRecipes} recipes loaded</span>}
        </div>

        {/* TikTok-style discovery: an endless, swipeable, one-at-a-time feed
            that re-ranks live off the same 8-flavor profile as the grid. */}
        <button className="discover-cta" onClick={() => setMoodPromptOpen(true)}>
          DISCOVER — swipe recipes picked for your taste
        </button>

        {/* Meal filter */}
        <div className="filter-bar">
          <button
            className={`filter-pill${activeMeal === 'all' ? ' active' : ''}`}
            onClick={() => setActiveMeal('all')}
          >✦ ALL</button>
          {MEALS.map(m => (
            <button
              key={m.key}
              className={`filter-pill${activeMeal === m.key ? ' active' : ''}`}
              onClick={() => setActiveMeal(m.key)}
            >
              {m.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* The store map moved to the Commute tab (2026-07-29) — a detailed
            Leaflet map belongs with routing/check-ins, not above recipes, where
            it answered no question the cook was asking. See CommuteRoute. */}

        {/* Refine: an Apple-style horizontal nav — a row of
            plain category tabs, one shared dropdown panel opens below
            whichever tab is active instead of every option being visible
            at once. */}
        <nav className="refine-nav" aria-label="Refine recipes">
          <div className="refine-nav-bar">
            <button
              className={`refine-nav-item${openPanel === 'time' ? ' open' : ''}${filters.time ? ' has-value' : ''}`}
              onClick={() => setOpenPanel(p => (p === 'time' ? null : 'time'))}
            >TIME</button>
            <button
              className={`refine-nav-item${openPanel === 'prep' ? ' open' : ''}${filters.prep ? ' has-value' : ''}`}
              onClick={() => setOpenPanel(p => (p === 'prep' ? null : 'prep'))}
            >PREP</button>
            <button
              className={`refine-nav-item${openPanel === 'difficulty' ? ' open' : ''}${filters.difficulty.size ? ' has-value' : ''}`}
              onClick={() => setOpenPanel(p => (p === 'difficulty' ? null : 'difficulty'))}
            >DIFFICULTY</button>
            <button
              className={`refine-nav-item${openPanel === 'craving' ? ' open' : ''}${filters.craving.size ? ' has-value' : ''}`}
              onClick={() => setOpenPanel(p => (p === 'craving' ? null : 'craving'))}
            >CRAVING</button>
            <button
              className={`refine-nav-item${filters.soup ? ' has-value' : ''}`}
              onClick={toggleSoup}
            >SOUP</button>
            <button
              className={`refine-nav-item${openPanel === 'gut' ? ' open' : ''}${filters.gutFriendly ? ' has-value' : ''}`}
              onClick={() => setOpenPanel(p => (p === 'gut' ? null : 'gut'))}
            >GUT HEALTH ▾</button>
            <button
              className={`refine-nav-item${openPanel === 'cuisine' ? ' open' : ''}${filters.cuisine.size ? ' has-value' : ''}`}
              onClick={() => setOpenPanel(p => (p === 'cuisine' ? null : 'cuisine'))}
            >CUISINE{filters.cuisine.size ? ` · ${filters.cuisine.size}` : ''} ▾</button>
            <button
              className={`refine-nav-item${openPanel === 'diet' ? ' open' : ''}${filters.diet.size ? ' has-value' : ''}`}
              onClick={() => setOpenPanel(p => (p === 'diet' ? null : 'diet'))}
            >DIETARY{filters.diet.size ? ` · ${filters.diet.size}` : ''} ▾</button>
            {sourceOptions.length > 0 && (
              <button
                className={`refine-nav-item${openPanel === 'source' ? ' open' : ''}${filters.source.size ? ' has-value' : ''}`}
                onClick={() => setOpenPanel(p => (p === 'source' ? null : 'source'))}
              >SOURCE{filters.source.size ? ` · ${filters.source.size}` : ''} ▾</button>
            )}

            {activeFilterCount > 0 && (
              <button className="refine-nav-clear" onClick={clearFilters}>CLEAR ({activeFilterCount})</button>
            )}
          </div>

          {openPanel && (
            <div className="refine-nav-dropdown">
              {openPanel === 'time' && TIME_OPTIONS.map(t => (
                <button key={t.key} className={`refine-pill${filters.time === t.key ? ' active' : ''}`}
                  onClick={() => setTime(t.key)}>{t.label}</button>
              ))}
              {openPanel === 'prep' && PREP_OPTIONS.map(p => (
                <button key={p.key} className={`refine-pill${filters.prep === p.key ? ' active' : ''}`}
                  onClick={() => setPrep(p.key)}>{p.label}</button>
              ))}
              {openPanel === 'difficulty' && DIFFICULTY_OPTIONS.map(d => (
                <button key={d} className={`refine-pill${filters.difficulty.has(d) ? ' active' : ''}`}
                  onClick={() => toggleInSet('difficulty', d)}>{d.toUpperCase()}</button>
              ))}
              {openPanel === 'craving' && CRAVING_OPTIONS.map(c => (
                <button key={c} className={`refine-pill${filters.craving.has(c) ? ' active' : ''}`}
                  onClick={() => toggleCraving(c)}>{c.toUpperCase()}</button>
              ))}
              {openPanel === 'cuisine' && (
                cuisineOptions.length
                  ? cuisineOptions.map(c => (
                      <button key={c} className={`refine-chip${filters.cuisine.has(c.toLowerCase()) ? ' active' : ''}`}
                        onClick={() => toggleInSet('cuisine', c.toLowerCase())}>{c}</button>
                    ))
                  : <span className="refine-panel-empty">Loading cuisines…</span>
              )}
              {openPanel === 'diet' && DIET_OPTIONS.map(d => (
                <button key={d} className={`refine-chip${filters.diet.has(d) ? ' active' : ''}`}
                  onClick={() => toggleInSet('diet', d)}>{d}</button>
              ))}
              {openPanel === 'gut' && (
                <div className="refine-gut-panel">
                  <button
                    type="button"
                    className={`refine-pill${filters.gutFriendly ? ' active' : ''}`}
                    onClick={toggleGutFriendly}
                  >{filters.gutFriendly ? '✓ GUT-FRIENDLY ONLY' : 'SHOW GUT-FRIENDLY ONLY'}</button>
                  <p className="refine-gut-blurb">
                    "Gut friendly" is a buzzword on most packaging — here it means five specific, real things:
                    fermented foods (live cultures), fiber (feeds gut bacteria, which produce short-chain fatty
                    acids), polyphenols, and plant diversity — weighed against added sugar, refined flour, and
                    other things research links to lower gut microbiome diversity. Open any recipe for the full
                    breakdown and the science behind it.
                  </p>
                  {hasFlaggedAllergens && (
                    <p className="refine-gut-allergy">
                      You've flagged allergens in your profile — some gut-friendly picks (fermented dairy, wheat
                      sourdough, soy-based miso/tempeh) commonly overlap with them.{' '}
                      <button type="button" className="refine-gut-allergy-link" onClick={() => navigate('/allergies')}>
                        Check your allergy profile →
                      </button>
                    </p>
                  )}
                </div>
              )}
              {openPanel === 'source' && sourceOptions.map(s => (
                <button key={s} className={`refine-chip${filters.source.has(s.toLowerCase()) ? ' active' : ''}`}
                  onClick={() => toggleInSet('source', s.toLowerCase())}>{s}</button>
              ))}
            </div>
          )}
        </nav>

        {/* Kitchen Alchemist lives on the Invent tab now (its one real home,
            not duplicated here too) — this is just a way in. */}
        <AlchemistTeaser />

        {loading && <div className="recipe-count">LOADING RECIPES…</div>}

        {/* ALL → one recommended region reel per meal */}
        {!loading && activeMeal === 'all' && MEALS.map(m => (
          <Reel
            key={m.key}
            meal={m}
            recipes={reels[m.key] || []}
            total={(filteredData?.[m.key] || []).length}
            onShuffle={shuffle}
            onExpandAll={setActiveMeal}
            cardProps={cardProps}
          />
        ))}

        {/* A specific meal → paginated FULL catalogue for that meal */}
        {!loading && activeMeal !== 'all' && activeMealMeta && (() => {
          const PAGE_SIZE = 20;
          const pageCount = Math.max(1, Math.ceil(fullList.length / PAGE_SIZE));
          const safePage  = Math.min(gridPage, pageCount);
          const pageSlice = fullList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
          const goTo = (p) => { setGridPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

          // Build page number array — always show first + last, collapse middle runs
          const pageNums = [];
          for (let i = 1; i <= pageCount; i++) {
            if (i === 1 || i === pageCount || Math.abs(i - safePage) <= 1) pageNums.push(i);
            else if (pageNums[pageNums.length - 1] !== '…') pageNums.push('…');
          }

          return (
            <section className="mreel">
              <div className="mreel-head">
                <h2 className="mreel-title">
                  {activeMealMeta.label.toUpperCase()} · {fullList.length} recipes
                </h2>
                <button className="reel-shuffle" onClick={() => setActiveMeal('all')}>← BACK TO REELS</button>
              </div>

              {fullList.length ? (
                <>
                  <div className="reel-grid">
                    {pageSlice.map((r, i) => (
                      <RegionCard key={`${r.id || r.name}-${i}`} recipe={r} {...cardProps} />
                    ))}
                  </div>

                  {pageCount > 1 && (
                    <div className="grid-pagination">
                      <button
                        className="gpag-arrow"
                        disabled={safePage === 1}
                        onClick={() => goTo(safePage - 1)}
                        aria-label="Previous page"
                      >‹</button>

                      <div className="gpag-nums">
                        {pageNums.map((n, i) =>
                          n === '…'
                            ? <span key={`ellipsis-${i}`} className="gpag-ellipsis">…</span>
                            : <button
                                key={n}
                                className={`gpag-num${n === safePage ? ' active' : ''}`}
                                onClick={() => goTo(n)}
                              >{n}</button>
                        )}
                      </div>

                      <button
                        className="gpag-arrow"
                        disabled={safePage === pageCount}
                        onClick={() => goTo(safePage + 1)}
                        aria-label="Next page"
                      >›</button>
                    </div>
                  )}
                </>
              ) : (
                <div className="reel-empty">No {activeMealMeta.label.toLowerCase()} recipes loaded yet.</div>
              )}
            </section>
          );
        })()}

        {/* Tapping a card opens the split slip card (map + preview) */}
        {slipRecipe && (
          <RecipeSlipCard
            recipe={slipRecipe}
            onClose={() => setSlipRecipe(null)}
            onViewSteps={(r) => { setSlipRecipe(null); setStepsRecipe(r); }}
            onFullRecipe={(r) => { setSlipRecipe(null); handleFullRecipe(r); }}
          />
        )}

        {stepsRecipe && (
          <RecipeDetailModal
            recipe={stepsRecipe}
            onClose={() => setStepsRecipe(null)}
            onAllDrinksClick={(r) => { setStepsRecipe(null); setDrinksRecipe(r); }}
            onFindStores={handleFindStores}
            onFullRecipe={handleFullRecipe}
          />
        )}

        {drinksRecipe && (
          <DrinksModal
            recipe={drinksRecipe}
            drinksData={drinksData}
            onClose={() => setDrinksRecipe(null)}
            onDrinkClick={(drink) => { setDrinksRecipe(null); setDrinkDetail(drink); }}
          />
        )}

        {drinkDetail && (
          <DrinkDetailModal drink={drinkDetail} onClose={() => setDrinkDetail(null)} />
        )}

        {moodPromptOpen && (
          <MoodPrompt
            dayPart={ctx.dayPart}
            onPick={applyMood}
            onClose={() => setMoodPromptOpen(false)}
          />
        )}

        {discoverOpen && (
          <TikTokRecipeFeed
            recipes={allFlat}
            ctx={ctx}
            hits={hits}
            savedRecipes={saved}
            onSave={toggleSave}
            onFiveRanked={(picked) => {
              setDiscoverOpen(false);
              setRankRecipes(picked);
            }}
            onClose={() => {
              setDiscoverOpen(false);
              setCravingPrefs(loadFlavorProfile()); // pull in whatever the feed just learned
            }}
          />
        )}

        {rankRecipes && (
          <RankRecipesModal
            recipes={rankRecipes}
            onConfirm={confirmRanking}
            onClose={() => setRankRecipes(null)}
          />
        )}
      </div>
    </div>
  );
}
