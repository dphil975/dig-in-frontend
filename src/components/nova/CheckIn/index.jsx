import { useState } from 'react';
import { MOODS, MOOD_BY_ID, nurtureResponse } from '../../../lib/nova/kindnessProtocol';
import { PRIMARY_MOODS } from '../../../lib/nova/thread';
import { NOVA_SAYS } from '../../../lib/nova/voice';
import './CheckIn.css';

/* The daily "How are you feeling?" — four moods up front, a way to skip, and
   the rest of the feelings one tap away. It only presents the choice; the home
   screen logs it to the thread and decides what Nova picks.

     mood        today's check-in (a mood id) or null
     skipped     true when today's check-in was skipped
     onCheckIn   (moodId) => void
     onSkip      () => void
     onRoute     (path) => void — the one quiet door for heavier moods */
export default function CheckIn({ mood, skipped, onCheckIn, onSkip, onRoute }) {
  const [changing, setChanging] = useState(false);
  const [more, setMore] = useState(false);

  const primary = PRIMARY_MOODS.map((id) => MOOD_BY_ID[id]);
  const others = MOODS.filter((m) => !PRIMARY_MOODS.includes(m.id));
  const choosing = changing || (!mood && !skipped);

  function choose(id) { setChanging(false); setMore(false); onCheckIn(id); }
  function skip() { setChanging(false); setMore(false); onSkip(); }

  if (choosing) {
    return (
      <section className="nci" aria-label="Check-in">
        <p className="nci-q">{NOVA_SAYS.checkInPrompt}</p>
        <div className="nci-moods">
          {primary.map((m) => (
            <button key={m.id} type="button" className="nci-mood" onClick={() => choose(m.id)}>
              <span aria-hidden="true">{m.emoji}</span> {m.label}
            </button>
          ))}
          <button type="button" className="nci-skip" onClick={skip}>Skip the check-in</button>
        </div>
        <button
          type="button"
          className="nci-more"
          aria-expanded={more}
          onClick={() => setMore((v) => !v)}
        >
          {more ? 'Fewer feelings' : 'Something else'}
        </button>
        {more && (
          <div className="nci-moods nci-moods-more">
            {others.map((m) => (
              <button key={m.id} type="button" className="nci-mood" onClick={() => choose(m.id)}>
                <span aria-hidden="true">{m.emoji}</span> {m.label}
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  if (skipped && !mood) {
    return (
      <section className="nci nci-quiet" aria-label="Check-in">
        <p className="nci-resp">{NOVA_SAYS.afterSkip}</p>
        <button type="button" className="nci-change" onClick={() => setChanging(true)}>Check in after all</button>
      </section>
    );
  }

  const m = MOOD_BY_ID[mood];
  const heavy = m?.need === 'high';
  return (
    <section className="nci nci-quiet" aria-label="Check-in">
      {heavy && <p className="nci-resp">{nurtureResponse(mood)}</p>}
      <div className="nci-row">
        {heavy && (
          <button type="button" className="nci-door" onClick={() => onRoute('/nest')}>Sit with Nova →</button>
        )}
        <button type="button" className="nci-change" onClick={() => setChanging(true)}>Change how I feel</button>
      </div>
    </section>
  );
}
