/* ════════════════════════════════════════════════════════════
   Shared "boost / adapt" content for the recipe detail + full pages
   ════════════════════════════════════════════════════════════ */

// Cheap, high-impact vegetables a user can tap to add to any recipe.
export const VEGGIE_BOOSTS = [
  {
    name: 'Lentils',
    tip: 'Red lentils dissolve right into sauces',
    benefit: '18g protein per cup — the cheapest complete meal booster',
  },
  {
    name: 'Sweet Potato',
    tip: 'Cube small so it cooks in 10 min',
    benefit: 'Complex carbs + Vitamin A — sustained energy, no crash',
  },
  {
    name: 'Broccoli',
    tip: 'Steam or stir-fry 3–4 min',
    benefit: 'Sulforaphane — one of the most studied anti-inflammatories',
  },
  {
    name: 'Chickpeas',
    tip: 'Rinse a can, add for bulk & protein',
    benefit: '7g protein + 6g fiber per ½ cup — filling & cheap',
  },
  {
    name: 'Edamame',
    tip: 'Frozen bag thaws in 2 min of boiling',
    benefit: 'Complete plant protein + Vitamin K — rare in plant foods',
  },
  {
    name: 'Kale',
    tip: 'Massage with a drop of oil first',
    benefit: 'Vitamin C + calcium — bone & immune support',
  },
];

// One-tap recipe adaptations, each with concrete swap suggestions.
export const ADAPTATIONS = [
  {
    key: '+ PROTEIN',
    tips: [
      'Stir in a can of chickpeas, lentils, or white beans',
      'Add eggs, tofu, or shredded rotisserie chicken',
      'Top with Greek yogurt or a handful of nuts',
    ],
  },
  {
    key: '+ FIBER',
    tips: [
      'Swap white rice or pasta for brown rice or quinoa',
      'Add a cup of beans, lentils, or extra vegetables',
      'Leave the skins on potatoes and veg',
    ],
  },
  {
    key: 'LOWER CARBS',
    tips: [
      'Swap rice/pasta for cauliflower rice or zucchini noodles',
      'Halve the grain and double the vegetables',
      'Use lettuce wraps instead of bread or tortillas',
    ],
  },
];
