import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import { fetchRecipes, searchRecipes } from '../../../services/api';
import { RECIPE_INGREDIENTS } from '../../../data/recipesStatic';
import { loadFlavorProfile, recordFlavorSignal } from '../../../lib/flavorProfile';
import { structuredTags } from '../../../lib/structuredTags';
import { addToShoppingList } from '../../../lib/pantryTools';
import { useSave } from '../../../hooks/useSave';
import { track } from '../../../lib/analytics';
import {
  availableCategories, matchesExplorerCategory, rankForTab, balanceRead, whySeeing,
  tileSpan, recipeCuisine, recipeIngredientNames, markSeen, seenCount,
} from '../../../lib/explorer';
import './Explorer.css';

/* Explorer — a Pinterest / Tumblr-style discovery surface on this app's real
   recipe corpus. Masonry pin grid, a deep category rail (only categories that
   actually have matches), four lenses (For You / Surprise / Trending / New), a
   real search, and an anti-repeat ranker that demotes what you've already seen
   and keeps opening doors to cuisines you don't usually get. Tap a pin for the
   honest balance read, why you're seeing it, and a one-tap shop-the-recipe.

   Honest by design: no fabricated photos, videos, creator follower-counts, or
   cross-user ratings (the corpus has none) — pins use the app's real pixel/
   category art, "trending" is your own ratings + views, and "shop" builds a
   real shopping list you own, not a checkout we don't have. */

const TABS = [
  { id: 'foryou', label: 'For You' },
  { id: 'surprise', label: 'Surprise Me' },
  { id: 'trending', label: 'Trending' },
  { id: 'new', label: 'New' },
];

const PAGE = 24;

const cleanName = (n = '') => n.replace(/\s*\([^)]*\)/g, '').trim() || n;
const rid = (r) => r?.id ?? r?.name;

// A pin's "art": the recipe's own pixel emoji if it has one, else a stable
// food glyph from its name — never a fabricated photo.
function pinArt(r) {
  if (r?.pixelEmoji) return r.pixelEmoji;
  const s = String(rid(r));
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 17 + s.charCodeAt(i)) % 7;
  return ['🍲', '🥘', '🍜', '🥗', '🍛', '🫕', '🥙'][h];
}

