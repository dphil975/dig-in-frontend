import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import CheckIn from '../../components/nova/CheckIn';
import DealerHand from '../../components/nova/DealerHand';
import HomeSearch from '../../components/nova/HomeSearch';
import { FollowUpCard, ReflectCard } from '../../components/nova/ReturnCards';
import RecallBar from '../../components/health/RecallBar';
import { loadRecipeBooks } from '../../lib/recipe/recipeBooks';
import { minutesAvailable } from '../../lib/nova/pick';
import { MOOD_BY_ID } from '../../lib/nova/kindnessProtocol';
import { NOVA_SAYS, timeGreeting, checkedInLine, welcomeBack } from '../../lib/nova/voice';
import {
  logCheckIn, logCheckInSkip, todaysCheckIn, skippedCheckInToday,
  pendingFollowUp, logFollowUp, pendingCookReflection, logReflection,
  logPick, logSave, markShown, lastCook, peekReturn, commitReturn,
} from '../../lib/nova/thread';
import { saveRecipe, getSavedRecipes } from '../../services/saveService';
import { recordFlavorSignal } from '../../lib/flavor/flavorProfile';
import { activeLifeMode } from '../../lib/personalization/lifeMode';
import { prefetchRoute } from '../../app/routeLoaders';
import './NovaHome.css';

/* Nova — the home screen, and the whole point of the app.

   Nova's job is three things: learn what you like, pick the right recipe, and be
   there when you return. So this page is only:

     the greeting      what time it is, in her voice
     a follow-up       (if you had a rough day last time) how are you now?
     "How'd it go?"    (if you cooked) how the last dish turned out
     the check-in      how are you feeling — calm, stressed, tired, happy, or skip
     Nova's hand       five dishes dealt like a poker hand, one per flavor
     search            a dish, an ingredient, a cuisine — or a feeling
     the closing line  that's today

   The hand replaced the single hero PickCard — the 8-flavor profile reads
   more interestingly as a dealt hand than as one scored winner, and shuffling
   is a fast feedback loop for the recommender.

   Everything she does is written to the thread (lib/nova/thread.js), which is
   also what makes the ♥ count of days you've come back. Everything else in the
   app is one tab away in the sidebar. */

const keyOf = (r) => String(r?.id ?? r?.name ?? '');
const readCoins = () => { try { return parseInt(localStorage.getItem('dig_in_coins') || '0', 10) || 0; } catch { return 0; } };

