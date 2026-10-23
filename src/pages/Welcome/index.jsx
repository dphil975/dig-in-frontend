import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/shell/Nav';
import { track } from '../../lib/platform/analytics';
import { ALLERGENS } from '../../lib/health/allergyProfile';
import { LIFE_MODES } from '../../lib/personalization/lifeMode';
import { useAuth } from '../../hooks/useAuth';
import { markOnboarded, saveAnswers, applyAnswersToProfile } from '../../lib/personalization/onboarding';
import { capturePhoto } from '../../lib/native';
import { parseReceiptFull, guessLocation, guessSnap, guessWic } from '../../lib/pantry/pantryTools';
import { FLAVORS, recordFlavorSignal } from '../../lib/flavor/flavorProfile';
import { loadRecipeBooks } from '../../lib/recipe/recipeBooks';
import './Welcome.css';

/* Welcome — the signup "madlib". Each answer fills a blank in one sentence
   shown live above the question. The first five blanks tell Nova what you're
   looking for; the optional blanks fill Settings. A receipt step gives the
   virtual pantry its first items. When the user is cooking for others (family,
   crowd, someone new) the dietary question pivots to ask about them, and a
   breakdown panel shows what changed before handing off to Nova. */

const CUISINE_OPTIONS = [
  { value: 'italian',       label: 'Italian',        hint: 'Pasta, risotto, pizza' },
  { value: 'mexican',       label: 'Mexican',        hint: 'Tacos, enchiladas, mole' },
  { value: 'chinese',       label: 'Chinese',        hint: 'Stir-fry, dumplings, noodles' },
  { value: 'japanese',      label: 'Japanese',       hint: 'Sushi, ramen, bento' },
  { value: 'indian',        label: 'Indian',         hint: 'Curry, dal, biryani' },
  { value: 'mediterranean', label: 'Mediterranean',  hint: 'Hummus, grilled fish, falafel' },
  { value: 'american',      label: 'American',       hint: 'BBQ, burgers, mac & cheese' },
  { value: 'thai',          label: 'Thai',           hint: 'Pad thai, curries, spring rolls' },
  { value: 'korean',        label: 'Korean',         hint: 'Bibimbap, bulgogi, kimchi stew' },
  { value: 'middle-eastern', label: 'Middle Eastern', hint: 'Shawarma, hummus, kebabs' },
];

const FLAVOR_HINTS = {
  spicy:  'Chili heat, sriracha, jalapeño',
  sweet:  'Honey, caramel, fruit-forward',
  savory: 'Umami-rich, soy, parmesan',
  rich:   'Butter, cream, hearty',
  light:  'Fresh, citrus, herb-bright',
  earthy: 'Lentils, beets, root vegetables',
  smoky:  'Grilled, barbecue, chipotle',
  tangy:  'Vinegar, yogurt, pickle',
};

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

// Which `people` answers mean "cooking for someone other than just myself."
// Kept in sync with onboarding.js quadrantFor() which uses the same pattern.
const FOR_OTHERS_RE = /two|family|crowd|someone new/i;

function cookingForOthers(people) {
  return FOR_OTHERS_RE.test(people || '');
}

