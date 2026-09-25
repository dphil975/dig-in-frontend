import { useNavigate } from 'react-router-dom';
import './RecipeAlchemist.css';

/* AlchemistTeaser — a compact callout for pages that shouldn't embed the full
   Kitchen Alchemist tool (e.g. mid-scroll in Browse), pointing to its one real
   home on the Recipes hub's Invent tab. Kitchen Alchemist used to be mounted
   in full here AND on the Invent tab — the same big tool appearing twice on
   one page was a real source of the "disorganized" feel; this replaces that
   duplicate with a single-line entry point instead. */
export default function AlchemistTeaser() {
  const navigate = useNavigate();
  return (
    <button type="button" className="alch-teaser" onClick={() => navigate('/recipes?tab=invent')}>
      <span className="alch-teaser-emoji" aria-hidden="true">🧪</span>
      <span className="alch-teaser-txt">
        <span className="alch-teaser-kicker">KITCHEN ALCHEMIST</span>
        <span className="alch-teaser-line">Describe a craving, or tell us what's in your fridge — we'll invent the recipe.</span>
      </span>
      <span className="alch-btn alch-btn-primary" style={{ pointerEvents: 'none' }}>TRY IT →</span>
    </button>
  );
}
