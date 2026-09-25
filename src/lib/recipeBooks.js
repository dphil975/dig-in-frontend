/* recipeBooks — lazy, cached loader for the recipe "books" (public/data/
   recipes_full.json). Shared by Ask Nova retrieval and anything else that needs
   to search the full 575-recipe corpus without bundling it. */

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
