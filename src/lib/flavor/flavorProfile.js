/* ════════════════════════════════════════════════════════════
   FLAVOR PROFILE — merged module.

   Consolidates five formerly-separate lib/ files that all revolve around
   the same idea (tagging things with a flavor/mood vocabulary and turning
   that into recommendations, matches, or gentle wins):
     - flavorProfile.js     (the base 8-flavor vocabulary + learned profile)
     - flavorPairing.js     (fine-grained flavor-note pairing graph)
     - mocktailFlavor.js    (Zero-Proof Bar flavor/mood/functional engine)
     - dietMatch.js         (diet-tag matching + veggie-hiding tips)
     - happinessEngine.js   (gratitude/wins/kindness/helping/lightness loops)

   Each section below is marked with the name of the original file it came
   from. Nothing was renamed — none of the five files' exports collided.
   The old flat files (src/lib/flavorProfile.js, flavorPairing.js,
   mocktailFlavor.js, dietMatch.js, happinessEngine.js) now just
   re-export from here so existing imports keep working.
   ════════════════════════════════════════════════════════════ */

/* ────────────────────────────────────────────────────────────
   From flavorProfile.js
   ────────────────────────────────────────────────────────────
   FLAVOR PROFILE — the app's single 8-flavor vocabulary
   (spicy, sweet, savory, rich, light, earthy, smoky, tangy).

   Every recipe is tagged with 0+ of these by keyword-matching its name /
   description / ingredients / instructions. Every user interaction —
   viewing a recipe, lingering on it in the Discover feed, saving it,
   opening the full recipe, sharing it, or skipping past it fast — nudges
   the user's profile toward or away from those flavors. This mirrors how
   TikTok's For You algorithm treats every watch, rewatch, like, share and
   fast-skip as a vote for or against a video's attributes, re-ranking the
   very next recommendation on it instead of waiting for an explicit rating.
   ──────────────────────────────────────────────────────────── */

export const FLAVORS = ['spicy', 'sweet', 'savory', 'rich', 'light', 'earthy', 'smoky', 'tangy'];

const FLAVOR_KW = {
  spicy:  ['spicy', 'chili', 'chilli', 'jalapeño', 'pepper', 'hot sauce', 'cayenne', 'sriracha', 'gochujang'],
  sweet:  ['sugar', 'honey', 'maple', 'chocolate', 'vanilla', 'fruit', 'mango', 'berry', 'caramel', 'dessert'],
  savory: ['soy sauce', 'miso', 'umami', 'mushroom', 'broth', 'parmesan', 'dashi', 'anchovy'],
  rich:   ['butter', 'cream', 'cheese', 'beef', 'pork', 'lamb', 'coconut milk', 'fried', 'lard'],
  light:  ['salad', 'lemon', 'lime', 'citrus', 'herb', 'mint', 'cucumber', 'steamed', 'fresh'],
  earthy: ['lentil', 'bean', 'root', 'beet', 'squash', 'potato', 'truffle'],
  smoky:  ['smoked', 'barbecue', 'chipotle', 'paprika', 'grill', 'roasted', 'char'],
  tangy:  ['vinegar', 'pickle', 'yogurt', 'tamarind', 'fermented', 'kimchi', 'sour'],
};

function textOf(r) {
  return [r.name || '', r.description || '', ...(r.ingredients || []), ...(r.instructions || [])]
    .join(' ').toLowerCase();
}

/** Which of the 8 flavors a raw string of text reads as — the same keyword
    vocabulary recipeFlavors() uses on a recipe object, just callable on
    plain text directly (e.g. a typed craving) instead of requiring a
    name/description/ingredients/instructions shape. */
export function flavorsInText(text) {
  const t = String(text || '').toLowerCase();
  return FLAVORS.filter(f => FLAVOR_KW[f].some(kw => t.includes(kw)));
}

export function recipeFlavors(r) {
  return flavorsInText(textOf(r));
}

/* ── Persisted taste profile ─────────────────────────────────── */
// Reuses the storage key the craving filter already wrote to (clicking
// "SPICY" in the filter bar was already a first, explicit version of this
// signal) — the Discover feed just adds many more implicit ones on top of
// that same running total, so the grid and the feed learn from each other.
const PROFILE_KEY = 'dig_in_craving_prefs';

