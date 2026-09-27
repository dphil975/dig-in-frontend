import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import RecipeStepViewer from '../../../components/recipe/RecipeStepViewer';
import EquipmentGate from '../../../components/recipe/EquipmentGate';
import FinishedDishPixelator from '../../../components/cook/FinishedDishPixelator';
import CookCelebration from '../../../components/cook/CookCelebration';
import CookTimerHUD from '../../../components/cook/CookTimerHUD';
import { markCooked } from '../../../services/saveService';
import { useCoins } from '../../../hooks/useCoins';
import { startTimer, stopTimer, clearTimer } from '../../../lib/cookTimer';
import { getUserId } from '../../../lib/syncService';
import { capturePhoto } from '../../../lib/native';
import { checkAchievements } from '../../../lib/cookAchievements';
import { scheduleReflection } from '../../../lib/cookReflection';
import { addJournalEntry } from '../../../lib/cookJournal';
import DishSubmissionModal from '../../../components/cook/DishSubmissionModal';
import '../RecipeCards/RecipeCards.css';
import './RecipeFull.css';
import {
  MissingIngredients, VeggieBoost, AdaptRecipe, ingredientText,
  ChangeRecipeToggle, applyAdaptations, changesList, SensoryCues,
} from '../../../components/recipe/RecipeBoostSections';
import {
  IngredientsPanel, NutritionFacts, RecipeVariations, ServeWith,
  ExpertTips, StorageGuide, MakeAhead, RecipeFAQs,
} from '../../../components/recipe/RecipeExtras/index';
import { RECIPE_INGREDIENTS } from '../../../data/recipesStatic';
import TierBudgetPanel from '../../../components/pantry/TierBudgetPanel';
import AllergyPanel from '../../../components/health/AllergyPanel';
import RecipeTransformPanel from '../../../components/recipe/RecipeTransformPanel';
import { matchRecipeToBuildBar } from '../../../lib/buildBar';
import WellnessPanel from '../../../components/health/WellnessPanel';
import GutHealthPanel from '../../../components/health/GutHealthPanel';
import FoodSafetyPanel from '../../../components/health/FoodSafetyPanel';
import HydrationPanel from '../../../components/health/HydrationPanel';
import { detectEquipment } from '../../../lib/equipmentDetector';
import { recipeFlavors } from '../../../lib/flavorProfile';
import { suggestVariations, suggestServeWith, suggestExpertTips } from '../../../lib/flavorPairing';

function loadRecipe() {
  try { return JSON.parse(sessionStorage.getItem('dig_in_full_recipe') || 'null'); } catch { return null; }
}
// Customizations the user made on the recipe-card modal, carried over so the
// full recipe opens already showing the added ingredients + updated steps.
function loadAdapt() {
  try { return JSON.parse(sessionStorage.getItem('dig_in_full_recipe_adapt') || 'null'); } catch { return null; }
}

