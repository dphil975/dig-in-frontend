import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import { BOROUGHS } from '../../../data/storeData';
import AreaPicker, { loadArea } from '../../../components/social/AreaPicker';
import { toggleSave, isSaved } from '../../../services/saveService';
import { sponsorshipsForPlacement } from '../../../data/sponsorships';
import ShoutoutCard from '../../../components/social/ShoutoutCard';
import { track } from '../../../lib/analytics';
import './SocialFeed.css';

// Every real placement this feed can carry a sponsored card for. Renders
// nothing (see ShoutoutCard) until src/data/sponsorships.js has a real entry
// — same "ships empty" posture as everywhere else this app runs ads.
const SPONSOR_PLACEMENT = 'social-feed';
// How often a promoted card can appear among organic posts — a 1-in-N
// restraint, so a sold slot never starts to crowd the column even once a
// sponsor exists.
const PROMOTED_EVERY = 6;

// A social-feed post, reshaped into the same object saveService/Archive/
// MyCookbook already expect from every OTHER save-able recipe in this app —
// so saving one here isn't a second, disconnected save list, it's the same
// one, keyed the same way (id || name).
function toRecipeShape(post) {
  return {
    id: post.id,
    name: post.title,
    image: post.image || null,
    ingredients: post.ingredients || [],
    cuisine: null,
  };
}

