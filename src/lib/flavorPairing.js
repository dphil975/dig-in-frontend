/* ════════════════════════════════════════════════════════════
   FLAVOR PAIRING — a real "what goes with what" knowledge base.

   `flavorProfile.js` tags a recipe with 0+ of 8 broad flavors (spicy,
   sweet, savory, rich, light, earthy, smoky, tangy) for recommendation
   ranking. This file goes one layer finer — ~30 specific flavor NOTES
   (peach, chai-spice, chocolate, citrus, coconut, cardamom, ...) with a
   curated "classically pairs with" graph for each, grounded in standard
   flavor-pairing knowledge (the same associations you'd find in any
   flavor-pairing reference: peach + vanilla + cinnamon + ginger + almond;
   chocolate + orange + mint + coffee + hazelnut; tomato + basil + garlic).

   Two things are built on top of that graph:
     1. `pairingReason()` — turns a recipe↔drink match into a short, honest
        "why this works" sentence, so drink pairings stop being an
        unexplained ranked list and start reading like advice from someone
        who actually knows what pairs with what.
     2. `suggestVariations` / `suggestServeWith` / `suggestExpertTips` —
        template-based generators used as a FALLBACK wherever a recipe
        doesn't have hand-authored content for that section yet (which is
        most of them — see RecipeExtras.jsx's "old recipes just don't show
        this" contract). They read in the same warm, second-person,
        explain-the-why voice as the hand-authored ones, so a recipe with
        generated content doesn't feel like a downgrade from one with
        written content.
   ════════════════════════════════════════════════════════════ */

