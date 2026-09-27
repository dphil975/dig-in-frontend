import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/shell/Nav';
import { track } from '../../lib/analytics';
import { loadRecipeBooks } from '../../lib/recipeBooks';
import { recipeFlavors } from '../../lib/flavorProfile';
import { recordFlavorSignal } from '../../lib/flavor/flavorProfile';
import {
  GeometryEngine, MorphogeneticField, LeyLineEngine,
  generateStarterSet,
} from '../../lib/recipe/starterEngine';
import { ALLERGENS } from '../../lib/allergyProfile';
import { LIFE_MODES } from '../../lib/personalization/lifeMode';
import { useAuth } from '../../hooks/useAuth';
import { markOnboarded, saveAnswers, applyAnswersToProfile } from '../../lib/personalization/onboarding';
import './Welcome.css';

/* Welcome — the signup "madlib". Each answer fills a blank in one sentence
   ("I want to cook ____ for ____ in ____ …") shown live above the question.
   The first five blanks shape the starter set; the last three (what you avoid,
   what season of life this is, where you cook) are optional and are written
   straight into Settings — Dietary preferences, Life context, Location — so a
   new account starts with those already filled in. OnboardingGate sends every
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

const ROLE_LABELS = {
  anchor: 'Your Dish',
  bridge: 'Next Step',
  stretch: 'Stretch',
  wildcard: 'Wildcard',
  memory: 'Familiar',
};

const ROLE_FLAVOR = {
  anchor: 'The one that fits you best right now.',
  bridge: 'Close to your comfort zone, one step further.',
  stretch: 'Something you might not pick on your own.',
  wildcard: 'A different cuisine, a different world.',
  memory: 'Something that might already feel like home.',
};

function GeometryArt({ recipe }) {
  const geo = GeometryEngine.signature(recipe);
  const size = 100;
  const cx = size / 2;
  const cy = size / 2;
  const r = 32;

  if (geo.sides < 3) {
    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="welcome-geo-svg">
        <circle cx={cx} cy={cy} r={8} fill={`hsl(${geo.hue}, 60%, 55%)`} />
      </svg>
    );
  }

  const points = [];
  for (let i = 0; i < geo.sides; i++) {
    const angle = (i * 360 / geo.sides - 90) * Math.PI / 180;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="welcome-geo-svg">
      <polygon
        points={points.join(' ')}
        fill="none"
        stroke={`hsl(${geo.hue}, 60%, 55%)`}
        strokeWidth="2"
      />
      <circle cx={cx} cy={cy} r={4} fill={`hsl(${(geo.hue + 120) % 360}, 70%, 60%)`} />
    </svg>
  );
}

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
  const [allRecipes, setAllRecipes] = useState([]);
  const [starterSet, setStarterSet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const customRef = useRef(null);
  const toastTimer = useRef(null);

  const now = new Date();
  const h = now.getHours();
  const greeting = h < 11 ? 'Good morning.' : h < 17 ? 'Good afternoon.' : 'Good evening.';

  useEffect(() => {
    loadRecipeBooks().then(setAllRecipes).catch(() => {});
  }, []);

  const answer = useCallback((key, value) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    track('welcome_answer', { step: key, value: Array.isArray(value) ? value.join(',') : value });

    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    // Last blank filled: keep the answers, write them into Settings, then build
    // the starter set from the first five.
    saveAnswers(next);
    applyAnswersToProfile(next);
    setLoading(true);
    const biofield = MorphogeneticField.fromAnswers(next);
    if (allRecipes.length >= 5) {
      setStarterSet(generateStarterSet(biofield, allRecipes));
      awardCoins(10);
      track('welcome_starter_set_generated');
      setLoading(false);
    } else {
      // No recipes to pick from (still loading, or offline) — don't strand the
      // person on the last question; they're set up, so let them in.
      markOnboarded(user);
      navigate('/');
    }
  }, [answers, step, allRecipes, user, navigate]);

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

    const fly = document.createElement('div');
    fly.className = 'welcome-coin';
    fly.textContent = '+' + amount;
    fly.style.left = '50%';
    fly.style.bottom = '80px';
    document.body.appendChild(fly);
    setTimeout(() => fly.remove(), 700);
  }

  function showToast(name) {
    clearTimeout(toastTimer.current);
    setToast(name);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  function chooseCard(entry) {
    const recipe = entry.recipe;
    const flavors = recipeFlavors(recipe);
    try { recordFlavorSignal(recipe, 'superlike', flavors); } catch { /* ignore */ }

    try {
      const coll = JSON.parse(localStorage.getItem('dig_in_collection') || '[]');
      coll.push({ id: recipe.id, name: recipe.name, role: entry.role, chosenAt: Date.now() });
      localStorage.setItem('dig_in_collection', JSON.stringify(coll));
    } catch { /* quota */ }

    awardCoins(25);
    showToast(recipe.name);
    track('welcome_card_chosen', { recipe: recipe.name, role: entry.role });

    markOnboarded(user);
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.removeItem('dig_in_full_recipe_adapt');
    } catch { /* quota */ }

    setTimeout(() => navigate('/recipe'), 500);
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
  const biofield = starterSet ? MorphogeneticField.fromAnswers(answers) : null;
  const customPlaceholder = current.customPlaceholder
    ?? (current.type === 'multi' || current.noCustom ? null : 'Or type your own…');

  return (
    <div className="app-container">
      <Nav />

      <div className="welcome">
        <header className="welcome-hero">
          <span className="welcome-mark" aria-hidden="true">DIG IN</span>
          <p className="welcome-kicker">{greeting}</p>
          <h1 className="welcome-invite">
            {starterSet ? 'Your starter set.' : 'Let’s find your first meal.'}
          </h1>
          <span className="welcome-rule" aria-hidden="true" />
        </header>

        {!starterSet && (
          <>
            <div className="welcome-progress">
              {STEPS.map((s, i) => (
                <div
                  key={s.key}
                  className={`welcome-dot${i < step ? ' done' : ''}${i === step ? ' active' : ''}`}
                />
              ))}
            </div>
            <Madlib a={answers} />
          </>
        )}

        {loading ? (
          <div className="welcome-loading">Shuffling recipes…</div>
        ) : !starterSet ? (
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
        ) : (
          <>
            <div className="welcome-cards-intro">
              <h2>Five dishes, picked for you.</h2>
              <p>Each one matches what you told us. Tap one to start cooking.</p>
            </div>
            <div className="welcome-cards">
              {starterSet.map((entry) => {
                const recipe = entry.recipe;
                const geo = GeometryEngine.signature(recipe);
                const resonance = biofield ? MorphogeneticField.resonance(biofield, recipe) : 0.5;
                const matchPct = Math.round(resonance * 100);
                const flavors = recipeFlavors(recipe);
                const connections = LeyLineEngine.connections(recipe, allRecipes);
                const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0) || recipe.time || 0;

                return (
                  <button
                    key={recipe.id || recipe.name}
                    type="button"
                    className="welcome-card"
                    data-role={entry.role}
                    onClick={() => chooseCard(entry)}
                  >
                    <span className="welcome-card-role">{ROLE_LABELS[entry.role]}</span>
                    <div className="welcome-card-art">
                      <GeometryArt recipe={recipe} />
                    </div>
                    <div className="welcome-card-name">{recipe.name}</div>
                    <div className="welcome-card-meta">
                      <span className="welcome-card-shape">{geo.shape}</span>
                      {recipe.country && <span>{recipe.country}</span>}
                      {totalTime > 0 && <span>{totalTime} min</span>}
                    </div>
                    <div className="welcome-card-flavor-text">{ROLE_FLAVOR[entry.role]}</div>

                    {flavors.length > 0 && (
                      <div className="welcome-card-flavors">
                        {flavors.map(f => <span key={f} className="welcome-flavor-tag">{f}</span>)}
                      </div>
                    )}

                    <div className="welcome-card-stats">
                      <div className="welcome-stat">
                        <span className="welcome-stat-label">Match</span>
                        <div className="welcome-stat-bar">
                          <div
                            className="welcome-stat-fill"
                            style={{ width: matchPct + '%', background: `hsl(${geo.hue}, 60%, 55%)` }}
                          />
                        </div>
                        <span className="welcome-stat-value">{matchPct}%</span>
                      </div>
                      {connections.length > 0 && (
                        <div className="welcome-stat">
                          <span className="welcome-stat-label">Links</span>
                          <div className="welcome-stat-bar">
                            <div
                              className="welcome-stat-fill"
                              style={{ width: Math.min(connections.length * 12, 100) + '%', background: 'var(--dig-frog)' }}
                            />
                          </div>
                          <span className="welcome-stat-value">{connections.length}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="welcome-footer">
          <button type="button" className="welcome-skip" onClick={skip}>
            {starterSet ? 'skip for now' : 'skip onboarding'}
          </button>
        </div>
      </div>

      <div className={`welcome-toast${toast ? ' show' : ''}`}>
        <span className="welcome-toast-icon">{'✦'}</span>
        <span className="welcome-toast-text">
          Saved — <strong>{toast}</strong>
        </span>
      </div>
    </div>
  );
}
