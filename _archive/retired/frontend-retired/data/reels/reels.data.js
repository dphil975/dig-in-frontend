/* reels.data.js — content for the 7-second Reel Feed.

   REEL_DURATION_MS is the hard 7-second cap that gives the format its Vine
   energy. STAGES is the fixed "product life" arc every reel plays through —
   raw ingredients to finished plate — with `until` as the cumulative fraction
   of the 7s where each stage ends (so the segmented progress bar and the
   stage word are both derived from a single clock). Tweaking the arc here
   restyles every reel at once. */

export const REEL_DURATION_MS = 7000;

export const STAGES = [
  { until: 0.17, word: 'INGREDIENTS', sub: 'raw · laid out · ready' },   // 0.0–1.2s
  { until: 0.43, word: 'PREP',        sub: 'chop · mix · season' },      // 1.2–3.0s
  { until: 0.71, word: 'SIZZLE',      sub: 'the pan hits back' },        // 3.0–5.0s
  { until: 0.86, word: 'PLATE',       sub: 'final assembly' },           // 5.0–6.0s
  { until: 1.00, word: 'BOOM',        sub: 'steam rising · fork in' },   // 6.0–7.0s
];

/* The flavor palette from docs/design/REEL_STYLE_GUIDE.md — a dominant flavor drives the
   reel's canvas tint (hero hue + deep shadow) and a sensible default Nova quip
   category. The create flow lets a user pick from these. */
export const FLAVORS = [
  { key: 'spicy',  label: 'SPICY',  tint: '#c8452c', tint2: '#3d1109', category: 'spicy' },
  { key: 'smoky',  label: 'SMOKY',  tint: '#a8611e', tint2: '#31210c', category: 'comfort' },
  { key: 'savory', label: 'SAVORY', tint: '#9c6b2f', tint2: '#2e1e0d', category: 'comfort' },
  { key: 'rich',   label: 'RICH',   tint: '#8b5e3c', tint2: '#3a2618', category: 'indulgent' },
  { key: 'tangy',  label: 'TANGY',  tint: '#c9532b', tint2: '#3a150a', category: 'healthy' },
  { key: 'light',  label: 'LIGHT',  tint: '#3f8f6a', tint2: '#123125', category: 'healthy' },
  { key: 'sweet',  label: 'SWEET',  tint: '#b8556f', tint2: '#33121f', category: 'dessert' },
];

export const FLAVOR_BY_KEY = Object.fromEntries(FLAVORS.map(f => [f.key, f]));

/* Each reel carries a `recipe` shaped for RecipeFull (name + ingredients +
   steps), so "Try This" is a real handoff, not a dead button. */
