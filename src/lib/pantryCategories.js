/* pantryCategories — the shelf taxonomy the Virtual Pantry is browsed by.

   This is deliberately SEPARATE from freshness.js's `categorize()`. That one
   answers "how long does this last where it's stored" and only needs a dozen
   coarse buckets (leafy / dairy / dry / …). This one answers a different
   question — "where on my shelves does this live, and what do I have a lot
   of?" — which is how a person actually browses a pantry: seasonings,
   beverages, plant-based, fruits & berries, cookies & sweets, teas & cocoa,
   pasta, canned goods, ramen. Both run off the item's real name; neither
   invents data. Merging them would have wrecked the shelf-life estimates
   (a jar of cinnamon and a bag of rice are one "dry staple" to freshness.js,
   but two very different shelves to a cook).

   Matching is LONGEST-KEYWORD-WINS, not first-category-wins. That's what lets
   "iced tea" land in Beverages while "tea" lands in Teas & Cocoa, and
   "cocoa powder" land in Baking while "cocoa" lands in Teas & Cocoa —
   without having to hand-order 24 categories against each other.

   A few categories also carry a `head` list: head nouns that win over any
   longer keyword elsewhere. Length alone got "chocolate chip cookies" wrong
   (Baking's "chocolate chip" is longer than Sweets' "cookie") and would have
   done the same to "peanut butter cookies" — but the last noun is what the
   thing actually IS. Head lists resolve among themselves by length too, so
   "cake mix" still beats "cake".

   `examples` are shown when a shelf is empty, so the grid still reads as a
   real reference ("what belongs here") instead of a dead tile. */

