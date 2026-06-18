/**
 * Recipe Remix Engine
 * Transforms recipes into different formats and dietary versions
 */

class RecipeRemixEngine {
  constructor() {
    this.formatTemplates = this.initializeFormatTemplates();
    this.dietarySubstitutions = this.initializeDietarySubstitutions();
    this.seasoningRecommendations = this.initializeSeasoningRecommendations();
  }

  /**
   * Generate a remixed version of a recipe
   */
  generateRemix(recipe, format, dietaryOptions = []) {
    if (!recipe) return null;

    let remixed = JSON.parse(JSON.stringify(recipe)); // Deep copy

    // Apply format transformation
    if (format && this.formatTemplates[format]) {
      remixed = this.applyFormatTransformation(remixed, format);
    }

    // Apply dietary substitutions
    if (dietaryOptions && dietaryOptions.length > 0) {
      remixed = this.applyDietarySubstitutions(remixed, dietaryOptions);
    }

    // Add remix metadata
    remixed.remix_metadata = {
      original_name: recipe.name,
      format: format,
      dietary_options: dietaryOptions,
      generated_at: new Date().toISOString(),
      remix_notes: this.generateRemixNotes(recipe, format, dietaryOptions)
    };

    return remixed;
  }

  /**
   * Transform recipe into specified format
   */
  applyFormatTransformation(recipe, format) {
    const template = this.formatTemplates[format];
    if (!template) return recipe;

    recipe.name = `${recipe.name} as a ${format}`;
    recipe.description = template.description(recipe);
    recipe.instructions = template.instructions(recipe);
    recipe.ingredients = template.ingredients(recipe);
    recipe.prepTime = Math.ceil(recipe.prepTime * template.prepTimeMultiplier);
    recipe.cookTime = Math.ceil(recipe.cookTime * template.cookTimeMultiplier);
    recipe.seasonings = [...new Set([...recipe.seasonings, ...template.additionalSeasonings])];
    recipe.format = format;

    return recipe;
  }

  /**
   * Apply dietary substitutions to recipe
   */
  applyDietarySubstitutions(recipe, dietaryOptions) {
    let ingredients = [...recipe.ingredients];
    let removedItems = [];
    let substitutions = [];

    for (const diet of dietaryOptions) {
      if (this.dietarySubstitutions[diet]) {
        const subs = this.dietarySubstitutions[diet].substitutions;

        ingredients = ingredients.map(ing => {
          for (const [original, substitute] of Object.entries(subs)) {
            if (this.ingredientMatches(ing, original)) {
              substitutions.push({
                original: ing,
                substitute: substitute,
                reason: this.dietarySubstitutions[diet].reason
              });
              return substitute;
            }
          }
          return ing;
        });

        // Remove incompatible items
        ingredients = ingredients.filter(ing => {
          const incompatible = this.dietarySubstitutions[diet].incompatible || [];
          for (const item of incompatible) {
            if (this.ingredientMatches(ing, item)) {
              removedItems.push(ing);
              return false;
            }
          }
          return true;
        });
      }
    }

    recipe.ingredients = ingredients;
    recipe.dietary_info = {
      options: dietaryOptions,
      substitutions: substitutions,
      removed_items: removedItems
    };
    recipe.description += ` (${dietaryOptions.join(', ').toUpperCase()})`;

    return recipe;
  }

  /**
   * Check if ingredient string matches a pattern
   */
  ingredientMatches(ingredient, pattern) {
    const ingLower = ingredient.toLowerCase();
    const patLower = pattern.toLowerCase();
    return ingLower.includes(patLower) || patLower.includes(ingLower.split(',')[0]);
  }

  /**
   * Generate notes explaining the remix
   */
  generateRemixNotes(recipe, format, dietaryOptions) {
    const notes = [];

    if (format) {
      const formatNote = {
        'salad': 'Transformed into a fresh salad with the core flavors intact. Serve cold.',
        'sandwich': 'Adapted as a fillable sandwich. Use bread or wraps to contain ingredients.',
        'soup': 'Converted to a warming soup by reducing ingredients to smaller pieces and adding broth.',
        'pasta': 'Reimagined as a pasta dish with complementary sauce and noodles.',
        'one_pot': 'Simplified into a one-pot meal for easier cleanup.',
        'smoothie_bowl': 'Blended and served as a creamy bowl with toppings.',
        'overnight_oats': 'Converted to an overnight oats breakfast by mixing with oats and milk.',
        'wrap': 'Adapted as a portable wrap with tortilla or flatbread.',
        'parfait': 'Layered into a parfait with complementary flavors and textures.'
      };
      notes.push(formatNote[format] || `Transformed into a ${format}`);
    }

    if (dietaryOptions && dietaryOptions.length > 0) {
      notes.push(`Adapted for ${dietaryOptions.join(', ')} diets with appropriate substitutions.`);
    }

    return notes.join(' ');
  }

