import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchFoodCopycat } from '../../pages/CopycatLab/restaurantCopycats';
import { dominantFactors, balanceRead, FACTOR_BY_KEY } from '../../lib/tasteEngine';
import './CopycatPanel.css';

/* CopycatPanel — Copycat Lab, right on the recipe it's relevant to. Matches
   THIS recipe's name against the restaurant-copycat knowledge base (see
   restaurantCopycats.js's matchFoodCopycat) and, when it hits, shows the
   compact taste-factor read the full lab already computes — reusing
   tasteEngine.js's dominantFactors()/balanceRead(), not rebuilt here — plus
   the store-vs-home price gap and a link into the merged Copycat & Drinks
   hub for the full breakdown. Renders nothing for recipes with no match,
   same "only show up when relevant" rule as AllergyPanel/WellnessPanel. */

export default function CopycatPanel({ recipe }) {
  const navigate = useNavigate();
  const match = useMemo(() => matchFoodCopycat(recipe?.name), [recipe?.name]);

  if (!match) return null;

  const dom = dominantFactors(match.tasteFactors, 3);
  const gap = match.storePrice - match.homeCost;

  return (
    <section className="cpp">
      <div className="cpp-head">
        <div className="cpp-title">TASTES LIKE {match.brandLabel.toUpperCase()}</div>
        <button type="button" className="cpp-open" onClick={() => navigate('/copycat')}>
          Open Copycat Lab →
        </button>
      </div>

      <p className="cpp-name">
        This reads like a home take on <b>{match.name}</b> — here's what actually carries that flavor.
      </p>

      {dom.length > 0 && (
        <div className="cpp-factors">
          {dom.map(k => (
            <span key={k} className="cpp-factor">{FACTOR_BY_KEY[k]?.label}</span>
          ))}
        </div>
      )}

      <p className="cpp-read">{balanceRead(match.tasteFactors)}</p>

      {gap > 0 && (
        <p className="cpp-savings">
          Buying it there runs about <b>${match.storePrice.toFixed(2)}</b> {match.servingsNote || ''} — making it
          at home costs closer to <b>${match.homeCost.toFixed(2)}</b>, roughly <b>${gap.toFixed(2)}</b> back in
          your pocket every time.
        </p>
      )}
    </section>
  );
}