export default function Explorer({ embedded = false } = {}) {
  const navigate = useNavigate();
  const { isSaved, toggle } = useSave();

  const [recipes, setRecipes] = useState([]);
  const [tab, setTab] = useState('foryou');
  const [activeCat, setActiveCat] = useState(null);
  const [openGroup, setOpenGroup] = useState(null);   // which category group is expanded
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);        // search results (null = not searching)
  const [searching, setSearching] = useState(false);
  const [count, setCount] = useState(PAGE);
  const [openPin, setOpenPin] = useState(null);
  const [flash, setFlash] = useState('');
  const [seed] = useState(() => Math.floor(Date.now() / 3600000)); // stable within the hour

  const profile = useMemo(() => loadFlavorProfile(), []);

  useEffect(() => { fetchRecipes(600).then(setRecipes).catch(() => {}); }, []);

  const cats = useMemo(() => availableCategories(recipes), [recipes]);

  // The pool: search results win; else the full corpus, optionally narrowed to
  // the active category. Then ranked by the active tab (anti-repeat inside).
  const ranked = useMemo(() => {
    const base = results != null ? results : recipes;
    const pool = activeCat ? base.filter((r) => matchesExplorerCategory(r, activeCat)) : base;
    return rankForTab(pool, tab, { profile, seed });
  }, [results, recipes, activeCat, tab, profile, seed]);

  const visible = useMemo(() => ranked.slice(0, count), [ranked, count]);

  // Reset the scroll window whenever the lens/category/search changes.
  useEffect(() => { setCount(PAGE); }, [tab, activeCat, results]);

  // Record impressions (anti-repeat memory) for whatever's on screen.
  useEffect(() => {
    if (visible.length) markSeen(visible.map(rid));
  }, [visible]);

  // Infinite scroll via a sentinel at the bottom of the grid.
  const sentinel = useRef(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setCount((c) => Math.min(c + PAGE, ranked.length));
    }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [ranked.length]);

  const toast = useCallback((m) => { setFlash(m); setTimeout(() => setFlash(''), 2200); }, []);

  function onSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) { setResults(null); return; }
    setSearching(true);
    setActiveCat(null);
    searchRecipes(q).then((r) => setResults(Array.isArray(r) ? r : [])).finally(() => setSearching(false));
    track('explorer_search', { q });
  }
  function clearSearch() { setQuery(''); setResults(null); }

  function pickCat(cat) {
    setActiveCat((cur) => (cur && cur.group === cat.group && cur.value === cat.value ? null : cat));
    setResults(null); setQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openRecipe(recipe) {
    recordFlavorSignal(recipe, 'view');
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    } catch { /* ignore */ }
    navigate('/recipe');
  }

  function shopRecipe(recipe) {
    let names = recipeIngredientNames(recipe);
    if (!names.length) names = RECIPE_INGREDIENTS[recipe?.id] || [];
    if (!names.length) { toast("This recipe doesn't list its ingredients."); return; }
    addToShoppingList(names);
    recordFlavorSignal(recipe, 'save');
    toast(`Added ${names.length} ingredient${names.length !== 1 ? 's' : ''} to your shopping list`);
    track('explorer_shop', { id: rid(recipe), n: names.length });
  }

  function saveRecipe(recipe) {
    toggle(recipe);
    recordFlavorSignal(recipe, 'save');
    toast(isSaved(recipe) ? 'Removed from saved' : 'Saved to your archive');
  }

  // "More like this" → narrow to the pin's cuisine. "Show me different" → the
  // Surprise lens (the anti-taste ranker), cleared of category.
  function moreLikeThis(recipe) {
    const c = recipeCuisine(recipe);
    if (c) { setActiveCat({ group: 'cuisine', groupLabel: 'Cuisine', value: c, label: c }); setTab('foryou'); }
    setOpenPin(null); setResults(null); setQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function showDifferent() {
    setActiveCat(null); setResults(null); setQuery(''); setTab('surprise');
    setOpenPin(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const explored = seenCount();

  return (
    <div className={`xplor${embedded ? ' embedded' : ''}`}>
      {!embedded && <Nav />}

      <header className="xplor-head">
        <div>
          <h1 className="xplor-title">EXPLORE</h1>
          <p className="xplor-sub">
            Real recipes, in every niche — and a feed built to keep showing you things you
            <b> haven't</b> seen{explored > 0 ? `, not the same ${''}dishes on repeat` : ''}.
          </p>
        </div>
        {explored > 0 && <span className="xplor-explored">{explored} explored</span>}
      </header>

      <form className="xplor-search" onSubmit={onSearch}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a dish, ingredient, cuisine…  (e.g. “spicy noodles”)"
          aria-label="Search recipes"
        />
        <button type="submit">{searching ? '…' : 'Search'}</button>
        {results != null && <button type="button" className="xplor-search-clear" onClick={clearSearch}>Clear</button>}
      </form>

      {/* Lenses — For You / Surprise / Trending / New */}
      {results == null && (
        <div className="xplor-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`xplor-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Category rail — grouped, only real-match categories */}
      {results == null && cats.length > 0 && (
        <div className="xplor-cats">
          <div className="xplor-cat-groups">
            {cats.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`xplor-cat-group${openGroup === g.id ? ' open' : ''}`}
                onClick={() => setOpenGroup((o) => (o === g.id ? null : g.id))}
              >
                {g.label} <span className="xplor-cat-caret">▾</span>
              </button>
            ))}
            {activeCat && (
              <button type="button" className="xplor-cat-clear" onClick={() => setActiveCat(null)}>
                ✕ {activeCat.label}
              </button>
            )}
          </div>
          {openGroup && (
            <div className="xplor-cat-chips">
              {(cats.find((g) => g.id === openGroup)?.categories || []).map((c) => (
                <button
                  key={`${c.group}-${c.value}`}
                  type="button"
                  className={`xplor-chip${activeCat && activeCat.group === c.group && activeCat.value === c.value ? ' active' : ''}`}
                  onClick={() => pickCat(c)}
                >
                  {c.label} <span className="xplor-chip-n">{c.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {flash && <div className="xplor-flash">{flash}</div>}

      {/* The masonry pin grid */}
      {ranked.length === 0 ? (
        <p className="xplor-empty">
          {recipes.length === 0 ? 'Loading the catalogue…'
            : results != null ? `Nothing matched “${query}.” Try another ingredient or cuisine.`
            : "You've explored everything here — come back tomorrow for a fresh mix."}
        </p>
      ) : (
        <div className="xplor-grid">
          {visible.map((r) => {
            const bal = balanceRead(r);
            return (
              <button
                type="button"
                key={rid(r)}
                className={`xplor-pin ${tileSpan(r)}`}
                onClick={() => { recordFlavorSignal(r, 'view'); setOpenPin(r); }}
              >
                <span className="xplor-pin-art" aria-hidden="true">{pinArt(r)}</span>
                {r._discovery && <span className="xplor-pin-flag">NEW TO YOU</span>}
                <span className="xplor-pin-name">{cleanName(r.name)}</span>
                <span className="xplor-pin-meta">
                  {recipeCuisine(r) && <span className="xplor-pin-cuisine">{recipeCuisine(r)}</span>}
                  {bal && <span className={`xplor-pin-bal bal-${bal.key}`}>{bal.label}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
      <div ref={sentinel} className="xplor-sentinel" aria-hidden="true" />

      {/* Pin detail sheet */}
      {openPin && (
        <div className="xplor-modal" role="dialog" aria-modal="true" onClick={() => setOpenPin(null)}>
          <div className="xplor-sheet" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="xplor-sheet-x" onClick={() => setOpenPin(null)} aria-label="Close">✕</button>
            <div className="xplor-sheet-art" aria-hidden="true">{pinArt(openPin)}</div>
            <h2 className="xplor-sheet-name">{cleanName(openPin.name)}</h2>
            {recipeCuisine(openPin) && <p className="xplor-sheet-cuisine">{recipeCuisine(openPin)}</p>}

            <p className="xplor-sheet-why">💡 {whySeeing(openPin, { tab, activeCat, profile })}</p>

            {balanceRead(openPin) && (
              <div className={`xplor-sheet-bal bal-${balanceRead(openPin).key}`}>
                <b>{balanceRead(openPin).label}.</b> {balanceRead(openPin).note}
              </div>
            )}

            {openPin.description && <p className="xplor-sheet-desc">{openPin.description}</p>}

            {/* Communities this dish belongs to — tap to enter that tag's feed */}
            {structuredTags(openPin).length > 0 && (
              <div className="xplor-sheet-tags">
                {structuredTags(openPin).slice(0, 5).map((t) => (
                  <button key={t} type="button" className="xplor-sheet-tag" onClick={() => navigate(`/tag/${encodeURIComponent(t)}`)}>
                    {t}
                  </button>
                ))}
              </div>
            )}

            <div className="xplor-sheet-actions">
              <button type="button" className="xplor-btn primary" onClick={() => openRecipe(openPin)}>Cook it →</button>
              <button type="button" className="xplor-btn" onClick={() => shopRecipe(openPin)}>🛒 Shop ingredients</button>
              <button type="button" className="xplor-btn" onClick={() => saveRecipe(openPin)}>{isSaved(openPin) ? '★ Saved' : '☆ Save'}</button>
            </div>
            <div className="xplor-sheet-more">
              <button type="button" className="xplor-textbtn" onClick={() => moreLikeThis(openPin)}>More like this</button>
              <span className="xplor-dot">·</span>
              <button type="button" className="xplor-textbtn" onClick={showDifferent}>Show me something different</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