export function loadFlavorProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); } catch { return {}; }
}

function saveFlavorProfile(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
}

// ── Swipe-feed learning toggle ─────────────────────────────────────────
// Gates ONLY the Tinder-style Discover feed's (TikTokRecipeFeed.jsx, used by
// both /feed and RecipeCards' "Discover" button) calls into
// recordFlavorSignal() below — not the function itself, which stays wired
// up everywhere else (reel likes, craving reverse-engineering, the taste
// quiz, etc.). Default on: swiping there is the app's main "recalibrate my
// taste" entry point, so it should teach the profile unless a shopper
// deliberately turns that off from Profile settings.
const SWIPE_LEARNING_KEY = 'dig_in_swipe_learning';

export function isSwipeLearningEnabled() {
  try {
    const v = localStorage.getItem(SWIPE_LEARNING_KEY);
    return v === null ? true : v === 'true';
  } catch { return true; }
}

export function setSwipeLearningEnabled(on) {
  try { localStorage.setItem(SWIPE_LEARNING_KEY, on ? 'true' : 'false'); } catch { /* ignore */ }
}

// Positive signals build affinity; a fast skip / swipe-left is the one
// negative signal — mirrors "not interested" being the strongest down-vote
// on TikTok. superlike (Discover's swipe-up) is the strongest explicit
// positive — it's a deliberate favorite, stronger than just opening a recipe.
export const SIGNAL_WEIGHT = { view: 1, dwell: 2, save: 6, cook: 8, share: 5, superlike: 10, skip: -3 };

// `overrideFlavors` lets a caller that already KNOWS the flavor(s) (e.g. a
// reel's own hand-tagged `flavor` chip) skip keyword-detection entirely —
// a flavor's own name isn't always a literal keyword in its own bucket
// (e.g. "rich" isn't in FLAVOR_KW.rich, which lists butter/cream/cheese/…
// instead), so text-matching a label against itself can silently miss.
export function recordFlavorSignal(recipe, signal, overrideFlavors) {
  const weight = SIGNAL_WEIGHT[signal];
  const profile = loadFlavorProfile();
  if (!weight || !recipe) return profile;
  const flavors = overrideFlavors?.length ? overrideFlavors : recipeFlavors(recipe);
  if (!flavors.length) return profile;
  const next = { ...profile };
  for (const f of flavors) next[f] = Math.max(-20, Math.min(80, (next[f] || 0) + weight));
  saveFlavorProfile(next);
  return next;
}

// Bulk-seed the profile from explicit answers (the flavor onboarding quiz,
// or a restaurant-hint match) instead of waiting on implicit swipe signals
// to slowly build one up. A moderate starting weight (roughly what ~3
// superlikes would earn) so day-1 recommendations already lean toward it
// without drowning out what the user does after.
const SEED_WEIGHT = 25;

export function seedFlavorProfile(flavors) {
  if (!flavors || !flavors.length) return loadFlavorProfile();
  const next = { ...loadFlavorProfile() };
  for (const f of flavors) {
    if (!FLAVORS.includes(f)) continue;
    next[f] = Math.max(-20, Math.min(80, (next[f] || 0) + SEED_WEIGHT));
  }
  saveFlavorProfile(next);
  return next;
}

/* ────────────────────────────────────────────────────────────
   From flavorPairing.js
   ────────────────────────────────────────────────────────────
   FLAVOR PAIRING — a real "what goes with what" knowledge base.

   The section above tags a recipe with 0+ of 8 broad flavors (spicy,
   sweet, savory, rich, light, earthy, smoky, tangy) for recommendation
   ranking. This section goes one layer finer — ~30 specific flavor NOTES
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
   ──────────────────────────────────────────────────────────── */

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
 *  `flavors` is the broad 8-vocab list from `recipeFlavors()` above. */
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

/* ────────────────────────────────────────────────────────────
   From mocktailFlavor.js
   ────────────────────────────────────────────────────────────
   The flavor + mood engine behind the Zero-Proof Bar.

   The core idea the app "understands": a cocktail is three things stacked, and
   the alcohol contributes to all three —
     1. FLAVOR      — the taste axes (sweet, sour, bitter, spicy, smoky, …)
     2. MOUTHFEEL   — warmth, body, the burn, the silky weight
     3. MOOD        — the actual reason people drink it (the "happy feeling")
   To make a classic virgin you can't just delete the spirit — you have to
   rebuild each layer. This section models the flavor axes, the mood outcomes,
   and the functional-ingredient glossary that recreates the MOOD layer without
   ethanol (adaptogens, nervines, aromatics), plus a recommender that ranks
   drinks by how you want to feel and what you want to taste.
   ──────────────────────────────────────────────────────────── */

