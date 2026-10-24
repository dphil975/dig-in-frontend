# Dig In - Pixel Ingredient UI Design System

## Overview
A comprehensive cooking game-inspired UI system featuring:
- 🎮 Pixel art ingredient grid with dynamic add/remove
- 📖 Recipe steps image slider with rounded cards
- 💖 Item modification interface (Love Shot style)
- 🎬 Profile history reel for saved recipes

## Components

### 1. Ingredient Grid System

#### Purpose
Display all recipe ingredients as pixel art boxes that users can toggle between "have" and "don't have"

#### Features
- **Pixel Boxes**: Color-coded ingredient containers with emoji representation
- **Toggle Buttons**: Mark ingredients as ✓ (have) or ✗ (missing)
- **Price Tags**: Show 💲 for add-on modifications
- **Visual States**:
  - Default: Full opacity, normal styling
  - Missing: 50% opacity, dashed border
  - Added: Green border, light green background

#### CSS Classes
```
.pixel-ingredient-grid          /* Container */
.ingredient-grid-header         /* Title section */
.ingredient-items              /* Grid of items */
.pixel-ingredient-item         /* Individual ingredient */
.pixel-box                      /* Color box with emoji */
.pixel-emoji                    /* Emoji inside box */
.ingredient-label              /* Name below item */
.ingredient-name               /* Text label */
.price-tag                      /* 💲 modifier indicator */
.ingredient-toggle             /* ✓/✗ button */
```

#### Usage Example
```javascript
const system = initPixelIngredientSystem('recipe-container', 'recipe-123');

// Render ingredients
const ingredients = ['tofu', 'garlic', 'soy sauce', 'ginger'];
const grid = system.renderIngredientGrid(ingredients);
document.getElementById('ingredients').appendChild(grid);
```

#### Styling Customization
```css
/* Change ingredient box colors */
.pixel-box {
  background-color: #YOUR_COLOR;
}

/* Customize missing state */
.pixel-ingredient-item.missing {
  opacity: 0.5;
  background: #f0f0f0;
}

/* Customize added state */
.pixel-ingredient-item.added {
  border-color: #228B22;
  background: #E8F5E9;
}
```

---

### 2. Recipe Steps Slider

#### Purpose
Display recipe instructions as a carousel with intuitive navigation and visual progression

#### Features
- **Step Cards**: Rounded corners, clean layout with number + instruction
- **Navigation Buttons**: Previous/Next arrows
- **Step Counter**: Shows "Step X / Total"
- **Progress Dots**: Visual indicators of position in recipe
- **Bouncing Hint**: "Tap to continue" visual feedback
- **Smooth Transitions**: Cards fade in/out

#### CSS Classes
```
.recipe-steps-slider-container  /* Main container */
.steps-header                   /* Title & counter */
.steps-carousel                 /* Cards + buttons */
.carousel-btn                   /* < > buttons */
.steps-slides                   /* Card container */
.step-card                      /* Individual step */
.step-number                    /* Blue circle with number */
.step-content                   /* Instruction text */
.step-visual-hint               /* "Tap to continue" */
.step-dots                      /* Progress indicators */
.dot                            /* Individual dot */
```

#### Usage Example
```javascript
const steps = [
  "Heat oil in wok until smoking",
  "Add chicken, stir-fry until cooked",
  "Add sauce, toss everything together",
  "Plate and serve hot"
];

const slider = system.renderRecipeStepsSlider(steps);
document.getElementById('steps').appendChild(slider);

// Navigate programmatically
system.nextStep();        // Go to next step
system.previousStep();    // Go to previous step
system.goToStep(2);       // Jump to step 3
```

#### Styling Customization
```css
/* Change step card background */
.step-card {
  background: #your-color;
}

/* Customize step number circle */
.step-number {
  background: linear-gradient(135deg, #4A90E2, #357ABD);
}

/* Adjust carousel button size */
.carousel-btn {
  width: 50px; /* default 40px */
}
```

---

### 3. Item Modification Card

#### Purpose
Allow users to customize recipe add-ons with quantity, options, and price modifiers (inspired by Love Shot interface)

#### Features
- **Item Visual**: Large pixel art emoji in white box
- **Item Info**: Name, description, price modifier
- **Quantity Control**: +/- buttons for amounts
- **Options Select**: Dropdown for variations
- **Price Tag**: Shows 💲+$X.XX when applicable
- **Action Buttons**: Add to Recipe / Cancel

#### CSS Classes
```
.item-modification-card         /* Main card */
.item-card-header              /* Visual + info */
.item-visual                   /* Pixel art box */
.item-pixel-art                /* Emoji */
.item-info                     /* Text area */
.price-modifier                /* 💲 indicator */
.item-modifiers                /* Quantity & options */
.modifier-row                  /* Individual modifier */
.quantity-control              /* +/- buttons */
.option-select                 /* Dropdown */
.item-actions                  /* Bottom buttons */
.btn-add-ingredient            /* Add button */
.btn-cancel                    /* Cancel button */
```

