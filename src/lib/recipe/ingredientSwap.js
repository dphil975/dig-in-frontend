/* ingredientSwap.js — "they're out of it. now what?"

   The Store Run's "Can't find it" button used to dead-end: it recorded the
   miss and moved on, which is exactly the moment a person gives up on the
   recipe and leaves with nothing. This turns that moment into a real answer.

   TWO DIMENSIONS, because nutrition alone gives bad cooking advice:

   1. CULINARY ROLE — will the dish still work? Swapping spinach for kale is
      fine (both wilt); swapping spinach for a potato is nutritionally
      arguable and culinarily absurd. Role + cooking method gate every
      suggestion, so we never recommend something that falls apart in the pan.

   2. NUTRITION — what the cook actually wanted out of it. Real per-serving
      macros, same hand-entered USDA-style convention (and the same
      NUTRITION_DISCLAIMER) as nutritionFacts.js, which this deliberately
      reuses rather than inventing a second, disagreeing set of numbers.

   HONESTY RULES BAKED IN:
   - Every reason cites the real delta ("7.6g fiber vs 5.1g"), never a vague
     "similar nutrition." The user asked to be *informed* of the tradeoff, and
     a number they can check is the only way to do that.
   - A swap that is NOT like-for-like is labeled `stretch: true` and says so.
     Beans instead of broccoli genuinely gets you more protein and fiber — and
     genuinely changes the dish. Both facts get stated.
   - Unknown ingredient returns an empty list, not a guess. We'd rather say
     "no suggestion" than send someone to buy the wrong thing.

   Serving sizes differ per ingredient (1 cup cooked greens vs 1 oz cheese)
   and are ALWAYS carried on the record and shown, because a macro number
   without its serving is a lie by omission. */

import { NUTRITION_DISCLAIMER } from '../nutritionFacts';

export { NUTRITION_DISCLAIMER };

/* ── the five questions ──────────────────────────────────────────────────
   Four are the cook's intent (flavor / protein / fiber / carb). The fifth is
   cooking METHOD, which isn't a preference at all — it's the constraint that
   decides whether a swap physically works. Asking it is what keeps this from
   recommending raw-only lettuce for something you're about to roast. */
export const SWAP_QUESTIONS = [
  {
    id: 'method',
    q: 'How were you going to cook it?',
    help: 'This decides what can actually stand in — not every swap survives the same pan.',
    options: [
      { id: 'any',    label: "Not sure yet" },
      { id: 'raw',    label: 'Raw / in a salad' },
      { id: 'saute',  label: 'Sautéed or stir-fried' },
      { id: 'roast',  label: 'Roasted' },
      { id: 'simmer', label: 'Simmered in a soup, stew or sauce' },
    ],
  },
  {
    id: 'flavor',
    q: 'What were you going for, flavor-wise?',
    help: 'Matched against the ingredient\'s own flavor character.',
    options: [
      { id: 'any',    label: 'Anything close' },
      { id: 'mild',   label: 'Mild — it shouldn\'t take over' },
      { id: 'earthy', label: 'Earthy' },
      { id: 'sweet',  label: 'Sweet' },
      { id: 'spicy',  label: 'Some heat' },
      { id: 'tangy',  label: 'Bright / tangy' },
    ],
  },
  {
    id: 'protein',
    q: 'Want more protein in the dish?',
    help: 'Opens up swaps that add real protein, even outside the original category.',
    options: [
      { id: 'no',  label: 'No, keep it as-is' },
      { id: 'yes', label: 'Yes, more protein' },
    ],
  },
  {
    id: 'fiber',
    q: 'Want more fiber?',
    help: 'Most US adults eat well under the 28g daily reference value.',
    options: [
      { id: 'no',  label: 'No, keep it as-is' },
      { id: 'yes', label: 'Yes, more fiber' },
    ],
  },
  {
    id: 'carb',
    q: 'Want to add a carb to make it more filling?',
    help: 'Turns the swap into something that carries the meal, not just fills a gap.',
    options: [
      { id: 'no',  label: 'No' },
      { id: 'yes', label: 'Yes, make it heartier' },
    ],
  },
];

/* ── the data ────────────────────────────────────────────────────────────
   Typical values for the stated serving. `m` = standout micronutrients (the
   thing people actually swap FOR), `f` = flavor character, `k` = cooking
   methods it genuinely holds up to. */
