import { useEffect, useState } from 'react';
import {
  PREP_PRESETS, loadTimers, startTimer, dismissTimer, markNotified, isDone, formatRemaining,
} from '../../../lib/prepTimers';

/* Smart Prepping Assistant — marinade / dough-rise / slow-cooker timers.
   Extracted out of Pantry/index.jsx (was pushing 1,200+ lines) — fully
   self-contained, reads/writes nothing else in Pantry's own state. */
export default function SmartPrepping() {
  const [timers, setTimers] = useState(loadTimers);
  const [customMinutes, setCustomMinutes] = useState('');
  const [, setTick] = useState(0); // forces a re-render so countdowns advance
  const timerNotifSupported = typeof window !== 'undefined' && 'Notification' in window;
  const [timerPermission, setTimerPermission] = useState(timerNotifSupported ? Notification.permission : 'unsupported');

  useEffect(() => {
    if (timers.length === 0) return;
    const iv = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(iv);
  }, [timers.length]);

  // Fire a real Notification for any timer that's newly done — same
  // Notification.requestPermission()/new Notification() pattern already used
  // by the retired Nudges page (_archive/frontend-retired/pages/Nudges).
  // Needs the tab open; no background push.
  // No dependency array on purpose: isDone() is computed against Date.now()
  // each call, not stored in state, so this needs to re-check on every render
  // (including the ones the 30s tick above triggers), not just when `timers`
  // itself changes identity. markNotified() makes it converge — once nothing
  // is newly due, setTimers() doesn't fire and no further render happens.
  useEffect(() => {
    if (timerPermission !== 'granted') return;
    const due = timers.filter(t => !t.notified && isDone(t));
    if (!due.length) return;
    for (const t of due) {
      try { new Notification(t.label, { body: t.body }); } catch { /* ignore */ }
      markNotified(t.id);
    }
    setTimers(loadTimers());
  });

  function startPreset(preset) {
    setTimers(startTimer({ label: preset.label, minutes: preset.minutes, body: preset.body }));
  }

  function startCustomTimer() {
    const mins = parseInt(customMinutes, 10);
    if (!mins || mins <= 0) return;
    setTimers(startTimer({ label: `Custom timer · ${mins} min`, minutes: mins, body: 'Your timer is up!' }));
    setCustomMinutes('');
  }

  function removeTimerRow(id) { setTimers(dismissTimer(id)); }

  async function enableTimerNotifications() {
    if (!timerNotifSupported) return;
    const res = await Notification.requestPermission();
    setTimerPermission(res);
  }

  return (
    <section className="pantry-timers">
      <div className="pantry-section-title">
        SMART PREPPING <span className="pantry-count">{timers.length}</span>
      </div>
      <p className="pantry-favorites-help">
        Start a timer and I'll remind you when it's time to cook.
        {timerNotifSupported && timerPermission !== 'granted' && ' Turn on notifications to get a ping the moment it\'s ready — needs this tab to stay open.'}
      </p>

      {timerNotifSupported && timerPermission !== 'granted' && (
        <button type="button" className="pantry-btn" onClick={enableTimerNotifications}>
          🔔 Enable prep notifications
        </button>
      )}

      <div className="pantry-timer-presets">
        {PREP_PRESETS.map(p => (
          <button key={p.id} type="button" className="pantry-timer-preset" onClick={() => startPreset(p)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="pantry-add-row">
        <input
          className="pantry-input pantry-input-price"
          type="number"
          min="1"
          placeholder="Custom minutes"
          value={customMinutes}
          onChange={e => setCustomMinutes(e.target.value)}
        />
        <button type="button" className="pantry-btn pantry-btn-primary" onClick={startCustomTimer}>
          START TIMER
        </button>
      </div>

      {timers.length > 0 && (
        <div className="pantry-timer-list">
          {timers.map(t => (
            <div className={`pantry-timer-row${isDone(t) ? ' done' : ''}`} key={t.id}>
              <span className="pantry-timer-label">{t.label}</span>
              <span className="pantry-timer-remaining">{formatRemaining(t)}</span>
              <button type="button" className="pantry-timer-dismiss" onClick={() => removeTimerRow(t.id)} aria-label="Dismiss timer">✕</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
