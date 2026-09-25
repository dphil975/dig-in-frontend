import { useMemo } from 'react';
import { safeTempsForRecipe, formatTemp, DANGER_ZONE_F } from '../../../lib/foodSafety';
import './FoodSafetyPanel.css';

/* FoodSafetyPanel — the specific safe-cooking-temperature facts that apply
   to THIS recipe's actual proteins (not a generic food-safety essay),
   pulled from foodSafety.js's real USDA-standard reference table. Renders
   nothing for recipes with no protein that needs an explicit safe temp
   (a salad, a dessert) — this is meant to show up exactly when it matters. */

export default function FoodSafetyPanel({ ingredients }) {
  const temps = useMemo(() => safeTempsForRecipe(ingredients), [ingredients]);

  if (!ingredients?.length || temps.length === 0) return null;

  return (
    <section className="fsp">
      <div className="fsp-title">SAFE COOKING TEMPERATURES</div>
      <p className="fsp-sub">
        Use a food thermometer in the thickest part, not touching bone — color and clear juices aren't proof.
      </p>
      <div className="fsp-temps">
        {temps.map(t => (
          <div className="fsp-temp-row" key={t.id}>
            <span className="fsp-temp-label">{t.label}</span>
            <span className="fsp-temp-val">{formatTemp(t)}</span>
          </div>
        ))}
      </div>
      <p className="fsp-note">
        Leftovers from this dish: refrigerate within 2 hours (1 hour if it's hot out), and reheat to 165°F (74°C) —
        food sits in the bacteria-friendly "danger zone" between {DANGER_ZONE_F[0]}°F and {DANGER_ZONE_F[1]}°F.
      </p>
    </section>
  );
}