const STEPS = [
  {
    key: 'dish',
    question: 'What do you want to cook?',
    options: [
      { value: 'something quick',      hint: 'Under 20 minutes' },
      { value: 'something comforting', hint: 'Warm and filling' },
      { value: 'something fresh',      hint: 'Light and bright' },
      { value: 'something impressive', hint: 'Worth the effort' },
      { value: 'something familiar',   hint: 'A classic' },
      { value: 'something new',        hint: 'Never made it before' },
    ],
  },
  {
    key: 'people',
    question: 'Who are you cooking for?',
    options: [
      { value: 'just me',       hint: 'Solo dinner' },
      { value: 'two of us',     hint: 'Date night or partner' },
      { value: 'my family',     hint: 'Kids and adults' },
      { value: 'a crowd',       hint: 'Party or gathering' },
      { value: 'meal prep',     hint: 'Batch cooking for the week' },
      { value: 'someone new',   hint: 'First time cooking for them' },
    ],
  },
  {
    key: 'time',
    question: 'How much time do you have?',
    options: [
      { value: '15 minutes', hint: 'Fast and focused' },
      { value: '30 minutes', hint: 'A reasonable window' },
      { value: '1 hour',     hint: 'Time to enjoy the process' },
      { value: '2 hours',    hint: 'A proper cooking session' },
      { value: 'all day',    hint: 'Slow, patient cooking' },
      { value: 'the weekend', hint: 'A project worth doing' },
    ],
  },
  {
    key: 'ingredients',
    question: "What's in your kitchen? We'll set up your virtual pantry.",
    options: [
      { value: 'almost nothing', hint: 'Empty fridge — let\'s start fresh' },
      { value: 'the basics',     hint: 'Eggs, rice, oil, salt' },
      { value: 'a full fridge',  hint: 'Ready to go' },
      { value: 'leftovers',      hint: 'Working with what remains' },
      { value: 'pantry only',    hint: 'No fresh ingredients' },
      { value: 'a mystery',      hint: 'Surprise me' },
    ],
  },
  // ── Virtual pantry seed — scan or paste a past receipt ──
  {
    key: 'receipt',
    type: 'receipt',
    question: 'Scan a past receipt to fill your pantry and track your stores.',
  },
  // ── Cuisine preferences — seeded into Nova's pick algorithm ──
  {
    key: 'cuisine',
    type: 'multi',
    question: 'What kinds of food do you love? Pick any.',
    options: CUISINE_OPTIONS,
    none: 'No preference — show me everything',
  },
  // ── Flavor palette — seeds the 8-flavor profile so day-1 picks feel personal ──
  {
    key: 'flavor',
    type: 'multi',
    question: 'What flavors do you reach for?',
    options: FLAVORS.map((f) => ({
      value: f,
      label: f.charAt(0).toUpperCase() + f.slice(1),
      hint: FLAVOR_HINTS[f] || '',
    })),
    none: 'No strong preference',
  },
  {
    key: 'reason',
    question: 'Why are you cooking?',
    options: [
      { value: 'it is dinner time',    hint: 'The daily rhythm' },
      { value: 'I want to feel something', hint: 'Cooking as therapy' },
      { value: 'I am showing love',    hint: 'Feeding someone you care about' },
      { value: 'I am celebrating',     hint: 'A moment worth marking' },
      { value: 'I am saving money',    hint: 'Budget matters' },
      { value: 'I am learning',        hint: 'Building a skill' },
    ],
  },
  // ── Optional blanks — these fill Settings. ──
  {
    key: 'dietary',
    type: 'multi',
    // question adapts: cooking for others → "What do they avoid?"
    question:        "Anything you can't or don't eat?",
    questionOthers:  "Anything they can't eat? (We'll keep those off every suggestion.)",
    options: ALLERGENS.map((a) => ({ value: a.id, label: a.label })),
    none:        'Nothing to avoid',
    noneOthers:  'Nothing they avoid',
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

// ── Madlib sentence ────────────────────────────────────────────────────────

function Blank({ v }) {
  return v
    ? <b className="welcome-blank filled">{v}</b>
    : <span className="welcome-blank">____</span>;
}

function Madlib({ a }) {
  const forOthers = cookingForOthers(a.people);
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
      {' '}{forOthers ? 'They avoid' : 'I avoid'} <Blank v={dietary} />.
      {' '}Life right now is <Blank v={life} />. I cook in <Blank v={place} />.
    </p>
  );
}

// ── Multi-pick blank (dietary) ─────────────────────────────────────────────
function MultiStep({ step, forOthers, onDone }) {
  const [picked, setPicked] = useState([]);
  const toggle = (v) => setPicked((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));
  const noneLabel = forOthers ? step.noneOthers : step.none;

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
          {noneLabel}
        </button>
      </div>
    </>
  );
}