const I = (id, label, role, serving, calories, protein, carbs, fat, fiber, m, f, k, note) =>
  ({ id, label, role, serving, calories, protein, carbs, fat, fiber, micros: m, flavors: f, methods: k, note });

export const INGREDIENTS = [
  // ── greens that cook down ──
  I('spinach', 'Spinach', 'green-cook', '1 cup cooked', 41, 5.3, 6.8, 0.5, 4.3, ['vitamin K', 'folate', 'iron'], ['mild', 'earthy'], ['raw','saute','simmer'], 'Wilts to almost nothing — buy far more than looks right.'),
  I('swiss-chard', 'Swiss chard', 'green-cook', '1 cup cooked', 35, 3.3, 7, 0.1, 3.7, ['vitamin K', 'vitamin A', 'magnesium'], ['earthy'], ['saute','simmer'], 'Closest thing to spinach; stems need a head start.'),
  I('kale', 'Kale', 'green-cook', '1 cup cooked', 49, 3.5, 8.8, 0.9, 2.6, ['vitamin K', 'vitamin C', 'vitamin A'], ['earthy'], ['raw','saute','roast','simmer'], 'Sturdier than spinach — holds shape, needs longer.'),
  I('collard-greens', 'Collard greens', 'green-cook', '1 cup cooked', 63, 5.2, 11, 1.4, 7.6, ['vitamin K', 'calcium'], ['earthy'], ['saute','simmer'], 'The fiber champion of the greens. Wants a long simmer.'),
  I('bok-choy', 'Bok choy', 'green-cook', '1 cup cooked', 20, 2.7, 3, 0.3, 1.7, ['vitamin C', 'vitamin A'], ['mild'], ['saute','simmer'], 'Stems stay crisp — good when you want texture left.'),

  // ── raw/salad greens ──
  I('romaine', 'Romaine', 'green-raw', '2 cups', 16, 1.2, 3, 0.3, 2.2, ['vitamin K', 'folate'], ['mild'], ['raw'], 'Crunch and structure; wilts badly if cooked.'),
  I('spring-mix', 'Spring mix', 'green-raw', '2 cups', 18, 1.4, 3.2, 0.3, 1.6, ['vitamin K', 'vitamin A'], ['mild'], ['raw'], 'Delicate — dress at the last second.'),
  I('arugula', 'Arugula', 'green-raw', '2 cups', 10, 1, 1.4, 0.3, 0.6, ['vitamin K'], ['tangy'], ['raw'], 'Peppery. Adds bite where spring mix adds nothing.'),

  // ── crucifers ──
  I('broccoli', 'Broccoli', 'crucifer', '1 cup cooked', 55, 3.7, 11, 0.6, 5.1, ['vitamin C', 'vitamin K'], ['earthy'], ['raw','saute','roast','simmer'], 'Roasts beautifully; oversteams into mush.'),
  I('cauliflower', 'Cauliflower', 'crucifer', '1 cup cooked', 29, 2.3, 5.1, 0.6, 2.9, ['vitamin C'], ['mild'], ['raw','saute','roast','simmer'], 'The blank canvas — takes on whatever it cooks in.'),
  I('brussels-sprouts', 'Brussels sprouts', 'crucifer', '1 cup cooked', 56, 4, 11, 0.8, 4.1, ['vitamin K', 'vitamin C'], ['earthy'], ['saute','roast'], 'Needs real heat to go sweet instead of sulfurous.'),
  I('cabbage', 'Cabbage', 'crucifer', '1 cup cooked', 34, 2, 8, 0.1, 2.8, ['vitamin C', 'vitamin K'], ['mild', 'sweet'], ['raw','saute','roast','simmer'], 'Cheapest vegetable in the store, and it keeps for weeks.'),

  // ── firm roots ──
  I('carrot', 'Carrots', 'root-firm', '1 cup chopped', 52, 1.2, 12, 0.3, 3.6, ['vitamin A'], ['sweet'], ['raw','saute','roast','simmer'], 'Sweetens as it cooks. Nearly indestructible.'),
  I('parsnip', 'Parsnips', 'root-firm', '1 cup cooked', 111, 2, 27, 0.4, 5.6, ['vitamin C', 'folate'], ['sweet', 'earthy'], ['roast','simmer'], 'Carrot-shaped but sweeter and starchier.'),
  I('turnip', 'Turnips', 'root-firm', '1 cup cooked', 34, 1.1, 8, 0.1, 3.1, ['vitamin C'], ['mild'], ['roast','simmer'], 'Peppery raw, mellow cooked.'),
  I('beet', 'Beets', 'root-firm', '1 cup cooked', 75, 2.9, 17, 0.3, 3.4, ['folate', 'manganese'], ['earthy', 'sweet'], ['roast','simmer'], 'Stains everything. Worth it.'),

  // ── starchy roots ──
  I('potato', 'Potatoes', 'root-starchy', '1 medium baked', 161, 4.3, 37, 0.2, 3.8, ['potassium', 'vitamin C'], ['mild'], ['roast','simmer','saute'], 'The fiber is mostly in the skin — leave it on.'),
  I('sweet-potato', 'Sweet potatoes', 'root-starchy', '1 medium baked', 103, 2.3, 24, 0.2, 3.8, ['vitamin A'], ['sweet'], ['roast','simmer'], 'One of these covers a full day of vitamin A.'),
  I('butternut-squash', 'Butternut squash', 'squash-winter', '1 cup cooked', 82, 1.8, 22, 0.2, 6.6, ['vitamin A', 'vitamin C'], ['sweet'], ['roast','simmer'], 'More fiber than a potato, half the calories.'),
  I('acorn-squash', 'Acorn squash', 'squash-winter', '1 cup cooked', 115, 2.3, 30, 0.3, 9, ['vitamin C', 'potassium'], ['sweet'], ['roast','simmer'], 'Very high fiber. Skin is edible once roasted.'),

  // ── summer squash ──
  I('zucchini', 'Zucchini', 'squash-summer', '1 cup cooked', 27, 2, 5, 0.4, 1.8, ['vitamin C'], ['mild'], ['raw','saute','roast','simmer'], 'Holds a lot of water — salt it first if roasting.'),
  I('yellow-squash', 'Yellow squash', 'squash-summer', '1 cup cooked', 36, 1.7, 8, 0.3, 2.5, ['vitamin C'], ['mild'], ['saute','roast','simmer'], 'Interchangeable with zucchini in nearly everything.'),
  I('eggplant', 'Eggplant', 'squash-summer', '1 cup cooked', 35, 0.8, 8.6, 0.2, 2.5, ['manganese'], ['earthy'], ['saute','roast','simmer'], 'Drinks oil. Roast it dry first if that matters.'),

  // ── alliums ──
  I('onion', 'Onion', 'allium', '1 cup cooked', 92, 2.9, 21, 0.4, 2.9, ['vitamin C'], ['sweet'], ['saute','roast','simmer'], 'The base of most things. Sweetens the longer it goes.'),
  I('leek', 'Leeks', 'allium', '1 cup cooked', 32, 0.8, 8, 0.2, 1, ['vitamin K'], ['mild', 'sweet'], ['saute','simmer'], 'Gentler than onion. Grit hides in the layers — wash well.'),
  I('shallot', 'Shallots', 'allium', '1/4 cup', 29, 1, 6.7, 0.1, 1.3, ['vitamin B6'], ['mild', 'sweet'], ['saute','roast'], 'Onion crossed with garlic; softer than either.'),

  // ── peppers ──
  I('bell-pepper', 'Bell pepper', 'pepper-sweet', '1 cup raw', 39, 1.5, 9, 0.4, 3.1, ['vitamin C'], ['sweet'], ['raw','saute','roast'], 'A red one has more vitamin C than an orange.'),
  I('poblano', 'Poblano', 'pepper-hot', '1 pepper', 25, 1, 5, 0.2, 2, ['vitamin C', 'vitamin A'], ['mild', 'earthy'], ['roast','saute'], 'Barely spicy. Roasting is the whole point of it.'),
  I('jalapeno', 'Jalapeño', 'pepper-hot', '1 pepper', 4, 0.1, 0.9, 0.1, 0.4, ['vitamin C'], ['spicy'], ['raw','saute','roast'], 'Heat lives in the seeds and ribs — remove to tame.'),
  I('serrano', 'Serrano', 'pepper-hot', '1 pepper', 5, 0.2, 1, 0.1, 0.6, ['vitamin C'], ['spicy'], ['raw','saute'], 'Noticeably hotter than a jalapeño. Use fewer.'),
  I('anaheim', 'Anaheim', 'pepper-hot', '1 pepper', 16, 0.6, 3.4, 0.2, 1.5, ['vitamin C'], ['mild'], ['roast','saute'], 'Mildest of the roasting chiles. Closest to a poblano.'),

  // ── mushrooms ──
  I('cremini', 'Cremini mushrooms', 'mushroom', '1 cup cooked', 44, 3.9, 8, 0.5, 1.8, ['selenium', 'B vitamins'], ['earthy', 'savory'], ['saute','roast','simmer'], 'More flavor than white button, same price usually.'),
  I('portobello', 'Portobello', 'mushroom', '1 cup cooked', 42, 5.2, 6, 0.9, 2.7, ['selenium', 'potassium'], ['earthy', 'savory'], ['roast','saute'], 'Meaty enough to carry a dish on its own.'),
  I('shiitake', 'Shiitake', 'mushroom', '1 cup cooked', 81, 2.3, 21, 0.3, 3, ['B vitamins', 'copper'], ['earthy', 'savory'], ['saute','simmer'], 'The most savory of the common mushrooms.'),

  // ── pods & kernels ──
  I('green-beans', 'Green beans', 'pod', '1 cup cooked', 44, 2.4, 10, 0.4, 4, ['vitamin K', 'vitamin C'], ['mild'], ['saute','roast','simmer'], 'Frozen are genuinely as good as fresh here.'),
  I('asparagus', 'Asparagus', 'pod', '1 cup cooked', 40, 4.3, 7.4, 0.4, 3.6, ['folate', 'vitamin K'], ['earthy'], ['saute','roast'], 'Snap the woody end off rather than cutting.'),
  I('peas', 'Green peas', 'pod', '1 cup cooked', 134, 8.6, 25, 0.4, 8.8, ['vitamin K', 'vitamin C'], ['sweet'], ['saute','simmer'], 'Quietly one of the highest-protein vegetables there is.'),
  I('corn', 'Corn', 'pod', '1 cup cooked', 143, 5.4, 31, 2.2, 3.6, ['folate', 'vitamin C'], ['sweet'], ['saute','roast','simmer'], 'Frozen corn is picked and frozen the same day.'),

  // ── soft nightshades ──
  I('tomato', 'Tomatoes', 'nightshade-soft', '1 cup raw', 32, 1.6, 7, 0.4, 2.2, ['vitamin C', 'lycopene'], ['tangy', 'sweet'], ['raw','saute','roast','simmer'], 'Canned are often better than sad winter fresh ones.'),
  I('tomatillo', 'Tomatillos', 'nightshade-soft', '1 cup raw', 42, 1.3, 8, 1.3, 2.6, ['vitamin C', 'vitamin K'], ['tangy'], ['roast','simmer'], 'Sharper and more acidic than a tomato. Roast to sweeten.'),

  // ── legumes ──
  I('black-beans', 'Black beans', 'legume', '1/2 cup cooked', 114, 7.6, 20, 0.5, 7.5, ['folate', 'iron'], ['earthy'], ['simmer','saute'], 'Canned, rinsed, is a completely legitimate shortcut.'),
  I('chickpeas', 'Chickpeas', 'legume', '1/2 cup cooked', 135, 7, 22, 2, 6, ['folate', 'iron'], ['mild', 'earthy'], ['simmer','roast','saute'], 'Roast them and they turn into a crunchy topping.'),
  I('lentils', 'Lentils', 'legume', '1/2 cup cooked', 115, 9, 20, 0.4, 7.8, ['folate', 'iron'], ['earthy'], ['simmer'], 'No soaking, cooks in 20 minutes. The easy legume.'),
  I('kidney-beans', 'Kidney beans', 'legume', '1/2 cup cooked', 112, 7.7, 20, 0.4, 6.5, ['folate', 'iron'], ['mild'], ['simmer'], 'Holds its shape better than black beans in a long cook.'),
  I('pinto-beans', 'Pinto beans', 'legume', '1/2 cup cooked', 123, 7.7, 22, 0.6, 7.7, ['folate'], ['earthy'], ['simmer'], 'Goes creamy when cooked down. Made for refrying.'),
  I('cannellini', 'Cannellini beans', 'legume', '1/2 cup cooked', 125, 8.7, 22, 0.3, 5.6, ['folate', 'iron'], ['mild'], ['simmer'], 'Creamiest white bean; good mashed into soups to thicken.'),

  // ── proteins ──
  I('chicken-breast', 'Chicken breast', 'protein-lean', '4 oz cooked', 165, 31, 0, 4, 0, ['B6', 'selenium'], ['mild'], ['saute','roast','simmer'], 'Dries out fast — pull it sooner than feels right.'),
  I('chicken-thigh', 'Chicken thighs', 'protein-rich', '4 oz cooked', 209, 26, 0, 11, 0, ['B6', 'zinc'], ['savory'], ['saute','roast','simmer'], 'Cheaper than breast and much harder to ruin.'),
  I('ground-turkey', 'Ground turkey', 'protein-lean', '4 oz cooked', 170, 28, 0, 6, 0, ['selenium', 'B6'], ['mild'], ['saute','simmer'], 'Straight swap for ground beef in most things.'),
  I('ground-beef', 'Ground beef (90/10)', 'protein-rich', '4 oz cooked', 199, 26, 0, 10, 0, ['iron', 'zinc', 'B12'], ['savory', 'rich'], ['saute','simmer'], 'Brown it properly and don\'t crowd the pan.'),
  I('shrimp', 'Shrimp', 'protein-lean', '4 oz cooked', 120, 24, 1, 1.4, 0, ['selenium', 'B12'], ['mild'], ['saute','roast','simmer'], 'Cooks in about 3 minutes. Frozen is standard.'),
  I('cod', 'Cod', 'protein-lean', '4 oz cooked', 119, 26, 0, 1, 0, ['B12', 'selenium'], ['mild'], ['roast','saute','simmer'], 'Mild and flaky. Takes on whatever you put on it.'),
  I('tilapia', 'Tilapia', 'protein-lean', '4 oz cooked', 145, 30, 0, 3, 0, ['selenium', 'B12'], ['mild'], ['roast','saute'], 'Cheapest reliable white fish.'),
  I('salmon', 'Salmon', 'protein-rich', '4 oz cooked', 233, 25, 0, 14, 0, ['omega-3', 'B12', 'vitamin D'], ['rich'], ['roast','saute'], 'The omega-3 case for it is real and well-supported.'),
  I('tofu', 'Tofu, firm', 'protein-lean', '4 oz', 88, 10, 2, 5, 1, ['calcium', 'iron'], ['mild'], ['saute','roast','simmer'], 'Press the water out or it will never brown.'),
  I('tempeh', 'Tempeh', 'protein-rich', '4 oz', 222, 21, 11, 13, 7, ['iron', 'magnesium'], ['earthy', 'savory'], ['saute','roast'], 'Fermented, so it has real fiber where tofu has almost none.'),
  I('eggs', 'Eggs', 'protein-lean', '1 large', 78, 6, 0.6, 5, 0, ['choline', 'B12', 'vitamin D'], ['mild'], ['saute','simmer'], 'The cheapest complete protein in the store.'),

  // ── cheeses ──
  I('feta', 'Feta', 'cheese-crumble', '1 oz', 75, 4, 1.2, 6, 0, ['calcium'], ['tangy'], ['raw'], 'Salty and sharp. Crumbles, never melts smooth.'),
  I('queso-fresco', 'Queso fresco', 'cheese-crumble', '1 oz', 82, 5, 1, 6, 0, ['calcium'], ['mild'], ['raw'], 'Mild and milky — softens but holds shape under heat.'),
  I('cotija', 'Cotija', 'cheese-crumble', '1 oz', 90, 5.5, 1, 7, 0, ['calcium'], ['tangy'], ['raw'], 'Saltier, drier queso fresco. Closer to feta in punch.'),
  I('goat-cheese', 'Goat cheese', 'cheese-crumble', '1 oz', 75, 5, 0.3, 6, 0, ['calcium'], ['tangy'], ['raw'], 'Tangiest of the crumbles; goes creamy when warmed.'),
  I('mozzarella', 'Mozzarella', 'cheese-melt', '1 oz', 85, 6.3, 0.6, 6.3, 0, ['calcium'], ['mild'], ['raw','roast'], 'The melt standard. Low-moisture melts better than fresh.'),
  I('monterey-jack', 'Monterey Jack', 'cheese-melt', '1 oz', 106, 7, 0.2, 8.6, 0, ['calcium'], ['mild'], ['roast','saute'], 'Melts as well as mozzarella with a bit more flavor.'),
  I('oaxaca', 'Oaxaca cheese', 'cheese-melt', '1 oz', 90, 6, 1, 7, 0, ['calcium'], ['mild'], ['roast','saute'], 'Mexican mozzarella, essentially. Pulls into strings.'),
  I('cheddar', 'Cheddar', 'cheese-melt', '1 oz', 113, 7, 0.4, 9, 0, ['calcium'], ['savory'], ['roast','saute'], 'Sharper with age; can go oily if overheated.'),
  I('parmesan', 'Parmesan', 'cheese-hard', '1 oz', 111, 10, 0.9, 7, 0, ['calcium'], ['savory'], ['raw','roast'], 'Most protein per ounce of any common cheese.'),
  I('pecorino', 'Pecorino', 'cheese-hard', '1 oz', 110, 8, 0, 8, 0, ['calcium'], ['savory', 'tangy'], ['raw','roast'], 'Sheep\'s milk — saltier and sharper than parmesan.'),

  // ── grains ──
  I('white-rice', 'White rice', 'grain', '1 cup cooked', 205, 4.3, 45, 0.4, 0.6, [], ['mild'], ['simmer'], 'Neutral by design. Almost no fiber.'),
  I('brown-rice', 'Brown rice', 'grain', '1 cup cooked', 218, 4.5, 46, 1.6, 3.5, ['magnesium'], ['earthy'], ['simmer'], 'Six times the fiber of white, and takes twice as long.'),
  I('quinoa', 'Quinoa', 'grain', '1 cup cooked', 222, 8.1, 39, 3.6, 5.2, ['magnesium', 'iron'], ['earthy'], ['simmer'], 'Highest-protein common grain. Rinse it or it turns bitter.'),
  I('farro', 'Farro', 'grain', '1 cup cooked', 200, 7, 40, 1, 5, ['magnesium'], ['earthy'], ['simmer'], 'Chewy and nutty; keeps its bite in soups.'),
  I('couscous', 'Couscous', 'grain', '1 cup cooked', 176, 6, 36, 0.3, 2.2, ['selenium'], ['mild'], ['simmer'], 'Ready in five minutes — it\'s pasta, not a grain.'),
  I('pasta', 'Pasta', 'grain', '1 cup cooked', 220, 8, 43, 1.3, 2.5, ['selenium'], ['mild'], ['simmer'], 'Whole-wheat roughly doubles the fiber.'),
  I('barley', 'Barley', 'grain', '1 cup cooked', 193, 3.5, 44, 0.7, 6, ['selenium'], ['earthy'], ['simmer'], 'Very high fiber; thickens a soup as it sits.'),
];

