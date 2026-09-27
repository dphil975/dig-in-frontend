import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/shell/Nav';
import { currentDrop, daysToNextDrop } from '../../lib/theTable';
import { getPublicIssue } from '../../lib/circlesApi';
import './PublicIssue.css';

/* The public weekly Issue — "the magazine writes itself." It's a query, not a
   manuscript: this week's episode (place, quote, question) laid out with every
   circle answer whose author chose to make it public. Anonymous by design (no
   names, no accounts shown) — the point is the words and the plates, not the
   personalities. Empty until people opt answers in (and until migration 010 has
   run on the backend) — honest-empty, like every other real-data surface here. */

export default function PublicIssue() {
  const navigate = useNavigate();
  const drop = useMemo(() => currentDrop(), []);
  const days = useMemo(() => daysToNextDrop(), []);
  const [answers, setAnswers] = useState(null);   // null = loading
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let alive = true;
    getPublicIssue().then((a) => { if (alive) setAnswers(a); });
    return () => { alive = false; };
  }, []);

  // People share things they're in — this makes participants recruiters. Native
  // share sheet where it exists (mobile), clipboard fallback otherwise.
  async function shareIssue() {
    const url = `${window.location.origin}/issue`;
    const text = `This week’s issue of The Table — real women, real answers to “${drop.question}”.`;
    try {
      if (navigator.share) await navigator.share({ title: 'The Table — The Weekly Issue', text, url });
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 2200); }
    } catch { /* user cancelled the share sheet — nothing to do */ }
  }

  return (
    <div className="iss-page">
      <Nav />
      <div className="iss-wrap">
        <button className="iss-back" onClick={() => navigate(-1)}>← BACK</button>

        <header className="iss-masthead">
          <span className="iss-eyebrow">The Table · The Weekly Issue</span>
          <h1 className="iss-place">{drop.place}</h1>
          <p className="iss-vibe">{drop.vibe} · new issue in {days} {days === 1 ? 'day' : 'days'}</p>
          <p className="iss-story">{drop.story}</p>
          <blockquote className="iss-quote">
            {drop.quote}<cite>— {drop.quoteBy}</cite>
          </blockquote>
          {drop.question && (
            <div className="iss-question">
              <span className="iss-question-kicker">The question this week</span>
              <p className="iss-question-text">{drop.question}</p>
            </div>
          )}
        </header>

        <section className="iss-answers-sec">
          <h2 className="iss-answers-h">What women answered</h2>

          {answers === null ? (
            <p className="iss-note">Gathering this week’s answers…</p>
          ) : answers.length === 0 ? (
            <div className="iss-empty">
              <p>
                No one’s made their answer public yet this week. Answers stay inside their circle
                unless a woman chooses to share hers here — so this page fills up only with what
                people actually meant to say out loud.
              </p>
              <button type="button" className="iss-cta" onClick={() => navigate('/circles')}>
                Answer in your circle →
              </button>
            </div>
          ) : (
            <div className="iss-grid">
              {answers.map((a) => (
                <figure className="iss-answer" key={a.id}>
                  {a.image && <img className="iss-photo" src={a.image} alt="" />}
                  {a.audio && <audio className="iss-audio" controls preload="none" src={a.audio} />}
                  {a.text && <blockquote className="iss-text">“{a.text}”</blockquote>}
                  <figcaption className="iss-by">— a woman at the table</figcaption>
                </figure>
              ))}
            </div>
          )}
        </section>

        <footer className="iss-foot">
          <p>Every answer here was shared on purpose. Nothing is scraped, nothing is public by default.</p>
          <div className="iss-foot-actions">
            <button type="button" className="iss-cta iss-share" onClick={shareIssue}>
              {shared ? 'Link copied ✓' : '↗ Share this issue'}
            </button>
            <button type="button" className="iss-cta" onClick={() => navigate('/table')}>See this week at The Table →</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
