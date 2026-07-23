import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
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
} from '../../lib/girlDinner';
import './GirlDinner.css';

/* Girl Dinner, Elevated — the page that carries the app's whole argument:
   the low-effort choice can be a rich choice. Every card keeps girl-dinner
   effort exactly where it is and changes only where the money goes. Data +
   math live in src/lib/girlDinner.js; this file is just the front door. */

const money = (n) => `$${n.toFixed(2)}`;

function PlateCard({ plate }) {
  const upgrade = upgradeCost(plate);
  const dupe = dupeSavings(plate);

  return (
    <article className="gd-card">
      <div className="gd-card-top">
        <div className="gd-badges">
          <span className={`gd-effort gd-effort-${plate.effort}`}>
            {EFFORT_LABEL[plate.effort]}
          </span>
          <span className="gd-cleanup">{plate.cleanup}</span>
        </div>
        <h3 className="gd-title">{plate.title}</h3>
        <p className="gd-plate">{plate.plate}</p>
        <ol className="gd-steps">
          {plate.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        {plate.calories != null && (
          <div className="gd-satiety">
            <span className="gd-calories">~{plate.calories} cal</span>
            {plate.satietyWhy && <p className="gd-satiety-why">{plate.satietyWhy}</p>}
          </div>
        )}
      </div>

      <div className="gd-contrast">
        <div className="gd-col gd-cheap">
          <div className="gd-col-head">
            <span className="gd-col-label">Cheap-out</span>
            <span className="gd-price">{money(plate.cheapOut.cost)}</span>
          </div>
          <p className="gd-col-name">{plate.cheapOut.name}</p>
          <p className="gd-verdict">{plate.cheapOut.verdict}</p>
        </div>

        <div className="gd-vs">→</div>

        <div className="gd-col gd-worth">
          <div className="gd-col-head">
            <span className="gd-col-label">Worth it</span>
            <span className="gd-price">{money(plate.worthIt.cost)}</span>
          </div>
          <p className="gd-col-name">{plate.worthIt.name}</p>
          <p className="gd-upgrade">
            <span className="gd-upgrade-tag">Spend here:</span> {plate.worthIt.upgrade}
          </p>
          <p className="gd-why">{plate.worthIt.why}</p>
        </div>
      </div>

      {upgrade != null && (
        <p className="gd-upgrade-line">
          {upgrade <= 0
            ? 'Costs the same or less — better AND cheaper.'
            : `+${money(upgrade)} more turns a forgettable plate into one you remember.`}
        </p>
      )}

      {dupe && (
        <div className="gd-dupe">
          <span className="gd-dupe-title">DIY the brand</span>
          <div className="gd-dupe-math">
            <span className="gd-dupe-store">{money(plate.dupeDupe.storeCost)} <small>brand</small></span>
            <span className="gd-dupe-arrow">→</span>
            <span className="gd-dupe-home">{money(plate.dupeDupe.homeCost)} <small>DIY</small></span>
            <span className="gd-dupe-save">save ~${dupe.perYear}/yr</span>
          </div>
          <p className="gd-dupe-how">{plate.dupeDupe.how}</p>
        </div>
      )}

      <p className="gd-payoff">{plate.payoff}</p>
    </article>
  );
}

function ReadAndReset() {
  const [walk] = useState(() => WALK_PLAYLISTS[Math.floor(Math.random() * WALK_PLAYLISTS.length)]);

  return (
    <section className="gd-reset">
      <h2 className="gd-section-title">Read &amp; Reset</h2>
      <p className="gd-section-sub">
        Meeting yourself halfway looks like this: something worth reading
        instead of another scroll, and a real reason to step outside.
      </p>

      <div className="gd-reads">
        {READS.map((r, i) => (
          <a
            key={i}
            className="gd-read-card"
            href={substackSearchUrl(r.query)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="gd-read-title">{r.title}</span>
            <span className="gd-read-author">{r.author}</span>
            <span className="gd-read-why">{r.why}</span>
            <span className="gd-read-cta">Find it on Substack →</span>
          </a>
        ))}
      </div>

      <a
        className="gd-walk-card"
        href={spotifySearchUrl(walk.query)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="gd-walk-label">🎧 {walk.label}</span>
        <span className="gd-walk-mood">{walk.mood}</span>
        <span className="gd-walk-cta">Open on Spotify →</span>
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
    <section className="gd-spend">
      <h2 className="gd-section-title">Spend Trail</h2>
      <p className="gd-section-sub">
        You can&apos;t always control the urge to order out. You can stay
        organized about what it costs — a plain money trail, not a scorecard.
      </p>

      <div className="gd-spend-input">
        <span className="gd-spend-dollar">$</span>
        <input
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          placeholder="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button type="button" className="gd-spend-btn gd-spend-takeout" onClick={() => add('takeout')}>
          Logged takeout
        </button>
        <button type="button" className="gd-spend-btn gd-spend-cooked" onClick={() => add('cooked')}>
          Cooked at home
        </button>
      </div>

      {summary.count > 0 && (
        <div className="gd-spend-summary">
          <span>This week: <b>${summary.takeout.toFixed(2)}</b> takeout · <b>${summary.cooked.toFixed(2)}</b> home-cooked</span>
          {kept > 0 && <span className="gd-spend-kept">Home-cooked kept ${kept.toFixed(2)} in your pocket.</span>}
        </div>
      )}

      {entries.length > 0 && (
        <ul className="gd-spend-log">
          {entries.slice(0, 6).map((e) => (
            <li key={e.id} className={`gd-spend-entry gd-spend-entry-${e.kind}`}>
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

export default function GirlDinner() {
  const navigate = useNavigate();
  const [mood, setMood] = useState(null);

  const plates = useMemo(() => platesForMood(mood), [mood]);

  return (
    <div className="gd-page">
      <Nav />
      <div className="gd-wrap">
        <button className="gd-back" onClick={() => navigate(-1)}>← BACK</button>

        <header className="gd-hero">
          <p className="gd-kicker">Girl Dinner, Elevated</p>
          <h1 className="gd-headline">Low effort was never the problem.</h1>
          <p className="gd-sub">
            Girl dinner works because it asks almost nothing of you — no real
            cooking, barely any dishes, no way to fail. Keep all of that. The
            only thing worth changing is <em>where the money goes</em>. Spend on
            the one product that matters, DIY the reputable brand, and the plate
            that used to bore you starts to feel like a choice.
          </p>
        </header>

        <div className="gd-moods" role="group" aria-label="How are you feeling?">
          <button
            type="button"
            className={`gd-mood${mood === null ? ' active' : ''}`}
            onClick={() => setMood(null)}
          >
            <span className="gd-mood-emoji">✦</span>All
          </button>
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`gd-mood${mood === m.id ? ' active' : ''}`}
              onClick={() => setMood(m.id)}
            >
              <span className="gd-mood-emoji">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>

        {mood === 'light' && (
          <p className="gd-satiety-principle">
            {SATIETY_PRINCIPLE.summary} These plates lean on {SATIETY_PRINCIPLE.levers.map((l) => l.label.toLowerCase()).join(', ')} — not just a lower number.
          </p>
        )}

        <div className="gd-grid">
          {plates.map((p) => (
            <PlateCard key={p.id} plate={p} />
          ))}
        </div>

        <ReadAndReset />
        <SpendTrail />

        <p className="gd-footer">
          There are a hundred ways to eat tonight. The only real move is deciding
          to make it a little different.
        </p>
      </div>
    </div>
  );
}
