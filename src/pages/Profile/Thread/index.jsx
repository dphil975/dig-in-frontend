import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOOD_BY_ID } from '../../../lib/nova/kindnessProtocol';
import { threadEvents, returnCount } from '../../../lib/nova/thread';
import { moodInsight } from '../../../lib/moodColor';
import ProfilePane from '../ProfilePane';

/* Profile → Thread — the running record of you and Nova, newest first: how you
   felt, what she picked, what you saved, swapped and cooked, how it went. The ♥
   on the home screen is the number at the top: the days you've come back. */

const ANSWER = { better: 'feeling better', same: 'about the same', rough: 'still rough', skip: 'not now' };
const VERDICT = { loved: 'Loved it', fine: 'It was fine', no: 'Not for me', skip: 'Skipped' };

function line(e) {
  const mood = MOOD_BY_ID[e.mood];
  switch (e.type) {
    case 'checkin':  return { icon: mood?.emoji || '•', text: `Checked in: ${mood?.label || e.mood}`, note: e.note };
    case 'skip':     return { icon: '·', text: 'Skipped the check-in' };
    case 'followup': return { icon: '↺', text: `Followed up: ${ANSWER[e.answer] || e.answer}` };
    case 'pick':     return { icon: '✦', text: `Cooked with Nova: ${e.name}`, note: e.reason };
    case 'swap':     return { icon: '⇄', text: `Swapped away: ${e.name}` };
    case 'save':     return { icon: '♥', text: `Saved: ${e.name}` };
    case 'cook':     return { icon: '🍳', text: `Made: ${e.name}` };
    case 'reflect':  return { icon: '💬', text: `How it went${e.name ? ` — ${e.name}` : ''}: ${VERDICT[e.verdict] || e.verdict}` };
    default:         return null;
  }
}

function whenLabel(at) {
  const d = new Date(at);
  const days = Math.round((new Date(new Date().toDateString()) - new Date(d.toDateString())) / 86400000);
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (days === 0) return `Today · ${time}`;
  if (days === 1) return `Yesterday · ${time}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Thread() {
  const navigate = useNavigate();
  const [events, setEvents] = useState(() => threadEvents({ limit: 80 }));
  const returns = returnCount();
  const insight = moodInsight();

  useEffect(() => {
    const refresh = () => setEvents(threadEvents({ limit: 80 }));
    window.addEventListener('dig_in_thread', refresh);
    return () => window.removeEventListener('dig_in_thread', refresh);
  }, []);

  const rows = events.map((e) => ({ e, l: line(e) })).filter((r) => r.l);

  return (
    <ProfilePane>
      <section className="profile-section">
        <h3 className="section-title">THE RETURN IS {returns}</h3>
        <p className="profile-hint">
          {returns === 0
            ? "You haven't been back yet — the first return is tomorrow."
            : `You've come back ${returns} day${returns === 1 ? '' : 's'}. Every check-in, pick and cook below is part of the thread.`}
        </p>
      </section>

      <section className="profile-section">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <h3 className="section-title" style={{ margin:0 }}>THE THREAD</h3>
          <button type="button" className="borough-btn" onClick={() => navigate('/')}>Back to Nova →</button>
        </div>
        {rows.length === 0 ? (
          <p className="profile-hint">Nothing yet. Check in with Nova and cook something — it lands here.</p>
        ) : (
          <ul className="pci-list">
            {rows.map(({ e, l }) => (
              <li key={e.id}>
                <span className="pci-mood">{l.icon} {l.text}</span>
                {l.note && <span className="pci-note">{l.note}</span>}
                <span className="pci-when">{whenLabel(e.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="profile-section">
        <h3 className="section-title">MOOD PATTERNS</h3>
        {insight ? (
          <p className="profile-hint" style={{ marginTop: 8 }}>
            <span
              style={{
                display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                background: insight.color.swatch, marginRight: 8, verticalAlign: 'middle',
                border: '1px solid rgba(0,0,0,.3)',
              }}
            />
            {insight.text}
          </p>
        ) : (
          <p className="profile-hint">
            Pick a color mood a few times from the "What are you in the mood for?" prompt — I'll start noticing your patterns here.
          </p>
        )}
      </section>
    </ProfilePane>
  );
}
