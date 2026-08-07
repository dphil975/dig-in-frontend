import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import {
  ARCHETYPES, readProfile, explainProfile, loadProfile,
  pinArchetype, muteArchetype, unmuteArchetype,
} from '../../lib/archetypeEngine';
import { pullProfile, pushProfile, forgetProfile } from '../../lib/archetypeApi';
import './YourRead.css';

/* Your Read — the screen that makes the archetype lens legible.

   Every recommender has a model of you. Almost none will show it to you, and
   none will let you argue with it. That's the entire difference between a
   system that widens someone's world and one that manages them, so this page
   is not a settings sub-tab — it's the feature.

   Three promises, kept literally on this screen:
     1. LEGIBLE  — the exact actions behind the read are listed, in plain words.
     2. CORRECTABLE — "that's not me" changes the feed immediately.
     3. ERASABLE — one button, no retention dark pattern, no "are you sure
        you'll lose your personalization" guilt copy.

   It also states what the app does NOT do, because in 2026 that's the part
   people actually want to know. */

export default function YourRead() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => loadProfile());
  const [busy, setBusy] = useState(false);

  // Fold in whatever another device already learned.
  useEffect(() => { pullProfile().then(setProfile).catch(() => {}); }, []);

  const read = useMemo(() => readProfile(profile), [profile]);
  const explain = useMemo(() => explainProfile(profile), [profile]);

  function apply(next) {
    setProfile({ ...next });
    pushProfile(next).catch(() => {});
  }

  async function handleForget() {
    setBusy(true);
    const cleared = await forgetProfile();
    setProfile({ ...cleared });
    setBusy(false);
  }

  const primaryId = read.primary?.id;

  return (
    <div className="yr-page">
      <Nav />
      <div className="yr-wrap">
        <button className="yr-back" onClick={() => navigate(-1)}>← BACK</button>

        <header className="yr-head">
          <p className="yr-kicker">YOUR READ</p>
          <h1 className="yr-title">What this app thinks it knows about you.</h1>
          <p className="yr-sub">
            All of it. Nothing held back, nothing inferred about your life — only how you
            cook. Disagree with any of it and the feed changes on the spot.
          </p>
        </header>

        {/* ── The read itself ─────────────────────────────────────────── */}
        <section className={`yr-card yr-card-main${read.primary ? '' : ' yr-listening'}`}>
          {read.primary ? (
            <>
              <div className="yr-main-top">
                <span className="yr-emoji" aria-hidden="true">{read.primary.emoji}</span>
                <div>
                  <h2 className="yr-name">{read.primary.name}</h2>
                  <p className="yr-reads">{read.primary.reads}</p>
                </div>
                <span className={`yr-status yr-status-${read.status}`}>
                  {read.status === 'declared' ? 'you told us' : 'from what you cooked'}
                </span>
              </div>
              <p className="yr-strength">{read.primary.strength}</p>

              <div className="yr-confidence">
                <div className="yr-conf-bar">
                  <span style={{ width: `${Math.round(read.primary.weight * 100)}%` }} />
                </div>
                <span className="yr-conf-num">{Math.round(read.primary.weight * 100)}% of the read</span>
              </div>
              {read.secondary && (
                <p className="yr-secondary">
                  With a streak of <b>{read.secondary.emoji} {read.secondary.name}</b> underneath —
                  most people are a mixture, and we keep it that way.
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className="yr-name">{explain.headline}</h2>
              <p className="yr-strength">{explain.body}</p>
            </>
          )}
        </section>

        {/* ── Evidence ─────────────────────────────────────────────────── */}
        {explain.evidence.length > 0 && (
          <section className="yr-card">
            <h3 className="yr-h3">Why we think that</h3>
            <p className="yr-note">These are the only things we counted. No guesses about your life.</p>
            <ul className="yr-evidence">
              {explain.evidence.map((e) => (
                <li key={e.signal}>
                  <span className="yr-ev-n">×{e.n}</span>
                  <span>{e.label}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── What we do with it ───────────────────────────────────────── */}
        {read.primary && (
          <section className="yr-card yr-card-mix">
            <h3 className="yr-h3">What we do with it</h3>
            <div className="yr-mix">
              <div className="yr-mix-row">
                <span className="yr-band yr-band-aligned">40%</span>
                <p>Things you already like. <b>{read.primary.aligned.slice(0, 3).join(', ')}.</b></p>
              </div>
              <div className="yr-mix-row">
                <span className="yr-band yr-band-counter">40%</span>
                <p>The opposite, on purpose. <b>{read.primary.counterWhy}</b></p>
              </div>
              <div className="yr-mix-row">
                <span className="yr-band yr-band-wild">20%</span>
                <p>Wildcards — unrelated to any of this, so the feed keeps surprising you.</p>
              </div>
            </div>
            <p className="yr-note yr-note-strong">
              We never spend more than 40% of your feed on what you already like. A feed that only
              agrees with you is how every other app got boring.
            </p>
          </section>
        )}

        {/* ── Correct it ───────────────────────────────────────────────── */}
        <section className="yr-card">
          <h3 className="yr-h3">Change it</h3>
          <p className="yr-note">
            Pick the one that actually sounds like you, or hide the ones that don't. Your word beats
            anything we worked out.
          </p>
          <div className="yr-grid">
            {ARCHETYPES.map((a) => {
              const muted = profile.muted.includes(a.id);
              const pinned = profile.pinned === a.id;
              return (
                <div key={a.id} className={`yr-type${pinned ? ' is-pinned' : ''}${muted ? ' is-muted' : ''}`}>
                  <div className="yr-type-head">
                    <span aria-hidden="true">{a.emoji}</span>
                    <b>{a.name}</b>
                    {a.id === primaryId && !pinned && <span className="yr-type-flag">current read</span>}
                  </div>
                  <p className="yr-type-reads">{a.reads}</p>
                  <div className="yr-type-actions">
                    <button
                      type="button"
                      className="yr-btn"
                      onClick={() => apply(pinArchetype(pinned ? null : a.id, profile))}
                    >
                      {pinned ? 'Unpin' : "That's me"}
                    </button>
                    <button
                      type="button"
                      className="yr-btn yr-btn-quiet"
                      onClick={() => apply(muted ? unmuteArchetype(a.id, profile) : muteArchetype(a.id, profile))}
                    >
                      {muted ? 'Unhide' : 'Not me'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── The boundary ─────────────────────────────────────────────── */}
        <section className="yr-card yr-card-never">
          <h3 className="yr-h3">What we don't do</h3>
          <ul className="yr-never">
            <li>We don't guess at your mental health, your childhood, or your diagnoses. A recipe app
              cannot know those things, and pretending otherwise would just be confidently wrong about you.</li>
            <li>We don't sell this. Our neighborhood reports for grocers are built from anonymous
              check-ins and ingredient trends — never from anyone's personal profile.</li>
            <li>We don't use it to keep you scrolling. The feed ends. It's supposed to.</li>
            <li>Old habits fade on their own, so a phase you went through in spring stops shaping this
              by summer.</li>
          </ul>
        </section>

        {/* ── Erase ────────────────────────────────────────────────────── */}
        <section className="yr-card yr-card-forget">
          <div>
            <h3 className="yr-h3">Start over</h3>
            <p className="yr-note">
              Deletes everything above, here and on our server. The feed goes back to showing you a
              spread. No follow-up questions.
            </p>
          </div>
          <button type="button" className="yr-forget" onClick={handleForget} disabled={busy}>
            {busy ? 'Forgetting…' : 'Forget what you know'}
          </button>
        </section>
      </div>
    </div>
  );
}
