import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../../components/shell/Nav';
import { loadRecipeBooks } from '../../../../lib/recipeBooks';
import { getCookHistory } from '../../../../services/saveService';
import {
  weekStartFor, generateWeekPlan, swapMeal, swapDayAll, swapDrink, removeDrink,
  loadWeekPlan, saveWeekPlan, MEAL_SLOTS, weekIngredients, bonusRecipesFromList,
} from '../../../../lib/mealPlanEngine';
import { ingredientText } from '../../../../components/recipe/RecipeBoostSections';
import { getMealPrepFavorites, removeMealPrepFavorite } from '../../../../lib/mealPrepFavorites';
import { linkedCravingForSlot, clearLinkForSlot } from '../../../../lib/cravingMealPrep';
import { itemCoversIngredient } from '../../../../lib/pantryTools';
import { priceIngredientList, getUserTier, setUserTier, TIERS, TIER_NAME } from '../../../../lib/tierBudget';
import './MealPlan.css';

const RECENT_DAYS = 14;

function recentRecipeIds(history) {
  const cutoff = Date.now() - RECENT_DAYS * 24 * 3600 * 1000;
  return new Set(
    history.filter(e => e.cookedAt && new Date(e.cookedAt).getTime() >= cutoff)
      .map(e => e.id ?? e.name),
  );
}

/* One day's 4 meal slots, opened by clicking its card in the week grid.
   Each meal can be re-rolled on its own and paired with — or unpaired
   from — a real drink recipe from the same book corpus. */
