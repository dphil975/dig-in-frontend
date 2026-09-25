import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../../../components/shell/Nav';
import {
  LIFE_STAGES, INTENSITIES, MATERNAL_NOTE, MATERNAL_PATTERNS,
  loadCravingLog, logCraving, removeCravingEntry, cravingPatterns, stockAheadList,
} from '../../../../lib/cravingTracker';
import {
  recipesForCraving, placeCravingInPlan, markCravingFulfilled,
  cravingTrackingView, cravingTrackingSummary,
} from '../../../../lib/cravingMealPrep';
import {
  weekStartFor, loadWeekPlan, saveWeekPlan, generateWeekPlan, MEAL_SLOTS,
} from '../../../../lib/mealPlanEngine';
import { loadRecipeBooks } from '../../../../lib/recipeBooks';
import { getCookHistory } from '../../../../services/saveService';
import { STAGES, cravingInsight, DISCLAIMER as PREGNANCY_DISCLAIMER } from '../../../../lib/pregnancyGuide';
import './CravingTracker.css';

/* Craving Tracker — a homestead-minded pantry, not a reactive scramble.
   Log what you're craving (optionally tagged to a life stage like
   pregnancy/postpartum), and once a flavor shows up a couple times, Nova
   starts telling you what to keep stocked so it's already on hand next
   time. Every logged entry also feeds the SAME learned flavor profile
   RecipeCards and Nova's nudges already read (see lib/cravingTracker.js) —
   one memory, not a second parallel one.

   The tracking loop (logged → planned → made) is the bridge in
   lib/cravingMealPrep.js: real recipe suggestions for a craving, a real slot
   in this week's actual plan (the same plan Weekly Meal Plan shows), and a
   plain "mark as made" to close it. For a pregnancy/postpartum-tagged
   craving, the planner also surfaces pregnancyGuide.js's real craving-shape
   read — why the craving shows up, what answers it, a pica note when it's
   warranted, and the stage-appropriate nutrient context — the first place in
   the app that content was actually reachable. */

const FLAVOR_LABEL = {
  spicy: 'Spicy', sweet: 'Sweet', savory: 'Savory', rich: 'Rich',
  light: 'Light & Fresh', earthy: 'Earthy', smoky: 'Smoky', tangy: 'Tangy',
};

// cravingTracker's life-stage tag is coarse (pregnancy/postpartum/general);
// pregnancyGuide's STAGES are trimester-specific. This is the bridge between
// the two vocabularies — which of pregnancyGuide's real stages are worth
// offering once someone's tagged a craving to one of these two buckets.
const STAGE_CHOICES = {
  pregnancy: ['t1', 't2', 't3'],
  postpartum: ['postpartum', 'nursing'],
};

const RECENT_DAYS = 14;
function recentRecipeIds(history) {
  const cutoff = Date.now() - RECENT_DAYS * 24 * 3600 * 1000;
  return new Set(
    history.filter((e) => e.cookedAt && new Date(e.cookedAt).getTime() >= cutoff)
      .map((e) => e.id ?? e.name),
  );
}

/* The planner panel for one logged craving: real, flavor-matched recipe
   suggestions and a day/slot picker into the actual week Weekly Meal Plan
   already shows — plus, for a pregnancy/postpartum craving, the live read
   from pregnancyGuide's craving-shape engine. Suggestions and the insight
   read are independent of each other (the insight's stage only sharpens the
   EXPLANATION, not the recipe ranking — see cravingMealPrep.js), so picking
   a stage never changes which recipes are offered. */
