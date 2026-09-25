/* fusionEngine.js — the generative-culinary brain behind the Fusion Builder.

   Give it a Base Item (the *mechanics* — how a dish is assembled and cooked)
   and a Flavor Region (the *chemistry* — the aromatics, heat, fat, acid and
   umami that define a cuisine), and it constructs a brand-new fusion recipe by
   welding one onto the other. Everything is deterministic and local — same
   inputs, same dish — so it works offline and never invents an ingredient it
   can't justify. It's a sibling to recipeAlchemist.js (invent-from-a-prompt)
   and speaks the exact JSON contract a frontend needs:

     { fusion_name, base_item, region, recipe_steps, flavor_bridge,
       pixel_description, nutritional_macros, pixelSpec }

   The "flavor bridge" isn't flavor text — it's built from the actual
   chemistry of the chosen ingredients (capsaicin is fat-soluble, acid cuts
   richness, umami stacks), naming the real components on the plate. pixelSpec
   feeds the Block-ify pixel renderer (see FusionPixel in the page) so the
   finished dish gets a pixel-art portrait with no photo required.

   If you later want infinite variety, add a `mode:'fusion'` branch to
   /api/recipe-ai that returns this same shape — the UI already speaks it. */

// ── Base items: the mechanics ────────────────────────────────────────────────
// Each base knows how it's built (assembly), how the protein is cooked, which
// carb it leans on (+ a gluten-free swap), a baseline macro profile, and which
// pixel silhouette to draw.
export const BASE_ITEMS = [
  {
    id: 'sandwich', label: 'Sandwich', emoji: '🥪', noun: 'Sandwich',
    carb: 'brioche bun', carbGF: 'toasted gluten-free roll',
    cook: 'sear', pixel: 'sandwich',
    assemble: (s) =>
      `Pile the ${s.protein} on the bottom ${s.carb}, spoon over the ${s.sauce}, add ${s.veg}, and cap it.`,
    macros: { calories: 540, protein: 28, carbs: 46, fat: 25 },
  },
  {
    id: 'bowl', label: 'Bowl', emoji: '🍚', noun: 'Bowl',
    carb: 'jasmine rice', carbGF: 'jasmine rice',
    cook: 'sear & slice', pixel: 'bowl',
    assemble: (s) =>
      `Bed of ${s.carb}, ${s.protein} fanned on top, ${s.sauce} spooned over, finished with ${s.veg}.`,
    macros: { calories: 560, protein: 30, carbs: 62, fat: 18 },
  },
  {
    id: 'taco', label: 'Taco', emoji: '🌮', noun: 'Taco',
    carb: 'flour tortilla', carbGF: 'charred corn tortilla',
    cook: 'char', pixel: 'taco',
    assemble: (s) =>
      `Warm the ${s.carb}, load in the ${s.protein}, drizzle the ${s.sauce}, top with ${s.veg}, fold.`,
    macros: { calories: 430, protein: 23, carbs: 38, fat: 20 },
  },
  {
    id: 'pasta', label: 'Pasta', emoji: '🍝', noun: 'Pasta',
    carb: 'rigatoni', carbGF: 'rice-flour pasta',
    cook: 'brown', pixel: 'pasta',
    assemble: (s) =>
      `Toss the ${s.carb} with the ${s.sauce} and ${s.protein}, loosen with a splash of pasta water, plate, top with ${s.veg}.`,
    macros: { calories: 620, protein: 26, carbs: 74, fat: 21 },
  },
];

