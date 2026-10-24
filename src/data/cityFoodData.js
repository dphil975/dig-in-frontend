/* cityFoodData.js — real, curated food-identity content, keyed by the SAME
   BOROUGHS ids used everywhere else in the app (storeData.js, FoodMap,
   zipToState.js's boroughForZip). Not every region has a write-up yet —
   FoodPassport shows an honest "haven't written this one yet" state for any
   id missing here, same posture as CityExplorer's "the layout guide for X
   isn't built yet."

   cuisineTags match against a recipe's own `country`/`cuisine` field (same
   fields RecipeFull/cookAchievements already read) so "recipes you've cooked
   from here" is real personal cook history, never a fabricated community
   number. storeTypes are real STORE_TYPE_LABELS keys (storeData.js) used to
   filter the region's actual store file down to relevant "local spots" —
   never a named restaurant we made up. */

export const CITY_FOOD_DATA = {
  manhattan: {
    label: 'Manhattan', emoji: '🥯',
    signatureDishes: ['New York bagel with lox', 'Dollar slice pizza', 'Pastrami on rye'],
    cuisineTags: ['jewish', 'italian', 'new york', 'deli'],
    storeTypes: ['deli', 'specialty'],
  },
  brooklyn: {
    label: 'Brooklyn', emoji: '🍕',
    signatureDishes: ['Coal-oven pizza', 'Egg cream', 'Caribbean roti'],
    cuisineTags: ['italian', 'caribbean', 'jewish'],
    storeTypes: ['deli', 'african', 'specialty'],
  },
  queens: {
    label: 'Queens', emoji: '🥟',
    signatureDishes: ['Dumplings (Flushing)', 'Arepas (Jackson Heights)', 'Thai boat noodles'],
    cuisineTags: ['chinese', 'colombian', 'thai', 'korean'],
    storeTypes: ['asian', 'south_asian', 'latino'],
  },
  bronx: {
    label: 'The Bronx', emoji: '🍫',
    signatureDishes: ["Egg cream", "Arthur Avenue Italian classics", 'Mofongo'],
    cuisineTags: ['italian', 'puerto rican', 'dominican'],
    storeTypes: ['latino', 'specialty'],
  },
  'staten-island': {
    label: 'Staten Island', emoji: '🍝',
    signatureDishes: ['Sicilian pizza', 'Italian pastries'],
    cuisineTags: ['italian'],
    storeTypes: ['specialty', 'deli'],
  },
  'new-jersey': {
    label: 'New Jersey', emoji: '🌭',
    signatureDishes: ['Taylor ham, egg & cheese', 'Disco fries', 'Italian hot dogs'],
    cuisineTags: ['italian', 'american'],
    storeTypes: ['deli', 'specialty'],
  },
  pennsylvania: {
    label: 'Pennsylvania', emoji: '🥪',
    signatureDishes: ['Philly cheesesteak', 'Soft pretzels', 'Scrapple'],
    cuisineTags: ['american', 'german'],
    storeTypes: ['deli', 'specialty'],
  },
  massachusetts: {
    label: 'Massachusetts', emoji: '🦞',
    signatureDishes: ['New England clam chowder', 'Lobster roll', 'Boston baked beans'],
    cuisineTags: ['seafood', 'american'],
    storeTypes: ['specialty', 'grocery'],
  },
  maryland: {
    label: 'Maryland', emoji: '🦀',
    signatureDishes: ['Maryland blue crab', 'Old Bay everything', 'Crab cakes'],
    cuisineTags: ['seafood', 'american'],
    storeTypes: ['specialty', 'grocery'],
  },
  dc: {
    label: 'Washington, D.C.', emoji: '🌶️',
    signatureDishes: ['Half-smoke', 'Mumbo sauce wings', 'Ethiopian combo platter'],
    cuisineTags: ['ethiopian', 'american'],
    storeTypes: ['african', 'specialty'],
  },
  virginia: {
    label: 'Virginia', emoji: '🐖',
    signatureDishes: ['Virginia ham', 'Brunswick stew', 'Peanut soup'],
    cuisineTags: ['southern', 'american'],
    storeTypes: ['specialty', 'grocery'],
  },
  'north-carolina': {
    label: 'North Carolina', emoji: '🍖',
    signatureDishes: ['Eastern-style whole-hog BBQ', 'Vinegar-based BBQ sauce', 'Hush puppies'],
    cuisineTags: ['southern', 'bbq'],
    storeTypes: ['specialty', 'grocery'],
  },
  'south-carolina': {
    label: 'South Carolina', emoji: '🍚',
    signatureDishes: ['Lowcountry shrimp and grits', 'Carolina Gold rice', 'She-crab soup'],
    cuisineTags: ['southern', 'seafood'],
    storeTypes: ['specialty', 'grocery'],
  },
  georgia: {
    label: 'Georgia', emoji: '🍑',
    signatureDishes: ['Peach cobbler', 'Fried chicken', 'Pimento cheese'],
    cuisineTags: ['southern'],
    storeTypes: ['specialty', 'grocery'],
  },
  florida: {
    label: 'Florida', emoji: '🍋',
    signatureDishes: ['Key lime pie', 'Cuban sandwich', 'Stone crab claws'],
    cuisineTags: ['cuban', 'caribbean', 'seafood'],
    storeTypes: ['latino', 'specialty'],
  },
  tennessee: {
    label: 'Tennessee', emoji: '🔥',
    signatureDishes: ['Nashville hot chicken', 'Memphis dry-rub ribs', 'Biscuits and gravy'],
    cuisineTags: ['southern', 'bbq'],
    storeTypes: ['specialty', 'grocery'],
  },
  alabama: {
    label: 'Alabama', emoji: '🍗',
    signatureDishes: ['White BBQ sauce chicken', 'Fried green tomatoes'],
    cuisineTags: ['southern', 'bbq'],
    storeTypes: ['specialty', 'grocery'],
  },
  louisiana: {
    label: 'Louisiana', emoji: '🦐',
    signatureDishes: ['Gumbo', 'Jambalaya', 'Beignets', 'Crawfish étouffée'],
    cuisineTags: ['cajun', 'creole', 'southern'],
    storeTypes: ['specialty', 'grocery'],
  },
  texas: {
    label: 'Texas', emoji: '🌮',
    signatureDishes: ['Texas brisket', 'Tex-Mex breakfast tacos', 'Chili con carne'],
    cuisineTags: ['tex-mex', 'mexican', 'bbq'],
    storeTypes: ['latino', 'specialty'],
  },
  oklahoma: {
    label: 'Oklahoma', emoji: '🌾',
    signatureDishes: ['Fried onion burger', 'Chicken fried steak'],
    cuisineTags: ['southern', 'american'],
    storeTypes: ['specialty', 'grocery'],
  },
  'new_mexico': {
    label: 'New Mexico', emoji: '🌶️',
    signatureDishes: ['Green chile stew', 'Sopapillas', 'Carne adovada'],
    cuisineTags: ['new mexican', 'mexican'],
    storeTypes: ['latino', 'specialty'],
  },
  arizona: {
    label: 'Arizona', emoji: '🫓',
    signatureDishes: ['Sonoran hot dog', 'Chimichanga', 'Navajo fry bread'],
    cuisineTags: ['mexican', 'southwestern'],
    storeTypes: ['latino', 'specialty'],
  },
  colorado: {
    label: 'Colorado', emoji: '🌿',
    signatureDishes: ['Rocky Mountain trout', 'Green chile smothered everything', 'Palisade peaches'],
    cuisineTags: ['southwestern', 'american'],
    storeTypes: ['specialty', 'grocery'],
  },
  nevada: {
    label: 'Nevada', emoji: '🎰',
    signatureDishes: ['Vegas buffet classics', 'Basque-style lamb (Elko)'],
    cuisineTags: ['american'],
    storeTypes: ['specialty', 'grocery'],
  },
  california: {
    label: 'California', emoji: '🥑',
    signatureDishes: ['California burrito', 'Fish tacos', 'Loaded griddle fries', 'Farm-to-table produce'],
    cuisineTags: ['mexican', 'californian', 'asian'],
    storeTypes: ['latino', 'asian', 'specialty'],
  },
  washington: {
    label: 'Washington', emoji: '☕',
    signatureDishes: ['Dungeness crab', 'Salmon', 'Third-wave coffee'],
    cuisineTags: ['seafood', 'pacific northwest'],
    storeTypes: ['asian', 'specialty'],
  },
  oregon: {
    label: 'Oregon', emoji: '🍩',
    signatureDishes: ['Marionberry pie', 'Food-cart Korean-Mexican fusion', 'Hazelnut everything'],
    cuisineTags: ['pacific northwest', 'fusion'],
    storeTypes: ['specialty', 'asian'],
  },
  hawaii: {
    label: 'Hawaii', emoji: '🍍',
    signatureDishes: ['Poke bowl', 'Plate lunch (loco moco)', 'Spam musubi'],
    cuisineTags: ['hawaiian', 'japanese', 'filipino'],
    storeTypes: ['asian', 'specialty'],
  },
  puerto_rico: {
    label: 'Puerto Rico', emoji: '🍌',
    signatureDishes: ['Mofongo', 'Lechón', 'Arroz con gandules'],
    cuisineTags: ['puerto rican', 'caribbean'],
    storeTypes: ['latino', 'specialty'],
  },
  kentucky: {
    label: 'Kentucky', emoji: '🍗',
    signatureDishes: ['Hot brown sandwich', 'Kentucky fried chicken', 'Burgoo stew'],
    cuisineTags: ['southern'],
    storeTypes: ['specialty', 'grocery'],
  },
  connecticut: {
    label: 'Connecticut', emoji: '🍕',
    signatureDishes: ['New Haven apizza', 'Lobster roll (hot buttered)'],
    cuisineTags: ['italian', 'seafood'],
    storeTypes: ['specialty', 'deli'],
  },
};

export function cityFoodDataFor(regionId) {
  return CITY_FOOD_DATA[regionId] || null;
}
