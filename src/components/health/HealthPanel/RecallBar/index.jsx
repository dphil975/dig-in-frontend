import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  cachedPantryRecalls, refreshPantryRecalls, fetchRecentRecalls,
  activeRecallHits, recipeRecallHits,
} from '../../../../lib/health/recalls';
import { fmtRecallDate } from '../../../../lib/pantry/barcodeLookup';
import './RecallBar.css';

/* RecallBar — a real, honest banner for real FDA (openFDA) recall matches.
   Renders nothing when there's nothing to show (the same rule as every other
   honest-empty surface in this app).

   Two scopes, one banner:
     pantry (default)   what's actually in your pantry right now
     recipe             the ingredients of the dish in front of you
                        (pass `ingredients`): a recall that matches something you
                        own, or a serious recent one that names an ingredient
   It reads the shared cache instantly (no network call on render), then kicks
   off a background refresh — throttled to once a day inside lib/health/recalls.js
   — so the banner stays current even if you never open the Pantry. Only live
   recalls raise it (ongoing, or recent and not closed out). */

function loadPantry() {
  try { const v = JSON.parse(localStorage.getItem('dig_in_pantry')); return Array.isArray(v) ? v : []; }
  catch { return []; }
}

export default function RecallBar({ ingredients = null }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const recipeScope = Array.isArray(ingredients);
  const linesKey = recipeScope ? ingredients.join('|') : '';

  const read = useMemo(() => (
    recipeScope
      ? () => recipeRecallHits(ingredients, loadPantry().map((i) => String(i?.name || '').toLowerCase()).filter(Boolean))
      : () => activeRecallHits(cachedPantryRecalls(loadPantry()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [recipeScope, linesKey]);

  const [hits, setHits] = useState(read);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(recipeScope);   // about to cook: show the recall itself

  useEffect(() => {
    setHits(read());
    let alive = true;
    // A recipe reads the general recall feed; the pantry checks its own items.
    const refresh = recipeScope
      ? fetchRecentRecalls({ limit: 12 })
      : (loadPantry().length ? refreshPantryRecalls(loadPantry()) : Promise.resolve());
    refresh.then(() => { if (alive) setHits(read()); }).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [read]);

  if (dismissed || !hits.length) return null;

  const serious = hits.some((h) => (h.recalls[0]?.classification || '').trim() === 'Class I');
  const what = recipeScope
    ? `ingredient${hits.length !== 1 ? 's' : ''} in this recipe`
    : `item${hits.length !== 1 ? 's' : ''} in your pantry`;

  return (
    <div className="recallbar" role="alert">
      <div className="recallbar-head">
        <span className="recallbar-icon" aria-hidden="true">⚠</span>
        <span className="recallbar-line">
          <b>{hits.length}</b> {what} may be affected by a real FDA recall
          {serious ? ' — including at least one Class I (serious)' : ''}.
        </span>
        <button type="button" className="recallbar-toggle" onClick={() => setExpanded((e) => !e)}>
          {expanded ? 'Hide' : 'Review'}
        </button>
        <button type="button" className="recallbar-dismiss" onClick={() => setDismissed(true)} aria-label="Dismiss">✕</button>
      </div>
      {expanded && (
        <div className="recallbar-body">
          {hits.map((h, i) => (
            <div className="recallbar-item" key={i}>
              <div className="recallbar-item-head">
                <b>{h.name}</b>
                <span className="recallbar-item-date">{fmtRecallDate(h.recalls[0]?.date)}</span>
              </div>
              <p className="recallbar-item-desc">{h.recalls[0]?.description}</p>
              {h.recalls[0]?.reason && <p className="recallbar-item-reason"><b>Reason:</b> {h.recalls[0].reason}</p>}
            </div>
          ))}
          {!recipeScope && pathname !== '/pantry' && (
            <button type="button" className="recallbar-go" onClick={() => navigate('/pantry')}>
              Review in your Pantry →
            </button>
          )}
          <p className="recallbar-note">
            Text-matched against the FDA's public recall feed — verify the brand and lot/date code before assuming it's your
            exact item. Full details at{' '}
            <a href="https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts" target="_blank" rel="noreferrer">FDA.gov</a>.
          </p>
        </div>
      )}
    </div>
  );
}
