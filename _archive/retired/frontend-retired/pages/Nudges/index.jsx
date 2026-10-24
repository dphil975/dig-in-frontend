import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, ArrowRight, Check } from 'lucide-react';
import Nav from '../../components/Nav';
import {
  todaySchedule, getTopNudge, getNextNudge, NUDGE_CATEGORIES,
  loadDisabledCategories, setCategoryEnabled, dominantCravingArchetype,
} from '../../lib/novaNudges';
import { stockAheadList } from '../../lib/cravingTracker';
import { suggestRecipes } from '../../lib/pantryTools';
import { RECIPE_INGREDIENTS, RECIPES_STATIC } from '../../data/recipesStatic';
import './Nudges.css';

/* ════════════════════════════════════════════════════════════
   NOVA NUDGES — the timing playbook, made visible + tunable.

   Shows what Nova will say and when, lets you opt into notifications,
   and lets you mute categories you don't want. See lib/novaNudges for
   the engine and the honest note on why this is a behavioral model, not
   a live foot-traffic feed.

   Notifications: with the tab open and permission granted, we fire local
   Notifications at each of today's remaining trigger times. Real background
   push (app closed) needs a service worker + push backend — called out in
   the UI so it isn't oversold.
   ════════════════════════════════════════════════════════════ */

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

function loadCtx() {
  let pantry = [];
  try { const v = JSON.parse(localStorage.getItem('dig_in_pantry') || '[]'); pantry = Array.isArray(v) ? v : []; } catch { /* ignore */ }
  let suggestionCount = 0;
  try { suggestionCount = suggestRecipes(pantry, RECIPE_INGREDIENTS, RECIPES_STATIC).length; } catch { /* ignore */ }
  return { pantryCount: pantry.length, suggestionCount, craving: dominantCravingArchetype(), stockAhead: stockAheadList() };
}

