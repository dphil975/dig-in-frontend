# Phase 2 Expansion: Sophisticated Seasoning & Flavor Profile System

## Overview
This expansion adds intelligent recipe transformation through **flavor profiles** and **ingredient pairing intelligence**. Users can now transform ANY recipe into 8 different flavor profiles (spicy, umami, sweet, sour, aromatic, savory, earthy, fresh) with scientifically-matched seasonings, proteins, carbs, and legumes.

## Core Philosophy
Cooking is flexible. The same ingredient set becomes completely different dishes through seasoning choices. A single dish can become Thai, Indian, Italian, French, Chinese, Japanese, Mexican, or Mediterranean simply by changing the seasonings and ingredient pairings.

---

## New Files Created

### 1. **seasoning-pairing-engine.js**
Complete flavor profile and ingredient pairing engine with:
- **8 Flavor Profiles**: spicy, umami, sweet, sour, aromatic, savory, earthy, fresh
- **Flavor Profile System**: Maps seasonings to flavor profiles with strength scores
- **Ingredient Pairing Intelligence**: 
  - Protein recommendations (beef, chicken, fish, pork, lamb, mushrooms, tofu)
  - Carb recommendations (rice, pasta, bread, potato, quinoa, couscous)
  - Bean recommendations (black beans, chickpeas, lentils, kidney beans, pinto beans, white beans)
- **Cuisine Signatures**: 8 cuisines with their primary/secondary flavors and seasonings
- **Harmony Scoring**: Calculates compatibility between proteins, carbs, and beans
- **Beverage Pairing**: Wine/drink recommendations based on flavor profile
- **Eating Experience Descriptions**: How each flavor profile tastes

### 2. Enhanced remix-engine.js
Added methods for flavor-based transformations:
- `generateSeasoningRemix()` - Create full flavor profile remixes
- `getAvailableFlavorProfiles()` - Return 8 flavor options
- `getIngredientPairings()` - Get protein/carb/bean recommendations
- `detectRecipeFlavorProfile()` - Analyze current recipe's flavor
- `generateCuisineVariants()` - Show how recipe transforms across 8 cuisines

### 3. Enhanced api-server.js
New API endpoints:

```
GET /api/recipes/:recipeId/flavor-profiles
Returns: current_profile, available_profiles, description

POST /api/recipes/:recipeId/remix-flavor
Body: {flavor, format}
Returns: Fully transformed recipe with new seasonings, ingredients, eating experience

GET /api/recipes/:recipeId/pairings/:flavor
Returns: protein pairing, carb pairing, bean pairing, harmony scores

GET /api/recipes/:recipeId/cuisine-variants
Returns: All 8 cuisine variants with seasonings and flavor profiles
```

### 4. Enhanced recipe-cards-premium.html
New UI Components:
- **Flavor Profile Selector**: 8 clickable flavor chips on each recipe card
- **✨ FLAVOR REMIX Button**: Generates flavor-based remixes
- **Flavor Remix Modal**: Shows:
  - Transformation description
  - Eating experience (how the dish tastes)
  - Dominant seasonings
  - Ingredient pairings (protein, carbs, legumes)
  - Harmony scores (% compatibility)
  - Beverage pairing suggestions

---

## How It Works

### Example: Medialunas (Argentine Pastry)

**Original Profile**: Aromatic

**Transform to SPICY**:
- Seasonings: wasabi, cayenne, chili powder, sriracha, jalapeño
- Eating Experience: "Tongue tingling with building heat, followed by warming sensations"
- Protein: Chicken
- Carb: Jasmine rice
- Bean: Black beans
- Drinks: Thai iced tea, Lassi, Rice wine, Light lager

**Transform to UMAMI**:
- Seasonings: soy sauce, fish sauce, miso, parmesan, worcestershire
- Eating Experience: "Mouth-coating richness with savory depth that lingers"
- Protein: Beef (98% harmony)
- Carb: Egg noodles (85% harmony)
- Bean: Lentils (94% harmony)
- Drinks: Red wine, Soy sauce, Dark beer, Bone broth

**Transform to FRESH**:
- Seasonings: mint, cilantro, lime, basil, dill
- Eating Experience: "Light, crisp, vibrant flavors with citrus or herb brightness"
- Protein: Fish
- Carb: Quinoa
- Bean: Chickpeas
- Drinks: White wine, Herbal tea, Sparkling cider, Pale ale

### Cuisine Variants
Same recipe transforms for 8 cuisines:
- **Thai**: Spicy + chili, Thai basil, lime, fish sauce
- **Indian**: Aromatic + cumin, cardamom, turmeric, cinnamon
- **Italian**: Savory + basil, oregano, garlic, parmesan
- **French**: Savory + thyme, rosemary, garlic, wine
- **Chinese**: Umami + soy sauce, ginger, garlic, sesame oil
- **Japanese**: Umami + soy sauce, mirin, dashi, wasabi
- **Mexican**: Spicy + chili, cumin, cilantro, lime
- **Mediterranean**: Fresh + olive oil, oregano, lemon, garlic

---

## API Response Examples

### Flavor Profile Detection
```json
{
  "success": true,
  "current_profile": "aromatic",
  "available_profiles": ["spicy", "umami", "sweet", "sour", "aromatic", "savory", "earthy", "fresh"],
  "description": "Transform your recipe using different flavor profiles..."
}
```

