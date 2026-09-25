/* nutritionFacts.js — the macro reference used by BuildBar (and anything
   else that wants a running nutrition total). Values are typical USDA-style
   figures for a common home-cook serving of each ingredient, hand-entered —
   not a lab measurement of a specific brand or product, and not medical
   advice. Same honesty posture as gutHealth.js: a real, checkable reference,
   with the disclaimer said once instead of implied. */

export const NUTRITION_DISCLAIMER =
  'Typical values for a common serving — not a lab measurement of any specific brand, and exact numbers vary by product and prep.';

// FDA Nutrition Facts label reference values (2,000-calorie diet) — the same
// public %DV baseline that's on every packaged food label in the US, so
// "38% DV" here means the same thing it means on a cereal box.
export const DAILY_VALUES = {
  calories: 2000,
  protein: 50,     // g
  carbs: 275,      // g
  fat: 78,          // g
  fiber: 28,        // g
  sugar: 50,        // g, added sugars
  sodium: 2300,     // mg
};

export const MACRO_UNITS = {
  calories: '', protein: 'g', carbs: 'g', fat: 'g', fiber: 'g', sugar: 'g', sodium: 'mg',
};

export const MACRO_LABELS = {
  calories: 'Calories', protein: 'Protein', carbs: 'Carbs', fat: 'Fat',
  fiber: 'Fiber', sugar: 'Sugar', sodium: 'Sodium',
};

/* ── Why each macro matters — written once, in plain terms, so the app
   explains it directly instead of leaving the door open for someone selling
   a course to "explain" it for a fee. Real mechanisms, hedged where the
   research is directional rather than settled. ── */
export const MACRO_EXPLAINERS = {
  fiber: {
    title: 'Why fiber matters',
    body: "Fiber slows digestion, which is a big part of why fiber-rich meals keep you full longer than the same calories from refined carbs (Slavin, Nutrition 2005 — a well-cited review on fiber and satiety). It also feeds gut bacteria, which ferment it into short-chain fatty acids your colon cells use as fuel. Most US adults eat well under the 25–38g/day recommended. This is why \"high fiber\" shows up so often in weight-management advice — it's a real, mechanical effect, not a marketing word.",
  },
  protein: {
    title: 'Why protein matters',
    body: "Protein breaks down into amino acids your body uses to build and repair muscle tissue — that repair-and-rebuild cycle (muscle protein synthesis) is how muscle is actually gained, and it needs a steady protein supply to keep up with training (International Society of Sports Nutrition's position stand puts the useful range around 0.7–1g per pound of bodyweight for people actively training). Protein is also the most satiating macro gram-for-gram, so a protein-forward meal tends to hold hunger off longer than an equal-calorie carb-heavy one.",
  },
  carbs: {
    title: 'Why carbs matter',
    body: "Carbs are the body's preferred, fastest-access fuel — they break down into glucose, which powers everything from a workout to normal brain function. \"Complex\" carbs (whole grains, legumes, vegetables) come bundled with fiber and digest slower, giving steadier energy; refined carbs (white bread, white rice, sugar) digest fast, which is useful for quick energy but less filling per calorie.",
  },
  fat: {
    title: 'Why fat matters',
    body: "Fat is calorie-dense (9 calories per gram vs. 4 for protein or carbs) but it's not something to avoid — it's essential for hormone production, absorbing vitamins A/D/E/K, and it slows digestion, which adds to satiety. The type matters more than the total: unsaturated fats (olive oil, avocado, nuts, fish) are generally favored over saturated fat in current dietary guidelines.",
  },
  sugar: {
    title: 'Why added sugar is tracked separately',
    body: "The FDA label distinguishes \"added sugars\" from sugar naturally in fruit or dairy because they hit the body the same way but carry none of the fiber or nutrients that come with, say, an apple. Added sugar digests fast with no fiber to slow it down, so it doesn't add much satiety per calorie. Current FDA guidance is to keep added sugar under 10% of daily calories (50g on a 2,000-calorie diet).",
  },
  sodium: {
    title: 'Why sodium is tracked',
    body: "Sodium is essential for fluid balance and nerve function in small amounts, but most people eat well over what they need — mainly from restaurant food, packaged sauces, and cheese rather than the salt shaker. Consistently high sodium intake is linked to higher blood pressure in a meaningful share of the population. FDA guidance is to stay under 2,300mg/day (roughly one teaspoon of salt, from all sources combined).",
  },
};