export default function RecipeFull() {
  const navigate = useNavigate();
  const recipe = useMemo(loadRecipe, []);
  const initAdapt = useMemo(loadAdapt, []);

  const [missing, setMissing] = useState(() => new Set(initAdapt?.missing || []));
  const [veggies, setVeggies] = useState(() => new Set(initAdapt?.veggies || []));
  const [adapt, setAdapt]     = useState(() => new Set(initAdapt?.adapt || []));
  const [applied, setApplied] = useState(() => !!initAdapt?.applied);
  // Gate the method steps behind the "gear up" equipment screen — the user
  // sees the equipment they'll need before getting into the recipe steps.
  const [enteredSteps, setEnteredSteps] = useState(false);

  // "I made this" → cook log + Nova celebration moment.
  const { add: addCoins } = useCoins();
  const [celebration, setCelebration] = useState(null);   // { result, coinsEarned, resultPhoto }
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitPhoto, setSubmitPhoto] = useState(null);

  if (!recipe) {
    return (
      <div>
        <Nav />
        <div className="rf-page">
          <div className="rf-empty">
            No recipe selected.
            <button className="rf-back" onClick={() => navigate('/recipe-cards')}>← BACK TO RECIPES</button>
          </div>
        </div>
      </div>
    );
  }

  const ings = (recipe.ingredients?.length ? recipe.ingredients : (RECIPE_INGREDIENTS[recipe.id] || [])).map(ingredientText).filter(Boolean);
  const buildBarSeed = matchRecipeToBuildBar({ ...recipe, ingredients: ings });

  function openBuildBar() {
    if (!buildBarSeed) return;
    try { sessionStorage.setItem('dig_in_build_bar_seed', JSON.stringify(buildBarSeed)); } catch { /* ignore */ }
    navigate('/build-bar');
  }
  const baseSteps = recipe.instructions || recipe.steps || [];
  const changes = changesList(veggies, adapt);
  const steps = applied ? applyAdaptations(baseSteps, veggies, adapt) : baseSteps;
  const totalTime = recipe.totalTime || recipe.total_time
    || ((recipe.prepTime || 0) + (recipe.cookTime || 0)) || recipe.time || 0;
  const cuisine = recipe.country || recipe.cuisine || '';
  // Recipe-specific tools (cast iron, wok, sheet pan, ...) instead of the
  // same generic set on every recipe — falls back to EquipmentGate's
  // curated default when nothing in the catalog matches this dish.
  const equipment = detectEquipment(recipe, ings, baseSteps);

  // Most recipes don't have hand-authored variations/serveWith/expertTips
  // yet — rather than showing nothing, fall back to the flavor-pairing
  // generator so every recipe gets pairing-aware suggestions in the same
  // voice, and only defer to hand-authored copy when it actually exists.
  const flavors = recipeFlavors(recipe);
  const variations = recipe.variations?.length ? recipe.variations : suggestVariations(recipe);
  const serveWith = recipe.serveWith?.items?.length ? recipe.serveWith : suggestServeWith(recipe, flavors);
  const expertTips = recipe.expertTips?.length ? recipe.expertTips : suggestExpertTips(recipe);

  const toggleSet = (setter) => (key) => setter(s => {
    const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n;
  });
  const shoppingList = [...[...missing].map(i => ings[i]), ...veggies].filter(Boolean);

  function findStores() {
    try {
      localStorage.setItem('dig_in_shopping_list', JSON.stringify(shoppingList));
      localStorage.removeItem('dig_in_shopping_picked');   // fresh trip
    } catch {}
    navigate('/craving-compass');
  }

  const COOK_COINS = 25;
  const resultPhotoKey = `dig_in_cook_result_photo_${recipe.id}`;

  async function madeThis() {
    const { elapsedMin } = stopTimer(recipe.id);

    // Required end-result photo — the artifact the reflection/achievements
    // step references. Reuses capturePhoto() (src/lib/native.js), the same
    // camera/upload primitive FinishedDishPixelator already uses — no new
    // photo pipeline. Skips gracefully if the user cancels/denies; this
    // shouldn't be able to trap someone out of logging their cook.
    let resultPhoto = null;
    try { resultPhoto = localStorage.getItem(resultPhotoKey); } catch { /* ignore */ }
    if (!resultPhoto) {
      resultPhoto = await capturePhoto({ source: 'prompt' });
      if (resultPhoto) {
        try { localStorage.setItem(resultPhotoKey, resultPhoto); } catch { /* quota — fine, just don't persist */ }
      }
    }

    // Persist the exact dish the user saw (with any applied adaptations) so the
    // cook log entry matches what they actually made.
    const result = markCooked({ ...recipe, ingredients: ings.length ? ings : recipe.ingredients });
    addCoins(COOK_COINS);
    clearTimer(recipe.id);

    // A private, timestamped scrapbook entry for this cook — see
    // cookJournal.js for why this exists separately from the cook log.
    addJournalEntry(recipe, { photoUrl: resultPhoto });

    // Fire-and-forget: durable, cross-device cook log (also feeds the Vault
    // fridge, the cook_followup/cook_reflection nudges, and the leaderboard's
    // real per-user signal — see python/vault_routes.py's /vault/cook).
    (async () => {
      const user_id = await getUserId();
      if (!user_id) return;
      fetch('/api/vault/cook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          recipe_id: recipe.id,
          recipe_name: recipe.name,
          servings_made: recipe.servings || 1,
          recipe_servings: recipe.servings || 1,
          elapsed_min: elapsedMin,
          estimate_min: totalTime || null,
          result_photo: resultPhoto,
        }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);
    })();

    const newBadges = checkAchievements({ recipe, elapsedMin, estimateMin: totalTime || null });
    scheduleReflection({ recipeName: recipe.name, cookedAt: result?.entry?.cookedAt ? new Date(result.entry.cookedAt).getTime() : Date.now() });

    setCelebration({ result, coinsEarned: COOK_COINS, elapsedMin, estimateMin: totalTime || null, newBadges, resultPhoto });
  }

  return (
    <div>
      <Nav />
      <div className="rf-page">
        <button className="rf-back" onClick={() => navigate(-1)}>← BACK</button>

        {/* Header */}
        <div className="rf-header">
          <h1 className="rf-name">{recipe.name || 'Recipe'}</h1>
          {cuisine && <div className="rf-cuisine">{cuisine}</div>}
          <div className="rf-facts">
            {recipe._regionMeta && <span className="rf-fact">{recipe._regionMeta.label}</span>}
            {recipe.difficulty && <span className="rf-fact">{recipe.difficulty}</span>}
            {totalTime > 0 && <span className="rf-fact">{totalTime} min</span>}
            {recipe.servings && <span className="rf-fact">Serves {recipe.servings}</span>}
          </div>
        </div>

        {/* Image area */}
        <div className="rf-image">
          {recipe.image
            ? <img src={recipe.image} alt={recipe.name} />
            : <div className="rf-image-ph">{cuisine || 'DIG IN'}</div>}
        </div>

        {(recipe.description || recipe.notes) && (
          <p className="rf-desc">{recipe.description || recipe.notes}</p>
        )}

        {/* Snap/upload a photo of the finished dish and pixelate it, so the
            cook has a pixel-art target to aim for before they start */}
        <FinishedDishPixelator recipeId={recipe.id} recipeImage={recipe.image} dishName={recipe.name} />

        {/* Full ingredient table with a 1x/2x/3x scaler + equipment — only
            shown for recipes with the richer ingredientGroups data */}
        <IngredientsPanel groups={recipe.ingredientGroups} equipment={recipe.equipment} />

        {/* Income-tier brand + cost panel — same dish, routed to the brands,
            store and price point that fit the shopper's tier, vs eating out */}
        <TierBudgetPanel ingredients={ings} recipe={recipe} />

        {/* Allergen warnings + substitutions — only shows what's flagged in
            the shopper's own allergy profile */}
        <AllergyPanel ingredients={ings} />

        {/* Make this recipe gluten-free / vegan / allergy-safe / fused
            toward another cuisine — a real rewritten ingredient list with
            a reason per swap, not just a filter tag */}
        <RecipeTransformPanel recipe={recipe} ingredients={ings} />

        {/* Build Bar contextual launcher — only shows when this recipe's
            real ingredients actually resemble a salad/pizza/pasta build,
            and opens BuildBar pre-seeded with that guess instead of blank */}
        {buildBarSeed && (
          <button type="button" className="rf-buildbar-launch" onClick={openBuildBar}>
            Build something like this →
          </button>
        )}

        {/* Nutrient tags + healthy swaps — non-diet framing throughout */}
        <WellnessPanel ingredients={ings} />

        {/* Real gut-health science — fermented/fiber/polyphenol signals
            actually found in this recipe, a plant-diversity count, FODMAP
            flags, an allergy cross-reference, and an expandable "what makes
            food gut-friendly?" education accordion */}
        <GutHealthPanel ingredients={ings} />

        {/* Safe cooking temperatures for this recipe's actual proteins —
            food-handler-exam-grade facts, only shown when relevant */}
        <FoodSafetyPanel ingredients={ings} />

        {/* Why this specific meal will make you thirsty — real mechanisms
            read off its own ingredients (fiber genuinely needs the water to
            work; sodium and capsaicin have real physiology behind them).
            Renders nothing when the recipe has no honest driver. */}
        <HydrationPanel ingredients={ings} />

        {/* Interactive sections */}
        <MissingIngredients ings={ings} missing={missing} onToggle={toggleSet(setMissing)} />
        <VeggieBoost added={veggies} onToggle={toggleSet(setVeggies)} />
        <AdaptRecipe active={adapt} onToggle={toggleSet(setAdapt)} />
        <SensoryCues recipe={recipe} />

        {/* Change-the-recipe toggle — weaves the choices above into the steps */}
        <ChangeRecipeToggle on={applied} count={changes.length} onToggle={() => setApplied(a => !a)} />

        {/* Equipment gate — shown before the method; Continue reveals the steps
            and starts the visible cook timer (a time-management check tied to
            the eventual "I MADE THIS" completion). */}
        {!enteredSteps ? (
          <EquipmentGate recipe={recipe} equipment={equipment} onContinue={() => { startTimer(recipe.id); setEnteredSteps(true); }} />
        ) : (
          /* Full steps */
          <div className="rd-section">
            <div className="rd-title">METHOD · {steps.length} STEPS{applied && changes.length ? ' · UPDATED' : ''}</div>
            <CookTimerHUD recipeId={recipe.id} estimateMin={totalTime || null} />
            <RecipeStepViewer
              steps={steps}
              groups={applied ? [] : (recipe.stepGroups || [])}
              image={recipe.image}
              stepImages={recipe.stepImages}
              recipeName={recipe.name}
              stepHelp={recipe.stepHelp || []}
              recipeId={recipe.id}
            />
          </div>
        )}

        {/* Nutrition/storage/make-ahead/FAQ still no-op without hand-authored
            data; variations/serveWith/expertTips fall back to flavor-pairing-
            generated suggestions above when the recipe doesn't have its own */}
        <NutritionFacts nutrition={recipe.nutrition} />
        <RecipeVariations variations={variations} />
        <ServeWith serveWith={serveWith} />
        <ExpertTips tips={expertTips} />
        <StorageGuide storage={recipe.storage} />
        <MakeAhead text={recipe.makeAhead} />
        <RecipeFAQs faqs={recipe.faqs} />

        {/* Sticky action bar — build a grocery route, or log the cook */}
        <div className="rf-actionbar">
          <div className="rf-list-count">
            {shoppingList.length
              ? `${shoppingList.length} item${shoppingList.length !== 1 ? 's' : ''} on your list`
              : 'Tap ingredients above to build a list'}
          </div>
          <button className="rd-btn rf-made-this" onClick={madeThis}>
            I MADE THIS ✓
          </button>
          <button className="rd-btn rd-find-stores" onClick={findStores}>
            FIND STORES{shoppingList.length ? ` · ${shoppingList.length}` : ''}
          </button>
        </div>
      </div>

      {celebration && (
        <CookCelebration
          recipe={recipe}
          result={celebration.result}
          coinsEarned={celebration.coinsEarned}
          elapsedMin={celebration.elapsedMin}
          estimateMin={celebration.estimateMin}
          newBadges={celebration.newBadges}
          onClose={() => setCelebration(null)}
          onLeftovers={() => navigate('/pantry')}
          onSubmitToLeaderboard={() => {
            setSubmitPhoto(celebration.resultPhoto);
            setCelebration(null);
            setShowSubmit(true);
          }}
        />
      )}

      {showSubmit && (
        <DishSubmissionModal
          recipe={recipe}
          initialPhoto={submitPhoto}
          onClose={() => setShowSubmit(false)}
        />
      )}
    </div>
  );
}