// note → { label, keywords[], pairsWith[] }
export const FLAVOR_NOTES = {
  peach:        { label: 'peach',        keywords: ['peach'],                                   pairsWith: ['vanilla', 'cinnamon', 'ginger', 'honey', 'almond', 'cream'] },
  vanilla:      { label: 'vanilla',      keywords: ['vanilla'],                                 pairsWith: ['cinnamon', 'caramel', 'berry', 'chocolate', 'honey', 'coconut'] },
  cinnamon:     { label: 'cinnamon',     keywords: ['cinnamon'],                                 pairsWith: ['vanilla', 'nutmeg', 'ginger', 'apple', 'honey', 'maple'] },
  'chai-spice': { label: 'chai spice',   keywords: ['chai', 'garam masala'],                    pairsWith: ['vanilla', 'honey', 'cardamom', 'ginger', 'cinnamon', 'citrus'] },
  chocolate:    { label: 'chocolate',    keywords: ['chocolate', 'cocoa', 'mocha'],              pairsWith: ['orange', 'mint', 'coffee', 'hazelnut', 'chili', 'sea-salt'] },
  coffee:       { label: 'coffee',       keywords: ['coffee', 'espresso', 'latte'],              pairsWith: ['chocolate', 'caramel', 'vanilla', 'cinnamon', 'hazelnut', 'cardamom'] },
  citrus:       { label: 'citrus',       keywords: ['lemon', 'lime', 'orange', 'citrus'],        pairsWith: ['mint', 'ginger', 'honey', 'vanilla', 'berry', 'basil'] },
  ginger:       { label: 'ginger',       keywords: ['ginger'],                                   pairsWith: ['honey', 'lemon', 'garlic', 'cinnamon', 'citrus', 'sesame'] },
  berry:        { label: 'berry',        keywords: ['berry', 'strawberr', 'raspberr', 'blueberr'], pairsWith: ['vanilla', 'mint', 'citrus', 'cream', 'almond', 'chocolate'] },
  coconut:      { label: 'coconut',      keywords: ['coconut'],                                  pairsWith: ['lime', 'ginger', 'mango', 'chili', 'cilantro', 'pineapple'] },
  mint:         { label: 'mint',         keywords: ['mint'],                                     pairsWith: ['chocolate', 'citrus', 'berry', 'cucumber', 'watermelon'] },
  honey:        { label: 'honey',        keywords: ['honey'],                                    pairsWith: ['ginger', 'cinnamon', 'lemon', 'thyme', 'almond'] },
  caramel:      { label: 'caramel',      keywords: ['caramel', 'dulce de leche'],                pairsWith: ['sea-salt', 'apple', 'vanilla', 'coffee', 'chocolate', 'pecan'] },
  apple:        { label: 'apple',        keywords: ['apple'],                                    pairsWith: ['cinnamon', 'caramel', 'walnut', 'cheddar', 'maple'] },
  maple:        { label: 'maple',        keywords: ['maple'],                                    pairsWith: ['bacon', 'pecan', 'cinnamon', 'pumpkin', 'walnut', 'vanilla'] },
  almond:       { label: 'almond',       keywords: ['almond'],                                   pairsWith: ['cherry', 'apricot', 'vanilla', 'honey', 'orange', 'chocolate'] },
  cardamom:     { label: 'cardamom',     keywords: ['cardamom'],                                 pairsWith: ['coffee', 'orange', 'honey', 'pistachio', 'rosewater'] },
  tomato:       { label: 'tomato',       keywords: ['tomato'],                                   pairsWith: ['basil', 'garlic', 'olive oil', 'parmesan', 'oregano', 'mozzarella'] },
  basil:        { label: 'basil',        keywords: ['basil'],                                    pairsWith: ['tomato', 'garlic', 'lemon', 'mozzarella', 'pine nut', 'olive oil'] },
  garlic:       { label: 'garlic',       keywords: ['garlic'],                                   pairsWith: ['ginger', 'chili', 'lemon', 'herbs', 'olive oil', 'onion'] },
  chili:        { label: 'chili',        keywords: ['chili', 'chile', 'jalape', 'sriracha', 'gochujang'], pairsWith: ['lime', 'cilantro', 'garlic', 'honey', 'mango', 'coconut'] },
  cumin:        { label: 'cumin',        keywords: ['cumin'],                                    pairsWith: ['coriander', 'lime', 'chili', 'garlic', 'yogurt'] },
  matcha:       { label: 'matcha',       keywords: ['matcha'],                                   pairsWith: ['white chocolate', 'red bean', 'citrus', 'vanilla', 'coconut', 'honey'] },
  rosewater:    { label: 'rosewater',    keywords: ['rosewater', 'rose water'],                  pairsWith: ['pistachio', 'cardamom', 'honey', 'almond', 'lemon'] },
  oat:          { label: 'oat milk',     keywords: ['oat milk'],                                 pairsWith: ['vanilla', 'maple', 'cinnamon', 'honey'] },
  cream:        { label: 'cream',        keywords: ['cream', 'whipped cream'],                   pairsWith: ['vanilla', 'caramel', 'berry', 'cinnamon', 'chocolate'] },
};

const NOTE_IDS = Object.keys(FLAVOR_NOTES);

function recipeText(recipe) {
  return [
    recipe?.name || '', recipe?.description || '',
    ...(recipe?.ingredients || []),
    ...(recipe?.ingredientGroups || []).flatMap(g => (g.items || []).map(it => `${it.name || ''} ${it.note || ''}`)),
    ...(recipe?.instructions || recipe?.steps || []),
  ].join(' ').toLowerCase();
}

/** Which flavor notes actually show up in this recipe's text. */
export function detectNotes(recipe) {
  const text = recipeText(recipe);
  return NOTE_IDS.filter(id => FLAVOR_NOTES[id].keywords.some(kw => text.includes(kw)));
}

const noteLabel = (id) => FLAVOR_NOTES[id]?.label || id;

/** Is this a drink (as opposed to a savory dish / baked good)? */
function looksLikeDrink(recipe) {
  const text = recipeText(recipe);
  return /\b(latte|tea|chai|coffee|juice|smoothie|lemonade|cocktail|mocktail|shake|soda)\b/.test(text)
    || (recipe?.ingredientGroups || []).some(g => /drink|latte|iced|hot preparation/i.test(g.title || ''));
}

