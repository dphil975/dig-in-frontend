import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import { loadRecipeBooks } from '../../../lib/recipeBooks';
import {
  loadOwnedTools, toggleOwnedTool, allToolsWithStatus, recipesEquippedFor,
} from '../../../lib/toolTracking';
import {
  DISCLAIMER as HYDRATION_DISCLAIMER, MECHANISM, WHEN_YOU_NEED_MORE,
  RECIPES as HYDRATION_RECIPES, savingsSummary, SAVINGS_NOTE as HYDRATION_SAVINGS_NOTE,
} from '../../../lib/hydrationDIY';
import {
  RECIPES as CONDIMENT_RECIPES, rankByPantry, savingsFor, SAVINGS_NOTE as CONDIMENT_SAVINGS_NOTE,
} from '../../../lib/condimentsDIY';
import ZeroProof from './ZeroProof';
import './KitchenSkills.css';

/* KitchenSkills — four real things, one hub:

     TOOLS       a real owned-tools inventory + substitution engine (there
                 was none — equipmentDetector.js could only say what a
                 RECIPE wants, never what YOU have; toolTracking.js is the
                 actual data-model addition the audit called for).
     HYDRATION   real electrolyte science + DIY recipes (hydrationDIY.js).
     CONDIMENTS  real recipes checked against your REAL pantry, riding on
                 pantryTools.js's existing matcher (condimentsDIY.js).
     ZERO-PROOF  the virgin-cocktail bar (./ZeroProof) — moved here when the
                 brand-copycat Copycat & Drinks hub was retired (2026-09-25).

   STYLING — deliberately built in Twitter's 2019 structural language: a
   dense, hairline-divided single-column timeline, sticky underlined tabs,
   pill buttons, a compact system-font (var(--font-ui)) instead of this
   app's usual Press Start 2P pixel chrome. That's a real, distinct choice —
   same precedent as Craving Tracker's own "homestead" palette elsewhere in
   this app: a sub-experience can carry its own coherent visual identity
   when the content calls for it. The ACCENT color is deliberately still
   this app's own matcha green, not literal Twitter blue — Twitter's density
   and card language, Dig-In's own color. */

const TABS = [
  { id: 'tools', label: 'Tools' },
  { id: 'hydration', label: 'Hydration' },
  { id: 'condiments', label: 'Condiments' },
  { id: 'zeroproof', label: 'Zero-Proof' },
];

function loadPantry() {
  try { const v = JSON.parse(localStorage.getItem('dig_in_pantry') || '[]'); return Array.isArray(v) ? v : []; }
  catch { return []; }
}

