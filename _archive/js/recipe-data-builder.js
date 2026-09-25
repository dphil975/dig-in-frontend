/**
 * Authentic Recipe Data Builder
 * Generates recipe JSON files with real dish names and proper formatting
 *
 * Authentic recipes researched from:
 * - Food blogs, cookbooks, and culinary authorities
 * - Regional cuisine experts and cultural sources
 * - YouTube cooking channels and food documentaries
 * - Pinterest collections from local food enthusiasts
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// AUTHENTIC RECIPE DATABASE
// ============================================================

const AUTHENTIC_RECIPES = {
  'Algeria': {
    country: 'Algeria',
    region: 'Africa',
    breakfast: [
      {
        id: 'alg-breakfast-makroudh',
        name: 'Makroudh (Semolina Cookies with Date Filling)',
        difficulty: 'Medium',
        servings: 24,
        prepTime: 30,
        cookTime: 20,
        ingredients: [
          '2 cups semolina flour',
          '1 cup all-purpose flour',
          '1 cup butter (softened)',
          '1/2 cup vegetable oil',
          '1/4 cup sugar',
          '2 tsp vanilla extract',
          '1 tsp baking powder',
          '1/2 tsp salt',
          '1 cup dates (pitted and chopped)',
          '2 tbsp butter',
          '1 tsp cinnamon',
          'Whole cloves for decoration',
          'Honey for syrup'
        ],
        instructions: [
          'Mix semolina, flour, butter, oil, sugar, vanilla, baking powder, and salt until crumbly',
          'Knead mixture until it comes together into a dough',
          'Cook dates with butter and cinnamon over low heat for 5 minutes',
          'Roll out dough between two sheets of plastic wrap to 1/4 inch thickness',
          'Spread date filling over dough',
          'Roll up tightly and cut into diamond shapes',
          'Place clove in center of each cookie',
          'Bake at 350°F for 15-20 minutes until golden',
          'Drizzle with warm honey immediately after baking',
          'Cool on wire rack'
        ],
        notes: 'Traditional Algerian cookie served during celebrations and Ramadan'
      },
      {
        id: 'alg-breakfast-chorba-frik',
        name: 'Chorba Frik (Green Wheat Soup)',
        difficulty: 'Medium',
        servings: 6,
        prepTime: 15,
        cookTime: 45,
        ingredients: [
          '2 cups fresh frik (green wheat grains)',
          '300g lamb or chicken (cubed)',
          '1 large onion (chopped)',
          '3 tomatoes (diced)',
          '2 tbsp tomato paste',
          '4 cloves garlic (minced)',
          '2 tsp harissa paste',
          '6 cups chicken or lamb broth',
          '1/4 cup olive oil',
          '1 tsp caraway seeds',
          '1 tsp coriander',
          'Salt and pepper to taste',
          'Fresh cilantro for garnish'
        ],
        instructions: [
          'Heat olive oil in large pot over medium-high heat',
          'Brown meat on all sides, about 8 minutes',
          'Add onion and cook until softened, 5 minutes',
          'Stir in garlic, tomato paste, and harissa',
          'Add diced tomatoes and cook for 2 minutes',
          'Pour in broth and bring to boil',
          'Add frik, caraway seeds, and coriander',
          'Reduce heat and simmer for 35-40 minutes until frik is tender',
          'Season with salt and pepper',
          'Garnish with fresh cilantro before serving',
          'Serve hot with crusty bread'
        ],
        notes: 'Popular breakfast soup during spring, made with young wheat grains'
      }
    ],
    lunch: [
      {
        id: 'alg-lunch-couscous-lamb-tagine',
        name: 'Couscous with Lamb Tagine',
        difficulty: 'Hard',
        servings: 6,
        prepTime: 30,
        cookTime: 90,
        ingredients: [
          '600g lamb (cut into chunks)',
          '3 cups couscous',
          '2 large onions (sliced)',
          '4 carrots (cut into chunks)',
          '3 turnips (cut into chunks)',
          '2 zucchini (cut into chunks)',
          '1 cup chickpeas (cooked or canned)',
          '2 tomatoes (quartered)',
          '3 tbsp tomato paste',
          '1 tsp ground ginger',
          '1 tsp turmeric',
          '1/2 tsp saffron threads',
          '2 tsp cinnamon',
          '1/4 cup olive oil',
          '6 cups lamb or vegetable broth',
          '1/2 cup raisins',
          'Salt and pepper to taste',
          '4 tbsp butter',
          'Fresh cilantro and parsley'
        ],
        instructions: [
          'Heat olive oil in tagine or large pot over medium-high heat',
          'Brown lamb on all sides, about 10 minutes',
          'Add onions and cook until softened',
          'Stir in tomato paste, ginger, turmeric, saffron, and cinnamon',
          'Add broth and bring to boil',
          'Add carrots and turnips, reduce heat, simmer 30 minutes',
          'Add zucchini, tomatoes, chickpeas, and raisins',
          'Simmer another 20-25 minutes until vegetables are tender',
          'In separate pot, prepare couscous per package directions using broth',
          'Fluff couscous with butter and fork',
          'Mound couscous on serving platter',
          'Arrange vegetables and meat around couscous',
          'Pour some broth over top',
          'Garnish with cilantro and parsley',
          'Serve remaining broth on the side'
        ],
        notes: 'Algeria\'s national dish, served at celebrations and Friday family meals'
      },
      {
        id: 'alg-lunch-tlitli',
        name: 'Tlitli (Hand-Rolled Pasta with Meat)',
        difficulty: 'Hard',
        servings: 6,
        prepTime: 60,
        cookTime: 45,
        ingredients: [
          '2 cups all-purpose flour',
          '1/2 cup water',
          '1 tsp salt',
          '400g lamb or beef (ground)',
          '1 large onion (finely chopped)',
          '3 cloves garlic (minced)',
          '1/4 cup olive oil',
          '1 tsp paprika',
          '1 tsp caraway seeds',
          '2 tbsp tomato paste',
          '1 can (400g) diced tomatoes',
          '3 cups beef broth',
          '1/2 tsp harissa paste',
          '2 bay leaves',
          'Salt and pepper to taste',
          'Fresh cilantro for garnish'
        ],
        instructions: [
          'Make dough with flour, water, and salt; knead until smooth',
          'Let dough rest 30 minutes covered',
          'Divide dough into small pieces and roll each into thin strands',
          'Cut strands into small pieces by hand or with knife',
          'Brown ground meat in large pot with onion and garlic',
          'Add paprika, caraway seeds, and tomato paste',
          'Cook for 2-3 minutes until fragrant',
          'Add diced tomatoes and simmer 5 minutes',
          'Pour in broth, harissa, and bay leaves',
          'Bring to boil and carefully add tlitli pieces',
          'Stir frequently to prevent sticking',
          'Simmer 30-35 minutes until pasta is tender',
          'Season with salt and pepper',
          'Garnish with fresh cilantro',
          'Serve hot in bowls with broth'
        ],
        notes: 'Traditional hand-rolled pasta dish from central Algeria'
      }
    ],
    dinner: [
      {
        id: 'alg-dinner-tanjia',
        name: 'Tanjia (Slow-Cooked Meat Stew)',
        difficulty: 'Medium',
        servings: 4,
        prepTime: 20,
        cookTime: 120,
        ingredients: [
          '600g lamb or beef (cubed)',
          '3 tbsp olive oil',
          '2 onions (sliced)',
          '6 cloves garlic',
          '2 tbsp preserved lemon (chopped)',
          '1 cup green olives (pitted)',
          '2 bay leaves',
          '1 tsp coriander seeds',
          '1 tsp caraway seeds',
          '1/2 tsp saffron threads',
          '1 cup beef broth',
          '1/4 cup dry red wine (optional)',
          'Salt and pepper to taste',
          'Fresh parsley for garnish'
        ],
        instructions: [
          'Heat olive oil in large pot or clay vessel',
          'Add onions and cook until caramelized, about 15 minutes',
          'Add meat and brown on all sides',
          'Add garlic cloves and cook for 1 minute',
          'Stir in preserved lemon, olives, bay leaves, and spices',
          'Pour in broth and wine if using',
          'Bring to boil, then reduce heat to low',
          'Cover and simmer for 90-120 minutes until meat is very tender',
          'Stir occasionally, adding more broth if needed',
          'The stew should be rich and slightly reduced',
          'Taste and adjust seasoning',
          'Garnish with fresh parsley',
          'Serve with crusty bread'
        ],
        notes: 'Traditionally cooked slowly in a clay pot, popular in northern Algeria'
      },
      {
        id: 'alg-dinner-chicken-rfissa',
        name: 'Rfissa (Chicken with Lentils and Coriander)',
        difficulty: 'Medium',
        servings: 6,
        prepTime: 20,
        cookTime: 75,
        ingredients: [
          '1 whole chicken (1.5kg, cut into pieces)',
          '1 cup red lentils',
          '1 large onion (chopped)',
          '5 cloves garlic (minced)',
          '1/4 cup fresh cilantro (chopped)',
          '1/4 cup fresh parsley (chopped)',
          '2 tbsp olive oil',
          '1 tsp turmeric',
          '1 tsp ground ginger',
          '1/2 tsp paprika',
          '6 cups chicken broth',
          'Salt and pepper to taste',
          '2 tbsp butter',
          'Juice of 1 lemon'
        ],
        instructions: [
          'Heat olive oil in large pot and brown chicken pieces',
          'Remove chicken and set aside',
          'In same pot, sauté onion and garlic until soft',
          'Add turmeric, ginger, and paprika; cook 1 minute',
          'Return chicken to pot',
          'Pour in broth and bring to boil',
          'Reduce heat, cover, and simmer 30 minutes',
          'Add lentils and continue simmering 25-30 minutes',
          'Lentils should be soft and chicken very tender',
          'Stir in cilantro, parsley, butter, and lemon juice',
          'Season with salt and pepper',
          'Simmer 5 more minutes',
          'Serve in deep bowls with generous amount of broth'
        ],
        notes: 'Comfort food made during celebrations and special occasions'
      }
    ],
    snacks: [
      {
        id: 'alg-snack-sellou',
        name: 'Sellou (Toasted Flour and Nut Paste)',
        difficulty: 'Easy',
        servings: 12,
        prepTime: 10,
        cookTime: 15,
        ingredients: [
          '2 cups all-purpose flour',
          '1 cup unsalted peanuts',
          '1 cup blanched almonds',
          '1/2 cup sesame seeds',
          '1/2 cup powdered sugar',
          '1/2 cup vegetable oil',
          '1 tsp vanilla extract',
          '1/4 tsp salt',
          '2 tbsp anise seeds (optional)',
          'Ground cinnamon for serving'
        ],
        instructions: [
          'Toast peanuts in dry skillet over medium heat for 8 minutes',
          'Remove and lightly toast almonds for 5 minutes',
          'Toast sesame seeds for 2 minutes until fragrant',
          'Coarsely chop roasted nuts',
          'Toast flour in skillet over low heat for 5 minutes, stirring constantly',
          'Combine toasted flour, nuts, sesame seeds, and sugar in bowl',
          'In small saucepan, gently warm oil with vanilla',
          'Pour oil over flour mixture while stirring',
          'Add anise seeds if using',
          'Mix until it resembles coarse wet sand',
          'Press mixture into shaped mold or onto serving platter',
          'Let cool before cutting into pieces',
          'Serve dusted with cinnamon'
        ],
        notes: 'Traditional energy paste eaten during Ramadan and celebrations'
      },
      {
        id: 'alg-snack-karantika',
        name: 'Karantika (Fried Pastry Rolls)',
        difficulty: 'Hard',
        servings: 12,
        prepTime: 40,
        cookTime: 30,
        ingredients: [
          '1kg phyllo dough sheets',
          '300g ground meat or potato filling',
          '1 onion (finely chopped)',
          '2 tbsp minced parsley',
          '2 eggs (for filling)',
          'Salt and pepper to taste',
          '2 cups vegetable oil (for frying)',
          'Honey for drizzling',
          'Powdered sugar for dusting'
        ],
        instructions: [
          'Prepare filling: sauté onion, add meat or mashed potato, cook 10 minutes',
          'Let filling cool, then mix in parsley, eggs, salt, and pepper',
          'Cut phyllo into strips about 3 inches wide',
          'Place spoonful of filling at bottom corner of each strip',
          'Fold into tight triangular rolls',
          'Heat oil to 350°F in deep pan',
          'Fry rolls a few at a time until golden brown, about 3 minutes',
          'Drain on paper towels',
          'Drizzle with honey while still warm',
          'Dust with powdered sugar',
          'Serve warm or at room temperature'
        ],
        notes: 'Popular pastry served at weddings and special celebrations'
      }
    ],
    desserts: [
      {
        id: 'alg-dessert-baklava',
        name: 'Baklava (Honey and Nut Pastry)',
        difficulty: 'Hard',
        servings: 20,
        prepTime: 45,
        cookTime: 40,
        ingredients: [
          '1kg phyllo dough sheets',
          '2 cups unsalted pistachios (chopped)',
          '1 cup walnuts (chopped)',
          '1/4 cup sugar',
          '1 tsp ground cinnamon',
          '1/2 tsp cardamom powder',
          '250g butter (melted)',
          '2 cups honey',
          '1 cup water',
          '1 tbsp lemon juice',
          '3-4 cloves',
          '1 cinnamon stick'
        ],
        instructions: [
          'Mix pistachios, walnuts, sugar, cinnamon, and cardamom',
          'Layer phyllo sheets in buttered 9x13 pan, brushing each with butter',
          'Spread thin layer of nut mixture over phyllo',
          'Repeat phyllo layers and nut mixture, ending with 6 phyllo sheets on top',
          'Brush top with remaining butter',
          'Cut into diamond or triangle shapes with sharp knife',
          'Place whole clove in center of each piece',
          'Bake at 350°F for 35-40 minutes until golden',
          'While baking, combine honey, water, lemon juice, cinnamon stick, and cloves in pot',
          'Heat until just beginning to boil, then remove from heat',
          'When baklava comes out of oven, immediately pour honey syrup over it',
          'Let cool completely before serving',
          'Syrup will soak in as it cools'
        ],
        notes: 'Luxurious pastry served during special occasions and holidays'
      },
      {
        id: 'alg-dessert-gazelle-horns',
        name: 'Gazelle Horns (Almond Paste Pastries)',
        difficulty: 'Hard',
        servings: 18,
        prepTime: 60,
        cookTime: 25,
        ingredients: [
          '500g phyllo dough sheets',
          '400g ground almonds',
          '1/2 cup powdered sugar',
          '1/4 cup butter',
          '1 tbsp orange blossom water',
          '1 tsp vanilla extract',
          '1/4 tsp salt',
          '200g butter (melted, for brushing)',
          'Oil for frying',
          'Powdered sugar for dusting',
          'Honey (optional, for drizzling)'
        ],
        instructions: [
          'Mix ground almonds, powdered sugar, butter, orange blossom water, vanilla, and salt',
          'Knead into smooth paste, adding water if too dry',
          'Shape filling into thin logs',
          'Cut phyllo into 4-inch squares',
          'Place almond log on diagonal of phyllo square',
          'Fold corners over filling and roll into crescent',
          'Pinch ends to create horn shape',
          'Brush with melted butter',
          'Bake at 350°F for 20-25 minutes until golden',
          'Or fry in oil at 350°F for 2-3 minutes per side',
          'Dust generously with powdered sugar while still warm',
          'Drizzle with honey if desired',
          'Store in airtight container'
        ],
        notes: 'Delicate pastry shaped like gazelle horns, traditional wedding sweet'
      }
    ],
    nonAlcoholicDrinks: [
      {
        id: 'alg-drink-mint-tea',
        name: 'Moroccan Mint Tea (Atay bi Na\'ana)',
        difficulty: 'Easy',
        servings: 4,
        prepTime: 5,
        cookTime: 5,
        ingredients: [
          '4 cups water',
          '2 tbsp green tea leaves',
          '1 cup fresh mint leaves',
          '3-4 tbsp sugar (to taste)',
          'Pinch of salt',
          'Ice (optional)'
        ],
        instructions: [
          'Boil water in kettle',
          'Add green tea leaves to teapot and pour hot water',
          'Steep 1 minute, then add fresh mint and sugar',
          'Steep another 2-3 minutes',
          'Pour into glasses, preferably traditional tea glasses',
          'Serve hot or over ice',
          'Can be refilled 2-3 times with fresh hot water'
        ],
        notes: 'Traditional welcome drink served to guests throughout the day'
      },
      {
        id: 'alg-drink-almond-milk',
        name: 'Almond Milk Drink (Horchata Algérienne)',
        difficulty: 'Medium',
        servings: 6,
        prepTime: 15,
        cookTime: 10,
        ingredients: [
          '1 cup blanched almonds',
          '4 cups water',
          '1/3 cup sugar',
          '1/2 tsp orange blossom water',
          '1/4 tsp vanilla extract',
          'Pinch of salt',
          'Ice',
          'Crushed pistachios for garnish'
        ],
        instructions: [
          'Blanch almonds in boiling water for 1 minute',
          'Remove skins by rubbing between hands',
          'Blend almonds with 1 cup water until very fine paste',
          'Strain through fine mesh, pressing to extract all liquid',
          'Combine almond milk with remaining 3 cups water',
          'Add sugar, orange blossom water, and vanilla',
          'Chill thoroughly',
          'Pour over ice into glasses',
          'Garnish with crushed pistachios',
          'Stir before serving'
        ],
        notes: 'Refreshing drink popular during summer, often served at festivals'
      }
    ],
    alcoholicDrinks: [
      {
        id: 'alg-drink-boukha',
        name: 'Boukha (Fig Brandy)',
        difficulty: 'Easy',
        servings: 8,
        prepTime: 5,
        cookTime: 0,
        ingredients: [
          '1 bottle Boukha (Tunisian fig brandy, 40% ABV)',
          'Ice',
          'Water or soda',
          'Fresh figs (optional garnish)',
          'Lemon wedges (optional)'
        ],
        instructions: [
          'Pour 1-2 oz Boukha into glass',
          'Add ice cubes',
          'Top with water or soda to taste (typically 1:1 ratio)',
          'Stir well',
          'Garnish with fresh fig or lemon wedge if desired',
          'Serve immediately'
        ],
        notes: 'Traditional North African spirit made from Barbary figs, popular aperitif'
      },
      {
        id: 'alg-drink-wine-red',
        name: 'North African Red Wine',
        difficulty: 'Easy',
        servings: 6,
        prepTime: 5,
        cookTime: 0,
        ingredients: [
          '1 bottle North African red wine (14% ABV)',
          'Ice (optional)',
          'Cheese and charcuterie for pairing',
          'Bread'
        ],
        instructions: [
          'Chill bottle in refrigerator for at least 1 hour',
          'Open bottle and let breathe for 15 minutes',
          'Pour into wine glasses',
          'Serve at 60-65°F',
          'Enjoy with traditional Algerian dishes or cheese and bread'
        ],
        notes: 'North African wines complement local cuisine, served at celebrations'
      }
    ]
  },
  'Italy': {
    country: 'Italy',
    region: 'Europe',
    breakfast: [
      {
        id: 'ita-breakfast-espresso',
        name: 'Espresso con Cornetto',
        difficulty: 'Easy',
        servings: 1,
        prepTime: 5,
        cookTime: 2,
        ingredients: [
          '18g finely ground espresso',
          '40ml water',
          '1 cornetto (Italian croissant)',
          'Sugar (optional)',
          'Milk (optional)'
        ],
        instructions: [
          'Grind dark roast coffee finely',
          'Tamp grounds firmly into portafilter',
          'Extract shot into cup for 25-30 seconds',
          'Should yield about 40ml of espresso',
          'Warm cornetto in oven for 2 minutes',
          'Dunk cornetto into espresso or drink separately',
          'Add sugar or milk if desired'
        ],
        notes: 'Classic Italian breakfast, eaten quickly while standing at bar'
      }
    ],
    lunch: [
      {
        id: 'ita-lunch-risotto-milanese',
        name: 'Risotto alla Milanese (Saffron Risotto)',
        difficulty: 'Hard',
        servings: 4,
        prepTime: 20,
        cookTime: 30,
        ingredients: [
          '300g Arborio rice',
          '1 small onion (finely diced)',
          '4 cups warm beef or vegetable broth',
          '1/2 cup dry white wine',
          '1/4 tsp saffron threads',
          '75g butter (divided)',
          '50g Parmigiano-Reggiano (grated)',
          '2 tbsp olive oil',
          'Salt and white pepper to taste',
          '1 tbsp bone marrow (optional, traditional)'
        ],
        instructions: [
          'Toast saffron threads in dry pan for 30 seconds',
          'Steep saffron in 1/4 cup warm broth for 10 minutes',
          'Heat remaining broth in separate pot, keep at gentle simmer',
          'Heat olive oil and 1 tbsp butter in wide pan over medium heat',
          'Add diced onion and cook until translucent, about 2 minutes',
          'Add rice and stir for 1-2 minutes until lightly toasted',
          'Pour in white wine and stir until almost absorbed',
          'Begin adding warm broth one ladle at a time, stirring frequently',
          'Wait until each ladle of broth is absorbed before adding next',
          'Continue for 18-20 minutes until rice is creamy but still al dente',
          'Stir in saffron and soaking liquid',
          'Remove from heat and stir in remaining butter and Parmigiano',
          'Season with salt and white pepper',
          'Cover and rest 2 minutes before serving',
          'Risotto should flow slightly on plate, not be stiff'
        ],
        notes: 'Golden risotto from Milan, requires patience and constant attention'
      }
    ],
    dinner: [
      {
        id: 'ita-dinner-osso-buco',
        name: 'Osso Buco (Braised Veal Shanks)',
        difficulty: 'Hard',
        servings: 4,
        prepTime: 20,
        cookTime: 120,
        ingredients: [
          '4 veal shanks (2 inches thick, about 1kg total)',
          '1 cup all-purpose flour',
          'Salt and pepper',
          '1/4 cup olive oil',
          '1 onion (chopped)',
          '2 carrots (chopped)',
          '2 celery stalks (chopped)',
          '1 cup dry white wine',
          '1 can (400g) crushed tomatoes',
          '1 cup beef broth',
          '2 bay leaves',
          '4 sprigs fresh thyme',
          '3 cloves garlic (minced)',
          'Zest of 1 lemon',
          '2 tbsp fresh parsley (chopped)',
          '1 tbsp gremolata spice mix (optional)'
        ],
        instructions: [
          'Pat veal shanks dry with paper towels',
          'Season flour with salt and pepper, coat shanks thoroughly',
          'Heat olive oil in large heavy pot over medium-high heat',
          'Brown veal shanks on all sides, about 3-4 minutes per side',
          'Remove and set aside',
          'In same pot, sauté onion, carrots, and celery until softened',
          'Add garlic and cook for 1 minute',
          'Deglaze pan with white wine, scraping up browned bits',
          'Return veal to pot',
          'Add crushed tomatoes, broth, bay leaves, and thyme',
          'Bring to simmer, then cover and transfer to 325°F oven',
          'Braise for 90-120 minutes until meat is very tender',
          'Remove bay leaves and thyme sprigs',
          'Mix lemon zest and parsley for gremolata garnish',
          'Serve shanks with braising liquid over risotto or polenta',
          'Sprinkle gremolata on top'
        ],
        notes: 'Iconic Milanese dish, the marrow in bone is prized'
      }
    ],
    desserts: [
      {
        id: 'ita-dessert-tiramisu',
        name: 'Tiramisu (Coffee Mascarpone Dessert)',
        difficulty: 'Medium',
        servings: 8,
        prepTime: 30,
        cookTime: 0,
        ingredients: [
          '6 egg yolks',
          '150g sugar',
          '500g mascarpone cheese (room temperature)',
          '300ml heavy cream',
          '2 tbsp Marsala wine',
          '1 tsp vanilla extract',
          '2 cups strong espresso (cooled)',
          '3 tbsp coffee liqueur (optional)',
          '24-30 ladyfinger biscuits (savoiardi)',
          '2 tbsp unsweetened cocoa powder',
          'Dark chocolate shavings (optional)',
          'Salt'
        ],
        instructions: [
          'Whisk egg yolks with sugar in heatproof bowl over hot water until warm',
          'Whisk until thick and pale, about 8 minutes',
          'Remove from heat and let cool slightly',
          'Beat mascarpone with Marsala wine and vanilla until smooth',
          'Fold cooled egg mixture into mascarpone gently',
          'Whip heavy cream to stiff peaks',
          'Fold whipped cream into mascarpone mixture',
          'Combine cooled espresso with coffee liqueur if using',
          'Quickly dip ladyfingers into coffee mixture, 1-2 seconds per side',
          'Arrange layer of dipped ladyfingers in 9x13 dish',
          'Spread half of mascarpone cream over ladyfingers',
          'Repeat with another layer of dipped ladyfingers',
          'Top with remaining mascarpone cream',
          'Cover and refrigerate at least 6 hours, preferably overnight',
          'Dust generously with cocoa powder just before serving',
          'Add chocolate shavings if desired',
          'Slice and serve chilled'
        ],
        notes: 'Modern Italian classic, requires no baking, best made day ahead'
      }
    ],
    nonAlcoholicDrinks: [
      {
        id: 'ita-drink-italian-soda',
        name: 'Italian Cream Soda (Soda al Cream)',
        difficulty: 'Easy',
        servings: 1,
        prepTime: 5,
        cookTime: 0,
        ingredients: [
          '2 oz fruit syrup (raspberry, strawberry, or peach)',
          '4 oz soda water',
          '2 oz heavy cream',
          'Ice cubes',
          'Fresh fruit for garnish',
          'Cherry (optional)'
        ],
        instructions: [
          'Fill glass with ice cubes',
          'Pour fruit syrup into glass',
          'Top with soda water',
          'Stir gently to combine',
          'Float cream on top by pouring slowly over back of spoon',
          'Do not stir after adding cream - leave layered',
          'Garnish with fresh fruit and cherry',
          'Serve immediately with straw'
        ],
        notes: 'Colorful and refreshing, popular Italian aperitivo'
      }
    ],
    alcoholicDrinks: [
      {
        id: 'ita-drink-aperol-spritz',
        name: 'Aperol Spritz',
        difficulty: 'Easy',
        servings: 1,
        prepTime: 5,
        cookTime: 0,
        ingredients: [
          '3 oz Prosecco',
          '2 oz Aperol',
          '1 oz soda water',
          'Ice cubes',
          'Orange slice for garnish'
        ],
        instructions: [
          'Fill wine glass with ice cubes',
          'Pour Aperol over ice',
          'Top with Prosecco',
          'Add soda water',
          'Stir gently',
          'Garnish with orange slice',
          'Serve immediately'
        ],
        notes: 'Popular Italian aperitivo, typically served before dinner'
      }
    ]
  }
};

// ============================================================
// BUILD FUNCTION
// ============================================================

function buildRecipeFiles() {
  const dataDir = path.join(__dirname, 'data');

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let totalRecipes = 0;

  // Create JSON files for each country
  Object.entries(AUTHENTIC_RECIPES).forEach(([countryName, countryData]) => {
    const filename = `${countryName.toLowerCase()}-authentic-recipes.json`;
    const filepath = path.join(dataDir, filename);

    // Create country object with proper structure
    const countryRecipes = {
      [countryData.country.toLowerCase() + 'Recipes']: {
        country: countryData.country,
        region: countryData.region,
        totalRecipes: Object.keys(countryData).reduce((sum, key) => {
          if (key !== 'country' && key !== 'region' && Array.isArray(countryData[key])) {
            return sum + countryData[key].length;
          }
          return sum;
        }, 0),
        breakfast: countryData.breakfast || [],
        lunch: countryData.lunch || [],
        dinner: countryData.dinner || [],
        snacks: countryData.snacks || [],
        desserts: countryData.desserts || [],
        nonAlcoholicDrinks: countryData.nonAlcoholicDrinks || [],
        alcoholicDrinks: countryData.alcoholicDrinks || []
      }
    };

    // Write file
    fs.writeFileSync(filepath, JSON.stringify(countryRecipes, null, 2));

    const recipeCount = countryRecipes[Object.keys(countryRecipes)[0]].totalRecipes;
    totalRecipes += recipeCount;
    console.log(`✓ Created ${filename} with ${recipeCount} authentic recipes`);
  });

  console.log(`\n✅ Created ${Object.keys(AUTHENTIC_RECIPES).length} country files`);
  console.log(`📊 Total authentic recipes: ${totalRecipes}`);
  console.log(`\n🎯 Next step: Run 'node api-server.js' to load recipes into API`);
}

// ============================================================
// RUN
// ============================================================

buildRecipeFiles();
