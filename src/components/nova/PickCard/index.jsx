import RecallBar from '../../health/RecallBar';
import { cleanTitle } from '../../../lib/platform/native';
import './PickCard.css';

/* Nova's pick — one dish, why she chose it, and what to do about it.

     pick      { recipe, reason, minutes, social } from lib/nova/pick.js, or null
     loading   the recipe list is still on its way
     canSwap   show "Show me something else" (once the check-in is settled)
     saved     this dish is already in your collection
     note      a short line from Nova under the reason (after a swap or a save)

   If an ingredient in the dish is on a live FDA recall, the recall banner sits
   right inside the card. */
export default function PickCard({ pick, loading, canSwap, saved, note, onCook, onCookIntent, onSwap, onSave }) {
  if (!pick) {
    return (
      <section className="npc npc-empty" aria-label="Nova's pick" aria-busy={loading}>
        <p className="npc-label">Nova's pick</p>
        <p className="npc-line">{loading ? 'Picking something for you…' : "I couldn't find a dish just now. Try the search below."}</p>
      </section>
    );
  }

  const { recipe, reason, minutes, social } = pick;
  const cuisine = recipe.cuisine || recipe.country || '';
  const meta = [
    minutes ? `${minutes} min` : '',
    recipe.difficulty ? String(recipe.difficulty).toLowerCase() : '',
    social,
    cuisine,
  ].filter(Boolean).join(' · ');
  const credit = recipe.image && recipe.imageCredit;

  return (
    <section className="npc" aria-label="Nova's pick">
      <div className="npc-head">
        <p className="npc-label">Nova's pick</p>
        <button
          type="button"
          className={`npc-save${saved ? ' is-saved' : ''}`}
          onClick={onSave}
          disabled={saved}
          aria-label={saved ? 'Saved' : 'Save this recipe'}
        >
          {saved ? '♥ Saved' : '♡ Save'}
        </button>
      </div>

      <div className="npc-body">
        <div className="npc-img">
          <span className="npc-ph">{cuisine || 'DIG IN'}</span>
          {recipe.image && (
            <img
              src={recipe.image}
              alt={recipe.name}
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
        </div>
        <div className="npc-text">
          <h2 className="npc-name">{cleanTitle(recipe.name) || recipe.name}</h2>
          <p className="npc-meta">{meta}</p>
          <p className="npc-reason" aria-live="polite">{reason}</p>
          {note && <p className="npc-note">{note}</p>}
          <div className="npc-actions">
            <button
              type="button"
              className="npc-btn npc-btn-primary"
              onClick={onCook}
              onPointerEnter={onCookIntent}
              onFocus={onCookIntent}
            >
              Cook with Nova
            </button>
            {canSwap && (
              <button type="button" className="npc-btn" onClick={onSwap}>Show me something else</button>
            )}
          </div>
        </div>
      </div>

      {credit && (
        <a className="npc-credit" href={recipe.imageCredit.url} target="_blank" rel="noopener noreferrer">
          Photo: {recipe.imageCredit.author} / {recipe.imageCredit.source}
        </a>
      )}

      <RecallBar ingredients={recipe.ingredients || []} />
    </section>
  );
}
