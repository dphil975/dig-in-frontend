import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../../../../components/shell/Nav';
import { getSavedRecipes, unsaveRecipe, exportData, getCookHistory } from '../../../../services/saveService';
import { expiringItems } from '../../../../lib/freshness';
import NovaReaction from '../../../../components/nova/NovaReaction';
import './MyCookbook.css';

const CUISINE_EMOJI = {
  italian: 'ITALIAN', mexican: 'MEXICAN', japanese: 'JAPANESE', chinese: 'CHINESE',
  indian: 'INDIAN', french: 'FRENCH', thai: 'THAI', american: 'AMERICAN',
  mediterranean: 'MEDITERRAN', greek: 'GREEK', korean: 'KOREAN', vietnamese: 'VIETNAMESE',
  spanish: 'SPANISH', caribbean: 'CARIBBEAN', middle_eastern: 'MIDDLE', ethiopian: 'ETHIOPIAN',
};

function cuisineEmoji(cuisine) {
  if (!cuisine) return 'DISH';
  const lc = cuisine.toLowerCase().replace(/[\s-]/g, '_');
  const match = Object.keys(CUISINE_EMOJI).find(k => lc.includes(k));
  return match ? CUISINE_EMOJI[match] : 'DISH';
}

function parseMinutes(timeStr) {
  if (!timeStr) return null;
  const s = String(timeStr).toLowerCase();
  const n = parseInt(s.replace(/[^\d]/g, ''), 10);
  if (isNaN(n)) return null;
  return s.includes('hour') || s.includes('hr') ? n * 60 : n;
}

function timeLabel(mins) {
  if (mins === null) return null;
  if (mins < 30) return 'quick';
  if (mins <= 60) return 'medium';
  return 'feast';
}

function recipeCuisine(r) {
  return r?.cuisine || r?.cuisine_type || r?.category || null;
}

function recipeTime(r) {
  return r?.time || r?.totalTime || r?.prepTime || r?.cookTime || null;
}

function recipeDietary(r) {
  const tags = r?.dietary_tags || r?.tags || r?.dietary || [];
  return Array.isArray(tags) ? tags : [];
}

function recipeSteps(r) {
  const s = r?.steps || r?.instructions || [];
  return Array.isArray(s) ? s : [];
}

function recipeIngredients(r) {
  const i = r?.ingredients || [];
  return Array.isArray(i) ? i : [];
}

function recipeKey(r) { return r?.id || r?.name || ''; }

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free'];
const TIME_BINS = [
  { key: 'quick', label: 'Quick <30 min' },
  { key: 'medium', label: '30–60 min' },
  { key: 'feast', label: 'Feast 1h+' },
];
const SORT_OPTIONS = [
  { key: 'saved',    label: 'Recently Saved' },
  { key: 'name',     label: 'Name A–Z' },
  { key: 'time',     label: 'Quickest First' },
];

