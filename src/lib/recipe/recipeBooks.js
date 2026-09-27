/* ════════════════════════════════════════════════════════════════════════
   recipeBooks — lazy, cached loader for the recipe "books"
   (public/data/recipes_full.json). Shared by Ask Nova retrieval, Nova's
   homepage picks and anything else that needs to search the full corpus
   without bundling it.

   Split out of recipeAlchemist.js (where it had been merged): the alchemist is
   ~50 KB of generation logic, and anything that only needed the recipe list
   was loading all of it.
   ════════════════════════════════════════════════════════════════════════ */

let _promise = null;

export function loadRecipeBooks() {
  if (!_promise) {
    _promise = fetch('/data/recipes_full.json')
      .then(r => (r.ok ? r.json() : { recipes: [] }))
      .then(d => (Array.isArray(d) ? d : (d.recipes || [])))
      .catch(() => []);
  }
  return _promise;
}
