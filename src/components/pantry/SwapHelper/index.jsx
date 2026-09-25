import { useState, useMemo } from 'react';
import { SWAP_QUESTIONS, alternativesFor } from '../../../lib/ingredientSwap';
import { RECIPE_INGREDIENTS, RECIPES_STATIC } from '../../../data/recipesStatic';
import { categorizeShelf, categoryById } from '../../../lib/pantryCategories';
import { categoryIconUrl } from '../../../lib/pantryPixelIcons';
import './SwapHelper.css';

/* SwapHelper — the answer to "they're out of it."

   Before this, "Can't find it" recorded a miss and moved on, which is the
   exact moment a person abandons the recipe and leaves with nothing. Now it
   asks five questions and gives a real answer.

   The five are not a personality quiz. Four are the cook's intent (flavor,
   protein, fiber, carb) and the FIRST is cooking method — which isn't a
   preference at all, it's the constraint that decides whether a swap
   physically survives the pan. Asking it first is what stops this from
   recommending raw-only lettuce for something about to be roasted.

   Every card shows its real numbers and says when a swap does NOT serve the
   goal that was just asked for. That last part is the whole credibility of
   the feature: a recommender that only ever tells you good news isn't giving
   you information, it's giving you a sales pitch.

   Answering is optional at every step — "Skip, just show me anything close"
   exits to unfiltered results, because someone standing in an aisle with a
   cart may not want five questions, and making them mandatory would turn
   help into a toll. */

function RecipePivot({ label }) {
  // Real recipes from the corpus that genuinely use the substitute — the
  // "you had to change it, so here's what that change unlocks" moment.
  const matches = useMemo(() => {
    const needle = label.toLowerCase().split(/[\s,(]/)[0];
    if (needle.length < 3) return [];
    const ids = Object.entries(RECIPE_INGREDIENTS)
      .filter(([, list]) => list.some(i => i.toLowerCase().includes(needle)))
      .map(([id]) => Number(id));
    return RECIPES_STATIC.filter(r => ids.includes(r.id)).slice(0, 3);
  }, [label]);

  if (!matches.length) return null;

  return (
    <div className="swp-pivot">
      <p className="swp-pivot-head">Since you're buying {label.toLowerCase()} anyway</p>
      <ul className="swp-pivot-list">
        {matches.map(r => (
          <li key={r.id} className="swp-pivot-item">
            <strong>{r.name}</strong>
            <span>{[r.difficulty, r.prepTime != null && `${r.prepTime + (r.cookTime || 0)} min`].filter(Boolean).join(' · ')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AltCard({ alt, onPick }) {
  const { ingredient: ing, compare } = alt;
  /* Deliberately no per-card pixel art here. The art is CATEGORY-level, so a
     list of four same-aisle vegetables rendered four identical baskets — pure
     visual noise that read as a rendering bug. The shelf is shown once above
     the list instead, where it's actually useful ("they're all in Produce").
     The hunt cards in StoreRun still use the art, where it identifies one
     item and points at an aisle. */
  return (
    <li className={`swp-alt swp-alt-${alt.tier}`}>
      <div className="swp-alt-top">
        <div className="swp-alt-id">
          <p className="swp-alt-name">{ing.label}</p>
          <p className="swp-alt-serving">per {ing.serving}</p>
        </div>
        {alt.tier === 'stretch' && <span className="swp-tag">changes the dish</span>}
        {alt.tier === 'exact' && <span className="swp-tag swp-tag-best">closest match</span>}
      </div>

      <p className="swp-alt-reason">{alt.reason}</p>

      <dl className="swp-macros">
        {['calories', 'protein', 'fiber', 'carbs'].map(k => {
          const d = compare.deltas[k];
          const dir = d > 0 ? 'up' : d < 0 ? 'down' : 'same';
          return (
            <div key={k} className={`swp-macro swp-macro-${dir}`}>
              <dt>{k === 'calories' ? 'cal' : k}</dt>
              <dd>
                {ing[k]}{k === 'calories' ? '' : 'g'}
                <span className="swp-delta">
                  {d > 0 ? `+${d}` : d < 0 ? `${d}` : '±0'}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>

      <RecipePivot label={ing.label} />

      <button type="button" className="swp-pick" onClick={() => onPick(ing)}>
        Get {ing.label} instead
      </button>
    </li>
  );
}

export default function SwapHelper({ itemName, onSwap, onClose }) {
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState({});
  const [done, setDone] = useState(false);

  const result = useMemo(
    () => (done ? alternativesFor(itemName, goals) : null),
    [done, itemName, goals],
  );

  function answer(id, value) {
    const next = { ...goals, [id]: value };
    setGoals(next);
    if (step + 1 >= SWAP_QUESTIONS.length) setDone(true);
    else setStep(step + 1);
  }

  const q = SWAP_QUESTIONS[step];

  return (
    <div className="swp-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="swp-modal" role="dialog" aria-label={`Alternatives for ${itemName}`}>
        <header className="swp-head">
          <div>
            <p className="swp-kicker">CAN'T FIND IT</p>
            <h2 className="swp-title">{itemName}</h2>
          </div>
          <button type="button" className="swp-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        {!done ? (
          <div className="swp-quiz">
            <div className="swp-steps" aria-hidden="true">
              {SWAP_QUESTIONS.map((_, i) => (
                <span key={i} className={`swp-step${i <= step ? ' on' : ''}`} />
              ))}
            </div>
            <p className="swp-qnum">Question {step + 1} of {SWAP_QUESTIONS.length}</p>
            <h3 className="swp-q">{q.q}</h3>
            <p className="swp-qhelp">{q.help}</p>

            <div className="swp-options">
              {q.options.map(o => (
                <button key={o.id} type="button" className="swp-option" onClick={() => answer(q.id, o.id)}>
                  {o.label}
                </button>
              ))}
            </div>

            <button type="button" className="swp-skip" onClick={() => setDone(true)}>
              Skip the questions — just show me anything close
            </button>
          </div>
        ) : result.unknown ? (
          <div className="swp-unknown">
            <p>
              We don't have real nutrition data on <strong>{itemName}</strong>, so we're not going to
              guess at a substitute for it.
            </p>
            <p className="swp-unknown-sub">
              Ask someone in the store, or mark it missing and carry on — the run doesn't punish you for it.
            </p>
            <button type="button" className="swp-pick" onClick={onClose}>Back to the run</button>
          </div>
        ) : (
          <div className="swp-results">
            <p className="swp-results-head">
              {result.alternatives.length} option{result.alternatives.length === 1 ? '' : 's'} that
              {goals.method && goals.method !== 'any' ? ' hold up the way you\'re cooking it' : ' work here'}
            </p>
            {/* Where to walk. When every option shares one shelf, that's the
                single most useful thing we can say to someone mid-aisle. */}
            {(() => {
              const shelves = [...new Set(result.alternatives.map(a => categorizeShelf(a.ingredient.label).id))];
              if (shelves.length !== 1) return null;
              const shelf = categoryById(shelves[0]);
              return (
                <p className="swp-shelf">
                  <img src={categoryIconUrl(shelf.id)} alt="" aria-hidden="true" />
                  All on the <strong>{shelf.label}</strong> shelf
                </p>
              );
            })()}
            <ul className="swp-alts">
              {result.alternatives.map(a => (
                <AltCard key={a.ingredient.id} alt={a} onPick={ing => onSwap(ing.label)} />
              ))}
            </ul>
            <p className="swp-disclaimer">{result.disclaimer}</p>
            <button type="button" className="swp-redo" onClick={() => { setStep(0); setGoals({}); setDone(false); }}>
              Answer the questions again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