// ── Flavor regions: the chemistry ────────────────────────────────────────────
// heatLevel 0–4. colors feed the pixel renderer (protein / sauce / veg / accent).
// macroBias nudges the base macros toward the cuisine's fat/carb reality.
export const REGIONS = [
  {
    id: 'jamaican', label: 'Jamaican', emoji: '🇯🇲', dishWord: 'Jerk',
    protein: 'jerk chicken', vegan: 'jerk-spiced jackfruit',
    spiceBlend: 'jerk seasoning', aromatics: 'scallion, garlic, ginger & allspice',
    heat: 'scotch bonnet', heatLevel: 4, fat: 'coconut milk', creamyFat: true,
    acid: 'lime', umami: 'browning & soy', sweet: 'brown sugar', veg: 'pickled red onion', herb: 'fresh thyme',
    sauce: 'mango–scotch-bonnet aioli',
    colors: { protein: '#7a3d18', sauce: '#e8a84a', veg: '#6aaa4a', accent: '#e84a3a' },
    macroBias: { fat: 5 },
  },
  {
    id: 'korean', label: 'Korean', emoji: '🇰🇷', dishWord: 'Gochujang',
    protein: 'bulgogi beef', vegan: 'gochujang tofu',
    spiceBlend: 'gochujang glaze', aromatics: 'garlic, ginger & scallion',
    heat: 'gochugaru', heatLevel: 3, fat: 'toasted sesame oil', creamyFat: false,
    acid: 'rice vinegar', umami: 'gochujang & soy', sweet: 'grated pear', veg: 'quick-pickled cucumber', herb: 'scallion',
    sauce: 'gochujang–sesame glaze',
    colors: { protein: '#904810', sauce: '#e85030', veg: '#508828', accent: '#f8d870' },
    macroBias: { fat: 2, carbs: 3 },
  },
  {
    id: 'italian', label: 'Italian', emoji: '🇮🇹', dishWord: 'Roasted-Tomato',
    protein: 'garlic-herb chicken', vegan: 'white-bean & herb',
    spiceBlend: 'oregano & garlic', aromatics: 'garlic, oregano & chili flake',
    heat: 'chili flake', heatLevel: 1, fat: 'olive oil & parmesan', creamyFat: true,
    acid: 'roasted tomato & lemon', umami: 'parmesan & tomato', sweet: 'roasted tomato', veg: 'peppery arugula', herb: 'torn basil',
    sauce: 'roasted-tomato & basil',
    colors: { protein: '#c47a2a', sauce: '#e84a3a', veg: '#4a8a30', accent: '#f4d44a' },
    macroBias: { fat: 3 },
  },
  {
    id: 'thai', label: 'Thai', emoji: '🇹🇭', dishWord: 'Coconut-Curry',
    protein: 'lemongrass chicken', vegan: 'crispy tofu',
    spiceBlend: 'red curry paste', aromatics: 'lemongrass, garlic & ginger',
    heat: 'thai chili', heatLevel: 4, fat: 'coconut milk', creamyFat: true,
    acid: 'lime', umami: 'fish sauce', sweet: 'palm sugar', veg: 'ribboned carrot & cucumber', herb: 'thai basil & cilantro',
    sauce: 'coconut–lime curry',
    colors: { protein: '#c87820', sauce: '#f4c77a', veg: '#6aaa4a', accent: '#e8a84a' },
    macroBias: { fat: 6 },
  },
  {
    id: 'mexican', label: 'Mexican', emoji: '🇲🇽', dishWord: 'Chipotle',
    protein: 'chipotle carnitas', vegan: 'chipotle black beans',
    spiceBlend: 'adobo', aromatics: 'garlic, onion & cumin',
    heat: 'chipotle', heatLevel: 3, fat: 'avocado crema', creamyFat: true,
    acid: 'lime', umami: 'charred tomato', sweet: 'roasted pineapple', veg: 'pickled onion & radish', herb: 'cilantro',
    sauce: 'chipotle–lime crema',
    colors: { protein: '#8a4820', sauce: '#e07850', veg: '#4a8a30', accent: '#f4d44a' },
    macroBias: { fat: 3 },
  },
  {
    id: 'indian', label: 'Indian', emoji: '🇮🇳', dishWord: 'Tikka',
    protein: 'tikka chicken', vegan: 'chana-masala chickpeas',
    spiceBlend: 'garam masala', aromatics: 'garlic, ginger & cumin',
    heat: 'kashmiri chili', heatLevel: 3, fat: 'ghee & cream', creamyFat: true,
    acid: 'yogurt & lime', umami: 'tomato–onion masala', sweet: 'caramelized onion', veg: 'cucumber–onion kachumber', herb: 'cilantro',
    sauce: 'tikka masala',
    colors: { protein: '#c47a2a', sauce: '#e8a84a', veg: '#6aaa4a', accent: '#e84a3a' },
    macroBias: { fat: 4 },
  },
  {
    id: 'japanese', label: 'Japanese', emoji: '🇯🇵', dishWord: 'Miso',
    protein: 'miso-glazed salmon', vegan: 'miso-glazed eggplant',
    spiceBlend: 'miso glaze', aromatics: 'ginger, garlic & scallion',
    heat: 'shichimi togarashi', heatLevel: 1, fat: 'sesame & kewpie', creamyFat: true,
    acid: 'rice vinegar & yuzu', umami: 'miso & soy (double umami)', sweet: 'mirin', veg: 'quick-pickled cucumber', herb: 'scallion & shiso',
    sauce: 'miso–mirin glaze',
    colors: { protein: '#f07858', sauce: '#d0a848', veg: '#508828', accent: '#f8f0c0' },
    macroBias: { fat: 2 },
  },
  {
    id: 'greek', label: 'Greek', emoji: '🇬🇷', dishWord: 'Lemon-Oregano',
    protein: 'lemon-oregano souvlaki', vegan: 'marinated chickpeas',
    spiceBlend: 'lemon & oregano', aromatics: 'garlic & oregano',
    heat: 'cracked black pepper', heatLevel: 0, fat: 'olive oil & feta', creamyFat: true,
    acid: 'lemon', umami: 'feta & olives', sweet: '', veg: 'tomato & cucumber', herb: 'dill & parsley',
    sauce: 'tzatziki',
    colors: { protein: '#e8b040', sauce: '#f8f0c0', veg: '#4a8a30', accent: '#e84a3a' },
    macroBias: { fat: 3 },
  },
];

