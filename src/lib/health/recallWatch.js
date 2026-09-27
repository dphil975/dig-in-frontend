/* health/recallWatch.js — consolidated Health & Safety module.
   Merged from src/lib/recallWatch.js + src/lib/nutritionFacts.js +
   src/lib/pregnancyGuide.js as part of the lib/ → lib/health/
   reorganization. The old flat files now re-export from here so nothing
   else in the app needs to change.

   No identifier conflicts between the three originals — this is a straight
   concatenation, each section marked with its source file below. The only
   change from the originals is recallWatch's `checkFoodRecalls` import,
   whose relative path moved one directory deeper (lib/ → lib/health/). */


export * from './recalls';

/* ════════════════════════════════════════════════════════════════════════
   FROM: src/lib/nutritionFacts.js
   ════════════════════════════════════════════════════════════════════════ */

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

/* ════════════════════════════════════════════════════════════════════════
   FROM: src/lib/pregnancyGuide.js
   ════════════════════════════════════════════════════════════════════════ */

/* pregnancyGuide.js — real, ingredient-based support for the "Pregnant" and
   "New baby" life modes.

   Two halves:

   1. THE FEED LENS (original, unchanged): which real recipes are actually
      iron/folate-forward, and a soft flag on the well-established pregnancy
      food-safety categories. nutrientTagsFor() and pregnancyCaution() keep
      their exact original signatures — feedSlots.js and Home/buildFeed.js
      both depend on them. Recipes that match a caution are DEPRIORITIZED
      (the same soft-suppress the season lens uses), never hidden. The user
      decides; we just don't lead with them.

   2. THE STAGE LAYER (new): trimester- and postpartum-aware nutrition
      context, and craving interpretation. Postpartum was missing entirely,
      which is the gap that mattered most — the fourth trimester is when
      people are least able to cook and get the least support for it.

   SCOPE HONESTY. This is a keyword net over public-health-agency-level
   guidance (CDC / FDA / ACOG "foods to avoid" lists), written as education,
   NOT medical advice, NOT exhaustive, and NOT a diagnosis. Pregnancy and
   postpartum nutrition are genuinely individual and genuinely consequential —
   every surface that renders this must carry DISCLAIMER and must defer to an
   OB, midwife, or dietitian. Nothing here tells anyone to take a supplement
   or change a diet.

   ONE DELIBERATE REFUSAL: this file does not repeat lactation-supplement
   marketing. See LACTATION_HONESTY — the evidence for "milk-boosting" foods
   is weak, and an app that exists partly to cut out brands selling you things
   should not sell you lactation cookies.

   NOTE: this section's local `ingredientText(recipe)` helper takes a whole
   recipe object (name + ingredients) and is intentionally kept separate from
   the ingredient-list-shaped `ingredientText` helpers living in
   health/wellnessGoals.js and health/allergyProfile.js — same name, different
   shape, no collision since each lives in its own module. */

const IRON_RICH = /spinach|lentil|chickpea|black beans?|kidney beans?|red meat|\bbeef\b|liver|tofu|quinoa|fortified cereal|pumpkin seed|dark leafy/i;
const FOLATE_RICH = /spinach|leafy greens?|kale|asparagus|avocado|broccoli|lentil|chickpea|black beans?|citrus|\borange\b|fortified/i;

// A keyword net, not a medical database — see file header.
const PREGNANCY_CAUTION = /\bsushi\b|\bsashimi\b|raw (fish|salmon|tuna|oyster|egg)s?|unpasteurized|soft[- ]ripened|\bbrie\b|camembert|blue cheese|roquefort|deli meat|cold cuts|\bprosciutto\b|\bpat[eé]\b|\balcohol\b|\bwine\b|\bbeer\b|\brum\b|\bvodka\b|\bwhiskey\b|swordfish|king mackerel|\bahi\b|shark meat/i;

function ingredientText(recipe) {
  const lines = (recipe?.ingredients || []).map((i) => (typeof i === 'object' ? i.text || i.name || '' : i));
  return `${recipe?.name || ''} ${lines.join(' ')}`.toLowerCase();
}

/** Real structured tags for a recipe that's actually iron- and/or
    folate-forward by ingredient — only added when the recipe earns them. */
export function nutrientTagsFor(recipe) {
  const hay = ingredientText(recipe);
  const out = [];
  if (IRON_RICH.test(hay)) out.push('#ironrich');
  if (FOLATE_RICH.test(hay)) out.push('#folate');
  return out;
}

