import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { getTopNudge, dismissNudge, dominantCravingArchetype } from '../../../lib/novaNudges';
import { stockAheadList } from '../../../lib/cravingTracker';
import { todaysRitual } from '../../../lib/recess';
import { suggestRecipes } from '../../../lib/pantryTools';
import { RECIPE_INGREDIENTS, RECIPES_STATIC } from '../../../data/recipesStatic';
import './NovaNudge.css';

/* Floating "right-moment" nudge card, driven by lib/novaNudges.

   Drops into any page. It only renders when a nudge window is actually open
   (most hours: nothing), so it stays out of the way. Re-checks every minute so
   it can appear/disappear as windows open and close without a reload. Dismiss
   is remembered for the rest of the day (per nudge). Context (how many recipes
   you can cook from your pantry right now) sharpens the copy. */

function loadPantry() {
  try { const v = JSON.parse(localStorage.getItem('dig_in_pantry') || '[]'); return Array.isArray(v) ? v : []; }
  catch { return []; }
}

export default function NovaNudge() {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const [gone, setGone] = useState(false);

  // Re-evaluate the clock every minute — windows open and close on their own.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const ctx = useMemo(() => {
    const pantry = loadPantry();
    let suggestionCount = 0;
    try { suggestionCount = suggestRecipes(pantry, RECIPE_INGREDIENTS, RECIPES_STATIC).length; } catch { /* ignore */ }
    // Recess context: whether you've already shown up today (so its nudge can
    // stand down) + today's I Spy round to preview in the card.
    let recessDone = false, recessSpy = null;
    try { const r = todaysRitual(); recessDone = r.showedUp; recessSpy = r.spy; } catch { /* ignore */ }
    return {
      pantryCount: pantry.length, suggestionCount,
      craving: dominantCravingArchetype(), stockAhead: stockAheadList(),
      recessDone, recessSpy,
    };
  }, [now]);

  const nudge = useMemo(() => getTopNudge(now, ctx), [now, ctx]);

  const onDismiss = useCallback(() => {
    if (nudge) dismissNudge(nudge.id);
    setGone(true);
  }, [nudge]);

  // Reset the local "gone" flag when a different nudge takes over.
  useEffect(() => { setGone(false); }, [nudge?.id]);

  if (!nudge || gone) return null;

  return (
    <div className={`nudge-card${nudge.convenience ? ' is-convenience' : ''}`} role="status">
      <button className="nudge-x" onClick={onDismiss} aria-label="Dismiss"><X size={15} /></button>

      <div className="nudge-top">
        <span className="nudge-icon" aria-hidden="true">{nudge.icon}</span>
        <div className="nudge-heads">
          <span className="nudge-nova">NOVA</span>
          {nudge.convenienceTag && <span className="nudge-tag">{nudge.convenienceTag}</span>}
          {nudge.craving && <span className="nudge-tag nudge-tag-craving">{nudge.craving.emoji} {nudge.craving.label.toUpperCase()}</span>}
        </div>
      </div>

      <p className="nudge-title">{nudge.title}</p>
      <p className="nudge-body">{nudge.body}</p>

      <div className="nudge-actions">
        <button className="nudge-cta" onClick={() => { onDismiss(); navigate(nudge.cta.route); }}>
          {nudge.cta.label} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
