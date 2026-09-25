import { useState, useCallback } from 'react';
import {
  getSavedRecipes,
  saveRecipe,
  unsaveRecipe,
  isSaved,
  toggleSave,
  logCookedRecipe,
  getCookingStats,
} from '../services/saveService';

export function useSave() {
  const [saved, setSaved] = useState(() => getSavedRecipes());

  const refresh = useCallback(() => { setSaved(getSavedRecipes()); }, []);

  const save = useCallback((recipe) => {
    const ok = saveRecipe(recipe);
    if (ok) setSaved(getSavedRecipes());
    return ok;
  }, []);

  const unsave = useCallback((recipe) => {
    unsaveRecipe(recipe);
    setSaved(getSavedRecipes());
  }, []);

  const toggle = useCallback((recipe) => {
    toggleSave(recipe);
    setSaved(getSavedRecipes());
  }, []);

  const logCooked = useCallback((id) => { logCookedRecipe(id); }, []);

  return {
    saved,
    isSaved: (recipe) => isSaved(recipe),
    save,
    unsave,
    toggle,
    refresh,
    logCooked,
    stats: getCookingStats(),
  };
}
