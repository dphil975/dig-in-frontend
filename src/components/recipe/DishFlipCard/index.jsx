import { useState } from 'react';
import { rateJournalEntry } from '../../../lib/journalApi';
import { diffIngredientList, toolSwapList, diffSummary } from '../../../lib/recipeDiff';
import { classifyLift } from '../../../lib/liftSignal';
import { recordHelp, tagKindness } from '../../../lib/happinessEngine';
import './DishFlipCard.css';

/* Front: the submitted photo + who made it + faithful/remix badge + rating.
   Back (click to flip): the ORIGINAL recipe this dish came from. Reuses the
   .flip-card/.flip-inner/.flip-front/.flip-back 3D-rotate TECHNIQUE from
   RecipeCards.css (not its classes — new `dfc-` prefix here to avoid any
   cross-component collision).

   The followed-vs-altered mark used to be just entry.isFaithful (a badge) +
   entry.remixNote (a caption) — real, but not a highlight. When the cook
   declared structured changes at submission (recipeDiff.js, via
   DishSubmissionModal), entry.recipeSnapshot.declaredChanges carries them,
   and the back face renders the ORIGINAL ingredient list with each changed
   line marked in place — swapped/omitted struck through, additions appended —
   instead of a separate bullet list bolted below the recipe. Entries without
   a declared diff (every entry before this, or anyone who only left the
   freeform note) fall back to the plain list exactly as before.

   THE NOTE — below the card, not inside it. Rating a dish was one tap and
   stayed one tap; the optional note is a second, separate step so nobody who
   just wants to rate and move on gets slowed down. It reuses the SAME
   backend upsert (rateJournalEntry already accepted a comment param end to
   end — nothing in the UI ever collected one until now). Sits outside
   .dfc-card on purpose: the card has a fixed 3D-flip geometry
   (height/overflow:hidden), and a growing textarea has no business inside
   that.

   When the note reads as a genuine lift (liftSignal.js — encouragement or
   "I've been there too," not just any reply), it fires the SAME two things
   happinessEngine.js has been declaring since it was written and nothing
   ever called: recordHelp() (your own Helping Hand tier) and tagKindness()
   (your own Kindness Chain log, and a real bump to your own Lightness).
   Fires on the SENDER's device only — these are client-local "my own stats"
   counters, not a claim about the recipient. */

const STARS = [1, 2, 3, 4, 5];