export default function Nudges() {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const ctx = useMemo(loadCtx, []);

  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState(supported ? Notification.permission : 'unsupported');
  const [disabled, setDisabled] = useState(loadDisabledCategories);
  const timersRef = useRef([]);

  const live = useMemo(() => getTopNudge(now, ctx), [now, ctx, disabled]);
  const next = useMemo(() => getNextNudge(now), [now, disabled]);
  const schedule = useMemo(() => todaySchedule(now, ctx), [now, ctx, disabled]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(id => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  // With permission granted, queue local notifications for the rest of today's
  // trigger times (only while this tab stays open).
  const scheduleNotifications = useCallback(() => {
    clearTimers();
    if (!supported || Notification.permission !== 'granted') return;
    const nowH = now.getHours() + now.getMinutes() / 60;
    schedule
      .filter(s => s.atHour > nowH)
      .forEach(s => {
        const delayMs = (s.atHour - nowH) * 3600_000;
        if (delayMs > 0 && delayMs < 24 * 3600_000) {
          const id = window.setTimeout(() => {
            try { new Notification(`Nova · ${s.title}`, { body: s.body }); } catch { /* ignore */ }
          }, delayMs);
          timersRef.current.push(id);
        }
      });
  }, [supported, schedule, now, clearTimers]);

  useEffect(() => {
    scheduleNotifications();
    return clearTimers;
  }, [scheduleNotifications, clearTimers]);

  async function enableNotifications() {
    if (!supported) return;
    const res = await Notification.requestPermission();
    setPermission(res);
    if (res === 'granted') {
      try { new Notification('Nova nudges are on', { body: "I'll catch you right before the drive-thru wins." }); } catch { /* ignore */ }
      scheduleNotifications();
    }
  }

  function previewNudge() {
    const n = live || next || schedule[0];
    if (!n) return;
    const body = n.body || 'Right dish, right moment.';
    if (supported && Notification.permission === 'granted') {
      try { new Notification(`Nova · ${n.title}`, { body }); return; } catch { /* ignore */ }
    }
    window.alert(`Nova · ${n.title}\n\n${body}`);
  }

  function toggleCategory(cat) {
    const nextDisabled = setCategoryEnabled(cat, disabled.has(cat)); // has→enable, else disable
    setDisabled(new Set(nextDisabled));
  }

  return (
    <div className="nudges-page">
      <Nav />
      <div className="nudges-wrap">
        <button className="nudges-back" onClick={() => navigate(-1)}>← BACK</button>

        <header className="nudges-head">
          <p className="nudges-eyebrow">NOVA NUDGES</p>
          <h1 className="nudges-title">The right dish, the right moment.</h1>
          <p className="nudges-sub">
            Nova reaches you <em>just before</em> you'd default to the drive-thru — timed off
            the predictable rhythm of a day, not any store's live traffic. Here's the whole
            playbook, when each nudge fires, and how to tune it.
          </p>
        </header>

        {/* Live / next */}
        <section className={`nudges-live${live?.convenience ? ' is-convenience' : ''}`}>
          {live ? (
            <>
              <div className="nudges-live-top">
                <span className="nudges-live-icon">{live.icon}</span>
                <span className="nudges-live-label">LIVE RIGHT NOW</span>
                {live.convenienceTag && <span className="nudges-live-tag">{live.convenienceTag}</span>}
                {live.craving && <span className="nudges-live-tag nudges-live-tag-craving">{live.craving.emoji} {live.craving.label.toUpperCase()}</span>}
              </div>
              <h2 className="nudges-live-title">{live.title}</h2>
              <p className="nudges-live-body">{live.body}</p>
              <button className="nudges-cta" onClick={() => navigate(live.cta.route)}>
                {live.cta.label} <ArrowRight size={15} />
              </button>
            </>
          ) : (
            <>
              <span className="nudges-live-label">NOTHING FIRING RIGHT NOW</span>
              <p className="nudges-live-body">
                {next ? <>Next up: <b>{next.title}</b> around <b>{next.atText}</b> {next.icon}</>
                      : 'Check back tomorrow morning — the first nudge is the beat-the-coffee-line one.'}
              </p>
            </>
          )}
        </section>

        {/* Notifications */}
        <section className="nudges-notify">
          <div className="nudges-notify-text">
            <h3>{permission === 'granted' ? 'Notifications are on' : 'Get nudged on time'}</h3>
            <p>
              {permission === 'unsupported'
                ? 'This browser doesn’t support notifications — the in-app card still appears when a window opens.'
                : permission === 'denied'
                ? 'Notifications are blocked in your browser settings. The in-app card still appears when a window opens.'
                : permission === 'granted'
                ? 'While this tab is open, Nova will ping you at each of today’s trigger times. Background push (app closed) needs a service worker + push backend — not wired yet.'
                : 'Let Nova send a heads-up at the right moment. We’ll queue today’s remaining nudges as soon as you allow it.'}
            </p>
          </div>
          <div className="nudges-notify-btns">
            {permission !== 'granted' && permission !== 'unsupported' && permission !== 'denied' && (
              <button className="nudges-btn nudges-btn-primary" onClick={enableNotifications}><Bell size={15} /> Turn on</button>
            )}
            {permission === 'granted' && (
              <span className="nudges-on-pill"><Check size={14} /> On</span>
            )}
            <button className="nudges-btn" onClick={previewNudge}>Preview a nudge</button>
          </div>
        </section>

        {/* Today's timeline */}
        <section className="nudges-section">
          <h3 className="nudges-section-title">Today’s nudges</h3>
          {schedule.length === 0 ? (
            <p className="nudges-empty">Every category is muted. Turn some back on below.</p>
          ) : (
            <ol className="nudges-timeline">
              {schedule.map(s => (
                <li key={s.id} className={`nudges-row${s.id === live?.id ? ' is-live' : ''}`}>
                  <div className="nudges-row-time">{s.atText}</div>
                  <div className="nudges-row-icon">{s.icon}</div>
                  <div className="nudges-row-main">
                    <p className="nudges-row-title">
                      {s.title}{s.id === live?.id && <span className="nudges-row-livedot">● LIVE</span>}
                      {s.craving && <span className="nudges-row-craving">{s.craving.emoji} {s.craving.label.toUpperCase()}</span>}
                    </p>
                    <p className="nudges-row-body">{s.body}</p>
                    <button className="nudges-row-cta" onClick={() => navigate(s.cta.route)}>{s.cta.label} →</button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Category preferences */}
        <section className="nudges-section">
          <h3 className="nudges-section-title">What Nova can nudge you about</h3>
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
        </section>

        {/* Honest data note */}
        <section className="nudges-note">
          <BellOff size={16} />
          <p>
            <b>How the timing works:</b> live store busyness (SafeGraph, Placer, Google Popular
            Times, Cuebiq) is paid or backend-only, so this runs on a behavioral model of a
            typical day — the same basis as the store “best time to shop” hints. When a real
            signal exists (scraped Popular Times, crowdsourced check-ins, or a Cuebiq baseline),
            it drops straight into this engine with no change to the nudges you see.
          </p>
        </section>
      </div>
    </div>
  );
}
