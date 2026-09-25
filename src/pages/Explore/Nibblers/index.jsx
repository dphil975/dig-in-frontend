import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import ShoutoutCard from '../../../components/social/ShoutoutCard';
import {
  MOODS,
  SATIETY_PRINCIPLE,
  platesForMood,
  dupeSavings,
  upgradeCost,
  EFFORT_LABEL,
  READS,
  WALK_PLAYLISTS,
  substackSearchUrl,
  spotifySearchUrl,
  logSpend,
  loadSpendLog,
  removeSpendEntry,
  weeklySpendSummary,
  SPREADS,
  platesForSpread,
  spreadCost,
} from '../../../lib/nibblers';
import './Nibblers.css';

/* Nibblers, Elevated — the page that carries the app's whole argument:
   the low-effort choice can be a rich choice. Every card keeps nibbler
   effort exactly where it is and changes only where the money goes. Data +
   math live in src/lib/nibblers.js; this file is just the front door. */

const money = (n) => `$${n.toFixed(2)}`;

function PlateCard({ plate }) {
  const upgrade = upgradeCost(plate);
  const dupe = dupeSavings(plate);

  return (
    <article className="nib-card">
      <div className="nib-card-top">
        <div className="nib-badges">
          <span className={`nib-effort nib-effort-${plate.effort}`}>
            {EFFORT_LABEL[plate.effort]}
          </span>
          <span className="nib-cleanup">{plate.cleanup}</span>
        </div>
        <h3 className="nib-title">{plate.title}</h3>
        <p className="nib-plate">{plate.plate}</p>
        <ol className="nib-steps">
          {plate.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        {plate.calories != null && (
          <div className="nib-satiety">
            <span className="nib-calories">~{plate.calories} cal</span>
            {plate.satietyWhy && <p className="nib-satiety-why">{plate.satietyWhy}</p>}
          </div>
        )}
      </div>

      <div className="nib-contrast">
        <div className="nib-col nib-cheap">
          <div className="nib-col-head">
            <span className="nib-col-label">Cheap-out</span>
            <span className="nib-price">{money(plate.cheapOut.cost)}</span>
          </div>
          <p className="nib-col-name">{plate.cheapOut.name}</p>
          <p className="nib-verdict">{plate.cheapOut.verdict}</p>
        </div>

        <div className="nib-vs">→</div>

        <div className="nib-col nib-worth">
          <div className="nib-col-head">
            <span className="nib-col-label">Worth it</span>
            <span className="nib-price">{money(plate.worthIt.cost)}</span>
          </div>
          <p className="nib-col-name">{plate.worthIt.name}</p>
          <p className="nib-upgrade">
            <span className="nib-upgrade-tag">Spend here:</span> {plate.worthIt.upgrade}
          </p>
          <p className="nib-why">{plate.worthIt.why}</p>
        </div>
      </div>

      {upgrade != null && (
        <p className="nib-upgrade-line">
          {upgrade <= 0
            ? 'Costs the same or less — better AND cheaper.'
            : `+${money(upgrade)} more turns a forgettable plate into one you remember.`}
        </p>
      )}

      {dupe && (
        <div className="nib-dupe">
          <span className="nib-dupe-title">DIY the brand</span>
          <div className="nib-dupe-math">
            <span className="nib-dupe-store">{money(plate.dupeDupe.storeCost)} <small>brand</small></span>
            <span className="nib-dupe-arrow">→</span>
            <span className="nib-dupe-home">{money(plate.dupeDupe.homeCost)} <small>DIY</small></span>
            <span className="nib-dupe-save">save ~${dupe.perYear}/yr</span>
          </div>
          <p className="nib-dupe-how">{plate.dupeDupe.how}</p>
        </div>
      )}

      <p className="nib-payoff">{plate.payoff}</p>
    </article>
  );
}

function ReadAndReset() {
  const [walk] = useState(() => WALK_PLAYLISTS[Math.floor(Math.random() * WALK_PLAYLISTS.length)]);

  return (
    <section className="nib-reset">
      <h2 className="nib-section-title">Read &amp; Reset</h2>
      <p className="nib-section-sub">
        Meeting yourself halfway looks like this: something worth reading
        instead of another scroll, and a real reason to step outside.
      </p>

      <div className="nib-reads">
        {READS.map((r, i) => (
          <a
            key={i}
            className="nib-read-card"
            href={substackSearchUrl(r.query)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="nib-read-title">{r.title}</span>
            <span className="nib-read-author">{r.author}</span>
            <span className="nib-read-why">{r.why}</span>
            <span className="nib-read-cta">Find it on Substack →</span>
          </a>
        ))}
      </div>

      <a
        className="nib-walk-card"
        href={spotifySearchUrl(walk.query)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="nib-walk-label">🎧 {walk.label}</span>
        <span className="nib-walk-mood">{walk.mood}</span>
        <span className="nib-walk-cta">Open on Spotify →</span>
      </a>
    </section>
  );
}

function SpendTrail() {
  const [amount, setAmount] = useState('');
  const [entries, setEntries] = useState(() => loadSpendLog());
  const summary = useMemo(() => weeklySpendSummary(), [entries]);

  const add = (kind) => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    setEntries(logSpend({ amount: n, kind }));
    setAmount('');
  };

  const remove = (id) => setEntries(removeSpendEntry(id));

  const kept = summary.count > 0 ? Math.max(0, summary.takeout - summary.cooked) : 0;

  return (
    <section className="nib-spend">
      <h2 className="nib-section-title">Spend Trail</h2>
      <p className="nib-section-sub">
        You can&apos;t always control the urge to order out. You can stay
        organized about what it costs — a plain money trail, not a scorecard.
      </p>

      <div className="nib-spend-input">
        <span className="nib-spend-dollar">$</span>
        <input
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          placeholder="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button type="button" className="nib-spend-btn nib-spend-takeout" onClick={() => add('takeout')}>
          Logged takeout
        </button>
        <button type="button" className="nib-spend-btn nib-spend-cooked" onClick={() => add('cooked')}>
          Cooked at home
        </button>
      </div>

      {summary.count > 0 && (
        <div className="nib-spend-summary">
          <span>This week: <b>${summary.takeout.toFixed(2)}</b> takeout · <b>${summary.cooked.toFixed(2)}</b> home-cooked</span>
          {kept > 0 && <span className="nib-spend-kept">Home-cooked kept ${kept.toFixed(2)} in your pocket.</span>}
        </div>
      )}

      {entries.length > 0 && (
        <ul className="nib-spend-log">
          {entries.slice(0, 6).map((e) => (
            <li key={e.id} className={`nib-spend-entry nib-spend-entry-${e.kind}`}>
              <span>{e.kind === 'takeout' ? 'Takeout' : 'Home-cooked'}</span>
              <span>${e.amount.toFixed(2)}</span>
              <button type="button" onClick={() => remove(e.id)} aria-label="Remove entry">×</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SpreadsRow({ activeSpread, onPick }) {
  return (
    <section className="nib-spreads" aria-label="How people actually build a nibbler spread">
      <h2 className="nib-section-title">How people actually do this</h2>
      <p className="nib-section-sub">Nibbling isn't one plate — pick the version that matches your night, or scroll past to build your own from every plate below.</p>
      <div className="nib-spreads-row">
        {SPREADS.map((s) => {
          const cost = spreadCost(s.id);
          const components = platesForSpread(s.id);
          return (
            <button
              key={s.id}
              type="button"
              className={`nib-spread-card${activeSpread === s.id ? ' active' : ''}`}
              onClick={() => onPick(activeSpread === s.id ? null : s.id)}
            >
              <span className="nib-spread-title">{s.title}</span>
              <p className="nib-spread-blurb">{s.blurb}</p>
              <div className="nib-spread-components">
                {components.map((p) => (
                  <span key={p.id} className="nib-spread-chip">{p.title}</span>
                ))}
              </div>
              {cost && <span className="nib-spread-cost">Do it right for about ${cost.worthIt.toFixed(2)}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function Nibblers() {
  const navigate = useNavigate();
  const [mood, setMood] = useState(null);
  const [activeSpread, setActiveSpread] = useState(null);

  const plates = useMemo(
    () => (activeSpread ? platesForSpread(activeSpread) : platesForMood(mood)),
    [activeSpread, mood]
  );

  function pickMood(id) {
    setActiveSpread(null);
    setMood(id);
  }

  function pickSpread(id) {
    setMood(null);
    setActiveSpread(id);
  }

  return (
    <div className="nib-page">
      <Nav />
      <div className="nib-wrap">
        <button className="nib-back" onClick={() => navigate(-1)}>← BACK</button>

        <header className="nib-hero">
          <p className="nib-kicker">Nibblers, Elevated</p>
          <h1 className="nib-headline">Low effort was never the problem.</h1>
          <p className="nib-sub">
            Nibbling works because it asks almost nothing of you — no real
            cooking, barely any dishes, no way to fail. Keep all of that. The
            only thing worth changing is <em>where the money goes</em>. Spend on
            the one product that matters, DIY the reputable brand, and the plate
            that used to bore you starts to feel like a choice.
          </p>
        </header>

        <SpreadsRow activeSpread={activeSpread} onPick={pickSpread} />

        <div className="nib-moods" role="group" aria-label="How are you feeling?">
          <button
            type="button"
            className={`nib-mood${!activeSpread && mood === null ? ' active' : ''}`}
            onClick={() => pickMood(null)}
          >
            <span className="nib-mood-emoji">✦</span>All
          </button>
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`nib-mood${!activeSpread && mood === m.id ? ' active' : ''}`}
              onClick={() => pickMood(m.id)}
            >
              <span className="nib-mood-emoji">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>

        {!activeSpread && mood === 'light' && (
          <p className="nib-satiety-principle">
            {SATIETY_PRINCIPLE.summary} These plates lean on {SATIETY_PRINCIPLE.levers.map((l) => l.label.toLowerCase()).join(', ')} — not just a lower number.
          </p>
        )}

        <div className="nib-grid">
          {plates.map((p) => (
            <PlateCard key={p.id} plate={p} />
          ))}
        </div>

        <ShoutoutCard placement="nibblers" />

        <ReadAndReset />
        <SpendTrail />

        <p className="nib-footer">
          There are a hundred ways to eat tonight. The only real move is deciding
          to make it a little different.
        </p>
      </div>
    </div>
  );
}