const CURATED_POSTS = [
  {
    id: 'p01',
    platform: 'Photo',
    emoji: 'CREAMY',
    image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=480&q=80',
    title: 'Creamy Garlic Pasta',
    description: 'Five ingredients, one pan, 20 minutes. This weeknight pasta has been in my rotation every single week.',
    time: 20,
    cost: '11.50',
    difficulty: 'Easy',
    location: 'East Village, NYC',
    username: '@mias.flavors',
    ingredients: ['spaghetti', 'heavy cream', 'garlic', 'parmesan', 'butter', 'parsley'],
    dietary: ['vegetarian'],
    tags: ['one-pan'],
    steps: [
      'Boil spaghetti in salted water until al dente. Reserve 1 cup pasta water.',
      'Melt butter over medium heat. Add minced garlic, cook 2 min until fragrant.',
      'Pour in heavy cream. Simmer 3 min until slightly thickened.',
      'Add drained pasta and parmesan. Toss, adding pasta water as needed for silk.',
      'Season with salt and pepper. Finish with fresh parsley.',
    ],
    shopping_categories: [
      { name: 'Pasta Aisle', items: ['spaghetti (1 lb)'] },
      { name: 'Dairy', items: ['heavy cream (½ cup)', 'parmesan (2 oz)', 'butter'] },
      { name: 'Produce', items: ['garlic (4 cloves)', 'parsley'] },
    ],
    savings_note: 'Save ~$18 vs. ordering pasta delivery in NYC',
  },
  {
    id: 'p02',
    platform: 'Video',
    emoji: 'BIRRIA',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=480&q=80',
    title: 'Birria Tacos',
    description: 'The tacos that broke TikTok. Slow-braised beef, dipped and fried in consommé. Worth every minute.',
    time: 180,
    cost: '22.00',
    difficulty: 'Hard',
    location: 'Boyle Heights, LA',
    username: '@tacorunner',
    ingredients: ['chuck roast', 'guajillo chiles', 'chipotle peppers', 'corn tortillas', 'Oaxacan cheese', 'onion', 'cilantro', 'lime'],
    dietary: [],
    steps: [
      'Toast dried guajillo chiles 1 min per side. Soak in hot water 20 min.',
      'Blend soaked chiles with chipotle, garlic, cumin, and oregano into a smooth sauce.',
      'Sear chuck roast all over in oil. Add sauce and 3 cups beef broth.',
      'Braise covered at 300°F for 2.5 hours until the beef shreds easily.',
      'Dip tortillas in the fat layer on top of consommé, fill with shredded beef + cheese, fry until crispy.',
      'Serve with raw onion, cilantro, lime, and a cup of consommé for dipping.',
    ],
    shopping_categories: [
      { name: 'Meat', items: ['chuck roast (3 lb)'] },
      { name: 'Dried Goods', items: ['guajillo chiles', 'corn tortillas (12)', 'chipotle in adobo'] },
      { name: 'Dairy', items: ['Oaxacan cheese (8 oz)'] },
      { name: 'Produce', items: ['onion', 'cilantro', 'lime', 'garlic'] },
    ],
    savings_note: 'Save ~$30 vs. $4/taco at a taqueria — this makes 12',
  },
  {
    id: 'p03',
    platform: 'Photo',
    emoji: 'SPICY',
    image: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?auto=format&fit=crop&w=480&q=80',
    title: 'Spicy Tuna Hand Roll',
    description: 'Restaurant quality at home. The key: sushi-grade tuna, Kewpie mayo, and a little sesame oil.',
    time: 30,
    cost: '24.00',
    difficulty: 'Medium',
    location: 'Astoria, Queens',
    username: '@sushi.at.home',
    ingredients: ['sushi-grade tuna', 'sushi rice', 'nori', 'Kewpie mayo', 'sriracha', 'sesame oil', 'cucumber', 'avocado'],
    dietary: ['gluten-free'],
    steps: [
      'Cook sushi rice. Season with rice vinegar, sugar, and salt while warm. Cool to room temp.',
      'Dice tuna into ½-inch cubes. Mix with Kewpie mayo, sriracha, and sesame oil.',
      'Cut nori sheets in half. Hold rough side up in your palm.',
      'Add a thin rice layer to the left half. Top with spicy tuna, cucumber, avocado.',
      'Roll into a cone. Eat immediately — nori loses its crunch fast.',
    ],
    shopping_categories: [
      { name: 'Fish Counter', items: ['sushi-grade tuna (6 oz)'] },
      { name: 'Asian Aisle', items: ['sushi rice', 'nori sheets', 'Kewpie mayo', 'rice vinegar', 'sriracha'] },
      { name: 'Produce', items: ['cucumber', 'avocado'] },
    ],
    savings_note: 'Save ~$20 vs. sushi restaurant delivery',
  },
  {
    id: 'p04',
    platform: 'Board',
    emoji: 'KOREAN',
    image: 'https://images.unsplash.com/photo-1553163147-622dc7fd7ebb?auto=format&fit=crop&w=480&q=80',
    title: 'Korean Bibimbap',
    description: 'A colorful bowl of marinated veggies, rice, and a perfectly runny egg. Mix in gochujang to taste.',
    time: 35,
    cost: '13.00',
    difficulty: 'Easy',
    location: 'Koreatown, Chicago',
    username: '@seoulbowl',
    ingredients: ['short-grain rice', 'spinach', 'bean sprouts', 'shiitake mushrooms', 'carrots', 'egg', 'gochujang', 'sesame oil', 'soy sauce'],
    dietary: ['vegetarian'],
    steps: [
      'Cook rice and keep warm.',
      'Blanch spinach and bean sprouts separately 1 min each. Squeeze dry, season with sesame oil and salt.',
      'Sauté sliced shiitake and julienned carrots separately with a dash of soy sauce.',
      'Fry an egg sunny-side up.',
      'Arrange rice in a bowl. Place vegetables in sections around the bowl. Top with egg.',
      'Add 1 tbsp gochujang. Mix everything together at the table before eating.',
    ],
    shopping_categories: [
      { name: 'Asian Aisle', items: ['short-grain rice', 'gochujang', 'sesame oil', 'soy sauce'] },
      { name: 'Produce', items: ['spinach', 'bean sprouts', 'shiitake', 'carrots'] },
      { name: 'Dairy', items: ['eggs (1)'] },
    ],
    savings_note: 'Save ~$14 vs. Korean restaurant nearby',
  },
  {
    id: 'p05',
    platform: 'Photo',
    emoji: 'SHAKSHUKA',
    image: 'https://images.unsplash.com/photo-1528207776537-91ae1eecd6ee?auto=format&fit=crop&w=480&q=80',
    title: 'Shakshuka',
    description: 'Eggs poached in a smoky tomato pepper sauce. The best brunch you can make in a single skillet.',
    time: 25,
    cost: '9.50',
    difficulty: 'Easy',
    location: 'Williamsburg, Brooklyn',
    username: '@mornings.made',
    ingredients: ['crushed tomatoes', 'red bell pepper', 'eggs', 'onion', 'garlic', 'cumin', 'paprika', 'feta', 'crusty bread'],
    dietary: ['vegetarian', 'gluten-free'],
    tags: ['one-pan'],
    steps: [
      'Sauté diced onion and red pepper in olive oil 5 min. Add garlic, cumin, paprika — cook 1 min.',
      'Add crushed tomatoes and ¼ cup water. Simmer 10 min until sauce thickens.',
      'Make 4 wells in the sauce. Crack an egg into each well.',
      'Cover and cook 5–7 min — whites set, yolks still runny.',
      'Top with crumbled feta, fresh parsley, and olive oil. Serve with bread.',
    ],
    shopping_categories: [
      { name: 'Canned', items: ['crushed tomatoes (28 oz)'] },
      { name: 'Produce', items: ['red bell pepper', 'onion', 'garlic', 'parsley'] },
      { name: 'Dairy', items: ['eggs (4)', 'feta cheese (2 oz)'] },
    ],
    savings_note: 'Save ~$22 vs. brunch delivery with tip',
  },
  {
    id: 'p06',
    platform: 'Video',
    emoji: 'CHICKEN',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=480&q=80',
    title: 'Chicken Tikka Masala',
    description: 'The takeout dish we now make at home every week. Charred chicken in a rich tomato cream sauce.',
    time: 50,
    cost: '16.00',
    difficulty: 'Medium',
    location: 'Jackson Heights, Queens',
    username: '@spice.street',
    ingredients: ['chicken thighs', 'yogurt', 'garam masala', 'ginger', 'garlic', 'canned tomatoes', 'heavy cream', 'onion', 'naan'],
    dietary: [],
    steps: [
      'Marinate chicken in yogurt, garam masala, ginger, garlic, and salt — at least 30 min.',
      'Broil chicken 8–10 min until charred at the edges. Set aside.',
      'Sauté onion 10 min until caramelized. Add ginger, garlic, tomatoes, cumin, coriander.',
      'Simmer sauce 15 min. Blend smooth, return to pan.',
      'Stir in cream and chicken. Simmer 10 min. Adjust salt.',
      'Serve with naan. Garnish with cilantro and a swirl of cream.',
    ],
    shopping_categories: [
      { name: 'Meat', items: ['boneless chicken thighs (1.5 lb)'] },
      { name: 'Canned', items: ['crushed tomatoes (28 oz)'] },
      { name: 'Dairy', items: ['Greek yogurt', 'heavy cream'] },
      { name: 'Bread', items: ['naan (2 pack)'] },
    ],
    savings_note: 'Save ~$25 vs. Indian delivery for two',
  },
  {
    id: 'p07',
    platform: 'Board',
    emoji: 'SMASHED',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=480&q=80',
    title: 'Smashed Avocado Toast',
    description: 'Café avocado toast at home. The trick is thick-cut sourdough and a good flaky salt finish.',
    time: 10,
    cost: '8.00',
    difficulty: 'Easy',
    location: 'Silver Lake, LA',
    username: '@plantbasedpete',
    ingredients: ['sourdough bread', 'ripe avocados', 'lemon', 'red pepper flakes', 'flaky salt', 'eggs', 'microgreens'],
    dietary: ['vegetarian'],
    steps: [
      'Toast sourdough slices until golden and crispy.',
      'Halve and pit avocados. Scoop into a bowl.',
      'Add lemon juice and a pinch of salt. Smash with a fork — keep it chunky.',
      'Spread generously on toast. Top with red pepper flakes and flaky salt.',
      'Add a soft-poached egg on top for protein. Finish with microgreens.',
    ],
    shopping_categories: [
      { name: 'Bread', items: ['sourdough loaf'] },
      { name: 'Produce', items: ['avocados (2)', 'lemon', 'microgreens'] },
      { name: 'Pantry', items: ['red pepper flakes', 'flaky salt (Maldon)'] },
    ],
    savings_note: 'Save ~$16 vs. $18 café avocado toast + tip',
  },
  {
    id: 'p08',
    platform: 'Video',
    emoji: 'SPICY',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=480&q=80',
    title: 'Spicy Miso Ramen',
    description: 'Deeply savory miso broth with a kick, made from scratch in 40 minutes. This one hits different on cold nights.',
    time: 40,
    cost: '15.00',
    difficulty: 'Medium',
    location: 'East Village, NYC',
    username: '@ramen.nights',
    ingredients: ['ramen noodles', 'white miso paste', 'chicken broth', 'soft-boiled eggs', 'chashu pork', 'corn', 'scallions', 'chili oil', 'nori'],
    dietary: [],
    steps: [
      'Soft-boil eggs 6½ min, then ice bath. Marinate peeled eggs in soy + mirin 30 min.',
      'Simmer chicken broth with ginger, garlic, and kombu for 20 min.',
      'Whisk miso paste and chili oil into hot broth. Do not boil after adding miso.',
      'Cook ramen noodles separately per package. Drain.',
      'Build bowls: noodles first, pour broth over. Top with halved egg, corn, scallions, nori.',
    ],
    shopping_categories: [
      { name: 'Asian Aisle', items: ['ramen noodles', 'white miso', 'chili oil', 'nori', 'kombu'] },
      { name: 'Broth', items: ['chicken broth (32 oz)'] },
      { name: 'Produce', items: ['ginger', 'garlic', 'scallions', 'corn'] },
      { name: 'Dairy', items: ['eggs (2)'] },
    ],
    savings_note: 'Save ~$20 vs. $18/bowl ramen restaurant',
  },
  {
    id: 'p09',
    platform: 'Photo',
    emoji: 'MUSHROOM',
    image: 'https://images.unsplash.com/photo-1476124369491-e7debb5eaf57?auto=format&fit=crop&w=480&q=80',
    title: 'Mushroom Risotto',
    description: 'Creamy, earthy, and elegant. Low and slow with constant stirring — worth every minute.',
    time: 40,
    cost: '14.00',
    difficulty: 'Medium',
    location: 'Logan Square, Chicago',
    username: '@northern.kitchen',
    ingredients: ['arborio rice', 'mixed mushrooms', 'shallots', 'dry white wine', 'parmesan', 'butter', 'vegetable broth', 'thyme', 'garlic'],
    dietary: ['vegetarian', 'gluten-free'],
    steps: [
      'Warm vegetable broth in a separate pot over low heat.',
      'Sauté mushrooms in butter until golden, 6–8 min. Season and set aside.',
      'Cook shallots and garlic 3 min. Add arborio rice, toast 2 min.',
      'Add white wine and stir until absorbed.',
      'Add warm broth one ladle at a time, stirring constantly — 18–20 min total.',
      'Fold in mushrooms, parmesan, and a knob of cold butter. Serve immediately.',
    ],
    shopping_categories: [
      { name: 'Grain', items: ['arborio rice (1½ cups)'] },
      { name: 'Produce', items: ['mixed mushrooms (10 oz)', 'shallots', 'garlic', 'thyme'] },
      { name: 'Dairy', items: ['parmesan (3 oz)', 'butter'] },
      { name: 'Liquid', items: ['dry white wine (½ cup)', 'vegetable broth (4 cups)'] },
    ],
    savings_note: 'Save ~$26 vs. restaurant risotto entrée',
  },
  {
    id: 'p10',
    platform: 'Board',
    emoji: 'MARGHERITA',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=480&q=80',
    title: 'Margherita Pizza',
    description: 'Homemade dough, San Marzano tomatoes, fresh mozzarella. A Sunday project that pays off big.',
    time: 90,
    cost: '11.00',
    difficulty: 'Medium',
    location: 'Park Slope, Brooklyn',
    username: '@bread.and.basil',
    ingredients: ['00 flour', 'active dry yeast', 'San Marzano tomatoes', 'fresh mozzarella', 'fresh basil', 'olive oil', 'sea salt'],
    dietary: ['vegetarian'],
    steps: [
      'Mix flour, yeast, salt, and water into a dough. Knead 8 min until smooth. Rest 1 hour.',
      'Crush San Marzano tomatoes by hand with salt and olive oil. No cooking needed.',
      'Preheat oven to 550°F with a pizza stone or inverted sheet pan inside.',
      'Stretch dough thin on a floured surface. Slide onto parchment.',
      'Spread thin tomato sauce. Tear mozzarella evenly over top.',
      'Bake 8–10 min until crust blisters and cheese bubbles. Finish with fresh basil and olive oil.',
    ],
    shopping_categories: [
      { name: 'Baking', items: ['00 flour (3 cups)', 'active dry yeast (1 packet)'] },
      { name: 'Canned', items: ['San Marzano tomatoes (14 oz)'] },
      { name: 'Dairy', items: ['fresh mozzarella (8 oz)'] },
      { name: 'Produce', items: ['fresh basil'] },
    ],
    savings_note: 'Save ~$20 vs. $32 wood-fired pizza',
  },
  {
    id: 'p11',
    platform: 'Photo',
    emoji: 'LAMB',
    image: 'https://images.unsplash.com/photo-1544025162-d76538775f2b?auto=format&fit=crop&w=480&q=80',
    title: 'Lamb Kofta + Tzatziki',
    description: 'Juicy spiced lamb skewers with cooling tzatziki and warm pita. A weeknight dinner that feels like a vacation.',
    time: 30,
    cost: '20.00',
    difficulty: 'Medium',
    location: 'Astoria, Queens',
    username: '@olive.oil.kitchen',
    ingredients: ['ground lamb', 'garlic', 'cumin', 'coriander', 'cinnamon', 'parsley', 'Greek yogurt', 'cucumber', 'dill', 'lemon', 'pita'],
    dietary: [],
    steps: [
      'Mix ground lamb with garlic, cumin, coriander, cinnamon, parsley, and salt. Chill 20 min.',
      'Shape into ovals around skewers. Grill or pan-fry 3–4 min per side.',
      'Tzatziki: grate cucumber and squeeze dry. Mix into yogurt with garlic, dill, lemon juice, salt.',
      'Warm pita. Serve kofta with tzatziki, sliced tomato, red onion, and fresh herbs.',
    ],
    shopping_categories: [
      { name: 'Meat', items: ['ground lamb (1 lb)'] },
      { name: 'Dairy', items: ['Greek yogurt (1 cup)'] },
      { name: 'Produce', items: ['cucumber', 'lemon', 'parsley', 'dill', 'garlic', 'tomato'] },
      { name: 'Bread', items: ['pita breads (4)'] },
    ],
    savings_note: 'Save ~$30 vs. Mediterranean restaurant for two',
  },
  {
    id: 'p12',
    platform: 'Video',
    emoji: 'PAD',
    image: 'https://images.unsplash.com/photo-1559314045-47f5e2c78f55?auto=format&fit=crop&w=480&q=80',
    title: 'Pad Thai',
    description: 'Better than takeout once you nail the sauce ratio. Key ingredients: fish sauce, tamarind, palm sugar.',
    time: 25,
    cost: '14.00',
    difficulty: 'Medium',
    location: 'East Austin, TX',
    username: '@bangkokbowl',
    ingredients: ['rice noodles', 'shrimp', 'eggs', 'fish sauce', 'tamarind paste', 'palm sugar', 'scallions', 'bean sprouts', 'peanuts', 'lime'],
    dietary: ['gluten-free'],
    steps: [
      'Soak rice noodles in warm water 20 min. Drain.',
      'Make sauce: mix fish sauce, tamarind paste, palm sugar, water. Taste — sweet, tangy, salty.',
      'Stir-fry shrimp in a screaming-hot wok. Remove when pink.',
      'Scramble eggs in the wok. Add noodles and sauce. Toss fast on high heat.',
      'Add shrimp back with scallions and bean sprouts. Toss 1 min.',
      'Plate with crushed peanuts, fresh lime, and extra bean sprouts.',
    ],
    shopping_categories: [
      { name: 'Asian Aisle', items: ['rice noodles', 'fish sauce', 'tamarind paste', 'palm sugar'] },
      { name: 'Protein', items: ['shrimp (½ lb)', 'eggs (2)'] },
      { name: 'Produce', items: ['scallions', 'bean sprouts', 'lime', 'garlic'] },
      { name: 'Pantry', items: ['roasted peanuts'] },
    ],
    savings_note: 'Save ~$18 vs. Thai delivery + fees',
  },
  {
    id: 'p13',
    platform: 'Video',
    emoji: 'SMASH',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=480&q=80',
    title: 'Smash Burgers',
    description: 'Thin, crispy-edged patties, American cheese, special sauce on a toasted brioche bun. The smash is everything.',
    time: 20,
    cost: '16.00',
    difficulty: 'Easy',
    location: 'Bushwick, Brooklyn',
    username: '@grillmaster.nyc',
    ingredients: ['80/20 ground beef', 'American cheese', 'brioche buns', 'iceberg lettuce', 'pickles', 'onion', 'mayo', 'ketchup', 'mustard'],
    dietary: [],
    tags: ['one-pan'],
    steps: [
      'Divide beef into 2 oz balls. Do not season until after smashing.',
      'Heat a cast-iron skillet to screaming hot. No oil needed.',
      'Place beef balls and smash flat immediately with a spatula. Season top with salt.',
      'Cook 90 seconds until edges are brown and lacy. Flip, add cheese, cook 30 seconds.',
      'Toast buns in butter. Build: sauce on both sides, lettuce, pickles, onion, double patty.',
    ],
    shopping_categories: [
      { name: 'Meat', items: ['80/20 ground beef (¾ lb)'] },
      { name: 'Dairy', items: ['American cheese slices (4)', 'butter'] },
      { name: 'Bread', items: ['brioche buns (2)'] },
      { name: 'Produce', items: ['iceberg lettuce', 'white onion', 'dill pickles'] },
    ],
    savings_note: 'Save ~$22 vs. smash burger restaurant',
  },
  {
    id: 'p14',
    platform: 'Photo',
    emoji: 'LEMON',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=480&q=80',
    title: 'Lemon Herb Salmon',
    description: 'Restaurant-quality salmon in 25 minutes. The herb-mustard crust makes it look like you tried really hard.',
    time: 25,
    cost: '22.00',
    difficulty: 'Easy',
    location: 'Wynwood, Miami',
    username: '@coastal.eats',
    ingredients: ['salmon fillets', 'lemon', 'garlic', 'fresh dill', 'parsley', 'Dijon mustard', 'olive oil', 'asparagus', 'capers'],
    dietary: ['gluten-free'],
    steps: [
      'Pat salmon dry. Season with salt and pepper.',
      'Mix Dijon mustard, minced garlic, lemon zest, and chopped dill + parsley into a paste.',
      'Spread herb paste over the top of each fillet.',
      'Roast at 400°F on a parchment-lined sheet pan 12–15 min.',
      'Meanwhile, toss asparagus in olive oil and salt. Roast on a second rack 10 min.',
      'Finish with capers and a squeeze of fresh lemon.',
    ],
    shopping_categories: [
      { name: 'Seafood', items: ['salmon fillets (2 × 6 oz)'] },
      { name: 'Produce', items: ['asparagus (1 bunch)', 'lemon', 'fresh dill', 'parsley', 'garlic'] },
      { name: 'Condiments', items: ['Dijon mustard', 'capers'] },
    ],
    savings_note: 'Save ~$28 vs. seafood restaurant entrée',
  },
  {
    id: 'p15',
    platform: 'Board',
    emoji: 'BLACK',
    image: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=480&q=80',
    title: 'Black Bean Enchiladas',
    description: 'A vegetarian weeknight winner. Smoky, cheesy, and topped with a quick homemade red sauce.',
    time: 40,
    cost: '12.00',
    difficulty: 'Easy',
    location: 'Mission District, SF',
    username: '@sabrosa.veg',
    ingredients: ['corn tortillas', 'black beans', 'Oaxacan cheese', 'red enchilada sauce', 'onion', 'garlic', 'cumin', 'sour cream', 'cilantro', 'lime'],
    dietary: ['vegetarian'],
    steps: [
      'Sauté diced onion and garlic until soft. Add black beans, cumin, and salt. Mash slightly.',
      'Warm tortillas in a dry skillet 30 seconds each — they roll without cracking when warm.',
      'Dip each tortilla in enchilada sauce, fill with beans and cheese, roll tight.',
      'Place seam-side down in a baking dish. Pour remaining sauce over top. Add more cheese.',
      'Bake at 375°F for 20 min until bubbly and golden.',
      'Top with sour cream, cilantro, and a squeeze of lime.',
    ],
    shopping_categories: [
      { name: 'Canned', items: ['black beans (2 cans)', 'red enchilada sauce (1 can)'] },
      { name: 'Dairy', items: ['Oaxacan cheese (8 oz)', 'sour cream'] },
      { name: 'Bread', items: ['corn tortillas (8)'] },
      { name: 'Produce', items: ['onion', 'garlic', 'cilantro', 'lime'] },
    ],
    savings_note: 'Save ~$20 vs. Mexican restaurant for two',
  },
  {
    id: 'p16',
    platform: 'Photo',
    emoji: 'FRENCH',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=480&q=80',
    title: 'French Onion Soup',
    description: 'Deeply caramelized onions, rich beef broth, and a Gruyère-crusted crouton. A slow-weekend classic.',
    time: 75,
    cost: '13.00',
    difficulty: 'Medium',
    location: 'Upper West Side, NYC',
    username: '@bistro.bits',
    ingredients: ['yellow onions', 'butter', 'dry sherry', 'beef broth', 'thyme', 'bay leaf', 'baguette', 'Gruyère', 'Worcestershire sauce'],
    dietary: [],
    steps: [
      'Slice 4 large onions thin. Cook in butter on medium-low 45–60 min, stirring every 10 min, until deep caramel.',
      'Add dry sherry, cook 2 min. Add thyme, bay leaf, Worcestershire.',
      'Pour in beef broth. Simmer 15 min. Season to taste.',
      'Slice baguette into rounds, toast until dry, rub with a garlic clove.',
      'Ladle soup into oven-safe bowls. Float croutons on top. Cover generously with Gruyère.',
      'Broil 3–5 min until cheese is bubbly, golden, and starting to blister.',
    ],
    shopping_categories: [
      { name: 'Produce', items: ['yellow onions (4 large)', 'garlic', 'fresh thyme'] },
      { name: 'Broth', items: ['beef broth (32 oz)'] },
      { name: 'Dairy', items: ['butter', 'Gruyère cheese (4 oz)'] },
      { name: 'Bread', items: ['baguette (1)'] },
    ],
    savings_note: 'Save ~$22 vs. French bistro for two',
  },
  {
    id: 'p17',
    platform: 'Essay',
    emoji: 'BRAISED',
    image: 'https://images.unsplash.com/photo-1544025162-d76538775f2b?auto=format&fit=crop&w=480&q=80',
    title: 'The Sunday Braise',
    description: 'A newsletter recipe: short ribs braised low and slow in red wine until they fall off the bone. Worth clearing your afternoon for.',
    time: 210,
    cost: '24.00',
    difficulty: 'Medium',
    location: 'Park Slope, Brooklyn',
    username: 'The Weeknight Table',
    ingredients: ['bone-in short ribs', 'red wine', 'carrots', 'celery', 'onion', 'tomato paste', 'beef broth', 'thyme', 'bay leaf'],
    dietary: [],
    steps: [
      'Sear short ribs on all sides in a heavy pot until deeply browned. Set aside.',
      'Sauté carrots, celery, and onion until softened. Stir in tomato paste, cook 1 min.',
      'Deglaze with red wine, scraping up the browned bits. Reduce by half.',
      'Return ribs to the pot, add broth, thyme, and bay leaf until just covered.',
      'Cover and braise at 300°F for 3 hours until the meat pulls apart easily.',
      'Skim the fat, reduce the sauce if needed, and serve over mashed potatoes or polenta.',
    ],
    shopping_categories: [
      { name: 'Meat', items: ['bone-in short ribs (3 lb)'] },
      { name: 'Produce', items: ['carrots', 'celery', 'onion', 'fresh thyme'] },
      { name: 'Pantry', items: ['tomato paste', 'bay leaf'] },
      { name: 'Liquid', items: ['dry red wine (1 bottle)', 'beef broth (2 cups)'] },
    ],
    savings_note: 'Save ~$35 vs. braised short rib entrée at a steakhouse',
  },
  {
    id: 'p18',
    platform: 'Video',
    emoji: 'KATSU',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=480&q=80',
    title: 'Katsu Curry, Step by Step',
    description: 'A full video breakdown: crispy panko-crusted pork cutlet over a rich Japanese curry sauce built completely from scratch.',
    time: 55,
    cost: '17.00',
    difficulty: 'Medium',
    location: 'Sunset Park, Brooklyn',
    username: '@katsu.and.curry',
    ingredients: ['pork cutlets', 'panko breadcrumbs', 'flour', 'eggs', 'onion', 'carrot', 'potato', 'curry roux', 'short-grain rice'],
    dietary: [],
    steps: [
      'Pound pork cutlets thin, season, then dredge in flour, egg, and panko.',
      'Fry cutlets in oil until deep golden on both sides. Rest on a rack, slice.',
      'Sauté onion, carrot, and potato until soft. Add water and simmer 15 min.',
      'Stir in curry roux blocks until the sauce thickens and turns glossy.',
      'Serve rice topped with sliced katsu, curry sauce ladled generously over.',
    ],
    shopping_categories: [
      { name: 'Meat', items: ['pork cutlets (4)'] },
      { name: 'Pantry', items: ['panko breadcrumbs', 'flour', 'Japanese curry roux (1 box)'] },
      { name: 'Produce', items: ['onion', 'carrot', 'potato'] },
      { name: 'Grain', items: ['short-grain rice'] },
    ],
    savings_note: 'Save ~$19 vs. katsu curry at a Japanese restaurant',
  },
];