export const PANTRY_CATEGORIES = [
  {
    id: 'veggies',
    label: 'Veggies',
    blurb: 'Fresh vegetables and the herbs that go with them.',
    examples: ['broccoli', 'carrots', 'onion', 'spinach', 'bell pepper'],
    kw: ['broccoli', 'carrot', 'potato', 'sweet potato', 'onion', 'scallion', 'green onion', 'garlic',
      // Fresh chiles by variety name. These matter more than they look: the
      // whole point of the hunt cards in StoreRun is showing someone what an
      // unfamiliar ingredient looks like, and "poblano" was landing in
      // Everything Else — a generic crate — which is exactly the moment the
      // feature had to work and didn't. Bare "pepper" stays OUT (black pepper
      // is a seasoning); named varieties are unambiguous produce.
      'poblano', 'serrano pepper', 'habanero', 'anaheim', 'shishito', 'banana pepper',
      'chile pepper', 'chili pepper', 'tomatillo', 'plantain', 'napa cabbage', 'daikon',
      'fennel', 'endive', 'watercress', 'collard', 'kohlrabi', 'parsnip', 'rutabaga',
      'chayote', 'nopales', 'snow pea', 'sugar snap', 'butternut', 'acorn squash',
      'spaghetti squash', 'delicata',
      'bell pepper', 'jalapeno', 'tomato', 'cucumber', 'zucchini', 'lettuce', 'romaine', 'spinach',
      'kale', 'arugula', 'chard', 'cabbage', 'bok choy', 'celery', 'corn', 'mushroom', 'squash',
      'eggplant', 'asparagus', 'cauliflower', 'brussels', 'green bean', 'snap pea', 'beet', 'radish',
      'turnip', 'leek', 'shallot', 'ginger', 'okra', 'artichoke', 'sprouts', 'basil', 'cilantro',
      'parsley', 'mint', 'rosemary', 'dill', 'salad', 'greens', 'veggie', 'vegetable', 'produce'],
  },
  {
    id: 'fruits',
    label: 'Fruits & Berries',
    blurb: 'Everything sweet that grew on a tree, vine or bush.',
    examples: ['strawberries', 'bananas', 'apples', 'blueberries', 'lemons'],
    kw: ['apple', 'banana', 'orange', 'clementine', 'mandarin', 'grapefruit', 'grape', 'berry',
      'berries', 'strawberr', 'blueberr', 'raspberr', 'blackberr', 'cranberr', 'peach', 'nectarine',
      'pear', 'plum', 'mango', 'melon', 'watermelon', 'cantaloupe', 'honeydew', 'pineapple', 'kiwi',
      'cherry', 'cherries', 'apricot', 'fig', 'pomegranate', 'papaya', 'guava', 'lychee',
      'persimmon', 'lemon', 'lime', 'avocado', 'raisin', 'dried fruit', 'fruit'],
  },
  {
    id: 'seasoning',
    label: 'Seasonings',
    blurb: 'Spices, dried herbs, salt and the little jars that carry a dish.',
    examples: ['paprika', 'cumin', 'black pepper', 'cinnamon', 'garlic powder'],
    kw: ['salt', 'pepper corn', 'peppercorn', 'black pepper', 'paprika', 'cumin', 'coriander',
      'oregano', 'thyme', 'sage', 'bay leaf', 'cinnamon', 'nutmeg', 'clove', 'cardamom', 'allspice',
      'chili powder', 'chile powder', 'cayenne', 'red pepper flake', 'garlic powder', 'onion powder',
      'turmeric', 'curry powder', 'garam masala', 'za\'atar', 'sumac', 'saffron', 'star anise',
      'fennel seed', 'mustard seed', 'seasoning', 'spice', 'herbs de provence', 'italian seasoning',
      'everything bagel seasoning', 'msg', 'bouillon', 'stock cube', 'vanilla extract', 'extract'],
  },
  {
    id: 'teas_cocoa',
    label: 'Teas & Cocoa',
    blurb: 'The warm-mug shelf — leaves, bags and drinking chocolate.',
    examples: ['green tea', 'chamomile', 'chai', 'hot cocoa', 'matcha'],
    kw: ['tea', 'tea bag', 'matcha', 'chai', 'chamomile', 'rooibos', 'oolong', 'earl grey',
      'green tea', 'black tea', 'herbal tea', 'peppermint tea', 'hibiscus', 'cocoa',
      'hot chocolate', 'drinking chocolate', 'chocolate mix'],
  },
  {
    id: 'coffee',
    label: 'Coffee',
    blurb: 'Beans, grounds, pods and everything that starts the morning.',
    examples: ['ground coffee', 'espresso', 'k-cups', 'cold brew'],
    kw: ['coffee', 'coffee bean', 'ground coffee', 'espresso', 'k-cup', 'k cup', 'coffee pod',
      'instant coffee', 'cold brew', 'chicory', 'decaf'],
  },
  {
    id: 'beverages',
    label: 'Beverages',
    blurb: 'Cold drinks — juice, soda, seltzer and water.',
    examples: ['orange juice', 'seltzer', 'lemonade', 'sparkling water'],
    kw: ['soda', 'cola', 'pop', 'juice', 'orange juice', 'apple juice', 'lemonade', 'limeade',
      'seltzer', 'sparkling water', 'club soda', 'tonic', 'mineral water', 'water bottle',
      'bottled water', 'iced tea', 'sweet tea', 'kombucha', 'energy drink', 'sports drink',
      'gatorade', 'electrolyte', 'smoothie', 'horchata', 'agua fresca', 'ginger ale', 'root beer',
      'cider', 'drink mix', 'beverage'],
  },
  {
    id: 'plant_based',
    label: 'Plant-Based',
    blurb: 'Dairy and meat alternatives — the swap shelf.',
    examples: ['tofu', 'oat milk', 'tempeh', 'nutritional yeast'],
    head: ['tofu', 'tempeh', 'seitan', 'vegan', 'plant based', 'plant-based', 'meatless'],
    kw: ['tofu', 'tempeh', 'seitan', 'oat milk', 'almond milk', 'soy milk', 'cashew milk',
      'coconut milk beverage', 'rice milk', 'pea milk', 'plant based', 'plant-based', 'vegan',
      'meatless', 'meat alternative', 'beyond meat', 'impossible', 'jackfruit',
      'nutritional yeast', 'edamame', 'soy curl', 'vegan cheese', 'oat creamer', 'aquafaba'],
  },
  {
    id: 'pasta',
    label: 'Pasta',
    blurb: 'Dried and fresh pasta, and the shapes worth keeping around.',
    examples: ['spaghetti', 'penne', 'orzo', 'lasagna sheets'],
    head: ['pasta', 'spaghetti', 'lasagna', 'macaroni'],
    kw: ['pasta', 'spaghetti', 'penne', 'macaroni', 'elbow', 'fusilli', 'rotini', 'rigatoni',
      'linguine', 'fettuccine', 'tagliatelle', 'pappardelle', 'bucatini', 'lasagna', 'orzo',
      'ravioli', 'tortellini', 'gnocchi', 'farfalle', 'shells', 'ziti', 'angel hair', 'orecchiette'],
  },
  {
    id: 'ramen',
    label: 'Ramen & Noodles',
    blurb: 'Instant packs, fresh noodles and everything slurpable.',
    examples: ['ramen', 'udon', 'rice noodles', 'soba'],
    head: ['ramen', 'noodle', 'noodles'],
    kw: ['ramen', 'instant noodle', 'cup noodle', 'soba', 'udon', 'somen', 'rice noodle',
      'pho noodle', 'lo mein', 'chow mein', 'vermicelli', 'glass noodle', 'sweet potato noodle',
      'egg noodle', 'noodle', 'wonton wrapper', 'dumpling wrapper'],
  },
  {
    id: 'canned',
    label: 'Canned Goods',
    blurb: 'Tins and jars that turn into dinner on a bad night.',
    examples: ['canned tomatoes', 'chickpeas', 'black beans', 'coconut milk'],
    head: ['canned', 'tinned', 'can of'],
    kw: ['canned', 'can of', 'tinned', 'tin of', 'chickpea', 'garbanzo', 'black bean',
      'kidney bean', 'pinto bean', 'cannellini', 'white bean', 'baked bean', 'refried bean',
      'canned tomato', 'crushed tomato', 'diced tomato', 'tomato paste', 'coconut milk',
      'evaporated milk', 'canned corn', 'canned tuna', 'canned salmon', 'sardine', 'anchovy',
      'broth', 'stock', 'soup', 'canned soup', 'olives', 'capers', 'artichoke heart',
      'green chile', 'pumpkin puree'],
  },
  {
    id: 'sweets',
    label: 'Cookies & Sweets',
    blurb: 'Cookies, chocolate, candy — the shelf nobody forgets.',
    examples: ['chocolate chip cookies', 'dark chocolate', 'gummies', 'brownies'],
    head: ['cookie', 'cookies', 'brownie', 'candy', 'cupcake', 'cake', 'chocolate bar'],
    kw: ['cookie', 'biscuit', 'oreo', 'shortbread', 'macaron', 'brownie', 'candy', 'chocolate',
      'chocolate bar', 'dark chocolate', 'milk chocolate', 'gummy', 'gummies', 'marshmallow',
      'caramel', 'toffee', 'fudge', 'cake', 'cupcake', 'donut', 'doughnut', 'pie', 'pastry',
      'wafer', 'sweets', 'dessert', 'licorice', 'lollipop', 'mochi', 'halva'],
  },
  {
    id: 'snacks',
    label: 'Snacks & Chips',
    blurb: 'Salty, crunchy, straight-from-the-bag food.',
    examples: ['tortilla chips', 'pretzels', 'popcorn', 'crackers'],
    // "chips" is safe as a head noun because Baking claims the longer
    // "chocolate chips" in the same tier — but it LOSES to Bakery's longer
    // "tortilla", so the compound chip forms are listed explicitly too.
    head: ['chips', 'tortilla chips', 'pita chips', 'cracker', 'crackers', 'pretzel', 'popcorn'],
    kw: ['chips', 'potato chip', 'tortilla chip', 'corn chip', 'pita chip', 'pretzel', 'popcorn',
      'cracker', 'granola bar', 'protein bar', 'trail mix', 'jerky', 'puffs', 'cheese puff',
      'rice cake', 'seaweed snack', 'plantain chip', 'veggie straw', 'snack'],
  },
  {
    id: 'dairy',
    label: 'Dairy & Eggs',
    blurb: 'Milk, cheese, butter, yogurt and the egg carton.',
    examples: ['milk', 'eggs', 'cheddar', 'greek yogurt', 'butter'],
    kw: ['milk', 'whole milk', 'skim milk', 'cream', 'heavy cream', 'half and half', 'sour cream',
      'butter', 'ghee', 'cheese', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'ricotta',
      'cottage cheese', 'cream cheese', 'gouda', 'swiss', 'brie',
      // Cheeses the original English-only list missed. "queso fresco" was
      // landing in Everything Else for the same reason "poblano" was — the
      // taxonomy only spoke one grocery store's language.
      'queso', 'queso fresco', 'cotija', 'oaxaca', 'manchego', 'provolone', 'gruyere',
      'gruyère', 'mascarpone', 'burrata', 'paneer', 'monterey jack', 'colby', 'havarti',
      'asiago', 'blue cheese', 'goat cheese', 'chevre', 'chèvre', 'creme fraiche',
      'crème fraîche', 'string cheese', 'mexican crema',
      'yogurt', 'yoghurt', 'greek yogurt',
      'kefir', 'whipped cream', 'egg', 'eggs', 'egg white', 'buttermilk'],
  },
  {
    id: 'meat',
    label: 'Meat & Poultry',
    blurb: 'The protein drawer — fresh, cured and deli.',
    examples: ['chicken thighs', 'ground beef', 'bacon', 'sausage'],
    kw: ['chicken', 'beef', 'steak', 'ground beef', 'pork', 'pork chop', 'lamb', 'veal', 'turkey',
      'sausage', 'bacon', 'ham', 'prosciutto', 'salami', 'pepperoni', 'deli meat', 'ground turkey',
      'ground pork', 'brisket', 'ribs', 'meatball', 'hot dog', 'chorizo', 'duck', 'meat'],
  },
  {
    id: 'seafood',
    label: 'Seafood',
    blurb: 'Fish and shellfish, fresh or frozen.',
    examples: ['salmon', 'shrimp', 'cod', 'mussels'],
    kw: ['fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'cod', 'tilapia', 'halibut', 'snapper',
      'trout', 'mackerel', 'crab', 'lobster', 'scallop', 'clam', 'mussel', 'oyster', 'squid',
      'calamari', 'octopus', 'seafood', 'nori', 'seaweed'],
  },
  {
    id: 'bakery',
    label: 'Bread & Bakery',
    blurb: 'Loaves, buns, wraps and everything from the bread aisle.',
    examples: ['sourdough', 'tortillas', 'bagels', 'pita'],
    head: ['bread', 'bagel', 'baguette', 'croissant', 'tortilla'],
    kw: ['bread', 'sourdough', 'baguette', 'brioche', 'loaf', 'bun', 'bagel', 'tortilla', 'roll',
      'pita', 'naan', 'flatbread', 'croissant', 'muffin', 'english muffin', 'wrap', 'focaccia',
      'challah', 'rye', 'breadcrumb', 'crouton'],
  },
  {
    id: 'grains',
    label: 'Grains & Rice',
    blurb: 'Bulk carbs and dried legumes — the cheapest shelf you own.',
    examples: ['jasmine rice', 'quinoa', 'lentils', 'rolled oats'],
    kw: ['rice', 'jasmine rice', 'basmati', 'brown rice', 'arborio', 'sushi rice', 'quinoa', 'oat',
      'rolled oats', 'oatmeal', 'steel cut', 'barley', 'farro', 'bulgur', 'couscous', 'millet',
      'buckwheat', 'cornmeal', 'grits', 'polenta', 'lentil', 'dried bean', 'split pea', 'wheat berry'],
  },
  {
    id: 'baking',
    label: 'Baking',
    blurb: 'Flour, sugar, leaveners — the ingredients that become something else.',
    examples: ['all-purpose flour', 'baking soda', 'brown sugar', 'yeast'],
    head: ['cake mix', 'brownie mix', 'cookie mix', 'cocoa powder', 'chocolate chips'],
    kw: ['flour', 'all purpose flour', 'all-purpose flour', 'bread flour', 'almond flour',
      'sugar', 'brown sugar', 'powdered sugar', 'confectioners', 'baking soda', 'baking powder',
      'yeast', 'cocoa powder', 'cornstarch', 'corn starch', 'condensed milk', 'chocolate chip',
      'sprinkles', 'molasses', 'shortening', 'cake mix', 'brownie mix', 'gelatin', 'food coloring'],
  },
  {
    id: 'condiments',
    label: 'Condiments & Sauces',
    blurb: 'Bottles and jars in the fridge door.',
    examples: ['soy sauce', 'hot sauce', 'mustard', 'peanut butter'],
    kw: ['ketchup', 'mustard', 'dijon', 'mayo', 'mayonnaise', 'aioli', 'hot sauce', 'sriracha',
      'soy sauce', 'tamari', 'fish sauce', 'oyster sauce', 'hoisin', 'teriyaki', 'bbq sauce',
      'barbecue sauce', 'worcestershire', 'salsa', 'hummus', 'guacamole', 'dressing', 'ranch',
      'relish', 'pickle', 'jam', 'jelly', 'preserves', 'marmalade', 'honey', 'peanut butter',
      'almond butter', 'nutella', 'tahini', 'miso', 'gochujang', 'harissa', 'chimichurri',
      'marinara', 'pasta sauce', 'pesto', 'curry paste', 'chutney', 'sauce', 'dip', 'spread'],
  },
  {
    id: 'oils',
    label: 'Oils & Vinegars',
    blurb: 'What the pan starts with, and what finishes the salad.',
    examples: ['olive oil', 'sesame oil', 'balsamic', 'rice vinegar'],
    kw: ['olive oil', 'extra virgin', 'vegetable oil', 'canola', 'sesame oil', 'coconut oil',
      'avocado oil', 'peanut oil', 'sunflower oil', 'grapeseed', 'cooking spray', 'oil',
      'vinegar', 'balsamic', 'rice vinegar', 'apple cider vinegar', 'red wine vinegar', 'lard'],
  },
  {
    id: 'frozen',
    label: 'Frozen',
    blurb: "The freezer shelf — dinner you don't have to plan.",
    examples: ['frozen peas', 'frozen pizza', 'ice cream', 'frozen berries'],
    head: ['frozen', 'ice cream', 'popsicle'],
    kw: ['frozen', 'frozen pizza', 'frozen veg', 'frozen fruit', 'ice cream', 'gelato', 'sorbet',
      'popsicle', 'frozen waffle', 'frozen dinner', 'tater tot', 'french fries', 'ice pop',
      'freezer meal'],
  },
  {
    id: 'breakfast',
    label: 'Breakfast',
    blurb: 'Cereal, granola, syrup — the first shelf of the day.',
    examples: ['granola', 'cereal', 'maple syrup', 'pancake mix'],
    kw: ['cereal', 'granola', 'muesli', 'pancake mix', 'waffle mix', 'maple syrup', 'syrup',
      'pop tart', 'breakfast bar', 'instant oatmeal', 'cream of wheat', 'toaster pastry'],
  },
  {
    id: 'nuts',
    label: 'Nuts & Seeds',
    blurb: 'Small, expensive, worth keeping sealed.',
    examples: ['almonds', 'walnuts', 'chia seeds', 'sesame seeds'],
    kw: ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'peanut', 'hazelnut', 'macadamia',
      'pine nut', 'brazil nut', 'sunflower seed', 'pumpkin seed', 'pepita', 'chia', 'flax',
      'sesame seed', 'hemp seed', 'poppy seed', 'nuts', 'seeds'],
  },
];

