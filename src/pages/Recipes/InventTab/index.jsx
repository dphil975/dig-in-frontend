import { useState } from 'react';
import RecipeAlchemist from '../../../components/recipe/RecipeAlchemist';
import HealthyBaseBuilder from '../../../components/recipe/HealthyBaseBuilder';
import BuildBar from '../BuildBar';
import './InventTab.css';

/* InventTab — the Recipes hub's home for "generate a dish from nothing," as
   opposed to RecipeTransformPanel's "reshape a recipe you already have" on
   RecipeFull. Three from-scratch tools that used to be scattered across the
   retired Kitchen Lab: Kitchen Alchemist (RecipeAlchemist — describe a craving
   OR list your ingredients, invent the dish; the former standalone AI Recipe
   Helper page merged into it as a second mode), the old HealthifyLab's "Build
   a Healthy Base" mode (now HealthyBaseBuilder), and BuildBar's watch-it-get-
   made salad/pizza/pasta builder. */

const MODES = [
  { id: 'alchemist', label: 'Kitchen Alchemist' },
  { id: 'healthy-base', label: 'Build a Healthy Base' },
  { id: 'build-bar', label: 'Build It & Watch It Happen' },
];

export default function InventTab({ initialAlchemistMode } = {}) {
  const [mode, setMode] = useState('alchemist');
  return (
    <div className="inv-tab">
      <div className="inv-modes">
        {MODES.map(m => (
          <button
            key={m.id}
            type="button"
            className={`inv-mode-btn${mode === m.id ? ' active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      {mode === 'alchemist' && <RecipeAlchemist initialMode={initialAlchemistMode} />}
      {mode === 'healthy-base' && <HealthyBaseBuilder />}
      {mode === 'build-bar' && <BuildBar embedded />}
    </div>
  );
}
