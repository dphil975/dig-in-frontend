import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import TikTokRecipeFeed from '../../../components/recipe/RecipeReelFeed/index';
import RankRecipesModal from '../../../components/recipe/RankRecipesModal';
import { loadRecipeBooks } from '../../../lib/recipeBooks';
import { buildContext, getBehavior, ensureWeather, getCachedWeather } from '../../../lib/recipeRecommender';
import { loadFlavorProfile } from '../../../lib/flavorProfile';
import { loadMealMood } from '../../../lib/mealMood';
import { getSavedRecipes, saveRecipe, unsaveRecipe } from '../../../services/saveService';

/* Recipe Reels — a full-screen, TikTok-style vertical feed of recipes.
   Reached from the Explore bento (/discover) and the /feed route. On desktop
   it sits in a phone-width column; on mobile it fills the screen.

   TikTokRecipeFeed is a controlled component (it takes recipes/ctx/hits/
   savedRecipes as props, same as RecipeCards' "Discover" button wires it)
   — this page is the standalone entry point that has to actually supply
   them, using the same loadRecipeBooks()/buildContext() pattern every
   other full-corpus page (Occasions, Meal Plan) already uses. */
export default function Feed({ embedded = false } = {}) {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hits, setHits] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dig_in_hits') || '{}'); } catch { return {}; }
  });
  const [saved, setSaved] = useState(() => getSavedRecipes());
  const [weather, setWeather] = useState(() => getCachedWeather());
  const [rankRecipes, setRankRecipes] = useState(null);
  // The "show me dinner" mood from the hero prompt (lib/mealMood): which of the
  // 8 flavors the user is in the mood for + whether they flagged picky-eater.
  // Read once — a mood is for this arrival, not forever.
  const [mood] = useState(loadMealMood);
  const [showPicky, setShowPicky] = useState(() => !!loadMealMood()?.picky);

  useEffect(() => {
    let alive = true;
    loadRecipeBooks().then(pool => { if (alive) { setRecipes(pool); setLoading(false); } });
    ensureWeather().then(w => { if (alive) setWeather(w); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const behavior = useMemo(() => getBehavior(recipes, hits), [recipes, hits]);
  const ctx = useMemo(
    () => buildContext({
      weather, behavior, cravingPrefs: loadFlavorProfile(),
      // The mood's flavors become active `cravings` — the recommender already
      // strongly favors these (scoreRecipe +22/flavor), so the swipe deck opens
      // aimed at exactly what the user just said they wanted.
      cravings: mood?.flavors?.length ? new Set(mood.flavors) : undefined,
    }),
    [weather, behavior, mood],
  );

  function recordHit(recipe) {
    const key = recipe.id ?? recipe.name;
    setHits(h => {
      const next = { ...h, [key]: (h[key] || 0) + 1 };
      try { localStorage.setItem('dig_in_hits', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  function toggleSave(recipe) {
    const key = recipe.id ?? recipe.name;
    const already = saved.some(r => (r.id ?? r.name) === key);
    if (already) unsaveRecipe(recipe); else saveRecipe(recipe);
    setSaved(getSavedRecipes());
  }

  function openRecipe(recipe) {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    } catch { /* ignore */ }
    navigate('/recipe');
  }

  function confirmRanking(ranked) {
    const [first, ...rest] = ranked;
    rest.forEach(r => saveRecipe(r));
    setSaved(getSavedRecipes());
    setRankRecipes(null);
    if (first) { recordHit(first); openRecipe(first); }
  }

  return (
    <div className="bg-[#12121f]">
      {!embedded && <Nav />}
      <div className="mx-auto w-full max-w-[480px] h-[calc(100vh-56px)] relative">
        {/* Picky-eater mood: a real, one-tap way to the fusion builder — a
            familiar base with one new flavor, the approachable path for picky
            eaters. Dismissible; sits over the swipe, doesn't block it. */}
        {showPicky && !loading && (
          <div style={{
            position: 'absolute', top: 8, left: 8, right: 8, zIndex: 30,
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(224,163,46,0.95)', color: '#33302A',
            border: '2px solid #33302A', borderRadius: 10, padding: '8px 10px',
            fontSize: 12.5, fontWeight: 700, boxShadow: '2px 2px 0 #33302A',
          }}>
            <span>🙈 Picky-friendly — want fusion picks that keep it familiar?</span>
            <button
              onClick={() => navigate('/recipes?tab=invent')}
              style={{ marginLeft: 'auto', background: '#6E8259', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 9px', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >Fusion →</button>
            <button onClick={() => setShowPicky(false)} aria-label="Dismiss" style={{ background: 'none', border: 'none', color: '#33302A', fontWeight: 800, cursor: 'pointer' }}>✕</button>
          </div>
        )}
        {loading ? (
          <div className="text-white text-center pt-24 text-sm opacity-70">Loading your feed…</div>
        ) : (
          <TikTokRecipeFeed
            recipes={recipes}
            ctx={ctx}
            hits={hits}
            savedRecipes={saved}
            onSave={toggleSave}
            onFiveRanked={setRankRecipes}
            onClose={() => navigate(-1)}
          />
        )}

        {rankRecipes && (
          <RankRecipesModal
            recipes={rankRecipes}
            onConfirm={confirmRanking}
            onClose={() => setRankRecipes(null)}
          />
        )}
      </div>
    </div>
  );
}