/* Roles that can honestly stand in for one another when the exact role has
   nothing to offer. Kept deliberately tight — this is where a swap engine
   starts giving bad advice if you let it sprawl. */
const ADJACENT = {
  'green-cook': ['crucifer'],
  'crucifer': ['green-cook', 'pod'],
  'green-raw': ['green-cook'],
  'root-firm': ['root-starchy', 'squash-winter'],
  'root-starchy': ['root-firm', 'squash-winter'],
  'squash-winter': ['root-starchy', 'root-firm'],
  'squash-summer': ['pod'],
  'pod': ['crucifer', 'squash-summer'],
  'pepper-hot': ['pepper-sweet'],
  'pepper-sweet': ['pepper-hot'],
  'nightshade-soft': [],
  'mushroom': [],
  'allium': [],
  'legume': ['grain'],
  'grain': ['legume'],
  'protein-lean': ['protein-rich', 'legume'],
  'protein-rich': ['protein-lean', 'legume'],
  'cheese-crumble': ['cheese-melt', 'cheese-hard'],
  'cheese-melt': ['cheese-crumble', 'cheese-hard'],
  'cheese-hard': ['cheese-melt', 'cheese-crumble'],
};

/* Roles a goal can legitimately reach INTO even from a vegetable slot. This
   is the "stretch" tier — real answers to "I want more protein", clearly
   labeled as changing the dish rather than replacing the item. */
