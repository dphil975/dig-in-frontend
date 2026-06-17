/**
 * Mrs. Fields Cookie Recipes
 * Complete recipe database for Dig In Recipe Card System
 * Easy to download, import, and extend
 */

const RECIPES = {
  recipes: [
    {
      id: 101,
      name: "Original Chocolate Chip Cookie",
      cuisine: "American",
      difficulty: "Easy",
      skillLevel: "Easy",
      prepTime: 15,
      cookTime: 12,
      totalTime: 27,
      description: "The iconic Mrs. Fields chocolate chip cookie - buttery, loaded with chocolate, and perfectly chewy.",
      rating: 5,
      servings: 24,
      ingredients: [
        "2 1/4 cups all-purpose flour",
        "1 tsp baking soda",
        "1 tsp salt",
        "1 cup butter, softened",
        "3/4 cup granulated sugar",
        "3/4 cup packed brown sugar",
        "2 large eggs",
        "2 tsp vanilla extract",
        "2 cups chocolate chips",
        "1 cup chopped walnuts (optional)"
      ],
      instructions: [
        "Preheat oven to 375°F (190°C)",
        "In a small bowl, combine flour, baking soda, and salt",
        "In a large bowl, beat butter and both sugars until creamy",
        "Add eggs and vanilla to butter mixture; beat well",
        "Gradually stir in flour mixture",
        "Fold in chocolate chips and nuts",
        "Drop rounded tablespoons onto ungreased baking sheets",
        "Bake 9-12 minutes until golden brown",
        "Cool on baking sheets for 2 minutes, then move to wire racks"
      ],
      tips: [
        "Use room temperature butter for better mixing",
        "Don't overbake - cookies will continue cooking after removed from oven",
        "For chewier cookies, slightly underbake them",
        "Fresh vanilla extract makes a big difference in flavor",
        "Let cookies cool on the baking sheet for 2 minutes to set properly"
      ],
      pixelEmoji: "🍪",
      pixelArtUrl: null,
      imageUrl: null,
      substitutions: {
        "Butter": "Margarine or coconut oil",
        "Chocolate chips": "Butterscotch, peanut butter, or white chocolate chips",
        "Walnuts": "Pecans, macadamia nuts, or omit"
      },
      calories: 210,
      protein: 2.5,
      carbs: 25,
      fat: 12,
      fiber: 0.8,
      sodium: 210,
      sugar: 18,
      cholesterol: 30,
      allergens: ["wheat", "eggs", "tree nuts", "soy"],
      dietary: []
    },
    {
      id: 102,
      name: "Double Fudge Brownie",
      cuisine: "American",
      difficulty: "Medium",
      skillLevel: "Medium",
      prepTime: 20,
      cookTime: 15,
      totalTime: 35,
      description: "Rich, fudgy brownies with intense chocolate flavor - a decadent treat for chocolate lovers.",
      rating: 5,
      servings: 16,
      ingredients: [
        "1/2 cup butter",
        "1 cup granulated sugar",
        "2 large eggs",
        "1/3 cup unsweetened cocoa powder",
        "1/2 cup all-purpose flour",
        "1/4 tsp salt",
        "1/4 tsp baking powder",
        "1 tsp vanilla extract",
        "6 oz semi-sweet chocolate, chopped",
        "1/2 cup chocolate chips"
      ],
      instructions: [
        "Preheat oven to 350°F (175°C); grease a 9x9 inch baking pan",
        "Melt butter and stir in sugar, eggs, and vanilla",
        "Beat in cocoa powder until smooth",
        "Combine flour, salt, and baking powder in a separate bowl",
        "Stir dry ingredients into chocolate mixture",
        "Fold in chopped chocolate and chocolate chips",
        "Pour into prepared pan",
        "Bake 12-15 minutes until a toothpick comes out with moist crumbs",
        "Cool completely before cutting into squares"
      ],
      tips: [
        "Don't overbake brownies - fudgy texture is key",
        "Use good quality chocolate for best flavor",
        "A toothpick should show moist crumbs, not be completely clean",
        "Cool brownies completely before cutting to avoid crumbling",
        "Store in an airtight container for 3-4 days"
      ],
      pixelEmoji: "🍫",
      pixelArtUrl: null,
      imageUrl: null,
      substitutions: {
        "Butter": "Coconut oil",
        "Semi-sweet chocolate": "Dark or milk chocolate",
        "Chocolate chips": "Macadamia nuts or dried cherries"
      },
      calories: 240,
      protein: 3,
      carbs: 28,
      fat: 14,
      fiber: 1.2,
      sodium: 120,
      sugar: 22,
      cholesterol: 35,
      allergens: ["wheat", "eggs", "soy"],
      dietary: []
    },
    {
      id: 103,
      name: "Pecan Pie Cookie",
      cuisine: "American",
      difficulty: "Medium",
      skillLevel: "Medium",
      prepTime: 20,
      cookTime: 13,
      totalTime: 33,
      description: "Buttery cookie with pecan pie filling - combines two classic desserts in one delicious treat.",
      rating: 5,
      servings: 18,
      ingredients: [
        "1 cup butter, softened",
        "3/4 cup granulated sugar",
        "3/4 cup brown sugar",
        "2 large eggs",
        "1 tsp vanilla extract",
        "2 1/4 cups all-purpose flour",
        "1 tsp baking soda",
        "1/2 tsp salt",
        "1 1/2 cups pecan pieces",
        "3/4 cup toffee chips"
      ],
      instructions: [
        "Preheat oven to 375°F (190°C)",
        "Beat butter and sugars until creamy",
        "Add eggs and vanilla; beat well",
        "Combine flour, baking soda, and salt",
        "Gradually mix dry ingredients into wet mixture",
        "Fold in pecans and toffee chips",
        "Drop rounded tablespoons onto baking sheets",
        "Bake 10-13 minutes until edges are golden",
        "Cool on baking sheet 2 minutes, transfer to wire rack"
      ],
      tips: [
        "Toast pecans lightly before adding for enhanced flavor",
        "Toffee chips add a nice caramel sweetness",
        "Don't overbake - cookies should be slightly soft in center",
        "These cookies store well in an airtight container",
        "You can make dough ahead and refrigerate for later baking"
      ],
      pixelEmoji: "🥜",
      pixelArtUrl: null,
      imageUrl: null,
      substitutions: {
        "Pecans": "Walnuts, macadamia nuts, or almonds",
        "Toffee chips": "Butterscotch chips or chocolate chips",
        "Brown sugar": "All granulated sugar (slightly less sweet)"
      },
      calories: 280,
      protein: 3,
      carbs: 31,
      fat: 16,
      fiber: 1,
      sodium: 240,
      sugar: 24,
      cholesterol: 28,
      allergens: ["wheat", "eggs", "tree nuts"],
      dietary: []
    },
    {
      id: 104,
      name: "Cinnamon Sugar Cookie",
      cuisine: "American",
      difficulty: "Easy",
      skillLevel: "Easy",
      prepTime: 15,
      cookTime: 10,
      totalTime: 25,
      description: "Classic snickerdoodle-style cookie with warm cinnamon-sugar coating and soft, pillowy texture.",
      rating: 4,
      servings: 24,
      ingredients: [
        "2 3/4 cups all-purpose flour",
        "1 tsp baking soda",
        "1/2 tsp salt",
        "1 cup butter, softened",
        "1 1/2 cups granulated sugar",
        "1 large egg",
        "1 tsp vanilla extract",
        "2 tbsp granulated sugar (for coating)",
        "1 tbsp ground cinnamon (for coating)"
      ],
      instructions: [
        "Preheat oven to 375°F (190°C)",
        "Mix flour, baking soda, and salt in a bowl",
        "In another bowl, beat butter and sugar until light and fluffy",
        "Add egg and vanilla to butter mixture",
        "Gradually blend in flour mixture",
        "In a small bowl, mix cinnamon and sugar for coating",
        "Roll dough into balls and coat in cinnamon-sugar",
        "Place 2 inches apart on ungreased baking sheets",
        "Bake 8-10 minutes until set",
        "Cool on baking sheets 1 minute before transferring"
      ],
      tips: [
        "Use a cookie scoop for uniform size and even baking",
        "The cinnamon-sugar coating is essential for flavor",
        "Don't overbake - these cookies should be soft in the middle",
        "These are best enjoyed fresh but store well for 3-4 days",
        "Great for dunking in milk or coffee!"
      ],
      pixelEmoji: "✨",
      pixelArtUrl: null,
      imageUrl: null,
      substitutions: {
        "Cinnamon": "Cardamom or nutmeg for different spice",
        "Butter": "Margarine or coconut oil",
        "Sugar coating": "Granulated sugar or vanilla sugar"
      },
      calories: 190,
      protein: 2,
      carbs: 24,
      fat: 10,
      fiber: 0.5,
      sodium: 200,
      sugar: 16,
      cholesterol: 25,
      allergens: ["wheat", "eggs"],
      dietary: []
    },
    {
      id: 105,
      name: "White Chocolate Macadamia",
      cuisine: "American",
      difficulty: "Easy",
      skillLevel: "Easy",
      prepTime: 15,
      cookTime: 12,
      totalTime: 27,
      description: "Tropical vibes meet decadent white chocolate in this creamy, buttery cookie loaded with macadamia nuts.",
      rating: 5,
      servings: 24,
      ingredients: [
        "2 1/4 cups all-purpose flour",
        "1 tsp baking soda",
        "1 tsp salt",
        "1 cup butter, softened",
        "3/4 cup granulated sugar",
        "3/4 cup packed brown sugar",
        "2 large eggs",
        "2 tsp vanilla extract",
        "2 cups white chocolate chunks or chips",
        "1 1/2 cups macadamia nuts, chopped"
      ],
      instructions: [
        "Preheat oven to 375°F (190°C)",
        "Combine flour, baking soda, and salt",
        "Beat butter and sugars until creamy",
        "Add eggs and vanilla; beat well",
        "Gradually stir in flour mixture",
        "Fold in white chocolate and macadamia nuts",
        "Drop rounded tablespoons onto ungreased baking sheets",
        "Bake 10-12 minutes until golden",
        "Cool on baking sheets 2 minutes, then transfer to wire racks"
      ],
      tips: [
        "Macadamia nuts are expensive but worth it for superior flavor",
        "You can substitute with cashews or almonds for a budget option",
        "White chocolate burns easily, so watch for golden edges",
        "Store these separately from chocolate chip cookies to avoid flavor transfer",
        "Freezer-friendly dough - scoop and freeze for bake-anytime cookies"
      ],
      pixelEmoji: "🥥",
      pixelArtUrl: null,
      imageUrl: null,
      substitutions: {
        "Macadamia nuts": "Cashews, almonds, or hazelnuts",
        "White chocolate": "Vanilla chips or coconut flakes",
        "Butter": "Coconut oil for tropical vibe"
      },
      calories: 280,
      protein: 3,
      carbs: 28,
      fat: 18,
      fiber: 0.8,
      sodium: 210,
      sugar: 21,
      cholesterol: 28,
      allergens: ["wheat", "eggs", "tree nuts", "milk"],
      dietary: []
    },
    {
      id: 106,
      name: "Raspberry White Chocolate",
      cuisine: "American",
      difficulty: "Medium",
      skillLevel: "Medium",
      prepTime: 20,
      cookTime: 12,
      totalTime: 32,
      description: "Elegant cookie featuring tart raspberries and creamy white chocolate for a sophisticated flavor combination.",
      rating: 4,
      servings: 20,
      ingredients: [
        "2 1/2 cups all-purpose flour",
        "1 tsp baking powder",
        "1/2 tsp salt",
        "1 cup butter, softened",
        "2/3 cup granulated sugar",
        "2/3 cup powdered sugar",
        "2 large eggs",
        "2 tsp vanilla extract",
        "1 tsp lemon zest",
        "1 1/2 cups white chocolate chips",
        "1 cup fresh raspberries (or frozen, thawed)"
      ],
      instructions: [
        "Preheat oven to 350°F (175°C)",
        "Whisk together flour, baking powder, and salt",
        "Cream butter with both sugars until light and fluffy",
        "Beat in eggs, vanilla, and lemon zest",
        "Gently fold in flour mixture",
        "Carefully fold in white chocolate chips and raspberries",
        "Drop onto parchment-lined baking sheets",
        "Bake 10-12 minutes until edges are set but centers still soft",
        "Cool on baking sheet 3 minutes before transferring"
      ],
      tips: [
        "Use fresh raspberries when possible for best flavor",
        "Gently fold raspberries to avoid crushing them",
        "Lemon zest brightens the raspberry flavor beautifully",
        "Don't overbake - raspberries can become bitter if overcooked",
        "Best enjoyed within 1-2 days of baking"
      ],
      pixelEmoji: "🫐",
      pixelArtUrl: null,
      imageUrl: null,
      substitutions: {
        "Raspberries": "Strawberries, blueberries, or blackberries",
        "Lemon zest": "Lime zest for different citrus note",
        "White chocolate": "Dark chocolate for contrast"
      },
      calories: 240,
      protein: 2.5,
      carbs: 26,
      fat: 14,
      fiber: 1,
      sodium: 180,
      sugar: 19,
      cholesterol: 32,
      allergens: ["wheat", "eggs", "milk"],
      dietary: []
    },
    {
      id: 107,
      name: "Oatmeal Raisin Cookie",
      cuisine: "American",
      difficulty: "Easy",
      skillLevel: "Easy",
      prepTime: 15,
      cookTime: 11,
      totalTime: 26,
      description: "Wholesome oatmeal cookie loaded with plump raisins and warm spices - a timeless classic.",
      rating: 4,
      servings: 24,
      ingredients: [
        "1 1/2 cups all-purpose flour",
        "1 tsp baking soda",
        "1 tsp ground cinnamon",
        "1/2 tsp ground nutmeg",
        "1/4 tsp ground cloves",
        "1/2 tsp salt",
        "1 cup butter, softened",
        "1 cup packed brown sugar",
        "2 large eggs",
        "1 tsp vanilla extract",
        "3 cups old-fashioned oats",
        "1 1/2 cups raisins"
      ],
      instructions: [
        "Preheat oven to 375°F (190°C)",
        "Combine flour, baking soda, spices, and salt",
        "Beat butter and brown sugar until creamy",
        "Add eggs and vanilla; beat well",
        "Gradually stir in flour mixture",
        "Mix in oats until combined",
        "Fold in raisins",
        "Drop rounded tablespoons onto ungreased baking sheets",
        "Bake 9-11 minutes until edges are golden",
        "Cool on baking sheets 2 minutes before transferring"
      ],
      tips: [
        "Soak raisins in warm water for 10 minutes before baking for plumper texture",
        "Toast the spices in a dry pan to enhance their flavor",
        "Use old-fashioned oats, not instant, for better texture",
        "These cookies are hearty and satisfying - perfect for breakfast",
        "Great with a glass of milk or hot tea"
      ],
      pixelEmoji: "🌾",
      pixelArtUrl: null,
      imageUrl: null,
      substitutions: {
        "Raisins": "Cranberries, dates, or dried cherries",
        "Oats": "Instant oats (texture will be softer)",
        "Spices": "Just cinnamon if you prefer simpler flavor"
      },
      calories: 220,
      protein: 3,
      carbs: 32,
      fat: 10,
      fiber: 2,
      sodium: 220,
      sugar: 20,
      cholesterol: 25,
      allergens: ["wheat", "eggs"],
      dietary: []
    },
    {
      id: 108,
      name: "Peanut Butter Chocolate Cup",
      cuisine: "American",
      difficulty: "Medium",
      skillLevel: "Medium",
      prepTime: 20,
      cookTime: 11,
      totalTime: 31,
      description: "A dessert lover's dream - creamy peanut butter cookies with melted chocolate cups inside.",
      rating: 5,
      servings: 20,
      ingredients: [
        "1 1/2 cups all-purpose flour",
        "3/4 tsp baking soda",
        "1/2 tsp salt",
        "3/4 cup creamy peanut butter",
        "1/2 cup butter, softened",
        "1/2 cup granulated sugar",
        "1/2 cup packed brown sugar",
        "1 large egg",
        "1 tsp vanilla extract",
        "20 miniature chocolate peanut butter cups"
      ],
      instructions: [
        "Preheat oven to 375°F (190°C)",
        "Combine flour, baking soda, and salt",
        "Beat peanut butter and butter until blended",
        "Add both sugars; beat until creamy",
        "Add egg and vanilla; beat well",
        "Gradually stir in flour mixture",
        "Roll dough into balls, then flatten slightly",
        "Place a chocolate peanut butter cup in center and cover with dough",
        "Bake 9-11 minutes until edges are golden",
        "Cool on baking sheets 2 minutes before transferring"
      ],
      tips: [
        "Use good quality chocolate peanut butter cups for best taste",
        "Make sure to completely cover the cup with dough",
        "Cookie should still feel soft when removed from oven",
        "These are best enjoyed fresh while chocolate is still slightly soft",
        "Can be made ahead and reheated for 30 seconds in microwave"
      ],
      pixelEmoji: "🥜",
      pixelArtUrl: null,
      imageUrl: null,
      substitutions: {
        "Peanut butter": "Almond butter or cashew butter",
        "Chocolate cups": "Any chocolate candy (M&Ms, Hershey's Kisses)",
        "Brown sugar": "All granulated for less molasses flavor"
      },
      calories: 290,
      protein: 7,
      carbs: 28,
      fat: 17,
      fiber: 1.5,
      sodium: 240,
      sugar: 20,
      cholesterol: 20,
      allergens: ["wheat", "eggs", "peanuts", "milk"],
      dietary: []
    },
    {
      id: 109,
      name: "Triple Chocolate Chunk",
      cuisine: "American",
      difficulty: "Medium",
      skillLevel: "Medium",
      prepTime: 20,
      cookTime: 13,
      totalTime: 33,
      description: "For serious chocolate lovers - packed with semi-sweet, dark, and white chocolate for ultimate indulgence.",
      rating: 5,
      servings: 22,
      ingredients: [
        "2 1/4 cups all-purpose flour",
        "1 tsp baking soda",
        "1 tsp salt",
        "1 cup butter, softened",
        "3/4 cup granulated sugar",
        "3/4 cup packed brown sugar",
        "2 large eggs",
        "2 tsp vanilla extract",
        "3/4 cup semi-sweet chocolate chunks",
        "3/4 cup dark chocolate chunks",
        "3/4 cup white chocolate chunks"
      ],
      instructions: [
        "Preheat oven to 375°F (190°C)",
        "Mix flour, baking soda, and salt",
        "Cream butter and both sugars",
        "Add eggs and vanilla; beat well",
        "Gradually stir in flour mixture",
        "Fold in all three types of chocolate chunks",
        "Drop rounded tablespoons onto ungreased baking sheets",
        "Bake 11-13 minutes until edges are golden",
        "Cool on baking sheets 2 minutes before transferring to wire racks"
      ],
      tips: [
        "Buy chocolate chunks instead of chips for more melty goodness",
        "Chop a chocolate bar into chunks for even better quality",
        "Mix chocolate types for complex, sophisticated flavor",
        "Don't overbake - slightly underbaking creates chewier cookies",
        "Store in airtight container with parchment between layers"
      ],
      pixelEmoji: "🍫",
      pixelArtUrl: null,
      imageUrl: null,
      substitutions: {
        "Semi-sweet chocolate": "Milk chocolate or extra dark chocolate",
        "White chocolate": "Caramel or butterscotch chips",
        "Butter": "Coconut oil for different flavor profile"
      },
      calories: 260,
      protein: 3,
      carbs: 28,
      fat: 15,
      fiber: 1.2,
      sodium: 210,
      sugar: 21,
      cholesterol: 30,
      allergens: ["wheat", "eggs", "milk", "soy"],
      dietary: []
    },
    {
      id: 110,
      name: "Toffee Almond Cookie",
      cuisine: "American",
      difficulty: "Easy",
      skillLevel: "Easy",
      prepTime: 15,
      cookTime: 11,
      totalTime: 26,
      description: "Buttery cookie studded with crunchy toffee bits and toasted almonds for sweet, nutty perfection.",
      rating: 4,
      servings: 24,
      ingredients: [
        "2 1/4 cups all-purpose flour",
        "1 tsp baking soda",
        "1 tsp salt",
        "1 cup butter, softened",
        "3/4 cup granulated sugar",
        "3/4 cup packed brown sugar",
        "2 large eggs",
        "1 tsp vanilla extract",
        "1 cup toffee bits",
        "1 cup sliced almonds, toasted"
      ],
      instructions: [
        "Preheat oven to 375°F (190°C)",
        "Combine flour, baking soda, and salt",
        "Beat butter and sugars until creamy",
        "Add eggs and vanilla; beat well",
        "Gradually stir in flour mixture",
        "Fold in toffee bits and toasted almonds",
        "Drop rounded tablespoons onto ungreased baking sheets",
        "Bake 9-11 minutes until golden",
        "Cool on baking sheets 2 minutes before transferring"
      ],
      tips: [
        "Toast almonds in a 350°F oven for 8-10 minutes for best flavor",
        "Toffee bits can be found in the baking aisle",
        "Don't stir toffee bits too much into dough to prevent melting",
        "These cookies have great texture contrast - crispy outside, chewy inside",
        "Make great gifts packaged in decorative containers"
      ],
      pixelEmoji: "🧀",
      pixelArtUrl: null,
      imageUrl: null,
      substitutions: {
        "Almonds": "Pecans, walnuts, or hazelnuts",
        "Toffee bits": "Heath bar pieces or butterscotch chips",
        "Brown sugar": "All granulated for crispier cookie"
      },
      calories: 270,
      protein: 3.5,
      carbs: 26,
      fat: 17,
      fiber: 1,
      sodium: 240,
      sugar: 19,
      cholesterol: 28,
      allergens: ["wheat", "eggs", "tree nuts"],
      dietary: []
    }
  ]
};