  /**
   * Format templates for different recipe styles
   */
  initializeFormatTemplates() {
    return {
      'salad': {
        description: (recipe) => `${recipe.name} reimagined as a fresh, cold salad with vibrant flavors and textures`,
        instructions: (recipe) => [
          'Prepare all ingredients as directed in original recipe',
          'Cool ingredients completely',
          'Arrange on bed of mixed greens or serve as grain salad',
          'Dress with olive oil and vinegar or preferred dressing',
          'Serve immediately and enjoy cold'
        ],
        ingredients: (recipe) => [
          '3-4 cups mixed greens or grains',
          ...recipe.ingredients.filter(i => !i.toLowerCase().includes('water') && !i.toLowerCase().includes('oil for frying')),
          '2 tbsp extra virgin olive oil',
          '1 tbsp vinegar'
        ],
        prepTimeMultiplier: 0.8,
        cookTimeMultiplier: 0.5,
        additionalSeasonings: ['vinegar', 'lemon']
      },

      'sandwich': {
        description: (recipe) => `${recipe.name} adapted as a delicious, portable sandwich`,
        instructions: (recipe) => [
          'Prepare core ingredients according to original recipe',
          'Toast bread if desired',
          'Spread base condiment on bread',
          'Layer prepared ingredients on bread',
          'Top with second slice and cut diagonally',
          'Serve immediately'
        ],
        ingredients: (recipe) => [
          '2 slices bread or 1 roll',
          ...recipe.ingredients.slice(0, 5),
          'Condiment of choice (mayo, mustard, etc.)',
          'Lettuce and tomato (optional)'
        ],
        prepTimeMultiplier: 0.3,
        cookTimeMultiplier: 0.2,
        additionalSeasonings: ['mayonnaise', 'mustard']
      },

      'soup': {
        description: (recipe) => `${recipe.name} transformed into a warming, comforting soup`,
        instructions: (recipe) => [
          'Prepare all ingredients into small, uniform pieces',
          'Heat broth in large pot',
          'Add ingredients in order of cooking time needed',
          'Simmer until all vegetables are tender',
          'Season to taste and serve hot',
          'Garnish with fresh herbs'
        ],
        ingredients: (recipe) => [
          '1 liter vegetable or chicken broth',
          ...recipe.ingredients.filter(i => !i.toLowerCase().includes('oil for frying')),
          'Salt and pepper to taste'
        ],
        prepTimeMultiplier: 0.6,
        cookTimeMultiplier: 0.8,
        additionalSeasonings: ['broth', 'herbs']
      },

      'pasta': {
        description: (recipe) => `${recipe.name} reimagined as a delicious pasta dish`,
        instructions: (recipe) => [
          'Cook pasta according to package directions until al dente',
          'Prepare sauce from recipe ingredients',
          'Drain pasta and toss with sauce',
          'Add pasta water if needed for consistency',
          'Top with grated cheese and fresh herbs',
          'Serve immediately'
        ],
        ingredients: (recipe) => [
          '300g pasta of choice',
          ...recipe.ingredients.filter(i => !i.toLowerCase().includes('oil for frying')),
          'Salt for pasta water',
          'Grated Parmesan cheese'
        ],
        prepTimeMultiplier: 0.7,
        cookTimeMultiplier: 0.6,
        additionalSeasonings: ['parmesan', 'basil']
      },

      'one_pot': {
        description: (recipe) => `${recipe.name} simplified into an easy, one-pot meal`,
        instructions: (recipe) => [
          'Add all ingredients to large pot in order of cooking time',
          'Add enough liquid to cover ingredients',
          'Bring to boil, then reduce to simmer',
          'Cook until everything is tender',
          'Stir occasionally and adjust seasoning',
          'Serve directly from pot'
        ],
        ingredients: (recipe) => [
          '2 cups liquid (broth or water)',
          ...recipe.ingredients.filter(i => !i.toLowerCase().includes('oil for frying')),
          'Salt and pepper to taste'
        ],
        prepTimeMultiplier: 0.5,
        cookTimeMultiplier: 0.9,
        additionalSeasonings: ['salt', 'pepper']
      }
    };
  }

