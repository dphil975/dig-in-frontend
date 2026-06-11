/**
 * Pixel Ingredient System
 * Manages pixel art representations of ingredients with dynamic add/remove
 * Includes recipe steps slider and ingredient modification UI
 */

class PixelIngredientSystem {
  constructor(containerId, recipeId) {
    this.container = document.getElementById(containerId);
    this.recipeId = recipeId;
    this.selectedIngredients = new Map(); // Map of ingredient -> {hasIt: boolean, addedPrice: number}
    this.userAddedIngredients = new Set();
    this.pixelAssets = this.loadPixelAssets();
    this.currentStep = 0;
  }

  // Pixel asset definitions
  loadPixelAssets() {
    return {
      'tofu': { emoji: '🟫', color: '#D4A574', label: 'Tofu' },
      'ground pork': { emoji: '🟥', color: '#C41E3A', label: 'Pork' },
      'soy sauce': { emoji: '🟤', color: '#3D2817', label: 'Soy' },
      'garlic': { emoji: '⚪', color: '#F5F5F5', label: 'Garlic' },
      'ginger': { emoji: '🟨', color: '#FFD700', label: 'Ginger' },
      'sesame oil': { emoji: '🟫', color: '#8B4513', label: 'Oil' },
      'green onions': { emoji: '🟩', color: '#228B22', label: 'Onion' },
      'chicken breast': { emoji: '🟧', color: '#FF8C00', label: 'Chicken' },
      'eggs': { emoji: '🟡', color: '#FFD700', label: 'Eggs' },
      'rice': { emoji: '⬜', color: '#FFFACD', label: 'Rice' },
      'nori': { emoji: '🟫', color: '#2F4F2F', label: 'Nori' },
      'mushrooms': { emoji: '🟤', color: '#8B4513', label: 'Mushroom' },
      'kimchi': { emoji: '🟥', color: '#DC143C', label: 'Kimchi' },
      'spinach': { emoji: '🟩', color: '#228B22', label: 'Spinach' },
      'carrot': { emoji: '🟠', color: '#FF8C00', label: 'Carrot' },
      'cabbage': { emoji: '🟩', color: '#90EE90', label: 'Cabbage' },
      'beef': { emoji: '🟥', color: '#8B0000', label: 'Beef' },
      'toasted cashews': { emoji: '🟡', color: '#DAA520', label: 'Cashews' },
      'water chestnuts': { emoji: '⚪', color: '#E8E8E8', label: 'Chestnuts' },
      'panko breadcrumbs': { emoji: '🟨', color: '#F4A460', label: 'Panko' },
    };
  }

  // Render ingredient grid with pixel assets
  renderIngredientGrid(ingredients) {
    const grid = document.createElement('div');
    grid.className = 'pixel-ingredient-grid';
    grid.innerHTML = `
      <div class="ingredient-grid-header">
        <h3>🎒 Your Ingredients</h3>
        <span class="ingredient-count">${ingredients.length} items</span>
      </div>
      <div class="ingredient-items">
        ${ingredients.map((ing, idx) => this.renderPixelIngredient(ing, idx)).join('')}
      </div>
    `;
    return grid;
  }

  renderPixelIngredient(ingredient, index) {
    const asset = this.pixelAssets[ingredient] || { emoji: '🟫', color: '#999999', label: ingredient };
    const hasIt = this.selectedIngredients.get(ingredient)?.hasIt ?? true;
    const isAdded = this.userAddedIngredients.has(ingredient);
    const addedPrice = this.selectedIngredients.get(ingredient)?.addedPrice;

    return `
      <div class="pixel-ingredient-item ${!hasIt ? 'missing' : ''} ${isAdded ? 'added' : ''}"
           data-ingredient="${ingredient}"
           data-index="${index}">
        <div class="pixel-box" style="background-color: ${asset.color};">
          <span class="pixel-emoji">${asset.emoji}</span>
        </div>
        <div class="ingredient-label">
          <span class="ingredient-name">${asset.label}</span>
          ${addedPrice ? `<span class="price-tag">💲+$${addedPrice.toFixed(2)}</span>` : ''}
        </div>
        <button class="ingredient-toggle" onclick="pixelSystem.toggleIngredient('${ingredient}')"
                title="${hasIt ? 'Mark as missing' : 'Mark as have'}">
          ${hasIt ? '✓' : '✗'}
        </button>
      </div>
    `;
  }