const isDairy = (recipe) => /\bmilk|cream|butter|cheese\b/.test(recipeText(recipe));
const hasProtein = (recipe) => /\b(chicken|beef|pork|lamb|shrimp|fish|tofu|egg|paneer|beans?)\b/.test(recipeText(recipe));
const hasVeg = (recipe) => /\b(onion|garlic|pepper|carrot|spinach|cabbage|broccoli|tomato|potato|greens?)\b/.test(recipeText(recipe));

// ── Drink-pairing rationale ──────────────────────────────────────────────
/**
 * Turns a recipe↔drink match into a short "why this works" line, using the
 * richer `pairsWith` data on each drink (cuisine/mealType/flavorContrast/mood
 * — present on every drink in cafe-menu.json but, before this,
 * unused) plus the flavor-note graph above. Falls back to a generic line
 * rather than returning nothing, so every suggested drink has a reason.
 */
export function pairingReason(drink, recipe, flavors) {
  const cuisine = (recipe?.country || recipe?.cuisine || '').toLowerCase();
  const pairsWith = drink?.pairsWith || {};
  const drinkCuisines = (pairsWith.cuisines || []).map(c => c.toLowerCase());
  const contrast = pairsWith.flavorContrast || [];
  const notes = detectNotes(recipe);
  const drinkTags = [...(drink?.flavorProfile || []), ...(drink?.pairingTags || [])].map(t => t.toLowerCase());

  if (cuisine && drinkCuisines.includes(cuisine)) {
    return `A classic pairing with ${cuisine} meals.`;
  }
  const contrastHit = contrast.find(c => flavors.includes(c));
  if (contrastHit) {
    return `Cuts through the ${contrastHit} notes in this dish.`;
  }
  const noteHit = notes.find(n => (FLAVOR_NOTES[n]?.pairsWith || []).some(p => drinkTags.some(t => t.includes(p)) || (drink?.description || '').toLowerCase().includes(p)));
  if (noteHit) {
    return `Its flavor echoes the ${noteLabel(noteHit)} here.`;
  }
  if (pairsWith.mood) {
    return `A ${pairsWith.mood} match for this meal.`;
  }
  return 'A well-rounded pairing for this dish.';
}