/** Does this recipe hit one of the common pregnancy-caution categories? */
export function pregnancyCaution(recipe) {
  return PREGNANCY_CAUTION.test(ingredientText(recipe));
}

/* ── Disclaimers ─────────────────────────────────────────────────────────── */

export const DISCLAIMER =
  'General nutrition education, not medical advice. Pregnancy and postpartum nutrition are individual and consequential — your OB, midwife, or a registered dietitian is the actual source here, not an app.';

export const CAUTION_DISCLAIMER =
  'A keyword flag over public-health "foods to avoid" lists (CDC/FDA/ACOG), not a lab test and not exhaustive. It can miss things and it can over-flag. Nothing is hidden from you — flagged recipes just stop leading the feed.';

/* ── Why each caution category exists ────────────────────────────────────────
   The original code returned a bare boolean, which tells someone their dinner
   is wrong without telling them why — the exact "trust me" posture this app is
   supposed to be the opposite of. Each category now carries its real reason so
   a person can make their own call, including deciding the risk is fine. */

export const CAUTION_CATEGORIES = [
  {
    id: 'raw-fish',
    label: 'Raw or undercooked fish/shellfish',
    test: /\bsushi\b|\bsashimi\b|raw (fish|salmon|tuna|oyster)s?|\bceviche\b|raw oysters?/i,
    why: 'Risk of listeria and parasites. Listeria is the specific concern in pregnancy because it can cross the placenta, and pregnancy raises susceptibility to it considerably.',
    instead: 'The same dish cooked through — a seared or fully-cooked version of the same fish is not on the avoid list.',
  },
  {
    id: 'high-mercury',
    label: 'High-mercury fish',
    test: /swordfish|king mackerel|\bahi\b|bigeye|shark meat|tilefish|marlin/i,
    why: 'Methylmercury accumulates in large, long-lived predator fish and can affect fetal neurological development. This is about which species, not about fish in general.',
    instead: 'FDA/EPA "best choices" — salmon, sardines, shrimp, cod, tilapia, canned light tuna. Fish is actively recommended in pregnancy; it is specifically the high-mercury species that are not.',
  },
  {
    id: 'unpasteurized',
    label: 'Unpasteurized dairy & soft-ripened cheese',
    test: /unpasteurized|raw milk|soft[- ]ripened|\bbrie\b|camembert|blue cheese|roquefort|gorgonzola|queso fresco|feta/i,
    why: 'Listeria again — it survives refrigeration, which is why soft cheeses specifically come up. Pasteurization is the step that removes the risk.',
    instead: 'The pasteurized version of the same cheese. Most supermarket brie, feta, and blue cheese in the US already are — it says so on the label.',
  },
  {
    id: 'deli-meat',
    label: 'Deli meat, cold cuts, pâté',
    test: /deli meat|cold cuts|\bprosciutto\b|\bpat[eé]\b|\bsalami\b|\bbologna\b/i,
    why: 'Listeria risk from ready-to-eat meats held cold. The commonly-given workaround is heat, not abstinence.',
    instead: 'Heating it until steaming (roughly 165°F) is the standard guidance — a hot sandwich rather than a cold one.',
  },
  {
    id: 'raw-egg',
    label: 'Raw or runny egg',
    test: /raw eggs?|runny eggs?|\bmeringue\b|raw (cookie )?dough|homemade (mayo|mayonnaise|aioli|caesar)/i,
    why: 'Salmonella risk. Comes up more often than people expect, because it hides in homemade dressings, aioli, mousse, and batter.',
    instead: 'Pasteurized eggs, which are sold specifically for this and work in the same recipes.',
  },
  {
    id: 'alcohol',
    label: 'Alcohol',
    test: /\balcohol\b|\bwine\b|\bbeer\b|\brum\b|\bvodka\b|\bwhiskey\b|\bbourbon\b|\bbrandy\b|\bliqueur\b/i,
    why: 'No amount has been established as safe in pregnancy, which is why the guidance is categorical rather than a threshold.',
    instead: 'The app\'s Zero Proof section exists for this. Cooking does not reliably remove all alcohol, so "it burns off" is not a safe assumption.',
  },
];

/**
 * Which caution categories a recipe hits, and why. Returns [] for a clear
 * recipe. This is the explainable version of pregnancyCaution() — same net,
 * but it can say what it caught and offer the ordinary workaround.
 */
