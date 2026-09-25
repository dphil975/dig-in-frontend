import { useState } from 'react';
import DescribeMode from './DescribeMode';
import IngredientsMode from './IngredientsMode';
import './RecipeAlchemist.css';

/* RecipeAlchemist — "Kitchen Alchemist," the Recipes hub's from-scratch AI
   recipe generator. Two ways in, one tool:

     · Describe It      — type a craving or a restaurant dish, get an invented
                           recipe paired into a full meal.
     · From Ingredients  — say what's in your fridge, get a recipe built
                           around it, with step-by-step photo-check coaching.

   "From Ingredients" is the former standalone AI Recipe Helper page
   (/recipe-ai) — same tool, same job, merged in here as a mode instead of a
   separate Recipes-hub tab, since both are really "invent me a dish" with
   different starting points. Split into DescribeMode.jsx / IngredientsMode.jsx
   so each stays readable; this file is just the shared header + the switch
   between them, and RecipeAlchemist.css is the one stylesheet both draw from,
   so switching modes never jumps visual language.

   `initialMode` lets a caller land a visitor directly on a mode — used for the
   /recipe-ai legacy alias (see Recipes/index.jsx). */
export default function RecipeAlchemist({ initialMode = 'describe' } = {}) {
  const [mode, setMode] = useState(initialMode === 'ingredients' ? 'ingredients' : 'describe');

  return (
    <section className="alch">
      <div className="alch-inner">
        <div className="alch-head">
          <p className="alch-eyebrow">KITCHEN ALCHEMIST · TURN ANYTHING INTO A RECIPE</p>
        </div>

        <div className="alch-switch-wrap">
          <div className="alch-switch" role="tablist" aria-label="Kitchen Alchemist mode">
            <button
              type="button" role="tab" aria-selected={mode === 'describe'}
              className={`alch-switch-btn${mode === 'describe' ? ' active' : ''}`}
              onClick={() => setMode('describe')}
            >
              ✍️ Describe It
            </button>
            <button
              type="button" role="tab" aria-selected={mode === 'ingredients'}
              className={`alch-switch-btn${mode === 'ingredients' ? ' active' : ''}`}
              onClick={() => setMode('ingredients')}
            >
              🧊 From Ingredients
            </button>
          </div>
        </div>

        {mode === 'describe' ? <DescribeMode /> : <IngredientsMode />}
      </div>
    </section>
  );
}
