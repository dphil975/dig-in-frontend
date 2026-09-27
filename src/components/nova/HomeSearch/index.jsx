import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchRecipes } from '../../../services/api';
import { solveQuery } from '../../../lib/nova/kindnessProtocol';
import { setLifeMode } from '../../../lib/personalization/lifeMode';
import { track } from '../../../lib/platform/analytics';
import './HomeSearch.css';

/* The search box on the Nova home screen. A real recipe search — and it listens
   first: if what you typed reads as a feeling or a problem rather than a dish,
   the answer is a reflection (and, only if you want it, real help). Crisis
   language shows real hotlines and nothing else. */

function NurtureResult({ data, onClose, onRoute, onLifeMode }) {
  const [showHelp, setShowHelp] = useState(false);

  if (data.kind === 'crisis') {
    return (
      <div className="hs-nurture is-crisis" role="status">
        <p className="hs-nurture-reflect">{data.reflection}</p>
        <ul className="hs-nurture-crisis">
          {data.resources.map((r) => (
            <li key={r.label}>
              <a href={r.href}>{r.label}</a>
              <span>{r.detail}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="hs-nurture-dismiss" onClick={onClose}>close</button>
      </div>
    );
  }

  const hasHelp = data.solutions && data.solutions.length > 0;
  return (
    <div className="hs-nurture" role="status">
      <span className="hs-nurture-tag">heard you</span>
      <p className="hs-nurture-reflect">{data.reflection}</p>

      {data.noSolutions ? (
        <p className="hs-nurture-listen">just listening — no fixes, like you asked. i'm here.</p>
      ) : !hasHelp ? (
        <p className="hs-nurture-listen">i'm here. if it would help to say more, the bar is listening.</p>
      ) : !showHelp ? (
        <div className="hs-nurture-gate">
          <button type="button" className="hs-nurture-more" onClick={() => setShowHelp(true)}>
            want a few gentle ideas? →
          </button>
          <button type="button" className="hs-nurture-no" onClick={onClose}>
            no, just needed to say it
          </button>
        </div>
      ) : (
        <div className="hs-nurture-sols">
          {data.solutions.map((s) => (
            <button
              key={s.route || s.lifeMode}
              type="button"
              className="hs-nurture-sol"
              onClick={() => (s.lifeMode ? onLifeMode(s.lifeMode) : onRoute(s.route))}
            >
              <span className="hs-nurture-sol-label">{s.label}</span>
              <span className="hs-nurture-sol-why">{s.why}</span>
            </button>
          ))}
          <p className="hs-nurture-optout">
            none of these? that's okay too — <button type="button" onClick={onClose}>just sit here a minute</button>.
          </p>
        </div>
      )}
    </div>
  );
}

export default function HomeSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [nurture, setNurture] = useState(null);

  function openRecipe(recipe) {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    } catch { /* ignore */ }
    navigate('/recipe');
  }

  function clear() { setQuery(''); setResults(null); setNurture(null); }

  function submit(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) { setResults(null); setNurture(null); return; }

    const solved = solveQuery(q);
    setNurture(solved.kind === 'problem' || solved.kind === 'crisis' ? solved : null);
    track('home_search', { q, kind: solved.kind });

    if (solved.kind === 'crisis') { setResults(null); return; }   // never answer a crisis with recipes
    setSearching(true);
    searchRecipes(q).then(setResults).catch(() => setResults([])).finally(() => setSearching(false));
  }

  function chooseLifeMode(id) {
    setLifeMode(id);
    try { window.dispatchEvent(new Event('dig_in_lifemode')); } catch { /* ignore */ }
    setNurture(null);
  }

  return (
    <section className="hs" aria-label="Search">
      <span className="hs-label">▸ Search</span>
      <form className="hs-form" onSubmit={submit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a dish, ingredient, or cuisine…"
          aria-label="Search recipes"
        />
        <button type="submit">{searching ? '…' : 'Go'}</button>
        {(results || nurture) && (
          <button type="button" className="hs-clear" onClick={clear}>Clear</button>
        )}
      </form>

      {nurture && (
        <NurtureResult
          data={nurture}
          onClose={() => setNurture(null)}
          onRoute={(r) => navigate(r)}
          onLifeMode={chooseLifeMode}
        />
      )}

      {results && (
        <div className="hs-results">
          {results.length === 0 ? (
            <p className="hs-empty">Nothing matched “{query}.” Try another ingredient or cuisine.</p>
          ) : (
            results.slice(0, 8).map((r) => (
              <button key={r.id || r.name} type="button" className="hs-result" onClick={() => openRecipe(r)}>
                <span className="hs-result-name">{r.name}</span>
                {(r.country || r.cuisine) && <span className="hs-result-meta">{r.country || r.cuisine}</span>}
              </button>
            ))
          )}
          <button type="button" className="hs-seeall" onClick={() => navigate('/recipes')}>
            Browse all recipes →
          </button>
        </div>
      )}
    </section>
  );
}
