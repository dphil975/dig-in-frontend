import NovaSprite from '../NovaSprite';
import { freshnessLabel } from '../../../lib/freshness';
import './NovaUseItUp.css';

/* "Nova, what do I make?" — the expiring-ingredients rescue card.

   Appears in the Pantry only when something's about to turn. Nova names the
   items and answers her own question with recipes that actually use them (fed
   from suggestRecipes over just the expiring set), so food gets cooked instead
   of tossed. Cooking one closes the loop into the "I made this" celebration. */

const titleCase = s => String(s).replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());

// Which of the about-to-turn items does this recipe lean on? (for the "uses" line)
function usesFromExpiring(expiring, haveIngredients) {
  return expiring
    .filter(e => {
      const words = String(e.item.name).toLowerCase().split(/\s+/).filter(w => w.length > 2);
      return haveIngredients.some(ing => {
        const il = ing.toLowerCase();
        return words.some(w => il.includes(w));
      });
    })
    .map(e => e.item.name);
}

export default function NovaUseItUp({ expiring = [], suggestions = [], onCook }) {
  if (!expiring.length) return null;

  const n = expiring.length;
  const names = expiring.slice(0, 3).map(e => titleCase(e.item.name));
  const nameList = names.join(', ') + (n > 3 ? `, +${n - 3} more` : '');
  const top = suggestions.slice(0, 3);

  return (
    <section className="nuiu">
      <div className="nuiu-head">
        <NovaSprite look="pink" h={44} title="Nova" />
        <div className="nuiu-head-text">
          <div className="nuiu-title">NOVA · WHAT DO I MAKE?</div>
          <p className="nuiu-line">
            {n === 1
              ? <>Your <strong>{names[0]}</strong> is about to turn.</>
              : <><strong>{n} things</strong> are about to turn — {nameList}.</>}
            {top.length > 0 ? " Here's what I'd make before you lose them:" : ''}
          </p>
        </div>
      </div>

      <div className="nuiu-chips">
        {expiring.slice(0, 8).map(e => (
          <span key={e.item.id} className={`nuiu-chip nuiu-${e.status}`}>
            {titleCase(e.item.name)} · {freshnessLabel(e.daysLeft)}
          </span>
        ))}
      </div>

      {top.length > 0 ? (
        <div className="nuiu-recipes">
          {top.map(({ recipe, have, missing, coverage }) => {
            const uses = usesFromExpiring(expiring, have);
            return (
              <div className="nuiu-recipe" key={recipe.id ?? recipe.name}>
                <div className="nuiu-recipe-main">
                  <div className="nuiu-recipe-name">{recipe.name}</div>
                  <div className="nuiu-recipe-meta">
                    <span className="nuiu-cov">{Math.round((coverage || 0) * 100)}% on hand</span>
                    {uses.length > 0 && <span className="nuiu-uses">uses {uses.slice(0, 2).map(titleCase).join(' + ')}</span>}
                    {missing?.length > 0 && <span className="nuiu-missing">{missing.length} to grab</span>}
                  </div>
                </div>
                <button className="nuiu-cook" onClick={() => onCook?.(recipe)}>COOK →</button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="nuiu-empty">
          Nothing in your recipe box uses these yet — freeze what you can, or toss them into a
          fridge-clear-out stir-fry or soup tonight.
        </p>
      )}
    </section>
  );
}
