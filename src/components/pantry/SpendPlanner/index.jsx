import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './SpendPlanner.css';
import { fetchRecipes } from '../../../services/api';
import { priceRecipe } from '../../../lib/tierBudget';
import { recipeFlavors } from '../../../lib/flavorProfile';
import { meetsDiet, veggieHidesFor, DIET_LABEL } from '../../../lib/dietMatch';

/* SpendPlanner — "What can you spend?" resurrected and elevated.

   The old dynamic-pricing idea was buried as a per-serving MAX filter. This is
   the version the product actually wanted: you name a TOTAL budget, who you're
   feeding, and your restrictions, and it answers a real question —

     "With $60, feeding 2, avoiding dairy: you can make about 9 of these meals."

   Then it opens up what that money BUYS you: the spread of flavors across the
   plan, cross-cuisine fusions you could try, and — because picky eaters deserve
   love too — honest ways to get the nutrient without tasting the vegetable.

   Everything is costed with the same tierBudget priceRecipe engine the rest of
   the app uses (budget-tier stores/brands, per serving), so the number is the
   real comparison, not a vibe. Ships collapsed so it never blocks the grid. */

const PRESETS = [20, 40, 60, 100];
const DIETS = ['vegetarian', 'vegan', 'dairy-free', 'nut-free'];

// Per-serving cost, memoized — priceRecipe walks the whole ingredient list.
const _cache = new Map();
function perServing(recipe) {
  const key = recipe?.id || recipe?.name;
  if (key && _cache.has(key)) return _cache.get(key);
  const lines = (recipe?.ingredients || [])
    .map((i) => (typeof i === 'object' ? (i.text || i.name || '') : i)).filter(Boolean);
  const cost = lines.length ? priceRecipe(lines, recipe, 'budget').perServing : Infinity;
  if (key) _cache.set(key, cost);
  return cost;
}

const mealTypeOf = (r) => (r.recipe_type || r.mealType || '').toLowerCase() || 'other';

// Greedy, VARIETY-first plan: cheapest-first within each meal type, dealt
// round-robin across types so $60 buys a spread (a breakfast, a lunch, a
// dinner…) rather than nine of the cheapest thing.
function buildPlan(recipes, { budget, servings, restrictions }) {
  const byMeal = new Map();
  let affordableTotal = 0;
  for (const r of recipes) {
    if (!meetsDiet(r, restrictions)) continue;
    const per = perServing(r);
    if (!Number.isFinite(per) || per <= 0) continue;
    const cost = +(per * servings).toFixed(2);
    if (cost > budget) continue;              // one meal already over budget can't fit
    affordableTotal += 1;
    const m = mealTypeOf(r);
    if (!byMeal.has(m)) byMeal.set(m, []);
    byMeal.get(m).push({ recipe: r, per, cost, meal: m });
  }
  for (const arr of byMeal.values()) arr.sort((a, b) => a.cost - b.cost);

  const order = [...byMeal.keys()];
  const cursors = new Map(order.map((k) => [k, 0]));
  const plan = [];
  let total = 0;
  const CAP = 24;
  let progressed = true;
  while (progressed && plan.length < CAP) {
    progressed = false;
    for (const k of order) {
      if (plan.length >= CAP) break;
      const arr = byMeal.get(k);
      let i = cursors.get(k);
      while (i < arr.length) {
        const cand = arr[i]; i += 1;
        if (total + cand.cost <= budget) {
          plan.push(cand); total = +(total + cand.cost).toFixed(2);
          cursors.set(k, i); progressed = true; break;
        }
      }
      if (i >= arr.length) cursors.set(k, i);
    }
  }
  return { plan, total: +total.toFixed(2), affordableTotal };
}

function flavorSpread(plan) {
  const counts = {};
  for (const p of plan) for (const f of recipeFlavors(p.recipe)) counts[f] = (counts[f] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([f]) => f);
}

function cuisineSpread(plan) {
  const seen = [];
  for (const p of plan) {
    const c = (p.recipe.country || p.recipe.cuisine || '').trim();
    if (c && !seen.includes(c)) seen.push(c);
  }
  return seen;
}

