import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRecentRecalls, cachedRecentRecalls, cachedPantryRecalls, activeRecallHits, enableAutoRefresh, onNewRecalls } from '../../../lib/health/recalls';
import { fmtRecallDate } from '../../../lib/pantry/barcodeLookup';
import { growPicks, SPACE_GUIDE } from '../../../lib/flavor/growGuide';
import { loadUserPosts } from '../../../lib/social/userPosts';
import './FreshPanel.css';

/* The stewardship side of eating — keeping what you eat safe, fresh, and
   stretched. It used to be the "Fresh" tab on the old home feed; each piece now
   lives where it belongs:

     RecallWatch     Discover → Safety     live FDA recalls + what in your pantry matches
     GrowAndRegrow   Discover → Safety     a real do-it-on-a-windowsill horticultural fact
     CommunityTips   Discover → Safety     write-ups about growing, storing and saving food
   ("Use it up first" is the Nova card at the top of Profile → Pantry.)

   Every one is backed by real data or a real app-authored fact, and renders an
   empty/invite state instead of filler when there's nothing real to show. */

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

/* Keep the tips on-theme: write-ups actually about growing / storing /
   stretching / not-wasting food, not every post. */
const STEWARD_RX = /grow|garden|regrow|scrap|pantry|leftover|waste|freeze|freezer|storage|preserve|batch|meal ?prep|shelf|expire|recall|fresh/i;
function stewardshipPosts(posts) {
  const matches = posts.filter((p) => {
    const hay = `${p.title || ''} ${p.body || ''} ${(p.tags || []).join(' ')}`;
    return STEWARD_RX.test(hay);
  });
  return matches.slice(0, 3);
}

// A section is always open unless it's `collapsible` — then its header is a
// button and it starts closed (Discover keeps the heavy ones tucked away).
function Section({ icon, title, sub, children, collapsible = false, defaultOpen = !collapsible }) {
  const [open, setOpen] = useState(defaultOpen);
  const head = (
    <>
      <span className="fresh-sec-icon" aria-hidden="true">{icon}</span>
      <div>
        <h3 className="fresh-sec-title">{title}</h3>
        {sub && <p className="fresh-sec-sub">{sub}</p>}
      </div>
      {collapsible && <span className={`fresh-sec-chev${open ? ' open' : ''}`} aria-hidden="true">▾</span>}
    </>
  );
  return (
    <section className="fresh-sec">
      {collapsible ? (
        <button type="button" className="fresh-sec-head fresh-sec-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {head}
        </button>
      ) : (
        <header className="fresh-sec-head">{head}</header>
      )}
      {open && children}
    </section>
  );
}

/* ── Recall Watch ────────────────────────────────────────────────────────── */

// Nothing here is needed for the first paint, so the network check waits for the
// page to go idle (and never competes with fonts or the first render).
const whenIdle = (fn) => (typeof window.requestIdleCallback === 'function'
  ? window.requestIdleCallback(fn, { timeout: 2000 })
  : window.setTimeout(fn, 400));
const cancelIdle = (id) => (typeof window.cancelIdleCallback === 'function'
  ? window.cancelIdleCallback(id)
  : window.clearTimeout(id));

const isSerious = (r) => (r.classification || '').trim() === 'Class I' || r.severity === 'high';
const RECALLS_SHOWN = 6;

/* Collapsed by default. The header carries the whole story in one line, so the
   section is the same height whether the feed is still loading, empty or full —
   a list of recalls arriving used to shove everything below it down the page.
   What matters most stays visible: a match with something in your own pantry. */
export function RecallWatch() {
  const navigate = useNavigate();
  const pantry = useMemo(() => loadPantry(), []);

  // Instant from cache, then a live refresh.
  const [recalls, setRecalls] = useState(() => cachedRecentRecalls());
  const [state, setState] = useState(() => (cachedRecentRecalls().length ? 'ready' : 'loading'));
  const pantryHits = useMemo(() => activeRecallHits(cachedPantryRecalls(pantry)), [pantry]);

  useEffect(() => {
    let alive = true;
    enableAutoRefresh();
    const id = whenIdle(() => {
      fetchRecentRecalls({ limit: 15 })
        .then((list) => {
          if (!alive) return;
          if (list.length) setRecalls(list);
          setState(list.length ? 'ready' : 'empty');
        })
        .catch(() => { if (alive) setState('empty'); });
    });
    const unsub = onNewRecalls((fresh) => {
      if (!alive) return;
      setRecalls((prev) => {
        const ids = new Set(prev.map(r => r.id || r.description));
        const novel = fresh.filter(r => !ids.has(r.id || r.description));
        return novel.length ? [...novel, ...prev] : prev;
      });
    });
    return () => { alive = false; cancelIdle(id); unsub(); };
  }, []);

  const serious = recalls.filter(isSerious).length;
  let summary;
  if (state === 'loading') summary = 'Checking the FDA feed…';
  else if (recalls.length) summary = `${recalls.length} recent recall${recalls.length !== 1 ? 's' : ''}${serious ? ` · ${serious} serious` : ''}`;
  else summary = 'No current recalls to show right now.';

  return (
    <>
      {pantryHits.length > 0 && (
        <button type="button" className="fresh-pantry-flag" onClick={() => navigate('/pantry')}>
          <b>{pantryHits.length}</b> item{pantryHits.length !== 1 ? 's' : ''} you already own may be affected — review in your Pantry →
        </button>
      )}
      <Section icon="⚠" title="Recall Watch" sub={summary} collapsible>
        {recalls.length > 0 && (
          <ul className="fresh-recall-list">
            {recalls.slice(0, RECALLS_SHOWN).map((r, i) => {
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
                      <b>Reason:</b> {r.reason}
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
          Live from the FDA's public food-recall feed, checked once a day. Text-matched — check the brand, lot, and date code before assuming it's your exact item.
        </p>
      </Section>
    </>
  );
}

/* ── Grow & Regrow ───────────────────────────────────────────────────────── */
export function GrowAndRegrow({ collapsible = false }) {
  const grow = useMemo(() => growPicks(6), []);
  return (
    <Section icon="🌱" title="Grow & Regrow" sub="It's easier than it looks — most of this is a scrap in a glass of water." collapsible={collapsible}>
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
  );
}

/* ── From people like you ────────────────────────────────────────────────── */
export function CommunityTips({ onWrite, collapsible = false }) {
  const tips = useMemo(() => stewardshipPosts(loadUserPosts()), []);
  return (
    <Section icon="💬" title="From people like you" sub="Real tips people wrote about growing, storing, and stretching food." collapsible={collapsible}>
      {tips.length === 0 ? (
        <div className="fresh-empty-block">
          <p>No one's shared a tip here yet. Know a trick for keeping herbs alive or stretching a bunch of scallions?</p>
          {onWrite && <button type="button" className="fresh-btn" onClick={onWrite}>Write the first one →</button>}
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
  );
}
