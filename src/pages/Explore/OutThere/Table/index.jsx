import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../../components/shell/Nav';
import {
  currentDrop,
  daysToNextDrop,
  archiveDrops,
  stageDropRecipe,
  CONVERSATION_DECKS,
  dealCard,
  CHECK_IN_PROMPTS,
  addCheckIn,
  lastCheckIn,
  checkInDueThisMonth,
  daysSinceCheckIn,
  HOSTING_BOX,
  FIRST_TABLE_PLAN,
  PARTNERSHIP_NOTE,
  splitRoles,
  inviteScript,
} from '../../../../lib/theTable';
import EpisodePlayer from '../../../../components/social/EpisodePlayer';
import './Table.css';

/* The Table — the app's community-warmth hub. The anti-feed: calm, women-
   centered, nothing grabbing at you. Six rooms: this week's drop (place →
   playlist → recipe → conversation), an archive of past drops, conversation
   cards you deal, a gentle monthly check-in, a low-barrier "host a table"
   starter, and Gather Free — a potluck coordinator that splits cost and
   chores so nobody carries the whole bill and nobody's excluded for having
   nothing to bring. Each drop's recipe deep-links into the real /recipe view.
   Engine + localStorage live in src/lib/theTable.js. */

const TABS = [
  { id: 'week', label: 'This Week' },
  { id: 'archive', label: 'Archive' },
  { id: 'talk', label: 'Conversation' },
  { id: 'checkin', label: 'Check-In' },
  { id: 'host', label: 'Host a Table' },
  { id: 'gather', label: 'Gather Free' },
];

/** Open the drop's recipe in the full-page /recipe view. */
function useCookDrop() {
  const navigate = useNavigate();
  return (drop) => {
    if (stageDropRecipe(drop)) navigate('/recipe');
  };
}