export default function SpendPlanner() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [budget, setBudget] = useState(60);
  const [servings, setServings] = useState(2);
  const [restrictions, setRestrictions] = useState([]);
  const [picky, setPicky] = useState(false);

  // Load the corpus the first time the panel opens (not before — keep it cheap).
  useEffect(() => {
    if (open && !recipes.length) fetchRecipes(1000).then(setRecipes).catch(() => {});
  }, [open, recipes.length]);

  const { plan, total, affordableTotal } = useMemo(
    () => (recipes.length ? buildPlan(recipes, { budget, servings, restrictions })
      : { plan: [], total: 0, affordableTotal: 0 }),
    [recipes, budget, servings, restrictions],
  );

  const flavors = useMemo(() => flavorSpread(plan), [plan]);
  const cuisines = useMemo(() => cuisineSpread(plan), [plan]);
  const veggieTips = useMemo(() => (picky ? veggieHidesFor(plan.map((p) => p.recipe)) : []), [picky, plan]);

  // A couple of honest cross-cuisine fusion nudges from what the budget covers.
  const fusions = useMemo(() => {
    const out = [];
    for (let i = 0; i < cuisines.length - 1 && out.length < 3; i += 2) {
      out.push(`${cuisines[i]} × ${cuisines[i + 1]}`);
    }
    return out;
  }, [cuisines]);

  const toggleDiet = (d) => setRestrictions((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  function openRecipe(recipe) {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    } catch { /* ignore */ }
    navigate('/recipe');
  }

  const loading = open && !recipes.length;

  return (
    <section className={`spend${open ? ' open' : ''}`}>
      <button type="button" className="spend-bar" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="spend-bar-left"><span className="spend-coin">◎</span> What can you spend?</span>
        <span className="spend-bar-right">{open ? '▲' : `$${budget} · feeds ${servings} ▾`}</span>
      </button>

      {open && (
        <div className="spend-body">
          {/* ── Controls ─────────────────────────────────────────── */}
          <div className="spend-controls">
            <div className="spend-field">
              <span className="spend-label">YOUR BUDGET</span>
              <div className="spend-presets">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`spend-preset${budget === p ? ' on' : ''}`}
                    onClick={() => setBudget(p)}
                  >
                    ${p}
                  </button>
                ))}
                <span className="spend-custom">
                  $<input
                    type="number" min="5" step="5" value={budget}
                    onChange={(e) => setBudget(Math.max(5, Number(e.target.value) || 0))}
                    aria-label="Custom budget"
                  />
                </span>
              </div>
            </div>

            <div className="spend-field">
              <span className="spend-label">FEEDING</span>
              <div className="spend-stepper">
                <button type="button" onClick={() => setServings((s) => Math.max(1, s - 1))} aria-label="Fewer">–</button>
                <span>{servings} {servings === 1 ? 'person' : 'people'}</span>
                <button type="button" onClick={() => setServings((s) => Math.min(12, s + 1))} aria-label="More">+</button>
              </div>
            </div>

            <div className="spend-field">
              <span className="spend-label">RESTRICTIONS</span>
              <div className="spend-diets">
                {DIETS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`spend-diet${restrictions.includes(d) ? ' on' : ''}`}
                    onClick={() => toggleDiet(d)}
                  >
                    {DIET_LABEL[d]}
                  </button>
                ))}
              </div>
            </div>

            <label className={`spend-picky${picky ? ' on' : ''}`}>
              <input type="checkbox" checked={picky} onChange={(e) => setPicky(e.target.checked)} />
              I'm a picky eater — help me hide the veggies
            </label>
          </div>

          {/* ── Answer ───────────────────────────────────────────── */}
          {loading ? (
            <p className="spend-loading">Pricing the whole kitchen…</p>
          ) : (
            <>
              <div className="spend-answer">
                <span className="spend-count">{plan.length}</span>
                <span className="spend-answer-txt">
                  meal{plan.length === 1 ? '' : 's'} for <b>${budget}</b>, feeding {servings}
                  {restrictions.length ? <>, {restrictions.map((r) => DIET_LABEL[r].toLowerCase()).join(' + ')}</> : null}.
                  <span className="spend-answer-sub">
                    ~${total.toFixed(2)} of your ${budget} · {affordableTotal} recipes fit your limits
                  </span>
                </span>
              </div>

              {flavors.length > 0 && (
                <div className="spend-block">
                  <span className="spend-block-h">FLAVORS IT COVERS</span>
                  <div className="spend-chips">
                    {flavors.slice(0, 8).map((f) => <span key={f} className="spend-chip">{f}</span>)}
                  </div>
                </div>
              )}

              {fusions.length > 0 && (
                <div className="spend-block">
                  <span className="spend-block-h">FUSIONS YOU COULD MAKE</span>
                  <div className="spend-chips">
                    {fusions.map((f) => <span key={f} className="spend-chip fuse">{f}</span>)}
                  </div>
                  <button type="button" className="spend-link" onClick={() => navigate('/recipes?tab=invent')}>
                    Build one in Invent →
                  </button>
                </div>
              )}

              {picky && veggieTips.length > 0 && (
                <div className="spend-block spend-picky-block">
                  <span className="spend-block-h">GET THE NUTRIENT, SKIP THE TEXTURE</span>
                  <div className="spend-tips">
                    {veggieTips.map((v) => (
                      <div key={v.veg} className="spend-tip">
                        <span className="spend-tip-veg">{v.veg}</span>
                        <p>{v.tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {picky && veggieTips.length === 0 && plan.length > 0 && (
                <p className="spend-picky-none">Nothing on this plan hides a vegetable you'd need to sneak — you're good.</p>
              )}

              {plan.length > 0 ? (
                <div className="spend-block">
                  <span className="spend-block-h">THE ${budget} PLAN</span>
                  <div className="spend-plan">
                    {plan.map((p) => (
                      <button key={p.recipe.id || p.recipe.name} type="button" className="spend-plan-row" onClick={() => openRecipe(p.recipe)}>
                        <span className="spend-plan-name">{p.recipe.name}</span>
                        <span className="spend-plan-cost">${p.cost.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="spend-empty">
                  Nothing fits ${budget} for {servings} with those restrictions. Try a higher budget, fewer people, or fewer limits.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