// Everything that didn't match a real keyword. Never a guess dressed up as one.
export const OTHER_CATEGORY = {
  id: 'other',
  label: 'Everything Else',
  blurb: "Items whose names we can't confidently shelve — nothing invented.",
  examples: [],
  kw: [],
};

export const ALL_CATEGORIES = [...PANTRY_CATEGORIES, OTHER_CATEGORY];

const BY_ID = new Map(ALL_CATEGORIES.map(c => [c.id, c]));
export function categoryById(id) { return BY_ID.get(id) || OTHER_CATEGORY; }

/* Head nouns first (what the thing IS), then longest-keyword-wins. "chocolate
   chip cookies" is a cookie, not baking chocolate; "iced tea" (8 chars) beats
   "tea" (3) so it shelves as a Beverage; "cocoa powder" beats "cocoa" so it
   shelves as Baking. Ties go to the earlier category in the list. */
function longestMatch(n, listKey) {
  let best = null;
  let bestLen = 0;
  for (const c of PANTRY_CATEGORIES) {
    for (const k of (c[listKey] || [])) {
      if (k.length > bestLen && n.includes(k)) { best = c; bestLen = k.length; }
    }
  }
  return best;
}

export function categorizeShelf(name) {
  const n = String(name || '').toLowerCase();
  if (!n.trim()) return OTHER_CATEGORY;
  return longestMatch(n, 'head') || longestMatch(n, 'kw') || OTHER_CATEGORY;
}

/** Count real pantry items per shelf category. Returns { [catId]: n }. */
export function countByCategory(items) {
  const counts = {};
  for (const it of items || []) {
    const c = categorizeShelf(it?.name);
    counts[c.id] = (counts[c.id] || 0) + 1;
  }
  return counts;
}

/* `itemsInCategory(items, catId)` used to live here and was never called by
   anything — PantryCategoryGrid filters inline and StoreRun groups its own
   objectives. Removed rather than left as decoration; it's two lines to
   restore if a real caller ever turns up. */
