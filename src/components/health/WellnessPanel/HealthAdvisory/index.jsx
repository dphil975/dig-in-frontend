import { useState } from 'react';
import { wellnessAdvisory } from '../../../../lib/wellnessAdvisory';
import './HealthAdvisory.css';

/* HealthAdvisory — the supportive "yo, that's not good" bar. Renders NOTHING
   unless the tags/text it's given read as disordered-eating-organized (see
   lib/wellnessAdvisory — conservative on purpose; normal healthy/diet content
   never trips it). When it does show, it's caring, not scolding, and points to
   the app's already-vetted real crisis resources. Dismissible — the point is a
   nudge, not a wall (the founder: "while I cannot stop the information, at
   least I can be like 'yo that's not good'"). */
export default function HealthAdvisory({ tags = [], text = '' }) {
  const advisory = wellnessAdvisory({ tags, text });
  const [dismissed, setDismissed] = useState(false);
  if (!advisory || dismissed) return null;

  return (
    <div className="health-advisory" role="note">
      <div className="health-advisory-head">
        <span className="health-advisory-icon" aria-hidden="true">💛</span>
        <span className="health-advisory-title">{advisory.title}</span>
        <button className="health-advisory-x" onClick={() => setDismissed(true)} aria-label="Dismiss">✕</button>
      </div>
      <p className="health-advisory-msg">{advisory.message}</p>
      <div className="health-advisory-resources">
        {advisory.resources.map((r) => (
          <a key={r.label} className="health-advisory-resource" href={r.href} target="_blank" rel="noreferrer">
            <b>{r.label}</b><span>{r.detail}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