function ThisWeek() {
  const navigate = useNavigate();
  const drop = useMemo(() => currentDrop(), []);
  const days = useMemo(() => daysToNextDrop(), []);
  const cook = useCookDrop();
  return (
    <div className="tb-week">
      <div className="tb-drop-head">
        <span className="tb-drop-tag">This week · new drop in {days} {days === 1 ? 'day' : 'days'}</span>
        <h2 className="tb-place">{drop.place}</h2>
        <p className="tb-vibe">{drop.vibe}</p>
      </div>

      <p className="tb-story">{drop.story}</p>
      <blockquote className="tb-quote">
        {drop.quote}
        <cite>— {drop.quoteBy}</cite>
      </blockquote>

      {/* The episode — a real player when a recording exists, "Listen on …"
          links when only those exist, an honest "coming" note otherwise. */}
      <EpisodePlayer drop={drop} />

      {/* The week's question — the thread that ties the episode to your circle.
          Answer it at your own table, or bring it to a circle where a post made
          this week becomes everyone's shared answer. */}
      {drop.question && (
        <section className="tb-question">
          <span className="tb-question-kicker">This week’s question</span>
          <p className="tb-question-text">{drop.question}</p>
          <span className="tb-question-note">Ask it at your table — or bring it to a circle and answer it together.</span>
          <button type="button" className="tb-question-issue" onClick={() => navigate('/issue')}>
            📖 Read this week’s issue →
          </button>
        </section>
      )}

      <div className="tb-cards2">
        <section className="tb-panel tb-playlist">
          <span className="tb-panel-kicker">🎧 The Playlist</span>
          <h3>{drop.playlist.title}</h3>
          <p className="tb-panel-sub">{drop.playlist.mood}</p>
          <ol className="tb-tracks">
            {drop.playlist.tracks.map((t, i) => (
              <li key={i}>
                <span className="tb-song">{t.song}</span>
                <span className="tb-artist">{t.artist}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="tb-panel tb-recipe">
          <span className="tb-panel-kicker">🍲 The Recipe It Inspired</span>
          <h3>{drop.recipe}</h3>
          <p className="tb-panel-sub">{drop.recipeNote}</p>
          {drop.recipeData && (
            <button type="button" className="tb-cook" onClick={() => cook(drop)}>
              Cook this recipe →
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

function Archive() {
  const drops = useMemo(() => archiveDrops(), []);
  const cook = useCookDrop();
  return (
    <div className="tb-archive">
      <p className="tb-archive-intro">
        Every table we&apos;ve pulled up to. Wander back through the places, the
        people, and the playlists whenever you need somewhere quiet to be.
      </p>
      <div className="tb-archive-list">
        {drops.map(({ drop, index, label, weeksAgo }) => (
          <article key={index} className={`tb-arch-card${weeksAgo === 0 ? ' is-current' : ''}`}>
            <div className="tb-arch-top">
              <span className={`tb-arch-when${weeksAgo === 0 ? ' now' : ''}`}>{label}</span>
              <span className="tb-arch-vibe">{drop.vibe}</span>
            </div>
            <h3 className="tb-arch-place">{drop.place}</h3>
            <p className="tb-arch-story">{drop.story}</p>
            <blockquote className="tb-arch-quote">
              {drop.quote} <cite>— {drop.quoteBy}</cite>
            </blockquote>
            <div className="tb-arch-meta">
              <span className="tb-arch-chip">🎧 {drop.playlist.title} · {drop.playlist.tracks.length} tracks</span>
              <span className="tb-arch-chip">🍲 {drop.recipe}</span>
            </div>
            {/* A play control only if this past episode was actually recorded. */}
            <EpisodePlayer drop={drop} compact />
            {drop.recipeData && (
              <button type="button" className="tb-cook tb-cook-sm" onClick={() => cook(drop)}>
                Cook this recipe →
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function Conversation() {
  const [deckId, setDeckId] = useState(CONVERSATION_DECKS[0].id);
  const [card, setCard] = useState(() => CONVERSATION_DECKS[0].cards[0]);

  const deal = (id) => {
    const next = id || deckId;
    setDeckId(next);
    setCard((prev) => dealCard(next, id ? null : prev));
  };

  return (
    <div className="tb-talk">
      <p className="tb-talk-intro">
        No hot takes, no advice you didn&apos;t ask for. Deal a card and ask
        someone — or yourself — something real.
      </p>
      <div className="tb-decks">
        {CONVERSATION_DECKS.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`tb-deck${deckId === d.id ? ' active' : ''}`}
            onClick={() => deal(d.id)}
          >
            <span>{d.emoji}</span> {d.label}
          </button>
        ))}
      </div>

      <div className="tb-card-stage">
        <p className="tb-card-text">{card}</p>
      </div>
      <button type="button" className="tb-deal" onClick={() => deal()}>
        Deal another →
      </button>
    </div>
  );
}

function CheckIn() {
  const [answers, setAnswers] = useState({});
  const [saved, setSaved] = useState(false);
  const last = useMemo(() => lastCheckIn(), [saved]);
  const due = useMemo(() => checkInDueThisMonth(), [saved]);
  const since = useMemo(() => daysSinceCheckIn(), [saved]);

  const submit = () => {
    addCheckIn(answers);
    setSaved(true);
  };

  return (
    <div className="tb-checkin">
      <p className="tb-checkin-intro">
        A once-a-month sit-down with yourself. It&apos;s a system, not a test — my
        mom taught me this one. No streaks, nothing to break. Just a quiet look at
        how you&apos;re adapting.
      </p>

      <div className={`tb-due ${due ? 'is-due' : 'is-done'}`}>
        {due
          ? "You haven\'t checked in this month. When you\'re ready — no rush."
          : `Checked in this month${since != null ? ` · ${since} ${since === 1 ? 'day' : 'days'} ago` : ''}. That\'s enough.`}
      </div>

      {CHECK_IN_PROMPTS.map((p) => (
        <label key={p.id} className="tb-prompt">
          <span className="tb-prompt-q">{p.q}</span>
          <span className="tb-prompt-hint">{p.hint}</span>
          <textarea
            rows={2}
            value={answers[p.id] || ''}
            onChange={(e) => setAnswers((a) => ({ ...a, [p.id]: e.target.value }))}
            placeholder="Only if you want to write it down…"
          />
        </label>
      ))}

      <button type="button" className="tb-save" onClick={submit}>
        {saved ? 'Saved for you ✓' : 'Save this month\'s check-in'}
      </button>

      {last && !saved && (
        <p className="tb-last-note">
          Last check-in saved {new Date(last.at).toLocaleDateString()}.
        </p>
      )}
    </div>
  );
}

function Host() {
  return (
    <div className="tb-host">
      <p className="tb-host-intro">
        You don&apos;t need to be perfect, rich, or a natural. You need a small kit
        and a plan. Anyone can host a table — here&apos;s the whole cheat sheet.
      </p>

      <section>
        <h3 className="tb-host-h">The Hosting Box</h3>
        <div className="tb-box">
          {HOSTING_BOX.map((b, i) => (
            <div key={i} className="tb-box-item">
              <span className="tb-box-name">{b.item}</span>
              <span className="tb-box-why">{b.why}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="tb-host-h">Your First Table, Step by Step</h3>
        <ol className="tb-plan">
          {FIRST_TABLE_PLAN.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </section>

      <p className="tb-partnership">{PARTNERSHIP_NOTE}</p>
    </div>
  );
}

function GatherFree() {
  const [guestCount, setGuestCount] = useState(4);
  const [occasion, setOccasion] = useState('');
  const [copied, setCopied] = useState(false);

  const assignments = useMemo(() => splitRoles(guestCount), [guestCount]);
  const script = useMemo(
    () => inviteScript({ occasion, guestCount }),
    [occasion, guestCount]
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable — text is still visible below to select manually */ }
  };

  return (
    <div className="tb-gather">
      <p className="tb-gather-intro">
        Money shouldn&apos;t decide who gets people around them. Split the
        cost across everyone, keep a couple of jobs free of charge, and set a
        low-guilt ask so plans don&apos;t quietly fall apart.
      </p>

      <div className="tb-gather-controls">
        <label className="tb-gather-field">
          <span>Occasion</span>
          <input
            type="text"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            placeholder="dinner at mine, Sunday 6pm…"
          />
        </label>
        <label className="tb-gather-field tb-gather-count">
          <span>How many people</span>
          <div className="tb-stepper">
            <button type="button" onClick={() => setGuestCount((n) => Math.max(1, n - 1))}>−</button>
            <span>{guestCount}</span>
            <button type="button" onClick={() => setGuestCount((n) => Math.min(24, n + 1))}>+</button>
          </div>
        </label>
      </div>

      <div className="tb-roles">
        {assignments.map((a) => (
          <div key={a.guestNumber} className={`tb-role${a.role.free ? ' is-free' : ''}`}>
            <span className="tb-role-guest">Guest {a.guestNumber}</span>
            <span className="tb-role-label">{a.role.label}</span>
            <span className="tb-role-note">{a.role.note}</span>
            <span className="tb-role-cost">{a.role.free ? 'FREE' : a.role.cost}</span>
          </div>
        ))}
      </div>

      <div className="tb-script">
        <div className="tb-script-head">
          <span>Copy this invite</span>
          <button type="button" className="tb-copy" onClick={copy}>
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>
        <pre className="tb-script-text">{script}</pre>
      </div>
    </div>
  );
}

export default function Table({ embedded = false } = {}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('week');

  return (
    <div className="tb-page">
      {!embedded && <Nav />}
      <div className="tb-wrap">
        {!embedded && <button className="tb-back" onClick={() => navigate(-1)}>← BACK</button>}

        <header className="tb-hero">
          <p className="tb-kicker">The Table</p>
          <h1 className="tb-headline">Pull up a chair.</h1>
          <p className="tb-sub">
            A quiet corner of the app with nothing to sell you and nowhere to be.
            Come to switch your brain off, stay because someone finally asked how
            you&apos;re really doing.
          </p>
        </header>

        <div className="tb-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`tb-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="tb-body">
          {tab === 'week' && <ThisWeek />}
          {tab === 'archive' && <Archive />}
          {tab === 'talk' && <Conversation />}
          {tab === 'checkin' && <CheckIn />}
          {tab === 'host' && <Host />}
          {tab === 'gather' && <GatherFree />}
        </div>
      </div>
    </div>
  );
}
