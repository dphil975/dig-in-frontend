import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { activeRun, elapsedLabel, runProgress } from '../../../lib/storeRun';
import './RunTimerBar.css';

/* RunTimerBar (the bar itself) — loaded by ./index.jsx only when a run is open.

   RunTimerBar — the run clock, everywhere.

   The Store Run's timer only existed inside the pantry page, which made it
   useless in the one situation it's for: you're in the aisle, you wandered
   off to look up a recipe or check the map, and now you have no idea whether
   you've been in here nine minutes or thirty. A timer you have to navigate
   back to isn't a timer, it's a page element.

   So it's global (rendered once in App.jsx, like the nav) and it renders
   NOTHING unless a run is genuinely open — no run, no bar, no chrome tax on
   any other page. It hides itself on the pantry page too, where the real
   HUD is already on screen and a second clock would just be a duplicate.

   Tapping it goes back to the run. */

const TICK_MS = 1000;
const HOME = '/pantry';   // where the full run HUD lives

export default function RunTimerBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [run, setRun] = useState(() => activeRun());
  const [, tick] = useState(0);

  /* Re-read on navigation (the run may have been started or finished on
     another page) and tick once a second while one is open. */
  useEffect(() => { setRun(activeRun()); }, [pathname]);

  useEffect(() => {
    if (!run) return undefined;
    const t = setInterval(() => {
      const live = activeRun();
      // If the run ended elsewhere, drop the bar rather than counting forever.
      if (!live) { setRun(null); return; }
      tick(n => n + 1);
    }, TICK_MS);
    return () => clearInterval(t);
  }, [run]);

  if (!run || pathname === HOME) return null;

  const p = runProgress(run);

  return (
    <button
      type="button"
      className="rtb"
      onClick={() => navigate(HOME)}
      aria-label={`Shopping run in progress, ${elapsedLabel(run)} elapsed, ${p.found} of ${p.total} found. Back to the run.`}
    >
      <span className="rtb-dot" aria-hidden="true" />
      <span className="rtb-clock">{elapsedLabel(run)}</span>
      <span className="rtb-meta">
        <span className="rtb-count">{p.found}/{p.total}</span>
        <span className="rtb-label">found</span>
      </span>
      <span className="rtb-bar" aria-hidden="true"><span style={{ width: `${p.pct}%` }} /></span>
    </button>
  );
}
