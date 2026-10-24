/* hydrationDIY.js — real DIY electrolyte-drink recipes with honestly-
   hedged cost comparison vs. store brands. Content-heavy, logic-light. */

// Local null-safe helpers (used across the Health & Safety sibling files;
// each file keeps its own copy to stay self-contained and avoid circular
// imports between siblings).
function ingredientText(ing) {
  return typeof ing === 'object' && ing !== null ? (ing.text || ing.name || '') : (ing || '');
}

function textOf(ingredients) {
  return (ingredients || []).map(ingredientText).join(' ').toLowerCase();
}

/* hydrationDIY.js — "Content module, low engineering." Real electrolyte
   science, real ratios, real DIY recipes — the same "you're paying for a
   mechanism you can replicate at home" thesis as Copycat Lab and Girl
   Dinner, pointed at sports drinks and hydration powders this time.

   The mechanism these recipes lean on is real, not marketing: sodium
   absorption in the small intestine is enhanced when co-transported with
   glucose (the SGLT1 transporter) — it's why oral rehydration solutions
   include a little sugar, and it's the actual physiology every branded
   "cellular transport" hydration product is describing in trademarked
   language. Real mechanism, replicable with what's in most kitchens.

   SCOPE HONESTY: these are everyday, palatable ratios for exercise/heat/a
   hangover — not the clinical WHO Oral Rehydration Solution formula (which
   is stronger, less palatable on purpose, and exists for treating real
   dehydration from illness, especially in infants and the elderly, under
   medical guidance). See DISCLAIMER — it says so plainly, every time. */

export const DISCLAIMER =
  'General hydration education for everyday use (exercise, heat, a hangover) — not a treatment for real dehydration from illness. Vomiting, diarrhea, or dehydration in an infant, an elderly person, or anyone who can\'t keep fluids down needs a doctor or real oral rehydration therapy, not a recipe.';

export const MECHANISM =
  'Sodium gets absorbed faster when it travels into your gut alongside a little glucose — the two share a transporter (SGLT1) in the small intestine. That\'s the entire "advanced electrolyte technology" behind most branded hydration products: real physiology, and it works exactly the same whether the sodium and sugar come from a $2 packet or a squeezed lemon and a spoon of honey.';

// ── When water alone isn't quite enough — real, ordinary reasons ──────────
export const WHEN_YOU_NEED_MORE = [
  { id: 'exercise', label: 'Sustained exercise, 60+ minutes', why: 'Sweat carries real sodium loss, and past about an hour, plain water alone can\'t keep pace — this is also why over-hydrating with only water during endurance exercise is a real, documented risk (exercise-associated hyponatremia), not a myth.' },
  { id: 'heat', label: 'Heavy sweating in heat', why: 'Same mechanism as exercise — the sweat itself is the electrolyte loss, regardless of whether you\'re moving.' },
  { id: 'illness', label: 'Vomiting or diarrhea', why: 'Real fluid AND electrolyte loss, fast. Mild cases in healthy adults are a reasonable place for a DIY drink; anything more than mild, or affecting an infant, elderly person, or anyone who can\'t keep fluids down, needs real medical care — see DISCLAIMER.' },
  { id: 'nursing', label: 'Nursing', why: 'Milk production raises fluid needs sharply and thirst tends to hit suddenly mid-feed — the same real mechanism pregnancyGuide.js\'s hydration section already covers for that stage.' },
  { id: 'hangover', label: 'A hangover', why: 'Alcohol is a real diuretic — it suppresses the hormone that helps you retain water, which is a genuine, mechanical reason a hangover feels dehydrated, not just tiredness.' },
];

