/**
 * Seasoning & Ingredient Pairing Engine
 * Intelligently transforms dishes through flavor profiles and ingredient pairings
 */

class SeasoningPairingEngine {
  constructor() {
    this.flavorProfiles = this.initializeFlavorProfiles();
    this.ingredientPairings = this.initializeIngredientPairings();
    this.cuisineSignatures = this.initializeCuisineSignatures();
    this.proteinCarbs = this.initializeProteinCarbPairings();
    this.transformationTemplates = this.initializeTransformationTemplates();
  }

  /**
   * Generate a seasoning-based remix of a recipe
   * Transforms both the seasonings AND the ingredients for a completely different flavor profile
   */
  generateSeasoningRemix(recipe, targetFlavor, format = 'salad') {
    if (!recipe) return null;

    let remixed = JSON.parse(JSON.stringify(recipe));

    // Get the original flavor profile
    const originalFlavor = this.detectFlavorProfile(recipe);

    // Generate new seasonings for target flavor
    const newSeasonings = this.generateSeasoningsForFlavor(targetFlavor, format);

    // Update ingredients to match flavor profile
    const updatedIngredients = this.transformIngredientsForFlavor(
      recipe.ingredients,
      originalFlavor,
      targetFlavor,
      format
    );

    // Get protein/carb pairing recommendations
    const pairings = this.recommendPairings(targetFlavor, recipe.category || 'dinner');

    // Update recipe
    remixed.name = this.generateNewDishName(recipe.name, targetFlavor);
    remixed.description = this.generateFlavorDescription(recipe, targetFlavor, pairings);
    remixed.seasonings = newSeasonings;
    remixed.ingredients = updatedIngredients;
    remixed.flavor_profile = targetFlavor;
    remixed.pairings = pairings;
    remixed.flavor_notes = this.generateFlavorNotes(targetFlavor, newSeasonings);
    remixed.transformation_notes = this.generateTransformationNotes(originalFlavor, targetFlavor);

    return remixed;
  }

  /**
   * Detect the flavor profile of a recipe based on its seasonings
   */
  detectFlavorProfile(recipe) {
    const seasonings = (recipe.seasonings || []).map(s => s.toLowerCase());
    let profileScores = {
      'spicy': 0,
      'umami': 0,
      'sweet': 0,
      'sour': 0,
      'aromatic': 0,
      'savory': 0,
      'earthy': 0,
      'fresh': 0
    };

    seasonings.forEach(s => {
      const profile = this.flavorProfiles[s];
      if (profile) {
        Object.keys(profile).forEach(key => {
          profileScores[key] += profile[key];
        });
      }
    });

    // Find dominant flavor
    const dominant = Object.keys(profileScores).reduce((a, b) =>
      profileScores[a] > profileScores[b] ? a : b
    );

    return dominant;
  }

