import { useMemo, useState } from 'react';
import { hydrationFor } from '../../../lib/hydrationCheck';
import { MECHANISM, RECIPES as HYDRATION_RECIPES } from '../../../lib/hydrationDIY';
import './HydrationPanel.css';

/* HydrationPanel — "this meal will make you thirsty, and here's the real
   reason why," on the recipe page.

   Follows the same contract as the other RecipeFull panels (WellnessPanel,
   GutHealthPanel, FoodSafetyPanel): takes the recipe's real ingredient list,
   and RETURNS NULL when there's nothing genuine to say. That silence is
   deliberate — a plain bowl of buttered pasta gets no banner, because a
   panel that fires on every recipe is one people learn to scroll past.

   The fiber case is the headline and the honest centerpiece: soluble fiber
   works BY absorbing water, so a big fiber load without fluid alongside it
   genuinely does the opposite of what you wanted. That's a mechanism, not a
   wellness slogan.

   The DIY electrolyte recipes only appear when the drivers actually warrant
   them (real sweat/heat mechanisms — capsaicin or alcohol), rather than
   pitching a drink recipe at every meal. Same "don't cry wolf" logic that
   keeps caffeine de-escalated inside hydrationCheck itself. */

const LEVEL_COPY = {
  notable: 'Worth keeping water on the table',
  mild: 'One small thing worth knowing',
};

export default function HydrationPanel({ ingredients }) {
  const [openDriver, setOpenDriver] = useState(null);
  const [showDiy, setShowDiy] = useState(false);

  const read = useMemo(() => hydrationFor({ ingredients }), [ingredients]);

  if (!ingredients?.length || read.level === 'none') return null;

  // Electrolytes are only a real answer for genuine sweat/fluid-loss drivers.
  // Fiber needs plain water; caffeine needs nothing at all.
  const warrantsElectrolytes = read.drivers.some(d => d.id === 'capsaicin' || d.id === 'alcohol');

  return (
    <section className={`hyd hyd-${read.level}`} aria-labelledby="hyd-head">
      <div className="hyd-head">
        <span className="hyd-icon" aria-hidden="true">💧</span>
        <div>
          <h3 className="hyd-title" id="hyd-head">{read.headline}</h3>
          <p className="hyd-level">{LEVEL_COPY[read.level]}</p>
        </div>
      </div>

      <ul className="hyd-drivers">
        {read.drivers.map(d => {
          const open = openDriver === d.id;
          return (
            <li key={d.id} className="hyd-driver">
              <button
                type="button"
                className={`hyd-driver-btn${open ? ' open' : ''}`}
                aria-expanded={open}
                onClick={() => setOpenDriver(open ? null : d.id)}
              >
                <span className="hyd-driver-label">{d.label}</span>
                <span className="hyd-driver-chev" aria-hidden="true">{open ? '−' : '+'}</span>
              </button>

              {/* Show the work: the actual ingredient lines that triggered it,
                  so this reads as a finding about THIS recipe rather than a
                  generic assertion. */}
              <p className="hyd-matched">
                {d.matched.slice(0, 3).join(' · ')}
                {d.matched.length > 3 && ` · +${d.matched.length - 3} more`}
              </p>

              {open && (
                <div className="hyd-why">
                  <p>{d.why}</p>
                  <p className="hyd-advice"><strong>What to do:</strong> {d.advice}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {warrantsElectrolytes && (
        <div className="hyd-diy">
          <button
            type="button"
            className="hyd-diy-toggle"
            aria-expanded={showDiy}
            onClick={() => setShowDiy(v => !v)}
          >
            {showDiy ? '−' : '+'} Plain water not cutting it? Make the drink instead of buying it
          </button>
          {showDiy && (
            <div className="hyd-diy-body">
              <p className="hyd-mechanism">{MECHANISM}</p>
              <ul className="hyd-diy-list">
                {HYDRATION_RECIPES.slice(0, 2).map(r => (
                  <li key={r.id}>
                    <strong>{r.name}</strong>
                    <span>{(r.ingredients || []).join(', ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="hyd-disclaimer">{read.disclaimer}</p>
    </section>
  );
}