  /**
   * Dietary substitution rules
   */
  initializeDietarySubstitutions() {
    return {
      'vegan': {
        reason: 'No animal products',
        substitutions: {
          'egg': 'flax egg (1 tbsp ground flax + 3 tbsp water)',
          'dairy': 'coconut milk or almond milk',
          'butter': 'coconut oil or olive oil',
          'milk': 'almond milk, oat milk, or coconut milk',
          'cheese': 'nutritional yeast or vegan cheese',
          'meat': 'tofu, tempeh, seitan, or legumes',
          'fish': 'hearts of palm, tofu, or seaweed',
          'honey': 'agave syrup or maple syrup'
        },
        incompatible: ['meat', 'fish', 'chicken', 'beef', 'pork', 'egg', 'dairy', 'cheese', 'butter', 'milk']
      },

      'vegetarian': {
        reason: 'No meat or fish',
        substitutions: {
          'meat': 'chickpeas, lentils, beans, or tofu',
          'fish': 'mushrooms, eggplant, or chickpeas',
          'chicken': 'tofu or tempeh',
          'beef': 'lentils or beans'
        },
        incompatible: ['meat', 'fish', 'chicken', 'beef', 'pork']
      },

      'gluten_free': {
        reason: 'No wheat, barley, or rye',
        substitutions: {
          'flour': 'almond flour, rice flour, or GF flour blend',
          'wheat': 'rice flour or cornstarch',
          'bread': 'GF bread or rice cakes',
          'pasta': 'rice pasta, chickpea pasta, or zucchini noodles',
          'soy sauce': 'tamari or coconut aminos'
        },
        incompatible: ['flour', 'bread', 'pasta', 'wheat', 'barley', 'rye']
      },

      'pescatarian': {
        reason: 'Fish and seafood, no other meat',
        substitutions: {
          'meat': 'fish, shrimp, scallops, or octopus',
          'chicken': 'salmon, cod, or other white fish',
          'beef': 'tuna or mackerel'
        },
        incompatible: ['meat', 'chicken', 'beef', 'pork']
      },

      'low_sodium': {
        reason: 'Reduced salt content',
        substitutions: {
          'salt': 'reduce by 50% or use salt-free seasoning',
          'soy sauce': 'low-sodium soy sauce or tamari',
          'broth': 'low-sodium broth'
        },
        incompatible: []
      }
    };
  }

  /**
   * Seasoning recommendations for different formats
   */
  initializeSeasoningRecommendations() {
    return {
      'salad': ['vinegar', 'lemon', 'olive oil', 'dijon mustard'],
      'sandwich': ['mayonnaise', 'mustard', 'salt', 'pepper'],
      'soup': ['thyme', 'bay leaf', 'parsley', 'salt'],
      'pasta': ['basil', 'oregano', 'garlic', 'parmesan'],
      'one_pot': ['thyme', 'rosemary', 'salt', 'pepper'],
      'smoothie_bowl': ['honey', 'vanilla', 'cinnamon'],
      'overnight_oats': ['honey', 'vanilla', 'cinnamon', 'nuts'],
      'wrap': ['lime', 'cilantro', 'cumin'],
      'parfait': ['vanilla', 'honey', 'nuts', 'cinnamon']
    };
  }

  /**
   * Get seasoning recommendations for recipe
   */
  getSeasoningRecommendations(format) {
    return this.seasoningRecommendations[format] || [];
  }

  /**
   * Get time variant version of recipe
   */
  getTimeVariant(recipe, variant = 'full') {
    if (!recipe.time_variants || !recipe.time_variants[variant]) {
      return recipe;
    }

    let variantRecipe = JSON.parse(JSON.stringify(recipe));
    const variantData = recipe.time_variants[variant];

    variantRecipe.prepTime = variantData.prep_time;
    variantRecipe.cookTime = variantData.cook_time;
    variantRecipe.name = `${recipe.name} (${variantData.label})`;
    variantRecipe.description = `${recipe.description} - ${variantData.notes}`;

    // Adjust ingredients and instructions for quick/express versions
    if (variant === 'quick' || variant === 'express') {
      variantRecipe.instructions = [
        ...variantRecipe.instructions.slice(0, 2),
        '(Use pre-cut or pre-cooked ingredients to save time)',
        ...variantRecipe.instructions.slice(2)
      ];
    }

    return variantRecipe;
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RecipeRemixEngine;
}
