import { useState, useMemo } from 'react';
import {
  getTarget, setTarget, clearTarget, adjustTarget, budgetStatus, mealsLeft,
  actuals, INCREMENT, snap,
} from '../../../lib/budgetTarget';
import { balance, ledger, totalEarned, award } from '../../../lib/spins';
import { moneyMode } from '../../../lib/appSkins';
import CashStack from '../CashStack';
import './BudgetPanel.css';

/* BudgetPanel — your price point, and where you actually are against it.

   Built around one belief from the brief worth restating: money stops feeling
   real. So this panel refuses to blur the three numbers people usually mush
   together —

     SPENT     real money, only ever from a receipt or a logged purchase
     PLANNED   an estimate of the cart in front of you, always labeled one
     TARGET    the number you chose, in $5 steps

   A single confident "you've spent $73" would be friendlier and false. The
   split is the honesty.

   `mealsLeft()` is the antidote to abstraction: "$23 left" means nothing at
   2pm on a Tuesday; "about 3 more dinners" means something. It only appears
   once there's enough of YOUR real receipt history to compute it — no
   history, no claim.

   Spins ride along here rather than in their own screen because this is
   where they're earned: the receipt you'd rather not log is the thing that
   pays. Honey per THE PALETTE — earned things only. */

function Stepper({ value, onChange }) {
  return (
    <div className="bpx-stepper">
      <button
        type="button" className="bpx-step" aria-label={`Down $${INCREMENT}`}
        onClick={() => onChange(snap(value - INCREMENT))}
        disabled={value <= INCREMENT}
      >−</button>
      <div className="bpx-amount">
        <span className="bpx-dollar">$</span>{value}
      </div>
      <button
        type="button" className="bpx-step" aria-label={`Up $${INCREMENT}`}
        onClick={() => onChange(snap(value + INCREMENT))}
      >+</button>
    </div>
  );
}

