import { useEffect, useState } from 'react';
import { capturePhoto } from '../../../../lib/native';
import { loadRecipeBooks } from '../../../../lib/recipeBooks';
import { createJournalEntry } from '../../../../lib/journalApi';
import { useAuth } from '../../../../hooks/useAuth';
import { makeChange, isCompleteChange, computeDiff, describeChange } from '../../../../lib/recipeDiff';
import './DishSubmissionModal.css';

/* The "put this dish in front of the community" moment. Shared by both entry
   points: RecipeFull's "I MADE THIS" flow (passes the full `recipe` object,
   already has a photo) and CookJournal's retroactive "Submit to Leaderboard"
   (only has `recipeId`/`recipeName` — this component resolves the full recipe
   from the corpus to build a real recipe_snapshot, falling back to a minimal
   one if it's not found, same "honest under partial data" pattern used
   elsewhere in the app).

   Faithful-vs-remixed is STILL a self-report at the top level (the two big
   toggle buttons below), and that stays deliberate — this app's house style
   favors an honest heuristic over fake precision, and there is still no
   attempt anywhere to infer a diff from freeform text.

   What changed (recipeDiff.js): when someone picks "Made It My Own," they can
   now declare EACH change structurally — "I used X instead of Y," "I left Y
   out," "I added Z" — rather than only a caption. Every line the flip card
   later highlights is something the cook explicitly said, not something
   guessed. The freeform note is kept alongside it; it's still the one place
   for the part a structured field can't capture ("my grandmother's version"). */

function buildSnapshot(r) {
  if (!r) return {};
  return {
    name: r.name || '',
    ingredients: r.ingredients || [],
    steps: r.instructions || r.steps || [],
    image: r.image || '',
    cuisine: r.country || r.cuisine || '',
  };
}