// Maps the backend /api/feed shape → CURATED_POSTS card shape
function normalizeApiPost(p) {
  return {
    id:       p.id,
    platform: 'Community',
    emoji:    'BREAD',
    image:    p.photo  || '',
    title:    p.dish   || p.title || '',
    description: p.caption || p.description || '',
    time:     p.time   ?? null,
    cost:     p.cost   ?? null,
    difficulty: p.difficulty ?? null,
    location: p.neighborhood || p.location || '',
    username: p.username ? `@${p.username}` : '',
    ingredients: p.tags || [],
    dietary:  [],
    steps:    Array.isArray(p.recipe) ? p.recipe : [],
    shopping_categories: [],
    savings_note: '',
  };
}

// The most recent REAL boomerang the shopper has captured while cooking —
// scanned from RecipeStepViewer's own per-recipe storage
// (dig_in_step_boomerangs_<recipeId>). These are genuine looping GIFs
// (Instagram-Boomerang style, forward↔reverse), not a simulated animation, so
// when one exists it's shown as-is and just plays natively as an <img>.
function getLatestBoomerang() {
  let best = null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('dig_in_step_boomerangs_')) continue;
      const recipeId = key.slice('dig_in_step_boomerangs_'.length);
      let entries;
      try { entries = JSON.parse(localStorage.getItem(key) || '{}'); } catch { continue; }
      for (const [stepIdx, b] of Object.entries(entries)) {
        if (!b?.dataUrl) continue;
        if (!best || new Date(b.createdAt) > new Date(best.createdAt)) {
          best = { dataUrl: b.dataUrl, createdAt: b.createdAt, recipeId, stepIdx: Number(stepIdx) };
        }
      }
    }
  } catch { /* localStorage unavailable */ }
  return best;
}

