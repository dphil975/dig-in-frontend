import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import {
  todaysSpy, checkSpy, pantryNames, completeSpy,
  todaysTruth, completeTruth,
  todaysKindnessPrompt, completeKindness,
  setHandoff, pendingHandoff,
  todaysRitual, recessStreak, moneyFirst,
} from '../../../lib/recess';
import { weeklySpendSummary } from '../../../lib/nibblers';
import './Recess.css';

/* Recess — the calm daily ritual (childhood-simple).

   Three steps, two minutes, in the order novaNudges.js already promises:
   a round of I Spy, one true thing about food, one kindness to yourself.
   Then it ends by handing one plan to tomorrow, which Home surfaces the next
   morning as "from yesterday-you."

   Nothing here can be failed. No timers, no red marks, no broken-streak state,
   and deliberately nothing about bodies or weight — see src/lib/recess.js for
   the four rules this surface holds itself to and why.

   The one conditional: if someone's life mode says they're broke this month,
   the money panel leads and the ritual moves below it. Gamifying harder at
   somebody who needs cash is the wrong move. */

const money = (n) => `$${n.toFixed(2)}`;

/* ── Step 1 · 👀 I Spy ────────────────────────────────────────────────── */

function SpyStep({ done, onDone }) {
  const round = useMemo(() => todaysSpy(), []);
  const pantry = useMemo(() => pantryNames(), []);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null);

  // Pantry items that would actually satisfy today's round — tappable, so the
  // game works without typing and quietly proves it's answerable from what you
  // already own.
  const shortcuts = useMemo(
    () => pantry.filter((name) => checkSpy(round.id, name)).slice(0, 6),
    [round, pantry],
  );

  function submit(food) {
    const text = String(food || '').trim();
    if (!text) return;
    const entry = checkSpy(round.id, text);
    setResult({ ok: !!entry, entry, food: text });
    if (entry) { completeSpy(text); onDone(); }
  }

  return (
    <section className={`rc-step${done ? ' done' : ''}`}>
      <div className="rc-stepnum">{done ? '✓' : '1'}</div>
      <div className="rc-stepbody">
        <div className="rc-chip">{round.emoji} I Spy</div>
        <h2 className="rc-step-title">{round.spy}</h2>

        {!done && !result && (
          <>
            <p className="rc-hint">{round.hint}</p>

            {shortcuts.length > 0 && (
              <div className="rc-shortcuts">
                <span className="rc-shortcuts-label">in your pantry:</span>
                {shortcuts.map((s) => (
                  <button key={s} type="button" className="rc-shortcut" onClick={() => submit(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form className="rc-row" onSubmit={(e) => { e.preventDefault(); submit(guess); }}>
              <input
                className="rc-input"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="name what you spotted…"
                aria-label="What did you spot?"
              />
              <button type="submit" className="rc-btn">I spy it</button>
            </form>
          </>
        )}

        {result && (
          <div className="rc-result">
            {result.ok ? (
              <>
                <p className="rc-found">Found it — {result.food}. <span>{result.entry.label}</span></p>
                <p className="rc-body">{result.entry.note}</p>
                <p className="rc-teach">{round.teach}</p>
              </>
            ) : (
              /* A miss is never a loss — the round stays open and the teaching
                 happens anyway, which is the actual point of playing. */
              <>
                <p className="rc-body">
                  <strong>{result.food}</strong> doesn't land in this one. No penalty, the
                  round's still open — have another look.
                </p>
                <p className="rc-teach">{round.teach}</p>
                <button type="button" className="rc-btn rc-btn-ghost" onClick={() => { setResult(null); setGuess(''); }}>
                  Look again
                </button>
              </>
            )}
          </div>
        )}

        {done && !result && <p className="rc-body">Played today. New round tomorrow.</p>}
      </div>
    </section>
  );
}

/* ── Step 2 · 🧂 One true thing ───────────────────────────────────────── */

function TruthStep({ done, onDone }) {
  const truth = useMemo(() => todaysTruth(), []);

  return (
    <section className={`rc-step${done ? ' done' : ''}`}>
      <div className="rc-stepnum">{done ? '✓' : '2'}</div>
      <div className="rc-stepbody">
        <div className="rc-chip">{truth.emoji} One true thing</div>
        <h2 className="rc-step-title">{truth.truth}</h2>
        <p className="rc-body">{truth.body}</p>

        {!done && (
          <button type="button" className="rc-btn" onClick={() => { completeTruth(); onDone(); }}>
            Got it
          </button>
        )}
      </div>
    </section>
  );
}

/* ── Step 3 · 🤍 One kindness to yourself ─────────────────────────────── */

function KindnessStep({ done, onDone }) {
  const prompt = useMemo(() => todaysKindnessPrompt(), []);
  const [text, setText] = useState('');

  return (
    <section className={`rc-step${done ? ' done' : ''}`}>
      <div className="rc-stepnum">{done ? '✓' : '3'}</div>
      <div className="rc-stepbody">
        <div className="rc-chip">🤍 One kindness to yourself</div>
        <h2 className="rc-step-title">{prompt}</h2>

        {done ? (
          <p className="rc-body">Logged. That one counts more than it feels like it does.</p>
        ) : (
          <form className="rc-row" onSubmit={(e) => { e.preventDefault(); completeKindness(text); onDone(); }}>
            <input
              className="rc-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="anything. small is fine."
              aria-label="One kindness to yourself"
            />
            <button type="submit" className="rc-btn">Log it</button>
          </form>
        )}
      </div>
    </section>
  );
}

/* ── 🌤️ The handoff ──────────────────────────────────────────────────── */

function HandoffStep() {
  const [pending, setPending] = useState(() => { try { return pendingHandoff(); } catch { return null; } });
  const [text, setText] = useState('');

  return (
    <section className="rc-handoff">
      <div className="rc-chip">🌤️ Leave something for tomorrow-you</div>
      {pending ? (
        <>
          <h2 className="rc-step-title">You already left one: <em>{pending.text}</em></h2>
          <p className="rc-body">
            It'll show up on your home feed tomorrow morning. Nothing to remember.
          </p>
        </>
      ) : (
        <>
          <h2 className="rc-step-title">Decide one thing now, so 6pm-you doesn't have to.</h2>
          <p className="rc-body">
            The evening decision gets made by whoever delivers fastest. This is the whole
            trick behind looking effortless — it just got decided earlier. A dish, a defrost,
            a phone call. One thing.
          </p>
          <form
            className="rc-row"
            onSubmit={(e) => { e.preventDefault(); const r = setHandoff(text); if (r) setPending(r); }}
          >
            <input
              className="rc-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="tomorrow, I'll…"
              aria-label="One thing for tomorrow"
            />
            <button type="submit" className="rc-btn">Leave it</button>
          </form>
        </>
      )}
    </section>
  );
}

/* ── 💵 The money override ────────────────────────────────────────────── */

function MoneyPanel() {
  const spend = useMemo(() => { try { return weeklySpendSummary(); } catch { return null; } }, []);
  if (!spend) return null;

  return (
    <section className="rc-money">
      <div className="rc-chip">💵 First, the actual number</div>
      <h2 className="rc-step-title">You said money's tight this month. So we'll skip the pep talk.</h2>
      <p className="rc-body">
        Some things aren't a motivation problem. Here's the week's trail, plainly.
        Recess is below whenever you want it — it isn't going anywhere.
      </p>
      <div className="rc-moneyrow">
        <div className="rc-moneystat">
          <span className="rc-moneynum">{money(spend.takeout)}</span>
          <span className="rc-moneylabel">takeout, last 7 days</span>
        </div>
        <div className="rc-moneystat">
          <span className="rc-moneynum">{money(spend.cooked)}</span>
          <span className="rc-moneylabel">cooked at home</span>
        </div>
      </div>
      {spend.count === 0 && (
        <p className="rc-fineprint">
          Nothing logged this week — the trail fills in from the spend log on Nibblers.
        </p>
      )}
    </section>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function Recess({ embedded = false }) {
  const navigate = useNavigate();
  const [ritual, setRitual] = useState(() => todaysRitual());
  const refresh = () => setRitual(todaysRitual());

  const streak = useMemo(() => { try { return recessStreak(); } catch { return 0; } }, [ritual]);
  const broke = useMemo(() => moneyFirst(), []);
  const has = (s) => ritual.steps.includes(s);

  const body = (
    <>
      <SpyStep      done={has('spy')}      onDone={refresh} />
      <TruthStep    done={has('truth')}    onDone={refresh} />
      <KindnessStep done={has('kindness')} onDone={refresh} />
      <HandoffStep />
    </>
  );

  return (
    <div className="rc-page">
      {!embedded && <Nav />}
      <div className="rc-wrap">
        {!embedded && (
          <button type="button" className="rc-back" onClick={() => navigate(-1)}>← back</button>
        )}

        <header className="rc-hero">
          <p className="rc-kicker">RECESS</p>
          <h1 className="rc-headline">You were allowed to be bad at things once.</h1>
          <p className="rc-sub">
            Kindergarten gave you clear information, a game, and credit for trying — then
            adulthood took all three and told you to just <em>know</em> things. Two minutes
            gives them back. Nothing here can be failed, and nothing here is about your body.
          </p>

          {/* Streak is shown only when it exists. There is deliberately no
              "streak lost" state — novaNudges calls this a gentle invitation,
              not a streak to defend. */}
          {streak > 0 && (
            <p className="rc-streak">🌤️ {streak} {streak === 1 ? 'day' : 'days'} running</p>
          )}
          {ritual.done && (
            <p className="rc-alldone">
              That's recess. Go be a person — it'll be here tomorrow.
            </p>
          )}
        </header>

        {broke ? (
          <>
            <MoneyPanel />
            <p className="rc-divider">recess is still here, whenever</p>
            {body}
          </>
        ) : body}
      </div>
    </div>
  );
}
