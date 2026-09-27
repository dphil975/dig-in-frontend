import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import CheckIn from '../../components/nova/CheckIn';
import PickCard from '../../components/nova/PickCard';
import HomeSearch from '../../components/nova/HomeSearch';
import { FollowUpCard, ReflectCard } from '../../components/nova/ReturnCards';
import RecallBar from '../../components/health/RecallBar';
import { loadRecipeBooks } from '../../lib/recipe/recipeBooks';
import { pickForNow, minutesAvailable } from '../../lib/nova/pick';
import { MOOD_BY_ID } from '../../lib/nova/kindnessProtocol';
import { NOVA_SAYS, timeGreeting, checkedInLine, welcomeBack } from '../../lib/nova/voice';
import {
  logCheckIn, logCheckInSkip, todaysCheckIn, skippedCheckInToday,
  pendingFollowUp, logFollowUp, pendingCookReflection, logReflection,
  logPick, logSwap, logSave, markShown, lastCook, peekReturn, commitReturn,
} from '../../lib/nova/thread';
import { saveRecipe, isSaved } from '../../services/saveService';
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
     Nova's pick       one dish, and why she chose it
     search            a dish, an ingredient, a cuisine — or a feeling
     the closing line  that's today

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
  const [pickMeUp, setPickMeUp] = useState(null);
  const [skipIds, setSkipIds] = useState([]);
  const [note, setNote] = useState('');
  const [, bump] = useState(0);

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
  const pick = useMemo(
    () => (recipes ? pickForNow(recipes, { now, mood, pickMeUp, skipIds }) : null),
    [recipes, now, mood, pickMeUp, skipIds],
  );
  useEffect(() => { if (pick) markShown(pick.recipe); }, [pick]);

  const findRecipe = useCallback((e) => (
    recipes?.find((r) => keyOf(r) === String(e.recipeId ?? e.name)) || recipes?.find((r) => r.name === e.name) || null
  ), [recipes]);

  /* ── What you can do ─────────────────────────────────────────────────── */

  function handleCheckIn(id) {
    setCheckIn(logCheckIn(id));
    setSkipped(false);
    setNote('');
  }
  function handleSkip() {
    logCheckInSkip();
    setCheckIn(null);
    setSkipped(true);
    setNote('');
  }
  function handleFollowUp(answer) {
    logFollowUp(followUp.id, answer);
    setFollowUpDone(true);
    if (answer === 'same' || answer === 'rough') setPickMeUp(followUp.mood);
  }
  function handleReflect(verdict) {
    const recipe = findRecipe(reflect);
    logReflection(reflect.id, verdict, recipe);
    if (!recipe) return;
    if (verdict === 'loved') recordFlavorSignal(recipe, 'superlike');
    else if (verdict === 'no') { for (let i = 0; i < 3; i++) recordFlavorSignal(recipe, 'skip'); }
  }
  function handleCook() {
    if (!pick) return;
    logPick(pick.recipe, pick.reason);
    recordFlavorSignal(pick.recipe, 'view');
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(pick.recipe));
      sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    } catch { /* ignore */ }
    navigate('/recipe');
  }
  function handleSwap() {
    if (!pick) return;
    logSwap(pick.recipe);
    recordFlavorSignal(pick.recipe, 'skip');
    setSkipIds((ids) => [...ids, keyOf(pick.recipe)]);
    setNote(NOVA_SAYS.swap);
  }
  function handleSave() {
    if (!pick) return;
    if (saveRecipe(pick.recipe)) {
      logSave(pick.recipe);
      recordFlavorSignal(pick.recipe, 'save');
    }
    setNote(NOVA_SAYS.afterSave);
    bump((n) => n + 1);
  }

  /* ── What she says ───────────────────────────────────────────────────── */

  const greeting = timeGreeting(now);
  const moodLabel = MOOD_BY_ID[mood]?.label || mood;
  const headline = mood
    ? checkedInLine(moodLabel, now, minutesAvailable())
    : `${greeting.hello} ${greeting.meal}`;
  const novaLine = ret.isFirst ? NOVA_SAYS.firstVisit : ret.isNewDay ? welcomeBack(cook?.at) : '';

  const quiet = !!(lifeMode?.shape?.quiet || lifeMode?.shape?.noGamification);
  const settled = !!mood || skipped;

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

      <PickCard
        pick={pick}
        loading={recipes === null}
        canSwap={settled}
        saved={pick ? isSaved(pick.recipe) : false}
        note={note}
        onCook={handleCook}
        onCookIntent={() => prefetchRoute('recipe')}
        onSwap={handleSwap}
        onSave={handleSave}
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