/* ── Salad ingredients ── */
export const SALAD_BASES = [
  { id: 'romaine',      label: 'Romaine lettuce',   unit: '2 cups',   calories: 16,  protein: 1,   carbs: 3,  fat: 0,   fiber: 2,   sugar: 1,   sodium: 8 },
  { id: 'spinach',      label: 'Spinach',           unit: '2 cups',   calories: 14,  protein: 1.7, carbs: 2.2, fat: 0.2, fiber: 1.3, sugar: 0.3, sodium: 47 },
  { id: 'spring-mix',   label: 'Spring mix',        unit: '2 cups',   calories: 20,  protein: 1.5, carbs: 3,  fat: 0.3, fiber: 1.5, sugar: 1,   sodium: 15 },
  { id: 'kale',         label: 'Kale, chopped',     unit: '2 cups',   calories: 34,  protein: 2.2, carbs: 7,  fat: 0.5, fiber: 1.4, sugar: 0,   sodium: 30 },
];
export const SALAD_PROTEINS = [
  { id: 'grilled-chicken', label: 'Grilled chicken breast', unit: '4 oz', calories: 165, protein: 31, carbs: 0,  fat: 4,   fiber: 0, sugar: 0, sodium: 74 },
  { id: 'chickpeas',       label: 'Chickpeas',              unit: '½ cup', calories: 135, protein: 7,  carbs: 22, fat: 2,   fiber: 6, sugar: 4, sodium: 6 },
  { id: 'black-beans',     label: 'Black beans',            unit: '½ cup', calories: 114, protein: 7.6, carbs: 20, fat: 0.5, fiber: 7.5, sugar: 0.3, sodium: 2 },
  { id: 'hard-boiled-egg', label: 'Hard-boiled egg',        unit: '1 large', calories: 78, protein: 6,  carbs: 0.6, fat: 5,  fiber: 0, sugar: 0.6, sodium: 62 },
  { id: 'grilled-shrimp',  label: 'Grilled shrimp',         unit: '4 oz', calories: 120, protein: 24, carbs: 1,  fat: 1.4, fiber: 0, sugar: 0, sodium: 190 },
  { id: 'tofu',            label: 'Tofu, firm',             unit: '4 oz', calories: 88,  protein: 10, carbs: 2,  fat: 5,   fiber: 1, sugar: 1, sodium: 8 },
  { id: 'grilled-salmon',  label: 'Grilled salmon',         unit: '4 oz', calories: 233, protein: 25, carbs: 0,  fat: 14,  fiber: 0, sugar: 0, sodium: 60 },
];
export const SALAD_TOPPINGS = [
  { id: 'cherry-tomatoes', label: 'Cherry tomatoes', unit: '½ cup', calories: 15, protein: 0.7, carbs: 3.3, fat: 0.2, fiber: 1,   sugar: 2,   sodium: 4 },
  { id: 'cucumber',        label: 'Cucumber',        unit: '½ cup', calories: 8,  protein: 0.3, carbs: 2,   fat: 0,   fiber: 0.3, sugar: 1,   sodium: 1 },
  { id: 'red-onion',       label: 'Red onion',       unit: '2 tbsp', calories: 8,  protein: 0.2, carbs: 2,   fat: 0,   fiber: 0.3, sugar: 1,   sodium: 1 },
  { id: 'bell-pepper',     label: 'Bell pepper',     unit: '½ cup', calories: 15, protein: 0.5, carbs: 3.5, fat: 0.1, fiber: 1.3, sugar: 2,   sodium: 2 },
  { id: 'shredded-carrot', label: 'Shredded carrot', unit: '¼ cup', calories: 13, protein: 0.3, carbs: 3,   fat: 0,   fiber: 0.9, sugar: 1.5, sodium: 21 },
  { id: 'avocado',         label: 'Avocado',         unit: '¼ whole', calories: 80, protein: 1,  carbs: 4,  fat: 7,   fiber: 3,   sugar: 0,   sodium: 3 },
  { id: 'corn',            label: 'Corn',            unit: '¼ cup', calories: 33, protein: 1,  carbs: 7,   fat: 0.5, fiber: 1,   sugar: 1.5, sodium: 4 },
  { id: 'roasted-sweet-potato', label: 'Roasted sweet potato', unit: '½ cup', calories: 90, protein: 1.6, carbs: 21, fat: 0.1, fiber: 3.3, sugar: 4, sodium: 36 },
  { id: 'feta',            label: 'Feta, crumbled',  unit: '¼ cup', calories: 100, protein: 5.3, carbs: 1.5, fat: 8, fiber: 0, sugar: 1,   sodium: 370 },
  { id: 'cheddar',         label: 'Cheddar, shredded', unit: '¼ cup', calories: 110, protein: 7, carbs: 0.5, fat: 9, fiber: 0, sugar: 0,   sodium: 180 },
  { id: 'black-olives-salad', label: 'Black olives', unit: '2 tbsp', calories: 25, protein: 0.2, carbs: 1.3, fat: 2.3, fiber: 0.6, sugar: 0, sodium: 150 },
];
export const SALAD_CRUNCH = [
  { id: 'croutons',      label: 'Croutons',        unit: '¼ cup', calories: 60,  protein: 1.5, carbs: 9,  fat: 2,  fiber: 0.5, sugar: 0.5, sodium: 120 },
  { id: 'tortilla-strips', label: 'Tortilla strips', unit: '¼ cup', calories: 70, protein: 1,  carbs: 9,  fat: 3.5, fiber: 0.7, sugar: 0,   sodium: 55 },
  { id: 'sliced-almonds', label: 'Sliced almonds',  unit: '2 tbsp', calories: 90, protein: 3,  carbs: 3,  fat: 8,  fiber: 2,   sugar: 0.6, sodium: 0 },
  { id: 'sunflower-seeds', label: 'Sunflower seeds', unit: '2 tbsp', calories: 100, protein: 3.4, carbs: 3.5, fat: 8.7, fiber: 1.5, sugar: 0.3, sodium: 1 },
];
export const SALAD_DRESSINGS = [
  { id: 'balsamic-vinaigrette', label: 'Balsamic vinaigrette', unit: '2 tbsp', calories: 90,  protein: 0, carbs: 3,  fat: 9,  fiber: 0, sugar: 2,  sodium: 150 },
  { id: 'ranch',                label: 'Ranch',                unit: '2 tbsp', calories: 140, protein: 0.4, carbs: 2, fat: 14, fiber: 0, sugar: 1,  sodium: 260 },
  { id: 'caesar',                label: 'Caesar',               unit: '2 tbsp', calories: 150, protein: 1, carbs: 1,  fat: 16, fiber: 0, sugar: 0.5, sodium: 300 },
  { id: 'olive-oil-lemon',      label: 'Olive oil & lemon',    unit: '2 tbsp', calories: 120, protein: 0, carbs: 0.5, fat: 14, fiber: 0, sugar: 0,  sodium: 0 },
  { id: 'greek-yogurt-ranch',   label: 'Greek yogurt ranch',   unit: '2 tbsp', calories: 35,  protein: 3, carbs: 3,  fat: 1,  fiber: 0, sugar: 2,  sodium: 95 },
];

