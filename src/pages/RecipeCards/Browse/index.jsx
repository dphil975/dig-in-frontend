import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import AlchemistTeaser from '../../../components/recipe/RecipeAlchemist/Teaser';
import { quadrantOf } from '../../../lib/recipe/quadrants';
import RecipeSlipCard from '../../../components/recipe/RecipeSlipCard';
import TikTokRecipeFeed from '../../../components/recipe/RecipeReelFeed/index';
import MoodPrompt from '../../../components/recipe/MoodPrompt';
import RankRecipesModal from '../../../components/recipe/RankRecipesModal';
import { saveRecipe, getSavedRecipes } from '../../../services/saveService';
import './RecipeCards.css';
import { pushSavedRecipe, pushUnsavedRecipe } from '../../../lib/syncService';
import { track } from '../../../lib/analytics';
import { captureElement, shareOrDownload } from '../../../utils/shareImage';
import { RECIPES_STATIC, RECIPE_INGREDIENTS } from '../../../data/recipesStatic';
import { EXTRA_RECIPES } from '../../../data/extraRecipes';
import { REGIONS, REGION_BY_ID, resolveRegion } from '../../../lib/regions';
import {
  buildContext, getBehavior, ensureWeather, getCachedWeather,
  pickAllReels, totalTimeOf,
} from '../../../lib/recipeRecommender';
import { recipeFlavors, loadFlavorProfile } from '../../../lib/flavorProfile';
import { loadGoals, wellnessScore } from '../../../lib/wellnessGoals';
import { gutProfile } from '../../../lib/gutHealth';
import { loadAllergyProfile } from '../../../lib/allergyProfile';
import { getRecentlyShown, markShown } from '../../../lib/recentlyShown';
import { cleanTitle, seoDescription } from '../../../lib/seo';
import { pairingReason } from '../../../lib/flavorPairing';
import { loadRecipeBooks } from '../../../lib/recipeBooks';
import DishPixelPreview from '../../../components/recipe/DishPixelPreview';

/* ── Constants & Helpers ─ moved to ./helpers.js ───────────── */
import {
  MEALS, normalizeRecipeFile, tagAndMerge, hasRecipes, scoreDrink,
} from './helpers';
/* ── Filters ─ moved to ./filters.js ───────────────────────── */
import {
  TIME_OPTIONS, CRAVING_OPTIONS, DIET_OPTIONS, DIFFICULTY_OPTIONS,
  PREP_OPTIONS, SPEND_PRESETS, isBreadRecipe, matchesFilters,
} from './filters';
/* ── Modals + ShareIcon ─ moved to ./modals.jsx ────────────── */
import {
  RecipeDetailModal, DrinkDetailModal, DrinksModal, ShareIcon,
} from './modals';

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

      {/* Image area — pixel art of the finished dish */}
      <div className="rcard-image">
        {recipe.image
          ? <DishPixelPreview recipe={recipe} />
          : <div className="rcard-image-ph">{cuisine || 'DIG IN'}</div>}
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

/* ── Main RecipeCards page ──────────────────────────────────── */
export default function RecipeCards({ embedded = false, quadrant = null, filterExtras = null } = {}) {
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

    // Fold in recipes_full.json — a separate dataset that Nova home uses.
    // Any recipe not already in the country files gets added to its correct
    // meal bucket based on recipe_type.
    const TYPE_BUCKET = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner', snack: 'snacks', dessert: 'desserts', drink: 'snacks', bread: 'snacks' };
    try {
      const full = await loadRecipeBooks();
      if (data && full.length) {
        const seen = new Set(MEALS.flatMap(m => (data[m.key] || []).map(r => (r.name || '').toLowerCase())));
        for (const r of full) {
          const key = (r.name || '').toLowerCase();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          const bucket = TYPE_BUCKET[r.recipe_type] || 'dinner';
          (data[bucket] = data[bucket] || []).push({ ...r, _region: resolveRegion(r.country || r.cuisine, r.region) });
        }
      }
    } catch { /* non-fatal — country files already loaded */ }

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
    if (!activeFilterCount && !quadrant) return allData;
    const out = {};
    for (const m of MEALS) {
      out[m.key] = (allData[m.key] || []).filter(r => matchesFilters(r, filters) && (!quadrant || quadrantOf(r) === quadrant));
    }
    return out;
  }, [allData, filters, activeFilterCount, quadrant]);

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
      ? allFlat.filter(r => isBreadRecipe(r) && matchesFilters(r, filters) && (!quadrant || quadrantOf(r) === quadrant))
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
  }, [filteredData, activeMeal, hits, allFlat, filters, quadrant]);

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

        {/* Everything that narrows or explains the list lives behind one toggle, so
            the page opens calm: quadrant, quick picks, meal, recipes. */}
        <details className="rc-more">
          <summary>Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}</summary>
          {filterExtras}
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
        </details>


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
