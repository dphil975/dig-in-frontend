import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRecentRecalls, cachedRecentRecalls, cachedPantryRecalls } from '../../lib/recallWatch';
import { fmtRecallDate } from '../../lib/barcodeLookup';
import { growPicks, SPACE_GUIDE } from '../../lib/growGuide';
import { expiringItems, freshnessLabel } from '../../lib/freshness';
import { loadUserPosts } from '../../lib/userPosts';
import './FreshPanel.css';

/* FreshPanel — what the "Fresh" tab actually IS now.

   It used to be For You re-filtered to a few post types (same content, fewer of
   it). That gave the tab no reason to exist. This gives it a different job from
   For You: For You is what to COOK; Fresh is keeping your food SAFE, fresh, and
   stretched — the stewardship side of eating.

   Four honest sections, every one backed by real data or real app-authored
   fact, each rendering an empty/invite state rather than filler when there's
   nothing real to show (the app's honest-empty rule):
     1. Recall Watch  — live openFDA feed of current recalls + your pantry match
     2. Grow & Regrow — real, do-it-on-a-windowsill horticultural fact
     3. Use It Up     — your real pantry items about to go off
     4. From people   — real community write-ups about growing/saving food
*/

const CLS = {
  'Class I':   { label: 'Class I · serious', tone: 'sev-hi' },
  'Class II':  { label: 'Class II · moderate', tone: 'sev-mid' },
  'Class III': { label: 'Class III · minor', tone: 'sev-lo' },
};
const SEV = {
  high:   { label: 'Serious', tone: 'sev-hi' },
  medium: { label: 'Recall', tone: 'sev-mid' },
  low:    { label: 'Advisory', tone: 'sev-lo' },
};
// Where each grow item realistically lives — so "I have no yard" has an answer.
const SPACE_LABEL = {
  windowsill:   '🪟 A bright windowsill',
  counter:      '🍽 A counter — no sun needed',
  balcony:      '☀️ A sunny balcony or rail',
  'grow-light': '💡 A cheap grow light',
  'deep-pot':   '🪣 One deep pot or bucket',
};
// A recall from openFDA carries a real Class I/II/III; one from the current FDA
// press-release feed isn't classified yet, so fall back to the severity we
// inferred from the hazard wording.
function badgeFor(r) {
  return CLS[(r.classification || '').trim()] || SEV[r.severity] || null;
}

function loadPantry() {
  try { const v = JSON.parse(localStorage.getItem('dig_in_pantry')); return Array.isArray(v) ? v : []; }
  catch { return []; }
}

/* Keep the "from people" section on-theme: surface write-ups actually about
   growing / storing / stretching / not-wasting food, not every post. */
const STEWARD_RX = /grow|garden|regrow|scrap|pantry|leftover|waste|freeze|freezer|storage|preserve|batch|meal ?prep|shelf|expire|recall|fresh/i;
function stewardshipPosts(posts) {
  const matches = posts.filter((p) => {
    const hay = `${p.title || ''} ${p.body || ''} ${(p.tags || []).join(' ')}`;
    return STEWARD_RX.test(hay);
  });
  return matches.slice(0, 3);
}