// Eight taste axes used for the radar + matching.
export const FLAVOR_AXES = ['sweet', 'sour', 'bitter', 'spicy', 'smoky', 'fruity', 'floral', 'herbal'];

// The mood outcomes a drink can be built toward. `drivers` are the functional
// ingredients (below) that produce that feeling — the swap for the buzz.
export const MOODS = [
  { key: 'happy',     label: 'Happy & Social',    icon: '✨', blurb: 'The uplifted, chatty, special-occasion glow — without the buzz or the hangover.', drivers: ['elderflower', 'damiana', 'hibiscus'] },
  { key: 'calm',      label: 'Calm & Unwind',     icon: '🌙', blurb: 'The exhale at the end of the day. Lowered shoulders, softened edges.',           drivers: ['ashwagandha', 'passionflower', 'cbd'] },
  { key: 'focus',     label: 'Clear & Focused',   icon: '🎯', blurb: 'Alert but never jittery — the productive-evening or working-lunch sip.',          drivers: ['lionsmane', 'ltheanine', 'yerbamate'] },
  { key: 'cozy',      label: 'Cozy & Warm',       icon: '🔥', blurb: 'Blanket-in-a-glass. Warming spice and grounding roots.',                          drivers: ['ginger', 'reishi', 'elderberry'] },
  { key: 'energized', label: 'Bright & Energized',icon: '⚡', blurb: 'A clean lift for the pre-dinner reset or the mid-afternoon wall.',                drivers: ['rhodiola', 'cordyceps', 'yerbamate'] },
  { key: 'sensual',   label: 'Warm & Sensual',    icon: '🌹', blurb: 'The slow, low-lit, date-night pour.',                                             drivers: ['damiana', 'cacao', 'rose'] },
];

export const MOOD_BY_KEY = Object.fromEntries(MOODS.map(m => [m.key, m]));

/* ── What actually makes a drink feel exciting ────────────────────────────
   The real sensory-science answer to "why does a cocktail feel like an
   event": it isn't the alcohol doing the exciting part — it's contrast.
   Bitter against sweet, cold against a warm spice note, a fizzy texture
   against a syrupy one, a sharp aromatic hit before the first sip even
   lands. Alcohol was never the only thing capable of supplying that
   contrast; it's just one ingredient among several that can. This is the
   actual mechanism the swaps above are built on, made explicit. */
export const TASTE_ACTIVATION = [
  { id: 'bitterness',  label: 'Bitterness',        why: 'The "adult" flavor signal — it\'s what makes a drink read as sophisticated rather than sweet and simple. Delivered here by hibiscus, cacao, and non-alcoholic bitters instead of Campari or vermouth.' },
  { id: 'acidity',     label: 'Acid & brightness',  why: 'Cuts richness and wakes up every other flavor on the palate — fresh citrus does this job identically whether or not there\'s alcohol in the glass.' },
  { id: 'aromatics',   label: 'Aromatic lift',      why: 'Most of what you register as "flavor" is actually smell — a garnish you crush or express (mint, citrus peel, fresh ginger) hits the nose before the first sip, building anticipation.' },
  { id: 'contrast',    label: 'Temperature & texture contrast', why: 'A cold, fizzy drink against a warming spice note, or a silky foam cap on a sharp base — contrast is what a palate reads as "interesting," independent of alcohol content.' },
];

/* Functional-ingredient glossary — the heart of "make it virgin but keep the
   feeling". Each carries what it tastes like (axes) and the mood it drives, so
   the app can explain WHY a swap recreates the original's effect. `kind`:
   adaptogen (stress/mood over time), nervine (calming), nootropic (focus),
   aromatic (warmth/flavor), botanical (floral/fruit character). */