export default function BudgetPanel({ plannedTotal = 0 }) {
  const [target, setTargetState] = useState(() => getTarget());
  const [draft, setDraft] = useState(60);
  const [showLedger, setShowLedger] = useState(false);
  const [spinTick, setSpinTick] = useState(0);

  const status = useMemo(
    () => budgetStatus(plannedTotal),
    [target, plannedTotal, spinTick],
  );
  const spins = useMemo(() => balance(), [spinTick]);
  // Read once per render — the skin/pref can change from the picker at any time.
  const money = moneyMode();
  const earned = useMemo(() => totalEarned(), [spinTick]);

  function commit(amount) {
    const t = setTarget(amount);
    // Deciding a number in advance is the part most people skip — worth paying for.
    award('first-target', 'first');
    setTargetState(t);
    setSpinTick(n => n + 1);
  }

  function nudge(steps) {
    const t = adjustTarget(steps);
    setTargetState(t ? { ...t } : null);
  }

  /* ── no target yet ─────────────────────────────────────────────────── */
  if (!status) {
    return (
      <section className="bpx bpx-empty">
        <h2 className="bpx-title">SET YOUR PRICE POINT</h2>
        <p className="bpx-sub">
          Pick a number before you shop, not after. Everything below tracks against it —
          estimates while you plan, real money once you put the receipt in.
        </p>
        <Stepper value={draft} onChange={setDraft} />
        <button type="button" className="bpx-primary" onClick={() => commit(draft)}>
          Set ${draft} as my budget
        </button>
        <p className="bpx-note">Moves in ${INCREMENT} steps. Change it any time.</p>
      </section>
    );
  }

  const ml = mealsLeft(status.remaining);
  const receipts = actuals();

  return (
    <section className={`bpx bpx-${status.verdict}`}>
      <div className="bpx-head">
        <h2 className="bpx-title">YOUR PRICE POINT</h2>
        <div className="bpx-target-ctl">
          <button type="button" className="bpx-step bpx-step-sm" onClick={() => nudge(-1)} aria-label="Lower budget">−</button>
          <span className="bpx-target">${status.target}</span>
          <button type="button" className="bpx-step bpx-step-sm" onClick={() => nudge(1)} aria-label="Raise budget">+</button>
        </div>
      </div>

      {/* The headline number: what's actually left. In cash mode it's drawn
          as countable bills instead — the numeral is easy to not feel, and
          the physical form is the whole reason that setting exists. The
          numeral stays alongside it, because "how much exactly" is still a
          question people need answered. */}
      <div className="bpx-hero">
        <div className="bpx-remaining">
          <span className="bpx-remaining-num">
            {status.remaining < 0 ? '−' : ''}${Math.abs(status.remaining).toFixed(2)}
          </span>
          <span className="bpx-remaining-label">
            {status.remaining < 0 ? 'over your budget' : 'left'}
          </span>
        </div>
        {money === 'cash' && (
          <div className="bpx-cash">
            <CashStack
              amount={status.remaining}
              size="md"
              label={status.remaining < 0 ? 'Over budget by' : 'Left to spend'}
            />
          </div>
        )}
        {ml && (
          <p className="bpx-meals">
            ≈ <strong>{ml.meals} more meal{ml.meals === 1 ? '' : 's'}</strong> at your usual
            ${ml.perMeal}/serving <span className="bpx-basis">(from your last {ml.basedOn} receipts)</span>
          </p>
        )}
      </div>

      <div className="bpx-bar" role="progressbar" aria-valuenow={status.pctUsed} aria-valuemin={0} aria-valuemax={100}>
        <span className="bpx-bar-spent" style={{ width: `${Math.min(100, (status.spent / status.target) * 100)}%` }} />
        <span className="bpx-bar-planned" style={{ width: `${Math.min(100 - Math.min(100, (status.spent / status.target) * 100), (status.planned / status.target) * 100)}%` }} />
      </div>

      {/* Real vs estimate, never merged. */}
      <dl className="bpx-split">
        <div className="bpx-cell">
          <dt>Spent</dt>
          <dd>${status.spent.toFixed(2)}</dd>
          <span className="bpx-cell-note">{receipts.length} real receipt{receipts.length === 1 ? '' : 's'}</span>
        </div>
        <div className="bpx-cell">
          <dt>In your cart</dt>
          <dd>${status.planned.toFixed(2)}</dd>
          <span className="bpx-cell-note">estimate</span>
        </div>
        <div className="bpx-cell">
          <dt>Projected</dt>
          <dd>${status.projected.toFixed(2)}</dd>
          <span className="bpx-cell-note">of ${status.target}</span>
        </div>
      </dl>

      {status.planned > 0 && (
        <p className="bpx-estimate-note">
          The cart number is an <strong>estimate</strong> from typical prices — it moves when you
          swap an ingredient. Only a receipt makes it real.
        </p>
      )}

      {/* Spins live here because this is where they're earned. */}
      <div className="bpx-spins">
        <div className="bpx-spins-head">
          <span className="bpx-spins-icon" aria-hidden="true">🎡</span>
          <div>
            <p className="bpx-spins-num">{spins.balance} spin{spins.balance === 1 ? '' : 's'}</p>
            <p className="bpx-spins-sub">{earned} earned all time</p>
          </div>
          <button
            type="button"
            className="bpx-spins-toggle"
            aria-expanded={showLedger}
            onClick={() => setShowLedger(v => !v)}
          >
            {showLedger ? 'hide' : 'how?'}
          </button>
        </div>
        {showLedger && (
          <ul className="bpx-ledger">
            {ledger().slice(0, 6).map(e => (
              <li key={e.key} className={e.spins < 0 ? 'is-spend' : ''}>
                <span className="bpx-ledger-label">{e.label}</span>
                <span className="bpx-ledger-spins">{e.spins > 0 ? `+${e.spins}` : e.spins}</span>
              </li>
            ))}
            {ledger().length === 0 && (
              <li className="bpx-ledger-empty">
                Nothing yet. Finish a shop and log the receipt — that's the one that pays most.
              </li>
            )}
          </ul>
        )}
      </div>

      <button type="button" className="bpx-clear" onClick={() => { clearTarget(); setTargetState(null); }}>
        start a new budget period
      </button>
    </section>
  );
}
