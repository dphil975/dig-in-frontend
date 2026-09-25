import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Sparkles, Trophy, Shield, ArrowRight, Sun, LifeBuoy, Check, Send,
} from 'lucide-react';
import Nav from '../../../components/shell/Nav';
import { novaLine, TONES } from '../../../lib/novaVoice';
import {
  detect, startSession, advance, currentPhase, PHASES, WALK,
  CRISIS_RESOURCES, dueAnchor, markAnchorDelivered, forceAnchorDue,
} from '../../../lib/shadowToLight';
import {
  happinessSnapshot, logGratitude, getGratitude, saveWin, getWins,
} from '../../../lib/happinessEngine';
import { recessStreak } from '../../../lib/recess';
import { classify, RUNGS, applyRung, REPEAT_OFFENDER_SCRIPT } from '../../../lib/kindnessProtocol';
import { loadSettings, saveSettings, OPTIONS } from '../../../lib/novaSettings';
import './Nova.css';

/* ════════════════════════════════════════════════════════════════
   NOVA — THE NEST  (the Shadow-to-Light emotional companion)

   Nova meets you at your lowest cooking moment and walks you, one validated
   feeling at a time, back to capable. This page is the home for that: the
   7-phase protocol player, the Safe Vent, the Gratitude Log, the Trophy Case,
   the customization panel, and the Kindness Protocol.

   SCOPE HONESTY (same posture as novaNudges): everything here is a real
   behavioral model with local state — real tone logic, real streaks, real
   moderation rules, all client-side. The community mirror runs on seeded cohort
   numbers and the morning-after anchor on a local timer; both swap onto a real
   backend the day one exists. Crisis language routes OUT to human resources —
   Nova redirects cooking despair, she does not counsel crisis.
   ════════════════════════════════════════════════════════════════ */

// Seeded "others who flopped too" cohort — stands in for real attempt logs.
function cohortFor(text) {
  const seed = [...String(text)].reduce((n, c) => n + c.charCodeAt(0), 0);
  const cohort = 20 + (seed % 40);           // 20–59 people tried it
  const fails = Math.round(cohort * (0.55 + (seed % 20) / 100)); // ~55–75% flopped first
  return { cohort, fails: Math.min(fails, cohort) };
}

const COMMUNITY_QUOTES = [
  '"I burned mine so badly the smoke alarm went off." — first try',
  '"First time? Soup. Second time? Glue. Third time? Chef." — @rue',
  '"Took me 4 tries. Now it\'s my signature dish." — @marisol',
];

