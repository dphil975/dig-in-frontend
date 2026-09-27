import { useState } from 'react';
import {
  NOVA_SAYS, FOLLOW_UP_OPTIONS, REFLECT_OPTIONS,
  followUpAsk, followUpReply, reflectReply,
} from '../../../lib/nova/voice';
import './ReturnCards.css';

/* The two ways Nova is there when you come back:

     FollowUpCard   you told her you were having a hard time — on your next visit
                    she asks how you are now, and offers a pick-me-up if it's
                    still rough.
     ReflectCard    you cooked something — "How'd it go?"

   Each asks once, shows her reply, and calls back so the home screen can log it
   to the thread and adjust what she picks. */

export function FollowUpCard({ moodLabel, onAnswer }) {
  const [answer, setAnswer] = useState(null);

  function choose(id) { setAnswer(id); onAnswer(id); }

  if (answer === 'skip') return null;
  if (answer) {
    return (
      <section className="nrc" aria-label="Checking in">
        <p className="nrc-line" aria-live="polite">{followUpReply(answer)}</p>
      </section>
    );
  }
  return (
    <section className="nrc" aria-label="Checking in">
      <p className="nrc-line">{followUpAsk(moodLabel)}</p>
      <div className="nrc-opts">
        {FOLLOW_UP_OPTIONS.map((o) => (
          <button key={o.id} type="button" className="nrc-opt" onClick={() => choose(o.id)}>{o.label}</button>
        ))}
        <button type="button" className="nrc-skip" onClick={() => choose('skip')}>Not now</button>
      </div>
    </section>
  );
}

export function ReflectCard({ name, onAnswer }) {
  const [verdict, setVerdict] = useState(null);

  function choose(id) { setVerdict(id); onAnswer(id); }

  if (verdict === 'skip') return null;
  if (verdict) {
    return (
      <section className="nrc" aria-label="How it went">
        <p className="nrc-line" aria-live="polite">{reflectReply(verdict)}</p>
      </section>
    );
  }
  return (
    <section className="nrc" aria-label="How it went">
      <p className="nrc-context">You made {name}.</p>
      <p className="nrc-line">{NOVA_SAYS.afterCook}</p>
      <div className="nrc-opts">
        {REFLECT_OPTIONS.map((o) => (
          <button key={o.id} type="button" className="nrc-opt" onClick={() => choose(o.id)}>{o.label}</button>
        ))}
        <button type="button" className="nrc-skip" onClick={() => choose('skip')}>Skip</button>
      </div>
    </section>
  );
}