export default function DishSubmissionModal({
  recipe,
  recipeId,
  recipeName,
  initialPhoto,
  onClose,
  onSubmitted,
}) {
  const { user } = useAuth();
  const [photo, setPhoto] = useState(initialPhoto || null);
  const [resolvedRecipe, setResolvedRecipe] = useState(recipe || null);
  const [isFaithful, setIsFaithful] = useState(null); // null = not chosen yet
  const [remixNote, setRemixNote] = useState('');
  const [changes, setChanges] = useState([]);          // declared swap/omit/add entries
  const [draft, setDraft] = useState(makeChange({ kind: 'swap' }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function addChange() {
    if (!isCompleteChange(draft)) return;
    setChanges((list) => [...list, draft]);
    setDraft(makeChange({ kind: draft.kind, field: draft.field }));
  }
  function removeChange(i) {
    setChanges((list) => list.filter((_, idx) => idx !== i));
  }

  const dishName = recipe?.name || recipeName || 'your dish';

  // CookJournal only hands us a recipeId/recipeName — look up the full
  // recipe so the flip card's back face has real ingredients/steps, not
  // just a name.
  useEffect(() => {
    if (recipe || resolvedRecipe) return;
    let alive = true;
    loadRecipeBooks().then((pool) => {
      if (!alive) return;
      const match = pool.find(
        (r) => (recipeId && r.id === recipeId) ||
               (recipeName && (r.name || '').toLowerCase() === recipeName.toLowerCase())
      );
      if (match) setResolvedRecipe(match);
    });
    return () => { alive = false; };
  }, [recipe, resolvedRecipe, recipeId, recipeName]);

  async function takePhoto() {
    const dataUrl = await capturePhoto({ source: 'prompt' });
    if (dataUrl) setPhoto(dataUrl);
  }

  async function submit() {
    if (!photo || isFaithful === null || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const snapshot = recipe ? buildSnapshot(recipe) : (resolvedRecipe ? buildSnapshot(resolvedRecipe) : { name: dishName });
      // Structured changes ride inside recipeSnapshot (already a free-form
      // jsonb blob server-side — see node/routes/journal.js) rather than a
      // dedicated column, so this ships without a backend migration. If this
      // ever needs server-side querying (e.g. "show me every swap of X for Y"
      // across users), it should graduate to its own column then.
      if (!isFaithful) {
        const diff = computeDiff(changes);
        if (diff.changeCount) snapshot.declaredChanges = diff;
      }
      const displayName = user?.user_metadata?.username || user?.email || user?.phone || 'A Home Cook';
      await createJournalEntry({
        username: displayName,
        displayName,
        dish: dishName,
        finalPhoto: photo,
        recipeId: recipe?.id || recipeId || '',
        recipeSnapshot: snapshot,
        isFaithful,
        remixNote: isFaithful ? '' : remixNote.trim(),
        visibility: 'judged',
      });
      onSubmitted?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Could not submit right now — try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dsm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="dsm-card" role="dialog" aria-label="Submit to the leaderboard">
        <button className="dsm-close" onClick={onClose} aria-label="Close">✕</button>

        <p className="dsm-kicker">SUBMIT TO THE LEADERBOARD</p>
        <h2 className="dsm-title">{dishName}</h2>

        <div className="dsm-photo-slot">
          {photo ? (
            <img src={photo} alt={dishName} className="dsm-photo" />
          ) : (
            <button type="button" className="dsm-photo-btn" onClick={takePhoto}>
              📷 Add a photo of your dish
            </button>
          )}
          {photo && (
            <button type="button" className="dsm-retake" onClick={takePhoto}>Retake</button>
          )}
        </div>

        <p className="dsm-q">Did you follow the recipe, or make it your own?</p>
        <div className="dsm-toggle">
          <button
            type="button"
            className={`dsm-toggle-btn${isFaithful === true ? ' active' : ''}`}
            onClick={() => setIsFaithful(true)}
          >
            ✓ Followed As Written
          </button>
          <button
            type="button"
            className={`dsm-toggle-btn${isFaithful === false ? ' active' : ''}`}
            onClick={() => setIsFaithful(false)}
          >
            🔀 Made It My Own
          </button>
        </div>

        {isFaithful === false && (
          <>
            <input
              type="text"
              className="dsm-note"
              placeholder="What did you change? (optional)"
              value={remixNote}
              onChange={(e) => setRemixNote(e.target.value)}
              maxLength={140}
            />

            {/* Structured, declared changes — what the flip card's back face
                actually highlights against the original ingredient list.
                Optional: the freeform note above still works alone. */}
            <div className="dsm-changes">
              <p className="dsm-changes-label">Mark exactly what changed (optional)</p>

              {changes.length > 0 && (
                <ul className="dsm-change-list">
                  {changes.map((c, i) => (
                    <li key={i} className="dsm-change-chip">
                      <span>{describeChange(c)}</span>
                      <button type="button" onClick={() => removeChange(i)} aria-label="Remove this change">✕</button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="dsm-change-row">
                <select
                  className="dsm-change-kind"
                  value={draft.kind}
                  onChange={(e) => setDraft({ ...draft, kind: e.target.value })}
                >
                  <option value="swap">Swapped</option>
                  <option value="omit">Left out</option>
                  <option value="add">Added</option>
                </select>
                <select
                  className="dsm-change-field"
                  value={draft.field}
                  onChange={(e) => setDraft({ ...draft, field: e.target.value })}
                >
                  <option value="ingredient">Ingredient</option>
                  <option value="tool">Tool</option>
                </select>
              </div>

              <div className="dsm-change-row">
                {draft.kind !== 'add' && (
                  <input
                    type="text"
                    className="dsm-change-input"
                    placeholder={draft.field === 'tool' ? 'called-for tool' : 'called-for ingredient'}
                    value={draft.original}
                    onChange={(e) => setDraft({ ...draft, original: e.target.value })}
                    maxLength={60}
                  />
                )}
                {draft.kind !== 'omit' && (
                  <input
                    type="text"
                    className="dsm-change-input"
                    placeholder={draft.kind === 'add' ? 'what you added' : 'what you used instead'}
                    value={draft.used}
                    onChange={(e) => setDraft({ ...draft, used: e.target.value })}
                    maxLength={60}
                  />
                )}
                <button
                  type="button"
                  className="dsm-change-add"
                  disabled={!isCompleteChange(draft)}
                  onClick={addChange}
                >
                  +
                </button>
              </div>
            </div>
          </>
        )}

        {error && <p className="dsm-error">{error}</p>}

        <button
          type="button"
          className="dsm-submit"
          disabled={!photo || isFaithful === null || submitting}
          onClick={submit}
        >
          {submitting ? 'Submitting…' : 'SUBMIT'}
        </button>
      </div>
    </div>
  );
}
