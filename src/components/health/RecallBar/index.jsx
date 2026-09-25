import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cachedPantryRecalls, refreshPantryRecalls } from '../../../lib/recallWatch';
import { fmtRecallDate } from '../../../lib/barcodeLookup';
import './RecallBar.css';

/* RecallBar — "funnel in an information bar... anything that's happening,
   like the Taylor Farms situation" — a real, honest bar at the top of the
   feed surfacing REAL FDA openFDA recall matches against what's actually in
   the user's pantry right now. Renders nothing when there's nothing to show
   (same rule as every other honest-empty surface in this app).

   Reads the shared cache instantly (lib/recallWatch.js — no network call on
   render), then kicks off a background refresh (throttled to once/day per
   item internally) so the feed itself keeps this current even if the user
   never opens the Pantry page directly. */
function loadPantry() {
  try { const v = JSON.parse(localStorage.getItem('dig_in_pantry')); return Array.isArray(v) ? v : []; }
  catch { return []; }
}

export default function RecallBar() {
  const navigate = useNavigate();
  const [hits, setHits] = useState(() => cachedPantryRecalls(loadPantry()));
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const pantry = loadPantry();
    if (!pantry.length) return;
    let alive = true;
    refreshPantryRecalls(pantry).then(({ hitsByName }) => {
      if (!alive) return;
      const list = Object.values(hitsByName);
      if (list.length) setHits(list);
    });
    return () => { alive = false; };
  }, []);

  if (dismissed || !hits.length) return null;

  const worst = hits.reduce((acc, h) => {
    const cls = (h.recalls[0]?.classification || '').trim();
    return cls === 'Class I' ? cls : acc;
  }, hits[0]?.recalls[0]?.classification || '');

  return (
    <div className="recallbar">
      <div className="recallbar-head">
        <span className="recallbar-icon">⚠</span>
        <span className="recallbar-line">
          <b>{hits.length}</b> item{hits.length !== 1 ? 's' : ''} in your pantry may be affected by a real FDA recall
          {worst === 'Class I' ? ' — including at least one Class I (serious)' : ''}.
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
          <button type="button" className="recallbar-go" onClick={() => navigate('/pantry')}>
            Review in your Pantry →
          </button>
          <p className="recallbar-note">
            Text-matched against the FDA's public recall feed — verify the lot/date code before assuming it's your
            exact item. Full details at{' '}
            <a href="https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts" target="_blank" rel="noreferrer">FDA.gov</a>.
          </p>
        </div>
      )}
    </div>
  );
}