export const REELS = [
  {
    id: 'r01',
    dish: 'Creamy Garlic Pasta',
    username: '@mias.flavors',
    flavor: 'RICH',
    time: 20,
    cost: '11.50',
    difficulty: 'EASY',
    likes: 48210,
    tint: '#8b5e3c',
    tint2: '#3a2618',
    novaCaption: 'Five ingredients. One pan. Zero regrets.',
    novaQuip: 'Boom. You just out-cooked the restaurant.',
    quipCategory: 'comfort',
    hashtags: ['quickdinner', 'pastalover', 'onepan'],
    recipe: {
      id: 'r01', name: 'Creamy Garlic Pasta',
      time: 20, cost: '11.50', difficulty: 'Easy',
      ingredients: ['spaghetti (1 lb)', 'heavy cream (½ cup)', 'garlic (4 cloves)', 'parmesan (2 oz)', 'butter', 'parsley'],
      steps: [
        'Boil spaghetti in salted water until al dente. Reserve 1 cup pasta water.',
        'Melt butter over medium heat. Add minced garlic, cook 2 min until fragrant.',
        'Pour in heavy cream. Simmer 3 min until slightly thickened.',
        'Add drained pasta and parmesan. Toss, adding pasta water as needed for silk.',
        'Season with salt and pepper. Finish with fresh parsley.',
      ],
    },
  },
  {
    id: 'r02',
    dish: 'Birria Tacos',
    username: '@tacorunner',
    flavor: 'SMOKY',
    time: 180,
    cost: '22.00',
    difficulty: 'HARD',
    likes: 192400,
    tint: '#c8452c',
    tint2: '#3d1109',
    novaCaption: 'The tacos that broke the internet. Dip everything.',
    novaQuip: 'I saw that dip. Olympic-level.',
    quipCategory: 'showstopper',
    hashtags: ['birria', 'tacotuesday', 'consomme'],
    recipe: {
      id: 'r02', name: 'Birria Tacos',
      time: 180, cost: '22.00', difficulty: 'Hard',
      ingredients: ['chuck roast (3 lb)', 'guajillo chiles', 'chipotle in adobo', 'corn tortillas (12)', 'Oaxacan cheese (8 oz)', 'onion', 'cilantro', 'lime'],
      steps: [
        'Toast dried guajillo chiles 1 min per side. Soak in hot water 20 min.',
        'Blend soaked chiles with chipotle, garlic, cumin, and oregano into a smooth sauce.',
        'Sear chuck roast all over in oil. Add sauce and 3 cups beef broth.',
        'Braise covered at 300°F for 2.5 hours until the beef shreds easily.',
        'Dip tortillas in the fat layer, fill with beef + cheese, fry until crispy.',
        'Serve with raw onion, cilantro, lime, and consommé for dipping.',
      ],
    },
  },
  {
    id: 'r03',
    dish: 'Spicy Miso Ramen',
    username: '@ramen.nights',
    flavor: 'SAVORY',
    time: 40,
    cost: '15.00',
    difficulty: 'MEDIUM',
    likes: 76540,
    tint: '#a8611e',
    tint2: '#31210c',
    novaCaption: 'Deep, spicy, snowing-outside kind of bowl.',
    novaQuip: "That's giving Michelin. I'm not crying, you are.",
    quipCategory: 'spicy',
    hashtags: ['ramen', 'noodles', 'cozyfood'],
    recipe: {
      id: 'r03', name: 'Spicy Miso Ramen',
      time: 40, cost: '15.00', difficulty: 'Medium',
      ingredients: ['ramen noodles', 'white miso paste', 'chicken broth (32 oz)', 'soft-boiled eggs (2)', 'corn', 'scallions', 'chili oil', 'nori'],
      steps: [
        'Soft-boil eggs 6½ min, ice bath, then marinate peeled eggs in soy + mirin 30 min.',
        'Simmer chicken broth with ginger, garlic, and kombu 20 min.',
        'Whisk miso paste and chili oil into the hot broth. Do not boil after adding miso.',
        'Cook ramen noodles separately per package. Drain.',
        'Build bowls: noodles, broth over, then egg, corn, scallions, nori.',
      ],
    },
  },
  {
    id: 'r04',
    dish: 'Smash Burgers',
    username: '@grillmaster.nyc',
    flavor: 'SAVORY',
    time: 20,
    cost: '16.00',
    difficulty: 'EASY',
    likes: 158900,
    tint: '#9c6b2f',
    tint2: '#2e1e0d',
    novaCaption: 'Thin, lacy, crispy edges. The smash is everything.',
    novaQuip: "You just made a 5-star meal in 7 seconds. I'm vibrating.",
    quipCategory: 'indulgent',
    hashtags: ['smashburger', 'burgernight', 'castiron'],
    recipe: {
      id: 'r04', name: 'Smash Burgers',
      time: 20, cost: '16.00', difficulty: 'Easy',
      ingredients: ['80/20 ground beef (¾ lb)', 'American cheese (4 slices)', 'brioche buns (2)', 'iceberg lettuce', 'dill pickles', 'white onion', 'mayo', 'ketchup', 'mustard'],
      steps: [
        'Divide beef into 2 oz balls. Do not season until after smashing.',
        'Heat a cast-iron skillet to screaming hot. No oil needed.',
        'Place beef balls and smash flat immediately. Season the top with salt.',
        'Cook 90 sec until edges are brown and lacy. Flip, add cheese, cook 30 sec.',
        'Toast buns in butter. Build: sauce both sides, lettuce, pickles, onion, double patty.',
      ],
    },
  },
  {
    id: 'r05',
    dish: 'Shakshuka',
    username: '@mornings.made',
    flavor: 'TANGY',
    time: 25,
    cost: '9.50',
    difficulty: 'EASY',
    likes: 41320,
    tint: '#c9532b',
    tint2: '#3a150a',
    novaCaption: 'The best brunch you can make in one skillet.',
    novaQuip: "Boom. You're a kitchen witch now.",
    quipCategory: 'breakfast',
    hashtags: ['brunch', 'eggs', 'onepan'],
    recipe: {
      id: 'r05', name: 'Shakshuka',
      time: 25, cost: '9.50', difficulty: 'Easy',
      ingredients: ['crushed tomatoes (28 oz)', 'red bell pepper', 'eggs (4)', 'onion', 'garlic', 'cumin', 'paprika', 'feta (2 oz)', 'crusty bread'],
      steps: [
        'Sauté diced onion and red pepper 5 min. Add garlic, cumin, paprika — 1 min.',
        'Add crushed tomatoes and ¼ cup water. Simmer 10 min until thick.',
        'Make 4 wells in the sauce. Crack an egg into each.',
        'Cover and cook 5–7 min — whites set, yolks runny.',
        'Top with feta, parsley, and olive oil. Serve with bread.',
      ],
    },
  },
  {
    id: 'r06',
    dish: 'Korean Bibimbap',
    username: '@seoulbowl',
    flavor: 'SPICY',
    time: 35,
    cost: '13.00',
    difficulty: 'EASY',
    likes: 63870,
    tint: '#b8412a',
    tint2: '#341009',
    novaCaption: 'A rainbow in a bowl. Mix in gochujang and go.',
    novaQuip: 'That plating? Certified art. Proud of you.',
    quipCategory: 'healthy',
    hashtags: ['bibimbap', 'koreanfood', 'ricebowl'],
    recipe: {
      id: 'r06', name: 'Korean Bibimbap',
      time: 35, cost: '13.00', difficulty: 'Easy',
      ingredients: ['short-grain rice', 'spinach', 'bean sprouts', 'shiitake mushrooms', 'carrots', 'egg', 'gochujang', 'sesame oil', 'soy sauce'],
      steps: [
        'Cook rice and keep warm.',
        'Blanch spinach and bean sprouts 1 min each. Squeeze dry, season with sesame oil + salt.',
        'Sauté sliced shiitake and julienned carrots separately with a dash of soy.',
        'Fry an egg sunny-side up.',
        'Arrange rice in a bowl, vegetables in sections, egg on top.',
        'Add 1 tbsp gochujang. Mix everything at the table before eating.',
      ],
    },
  },
  {
    id: 'r07',
    dish: 'Margherita Pizza',
    username: '@bread.and.basil',
    flavor: 'RICH',
    time: 90,
    cost: '11.00',
    difficulty: 'MEDIUM',
    likes: 88110,
    tint: '#bf6a24',
    tint2: '#35200c',
    novaCaption: 'Sunday dough project that pays off huge.',
    novaQuip: 'I saw that stretch. Chef behavior.',
    quipCategory: 'showstopper',
    hashtags: ['pizzanight', 'homemade', 'doughboss'],
    recipe: {
      id: 'r07', name: 'Margherita Pizza',
      time: 90, cost: '11.00', difficulty: 'Medium',
      ingredients: ['00 flour (3 cups)', 'active dry yeast (1 packet)', 'San Marzano tomatoes (14 oz)', 'fresh mozzarella (8 oz)', 'fresh basil', 'olive oil', 'sea salt'],
      steps: [
        'Mix flour, yeast, salt, and water into a dough. Knead 8 min. Rest 1 hour.',
        'Crush San Marzano tomatoes by hand with salt and olive oil. No cooking.',
        'Preheat oven to 550°F with a stone or inverted sheet pan inside.',
        'Stretch dough thin on a floured surface. Slide onto parchment.',
        'Spread thin sauce, tear mozzarella over top.',
        'Bake 8–10 min until the crust blisters. Finish with fresh basil and olive oil.',
      ],
    },
  },
  {
    id: 'r08',
    dish: 'Lemon Herb Salmon',
    username: '@coastal.eats',
    flavor: 'LIGHT',
    time: 25,
    cost: '22.00',
    difficulty: 'EASY',
    likes: 52640,
    tint: '#3f8f6a',
    tint2: '#123125',
    novaCaption: 'Looks like you tried hard. Took 25 minutes.',
    novaQuip: "Boom. You did that. Fifteen minutes of glory.",
    quipCategory: 'healthy',
    hashtags: ['salmon', 'healthyeats', 'sheetpan'],
    recipe: {
      id: 'r08', name: 'Lemon Herb Salmon',
      time: 25, cost: '22.00', difficulty: 'Easy',
      ingredients: ['salmon fillets (2 × 6 oz)', 'lemon', 'garlic', 'fresh dill', 'parsley', 'Dijon mustard', 'olive oil', 'asparagus', 'capers'],
      steps: [
        'Pat salmon dry. Season with salt and pepper.',
        'Mix Dijon, minced garlic, lemon zest, and chopped dill + parsley into a paste.',
        'Spread the herb paste over each fillet.',
        'Roast at 400°F on a parchment-lined sheet pan 12–15 min.',
        'Toss asparagus in olive oil + salt, roast 10 min.',
        'Finish with capers and a squeeze of fresh lemon.',
      ],
    },
  },
];
