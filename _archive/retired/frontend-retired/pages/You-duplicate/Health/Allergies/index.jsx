import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../../components/shell/Nav';
import {
  ALLERGENS, loadAllergyProfile, setAllergenStatus,
  loadJournal, logReaction, removeJournalEntry, detectPatterns,
  SYMPTOM_CATEGORIES, SEVERITY_LEVELS, TIMING_OPTIONS, ANAPHYLAXIS_NOTE,
} from '../../../../lib/allergyProfile';
import './Allergies.css';

/* Allergies & Sensitivities — flag what you react to once, and every recipe
   you open (AllergyPanel, in RecipeFull) warns you and offers a substitution
   automatically. Also a personal symptom journal — see allergyProfile.js for
   the honest limits (keyword-derived detection, not a diagnosis engine). */

const STATUS_META = {
  safe:        { label: 'Safe',        tone: '#96B36B' },
  sensitivity: { label: 'Sensitivity', tone: '#6E8259' },
  allergy:     { label: 'Allergy',     tone: '#6E8259' },
};

export default function Allergies({ embedded = false } = {}) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(loadAllergyProfile);
  const [journal, setJournal] = useState(loadJournal);
  const patterns = useMemo(() => detectPatterns(), [journal]);

  const [form, setForm] = useState({
    mealName: '', suspected: '', symptoms: new Set(), severity: 'mild', timing: TIMING_OPTIONS[1],
  });

  function cycleStatus(allergenId) {
    const current = profile[allergenId] || null;
    const next = current === null ? 'sensitivity' : current === 'sensitivity' ? 'allergy' : null;
    setProfile(setAllergenStatus(allergenId, next));
  }

  function toggleSymptom(s) {
    setForm(f => {
      const next = new Set(f.symptoms);
      if (next.has(s)) next.delete(s); else next.add(s);
      return { ...f, symptoms: next };
    });
  }

  function submitReaction(e) {
    e.preventDefault();
    if (!form.suspected.trim() && form.symptoms.size === 0) return;
    const list = logReaction({
      mealName: form.mealName,
      suspectedIngredients: form.suspected.split(',').map(s => s.trim()).filter(Boolean),
      symptoms: [...form.symptoms],
      severity: form.severity,
      timing: form.timing,
    });
    setJournal(list);
    setForm({ mealName: '', suspected: '', symptoms: new Set(), severity: 'mild', timing: TIMING_OPTIONS[1] });
  }

  function removeEntry(id) { setJournal(removeJournalEntry(id)); }

  return (
    <div className="alg-page">
      {!embedded && <Nav />}
      <div className="alg-wrap">
        {!embedded && <button className="alg-back" onClick={() => navigate(-1)}>← BACK</button>}

        <header className="alg-head">
          <h1 className="alg-title">ALLERGIES &amp; SENSITIVITIES</h1>
          <p className="alg-sub">
            Flag what you react to, and every recipe you open will warn you and offer a substitution —
            no more re-reading ingredient lists by hand.
          </p>
        </header>

        {/* Allergen grid */}
        <section className="alg-section">
          <div className="alg-section-title">YOUR ALLERGENS</div>
          <p className="alg-hint">Tap to cycle: safe → sensitivity → allergy → safe.</p>
          <div className="alg-grid">
            {ALLERGENS.map(a => {
              const status = profile[a.id] || 'safe';
              const meta = STATUS_META[status];
              return (
                <button key={a.id} type="button" className="alg-chip" style={{ '--tone': meta.tone }} onClick={() => cycleStatus(a.id)}>
                  <span className="alg-chip-dot" />
                  <span className="alg-chip-label">{a.label}</span>
                  <span className="alg-chip-status">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Patterns detected from the journal */}
        {patterns.length > 0 && (
          <section className="alg-section">
            <div className="alg-section-title">WORTH TRACKING FURTHER</div>
            <div className="alg-patterns">
              {patterns.map(p => (
                <div className="alg-pattern-row" key={p.ingredient}>
                  <span className="alg-pattern-name">{p.ingredient}</span>
                  <span className="alg-pattern-count">logged in {p.count} reactions</span>
                </div>
              ))}
            </div>
            <p className="alg-hint">Not a diagnosis — worth mentioning to a doctor or allergist.</p>
          </section>
        )}

        {/* Log a reaction */}
        <section className="alg-section">
          <div className="alg-section-title">LOG A REACTION</div>
          <form className="alg-form" onSubmit={submitReaction}>
            <input
              className="alg-input"
              placeholder="What did you eat? (optional)"
              value={form.mealName}
              onChange={e => setForm(f => ({ ...f, mealName: e.target.value }))}
            />
            <input
              className="alg-input"
              placeholder="Suspected ingredient(s), comma separated"
              value={form.suspected}
              onChange={e => setForm(f => ({ ...f, suspected: e.target.value }))}
            />

            <div className="alg-symptom-groups">
              {SYMPTOM_CATEGORIES.map(cat => (
                <div className="alg-symptom-group" key={cat.id}>
                  <div className="alg-symptom-cat">{cat.label}</div>
                  <div className="alg-symptom-chips">
                    {cat.symptoms.map(s => (
                      <button
                        key={s}
                        type="button"
                        className={`alg-symptom-chip${form.symptoms.has(s) ? ' active' : ''}`}
                        onClick={() => toggleSymptom(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="alg-form-row">
              <label className="alg-form-label">
                Severity
                <select className="alg-select" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                  {SEVERITY_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="alg-form-label">
                Timing
                <select className="alg-select" value={form.timing} onChange={e => setForm(f => ({ ...f, timing: e.target.value }))}>
                  {TIMING_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>

            <button type="submit" className="alg-submit">LOG THIS REACTION</button>
          </form>
        </section>

        {/* Journal */}
        {journal.length > 0 && (
          <section className="alg-section">
            <div className="alg-section-title">YOUR JOURNAL <span className="alg-count">{journal.length}</span></div>
            <div className="alg-journal-list">
              {journal.slice(0, 20).map(entry => (
                <div className="alg-journal-row" key={entry.id}>
                  <div className="alg-journal-main">
                    <div className="alg-journal-meal">{entry.mealName || 'Unnamed meal'}</div>
                    <div className="alg-journal-meta">
                      {entry.suspectedIngredients.join(', ') || 'no ingredients noted'} · {entry.severity} · {entry.timing}
                    </div>
                    {entry.symptoms.length > 0 && <div className="alg-journal-symptoms">{entry.symptoms.join(', ')}</div>}
                  </div>
                  <button type="button" className="alg-journal-remove" onClick={() => removeEntry(entry.id)} aria-label="Remove entry">✕</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        <section className="alg-section alg-education">
          <div className="alg-section-title">RECOGNIZING A REACTION</div>
          <div className="alg-edu-grid">
            {SYMPTOM_CATEGORIES.map(cat => (
              <div className="alg-edu-card" key={cat.id}>
                <div className="alg-edu-cat">{cat.label}</div>
                <div className="alg-edu-symptoms">{cat.symptoms.join(', ')}</div>
              </div>
            ))}
          </div>
          <p className="alg-anaphylaxis">{ANAPHYLAXIS_NOTE}</p>
        </section>
      </div>
    </div>
  );
}