function PlannerPanel({ entry, recipes, plan, weekStart, onPlaced, onCancel }) {
  const stageOptions = STAGE_CHOICES[entry.lifeStage] || [];
  const [stageChoice, setStageChoice] = useState(stageOptions[0] || null);
  const [selected, setSelected] = useState(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [mealKey, setMealKey] = useState(MEAL_SLOTS[0].key);

  const suggestions = useMemo(
    () => recipesForCraving(entry.text, recipes, { lifeStage: entry.lifeStage, limit: 6 }),
    [entry.text, entry.lifeStage, recipes],
  );
  const insight = useMemo(
    () => (stageChoice ? cravingInsight(entry.text, stageChoice) : null),
    [entry.text, stageChoice],
  );

  const currentOccupant = plan[dayIndex]?.meals?.[mealKey]?.recipeName;

  function add() {
    if (!selected) return;
    const { plan: nextPlan, linked } = placeCravingInPlan(
      entry.id, selected, plan, dayIndex, mealKey, { recipes, weekStart },
    );
    if (linked) onPlaced(nextPlan);
  }

  return (
    <div className="ct-panel">
      {stageOptions.length > 0 && (
        <div className="ct-panel-block">
          <div className="ct-panel-label">Which stage is this?</div>
          <div className="ct-stage-picker">
            {stageOptions.map((id) => {
              const s = STAGES.find((x) => x.id === id);
              if (!s) return null;
              return (
                <button
                  key={id}
                  type="button"
                  className={`ct-stage-btn${stageChoice === id ? ' active' : ''}`}
                  onClick={() => setStageChoice(id)}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {insight?.shape && (
        <div className="ct-insight">
          <div className="ct-insight-label">{insight.shape.label}</div>
          <p className="ct-insight-read">{insight.shape.read}</p>
          <div className="ct-recipe-chips">
            {insight.shape.satisfy.map((s) => (
              <span key={s} className="ct-recipe-chip ct-recipe-chip-static">{s}</span>
            ))}
          </div>
          {insight.shape.bonus && <p className="ct-insight-bonus">{insight.shape.bonus}</p>}
          {insight.pica && <p className="ct-pica">{insight.picaNote}</p>}
          {insight.stage && (
            <p className="ct-insight-posture"><strong>{insight.stage.label}:</strong> {insight.stage.posture}</p>
          )}
          <p className="ct-insight-disclaimer">{PREGNANCY_DISCLAIMER}</p>
        </div>
      )}

      <div className="ct-panel-block">
        <div className="ct-panel-label">Real recipes that might answer it</div>
        {suggestions.length === 0 ? (
          <p className="ct-panel-empty">
            Nothing in the recipe book shares a flavor with this one yet — no honest match to suggest.
            You can still plan something manually from Weekly Meal Plan.
          </p>
        ) : (
          <div className="ct-recipe-chips">
            {suggestions.map((r) => {
              const id = r.id ?? r.name;
              const active = (selected?.id ?? selected?.name) === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`ct-recipe-chip${active ? ' active' : ''}`}
                  onClick={() => setSelected(r)}
                >
                  {r.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <>
          <div className="ct-form-row">
            <label className="ct-form-field">
              <span>Which day</span>
              <select className="ct-select" value={dayIndex} onChange={(e) => setDayIndex(Number(e.target.value))}>
                {plan.map((d, i) => <option key={d.day + i} value={i}>{d.day}</option>)}
              </select>
            </label>
            <label className="ct-form-field">
              <span>Which meal</span>
              <select className="ct-select" value={mealKey} onChange={(e) => setMealKey(e.target.value)}>
                {MEAL_SLOTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </label>
          </div>
          {currentOccupant && (
            <p className="ct-panel-replaces">Currently planned: <em>{currentOccupant}</em> — adding this will replace it.</p>
          )}
        </>
      )}

      <div className="ct-panel-actions">
        {suggestions.length > 0 && (
          <button type="button" className="ct-submit" disabled={!selected} onClick={add}>
            Add to this week's plan
          </button>
        )}
        <button type="button" className="ct-panel-cancel" onClick={onCancel}>
          {suggestions.length > 0 ? 'Cancel' : 'Close'}
        </button>
      </div>
    </div>
  );
}

function LogEntryRow({
  entry, recipes, plan, weekStart, mpReady, planning,
  onTogglePlan, onPlaced, onMarkMade, onRemove, onOpenRecipe,
}) {
  const plannedMealLabel = entry.link
    ? MEAL_SLOTS.find((s) => s.key === entry.link.mealKey)?.label
    : null;
  const plannedDay = entry.link ? plan[entry.link.dayIndex]?.day : null;

  return (
    <div className="ct-log-item">
      <div className="ct-log-row">
        <div className="ct-log-main">
          <div className="ct-log-text">{entry.text}</div>
          <div className="ct-log-meta">
            {LIFE_STAGES.find((s) => s.id === entry.lifeStage)?.label || 'General'} · {entry.intensity}
            {entry.flavors?.length > 0 && ` · ${entry.flavors.map((f) => FLAVOR_LABEL[f] || f).join(', ')}`}
          </div>
          {entry.status === 'planned' && entry.link && (
            <div className="ct-log-status-line">
              Planned for {plannedDay} · {plannedMealLabel} —{' '}
              <span className="ct-log-status-recipe" onClick={() => onOpenRecipe(entry.link.recipeId)}>
                {entry.link.recipeName}
              </span>
            </div>
          )}
          {entry.status === 'made' && entry.link && (
            <div className="ct-log-status-line ct-made-line">
              ✓ Made —{' '}
              <span className="ct-log-status-recipe" onClick={() => onOpenRecipe(entry.link.recipeId)}>
                {entry.link.recipeName}
              </span>
            </div>
          )}
        </div>
        <span className={`ct-status-pill ct-status-${entry.status}`}>{entry.status}</span>
        <button className="ct-log-remove" onClick={() => onRemove(entry.id)} aria-label="Remove entry">✕</button>
      </div>

      <div className="ct-log-actions">
        {entry.status === 'logged' && (
          <button
            type="button"
            className="ct-plan-btn"
            disabled={!mpReady}
            onClick={() => onTogglePlan(entry.id)}
          >
            {planning ? 'Close' : mpReady ? 'Plan it →' : 'Loading recipes…'}
          </button>
        )}
        {entry.status === 'planned' && (
          <>
            <button type="button" className="ct-made-btn" onClick={() => onMarkMade(entry.id)}>
              Mark as made ✓
            </button>
            <button type="button" className="ct-plan-btn ct-plan-btn-ghost" onClick={() => onTogglePlan(entry.id)}>
              {planning ? 'Close' : 'Change plan'}
            </button>
          </>
        )}
      </div>

      {planning && (
        <PlannerPanel
          entry={entry}
          recipes={recipes}
          plan={plan}
          weekStart={weekStart}
          onPlaced={(nextPlan) => onPlaced(entry.id, nextPlan)}
          onCancel={() => onTogglePlan(entry.id)}
        />
      )}
    </div>
  );
}

export default function CravingTracker({ embedded = false } = {}) {
  const navigate = useNavigate();
  const [log, setLog] = useState(loadCravingLog);
  const [text, setText] = useState('');
  const [lifeStage, setLifeStage] = useState('general');
  const [intensity, setIntensity] = useState('medium');

  const [recipes, setRecipes] = useState([]);
  const [plan, setPlan] = useState([]);
  const [mpReady, setMpReady] = useState(false);
  const [planningId, setPlanningId] = useState(null);
  const [linksTick, setLinksTick] = useState(0);
  const weekStart = weekStartFor();

  const patterns = useMemo(() => cravingPatterns(), [log]);
  const stockList = useMemo(() => stockAheadList(), [log]);
  const trackingView = useMemo(() => cravingTrackingView(), [log, linksTick]);
  const summary = useMemo(() => cravingTrackingSummary(), [log, linksTick]);

  // Load the recipe pool + this week's plan the same way Weekly Meal Plan
  // bootstraps it (load existing, or generate + save one) — so planning a
  // craving here lands in the exact same week that page shows, regardless of
  // which page was opened first.
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
      setMpReady(true);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setLog(logCraving({ text, lifeStage, intensity }));
    setText('');
  }

  function removeEntry(id) {
    setLog(removeCravingEntry(id));
    if (planningId === id) setPlanningId(null);
  }

  function togglePlan(id) {
    setPlanningId((cur) => (cur === id ? null : id));
  }

  function handlePlaced(id, nextPlan) {
    setPlan(nextPlan);
    saveWeekPlan(weekStart, nextPlan);
    setLinksTick((t) => t + 1);
    setPlanningId(null);
  }

  function handleMarkMade(id) {
    markCravingFulfilled(id);
    setLinksTick((t) => t + 1);
  }

  function openRecipe(recipeId) {
    const recipe = recipes.find((r) => (r.id ?? r.name) === recipeId);
    if (!recipe) return;
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.removeItem('dig_in_full_recipe_adapt');
    } catch { /* ignore */ }
    navigate('/recipe');
  }

  return (
    <div className="ct-page">
      {!embedded && <Nav />}
      <div className="ct-wrap">
        {!embedded && <button className="ct-back" onClick={() => navigate(-1)}>← Back</button>}

        <header className="ct-head">
          <p className="ct-eyebrow">The Craving Tracker</p>
          <h1 className="ct-title">Keep the pantry ready before the craving is.</h1>
          <p className="ct-sub">
            Log what you're reaching for. Once something keeps showing up, Nova remembers your
            flavor palette and starts telling you what's worth keeping stocked — the way a
            well-kept kitchen anticipates what the household needs.
          </p>
        </header>

        {/* Log form */}
        <section className="ct-section ct-log-form">
          <div className="ct-section-title">What are you craving?</div>
          <form onSubmit={submit}>
            <input
              className="ct-input"
              placeholder="e.g. something sour, a pickle, my grandmother's stew…"
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <div className="ct-form-row">
              <label className="ct-form-field">
                <span>Life stage</span>
                <select className="ct-select" value={lifeStage} onChange={e => setLifeStage(e.target.value)}>
                  {LIFE_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </label>
              <label className="ct-form-field">
                <span>How strong</span>
                <select className="ct-select" value={intensity} onChange={e => setIntensity(e.target.value)}>
                  {INTENSITIES.map(i => <option key={i} value={i}>{i[0].toUpperCase() + i.slice(1)}</option>)}
                </select>
              </label>
            </div>
            <button type="submit" className="ct-submit">Log this craving</button>
          </form>
        </section>

        {/* Patterns Nova has noticed */}
        {patterns.length > 0 && (
          <section className="ct-section">
            <div className="ct-section-title">What Nova's noticed</div>
            <div className="ct-patterns">
              {patterns.map(p => (
                <span className="ct-pattern-chip" key={p.flavor}>
                  {FLAVOR_LABEL[p.flavor] || p.flavor} · logged {p.count}×
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Stock-ahead — the homestead payoff */}
        {stockList.length > 0 && (
          <section className="ct-section ct-stock">
            <div className="ct-section-title">Keep the pantry stocked</div>
            <p className="ct-stock-sub">Have these on hand, so next time the craving hits, it's already covered.</p>
            <div className="ct-stock-grid">
              {stockList.map(s => (
                <div className="ct-stock-card" key={s.flavor}>
                  <div className="ct-stock-flavor">{FLAVOR_LABEL[s.flavor] || s.flavor}</div>
                  <ul className="ct-stock-items">
                    {s.items.map(item => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent log — now with the full logged → planned → made loop */}
        {log.length > 0 && (
          <section className="ct-section">
            <div className="ct-section-title-row">
              <div className="ct-section-title">Your recent cravings</div>
              {summary.total > 0 && (
                <div className="ct-summary-pills">
                  <span className="ct-summary-pill">{summary.logged} logged</span>
                  <span className="ct-summary-pill ct-summary-planned">{summary.planned} planned</span>
                  <span className="ct-summary-pill ct-summary-made">{summary.made} made</span>
                </div>
              )}
            </div>
            <div className="ct-log-list">
              {trackingView.slice(0, 15).map((entry) => (
                <LogEntryRow
                  key={entry.id}
                  entry={entry}
                  recipes={recipes}
                  plan={plan}
                  weekStart={weekStart}
                  mpReady={mpReady}
                  planning={planningId === entry.id}
                  onTogglePlan={togglePlan}
                  onPlaced={handlePlaced}
                  onMarkMade={handleMarkMade}
                  onRemove={removeEntry}
                  onOpenRecipe={openRecipe}
                />
              ))}
            </div>
          </section>
        )}

        {/* Maternal cravings reference */}
        <section className="ct-section ct-maternal">
          <div className="ct-section-title">Cravings during pregnancy & postpartum</div>
          <div className="ct-maternal-grid">
            {MATERNAL_PATTERNS.map(p => (
              <div className="ct-maternal-card" key={p.id}>
                <div className="ct-maternal-label">{p.label}</div>
                <p className="ct-maternal-note">{p.note}</p>
              </div>
            ))}
          </div>
          <p className="ct-maternal-disclaimer">{MATERNAL_NOTE}</p>
        </section>
      </div>
    </div>
  );
}
