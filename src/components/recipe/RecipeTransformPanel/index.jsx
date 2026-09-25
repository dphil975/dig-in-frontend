import { useMemo, useState } from 'react';
import { transformRecipe } from '../../../lib/recipeTransform';
import { REGIONS } from '../../../lib/regions';
import { flaggedAllergensInRecipe } from '../../../lib/allergyProfile';
import { saveRecipe } from '../../../services/saveService';
import './RecipeTransformPanel.css';

/* RecipeTransformPanel — "make ANY recipe gluten-free / vegan / allergy-safe,
   or fuse it toward another cuisine," for real: a rewritten ingredient list
   with a plain reason per swap, not a filter that just hides recipes that
   don't already qualify.

   Rule-based on purpose (lib/recipeTransform.js) — every change is visible
   and inspectable, so the user stays in control of the result instead of
   trusting an opaque rewrite. Reuses the recipe's already-flagged allergens
   (AllergyPanel, right above this on the page) for the "my allergies" mode,
   and the app's real 8-region cuisine system for fusion — the same idea
   the landing page's TransformationExamples shows off as a static example,
   built here as the actual general engine behind it. */

const MODES = [
  { id: 'gluten-free', label: 'GLUTEN-FREE' },
  { id: 'vegan', label: 'VEGAN' },
  { id: 'healthier', label: 'HEALTHIER' },
  { id: 'remix', label: 'REMIX' },
  { id: 'fusion', label: 'FUSION ▾' },
];

export default function RecipeTransformPanel({ recipe, ingredients }) {
  const [mode, setMode] = useState(null);
  const [regionId, setRegionId] = useState(null);
  const [saved, setSaved] = useState(false);

  const flaggedHere = useMemo(() => flaggedAllergensInRecipe(ingredients), [ingredients]);

  const result = useMemo(() => {
    if (!mode) return null;
    if (mode === 'fusion' && !regionId) return null;
    return transformRecipe(
      { ...recipe, ingredients },
      mode,
      { regionId, allergenIds: flaggedHere.map(a => a.allergen) },
    );
  }, [mode, regionId, recipe, ingredients, flaggedHere]);

  if (!ingredients?.length) return null;

  function pickMode(m) {
    setMode(cur => (cur === m ? null : m));
    setSaved(false);
    if (m !== 'fusion') setRegionId(null);
  }

  function cookThisVersion() {
    if (!result || result.noChangesNeeded) return;
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(result));
      sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    } catch { /* ignore */ }
    // A hard navigation, not react-router's navigate() — RecipeFull reads
    // its recipe from sessionStorage once at mount, and we're already on
    // /recipe, so a soft navigation to the same path wouldn't remount it.
    window.location.assign('/recipe');
  }

  function saveThisVersion() {
    if (!result || result.noChangesNeeded) return;
    saveRecipe(result);
    setSaved(true);
  }

  return (
    <section className="rtp">
      <div className="rtp-title">TRANSFORM THIS RECIPE</div>
      <p className="rtp-sub">Real ingredient swaps, not a filter — pick a need and the whole recipe gets rewritten, with the reasoning shown.</p>

      <div className="rtp-modes">
        {MODES.map(m => (
          <button
            key={m.id}
            type="button"
            className={`rtp-mode${mode === m.id ? ' active' : ''}`}
            onClick={() => pickMode(m.id)}
          >{m.label}</button>
        ))}
        {flaggedHere.length > 0 && (
          <button
            type="button"
            className={`rtp-mode rtp-mode-allergy${mode === 'allergy-safe' ? ' active' : ''}`}
            onClick={() => pickMode('allergy-safe')}
          >MY ALLERGIES ({flaggedHere.length})</button>
        )}
      </div>

      {mode === 'fusion' && (
        <div className="rtp-regions">
          {REGIONS.map(r => (
            <button
              key={r.id}
              type="button"
              className={`rtp-region${regionId === r.id ? ' active' : ''}`}
              onClick={() => setRegionId(r.id)}
            >{r.label}</button>
          ))}
        </div>
      )}

      {mode === 'fusion' && !regionId && (
        <p className="rtp-hint">Pick a region above to fuse this dish toward its real flavor base.</p>
      )}

      {result?.noChangesNeeded && result.noRemixBase && (
        <p className="rtp-none">This recipe isn't built around a clear base to remix (rice, pasta, tortilla, bread, potato, eggs, oats, pancakes, or dough) — remix works best on dishes with one obvious carrier.</p>
      )}

      {result?.noChangesNeeded && !result.noRemixBase && (
        <p className="rtp-none">Good news — this recipe already fits {result.modeLabel}. Nothing here needs to change.</p>
      )}

      {result && !result.noChangesNeeded && (
        <div className="rtp-result">
          <div className="rtp-result-name">{result.name}</div>

          {result._transform.changes.length > 0 && (
            <div className="rtp-changes">
              {result._transform.changes.map((c, i) => (
                <div className="rtp-change-row" key={i}>
                  <div className="rtp-change-swap">
                    <span className="rtp-change-from">{c.original}</span>
                    <span className="rtp-change-arrow">→</span>
                    <span className="rtp-change-to">{c.replacement}</span>
                  </div>
                  <div className="rtp-change-reason">{c.reason}</div>
                </div>
              ))}
            </div>
          )}

          {result._transform.addedIngredients.length > 0 && (
            <div className="rtp-added">
              <div className="rtp-added-title">ADDS</div>
              <div className="rtp-added-items">
                {result._transform.addedIngredients.map((a, i) => <span className="rtp-added-item" key={i}>+ {a}</span>)}
              </div>
            </div>
          )}

          {result._transform.techniqueNotes.length > 0 && (
            <ul className="rtp-notes">
              {result._transform.techniqueNotes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}

          <div className="rtp-actions">
            <button type="button" className="rtp-cook" onClick={cookThisVersion}>Cook this version →</button>
            <button type="button" className="rtp-save" onClick={saveThisVersion} disabled={saved}>
              {saved ? '✓ Saved' : 'Save this version'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
