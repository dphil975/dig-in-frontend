/**
 * Pixel Ingredient System — "Cooking Mama" Theme
 * Recipe Card Part Two: after the user commits to a recipe and returns
 * from the store, CookingMode takes over with a pixel cooking-game flow.
 *
 *   intro  → pantry check (inventory grid, toggle have/missing)
 *   steps  → step-by-step cards, heart arrows, TIME bar
 *   finish → "Let's combine" plate + "New recipe added!" + made-counter
 */

/* ══════════════════════════════════════════════════════════════ */
/* Substitution rules — mirrors backend/substitution_engine.py     */
/* "You don't have X? Use Y. Here's how."                          */
/* ══════════════════════════════════════════════════════════════ */
const SUBSTITUTIONS = {
  'buttermilk': [
    { name: 'Milk + lemon juice', emoji: '🥛', ratio: '1 cup milk + 1 tbsp lemon', note: 'wait 5 minutes' },
    { name: 'Yogurt',             emoji: '🍦', ratio: '1:1', note: 'thin with milk if too thick' },
    { name: 'Sour cream',         emoji: '🥄', ratio: '1:1', note: 'works in baked goods' },
  ],
  'heavy cream': [
    { name: 'Milk + butter',  emoji: '🧈', ratio: '¾ cup milk + ¼ cup melted butter', note: '' },
    { name: 'Coconut milk',   emoji: '🥥', ratio: '1:1', note: 'adds coconut flavor' },
    { name: 'Greek yogurt',   emoji: '🍦', ratio: '1:1', note: 'works in sauces' },
  ],
  'egg': [
    { name: 'Mashed banana', emoji: '🍌', ratio: '¼ cup = 1 egg', note: 'best for sweet dishes' },
    { name: 'Applesauce',    emoji: '🍎', ratio: '¼ cup = 1 egg', note: 'adds moisture' },
    { name: 'Flax egg',      emoji: '🌾', ratio: '1 tbsp flax + 3 tbsp water', note: 'wait 10 minutes' },
    { name: 'Silken tofu',   emoji: '🧈', ratio: '¼ cup = 1 egg', note: 'great for quiche' },
  ],
  'flour': [
    { name: 'Whole wheat flour', emoji: '🌾', ratio: '¾ cup = 1 cup AP', note: 'add 2 tbsp liquid' },
    { name: 'Oat flour',         emoji: '🥣', ratio: '1:1', note: 'blend oats until fine' },
    { name: 'Almond flour',      emoji: '🥜', ratio: '1:1', note: 'add 1 egg for binding' },
  ],
  'butter': [
    { name: 'Coconut oil',  emoji: '🥥', ratio: '1:1', note: 'slight coconut taste' },
    { name: 'Olive oil',    emoji: '🫒', ratio: '¾ cup = 1 cup butter', note: 'savory dishes' },
    { name: 'Greek yogurt', emoji: '🍦', ratio: '½ cup = 1 cup butter', note: 'adds protein' },
  ],
  'fresh herbs': [
    { name: 'Dried herbs', emoji: '🌿', ratio: '1 tsp dried = 1 tbsp fresh', note: '' },
    { name: 'Herb paste',  emoji: '🟢', ratio: '1 tsp = 1 tbsp fresh', note: '' },
  ],
  'onion': [
    { name: 'Shallot',      emoji: '🧅', ratio: '1:1', note: 'milder flavor' },
    { name: 'Leek',         emoji: '🥬', ratio: '1:1', note: 'use white/light green parts' },
    { name: 'Scallion',     emoji: '🌱', ratio: '2:1', note: 'green onion flavor' },
    { name: 'Onion powder', emoji: '🧂', ratio: '1 tbsp = 1 medium onion', note: '' },
  ],
  'garlic': [
    { name: 'Garlic powder', emoji: '🧂', ratio: '½ tsp = 1 clove', note: '' },
    { name: 'Shallot',       emoji: '🧅', ratio: '1 small = 2 cloves', note: '' },
    { name: 'Asafoetida',    emoji: '✨', ratio: '⅛ tsp = 1 clove', note: 'Indian cooking' },
  ],
  'chicken breast': [
    { name: 'Chicken thigh', emoji: '🍗', ratio: '1:1', note: 'more flavorful, cook longer' },
    { name: 'Tofu',          emoji: '🧈', ratio: '1:1', note: 'press and marinate first' },
    { name: 'Seitan',        emoji: '🍖', ratio: '1:1', note: 'great texture substitute' },
  ],
  'ground beef': [
    { name: 'Ground turkey', emoji: '🦃', ratio: '1:1', note: 'add oil for moisture' },
    { name: 'Lentils',       emoji: '🫘', ratio: '1 cup cooked = 1 lb', note: 'tacos & bolognese' },
    { name: 'Mushrooms',     emoji: '🍄', ratio: '8 oz chopped = 1 lb', note: 'umami bomb' },
  ],
  'ground pork': [
    { name: 'Ground chicken', emoji: '🍗', ratio: '1:1', note: 'lighter flavor' },
    { name: 'Crumbled tofu',  emoji: '🧈', ratio: '1:1', note: 'press firm tofu first' },
    { name: 'Mushrooms',      emoji: '🍄', ratio: '1:1 chopped', note: 'umami-rich' },
  ],
  'soy sauce': [
    { name: 'Tamari',        emoji: '🍶', ratio: '1:1', note: 'gluten-free' },
    { name: 'Coconut aminos',emoji: '🥥', ratio: '1:1', note: 'slightly sweeter' },
    { name: 'Miso + water',  emoji: '🥣', ratio: '1 tsp miso + 1 tsp water', note: '' },
  ],
  'ginger': [
    { name: 'Ground ginger',   emoji: '🧂', ratio: '¼ tsp = 1 tbsp fresh', note: '' },
    { name: 'Galangal',        emoji: '🫚', ratio: '1:1', note: 'Thai cooking' },
    { name: 'Lemongrass',      emoji: '🌱', ratio: '1 stalk = 1 tbsp', note: 'bright & citrusy' },
  ],
  'sesame oil': [
    { name: 'Peanut oil + sesame seeds', emoji: '🥜', ratio: '1:1 + pinch of seeds', note: '' },
    { name: 'Walnut oil',                emoji: '🌰', ratio: '1:1', note: 'nutty finish' },
  ],
  'rice': [
    { name: 'Quinoa',           emoji: '🥣', ratio: '1:1', note: 'protein boost' },
    { name: 'Cauliflower rice', emoji: '🥦', ratio: '1:1', note: 'low-carb' },
    { name: 'Couscous',         emoji: '🍚', ratio: '1:1', note: 'cooks faster' },
  ],
  'kimchi': [
    { name: 'Sauerkraut + chili', emoji: '🌶️', ratio: '1:1 + gochugaru or sriracha', note: '' },
    { name: 'Pickled veg',        emoji: '🥒', ratio: '1:1', note: 'add chili flakes' },
  ],
  'mushrooms': [
    { name: 'Eggplant',  emoji: '🍆', ratio: '1:1', note: 'meaty texture' },
    { name: 'Zucchini',  emoji: '🥒', ratio: '1:1', note: 'milder taste' },
    { name: 'Tofu',      emoji: '🧈', ratio: '1:1', note: 'soaks up sauce' },
  ],
  'shrimp': [
    { name: 'Chicken',       emoji: '🍗', ratio: '1:1', note: 'cut bite-size' },
    { name: 'Firm tofu',     emoji: '🧈', ratio: '1:1', note: 'pan-fry until golden' },
    { name: 'White fish',    emoji: '🐟', ratio: '1:1', note: 'gentle cooking' },
  ],
  'milk': [
    { name: 'Oat milk',  emoji: '🥣', ratio: '1:1', note: 'creamy & neutral' },
    { name: 'Soy milk',  emoji: '🫘', ratio: '1:1', note: 'best for baking' },
    { name: 'Almond milk', emoji: '🥜', ratio: '1:1', note: 'lighter texture' },
  ],
  'sugar': [
    { name: 'Honey',       emoji: '🍯', ratio: '¾ cup = 1 cup sugar', note: 'reduce liquid slightly' },
    { name: 'Maple syrup', emoji: '🍁', ratio: '¾ cup = 1 cup sugar', note: '' },
  ],
  'tofu': [
    { name: 'Chickpeas',     emoji: '🫘', ratio: '1:1', note: 'hearty bite' },
    { name: 'Paneer',        emoji: '🧀', ratio: '1:1', note: "doesn't melt" },
    { name: 'White beans',   emoji: '🫘', ratio: '1:1', note: 'soft & creamy' },
  ],
};

