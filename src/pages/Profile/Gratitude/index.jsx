import { useState } from 'react';
import { Sun, Send } from 'lucide-react';
import { getGratitude, logGratitude } from '../../../lib/happinessEngine';
import ProfilePane from '../ProfilePane';

/* Profile → Gratitude log — the running list of things you've been grateful
   for. It used to sit on Nova's Nest page; it now lives here, behind the "⋯"
   menu on the Profile tabs (no tab of its own). Nova's walk-through still adds
   to it — same store — so nothing about how entries get logged changed. */

export default function Gratitude() {
  const [items, setItems] = useState(() => getGratitude());
  const [draft, setDraft] = useState('');

  function add() {
    const t = draft.trim();
    if (!t) return;
    logGratitude(t);
    setItems(getGratitude());
    setDraft('');
  }

  return (
    <ProfilePane>
      <section className="profile-section">
        <h3 className="section-title"><Sun size={16} style={{ verticalAlign: '-2px' }} /> GRATITUDE LOG</h3>
        {items.length ? (
          <ul className="pgrat-list">
            {items.map(g => (
              <li key={g.id}>
                <span>{g.text}</span>
                <span className="pgrat-when">{new Date(g.at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="profile-hint">Nothing logged yet. Finish a walk in Nova's Nest, or add one below.</p>
        )}
        <div className="pgrat-entry">
          <input
            className="pgrat-input"
            placeholder="Grateful for…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add(); }}
          />
          <button type="button" className="borough-btn active" onClick={add} disabled={!draft.trim()} aria-label="Add">
            <Send size={14} />
          </button>
        </div>
      </section>
    </ProfilePane>
  );
}