// ── Tools tab ────────────────────────────────────────────────────────────
function ToolsTab({ recipes }) {
  const [owned, setOwned] = useState(loadOwnedTools);
  const tools = useMemo(() => allToolsWithStatus(owned), [owned]);
  const equipped = useMemo(() => recipesEquippedFor(recipes, owned, 8), [recipes, owned]);

  function toggle(id) {
    setOwned(toggleOwnedTool(id));
  }

  return (
    <>
      <div className="ks-tweet ks-intro">
        <p>Tell us what's in your kitchen. We'll tell you what to do when a recipe wants something you don't have.</p>
      </div>

      {tools.map((t) => (
        <div className="ks-tweet" key={t.id}>
          <div className="ks-avatar" aria-hidden="true">🔧</div>
          <div className="ks-tweet-body">
            <div className="ks-tweet-head">
              <span className="ks-tweet-name">{t.name}</span>
              <button
                type="button"
                className={`ks-pill${t.owned ? ' owned' : ''}`}
                onClick={() => toggle(t.id)}
              >
                {t.owned ? '✓ In my kitchen' : '+ I have this'}
              </button>
            </div>
            <p className="ks-tweet-text">{t.description}</p>
            {!t.owned && t.substitution && (
              <div className="ks-quote">
                <span className="ks-quote-label">DON'T HAVE IT? USE INSTEAD</span>
                <p className="ks-quote-main"><b>{t.substitution.use}</b></p>
                <p className="ks-quote-sub">{t.substitution.adjust}</p>
              </div>
            )}
          </div>
        </div>
      ))}

      {equipped.length > 0 && (
        <div className="ks-tweet ks-section">
          <span className="ks-section-head">RECIPES YOU'RE EQUIPPED FOR</span>
          <div className="ks-reciperow">
            {equipped.map((r) => (
              <span className="ks-recipechip" key={r.id ?? r.name}>{r.name}</span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ── Hydration tab ────────────────────────────────────────────────────────
function HydrationTab() {
  const savings = useMemo(() => savingsSummary(), []);
  return (
    <>
      <div className="ks-tweet ks-intro">
        <p>{MECHANISM}</p>
      </div>

      <div className="ks-tweet">
        <span className="ks-section-head">WHEN WATER ALONE ISN'T QUITE ENOUGH</span>
        {WHEN_YOU_NEED_MORE.map((w) => (
          <div className="ks-row" key={w.id}>
            <span className="ks-row-label">{w.label}</span>
            <p className="ks-row-why">{w.why}</p>
          </div>
        ))}
      </div>

      {HYDRATION_RECIPES.map((r, i) => (
        <div className="ks-tweet" key={r.id}>
          <div className="ks-avatar" aria-hidden="true">💧</div>
          <div className="ks-tweet-body">
            <div className="ks-tweet-head">
              <span className="ks-tweet-name">{r.name}</span>
              <span className="ks-thread-n">{i + 1}/{HYDRATION_RECIPES.length}</span>
            </div>
            <ul className="ks-ings">
              {r.ingredients.map((ing) => <li key={ing}>{ing}</li>)}
            </ul>
            <p className="ks-tweet-text">{r.method}</p>
            <p className="ks-why">{r.why}</p>
          </div>
        </div>
      ))}

      <div className="ks-tweet ks-stats">
        <span className="ks-section-head">VS. BUYING IT</span>
        {savings.map((s) => (
          <div className="ks-statrow" key={s.name}>
            <span className="ks-statname">{s.name}</span>
            <span className="ks-statnums">${s.storeCost.toFixed(2)} → ~${s.diyCost.toFixed(2)} <b>({s.savedPct}% less)</b></span>
          </div>
        ))}
        <p className="ks-notesmall">{HYDRATION_SAVINGS_NOTE}</p>
      </div>

      <p className="ks-disclaimer">{HYDRATION_DISCLAIMER}</p>
    </>
  );
}

// ── Condiments tab ───────────────────────────────────────────────────────
function CondimentsTab() {
  const pantry = useMemo(() => loadPantry(), []);
  const ranked = useMemo(() => rankByPantry(pantry), [pantry]);

  return (
    <>
      <div className="ks-tweet ks-intro">
        <p>Real recipes, checked against your real pantry — the ones you're closest to making lead the list.</p>
      </div>

      {ranked.map(({ recipe, match }) => {
        const savings = savingsFor(recipe);
        return (
          <div className="ks-tweet" key={recipe.id}>
            <div className="ks-avatar" aria-hidden="true">🥫</div>
            <div className="ks-tweet-body">
              <div className="ks-tweet-head">
                <span className="ks-tweet-name">{recipe.name}</span>
                {pantry.length > 0 && (
                  <span className="ks-coverage">{match.have.length}/{recipe.ingredients.length} in your pantry</span>
                )}
              </div>
              <ul className="ks-ings">
                {recipe.ingredients.map((ing) => (
                  <li key={ing} className={match.have.includes(ing) ? 'have' : ''}>
                    {match.have.includes(ing) ? '✓ ' : ''}{ing}
                  </li>
                ))}
              </ul>
              <p className="ks-tweet-text">{recipe.method}</p>
              <span className="ks-savings">
                ~${savings.storePerServing.toFixed(2)}/serving store-bought → ~${savings.diyPerServing.toFixed(2)} DIY ({savings.savedPct}% less)
              </span>
            </div>
          </div>
        );
      })}

      <p className="ks-disclaimer">{CONDIMENT_SAVINGS_NOTE}</p>
    </>
  );
}

export default function KitchenSkills({ defaultTab = 'tools' } = {}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState(defaultTab);
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    let alive = true;
    loadRecipeBooks().then((pool) => { if (alive) setRecipes(pool); });
    return () => { alive = false; };
  }, []);

  const pick = useCallback((id) => setTab(id), []);

  return (
    <div className="ks-page">
      <Nav />
      <div className="ks-shell">
        <button type="button" className="ks-back" onClick={() => navigate(-1)}>← Back</button>

        <div className="ks-tabbar" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`ks-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => pick(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ks-timeline">
          {tab === 'tools' && <ToolsTab recipes={recipes} />}
          {tab === 'hydration' && <HydrationTab />}
          {tab === 'condiments' && <CondimentsTab />}
          {tab === 'zeroproof' && <ZeroProof embedded />}
        </div>
      </div>
    </div>
  );
}
