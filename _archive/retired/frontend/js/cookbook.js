/* ── Anime Chef Cookbook ─────────────────────────────────────── */

const CB_RECIPES = [

  /* ====== APPETIZERS ====== */
  {
    id: 'app_001',
    name: 'Onigiri',
    anime: 'Fruits Basket / Naruto',
    category: 'appetizers',
    emoji: '🍙',
    gradient: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
    time: '20 min',
    difficulty: 'Easy',
    description: 'Hand-pressed rice balls wrapped in nori — the ultimate comfort food that appears in countless anime.',
    dietary: ['vegan', 'gluten-free'],
    ingredients: [
      '2 cups Japanese short-grain rice',
      '2¼ cups water',
      '1 tsp salt',
      '4 sheets nori, cut into strips',
      'Filling of choice: pickled plum, tuna mayo, or salmon flake',
      'Sesame seeds (optional)',
    ],
    instructions: [
      'Rinse the rice until water runs clear. Cook with 2¼ cups water and let steam 10 minutes.',
      'Wet your hands with water and rub with salt to prevent sticking.',
      'Grab a handful of warm rice (~⅓ cup), press a small indent in the center and add filling.',
      'Fold rice over the filling and shape by pressing firmly into a triangle.',
      'Wrap the base with a nori strip just before eating so it stays crisp.',
    ],
  },
  {
    id: 'app_002',
    name: 'Takoyaki',
    anime: 'One Piece',
    category: 'appetizers',
    emoji: '🐙',
    gradient: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
    time: '30 min',
    difficulty: 'Medium',
    description: "Crispy, pillowy octopus balls with a molten center — Sanji's street-food specialty.",
    dietary: [],
    ingredients: [
      '1 cup all-purpose flour',
      '2 eggs',
      '2½ cups dashi stock (or chicken broth)',
      '1 tbsp soy sauce',
      '1 cup cooked octopus, diced small',
      'Green onions, tenkasu (tempura bits), pickled ginger',
      'Takoyaki sauce, mayo, bonito flakes, aonori to serve',
    ],
    instructions: [
      'Whisk flour, eggs, dashi, and soy sauce into a thin, smooth batter.',
      'Heat a takoyaki pan (or æble skiver pan) over medium-high heat and oil each well.',
      'Fill each well with batter, drop in a piece of octopus, green onion, tenkasu, and ginger.',
      'When the edges set (about 2 min), use a skewer to rotate each ball 90 degrees.',
      'Keep rotating until each ball is perfectly round and golden. Serve with sauce, mayo, and bonito.',
    ],
  },
  {
    id: 'app_003',
    name: 'Survey Corps Potato',
    anime: 'Attack on Titan',
    category: 'appetizers',
    emoji: '🥔',
    gradient: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
    time: '60 min',
    difficulty: 'Easy',
    description: "The potato Sasha smuggled during roll call. Simple, honest, and absolutely worth the punishment.",
    dietary: ['vegan', 'gluten-free'],
    ingredients: [
      '4 medium Yukon Gold potatoes',
      '2 tbsp olive oil',
      '1 tsp coarse salt',
      '½ tsp smoked paprika',
      '½ tsp black pepper',
      'Fresh herbs: rosemary or thyme',
    ],
    instructions: [
      'Preheat oven to 425°F. Scrub potatoes and dry well.',
      'Rub each potato with olive oil, salt, paprika, and pepper.',
      'Pierce each potato 5–6 times with a fork.',
      'Bake directly on the oven rack for 50–60 minutes until the skin is crisp and the inside is fluffy.',
      'Split open, add butter or your choice of topping. Eat immediately — preferably while running.',
    ],
  },
  {
    id: 'app_004',
    name: 'Dragon Ball Croquettes',
    anime: 'Dragon Ball Z',
    category: 'appetizers',
    emoji: '✨',
    gradient: 'linear-gradient(135deg, #fff9c4 0%, #fff176 100%)',
    time: '40 min',
    difficulty: 'Medium',
    description: "Golden, crispy croquettes — Chichi's cooking that fuels warriors. Power level over 9000.",
    dietary: [],
    ingredients: [
      '2 cups mashed potato (cooled)',
      '1 cup ground beef or chicken, cooked and seasoned',
      '½ onion, finely diced and sautéed',
      'Salt, black pepper, soy sauce to taste',
      '½ cup flour, 1 egg beaten, 1 cup panko breadcrumbs',
      'Oil for deep frying',
    ],
    instructions: [
      'Mix cooled mashed potato with cooked meat, sautéed onion, salt, pepper, and a splash of soy sauce.',
      'Form into oval patties about the size of your palm.',
      'Dredge each in flour, dip in beaten egg, then coat thoroughly in panko.',
      'Deep fry at 340°F for 3–4 minutes until deep golden brown.',
      'Drain on a rack. Serve with tonkatsu sauce and shredded cabbage.',
    ],
  },

  /* ====== MAINS ====== */
  {
    id: 'main_001',
    name: "Ichiraku Ramen",
    anime: 'Naruto',
    category: 'mains',
    emoji: '🍜',
    gradient: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)',
    time: '45 min',
    difficulty: 'Medium',
    description: "Naruto's favorite miso ramen. A rich, cloudy pork bone broth with a soft-boiled egg and chashu.",
    dietary: [],
    ingredients: [
      '4 cups tonkotsu or chicken broth',
      '2 tbsp white miso paste',
      '1 tbsp soy sauce',
      '1 tsp sesame oil',
      '1 tsp grated ginger',
      '2 portions fresh ramen noodles',
      '2 soft-boiled eggs (marinated in soy + mirin)',
      '4 slices chashu pork (or any roasted pork belly)',
      'Corn, bamboo shoots, green onions, nori to garnish',
    ],
    instructions: [
      'Heat broth over medium. Whisk in miso, soy sauce, ginger, and sesame oil until smooth.',
      'Cook ramen noodles per package instructions, drain and divide into bowls.',
      'Pour hot broth over noodles.',
      'Top with chashu slices, halved soft-boiled egg, corn, bamboo shoots, and nori.',
      'Finish with a swirl of sesame oil and sliced green onions. Believe it.',
    ],
  },
  {
    id: 'main_002',
    name: 'Katsudon',
    anime: 'Yuri on Ice / My Hero Academia',
    category: 'mains',
    emoji: '🍱',
    gradient: 'linear-gradient(135deg, #fff3e0 0%, #ffccbc 100%)',
    time: '35 min',
    difficulty: 'Medium',
    description: "A bowl of pork cutlet and egg simmered in dashi over rice. Victor makes it for Yuri every time he lands a quad.",
    dietary: [],
    ingredients: [
      '2 tonkatsu pork cutlets (pre-fried, see below)',
      '2 cups short-grain white rice, cooked',
      '3 eggs',
      '½ onion, thinly sliced',
      '¼ cup dashi stock',
      '2 tbsp soy sauce',
      '2 tbsp mirin',
      '1 tsp sugar',
      '— For tonkatsu: pork loin, salt, flour, egg, panko, oil',
    ],
    instructions: [
      'Season pork loin with salt and pepper. Bread in flour → egg → panko. Fry at 350°F until golden (5–6 min). Slice.',
      'In a small skillet, combine dashi, soy sauce, mirin, and sugar. Bring to a simmer.',
      'Add sliced onion and cook 3 minutes until softened.',
      'Lay sliced katsu over the onions. Beat eggs loosely and pour over the top.',
      'Cover and cook on low heat 60–90 seconds until eggs are just set. Slide over a bowl of rice.',
    ],
  },
  {
    id: 'main_003',
    name: "Ponyo's Ham Ramen",
    anime: 'Ponyo',
    category: 'mains',
    emoji: '🌊',
    gradient: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
    time: '20 min',
    difficulty: 'Easy',
    description: "The ramen Ponyo eats for the first time on land — simple, warm, and pure magic in a bowl.",
    dietary: [],
    ingredients: [
      '2 packets instant ramen noodles (discard one seasoning packet)',
      '2 cups chicken broth',
      '1 cup water',
      '2 tsp white miso paste',
      '1 tsp soy sauce',
      '4 slices cooked ham, cut into strips',
      '2 large eggs',
      '2 green onions, sliced',
    ],
    instructions: [
      'Bring broth and water to a boil in a small pot.',
      'Whisk in miso paste and soy sauce over low heat.',
      'Add noodles and cook 3 minutes.',
      'Crack eggs directly into the simmering broth, cover and poach 3 minutes until whites are just set.',
      'Divide into bowls with ham strips on top and a shower of green onions.',
    ],
  },
  {
    id: 'main_004',
    name: "Howl's Moving Breakfast",
    anime: "Howl's Moving Castle",
    category: 'mains',
    emoji: '🥚',
    gradient: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
    time: '15 min',
    difficulty: 'Easy',
    description: "The iconic breakfast Howl conjures in the moving castle — crispy bacon, fried eggs, and toast. Magic made simple.",
    dietary: [],
    ingredients: [
      '4 thick-cut bacon strips',
      '4 large eggs',
      '4 slices thick bread, toasted',
      '2 tbsp butter',
      'Salt and black pepper',
      'Sliced mushrooms (optional)',
      'Cherry tomatoes (optional)',
    ],
    instructions: [
      'Cook bacon in a cold cast-iron skillet over medium heat, turning once, until crisp. Set aside, keep the fat.',
      'Add butter to the bacon fat. Fry mushrooms and tomatoes if using, push to the side.',
      'Crack eggs gently into the pan. Season with salt and pepper.',
      'Cook sunny-side up on low heat until whites are just set but yolks are still runny, about 3–4 min.',
      'Serve immediately over buttered toast with bacon on the side. Eat by the fire.',
    ],
  },
  {
    id: 'main_005',
    name: "Shokugeki Curry Rice",
    anime: 'Food Wars! Shokugeki no Soma',
    category: 'mains',
    emoji: '🍛',
    gradient: 'linear-gradient(135deg, #fffde7 0%, #fff59d 100%)',
    time: '50 min',
    difficulty: 'Hard',
    description: "The dish that causes clothes to spontaneously combust. Deep, complex Japanese curry built from scratch.",
    dietary: [],
    ingredients: [
      '500g chicken thighs, cut into chunks',
      '2 onions, finely diced',
      '2 carrots, chopped',
      '2 potatoes, cubed',
      '3 cloves garlic, minced',
      '1 tbsp fresh ginger, grated',
      '3 tbsp Japanese curry powder (or S&B mix)',
      '1 tbsp garam masala',
      '1 tbsp tomato paste',
      '2 cups chicken broth',
      '1 tbsp soy sauce',
      '1 tbsp honey or mango chutney',
      'Cooked Japanese short-grain rice to serve',
    ],
    instructions: [
      'Cook onions in oil over medium-low heat for 20–25 minutes until deeply caramelized. This is the secret.',
      'Add garlic and ginger, stir 1 minute. Add curry powder and garam masala, toast 30 seconds.',
      'Add tomato paste, stir well. Add chicken and sear lightly.',
      'Add broth, carrots, potatoes, soy sauce, and honey. Simmer 25 minutes until vegetables are tender.',
      'Adjust seasoning. Serve over a mound of rice — ladle curry in a neat half-and-half presentation.',
    ],
  },
  {
    id: 'main_006',
    name: 'Mushroom Udon',
    anime: 'Demon Slayer: Kimetsu no Yaiba',
    category: 'mains',
    emoji: '🍄',
    gradient: 'linear-gradient(135deg, #efebe9 0%, #d7ccc8 100%)',
    time: '25 min',
    difficulty: 'Easy',
    description: "Inosuke's favorite — hearty udon with wild mushrooms in a clean dashi broth. No utensils required.",
    dietary: ['vegan'],
    ingredients: [
      '2 portions fresh or frozen udon noodles',
      '4 cups dashi stock (kombu-based for vegan)',
      '2 tbsp soy sauce',
      '1 tbsp mirin',
      '1 tsp salt',
      '2 cups mixed mushrooms: shiitake, king trumpet, enoki',
      '2 green onions, sliced',
      'Shichimi togarashi to serve',
    ],
    instructions: [
      'Bring dashi to a simmer. Add soy sauce, mirin, and salt.',
      'Add mushrooms and simmer 5 minutes until tender.',
      'Cook udon per package directions, drain, and divide into deep bowls.',
      'Pour hot broth and mushrooms over noodles.',
      'Top with green onions and a generous shake of shichimi. Eat loudly.',
    ],
  },
  {
    id: 'main_007',
    name: "Kiki's Herring & Pumpkin Pie",
    anime: "Kiki's Delivery Service",
    category: 'mains',
    emoji: '🥧',
    gradient: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)',
    time: '75 min',
    difficulty: 'Hard',
    description: "The savory pie Kiki delivers through a storm. Rustic, golden, and worth every altitude.",
    dietary: [],
    ingredients: [
      '1 store-bought pie crust (or homemade shortcrust pastry)',
      '400g smoked herring fillets, flaked',
      '300g kabocha squash or butternut pumpkin, roasted and cubed',
      '1 onion, diced and sautéed',
      '3 eggs',
      '150ml heavy cream',
      '50g gruyère cheese, grated',
      'Salt, white pepper, fresh thyme',
    ],
    instructions: [
      'Preheat oven to 375°F. Line a pie dish with pastry, blind bake 10 minutes with weights.',
      'Layer smoked herring, roasted pumpkin, and sautéed onion into the pre-baked crust.',
      'Whisk eggs, cream, salt, pepper, and thyme together. Pour over the filling.',
      'Top with grated gruyère. Bake 35–40 minutes until set and golden.',
      'Cool 10 minutes before slicing. Best delivered by broomstick.',
    ],
  },
  {
    id: 'main_008',
    name: "SAO Ragout Rabbit Stew",
    anime: 'Sword Art Online',
    category: 'mains',
    emoji: '🐇',
    gradient: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)',
    time: '90 min',
    difficulty: 'Hard',
    description: "An S-rank ingredient that only Kirito could get. The stew that tasted like real life in a virtual world.",
    dietary: [],
    ingredients: [
      '1 whole rabbit (or chicken), cut into pieces',
      '3 cloves garlic',
      '2 carrots, 2 celery stalks, 1 large onion',
      '1 cup dry white wine',
      '2 cups chicken stock',
      '1 can (14oz) diced tomatoes',
      '2 sprigs rosemary, 2 bay leaves, fresh thyme',
      'Salt, black pepper, olive oil',
    ],
    instructions: [
      'Season rabbit pieces with salt and pepper. Brown in olive oil on all sides over high heat. Remove.',
      'In the same pot, sauté onion, carrot, and celery until softened (8 min).',
      'Add garlic and cook 1 minute. Pour in wine, scrape the bottom, reduce by half.',
      'Add stock, tomatoes, herbs, and the browned rabbit. Bring to a simmer.',
      'Cover and cook on low for 70–80 minutes until the meat is fall-off-the-bone tender. Remove herbs before serving.',
    ],
  },

  /* ====== DESSERTS ====== */
  {
    id: 'des_001',
    name: 'Dango',
    anime: 'Clannad',
    category: 'desserts',
    emoji: '🍡',
    gradient: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)',
    time: '30 min',
    difficulty: 'Easy',
    description: "Dango, dango, dango — the chewy, sweet rice dumplings from Clannad's iconic theme. A family in every skewer.",
    dietary: ['vegan', 'gluten-free'],
    ingredients: [
      '1 cup shiratamako (glutinous rice flour)',
      '¼ cup tofu (silken) or water, to bind',
      '2 tbsp sugar',
      '— Mitarashi sauce:',
      '3 tbsp soy sauce',
      '3 tbsp sugar',
      '2 tbsp mirin',
      '½ cup water',
      '1½ tsp cornstarch mixed with 1 tbsp water',
    ],
    instructions: [
      'Mix rice flour, tofu (or water), and sugar until a smooth, ear-lobe-soft dough forms.',
      'Roll into 1-inch balls (12–15 total). Boil in salted water until they float, then 2 minutes more.',
      'Transfer to ice water to cool, then drain and skewer 3 per stick.',
      'For the sauce: combine soy, sugar, mirin, and water in a saucepan. Bring to a simmer, stir in cornstarch slurry until thickened.',
      'Grill or broil skewered dango until lightly charred. Pour warm sauce over and serve.',
    ],
  },
  {
    id: 'des_002',
    name: 'Melon Bread',
    anime: 'Various (Shakugan no Shana / Clannad / Index)',
    category: 'desserts',
    emoji: '🍞',
    gradient: 'linear-gradient(135deg, #f9fbe7 0%, #f0f4c3 100%)',
    time: '3 hr',
    difficulty: 'Hard',
    description: "The most iconic anime bakery item. A soft milk bread bun hidden under a sweet, crispy cookie crust.",
    dietary: ['vegetarian'],
    ingredients: [
      '— Bread dough: 2¼ tsp dry yeast, ¾ cup warm milk, 2 cups bread flour, 3 tbsp sugar, ½ tsp salt, 1 egg, 3 tbsp softened butter',
      '— Cookie shell: ½ cup flour, ¼ cup sugar, 3 tbsp softened butter, 1 egg yolk, ½ tsp vanilla',
    ],
    instructions: [
      'Proof yeast in warm milk 5 min. Combine with flour, sugar, salt, egg, and butter. Knead 10 min until smooth.',
      'Proof in a covered bowl 1 hour until doubled. Punch down, divide into 8 balls.',
      'Make cookie dough: cream butter and sugar, mix in egg yolk and vanilla, stir in flour until soft.',
      'Flatten each cookie portion into a disk and drape over a bread ball, pinching at the bottom.',
      'Score a crosshatch pattern on top. Proof 45 min. Brush with egg wash. Bake at 350°F for 15–18 min until golden.',
    ],
  },
  {
    id: 'des_003',
    name: 'Matcha Daifuku Mochi',
    anime: 'Various Japanese Anime',
    category: 'desserts',
    emoji: '🍵',
    gradient: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
    time: '25 min',
    difficulty: 'Medium',
    description: "Pillowy matcha rice cake filled with sweet red bean paste. The green-tea-kissed treat from every café scene.",
    dietary: ['vegan', 'gluten-free'],
    ingredients: [
      '1 cup mochiko (sweet rice flour)',
      '2 tbsp matcha powder',
      '¼ cup sugar',
      '¾ cup water',
      '1 cup sweet red bean paste (anko), chilled',
      'Potato starch or cornstarch for dusting',
    ],
    instructions: [
      'Mix mochiko, matcha, and sugar in a microwave-safe bowl. Stir in water until no lumps remain.',
      'Microwave uncovered on high for 2 minutes. Stir well. Microwave 1 more minute. Stir again. Dough should be translucent.',
      'Dust a surface generously with starch. Turn hot dough out and dust the top.',
      'Divide dough into 8 pieces. Flatten each, place a ball of anko in the center, and pinch closed.',
      'Roll gently in starch, place seam-side down. Serve at room temperature.',
    ],
  },
  {
    id: 'des_004',
    name: "Sailor Moon Crepes",
    anime: 'Sailor Moon',
    category: 'desserts',
    emoji: '🌙',
    gradient: 'linear-gradient(135deg, #fce4ec 0%, #e8eaf6 100%)',
    time: '25 min',
    difficulty: 'Easy',
    description: "Tokyo's Harajuku-style street crepes — the treat Usagi is always eating. Sweet, overstuffed, and in the name of the moon.",
    dietary: ['vegetarian'],
    ingredients: [
      '1 cup all-purpose flour',
      '2 eggs',
      '1¼ cups milk',
      '2 tbsp melted butter',
      '1 tbsp sugar',
      'Pinch of salt',
      '— Filling: whipped cream, strawberries, sliced banana, Nutella or custard',
    ],
    instructions: [
      'Blend flour, eggs, milk, butter, sugar, and salt into a smooth batter. Rest 30 min (or overnight).',
      'Heat a non-stick pan over medium. Melt a tiny amount of butter.',
      'Pour a thin ladleful of batter, swirl to coat the pan. Cook 60 seconds until the edges lift.',
      'Flip gently, cook 30 seconds more. Stack on a plate.',
      'Lay crepe flat, spread Nutella or custard, pile in fruit and whipped cream, then roll into a cone.',
    ],
  },
  {
    id: 'des_005',
    name: 'Taiyaki',
    anime: 'Various (My Hero Academia / Chi\'s Sweet Home)',
    category: 'desserts',
    emoji: '🐟',
    gradient: 'linear-gradient(135deg, #fff8e1 0%, #ffe082 100%)',
    time: '25 min',
    difficulty: 'Medium',
    description: "Fish-shaped waffles with sweet red bean paste inside. The snack that shows up whenever someone is happy.",
    dietary: ['vegetarian'],
    ingredients: [
      '1 cup all-purpose flour',
      '1 tsp baking powder',
      '2 tbsp sugar',
      '1 egg',
      '¾ cup milk',
      '1 tbsp vegetable oil',
      '½ cup sweet red bean paste (anko)',
    ],
    instructions: [
      'Whisk flour, baking powder, and sugar. Beat in egg, milk, and oil until smooth.',
      'Heat a taiyaki pan (or a fish-shaped waffle iron) over medium and oil well.',
      'Fill the bottom half of each mold ⅔ full with batter. Add a spoonful of anko in the center.',
      'Cover with a little more batter so the filling is hidden. Close and cook 3 minutes per side.',
      'Unmold and serve hot. Eat from the tail up — the debate over which end to start from is eternal.',
    ],
  },

  /* ====== DRINKS ====== */
  {
    id: 'drk_001',
    name: 'Ramune Lemonade',
    anime: 'Various Summer Anime',
    category: 'drinks',
    emoji: '🫧',
    gradient: 'linear-gradient(135deg, #e3f2fd 0%, #b3e5fc 100%)',
    time: '5 min',
    difficulty: 'Easy',
    description: "The marble-sealed Japanese soda that appears in every summer festival arc. Pop it yourself at home.",
    dietary: ['vegan', 'gluten-free'],
    ingredients: [
      '1 cup cold sparkling water',
      '2 tbsp fresh lemon or yuzu juice',
      '1–2 tbsp simple syrup (or to taste)',
      '1 tsp citric acid (for that authentic tang)',
      'Ice, lemon slices, a marble (for the full aesthetic)',
    ],
    instructions: [
      'Mix lemon juice, simple syrup, and citric acid in a glass until dissolved.',
      'Pour in cold sparkling water gently to preserve the fizz.',
      'Add a handful of ice and a lemon slice.',
      'Optionally add a few drops of food coloring (blue for original Ramune).',
      'Drop in a glass marble just before serving for the full experience.',
    ],
  },
  {
    id: 'drk_002',
    name: 'Matcha Milk Tea',
    anime: 'Various Slice-of-Life',
    category: 'drinks',
    emoji: '🍵',
    gradient: 'linear-gradient(135deg, #e8f5e9 0%, #dcedc8 100%)',
    time: '10 min',
    difficulty: 'Easy',
    description: "Creamy, earthy, gently sweet. The drink every anime café serves and every main character holds in the rain.",
    dietary: ['vegetarian', 'gluten-free'],
    ingredients: [
      '1½ tsp ceremonial-grade matcha powder',
      '2 tbsp hot water (not boiling — 170°F)',
      '1 cup whole milk (or oat milk)',
      '1–2 tsp honey or simple syrup',
      'Ice (for iced version)',
    ],
    instructions: [
      'Sift matcha into a small bowl to remove lumps.',
      'Add the hot water and whisk vigorously in a W or M motion until frothy and no lumps remain.',
      'For hot: warm the milk, froth it, and pour over matcha. Sweeten to taste.',
      'For iced: let the matcha cool slightly, fill a glass with ice, pour milk over, then add matcha.',
      'Swirl gently before drinking — let the layers speak first.',
    ],
  },
  {
    id: 'drk_003',
    name: 'Spirited Away Grape Drink',
    anime: 'Spirited Away',
    category: 'drinks',
    emoji: '🍇',
    gradient: 'linear-gradient(135deg, #f3e5f5 0%, #ce93d8 100%)',
    time: '5 min',
    difficulty: 'Easy',
    description: "The mysterious, otherworldly drink from the spirit world — deep purple, sweet, and slightly floral.",
    dietary: ['vegan', 'gluten-free'],
    ingredients: [
      '1 cup Concord grape juice (100%, no sugar added)',
      '½ cup sparkling water',
      '1 tbsp elderflower cordial',
      '1 tsp fresh lemon juice',
      'Edible lavender or butterfly pea flowers (for color shift)',
      'Ice, fresh grapes to garnish',
    ],
    instructions: [
      'Fill a glass with ice and add fresh grapes.',
      'Mix grape juice and elderflower cordial in a small pitcher.',
      'Pour gently over ice, then top with sparkling water.',
      'Add a drop of lemon juice and watch the color shift if using butterfly pea tea.',
      "Sip slowly. Don't eat anything given to you by spirits.",
    ],
  },
];