export default function DishFlipCard({ entry, currentUserId, onRated }) {
  const [flipped, setFlipped] = useState(false);
  const [rating, setRating] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [myStars, setMyStars] = useState(null);   // stars I just gave — lets an optional note upsert the same rating
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [noteSent, setNoteSent] = useState(false);
  const [lifted, setLifted] = useState(false);    // did MY note read as a genuine lift?

  const isOwn = currentUserId && entry.userId === currentUserId;
  const snapshot = entry.recipeSnapshot || {};
  const ingredients = Array.isArray(snapshot.ingredients) ? snapshot.ingredients : [];
  const steps = Array.isArray(snapshot.steps) ? snapshot.steps : [];
  const diff = snapshot.declaredChanges?.changeCount ? snapshot.declaredChanges : null;
  const diffLines = diff ? diffIngredientList(ingredients, diff) : null;
  const tools = diff ? toolSwapList(diff) : [];

  async function rate(stars, e) {
    e.stopPropagation();
    if (isOwn || rating) return;
    setRating(true);
    const res = await rateJournalEntry(entry.id, { stars });
    setRating(false);
    if (res.ok) { setMyStars(stars); onRated?.(entry.id, res); }
  }

  async function sendNote(e) {
    e.stopPropagation();
    const clean = note.trim();
    if (!clean || myStars == null || rating) return;
    setRating(true);
    const res = await rateJournalEntry(entry.id, { stars: myStars, comment: clean });
    setRating(false);
    if (!res.ok) return;
    setNoteSent(true);
    const lift = classifyLift(clean);
    if (lift.isLift) {
      setLifted(true);
      recordHelp();
      tagKindness(entry.displayName || entry.username || 'someone', clean);
    }
    onRated?.(entry.id, res);
  }

  return (
    <div className="dfc-wrap">
    <div className={`dfc-card${flipped ? ' flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
      <div className="dfc-inner">
        <div className="dfc-front">
          {entry.finalPhoto
            ? <img className="dfc-photo" src={entry.finalPhoto} alt={entry.dish} />
            : <div className="dfc-photo dfc-photo-ph">🍽️</div>}

          <div className="dfc-badge" data-faithful={entry.isFaithful === true}>
            {entry.isFaithful === false ? '🔀 Made It Their Own' : '✓ Followed As Written'}
          </div>

          <div className="dfc-name">{entry.dish}</div>
          <div className="dfc-by">by {entry.displayName || entry.username}</div>

          {diff && <div className="dfc-diff-chip">{diffSummary(diff)}</div>}
          {entry.isFaithful === false && entry.remixNote && (
            <div className="dfc-remix-note">"{entry.remixNote}"</div>
          )}

          <div className="dfc-rating" onClick={(e) => e.stopPropagation()}>
            {STARS.map(n => (
              <button
                key={n}
                type="button"
                className={`dfc-star${n <= (hoverStar || Math.round(entry.ratingAvg)) ? ' lit' : ''}`}
                disabled={isOwn || rating}
                onMouseEnter={() => setHoverStar(n)}
                onMouseLeave={() => setHoverStar(0)}
                onClick={(e) => rate(n, e)}
                aria-label={`Rate ${n} stars`}
              >★</button>
            ))}
            <span className="dfc-rating-count">
              {entry.ratingAvg ? entry.ratingAvg.toFixed(1) : '—'} ({entry.ratingCount || 0})
            </span>
          </div>
          {isOwn && <div className="dfc-own-hint">That's your dish!</div>}

          <div className="dfc-flip-hint">tap to see the recipe →</div>
        </div>

        <div className="dfc-back">
          <div className="dfc-back-kicker">ORIGINAL RECIPE</div>
          <div className="dfc-back-name">{snapshot.name || entry.dish}</div>

          {diffLines ? (
            <ul className="dfc-back-list dfc-diff-list">
              {diffLines.slice(0, 8).map((line, i) => (
                <li key={i} className={`dfc-diff-${line.state}`}>
                  {line.state === 'swapped' && (
                    <>
                      <span className="dfc-diff-struck">{line.text}</span>
                      {' → '}<span className="dfc-diff-used">{line.used}</span>
                    </>
                  )}
                  {line.state === 'omitted' && <span className="dfc-diff-struck">{line.text}</span>}
                  {line.state === 'added' && <>+ {line.text}</>}
                  {line.state === 'kept' && line.text}
                </li>
              ))}
            </ul>
          ) : ingredients.length > 0 && (
            <ul className="dfc-back-list">
              {ingredients.slice(0, 6).map((ing, i) => (
                <li key={i}>{typeof ing === 'string' ? ing : ing.name || ''}</li>
              ))}
            </ul>
          )}

          {tools.length > 0 && (
            <p className="dfc-back-tools">
              🔧 {tools.map((t, i) => (
                <span key={i}>{t.used} instead of {t.original}{i < tools.length - 1 ? ', ' : ''}</span>
              ))}
            </p>
          )}

          {steps.length > 0 && (
            <p className="dfc-back-steps">{steps.length} step{steps.length !== 1 ? 's' : ''}</p>
          )}
          {!ingredients.length && !steps.length && (
            <p className="dfc-back-missing">Recipe details weren't captured for this one.</p>
          )}
        </div>
      </div>
    </div>

    {/* Optional note — only once I've rated, never for my own dish. Outside
        the flip card entirely (see file header for why). */}
    {myStars != null && !isOwn && (
      <div className="dfc-note" onClick={(e) => e.stopPropagation()}>
        {noteSent ? (
          <p className="dfc-note-sent">
            {lifted ? "That'll mean a lot to them. 💛" : 'Note sent.'}
          </p>
        ) : noteOpen ? (
          <>
            <textarea
              className="dfc-note-input"
              placeholder="Leave a note? (optional)"
              value={note}
              maxLength={280}
              onChange={(e) => setNote(e.target.value)}
            />
            <button type="button" className="dfc-note-send" disabled={!note.trim() || rating} onClick={sendNote}>
              Send
            </button>
          </>
        ) : (
          <button type="button" className="dfc-note-open" onClick={() => setNoteOpen(true)}>
            💬 Leave a note
          </button>
        )}
      </div>
    )}
    </div>
  );
}
