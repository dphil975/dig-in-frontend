import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import Nav from '../../components/shell/Nav';
import RecipeCards from './Browse';
import InventTab from './InventTab';
import SpendPlanner from '../../components/pantry/SpendPlanner';
import { QUADRANTS } from '../../lib/recipe/quadrants';
import { getAnswers } from '../../lib/personalization/onboarding';
import { quickPicks } from '../../lib/nova/pick';
import { loadRecipeBooks } from '../../lib/recipeBooks';
import { cleanTitle } from '../../lib/platform/native';
import { loadFlavorProfile, recipeFlavors } from '../../lib/flavorProfile';
import './RecipeCards.css';

/* Recipes — the second of the five tabs. It opens on the four quadrants (solo or
   shared, daily or special) and Nova's quick picks, then the recipe cards for
   whichever quadrant you're in. Opening a card goes to the recipe page.

   The welcome questions place you in a quadrant, and the page starts there —
   unless you arrived through a filtered link (Discover → Categories), which
   starts on everything. Browse (recipe cards) is the first tab; Invent (make a
   dish from nothing) is the second.

   Canonical URL is /recipes; /recipe-cards, /recipe-ai and /build-bar stay as
   aliases into the tabs (see the router). */

const TABS = [
  { id: 'browse', label: 'Browse' },
  { id: 'invent', label: 'Invent' },
];

// Top flavor matching a recipe against the stored taste profile.
function topFlavorMatch(recipe, profile) {
  if (!profile || !Object.keys(profile).length) return null;
  const flavors = recipeFlavors(recipe);
  if (!flavors.length) return null;
  return flavors
    .map((f) => [f, profile[f] || 0])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

// Cuisine affinity tag from onboarding answers.
function cuisineTag(recipe, answers) {
  const liked = Array.isArray(answers?.cuisine) ? answers.cuisine : [];
  if (!liked.length) return null;
  const rc = (recipe.cuisine || recipe.country || '').toLowerCase();
  return rc && liked.includes(rc) ? rc : null;
}

function QuickPicks() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState(null);

  useEffect(() => {
    let alive = true;
    loadRecipeBooks().then((l) => { if (alive) setRecipes(Array.isArray(l) ? l : []); }).catch(() => { if (alive) setRecipes([]); });
    return () => { alive = false; };
  }, []);

  const profile  = useMemo(() => loadFlavorProfile(), []);
  const answers  = useMemo(() => getAnswers(), []);
  const hasProfile = Object.keys(profile).some((k) => (profile[k] || 0) > 0);
  const hasCuisine = Array.isArray(answers?.cuisine) && answers.cuisine.length > 0;
  const isPersonalized = hasProfile || hasCuisine;

  const picks = useMemo(() => (recipes ? quickPicks(recipes, { count: 3 }) : []), [recipes]);
  if (!picks.length) return null;

  function open(r) {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(r));
      sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    } catch { /* ignore */ }
    navigate('/recipe');
  }

  return (
    <section className="rcq-quick" aria-label="Nova's quick picks">
      <div className="rcq-kicker-line">
        <p className="rcq-kicker">Nova's quick picks</p>
        {isPersonalized && <span className="rcq-kicker-badge">For your taste</span>}
      </div>
      <div className="rcq-quick-row">
        {picks.map((r) => {
          const flavor  = topFlavorMatch(r, profile);
          const cuisine = cuisineTag(r, answers);
          const tag     = cuisine || flavor;
          return (
            <button key={r.id || r.name} type="button" className="rcq-quick-card" onClick={() => open(r)}>
              <span className="rcq-quick-name">{cleanTitle(r.name) || r.name}</span>
              <span className="rcq-quick-meta">
                {[`${r.total_time || r.time} min`, String(r.difficulty || '').toLowerCase(), r.cuisine].filter(Boolean).join(' · ')}
              </span>
              {tag && <span className="rcq-quick-tag">{tag}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function Recipes({ defaultTab = 'browse' } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname, search } = useLocation();
  const fromQuery = searchParams.get('tab');
  const valid = TABS.some(t => t.id === fromQuery);
  const [tab, setTab] = useState(valid ? fromQuery : (pathname === '/recipe-ai' || pathname === '/build-bar' ? 'invent' : defaultTab));

  // Start in your own quadrant — unless a filtered link brought you here.
  const filteredLink = /[?&](special|diet|time)=/.test(search);
  const [quadrant, setQuadrant] = useState(() => (filteredLink ? null : (getAnswers()?.quadrant || null)));

  function pick(id) {
    setTab(id);
    setSearchParams(id === 'browse' ? {} : { tab: id }, { replace: true });
  }

  return (
    <div className="rcp-hub">
      <Nav />
      <div className="rcp-shell">
        <main className="rcp-main">
          <div className="rcp-hub-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                type="button"
                className={`rcp-hub-tab${tab === t.id ? ' active' : ''}`}
                onClick={() => pick(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'browse' && (
            <>
              <section className="rcq" aria-label="Recipe quadrants">
                <div className="rcq-grid">
                  {QUADRANTS.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      className={`rcq-tile${quadrant === q.id ? ' active' : ''}`}
                      aria-pressed={quadrant === q.id}
                      onClick={() => setQuadrant(quadrant === q.id ? null : q.id)}
                    >
                      <span className="rcq-tile-label">{q.label}</span>
                      <span className="rcq-tile-axes">{q.who} · {q.when}</span>
                      <span className="rcq-tile-blurb">{q.blurb}</span>
                    </button>
                  ))}
                </div>
                {quadrant && (
                  <button type="button" className="rcq-all" onClick={() => setQuadrant(null)}>Show every recipe →</button>
                )}
              </section>
              <QuickPicks />
              <RecipeCards embedded quadrant={quadrant} filterExtras={<SpendPlanner />} />
            </>
          )}
          {tab === 'invent' && (
            <InventTab
              initialAlchemistMode={pathname === '/recipe-ai' ? 'ingredients' : undefined}
              initialMode={pathname === '/build-bar' ? 'build-bar' : 'alchemist'}
            />
          )}
        </main>
      </div>
    </div>
  );
}
