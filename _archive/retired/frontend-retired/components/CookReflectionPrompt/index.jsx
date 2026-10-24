import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import NovaSprite from '../../nova/NovaSprite';
import { checkPendingReflection, answerReflection } from '../../../lib/cookReflection';
import { checkReflectionAchievements } from '../../../lib/cookAchievements';
import './CookReflectionPrompt.css';

/* CookReflectionPrompt — the 15-minutes-later "how'd it go?" check-in.
   No live in-tab timer: re-checked on every navigation (useLocation as the
   dependency), matching the "pulled on load" convention the backend nudge
   system already uses for the 3-day cook_followup nudge. Global, mounted
   next to NovaNudge/AskNova in App.jsx so it can surface on whatever page
   the user is on once a cook is due for reflection. */

const COMPLEXITY = [['easy', 'Easy'], ['just_right', 'Just right'], ['hard', 'Hard']];

export default function CookReflectionPrompt() {
  const location = useLocation();
  const [nudge, setNudge] = useState(null);
  const [complexity, setComplexity] = useState(null);
  const [timingFelt, setTimingFelt] = useState(null);
  const [wouldAgain, setWouldAgain] = useState(null);
  const [newBadge, setNewBadge] = useState(null);
  const [dismissedFor, setDismissedFor] = useState(null);

  const check = useCallback(async () => {
    const due = await checkPendingReflection();
    if (due && due.ref_id !== dismissedFor) setNudge(due);
  }, [dismissedFor]);

  useEffect(() => { check(); }, [location.pathname, check]);

  if (!nudge) return null;

  async function submit() {
    await answerReflection(nudge.ref_id, { complexity, timingFelt, wouldAgain });
    const newly = checkReflectionAchievements({ complexity });
    if (newly.length) {
      setNewBadge(newly[0]);
      setTimeout(() => { setNewBadge(null); setNudge(null); }, 2400);
    } else {
      setNudge(null);
    }
  }

  function skip() {
    setDismissedFor(nudge.ref_id);
    setNudge(null);
  }

  return (
    <div className="crp-card" role="dialog" aria-label="Cook reflection">
      <div className="crp-head">
        <NovaSprite look="pink" h={26} title="Nova" />
        <span>{nudge.message}</span>
        <button className="crp-close" onClick={skip} aria-label="Skip">✕</button>
      </div>

      {newBadge ? (
        <div className="crp-badge">Nova's proud of you — {newBadge.icon} {newBadge.label}</div>
      ) : (
        <>
          <div className="crp-row">
            <span className="crp-label">How complex did it feel?</span>
            <div className="crp-options">
              {COMPLEXITY.map(([id, label]) => (
                <button
                  key={id}
                  className={`crp-chip${complexity === id ? ' active' : ''}`}
                  onClick={() => setComplexity(id)}
                >{label}</button>
              ))}
            </div>
          </div>

          <div className="crp-row">
            <span className="crp-label">Did the timing feel accurate?</span>
            <div className="crp-options">
              <button className={`crp-chip${timingFelt === 'yes' ? ' active' : ''}`} onClick={() => setTimingFelt('yes')}>Yes</button>
              <button className={`crp-chip${timingFelt === 'no' ? ' active' : ''}`} onClick={() => setTimingFelt('no')}>No</button>
            </div>
          </div>

          <div className="crp-row">
            <span className="crp-label">Would you make it again?</span>
            <div className="crp-options">
              <button className={`crp-chip${wouldAgain === 'yes' ? ' active' : ''}`} onClick={() => setWouldAgain('yes')}>Yes</button>
              <button className={`crp-chip${wouldAgain === 'no' ? ' active' : ''}`} onClick={() => setWouldAgain('no')}>No</button>
            </div>
          </div>

          <div className="crp-actions">
            <button className="crp-submit" disabled={!complexity} onClick={submit}>SUBMIT</button>
            <button className="crp-skip" onClick={skip}>Skip</button>
          </div>
        </>
      )}
    </div>
  );
}