const GENERIC_SUBS = [
  { name: 'Skip it & improvise', emoji: '✨', ratio: '—', note: 'the best fusion comes from improv' },
  { name: 'Something similar you have', emoji: '🔄', ratio: '1:1', note: 'match the texture' },
  { name: 'Umami boost (miso or soy)', emoji: '🥣', ratio: 'a pinch', note: 'covers savory gaps' },
];

function findSubstitutes(ingredient) {
  const key = (ingredient || '').toLowerCase();
  if (SUBSTITUTIONS[key]) return SUBSTITUTIONS[key];
  for (const [k, subs] of Object.entries(SUBSTITUTIONS)) {
    if (key.includes(k) || k.includes(key)) return subs;
  }
  return GENERIC_SUBS;
}

/* ══════════════════════════════════════════════════════════════ */
/* Core component library                                          */
/* ══════════════════════════════════════════════════════════════ */
class PixelIngredientSystem {
  constructor(containerId, recipeId) {
    this.container = document.getElementById(containerId);
    this.recipeId = recipeId;
    this.selectedIngredients = new Map(); // ingredient -> {hasIt, addedPrice}
    this.userAddedIngredients = new Set();
    this.pixelAssets = this.loadPixelAssets();
    this.currentStep = 0;
  }

  loadPixelAssets() {
    return {
      'tofu':              { emoji: '🧈', color: '#D4A574', label: 'Tofu' },
      'ground pork':       { emoji: '🥩', color: '#C41E3A', label: 'Pork' },
      'soy sauce':         { emoji: '🍶', color: '#3D2817', label: 'Soy' },
      'garlic':            { emoji: '🧄', color: '#F5F5F5', label: 'Garlic' },
      'ginger':            { emoji: '🫚', color: '#FFD700', label: 'Ginger' },
      'sesame oil':        { emoji: '🫗', color: '#8B4513', label: 'Oil' },
      'green onions':      { emoji: '🌱', color: '#228B22', label: 'Onion' },
      'chicken breast':    { emoji: '🍗', color: '#FF8C00', label: 'Chicken' },
      'eggs':              { emoji: '🥚', color: '#FFD700', label: 'Eggs' },
      'rice':              { emoji: '🍚', color: '#FFFACD', label: 'Rice' },
      'nori':              { emoji: '🍙', color: '#2F4F2F', label: 'Nori' },
      'mushrooms':         { emoji: '🍄', color: '#8B4513', label: 'Mushroom' },
      'kimchi':            { emoji: '🌶️', color: '#DC143C', label: 'Kimchi' },
      'spinach':           { emoji: '🥬', color: '#228B22', label: 'Spinach' },
      'carrot':            { emoji: '🥕', color: '#FF8C00', label: 'Carrot' },
      'cabbage':           { emoji: '🥬', color: '#90EE90', label: 'Cabbage' },
      'beef':              { emoji: '🥩', color: '#8B0000', label: 'Beef' },
      'toasted cashews':   { emoji: '🥜', color: '#DAA520', label: 'Cashews' },
      'water chestnuts':   { emoji: '🌰', color: '#E8E8E8', label: 'Chestnuts' },
      'panko breadcrumbs': { emoji: '🍞', color: '#F4A460', label: 'Panko' },
      'butter':            { emoji: '🧈', color: '#FFE08A', label: 'Butter' },
      'flour':             { emoji: '🌾', color: '#F5DEB3', label: 'Flour' },
      'sugar':             { emoji: '🍬', color: '#FFF', label: 'Sugar' },
      'milk':              { emoji: '🥛', color: '#FFF', label: 'Milk' },
      'onion':             { emoji: '🧅', color: '#E8C39E', label: 'Onion' },
      'tomato':            { emoji: '🍅', color: '#E84A5F', label: 'Tomato' },
      'cheese':            { emoji: '🧀', color: '#FFC93C', label: 'Cheese' },
      'shrimp':            { emoji: '🦐', color: '#FF8C69', label: 'Shrimp' },
      'noodles':           { emoji: '🍜', color: '#F4D793', label: 'Noodles' },
      'potato':            { emoji: '🥔', color: '#C9A66B', label: 'Potato' },
    };
  }