// ── Modifications: the interaction ───────────────────────────────────────────
// Each is a pure transform over the resolved dish state + macros. They stack in
// the order the user adds them, and each explains itself in the recipe.
export const MODIFICATIONS = [
  { id: 'more-protein', label: 'More protein',  emoji: '💪' },
  { id: 'vegan',        label: 'Make it vegan', emoji: '🌱' },
  { id: 'gluten-free',  label: 'Gluten-free',   emoji: '🌾' },
  { id: 'healthier',    label: 'Make it lighter', emoji: '🥗' },
  { id: 'spicier',      label: 'Spicier',       emoji: '🔥' },
];

const clamp = (n, lo = 0) => Math.max(lo, Math.round(n));

// Resolve the concrete ingredients for a base+region+mods combo.
function resolveState(base, region, mods) {
  const vegan = mods.includes('vegan');
  const gf = mods.includes('gluten-free');
  const state = {
    protein: vegan ? region.vegan : region.protein,
    carb: gf ? base.carbGF : base.carb,
    sauce: region.sauce,
    veg: region.veg,
    herb: region.herb,
    spiceBlend: region.spiceBlend,
    aromatics: region.aromatics,
    fat: region.fat,
    acid: region.acid,
    umami: region.umami,
    heat: region.heat,
    heatLevel: region.heatLevel + (mods.includes('spicier') ? 1 : 0),
    vegan, gf,
  };
  // Vegan swaps a couple of animal-fat sauces to plant versions so the
  // recipe stays honest.
  if (vegan) {
    state.sauce = region.creamyFat && /cream|feta|kewpie|aioli|crema|tzatziki/.test(region.sauce)
      ? region.sauce.replace(/aioli|crema|tzatziki|cream/i, 'cashew cream').replace(/feta|kewpie/i, 'tahini')
      : region.sauce;
    state.umami = region.umami.replace(/fish sauce/i, 'soy & miso');
  }
  return state;
}

// The recipe, built from base mechanics + region chemistry + the resolved state.
function buildSteps(base, region, state, mods) {
  const steps = [];
  const proteinIsPlant = state.vegan;

  steps.push(
    `Toss the ${state.protein} with ${state.spiceBlend} and ${state.aromatics}; let it marinate 20 minutes.`
  );

  const cookVerb = {
    sear: `Sear the ${state.protein} in a hot pan until deeply caramelized`,
    char: `Char the ${state.protein} over high heat until the edges blacken`,
    brown: `Brown the ${state.protein}, breaking it into craggy bits for surface area`,
    'sear & slice': `Sear the ${state.protein} hard, rest it, then slice against the grain`,
  }[base.cook];
  steps.push(`${cookVerb}${mods.includes('healthier') ? ' — bake or grill instead of pan-frying' : ''}.`);

  const carbStep = {
    sandwich: `Toast the ${state.carb} with a little ${state.fat} until golden.`,
    bowl: `Steam the ${state.carb} and fluff it.`,
    taco: `Blister the ${state.carb} directly over the flame.`,
    pasta: `Boil the ${state.carb} to al dente and reserve a splash of pasta water.`,
  }[base.id];
  steps.push(carbStep);

  const sweetBit = region.sweet ? `, a touch of ${region.sweet}` : '';
  steps.push(
    `Whisk the ${state.sauce}: ${state.fat}, ${state.acid}, ${state.umami}${sweetBit}, and ${state.heat} to taste.`
  );

  steps.push(base.assemble(state));

  steps.push(`Finish with ${state.herb} and a squeeze of ${state.acid}.`);

  if (mods.includes('more-protein')) {
    steps.splice(2, 0, `Double the ${state.protein}${proteinIsPlant ? '' : ', or fold in a soft egg / extra beans'} for a bigger protein hit.`);
  }
  return steps;
}

