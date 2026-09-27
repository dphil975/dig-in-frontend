import { useEffect, useMemo, useState } from 'react';
import NovaSprite from '../../../nova/NovaSprite';
import { saveMemory } from '../../../../lib/memoryVault';
import { pickReaction } from '../../../../lib/novaReactions';
import { loadSettings } from '../../../../lib/novaSettings';
import { saveMealPrepFavorite, isMealPrepFavorite } from '../../../../lib/mealPrepFavorites';
import './CookCelebration.css';

/* Dedicated "you cooked it" moment — the payoff at the end of the
   Crave → Route → Cook → Vault loop. Nova shows up to celebrate, the win is
   quantified (coins, streak, total, any newly-unlocked cuisine), and the next
   step in the loop (leftovers → Pantry) is offered rather than dead-ending.

   The line itself comes from novaReactions.js's pickReaction('cook', ...) —
   the same engine driving her reactions on the Vault and a check-in — so
   she's one companion in the same voice everywhere, not a separate script
   here and a separate script there. */

export default function CookCelebration({ recipe, result, coinsEarned = 0, elapsedMin = null, estimateMin = null, newBadges = [], onClose, onLeftovers, onSubmitToLeaderboard }) {
  const [mealPrepSaved, setMealPrepSaved] = useState(() => isMealPrepFavorite(recipe));

  function saveForMealPrep() {
    if (!recipe || mealPrepSaved) return;
    saveMealPrepFavorite(recipe);
    setMealPrepSaved(true);
  }

  // Lock body scroll while the moment is up.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const tone = useMemo(() => loadSettings().tone, []);
  const reaction = useMemo(() => pickReaction('cook', {
    dishName: recipe?.name || 'a dish',
    totalCooked: result?.totalCooked || 0,
    streak: result?.streak || 0,
    newCountry: result?.newCountries?.[0] || null,
  }, tone), [recipe, result, tone]);

  const line = reaction?.text || `You actually made ${recipe?.name || 'a dish'}. That's the whole thing — you showed up and cooked.`;

  // Every cook is a keepsake — tuck this celebration into the Memory Vault
  // (deduped by the cook's timestamp so it saves exactly once), same
  // saveMemory() the Vault/check-in/pantry reactions already use.
  useEffect(() => {
    if (!recipe || !reaction?.saveable) return;
    saveMemory({
      kind: reaction.kind,
      text: `You made ${recipe.name || 'a dish'}. ${line}`,
      context: { type: 'cook', dish: recipe.name || null, image: recipe.image || null },
      dedupeKey: `cook:${result?.entry?.cookedAt || recipe.name || Date.now()}`,
    });
  }, [recipe, result, reaction, line]);

  const streak      = result?.streak || 0;
  const totalCooked = result?.totalCooked || 0;
  const newCountry  = result?.newCountries?.[0] || null;

  return (
    <div className="cc-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="cc-card" role="dialog" aria-label="Dish cooked">
        <button className="cc-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="cc-confetti" aria-hidden="true">
          {['#6E8259', '#96B36B', '#E0A32E', '#D8CAB4', '#6E8259', '#E0A32E'].map((c, i) => (
            <span key={i} style={{ '--cc-c': c, '--cc-i': i }} />
          ))}
        </div>

        <div className="cc-nova">
          <NovaSprite look="pink" h={72} title="Nova" />
        </div>

        <div className="cc-kicker">YOU MADE IT</div>
        <h2 className="cc-dish">{recipe?.name || 'Your dish'}</h2>

        {recipe?.image ? (
          <>
            <div className="cc-image"><img src={recipe.image} alt={recipe.name} /></div>
            {recipe.imageCredit && (
              <a
                className="cc-image-credit"
                href={recipe.imageCredit.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Photo: {recipe.imageCredit.author} / {recipe.imageCredit.source}
              </a>
            )}
          </>
        ) : (
          <div className="cc-image cc-image-ph">{(recipe?.cuisine || recipe?.country || 'DIG IN')}</div>
        )}

        <p className="cc-line">“{line}”</p>

        <div className="cc-stats">
          {coinsEarned > 0 && (
            <div className="cc-stat">
              <span className="cc-stat-val">+{coinsEarned}</span>
              <span className="cc-stat-label">NOVA COINS</span>
            </div>
          )}
          {streak > 0 && (
            <div className="cc-stat">
              <span className="cc-stat-val">🔥 {streak}</span>
              <span className="cc-stat-label">DAY STREAK</span>
            </div>
          )}
          <div className="cc-stat">
            <span className="cc-stat-val">{totalCooked}</span>
            <span className="cc-stat-label">DISHES COOKED</span>
          </div>
        </div>

        {newCountry && (
          <div className="cc-unlock">NEW CUISINE UNLOCKED · {String(newCountry).toUpperCase()}</div>
        )}

        {newBadges.length > 0 && (
          <div className="cc-badge-callout">
            <NovaSprite look="pink" h={22} title="Nova" />
            <span>Nova's proud of you — {newBadges.map(b => `${b.icon} ${b.label}`).join(', ')}</span>
          </div>
        )}

        {elapsedMin != null && (
          <div className="cc-timing">
            Finished in {elapsedMin} min
            {estimateMin != null && estimateMin > 0 && (
              elapsedMin <= estimateMin
                ? ` — ${estimateMin - elapsedMin} min ahead of the ${estimateMin} min estimate!`
                : ` — ${elapsedMin - estimateMin} min over the ${estimateMin} min estimate.`
            )}
          </div>
        )}

        <div className="cc-actions">
          {onSubmitToLeaderboard && (
            <button className="cc-btn cc-btn-primary" onClick={onSubmitToLeaderboard}>
              SUBMIT TO LEADERBOARD →
            </button>
          )}
          <button className="cc-btn cc-btn-primary" onClick={onLeftovers}>
            ADD LEFTOVERS TO PANTRY →
          </button>
          <button className="cc-btn cc-btn-ghost" onClick={saveForMealPrep} disabled={mealPrepSaved}>
            {mealPrepSaved ? 'SAVED FOR MEAL-PREP ✓' : 'ATE IT ALL? SAVE FOR PREP DAY'}
          </button>
          <button className="cc-btn cc-btn-ghost" onClick={onClose}>DONE</button>
        </div>

        <div className="cc-saved">Saved to your cookbook</div>
      </div>
    </div>
  );
}
