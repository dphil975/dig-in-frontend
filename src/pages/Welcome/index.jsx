import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/shell/Nav';
import { track } from '../../lib/platform/analytics';
import { ALLERGENS } from '../../lib/health/allergyProfile';
import { LIFE_MODES } from '../../lib/personalization/lifeMode';
import { useAuth } from '../../hooks/useAuth';
import { markOnboarded, saveAnswers, applyAnswersToProfile } from '../../lib/personalization/onboarding';
import './Welcome.css';

/* Welcome — the signup "madlib". Each answer fills a blank in one sentence
   ("I want to cook ____ for ____ in ____ …") shown live above the question.
   The first five blanks tell Nova what you're looking for; the last three (what
   you avoid, what season of life this is, where you cook) are optional and are
   written straight into Settings — Dietary preferences, Life context, Location —
   so a new account starts with those already filled in.

   The order is: sign up → this madlib → Nova. When the last blank is filled the
   answers are saved and you land on the Nova home screen, where she introduces
   herself and makes the first pick from what you said. OnboardingGate sends every
   new sign-up here; skipping is always one tap. */

const LIFE_HINTS = {
  moved: 'Building a kitchen from zero',
  broke: 'Every dollar counts',
  one: 'Smaller portions, less waste',
  grief: 'A quiet, gentle feed',
  baby: 'One-handed, 15 minutes or less',
  pregnant: 'Food-safety aware picks',
  better: 'Protein-forward, prep-ahead',
};

const PLACES = [
  { value: 'manhattan', label: 'Manhattan' },
  { value: 'brooklyn', label: 'Brooklyn' },
  { value: 'queens', label: 'Queens' },
  { value: 'bronx', label: 'The Bronx' },
  { value: 'staten-island', label: 'Staten Island' },
];

const STEPS = [
  {
    key: 'dish',
    question: 'What do you want to cook?',
    options: [
      { value: 'something quick', hint: 'Under 20 minutes' },
      { value: 'something comforting', hint: 'Warm and filling' },
      { value: 'something fresh', hint: 'Light and bright' },
      { value: 'something impressive', hint: 'Worth the effort' },
      { value: 'something familiar', hint: 'A classic' },
      { value: 'something new', hint: 'Never made it before' },
    ],
  },
  {
    key: 'people',
    question: 'Who are you cooking for?',
    options: [
      { value: 'just me', hint: 'Solo dinner' },
      { value: 'two of us', hint: 'Date night or partner' },
      { value: 'my family', hint: 'Kids and adults' },
      { value: 'a crowd', hint: 'Party or gathering' },
      { value: 'meal prep', hint: 'Batch cooking for the week' },
      { value: 'someone new', hint: 'First time cooking for them' },
    ],
  },
  {
    key: 'time',
    question: 'How much time do you have?',
    options: [
      { value: '15 minutes', hint: 'Fast and focused' },
      { value: '30 minutes', hint: 'A reasonable window' },
      { value: '1 hour', hint: 'Time to enjoy the process' },
      { value: '2 hours', hint: 'A proper cooking session' },
      { value: 'all day', hint: 'Slow, patient cooking' },
      { value: 'the weekend', hint: 'A project worth doing' },
    ],
  },
  {
    key: 'ingredients',
    question: 'What do you already have?',
    options: [
      { value: 'almost nothing', hint: 'Empty fridge energy' },
      { value: 'the basics', hint: 'Eggs, rice, oil, salt' },
      { value: 'a full fridge', hint: 'Ready to go' },
      { value: 'leftovers', hint: 'Working with what remains' },
      { value: 'pantry only', hint: 'No fresh ingredients' },
      { value: 'a mystery', hint: 'Surprise me' },
    ],
  },
  {
    key: 'reason',
    question: 'Why are you cooking?',
    options: [
      { value: 'it is dinner time', hint: 'The daily rhythm' },
      { value: 'I want to feel something', hint: 'Cooking as therapy' },
      { value: 'I am showing love', hint: 'Feeding someone you care about' },
      { value: 'I am celebrating', hint: 'A moment worth marking' },
      { value: 'I am saving money', hint: 'Budget matters' },
      { value: 'I am learning', hint: 'Building a skill' },
    ],
  },
  // ── Optional blanks — these fill Settings. ──
  {
    key: 'dietary',
    type: 'multi',
    question: "Anything you can't or don't eat?",
    options: ALLERGENS.map((a) => ({ value: a.id, label: a.label })),
    none: 'Nothing to avoid',
  },
  {
    key: 'life',
    question: 'Is life in a particular season right now?',
    noCustom: true,
    options: [
      ...Object.values(LIFE_MODES).map((m) => ({ value: m.id, label: `${m.emoji} ${m.label}`, hint: LIFE_HINTS[m.id] || '' })),
      { value: '', label: 'Nothing in particular', hint: 'Just cooking' },
    ],
  },
  {
    key: 'place',
    question: 'Where are you cooking?',
    customPlaceholder: 'Or type your ZIP code…',
    options: [
      ...PLACES,
      { value: '', label: 'Somewhere else', hint: 'Add your ZIP below' },
    ],
  },
];

