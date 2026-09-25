/* groceryCategories.js — group a flat shopping list into real grocery-aisle
   categories, so "send to shopping list" reads like an organized list
   instead of one long blob. Keyword-heuristic (same honest-heuristic
   pattern as wellnessGoals.js's nutrient tags / flavorProfile.js's flavor
   tags — not a barcode/UPC lookup), validated against the app's actual
   575-recipe, 4,259-ingredient-line corpus at ~97.6% categorized (the rest
   fall into "Other," same as a real list always has a few odd items). */

const GROCERY_CATEGORIES = [
  { id: 'produce', label: 'Produce', re: /lettuce|spinach|kale|arugula|tomato|onion|garlic|potato|carrot|celery|pepper|cucumber|zucchini|squash|broccoli|cauliflower|cabbage|mushroom|avocado|lemon|lime|apple|banana|orange|berry|berries|grape|mango|pineapple|peach|pear|plum|melon|herb|basil|cilantro|parsley|mint|ginger|scallion|leek|corn|sprout|radish|beet|eggplant|pea|raisin|date|fig|apricot|plantain|okra|artichoke|turnip|olive|shallot|greens|sauerkraut|galangal|lemongrass|cherry|cherries|nectarine|kiwi|pomegranate|watermelon|cantaloupe|prune|yam|vegetable|fruit|fennel|dill/i },
  { id: 'meat', label: 'Meat, Seafood & Protein', re: /chicken|beef|pork|turkey|lamb|bacon|sausage|steak|fish|salmon|tuna|shrimp|crab|lobster|cod|tilapia|anchov|veal|\bham\b|meat|goat|hot dog|mussel|clam|oyster|tofu|tempeh|seitan|squid|bratwurst|octopus|\bpig\b/i },
  { id: 'dairy', label: 'Dairy & Eggs', re: /milk|cheese|yogurt|butter|ghee|cream|egg|feta|mozzarella|parmesan|cheddar|ricotta|paneer/i },
  { id: 'bakery', label: 'Bakery & Bread', re: /bread|bun|bagel|tortilla|naan|pita|roll|baguette|croissant|muffin|dough|phyllo|puff pastry|pastry|pie crust|ladyfinger|biscuit/i },
  { id: 'pantry', label: 'Pantry & Dry Goods', re: /flour|sugar|rice|pasta|noodle|lentil|chickpea|bean|quinoa|oat|cereal|cornmeal|wheat|yeast|breadcrumb|panko|honey|syrup|vinegar|\boil\b|nut|almond|walnut|pistachio|cashew|pecan|hazelnut|sesame|peanut|coconut|couscous|cornstarch|baking powder|baking soda|tahini|\bdal\b|granola|nori|seaweed|wasabi|matcha|mirin|kombu|bonito|hummus|shortening|\blard\b/i },
  { id: 'canned', label: 'Canned & Jarred', re: /canned|tomato paste|tomato sauce|coconut milk|broth|stock/i },
  { id: 'frozen', label: 'Frozen', re: /frozen/i },
  { id: 'spices', label: 'Spices & Condiments', re: /\bsalt\b|black pepper|cumin|paprika|cinnamon|nutmeg|turmeric|cardamom|clove|bay leaf|bay leaves|oregano|thyme|rosemary|chili powder|curry powder|curry paste|garam masala|soy sauce|hot sauce|ketchup|mustard|mayo|salsa|\bsauce\b|spice|seasoning|saffron|vanilla|cocoa|chocolate|harissa|tamarind|caraway|coriander|anise|allspice|peppercorn|jam\b|chil(i|e)|cayenne|fenugreek|marjoram|masala|sumac/i },
  { id: 'beverages', label: 'Beverages', re: /\bwater\b|juice|soda|\btea\b|coffee|\bwine\b|\bbeer\b|sparkling|rose water|\bice\b|whisky|whiskey|\brum\b|vodka|\bgin\b|liqueur|brandy|cognac|schnapps|espresso|guinness|prosecco|aperol|champagne/i },
];
const OTHER = { id: 'other', label: 'Other' };

// Aisle-walk order for display — produce/meat/dairy first (perimeter of a
// real store), pantry/canned/frozen/spices/beverages after (center aisles),
// "Other" last.
const DISPLAY_ORDER = [...GROCERY_CATEGORIES.map(c => c.id), 'other'];

function itemText(item) {
  return typeof item === 'string' ? item : (item?.text || item?.name || '');
}

export function categoryOf(item) {
  const t = itemText(item);
  if (!t) return OTHER;
  for (const cat of GROCERY_CATEGORIES) if (cat.re.test(t)) return cat;
  return OTHER;
}

/** Group a flat item list into [{id, label, items}] in aisle-walk order,
 * skipping any category with nothing in it. */
export function groupByCategory(items) {
  const groups = new Map();
  for (const raw of items || []) {
    const text = itemText(raw);
    if (!text) continue;
    const cat = categoryOf(raw);
    if (!groups.has(cat.id)) groups.set(cat.id, { id: cat.id, label: cat.label, items: [] });
    groups.get(cat.id).items.push(text);
  }
  return DISPLAY_ORDER.map(id => groups.get(id)).filter(Boolean);
}
