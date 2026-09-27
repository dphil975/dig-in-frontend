/* quadrants.js — the four ways people cook, as a grid:

                      Daily            Special
       Solo      Nova (weeknight)   Celebration (a treat, a project)
       Shared    Family (a table)   Crowd (a gathering)

   The welcome questions place you in one of them (onboarding.quadrantFor), and
   the Recipes page starts there. Recipes carry no quadrant of their own, so this
   sorts them by portion size and effort — a heuristic, honestly: anything can be
   rescaled on its recipe page.

     shared    makes 6 or more servings
     special   a dessert, a Hard recipe, or 90+ minutes */

export const QUADRANTS = [
  { id: 'nova',        label: 'Nova',        who: 'Solo',   when: 'Daily',   blurb: 'Weeknight food for one' },
  { id: 'family',      label: 'Family',      who: 'Shared', when: 'Daily',   blurb: 'Everyday dinners for a table' },
  { id: 'celebration', label: 'Celebration', who: 'Solo',   when: 'Special', blurb: 'A treat, or a project worth doing' },
  { id: 'crowd',       label: 'Crowd',       who: 'Shared', when: 'Special', blurb: 'Feed a gathering' },
];

const minutesOf = (r) => r.total_time || r.totalTime || r.time || ((r.prepTime || 0) + (r.cookTime || 0)) || 0;

export function quadrantOf(recipe) {
  const shared = (Number(recipe.servings) || 4) >= 6;
  const special = /dessert/i.test(recipe.recipe_type || '')
    || /hard/i.test(recipe.difficulty || '')
    || minutesOf(recipe) >= 90;
  if (shared) return special ? 'crowd' : 'family';
  return special ? 'celebration' : 'nova';
}