export function cautionDetail(recipe) {
  const hay = ingredientText(recipe);
  return CAUTION_CATEGORIES
    .filter((c) => c.test.test(hay))
    .map(({ id, label, why, instead }) => ({ id, label, why, instead }));
}

/* ── Stages ──────────────────────────────────────────────────────────────────
   Including the fourth trimester as a real stage, because it is the one where
   cooking is hardest and the one every food app forgets. */

export const STAGES = [
  {
    id: 't1',
    label: 'First trimester',
    what: 'Nausea and aversions usually run the show. Appetite is unreliable.',
    // Deliberately permission-giving rather than prescriptive: in the first
    // trimester "eat what stays down" is closer to actual clinical advice than
    // any balanced-plate diagram.
    posture: 'Eat what stays down. This is the one stretch where getting calories in at all beats getting them in balanced, and plenty of clinicians will tell you the same thing.',
    nutrients: ['folate'],
    practical: [
      'Cold food smells less. Aversions are often driven by smell more than taste.',
      'Dry and bland early in the day is a real pattern, not fussiness.',
      'Small and frequent tends to beat three meals when nausea is in play.',
    ],
  },
  {
    id: 't2',
    label: 'Second trimester',
    what: 'Appetite usually returns. The stretch where cooking feels possible again.',
    posture: 'The most practical window for building a habit or stocking a freezer — energy is typically at its best here.',
    nutrients: ['iron', 'calcium', 'protein'],
    practical: [
      'A good stretch to batch and freeze, because the third trimester and the newborn weeks will both cash it in.',
      'Iron needs rise substantially through the back half of pregnancy.',
    ],
  },
  {
    id: 't3',
    label: 'Third trimester',
    what: 'Less room to eat, more heartburn, more tiredness.',
    posture: 'Smaller and more often, and front-load the day if lying down after eating is uncomfortable.',
    nutrients: ['iron', 'calcium', 'protein', 'fiber'],
    practical: [
      'Physical stomach capacity is genuinely reduced — smaller meals are mechanics, not discipline.',
      'Freezer meals made now are the ones you actually eat in the newborn weeks.',
    ],
  },
  {
    id: 'postpartum',
    label: 'Fourth trimester (0–12 weeks)',
    what: 'Recovery, blood loss, broken sleep, and often one free hand at most.',
    posture: 'The goal is fed, not impressive. Food you can eat one-handed, cold, or three hours later than you meant to is not a lesser version of cooking right now — it is the correct version.',
    nutrients: ['iron', 'fiber', 'protein', 'hydration'],
    practical: [
      'One-handed food is a real category: wraps, hand pies, overnight oats, cut fruit, hard-boiled eggs, anything on a stick.',
      'Constipation is extremely common after birth — fiber plus water genuinely matters, and iron supplements tend to make it worse.',
      'Put water everywhere you sit. Thirst during nursing is sudden and inconvenient.',
    ],
  },
  {
    id: 'nursing',
    label: 'Nursing',
    what: 'Higher calorie and fluid needs, often at unpredictable hours.',
    posture: 'Eat more than feels necessary and drink more than feels necessary. Hunger while nursing is a real physiological signal, not a lapse.',
    nutrients: ['hydration', 'protein', 'iron', 'calcium'],
    practical: [
      'Milk production adds meaningfully to daily energy needs — commonly cited around 330–400 extra calories a day in the first six months.',
      'Keep snacks where you feed, not where you cook. You will not get up.',
    ],
  },
];

export const stageById = (id) => STAGES.find((s) => s.id === id) || null;

/* ── Nutrients that actually change by stage ─────────────────────────────────
   Only the ones with a genuine stage-specific story. Deliberately no dosages
   and no supplement advice — that is a clinician's call, and a keyword net has
   no business making it. */

