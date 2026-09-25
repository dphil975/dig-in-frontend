import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadRecipeBooks } from '../../lib/recipeBooks';
import { currentMealWindow, pickWindowRecipe } from '../../lib/mealTimeBanner';
import { ensureWeather } from '../../lib/recipeRecommender';
import { pickLocalFavorite } from '../../lib/localFlavor';
import './MealTimeBanner.css';

const WINDOW_RANGE_LABEL = {
  breakfast: '4:31 AM – 11:30 AM',
  lunch: '11:31 AM – 4:00 PM',
  dinner: '4:01 PM – 9:00 PM',
  'late-night': '9:00 PM – 4:30 AM',
};

/* MealTimeBanner — a fast-food-menu-board for recipes: whichever of the 4
   real windows is active right now gets exactly one recommended recipe and
   a complementary drink, right there. During the Lunch window only, a
   Happy Hour toggle swaps the pick for a snack-portioned, low-effort bite
   instead of a full lunch. Recomputes the active window every minute, so
   it doesn't need a page reload to cross a boundary.

   Two honesty checks feed the pick: real current-location weather (so a
   90°F day never recommends a hot latte — the whole recipe+drink pairing
   is temperature-aware, not just the food half) and, when the user has
   saved a ZIP on the FoodMap, a "Popular Near You" card pulled from a real
   recipe in the catalogue matching their metro's actual food identity — the
   incentive to cook it at home instead of treating the corner store as the
   only place to get it. */
export default function MealTimeBanner() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [now, setNow] = useState(() => new Date());
  const [happyHour, setHappyHour] = useState(false);
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    let alive = true;
    loadRecipeBooks().then(pool => { if (alive) setRecipes(pool); });
    ensureWeather().then(w => { if (alive) setWeather(w); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const window_ = useMemo(() => currentMealWindow(now), [now]);
  useEffect(() => { if (window_.id !== 'lunch') setHappyHour(false); }, [window_.id]);

  const pick = useMemo(
    () => (recipes.length ? pickWindowRecipe(recipes, window_, { happyHour, weather }) : null),
    [recipes, window_, happyHour, weather],
  );

  const local = useMemo(() => {
    if (!recipes.length) return null;
    let zip = null;
    try { zip = localStorage.getItem('dig_in_zip'); } catch {}
    return zip ? pickLocalFavorite(recipes, zip, window_.id) : null;
  }, [recipes, window_.id]);

  function cook(recipe) {
    if (!recipe) return;
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    } catch { /* ignore */ }
    navigate('/recipe');
  }

  const heading = happyHour && window_.happyHour ? 'Happy Hour Bite' : window_.label;

  return (
    <section className="mtb">
      <div className="mtb-inner">
        <div className="mtb-head">
          <div className="mtb-now">
            <span className="mtb-now-dot" />
            <span className="mtb-now-label">RIGHT NOW · {heading.toUpperCase()}</span>
          </div>
          <span className="mtb-range">{WINDOW_RANGE_LABEL[window_.id]}</span>
        </div>

        {window_.happyHour && (
          <label className="mtb-happy-toggle">
            <input
              type="checkbox"
              checked={happyHour}
              onChange={e => setHappyHour(e.target.checked)}
            />
            <span>Happy Hour — swap for a snack-sized bite instead of a full lunch</span>
          </label>
        )}

        {!pick ? (
          <div className="mtb-empty">Nothing plated for this window yet — check back at the next one.</div>
        ) : (
          <div className="mtb-cards">
            <button className="mtb-card mtb-card-main" onClick={() => cook(pick.recipe)}>
              <span className="mtb-card-kicker">{heading}</span>
              <span className="mtb-card-name">{pick.recipe.name}</span>
              {pick.recipe.country && <span className="mtb-card-meta">{pick.recipe.country}</span>}
              <span className="mtb-card-cta">Cook this →</span>
            </button>
            {pick.drink && (
              <button className="mtb-card mtb-card-drink" onClick={() => cook(pick.drink)}>
                <span className="mtb-card-kicker">Pairs with</span>
                <span className="mtb-card-name">{pick.drink.name}</span>
                <span className="mtb-card-cta">See drink →</span>
              </button>
            )}
            {local && (
              <button className="mtb-card mtb-card-local" onClick={() => cook(local.recipe)}>
                <span className="mtb-card-kicker">Popular in {local.metro.city}</span>
                <span className="mtb-card-name">{local.recipe.name}</span>
                <span className="mtb-card-meta">Make it at home for less</span>
                <span className="mtb-card-cta">Cook this →</span>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