// The flavor bridge: real chemistry, naming the real ingredients on the plate.
function buildBridge(region, state) {
  const parts = [];
  if (state.heatLevel >= 2 && region.creamyFat) {
    parts.push(
      `Capsaicin from the ${state.heat} is fat-soluble, so the ${region.fat} in the ${state.sauce} binds it into a rounded, lingering heat instead of a sharp burn — a heat-fat emulsion.`
    );
  } else if (state.heatLevel >= 2) {
    parts.push(
      `The ${state.heat} brings clean, upfront heat that the ${region.acid} keeps from turning harsh.`
    );
  }
  parts.push(
    `The ${region.acid} cuts the richness of the ${region.fat} and lifts the ${region.umami}, so each bite resets bright instead of going heavy.`
  );
  parts.push(
    `Layered umami from ${region.umami} deepens the savory base and makes the dish read slow-cooked, even though it isn't.`
  );
  return parts.join(' ');
}

// Macros: base profile → region bias → modification deltas.
function buildMacros(base, region, mods) {
  const m = { ...base.macros };
  const bias = region.macroBias || {};
  m.fat = clamp(m.fat + (bias.fat || 0));
  m.carbs = clamp(m.carbs + (bias.carbs || 0));

  if (mods.includes('more-protein')) { m.protein += 18; m.fat += 6; }
  if (mods.includes('vegan'))        { m.protein = clamp(m.protein - 6); m.fat = clamp(m.fat - 3); }
  if (mods.includes('gluten-free'))  { m.carbs = clamp(m.carbs - 4); }
  if (mods.includes('healthier'))    { m.fat = clamp(m.fat - 10); m.carbs = clamp(m.carbs - 8); }

  m.calories = clamp(m.protein * 4 + m.carbs * 4 + m.fat * 9);
  return {
    calories: m.calories,
    protein_g: m.protein,
    carbs_g: m.carbs,
    fat_g: m.fat,
  };
}

// The pixel spec + human-readable description of the finished dish.
function buildPixel(base, region, state) {
  const c = region.colors;
  const shapeWord = { sandwich: 'stacked sandwich', bowl: 'rounded bowl', taco: 'folded taco', pasta: 'plated pasta nest' }[base.id];
  const description =
    `A blocky ${shapeWord}: charred ${state.protein} in deep warm brown, ` +
    `a glowing ${region.dishWord.toLowerCase()} ${state.sauce} in bright orange-red, ` +
    `flecks of green ${state.veg}, and a golden accent highlight — pixel-art, chunky outlines.`;
  return {
    base: base.pixel,
    colors: c,
    label: `${region.label} ${region.dishWord} ${base.noun}`,
    description,
  };
}

/** Construct a fusion dish. mods is an array of MODIFICATIONS ids (may be empty). */
export function buildFusion(baseId, regionId, mods = []) {
  const base = BASE_ITEMS.find((b) => b.id === baseId) || BASE_ITEMS[0];
  const region = REGIONS.find((r) => r.id === regionId) || REGIONS[0];
  const state = resolveState(base, region, mods);

  const modLabels = mods
    .map((id) => MODIFICATIONS.find((m) => m.id === id)?.label)
    .filter(Boolean);

  return {
    fusion_name: `${region.label} ${region.dishWord} ${base.noun}`,
    base_item: base.label,
    region: region.label,
    recipe_steps: buildSteps(base, region, state, mods),
    flavor_bridge: buildBridge(region, state),
    pixel_description: buildPixel(base, region, state).description,
    nutritional_macros: buildMacros(base, region, mods),
    pixelSpec: buildPixel(base, region, state),
    modifications: modLabels,
  };
}
