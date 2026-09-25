/* dietMatch.js — one honest source for "does this recipe fit this diet?" and,
   for the picky eaters, "how do I get the nutrient without tasting the veg?"

   The diet exclusions mirror the set RecipeCards has used inline (see its
   DIET_EXCLUDE) — pulled into a leaf module so the Spend Planner and anything
   else can reason about diets without duplicating (or drifting from) that list.

   Honesty: an ingredient list we can't read makes NO diet claim — an empty
   ingredient array returns no tags, so a recipe is never wrongly called vegan or
   gluten-free just because we couldn't see what's in it. */

// Ingredients that disqualify a recipe from each diet tag.
export const DIET_EXCLUDE = {
  'vegan':       ['butter', 'milk', 'cream', 'cheese', 'egg', 'honey', 'gelatin', 'pork', 'chicken', 'beef', 'fish', 'lamb', 'turkey', 'lard', 'meat', 'tuna', 'salmon', 'shrimp', 'bacon', 'ham', 'yogurt', 'dashi', 'bonito', 'mayo'],
  'vegetarian':  ['pork', 'chicken', 'beef', 'fish', 'lamb', 'turkey', 'gelatin', 'lard', 'meat', 'tuna', 'salmon', 'shrimp', 'anchovy', 'bacon', 'ham', 'dashi', 'bonito'],
  'dairy-free':  ['butter', 'milk', 'cream', 'cheese', 'yogurt', 'mayo'],
  'nut-free':    ['almond', 'peanut', 'cashew', 'walnut', 'pecan', 'hazelnut', 'pistachio'],
};
// Note: gluten-free is intentionally NOT auto-asserted here — see the same
// safety call in structuredTags.js. A false GF claim is an allergy hazard, and
// free-text ingredient scanning can't clear that bar. The real gluten work
// stays with the allergy/transform tools.

export const DIET_LABEL = {
  'vegetarian': 'Vegetarian',
  'vegan': 'Vegan',
  'dairy-free': 'Dairy-free',
  'nut-free': 'Nut-free',
};

function ingredientText(recipe) {
  return (recipe?.ingredients || [])
    .map((i) => (typeof i === 'object' ? (i.text || i.name || '') : i))
    .join(' ')
    .toLowerCase();
}

/** Which diet tags a recipe honestly qualifies for. Empty list if we can't read
    its ingredients (never a false claim). */
export function dietTagsFor(recipe) {
  const text = ingredientText(recipe);
  if (!text.trim()) return [];
  return Object.entries(DIET_EXCLUDE)
    .filter(([, excl]) => !excl.some((k) => text.includes(k)))
    .map(([tag]) => tag);
}

/** Does a recipe meet EVERY restriction in the list? No restrictions → always. */
export function meetsDiet(recipe, restrictions = []) {
  if (!restrictions.length) return true;
  const tags = dietTagsFor(recipe);
  return restrictions.every((r) => tags.includes(r));
}

/* ── Picky eaters deserve love too ────────────────────────────────────────
   You don't have to learn to like the vegetable to get what it gives you. Each
   entry is a real way to keep the nutrient and lose the part you hate — the
   texture, the color, the bite — so eating stays a good time. */
export const VEGGIE_HIDES = [
  { match: /spinach|kale|chard|collard|\bgreens\b/, veg: 'leafy greens',
    tip: 'Blend into a red pasta sauce, a fruit smoothie, or pesto. The color disappears under tomato or garlic and so does the taste — you still get the iron and folate.' },
  { match: /cauliflower/, veg: 'cauliflower',
    tip: 'Pulse it to "rice" and fold into fried rice or mac & cheese. It reads as texture, not vegetable — fiber and vitamin C along for the ride.' },
  { match: /zucchini|courgette/, veg: 'zucchini',
    tip: 'Grate it, squeeze it dry, and fold into muffins, meatballs, or pasta sauce. It melts in — moisture and potassium, no green.' },
  { match: /\bcarrot/, veg: 'carrots',
    tip: 'Purée into tomato or pasta sauce for natural sweetness, or grate fine into meatloaf and burgers. Beta-carotene, invisibly.' },
  { match: /mushroom/, veg: 'mushrooms',
    tip: 'Mince very fine and cook down 50/50 with ground meat. You won\'t find the pieces — just a deeper, meatier flavor plus the B vitamins.' },
  { match: /beet/, veg: 'beets',
    tip: 'Roast and blend into chocolate cake or a berry smoothie. Earthy-sweet vanishes into the cocoa/berries — folate and nitrates stay.' },
  { match: /broccoli/, veg: 'broccoli',
    tip: 'Chop into tiny bits and bury in cheese sauce or a savory muffin. Small enough that it\'s texture, not "trees."' },
  { match: /\bpea\b|\bpeas\b/, veg: 'peas',
    tip: 'Blend into a bright green sauce or a smooth mash. Sweet and creamy — no rolling green balls to pick out.' },
  { match: /squash|pumpkin/, veg: 'squash',
    tip: 'Purée into mac & cheese, pancakes, or soup. It goes creamy and a little sweet — completely invisible, vitamin A intact.' },
  { match: /\bpepper|\bonion/, veg: 'peppers & onions',
    tip: 'Dice fine and cook until soft and jammy, or purée into the sauce base — no crunchy bits, all the flavor and vitamin C.' },
];

/** The hide-the-veg tips relevant to a set of recipes (deduped, in list order).
    Scans the recipes' ingredients so tips only show for veg actually present. */
export function veggieHidesFor(recipes = []) {
  const text = recipes
    .flatMap((r) => (r?.ingredients || []).map((i) => (typeof i === 'object' ? (i.text || i.name || '') : i)))
    .join(' ')
    .toLowerCase();
  return VEGGIE_HIDES.filter((v) => v.match.test(text));
}