  toggleIngredient(ingredient) {
    const current = this.selectedIngredients.get(ingredient) || { hasIt: true, addedPrice: 0 };
    current.hasIt = !current.hasIt;
    this.selectedIngredients.set(ingredient, current);
    this.updateDisplay();
  }

  // Recipe steps slider with rounded cards
  renderRecipeStepsSlider(steps) {
    const slider = document.createElement('div');
    slider.className = 'recipe-steps-slider-container';

    slider.innerHTML = `
      <div class="steps-header">
        <h3>📖 Recipe Steps</h3>
        <span class="step-counter"><span class="current-step">1</span> / ${steps.length}</span>
      </div>

      <div class="steps-carousel">
        <button class="carousel-btn prev" onclick="pixelSystem.previousStep()">‹</button>

        <div class="steps-slides">
          ${steps.map((step, idx) => this.renderStepCard(step, idx)).join('')}
        </div>

        <button class="carousel-btn next" onclick="pixelSystem.nextStep()">›</button>
      </div>

      <div class="step-dots">
        ${steps.map((_, idx) => `
          <button class="dot ${idx === 0 ? 'active' : ''}"
                  onclick="pixelSystem.goToStep(${idx})"
                  title="Step ${idx + 1}"></button>
        `).join('')}
      </div>
    `;

    return slider;
  }

  renderStepCard(step, index) {
    return `
      <div class="step-card ${index === 0 ? 'active' : ''}" data-step="${index}">
        <div class="step-number">
          <span class="num">${index + 1}</span>
        </div>
        <div class="step-content">
          <h4>Step ${index + 1}</h4>
          <p>${step}</p>
          <div class="step-visual-hint">
            <span class="hint-icon">👉</span>
            <span class="hint-text">Tap to continue</span>
          </div>
        </div>
      </div>
    `;
  }

  nextStep() {
    const steps = this.container.querySelectorAll('.step-card').length;
    this.currentStep = (this.currentStep + 1) % steps;
    this.updateStepDisplay();
  }

  previousStep() {
    const steps = this.container.querySelectorAll('.step-card').length;
    this.currentStep = (this.currentStep - 1 + steps) % steps;
    this.updateStepDisplay();
  }

  goToStep(stepIndex) {
    this.currentStep = stepIndex;
    this.updateStepDisplay();
  }

  updateStepDisplay() {
    // Hide all steps
    document.querySelectorAll('.step-card').forEach(card => card.classList.remove('active'));
    // Show current step
    const activeCard = document.querySelector(`[data-step="${this.currentStep}"]`);
    if (activeCard) activeCard.classList.add('active');

    // Update counter
    const totalSteps = document.querySelectorAll('.step-card').length;
    document.querySelector('.current-step').textContent = this.currentStep + 1;

    // Update dots
    document.querySelectorAll('.step-dots .dot').forEach((dot, idx) => {
      dot.classList.toggle('active', idx === this.currentStep);
    });
  }

  updateDisplay() {
    // This would refresh ingredient display when items are toggled
    // In a real app, this would re-render the ingredient grid
    console.log('Updated ingredients:', this.selectedIngredients);
  }