// Deterministic "Recipe of the Day" — the same pick for everyone all day,
// changes at midnight, no randomness/flicker on re-render.
function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}
function pickOfTheDay(posts) {
  if (!posts.length) return null;
  return posts[dayOfYear() % posts.length];
}

/* ── Hero — "Your Cooking Moments" (when a real boomerang exists) or
   "Recipe of the Day" (the honest fallback — no fake looping animation over
   a static stock photo when there's nothing real to show). */
function HeroSection({ boomerang, dailyPost, onOpenDaily }) {
  if (boomerang) {
    return (
      <section className="hero-section hero-boomerang">
        <div className="hero-text">
          <p className="hero-eyebrow">YOUR COOKING MOMENTS</p>
          <h2 className="hero-title">The moment you nailed <span>step {boomerang.stepIdx + 1}</span>.</h2>
          <p className="hero-sub">Captured while you were cooking — plays right in the feed, boomerang-style.</p>
        </div>
        <div className="hero-float-card">
          <img className="hero-float-img" src={boomerang.dataUrl} alt="Your captured cooking boomerang" />
          <p className="hero-float-caption">Your boomerang</p>
        </div>
      </section>
    );
  }

  if (!dailyPost) return null;
  return (
    <section className="hero-section" onClick={() => onOpenDaily(dailyPost)} role="button" tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpenDaily(dailyPost)}>
      <div className="hero-text">
        <p className="hero-eyebrow">RECIPE OF THE DAY</p>
        <h2 className="hero-title">{dailyPost.title}</h2>
        <p className="hero-sub">{dailyPost.description}</p>
      </div>
      <div className="hero-float-card">
        {dailyPost.image
          ? <img className="hero-float-img" src={dailyPost.image} alt={dailyPost.title} />
          : <div className="hero-float-img hero-float-fallback"><span>{dailyPost.emoji}</span></div>}
        <p className="hero-float-caption">{dailyPost.platform} · {dailyPost.username}</p>
      </div>
    </section>
  );
}