export default function Nova({ embedded = false } = {}) {
  const navigate = useNavigate();
  const now = Date.now();

  const [settings, setSettings] = useState(loadSettings);
  const [snap, setSnap] = useState(() => happinessSnapshot(now));
  const refreshSnap = useCallback(() => setSnap(happinessSnapshot(Date.now())), []);
  // Recess streak — showing up for yourself daily also lifts Lightness (each
  // Recess step files a win, which happinessEngine already counts), so Nova can
  // name it directly. Read here rather than in happinessEngine to avoid a
  // circular import (recess.js already imports from happinessEngine).
  const recess = recessStreak(now);

  // ── Protocol player state ──
  const [draft, setDraft] = useState('');
  const [session, setSession] = useState(null);
  const [detection, setDetection] = useState(null);
  const cohort = useMemo(() => session ? cohortFor(session.text) : null, [session]);

  const phase = session ? currentPhase(session) : null;
  const complete = session && !phase; // walked past the last phase

  function begin() {
    const text = draft.trim();
    if (!text) return;
    const d = detect(text);
    setDetection(d);
    if (d.route === 'crisis') { setSession(null); return; }      // crisis card renders instead
    const s = startSession(text, d);
    // a light vent short-circuits to validation only
    if (d.route === 'vent') { setSession({ ...s, phaseIndex: 0, ventOnly: true }); }
    else setSession(s);
  }

  function next() {
    setSession(prev => {
      const adv = advance(prev);
      if (prev.ventOnly) { refreshSnap(); return null; } // vent = one validating reply, done
      if (!currentPhase(adv)) refreshSnap();
      return adv;
    });
  }

  function reset() {
    setSession(null); setDetection(null); setDraft('');
  }

  const line = useMemo(() => {
    if (!session || !phase) return '';
    return novaLine(phase, {
      tone: settings.tone,
      reframe: settings.reframe,
      ctx: { ...(cohort || {}), streak: snap.gratitudeStreak },
      seed: session.startedAt,
    });
  }, [session, phase, settings, cohort, snap.gratitudeStreak]);

  // reset phase → hand over a small win
  function takeTheWin() {
    saveWin('The 3-ingredient reset — a win when I needed one', 'reset');
    refreshSnap();
    navigate('/recipe');
  }

  // ── Gratitude pivot ──
  const [gratDraft, setGratDraft] = useState('');
  function submitGratitude() {
    const t = gratDraft.trim();
    if (!t) return;
    logGratitude(t);
    setGratDraft('');
    refreshSnap();
    next(); // pivot → complete
  }

  // ── Anchor (morning-after) ──
  const [anchor, setAnchor] = useState(() => dueAnchor(now));
  function dismissAnchor() { if (anchor) { markAnchorDelivered(anchor.id); setAnchor(null); } }
  function previewAnchor() { forceAnchorDue(); setAnchor(dueAnchor(Date.now())); }

  // ── Settings ──
  function set(key, val) {
    const nextS = saveSettings({ ...settings, [key]: val });
    setSettings({ ...nextS });
  }

  // ── Kindness protocol demo ──
  const [modDraft, setModDraft] = useState('');
  const [modResult, setModResult] = useState(null);
  function checkComment() {
    const rung = classify(modDraft, 0);
    if (rung) applyRung(rung);
    setModResult(rung || { kind: true });
  }

  const tone = TONES.find(t => t.id === settings.tone) || TONES[0];
  const gratitudeList = getGratitude().slice(0, 6);
  const wins = getWins().slice(0, 8);

  return (
    <div className="nova-page">
      <Nav />
      <div className="nova-wrap">
        {!embedded && <button className="nova-back" onClick={() => navigate(-1)}>← BACK</button>}

        {/* ── Header + lightness ── */}
        <header className="nova-head">
          <p className="nova-eyebrow"><Sun size={13} /> THE NEST · NOVA</p>
          <h1 className="nova-title">From shadow to light.</h1>
          <p className="nova-sub">
            Post what's weighing on you. Nova won't rush to fix it — she'll sit with the
            feeling first, then walk you back to capable, one step at a time.
          </p>
          {recess >= 2 && (
            <p className="nova-recess-note">
              <Sun size={13} /> you&rsquo;ve taken recess {recess} days running. i can feel it in here — that&rsquo;s you showing up for yourself, and it counts.
            </p>
          )}
          <div className="nova-stats">
            <div className="nova-light">
              <div className="nova-light-top">
                <span className="nova-light-label">Lightness</span>
                <span className={`nova-light-band band-${snap.lightness.band}`}>{snap.lightness.band}</span>
              </div>
              <div className="nova-light-track"><div className="nova-light-fill" style={{ width: `${snap.lightness.value}%` }} /></div>
            </div>
            <div className="nova-pills">
              <span className="nova-pill"><Sun size={13} /> {snap.gratitudeStreak}-day streak</span>
              <span className="nova-pill"><Trophy size={13} /> {snap.wins} wins</span>
              <span className="nova-pill"><Heart size={13} /> {snap.kindness} kindnesses</span>
              {recess > 0 && <span className="nova-pill">🌤️ {recess}-day recess</span>}
            </div>
          </div>
        </header>

        {/* ── Whimsy Week launch — Nova's 7-day, mood-built plan ── */}
        <button
          type="button"
          className="nova-whimsy-launch"
          onClick={() => navigate('/whimsy')}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
            cursor: 'pointer', margin: '14px 0', padding: 16, borderRadius: 16,
            background: 'linear-gradient(135deg, #f3efff, #fff6ea)',
            border: '1px solid rgba(110, 130, 89,.3)',
          }}
        >
          <Sparkles size={22} style={{ color: '#6E8259', flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 800, color: '#4A3D80', marginBottom: 3 }}>
              Let me build your Whimsy Week
            </span>
            <span style={{ display: 'block', fontSize: 13, color: '#7a6a58' }}>
              Tell me your mood — I'll plan seven days of cook · try · check in · share.
            </span>
          </span>
          <ArrowRight size={18} style={{ color: '#6E8259' }} />
        </button>

        {/* ── Morning-after anchor ── */}
        {anchor && (
          <section className="nova-anchor">
            <p className="nova-anchor-tag"><Sparkles size={13} /> THE MORNING AFTER</p>
            <p className="nova-anchor-line">
              {novaLine('anchor', { tone: settings.tone, seed: anchor.dueAt })}
            </p>
            <div className="nova-anchor-btns">
              <button className="nova-btn nova-btn-primary" onClick={() => { navigate('/recipe'); dismissAnchor(); }}>
                Take another swing <ArrowRight size={15} />
              </button>
              <button className="nova-btn" onClick={dismissAnchor}>Not today</button>
            </div>
          </section>
        )}

        {/* ── The protocol player ── */}
        <section className="nova-card nova-player">
          {/* crisis route */}
          {detection?.route === 'crisis' ? (
            <div className="nova-crisis">
              <p className="nova-crisis-tag"><LifeBuoy size={15} /> THIS IS BIGGER THAN A RECIPE</p>
              <p className="nova-crisis-line">{novaLine('crisis')}</p>
              <ul className="nova-crisis-list">
                {CRISIS_RESOURCES.map(r => (
                  <li key={r.label}>
                    <a href={r.href} target="_blank" rel="noreferrer">{r.label}</a>
                    <span>{r.detail}</span>
                  </li>
                ))}
              </ul>
              <button className="nova-btn" onClick={reset}>Back to the Nest</button>
            </div>
          ) : !session ? (
            /* entry */
            <>
              <label className="nova-label" htmlFor="nova-draft">What's weighing on you tonight?</label>
              <textarea
                id="nova-draft"
                className="nova-textarea"
                placeholder="I tried that recipe 3 times and it still sucks. I feel like a failure…"
                value={draft}
                rows={3}
                onChange={e => setDraft(e.target.value)}
              />
              <div className="nova-player-actions">
                <button className="nova-btn nova-btn-primary" onClick={begin} disabled={!draft.trim()}>
                  Walk me through it <ArrowRight size={15} />
                </button>
                <span className="nova-as">as <b>{tone.label}</b> Nova</span>
              </div>
            </>
          ) : complete ? (
            /* completed */
            <div className="nova-complete">
              <p className="nova-complete-tag"><Sun size={16} /> YOU CAME OUT THE OTHER SIDE</p>
              <p className="nova-complete-line">
                That's the whole arc — from “I'm a failure” to a win in your Trophy Case and a
                gratitude logged. I'll check on you tomorrow.
              </p>
              <div className="nova-anchor-btns">
                <button className="nova-btn" onClick={previewAnchor}>Preview tomorrow's check-in</button>
                <button className="nova-btn nova-btn-primary" onClick={reset}>Done <Check size={15} /></button>
              </div>
            </div>
          ) : (
            /* active phase */
            <div className="nova-phase-run">
              <div className="nova-phase-rail">
                {WALK.map((p, i) => {
                  const meta = PHASES.find(ph => ph.id === p);
                  const state = i < session.phaseIndex ? 'done' : i === session.phaseIndex ? 'now' : 'todo';
                  return <span key={p} className={`nova-rail-dot ${state}`} title={meta?.title} />;
                })}
              </div>
              <p className="nova-phase-tag">
                {PHASES.find(ph => ph.id === phase)?.n}. {PHASES.find(ph => ph.id === phase)?.tag}
              </p>
              <p className="nova-phase-line">{line}</p>

              {/* mirror phase → community proof */}
              {phase === 'mirror' && cohort?.cohort > 0 && (
                <ul className="nova-mirror-quotes">
                  {COMMUNITY_QUOTES.map(q => <li key={q}>{q}</li>)}
                </ul>
              )}

              {/* reset phase → the small win */}
              {phase === 'reset' ? (
                <div className="nova-player-actions">
                  <button className="nova-btn nova-btn-primary" onClick={takeTheWin}>
                    Give me the easy win <ArrowRight size={15} />
                  </button>
                  <button className="nova-btn" onClick={next}>Skip to gratitude</button>
                </div>
              ) : phase === 'pivot' ? (
                <div className="nova-grat-entry">
                  <input
                    className="nova-input"
                    placeholder="One thing you're grateful for, however small…"
                    value={gratDraft}
                    onChange={e => setGratDraft(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitGratitude()}
                  />
                  <button className="nova-btn nova-btn-primary" onClick={submitGratitude} disabled={!gratDraft.trim()}>
                    <Send size={15} />
                  </button>
                </div>
              ) : (
                <div className="nova-player-actions">
                  <button className="nova-btn nova-btn-primary" onClick={next}>
                    {session.ventOnly ? 'Thanks, Nova' : 'Continue'} <ArrowRight size={15} />
                  </button>
                  {!session.ventOnly && <button className="nova-btn nova-btn-ghost" onClick={reset}>Stop here</button>}
                </div>
              )}

              {/* transparency: what Nova read */}
              {detection && !session.ventOnly && (
                <p className="nova-detect-note">
                  Nova read this as a <b>{detection.intensity >= 2 ? 'spiral' : 'rough moment'}</b>
                  {detection.selfBlame && ' with self-blame'} — walking the full protocol.
                </p>
              )}
            </div>
          )}
        </section>

        {/* ── Customization panel (the Nest) ── */}
        <section className="nova-card">
          <h3 className="nova-section-title">Your Nest, your rules</h3>
          <p className="nova-section-sub">Real control over the emotional experience — not the illusion of it.</p>

          <div className="nova-set-block">
            <span className="nova-set-label">Nova's tone</span>
            <div className="nova-tone-row">
              {TONES.map(t => (
                <button
                  key={t.id}
                  className={`nova-tone-chip${settings.tone === t.id ? ' is-on' : ''}`}
                  style={settings.tone === t.id ? { borderColor: t.swatch, color: t.swatch } : undefined}
                  onClick={() => set('tone', t.id)}
                >
                  <span className="nova-tone-sw" style={{ background: t.swatch }} />
                  {t.label}
                </button>
              ))}
            </div>
            <p className="nova-tone-blurb">{tone.blurb}</p>
          </div>

          {[['reframe', 'Reframe intensity'], ['filter', 'Content filter'], ['size', 'Community size'], ['notify', 'Notifications'], ['anonymity', 'Anonymity']].map(([key, label]) => (
            <div className="nova-set-block" key={key}>
              <span className="nova-set-label">{label}</span>
              <div className="nova-seg">
                {OPTIONS[key].map(([val, txt]) => (
                  <button
                    key={val}
                    className={`nova-seg-btn${settings[key] === val ? ' is-on' : ''}`}
                    onClick={() => set(key, val)}
                  >{txt}</button>
                ))}
              </div>
            </div>
          ))}
          <p className="nova-sovereignty">
            "You just took control of your experience. That's not customization — that's sovereignty. I respect that." — Nova
          </p>
        </section>

        {/* ── Gratitude Log + Trophy Case ── */}
        <div className="nova-two-col">
          <section className="nova-card">
            <h3 className="nova-section-title"><Sun size={16} /> Gratitude Log</h3>
            {gratitudeList.length ? (
              <ul className="nova-grat-list">
                {gratitudeList.map(g => <li key={g.id}>{g.text}</li>)}
              </ul>
            ) : (
              <p className="nova-empty">Nothing logged yet. Finish a walk, or add one below.</p>
            )}
            <div className="nova-grat-entry">
              <input
                className="nova-input"
                placeholder="Grateful for…"
                value={gratDraft}
                onChange={e => setGratDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && gratDraft.trim()) { logGratitude(gratDraft.trim()); setGratDraft(''); refreshSnap(); } }}
              />
              <button className="nova-btn nova-btn-primary" onClick={() => { if (gratDraft.trim()) { logGratitude(gratDraft.trim()); setGratDraft(''); refreshSnap(); } }}>
                <Send size={15} />
              </button>
            </div>
          </section>

          <section className="nova-card">
            <h3 className="nova-section-title"><Trophy size={16} /> Trophy Case</h3>
            {wins.length ? (
              <ul className="nova-wins">
                {wins.map(w => (
                  <li key={w.id}><Trophy size={14} /> <span>{w.title}</span></li>
                ))}
              </ul>
            ) : (
              <p className="nova-empty">Your wins land here — every one a record you can scroll when you doubt yourself.</p>
            )}
          </section>
        </div>

        {/* ── Kindness Protocol ── */}
        <section className="nova-card">
          <h3 className="nova-section-title"><Shield size={16} /> The Kindness Protocol</h3>
          <p className="nova-section-sub">
            The real threat isn't negativity — it's toxicity disguised as honesty. Nova always
            offers the door back before she closes one.
          </p>

          <div className="nova-mod-demo">
            <input
              className="nova-input"
              placeholder="Try a comment — see how Nova would handle it…"
              value={modDraft}
              onChange={e => { setModDraft(e.target.value); setModResult(null); }}
              onKeyDown={e => e.key === 'Enter' && checkComment()}
            />
            <button className="nova-btn nova-btn-primary" onClick={checkComment} disabled={!modDraft.trim()}>Check</button>
          </div>
          {modResult && (
            modResult.kind ? (
              <p className="nova-mod-out kind"><Check size={15} /> Kind. Welcome to the Nest — this is exactly the energy we keep.</p>
            ) : (
              <div className={`nova-mod-out rung-${modResult.level}`}>
                <p className="nova-mod-sev">{modResult.severity} · {modResult.actionLabel}</p>
                <p className="nova-mod-script">"{modResult.script}"</p>
                <p className="nova-mod-outcome">{modResult.outcome}</p>
              </div>
            )
          )}

          <div className="nova-ladder">
            {RUNGS.map(r => (
              <div key={r.id} className={`nova-rung rung-${r.level}`}>
                <span className="nova-rung-sev">{r.severity}</span>
                <span className="nova-rung-act">{r.actionLabel}</span>
              </div>
            ))}
          </div>
          <p className="nova-repeat">{REPEAT_OFFENDER_SCRIPT}</p>
        </section>

        {/* ── Honest note ── */}
        <section className="nova-note">
          <Shield size={16} />
          <p>
            <b>What Nova is:</b> a scripted companion with a tone engine — real design, modeled
            empathy, not therapy. The community mirror runs on seeded cohort numbers and the
            morning-after check-in on a local timer; both swap onto a real backend the day one
            exists. Anything signalling self-harm or crisis exits to real human resources —
            Nova routes, she never counsels.
          </p>
        </section>
      </div>
    </div>
  );
}
