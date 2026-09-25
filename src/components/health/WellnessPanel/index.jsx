import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nutrientTags, healthySwapsFor, recordSwapMade } from '../../../lib/wellnessGoals';
import './WellnessPanel.css';

/* Nutrient tags + healthy swaps, right on the recipe — non-diet framing
   throughout ("nourishing," never "diet"). Swaps are matched against what's
   actually in THIS recipe's ingredient list, not a generic tip list. */

export default function WellnessPanel({ ingredients }) {
  const navigate = useNavigate();
  const [used, setUsed] = useState(new Set());

  const tags = useMemo(() => nutrientTags(ingredients), [ingredients]);
  const swaps = useMemo(() => healthySwapsFor(ingredients), [ingredients]);

  if (!ingredients?.length || (tags.length === 0 && swaps.length === 0)) return null;

  function markUsed(swapName) {
    recordSwapMade();
    setUsed(s => new Set(s).add(swapName));
  }

  return (
    <section className="wnp">
      <div className="wnp-head">
        <div className="wnp-title">NOURISHMENT NOTES</div>
        <button type="button" className="wnp-manage" onClick={() => navigate('/wellness')}>
          My wellness goals →
        </button>
      </div>

      {tags.length > 0 && (
        <div className="wnp-tags">
          {tags.map(t => <span key={t.id} className="wnp-tag">{t.label}</span>)}
        </div>
      )}

      {swaps.length > 0 && (
        <div className="wnp-swaps">
          {swaps.map(s => (
            <div key={s.swap} className="wnp-swap-row">
              <span className="wnp-swap-name">{s.swap} →</span>
              <span className="wnp-swap-options">{s.options.join(', ')}</span>
              <button
                type="button"
                className={`wnp-swap-btn${used.has(s.swap) ? ' used' : ''}`}
                onClick={() => markUsed(s.swap)}
                disabled={used.has(s.swap)}
              >
                {used.has(s.swap) ? '✓ Used it' : 'I used this swap'}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
