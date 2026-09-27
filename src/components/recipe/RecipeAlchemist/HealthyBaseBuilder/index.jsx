import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HEALTHY_BASES, SUGAR_SUBSTITUTES, FLOUR_ALTERNATIVES, buildHealthyBase,
} from '../../../../lib/healthify';
import { saveRecipe } from '../../../../services/saveService';
import { track } from '../../../../lib/analytics';
import './HealthyBaseBuilder.css';

/* HealthyBaseBuilder — "build a healthy base from scratch" (a smoothie or a
   loaf of bread today, more bases are just config in lib/healthify.js's
   HEALTHY_BASES). This is HealthifyLab's old "Build a Healthy Base" mode,
   pulled out on its own — HealthifyLab's other mode (Reverse-Engineer a
   Recipe) is retired now that RecipeTransformPanel's HEALTHIER mode does
   the same job right on the recipe you're already viewing, no separate
   search step needed. This one is a genuinely different verb — generate
   FROM NOTHING, not reshape something you have — so it lives on here as
   part of the Recipes hub's Invent tab. */

function openFull(recipe, navigate) {
  try {
    sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
    sessionStorage.removeItem('dig_in_full_recipe_adapt');
  } catch { /* ignore */ }
  navigate('/recipe');
}

export default function HealthyBaseBuilder() {
  const navigate = useNavigate();
  const [baseId, setBaseId] = useState(HEALTHY_BASES[0].id);
  const base = HEALTHY_BASES.find(b => b.id === baseId);
  const [liquid, setLiquid] = useState(base.liquidOptions[0]);
  const [addinPicks, setAddinPicks] = useState(new Set());
  const [sweetenerId, setSweetenerId] = useState(null);
  const [flourId, setFlourId] = useState(base.usesFlour ? FLOUR_ALTERNATIVES[0].id : null);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);

  function pickBase(id) {
    const next = HEALTHY_BASES.find(b => b.id === id);
    setBaseId(id);
    setLiquid(next.liquidOptions[0]);
    setAddinPicks(new Set());
    setFlourId(next.usesFlour ? FLOUR_ALTERNATIVES[0].id : null);
    setResult(null);
    setSaved(false);
  }

  function toggleAddin(pick) {
    setAddinPicks(s => {
      const next = new Set(s);
      next.has(pick) ? next.delete(pick) : next.add(pick);
      return next;
    });
  }

  function create() {
    const built = buildHealthyBase(baseId, {
      liquid, addinPicks: [...addinPicks], sweetenerId, flourId,
    });
    setResult(built);
    setSaved(false);
    track('healthify_base_built', { base: baseId, addins: addinPicks.size, sweetener: sweetenerId, flour: flourId });
  }

  function save() {
    if (!result || result.error) return;
    saveRecipe(result);
    setSaved(true);
    track('healthify_base_saved', { base: baseId });
  }

  function sendToRoute() {
    if (!result || result.error) return;
    try {
      localStorage.setItem('dig_in_shopping_list', JSON.stringify(result.ingredients || []));
      localStorage.removeItem('dig_in_shopping_picked');
    } catch { /* ignore */ }
    navigate('/craving-compass');
  }

  const chosenFlour = base.usesFlour ? FLOUR_ALTERNATIVES.find(f => f.id === flourId) : null;

  return (
    <div className="hbb-section">
      <p className="hbb-hint">Build a smoothie or a loaf of bread from real add-ins — add-in categories, sweetener, and flour are all config-driven, so a new base is just more data.</p>

      <div className="hbb-base-picker">
        {HEALTHY_BASES.map(b => (
          <button
            key={b.id}
            type="button"
            className={`hbb-base-btn${baseId === b.id ? ' active' : ''}`}
            onClick={() => pickBase(b.id)}
          >
            {b.label}
          </button>
        ))}
      </div>

      <label className="hbb-field-label">BASE LIQUID</label>
      <select className="hbb-select" value={liquid} onChange={e => setLiquid(e.target.value)}>
        {base.liquidOptions.map(l => <option key={l} value={l}>{l}</option>)}
      </select>

      {base.addinCategories.map(cat => (
        <div className="hbb-addin-cat" key={cat.id}>
          <label className="hbb-field-label">{cat.label.toUpperCase()}</label>
          <div className="hbb-swap-chips">
            {cat.picks.map(p => (
              <button
                key={p}
                type="button"
                className={`hbb-swap-chip${addinPicks.has(p) ? ' active' : ''}`}
                onClick={() => toggleAddin(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      ))}

      <label className="hbb-field-label">SWEETENER (OPTIONAL)</label>
      <div className="hbb-swap-chips">
        {SUGAR_SUBSTITUTES.map(s => (
          <button
            key={s.id}
            type="button"
            className={`hbb-swap-chip${sweetenerId === s.id ? ' active' : ''}`}
            onClick={() => setSweetenerId(id => (id === s.id ? null : s.id))}
          >
            {s.label}
          </button>
        ))}
      </div>
      {sweetenerId && (
        <p className="hbb-swap-note">{SUGAR_SUBSTITUTES.find(s => s.id === sweetenerId)?.note}</p>
      )}

      {base.usesFlour && (
        <>
          <label className="hbb-field-label">FLOUR</label>
          <div className="hbb-swap-chips">
            {FLOUR_ALTERNATIVES.map(f => (
              <button
                key={f.id}
                type="button"
                className={`hbb-swap-chip${flourId === f.id ? ' active' : ''}`}
                onClick={() => setFlourId(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          {chosenFlour && (
            <p className="hbb-swap-note">
              {chosenFlour.canMillAtHome
                ? `Mill it yourself: ${chosenFlour.millNote}`
                : chosenFlour.millNote}
              {' '}{chosenFlour.note}
            </p>
          )}
        </>
      )}

      <button className="hbb-create" onClick={create}>CREATE →</button>

      {result && !result.error && (
        <div className="hbb-result">
          <div className="hbb-result-name">{result.name}</div>
          <p className="hbb-result-summary">{result.summary}</p>
          <div className="hbb-result-cols">
            <div>
              <div className="hbb-preview-label">INGREDIENTS</div>
              <ul className="hbb-preview-list">{result.ingredients.map((l, i) => <li key={i}>{l}</li>)}</ul>
            </div>
            <div>
              <div className="hbb-preview-label">STEPS</div>
              <ol className="hbb-steps-list">{result.instructions.map((s, i) => <li key={i}>{s}</li>)}</ol>
            </div>
          </div>
          <div className="hbb-actions">
            <button className="hbb-btn hbb-btn-primary" onClick={save} disabled={saved}>
              {saved ? '✓ SAVED' : 'SAVE TO COOKBOOK'}
            </button>
            <button className="hbb-btn" onClick={sendToRoute}>🛒 SEND TO GROCERY ROUTE</button>
            <button className="hbb-btn" onClick={() => openFull(result, navigate)}>OPEN FULL RECIPE →</button>
          </div>
        </div>
      )}
    </div>
  );
}