export const KEY_NUTRIENTS = {
  folate: {
    label: 'Folate',
    when: 'Most critical earliest — often before someone knows they are pregnant.',
    why: 'Involved in neural tube development, which happens in the first weeks. This is why prenatal vitamins are typically recommended before conception rather than after a positive test.',
    foods: ['lentils', 'chickpeas', 'spinach', 'asparagus', 'avocado', 'broccoli', 'fortified cereal', 'oranges'],
  },
  iron: {
    label: 'Iron',
    when: 'Rises through pregnancy, and stays relevant after birth to recover from blood loss.',
    why: 'Blood volume increases substantially during pregnancy, so iron demand rises with it. Deficiency is common and is one of the more frequently flagged things in routine prenatal bloodwork.',
    foods: ['lentils', 'beef', 'spinach', 'tofu', 'pumpkin seeds', 'fortified cereal', 'black beans'],
    tip: 'Vitamin C alongside plant iron measurably improves absorption — lemon on the lentils is doing real work, not garnish.',
  },
  calcium: {
    label: 'Calcium',
    when: 'Second and third trimester, and while nursing.',
    why: 'Fetal skeletal development draws on maternal stores, so intake matters for the person supplying it as much as for the baby.',
    foods: ['yogurt', 'pasteurized cheese', 'canned sardines', 'tofu', 'fortified plant milk', 'kale'],
  },
  protein: {
    label: 'Protein',
    when: 'Rises in the back half, and stays elevated while nursing.',
    why: 'Tissue growth and repair — for the pregnancy, and afterward for recovery from birth.',
    foods: ['eggs', 'beans', 'chicken', 'greek yogurt', 'lentils', 'tofu', 'cottage cheese'],
  },
  fiber: {
    label: 'Fiber',
    when: 'Third trimester and postpartum, especially.',
    why: 'Constipation is one of the most common and least-discussed complaints in both stretches, and iron supplements typically compound it. Fiber and water are the ordinary first answer.',
    foods: ['oats', 'beans', 'pears', 'prunes', 'berries', 'whole grains', 'chia'],
  },
  hydration: {
    label: 'Fluids',
    when: 'All of it, and sharply higher while nursing.',
    why: 'Milk is mostly water, and thirst while nursing tends to arrive suddenly. Dehydration also worsens constipation and fatigue, which are already the two most common complaints.',
    foods: ['water', 'broth', 'soup', 'fruit', 'milk'],
  },
};

/** Nutrients worth knowing about for a stage, resolved to full entries. */
export function nutrientsForStage(stageId) {
  const stage = stageById(stageId);
  if (!stage) return [];
  return stage.nutrients.map((n) => ({ id: n, ...KEY_NUTRIENTS[n] })).filter((n) => n.label);
}

/* ── The lactation-supplement refusal ───────────────────────────────────────*/

export const LACTATION_HONESTY =
  'There is a large industry selling lactation cookies, teas, and supplements, and the evidence that any specific food meaningfully increases milk supply is weak. What is well supported is unglamorous: enough calories, enough fluid, and frequent removal of milk. If supply is a real concern, that is a lactation consultant\'s job, not a cookie\'s.';

/* ── Pica ────────────────────────────────────────────────────────────────────
   Craving ice, clay, chalk, cornstarch, or dirt is a recognized phenomenon in
   pregnancy with a documented association with iron deficiency. This is worth
   surfacing because it is the one craving pattern where "mention it to your
   provider" is genuinely the right response — and because someone
   compulsively chewing ice usually has no idea it is a known thing.

   Flags, never diagnoses. cravingTracker.js's 'cold' pattern already gestures
   at this; this is the fuller version it points toward. */

const PICA_RE = /\b(ice|chalk|clay|dirt|soil|cornstarch|starch|laundry starch|paper|ash|baking soda)\b/i;

export const PICA_NOTE =
  'Craving ice or non-food things like clay, chalk, or cornstarch is a recognized pattern in pregnancy, and it has a well-documented association with low iron. It is worth mentioning at your next appointment — not because something is wrong with you, but because it is the kind of thing routine bloodwork checks for and it is straightforward to look into.';

/** Does a craving description look like pica? Intentionally loose: over-
    surfacing a gentle "mention this to your provider" note is a much cheaper
    error than missing it. */
export function looksLikePica(text) {
  const s = String(text || '').toLowerCase();
  if (!PICA_RE.test(s)) return false;
  // "ice cream", "iced coffee", "ice water" are not pica.
  if (/\bice\b/.test(s) && /\bice (cream|coffee|tea|water|latte|pop)\b/.test(s)) return false;
  return true;
}

/* ── Craving interpretation ──────────────────────────────────────────────────
   Reads a craving and answers it, rather than correcting it. The founder's
   framing throughout is that a craving is information and fighting it directly
   tends to lose — so this maps a craving onto food that actually satisfies the
   same shape, and only ever adds a nutrient note where there is a real one. */

