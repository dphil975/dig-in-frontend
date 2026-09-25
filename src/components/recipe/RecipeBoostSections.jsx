import { VEGGIE_BOOSTS, ADAPTATIONS } from '../../data/recipeBoosts';
import { getSensoryCues } from '../../data/cookingScience';

export function ingredientText(ing) {
  return typeof ing === 'object' ? (ing.text || ing.name || '') : ing;
}

const SENSE_LABEL = { sight: 'LOOK', smell: 'SMELL', taste: 'TASTE' };

/* Cooking-science doneness cues — what to look, smell, and taste for. */
export function SensoryCues({ recipe }) {
  const cues = getSensoryCues(recipe);
  if (!cues.length) return null;
  return (
    <div className="rd-section">
      <div className="rd-title">TRUST YOUR SENSES</div>
      <p className="rd-sub">How to tell it's done — taste, smell, and sight matter more than the clock.</p>
      <div className="rd-senses">
        {cues.map(c => (
          <div key={c.sense} className={`rd-sense rd-sense-${c.sense}`}>
            <span className="rd-sense-label">{SENSE_LABEL[c.sense]}</span>
            <span className="rd-sense-text">{c.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function adaptLabel(key) {
  return key.startsWith('+')
    ? 'Add ' + key.replace('+', '').trim().toLowerCase()
    : key.charAt(0) + key.slice(1).toLowerCase();   // "LOWER CARBS" → "Lower carbs"
}

// Human-readable list of the changes a user has chosen (veggies + adaptations).
export function changesList(addedVeggies, adaptations) {
  return [...addedVeggies, ...[...adaptations].map(adaptLabel)];
}

// Merge the user's veggie additions + adaptations into the recipe's steps.
export function applyAdaptations(baseSteps, addedVeggies, adaptations) {
  const steps = [...(baseSteps || [])];
  for (const name of addedVeggies) {
    const v = VEGGIE_BOOSTS.find(x => x.name === name);
    if (v) steps.push(`Add ${v.name}: ${v.tip}.`);
  }
  for (const key of adaptations) {
    const a = ADAPTATIONS.find(x => x.key === key);
    if (a) steps.push(`${adaptLabel(key)}: ${a.tips[0]}.`);
  }
  return steps;
}

/* Toggle placed right before the steps: "Do you want to change the recipe?"
   When on, the user's changes get woven into the steps below. */
export function ChangeRecipeToggle({ on, count, onToggle }) {
  return (
    <div className={`rd-change${on ? ' on' : ''}`}>
      <div className="rd-change-text">
        <div className="rd-change-q">Do you want to change the recipe?</div>
        <div className="rd-change-sub">
          {count > 0
            ? (on
                ? `${count} change${count !== 1 ? 's' : ''} woven into the steps below`
                : `Apply your ${count} change${count !== 1 ? 's' : ''} to the recipe`)
            : 'Add veggies or an adaptation above first'}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className={`rd-switch${on ? ' on' : ''}`}
        onClick={onToggle}
        disabled={count === 0}
      >
        <span className="rd-switch-knob" />
      </button>
    </div>
  );
}

/* "What are you missing?" — tap ingredients you don't have → shopping list */
export function MissingIngredients({ ings, missing, onToggle }) {
  if (!ings.length) return null;
  const have = missing.size === 0;
  return (
    <div className="rd-section">
      <div className="rd-title">WHAT ARE YOU MISSING?</div>
      <p className="rd-sub">Tap any ingredient you don't have. We'll build your shopping list with the cheapest options nearby.</p>
      <div className="rd-ings">
        {ings.map((ing, i) => (
          <button key={i} className={`rd-ing${missing.has(i) ? ' missing' : ''}`} onClick={() => onToggle(i)}>
            <span className="rd-ing-mark">{missing.has(i) ? '+' : '✓'}</span>
            <span>{ing}</span>
          </button>
        ))}
      </div>
      <div className={`rd-list-note${have ? ' ok' : ''}`}>
        {have
          ? 'You have everything — ready to cook!'
          : `${missing.size} ingredient${missing.size !== 1 ? 's' : ''} added to your shopping list`}
      </div>
    </div>
  );
}

/* "Boost with veggies" — tap a veggie to add it to the shopping list */
export function VeggieBoost({ added, onToggle }) {
  return (
    <div className="rd-section">
      <div className="rd-title">BOOST WITH VEGGIES</div>
      <p className="rd-sub">Most people don't eat enough vegetables. Tap to add any of these — most cost under $1 at any corner store.</p>
      <div className="rd-veggies">
        {VEGGIE_BOOSTS.map(v => (
          <button key={v.name} className={`rd-veggie${added.has(v.name) ? ' added' : ''}`} onClick={() => onToggle(v.name)}>
            <div className="rd-veggie-top">
              <span className="rd-veggie-name">{v.name}</span>
              <span className="rd-veggie-add">{added.has(v.name) ? 'ADDED' : '+ ADD'}</span>
            </div>
            <div className="rd-veggie-tip">{v.tip}</div>
            <div className="rd-veggie-benefit">{v.benefit}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* "Adapt this recipe" — +PROTEIN / +FIBER / LOWER CARBS with swap tips */
export function AdaptRecipe({ active, onToggle }) {
  return (
    <div className="rd-section">
      <div className="rd-title">ADAPT THIS RECIPE</div>
      <div className="rd-adapt-btns">
        {ADAPTATIONS.map(a => (
          <button key={a.key} className={`rd-adapt-btn${active.has(a.key) ? ' active' : ''}`} onClick={() => onToggle(a.key)}>
            {a.key}
          </button>
        ))}
      </div>
      {ADAPTATIONS.filter(a => active.has(a.key)).map(a => (
        <div key={a.key} className="rd-adapt-tips">
          <div className="rd-adapt-tips-head">{a.key}</div>
          <ul>{a.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}