/* ── State ────────────────────────────────────────────────────── */
let cbActiveCat = 'all';
let cbQuery     = '';

/* ── Helpers ──────────────────────────────────────────────────── */
function cbFilter() {
  return CB_RECIPES.filter(r => {
    const catOk = cbActiveCat === 'all' || r.category === cbActiveCat;
    const q     = cbQuery.toLowerCase();
    const qOk   = !q ||
      r.name.toLowerCase().includes(q) ||
      r.anime.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.ingredients.some(i => i.toLowerCase().includes(q));
    return catOk && qOk;
  });
}

function dietLabel(tag) {
  return { vegan:'Vegan', vegetarian:'Vegetarian', 'gluten-free':'Gluten-Free' }[tag] || tag;
}

/* ── Render grid ──────────────────────────────────────────────── */
function cbRenderGrid() {
  const grid = document.getElementById('cbRecipesGrid');
  const list = cbFilter();

  if (!list.length) {
    grid.innerHTML = '<div class="cb-empty">No recipes found — try a different search.</div>';
    return;
  }

  grid.innerHTML = list.map(r => `
    <div class="cb-recipe-card" data-id="${r.id}">
      <div class="cb-recipe-img" style="background:${r.gradient}">${r.emoji}</div>
      <div class="cb-recipe-info">
        <div class="cb-recipe-anime">${r.anime}</div>
        <div class="cb-recipe-title">${r.name}</div>
        <div class="cb-recipe-desc">${r.description}</div>
        <div class="cb-recipe-meta">
          <span>${r.time}</span>
          <span>${r.difficulty}</span>
          ${r.dietary.length ? `<span>${r.dietary.map(dietLabel).join(' · ')}</span>` : ''}
        </div>
      </div>
    </div>`).join('');

  grid.querySelectorAll('.cb-recipe-card').forEach(card => {
    card.addEventListener('click', () => {
      const recipe = CB_RECIPES.find(r => r.id === card.dataset.id);
      if (recipe) cbOpenModal(recipe);
    });
  });
}