/* ── Pizza ingredients ── */
export const PIZZA_CRUSTS = [
  { id: 'white-crust',      label: 'Classic white crust', unit: '1 personal pizza', calories: 300, protein: 9,  carbs: 55, fat: 4,  fiber: 2,  sugar: 2, sodium: 500 },
  { id: 'whole-wheat-crust', label: 'Whole wheat crust',  unit: '1 personal pizza', calories: 280, protein: 10, carbs: 50, fat: 4,  fiber: 6,  sugar: 2, sodium: 480 },
  { id: 'cauliflower-crust', label: 'Cauliflower crust',  unit: '1 personal pizza', calories: 120, protein: 6,  carbs: 14, fat: 5,  fiber: 3,  sugar: 3, sodium: 380 },
  { id: 'chickpea-crust',    label: 'Chickpea crust',     unit: '1 personal pizza', calories: 190, protein: 10, carbs: 26, fat: 6,  fiber: 6,  sugar: 2, sodium: 300 },
  { id: 'almond-crust',      label: 'Almond flour crust', unit: '1 personal pizza', calories: 220, protein: 9,  carbs: 8,  fat: 18, fiber: 4,  sugar: 2, sodium: 320 },
];
export const PIZZA_SAUCES = [
  { id: 'marinara-pizza', label: 'Marinara',     unit: '¼ cup', calories: 40,  protein: 1.5, carbs: 8,  fat: 0.5, fiber: 2, sugar: 5,  sodium: 380 },
  { id: 'pesto-pizza',    label: 'Pesto',        unit: '¼ cup', calories: 160, protein: 2,  carbs: 2,  fat: 16, fiber: 0.5, sugar: 0.5, sodium: 220 },
  { id: 'bbq-pizza',      label: 'BBQ sauce',    unit: '¼ cup', calories: 70,  protein: 0.5, carbs: 17, fat: 0.2, fiber: 0.5, sugar: 13, sodium: 320 },
  { id: 'olive-oil-garlic', label: 'Olive oil & garlic', unit: '2 tbsp', calories: 120, protein: 0, carbs: 1, fat: 14, fiber: 0, sugar: 0, sodium: 5 },
];
export const PIZZA_CHEESES = [
  { id: 'mozzarella-part-skim', label: 'Mozzarella, part-skim', unit: '¼ cup', calories: 85, protein: 8, carbs: 1, fat: 6,  fiber: 0, sugar: 0, sodium: 175 },
  { id: 'feta-pizza',           label: 'Feta, crumbled',        unit: '¼ cup', calories: 100, protein: 5.3, carbs: 1.5, fat: 8, fiber: 0, sugar: 1, sodium: 370 },
  { id: 'vegan-cheese',         label: 'Vegan cheese',          unit: '¼ cup', calories: 70,  protein: 0.5, carbs: 3, fat: 5,  fiber: 0.5, sugar: 0, sodium: 300 },
];
export const PIZZA_TOPPINGS = [
  { id: 'grilled-chicken-pizza', label: 'Grilled chicken', unit: '3 oz', calories: 140, protein: 26, carbs: 0, fat: 3,  fiber: 0, sugar: 0, sodium: 55 },
  { id: 'pepperoni',             label: 'Pepperoni',       unit: '1 oz', calories: 130, protein: 6,  carbs: 1, fat: 12, fiber: 0, sugar: 0, sodium: 490 },
  { id: 'mushroom-pizza',        label: 'Mushrooms',       unit: '½ cup', calories: 15, protein: 1.5, carbs: 2, fat: 0.2, fiber: 0.5, sugar: 1, sodium: 3 },
  { id: 'bell-pepper-pizza',     label: 'Bell peppers',    unit: '½ cup', calories: 15, protein: 0.5, carbs: 3.5, fat: 0.1, fiber: 1.3, sugar: 2, sodium: 2 },
  { id: 'red-onion-pizza',       label: 'Red onion',       unit: '2 tbsp', calories: 8,  protein: 0.2, carbs: 2, fat: 0,  fiber: 0.3, sugar: 1, sodium: 1 },
  { id: 'spinach-pizza',         label: 'Spinach',         unit: '½ cup', calories: 3,  protein: 0.4, carbs: 0.5, fat: 0, fiber: 0.3, sugar: 0, sodium: 12 },
  { id: 'black-olives-pizza',    label: 'Black olives',    unit: '2 tbsp', calories: 25, protein: 0.2, carbs: 1.3, fat: 2.3, fiber: 0.6, sugar: 0, sodium: 150 },
  { id: 'pineapple-pizza',       label: 'Pineapple',       unit: '¼ cup', calories: 20, protein: 0.2, carbs: 5, fat: 0,  fiber: 0.6, sugar: 4, sodium: 0 },
  { id: 'basil-pizza',           label: 'Fresh basil',     unit: 'handful', calories: 2, protein: 0.2, carbs: 0.2, fat: 0, fiber: 0.2, sugar: 0, sodium: 0 },
];

