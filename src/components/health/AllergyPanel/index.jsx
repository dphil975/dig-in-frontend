import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scanRecipeAllergens } from '../../../lib/allergyProfile';
import './AllergyPanel.css';

/* Allergen warnings + substitutions, right on the recipe — the highest-value
   part of allergy tracking: it changes what you actually see on a recipe,
   not just a settings screen nobody visits. Only allergens the shopper has
   flagged in their profile (Profile → Allergies & Sensitivities) show as a
   warning; everything else detected in the ingredient list stays quiet. */

export default function AllergyPanel({ ingredients }) {
  const navigate = useNavigate();
  const [showSubs, setShowSubs] = useState({});

  const detected = useMemo(() => scanRecipeAllergens(ingredients), [ingredients]);
  const flagged = detected.filter(d => d.userStatus);

  if (!ingredients?.length || detected.length === 0) return null;

  function toggleSubs(allergen) {
    setShowSubs(s => ({ ...s, [allergen]: !s[allergen] }));
  }

  return (
    <section className="alp">
      <div className="alp-head">
        <div className="alp-title">ALLERGENS IN THIS RECIPE</div>
        <button type="button" className="alp-manage" onClick={() => navigate('/allergies')}>
          Manage my allergies →
        </button>
      </div>

      {flagged.length > 0 ? (
        <div className="alp-warnings">
          {flagged.map(d => (
            <div key={d.allergen} className={`alp-warning alp-${d.userStatus}`}>
              <div className="alp-warning-head">
                <span className="alp-warning-dot" />
                <span className="alp-warning-label">{d.label}</span>
                <span className="alp-warning-status">{d.userStatus === 'allergy' ? 'ALLERGY' : 'SENSITIVITY'}</span>
              </div>
              <div className="alp-warning-found">Found from: {d.matchedKeywords.join(', ')}</div>
              {d.substitutions.length > 0 && (
                <>
                  <button type="button" className="alp-subs-toggle" onClick={() => toggleSubs(d.allergen)}>
                    {showSubs[d.allergen] ? 'Hide substitutions' : 'Show substitutions'}
                  </button>
                  {showSubs[d.allergen] && (
                    <ul className="alp-subs-list">
                      {d.substitutions.map(s => <li key={s}>{s}</li>)}
                    </ul>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="alp-quiet">
          This recipe contains {detected.map(d => d.label.toLowerCase()).join(', ')} — none of it flagged in your profile.
        </div>
      )}
    </section>
  );
}
