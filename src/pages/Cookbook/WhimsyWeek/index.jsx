import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import NovaSprite from '../../../components/nova/NovaSprite';
import { MOOD_COLORS, flavorForColor, recordMoodPick } from '../../../lib/moodColor';
import { loadRecipeBooks } from '../../../lib/recipeBooks';
import { loadSettings } from '../../../lib/novaSettings';
import { logGratitude, saveWin } from '../../../lib/happinessEngine';
import { listCircles, createPost } from '../../../lib/circlesApi';
import {
  buildWhimsyWeek, saveWhimsyWeek, loadWhimsyWeek, clearWhimsyWeek,
  currentDayIndex, latestMoodFlavor, buildWhimsyShareUrl, todayISO,
} from '../../../lib/whimsyWeek';
import './WhimsyWeek.css';

/* Whimsy Week — Nova builds you a 7-day plan from your mood. Cook this · try
   this · check in · share this with your circle. Real deterministic engine
   (whimsyWeek.js), Nova's real tone framing (novaSettings), honest adventures
   grounded in surfaces that exist. The finished week exports as a shareable
   "gift kit" (/whimsy-card). */

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function dowLabel(iso) {
  try { return DOW[new Date(iso + 'T00:00:00').getDay()]; } catch { return ''; }
}

/* Reuse the Circle-share shape from CookJournal's SharePicker. */
function CircleShare({ text, onDone }) {
  const [circles, setCircles] = useState(null);
  const [posting, setPosting] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => { listCircles().then(setCircles); }, []);

  async function share(circle) {
    setPosting(circle.id);
    const res = await createPost(circle.id, { text, image: '' });
    setPosting(null);
    if (res.ok) { setResult('Shared ✓'); setTimeout(onDone, 900); }
    else setResult(res.error || 'Could not share right now.');
  }

  return (
    <div className="ww-share-pop">
      {circles === null ? (
        <p className="ww-share-hint">Loading your circles…</p>
      ) : circles.length === 0 ? (
        <p className="ww-share-hint">Join or start a Kitchen Table Circle first — that's where this goes.</p>
      ) : (
        <ul className="ww-share-list">
          {circles.map(c => (
            <li key={c.id}>
              <button type="button" disabled={!!posting} onClick={() => share(c)}>
                {posting === c.id ? 'Sharing…' : c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {result && <p className="ww-share-result">{result}</p>}
      <button type="button" className="ww-share-cancel" onClick={onDone}>Close</button>
    </div>
  );
}

function ReflectItem({ item }) {
  const [done, setDone] = useState(false);
  const [text, setText] = useState('');

  if (item.kind === 'mood') {
    return (
      <div className="ww-reflect">
        <p className="ww-item-text">{item.prompt}</p>
        <div className="ww-mood-row">
          {MOOD_COLORS.map(c => (
            <button
              key={c.id}
              type="button"
              className="ww-mood-dot"
              style={{ background: c.swatch }}
              title={`${c.label} · ${c.emotion}`}
              onClick={() => { recordMoodPick(c.id); setDone(true); }}
            />
          ))}
        </div>
        {done && <span className="ww-done">Noted ✓</span>}
      </div>
    );
  }

  // gratitude | win — inline text → happinessEngine
  function save() {
    if (!text.trim()) return;
    if (item.kind === 'win') saveWin(text.trim(), 'whimsy');
    else logGratitude(text.trim());
    setDone(true);
  }
  return (
    <div className="ww-reflect">
      <p className="ww-item-text">{item.prompt}</p>
      {done ? (
        <span className="ww-done">Saved ✓</span>
      ) : (
        <div className="ww-reflect-form">
          <input
            className="ww-reflect-input"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={item.kind === 'win' ? 'One small win…' : 'One thing you’re grateful for…'}
            maxLength={140}
          />
          <button type="button" className="ww-mini-btn" onClick={save}>Save</button>
        </div>
      )}
    </div>
  );
}

function DayCard({ day, isToday, pool, onGiftKit }) {
  const navigate = useNavigate();
  const [sharing, setSharing] = useState(false);

  function openRecipe(slim) {
    const full = (pool || []).find(r => r.id === slim.id) || slim;
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(full));
      sessionStorage.removeItem('dig_in_full_recipe_adapt');
    } catch { /* ignore */ }
    navigate('/recipe');
  }

  return (
    <div className={`ww-day${isToday ? ' today' : ''}`}>
      <div className="ww-day-head">
        <span className="ww-day-dow">{dowLabel(day.dateISO)}</span>
        <span className="ww-day-theme">{day.theme}</span>
        {isToday && <span className="ww-today-tag">TODAY</span>}
      </div>

      <div className="ww-items">
        {day.items.map((item, i) => {
          if (item.type === 'cook') {
            return (
              <button key={i} type="button" className="ww-item ww-cook" onClick={() => openRecipe(item.recipe)}>
                <span className="ww-item-kicker">COOK</span>
                <span className="ww-item-title">{item.recipe.name}</span>
                <span className="ww-item-meta">
                  {item.recipe.country || 'Recipe'}{item.recipe.time ? ` · ${item.recipe.time}m` : ''} →
                </span>
              </button>
            );
          }
          if (item.type === 'adventure') {
            return (
              <div key={i} className="ww-item ww-adventure">
                <span className="ww-item-kicker">TRY</span>
                <span className="ww-item-text">{item.text}</span>
                {item.cta && (
                  <button type="button" className="ww-mini-btn" onClick={() => navigate(item.cta.to)}>
                    {item.cta.label} →
                  </button>
                )}
              </div>
            );
          }
          if (item.type === 'reflect') {
            return <div key={i} className="ww-item ww-reflect-wrap"><span className="ww-item-kicker">CHECK IN</span><ReflectItem item={item} /></div>;
          }
          if (item.type === 'share') {
            return (
              <div key={i} className="ww-item ww-shareitem">
                <span className="ww-item-kicker">SHARE</span>
                <span className="ww-item-text">{item.text}</span>
                {sharing
                  ? <CircleShare text={item.text} onDone={() => setSharing(false)} />
                  : <button type="button" className="ww-mini-btn" onClick={() => setSharing(true)}>Share to a Circle →</button>}
              </div>
            );
          }
          if (item.type === 'giftkit') {
            return (
              <div key={i} className="ww-item ww-shareitem">
                <span className="ww-item-kicker">GIFT</span>
                <span className="ww-item-text">{item.text}</span>
                <button type="button" className="ww-mini-btn" onClick={onGiftKit}>Share as a gift kit →</button>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

export default function WhimsyWeek({ embedded = false } = {}) {
  const [pool, setPool] = useState(null);
  const [plan, setPlan] = useState(() => loadWhimsyWeek());
  const [building, setBuilding] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const tone = useMemo(() => loadSettings().tone, []);

  useEffect(() => { loadRecipeBooks().then(setPool); }, []);

  const todayIdx = plan ? currentDayIndex(plan) : 0;

  function build(moodFlavor) {
    setBuilding(true);
    // Ensure the corpus is available (it usually is by now); build once we have it.
    const make = (corpus) => {
      const next = buildWhimsyWeek(corpus, { moodFlavor, startDateISO: todayISO() });
      saveWhimsyWeek(next);
      setPlan(next);
      setBuilding(false);
    };
    if (pool) make(pool);
    else loadRecipeBooks().then(c => { setPool(c); make(c); });
  }

  function regenerate() {
    clearWhimsyWeek();
    setPlan(null);
  }

  async function giftKit() {
    if (!plan) return;
    const url = buildWhimsyShareUrl(plan);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My Whimsy Week', text: 'Nova built me a 7-day plan — here it is 🌿', url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMsg('Gift-kit link copied to your clipboard!');
        setTimeout(() => setShareMsg(''), 2600);
      }
    } catch { /* user cancelled */ }
  }

  /* ── Start screen (no plan yet) ─────────────────────────────── */
  if (!plan) {
    return (
      <div className="ww-page">
        {!embedded && <Nav />}
        <div className="ww-wrap">
          <div className="ww-hero">
            <NovaSprite look="pink" h={64} title="Nova" />
            <h1 className="ww-title">Whimsy Week</h1>
            <p className="ww-sub">
              Tell me how you want this week to feel, and I'll build you seven days —
              something to cook, something to try, a moment to check in, and something
              to share. Not a diet. A little rhythm.
            </p>
          </div>

          <p className="ww-prompt">How do you want this week to feel?</p>
          <div className="ww-mood-grid">
            {MOOD_COLORS.map(c => (
              <button
                key={c.id}
                type="button"
                className="ww-mood-chip"
                disabled={building}
                onClick={() => { recordMoodPick(c.id); build(flavorForColor(c.id)); }}
              >
                <span className="ww-mood-swatch" style={{ background: c.swatch }} />
                <span className="ww-mood-label">{c.label}</span>
                <span className="ww-mood-emotion">{c.emotion}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="ww-surprise"
            disabled={building}
            onClick={() => build(latestMoodFlavor())}
          >
            {building ? 'Building your week…' : 'Surprise me — read my recent moods'}
          </button>
        </div>
      </div>
    );
  }

  /* ── The 7-day plan ─────────────────────────────────────────── */
  return (
    <div className="ww-page">
      {!embedded && <Nav />}
      <div className="ww-wrap">
        <div className="ww-plan-head">
          <NovaSprite look="pink" h={44} title="Nova" />
          <div>
            <h1 className="ww-title ww-title-sm">Your Whimsy Week</h1>
            <p className="ww-nova-intro">{plan.days[todayIdx]?.line
              ? novaIntroLine(plan.days[todayIdx].line, tone)
              : "Here's your week — one day at a time."}</p>
          </div>
        </div>

        <div className="ww-actions">
          <button type="button" className="ww-action-btn ww-primary" onClick={giftKit}>Share as gift kit</button>
          <button type="button" className="ww-action-btn" onClick={regenerate}>Regenerate from a new mood</button>
        </div>
        {shareMsg && <p className="ww-share-toast">{shareMsg}</p>}

        <div className="ww-days">
          {plan.days.map((day) => (
            <DayCard
              key={day.dayIndex}
              day={day}
              isToday={day.dayIndex === todayIdx}
              pool={pool}
              onGiftKit={giftKit}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Local mirror of the engine's tone framing (kept here so the page can frame
// today's line without re-exporting an internal helper).
const TONE_PREFIX = {
  listener: "I'm right here with you —", calm: 'No rush today.', coach: "Here's the rep for today:",
  cheerleader: "Okay let's GO —", sassy: 'Trust me on this one:',
};
function novaIntroLine(line, tone) {
  return `${TONE_PREFIX[tone] || TONE_PREFIX.listener} ${line}`;
}