  // Item modification interface (like the Love Shot card)
  renderItemModification(item) {
    const itemCard = document.createElement('div');
    itemCard.className = 'item-modification-card';

    itemCard.innerHTML = `
      <div class="item-card-header">
        <div class="item-visual">
          <div class="item-pixel-art">${item.emoji || '📦'}</div>
        </div>
        <div class="item-info">
          <h4>${item.name}</h4>
          <p class="item-description">${item.description}</p>
          ${item.priceModifier ? `<span class="price-modifier">💲${item.priceModifier > 0 ? '+' : ''}$${item.priceModifier.toFixed(2)}</span>` : ''}
        </div>
      </div>

      <div class="item-modifiers">
        <div class="modifier-row">
          <span class="modifier-label">Quantity:</span>
          <div class="quantity-control">
            <button onclick="pixelSystem.modifyQuantity('${item.id}', -1)">−</button>
            <span class="quantity-value">1</span>
            <button onclick="pixelSystem.modifyQuantity('${item.id}', 1)">+</button>
          </div>
        </div>

        ${item.options ? `
          <div class="modifier-row">
            <span class="modifier-label">Options:</span>
            <select class="option-select" onchange="pixelSystem.updateOption('${item.id}', this.value)">
              ${item.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
            </select>
          </div>
        ` : ''}
      </div>

      <div class="item-actions">
        <button class="btn-add-ingredient" onclick="pixelSystem.addItemToRecipe('${item.id}')">
          ✨ Add to Recipe
        </button>
        <button class="btn-cancel" onclick="pixelSystem.closeModification()">
          ✕ Cancel
        </button>
      </div>
    `;

    return itemCard;
  }

  // Profile history reel (for saved recipes)
  renderProfileHistoryReel(recipes) {
    const reel = document.createElement('div');
    reel.className = 'profile-history-reel';

    reel.innerHTML = `
      <div class="reel-header">
        <h2>🎬 Your Recipe History</h2>
        <span class="recipe-count">${recipes.length} recipes</span>
      </div>

      <div class="reel-container">
        <div class="reel-scroll">
          ${recipes.map((recipe, idx) => this.renderHistoryCard(recipe, idx)).join('')}
        </div>
      </div>
    `;

    return reel;
  }

  renderHistoryCard(recipe, index) {
    return `
      <div class="history-card pixel-card-frame" data-recipe-id="${recipe.id}">
        <div class="card-frame-border">
          <div class="card-header">
            <span class="card-number">#${index + 1}</span>
            <span class="card-date">${recipe.date || 'Today'}</span>
          </div>

          <div class="card-visual">
            <div class="recipe-pixel-showcase">
              ${recipe.ingredients.slice(0, 4).map(ing => {
                const asset = this.pixelAssets[ing] || { emoji: '🟫' };
                return `<span class="pixel-ingredient-mini">${asset.emoji}</span>`;
              }).join('')}
            </div>
          </div>

          <div class="card-body">
            <h4 class="recipe-name">${recipe.name}</h4>
            <p class="recipe-type">${recipe.type || 'Custom Recipe'}</p>
            <div class="recipe-stats">
              <span class="stat">⏱️ ${recipe.totalTime || '30'}m</span>
              <span class="stat">🍽️ ${recipe.servings || '4'}</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-view" onclick="pixelSystem.viewRecipe(${recipe.id})">
              View →
            </button>
          </div>
        </div>
      </div>
    `;
  }

  viewRecipe(recipeId) {
    console.log('Viewing recipe:', recipeId);
    // Would navigate to recipe detail page
  }

  modifyQuantity(itemId, change) {
    // Handle quantity modification
    console.log('Modify quantity for:', itemId, 'by:', change);
  }

  updateOption(itemId, value) {
    // Handle option selection
    console.log('Update option for:', itemId, 'to:', value);
  }

  addItemToRecipe(itemId) {
    // Add modified item to recipe
    console.log('Adding item to recipe:', itemId);
  }

  closeModification() {
    // Close the modification modal
    const modal = document.querySelector('.item-modification-card');
    if (modal) modal.remove();
  }
}

// Initialize the system
let pixelSystem = null;

function initPixelIngredientSystem(containerId, recipeId) {
  pixelSystem = new PixelIngredientSystem(containerId, recipeId);
  return pixelSystem;
}