### Flavor Remix Response
```json
{
  "success": true,
  "recipe": {
    "name": "Spicy Medialunas (Crescent Pastries)",
    "flavor_profile": "spicy",
    "seasonings": ["wasabi", "cayenne", "chili powder", "sriracha", "jalapeño"],
    "flavor_notes": {
      "primary_flavor": "spicy",
      "secondary_flavors": ["aromatic", "fresh"],
      "eating_experience": "Tongue tingling with building heat...",
      "pairing_drinks": ["Thai iced tea", "Lassi", "Rice wine", "Light lager"]
    },
    "pairings": {
      "protein": {"name": "chicken", "reason": "Pairs well with spicy flavors"},
      "carb": {"name": "jasmine rice", "reason": "Complements spicy profile"},
      "bean": {"name": "black beans", "reason": "Enhances spicy taste"},
      "complementary_ingredients": ["Thai basil", "bird's eye chili", "lime juice", "coconut milk"]
    }
  }
}
```

### Ingredient Pairings Response
```json
{
  "success": true,
  "flavor": "umami",
  "pairings": {
    "protein": {"name": "beef", "reason": "Pairs well with umami flavors"},
    "carb": {"name": "egg noodles", "reason": "Complements umami profile"},
    "bean": {"name": "lentils", "reason": "Enhances umami taste"},
    "seasonings": ["soy sauce", "fish sauce", "miso", "parmesan", "worcestershire"],
    "pairing_scores": {
      "protein_flavor_match": 0.98,
      "carb_flavor_match": 0.85,
      "bean_flavor_match": 0.94,
      "overall_harmony": 0.93
    }
  }
}
```

---

## Technical Architecture

### Data Flow
1. User selects flavor profile on recipe card
2. Clicks "✨ FLAVOR REMIX" button
3. Frontend calls `POST /api/recipes/:recipeId/remix-flavor`
4. Server's SeasoningPairingEngine:
   - Detects original flavor profile
   - Generates new seasonings for target flavor
   - Transforms proteins/carbs/beans to match flavor
   - Adds complementary ingredients
   - Generates flavor descriptions
5. Frontend calls `GET /api/recipes/:recipeId/pairings/:flavor` for detailed pairings
6. Modal displays full transformation with:
   - New dish name with flavor prefix
   - Transformation explanation
   - Eating experience description
   - Dominant seasonings
   - Ingredient pairing cards with harmony scores
   - Beverage pairing suggestions

### Flavor Profile Scoring
Each seasoning has a 0-1 score for multiple flavor dimensions:
- Spicy (heat, pungency)
- Umami (savory depth)
- Sweet (sugar, sweetness)
- Sour (acidity, brightness)
- Aromatic (fragrance, spice aroma)
- Savory (earthiness, depth)
- Earthy (natural vegetation notes)
- Fresh (brightness, cleanliness)

When transforming, the engine:
1. Finds seasonings with highest score for target flavor
2. Matches proteins/carbs/beans known to pair with those seasonings
3. Calculates harmony scores based on culinary science
4. Generates descriptions based on flavor combinations

### Ingredient Matching
- **Proteins**: 7 options with flavor compatibility
- **Carbs**: 6 options with texture/sauce pairing
- **Beans**: 6 options with flavor profiles
- **Scoring**: 0.8-0.99 based on culinary tradition and flavor science

---

## User Experience

### Recipe Card View
Each recipe card now shows:
- Format options (salad, sandwich, soup, pasta, one-pot, etc.)
- Time variants (Full, Quick, Express)
- Dietary options (vegan, vegetarian, gluten-free, pescatarian, low-sodium)
- **NEW: Flavor Profiles** (8 clickable flavor icons)
- Two remix buttons: "🔄 GENERATE REMIX" and "✨ FLAVOR REMIX"

### Flavor Remix Modal
When user clicks flavor option and "✨ FLAVOR REMIX":
1. Shows transformation title (e.g., "Spicy Medialunas")
2. Explains how the dish was transformed
3. Describes the eating experience
4. Lists dominant seasonings as chips
5. Shows 3 pairing cards (Protein, Carbs, Legumes)
6. Displays harmony scores as percentages
7. Suggests beverage pairings

---

## Analytics Integration

Tracked interactions:
- `flavor_toggle`: When user clicks flavor profile chip
- `flavor_remix_generated`: When user generates flavor remix
- `flavorRemixViewed`: When modal is displayed

All tracked through existing analytics and user metrics systems.

---

## Files Modified

1. **remix-engine.js** - Added flavor profile methods
2. **api-server.js** - Added 4 new API endpoints
3. **recipe-cards-premium.html** - Added flavor UI and modal display
4. **seasoning-pairing-engine.js** - New file with complete flavor system

---

## Testing Endpoints

```bash
# Get flavor profiles for a recipe
curl http://localhost:5000/api/recipes/{recipeId}/flavor-profiles

# Generate spicy remix
curl -X POST http://localhost:5000/api/recipes/{recipeId}/remix-flavor \
  -H "Content-Type: application/json" \
  -d '{"flavor":"spicy","format":"salad"}'

# Get ingredient pairings for umami
curl http://localhost:5000/api/recipes/{recipeId}/pairings/umami

# Get all cuisine variants
curl http://localhost:5000/api/recipes/{recipeId}/cuisine-variants
```

---

## Key Capabilities

✅ Transform any recipe into 8 different flavor profiles
✅ Intelligent seasoning recommendations based on flavor science
✅ Protein/carb/bean matching with harmony scores
✅ Cuisine variants showing how same recipe transforms globally
✅ Eating experience descriptions (how it tastes)
✅ Beverage pairing suggestions
✅ Full UI integration with modal display
✅ Analytics tracking for all interactions
✅ No database required (all in-memory JSON)

---

## Future Enhancements

- User flavor preference learning (save favorite flavor transformations)
- Recipe difficulty impact on flavor profile transformation
- Nutritional adjustments based on ingredient swaps
- Cooking technique recommendations for each flavor profile
- Meal planning with flavor profile variety
- Barcode scanner integration for ingredient pairing learning