/* ── Feed post card — a real, scrollable column instead of an 8-wide
   horizontal strip. The anatomy borrows a proven feed's information order
   (community/author line → title → media → real meta → an engagement row)
   without borrowing anything that isn't real here: no vote arrows or
   comment counts, because there's no backend aggregating either for these
   posts — a fabricated number is worse than no number. What IS real: your
   own save state (the same dig_in_saved store every recipe in this app
   uses) and a genuine native share. Same notched pixel-frame, bark border
   and offset shadow as everywhere else in this Y2K-facelifted hub. */
function FeedPostCard({ post, onOpen, saved, onToggleSave, onShare }) {
  const [imgError, setImgError] = useState(false);
  const showImg = post.image && !imgError;

  return (
    <article className="sfp-card">
      <header className="sfp-head">
        <span className="sfp-platform">{post.platform}</span>
        {post.username && <span className="sfp-user">{post.username}</span>}
        {post.location && <span className="sfp-loc">📍 {post.location}</span>}
      </header>

      <button type="button" className="sfp-media" onClick={() => onOpen(post)} aria-label={`Open ${post.title}`}>
        {showImg ? (
          <img src={post.image} alt={post.title} loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="sfp-media-fallback"><span>{post.emoji}</span></div>
        )}
      </button>

      <div className="sfp-body">
        <h3 className="sfp-title" onClick={() => onOpen(post)} role="button" tabIndex={0}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpen(post)}>
          {post.title}
        </h3>
        {post.description && <p className="sfp-desc">{post.description}</p>}

        {(post.time || post.cost || post.difficulty) && (
          <div className="feed-meta sfp-meta">
            {post.time       && <span>{post.time} min</span>}
            {post.cost       && <span>${post.cost}</span>}
            {post.difficulty && <span>{post.difficulty}</span>}
          </div>
        )}
      </div>

      <footer className="sfp-actions">
        <button
          type="button"
          className={`sfp-action sfp-save${saved ? ' on' : ''}`}
          aria-pressed={saved}
          onClick={() => onToggleSave(post)}
        >
          {saved ? '🔖 Saved' : '🔖 Save'}
        </button>
        <button type="button" className="sfp-action" onClick={() => onShare(post)}>
          ↗ Share
        </button>
        <button type="button" className="sfp-action sfp-action-primary" onClick={() => onOpen(post)}>
          Full recipe →
        </button>
      </footer>
    </article>
  );
}

