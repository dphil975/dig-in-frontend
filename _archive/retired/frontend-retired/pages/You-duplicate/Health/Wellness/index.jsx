import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../../components/shell/Nav';
import { getCookingStats, getCookHistory } from '../../../../services/saveService';
import {
  WELLNESS_GOALS, loadGoals, toggleGoal, getSwapsMadeCount,
  loadMindfulJournal, logMindfulEntry, removeMindfulEntry,
  FEEL_BEFORE_OPTIONS, FEEL_DURING_OPTIONS, FEEL_AFTER_OPTIONS,
} from '../../../../lib/wellnessGoals';
import './Wellness.css';

/* Wellness & Body Goals — a non-diet home for goal toggles, a mindful-eating
   journal, and progress that celebrates rather than shames. "Your body is a
   vessel for all the wonderful things you'll do and eat" — energizing,
   nourishing, supporting; never "diet" or "weight loss." Progress reuses the
   REAL cook-count already tracked by saveService.js (markCooked/getCookingStats)
   instead of inventing a parallel counter. */

export default function Wellness({ embedded = false } = {}) {
  const navigate = useNavigate();
  const [goals, setGoals] = useState(loadGoals);
  const [journal, setJournal] = useState(loadMindfulJournal);
  const [form, setForm] = useState({ ate: '', feltBefore: '', feltDuring: '', feltAfter: '' });

  const stats = useMemo(() => getCookingStats(), []);
  const distinctTried = useMemo(() => {
    const history = getCookHistory();
    return new Set(history.map(e => e.id ?? e.name)).size;
  }, []);
  const swapsMade = useMemo(() => getSwapsMadeCount(), [journal]);

  function pickGoal(id) { setGoals(toggleGoal(id)); }

  function pick(field, value) {
    setForm(f => ({ ...f, [field]: f[field] === value ? '' : value }));
  }

  function submitEntry(e) {
    e.preventDefault();
    if (!form.ate.trim()) return;
    setJournal(logMindfulEntry(form));
    setForm({ ate: '', feltBefore: '', feltDuring: '', feltAfter: '' });
  }

  function removeEntry(id) { setJournal(removeMindfulEntry(id)); }

  return (
    <div className="wel-page">
      {!embedded && <Nav />}
      <div className="wel-wrap">
        {!embedded && <button className="wel-back" onClick={() => navigate(-1)}>← BACK</button>}

        <header className="wel-head">
          <h1 className="wel-title">WELLNESS</h1>
          <p className="wel-sub">
            Your body is a vessel for all the wonderful things you'll do and eat. This is about feeling
            energized and nourished — not restriction. No diet talk, no weight numbers.
          </p>
        </header>

        {/* Progress — real numbers, celebratory framing */}
        <section className="wel-section">
          <div className="wel-section-title">HOW IT'S GOING</div>
          <div className="wel-stats">
            <div className="wel-stat">
              <span className="wel-stat-num">{stats.totalCooked}</span>
              <span className="wel-stat-label">meals cooked</span>
            </div>
            <div className="wel-stat">
              <span className="wel-stat-num">{distinctTried}</span>
              <span className="wel-stat-label">recipes tried</span>
            </div>
            <div className="wel-stat">
              <span className="wel-stat-num">{swapsMade}</span>
              <span className="wel-stat-label">healthy swaps made</span>
            </div>
          </div>
          {stats.totalCooked > 0 && (
            <p className="wel-hint">Every meal you cook is a small win — keep going.</p>
          )}
        </section>

        {/* Goal toggles */}
        <section className="wel-section">
          <div className="wel-section-title">WHAT DO YOU WANT TO FOCUS ON?</div>
          <p className="wel-hint">Pick as many as you like — these shape the swaps and tags you see on recipes.</p>
          <div className="wel-goals">
            {WELLNESS_GOALS.map(g => (
              <button
                key={g.id}
                type="button"
                className={`wel-goal${goals.includes(g.id) ? ' active' : ''}`}
                onClick={() => pickGoal(g.id)}
              >
                <span className="wel-goal-label">{g.label}</span>
                <span className="wel-goal-blurb">{g.blurb}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Mindful eating journal */}
        <section className="wel-section">
          <div className="wel-section-title">MINDFUL EATING JOURNAL</div>
          <p className="wel-hint">Notice how you feel before, during, and after — no judgment, just awareness.</p>
          <form className="wel-form" onSubmit={submitEntry}>
            <input
              className="wel-input"
              placeholder="What did you eat?"
              value={form.ate}
              onChange={e => setForm(f => ({ ...f, ate: e.target.value }))}
              required
            />
            <div className="wel-feel-row">
              <div className="wel-feel-group">
                <div className="wel-feel-label">Before eating</div>
                <div className="wel-feel-chips">
                  {FEEL_BEFORE_OPTIONS.map(o => (
                    <button key={o} type="button" className={`wel-chip${form.feltBefore === o ? ' active' : ''}`} onClick={() => pick('feltBefore', o)}>{o}</button>
                  ))}
                </div>
              </div>
              <div className="wel-feel-group">
                <div className="wel-feel-label">While eating</div>
                <div className="wel-feel-chips">
                  {FEEL_DURING_OPTIONS.map(o => (
                    <button key={o} type="button" className={`wel-chip${form.feltDuring === o ? ' active' : ''}`} onClick={() => pick('feltDuring', o)}>{o}</button>
                  ))}
                </div>
              </div>
              <div className="wel-feel-group">
                <div className="wel-feel-label">After eating</div>
                <div className="wel-feel-chips">
                  {FEEL_AFTER_OPTIONS.map(o => (
                    <button key={o} type="button" className={`wel-chip${form.feltAfter === o ? ' active' : ''}`} onClick={() => pick('feltAfter', o)}>{o}</button>
                  ))}
                </div>
              </div>
            </div>
            <button type="submit" className="wel-submit">LOG THIS MEAL</button>
          </form>

          {journal.length > 0 && (
            <div className="wel-journal-list">
              {journal.slice(0, 15).map(entry => (
                <div className="wel-journal-row" key={entry.id}>
                  <div className="wel-journal-main">
                    <div className="wel-journal-ate">{entry.ate}</div>
                    <div className="wel-journal-meta">
                      {[entry.feltBefore && `Before: ${entry.feltBefore}`, entry.feltDuring && `During: ${entry.feltDuring}`, entry.feltAfter && `After: ${entry.feltAfter}`].filter(Boolean).join(' · ') || 'No feelings noted'}
                    </div>
                  </div>
                  <button type="button" className="wel-journal-remove" onClick={() => removeEntry(entry.id)} aria-label="Remove entry">✕</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