#### Usage Example
```javascript
const item = {
  id: 'spinach-addon',
  name: 'Add Spinach',
  description: 'Fresh organic spinach',
  emoji: '🌱',
  priceModifier: 0.50,
  options: ['Fresh', 'Frozen', 'Cooked']
};

const card = system.renderItemModification(item);
document.body.appendChild(card);
```

#### Styling Customization
```css
/* Change card color theme */
.item-modification-card {
  background: linear-gradient(135deg, #FF1493, #FF69B4);
  border-color: #C71585;
}

/* Customize button colors */
.btn-add-ingredient {
  background: white;
  color: #C71585;
}
```

---

### 4. Profile History Reel

#### Purpose
Display user's created/saved recipes in a horizontal scrollable reel with visual previews

#### Features
- **Recipe Cards**: Compact cards showing:
  - Recipe name & type
  - Ingredient preview (4 pixel emojis)
  - Prep time & servings
  - Creation date
- **Horizontal Scroll**: Smooth scrolling card carousel
- **Hover Effects**: Cards lift up on hover
- **Quick View Button**: Access recipe details
- **Recipe Count**: Total number of recipes

#### CSS Classes
```
.profile-history-reel          /* Container */
.reel-header                   /* Title section */
.recipe-count                  /* Count badge */
.reel-container                /* Scroll wrapper */
.reel-scroll                   /* Scrollable area */
.history-card                  /* Individual card */
.pixel-card-frame              /* Pixel border */
.card-frame-border             /* Inner padding */
.card-header                   /* #number + date */
.card-visual                   /* Ingredient showcase */
.recipe-pixel-showcase         /* Emoji grid */
.card-body                     /* Name + stats */
.card-footer                   /* View button */
.btn-view                      /* View button */
```

#### Usage Example
```javascript
const recipes = [
  {
    id: 1,
    name: 'Mapo Tofu',
    type: 'Chinese',
    ingredients: ['tofu', 'pork', 'garlic', 'ginger'],
    date: 'June 11',
    totalTime: 30,
    servings: 4
  },
  // More recipes...
];

const reel = system.renderProfileHistoryReel(recipes);
document.getElementById('profile').appendChild(reel);
```

#### Styling Customization
```css
/* Change card border color */
.pixel-card-frame {
  border-color: #your-color;
}

/* Customize ingredient grid background */
.recipe-pixel-showcase {
  background: #FFF9E6;
  border-color: #D2B48C;
}

/* Adjust card dimensions */
.history-card {
  width: 240px; /* default 220px */
}
```

---

## Integration with Recipe Card System

### Step 1: Add Scripts and Styles
```html
<!-- In recipes.html head -->
<script src="frontend/js/pixel-ingredient-system.js"></script>
<link rel="stylesheet" href="frontend/css/pixel-ingredient-system.css">
```

### Step 2: Initialize in Recipe Card
```javascript
class RecipeCard {
  constructor(containerId, recipe) {
    this.container = document.getElementById(containerId);
    this.recipe = recipe;
    this.pixelSystem = initPixelIngredientSystem(containerId, recipe.id);
    this.render();
  }

  render() {
    // Render ingredient grid
    const ingredientGrid = this.pixelSystem.renderIngredientGrid(
      this.recipe.ingredients
    );
    this.container.appendChild(ingredientGrid);

    // Render steps slider
    const stepsSlider = this.pixelSystem.renderRecipeStepsSlider(
      this.recipe.instructions
    );
    this.container.appendChild(stepsSlider);

    // Render item modification (for add-ons)
    const itemCard = this.pixelSystem.renderItemModification({
      id: 'veggies',
      name: 'Add Extra Vegetables',
      description: 'Freshen up your dish',
      emoji: '🥬',
      priceModifier: 1.50,
      options: ['Spinach', 'Broccoli', 'Carrots']
    });
    this.container.appendChild(itemCard);
  }
}
```

### Step 3: Add Profile Reel
```javascript
// In user profile page
const userRecipes = getUserSavedRecipes(); // From backend
const historyReel = pixelSystem.renderProfileHistoryReel(userRecipes);
document.getElementById('profile-section').appendChild(historyReel);
```

---

## Pixel Art Assets Reference

### Pre-Built Assets
```javascript
{
  'tofu': { emoji: '🟫', color: '#D4A574', label: 'Tofu' },
  'ground pork': { emoji: '🟥', color: '#C41E3A', label: 'Pork' },
  'soy sauce': { emoji: '🟤', color: '#3D2817', label: 'Soy' },
  'garlic': { emoji: '⚪', color: '#F5F5F5', label: 'Garlic' },
  'ginger': { emoji: '🟨', color: '#FFD700', label: 'Ginger' },
  'spinach': { emoji: '🟩', color: '#228B22', label: 'Spinach' },
  // ... 20+ more pre-configured
}
```