/* ── Pasta ingredients ── */
export const PASTA_BASES = [
  { id: 'white-pasta',    label: 'White flour pasta', unit: '2 oz dry', calories: 200, protein: 7,  carbs: 42, fat: 1,  fiber: 2,  sugar: 2, sodium: 0 },
  { id: 'whole-wheat-pasta', label: 'Whole wheat pasta', unit: '2 oz dry', calories: 180, protein: 8, carbs: 37, fat: 1, fiber: 6,  sugar: 2, sodium: 0 },
  { id: 'chickpea-pasta', label: 'Chickpea pasta',    unit: '2 oz dry', calories: 190, protein: 13, carbs: 32, fat: 3,  fiber: 8,  sugar: 3, sodium: 55 },
  { id: 'lentil-pasta',   label: 'Lentil pasta',      unit: '2 oz dry', calories: 190, protein: 13, carbs: 33, fat: 1,  fiber: 7,  sugar: 2, sodium: 10 },
  { id: 'zucchini-noodles', label: 'Zucchini noodles', unit: '2 cups',  calories: 40,  protein: 3,  carbs: 8,  fat: 0.5, fiber: 2,  sugar: 5, sodium: 32 },
  { id: 'spaghetti-squash', label: 'Spaghetti squash', unit: '1 cup',   calories: 42,  protein: 1,  carbs: 10, fat: 0.4, fiber: 2.2, sugar: 4, sodium: 28 },
];
export const PASTA_SAUCES = [
  { id: 'marinara-pasta', label: 'Marinara',   unit: '½ cup', calories: 80,  protein: 3, carbs: 16, fat: 1,  fiber: 4, sugar: 10, sodium: 460 },
  { id: 'pesto-pasta',    label: 'Pesto',      unit: '¼ cup', calories: 160, protein: 2, carbs: 2,  fat: 16, fiber: 0.5, sugar: 0.5, sodium: 220 },
  { id: 'alfredo',        label: 'Alfredo',    unit: '¼ cup', calories: 110, protein: 2, carbs: 3,  fat: 10, fiber: 0, sugar: 1, sodium: 300 },
  { id: 'olive-oil-garlic-pasta', label: 'Olive oil & garlic', unit: '2 tbsp', calories: 120, protein: 0, carbs: 1, fat: 14, fiber: 0, sugar: 0, sodium: 5 },
];
export const PASTA_PROTEINS = [
  { id: 'grilled-chicken-pasta', label: 'Grilled chicken', unit: '3 oz', calories: 140, protein: 26, carbs: 0, fat: 3,  fiber: 0, sugar: 0, sodium: 55 },
  { id: 'shrimp-pasta',          label: 'Shrimp',          unit: '4 oz', calories: 120, protein: 24, carbs: 1, fat: 1.4, fiber: 0, sugar: 0, sodium: 190 },
  { id: 'italian-sausage',       label: 'Italian sausage', unit: '3 oz', calories: 260, protein: 14, carbs: 2, fat: 21, fiber: 0, sugar: 0, sodium: 620 },
  { id: 'meatballs',             label: 'Meatballs',       unit: '3 small', calories: 210, protein: 12, carbs: 6, fat: 15, fiber: 0.5, sugar: 1, sodium: 380 },
  { id: 'tofu-pasta',            label: 'Tofu, firm',      unit: '4 oz', calories: 88,  protein: 10, carbs: 2, fat: 5, fiber: 1, sugar: 1, sodium: 8 },
];
export const PASTA_MIXINS = [
  { id: 'cherry-tomatoes-pasta', label: 'Cherry tomatoes', unit: '½ cup', calories: 15, protein: 0.7, carbs: 3.3, fat: 0.2, fiber: 1, sugar: 2, sodium: 4 },
  { id: 'spinach-pasta',         label: 'Spinach',         unit: '1 cup', calories: 7,  protein: 0.9, carbs: 1.1, fat: 0.1, fiber: 0.7, sugar: 0.1, sodium: 24 },
  { id: 'mushroom-pasta',        label: 'Mushrooms',       unit: '½ cup', calories: 15, protein: 1.5, carbs: 2,  fat: 0.2, fiber: 0.5, sugar: 1, sodium: 3 },
  { id: 'garlic-pasta',          label: 'Garlic',          unit: '2 cloves', calories: 9, protein: 0.4, carbs: 2, fat: 0,  fiber: 0.1, sugar: 0, sodium: 1 },
  { id: 'sundried-tomato',       label: 'Sun-dried tomato', unit: '2 tbsp', calories: 30, protein: 1.6, carbs: 6, fat: 0.3, fiber: 1.4, sugar: 4, sodium: 130 },
  { id: 'peas-pasta',            label: 'Peas',            unit: '½ cup', calories: 62, protein: 4,  carbs: 11, fat: 0.3, fiber: 4.4, sugar: 4, sodium: 58 },
  { id: 'parmesan',              label: 'Parmesan, grated', unit: '2 tbsp', calories: 45, protein: 4, carbs: 0.4, fat: 3, fiber: 0, sugar: 0, sodium: 190 },
  { id: 'ricotta',               label: 'Ricotta',         unit: '¼ cup', calories: 100, protein: 7, carbs: 2,  fat: 8,  fiber: 0, sugar: 0, sodium: 45 },
];

const MACRO_KEYS = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'];

/** Sum macros across any list of picked ingredient objects. */
export function sumMacros(items) {
  const total = Object.fromEntries(MACRO_KEYS.map((k) => [k, 0]));
  for (const item of items || []) {
    for (const k of MACRO_KEYS) total[k] += item[k] || 0;
  }
  return total;
}

/** Real FDA %DV for each macro in a totals object, capped visually at 100+. */
export function percentDV(totals) {
  return Object.fromEntries(
    MACRO_KEYS.map((k) => [k, Math.round(((totals[k] || 0) / DAILY_VALUES[k]) * 100)])
  );
}
