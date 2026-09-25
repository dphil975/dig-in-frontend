/* remixEngine.js — the "9 items, dozens of meals" engine.

   The insight, decoded from the founder's brief: most people think a new dish
   requires a new base — new dough, new starch, new technique. It doesn't. The
   base does almost none of the flavor work. The filling/condiment layer does
   all of it. Learn ONE base well (roll it, toast it, cook it) and you can walk
   it through nine completely different flavor worlds just by swapping what
   goes inside or on top — including the "wait, that's a thing?" move of a
   SAVORY cinnamon roll: same dough, same roll-and-slice technique, garlic and
   cheese instead of sugar and cinnamon.

   9 bases × 9 fillings = 81 real combinations, generated deterministically
   from two small tables so quality never depends on hand-writing 81 recipes.
   A short list of SIGNATURES gets hand-authored copy for the combos worth
   calling out by name; everything else composes cleanly from the templates.
   Sibling in spirit to fusionEngine.js (base × chemistry), simpler because the
   whole point here is "the base barely matters." */

// ── The 9 bases (the canvas) ─────────────────────────────────────────────────
export const BASES = [
  { id: 'roll-dough', label: 'Roll Dough', noun: 'Rolls', cookLine: 'Roll the dough out into a rectangle.', finishLine: 'Roll it up tight, slice into rounds, and bake at 375°F until golden, about 20 minutes.' },
  { id: 'toast',      label: 'Toast',      noun: 'Toast', cookLine: 'Toast good bread until golden.', finishLine: 'Layer everything on top while it’s still warm.' },
  { id: 'rice',       label: 'Rice',       noun: 'Rice Bowl', cookLine: 'Cook the rice and let it cool for a minute.', finishLine: 'Fold everything through and serve warm.' },
  { id: 'potato',     label: 'Baked Potato', noun: 'Baked Potato', cookLine: 'Bake or microwave the potato until fully tender.', finishLine: 'Split it open, fluff the inside, and pile everything in.' },
  { id: 'eggs',       label: 'Eggs',       noun: 'Omelette', cookLine: 'Whisk the eggs and cook them low and slow.', finishLine: 'Fold everything in just before they fully set.' },
  { id: 'oats',       label: 'Oats',       noun: 'Oats', cookLine: 'Cook the oats with milk or water until creamy.', finishLine: 'Stir everything through and top it off.' },
  { id: 'tortilla',   label: 'Tortilla',   noun: 'Wrap', cookLine: 'Warm the tortilla until pliable.', finishLine: 'Fill it, wrap it tight, and serve whole or sliced.' },
  { id: 'pasta',      label: 'Pasta',      noun: 'Pasta', cookLine: 'Boil the pasta to al dente, saving a splash of the water.', finishLine: 'Toss everything through off the heat, loosening with pasta water.' },
  { id: 'pancake',    label: 'Pancake Batter', noun: 'Pancakes', cookLine: 'Cook the batter into pancakes on a hot griddle.', finishLine: 'Fold everything into the batter, or spoon it on top once cooked.' },
];

// ── The 9 fillings (the flavor layer — this is what actually changes) ───────
export const FILLINGS = [
  { id: 'cinnamon-sugar', label: 'Classic Cinnamon-Sugar', family: 'sweet',
    mixins: 'melted butter, brown sugar, and cinnamon', topping: 'a drizzle of cream cheese glaze' },
  { id: 'garlic-herb-cheese', label: 'Garlic-Herb-Cheese', family: 'savory',
    mixins: 'garlic butter, shredded mozzarella, and chopped parsley', topping: 'a little more parmesan' },
  { id: 'everything-bagel', label: 'Everything Bagel', family: 'savory',
    mixins: 'whipped cream cheese and everything bagel seasoning', topping: 'extra everything seasoning' },
  { id: 'buffalo-chicken', label: 'Buffalo Chicken', family: 'spicy',
    mixins: 'shredded chicken tossed in buffalo sauce and a little ranch', topping: 'crumbled blue cheese and scallion' },
  { id: 'pizza', label: 'Pizza', family: 'savory',
    mixins: 'marinara, mozzarella, and mini pepperoni', topping: 'a scatter of dried oregano' },
  { id: 'sausage-gravy', label: 'Sausage Gravy', family: 'savory',
    mixins: 'browned breakfast sausage in peppery cream gravy', topping: 'extra cracked black pepper' },
  { id: 'curry-veggie', label: 'Curry-Spiced Veggie', family: 'global',
    mixins: 'curry powder, peas, and diced potato', topping: 'a squeeze of lime and cilantro' },
  { id: 'mediterranean', label: 'Mediterranean', family: 'global',
    mixins: 'whipped feta, olives, and sundried tomato', topping: 'a drizzle of good olive oil' },
  { id: 'fruit-honey', label: 'Fruit & Honey', family: 'sweet',
    mixins: 'berries, a little lemon zest, and mascarpone', topping: 'a drizzle of honey' },
];

