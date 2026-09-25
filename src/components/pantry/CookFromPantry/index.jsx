import { useNavigate } from 'react-router-dom';

/* Recipes you can make from what's in the pantry right now. Extracted out of
   Pantry/index.jsx (was pushing 1,200+ lines) — presentational given the
   already-computed `suggestions`, plus its own "cook this"/"open rolodex"
   navigation. */
export default function CookFromPantry({ suggestions, pantryCount, areaTier, onCook }) {
  const navigate = useNavigate();

  return (
    <section className="pantry-cook" id="pantry-cook">
      <div className="pantry-section-title">
        COOK FROM YOUR PANTRY <span className="pantry-count">{suggestions.length}</span>
        {pantryCount > 0 && (
          <button type="button" className="pantry-rolodex-link" onClick={() => navigate('/pantry-recipes')}>
            Open full rolodex →
          </button>
        )}
      </div>
      {pantryCount === 0 ? (
        <div className="pantry-empty">Stock a few items and we'll show what you can cook.</div>
      ) : suggestions.length === 0 ? (
        <div className="pantry-empty">Nothing matches yet — add a few more staples and check back.</div>
      ) : (
        <>
          {areaTier && (
            <p className="pantry-cook-tier">
              Tuned to your area{areaTier === 'budget' ? ' — leaning toward simpler, budget-friendly cooks' : areaTier === 'premium' ? ' — including a few more ambitious dishes' : ''}.
            </p>
          )}
          <div className="pantry-cook-grid">
            {suggestions.map(({ recipe, have, missing, coverage }) => (
              <div className="cook-card" key={recipe.id}>
                <div className="cook-card-head">
                  <span className="cook-card-name">{recipe.name}</span>
                  <span className="cook-card-cov">{Math.round(coverage * 100)}% in pantry</span>
                </div>
                <div className="cook-card-bar"><span style={{ width: `${Math.round(coverage * 100)}%` }} /></div>
                <div className="cook-card-have">Have: {have.slice(0, 5).join(', ')}{have.length > 5 ? '…' : ''}</div>
                {missing.length > 0 && (
                  <div className="cook-card-missing">
                    {missing.length <= 2 && <strong className="cook-card-almost">You're almost there — </strong>}
                    Need: {missing.slice(0, 4).join(', ')}{missing.length > 4 ? '…' : ''}
                  </div>
                )}
                <button className="pantry-btn pantry-btn-buy cook-card-btn" onClick={() => onCook(recipe)}>
                  COOK THIS →
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