function Section({ icon, title, sub, children }) {
  return (
    <section className="fresh-sec">
      <header className="fresh-sec-head">
        <span className="fresh-sec-icon" aria-hidden="true">{icon}</span>
        <div>
          <h3 className="fresh-sec-title">{title}</h3>
          {sub && <p className="fresh-sec-sub">{sub}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

export default function FreshPanel({ onWritePost }) {
  const navigate = useNavigate();
  const pantry = useMemo(() => loadPantry(), []);

  // Recall Watch — instant from cache, then a live refresh.
  const [recalls, setRecalls] = useState(() => cachedRecentRecalls());
  const [loadingRecalls, setLoadingRecalls] = useState(false);
  const pantryHits = useMemo(() => cachedPantryRecalls(pantry), [pantry]);

  useEffect(() => {
    let alive = true;
    setLoadingRecalls(true);
    fetchRecentRecalls({ limit: 12 })
      .then((list) => { if (alive && list.length) setRecalls(list); })
      .finally(() => { if (alive) setLoadingRecalls(false); });
    return () => { alive = false; };
  }, []);

  const grow = useMemo(() => growPicks(6), []);
  const expiring = useMemo(() => expiringItems(pantry, { withinDays: 3 }), [pantry]);
  const tips = useMemo(() => stewardshipPosts(loadUserPosts()), []);

  const topRecalls = recalls.slice(0, 4);

  return (
    <div className="fresh-panel">
      <p className="fresh-intro">
        Keeping what you eat <b>safe, fresh, and stretched</b> — recalls to know about,
        things you can grow yourself, and what to use up before it turns.
      </p>

      {/* ── 1. RECALL WATCH ─────────────────────────────────────────── */}
      <Section
        icon="⚠"
        title="Recall Watch"
        sub="Live from the FDA's public food-recall feed."
      >
        {pantryHits.length > 0 && (
          <button type="button" className="fresh-pantry-flag" onClick={() => navigate('/pantry')}>
            <b>{pantryHits.length}</b> item{pantryHits.length !== 1 ? 's' : ''} you already own may be affected — review in your Pantry →
          </button>
        )}

        {topRecalls.length === 0 ? (
          <p className="fresh-empty">
            {loadingRecalls ? 'Checking the FDA feed…' : 'No current recalls to show right now. This checks the FDA once a day.'}
          </p>
        ) : (
          <ul className="fresh-recall-list">
            {topRecalls.map((r, i) => {
              const cls = badgeFor(r);
              return (
                <li className="fresh-recall" key={i}>
                  <div className="fresh-recall-top">
                    {cls && <span className={`fresh-sev ${cls.tone}`}>{cls.label}</span>}
                    <span className="fresh-recall-date">{fmtRecallDate(r.date)}</span>
                  </div>
                  {r.link ? (
                    <a className="fresh-recall-desc fresh-recall-desc-link" href={r.link} target="_blank" rel="noreferrer">
                      {r.description} ↗
                    </a>
                  ) : (
                    <p className="fresh-recall-desc">{r.description}</p>
                  )}
                  {r.reason && (
                    <p className="fresh-recall-reason">
                      <b>Reason:</b> {r.reason.length > 240 ? `${r.reason.slice(0, 240)}…` : r.reason}
                    </p>
                  )}
                  {(r.firm || r.state) && (
                    <p className="fresh-recall-meta">{[r.firm, r.state].filter(Boolean).join(' · ')}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="fresh-actions">
          <button type="button" className="fresh-btn" onClick={() => navigate('/pantry')}>
            Check my pantry against these
          </button>
          <a
            className="fresh-link"
            href="https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts"
            target="_blank"
            rel="noreferrer"
          >
            Full FDA list ↗
          </a>
        </div>
        <p className="fresh-fineprint">
          Text-matched against a public feed — check the brand, lot, and date code before assuming it's your exact item.
        </p>
      </Section>

      {/* ── 2. GROW & REGROW ────────────────────────────────────────── */}
      <Section
        icon="🌱"
        title="Grow & Regrow"
        sub="It's easier than it looks — most of this is a scrap in a glass of water."
      >
        <div className="fresh-grow-grid">
          {grow.map((g) => (
            <article className="fresh-grow" key={g.id}>
              <div className="fresh-grow-top">
                <span className="fresh-grow-name">{g.name}</span>
                <span className={`fresh-grow-tag ${g.from === 'regrow' ? 'is-regrow' : 'is-seed'}`}>
                  {g.from === 'regrow' ? 'from scraps' : 'from seed'}
                </span>
              </div>
              <p className="fresh-grow-how">{g.how}</p>
              <p className="fresh-grow-tip">{g.tip}</p>
              <div className="fresh-grow-foot">
                {g.space && <span className="fresh-grow-space">{SPACE_LABEL[g.space] || g.space}</span>}
                <span className="fresh-grow-days">≈ {g.days}</span>
              </div>
            </article>
          ))}
        </div>

        {/* The apartment answer: match the space you actually have to what grows. */}
        <div className="fresh-space">
          <p className="fresh-space-head">No yard? Grow to the space you've got:</p>
          <div className="fresh-space-grid">
            {SPACE_GUIDE.map((s) => (
              <div className="fresh-space-tier" key={s.id}>
                <span className="fresh-space-place">{s.place}</span>
                <p className="fresh-space-blurb">{s.blurb}</p>
                <div className="fresh-space-grows">
                  {s.grows.map((x) => <span key={x}>{x}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 3. USE IT UP ────────────────────────────────────────────── */}
      <Section
        icon="🥬"
        title="Use It Up"
        sub="What's about to turn in your pantry — cook it before it's waste."
      >
        {pantry.length === 0 ? (
          <div className="fresh-empty-block">
            <p>Add what's in your kitchen and Dig In will tell you what to use up first.</p>
            <button type="button" className="fresh-btn" onClick={() => navigate('/pantry')}>Set up my Pantry →</button>
          </div>
        ) : expiring.length === 0 ? (
          <p className="fresh-empty">Nothing's on the edge right now — your pantry's in good shape. ✓</p>
        ) : (
          <>
            <ul className="fresh-expire-list">
              {expiring.slice(0, 6).map((e, i) => (
                <li className={`fresh-expire ${e.status}`} key={i}>
                  <span className="fresh-expire-name">{e.item.name}</span>
                  <span className="fresh-expire-days">{freshnessLabel(e.daysLeft)}</span>
                </li>
              ))}
            </ul>
            <button type="button" className="fresh-btn" onClick={() => navigate('/pantry-recipes')}>
              Cook something from these →
            </button>
          </>
        )}
      </Section>

      {/* ── 4. FROM PEOPLE LIKE YOU ─────────────────────────────────── */}
      <Section
        icon="💬"
        title="From people like you"
        sub="Real tips people wrote about growing, storing, and stretching food."
      >
        {tips.length === 0 ? (
          <div className="fresh-empty-block">
            <p>No one's shared a tip here yet. Know a trick for keeping herbs alive or stretching a bunch of scallions?</p>
            {onWritePost && (
              <button type="button" className="fresh-btn" onClick={onWritePost}>Write the first one →</button>
            )}
          </div>
        ) : (
          <ul className="fresh-tip-list">
            {tips.map((p) => (
              <li className="fresh-tip" key={p.id}>
                <div className="fresh-tip-head">
                  <span className="fresh-tip-title">{p.title || 'Untitled'}</span>
                  <span className="fresh-tip-author">— {p.author || 'you'}</span>
                </div>
                {p.body && <p className="fresh-tip-body">{p.body.slice(0, 220)}{p.body.length > 220 ? '…' : ''}</p>}
                {p.tags?.length > 0 && (
                  <div className="fresh-tip-tags">{p.tags.slice(0, 4).map((t) => <span key={t}>{t}</span>)}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
