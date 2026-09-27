import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NovaSprite from '../../NovaSprite';
import { pickReaction } from '../../../../lib/novaReactions';
import { loadSettings } from '../../../../lib/novaSettings';
import { saveMemory, hasMemory, dailyKey } from '../../../../lib/memoryVault';
import './NovaReaction.css';

/* NovaReaction — Nova reacting in-context on a surface (the Vault, a check-in).
   One companion, not a page: same sprite, same mood voice. Warm reactions carry
   a ♥ that tucks them into the Memory Vault. Renders nothing when she has
   nothing worth saying. */

export default function NovaReaction({ surface, ctx, className = '' }) {
  const navigate = useNavigate();
  const [tone] = useState(() => loadSettings().tone);
  const [dismissed, setDismissed] = useState(false);

  const reaction = useMemo(() => pickReaction(surface, ctx, tone), [surface, ctx, tone]);
  const key = reaction ? dailyKey(reaction.id) : null;
  const [saved, setSaved] = useState(() => (key ? hasMemory(key) : false));

  if (!reaction || dismissed) return null;

  const save = () => {
    if (saved) return;
    saveMemory({ kind: reaction.kind, text: reaction.text, context: { surface }, dedupeKey: key });
    setSaved(true);
  };

  return (
    <div className={`nrx nrx-${reaction.kind} ${className}`} role="status">
      <div className="nrx-sprite"><NovaSprite look="pink" h={40} title="Nova" /></div>
      <div className="nrx-body">
        <div className="nrx-head">NOVA</div>
        <p className="nrx-text">{reaction.text}</p>
        <div className="nrx-actions">
          {reaction.cta && (
            <button className="nrx-cta" onClick={() => navigate(reaction.cta.route)}>
              {reaction.cta.label} →
            </button>
          )}
          {reaction.saveable && (
            <button className={`nrx-save${saved ? ' is-saved' : ''}`} onClick={save} disabled={saved}>
              {saved ? '♥ Saved to your vault' : '♡ Save this'}
            </button>
          )}
        </div>
      </div>
      <button className="nrx-dismiss" onClick={() => setDismissed(true)} aria-label="Dismiss">✕</button>
    </div>
  );
}
