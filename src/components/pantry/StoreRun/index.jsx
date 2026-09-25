import { useState, useEffect, useMemo, useRef } from 'react';
import {
  activeRun, startRun, endRun, cancelRun, markFound, markMissing, reopen,
  addObjective, runProgress, elapsedLabel, runStats, markSwapped, swapsIn,
} from '../../../lib/storeRun';
import SwapHelper from '../SwapHelper';
import { award as awardSpins } from '../../../lib/spins';
import { categoryIconUrl } from '../../../lib/pantryPixelIcons';
import { categoryById } from '../../../lib/pantryCategories';
import { getItemPhoto } from '../../../lib/storeMemory';
import './StoreRun.css';

/* StoreRun — the shopping trip as a hunt you can finish alone.

   Every objective shows a PICTURE of what you're looking for: your own saved
   reference photo if you've ever captured one, otherwise the pixel art for
   that shelf. That ordering matters — a real photo of the exact box you buy
   beats generic art every time, and the generic art beats nothing, which is
   what you'd otherwise have when you're standing in an aisle unsure what a
   poblano looks like and not willing to ask.

   The clock is deliberately the biggest thing on screen, in Honey. That's
   on-palette rather than a decoration: THE PALETTE (styles.css) reserves
   Honey for earned things — verification, saves, coins, badges — as a solid
   fill with Bark text, never a page background. A timed run you either finish
   or don't is exactly an earned thing, so it gets the earned color, and the
   cream ground stays cream.

   Nothing here fabricates: the timer measures, "couldn't find it" is a real
   and un-punished outcome, and the badge for finding everything can only be
   earned by actually finding everything. */

const TICK_MS = 1000;

function HuntCard({ objective, onFound, onMissing, onReopen, onHelp }) {
  const cat = categoryById(objective.category);
  // A real photo of the actual product beats category art — this is the same
  // reference-photo store the pantry shelves already read from.
  const photo = getItemPhoto(objective.name);
  const art = photo || categoryIconUrl(objective.category);
  const done = objective.status !== 'open';

  return (
    <li className={`srun-card srun-card-${objective.status}`}>
      <div className="srun-card-art">
        <img src={art} alt="" aria-hidden="true" draggable="false" className={photo ? 'is-photo' : 'is-pixel'} />
        {objective.status === 'found' && <span className="srun-stamp" aria-hidden="true">✓</span>}
        {objective.status === 'missing' && <span className="srun-stamp srun-stamp-missing" aria-hidden="true">—</span>}
      </div>

      <div className="srun-card-body">
        <p className="srun-card-name">{objective.name}</p>
        {objective.swappedTo
          ? <p className="srun-card-swap">→ got {objective.swappedTo} instead</p>
          : <p className="srun-card-where">{cat.label}</p>}
      </div>

      {done ? (
        <button type="button" className="srun-undo" onClick={() => onReopen(objective.name)}>
          undo
        </button>
      ) : (
        <div className="srun-card-actions">
          <button type="button" className="srun-btn srun-btn-found" onClick={() => onFound(objective.name)}>
            Got it
          </button>
          {/* The real exit from a dead end. "Can't find it" alone is where a
              trip quietly fails — this offers an actual answer first. */}
          <button type="button" className="srun-btn srun-btn-help" onClick={() => onHelp(objective.name)}>
            Help me swap it
          </button>
          <button type="button" className="srun-btn srun-btn-missing" onClick={() => onMissing(objective.name)}>
            Skip it
          </button>
        </div>
      )}
    </li>
  );
}