const CRAVING_SHAPES = [
  {
    id: 'sour',
    test: /sour|tart|lemon|lime|vinegar|pickle|citrus|sour candy|kimchi|tamarind/i,
    label: 'Sour & tart',
    read: 'One of the most commonly reported pregnancy cravings, and it often shows up alongside nausea — sour genuinely does cut through it for a lot of people.',
    satisfy: ['lemon on everything', 'pickles and their brine', 'greek yogurt with citrus', 'tamarind candy', 'vinegar slaw'],
    bonus: 'Citrus alongside plant iron improves absorption, so a sour craving and an iron need can be answered by the same plate.',
  },
  {
    id: 'salty',
    test: /salt|salty|chips|fries|pickle|olive|pretzel|crisps|popcorn/i,
    label: 'Salty',
    read: 'Classically reported, and blood volume expands a lot during pregnancy, which is part of why salt can start tasting different. Not a reason to salt without limit, and worth raising with your provider if you have been told to watch blood pressure.',
    satisfy: ['olives', 'salted nuts', 'popcorn', 'miso soup', 'feta on a tomato'],
  },
  {
    id: 'sweet',
    test: /sweet|sugar|candy|chocolate|dessert|cake|ice cream|donut|cookie/i,
    label: 'Sweet',
    read: 'Extremely common, and more so later on. The version that holds you longer is sweet with fat or protein attached rather than sugar alone.',
    satisfy: ['dates with peanut butter', 'greek yogurt and honey', 'dark chocolate', 'baked fruit with cream', 'frozen banana'],
  },
  {
    id: 'carb',
    test: /bread|pasta|potato|rice|noodle|carb|toast|bagel|cereal/i,
    label: 'Plain starch',
    read: 'Very typical when nausea is around — bland starch is one of the few things that reliably stays down, and that is a legitimate reason to eat it.',
    satisfy: ['buttered toast', 'plain rice', 'crackers by the bed', 'congee', 'baked potato'],
  },
  {
    id: 'cold',
    test: /cold|icy|ice|frozen|slush|popsicle|smoothie/i,
    label: 'Cold & icy',
    read: 'Common, and cold food carries less smell — which matters a lot when smell is the thing driving aversions.',
    satisfy: ['smoothies', 'frozen grapes', 'popsicles', 'cold noodle salad', 'yogurt from the freezer'],
  },
  {
    id: 'protein',
    test: /meat|steak|burger|chicken|egg|protein|beef|bacon/i,
    label: 'Meat & protein',
    read: 'Often shows up in the second and third trimester when protein and iron needs are climbing. A craving landing on the thing you need more of is not unusual.',
    satisfy: ['beef and broccoli', 'eggs any way', 'lentil bolognese', 'chicken with lemon'],
    bonus: 'Worth pairing with vitamin C if the source is plant-based.',
  },
  {
    id: 'comfort',
    test: /comfort|childhood|my mom|grandma|nostalgi|home|familiar/i,
    label: 'Nostalgic comfort',
    read: 'A comfort craving is as real as a flavor one, and it is usually pointing at wanting to feel looked after rather than at a specific nutrient. Worth taking literally.',
    satisfy: ['whatever the actual dish is', 'the version someone else makes for you', 'a phone call while you cook it'],
  },
];

/**
 * Read a craving. Returns the matched shape plus, when relevant, a pica flag
 * and stage-appropriate nutrient context.
 *
 * Never corrective — there is deliberately no "instead of that, eat this."
 * The craving gets answered; the nutrient note rides along only when it is
 * genuinely related.
 */
export function cravingInsight(text, stageId = null) {
  const s = String(text || '').trim();
  if (!s) return null;

  const shape = CRAVING_SHAPES.find((c) => c.test.test(s)) || null;
  const pica = looksLikePica(s);
  const stage = stageById(stageId);

  return {
    text: s,
    shape: shape ? { id: shape.id, label: shape.label, read: shape.read, satisfy: shape.satisfy, bonus: shape.bonus || null } : null,
    pica,
    picaNote: pica ? PICA_NOTE : null,
    stage: stage ? { id: stage.id, label: stage.label, posture: stage.posture } : null,
    nutrients: stage ? nutrientsForStage(stage.id) : [],
    disclaimer: DISCLAIMER,
  };
}

/** Every craving shape, for a picker UI. */
export const CRAVING_SHAPE_LIST = CRAVING_SHAPES.map(({ id, label }) => ({ id, label }));
