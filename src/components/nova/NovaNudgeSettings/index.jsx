import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { NUDGE_CATEGORIES, loadDisabledCategories, setCategoryEnabled } from '../../../lib/novaNudges';
import './Nudges.css';

/* Nova Nudges settings — a real settings button, not a page to browse to
   (that's the whole reason /nudges was cut as a standalone destination
   earlier this session: nudges are ambient, "a feeling, not a destination").
   Reuses lib/novaNudges.js's already-built loadDisabledCategories()/
   setCategoryEnabled() and the CATEGORY_LABELS map that used to live on the
   unrouted Nudges page — same engine, no new preference storage. Kept
   lightweight on purpose: category on/off toggles + the browser
   notification opt-in, no live-preview or today's-timeline (that's browsing,
   not settings). */

const CATEGORY_LABELS = {
  breakfast: 'Breakfast beat-the-line',
  'lunch-rush': 'Lunch drive-thru intercept',
  'stress-craving': 'Afternoon stress-craving',
  'dinner-rush': 'Dinner-rush intercept',
  treat: 'Friday treat-yourself',
  'meal-prep': 'Sunday meal-prep',
  'shop-timing': 'Best-time-to-shop',
  'late-night': 'Late-night doom-order stop',
  'stock-ahead': 'Stock-the-pantry (Craving Tracker)',
};

export default function NovaNudgeSettings() {
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState(supported ? Notification.permission : 'unsupported');
  const [disabled, setDisabled] = useState(loadDisabledCategories);

  async function enableNotifications() {
    if (!supported) return;
    const res = await Notification.requestPermission();
    setPermission(res);
    if (res === 'granted') {
      try { new Notification('Nova nudges are on', { body: "I'll catch you right before the drive-thru wins." }); } catch { /* ignore */ }
    }
  }

  function toggleCategory(cat) {
    const nextDisabled = setCategoryEnabled(cat, disabled.has(cat)); // has→enable, else disable
    setDisabled(new Set(nextDisabled));
  }

  return (
    <div>
      <div className="nudges-notify" style={{ padding: 0, border: 'none', marginBottom: 14 }}>
        <div className="nudges-notify-text">
          <p>
            {permission === 'unsupported'
              ? 'This browser doesn’t support notifications — the in-app card still appears when a window opens.'
              : permission === 'denied'
              ? 'Notifications are blocked in your browser settings.'
              : permission === 'granted'
              ? 'Notifications are on — Nova will ping you at today’s trigger times while this tab stays open.'
              : 'Let Nova send a heads-up at the right moment.'}
          </p>
        </div>
        <div className="nudges-notify-btns">
          {permission !== 'granted' && permission !== 'unsupported' && permission !== 'denied' && (
            <button className="nudges-btn nudges-btn-primary" onClick={enableNotifications}><Bell size={15} /> Turn on</button>
          )}
          {permission === 'granted' && (
            <span className="nudges-on-pill"><Check size={14} /> On</span>
          )}
        </div>
      </div>

      <div className="nudges-prefs">
        {NUDGE_CATEGORIES.map(cat => {
          const on = !disabled.has(cat);
          return (
            <button key={cat} className={`nudges-pref${on ? ' is-on' : ''}`} onClick={() => toggleCategory(cat)}>
              <span className="nudges-pref-label">{CATEGORY_LABELS[cat] || cat}</span>
              <span className={`nudges-switch${on ? ' is-on' : ''}`}><span className="nudges-switch-knob" /></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
