/**
 * Recipe Converter Tool
 * Converts recipes from various formats into the Dig In recipe card format
 */

class RecipeConverter {
  /**
   * Convert raw recipe data to Dig In format
   * @param {Object} rawRecipe - Recipe with name, ingredients, instructions, etc.
   * @returns {Object} Formatted recipe for recipe cards
   */
  static formatRecipe(rawRecipe) {
    return {
      id: rawRecipe.id || this.generateId(),
      name: rawRecipe.name,
      cuisine: rawRecipe.cuisine || 'Dessert',
      difficulty: rawRecipe.difficulty || this.estimateDifficulty(rawRecipe),
      skillLevel: rawRecipe.skillLevel || this.estimateDifficulty(rawRecipe),
      prepTime: rawRecipe.prepTime || 15,
      cookTime: rawRecipe.cookTime || 10,
      totalTime: (rawRecipe.prepTime || 15) + (rawRecipe.cookTime || 10),
      description: rawRecipe.description,
      rating: rawRecipe.rating || 4,
      ingredients: rawRecipe.ingredients || [],
      instructions: rawRecipe.instructions || [],
      tips: rawRecipe.tips || [],
      pixelEmoji: rawRecipe.pixelEmoji || 'DISH',
      pixelArtUrl: rawRecipe.pixelArtUrl || null,
      imageUrl: rawRecipe.imageUrl || null,
      substitutions: rawRecipe.substitutions || {},
      servings: rawRecipe.servings || 24,
      calories: rawRecipe.calories || null,
      protein: rawRecipe.protein || null,
      carbs: rawRecipe.carbs || null,
      fat: rawRecipe.fat || null,
      fiber: rawRecipe.fiber || null,
      sodium: rawRecipe.sodium || null,
      sugar: rawRecipe.sugar || null,
      cholesterol: rawRecipe.cholesterol || null,
      allergens: rawRecipe.allergens || [],
      dietary: rawRecipe.dietary || []
    };
  }

  static estimateDifficulty(recipe) {
    const ingredientCount = (recipe.ingredients || []).length;
    const stepCount = (recipe.instructions || []).length;
    const totalComplexity = ingredientCount + stepCount;

    if (totalComplexity <= 10) return 'Easy';
    if (totalComplexity <= 20) return 'Medium';
    return 'Hard';
  }

  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Parse text recipe (from copy-paste) into structured format
   * @param {String} text - Raw recipe text
   * @returns {Object} Parsed recipe
   */
  static parseTextRecipe(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let recipe = {
      name: lines[0] || 'Unnamed Recipe',
      ingredients: [],
      instructions: [],
      tips: []
    };

    let currentSection = null;
    let ingredientStartIdx = 0;
    let instructionStartIdx = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();

      if (line.includes('ingredient') && !line.includes('instruction')) {
        currentSection = 'ingredients';
        ingredientStartIdx = i + 1;
      } else if (line.includes('instruction') || line.includes('direction') || line.includes('step')) {
        currentSection = 'instructions';
        instructionStartIdx = i + 1;
      } else if (line.includes('tip') || line.includes('note')) {
        currentSection = 'tips';
      } else if (currentSection === 'ingredients' && lines[i].match(/^\d+.*cup|tbsp|tsp|oz|g|ml/i)) {
        recipe.ingredients.push(lines[i]);
      } else if (currentSection === 'instructions' && (lines[i].match(/^\d+\./) || lines[i].match(/^-/) || lines[i].match(/^•/))) {
        recipe.instructions.push(lines[i].replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, ''));
      } else if (currentSection === 'tips') {
        recipe.tips.push(lines[i]);
      }
    }

    return recipe;
  }

  /**
   * Batch convert multiple recipes
   * @param {Array} recipes - Array of raw recipes
   * @returns {Array} Formatted recipes
   */
  static batchFormat(recipes) {
    return recipes.map((recipe, idx) => {
      const formatted = this.formatRecipe(recipe);
      if (!formatted.id) formatted.id = idx + 1;
      return formatted;
    });
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RecipeConverter;
}
