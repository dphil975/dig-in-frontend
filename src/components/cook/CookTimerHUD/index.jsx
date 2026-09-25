import { useEffect, useState } from 'react';
import { elapsedMs } from '../../../lib/cookTimer';
import './CookTimerHUD.css';

/* CookTimerHUD — the "timer you can see while cooking on the side."
   Docked, live-updating, rendered alongside RecipeStepViewer once the cook
   has entered the method steps. Purely a display — cookTimer.js owns the
   actual start/stop stamps so this survives unmount/remount. */

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export default function CookTimerHUD({ recipeId, estimateMin }) {
  // Only used to force a re-render once a second — elapsedMs() reads the
  // real clock each render, this state is otherwise unread.
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!recipeId) return null;
  const ms = elapsedMs(recipeId);
  if (!ms) return null;

  const elapsedMin = ms / 60000;
  const behind = estimateMin ? Math.round(elapsedMin - estimateMin) : null;

  return (
    <div className="cth-hud" role="status" aria-label="Cook timer">
      <span className="cth-icon">⏱</span>
      <span className="cth-elapsed">{formatElapsed(ms)}</span>
      {estimateMin ? (
        <span className="cth-estimate">
          · est. {estimateMin} min
          {behind != null && behind > 0 && <span className="cth-behind"> · {behind} min over</span>}
          {behind != null && behind <= 0 && <span className="cth-ahead"> · {Math.abs(behind)} min ahead</span>}
        </span>
      ) : null}
    </div>
  );
}
