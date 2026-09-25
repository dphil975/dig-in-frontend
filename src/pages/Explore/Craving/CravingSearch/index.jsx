import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../../components/shell/Nav';
import NovaSprite from '../../../../components/nova/NovaSprite';
import { loadRecipeBooks } from '../../../../lib/recipeBooks';
import { flavorsInText, recipeFlavors } from '../../../../lib/flavorProfile';
import { prettyBook } from '../../../../lib/novaKnowledge';
import { complaintLevel } from '../../../../lib/complaintDetector';
import { empathyLine, toneMeta } from '../../../../lib/novaVoice';
import { loadSettings } from '../../../../lib/novaSettings';
import { saveRecipe as saveRecipeReal, isSaved } from '../../../../services/saveService';
import './CravingSearch.css';

const API_BASE = import.meta.env.VITE_PYTHON_BASE ?? '';

// Real local search over the actual recipe books — not a fixed demo set —
// so the fallback (or the only path, when there's no live API configured)
// actually responds to what you typed. Reuses the same term + flavor
// overlap scoring novaKnowledge.js's retrieveRecipes() uses for citations.
export function searchLocalRecipes(craving, recipes, limit = 9) {
  const cravingFlavors = flavorsInText(craving);
  const terms = craving.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  const scored = [];
  for (const r of recipes) {
    const ingredientsText = (r.ingredients || []).map(i => (typeof i === 'string' ? i : i?.name || '')).join(' ');
    const text = [r.name || '', r.description || '', ingredientsText].join(' ').toLowerCase();
    let score = 0;
    for (const w of terms) if (text.includes(w)) score += (r.name || '').toLowerCase().includes(w) ? 3 : 1;
    const overlap = recipeFlavors(r).filter(f => cravingFlavors.includes(f)).length;
    score += overlap * 2;
    if (score > 0) scored.push({ recipe: r, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0]?.score || 1;
  return scored.slice(0, limit).map(({ recipe, score }) => ({
    recipe,
    title: recipe.name || recipe.full_name || 'Recipe',
    source: prettyBook(recipe.source_file || recipe.source_book),
    time: recipe.totalTime || recipe.total_time || ((recipe.prepTime || 0) + (recipe.cookTime || 0)) || 20,
    difficulty: recipe.difficulty || 'Easy',
    score: Math.min(99, Math.round((score / top) * 100)),
    ingredients: (recipe.ingredients || []).map(i => (typeof i === 'string' ? i : i?.name || '')).filter(Boolean),
  }));
}

export default function CravingSearch({ embedded = false } = {}) {
  const navigate = useNavigate();
  const [cravingInput, setCravingInput] = useState('spicy chicken dinner');
  const [selectedDietary, setSelectedDietary] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [tone] = useState(() => loadSettings().tone);
  const [savedIds, setSavedIds] = useState({});

  useEffect(() => {
    loadRecipeBooks().then(setRecipes);
  }, []);

  useEffect(() => {
    if (!recipes.length) return;
    const timer = setTimeout(() => { searchCraving(); }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes.length]);

  function toggleDietary(dietary) {
    setSelectedDietary(prev =>
      prev.includes(dietary) ? prev.filter(d => d !== dietary) : [...prev, dietary]
    );
  }

  async function searchCraving() {
    const craving = cravingInput.trim();
    if (!craving) {
      alert("Please enter what you're craving");
      return;
    }
    setLoading(true);
    setResults(null);

    // Nova's take: an empathy lead-in if this reads like a complaint/rough
    // day, and a "reverse-engineered" flavor read either way — reusing the
    // exact same complaint-detection + tone-voice + flavor-keyword engines
    // Ask Nova and Copycat Lab already run on, not a parallel system.
    const level = complaintLevel(craving);
    const flavors = flavorsInText(craving);
    const novaLine = level !== 'none'
      ? empathyLine(tone, { intensity: level })
      : null;

    try {
      const response = await fetch(`${API_BASE}/food/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ craving, dietary: selectedDietary }),
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) throw new Error('no live api');
      const data = await response.json();
      if (!data.recommendations?.length) throw new Error('empty');
      setResults({ type: 'api', data, craving, novaLine, flavors });
    } catch {
      const local = searchLocalRecipes(craving, recipes);
      setResults({ type: 'local', local, craving, novaLine, flavors });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') searchCraving();
  }

  function openRecipe(recipe) {
    if (!recipe) return;
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.removeItem('dig_in_full_recipe_adapt');
    } catch { /* ignore */ }
    navigate('/recipe');
  }

  function saveThisRecipe(recipe, key) {
    if (!recipe) return;
    saveRecipeReal(recipe);
    setSavedIds(prev => ({ ...prev, [key]: true }));
  }

  function renderRecipeCard(recipe, index, shoppingLists) {
    const shopping = shoppingLists ? shoppingLists[index] : null;
    const ingredients = recipe.ingredients || [];
    const source = recipe.source || 'Recipe';
    const channel = recipe.channel || recipe.source || '';
    const viewsLabel = recipe.views
      ? `• ${(recipe.views / 1000).toFixed(0)}K views`
      : recipe.saves
      ? `• ${(recipe.saves / 1000).toFixed(0)}K saves`
      : '';
    const key = recipe.recipe?.id || recipe.title || index;
    const saved = savedIds[key] || (recipe.recipe && isSaved(recipe.recipe));

    return (
      <div className="recipe-card" key={index}>
        <div className="recipe-header">
          <div className="source">{source} {viewsLabel}</div>
          <div className="title">{recipe.title || 'Delicious Recipe'}</div>
          <div className="channel">{channel}</div>
        </div>
        <div className="recipe-body">
          <div className="recipe-meta">
            <span>{recipe.time || 20} min</span>
            <span>{recipe.difficulty || 'Easy'}</span>
            <span className="recipe-score">{recipe.score || 0}% match</span>
          </div>
          <div className="recipe-ingredients">
            {ingredients.map((ing, i) => (
              <span className="ing" key={i}>{ing}</span>
            ))}
          </div>
          {shopping && shopping.categories && (
            <div className="shopping-info">
              {shopping.total_items} ingredients · ${Number(shopping.estimated_cost).toFixed(2)}
            </div>
          )}
          <div className="recipe-actions">
            {recipe.recipe ? (
              <button className="view-btn" onClick={() => openRecipe(recipe.recipe)}>
                View Recipe
              </button>
            ) : (
              <button className="view-btn" onClick={() => recipe.url && recipe.url !== '#' && window.open(recipe.url, '_blank')}>
                View Recipe
              </button>
            )}
            <button className="save-btn" onClick={() => saveThisRecipe(recipe.recipe, key)} disabled={saved}>
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderApiResults() {
    const { data, craving } = results;
    const recommendations = data.recommendations || [];
    const shoppingLists = data.shopping_lists || [];

    return (
      <>
        <div className="search-summary">
          Found <strong>{recommendations.length}</strong> recipes for "<strong>{craving}</strong>"
        </div>
        <div className="results-grid">
          {recommendations.map((recipe, i) => renderRecipeCard(recipe, i, shoppingLists))}
        </div>
      </>
    );
  }

  function renderLocalResults() {
    const { local, craving } = results;
    if (local.length === 0) {
      return (
        <div className="search-summary">
          Nothing in your books quite matches "{craving}" yet — try different words, or open Kitchen Alchemist to invent it.
        </div>
      );
    }
    return (
      <>
        <div className="search-summary">
          Found <strong>{local.length}</strong> recipe{local.length !== 1 ? 's' : ''} for "<strong>{craving}</strong>"
        </div>
        <div className="results-grid">
          {local.map((recipe, i) => renderRecipeCard(recipe, i, null))}
        </div>
      </>
    );
  }

  const toneLabel = toneMeta(tone)?.label || 'Nova';

  return (
    <div className="craving-page">
      {!embedded && <Nav />}
      <div className="container">
        <div className="header">
          <h1>What Are You Craving?</h1>
          <p>Type anything — "I want spicy chicken" or "healthy breakfast bowl"</p>
        </div>

        <div className="search-card">
          <input
            className="craving-input"
            id="cravingInput"
            placeholder="e.g., I want something spicy with chicken for dinner"
            value={cravingInput}
            onChange={e => setCravingInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="search-row">
            <div className="dietary-tags">
              {[
                { value: 'vegetarian', label: 'Vegetarian' },
                { value: 'vegan', label: 'Vegan' },
                { value: 'gluten-free', label: 'Gluten-Free' },
                { value: 'dairy-free', label: 'Dairy-Free' },
                { value: 'keto', label: 'Keto' },
                { value: 'low-carb', label: 'Low-Carb' },
              ].map(tag => (
                <span
                  key={tag.value}
                  className={`dietary-tag${selectedDietary.includes(tag.value) ? ' selected' : ''}`}
                  onClick={() => toggleDietary(tag.value)}
                >
                  {tag.label}
                </span>
              ))}
            </div>
            <button className="search-btn" onClick={searchCraving}>
              Find My Meal
            </button>
          </div>
        </div>

        <div id="resultsContainer">
          {loading && (
            <div className="loading">Nova's reading your craving…</div>
          )}
          {!loading && !results && (
            <div className="search-summary">Try typing what you're craving above!</div>
          )}

          {!loading && results && (results.novaLine || results.flavors?.length > 0) && (
            <div className="craving-nova">
              <NovaSprite look="pink" h={30} title="Nova" />
              <div className="craving-nova-body">
                <div className="craving-nova-head">NOVA · {toneLabel.toLowerCase()} voice</div>
                {results.novaLine && <p className="craving-nova-line">{results.novaLine}</p>}
                {results.flavors?.length > 0 && (
                  <p className="craving-nova-flavors">
                    Reverse-engineering your craving: reads as <b>{results.flavors.join(', ')}</b> — that's what I matched on.
                  </p>
                )}
              </div>
            </div>
          )}

          {!loading && results && results.type === 'api' && renderApiResults()}
          {!loading && results && results.type === 'local' && renderLocalResults()}
        </div>
      </div>
    </div>
  );
}
