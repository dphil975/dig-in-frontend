import { useEffect, useState } from 'react';
import { loadJournal, journalStats, markSharedToCircle } from '../../../lib/cookJournal';
import { listCircles, createPost } from '../../../lib/circlesApi';
import DishSubmissionModal from '../../cook/DishSubmissionModal';
import './CookJournal.css';

/* CookJournal — a private, low-stakes scrapbook of every dish someone has
   actually cooked, built from photos that already existed (no extra photo
   step). Nothing here is public by default. Sharing a specific entry into a
   real friend Circle is one deliberate tap per entry — never automatic,
   never a public feed. Answers the "I want to document my cooking but I
   don't want to be judged" tension directly: the audience is opt-in and it's
   always people you already know. */

function SharePicker({ entry, onDone }) {
  const [circles, setCircles] = useState(null);
  const [posting, setPosting] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => { listCircles().then(setCircles); }, []);

  async function share(circle) {
    setPosting(circle.id);
    const res = await createPost(circle.id, {
      text: `Made "${entry.recipeName}" tonight 🍽️`,
      image: entry.pixelUrl || '',
    });
    setPosting(null);
    if (res.ok) {
      markSharedToCircle(entry.id, circle.id);
      setResult('Shared ✓');
      setTimeout(onDone, 900);
    } else {
      setResult(res.error || 'Could not share right now.');
    }
  }

  return (
    <div className="cj-share-pop">
      {circles === null ? (
        <p className="cj-share-hint">Loading your circles…</p>
      ) : circles.length === 0 ? (
        <p className="cj-share-hint">
          Join or start a Kitchen Table Circle first — that's where this goes.
        </p>
      ) : (
        <ul className="cj-share-list">
          {circles.map((c) => (
            <li key={c.id}>
              <button type="button" disabled={!!posting} onClick={() => share(c)}>
                {posting === c.id ? 'Sharing…' : c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {result && <p className="cj-share-result">{result}</p>}
      <button type="button" className="cj-share-cancel" onClick={onDone}>Close</button>
    </div>
  );
}

export default function CookJournal() {
  const [entries, setEntries] = useState(() => loadJournal());
  const [stats, setStats] = useState(() => journalStats());
  const [sharingId, setSharingId] = useState(null);
  const [submittingEntry, setSubmittingEntry] = useState(null);

  const closeShare = () => {
    setSharingId(null);
    setEntries(loadJournal());
  };

  if (!entries.length) {
    return (
      <div className="cj-empty">
        Nothing logged yet — the first time you hit "I MADE THIS" on a recipe,
        it lands here automatically. Just for you, unless you choose to share it.
      </div>
    );
  }

  return (
    <div className="cj-wrap">
      <p className="cj-stats">
        {stats.total} dish{stats.total === 1 ? '' : 'es'} documented · {stats.thisMonth} this month
      </p>
      <div className="cj-grid">
        {entries.map((e) => {
          const d = new Date(e.at);
          return (
            <div key={e.id} className="cj-card">
              {e.pixelUrl ? (
                <img src={e.pixelUrl} alt={e.recipeName} className="cj-img" />
              ) : (
                <div className="cj-img cj-img-placeholder">🍽️</div>
              )}
              <div className="cj-info">
                <span className="cj-name">{e.recipeName}</span>
                <span className="cj-date">
                  {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                {e.note && <p className="cj-note">{e.note}</p>}
                <div className="cj-actions">
                  {e.sharedTo?.length > 0 ? (
                    <span className="cj-shared-tag">Shared ✓</span>
                  ) : sharingId === e.id ? (
                    <SharePicker entry={e} onDone={closeShare} />
                  ) : (
                    <button type="button" className="cj-share-btn" onClick={() => setSharingId(e.id)}>
                      Share to a Circle →
                    </button>
                  )}
                  <button type="button" className="cj-share-btn" onClick={() => setSubmittingEntry(e)}>
                    Submit to Leaderboard →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {submittingEntry && (
        <DishSubmissionModal
          recipeId={submittingEntry.recipeId}
          recipeName={submittingEntry.recipeName}
          initialPhoto={submittingEntry.pixelUrl}
          onClose={() => setSubmittingEntry(null)}
        />
      )}
    </div>
  );
}