/* ── Modal ────────────────────────────────────────────────────── */
function cbOpenModal(r) {
  document.getElementById('cbModalImg').textContent    = r.emoji;
  document.getElementById('cbModalImg').style.background = r.gradient;
  document.getElementById('cbModalTitle').textContent  = r.name;
  document.getElementById('cbModalAnime').textContent  = r.anime;

  const dietTags = r.dietary.length
    ? `<div class="cb-diet-tags">${r.dietary.map(t =>
        `<span class="cb-diet-tag">${dietLabel(t)}</span>`).join('')}</div>`
    : '';

  document.getElementById('cbModalBody').innerHTML = `
    <div class="cb-modal-desc">${r.description}</div>
    ${dietTags}
    <div class="cb-modal-meta">
      <span><strong>Time:</strong> ${r.time}</span>
      <span><strong>Difficulty:</strong> ${r.difficulty}</span>
    </div>

    <div class="cb-section-title">Ingredients</div>
    <ul class="cb-ingredient-list">
      ${r.ingredients.map(i => `
        <li class="cb-ingredient-item">
          <input type="checkbox" class="cb-ingredient-check" />
          <label>${i}</label>
        </li>`).join('')}
    </ul>

    <div class="cb-section-title">Instructions</div>
    <ol class="cb-steps-list">
      ${r.instructions.map(s => `<li>${s}</li>`).join('')}
    </ol>`;

  document.getElementById('cbModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cbCloseModal() {
  document.getElementById('cbModal').classList.remove('active');
  document.body.style.overflow = '';
}

/* ── Event wiring ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Category buttons
  document.getElementById('cbCategoryNav').addEventListener('click', e => {
    const btn = e.target.closest('.cb-cat-btn');
    if (!btn) return;
    document.querySelectorAll('.cb-cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    cbActiveCat = btn.dataset.cat;
    cbRenderGrid();
  });

  // Search
  document.getElementById('cbSearchInput').addEventListener('input', e => {
    cbQuery = e.target.value;
    cbRenderGrid();
  });

  // Modal close
  document.getElementById('cbCloseModal').addEventListener('click', cbCloseModal);
  document.getElementById('cbModal').addEventListener('click', e => {
    if (e.target === document.getElementById('cbModal')) cbCloseModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cbCloseModal();
  });

  cbRenderGrid();
});