### Adding Custom Ingredients
```javascript
// Extend the pixel assets
pixelSystem.pixelAssets['my-ingredient'] = {
  emoji: '🟦',
  color: '#4A90E2',
  label: 'My Ingredient'
};
```

---

## Price Modifier System

### Display Price Tags
```javascript
// Automatically shows on items with priceModifier
const item = {
  id: 'premium-oil',
  name: 'Premium Sesame Oil',
  priceModifier: 2.50  // Displays as 💲+$2.50
};
```

### Handle Price Changes
```javascript
// When user selects modifications
system.selectedIngredients.set('tofu', {
  hasIt: true,
  addedPrice: 1.50  // Extra cost for premium tofu
});
```

---

## State Management

### Track Ingredient Selection
```javascript
// Map of ingredient -> {hasIt: boolean, addedPrice: number}
system.selectedIngredients = new Map([
  ['tofu', { hasIt: true, addedPrice: 0 }],
  ['spinach', { hasIt: false, addedPrice: 0 }],
  ['premium oil', { hasIt: true, addedPrice: 2.50 }]
]);
```

### Track User-Added Items
```javascript
// Set of user-added ingredients
system.userAddedIngredients = new Set([
  'spinach',
  'extra ginger',
  'premium oil'
]);
```

---

## Event Handling

### Toggle Ingredient
```javascript
// User clicks ✓/✗ button
pixelSystem.toggleIngredient('garlic');
// Toggles between hasIt: true/false
// Automatically updates display with visual feedback
```

### Navigate Steps
```javascript
// User clicks next/previous buttons
pixelSystem.nextStep();      // Go to next step
pixelSystem.previousStep();  // Go to previous
pixelSystem.goToStep(2);     // Jump to specific step
```

### Modify Item
```javascript
// User adjusts quantity
pixelSystem.modifyQuantity('spinach', 1);  // +1
pixelSystem.modifyQuantity('spinach', -1); // -1

// User selects option
pixelSystem.updateOption('oil', 'Premium');

// User adds to recipe
pixelSystem.addItemToRecipe('spinach');
```

---

## Responsive Design

### Breakpoints
- **Desktop** (>768px): 4-column ingredient grid, full-size cards
- **Tablet** (481-768px): 3-column grid, medium cards
- **Mobile** (<480px): 2-column grid, small cards

### Mobile Optimizations
- Touch-friendly button sizes (28px minimum)
- Larger tap targets for toggles
- Single-column step cards
- Horizontal scrolling for reel (auto)

---

## Accessibility

### Keyboard Navigation
```javascript
// Arrow keys to navigate steps
// Tab to focus ingredients
// Enter/Space to toggle
```

### ARIA Labels
```html
<button 
  class="ingredient-toggle"
  aria-label="Toggle garlic - currently missing"
  title="Mark as missing"
>
  ✗
</button>
```

### Color Contrast
- Text: 4.5:1 ratio (WCAG AA)
- Borders: 3:1 ratio minimum
- Emoji size: 32px+ for clarity

---

## Performance Optimization

### Lazy Loading
```javascript
// Only render visible cards
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        renderHistoryCard(entry.target);
      }
    });
  }
);
```

### CSS Containment
```css
.history-card {
  contain: layout style paint;
}
```

### Smooth Scrolling
```css
.reel-scroll {
  scroll-behavior: smooth;
}
```

---

## Examples

### Complete Recipe Card with UI
```javascript
const recipe = {
  id: 'mapo-tofu',
  name: 'Mapo Tofu',
  ingredients: ['tofu', 'pork', 'garlic', 'ginger', 'soy sauce'],
  instructions: [
    'Heat oil in wok',
    'Cook pork until brown',
    'Add tofu and sauce',
    'Simmer 5 minutes',
    'Serve hot'
  ]
};

const card = new RecipeCard('recipe-container', recipe);
```

### Profile with History
```javascript
const user = {
  name: 'Jane Cook',
  recipes: [
    { id: 1, name: 'Mapo Tofu', date: 'Today' },
    { id: 2, name: 'Bulgogi', date: 'Yesterday' },
    { id: 3, name: 'Miso Ramen', date: '2 days ago' }
  ]
};

const system = initPixelIngredientSystem('profile', 'main');
const reel = system.renderProfileHistoryReel(user.recipes);
```

---

## Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+

## File References
- **JavaScript**: `frontend/js/pixel-ingredient-system.js` (650+ lines)
- **Stylesheet**: `frontend/css/pixel-ingredient-system.css` (800+ lines)
- **Components**: Full pixel art cooking game UI

---

**Version**: 1.0  
**Last Updated**: June 11, 2026  
**Status**: ✅ Production Ready