const GOAL_STRETCH = {
  protein: ['legume', 'protein-lean', 'protein-rich'],
  fiber: ['legume'],
  carb: ['grain', 'root-starchy'],
};

const VEG_ROLES = new Set([
  'green-cook', 'green-raw', 'crucifer', 'root-firm', 'root-starchy',
  'squash-winter', 'squash-summer', 'allium', 'pepper-sweet', 'pepper-hot',
  'mushroom', 'pod', 'nightshade-soft',
]);

function norm(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Find the ingredient record behind a shopping-list line. Null if unknown. */
export function findIngredient(name) {
  const n = norm(name);
  if (!n) return null;
  let best = null;
  let bestLen = 0;
  for (const ing of INGREDIENTS) {
    for (const cand of [ing.label, ing.id.replace(/-/g, ' ')]) {
      const c = norm(cand);
      // Singularize crudely so "carrots" matches "carrot" and vice versa.
      const stems = [c, c.replace(/e?s$/, '')];
      for (const stem of stems) {
        if (stem.length > 2 && n.includes(stem) && stem.length > bestLen) {
          best = ing; bestLen = stem.length;
        }
      }
    }
  }
  return best;
}

/** A real, signed comparison between two ingredients — the "inform them" part. */
export function nutritionCompare(from, to) {
  const keys = ['calories', 'protein', 'carbs', 'fat', 'fiber'];
  const deltas = {};
  for (const k of keys) deltas[k] = +(to[k] - from[k]).toFixed(1);
  return {
    deltas,
    fromServing: from.serving,
    toServing: to.serving,
    sameServing: from.serving === to.serving,
  };
}

function gained(from, to, key) { return to[key] - from[key]; }

/** "a", "a and b", "a, b and c" */
function joinList(items) {
  if (items.length <= 1) return items[0] || '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/* Build the human sentence. Every clause is a real number or a real
   property — nothing here is decorative. */
function buildReason(from, to, goals, tier) {
  const bits = [];

  if (tier === 'exact') bits.push(`Same kind of ingredient — ${to.note.charAt(0).toLowerCase()}${to.note.slice(1)}`);
  else if (tier === 'adjacent') bits.push(`Close enough to stand in. ${to.note}`);
  else bits.push(`Not a like-for-like swap — this changes the dish. ${to.note}`);

  const dFiber = +gained(from, to, 'fiber').toFixed(1);
  const dProt = +gained(from, to, 'protein').toFixed(1);
  const dCarb = +gained(from, to, 'carbs').toFixed(1);

  if (goals.fiber === 'yes' && dFiber > 0.3) {
    bits.push(`${to.fiber}g fiber vs ${from.fiber}g — that's ${dFiber}g more.`);
  }
  if (goals.protein === 'yes' && dProt > 0.5) {
    bits.push(`${to.protein}g protein vs ${from.protein}g — ${dProt}g more.`);
  }
  if (goals.carb === 'yes' && dCarb > 2) {
    bits.push(`Adds ${dCarb}g of carbs, which is what makes it more filling.`);
  }

  /* A requested goal this option does NOT meet has to be said plainly. It can
     still be worth showing — it may be the closest thing that actually cooks
     the same way — but staying silent would let someone grab it believing it
     served the goal they just told us about. Ranked below the ones that do
     meet it, and labeled either way. */
  const misses = [
    goals.fiber === 'yes' && dFiber <= 0 ? { word: 'fiber', d: dFiber } : null,
    goals.protein === 'yes' && dProt <= 0 ? { word: 'protein', d: dProt } : null,
    goals.carb === 'yes' && dCarb <= 0 ? { word: 'carbs', d: dCarb } : null,
  ].filter(Boolean);

  if (misses.length) {
    // Merged into ONE sentence. Emitting a separate clause per missed goal
    // repeated the same trailing explanation verbatim and read like a bug.
    const words = joinList(misses.map(m => m.word));
    const amounts = joinList(misses.map(m => (
      m.d === 0 ? `about the same ${m.word}` : `${Math.abs(m.d)}g less ${m.word}`
    )));
    bits.push(
      `Doesn't serve the ${words} goal — ${amounts} than ${from.label.toLowerCase()}. ` +
      `It's here because it cooks the same way.`,
    );
  }

  /* Say the tradeoff out loud even when it's not what they asked about.
     Threshold is 1g of fiber — about 3.5% of the 28g Daily Value, which is
     small but real, and the whole point is that the cook finds out from us
     rather than not at all. */
  if (goals.fiber !== 'yes' && dFiber <= -1) {
    bits.push(`Worth knowing: ${Math.abs(dFiber)}g less fiber.`);
  }
  if (goals.protein !== 'yes' && dProt <= -3) {
    bits.push(`Worth knowing: ${Math.abs(dProt)}g less protein.`);
  }

  const sharedMicros = to.micros.filter(m => from.micros.includes(m));
  if (sharedMicros.length) {
    bits.push(`Also a source of ${sharedMicros.slice(0, 2).join(' and ')}, same as what you were buying.`);
  } else if (to.micros.length) {
    bits.push(`Different strengths: notable for ${to.micros.slice(0, 2).join(' and ')}.`);
  }

  return bits.join(' ');
}

/**
 * Ranked, explained alternatives for an out-of-stock ingredient.
 *
 * @param {string} name   the shopping-list line ("2 poblano peppers")
 * @param {object} goals  answers keyed by SWAP_QUESTIONS ids
 * @returns {{source, alternatives, disclaimer, unknown}}
 *   `unknown: true` when we don't have real data on the item — the caller
 *   should say so rather than show an empty list as if nothing substitutes.
 */
export function alternativesFor(name, goals = {}) {
  const from = findIngredient(name);
  if (!from) {
    return { source: null, alternatives: [], disclaimer: NUTRITION_DISCLAIMER, unknown: true };
  }

  const method = goals.method && goals.method !== 'any' ? goals.method : null;
  const adjacentRoles = ADJACENT[from.role] || [];

  // Which stretch roles the cook's goals actually opened up.
  const stretchRoles = new Set();
  for (const [goal, roles] of Object.entries(GOAL_STRETCH)) {
    if (goals[goal] === 'yes') roles.forEach(r => stretchRoles.add(r));
  }

  const scored = [];
  for (const to of INGREDIENTS) {
    if (to.id === from.id) continue;

    let tier = null;
    if (to.role === from.role) tier = 'exact';
    else if (adjacentRoles.includes(to.role)) tier = 'adjacent';
    else if (stretchRoles.has(to.role) && VEG_ROLES.has(from.role)) tier = 'stretch';
    if (!tier) continue;

    // A method the candidate can't survive disqualifies it outright — this is
    // the guard that stops "use romaine" from showing up for a roast.
    if (method && !to.methods.includes(method)) continue;

    let score = tier === 'exact' ? 100 : tier === 'adjacent' ? 62 : 34;

    /* An explicitly requested goal is a QUESTION, and an option that moves the
       wrong way doesn't answer it. Merely withholding the bonus wasn't enough:
       the exact-role bonus alone was big enough that asking for "more fiber"
       still returned cauliflower (2.9g) above the broccoli (5.1g) it was
       replacing — technically the closest swap, but a non-answer to what was
       actually asked. So a goal that isn't met costs real score. */
    const MISSES_GOAL = -40;
    if (goals.protein === 'yes') {
      const d = gained(from, to, 'protein');
      score += d > 0 ? d * 2.2 : MISSES_GOAL;
    }
    if (goals.fiber === 'yes') {
      const d = gained(from, to, 'fiber');
      score += d > 0 ? d * 3.2 : MISSES_GOAL;
    }
    if (goals.carb === 'yes') {
      const d = gained(from, to, 'carbs');
      score += d > 0 ? d * 0.5 : MISSES_GOAL;
    }

    // Unrequested losses are a real cost, so they cost score.
    if (goals.fiber !== 'yes')   score -= Math.max(0, -gained(from, to, 'fiber')) * 1.2;
    if (goals.protein !== 'yes') score -= Math.max(0, -gained(from, to, 'protein')) * 0.6;

    if (goals.flavor && goals.flavor !== 'any') {
      score += to.flavors.includes(goals.flavor) ? 14 : -6;
    }

    scored.push({
      ingredient: to,
      tier,
      score: Math.round(score),
      compare: nutritionCompare(from, to),
      reason: buildReason(from, to, goals, tier),
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return {
    source: from,
    alternatives: scored.slice(0, 5),
    disclaimer: NUTRITION_DISCLAIMER,
    unknown: false,
  };
}
