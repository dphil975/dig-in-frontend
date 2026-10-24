import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadRecipeBooks } from '../../../lib/recipeBooks';
import { cleanTitle } from '../../../lib/seo';
import CheckIn from '../../../components/nova/CheckIn';
import './Today.css';

/* Nova → Today — the calm front door of Nova, four things and nothing else:

     1. The default recipe   one easy dish picked for today
     2. The pantry starter   what your pantry can make, or how to start one
     3. The check-in         one-tap "how are you?"
     4. Cook with Nova       ask her a cooking question / plan a week / talk it through

   Everything else Nova does (the Nest) is one tab over. Nova's logic is meant to
   move server-side eventually; this page only renders the doors. */

const DAY_MS = 86400000;

function pantryItemCount() {
  try {
    const v = JSON.parse(localStorage.getItem('dig_in_pantry') || '[]');
    return Array.isArray(v) ? v.length : 0;
  } catch { return 0; }
}

function totalMinutes(r) {
  return r.total_time || r.time || ((r.prepTime || 0) + (r.cookTime || 0)) || 0;
}

function invite(now) {
  const h = now.getHours();
  if (h < 11) return 'What sounds good this morning?';
  if (h < 15) return 'What are we making for lunch?';
  if (h < 21) return 'What are we making tonight?';
  return 'Something small before bed?';
}

export default function Today() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState(null);          // null = still loading
  const [offset, setOffset] = useState(0);
  const pantryCount = useMemo(pantryItemCount, []);
  const now = new Date();

  useEffect(() => {
    let alive = true;
    loadRecipeBooks()
      .then((list) => { if (alive) setRecipes(Array.isArray(list) ? list : []); })
      .catch(() => { if (alive) setRecipes([]); });
    return () => { alive = false; };
  }, []);

  // The default recipe is a *default*: quick and easy when there are enough
  // of those to rotate through, otherwise whatever the pool has.
  const pool = useMemo(() => {
    if (!recipes) return [];
    const easy = recipes.filter((r) => {
      const t = totalMinutes(r);
      return t > 0 && t <= 40 && (!r.difficulty || /easy/i.test(r.difficulty));
    });
    return easy.length >= 8 ? easy : recipes;
  }, [recipes]);

  const pick = pool.length ? pool[(Math.floor(now.getTime() / DAY_MS) + offset) % pool.length] : null;

  function cook(recipe) {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.removeItem('dig_in_full_recipe_adapt');
    } catch { /* ignore */ }
    navigate('/recipe');
  }

  const cuisine = pick?.country || pick?.cuisine || '';
  const minutes = pick ? totalMinutes(pick) : 0;

  return (
    <div className="tday">
      <header className="tday-head">
        <p className="tday-kicker">
          {now.toLocaleDateString([], { weekday: 'long' })} · {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </p>
        <h1 className="tday-title">{invite(now)}</h1>
      </header>

      {/* 1 · The default recipe */}
      <section className="tday-block">
        <p className="tday-label">The default recipe</p>
        <div className="tday-box">
          {pick ? (
            <div className="tday-recipe">
              <div className="tday-recipe-img">
                <span className="tday-recipe-ph">{cuisine || 'DIG IN'}</span>
                {pick.image && (
                  <img
                    src={pick.image}
                    alt={pick.name}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </div>
              <div className="tday-recipe-body">
                <h2 className="tday-recipe-name">{cleanTitle(pick.name) || pick.name}</h2>
                <p className="tday-recipe-meta">
                  {[cuisine, minutes ? `${minutes} min` : '', pick.difficulty].filter(Boolean).join(' · ')}
                </p>
                <div className="tday-actions">
                  <button type="button" className="tday-btn tday-btn-primary" onClick={() => cook(pick)}>
                    Cook this
                  </button>
                  <button type="button" className="tday-btn" onClick={() => setOffset((o) => o + 1)}>
                    Not today — show another
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="tday-line">{recipes === null ? 'Picking something for you…' : 'No recipes loaded yet.'}</p>
          )}
        </div>
      </section>

      {/* 2 · The pantry starter */}
      <section className="tday-block">
        <p className="tday-label">The pantry starter</p>
        <div className="tday-box">
          {pantryCount ? (
            <>
              <p className="tday-line">
                You've got <b>{pantryCount}</b> thing{pantryCount === 1 ? '' : 's'} in your pantry — let's cook from them.
              </p>
              <div className="tday-actions">
                <button type="button" className="tday-btn tday-btn-primary" onClick={() => navigate('/pantry-recipes')}>
                  See what you can make
                </button>
                <button type="button" className="tday-btn" onClick={() => navigate('/pantry')}>
                  Update pantry
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="tday-line">
                Nothing in your pantry yet. Add what's already in your kitchen and Nova will suggest meals from it.
              </p>
              <div className="tday-actions">
                <button type="button" className="tday-btn tday-btn-primary" onClick={() => navigate('/pantry')}>
                  Start your pantry
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 3 · The check-in */}
      <section className="tday-block">
        <p className="tday-label">The check-in</p>
        <CheckIn onRoute={navigate} />
      </section>

      {/* 4 · Cook with Nova */}
      <section className="tday-block">
        <p className="tday-label">Cook with Nova</p>
        <div className="tday-box">
          <p className="tday-line">Stuck on a step, out of an ingredient, or just want company at the stove?</p>
          <div className="tday-actions">
            <button
              type="button"
              className="tday-btn tday-btn-primary"
              onClick={() => window.dispatchEvent(new Event('dig_in_open_nova'))}
            >
              Ask Nova
            </button>
            <button type="button" className="tday-btn" onClick={() => navigate('/whimsy')}>
              Plan a Whimsy Week
            </button>
          </div>
          <button type="button" className="tday-link" onClick={() => navigate('/nest')}>
            Rough moment in the kitchen? Talk it through →
          </button>
        </div>
      </section>
    </div>
  );
}