// ── Fallback content generators ──────────────────────────────────────────
// Each entry: { when(recipe, notes) => bool, make(recipe, notes) => {title, text} }
const VARIATION_TEMPLATES = [
  {
    when: (r) => looksLikeDrink(r),
    make: () => ({
      title: 'Iced Delight',
      text: 'Blend it with ice instead of just serving it over cubes — it turns into a frothy, slushy texture that’s worth the extra minute.',
    }),
  },
  {
    when: (r) => isDairy(r) && looksLikeDrink(r),
    make: () => ({
      title: 'Dairy-Free Option',
      text: 'Swap in coconut or almond milk for a creamy, dairy-free alternative — each brings its own unique flavor to the drink.',
    }),
  },
  {
    when: (r, notes) => notes.includes('vanilla') || looksLikeDrink(r),
    make: () => ({
      title: 'Sweet Spice',
      text: 'Add a splash of vanilla extract to enhance the sweetness and round out the aroma with something warm and inviting.',
    }),
  },
  {
    when: (r) => isDairy(r) && looksLikeDrink(r),
    make: () => ({
      title: 'Flavorful Milk',
      text: 'Try a flavored oat milk — vanilla or maple — to deepen the flavor profile while keeping it wonderfully creamy.',
    }),
  },
  {
    when: (r, notes) => notes.some(n => ['peach', 'berry', 'apple'].includes(n)),
    make: (r, notes) => {
      const fruit = noteLabel(notes.find(n => ['peach', 'berry', 'apple'].includes(n)));
      return {
        title: `${fruit[0].toUpperCase()}${fruit.slice(1)}y Freshness`,
        text: `Blend in a few fresh or frozen ${fruit} slices before serving for a vibrant, fruity kick — delightful in warm weather.`,
      };
    },
  },
  {
    when: (r, notes) => notes.some(n => ['peach', 'chai-spice', 'chocolate'].includes(n)) || looksLikeDrink(r),
    make: () => ({
      title: 'Heat It Up',
      text: 'If you’re enjoying a hot version, a pinch of cayenne or black pepper gives a surprising warmth that balances the sweetness.',
    }),
  },
  {
    when: (r, notes) => notes.includes('chai-spice'),
    make: () => ({
      title: 'Chai Swap',
      text: 'Substitute the chai concentrate with your favorite spiced tea for a milder flavor that still keeps the cozy essence.',
    }),
  },
  {
    when: (r) => isDairy(r) && looksLikeDrink(r),
    make: () => ({
      title: 'Texture Variation',
      text: 'Froth your milk before adding it in for a creamy foam topping — that extra layer takes it to café-style territory.',
    }),
  },
  // ── Generic savory-dish templates — the ones above are mostly drink/
  // dessert-specific (matching the tone the app's one fully-authored recipe
  // was modeled on); these make sure a plain weeknight dinner still gets
  // real suggestions instead of an empty, hidden section.
  {
    when: (r) => !looksLikeDrink(r) && hasProtein(r),
    make: () => ({
      title: 'Protein Swap',
      text: 'Swap the protein for what you have on hand — chicken, tofu, shrimp, or beans all work with the same technique.',
    }),
  },
  {
    when: (r) => !looksLikeDrink(r),
    make: () => ({
      title: 'Turn Up the Heat',
      text: 'Add fresh chili, a dash of hot sauce, or extra black pepper if you like more kick — easy to scale up or down to taste.',
    }),
  },
  {
    when: (r) => !looksLikeDrink(r) && hasVeg(r),
    make: () => ({
      title: 'Vegetable Boost',
      text: 'Stir in extra vegetables you have on hand — this dish is forgiving and takes well to a bigger veggie ratio.',
    }),
  },
  {
    when: (r, notes) => !looksLikeDrink(r),
    make: (r, notes) => {
      const anchor = notes[0] ? noteLabel(notes[0]) : null;
      return {
        title: 'Make It Your Own',
        text: anchor
          ? `Taste as you go and adjust the ${anchor} to your preference — a little more or less makes this recipe yours.`
          : 'Taste as you go and adjust the seasoning to your preference — small tweaks make this recipe yours.',
      };
    },
  },
];

/** Generates variation suggestions in the recipe's own flavor language. Only
 *  meant to be used when `recipe.variations` isn't already hand-authored. */
export function suggestVariations(recipe, max = 6) {
  const notes = detectNotes(recipe);
  const out = [];
  for (const t of VARIATION_TEMPLATES) {
    if (out.length >= max) break;
    if (t.when(recipe, notes)) out.push(t.make(recipe, notes));
  }
  return out;
}

// Drinks/desserts and savory dishes want fundamentally different sides —
// ice cream and pastries make sense next to a chai latte, not a stir-fry.
const SERVE_WITH_DRINK_POOL = [
  { match: () => true, item: { title: 'Flaky Pastries', text: 'Light, buttery pastries add texture and make every sip more indulgent.' } },
  { match: () => true, item: { title: 'Light Fruit Salad', text: 'Fresh seasonal fruit balances richness with a bright, revitalizing contrast.' } },
  { match: (f) => f.includes('rich') || f.includes('sweet'), item: { title: 'Herbal Iced Tea', text: 'A lightly infused herbal tea adds refreshing notes without overwhelming the palate.' } },
  { match: (f) => f.includes('sweet') || f.includes('rich'), item: { title: 'Vanilla Ice Cream', text: 'A scoop of creamy vanilla turns it into a dessert-level indulgence.' } },
  { match: (f) => f.includes('tangy') || f.includes('sweet'), item: { title: 'Berry Tart', text: 'A tart bursting with berries brings a tangy sweetness that harmonizes with fruit-forward flavors.' } },
  { match: (f) => f.includes('spicy') || f.includes('rich'), item: { title: 'Sparkling Water with Citrus', text: 'Effervescent and citrusy — it cleanses the palate between sips.' } },
  { match: (f, notes) => notes.includes('chai-spice'), item: { title: 'Cinnamon Rolls', text: 'The spiced sweetness echoes the warm spices here, like a cozy hug on a plate.' } },
  { match: () => true, item: { title: 'Savory Scones', text: 'A hearty, warm counterpart that leans into brunch territory.' } },
];