export default function MyCookbook({ embedded = false } = {}) {
  const [recipes, setRecipes]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQ, setSearchQ]         = useState('');
  const [cuisineFilter, setCuisineFilter] = useState(null);
  const [timeFilter, setTimeFilter]   = useState(null);
  const [dietFilters, setDietFilters] = useState(new Set());
  const [sortBy, setSortBy]           = useState('saved');
  const [expandedKey, setExpandedKey] = useState(null);

  useEffect(() => {
    const local = getSavedRecipes();
    setRecipes(local);
    setLoading(false);

    const uid = localStorage.getItem('dig_in_user_id');
    if (!uid) return;
    fetch(`/api/users/saved-recipes?user_id=${encodeURIComponent(uid)}`, {
      signal: AbortSignal.timeout(6000),
    })
      .then(r => r.json())
      .catch(() => null)
      .then(remote => {
        if (!Array.isArray(remote) || remote.length === 0) return;
        const current = getSavedRecipes();
        const keys = new Set(current.map(recipeKey));
        const merged = [...current];
        for (const r of remote) {
          const k = recipeKey(r);
          if (k && !keys.has(k)) { merged.push(r); keys.add(k); }
        }
        if (merged.length !== current.length) {
          localStorage.setItem('dig_in_saved', JSON.stringify(merged));
          setRecipes(merged);
        }
      });
  }, []);

  const cuisines = useMemo(() => {
    const seen = new Set();
    for (const r of recipes) {
      const c = recipeCuisine(r);
      if (c) seen.add(c);
    }
    return [...seen].sort();
  }, [recipes]);

  // Context for Nova's Vault reaction — her read on your cookbook + fridge.
  const vaultCtx = useMemo(() => {
    const history = getCookHistory();
    const cookedCount = history.length;
    const lastCookDaysAgo = history[0]?.cookedAt
      ? Math.floor((Date.now() - new Date(history[0].cookedAt)) / 86400000)
      : null;

    const counts = {};
    for (const r of recipes) { const c = recipeCuisine(r); if (c) counts[c] = (counts[c] || 0) + 1; }
    let topCuisine = null, topCuisineCount = 0;
    for (const [c, n] of Object.entries(counts)) if (n > topCuisineCount) { topCuisine = c; topCuisineCount = n; }

    let expiring = [];
    try {
      const pantry = JSON.parse(localStorage.getItem('dig_in_pantry') || '[]');
      expiring = expiringItems(Array.isArray(pantry) ? pantry : [], { withinDays: 3 })
        .map(e => ({ name: e.item.name, daysLeft: e.daysLeft }));
    } catch { /* ignore */ }

    return { savedCount: recipes.length, cookedCount, lastCookDaysAgo, topCuisine, topCuisineCount, expiring };
  }, [recipes]);

  const toggleDiet = useCallback((tag) => {
    setDietFilters(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQ('');
    setCuisineFilter(null);
    setTimeFilter(null);
    setDietFilters(new Set());
    setSortBy('saved');
  }, []);

  const filtered = useMemo(() => {
    let list = [...recipes];

    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(r =>
        (r.name || '').toLowerCase().includes(q) ||
        (recipeCuisine(r) || '').toLowerCase().includes(q) ||
        recipeIngredients(r).some(i => String(i).toLowerCase().includes(q)),
      );
    }

    if (cuisineFilter) {
      list = list.filter(r => recipeCuisine(r) === cuisineFilter);
    }

    if (timeFilter) {
      list = list.filter(r => {
        const mins = parseMinutes(recipeTime(r));
        return timeLabel(mins) === timeFilter;
      });
    }

    if (dietFilters.size > 0) {
      list = list.filter(r => {
        const tags = recipeDietary(r).map(t => t.toLowerCase());
        return [...dietFilters].every(df => tags.some(t => t.includes(df.toLowerCase())));
      });
    }

    if (sortBy === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'time') {
      list.sort((a, b) => {
        const ma = parseMinutes(recipeTime(a)) ?? 9999;
        const mb = parseMinutes(recipeTime(b)) ?? 9999;
        return ma - mb;
      });
    }

    return list;
  }, [recipes, searchQ, cuisineFilter, timeFilter, dietFilters, sortBy]);

  function handleUnsave(recipe) {
    unsaveRecipe(recipe);
    setRecipes(getSavedRecipes());
    if (expandedKey === recipeKey(recipe)) setExpandedKey(null);
  }

  function toggleExpand(recipe) {
    const k = recipeKey(recipe);
    setExpandedKey(prev => (prev === k ? null : k));
  }

  const hasFilters = !!(searchQ || cuisineFilter || timeFilter || dietFilters.size > 0);

  if (loading) {
    return (
      <>
        {!embedded && <Nav />}
        <div className="mcb-page">
          <div className="mcb-loading">Loading your cookbook...</div>
        </div>
      </>
    );
  }

  return (
    <>
      {!embedded && <Nav />}
      <div className="mcb-page">
        <header className="mcb-header">
          <div className="mcb-title-row">
            <h1 className="mcb-title">MY COOKBOOK</h1>
            <span className="mcb-count">{recipes.length} SAVED</span>
          </div>
          {recipes.length > 0 && (
            <button className="mcb-export-btn" onClick={exportData}>
              Export Backup
            </button>
          )}
        </header>

        {/* Nova reacts to the state of your vault (and your fridge) */}
        {!loading && <NovaReaction surface="vault" ctx={vaultCtx} />}

        {recipes.length === 0 ? (
          <div className="mcb-empty-full">
            <div className="mcb-empty-icon">COOKBOOK</div>
            <h2>Nothing saved yet</h2>
            <p>Bookmark recipes from Recipe Cards or the AI Helper and they'll appear here.</p>
            <div className="mcb-empty-links">
              <Link to="/recipe-cards" className="mcb-cta-btn">Browse Recipe Cards</Link>
              <Link to="/recipe-ai" className="mcb-cta-btn mcb-cta-outline">AI Recipe Helper</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mcb-controls">
              <input
                className="mcb-search"
                type="search"
                placeholder="Search your recipes…"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
              />
            </div>

            {cuisines.length > 1 && (
              <div className="mcb-filter-row">
                <span className="mcb-filter-label">CUISINE</span>
                <button
                  className={`mcb-pill${!cuisineFilter ? ' active' : ''}`}
                  onClick={() => setCuisineFilter(null)}
                >All</button>
                {cuisines.map(c => (
                  <button
                    key={c}
                    className={`mcb-pill${cuisineFilter === c ? ' active' : ''}`}
                    onClick={() => setCuisineFilter(prev => prev === c ? null : c)}
                  >{cuisineEmoji(c)} {c}</button>
                ))}
              </div>
            )}

            <div className="mcb-filter-row">
              <span className="mcb-filter-label">TIME</span>
              {TIME_BINS.map(b => (
                <button
                  key={b.key}
                  className={`mcb-pill${timeFilter === b.key ? ' active' : ''}`}
                  onClick={() => setTimeFilter(prev => prev === b.key ? null : b.key)}
                >{b.label}</button>
              ))}
            </div>

            <div className="mcb-filter-row">
              <span className="mcb-filter-label">DIET</span>
              {DIETARY_OPTIONS.map(d => (
                <button
                  key={d}
                  className={`mcb-pill${dietFilters.has(d) ? ' active' : ''}`}
                  onClick={() => toggleDiet(d)}
                >{d}</button>
              ))}
            </div>

            <div className="mcb-sort-row">
              <span className="mcb-filter-label">SORT</span>
              <select
                className="mcb-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
              {hasFilters && (
                <button className="mcb-clear-btn" onClick={clearFilters}>Clear Filters</button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="mcb-empty-filtered">
                <p>No recipes match these filters.</p>
                <button className="mcb-pill active" onClick={clearFilters}>Clear Filters</button>
              </div>
            ) : (
              <div className="mcb-grid">
                {filtered.map(recipe => {
                  const key       = recipeKey(recipe);
                  const cuisine   = recipeCuisine(recipe);
                  const timeStr   = recipeTime(recipe);
                  const dietary   = recipeDietary(recipe);
                  const steps     = recipeSteps(recipe);
                  const ings      = recipeIngredients(recipe);
                  const isExpanded = expandedKey === key;

                  return (
                    <div key={key} className={`mcb-card${isExpanded ? ' expanded' : ''}`}>
                      <div className="mcb-card-top">
                        <div className="mcb-card-emoji">{cuisineEmoji(cuisine)}</div>
                        <div className="mcb-card-info">
                          <h3 className="mcb-card-name">{recipe.name || 'Recipe'}</h3>
                          <div className="mcb-card-meta">
                            {cuisine && <span>{cuisine}</span>}
                            {timeStr && <span>{timeStr}</span>}
                            {recipe.difficulty && <span>{recipe.difficulty}</span>}
                          </div>
                          {dietary.length > 0 && (
                            <div className="mcb-card-dietary">
                              {dietary.map(t => (
                                <span key={t} className="mcb-diet-tag">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          className="mcb-unsave-btn"
                          title="Remove from cookbook"
                          onClick={() => handleUnsave(recipe)}
                        >✕</button>
                      </div>

                      <div className="mcb-card-actions">
                        <button
                          className="mcb-steps-btn"
                          onClick={() => toggleExpand(recipe)}
                        >
                          {isExpanded ? 'Hide Steps ▲' : 'View Steps ▼'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mcb-card-detail">
                          {ings.length > 0 && (
                            <div className="mcb-detail-section">
                              <h4>INGREDIENTS</h4>
                              <ul>
                                {ings.map((ing, i) => (
                                  <li key={i}>{typeof ing === 'string' ? ing : ing.item || JSON.stringify(ing)}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {steps.length > 0 && (
                            <div className="mcb-detail-section">
                              <h4>STEPS</h4>
                              <ol>
                                {steps.map((step, i) => (
                                  <li key={i}>{typeof step === 'string' ? step : step.instruction || JSON.stringify(step)}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                          {recipe.tip && (
                            <div className="mcb-detail-tip">
                              <span>TIP</span> {recipe.tip}
                            </div>
                          )}
                          {recipe.substitutions && recipe.substitutions.length > 0 && (
                            <div className="mcb-detail-section">
                              <h4>SUBSTITUTIONS</h4>
                              <ul>
                                {recipe.substitutions.map((s, i) => (
                                  <li key={i}>{typeof s === 'string' ? s : `${s.original} → ${s.substitute}`}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