// One blank in the madlib sentence: bold once filled, an underscore run until then.
function Blank({ v }) {
  return v
    ? <b className="welcome-blank filled">{v}</b>
    : <span className="welcome-blank">____</span>;
}

function Madlib({ a }) {
  const dietary = Array.isArray(a.dietary)
    ? (a.dietary.length
      ? a.dietary.map((id) => ALLERGENS.find((x) => x.id === id)?.label || id).join(', ')
      : 'nothing')
    : '';
  const life = a.life === undefined ? '' : (a.life ? (LIFE_MODES[a.life]?.label || a.life) : 'nothing in particular');
  const place = a.place === undefined ? '' : (a.place ? (PLACES.find((p) => p.value === a.place)?.label || a.place) : 'somewhere else');

  return (
    <p className="welcome-madlib" aria-live="polite">
      I want to cook <Blank v={a.dish} /> for <Blank v={a.people} /> in <Blank v={a.time} />,
      with <Blank v={a.ingredients} />, because <Blank v={a.reason} />.
      {' '}I avoid <Blank v={dietary} />. Life right now is <Blank v={life} />. I cook in <Blank v={place} />.
    </p>
  );
}

// A multi-pick blank (what you avoid). Its own state so it resets per question.
function MultiStep({ step, onDone }) {
  const [picked, setPicked] = useState([]);
  const toggle = (v) => setPicked((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  return (
    <>
      <div className="welcome-options">
        {step.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={picked.includes(opt.value)}
            className={`welcome-option${picked.includes(opt.value) ? ' selected' : ''}`}
            onClick={() => toggle(opt.value)}
          >
            <span className="welcome-option-label">{opt.label}</span>
          </button>
        ))}
      </div>
      <div className="welcome-multi-actions">
        <button type="button" className="welcome-custom-submit" disabled={!picked.length} onClick={() => onDone(picked)}>
          Continue
        </button>
        <button type="button" className="welcome-multi-none" onClick={() => onDone([])}>
          {step.none}
        </button>
      </div>
    </>
  );
}

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const customRef = useRef(null);

  const h = new Date().getHours();
  const greeting = h < 11 ? 'Good morning.' : h < 17 ? 'Good afternoon.' : 'Good evening.';

  const answer = useCallback((key, value) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    track('welcome_answer', { step: key, value: Array.isArray(value) ? value.join(',') : value });

    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    // Last blank filled: keep the answers, write them into Settings, and hand
    // over to Nova — she makes the first pick on the home screen.
    saveAnswers(next);
    applyAnswersToProfile(next);
    awardCoins(10);
    markOnboarded(user);
    track('welcome_complete');
    navigate('/');
  }, [answers, step, user, navigate]);

  function submitCustom() {
    const val = customRef.current?.value?.trim();
    if (!val) return;
    answer(STEPS[step].key, val);
  }

  function awardCoins(amount) {
    try {
      const coins = parseInt(localStorage.getItem('dig_in_coins') || '0', 10);
      localStorage.setItem('dig_in_coins', String(coins + amount));
    } catch { /* quota */ }
  }

  function skip() {
    // Whatever was answered before skipping still counts.
    if (Object.keys(answers).length) {
      saveAnswers(answers);
      applyAnswersToProfile(answers);
    }
    markOnboarded(user);
    track('welcome_skipped');
    navigate('/');
  }

  const current = STEPS[step];
  const customPlaceholder = current.customPlaceholder
    ?? (current.type === 'multi' || current.noCustom ? null : 'Or type your own…');

  return (
    <div className="app-container">
      <Nav />

      <div className="welcome">
        <header className="welcome-hero">
          <span className="welcome-mark" aria-hidden="true">DIG IN</span>
          <p className="welcome-kicker">{greeting}</p>
          <h1 className="welcome-invite">Let’s find your first meal.</h1>
          <span className="welcome-rule" aria-hidden="true" />
        </header>

        <div className="welcome-progress">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`welcome-dot${i < step ? ' done' : ''}${i === step ? ' active' : ''}`}
            />
          ))}
        </div>
        <Madlib a={answers} />

        <div className="welcome-panel" key={current.key}>
          <p className="welcome-question">{current.question}</p>

          {current.type === 'multi' ? (
            <MultiStep step={current} onDone={(picked) => answer(current.key, picked)} />
          ) : (
            <div className="welcome-options">
              {current.options.map((opt) => (
                <button
                  key={`${opt.value}|${opt.label || ''}`}
                  type="button"
                  className="welcome-option"
                  onClick={() => answer(current.key, opt.value)}
                >
                  <span className="welcome-option-label">{opt.label ?? opt.value}</span>
                  {opt.hint && <span className="welcome-option-hint">{opt.hint}</span>}
                </button>
              ))}
            </div>
          )}

          {customPlaceholder && (
            <div className="welcome-custom">
              <input
                ref={customRef}
                type="text"
                className="welcome-custom-input"
                placeholder={customPlaceholder}
                onKeyDown={(e) => { if (e.key === 'Enter') submitCustom(); }}
              />
              <button type="button" className="welcome-custom-submit" onClick={submitCustom}>
                Enter
              </button>
            </div>
          )}
        </div>

        <div className="welcome-footer">
          <button type="button" className="welcome-skip" onClick={skip}>skip onboarding</button>
        </div>
      </div>
    </div>
  );
}