const SERVE_WITH_SAVORY_POOL = [
  { match: () => true, item: { title: 'A Simple Side Salad', text: 'Something crisp and lightly dressed keeps the plate from feeling one-note.' } },
  { match: (f) => f.includes('rich') || f.includes('spicy'), item: { title: 'Steamed Rice or Flatbread', text: 'A plain, starchy side gives the richer or spicier flavors here something to land on.' } },
  { match: (f) => f.includes('spicy'), item: { title: 'A Cooling Yogurt or Raita', text: 'Something cool and creamy takes the edge off the heat between bites.' } },
  { match: (f) => f.includes('tangy') || f.includes('rich'), item: { title: 'Quick Pickled Vegetables', text: 'A tangy, crunchy pickle cuts through richness and resets the palate.' } },
  { match: () => true, item: { title: 'Roasted Seasonal Vegetables', text: 'An easy, hands-off side that rounds out the meal without competing for attention.' } },
  { match: (f) => f.includes('light') || f.includes('savory'), item: { title: 'Crusty Bread', text: 'Good for mopping up any sauce left on the plate.' } },
];

/** Generates a `{intro, items}` serve-with block — fallback only.
 *  `flavors` is the broad 8-vocab list from `recipeFlavors()` (flavorProfile.js). */
export function suggestServeWith(recipe, flavors = [], max = 5) {
  const notes = detectNotes(recipe);
  const pool = looksLikeDrink(recipe) ? SERVE_WITH_DRINK_POOL : SERVE_WITH_SAVORY_POOL;
  const items = [];
  for (const entry of pool) {
    if (items.length >= max) break;
    if (entry.match(flavors, notes)) items.push(entry.item);
  }
  return {
    intro: `A few pairings that bring out the best in ${recipe?.name ? recipe.name.replace(/\s*\([^)]*\)/g, '').trim() : 'this dish'}.`,
    items,
  };
}

const EXPERT_TIP_POOL = [
  { when: () => true, tip: { title: 'Taste As You Go', text: 'Adjust sweetness or spice gradually — it’s easy to add more, hard to take it back out.' } },
  { when: (r) => looksLikeDrink(r), tip: { title: 'Layering Technique', text: 'Pour slowly when combining liquids of different densities — it shows off the layers and makes for a better presentation.' } },
  { when: (r) => isDairy(r), tip: { title: 'Milk Temperature', text: 'Cold milk froths better for iced drinks; warm (not boiling) milk gives a silkier texture for hot ones.' } },
  { when: (r, notes) => notes.some(n => ['peach', 'berry', 'apple'].includes(n)), tip: { title: 'Freshness Matters', text: 'Making any fruit syrup from scratch instead of using a store-bought version gives a noticeably deeper flavor.' } },
  { when: () => true, tip: { title: 'Store Smartly', text: 'Keep any homemade syrup or sauce in a sealed jar in the fridge for up to a week for quick access next time.' } },
];

/** Generates expert-tip suggestions — fallback only. */
export function suggestExpertTips(recipe, max = 4) {
  const notes = detectNotes(recipe);
  const out = [];
  for (const t of EXPERT_TIP_POOL) {
    if (out.length >= max) break;
    if (t.when(recipe, notes)) out.push(t.tip);
  }
  return out;
}