  // Fuzzy lookup: "2 cloves garlic, minced" -> garlic asset
  assetFor(name) {
    const key = (name || '').toLowerCase();
    if (this.pixelAssets[key]) return this.pixelAssets[key];
    for (const [k, v] of Object.entries(this.pixelAssets)) {
      if (key.includes(k) || k.includes(key)) return v;
    }
    return { emoji: '🍳', color: '#F8C8DA', label: this.shortLabel(name) };
  }

  shortLabel(name) {
    const clean = (name || '').replace(/^[\d/.\s]+(cups?|tbsp|tsp|oz|lbs?|g|kg|ml|cloves?|cans?)?\s*/i, '');
    const word = clean.split(/[,(]/)[0].trim();
    return word.length > 10 ? word.slice(0, 9) + '…' : (word || 'Item');
  }

  /* ── Ingredient inventory grid ──────────────────────────────── */
  renderIngredientGrid(ingredients) {
    const grid = document.createElement('div');
    grid.className = 'pixel-ingredient-grid';
    grid.innerHTML = `
      <div class="ingredient-grid-header">
        <h3>🧺 Pantry Check</h3>
        <span class="ingredient-count">${ingredients.length} items</span>
      </div>
      <div class="ingredient-items">
        ${ingredients.map((ing, idx) => this.renderPixelIngredient(ing, idx)).join('')}
      </div>
    `;

    grid.addEventListener('click', e => {
      const toggle = e.target.closest('[data-toggle]');
      if (toggle) this.toggleIngredient(toggle.dataset.toggle);
    });

    return grid;
  }

  renderPixelIngredient(ingredient, index) {
    const asset = this.assetFor(ingredient);
    const hasIt = this.selectedIngredients.get(ingredient)?.hasIt ?? true;
    const isAdded = this.userAddedIngredients.has(ingredient);
    const addedPrice = this.selectedIngredients.get(ingredient)?.addedPrice;

    return `
      <div class="pixel-ingredient-item ${!hasIt ? 'missing' : ''} ${isAdded ? 'added' : ''}"
           data-ingredient="${ingredient.replace(/"/g, '&quot;')}"
           data-index="${index}">
        <div class="pixel-box">
          <span class="pixel-emoji">${asset.emoji}</span>
        </div>
        <div class="ingredient-label">
          <span class="ingredient-name">${asset.label}</span>
          ${addedPrice ? `<span class="price-tag">+$${addedPrice.toFixed(2)}</span>` : ''}
        </div>
        <button class="ingredient-toggle" data-toggle="${ingredient.replace(/"/g, '&quot;')}"
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

  /* ── Recipe steps slider ────────────────────────────────────── */
  renderRecipeStepsSlider(steps) {
    const slider = document.createElement('div');
    slider.className = 'recipe-steps-slider-container';

    slider.innerHTML = `
      <div class="steps-header">
        <h3>🍴 Let's cook!</h3>
        <span class="step-counter"><span class="current-step">1</span> / ${steps.length}</span>
      </div>

      <div class="cm-time-bar">
        <span class="cm-time-label">🐰 TIME</span>
        <div class="cm-time-track"><div class="cm-time-fill" style="width:${100 / steps.length}%"></div></div>
      </div>

      <div class="steps-carousel">
        <button class="carousel-btn prev" data-nav="prev" aria-label="Previous step"><span>‹</span></button>
        <div class="steps-slides">
          ${steps.map((step, idx) => this.renderStepCard(step, idx)).join('')}
        </div>
        <button class="carousel-btn next" data-nav="next" aria-label="Next step"><span>›</span></button>
      </div>

      <div class="step-dots">
        ${steps.map((_, idx) => `
          <button class="dot ${idx === 0 ? 'active' : ''}" data-dot="${idx}" title="Step ${idx + 1}"></button>
        `).join('')}
      </div>
    `;

    // event delegation — no globals needed
    slider.addEventListener('click', e => {
      const nav = e.target.closest('[data-nav]');
      const dot = e.target.closest('[data-dot]');
      if (nav) nav.dataset.nav === 'next' ? this.nextStep() : this.previousStep();
      if (dot) this.goToStep(Number(dot.dataset.dot));
    });

    return slider;
  }

  renderStepCard(step, index) {
    return `
      <div class="step-card ${index === 0 ? 'active' : ''}" data-step="${index}">
        <div class="step-number"><span class="num">${index + 1}</span></div>
        <div class="step-content">
          <h4>Step ${index + 1}</h4>
          <p>${step}</p>
          <div class="step-visual-hint">
            <span class="hint-icon">👉</span>
            <span class="hint-text">Tap ♥ to continue</span>
          </div>
        </div>
      </div>
    `;
  }

  nextStep() {
    const steps = this.stepCount();
    this.currentStep = (this.currentStep + 1) % steps;
    this.updateStepDisplay();
  }

  previousStep() {
    const steps = this.stepCount();
    this.currentStep = (this.currentStep - 1 + steps) % steps;
    this.updateStepDisplay();
  }

  goToStep(stepIndex) {
    this.currentStep = stepIndex;
    this.updateStepDisplay();
  }

  stepCount() {
    return (this.container || document).querySelectorAll('.step-card').length;
  }

  updateStepDisplay() {
    const root = this.container || document;
    root.querySelectorAll('.step-card').forEach(card => card.classList.remove('active'));
    root.querySelector(`[data-step="${this.currentStep}"]`)?.classList.add('active');

    const total = this.stepCount();
    const counter = root.querySelector('.current-step');
    if (counter) counter.textContent = this.currentStep + 1;

    const fill = root.querySelector('.cm-time-fill');
    if (fill) fill.style.width = `${((this.currentStep + 1) / total) * 100}%`;

    root.querySelectorAll('.step-dots .dot').forEach((dot, idx) => {
      dot.classList.toggle('active', idx === this.currentStep);
    });
  }

  updateDisplay() {
    // re-render toggled item states in place
    const root = this.container || document;
    this.selectedIngredients.forEach(({ hasIt }, ingredient) => {
      const esc = (typeof CSS !== 'undefined' && CSS.escape)
        ? CSS.escape(ingredient)
        : ingredient.replace(/["\\]/g, '\\$&');
      const item = root.querySelector(`[data-ingredient="${esc}"]`);
      if (!item) return;
      item.classList.toggle('missing', !hasIt);
      const btn = item.querySelector('.ingredient-toggle');
      if (btn) btn.textContent = hasIt ? '✓' : '✗';
    });
  }

  /* ── Item modification card (Love Shot style) ───────────────── */
  renderItemModification(item) {
    const itemCard = document.createElement('div');
    itemCard.className = 'item-modification-card';

    itemCard.innerHTML = `
      <div class="item-card-header">
        <div class="item-visual">
          <div class="item-pixel-art">${item.emoji || '🎀'}</div>
        </div>
        <div class="item-info">
          <h4>${item.name}</h4>
          <p class="item-description">${item.description}</p>
          ${item.priceModifier ? `<span class="price-modifier">${item.priceModifier > 0 ? '+' : ''}$${item.priceModifier.toFixed(2)}</span>` : ''}
        </div>
      </div>

      <div class="item-modifiers">
        <div class="modifier-row">
          <span class="modifier-label">Quantity:</span>
          <div class="quantity-control">
            <button data-qty="-1">−</button>
            <span class="quantity-value">1</span>
            <button data-qty="1">+</button>
          </div>
        </div>
        ${item.options ? `
          <div class="modifier-row">
            <span class="modifier-label">Options:</span>
            <select class="option-select">
              ${item.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
            </select>
          </div>
        ` : ''}
      </div>

      <div class="item-actions">
        <button class="btn-add-ingredient" data-action="add">♥ Add to Recipe</button>
        <button class="btn-cancel" data-action="cancel">✕ Cancel</button>
      </div>
    `;

    itemCard.addEventListener('click', e => {
      const qty = e.target.closest('[data-qty]');
      if (qty) {
        const span = itemCard.querySelector('.quantity-value');
        span.textContent = Math.max(1, Number(span.textContent) + Number(qty.dataset.qty));
      }
      const action = e.target.closest('[data-action]');
      if (action?.dataset.action === 'cancel') itemCard.remove();
      if (action?.dataset.action === 'add') {
        this.userAddedIngredients.add(item.name.toLowerCase());
        itemCard.remove();
      }
    });

    return itemCard;
  }

  /* ── Profile history reel ───────────────────────────────────── */
  renderProfileHistoryReel(recipes) {
    const reel = document.createElement('div');
    reel.className = 'profile-history-reel';

    reel.innerHTML = `
      <div class="reel-header">
        <h2>📖 Cooked Recipes</h2>
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
              ${(recipe.ingredients || []).slice(0, 4).map(ing => {
                const asset = this.assetFor(typeof ing === 'string' ? ing : ing.name);
                return `<span class="pixel-ingredient-mini">${asset.emoji}</span>`;
              }).join('')}
            </div>
          </div>
          <div class="card-body">
            <h4 class="recipe-name">${recipe.name}</h4>
            <p class="recipe-type">${recipe.type || recipe.cuisine || 'Custom Recipe'}</p>
            <div class="recipe-stats">
              <span class="stat">⏱ ${recipe.totalTime || '30'}m</span>
              <span class="stat">🍽 ${recipe.servings || '4'}</span>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn-view" onclick="location.href='recipe.html?id=${recipe.id}'">View →</button>
          </div>
        </div>
      </div>
    `;
  }
}

/* ══════════════════════════════════════════════════════════════ */
/* COOKING MODE — Recipe Card Part Two                             */
/* ══════════════════════════════════════════════════════════════ */
class CookingMode {
  static HISTORY_KEY = 'dig_in_cook_history';
  static COUNT_KEY   = 'dig_in_made_count';

  /**
   * opts.missing — ingredient names already known to be missing (pre-marks ✗)
   * opts.swaps   — [[from, to], ...] substitutions chosen by the user;
   *                `from` is marked missing, `to` joins the tray with a NEW badge
   */
  constructor(recipe, opts = {}) {
    this.recipe = this.normalize(recipe);
    this.system = new PixelIngredientSystem(null, this.recipe.id);
    this.phase = 'intro';
    this.overlay = null;
    this.opts = opts;
    this.applyPantryState(opts);
  }

  static launch(recipe, opts) {
    const mode = new CookingMode(recipe, opts);
    mode.open();
    return mode;
  }

  applyPantryState({ missing = [], swaps = [] } = {}) {
    const findMatch = name => this.recipe.ingredients.find(i =>
      i.toLowerCase().includes(String(name).toLowerCase()) ||
      String(name).toLowerCase().includes(i.toLowerCase())
    );

    this.swappedFrom = new Set();
    [...missing, ...swaps.map(([from]) => from)].forEach(name => {
      const match = findMatch(name);
      if (match) this.system.selectedIngredients.set(match, { hasIt: false, addedPrice: 0 });
    });
    swaps.forEach(([from]) => {
      const match = findMatch(from);
      if (match) this.swappedFrom.add(match);
    });

    swaps.forEach(([, to]) => {
      if (!to) return;
      this.recipe.ingredients.push(to);
      this.system.userAddedIngredients.add(to);
      this.system.selectedIngredients.set(to, { hasIt: true, addedPrice: 0 });
    });
  }

  normalize(r) {
    const ingredients = (r.ingredients || []).map(ing => {
      if (typeof ing === 'string') return ing;
      return `${ing.quantity ?? ing.amount ?? ''} ${ing.unit ?? ''} ${ing.name ?? ''}`.replace(/\s+/g, ' ').trim();
    }).filter(Boolean);

    const steps = (r.instructions || r.steps || []).map(s =>
      typeof s === 'string' ? s : (s.instruction || s.text || '')
    ).filter(Boolean);

    return {
      id: r.id ?? Date.now(),
      name: r.name || 'Mystery Dish',
      cuisine: r.cuisine || r.cuisine_type || '',
      servings: r.servings || 4,
      totalTime: r.totalTime || r.total_time || r.time || 30,
      ingredients,
      steps: steps.length ? steps : ['Mix everything together with love! ♥'],
    };
  }

  open() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'cm-overlay';
    document.body.style.overflow = 'hidden';
    document.body.appendChild(this.overlay);
    this.renderIntro();
  }

  close() {
    this.overlay?.remove();
    this.overlay = null;
    document.body.style.overflow = '';
  }

  stage(innerHTML) {
    this.overlay.innerHTML = `
      <div class="cm-curtain"></div>
      <div class="cm-stage">${innerHTML}</div>
    `;
    this.system.container = this.overlay;
    return this.overlay.querySelector('.cm-stage');
  }

  bubble(text, emoji = '👩‍🍳') {
    return `
      <div class="cm-mama-row">
        <div class="cm-mama-avatar">${emoji}</div>
        <div class="cm-speech-bubble">${text}</div>
      </div>
    `;
  }

  /* ── Phase 1: pantry check ──────────────────────────────────── */
  renderIntro() {
    this.phase = 'intro';
    const swaps = this.opts.swaps || [];
    const greeting = swaps.length
      ? `Let's make <b>${this.recipe.name}</b> with what you have!<br>Your swaps are in the tray with a NEW tag. ♥`
      : `Welcome back from the store!<br>Time to make <b>${this.recipe.name}</b>.<br>Check your ingredients!`;
    const stage = this.stage(`
      <div class="cm-ribbon"><div class="cm-ribbon-plate">Let's cook</div></div>
      ${this.bubble(greeting)}
      <div id="cmGrid"></div>
      <div class="cm-confirm-bar">
        <button class="cm-btn cm-btn-cancel" data-cm="quit"><span class="btn-dot"></span>Cancel</button>
        <button class="cm-btn cm-btn-make" data-cm="start"><span class="btn-dot"></span>Let's cook!</button>
      </div>
    `);

    stage.querySelector('#cmGrid').appendChild(
      this.system.renderIngredientGrid(this.recipe.ingredients)
    );

    stage.addEventListener('click', e => {
      // grid handler (deeper) toggles first; here we react to the new state
      const toggle = e.target.closest('[data-toggle]');
      if (toggle) {
        const ing = toggle.dataset.toggle;
        const nowMissing = this.system.selectedIngredients.get(ing)?.hasIt === false;
        if (nowMissing && !this.swappedFrom?.has(ing)) this.showSubstitutionCard(ing);
        return;
      }

      const btn = e.target.closest('[data-cm]');
      if (!btn) return;
      if (btn.dataset.cm === 'quit') this.close();
      if (btn.dataset.cm === 'start') {
        const uncovered = this.uncoveredMissing();
        uncovered.length > 0 ? this.renderMissingWarning(uncovered) : this.renderSteps();
      }
    });
  }

  uncoveredMissing() {
    return [...this.system.selectedIngredients.entries()]
      .filter(([name, v]) => !v.hasIt && !this.swappedFrom?.has(name))
      .map(([name]) => name);
  }

  renderMissingWarning(missing) {
    const count = missing.length;
    const stage = this.stage(`
      <div class="cm-ribbon"><div class="cm-ribbon-plate">Hold on!</div></div>
      ${this.bubble(`You're missing <b>${count} ingredient${count > 1 ? 's' : ''}</b>!<br>Want a swap suggestion, or cook anyway?`, '😲')}
      <div class="cm-confirm-bar">
        <button class="cm-btn cm-btn-cancel" data-cm="back"><span class="btn-dot"></span>Back</button>
        <button class="cm-btn cm-btn-make" data-cm="swaps"><span class="btn-dot"></span>See swaps</button>
        <button class="cm-btn cm-btn-make" data-cm="anyway"><span class="btn-dot"></span>Cook anyway!</button>
      </div>
    `);
    stage.addEventListener('click', e => {
      const btn = e.target.closest('[data-cm]');
      if (!btn) return;
      if (btn.dataset.cm === 'back') this.renderIntro();
      if (btn.dataset.cm === 'anyway') this.renderSteps();
      if (btn.dataset.cm === 'swaps') {
        this.renderIntro();
        this.showSubstitutionCard(missing[0]);
      }
    });
  }

  /* ── Substitution suggestion card (Love Shot style) ─────────── */
  showSubstitutionCard(ingredient) {
    const subs = findSubstitutes(ingredient);
    const label = this.system.shortLabel(ingredient);
    let chosen = 0;

    const layer = document.createElement('div');
    layer.className = 'cm-modal-layer';

    const renderCard = () => {
      const sub = subs[chosen];
      layer.innerHTML = `
        <div class="item-modification-card">
          <div class="item-card-header">
            <div class="item-visual">
              <div class="item-pixel-art">${sub.emoji}</div>
            </div>
            <div class="item-info">
              <h4>No ${label}?</h4>
              <p class="item-description">Use <b>${sub.name}</b>!${sub.note ? `<br>${sub.note}` : ''}</p>
              <span class="price-modifier">📏 ${sub.ratio}</span>
            </div>
          </div>
          <div class="item-modifiers">
            <div class="modifier-row">
              <span class="modifier-label">Swap with:</span>
              <select class="option-select" data-sub-select>
                ${subs.map((s, i) => `<option value="${i}" ${i === chosen ? 'selected' : ''}>${s.emoji} ${s.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="item-actions">
            <button class="btn-add-ingredient" data-sub="use">♥ Use this swap</button>
            <button class="btn-cancel" data-sub="skip">✕ No thanks</button>
          </div>
        </div>
      `;
    };
    renderCard();

    layer.addEventListener('change', e => {
      if (e.target.matches('[data-sub-select]')) {
        chosen = Number(e.target.value);
        renderCard();
      }
    });
    layer.addEventListener('click', e => {
      if (e.target === layer) { layer.remove(); return; }   // tap backdrop to dismiss
      const btn = e.target.closest('[data-sub]');
      if (!btn) return;
      if (btn.dataset.sub === 'use') this.applySwap(ingredient, subs[chosen].name);
      layer.remove();
    });

    this.overlay.appendChild(layer);
  }

  applySwap(original, subName) {
    this.swappedFrom = this.swappedFrom || new Set();
    this.swappedFrom.add(original);
    this.system.selectedIngredients.set(original, { hasIt: false, addedPrice: 0 });

    if (!this.recipe.ingredients.includes(subName)) this.recipe.ingredients.push(subName);
    this.system.userAddedIngredients.add(subName);
    this.system.selectedIngredients.set(subName, { hasIt: true, addedPrice: 0 });

    // refresh the tray in place
    const gridHost = this.overlay.querySelector('#cmGrid');
    if (gridHost) {
      gridHost.innerHTML = '';
      gridHost.appendChild(this.system.renderIngredientGrid(this.recipe.ingredients));
    }
  }

  /* ── Phase 2: step-by-step cooking ──────────────────────────── */
  renderSteps() {
    this.phase = 'steps';
    this.system.currentStep = 0;
    const stage = this.stage(`
      <div class="cm-ribbon"><div class="cm-ribbon-plate">${this.recipe.name}</div></div>
      <div id="cmSlider"></div>
      <div class="cm-confirm-bar">
        <button class="cm-btn cm-btn-cancel" data-cm="quit"><span class="btn-dot"></span>Quit</button>
        <button class="cm-btn cm-btn-make" data-cm="done"><span class="btn-dot"></span>Finished!</button>
      </div>
    `);

    stage.querySelector('#cmSlider').appendChild(
      this.system.renderRecipeStepsSlider(this.recipe.steps)
    );

    stage.addEventListener('click', e => {
      const btn = e.target.closest('[data-cm]');
      if (!btn) return;
      if (btn.dataset.cm === 'quit') this.close();
      if (btn.dataset.cm === 'done') this.renderFinish();
    });
  }

  /* ── Phase 3: combine + reward ──────────────────────────────── */
  renderFinish() {
    this.phase = 'finish';
    const count = this.bumpMadeCount();
    this.saveHistory();

    const plateEmojis = this.recipe.ingredients.slice(0, 5)
      .map(ing => this.system.assetFor(ing).emoji).join('');

    const stage = this.stage(`
      <div class="cm-ribbon"><div class="cm-ribbon-plate">Let's combine</div></div>
      ${this.bubble(`<b>New recipe added!</b><br>You did it — it looks delicious! ♥`, '🥳')}
      <div class="cm-dish-preview">
        <div class="cm-dish-name">${this.recipe.name}</div>
        <div class="cm-plate">${plateEmojis || '🍽️'}</div>
      </div>
      <div style="text-align:center;">
        <div class="cm-counter-badge">
          <span class="cm-counter-label">🥞 Dishes made</span>
          <span class="cm-counter-value">${count}</span>
        </div>
      </div>
      <div class="cm-confirm-bar">
        <button class="cm-btn cm-btn-return" data-cm="return"><span class="btn-dot"></span>Return</button>
      </div>
    `);

    stage.addEventListener('click', e => {
      if (e.target.closest('[data-cm]')?.dataset.cm === 'return') this.close();
    });
  }

  /* ── Persistence ────────────────────────────────────────────── */
  bumpMadeCount() {
    let n = 0;
    try { n = Number(localStorage.getItem(CookingMode.COUNT_KEY) || 0); } catch (_) {}
    n += 1;
    try { localStorage.setItem(CookingMode.COUNT_KEY, String(n)); } catch (_) {}
    return n;
  }

  saveHistory() {
    try {
      const history = JSON.parse(localStorage.getItem(CookingMode.HISTORY_KEY) || '[]');
      history.unshift({
        id: this.recipe.id,
        name: this.recipe.name,
        cuisine: this.recipe.cuisine,
        ingredients: this.recipe.ingredients,
        servings: this.recipe.servings,
        totalTime: this.recipe.totalTime,
        date: new Date().toLocaleDateString(),
        cookedAt: Date.now(),
      });
      localStorage.setItem(CookingMode.HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
    } catch (_) {}
  }

  static getHistory() {
    try { return JSON.parse(localStorage.getItem(CookingMode.HISTORY_KEY) || '[]'); }
    catch (_) { return []; }
  }
}

/* ── Global init helpers (back-compat with demo page) ─────────── */
let pixelSystem = null;
function initPixelIngredientSystem(containerId, recipeId) {
  pixelSystem = new PixelIngredientSystem(containerId, recipeId);
  return pixelSystem;
}

if (typeof window !== 'undefined') {
  window.PixelIngredientSystem = PixelIngredientSystem;
  window.CookingMode = CookingMode;
  window.initPixelIngredientSystem = initPixelIngredientSystem;
}