export const FUNCTIONALS = {
  elderflower:  { name: 'Elderflower',        kind: 'botanical', flavor: ['floral', 'sweet'],   mood: 'happy',     note: 'Honeyed floral lift that reads as “celebration” and rounds off sharp edges — the job a splash of liqueur used to do.' },
  ashwagandha:  { name: 'Ashwagandha',        kind: 'adaptogen', flavor: ['bitter', 'herbal'],  mood: 'calm',      note: 'Adaptogenic root shown to blunt cortisol — the calm, body-warm glow that stands in for alcohol’s relaxation, minus the crash.' },
  ltheanine:    { name: 'L-Theanine (matcha)',kind: 'nootropic', flavor: ['herbal', 'bitter'],  mood: 'focus',     note: 'The amino acid in green tea that smooths caffeine into calm, alert focus — “relaxed but sharp.”' },
  passionflower:{ name: 'Passionflower',      kind: 'nervine',   flavor: ['herbal', 'floral'],  mood: 'calm',      note: 'A gentle nervine that quiets a racing mind — the settle without the sedation.' },
  damiana:      { name: 'Damiana',            kind: 'botanical', flavor: ['herbal', 'bitter'],  mood: 'sensual',   note: 'Long used for a mild, euphoric, mood-lifting warmth — the closest botanical to alcohol’s social glow.' },
  rhodiola:     { name: 'Rhodiola',           kind: 'adaptogen', flavor: ['bitter', 'herbal'],  mood: 'energized', note: 'Adaptogen for stamina and mood under stress — a clean lift with no jitter.' },
  lionsmane:    { name: "Lion's Mane",        kind: 'nootropic', flavor: ['herbal'],            mood: 'focus',     note: 'Functional mushroom linked to mental clarity — grounds an energizing drink in focus.' },
  cordyceps:    { name: 'Cordyceps',          kind: 'adaptogen', flavor: ['bitter'],            mood: 'energized', note: 'Mushroom for oxygen use and clean energy — the pre-dinner spark.' },
  reishi:       { name: 'Reishi',             kind: 'adaptogen', flavor: ['bitter'],            mood: 'cozy',      note: 'Grounding mushroom for the “settled, warm, low-lit” body feel that replaces a nightcap.' },
  ginger:       { name: 'Fresh Ginger',       kind: 'aromatic',  flavor: ['spicy'],             mood: 'cozy',      note: 'The warming burn on the way down — this is what literally replaces alcohol’s heat, no proof required.' },
  cbd:          { name: 'CBD',                kind: 'nervine',   flavor: ['herbal'],            mood: 'calm',      note: 'Takes the edge off tension — the unclenched-jaw feeling.' },
  hibiscus:     { name: 'Hibiscus',           kind: 'botanical', flavor: ['sour', 'fruity'],    mood: 'happy',     note: 'Tart, cranberry-bright and ruby-red — carries the vibrancy a red aperitivo used to.' },
  elderberry:   { name: 'Elderberry',         kind: 'botanical', flavor: ['fruity', 'sweet'],   mood: 'cozy',      note: 'Deep, jammy and immune-friendly — the cozy depth of a spiced winter liqueur.' },
  cacao:        { name: 'Raw Cacao',          kind: 'aromatic',  flavor: ['bitter'],            mood: 'sensual',   note: 'Theobromine gives a gentle mood lift; its bitterness reads as “grown-up,” like a dark liqueur.' },
  rose:         { name: 'Rose',               kind: 'botanical', flavor: ['floral'],            mood: 'sensual',   note: 'Soft floral romance — the low-lit garnish note.' },
  yerbamate:    { name: 'Yerba Maté',         kind: 'botanical', flavor: ['bitter', 'herbal'],  mood: 'energized', note: 'Smooth, sustained caffeine — a lift without the coffee crash.' },

  // Chinese tea varieties — real teas (Camellia sinensis) differ by oxidation
  // level, which drives both flavor and body. Flower/herbal tisanes (already
  // above: hibiscus, rose, elderflower) aren't technically "tea" at all — they
  // don't come from the tea plant and carry no caffeine, which is why they're
  // filed separately from the true teas below.
  greentea:   { name: 'Green Tea',     kind: 'tea', flavor: ['herbal', 'bitter'],  mood: 'focus',     note: 'Minimally oxidized — grassy, vegetal, umami-edged. Its natural L-theanine pairs with caffeine for the same calm-alert focus matcha is known for.' },
  whitetea:   { name: 'White Tea',     kind: 'tea', flavor: ['floral', 'sweet'],   mood: 'calm',      note: 'The least-processed true tea — delicate and subtly sweet. The gentlest, quietest of the true teas rather than a jolt.' },
  oolong:     { name: 'Oolong Tea',    kind: 'tea', flavor: ['floral', 'fruity'],  mood: 'happy',     note: 'Partially oxidized, spanning green-floral to dark-roasted depending on style. Traditionally poured after a rich meal as a palate-cleansing digestif in Chinese dining.' },
  blacktea:   { name: 'Black Tea',     kind: 'tea', flavor: ['bitter', 'smoky'],   mood: 'energized', note: 'Fully oxidized — malty and robust, the most full-bodied of the true teas. A steady lift with real backbone, no jitter.' },
  puerh:      { name: 'Pu-erh Tea',    kind: 'tea', flavor: ['smoky', 'bitter'],   mood: 'cozy',      note: 'A post-fermented, aged tea — earthy, deep, sometimes smoky. Served at Chinese banquets specifically to cut through rich, fatty food.' },
  jasmine:    { name: 'Jasmine Tea',   kind: 'tea', flavor: ['floral', 'sweet'],   mood: 'happy',     note: 'Green tea scented with jasmine blossoms — perfumed and bright, one of the most recognizable floral teas worldwide.' },
  osmanthus:  { name: 'Osmanthus Tea', kind: 'tea', flavor: ['floral', 'fruity'],  mood: 'sensual',   note: 'Delicate apricot-like sweetness from dried osmanthus blossoms, often blended into oolong or black tea for a honeyed floral note.' },
};

