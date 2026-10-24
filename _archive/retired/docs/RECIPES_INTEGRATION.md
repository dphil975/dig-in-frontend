# Mrs. Fields Cookie Recipes Integration Guide

## Overview
This guide explains how the Mrs. Fields cookie recipes have been integrated into both the frontend and backend of the Dig In app.

## Frontend Integration ✅

### Files Updated
- **`recipes.html`** - Main recipe page with recipe cards and filtering system

### What Was Added

#### 1. Recipe Data (STATIC Array)
Added 10 Mrs. Fields cookie recipes (IDs 13-22):
- Original Chocolate Chip Cookie
- Double Fudge Brownie
- Pecan Pie Cookie
- Cinnamon Sugar Cookie
- White Chocolate Macadamia
- Raspberry White Chocolate
- Oatmeal Raisin Cookie
- Peanut Butter Chocolate Cup
- Triple Chocolate Chunk
- Toffee Almond Cookie

Each recipe includes:
- Recipe name and emoji icon
- Prep time and cook time
- Recipe type (snack/dessert)

#### 2. Ingredient Lists (RECIPE_INGREDIENTS)
Complete ingredient lists for all 10 recipes with:
- Full ingredient names
- Quantity and unit information
- Support for substitutions

#### 3. Dietary Information (DIETARY_MAP)
Dietary tags for filtering:
- All recipes marked as "vegetarian"
- Some recipes marked as "gluten-free" or "nut-free"

#### 4. Ingredient Pricing (INGREDIENT_PRICES)
Added pricing information for new ingredients:
- Chocolate chips, walnuts, toffee bits
- Macadamia nuts, almonds, pecans
- Spices: cinnamon, nutmeg, cloves
- Specialty items: white chocolate, dark chocolate chunks

### How It Works

1. **Recipe List Display**
   - Recipes appear in the grid on recipes.html
   - Colored stripes indicate recipe type (dessert vs snack)
   - HIT badges appear on highly-rated recipes

2. **Filtering & Search**
   - Filter by recipe type (snack/dessert)
   - Search by recipe name or ingredients
   - Filter by dietary requirements (vegetarian)
   - Filter by prep time

3. **Shopping Drawer**
   - Click any recipe to see detailed ingredients
   - Toggle ingredients to mark what you have/need
   - Get creative substitution suggestions
   - View estimated ingredient costs

## Backend Integration (Optional)

### Files Added
- **`data/mrs-fields-recipes-insert.sql`** - Database insert script

### How to Add to Database

1. **Create ingredients** (if not already in database):
```sql
INSERT INTO ingredients (name, category, where_to_buy) VALUES 
('chocolate chips', 'baking', 'Any grocery'),
('macadamia nuts', 'baking', 'Grocery / bulk'),
('toffee bits', 'baking', 'Any grocery'),
-- ... (repeat for all new ingredients)
ON CONFLICT (name) DO NOTHING;
```

2. **Run the insert script**:
```bash
psql -d dig_in -f data/mrs-fields-recipes-insert.sql
```

3. **Verify**:
```sql
SELECT COUNT(*) FROM recipes WHERE source_book = 'Mrs. Fields Cookie Book';
-- Should return: 10
```

### Database Schema
Recipes are stored in three tables:
- `recipes` - Recipe metadata (name, type, difficulty, rating)
- `recipe_ingredients` - Links recipes to ingredients
- `ingredients` - Master ingredient list with pricing/sourcing info

## Recipe Structure

### Frontend (JavaScript Object)
```javascript
{
  id: 13,
  name: 'Original Chocolate Chip Cookie',
  pixelEmoji: '🍪',
  time: 27,
  recipe_type: 'snack'
}
```

### Backend (Database)
```sql
{
  id: 101,
  name: 'Original Chocolate Chip Cookie',
  description: 'The iconic Mrs. Fields chocolate chip cookie...',
  recipe_type: 'snack',
  cuisine: 'American',
  source_book: 'Mrs. Fields Cookie Book',
  prep_time_minutes: 15,
  cook_time_minutes: 12,
  total_time_minutes: 27,
  servings: 24,
  difficulty: 'Easy',
  rating: 5,
  is_verified: true
}
```

## Features Available

### For Users
✅ Browse recipe cards with filtering
✅ Search recipes by name or ingredients
✅ Filter by dietary requirements
✅ View ingredient lists
✅ Check ingredient prices
✅ Get substitution suggestions
✅ Build shopping lists
✅ Save favorite recipes

### For Developers
✅ Recipe data in frontend (recipes.html)
✅ Recipe data in recipes.js module
✅ Database insert script for backend
✅ Ingredient pricing database
✅ Dietary tags and filtering system

## API Endpoints (Backend)

```
GET /api/recipes
  - Returns all recipes
  - Query params: type, source, verified

GET /api/recipes/search/:query
  - Search recipes by name/description/source

GET /api/recipes/:id
  - Get detailed recipe with ingredients

GET /api/recipes/:id/ingredients
  - Get ingredient list with pricing
```

## Extending with More Recipes

### To Add More Recipes to Frontend:

1. **Update recipes.html STATIC array**:
```javascript
{ id: 23, name: 'New Recipe', pixelEmoji: '🍪', time: 25, recipe_type: 'snack' }
```

2. **Add ingredients**:
```javascript
23: ['ingredient1', 'ingredient2', ...]
```

3. **Add dietary tags**:
```javascript
23: ['vegetarian', 'gluten-free']
```

4. **Add pricing** (if new ingredients):
```javascript
'new-ingredient': { est: '~$X.XX', where: 'Location' }
```

### To Add More Recipes to Backend:

1. **Create migration file**:
```bash
touch migrations/add-more-recipes.sql
```

2. **Add INSERT statements** (following the pattern in mrs-fields-recipes-insert.sql)

3. **Run migration**:
```bash
psql -d dig_in -f migrations/add-more-recipes.sql
```

## Testing

### Frontend
- Open `recipes.html` in browser
- Search for "chocolate" or "brownie"
- Filter by "dessert" type
- Click a recipe to see shopping drawer
- Verify ingredient lists display correctly

### Backend
- Query the recipes table: `SELECT COUNT(*) FROM recipes`
- Test API: `curl http://localhost:5000/api/recipes`
- Search API: `curl http://localhost:5000/api/recipes/search/chocolate`

## Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `recipes.html` | Frontend recipe page | ✅ Updated |
| `recipes.js` | Frontend recipe module | ✅ Created |
| `mrs-fields-cookies.json` | Recipe data export | ✅ Created |
| `recipe-converter.js` | Recipe format converter | ✅ Created |
| `RECIPE_IMPORT_GUIDE.md` | Conversion documentation | ✅ Created |
| `data/mrs-fields-recipes-insert.sql` | Database insert script | ✅ Created |
| `RECIPES_INTEGRATION.md` | This file | ✅ Created |

## Next Steps

1. **Test frontend**: Open recipes.html and verify recipes display
2. **Set up database** (optional): Run SQL insert script if using backend
3. **Add pixel art**: Replace emoji icons with actual pixel art images
4. **Deploy**: Commit changes and deploy to production
5. **Monitor**: Track recipe usage and user feedback

## Support

For questions about:
- **Frontend integration**: Check `recipes.html` code comments
- **Backend integration**: See `data/mrs-fields-recipes-insert.sql`
- **Recipe converter**: Review `recipe-converter.js`
- **General guidance**: See `RECIPE_IMPORT_GUIDE.md`
