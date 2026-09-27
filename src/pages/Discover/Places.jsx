import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from './Section';
import { DENSE_METROS, metroForZip } from '../../lib/maps/metros';
import { loadRecipeBooks } from '../../lib/recipe/recipeBooks';

/* Discover → Places — get out of your area (and back into it). One featured
   city at a time (a different one each day, or whichever you tap), what it eats,
   and dishes from the recipe books that carry its flavors. Your own city sits
   beside it when your ZIP is one of the metros the app knows by name. */

function matchesMetro(recipe, metro) {
  const hay = `${recipe.name || ''} ${recipe.description || ''} ${recipe.cuisine || ''}`.toLowerCase();
  return metro.keywords.some((k) => hay.includes(k));
}

// Holds the place of the dish chips until the recipe books arrive, so the card
// doesn't grow when they do.
function DishSkeleton() {
  return (
    <div className="dsc-chips" aria-hidden="true">
      <span className="dsc-chip dsc-chip-skel" />
      <span className="dsc-chip dsc-chip-skel" />
    </div>
  );
}

function readZip() {
  try { return localStorage.getItem('dig_in_zip') || ''; } catch { return ''; }
}

export default function Places() {
  const navigate = useNavigate();
  const zip = readZip();
  const home = useMemo(() => (zip ? metroForZip(zip) : null), [zip]);

  // Today's "somewhere else": rotates by date, and never lands on your own city.
  const todays = useMemo(() => {
    const pool = DENSE_METROS.filter((m) => m.city !== home?.city);
    return pool[new Date().getDate() % pool.length];
  }, [home]);
  const [city, setCity] = useState(todays.city);
  const metro = DENSE_METROS.find((m) => m.city === city) || todays;

  const [recipes, setRecipes] = useState(null);   // null while the recipe books load
  useEffect(() => {
    let alive = true;
    loadRecipeBooks().then((l) => { if (alive) setRecipes(Array.isArray(l) ? l : []); }).catch(() => { if (alive) setRecipes([]); });
    return () => { alive = false; };
  }, []);

  const loading = recipes === null;
  const dishesFor = (m, n = 3) => (recipes || []).filter((r) => matchesMetro(r, m)).slice(0, n);
  const away = dishesFor(metro);
  const local = home ? dishesFor(home, 2) : [];

  function open(recipe) {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    } catch { /* ignore */ }
    navigate('/recipe');
  }

  return (
    <Section id="places" title="Places" sub="Take a trip through a city's food without leaving the couch.">
      <div className="dsc-card">
        <p className="dsc-kicker">{city === todays.city ? 'Somewhere else today' : 'Featured city'}</p>
        <h3 className="dsc-card-title">{metro.city}</h3>
        <p className="dsc-text">{metro.city} eats {metro.keywords.slice(0, 3).join(', ')}.</p>
        {loading ? <DishSkeleton /> : away.length > 0 && (
          <div className="dsc-chips">
            {away.map((r) => (
              <button key={r.id || r.name} type="button" className="dsc-chip dsc-chip-dish" onClick={() => open(r)}>{r.name}</button>
            ))}
          </div>
        )}
        <button type="button" className="dsc-btn" onClick={() => navigate('/city-explorer')}>Explore {metro.city} →</button>
      </div>

      <div className="dsc-card">
        <p className="dsc-kicker">Your city</p>
        {home ? (
          <>
            <h3 className="dsc-card-title">{home.city}</h3>
            <p className="dsc-text">What {home.city} is known for — make it at home for a fraction of the corner-store price.</p>
            {loading ? <DishSkeleton /> : local.length > 0 && (
              <div className="dsc-chips">
                {local.map((r) => (
                  <button key={r.id || r.name} type="button" className="dsc-chip dsc-chip-dish" onClick={() => open(r)}>{r.name}</button>
                ))}
              </div>
            )}
          </>
        ) : zip ? (
          <p className="dsc-text">I don't have local flavor data for that ZIP yet — the featured cities are a good place to start.</p>
        ) : (
          <>
            <p className="dsc-text">Add your ZIP and I'll show what your city is known for.</p>
            <button type="button" className="dsc-btn" onClick={() => navigate('/settings/location')}>Set my location →</button>
          </>
        )}
      </div>

      <div>
        <p className="dsc-kicker">Featured cities</p>
        <div className="dsc-chips">
          {DENSE_METROS.map((m) => (
            <button
              key={m.city}
              type="button"
              className={`dsc-chip${m.city === city ? ' active' : ''}`}
              aria-pressed={m.city === city}
              onClick={() => setCity(m.city)}
            >
              {m.city}
            </button>
          ))}
        </div>
      </div>
    </Section>
  );
}
