/* routeLoaders.js — how each top-level page chunk is loaded, in one place.

   The router lazy-loads these pages. The sidebar (and the "Cook with Nova"
   button) also call `prefetchRoute` the moment someone reaches for a link, so by
   the time the click lands the chunk is usually already here and the page opens
   without a pause. Importing the same specifier twice costs nothing: the browser
   fetches the chunk once. */

export const loaders = {
  welcome: () => import('../pages/Welcome'),
  nova: () => import('../pages/Nova'),
  nest: () => import('../pages/Nova/Nest'),
  recipes: () => import('../pages/RecipeCards'),
  recipe: () => import('../pages/RecipeFull'),
  discover: () => import('../pages/Discover'),
  profile: () => import('../pages/Profile'),
  settings: () => import('../pages/Settings'),
};

// The sidebar's entries, by id, and the page each one opens.
const FOR_TAB = { nova: 'nova', recipes: 'recipes', discover: 'discover', profile: 'profile', settings: 'settings' };

const warmed = new Set();

/** Start loading a page chunk in the background. Polite: skipped when the device
    asks to save data or is on a very slow connection. */
export function prefetchRoute(key) {
  const name = FOR_TAB[key] || key;
  if (!loaders[name] || warmed.has(name)) return;
  const c = typeof navigator !== 'undefined' ? navigator.connection : null;
  if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))) return;
  warmed.add(name);
  loaders[name]().catch(() => warmed.delete(name));
}