export const FUNCTIONAL_KEYS = Object.keys(FUNCTIONALS);
export const functional = (key) => FUNCTIONALS[key];

// Empty radar template.
export function emptyFlavor() {
  return Object.fromEntries(FLAVOR_AXES.map(a => [a, 0]));
}

/* Rank drinks by how you want to feel + taste. mood match dominates (it's the
   whole point of the feature); flavor adds a graded nudge; a matching functional
   driver breaks ties. Returns a new array, best first, with the score attached. */
export function scoreMocktail(m, { mood, flavor } = {}) {
  let s = 0;
  if (mood && m.moods?.includes(mood)) s += 5;
  if (mood && (m.functionals || []).some(k => FUNCTIONALS[k]?.mood === mood)) s += 1.5;
  if (flavor) s += (m.flavor?.[flavor] || 0) / 20;   // 0..5
  return s;
}

export function recommend(mocktails, filters = {}) {
  return mocktails
    .map(m => ({ m, s: scoreMocktail(m, filters) }))
    .sort((a, b) => b.s - a.s)
    .map(x => x.m);
}

// Which drinks actually satisfy the active chips (used for filtering vs. sorting).
export function matchesFilters(m, { mood, flavor } = {}) {
  if (mood && !m.moods?.includes(mood)) return false;
  if (flavor && (m.flavor?.[flavor] || 0) < 45) return false;   // must be meaningfully that flavor
  return true;
}

/* ────────────────────────────────────────────────────────────
   From dietMatch.js
   ────────────────────────────────────────────────────────────
   One honest source for "does this recipe fit this diet?" and, for the
   picky eaters, "how do I get the nutrient without tasting the veg?"

   The diet exclusions mirror the set RecipeCards has used inline (see its
   DIET_EXCLUDE) — pulled into a leaf module so the Spend Planner and anything
   else can reason about diets without duplicating (or drifting from) that list.

   Honesty: an ingredient list we can't read makes NO diet claim — an empty
   ingredient array returns no tags, so a recipe is never wrongly called vegan or
   gluten-free just because we couldn't see what's in it.
   ──────────────────────────────────────────────────────────── */

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

/* ────────────────────────────────────────────────────────────
   From happinessEngine.js
   ────────────────────────────────────────────────────────────
   The mechanics that make "happier" something the app can actually move,
   not a vibe.

   Five loops, each wired to an event and a formula:
     🌅 Gratitude Log   one logged gratitude a day → a streak
     🏆 Win Collection  every cooking win saved to a visual Trophy Case
     🔗 Kindness Chain  tag someone you appreciate → both get a lift
     🤲 Helping Hand    a reply marked helpful → altruism badge tier
     📈 Lightness       a rolling index Nova reads to pace her tone

   All client-side (localStorage), all pure. The Kindness Chain and Helping Hand
   notify real other people once a backend exists; until then they record intent
   locally so the loops are testable and the UI is honest about scope.
   ──────────────────────────────────────────────────────────── */