/* ── Promoted card — a real sponsor slot, shaped like every other card in
   this column (same header position, same border/shadow) so it sits in the
   feed's rhythm instead of interrupting it — the one proven thing about how
   a native ad should behave. The single honest tell, in the exact spot the
   platform/author line normally sits, is the "PROMOTED" label: never hidden,
   never disguised as an organic post. Renders nothing when there's no real
   sponsor for this placement (ShoutoutCard's own "ships empty" rule). */
function PromotedFeedCard({ hasSponsor }) {
  if (!hasSponsor) return null;
  return (
    <article className="sfp-card sfp-promoted">
      <header className="sfp-head">
        <span className="sfp-promoted-label">PROMOTED</span>
      </header>
      <ShoutoutCard placement={SPONSOR_PLACEMENT} />
    </article>
  );
}

/* ── Full recipe detail (opens from the + button) ────────────── */
function RecipeModal({ post, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="gk-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="gk-modal">
        <button className="gk-modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="gk-modal-hero">
          {post.image
            ? <img src={post.image} alt={post.title} />
            : <span className="gk-modal-emoji">{post.emoji}</span>}
          <div className="gk-modal-hero-text">
            <p className="gk-eyebrow">{post.platform}{post.username ? ` · ${post.username}` : ''}</p>
            <h3>{post.title}</h3>
          </div>
        </div>

        <div className="gk-modal-body">
          {post.location && <div className="gk-modal-loc">{post.location}</div>}
          <p className="gk-modal-desc">{post.description}</p>

          <div className="feed-meta">
            {post.time       && <span>{post.time} min</span>}
            {post.cost       && <span>${post.cost}</span>}
            {post.difficulty && <span>{post.difficulty}</span>}
          </div>

          {post.dietary?.length > 0 && (
            <div className="feed-tags">
              {post.dietary.map((d, i) => <span className="tag dietary" key={i}>{d}</span>)}
            </div>
          )}

          {post.ingredients?.length > 0 && <>
            <div className="recipe-section-label">Ingredients</div>
            <div className="recipe-ingredients-list">
              {post.ingredients.map((ing, i) => <span key={i}>• {ing}<br /></span>)}
            </div>
          </>}

          {post.steps?.length > 0 && <>
            <div className="recipe-section-label">Steps</div>
            <ol className="recipe-steps">
              {post.steps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </>}

          {post.shopping_categories?.length > 0 && <>
            <h4>Shopping List</h4>
            <div className="shopping-list">
              {post.shopping_categories.map((cat, i) => (
                <div className="shopping-category" key={i}>
                  <strong>{cat.name}</strong>
                  {cat.items.join(', ')}
                </div>
              ))}
            </div>
          </>}

          {post.cost && (
            <div className="cost-breakdown">
              <span>Estimated Cost</span>
              <span><strong>${post.cost}</strong></span>
            </div>
          )}
          {post.savings_note && <div className="savings-note">{post.savings_note}</div>}
        </div>
      </div>
    </div>
  );
}

export default function SocialFeed({ embedded = false } = {}) {
  // Starts EMPTY, not seeded with CURATED_POSTS. A hand-written set of
  // invented dishes and usernames is still a fabricated community — and the
  // moment a real user recognises one, every other number on the page becomes
  // suspect. Real posts arrive from /api/feed below; until they do, the honest
  // answer is an empty feed and an invitation.
  const [posts, setPosts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(null);
  const [searchParams] = useSearchParams();
  const tag = searchParams.get('tag');
  const [areaId, setAreaId] = useState(loadArea);
  const [boomerang] = useState(getLatestBoomerang); // read once — a new one only appears after cooking again
  // Which saved-recipe ids/names this post list already carries — read once
  // per render from the same store toggling writes to, so a save/unsave here
  // shows up instantly without a second parallel "liked" list.
  const [saveTick, setSaveTick] = useState(0);
  const hasSponsor = sponsorshipsForPlacement(SPONSOR_PLACEMENT).length > 0;

  useEffect(() => {
    fetch('/api/feed', { signal: AbortSignal.timeout(4000) })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPosts(data.map(normalizeApiPost));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Deep-linking with ?tag=one-pan (from the recipe equipment gate) surfaces
  // matching posts first; falls back to the default set if nothing's tagged
  // (e.g. the live /api/feed data doesn't carry tags).
  const tagMatches = tag ? posts.filter(p => (p.tags || []).includes(tag)) : [];
  const base = tagMatches.length ? tagMatches : posts;

  // Regional trending: posts whose neighborhood/city string names the picked
  // area surface first. This curated set skews NYC-metro, so most non-NY-metro
  // areas honestly find zero matches — the header copy reflects that rather
  // than pretending everything is hyper-local. No 8-card cap anymore — this
  // is a feed you scroll, not a strip you page through.
  const areaMeta = areaId ? BOROUGHS.find(b => b.id === areaId) : null;
  const { cards, regionalCount } = useMemo(() => {
    if (!areaMeta) return { cards: base, regionalCount: 0 };
    const label = areaMeta.label.toLowerCase();
    const matches = base.filter(p => (p.location || '').toLowerCase().includes(label));
    const rest = base.filter(p => !matches.includes(p));
    return { cards: [...matches, ...rest], regionalCount: matches.length };
  }, [base, areaMeta]);

  const dailyPost = useMemo(() => pickOfTheDay(posts), [posts]);

  function handleToggleSave(post) {
    toggleSave(toRecipeShape(post));
    track('social_post_saved', { post_id: post.id, now_saved: isSaved(toRecipeShape(post)) });
    setSaveTick(t => t + 1);
  }

  function handleShare(post) {
    const data = { title: post.title, text: `${post.title} — spotted on Dig In` };
    if (navigator.share) navigator.share(data).catch(() => {});
    else navigator.clipboard?.writeText(`${data.text}`).catch(() => {});
    track('social_post_shared', { post_id: post.id });
  }

  return (
    <div className="social-feed-page">
      {!embedded && <Nav />}
      <div className="gk-wrap">
        <HeroSection boomerang={boomerang} dailyPost={dailyPost} onOpenDaily={setActive} />

        <div className="gk-head">
          <div className="gk-head-row">
            <p className="gk-head-eyebrow">SOCIAL FOOD FEED</p>
            <AreaPicker value={areaId} onChange={setAreaId} label="Region" />
          </div>
          <h1 className="gk-head-title">Get to know what's cooking.</h1>
          <p className="gk-head-sub">
            Trending dishes from Instagram, TikTok, Pinterest, Substack &amp; YouTube. Save what's worth cooking, share what's not to miss.
            {areaMeta && (
              regionalCount > 0
                ? <> <b>{regionalCount}</b> trending near {areaMeta.label}, shown first.</>
                : <> Nothing tagged near {areaMeta.label} yet — showing what's trending everywhere.</>
            )}
          </p>
        </div>

        {loaded && cards.length === 0 && (
          <div className="sfp-empty">
            Nothing in the feed yet — real posts land here the moment there are any to show.
          </div>
        )}

        <div className="feed-column" data-save-tick={saveTick}>
          {cards.map((post, i) => (
            <div key={post.id} className="feed-column-item">
              <FeedPostCard
                post={post}
                onOpen={setActive}
                saved={isSaved(toRecipeShape(post))}
                onToggleSave={handleToggleSave}
                onShare={handleShare}
              />
              {hasSponsor && (i + 1) % PROMOTED_EVERY === 0 && <PromotedFeedCard hasSponsor={hasSponsor} />}
            </div>
          ))}
        </div>
      </div>

      {active && <RecipeModal post={active} onClose={() => setActive(null)} />}
    </div>
  );
}