// ── Receipt step ───────────────────────────────────────────────────────────
// Accepts pasted receipt text (which parseReceiptFull understands) plus an
// optional photo attachment. Items and store are written to the virtual pantry
// in applyAnswersToProfile — nothing goes to a server. Skipping is always one tap.
function ReceiptStep({ onDone }) {
  const [receiptText, setReceiptText] = useState('');
  const [photo, setPhoto]             = useState(null);
  const [capturing, setCapturing]     = useState(false);
  const [expanded, setExpanded]       = useState(false);

  const parsed = receiptText.trim() ? parseReceiptFull(receiptText) : null;
  const hasItems = parsed && parsed.items.length > 0;

  async function handleCapture() {
    setCapturing(true);
    try {
      const dataUrl = await capturePhoto({ source: 'prompt' });
      if (dataUrl) { setPhoto(dataUrl); setExpanded(true); }
    } catch {}
    setCapturing(false);
  }

  function handleSave() {
    if (!hasItems && !photo) { onDone(null); return; }
    onDone({
      receiptStore: parsed?.store || '',
      receiptItems: parsed?.items || [],
      receiptDate:  parsed?.date || null,
      receiptTotal: parsed?.total || null,
      receiptPhoto: photo,
    });
  }

  return (
    <div className="welcome-receipt">
      {!expanded ? (
        <div className="welcome-receipt-actions">
          <button
            type="button"
            className="welcome-option welcome-receipt-snap"
            onClick={handleCapture}
            disabled={capturing}
          >
            <span className="welcome-option-label">{capturing ? 'Opening camera…' : '📷 Take a photo of a receipt'}</span>
            <span className="welcome-option-hint">Saved as a record — stores & totals tracked</span>
          </button>
          <button
            type="button"
            className="welcome-option"
            onClick={() => setExpanded(true)}
          >
            <span className="welcome-option-label">📋 Paste receipt text</span>
            <span className="welcome-option-hint">Copy from email, app, or type it in</span>
          </button>
          <button type="button" className="welcome-multi-none" onClick={() => onDone(null)}>
            Skip — I'll add to my pantry later
          </button>
        </div>
      ) : (
        <div className="welcome-receipt-form">
          {photo && (
            <div className="welcome-receipt-photo-preview">
              <img src={photo} alt="Receipt" className="welcome-receipt-img" />
              <span className="welcome-receipt-photo-badge">Photo saved ✓</span>
            </div>
          )}
          <div className="welcome-custom">
            <textarea
              className="welcome-receipt-textarea"
              placeholder={"Paste or type your receipt here…\n\nFor example:\nTrader Joe's  2026-09-14\nOrganic Bananas   0.79\nWhole Milk     3.49\nCheddar Cheese 4.99\nTotal: 9.27"}
              value={receiptText}
              onChange={e => setReceiptText(e.target.value)}
              rows={8}
            />
          </div>
          {hasItems && (
            <div className="welcome-receipt-preview">
              <span className="welcome-receipt-store">
                {parsed.store || 'Unknown store'}{parsed.date ? ` · ${parsed.date}` : ''}
              </span>
              <span className="welcome-receipt-count">{parsed.items.length} items found</span>
            </div>
          )}
          <div className="welcome-multi-actions">
            <button
              type="button"
              className="welcome-custom-submit"
              onClick={handleSave}
            >
              {hasItems ? `Add ${parsed.items.length} items to my pantry` : (photo ? 'Save receipt photo' : 'Continue')}
            </button>
            <button type="button" className="welcome-multi-none" onClick={() => onDone(null)}>
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── "For others" breakdown panel ───────────────────────────────────────────
// Shown after the last step when the user is cooking for someone else — a
// one-screen summary of what Dig In adapted before handing off to Nova.
function ForOthersBreakdown({ answers, onContinue }) {
  const people = answers.people || '';
  const dietary = Array.isArray(answers.dietary) && answers.dietary.length
    ? answers.dietary.map(id => ALLERGENS.find(x => x.id === id)?.label || id).join(', ')
    : null;

  const isFamily    = /family/i.test(people);
  const isCrowd     = /crowd/i.test(people);
  const isSomeoneNew = /someone new/i.test(people);
  const isTwo       = /two/i.test(people);

  const label = isFamily ? 'your family' : isCrowd ? 'the group' : isSomeoneNew ? 'them' : 'both of you';

  const changes = [
    { icon: '🍽️', text: `Portions and recipe counts sized for ${label}` },
    dietary
      ? { icon: '⚠️', text: `${dietary} kept off every suggestion for ${label}` }
      : { icon: '✓', text: `No restrictions flagged for ${label}` },
    isFamily || isCrowd
      ? { icon: '👨‍👩‍👧', text: 'Family-friendly recipes prioritized — fewer strong spices by default' }
      : null,
    isSomeoneNew
      ? { icon: '✨', text: 'Crowd-pleasers and low-allergen dishes ranked first' }
      : null,
    (isTwo && !isFamily)
      ? { icon: '🕯️', text: 'Date-night and special-occasion dishes surfaced in Nova' }
      : null,
    answers.receiptItems?.length
      ? { icon: '🛒', text: `${answers.receiptItems.length} pantry items added from your receipt` }
      : null,
  ].filter(Boolean);

  return (
    <div className="welcome-breakdown">
      <p className="welcome-breakdown-lead">
        Here's what Dig In set up for <strong>{label}</strong>:
      </p>
      <ul className="welcome-breakdown-list">
        {changes.map((c, i) => (
          <li key={i} className="welcome-breakdown-item">
            <span className="welcome-breakdown-icon">{c.icon}</span>
            <span>{c.text}</span>
          </li>
        ))}
      </ul>
      <button type="button" className="welcome-custom-submit welcome-breakdown-cta" onClick={onContinue}>
        Got it — show me Nova →
      </button>
    </div>
  );
}

// ── Post-onboarding swipe trainer ─────────────────────────────────────────
// Shows 6 recipes for the user to like or skip so Nova has real signal before
// the first pick. Each interaction fires recordFlavorSignal just like the
// Discover feed does — the same storage key, the same weights.
const TRAINER_COUNT = 6;

function SwipeTrainer({ onDone }) {
  const [recipes, setRecipes] = useState([]);
  const [idx, setIdx]         = useState(0);
  const [done, setDone]       = useState(false);

  useEffect(() => {
    loadRecipeBooks().then((all) => {
      if (!Array.isArray(all) || !all.length) { onDone(); return; }
      // Spread across different cuisines and types for a representative sample.
      const shuffle = [...all].sort(() => Math.random() - 0.5);
      const seen = new Set();
      const picks = [];
      for (const r of shuffle) {
        if (picks.length >= TRAINER_COUNT) break;
        const key = (r.cuisine || r.recipe_type || '').toLowerCase();
        if (!seen.has(key) || picks.length < 3) { seen.add(key); picks.push(r); }
      }
      while (picks.length < TRAINER_COUNT && picks.length < all.length) {
        picks.push(shuffle[picks.length]);
      }
      setRecipes(picks.slice(0, TRAINER_COUNT));
    }).catch(() => onDone());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function advance(signal) {
    const r = recipes[idx];
    if (r) recordFlavorSignal(r, signal);
    const next = idx + 1;
    if (next >= recipes.length) { setDone(true); setTimeout(onDone, 600); }
    else setIdx(next);
  }

  if (!recipes.length) {
    return (
      <div className="welcome-swipe-loading">
        <p className="welcome-question">Building your taste profile…</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="welcome-swipe-done">
        <p className="welcome-question">Nova's got you. Heading home…</p>
      </div>
    );
  }

  const r = recipes[idx];
  const cuisine = r.cuisine || r.country || '';

  return (
    <div className="welcome-swipe">
      <p className="welcome-question">
        Quick taste check — swipe through a few dishes so Nova knows your style.
        <span className="welcome-swipe-count"> {idx + 1} / {recipes.length}</span>
      </p>
      <div className="welcome-swipe-card" key={r.id || r.name}>
        {r.image && (
          <img
            src={r.image}
            alt={r.name}
            className="welcome-swipe-img"
            loading="eager"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <div className="welcome-swipe-info">
          <p className="welcome-swipe-name">{r.name}</p>
          {cuisine && <p className="welcome-swipe-meta">{cuisine}</p>}
        </div>
      </div>
      <div className="welcome-swipe-actions">
        <button type="button" className="welcome-swipe-btn welcome-swipe-skip" onClick={() => advance('skip')}>
          Not for me
        </button>
        <button type="button" className="welcome-swipe-btn welcome-swipe-love" onClick={() => advance('save')}>
          Love it ❤
        </button>
      </div>
      <button type="button" className="welcome-multi-none" onClick={onDone}>
        Skip taste check
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function Welcome() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState({});
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showSwipe, setShowSwipe]         = useState(false);
  const customRef = useRef(null);

  const h = new Date().getHours();
  const greeting = h < 11 ? 'Good morning.' : h < 17 ? 'Good afternoon.' : 'Good evening.';

  const forOthers = cookingForOthers(answers.people);

  const answer = useCallback((key, value) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    track('welcome_answer', { step: key, value: Array.isArray(value) ? value.join(',') : value });

    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    // Last step filled — save answers and apply to profile.
    saveAnswers(next);
    applyAnswersToProfile(next);
    awardCoins(10);
    markOnboarded(user);
    track('welcome_complete');

    // Show the swipe trainer so Nova gets initial taste signals.
    setShowSwipe(true);
  }, [answers, step, user, navigate]);

  function handleSwipeDone() {
    setShowSwipe(false);
    if (cookingForOthers(answers.people)) {
      setShowBreakdown(true);
    } else {
      navigate('/');
    }
  }

  // Receipt step resolves to a data object or null (skip).
  function handleReceiptDone(data) {
    const next = data
      ? { ...answers, receiptItems: data.receiptItems, receiptStore: data.receiptStore, receiptDate: data.receiptDate, receiptTotal: data.receiptTotal, receiptPhoto: data.receiptPhoto }
      : { ...answers, receiptItems: [], receiptStore: '' };
    setAnswers(next);
    track('welcome_answer', { step: 'receipt', value: data ? `${data.receiptItems?.length || 0} items` : 'skipped' });
    setStep(step + 1);
  }

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
    if (Object.keys(answers).length) {
      saveAnswers(answers);
      applyAnswersToProfile(answers);
    }
    markOnboarded(user);
    track('welcome_skipped');
    navigate('/');
  }

  // Swipe trainer — shown after every completed onboarding.
  if (showSwipe) {
    return (
      <div className="app-container">
        <Nav />
        <div className="welcome">
          <header className="welcome-hero">
            <span className="welcome-mark" aria-hidden="true">DIG IN</span>
            <h1 className="welcome-invite">One more thing.</h1>
            <span className="welcome-rule" aria-hidden="true" />
          </header>
          <div className="welcome-panel">
            <SwipeTrainer onDone={handleSwipeDone} />
          </div>
        </div>
      </div>
    );
  }

  // Breakdown shown after last step for "for others" users.
  if (showBreakdown) {
    return (
      <div className="app-container">
        <Nav />
        <div className="welcome">
          <header className="welcome-hero">
            <span className="welcome-mark" aria-hidden="true">DIG IN</span>
            <h1 className="welcome-invite">All set.</h1>
          </header>
          <ForOthersBreakdown answers={answers} onContinue={() => navigate('/')} />
        </div>
      </div>
    );
  }

  const current = STEPS[step];
  const customPlaceholder = current.customPlaceholder
    ?? (current.type === 'multi' || current.type === 'receipt' || current.noCustom ? null : 'Or type your own…');

  // Adapt the dietary step's question and "none" label when cooking for others.
  const stepQuestion = (current.key === 'dietary' && forOthers)
    ? current.questionOthers
    : current.question;

  return (
    <div className="app-container">
      <Nav />

      <div className="welcome">
        <header className="welcome-hero">
          <span className="welcome-mark" aria-hidden="true">DIG IN</span>
          <p className="welcome-kicker">{greeting}</p>
          <h1 className="welcome-invite">Let's find your first meal.</h1>
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
          <p className="welcome-question">{stepQuestion}</p>

          {current.type === 'receipt' ? (
            <ReceiptStep onDone={handleReceiptDone} />
          ) : current.type === 'multi' ? (
            <MultiStep step={current} forOthers={forOthers} onDone={(picked) => answer(current.key, picked)} />
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