const K = {
  gratitude: 'dig_in_nova_gratitude',   // [{ id, text, at }]
  wins:      'dig_in_nova_wins',         // [{ id, title, at, source }]
  kindness:  'dig_in_nova_kindness',     // [{ id, who, note, at }]
  helping:   'dig_in_nova_helping',      // { count, tier }
};

function read(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; }
  catch { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ── 🌅 Gratitude Log ────────────────────────────────────────────
export function logGratitude(text) {
  const list = read(K.gratitude, []);
  list.push({ id: uid(), text: String(text).trim(), at: Date.now() });
  write(K.gratitude, list);
  return list;
}
export function getGratitude() { return read(K.gratitude, []).slice().reverse(); }

/** Consecutive-day streak: each entry within 36h of the previous day's keeps it. */
export function gratitudeStreak(now = Date.now()) {
  const list = read(K.gratitude, []);
  if (!list.length) return 0;
  const days = [...new Set(list.map(e => new Date(e.at).toDateString()))]
    .map(d => new Date(d).getTime())
    .sort((a, b) => b - a);
  const DAY = 86_400_000;
  const today = new Date(now).setHours(0, 0, 0, 0);
  // streak only counts if the most recent entry is today or yesterday
  if (today - days[0] > DAY) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i - 1] - days[i] <= DAY * 1.5) streak++;
    else break;
  }
  return streak;
}

// ── 🏆 Win Collection ───────────────────────────────────────────
export function saveWin(title, source = 'manual') {
  const list = read(K.wins, []);
  list.push({ id: uid(), title: String(title).trim(), at: Date.now(), source });
  write(K.wins, list);
  return list;
}
export function getWins() { return read(K.wins, []).slice().reverse(); }

// ── 🔗 Kindness Chain ───────────────────────────────────────────
export function tagKindness(who, note = '') {
  const list = read(K.kindness, []);
  list.push({ id: uid(), who: String(who).trim(), note: String(note).trim(), at: Date.now() });
  write(K.kindness, list);
  return list;
}
export function getKindness() { return read(K.kindness, []).slice().reverse(); }

// ── 🤲 Helping Hand ─────────────────────────────────────────────
const HELP_TIERS = [0, 1, 5, 15, 40]; // thresholds → tier 0..4
export function recordHelp() {
  const h = read(K.helping, { count: 0, tier: 0 });
  h.count += 1;
  h.tier = HELP_TIERS.reduce((t, thresh, i) => (h.count >= thresh ? i : t), 0);
  write(K.helping, h);
  return h;
}
export function getHelping() { return read(K.helping, { count: 0, tier: 0 }); }

// ── 📈 Lightness index ──────────────────────────────────────────
/* A rolling 0–100 read of how the user is doing, which Nova uses to pace her
   tone: high lightness gets celebration, low gets gentleness. Weighted toward
   the last 7 days so it moves with the person, not their whole history. */
export function lightness(now = Date.now()) {
  const WINDOW = 7 * 86_400_000;
  const recent = (list, key = 'at') => list.filter(e => now - e[key] <= WINDOW).length;

  const g = recent(read(K.gratitude, []));
  const w = recent(read(K.wins, []));
  const k = recent(read(K.kindness, []));
  const help = getHelping().count;

  // gentle diminishing returns so one big day doesn't peg it
  const score =
    Math.min(g, 7) * 6 +
    Math.min(w, 7) * 5 +
    Math.min(k, 5) * 4 +
    Math.min(help, 10) * 1;

  const val = Math.max(0, Math.min(100, 20 + score)); // 20 baseline so nobody sits at rock bottom
  let band = 'steady';
  if (val >= 70) band = 'bright';
  else if (val < 40) band = 'tender';
  return { value: val, band };
}

/** Everything the Nest header needs in one call. */
export function happinessSnapshot(now = Date.now()) {
  return {
    gratitudeStreak: gratitudeStreak(now),
    wins: read(K.wins, []).length,
    kindness: read(K.kindness, []).length,
    helping: getHelping(),
    lightness: lightness(now),
  };
}
