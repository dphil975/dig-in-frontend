# Recipe Import Guide for Dig In

## Files Created

### 1. **recipe_converter.js**
A utility class for converting recipes from various formats into the Dig In recipe card format.

**Usage:**
```javascript
// Parse raw recipe text
const rawRecipe = RecipeConverter.parseTextRecipe(textString);

// Format recipe to card system
const formatted = RecipeConverter.formatRecipe(rawRecipe);

// Batch convert multiple recipes
const formatted = RecipeConverter.batchFormat(recipesArray);
```

### 2. **mrs_fields_cookies.json**
Pre-formatted collection of 10 Mrs. Fields cookie recipes ready to use with your recipe card system.

Includes:
- ✅ Original Chocolate Chip Cookie
- ✅ Double Fudge Brownie
- ✅ Pecan Pie Cookie
- ✅ Cinnamon Sugar Cookie
- ✅ White Chocolate Macadamia
- ✅ Raspberry White Chocolate
- ✅ Oatmeal Raisin Cookie
- ✅ Peanut Butter Chocolate Cup
- ✅ Triple Chocolate Chunk
- ✅ Toffee Almond Cookie

## Recipe Card Fields

Each recipe includes:

```javascript
{
  id: Number,                    // Unique identifier
  name: String,                  // Recipe name
  cuisine: String,               // Category (e.g., "Dessert")
  difficulty: String,            // Easy, Medium, Hard
  skillLevel: String,            // Same as difficulty
  prepTime: Number,              // Minutes
  cookTime: Number,              // Minutes
  totalTime: Number,             // Sum of prep + cook
  description: String,           // Short description
  rating: Number,                // 1-5 stars
  servings: Number,              // How many servings
  
  // Core recipe data
  ingredients: Array,            // List of ingredients
  instructions: Array,           // Step-by-step instructions
  tips: Array,                   // Chef's tips
  
  // Visual
  pixelEmoji: String,            // Emoji representation
  pixelArtUrl: String,           // URL to pixel art image
  imageUrl: String,              // URL to regular image
  
  // Substitutions
  substitutions: Object,         // {original: substitute}
  
  // Nutrition (optional)
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  fiber: Number,
  sodium: Number,
  sugar: Number,
  cholesterol: Number,
  
  // Dietary info
  allergens: Array,              // [wheat, eggs, milk, etc]
  dietary: Array                 // [vegan, gluten-free, etc]
}
```

## How to Integrate

### Option 1: Load in HTML
```html
<script src="data/recipe_converter.js"></script>
<script src="data/mrs_fields_cookies.json"></script>
<script>
  // Recipes are now available
  const recipes = window.RECIPES || require('./mrs_fields_cookies.json');
  
  // Create cards for each recipe
  recipes.recipes.forEach((recipe, idx) => {
    const card = new RecipeCard(`recipe-${idx}`, recipe, 
      (id, saved) => console.log(`Recipe ${id} saved: ${saved}`),
      (page) => console.log(`Navigated to page ${page}`)
    );
  });
</script>
```

### Option 2: Load via JavaScript Module
```javascript
import recipes from './data/mrs_fields_cookies.json';
import RecipeConverter from './data/recipe_converter.js';

recipes.recipes.forEach((recipe) => {
  const formatted = RecipeConverter.formatRecipe(recipe);
  // Use formatted recipe with your card system
});
```

## Adding Your Own Recipes

### From PDF Text
1. Copy recipe text from PDF
2. Paste into text input
3. Run converter:
```javascript
const text = `
Mrs. Fields Cookie Recipe
Ingredients:
2 cups flour
1 cup butter
...
Instructions:
1. Mix ingredients
2. Bake at 350°F
`;

const parsed = RecipeConverter.parseTextRecipe(text);
const formatted = RecipeConverter.formatRecipe(parsed);
```

### From Manual Entry
```javascript
const newRecipe = {
  name: "My Cookie",
  ingredients: ["ingredient 1", "ingredient 2"],
  instructions: ["step 1", "step 2"],
  prepTime: 15,
  cookTime: 12,
  description: "My amazing cookie"
};

const formatted = RecipeConverter.formatRecipe(newRecipe);
```

## Merging with Existing Recipes

To add these cookies to your main recipes.json:

```bash
# Use jq (if installed)
jq '.recipes += input.recipes' data/recipes.json data/mrs_fields_cookies.json > data/recipes_merged.json

# Or manually merge in JavaScript
const existing = require('./recipes.json');
const new_recipes = require('./mrs_fields_cookies.json');
existing.recipes.push(...new_recipes.recipes);
```

## Next Steps

1. ✅ Review recipe data for accuracy
2. ✅ Load mrs_fields_cookies.json into your recipe pages
3. ✅ Test recipe cards with navigation, saving, ratings
4. ✅ Add pixel art images (currently using emojis as fallback)
5. ✅ Link to shopping lists for ingredients
6. ✅ Add nutritional data (estimated values provided)

## Customization Tips

- **Pixel Art**: Replace `pixelArtUrl` with actual pixel art image URLs
- **Real Images**: Add actual dish photos to `imageUrl`
- **Nutrition**: Refine calorie/macro estimates with actual data
- **Dietary Tags**: Add vegan, gluten-free, dairy-free tags as needed
- **Tips**: Expand chef's tips based on your expertise

## Questions?

Refer to `RecipeCard` class documentation in your existing code for detailed integration examples.
