/* ════════════════════════════════════════════════════════════
   EQUIPMENT DETECTOR
   EquipmentGate used to show the same 3 tools (cast iron / rice cooker /
   air fryer) on every recipe regardless of what it actually calls for.
   This scans a recipe's name, description, ingredients and instructions
   for cooking-method keywords, ranks the matching tools, and — where a
   tool's keyword shows up directly in one of the recipe's own steps —
   uses that real instruction text as an example instead of only generic
   copy, so "how this tool works" is grounded in the dish being cooked.
   ════════════════════════════════════════════════════════════ */

const ONE_PAN_LINK = { to: '/social?tag=one-pan', label: 'See one-pan meals on the Social Feed' };

// Exported so toolTracking.js can build a real owned-tools/substitution model
// on the SAME 10 tools this file already describes well, instead of a second,
// drifting list. This file still owns detection (what a RECIPE calls for);
// toolTracking.js owns inventory + substitution (what YOU have, and what to
// do when you don't).
export const TOOL_CATALOG = [
  {
    id: 'cast_iron',
    name: 'Cast Iron Skillet',
    description: "The workhorse of the kitchen. Excellent heat retention and even distribution — perfect for searing proteins and finishing in the oven.",
    image: 'https://images.unsplash.com/photo-1584990347449-a0846f1a25b7?auto=format&fit=crop&q=80&w=600',
    trustStat: '12k+ home cooks',
    keywords: ['skillet', 'cast iron', 'cast-iron', 'sear', 'pan-fry', 'saute', 'sauté', 'fry'],
    onePan: true,
    genericExamples: [
      { title: 'Searing Proteins', desc: "The pan's thermal mass keeps temperature steady, so you get a deep crust without steaming the meat." },
      { title: 'Oven Finishing', desc: 'Start on the stovetop, then move the whole pan to the oven to cook through evenly.' },
    ],
  },
  {
    id: 'wok',
    name: 'Wok',
    description: 'High, sloped sides and blistering heat make quick work of stir-fries — everything cooks fast, in motion, without crowding.',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=600',
    trustStat: '5k+ home cooks',
    keywords: ['wok', 'stir-fry', 'stir fry'],
    onePan: true,
    genericExamples: [
      { title: 'High-Heat Stir-Frying', desc: 'The sloped sides let you toss ingredients constantly so nothing overcooks in one spot.' },
      { title: 'Flash-Cooking Aromatics', desc: 'Garlic, ginger, and chiles hit the hot oil for seconds, not minutes, to avoid burning.' },
    ],
  },
  {
    id: 'sheet_pan',
    name: 'Sheet Pan',
    description: 'One flat surface, high oven heat — everything roasts side by side with room to brown instead of steaming.',
    image: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=600',
    trustStat: '8k+ home cooks',
    keywords: ['sheet pan', 'baking sheet', 'roast', 'bake', 'oven'],
    onePan: true,
    genericExamples: [
      { title: 'Even Roasting', desc: 'Spreading everything in a single layer means hot air reaches every side instead of steaming pieces together.' },
      { title: 'Hands-Off Cooking', desc: 'Set a timer and walk away — no stirring or flipping needed until it comes out.' },
    ],
  },
  {
    id: 'dutch_oven',
    name: 'Dutch Oven / Stockpot',
    description: 'Thick walls hold a steady simmer for hours, so tough cuts and beans break down slowly without scorching.',
    image: 'https://images.unsplash.com/photo-1584949091598-c31daaaa4aa9?auto=format&fit=crop&q=80&w=600',
    trustStat: '10k+ home cooks',
    keywords: ['dutch oven', 'stockpot', 'stock pot', 'braise', 'simmer', 'stew', 'soup', 'boil'],
    onePan: true,
    genericExamples: [
      { title: 'Low & Slow Braising', desc: 'A tight lid traps moisture so tougher cuts turn tender without drying out.' },
      { title: 'Building Layers of Flavor', desc: 'Aromatics, then liquid, then a long simmer — all in the same pot.' },
    ],
  },
  {
    id: 'rice_cooker',
    name: 'Rice Cooker / Multi-Cooker',
    description: 'Not just for rice. The sealed, gently pressurised environment is ideal for steaming, braising, and hands-off grains while you prep the rest of the dish.',
    image: 'https://images.unsplash.com/photo-1584264514217-7e1c2fbde9cb?auto=format&fit=crop&q=80&w=600',
    trustStat: '9k+ home cooks',
    keywords: ['rice cooker', 'instant pot', 'pressure cook', 'steamer', 'steam'],
    onePan: false,
    genericExamples: [
      { title: 'Perfect Grains', desc: 'A steady ratio and automatic shut-off mean fluffy rice without watching the pot.' },
      { title: 'Gentle Steaming', desc: 'Rest ingredients in a basket above the water to cook them through delicately.' },
    ],
  },
  {
    id: 'air_fryer',
    name: 'Air Fryer / Convection Oven',
    description: 'Rapid hot-air circulation crisps food with a fraction of the oil. Great for the final crunch and for reheating without going soggy.',
    image: 'https://images.unsplash.com/photo-1585839215215-5f551e92d689?auto=format&fit=crop&q=80&w=600',
    trustStat: '7k+ home cooks',
    keywords: ['air fryer', 'air-fry', 'air fry'],
    onePan: false,
    genericExamples: [
      { title: 'Shatter-Crisp Edges', desc: 'The fan pulls moisture off the surface, so skins and coatings turn out crackly.' },
      { title: 'Fast Caramelisation', desc: 'Concentrated heat browns vegetables quickly while keeping the centres tender.' },
    ],
  },
  {
    id: 'grill',
    name: 'Grill',
    description: "Direct, high heat and open flame add char and smoke you can't get indoors — best for cuts that benefit from a hard sear.",
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600',
    trustStat: '6k+ home cooks',
    keywords: ['grill', 'grilled', 'barbecue', 'bbq'],
    onePan: false,
    genericExamples: [
      { title: 'Direct-Heat Charring', desc: "Open flame gives a smoky crust an indoor pan can't replicate." },
      { title: 'Resting Off Heat', desc: 'Moving food to a cooler zone lets residual heat finish it without burning the outside.' },
    ],
  },
  {
    id: 'blender',
    name: 'Blender / Food Processor',
    description: 'Turns aromatics, sauces, and marinades smooth in seconds — the shortcut for anything that needs to be pureed or emulsified.',
    image: 'https://images.unsplash.com/photo-1622480916113-9000ac49b79d?auto=format&fit=crop&q=80&w=600',
    trustStat: '4k+ home cooks',
    keywords: ['blend', 'blender', 'food processor', 'puree', 'purée', 'process'],
    onePan: false,
    genericExamples: [
      { title: 'Smooth Sauces', desc: 'A few pulses turn chunky aromatics into a silky base sauce.' },
      { title: 'Emulsifying Dressings', desc: 'Streaming in oil while blending keeps dressings from separating.' },
    ],
  },
  {
    id: 'slow_cooker',
    name: 'Slow Cooker',
    description: 'Low, steady heat over many hours — set it in the morning and come back to a fully cooked dish.',
    image: 'https://images.unsplash.com/photo-1585504198199-20277592b9e6?auto=format&fit=crop&q=80&w=600',
    trustStat: '6k+ home cooks',
    keywords: ['slow cooker', 'crockpot', 'crock pot'],
    onePan: true,
    genericExamples: [
      { title: 'All-Day Simmering', desc: 'Low, indirect heat tenderizes tough cuts without any attention needed.' },
      { title: 'Set & Forget', desc: "Load everything in the morning and it's ready by dinner." },
    ],
  },
];