function DayDetail({ day, dayIndex, weekStart, onOpenRecipe, onSwapMeal, onSwapDrink, onRemoveDrink, onRerollDay }) {
  return (
    <div className="mp-detail">
      <div className="mp-detail-head">
        <h2 className="mp-detail-title">{day.day.toUpperCase()}</h2>
        <button className="mp-reroll-day" onClick={onRerollDay}>REROLL ALL 4 ↻</button>
      </div>

      <div className="mp-meal-list">
        {MEAL_SLOTS.map(({ key, label }) => {
          const meal = day.meals?.[key];
          if (!meal) return null;
          const craving = linkedCravingForSlot(weekStart, dayIndex, key);
          return (
            <div className="mp-meal-row" key={key}>
              <div className="mp-meal-slot-label">{label.toUpperCase()}</div>
              <div className="mp-meal-main">
                <span className="mp-meal-name" onClick={() => onOpenRecipe(meal.recipeId)}>{meal.recipeName}</span>
                {craving && (
                  <span className="mp-craving-tag" title={`From a logged craving: “${craving.text}”`}>
                    🍋 from a craving
                  </span>
                )}
                <button className="mp-swap" onClick={() => onSwapMeal(dayIndex, key)}>SWAP ↻</button>
              </div>
              <div className="mp-drink-row">
                {meal.drinkId ? (
                  <>
                    <span className="mp-drink-label">Pairs with</span>
                    <span className="mp-drink-name" onClick={() => onOpenRecipe(meal.drinkId)}>{meal.drinkName}</span>
                    <button className="mp-drink-swap" onClick={() => onSwapDrink(dayIndex, key)}>SWAP DRINK</button>
                    <button className="mp-drink-remove" onClick={() => onRemoveDrink(dayIndex, key)} aria-label="Remove drink pairing">✕</button>
                  </>
                ) : (
                  <button className="mp-drink-add" onClick={() => onSwapDrink(dayIndex, key)}>+ PAIR WITH A DRINK</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MealPlan({ embedded = false } = {}) {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDay, setOpenDay] = useState(null);
  const [prepFavorites, setPrepFavorites] = useState(() => getMealPrepFavorites());
  const [tier, setTier] = useState(getUserTier);
  const weekStart = weekStartFor();

  useEffect(() => {
    let alive = true;
    (async () => {
      const pool = await loadRecipeBooks();
      if (!alive) return;
      setRecipes(pool);

      const existing = loadWeekPlan(weekStart);
      if (existing) {
        setPlan(existing);
      } else {
        const fresh = generateWeekPlan({ recipes: pool, recentRecipeIds: recentRecipeIds(getCookHistory()) });
        setPlan(fresh);
        saveWeekPlan(weekStart, fresh);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recipeFor = useCallback(
    (recipeId) => recipes.find(r => (r.id ?? r.name) === recipeId),
    [recipes],
  );

  // "Buy once, cook more" — the ingredient-overlap payoff of planning a
  // week instead of picking dinners one at a time. shoppingList is the
  // FULL ingredient set (unlike sendToShoppingList's pantry-aware version
  // below, this counts on-hand ingredients too, since we're asking "what
  // does this haul unlock", not "what's left to buy"). priced runs it
  // through the same dynamic tier-based pricing scaler (tierBudget.js)
  // that already prices individual recipes on RecipeFull.
  const shoppingList = useMemo(() => weekIngredients(plan, recipes), [plan, recipes]);
  const scheduledIds = useMemo(() => new Set(
    plan.flatMap(day => Object.values(day.meals || {}).flatMap(m => (m ? [m.recipeId, m.drinkId].filter(Boolean) : []))),
  ), [plan]);
  const priced = useMemo(() => priceIngredientList(shoppingList, tier), [shoppingList, tier]);
  const bonus = useMemo(
    () => (recipes.length ? bonusRecipesFromList(shoppingList, recipes, scheduledIds) : { recipes: [], total: 0 }),
    [shoppingList, recipes, scheduledIds],
  );
  const totalMakeable = scheduledIds.size + bonus.total;
  const costPerRecipe = totalMakeable > 0 ? priced.total / totalMakeable : 0;

  function pickTier(t) { setTier(t); setUserTier(t); }

  function applyPlan(next) {
    setPlan(next);
    saveWeekPlan(weekStart, next);
  }

  // A swap or reroll changes what's actually IN a slot, so any craving link
  // pointing at that slot would go stale (still claiming "from a craving" for
  // a recipe that craving never suggested) — clear it first. The craving log
  // entry itself is untouched; cravingTrackingView() just reports it back as
  // "logged" again, which is accurate.
  function rerollDay(dayIndex) {
    MEAL_SLOTS.forEach(({ key }) => clearLinkForSlot(weekStart, dayIndex, key));
    applyPlan(swapDayAll(plan, dayIndex, { recipes }));
  }
  function swapMealHandler(dayIndex, mealKey) {
    clearLinkForSlot(weekStart, dayIndex, mealKey);
    applyPlan(swapMeal(plan, dayIndex, mealKey, { recipes }));
  }
  function swapDrinkHandler(dayIndex, mealKey) { applyPlan(swapDrink(plan, dayIndex, mealKey, { recipes })); }
  function removeDrinkHandler(dayIndex, mealKey) { applyPlan(removeDrink(plan, dayIndex, mealKey)); }

  function openRecipe(recipeId) {
    const recipe = recipeFor(recipeId);
    if (!recipe) return;
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.removeItem('dig_in_full_recipe_adapt');
    } catch { /* ignore */ }
    navigate('/recipe');
  }

  function cookPrepFavorite(recipe) {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.removeItem('dig_in_full_recipe_adapt');
    } catch { /* ignore */ }
    navigate('/recipe');
  }

  function removePrepFavorite(recipe) {
    removeMealPrepFavorite(recipe);
    setPrepFavorites(getMealPrepFavorites());
  }

  // Pantry-aware: skip anything the pantry already covers, same matching
  // pantryTools.js's suggestRecipes()/buildRolodex() already use, so the
  // week's list is what you actually need to buy — across all 4 meals a
  // day plus whatever drinks got paired in, not just one dinner each.
  function sendToShoppingList() {
    let pantryNames = [];
    try {
      const v = JSON.parse(localStorage.getItem('dig_in_pantry'));
      if (Array.isArray(v)) pantryNames = v.map(i => i.name).filter(Boolean);
    } catch { /* ignore */ }

    const list = [];
    for (const day of plan) {
      for (const meal of Object.values(day.meals || {})) {
        if (!meal) continue;
        for (const recipeId of [meal.recipeId, meal.drinkId].filter(Boolean)) {
          const recipe = recipeFor(recipeId);
          if (!recipe) continue;
          for (const ing of recipe.ingredients || []) {
            const text = ingredientText(ing);
            if (!text) continue;
            if (pantryNames.some(n => itemCoversIngredient(n, text))) continue;
            list.push(text);
          }
        }
      }
    }
    try {
      localStorage.setItem('dig_in_shopping_list', JSON.stringify([...new Set(list)]));
      localStorage.removeItem('dig_in_shopping_picked');
    } catch { /* ignore */ }
    navigate('/craving-compass');
  }

  return (
    <>
      {!embedded && <Nav />}
      <div className="mp-page">
        <div className="mp-header">
          <h1>Weekly Meal Plan</h1>
          <p>Breakfast, lunch, dinner and a snack for every day — tap a day to see all 4, and pair any meal with a drink.</p>
        </div>

        {loading ? (
          <div className="mp-loading">Building your week…</div>
        ) : (
          <>
            <div className="mp-grid">
              {plan.map((day, i) => {
                const headline = day.meals?.dinner || day.meals?.lunch || day.meals?.breakfast || day.meals?.snack;
                const isOpen = openDay === i;
                return (
                  <div
                    key={day.day + i}
                    className={`mp-day${isOpen ? ' open' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setOpenDay(isOpen ? null : i)}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setOpenDay(isOpen ? null : i)}
                  >
                    <div className="mp-day-label">{day.day}</div>
                    <div className="mp-dish">{headline?.recipeName || 'No meals planned'}</div>
                    <div className="mp-day-hint">{isOpen ? '▾ HIDE MEALS' : '▸ 4 MEALS'}</div>
                  </div>
                );
              })}
            </div>

            {openDay != null && plan[openDay] && (
              <DayDetail
                day={plan[openDay]}
                dayIndex={openDay}
                weekStart={weekStart}
                onOpenRecipe={openRecipe}
                onSwapMeal={swapMealHandler}
                onSwapDrink={swapDrinkHandler}
                onRemoveDrink={removeDrinkHandler}
                onRerollDay={() => rerollDay(openDay)}
              />
            )}

            {shoppingList.length > 0 && (
              <section className="mp-boc">
                <div className="mp-boc-head">
                  <h2 className="mp-boc-title">Buy once, cook more</h2>
                  <div className="mp-boc-tiers">
                    {TIERS.map(t => (
                      <button
                        key={t}
                        className={`mp-boc-tier${tier === t ? ' active' : ''}`}
                        onClick={() => pickTier(t)}
                        aria-pressed={tier === t}
                      >
                        {TIER_NAME[t]}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="mp-boc-sub">
                  Get these {shoppingList.length} ingredients ({priced.store}) and you can make every meal
                  scheduled this week — plus {bonus.total} other recipe{bonus.total !== 1 ? 's' : ''} you'll
                  already have what you need for.
                </p>

                <div className="mp-boc-totals">
                  <div className="mp-boc-block">
                    <div className="mp-boc-num">${priced.total.toFixed(2)}</div>
                    <div className="mp-boc-label">for the whole haul</div>
                  </div>
                  <div className="mp-boc-block">
                    <div className="mp-boc-num">{totalMakeable}</div>
                    <div className="mp-boc-label">recipes it unlocks</div>
                  </div>
                  <div className="mp-boc-block">
                    <div className="mp-boc-num">${costPerRecipe.toFixed(2)}</div>
                    <div className="mp-boc-label">per recipe</div>
                  </div>
                </div>

                {bonus.recipes.length > 0 && (
                  <div className="mp-boc-bonus">
                    <div className="mp-boc-bonus-title">
                      BONUS RECIPES FROM THE SAME HAUL {bonus.total > bonus.recipes.length && `(showing ${bonus.recipes.length} of ${bonus.total})`}
                    </div>
                    <div className="mp-boc-bonus-grid">
                      {bonus.recipes.map(r => (
                        <button
                          key={r.id ?? r.name}
                          className="mp-boc-bonus-card"
                          onClick={() => openRecipe(r.id ?? r.name)}
                        >
                          {r.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            <div className="mp-actions">
              <button className="mp-btn mp-btn-primary" onClick={sendToShoppingList}>
                SEND WEEK TO SHOPPING LIST →
              </button>
            </div>
          </>
        )}

        {/* Recipes saved "ate it all, make again on a prep day" from
            CookCelebration — otherwise saved nowhere you could ever see them. */}
        {prepFavorites.length > 0 && (
          <div className="mp-prep-section">
            <h2 className="mp-prep-title">YOUR MEAL-PREP FAVORITES</h2>
            <p className="mp-prep-sub">Dishes you finished completely and asked to make again.</p>
            <div className="mp-grid">
              {prepFavorites.map((r, i) => (
                <div className="mp-day mp-prep-card" key={r.id || r.name || i}>
                  <div className="mp-dish" onClick={() => cookPrepFavorite(r)}>{r.name}</div>
                  <div className="mp-prep-actions">
                    <button className="mp-swap" onClick={() => cookPrepFavorite(r)}>COOK →</button>
                    <button className="mp-prep-remove" onClick={() => removePrepFavorite(r)} aria-label="Remove">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
