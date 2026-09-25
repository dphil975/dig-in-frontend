import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { priceRecipe, getUserTier, setUserTier, TIERS, TIER_NAME } from '../../../lib/tierBudget';
import './TierBudgetPanel.css';

/* "Your budget, your brand" — the income-tier layer on a recipe.

   Reads the shopper's local income tier (from the area they browsed on the Food
   Map) and shows the same dish routed to the brands + store + price that fit
   that tier, next to what the plate would cost eaten out. The tier is
   overridable right here — nobody's boxed in by where they live. */

export default function TierBudgetPanel({ ingredients, recipe }) {
  const navigate = useNavigate();
  const [tier, setTier] = useState(getUserTier);

  const priced = useMemo(() => priceRecipe(ingredients, recipe, tier), [ingredients, recipe, tier]);

  if (!ingredients?.length) return null;

  function pick(t) { setTier(t); setUserTier(t); }

  const buyRows = priced.rows.filter(r => !r.onHand);

  return (
    <section className="tbp">
      <div className="tbp-head">
        <div className="tbp-title">YOUR BUDGET, YOUR BRAND</div>
        <div className="tbp-tiers">
          {TIERS.map(t => (
            <button
              key={t}
              className={`tbp-tier${tier === t ? ' active' : ''} tbp-tier-${t}`}
              onClick={() => pick(t)}
              aria-pressed={tier === t}
            >
              {TIER_NAME[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="tbp-storeline">
        Shopping <strong>{TIER_NAME[tier]}</strong> · {priced.store}
      </div>

      <div className="tbp-rows">
        {buyRows.map((r, i) => (
          <div className="tbp-row" key={i}>
            <span className="tbp-row-name">{r.name}</span>
            <span className="tbp-row-arrow">→</span>
            <span className="tbp-row-brand">{r.brand}</span>
            <span className="tbp-row-price">${r.price.toFixed(2)}</span>
          </div>
        ))}
        {priced.onHandCount > 0 && (
          <div className="tbp-onhand">+ {priced.onHandCount} pantry staple{priced.onHandCount !== 1 ? 's' : ''} you likely have</div>
        )}
      </div>

      <div className="tbp-totals">
        <div className="tbp-total-block">
          <div className="tbp-total-num">${priced.perServing.toFixed(2)}</div>
          <div className="tbp-total-label">per serving to cook<br />(${priced.total.toFixed(2)} for {priced.servings})</div>
        </div>
        <div className="tbp-vs">vs</div>
        <div className="tbp-total-block tbp-total-out">
          <div className="tbp-total-num">${priced.dineOutPer}</div>
          <div className="tbp-total-label">per plate eaten out</div>
        </div>
      </div>

      {priced.savingsPer > 0 && (
        <div className="tbp-save">
          You keep <strong>${priced.savingsPer.toFixed(2)} a plate</strong> — that's the price of a night out you cook instead.
        </div>
      )}

      <button className="tbp-find" onClick={() => navigate('/')}>
        Find these at a store near you →
      </button>
    </section>
  );
}
