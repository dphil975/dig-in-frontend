import { useState } from 'react';
import { LIFE_MODES, activeLifeMode, setLifeMode, clearLifeMode } from '../../../lib/personalization/lifeMode';
import { getNoSolutions, setNoSolutions } from '../../../lib/nova/kindnessProtocol';

/* Settings → Life context — the "season of life" control, and how Nova responds
   when you tell her how you feel. The season reshapes what she picks (and the
   pace of the app) for a while, then asks again; the welcome questions set it
   too. Changing it here fires the dig_in_lifemode event so open screens follow. */
export default function LifeContext() {
  const [lifeMode, setLifeModeState] = useState(() => activeLifeMode());
  const [justListen, setJustListen] = useState(() => { try { return getNoSolutions(); } catch { return false; } });

  function choose(id) {
    if (lifeMode?.id === id) { clearLifeMode(); } else if (id) { setLifeMode(id); }
    setLifeModeState(activeLifeMode());
    try { window.dispatchEvent(new Event('dig_in_lifemode')); } catch { /* ignore */ }
  }

  return (
    <div className="app-container">
      <div className="profile-page">
        <section className="profile-section">
          <h3 className="section-title">SEASON OF LIFE</h3>
          <p className="profile-hint">
            Tell Nova what's going on — she reshapes what she picks, and the pace of the app, around it for a while, then asks again.
          </p>
          <div className="borough-picker">
            {Object.values(LIFE_MODES).map((m) => (
              <button
                key={m.id}
                className={`borough-btn${lifeMode?.id === m.id ? ' active' : ''}`}
                onClick={() => choose(m.id)}
                title={m.blurb}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
          <p className="borough-current">
            {lifeMode
              ? <>Currently: <b>{lifeMode.emoji} {lifeMode.label}</b>{lifeMode.daysLeft != null ? ` · ${lifeMode.daysLeft} days left` : ''} — tap it again to clear.</>
              : 'Not set — pick one above if it fits right now.'}
          </p>
        </section>

        <section className="profile-section">
          <h3 className="section-title">WHEN YOU TELL NOVA HOW YOU FEEL</h3>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={justListen}
              onChange={() => setJustListen(setNoSolutions(!justListen))}
              style={{ marginTop: 3, width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
            />
            <span>
              <strong>Just listen — don't offer fixes</strong>
              <p className="profile-hint" style={{ margin: '4px 0 0' }}>
                When you type a feeling into search or check in on a hard day, Nova reflects it back and stays with you
                instead of suggesting things to try.
              </p>
            </span>
          </label>
        </section>
      </div>
    </div>
  );
}