// ── Real DIY recipes — per 1 liter (about 4 cups) unless noted. Ratios are
// deliberately on the light/palatable side for everyday use, not clinical
// rehydration strength (see DISCLAIMER). ────────────────────────────────────
export const RECIPES = [
  {
    id: 'classic-citrus',
    name: 'Classic Citrus Electrolyte Water',
    ingredients: ['1 liter water', '1/4 tsp salt', '2–3 tbsp fresh lemon or lime juice', '2 tbsp honey or sugar'],
    method: 'Stir the salt into a splash of warm water until it dissolves, then combine with the rest. Taste — more citrus if it\'s flat, more honey if it\'s too salty.',
    why: 'The base ratio: real sodium (the salt), real glucose for the cotransport mechanism (the honey), and citrus for both potassium and flavor.',
  },
  {
    id: 'coconut-potassium',
    name: 'Coconut Potassium Boost',
    ingredients: ['2 cups coconut water', '2 cups regular water', '1/4 tsp salt', 'squeeze of lime'],
    method: 'Combine and chill.',
    why: 'Coconut water is a genuinely good potassium source (roughly 600mg a cup) — but it\'s naturally LOW in sodium, which is the more common myth here: "coconut water" and "electrolyte drink" get used interchangeably, but on its own it\'s missing the half of the equation your sweat actually loses the most of. The added salt is what makes this one balanced, not decorative.',
  },
  {
    id: 'watermelon-mint',
    name: 'Watermelon Mint Cooler',
    ingredients: ['2 cups watermelon, blended and strained', '2 cups water', '1/4 tsp salt', 'small handful mint, torn', 'squeeze of lime'],
    method: 'Blend the watermelon, strain out the pulp if you want it smooth, stir in the rest.',
    why: 'Watermelon brings real potassium and natural sugar (the glucose half of the mechanism) along with a lot of actual water content — genuinely one of the more hydrating things to blend.',
  },
  {
    id: 'ginger-ade',
    name: 'Ginger-Ade (for an unsettled stomach)',
    ingredients: ['1 liter water', '1 tbsp fresh ginger, grated or thinly sliced', '1/4 tsp salt', '2 tbsp honey', 'squeeze of lemon'],
    method: 'Steep the ginger in hot water 10 minutes, strain, stir in the rest, then chill or drink warm.',
    why: 'Ginger has real, reasonably well-studied anti-nausea effects — a sensible pairing for the illness use case specifically. Mild cases only; see DISCLAIMER.',
  },
  {
    id: 'chocolate-milk',
    name: 'Chocolate Milk (the one nobody has to make)',
    ingredients: ['Milk you already have', 'Chocolate syrup or cocoa + sugar'],
    method: 'Mix. That\'s it.',
    why: 'Genuinely real sports-recovery science: protein + carbohydrate + fluid + some natural sodium and potassium in one familiar drink. Not a myth or a stretch — it\'s a commonly cited real post-exercise recovery option, and it\'s usually already in the fridge.',
  },
];

// ── Real, honestly-hedged cost comparison ──────────────────────────────────
export const STORE_REFERENCE = [
  { name: 'Liquid I.V. (single stick)', approxCost: 1.25 },
  { name: 'Gatorade (20oz bottle)', approxCost: 1.75 },
  { name: 'Pedialyte (single bottle)', approxCost: 2.5 },
];

// Rough per-liter DIY ingredient cost — salt is negligible, citrus and honey
// carry the real cost. Deliberately approximate, said out loud as such.
const DIY_COST_PER_LITER = 0.3;
const SERVINGS_PER_LITER = 4;

export function savingsSummary() {
  const diyPerServing = DIY_COST_PER_LITER / SERVINGS_PER_LITER;
  return STORE_REFERENCE.map((s) => ({
    name: s.name,
    storeCost: s.approxCost,
    diyCost: Math.round(diyPerServing * 100) / 100,
    savedPct: Math.round((1 - diyPerServing / s.approxCost) * 100),
  }));
}

export const SAVINGS_NOTE =
  'Rough, real-world estimates, not a price quote — salt is basically free, citrus and honey are the real cost. The gap holds regardless of the exact grocery prices near you.';
