/* condimentsDIY.js — "Content. Rides on the pantry engine you have."

   Real condiment and dip recipes, cross-checked against your ACTUAL pantry
   using the same matcher pantryTools.js's suggestRecipes() already uses
   (itemCoversIngredient) — not a second, parallel matching algorithm. This
   file supplies the recipes; pantryTools.js still owns what "you have it"
   means. Same DIY-beats-the-brand thesis as hydrationDIY.js and Copycat Lab,
   pointed at the condiment aisle instead. */

import { itemCoversIngredient } from '../pantryTools';

export const RECIPES = [
  {
    id: 'mayo',
    name: 'Mayonnaise',
    ingredients: ['1 egg yolk', '1 cup neutral oil', '1 tsp dijon mustard', '1 tsp lemon juice or vinegar', 'salt'],
    method: 'Whisk the yolk, mustard, and a splash of the acid together first. Then add the oil in a very thin, slow stream while whisking constantly — this is the whole trick, an emulsion breaks if the oil goes in too fast. Salt to taste.',
    storeRef: { name: 'Store mayo (30oz jar)', cost: 5, servings: 45 },
    diyCost: 1.25,
  },
  {
    id: 'ranch',
    name: 'Ranch Dressing',
    ingredients: ['1/2 cup mayonnaise', '1/2 cup buttermilk or milk + a splash of vinegar', '1 tsp garlic powder', '1 tsp onion powder', '1 tbsp fresh or dried dill', '1 tbsp chives', 'salt', 'pepper'],
    method: 'Whisk everything together. Thins with a little more milk if you want it pourable instead of a dip.',
    storeRef: { name: 'Store ranch (24oz bottle)', cost: 4, servings: 24 },
    diyCost: 1.5,
  },
  {
    id: 'ketchup',
    name: 'Ketchup',
    ingredients: ['6 oz tomato paste', '1/4 cup water', '3 tbsp vinegar', '2 tbsp sugar or honey', '1/2 tsp salt', 'pinch of garlic powder', 'pinch of onion powder'],
    method: 'Whisk everything together over low heat for a couple minutes until it comes together and thickens slightly. Cool before using.',
    storeRef: { name: 'Store ketchup (20oz bottle)', cost: 3.5, servings: 40 },
    diyCost: 1.0,
  },
  {
    id: 'hummus',
    name: 'Hummus',
    ingredients: ['1 can chickpeas', '1/4 cup tahini', '2 tbsp lemon juice', '1 clove garlic', '2 tbsp olive oil', '1/2 tsp cumin', 'salt', 'water to thin'],
    method: 'Blend everything until smooth, adding water a tablespoon at a time until it\'s the texture you want.',
    storeRef: { name: 'Store hummus (10oz tub)', cost: 4, servings: 8 },
    diyCost: 2.0,
  },
  {
    id: 'tzatziki',
    name: 'Tzatziki',
    ingredients: ['1 cup greek yogurt', '1/2 cucumber, grated and squeezed dry', '1 clove garlic', '1 tbsp fresh dill', '1 tbsp lemon juice', '1 tbsp olive oil', 'salt'],
    method: 'Squeeze as much water out of the grated cucumber as you can (this is the step people skip, and the one that keeps it from going watery). Stir everything together.',
    storeRef: { name: 'Store tzatziki (12oz tub)', cost: 4.5, servings: 10 },
    diyCost: 2.5,
  },
  {
    id: 'salsa',
    name: 'Fresh Salsa',
    ingredients: ['4 tomatoes, diced', '1/2 onion, diced', '1 jalapeño, minced', 'handful cilantro', '1 lime, juiced', 'salt'],
    method: 'Combine everything, taste, adjust salt and lime. Better after it sits 20 minutes.',
    storeRef: { name: 'Store salsa (16oz jar)', cost: 4, servings: 16 },
    diyCost: 1.5,
  },
  {
    id: 'guacamole',
    name: 'Guacamole',
    ingredients: ['3 ripe avocados', '1 lime, juiced', '1/4 onion, minced', 'handful cilantro', '1 jalapeño, minced (optional)', 'salt'],
    method: 'Mash the avocado to your preferred texture, fold in everything else.',
    storeRef: { name: 'Store guac (8oz tub)', cost: 4, servings: 6 },
    diyCost: 3.5,
  },
  {
    id: 'pesto',
    name: 'Basil Pesto',
    ingredients: ['2 cups fresh basil', '1/3 cup pine nuts or walnuts', '1/2 cup parmesan, grated', '2 cloves garlic', '1/2 cup olive oil', 'salt'],
    method: 'Blend the basil, nuts, garlic, and cheese, then stream in the olive oil while blending until smooth.',
    storeRef: { name: 'Store pesto (6.7oz jar)', cost: 5, servings: 8 },
    diyCost: 3.0,
  },
  {
    id: 'honey-mustard',
    name: 'Honey Mustard',
    ingredients: ['1/2 cup mayonnaise', '3 tbsp dijon mustard', '2 tbsp honey', 'squeeze of lemon'],
    method: 'Whisk together. Adjust honey vs. mustard to taste.',
    storeRef: { name: 'Store honey mustard (12oz bottle)', cost: 4, servings: 20 },
    diyCost: 1.5,
  },
  {
    id: 'bbq-sauce',
    name: 'BBQ Sauce',
    ingredients: ['1 cup ketchup', '2 tbsp brown sugar', '2 tbsp vinegar', '1 tbsp worcestershire sauce', '1 tsp smoked paprika', 'pinch of cayenne'],
    method: 'Whisk everything together over low heat for 5 minutes until it thickens slightly.',
    storeRef: { name: 'Store BBQ sauce (18oz bottle)', cost: 4, servings: 24 },
    diyCost: 1.75,
  },
];

/** How much of one recipe's real ingredient list your real pantry already
    covers — the SAME matcher pantryTools.js's own recipe suggestions use, so
    "you have 4 of 5" here means exactly what it means everywhere else in
    this app. */
export function pantryMatchFor(recipe, pantryItems = []) {
  const names = pantryItems.map((i) => i.name).filter(Boolean);
  const have = [];
  const missing = [];
  for (const ing of recipe.ingredients) {
    const covered = names.some((n) => itemCoversIngredient(n, ing));
    (covered ? have : missing).push(ing);
  }
  return { have, missing, coverage: recipe.ingredients.length ? have.length / recipe.ingredients.length : 0 };
}

/** Every recipe, ranked by real pantry coverage first (what you're already
    equipped to make right now leads). */
export function rankByPantry(pantryItems = []) {
  return RECIPES
    .map((r) => ({ recipe: r, match: pantryMatchFor(r, pantryItems) }))
    .sort((a, b) => b.match.coverage - a.match.coverage);
}

export function savingsFor(recipe) {
  const storePerServing = recipe.storeRef.cost / recipe.storeRef.servings;
  // DIY batch assumed to yield roughly the same serving count as the store
  // reference container, so the per-serving comparison is apples to apples.
  const diyPerServing = recipe.diyCost / recipe.storeRef.servings;
  return {
    storePerServing: Math.round(storePerServing * 100) / 100,
    diyPerServing: Math.round(diyPerServing * 100) / 100,
    savedPct: Math.round((1 - diyPerServing / storePerServing) * 100),
  };
}

export const SAVINGS_NOTE =
  'Rough, real-world estimates from typical grocery prices, not a quote for your store specifically — the point is the shape of the gap, which holds pretty consistently across condiments.';
