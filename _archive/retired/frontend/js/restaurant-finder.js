/**
 * Dig In: Restaurant Finder & Recipe Recreator
 * Features:
 * - Find restaurants by cuisine or dish name
 * - Click any menu item to get a home recipe
 * - Auto-generates simplified version for home cooks
 * - Suggests substitutions for hard-to-find ingredients
 */

class RestaurantFinder {
    constructor() {
        this.userLocation = null;
        this.nearbyRestaurants = [];
        this.selectedDish = null;
        this.init();
    }

    async init() {
        await this.getUserLocation();
        this.setupSearchInterface();
    }

    async getUserLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                this.showAddressInput();
                resolve(null);
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    resolve(this.userLocation);
                },
                () => {
                    this.showAddressInput();
                    resolve(null);
                }
            );
        });
    }

    showAddressInput() {
        const modal = document.createElement('div');
        modal.className = 'address-modal pixel-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>📍 ENTER YOUR LOCATION</h3>
                <input type="text" id="addressInput" placeholder="City or zip code" class="pixel-input">
                <button id="submitAddress" class="pixel-button">FIND RESTAURANTS</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('#submitAddress').addEventListener('click', async () => {
            const address = modal.querySelector('#addressInput').value;
            if (address) {
                await this.geocodeAddress(address);
                modal.remove();
                this.searchNearbyRestaurants();
            }
        });
    }

    async geocodeAddress(address) {
        // Using OpenStreetMap Nominatim (free)
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.length > 0) {
            this.userLocation = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
    }

    setupSearchInterface() {
        const searchContainer = document.getElementById('restaurantSearch');
        if (!searchContainer) return;
        
        searchContainer.innerHTML = `
            <div class="search-bar pixel-card">
                <input type="text" id="dishSearch" placeholder="Search a dish or cuisine..." class="pixel-input">
                <button id="searchDishBtn" class="pixel-button">🔍 FIND & RECREATE</button>
            </div>
            <div id="restaurantResults" class="restaurant-grid"></div>
            <div id="recreatedRecipe" class="recreated-recipe" style="display:none;"></div>
        `;
        
        document.getElementById('searchDishBtn').addEventListener('click', () => {
            const query = document.getElementById('dishSearch').value;
            if (query) this.searchDish(query);
        });
    }

    async searchDish(dishName) {
        const resultsDiv = document.getElementById('restaurantResults');
        resultsDiv.innerHTML = '<div class="loading">🔍 Searching for restaurants serving this dish...</div>';
        
        // Search local recipe database first
        const matchingRecipes = this.searchLocalRecipes(dishName);
        
        // Search restaurants via API
        const restaurants = await this.searchNearbyRestaurants(dishName);
        
        resultsDiv.innerHTML = `
            <div class="search-summary">
                <h3>🍽️ "${dishName}"</h3>
                <p>Found ${restaurants.length} restaurants nearby</p>
            </div>
            <div class="restaurant-list">
                ${restaurants.map(rest => this.renderRestaurantCard(rest)).join('')}
            </div>
            ${matchingRecipes.length > 0 ? `
                <div class="similar-recipes">
                    <h4>📖 SIMILAR RECIPES IN YOUR COOKBOOK</h4>
                    <div class="recipe-suggestions">
                        ${matchingRecipes.map(recipe => `
                            <div class="recipe-suggestion-card" data-recipe-id="${recipe.id}">
                                <div class="pixel-icon">🍳</div>
                                <div class="recipe-info">
                                    <strong>${recipe.name}</strong>
                                    <span class="recipe-time">⏱️ ${recipe.prepTime + (recipe.cookTime || 0)} min</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
        
        // Add click handlers for recipe suggestions
        document.querySelectorAll('.recipe-suggestion-card').forEach(card => {
            card.addEventListener('click', () => {
                const recipeId = card.dataset.recipeId;
                this.showRecipeFromDatabase(recipeId);
            });
        });
    }

    searchLocalRecipes(query) {
        const lowerQuery = query.toLowerCase();
        const allRecipes = [
            ...RECIPE_DATABASE.smoothie_bowls,
            ...RECIPE_DATABASE.breakfast_bowls,
            ...RECIPE_DATABASE.grain_bowls,
            ...RECIPE_DATABASE.salad_bowls,
            ...RECIPE_DATABASE.soup_bowls,
            ...RECIPE_DATABASE.noodle_bowls,
            ...RECIPE_DATABASE.dessert_bowls
        ];
        
        return allRecipes.filter(recipe => 
            recipe.name.toLowerCase().includes(lowerQuery) ||
            recipe.ingredients.some(i => i.toLowerCase().includes(lowerQuery))
        ).slice(0, 5);
    }

    async searchNearbyRestaurants(dishName = null) {
        if (!this.userLocation) return [];
        
        // Using Google Places API or Yelp Fusion
        // For demo, returning mock data
        const mockRestaurants = [
            {
                id: 1,
                name: "The Cozy Kitchen",
                cuisine: "American",
                distance: 0.3,
                rating: 4.5,
                priceLevel: "$$",
                menuItems: [
                    { name: "Grilled Salmon Bowl", price: 18, description: "Fresh salmon with quinoa, avocado, and lemon dressing" },
                    { name: "Mushroom Risotto", price: 16, description: "Creamy arborio rice with wild mushrooms and parmesan" },
                    { name: "Roasted Vegetable Bowl", price: 14, description: "Seasonal roasted vegetables over farro with tahini sauce" }
                ]
            },
            {
                id: 2,
                name: "Spice & Leaf",
                cuisine: "Asian Fusion",
                distance: 0.5,
                rating: 4.7,
                priceLevel: "$$",
                menuItems: [
                    { name: "Teriyaki Chicken Bowl", price: 16, description: "Grilled chicken, brown rice, broccoli, teriyaki glaze" },
                    { name: "Sushi Burrito", price: 15, description: "Fresh tuna, avocado, cucumber, rice, wrapped in nori" },
                    { name: "Bibimbap", price: 17, description: "Korean rice bowl with veggies, beef, fried egg, gochujang" }
                ]
            },
            {
                id: 3,
                name: "Green Table",
                cuisine: "Vegetarian / Vegan",
                distance: 0.8,
                rating: 4.6,
                priceLevel: "$$",
                menuItems: [
                    { name: "Buddha Bowl", price: 15, description: "Quinoa, roasted sweet potato, chickpeas, kale, tahini dressing" },
                    { name: "Cauliflower Steak", price: 16, description: "Roasted cauliflower with chimichurri and wild rice" },
                    { name: "Zucchini Noodle Pesto", price: 14, description: "Fresh zucchini noodles with house-made pesto and cherry tomatoes" }
                ]
            }
        ];
        
        // Filter by dish name if provided
        if (dishName) {
            return mockRestaurants.filter(rest => 
                rest.menuItems.some(item => 
                    item.name.toLowerCase().includes(dishName.toLowerCase())
                )
            );
        }
        
        return mockRestaurants;
    }

    renderRestaurantCard(restaurant) {
        return `
            <div class="restaurant-card pixel-card" data-restaurant-id="${restaurant.id}">
                <div class="restaurant-header">
                    <div class="restaurant-name">${restaurant.name}</div>
                    <div class="restaurant-meta">
                        <span class="cuisine">${restaurant.cuisine}</span>
                        <span class="distance">📍 ${restaurant.distance} mi</span>
                        <span class="rating">⭐ ${restaurant.rating}</span>
                        <span class="price">${restaurant.priceLevel}</span>
                    </div>
                </div>
                <div class="restaurant-menu">
                    <h4>📋 MENU</h4>
                    <div class="menu-items">
                        ${restaurant.menuItems.map(item => `
                            <div class="menu-item" data-dish="${item.name}" data-price="${item.price}" data-desc="${item.description}">
                                <div class="dish-info">
                                    <span class="dish-name">${item.name}</span>
                                    <span class="dish-price">$${item.price}</span>
                                </div>
                                <div class="dish-desc">${item.description}</div>
                                <button class="recreate-btn pixel-button-small">🍳 RECREATE AT HOME</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    recreateRestaurantDish(dishName, dishDescription, restaurantName) {
        // Generate a home-friendly version of the restaurant dish
        const homeRecipe = this.generateHomeRecipe(dishName, dishDescription, restaurantName);
        
        const recipeDiv = document.getElementById('recreatedRecipe');
        recipeDiv.style.display = 'block';
        recipeDiv.innerHTML = `
            <div class="recreated-header">
                <div class="pixel-icon">🏠→🍳</div>
                <h3>RECREATE: ${dishName}</h3>
                <div class="restaurant-attribution">Inspired by ${restaurantName}</div>
            </div>
            <div class="recreated-content">
                <div class="home-recipe-card">
                    <div class="recipe-section">
                        <h4>📝 INGREDIENTS</h4>
                        <ul class="ingredient-list">
                            ${homeRecipe.ingredients.map(ing => `<li><input type="checkbox"> ${ing}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="recipe-section">
                        <h4>👩‍🍳 INSTRUCTIONS</h4>
                        <ol class="instruction-list">
                            ${homeRecipe.instructions.map(inst => `<li>${inst}</li>`).join('')}
                        </ol>
                    </div>
                    <div class="recipe-tips">
                        <div class="tip"><strong>💡 Swap Tips:</strong> ${homeRecipe.swapTips}</div>
                        <div class="tip"><strong>⏱️ Time:</strong> ${homeRecipe.totalTime} minutes</div>
                        <div class="tip"><strong>💰 Cost Estimate:</strong> ~$${homeRecipe.estimatedCost}</div>
                    </div>
                    <div class="save-recipe">
                        <button class="save-recipe-btn pixel-button" data-dish="${dishName}">💾 SAVE TO MY RECIPES</button>
                    </div>
                </div>
            </div>
        `;
        
        // Scroll to recipe
        recipeDiv.scrollIntoView({ behavior: 'smooth' });
        
        // Add save functionality
        recipeDiv.querySelector('.save-recipe-btn')?.addEventListener('click', () => {
            this.saveHomeRecipe(homeRecipe);
        });
    }

    generateHomeRecipe(dishName, dishDescription, restaurantName) {
        // Intelligently generate a home version based on the dish name
        const lowerName = dishName.toLowerCase();
        
        // Default recipe structure
        let ingredients = [];
        let instructions = [];
        let swapTips = "";
        let totalTime = 30;
        let estimatedCost = 0;
        
        // Match known dish types
        if (lowerName.includes('bowl') || lowerName.includes('salad')) {
            ingredients = [
                "Base grain (quinoa, rice, or farro) - 1 cup",
                "Fresh greens (spinach, kale, or arugula) - 2 cups",
                "Protein (chicken, tofu, beans, or shrimp) - 1 cup",
                "Fresh vegetables (roasted or raw) - 1 cup",
                "Avocado - 1/2",
                "Dressing of choice",
                "Seeds or nuts for crunch"
            ];
            instructions = [
                "Cook your grain according to package instructions",
                "Prepare your protein (grill, pan-sear, or roast)",
                "Chop fresh vegetables",
                "Layer greens in bowl, add cooked grain",
                "Add protein, vegetables, and avocado",
                "Drizzle with dressing, top with seeds/nuts"
            ];
            swapTips = "Use whatever grain and veggies you have on hand. Leftover roasted vegetables work great!";
            totalTime = 25;
            estimatedCost = 8;
            
        } else if (lowerName.includes('noodle')) {
            ingredients = [
                "Rice noodles or zucchini noodles - 8 oz",
                "Protein - 1 cup (chicken, shrimp, or tofu)",
                "Garlic - 3 cloves, minced",
                "Vegetables (bell peppers, carrots, snap peas) - 2 cups",
                "Soy sauce or tamari - 3 tbsp",
                "Sesame oil - 1 tbsp",
                "Ginger - 1 tsp grated",
                "Scallions for garnish"
            ];
            instructions = [
                "Cook noodles according to package, drain",
                "Heat sesame oil in wok or large pan",
                "Add garlic and ginger, cook 30 seconds",
                "Add protein, cook until done",
                "Add vegetables, stir-fry 3-4 minutes",
                "Add cooked noodles and soy sauce, toss to combine",
                "Garnish with scallions and serve"
            ];
            swapTips = "Use any vegetables in your fridge. Add red pepper flakes for heat!";
            totalTime = 20;
            estimatedCost = 10;
            
        } else if (lowerName.includes('soup')) {
            ingredients = [
                "Vegetable or chicken broth - 4 cups",
                "Onion - 1, diced",
                "Garlic - 2 cloves, minced",
                "Vegetables of choice - 3 cups chopped",
                "Protein (beans, chicken, or tofu) - 1 cup",
                "Herbs (thyme, rosemary, or bay leaf)",
                "Salt and pepper to taste"
            ];
            instructions = [
                "In large pot, sauté onion and garlic until soft",
                "Add broth and bring to simmer",
                "Add vegetables and protein",
                "Add herbs, salt, and pepper",
                "Simmer 15-20 minutes until vegetables tender",
                "Adjust seasoning and serve"
            ];
            swapTips = "Add a can of coconut milk for creamy soup. Blend half for thicker texture!";
            totalTime = 35;
            estimatedCost = 6;
        } else {
            // Generic recipe for any dish
            ingredients = [
                "Base ingredient (rice, pasta, or grain) - 1 cup",
                "Protein of choice - 1 cup",
                "Fresh vegetables - 2 cups",
                "Aromatics (garlic, onion) - to taste",
                "Sauce or seasoning - to taste"
            ];
            instructions = [
                "Prep all ingredients before starting",
                "Cook base according to instructions",
                "In a pan, cook protein until done, set aside",
                "Sauté vegetables and aromatics",
                "Combine everything in a bowl",
                "Add sauce or seasoning, serve warm"
            ];
            swapTips = "Use what you have! This recipe is flexible for any ingredients.";
            totalTime = 25;
            estimatedCost = 7;
        }
        
        return {
            name: dishName,
            restaurant: restaurantName,
            originalDescription: dishDescription,
            ingredients: ingredients,
            instructions: instructions,
            swapTips: swapTips,
            totalTime: totalTime,
            estimatedCost: estimatedCost,
            savedAt: new Date().toISOString()
        };
    }

    saveHomeRecipe(recipe) {
        const savedRecipes = JSON.parse(localStorage.getItem('savedRestaurantRecipes') || '[]');
        savedRecipes.push({
            ...recipe,
            id: Date.now()
        });
        localStorage.setItem('savedRestaurantRecipes', JSON.stringify(savedRecipes));
        
        // Show confirmation
        const toast = document.createElement('div');
        toast.className = 'save-confirmation';
        toast.innerHTML = '✅ Recipe saved to your cookbook!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    showRecipeFromDatabase(recipeId) {
        // Find the recipe in our database
        const allRecipes = [
            ...RECIPE_DATABASE.smoothie_bowls,
            ...RECIPE_DATABASE.breakfast_bowls,
            ...RECIPE_DATABASE.grain_bowls,
            ...RECIPE_DATABASE.salad_bowls,
            ...RECIPE_DATABASE.soup_bowls,
            ...RECIPE_DATABASE.noodle_bowls,
            ...RECIPE_DATABASE.dessert_bowls
        ];
        
        const recipe = allRecipes.find(r => r.id === recipeId);
        if (!recipe) return;
        
        const recipeDiv = document.getElementById('recreatedRecipe');
        recipeDiv.style.display = 'block';
        recipeDiv.innerHTML = `
            <div class="recreated-header">
                <div class="pixel-icon">📖</div>
                <h3>${recipe.name}</h3>
                <div class="recipe-meta">Page ${recipe.page} • ${recipe.prepTime + (recipe.cookTime || 0)} minutes</div>
            </div>
            <div class="recreated-content">
                <div class="home-recipe-card">
                    <div class="recipe-section">
                        <h4>📝 INGREDIENTS</h4>
                        <ul class="ingredient-list">
                            ${recipe.ingredients.map(ing => `<li><input type="checkbox"> ${ing}</li>`).join('')}
                        </ul>
                        ${recipe.toppings ? `
                            <h4>🍓 TOPPINGS</h4>
                            <ul class="ingredient-list">
                                ${recipe.toppings.map(t => `<li><input type="checkbox"> ${t}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                    <div class="recipe-section">
                        <h4>👩‍🍳 INSTRUCTIONS</h4>
                        <ol class="instruction-list">
                            ${recipe.instructions.map(inst => `<li>${inst}</li>`).join('')}
                        </ol>
                    </div>
                    <div class="recipe-tips">
                        ${recipe.tip ? `<div class="tip"><strong>💡 Tip:</strong> ${recipe.tip}</div>` : ''}
                        ${recipe.swapTip ? `<div class="tip"><strong>🔄 Swap:</strong> ${recipe.swapTip}</div>` : ''}
                        ${recipe.healthNote ? `<div class="tip"><strong>🌿 Health Note:</strong> ${recipe.healthNote}</div>` : ''}
                        ${recipe.dietary ? `<div class="dietary-tags">${recipe.dietary.map(d => `<span class="diet-tag">${d}</span>`).join('')}</div>` : ''}
                    </div>
                    <div class="save-recipe">
                        <button class="save-recipe-btn pixel-button" data-recipe="${recipe.id}">💾 SAVE TO MY COOKBOOK</button>
                    </div>
                </div>
            </div>
        `;
        
        recipeDiv.scrollIntoView({ behavior: 'smooth' });
        
        // Add save functionality
        recipeDiv.querySelector('.save-recipe-btn')?.addEventListener('click', () => {
            const saved = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
            if (!saved.includes(recipe.id)) {
                saved.push(recipe.id);
                localStorage.setItem('savedRecipes', JSON.stringify(saved));
                alert('✅ Recipe saved to your cookbook!');
            } else {
                alert('📚 Recipe already in your cookbook!');
            }
        });
    }
}