/**
 * Export for different module systems
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RECIPES;
}

/**
 * Download recipes as JSON file
 * Usage: downloadRecipesAsJSON()
 */
function downloadRecipesAsJSON() {
  const dataStr = JSON.stringify(RECIPES, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mrs-fields-recipes.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download recipes as CSV file
 * Usage: downloadRecipesAsCSV()
 */
function downloadRecipesAsCSV() {
  let csv = 'ID,Name,Cuisine,Difficulty,Prep Time,Cook Time,Total Time,Servings,Rating,Ingredients Count,Calories\n';

  RECIPES.recipes.forEach(recipe => {
    csv += `${recipe.id},"${recipe.name}","${recipe.cuisine}","${recipe.difficulty}",${recipe.prepTime},${recipe.cookTime},${recipe.totalTime},${recipe.servings},${recipe.rating},${recipe.ingredients.length},${recipe.calories || 'N/A'}\n`;
  });

  const dataBlob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mrs-fields-recipes.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get recipe by ID
 * @param {number} id - Recipe ID
 * @returns {Object} Recipe object
 */
function getRecipeById(id) {
  return RECIPES.recipes.find(recipe => recipe.id === id);
}

/**
 * Get all recipes by difficulty
 * @param {string} difficulty - 'Easy', 'Medium', or 'Hard'
 * @returns {Array} Array of recipes
 */
function getRecipesByDifficulty(difficulty) {
  return RECIPES.recipes.filter(recipe => recipe.difficulty === difficulty);
}

/**
 * Get all recipes by cuisine
 * @param {string} cuisine - Cuisine type
 * @returns {Array} Array of recipes
 */
function getRecipesByCuisine(cuisine) {
  return RECIPES.recipes.filter(recipe => recipe.cuisine === cuisine);
}

/**
 * Search recipes by name or ingredient
 * @param {string} query - Search query
 * @returns {Array} Array of matching recipes
 */
function searchRecipes(query) {
  const lowerQuery = query.toLowerCase();
  return RECIPES.recipes.filter(recipe => {
    const nameMatch = recipe.name.toLowerCase().includes(lowerQuery);
    const ingMatch = recipe.ingredients.some(ing => ing.toLowerCase().includes(lowerQuery));
    return nameMatch || ingMatch;
  });
}

/**
 * Get random recipe
 * @returns {Object} Random recipe
 */
function getRandomRecipe() {
  const randomIndex = Math.floor(Math.random() * RECIPES.recipes.length);
  return RECIPES.recipes[randomIndex];
}

/**
 * Filter recipes by prep time
 * @param {number} maxMinutes - Maximum prep time in minutes
 * @returns {Array} Quick recipes
 */
function getQuickRecipes(maxMinutes = 30) {
  return RECIPES.recipes.filter(recipe => recipe.totalTime <= maxMinutes);
}