function textOf(recipe, ings, steps) {
  return [
    recipe?.name || '', recipe?.description || '', recipe?.notes || '',
    ...(ings || []), ...(steps || []),
  ].join(' \n ').toLowerCase();
}

function stepsMentioning(steps, keywords) {
  return (steps || []).filter(s => {
    const t = (s || '').toLowerCase();
    return keywords.some(kw => t.includes(kw));
  });
}

/**
 * Build a recipe-specific equipment list for EquipmentGate. Returns null
 * (so the caller falls back to a curated default set) when nothing in the
 * catalog matches the recipe's text at all.
 */
export function detectEquipment(recipe, ings, steps) {
  const text = textOf(recipe, ings, steps);

  const scored = TOOL_CATALOG
    .map(def => {
      const hits = def.keywords.reduce((n, kw) => n + (text.includes(kw) ? 1 : 0), 0);
      const matchedSteps = stepsMentioning(steps, def.keywords);
      return { def, hits, matchedSteps };
    })
    .filter(x => x.hits > 0)
    .sort((a, b) => b.hits - a.hits || b.matchedSteps.length - a.matchedSteps.length);

  if (!scored.length) return null;

  return scored.slice(0, 3).map(({ def, matchedSteps }, toolIdx) => {
    // Ground at least one example in the recipe's own instructions when a
    // step actually mentions this tool, instead of only generic copy.
    const fromRecipe = matchedSteps.slice(0, 2).map((step, i) => ({
      id: `recipe-${i}`,
      title: 'In this recipe',
      desc: step,
    }));
    const examples = [...fromRecipe, ...def.genericExamples.map((e, i) => ({ id: `generic-${i}`, ...e }))]
      .slice(0, 3);

    // The top-ranked tool, if it's a single-vessel tool used across most of
    // the method, gets a link out to one-pan meals on the Social Feed.
    if (def.onePan && matchedSteps.length >= 2 && toolIdx === 0) {
      examples[examples.length - 1] = { ...examples[examples.length - 1], link: ONE_PAN_LINK };
    }

    return {
      id: def.id,
      name: def.name,
      description: def.description,
      image: def.image,
      adUrl: '#',
      trustStat: def.trustStat,
      examples,
    };
  });
}