function NovaHome() {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const [lifeMode, setLifeModeState] = useState(() => activeLifeMode());

  // Coming back: read before writing, so "welcome back" is judged against the
  // last visit and not this one.
  const ret = useMemo(() => peekReturn(), []);
  const cook = useMemo(() => lastCook(), []);
  useEffect(() => { commitReturn(); }, []);
  const returns = ret.count + (ret.isFirst || ret.isNewDay ? 1 : 0);

  const [followUp] = useState(() => pendingFollowUp());
  const [followUpDone, setFollowUpDone] = useState(false);
  const [reflect] = useState(() => pendingCookReflection());
  const [checkIn, setCheckIn] = useState(() => todaysCheckIn());
  const [skipped, setSkipped] = useState(() => skippedCheckInToday());
  const [savedTick, setSavedTick] = useState(0);

  const [recipes, setRecipes] = useState(null);      // null while loading
  useEffect(() => {
    let alive = true;
    loadRecipeBooks()
      .then((list) => { if (alive) setRecipes(Array.isArray(list) ? list : []); })
      .catch(() => { if (alive) setRecipes([]); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10 * 60 * 1000);
    const onMode = () => setLifeModeState(activeLifeMode());
    window.addEventListener('dig_in_lifemode', onMode);
    return () => { clearInterval(t); window.removeEventListener('dig_in_lifemode', onMode); };
  }, []);

  const mood = checkIn?.mood || null;

  // Each card's saved state comes from a Set rebuilt whenever savedTick bumps —
  // same force-rerender pattern the old PickCard used, just surfaced to all
  // five cards instead of one.
  const savedKeys = useMemo(
    () => new Set(getSavedRecipes().map(keyOf)),
    [savedTick],
  );

  const findRecipe = useCallback((e) => (
    recipes?.find((r) => keyOf(r) === String(e.recipeId ?? e.name)) || recipes?.find((r) => r.name === e.name) || null
  ), [recipes]);

  /* ── What you can do ─────────────────────────────────────────────────── */

  function handleCheckIn(id) {
    setCheckIn(logCheckIn(id));
    setSkipped(false);
  }
  function handleSkip() {
    logCheckInSkip();
    setCheckIn(null);
    setSkipped(true);
  }
  function handleFollowUp(answer) {
    logFollowUp(followUp.id, answer);
    setFollowUpDone(true);
  }
  function handleReflect(verdict) {
    const recipe = findRecipe(reflect);
    logReflection(reflect.id, verdict, recipe);
    if (!recipe) return;
    if (verdict === 'loved') recordFlavorSignal(recipe, 'superlike');
    else if (verdict === 'no') { for (let i = 0; i < 3; i++) recordFlavorSignal(recipe, 'skip'); }
  }

  // Dealer hand — one of five dealt cards is picked.
  function handleCardCook(recipe) {
    if (!recipe) return;
    logPick(recipe, 'dealt-hand');
    recordFlavorSignal(recipe, 'view');
    markShown(recipe);
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    } catch { /* ignore */ }
    navigate('/recipe');
  }
  function handleCardSave(recipe) {
    if (!recipe) return;
    if (saveRecipe(recipe)) {
      logSave(recipe);
      recordFlavorSignal(recipe, 'save');
    }
    setSavedTick((n) => n + 1);
  }

  /* ── What she says ───────────────────────────────────────────────────── */

  const greeting = timeGreeting(now);
  const moodLabel = MOOD_BY_ID[mood]?.label || mood;
  const headline = mood
    ? checkedInLine(moodLabel, now, minutesAvailable())
    : `${greeting.hello} ${greeting.meal}`;
  const novaLine = ret.isFirst ? NOVA_SAYS.firstVisit : ret.isNewDay ? welcomeBack(cook?.at) : '';

  const quiet = !!(lifeMode?.shape?.quiet || lifeMode?.shape?.noGamification);

  return (
    <div className="nh">
      <header className="nh-top">
        {quiet ? <span /> : <span className="nh-returns" title="Days you've come back">♥ {returns}</span>}
        <span className="nh-brand">DIG-IN</span>
        {quiet ? <span /> : <span className="nh-coins">COINS {readCoins()}</span>}
      </header>

      <RecallBar />

      <div className="nh-greet">
        <h1 className="nh-headline">{headline}</h1>
        {novaLine && <p className="nh-nova"><span className="nh-nova-tag">Nova</span>{novaLine}</p>}
      </div>

      {followUp && <FollowUpCard moodLabel={MOOD_BY_ID[followUp.mood]?.label || followUp.mood} onAnswer={handleFollowUp} />}
      {reflect && <ReflectCard name={reflect.name} onAnswer={handleReflect} />}

      {(!followUp || followUpDone) && (
        <CheckIn
          mood={mood}
          skipped={skipped}
          onCheckIn={handleCheckIn}
          onSkip={handleSkip}
          onRoute={navigate}
        />
      )}

      <DealerHand
        recipes={recipes}
        loading={recipes === null}
        savedKeys={savedKeys}
        onCook={(r) => { prefetchRoute('recipe'); handleCardCook(r); }}
        onSave={handleCardSave}
      />

      <HomeSearch />

      <p className="nh-closing">that's today. come back tomorrow.</p>
    </div>
  );
}

// A brand-new browser goes through the welcome questions first.
export default function Nova() {
  let onboarded = true;
  try { onboarded = !!localStorage.getItem('dig_in_onboarded'); } catch { /* ignore */ }
  if (!onboarded) return <Navigate to="/welcome" replace />;
  return <NovaHome />;
}