export const FAMILY_LABEL = { sweet: 'Sweet', savory: 'Savory', spicy: 'Spicy', global: 'Global' };

// ── Hand-authored callouts for the combos worth naming specifically ─────────
// Everything else composes from the templates below — the point is that the
// generic version should never feel broken, just less famous.
const SIGNATURES = {
  'roll-dough:garlic-herb-cheese': {
    name: 'Savory Garlic-Herb Rolls',
    lesson: 'The exact same dough, the exact same roll-and-slice technique as a cinnamon roll — swap the sugar for garlic and cheese and it stops being dessert.',
  },
  'roll-dough:pizza': {
    name: 'Pizza Rolls (Homemade)',
    lesson: 'Same roll, same bake — the filling turns breakfast pastry into a dinner side.',
  },
  'toast:everything-bagel': {
    name: 'Everything Bagel Toast',
    lesson: 'One seasoning blend does the entire transformation from "plain toast" to "bagel shop."',
  },
  'potato:buffalo-chicken': {
    name: 'Buffalo Chicken Baked Potato',
    lesson: 'The potato is just a bowl. The filling is doing 100% of the flavor work.',
  },
  'oats:fruit-honey': {
    name: 'Fruit & Honey Overnight Oats',
    lesson: 'Same base you’d make anyway — the fruit and honey are the only reason it tastes like dessert.',
  },
  'tortilla:sausage-gravy': {
    name: 'Sausage Gravy Breakfast Wrap',
    lesson: 'Biscuits-and-gravy energy, no biscuits required — the tortilla just holds it.',
  },
};

function key(baseId, fillingId) { return `${baseId}:${fillingId}`; }

/** Build one remix: the generated dish from a base + a filling. */
export function buildRemix(baseId, fillingId) {
  const base = BASES.find((b) => b.id === baseId) || BASES[0];
  const filling = FILLINGS.find((f) => f.id === fillingId) || FILLINGS[0];
  const sig = SIGNATURES[key(base.id, filling.id)];

  const dishName = sig?.name || `${filling.label} ${base.noun}`;
  const lesson = sig?.lesson ||
    `Same ${base.label.toLowerCase()}, same technique — only the filling changed. That’s the whole trick.`;

  const steps = [
    base.cookLine,
    `Work in the filling: ${filling.mixins}.`,
    base.finishLine,
    `Finish with ${filling.topping}.`,
  ];

  return { base, filling, dishName, steps, lesson, family: filling.family, isSignature: !!sig };
}

/** Every filling applied to one base, for the "9 doors from this one base" grid. */
export function remixGrid(baseId) {
  return FILLINGS.map((f) => {
    const r = buildRemix(baseId, f.id);
    return { fillingId: f.id, dishName: r.dishName, family: r.family, isSignature: r.isSignature };
  });
}

/** A random base+filling pairing, for "Surprise me." */
export function randomRemix() {
  const base = BASES[Math.floor(Math.random() * BASES.length)];
  const filling = FILLINGS[Math.floor(Math.random() * FILLINGS.length)];
  return buildRemix(base.id, filling.id);
}

/** How many distinct dishes the 9×9 matrix produces — the headline stat. */
export const TOTAL_COMBINATIONS = BASES.length * FILLINGS.length;