export default function StoreRun({ store = '', storeZip = '', onAddReceipt }) {
  const [run, setRun] = useState(() => activeRun());
  const [, forceTick] = useState(0);
  const [listText, setListText] = useState('');
  const [addText, setAddText] = useState('');
  const [summary, setSummary] = useState(null);   // the just-finished run
  const [helpFor, setHelpFor] = useState(null);   // objective name whose swap helper is open
  const addRef = useRef(null);

  // Live clock — only ticks while a run is actually open.
  useEffect(() => {
    if (!run) return undefined;
    const t = setInterval(() => forceTick(n => n + 1), TICK_MS);
    return () => clearInterval(t);
  }, [run]);

  const progress = useMemo(() => (run ? runProgress(run) : null), [run]);
  const stats = useMemo(() => runStats(), [summary]);

  function begin() {
    const items = listText.split('\n').map(s => s.trim()).filter(Boolean);
    if (!items.length) return;
    setSummary(null);
    setRun(startRun({ store, storeZip, items, source: 'list' }));
    setListText('');
  }

  const act = fn => name => setRun(fn(name) ? { ...activeRun() } : run);

  function finish() {
    const result = endRun();
    if (result) awardSpins('run-complete', `run-${result.run.id}`);
    setSummary(result);
    setRun(null);
  }

  function abandon() {
    cancelRun();
    setRun(null);
    setSummary(null);
  }

  function submitAdd(e) {
    e.preventDefault();
    const v = addText.trim();
    if (!v) return;
    addObjective(v);
    setRun({ ...activeRun() });
    setAddText('');
    addRef.current?.focus();
  }

  /* ── the just-finished summary ─────────────────────────────────────── */
  if (summary) {
    const { minutes, progress: p, badges } = summary;
    return (
      <section className="srun srun-done">
        <p className="srun-done-kicker">RUN COMPLETE</p>
        <p className="srun-done-time">{minutes < 1 ? 'under a minute' : `${minutes} min`}</p>
        <p className="srun-done-line">
          You found <strong>{p.found}</strong> of <strong>{p.total}</strong>
          {p.missing > 0 && <> · {p.missing} not in stock</>}
        </p>

        {badges.length > 0 && (
          <ul className="srun-badges">
            {badges.map(b => (
              <li key={b.id} className="srun-badge">
                <span className="srun-badge-icon" aria-hidden="true">{b.icon}</span>
                <span className="srun-badge-label">{b.label}</span>
              </li>
            ))}
          </ul>
        )}

        {/* What you had to change. Worth showing plainly: these are the
            adaptations that made the trip succeed instead of fail. */}
        {swapsIn(summary.run).length > 0 && (
          <div className="srun-swaps">
            <p className="srun-swaps-head">What you adapted</p>
            <ul>
              {swapsIn(summary.run).map(s => (
                <li key={s.from}><s>{s.from}</s> → <strong>{s.to}</strong></li>
              ))}
            </ul>
          </div>
        )}

        {stats.avgMinutes != null && (
          <p className="srun-done-stat">
            Your average run is {stats.avgMinutes} min across {stats.runs} trips.
          </p>
        )}

        {/* The prompt that closes the money loop. This is the moment the
            receipt is in your hand and the trip is fresh — the only moment
            logging it is easy. Says what it's worth up front rather than
            springing a reward, because a nudge you can evaluate is a nudge,
            and one you can't is a hook. */}
        <div className="srun-receipt-ask">
          <p className="srun-receipt-ask-head">Got the receipt on you?</p>
          <p className="srun-receipt-ask-sub">
            Putting it in now is what keeps the money real instead of a number you half-remember —
            and it's worth <strong>+3 spins</strong>.
          </p>
          <button
            type="button"
            className="srun-primary"
            onClick={() => {
              setSummary(null);
              onAddReceipt?.();
            }}
          >
            Add the receipt
          </button>
        </div>

        <button type="button" className="srun-abandon" onClick={() => setSummary(null)}>
          not right now
        </button>
      </section>
    );
  }

  /* ── no run yet: start one ─────────────────────────────────────────── */
  if (!run) {
    return (
      <section className="srun srun-start">
        <div className="srun-start-head">
          <h2 className="srun-title">START A RUN</h2>
          {stats.runs > 0 && (
            <span className="srun-start-meta">
              {stats.runs} trip{stats.runs === 1 ? '' : 's'}
              {stats.avgMinutes != null && <> · avg {stats.avgMinutes} min</>}
            </span>
          )}
        </div>
        <p className="srun-sub">
          Drop your list in — one thing per line. Each becomes something to find, with a picture,
          so you never have to ask anyone what it looks like.
        </p>
        <textarea
          className="srun-listbox"
          rows={5}
          placeholder={'poblano peppers\nblack beans\nqueso fresco'}
          value={listText}
          onChange={e => setListText(e.target.value)}
        />
        <button type="button" className="srun-primary" onClick={begin} disabled={!listText.trim()}>
          Start the clock
        </button>
      </section>
    );
  }

  /* ── a run in progress ─────────────────────────────────────────────── */
  const open = run.objectives.filter(o => o.status === 'open');
  const settled = run.objectives.filter(o => o.status !== 'open');

  return (
    <section className="srun srun-active">
      <header className="srun-hud">
        <div className="srun-clock" aria-live="off">{elapsedLabel(run)}</div>
        <div className="srun-hud-right">
          <p className="srun-hud-count">
            <strong>{progress.found}</strong> / {progress.total} found
          </p>
          {run.store && <p className="srun-hud-store">🏪 {run.store}</p>}
        </div>
      </header>

      <div className="srun-bar" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${progress.pct}%` }} />
      </div>

      {open.length > 0 ? (
        <ul className="srun-list">
          {open.map(o => (
            <HuntCard
              key={o.name}
              objective={o}
              onFound={act(markFound)}
              onMissing={act(markMissing)}
              onReopen={act(reopen)}
              onHelp={setHelpFor}
            />
          ))}
        </ul>
      ) : (
        <p className="srun-allclear">That's everything. Go pay.</p>
      )}

      <form className="srun-add" onSubmit={submitAdd}>
        <input
          ref={addRef}
          className="srun-add-input"
          placeholder="Remembered something? Add it"
          value={addText}
          onChange={e => setAddText(e.target.value)}
        />
        <button type="submit" className="srun-add-btn" disabled={!addText.trim()}>Add</button>
      </form>

      {settled.length > 0 && (
        <details className="srun-settled">
          <summary>{settled.length} handled</summary>
          <ul className="srun-list srun-list-settled">
            {settled.map(o => (
              <HuntCard
                key={o.name}
                objective={o}
                onFound={act(markFound)}
                onMissing={act(markMissing)}
                onReopen={act(reopen)}
              />
            ))}
          </ul>
        </details>
      )}

      <div className="srun-foot">
        <button type="button" className="srun-primary" onClick={finish}>
          Finish run
        </button>
        <button type="button" className="srun-abandon" onClick={abandon}>
          cancel, don't record it
        </button>
      </div>

      {helpFor && (
        <SwapHelper
          itemName={helpFor}
          onClose={() => setHelpFor(null)}
          onSwap={label => {
            markSwapped(helpFor, label);
            setRun({ ...activeRun() });
            setHelpFor(null);
          }}
        />
      )}
    </section>
  );
}