  /**
   * Generate new seasonings for a target flavor profile
   */
  generateSeasoningsForFlavor(targetFlavor, format) {
    const flavorSeasonings = this.flavorProfiles;
    const seasonsForFlavor = [];

    // Find seasonings that match the target flavor
    Object.entries(flavorSeasonings).forEach(([seasoning, profile]) => {
      if (profile[targetFlavor] && profile[targetFlavor] > 0.6) {
        seasonsForFlavor.push({
          seasoning,
          strength: profile[targetFlavor],
          cuisines: this.findCuisinesWithSeasoning(seasoning)
        });
      }
    });

    // Sort by strength and return top seasonings
    return seasonsForFlavor
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5)
      .map(s => s.seasoning);
  }

  /**
   * Find cuisines that use a specific seasoning
   */
  findCuisinesWithSeasoning(seasoning) {
    const cuisines = [];
    Object.entries(this.cuisineSignatures).forEach(([cuisine, sigs]) => {
      if (sigs.seasonings.includes(seasoning)) {
        cuisines.push(cuisine);
      }
    });
    return cuisines;
  }

  /**
   * Transform ingredients to match a flavor profile
   */
  transformIngredientsForFlavor(ingredients, originalFlavor, targetFlavor, format) {
    let transformed = [...ingredients];

    // Find and replace proteins/carbs that don't match the flavor
    transformed = this.replaceProteinForFlavor(transformed, targetFlavor);
    transformed = this.replaceCarbsForFlavor(transformed, targetFlavor);
    transformed = this.replaceBeansForFlavor(transformed, targetFlavor);

    // Add complementary ingredients for the flavor profile
    const complementary = this.getComplementaryIngredients(targetFlavor, format);
    transformed = transformed.concat(complementary.filter(c => !transformed.some(i => i.toLowerCase().includes(c.toLowerCase()))));

    return transformed;
  }

  /**
   * Replace protein based on flavor profile
   */
  replaceProteinForFlavor(ingredients, targetFlavor) {
    const proteinMatches = {
      'chicken': /chicken|poultry|bird/i,
      'beef': /beef|steak|brisket|chuck/i,
      'pork': /pork|bacon|ham/i,
      'fish': /fish|salmon|cod|tuna/i,
      'tofu': /tofu|tempeh|seitan/i,
      'lamb': /lamb|mutton/i,
      'shrimp': /shrimp|prawn|seafood/i
    };

    return ingredients.map(ing => {
      for (const [protein, regex] of Object.entries(proteinMatches)) {
        if (regex.test(ing)) {
          const bestProtein = this.getBestProteinForFlavor(targetFlavor);
          if (bestProtein && bestProtein !== protein) {
            return ing.replace(regex, bestProtein);
          }
        }
      }
      return ing;
    });
  }

  /**
   * Get best protein for a flavor profile
   */
  getBestProteinForFlavor(flavor) {
    const proteinFlavorMap = {
      'spicy': 'chicken',
      'umami': 'beef',
      'sweet': 'pork',
      'sour': 'fish',
      'aromatic': 'lamb',
      'savory': 'beef',
      'earthy': 'mushrooms',
      'fresh': 'fish'
    };
    return proteinFlavorMap[flavor] || 'chicken';
  }

  /**
   * Replace carbs based on flavor profile
   */
  replaceCarbsForFlavor(ingredients, targetFlavor) {
    const carbMatches = {
      'rice': /rice|basmati|jasmine|white rice/i,
      'pasta': /pasta|noodle|spaghetti|fettuccine/i,
      'bread': /bread|roll|baguette|croissant/i,
      'potato': /potato|spud|tuber/i,
      'quinoa': /quinoa/i,
      'couscous': /couscous/i
    };

    return ingredients.map(ing => {
      for (const [carb, regex] of Object.entries(carbMatches)) {
        if (regex.test(ing)) {
          const bestCarb = this.getBestCarbForFlavor(targetFlavor);
          if (bestCarb && bestCarb !== carb) {
            return ing.replace(regex, bestCarb);
          }
        }
      }
      return ing;
    });
  }

  /**
   * Get best carb for a flavor profile
   */
  getBestCarbForFlavor(flavor) {
    const carbFlavorMap = {
      'spicy': 'jasmine rice',
      'umami': 'egg noodles',
      'sweet': 'couscous',
      'sour': 'white rice',
      'aromatic': 'basmati rice',
      'savory': 'fettuccine',
      'earthy': 'brown rice',
      'fresh': 'quinoa'
    };
    return carbFlavorMap[flavor] || 'rice';
  }

  /**
   * Replace beans based on flavor profile
   */
  replaceBeansForFlavor(ingredients, targetFlavor) {
    const beanMatches = {
      'black beans': /black bean/i,
      'chickpeas': /chickpea|garbanzo/i,
      'lentils': /lentil|dal/i,
      'kidney beans': /kidney bean|red bean/i,
      'pinto beans': /pinto bean/i,
      'white beans': /white bean|cannellini/i
    };

    return ingredients.map(ing => {
      for (const [bean, regex] of Object.entries(beanMatches)) {
        if (regex.test(ing)) {
          const bestBean = this.getBestBeanForFlavor(targetFlavor);
          if (bestBean && bestBean !== bean) {
            return ing.replace(regex, bestBean);
          }
        }
      }
      return ing;
    });
  }

  /**
   * Get best bean for a flavor profile
   */
  getBestBeanForFlavor(flavor) {
    const beanFlavorMap = {
      'spicy': 'black beans',
      'umami': 'lentils',
      'sweet': 'chickpeas',
      'sour': 'white beans',
      'aromatic': 'kidney beans',
      'savory': 'lentils',
      'earthy': 'pinto beans',
      'fresh': 'chickpeas'
    };
    return beanFlavorMap[flavor] || 'lentils';
  }

  /**
   * Get complementary ingredients for a flavor
   */
  getComplementaryIngredients(flavor, format) {
    const complementary = {
      'spicy': ['Thai basil', 'bird\'s eye chili', 'lime juice', 'coconut milk'],
      'umami': ['soy sauce', 'mushrooms', 'parmesan', 'miso'],
      'sweet': ['caramelized onions', 'raisins', 'honey', 'sweet potato'],
      'sour': ['lemon', 'vinegar', 'yogurt', 'lime'],
      'aromatic': ['cumin', 'cardamom', 'cinnamon', 'rose water'],
      'savory': ['garlic', 'thyme', 'rosemary', 'beef broth'],
      'earthy': ['mushrooms', 'beets', 'walnuts', 'dark leafy greens'],
      'fresh': ['mint', 'cilantro', 'basil', 'lemon zest']
    };
    return complementary[flavor] || [];
  }

  /**
   * Recommend protein, carb, and bean pairings for a flavor
   */
  recommendPairings(flavor, category = 'dinner') {
    const protein = this.getBestProteinForFlavor(flavor);
    const carb = this.getBestCarbForFlavor(flavor);
    const bean = this.getBestBeanForFlavor(flavor);
    const seasonings = this.generateSeasoningsForFlavor(flavor);

    return {
      protein: { name: protein, reason: `Pairs well with ${flavor} flavors` },
      carb: { name: carb, reason: `Complements ${flavor} profile` },
      bean: { name: bean, reason: `Enhances ${flavor} taste` },
      seasonings: seasonings,
      complementary_ingredients: this.getComplementaryIngredients(flavor),
      pairing_scores: this.calculatePairingScores(protein, carb, bean, flavor)
    };
  }

  /**
   * Calculate compatibility scores for pairings
   */
  calculatePairingScores(protein, carb, bean, flavor) {
    const scores = {
      protein_flavor_match: this.calculateIngredientFlavorMatch(protein, flavor),
      carb_flavor_match: this.calculateIngredientFlavorMatch(carb, flavor),
      bean_flavor_match: this.calculateIngredientFlavorMatch(bean, flavor),
      overall_harmony: this.calculateHarmonyScore(protein, carb, bean)
    };
    return scores;
  }

  /**
   * Calculate how well an ingredient matches a flavor
   */
  calculateIngredientFlavorMatch(ingredient, flavor) {
    const matches = {
      'chicken-spicy': 0.95,
      'chicken-fresh': 0.88,
      'beef-umami': 0.98,
      'beef-savory': 0.96,
      'fish-sour': 0.92,
      'fish-fresh': 0.95,
      'mushrooms-umami': 0.99,
      'mushrooms-earthy': 0.97,
      'lentils-umami': 0.94,
      'lentils-earthy': 0.93
    };
    return matches[`${ingredient}-${flavor}`] || 0.85;
  }

  /**
   * Calculate overall harmony of a protein/carb/bean combination
   */
  calculateHarmonyScore(protein, carb, bean) {
    // Based on culinary science, certain combinations work better
    const harmonyPairs = {
      'chicken-jasmine rice': 0.95,
      'beef-egg noodles': 0.93,
      'fish-white rice': 0.94,
      'lentils-brown rice': 0.96,
      'mushrooms-fettuccine': 0.92
    };

    const key = `${protein}-${carb}`;
    return harmonyPairs[key] || 0.85;
  }

  /**
   * Generate a new dish name based on flavor transformation
   */
  generateNewDishName(originalName, targetFlavor) {
    const flavorAdjectives = {
      'spicy': 'Spicy',
      'umami': 'Savory',
      'sweet': 'Honeyed',
      'sour': 'Tangy',
      'aromatic': 'Fragrant',
      'savory': 'Rich',
      'earthy': 'Earthy',
      'fresh': 'Fresh'
    };

    const adjective = flavorAdjectives[targetFlavor] || 'Transformed';
    return `${adjective} ${originalName}`;
  }

  /**
   * Generate description emphasizing flavor transformation
   */
  generateFlavorDescription(recipe, targetFlavor, pairings) {
    const flavorDescriptions = {
      'spicy': `This version brings heat and intensity with ${pairings.seasonings.join(', ')}. The ${pairings.protein.name} provides a perfect canvas for bold spices.`,
      'umami': `A savory depth transforms this dish through rich ${pairings.seasonings.join(', ')} notes. The ${pairings.protein.name} becomes luxuriously umami-forward.`,
      'sweet': `Subtle sweetness emerges through ${pairings.seasonings.join(', ')}, creating a balanced sweet-savory profile with ${pairings.protein.name}}.`,
      'sour': `Bright and acidic notes from ${pairings.seasonings.join(', ')} enliven the ${pairings.protein.name}}, creating a refreshing, palate-cleansing dish.`,
      'aromatic': `Fragrant spices—${pairings.seasonings.join(', ')}—create an aromatic experience with ${pairings.protein.name} as the star.`,
      'savory': `Deep, savory flavors build through ${pairings.seasonings.join(', ')}, making the ${pairings.protein.name} incredibly satisfying.`,
      'earthy': `Earthy undertones from ${pairings.bean} and ${pairings.seasonings.join(', ')} create an grounded, rustic version with {{pairings.protein.name}}.`,
      'fresh': `Light, fresh flavors from ${pairings.seasonings.join(', ')} brighten the {{pairings.protein.name}}, creating a vibrant, alive dish.`
    };

    return flavorDescriptions[targetFlavor] || `A transformed version of the classic ${recipe.name} with unique flavor profile.`;
  }

  /**
   * Generate flavor notes explaining the transformation
   */
  generateFlavorNotes(targetFlavor, seasonings) {
    return {
      primary_flavor: targetFlavor,
      secondary_flavors: this.getSecondaryFlavors(targetFlavor),
      dominant_seasonings: seasonings,
      eating_experience: this.describeEatingExperience(targetFlavor),
      pairing_drinks: this.recommendBeveragePairings(targetFlavor)
    };
  }

  /**
   * Get secondary flavors that complement the primary
   */
  getSecondaryFlavors(targetFlavor) {
    const secondary = {
      'spicy': ['aromatic', 'fresh'],
      'umami': ['savory', 'earthy'],
      'sweet': ['aromatic', 'sour'],
      'sour': ['fresh', 'aromatic'],
      'aromatic': ['savory', 'sweet'],
      'savory': ['umami', 'earthy'],
      'earthy': ['savory', 'umami'],
      'fresh': ['sour', 'aromatic']
    };
    return secondary[targetFlavor] || [];
  }

  /**
   * Describe the eating experience
   */
  describeEatingExperience(flavor) {
    const experiences = {
      'spicy': 'Tongue tingling with building heat, followed by warming sensations',
      'umami': 'Mouth-coating richness with savory depth that lingers',
      'sweet': 'Balanced sweetness that builds on the palate, never cloying',
      'sour': 'Bright acidity that makes taste buds tingle, palate-cleansing',
      'aromatic': 'Perfumed, fragrant with exotic spice aromas',
      'savory': 'Deep, satisfying richness that coats and lingers',
      'earthy': 'Grounded, rustic flavors with natural vegetable depth',
      'fresh': 'Light, crisp, vibrant flavors with citrus or herb brightness'
    };
    return experiences[flavor] || 'A unique and memorable eating experience';
  }

  /**
   * Recommend beverage pairings
   */
  recommendBeveragePairings(flavor) {
    const beverages = {
      'spicy': ['Thai iced tea', 'Lassi', 'Rice wine', 'Light lager'],
      'umami': ['Red wine', 'Soy sauce', 'Dark beer', 'Mushroom broth'],
      'sweet': ['Dessert wine', 'Honey tea', 'Almond milk', 'Golden ale'],
      'sour': ['White wine', 'Sparkling water with lemon', 'Kombucha', 'Sauvignon Blanc'],
      'aromatic': ['Chai tea', 'Rosewater lemonade', 'Fragrant white tea', 'Vermouth'],
      'savory': ['Beef broth', 'Red wine', 'Porter beer', 'Bone broth'],
      'earthy': ['Herbal tea', 'Red wine', 'Brown ale', 'Coffee'],
      'fresh': ['White wine', 'Herbal tea', 'Sparkling cider', 'Pale ale']
    };
    return beverages[flavor] || ['Water', 'Wine', 'Tea'];
  }

  /**
   * Generate transformation notes explaining how the dish changed
   */
  generateTransformationNotes(originalFlavor, targetFlavor) {
    return `This dish has been transformed from ${originalFlavor} to ${targetFlavor}, with ingredient and seasoning swaps that fundamentally change the eating experience while maintaining the dish's core technique.`;
  }

  /**
   * Initialize flavor profiles for seasonings
   */
  initializeFlavorProfiles() {
    return {
      // Spicy
      'cayenne': { spicy: 0.95, savory: 0.3, aromatic: 0.2 },
      'chili powder': { spicy: 0.9, savory: 0.4, aromatic: 0.2 },
      'jalapeño': { spicy: 0.75, fresh: 0.6, sour: 0.2 },
      'sriracha': { spicy: 0.85, sour: 0.4, aromatic: 0.2 },
      'wasabi': { spicy: 0.98, fresh: 0.5 },
      'black pepper': { spicy: 0.6, aromatic: 0.4, savory: 0.3 },

      // Umami
      'soy sauce': { umami: 0.98, savory: 0.8, salty: 0.7 },
      'miso': { umami: 0.95, savory: 0.7, earthy: 0.4 },
      'worcestershire': { umami: 0.92, savory: 0.8, sour: 0.3 },
      'fish sauce': { umami: 0.96, savory: 0.6, salty: 0.7 },
      'parmesan': { umami: 0.94, savory: 0.7, aromatic: 0.2 },
      'mushroom powder': { umami: 0.9, earthy: 0.8, savory: 0.6 },

      // Sweet
      'honey': { sweet: 0.95, aromatic: 0.2 },
      'cinnamon': { sweet: 0.7, aromatic: 0.8, warm: 0.6 },
      'vanilla': { sweet: 0.85, aromatic: 0.9, fresh: 0.2 },
      'sugar': { sweet: 0.98 },
      'maple syrup': { sweet: 0.92, earthy: 0.4 },

      // Sour
      'lemon': { sour: 0.95, fresh: 0.9, aromatic: 0.3 },
      'vinegar': { sour: 0.98, sharp: 0.7, savory: 0.2 },
      'lime': { sour: 0.94, fresh: 0.95, aromatic: 0.4 },
      'tamarind': { sour: 0.88, sweet: 0.3, aromatic: 0.5 },
      'yogurt': { sour: 0.6, fresh: 0.5, savory: 0.3 },

      // Aromatic
      'cumin': { aromatic: 0.95, earthy: 0.7, warm: 0.6 },
      'cardamom': { aromatic: 0.98, sweet: 0.4, warm: 0.7 },
      'star anise': { aromatic: 0.96, sweet: 0.5, licorice: 0.8 },
      'cinnamon': { aromatic: 0.85, sweet: 0.7, warm: 0.7 },
      'coriander': { aromatic: 0.9, citrus: 0.5, warm: 0.4 },
      'cloves': { aromatic: 0.94, warm: 0.8, sweet: 0.3 },

      // Savory
      'garlic': { savory: 0.95, aromatic: 0.6, pungent: 0.7 },
      'thyme': { savory: 0.9, earthy: 0.6, aromatic: 0.7 },
      'rosemary': { savory: 0.92, aromatic: 0.8, piney: 0.7 },
      'bay leaf': { savory: 0.88, aromatic: 0.7 },
      'oregano': { savory: 0.85, aromatic: 0.8 },

      // Earthy
      'cumin': { earthy: 0.8, aromatic: 0.9 },
      'turmeric': { earthy: 0.85, aromatic: 0.7, warm: 0.6 },
      'black sesame': { earthy: 0.95, nutty: 0.8, savory: 0.5 },
      'porcini mushroom': { earthy: 0.98, umami: 0.9, savory: 0.7 },

      // Fresh
      'basil': { fresh: 0.95, aromatic: 0.8, sweet: 0.3 },
      'mint': { fresh: 0.98, cool: 0.9, aromatic: 0.7 },
      'cilantro': { fresh: 0.96, aromatic: 0.8, citrus: 0.4 },
      'parsley': { fresh: 0.9, aromatic: 0.6, clean: 0.7 },
      'dill': { fresh: 0.92, aromatic: 0.7, bright: 0.7 }
    };
  }

  /**
   * Initialize ingredient pairings (proteins, carbs, beans)
   */
  initializeIngredientPairings() {
    return {
      // Proteins and their ideal flavor companions
      'chicken': {
        flavors: ['spicy', 'aromatic', 'fresh', 'sweet'],
        carbs: ['jasmine rice', 'couscous', 'fettuccine'],
        beans: ['chickpeas', 'white beans'],
        cuisines: ['Thai', 'Indian', 'Mediterranean']
      },
      'beef': {
        flavors: ['umami', 'savory', 'earthy', 'aromatic'],
        carbs: ['egg noodles', 'fettuccine', 'brown rice'],
        beans: ['kidney beans', 'lentils'],
        cuisines: ['French', 'Italian', 'American']
      },
      'fish': {
        flavors: ['sour', 'fresh', 'aromatic', 'light'],
        carbs: ['white rice', 'quinoa', 'couscous'],
        beans: ['white beans', 'chickpeas'],
        cuisines: ['Japanese', 'Mediterranean', 'Peruvian']
      },
      'pork': {
        flavors: ['sweet', 'savory', 'aromatic', 'umami'],
        carbs: ['couscous', 'sweet potato', 'egg noodles'],
        beans: ['black beans', 'pinto beans'],
        cuisines: ['Chinese', 'Vietnamese', 'Portuguese']
      },
      'lamb': {
        flavors: ['aromatic', 'earthy', 'savory', 'umami'],
        carbs: ['basmati rice', 'couscous', 'fettuccine'],
        beans: ['lentils', 'chickpeas'],
        cuisines: ['Indian', 'Middle Eastern', 'Mediterranean']
      },
      'mushrooms': {
        flavors: ['umami', 'earthy', 'savory'],
        carbs: ['fettuccine', 'brown rice', 'polenta'],
        beans: ['lentils', 'pinto beans'],
        cuisines: ['Italian', 'French', 'German']
      },
      'tofu': {
        flavors: ['spicy', 'umami', 'aromatic', 'fresh'],
        carbs: ['jasmine rice', 'ramen noodles', 'brown rice'],
        beans: ['black beans', 'edamame'],
        cuisines: ['Chinese', 'Japanese', 'Thai']
      }
    };
  }

  /**
   * Initialize cuisine flavor signatures
   */
  initializeCuisineSignatures() {
    return {
      'Thai': {
        primary: 'spicy',
        secondary: ['aromatic', 'fresh', 'sour'],
        seasonings: ['chili', 'Thai basil', 'lime', 'fish sauce', 'galangal'],
        proteins: ['chicken', 'fish', 'shrimp'],
        carbs: ['jasmine rice', 'rice noodles']
      },
      'Indian': {
        primary: 'aromatic',
        secondary: ['spicy', 'earthy', 'savory'],
        seasonings: ['cumin', 'cardamom', 'turmeric', 'cinnamon', 'coriander'],
        proteins: ['chicken', 'lamb', 'lentils'],
        carbs: ['basmati rice', 'naan']
      },
      'Italian': {
        primary: 'savory',
        secondary: ['aromatic', 'umami'],
        seasonings: ['basil', 'oregano', 'garlic', 'parmesan'],
        proteins: ['beef', 'pork', 'fish'],
        carbs: ['fettuccine', 'pappardelle']
      },
      'French': {
        primary: 'savory',
        secondary: ['umami', 'sour'],
        seasonings: ['thyme', 'rosemary', 'garlic', 'wine'],
        proteins: ['beef', 'chicken', 'mushrooms'],
        carbs: ['egg noodles', 'potatoes']
      },
      'Chinese': {
        primary: 'umami',
        secondary: ['aromatic', 'spicy', 'sweet'],
        seasonings: ['soy sauce', 'ginger', 'garlic', 'sesame oil'],
        proteins: ['pork', 'chicken', 'tofu'],
        carbs: ['rice', 'noodles']
      },
      'Japanese': {
        primary: 'umami',
        secondary: ['fresh', 'salty'],
        seasonings: ['soy sauce', 'mirin', 'dashi', 'wasabi'],
        proteins: ['fish', 'chicken'],
        carbs: ['white rice', 'noodles']
      },
      'Mexican': {
        primary: 'spicy',
        secondary: ['aromatic', 'fresh', 'earthy'],
        seasonings: ['chili', 'cumin', 'cilantro', 'lime'],
        proteins: ['chicken', 'beef', 'beans'],
        carbs: ['rice', 'tortillas']
      },
      'Mediterranean': {
        primary: 'fresh',
        secondary: ['savory', 'aromatic', 'sour'],
        seasonings: ['olive oil', 'oregano', 'lemon', 'garlic'],
        proteins: ['fish', 'lamb', 'chicken'],
        carbs: ['couscous', 'white rice']
      }
    };
  }

  /**
   * Initialize protein/carb pairings
   */
  initializeProteinCarbPairings() {
    return {
      'chicken': {
        'jasmine rice': 0.95,
        'couscous': 0.92,
        'fettuccine': 0.88,
        'white rice': 0.85,
        'brown rice': 0.82,
        'quinoa': 0.80
      },
      'beef': {
        'egg noodles': 0.97,
        'fettuccine': 0.96,
        'brown rice': 0.90,
        'potatoes': 0.92,
        'couscous': 0.85,
        'white rice': 0.80
      },
      'fish': {
        'white rice': 0.96,
        'quinoa': 0.94,
        'couscous': 0.92,
        'jasmine rice': 0.90,
        'fettuccine': 0.85,
        'brown rice': 0.82
      },
      'pork': {
        'couscous': 0.94,
        'sweet potato': 0.92,
        'egg noodles': 0.90,
        'white rice': 0.88,
        'jasmine rice': 0.85,
        'potatoes': 0.83
      },
      'lamb': {
        'basmati rice': 0.98,
        'couscous': 0.96,
        'fettuccine': 0.92,
        'brown rice': 0.88,
        'white rice': 0.84
      }
    };
  }

  /**
   * Initialize transformation templates for different format + flavor combinations
   */
  initializeTransformationTemplates() {
    return {
      'salad-spicy': {
        additions: ['jalapeños', 'lime dressing', 'cilantro'],
        removals: ['heavy sauces'],
        cookMethod: 'raw or lightly grilled'
      },
      'soup-umami': {
        additions: ['mushroom broth', 'miso', 'soy sauce'],
        removals: ['cream-based'],
        cookMethod: 'simmered in broth'
      },
      'pasta-fresh': {
        additions: ['basil', 'lemon zest', 'light oil'],
        removals: ['heavy cream'],
        cookMethod: 'tossed with light sauce'
      }
    };
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SeasoningPairingEngine;
}
