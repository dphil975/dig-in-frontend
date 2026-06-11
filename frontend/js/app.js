// Built-in fallback recipes (used when backend is not running)
const RECIPES = [
    { id: 1, name: "Omurice", cuisine: "Japanese", difficulty: "Medium", time: 25, pixelEmoji: "🍳", description: "Japanese omelette rice with ketchup heart",
      skillLevel: "Medium", prepTime: 10, cookTime: 15, totalTime: 25, rating: 4,
      ingredients: ["2 eggs", "1 cup cooked rice", "2 tbsp ketchup", "1 tsp soy sauce", "1 tsp butter"],
      instructions: ["Cook rice and season with soy sauce.", "Beat eggs with salt and pepper.", "Melt butter in pan and pour egg mixture, swirling to make thin omelette.", "Place rice in center and fold egg around it.", "Top with ketchup heart."],
      tips: ["Use day-old rice for best texture.", "Low heat prevents the egg from overcooking."] },
    { id: 2, name: "Cacio e Pepe", cuisine: "Italian", difficulty: "Medium", time: 15, pixelEmoji: "🍝", description: "Roman pasta with pecorino and black pepper",
      skillLevel: "Medium", prepTime: 5, cookTime: 10, totalTime: 15, rating: 4,
      ingredients: ["200g spaghetti", "50g Pecorino Romano", "50g Parmesan", "2 tsp black pepper", "salt"],
      instructions: ["Cook pasta in well-salted water.", "Toast cracked pepper in dry pan.", "Reserve 1 cup pasta water.", "Mix cheeses with pasta water into a sauce.", "Toss pasta with sauce and pepper."],
      tips: ["The pasta water starch is key.", "Add cheese off the heat to avoid clumping."] },
    { id: 3, name: "Sopa de Fideo", cuisine: "Mexican", difficulty: "Easy", time: 20, pixelEmoji: "🍜", description: "Mexican noodle soup with tomato broth",
      skillLevel: "Easy", prepTime: 5, cookTime: 15, totalTime: 20, rating: 4,
      ingredients: ["100g fideo noodles", "2 tomatoes", "1/4 onion", "2 garlic cloves", "2 cups chicken broth", "1 tbsp oil"],
      instructions: ["Blend tomatoes, onion, and garlic.", "Toast fideo in oil until golden.", "Add blended tomato and cook 2 minutes.", "Add broth and simmer 10 minutes."],
      tips: ["Toasting the noodles first adds nutty depth.", "Serve with lime and queso fresco."] },
    { id: 4, name: "Gyudon", cuisine: "Japanese", difficulty: "Easy", time: 20, pixelEmoji: "🥩", description: "Beef bowl with onions and egg",
      skillLevel: "Easy", prepTime: 5, cookTime: 15, totalTime: 20, rating: 4,
      ingredients: ["200g thinly sliced beef", "1 onion", "2 tbsp soy sauce", "2 tbsp mirin", "1 tbsp sugar", "1 cup dashi", "2 bowls rice"],
      instructions: ["Slice onion and cook in dashi.", "Add soy sauce, mirin, and sugar.", "Add beef and cook until done.", "Serve over rice."],
      tips: ["Freeze beef slightly to slice thinly.", "A raw egg yolk on top is traditional."] },
    { id: 5, name: "Carbonara", cuisine: "Italian", difficulty: "Hard", time: 20, pixelEmoji: "🍝", description: "Roman pasta with egg, guanciale, pecorino",
      skillLevel: "Hard", prepTime: 5, cookTime: 15, totalTime: 20, rating: 5,
      ingredients: ["200g spaghetti", "100g guanciale", "2 eggs + 2 yolks", "50g Pecorino Romano", "black pepper"],
      instructions: ["Render guanciale in pan until crispy.", "Cook pasta and reserve water.", "Whisk eggs with cheese.", "Off heat, combine pasta with guanciale.", "Add egg mixture and toss, adding water to loosen."],
      tips: ["Never add cream — it's not authentic.", "Work quickly off the heat so eggs don't scramble."] },
    { id: 6, name: "Tacos al Pastor", cuisine: "Mexican", difficulty: "Hard", time: 45, pixelEmoji: "🌮", description: "Marinated pork tacos with pineapple",
      skillLevel: "Hard", prepTime: 20, cookTime: 25, totalTime: 45, rating: 5,
      ingredients: ["500g pork shoulder", "3 dried guajillo chiles", "1/4 pineapple", "1/2 onion", "cilantro", "corn tortillas", "2 tsp achiote paste"],
      instructions: ["Soak chiles and blend into marinade with achiote.", "Marinate pork for at least 2 hours.", "Grill or pan-sear pork until charred.", "Slice thin and serve on tortillas with pineapple, onion, and cilantro."],
      tips: ["Achiote gives the signature red color.", "Char the pineapple for added sweetness."] },
];
// Dynamic Pricing Module
const budgetSlider = document.getElementById('budgetSlider');
const budgetValue = document.getElementById('budgetValue');
const mealTypeBtns = document.querySelectorAll('.meal-type-btn');
const findDealsBtn = document.getElementById('findDealsBtn');
const dealResults = document.getElementById('dealResults');
const dealList = document.getElementById('dealList');
const loadingSpinner = document.getElementById('loadingSpinner');
const peakTip = document.getElementById('peakTip');
const compareBtn = document.getElementById('compareBtn');
const compareItemInput = document.getElementById('compareItemInput');
const comparisonResults = document.getElementById('comparisonResults');

let currentMealType = 'lunch';
let currentZipcode = '10001'; // Default Manhattan - would get from geolocation

// Budget slider
budgetSlider.addEventListener('input', () => {
    budgetValue.textContent = budgetSlider.value;
});

// Meal type toggle
mealTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        mealTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMealType = btn.dataset.meal;
        document.getElementById('mealTypeValue').textContent = currentMealType;
    });
});

// Find deals
findDealsBtn.addEventListener('click', async () => {
    const budget = parseInt(budgetSlider.value);
    
    loadingSpinner.style.display = 'flex';
    dealResults.style.display = 'none';
    
    try {
        const response = await fetch('http://localhost:8000/api/deals/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                zipcode: currentZipcode,
                budget: budget,
                meal_type: currentMealType
            })
        });
        
        const data = await response.json();
        displayDeals(data);
        
        if (data.peak_insights) {
            peakTip.textContent = `💡 ${data.peak_insights.best_time}`;
        }
        
    } catch (error) {
        console.error('Error finding deals:', error);
        showStatus('Failed to find deals. Please try again.', true);
    } finally {
        loadingSpinner.style.display = 'none';
        dealResults.style.display = 'block';
    }
});

function displayDeals(data) {
    if (!data.options || data.options.length === 0) {
        dealList.innerHTML = '<div class="no-deals">No deals found within budget. Try increasing budget or searching grocery stores.</div>';
        return;
    }
    
    dealList.innerHTML = data.options.map(option => {
        if (option.type === 'diy_meal') {
            return `
                <div class="deal-item">
                    <div class="deal-info">
                        <div class="deal-name">🏠 ${option.name}</div>
                        <div class="deal-details">${option.details}</div>
                        <div class="deal-location">Stores: ${option.store_route.join(' → ')}</div>
                        <div class="diy-instructions" style="font-size: 10px; margin-top: 8px;">
                            ${option.instructions.map(inst => `📝 ${inst}`).join('<br>')}
                        </div>
                    </div>
                    <div class="deal-price">$${option.price}</div>
                </div>
            `;
        } else {
            return `
                <div class="deal-item">
                    <div class="deal-info">
                        <div class="deal-name">🍽️ ${option.name}</div>
                        <div class="deal-details">${option.details}</div>
                        <div class="deal-location">📍 ${option.location} • ${option.distance} mi</div>
                    </div>
                    <div class="deal-price">$${option.price}</div>
                </div>
            `;
        }
    }).join('');
    
    // Show DIY meal section
    const diyOption = data.options.find(o => o.type === 'diy_meal');
    if (diyOption) {
        const diySection = document.getElementById('diyMealResults');
        diySection.style.display = 'block';
        diySection.innerHTML = `
            <div class="diy-summary">
                <h4>🛒 DIY Meal - $${diyOption.price}</h4>
                <p>Save $${diyOption.savings_vs_restaurant} vs restaurant meal</p>
                <div class="component-list">
                    ${diyOption.components.map(c => `<div class="component-item">${c.item}: $${c.price} at ${c.store}</div>`).join('')}
                </div>
            </div>
        `;
    }
}

// Price comparison
compareBtn.addEventListener('click', async () => {
    const item = compareItemInput.value.trim();
    if (!item) return;
    
    try {
        const response = await fetch(`http://localhost:8000/api/price/compare?item=${encodeURIComponent(item)}&zipcode=${currentZipcode}`);
        const data = await response.json();
        
        comparisonResults.style.display = 'block';
        comparisonResults.innerHTML = `
            <h4>💰 Best prices for "${item}"</h4>
            ${data.map(store => `
                <div class="comparison-item">
                    <span>🏪 ${store.store}</span>
                    <span><strong>$${store.price}</strong> / ${store.unit}</span>
                    <span class="deal-location">📍 ${store.distance} mi</span>
                </div>
            `).join('')}
            <div class="price-tip" style="margin-top: 12px; font-size: 10px; color: #ffaa44;">
                💡 Pro tip: Check bodegas and corner stores for even better prices!
            </div>
        `;
    } catch (error) {
        console.error('Price comparison error:', error);
    }
});

// Get user location to auto-detect zipcode
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const response = await fetch(`https://api.zippopotam.us/us/${position.coords.latitude},${position.coords.longitude}`);
                const data = await response.json();
                if (data && data['post code']) {
                    currentZipcode = data['post code'];
                    showStatus(`📍 Location detected: ${currentZipcode}`);
                }
            } catch (e) {
                console.log('Could not auto-detect zipcode, using default');
            }
        });
    }
}

getUserLocation();
// Genre badge labels for cookbook upload display
const GENRE_LABELS = {
    healthy:       '🥗 Healthy',
    baking:        '🧁 Baking',
    vegan:         '🌱 Vegan',
    vegetarian:    '🥦 Vegetarian',
    world_cuisine: '🌍 World Cuisine',
    comfort_food:  '🍲 Comfort Food',
    quick_meals:   '⚡ Quick Meals',
    dessert:       '🍰 Dessert',
    asian:         '🥢 Asian',
    mediterranean: '🫒 Mediterranean',
    cookbook:      '📖 Cookbook',
};

/**
 * Load recipes: localStorage → recipes_full.json → hardcoded RECIPES fallback.
 * Merges all sources by name (no duplicates).
 */
async function loadAllRecipes() {
    // 1. Start with localStorage cache
    let cached = [];
    try {
        cached = JSON.parse(localStorage.getItem('dig_in_recipes') || '[]');
    } catch (_) {
        cached = [];
    }

    // 2. Try fetching the data file (populated by Node after each upload)
    let fromFile = [];
    try {
        const res = await fetch('data/recipes_full.json');
        if (res.ok) {
            const json = await res.json();
            fromFile = json.recipes || [];
        }
    } catch (_) {
        // File may not exist yet — that's fine
    }

    // 3. Merge: cached takes precedence, then file, then built-in RECIPES
    const byName = new Map();

    // Add built-in first (lowest priority)
    for (const r of RECIPES) {
        byName.set((r.name || '').toLowerCase(), r);
    }
    // Then file recipes (overwrite built-ins of same name)
    for (const r of fromFile) {
        if (r.name) byName.set(r.name.toLowerCase(), r);
    }
    // Then cached (highest priority — most recently uploaded)
    for (const r of cached) {
        if (r.name) byName.set(r.name.toLowerCase(), r);
    }

    const merged = Array.from(byName.values());
    return merged.length > 0 ? merged : [...RECIPES];
}

/**
 * Dynamically add cuisine options to #rolodexCuisine that aren't already listed.
 */
function populateCuisineFilter(recipes) {
    const select = document.getElementById('rolodexCuisine');
    if (!select) return;

    // Collect cuisines already present as options
    const existing = new Set(
        Array.from(select.options).map(o => o.value.toLowerCase()).filter(Boolean)
    );

    // Collect unique non-empty cuisine values from loaded recipes
    const newCuisines = new Set();
    for (const r of recipes) {
        const c = (r.cuisine_type || r.cuisine || '').trim();
        if (c && !existing.has(c.toLowerCase())) {
            newCuisines.add(c);
        }
    }

    for (const c of Array.from(newCuisines).sort()) {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c.charAt(0).toUpperCase() + c.slice(1);
        select.appendChild(opt);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const saveSystem = new SaveSystem();
    const auth = new AuthSystem();
    const todo = new TodoIntegration();

    // ── Recipe state ─────────────────────────────────────────────────────────
    // Start with built-ins immediately, then replace with full loaded set
    let currentRecipes = [...RECIPES];
    let carousel = new DigInCarousel('recipeCarousel', currentRecipes);

    // Load from localStorage + data file + backend
    try {
        const loaded = await loadAllRecipes();
        if (loaded.length > 0) {
            currentRecipes = loaded;
            carousel = new DigInCarousel('recipeCarousel', currentRecipes);
        }
    } catch (_) {
        // Fall through — already initialised with RECIPES
    }

    // Also try the live backend (may have recipes not yet in localStorage)
    try {
        const backendRecipes = await DigInAPI.fetchRecipes();
        if (backendRecipes.length > 0) {
            // Merge without losing local-only recipes
            const byName = new Map(currentRecipes.map(r => [(r.name || '').toLowerCase(), r]));
            for (const r of backendRecipes) {
                if (r.name) byName.set(r.name.toLowerCase(), r);
            }
            currentRecipes = Array.from(byName.values());
            carousel = new DigInCarousel('recipeCarousel', currentRecipes);
        }
    } catch (_) {
        console.info('Backend not running — using local/built-in recipes.');
    }

    // Populate cuisine filter with any cuisines from loaded recipes
    populateCuisineFilter(currentRecipes);

    // ── Show recipe card helper — navigates to the full recipe page ──────────
    function showRecipeCard(recipe) {
        if (!recipe) return;
        try { sessionStorage.setItem('dig_in_current_recipe', JSON.stringify(recipe)); } catch (_) {}
        window.location.href = `recipe.html?name=${encodeURIComponent(recipe.name)}`;
    }

    // ── Carousel "Let's Cook" ─────────────────────────────────────────────────
    document.addEventListener('startCooking', (e) => {
        const recipe = currentRecipes.find(r => r.name === e.detail.recipeName);
        if (recipe) showRecipeCard(recipe);
    });

    // ── Search ────────────────────────────────────────────────────────────────
    const searchInput = document.getElementById('recipeSearch');
    const searchBtn   = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');

    async function performSearch() {
        const query = searchInput?.value.trim();
        if (!query) return;

        searchResults.innerHTML = '<div class="pixel-loading">🔍 SEARCHING...</div>';
        try {
            const results = await DigInAPI.searchRecipes(query);
            if (!results.length) {
                searchResults.innerHTML = '<div class="search-empty">No results. Try uploading a cookbook first!</div>';
                return;
            }
            searchResults.innerHTML = results.map(r => `
                <div class="search-result-card" data-recipe-id="${r.id}">
                    <span class="result-emoji">${r.pixelEmoji}</span>
                    <div class="result-info">
                        <strong>${r.name}</strong>
                        <span>${r.cuisine} · ${r.difficulty} · ${r.totalTime}min</span>
                    </div>
                    <button class="pixel-button small">COOK</button>
                </div>
            `).join('');
            searchResults.querySelectorAll('.search-result-card').forEach(card => {
                card.querySelector('button').addEventListener('click', () => {
                    const found = results.find(r => r.id == card.dataset.recipeId);
                    if (found) showRecipeCard(found);
                });
            });
        } catch (_) {
            searchResults.innerHTML = '<div class="api-offline">Start the backend: <code>python app.py</code></div>';
        }
    }

    searchBtn?.addEventListener('click', performSearch);
    searchInput?.addEventListener('keypress', e => { if (e.key === 'Enter') performSearch(); });

    // ── Menu Recreation ───────────────────────────────────────────────────────
    document.getElementById('recreateBtn')?.addEventListener('click', async () => {
        const name        = document.getElementById('menuItemName')?.value.trim();
        const description = document.getElementById('menuItemDesc')?.value.trim() || '';
        const restaurant  = document.getElementById('menuRestaurant')?.value.trim() || '';
        const resultDiv   = document.getElementById('recreateResult');

        if (!name) { alert('Please enter a dish name!'); return; }

        resultDiv.innerHTML = '<div class="pixel-loading">🍽️ RECREATING RECIPE...</div>';
        try {
            const recipe = await DigInAPI.recreateMenuItem(name, description, restaurant);
            resultDiv.innerHTML = `
                <div class="action-success">
                    <p>✅ Recipe built! Cost estimate: ${recipe.cost_estimate ? '$' + recipe.cost_estimate : '—'}</p>
                    <div class="action-buttons">
                        <button id="showRecreated" class="pixel-button">🍳 VIEW RECIPE</button>
                        ${recipe.shopping_list?.length
                            ? `<button id="addToGroceries" class="pixel-button secondary">📝 ADD TO GROCERY LIST</button>`
                            : ''}
                    </div>
                </div>
            `;
            document.getElementById('showRecreated')?.addEventListener('click', () => showRecipeCard(recipe));
            document.getElementById('addToGroceries')?.addEventListener('click', () => {
                (recipe.shopping_list || []).forEach(item => {
                    const parts = item.match(/^([\d¼½¾\/\.\s-]+(?:cup|tbsp|tsp|oz|lb|g|kg|ml)?\s+)(.+)$/i);
                    todo.addItem(parts ? parts[2].trim() : item, 1, '');
                });
                alert(`Added ${recipe.shopping_list.length} items to your grocery list!`);
            });
        } catch (_) {
            resultDiv.innerHTML = '<div class="api-offline">❌ Backend not running. Start it with: <code>python app.py</code></div>';
        }
    });

    // ── Cookbook Upload (PDF / EPUB) ──────────────────────────────────────────
    document.getElementById('cookbookUpload')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const resultDiv = document.getElementById('cookbookResult');
        const isPDF  = file.name.toLowerCase().endsWith('.pdf');
        const isEPUB = file.name.toLowerCase().endsWith('.epub');

        if (!isPDF && !isEPUB) {
            resultDiv.innerHTML = '<div class="api-offline">Please upload a .pdf or .epub file.</div>';
            return;
        }

        const BOOK_TYPE_LABELS = {
            cookbook: '📖 Recipe Cookbook',
            science:  '🔬 Food Science Book',
        };

        resultDiv.innerHTML = `<div class="pixel-loading">📚 SCANNING BOOK...</div>`;
        try {
            const result = isPDF
                ? await DigInAPI.uploadPDF(file)
                : await DigInAPI.uploadEPUB(file);

            const typeLabels = (result.book_type || ['cookbook'])
                .map(t => BOOK_TYPE_LABELS[t] || t)
                .join(' + ');

            const recipeLine = result.recipes_extracted > 0
                ? `<p>🍳 <strong>${result.recipes_extracted} recipes</strong> extracted</p>`
                : '';

            const scienceLine = result.science_concepts_extracted > 0
                ? `<p>🔬 <strong>${result.science_concepts_extracted} science concepts</strong> added: ${
                    (result.science_concepts || [])
                        .map(k => k.replace(/_/g, ' '))
                        .join(', ')
                  }</p>`
                : '';

            // Genre badges
            const genres = result.book_genre || [];
            const genreBadges = genres.length
                ? `<p>${genres.map(g => GENRE_LABELS[g] || g).join(' · ')}</p>`
                : '';

            // Cuisines found
            const cuisineList = (result.cuisines_found || []);
            const cuisineLine = cuisineList.length
                ? `<p>🌍 Cuisines: <strong>${cuisineList.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}</strong></p>`
                : '';

            // Diet tags found
            const dietList = result.diet_tags_found || [];
            const dietLine = dietList.length
                ? `<p>🏷️ Diet tags: ${dietList.map(t => `<span class="diet-tag">${t}</span>`).join(' ')}</p>`
                : '';

            resultDiv.innerHTML = `
                <div class="action-success">
                    <p>✅ <strong>"${result.book || result.book_title}"</strong> detected as: ${typeLabels}</p>
                    ${genreBadges}
                    ${recipeLine}
                    ${cuisineLine}
                    ${dietLine}
                    ${scienceLine}
                    ${result.recipes_extracted > 0
                        ? `<div class="action-buttons">
                               <button id="refreshCarousel" class="pixel-button">🔄 LOAD RECIPES INTO CAROUSEL</button>
                           </div>`
                        : ''}
                    ${result.recipes_extracted === 0 && result.science_concepts_extracted === 0
                        ? `<p style="color:#888;font-size:9px;">No structured recipes or science concepts found. The PDF may be image-based (scanned) or use an unusual format.</p>`
                        : ''}
                </div>
            `;

            // Save newly extracted recipes to localStorage for persistence
            const normalized = (result.recipes || []).map(r => DigInAPI.normalizeRecipe(r));
            if (normalized.length > 0) {
                let cached = [];
                try { cached = JSON.parse(localStorage.getItem('dig_in_recipes') || '[]'); } catch (_) {}
                const existingNames = new Set(cached.map(r => r.name?.toLowerCase()));
                const toAdd = normalized.filter(r => r.name && !existingNames.has(r.name.toLowerCase()));
                const merged = [...cached, ...toAdd];
                localStorage.setItem('dig_in_recipes', JSON.stringify(merged));

                // Also update in-memory carousel
                const currentNames = new Set(currentRecipes.map(r => (r.name || '').toLowerCase()));
                const brandNew = toAdd.filter(r => !currentNames.has((r.name || '').toLowerCase()));
                if (brandNew.length > 0) {
                    currentRecipes = [...currentRecipes, ...brandNew];
                    carousel = new DigInCarousel('recipeCarousel', currentRecipes);
                    // Repopulate cuisine filter with any new cuisines
                    populateCuisineFilter(brandNew);
                }
            }

            document.getElementById('refreshCarousel')?.addEventListener('click', async () => {
                // Use recipes returned directly from upload; fall back to DB fetch
                const direct = (result.recipes || []).map(r => DigInAPI.normalizeRecipe(r));
                let recipes = direct;
                if (!direct.length) {
                    try { recipes = await DigInAPI.fetchRecipes(); } catch (_) {}
                }
                if (recipes.length > 0) {
                    currentRecipes = recipes;
                    carousel = new DigInCarousel('recipeCarousel', currentRecipes);
                    document.getElementById('recipeCarousel')?.scrollIntoView({ behavior: 'smooth' });
                }
            });
        } catch (err) {
            resultDiv.innerHTML = `<div class="api-offline">❌ Upload failed. Is the backend running? <code>cd ~/Dig\\ In-backend && npm start</code><br><small>${err.message}</small></div>`;
        }
    });

    // ── Food Photo → Pixel Art (existing feature) ─────────────────────────────
    const uploadInput = document.getElementById('foodUpload');
    const pixelResult = document.getElementById('customPixelResult');
    const converter   = new DigInPixelConverter();

    uploadInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        pixelResult.innerHTML = '<div class="pixel-loading">⚙️ GENERATING PIXEL ART... ⚙️</div>';
        try {
            const blob   = await converter.convertToPixelArt(file, { pixelSize: 8, paletteSize: 24, dithering: true });
            const imgUrl = URL.createObjectURL(blob);
            pixelResult.innerHTML = `
                <div class="pixel-result">
                    <h4>YOUR PIXEL DISH</h4>
                    <img src="${imgUrl}" alt="Pixel art dish" class="custom-pixel-img">
                    <button class="save-pixel-btn" onclick="savePixelArt('${imgUrl}')">💾 SAVE AS PNG</button>
                </div>
            `;
        } catch (err) {
            pixelResult.innerHTML = `<div class="api-offline">❌ Failed to convert: ${err.message}</div>`;
        }
    });

    // ── World Map ─────────────────────────────────────────────────────────────
    const worldMap = new PixelWorldMap('worldMapContainer', (country) => {
        const found = currentRecipes.find(r => r.countryId === country.id);
        if (found) showRecipeCard(found);
    });

    document.addEventListener('countrySelected', (e) => {
        const found = currentRecipes.find(r => r.countryId === e.detail.country.id);
        if (found) showRecipeCard(found);
    });

    // ── Geolocation / Store Map ───────────────────────────────────────────────
    const geoService = new GeolocationService();
    await geoService.searchNearbyStores();
    geoService.displayStoreMap();

    // ── Brand / Receipt Scanning ──────────────────────────────────────────────
    new BrandScanner();
    const receiptScanner = new ReceiptScanner();
    const priceTracker   = new PriceTracker();
    new StoreMapper(geoService);

    const scanBtn = document.createElement('button');
    scanBtn.className = 'pixel-button';
    scanBtn.innerHTML = '🧾 SCAN RECEIPT';
    scanBtn.onclick = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const receiptData = await receiptScanner.scanReceipt(e.target.files[0]);
            await priceTracker.processReceipt(receiptData);
            alert(`Scanned ${receiptData.items.length} items from ${receiptData.store}`);
        };
        input.click();
    };
    document.querySelector('.brand-scanner-section')?.appendChild(scanBtn);

    // ── Pantry Scanner (Flask :5000) ──────────────────────────────────────────
    document.getElementById('pantryBtn')?.addEventListener('click', async () => {
        const raw = document.getElementById('pantryIngredients')?.value.trim();
        const resultDiv = document.getElementById('pantryResult');
        if (!raw) { alert('Enter at least one ingredient!'); return; }

        const ingredients = raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        resultDiv.innerHTML = '<div class="pixel-loading">🥕 CHECKING YOUR PANTRY...</div>';

        try {
            const data = await DigInAPI.scanPantry(ingredients);
            const matches = data.recipes || [];
            if (!matches.length) {
                resultDiv.innerHTML = '<div class="search-empty">No matching recipes found. Try adding more ingredients!</div>';
                return;
            }
            resultDiv.innerHTML = matches.map(m => `
                <div class="search-result-card">
                    <span class="result-emoji">🍳</span>
                    <div class="result-info">
                        <strong>${m.recipe?.name || 'Recipe'}</strong>
                        <span>${Math.round(m.match)}% match · missing: ${(m.missing || []).join(', ') || 'nothing!'}</span>
                    </div>
                    <button class="pixel-button small cook-pantry-btn">COOK</button>
                </div>
            `).join('');
            resultDiv.querySelectorAll('.cook-pantry-btn').forEach((btn, i) => {
                btn.addEventListener('click', () => {
                    const r = matches[i]?.recipe;
                    if (r) showRecipeCard({
                        id: `pantry_${i}`,
                        name: r.name,
                        cuisine: r.cuisine || 'Home',
                        difficulty: r.difficulty || 'Easy',
                        time: r.time || 30,
                        totalTime: r.time || 30,
                        pixelEmoji: '🍳',
                        ingredients: r.ingredients || [],
                        instructions: r.flashcards || [],
                        tips: [],
                    });
                });
            });
        } catch (_) {
            resultDiv.innerHTML = '<div class="api-offline">❌ Flask backend not running. Start it: <code>cd backend && python app.py</code></div>';
        }
    });

    // ── Rolodex Spinner (Flask :5000 + client-side fallback) ──────────────────
    document.getElementById('rolodexBtn')?.addEventListener('click', async () => {
        const cuisine = document.getElementById('rolodexCuisine')?.value;
        const diet    = document.getElementById('rolodexDiet')?.value;
        const resultDiv = document.getElementById('rolodexResult');
        resultDiv.innerHTML = '<div class="pixel-loading">🎰 SPINNING...</div>';

        try {
            const filters = {};
            if (cuisine) filters.cuisine = cuisine;
            if (diet)    filters.diet = diet;

            // Try the Flask rolodex API first
            let recipes = await DigInAPI.spinRolodex(filters);

            // If the API returned nothing (or is offline), fall back to client-side filtering
            // of the currently loaded recipes (covers uploaded/localStorage recipes)
            if (!recipes.length && currentRecipes.length) {
                recipes = currentRecipes.filter(r => {
                    const recipeCuisine = (r.cuisine_type || r.cuisine || '').toLowerCase();
                    const recipeDietTags = r.diet_tags || r.dietary_tags || [];
                    const cuisineMatch = !cuisine || recipeCuisine === cuisine.toLowerCase();
                    const dietMatch    = !diet    || recipeDietTags.includes(diet);
                    return cuisineMatch && dietMatch;
                });
            }

            if (!recipes.length) {
                resultDiv.innerHTML = '<div class="search-empty">No recipes found for that filter.</div>';
                return;
            }
            const pick = recipes[Math.floor(Math.random() * recipes.length)];
            resultDiv.innerHTML = `
                <div class="search-result-card rolodex-pick">
                    <span class="result-emoji">🎰</span>
                    <div class="result-info">
                        <strong>${pick.name}</strong>
                        <span>${pick.cuisine || pick.cuisine_type || ''} · ${pick.difficulty || pick.difficulty_level || ''} · ${pick.time || pick.total_time || '?'}min</span>
                        <span style="font-size:9px;opacity:0.7;">${pick.cultural_note || ''}</span>
                    </div>
                    <button class="pixel-button small" id="cookRolodexPick">COOK IT</button>
                </div>
            `;
            document.getElementById('cookRolodexPick')?.addEventListener('click', () => {
                showRecipeCard({
                    id: pick.id || `rolodex_${pick.name}`,
                    name: pick.name,
                    cuisine: pick.cuisine || pick.cuisine_type,
                    difficulty: pick.difficulty || pick.difficulty_level,
                    time: pick.time || pick.total_time,
                    totalTime: pick.time || pick.total_time,
                    pixelEmoji: pick.pixelEmoji || '🎰',
                    ingredients: pick.ingredients || [],
                    instructions: pick.flashcards || pick.instructions || [],
                    tips: pick.cultural_note ? [pick.cultural_note] : (pick.tips || []),
                });
            });
        } catch (_) {
            // Flask offline — fall back entirely to client-side
            let recipes = currentRecipes.filter(r => {
                const recipeCuisine = (r.cuisine_type || r.cuisine || '').toLowerCase();
                const recipeDietTags = r.diet_tags || r.dietary_tags || [];
                const cuisineMatch = !cuisine || recipeCuisine === (document.getElementById('rolodexCuisine')?.value || '').toLowerCase();
                const dietMatch    = !diet    || recipeDietTags.includes(document.getElementById('rolodexDiet')?.value || '');
                return cuisineMatch && dietMatch;
            });
            if (!recipes.length) recipes = currentRecipes;
            if (!recipes.length) {
                document.getElementById('rolodexResult').innerHTML = '<div class="api-offline">❌ Flask backend not running. Start it: <code>cd backend && python app.py</code></div>';
                return;
            }
            const pick = recipes[Math.floor(Math.random() * recipes.length)];
            document.getElementById('rolodexResult').innerHTML = `
                <div class="search-result-card rolodex-pick">
                    <span class="result-emoji">🎰</span>
                    <div class="result-info">
                        <strong>${pick.name}</strong>
                        <span>${pick.cuisine || pick.cuisine_type || ''} · ${pick.difficulty || pick.difficulty_level || ''} · ${pick.time || pick.total_time || '?'}min</span>
                    </div>
                    <button class="pixel-button small" id="cookRolodexPick">COOK IT</button>
                </div>
            `;
            document.getElementById('cookRolodexPick')?.addEventListener('click', () => showRecipeCard(pick));
        }
    });

    // ── Show saved recipe on load ─────────────────────────────────────────────
    const savedIds = saveSystem.getSavedRecipes();
    if (savedIds.length > 0) {
        const savedRecipe = currentRecipes.find(r => r.id === savedIds[0]);
        if (savedRecipe) showRecipeCard(savedRecipe);
    }
});

function savePixelArt(imgUrl) {
    const link = document.createElement('a');
    link.download = 'dig-in-pixel-art.png';
    link.href = imgUrl;
    link.click();
}
// Price Manipulation Detector Module
const storeFilter = document.getElementById('storeFilter');
const tacticFilter = document.getElementById('tacticFilter');
const refreshManipBtn = document.getElementById('refreshManipBtn');
const manipAlerts = document.getElementById('manipAlerts');
const generateReportBtn = document.getElementById('generateReportBtn');
const submitFTCBtn = document.getElementById('submitFTCBtn');
const subscribeAlertsBtn = document.getElementById('subscribeAlertsBtn');
const reportPreview = document.getElementById('reportPreview');
const productSearch = document.getElementById('productSearch');
const searchProductBtn = document.getElementById('searchProductBtn');
const crossStoreResults = document.getElementById('crossStoreResults');

// Load manipulation alerts
async function loadManipulationAlerts() {
    const store = storeFilter.value;
    const tactic = tacticFilter.value;
    
    try {
        const response = await fetch(`http://localhost:8000/api/manipulation/alerts?store=${store}&tactic=${tactic}&days=30`);
        const data = await response.json();
        
        displayAlerts(data.alerts);
        updateStats(data.stats);
        
    } catch (error) {
        console.error('Error loading alerts:', error);
        manipAlerts.innerHTML = '<div class="error">Failed to load alerts. Please try again.</div>';
    }
}

function displayAlerts(alerts) {
    if (!alerts || alerts.length === 0) {
        manipAlerts.innerHTML = '<div class="no-alerts">✅ No manipulation detected in the last 30 days.</div>';
        return;
    }
    
    manipAlerts.innerHTML = alerts.map(alert => `
        <div class="alert-card ${alert.severity}">
            <div class="alert-header">
                <span class="alert-store">🏪 ${alert.store.toUpperCase()}</span>
                <span class="alert-tactic">${formatTactic(alert.tactic)}</span>
            </div>
            <div class="alert-product">📦 ${alert.product_name}</div>
            <div class="alert-description">${alert.description}</div>
            <div class="alert-evidence">
                🔍 Evidence: ${formatEvidence(alert.evidence)}
            </div>
        </div>
    `).join('');
}

function formatTactic(tactic) {
    const tactics = {
        'bait_and_switch': '🎣 BAIT & SWITCH',
        'shrinkflation': '📉 SHRINKFLATION',
        'surge_pricing': '⚡ SURGE PRICING',
        'fake_sale': '🏷️ FAKE SALE',
        'geo_pricing': '🗺️ GEO PRICING'
    };
    return tactics[tactic] || tactic;
}

function formatEvidence(evidence) {
    if (!evidence) return 'See full report for details';
    
    if (evidence.percent_increase) {
        return `${evidence.percent_increase}% price increase detected`;
    }
    if (evidence.price_by_zip) {
        return `Price varies by ${Object.keys(evidence.price_by_zip).length} different zip codes`;
    }
    if (evidence.fake_markup_percent) {
        return `False sale - ${evidence.fake_markup_percent}% fake markup`;
    }
    return JSON.stringify(evidence);
}

function updateStats(stats) {
    if (!stats) return;
    document.getElementById('totalManipCount').textContent = stats.total_manipulations || 0;
    document.getElementById('activeStoresCount').textContent = stats.active_stores || 7;
    document.getElementById('consumerSavings').textContent = `$${stats.estimated_savings || 0}`;
}

// Generate whistleblower report
generateReportBtn.addEventListener('click', async () => {
    const store = storeFilter.value === 'all' ? null : storeFilter.value;
    
    try {
        const response = await fetch(`http://localhost:8000/api/manipulation/report?store=${store || ''}`);
        const report = await response.json();
        
        reportPreview.style.display = 'block';
        reportPreview.innerHTML = `
            <h4>📄 Whistleblower Report</h4>
            <p>Generated: ${report.generated_at}</p>
            <p>Total manipulations: ${report.total_manipulations}</p>
            <p>Estimated consumer damages: $${report.estimated_damages.toLocaleString()}</p>
            <p>Legal recommendations:</p>
            <ul>
                ${report.legal_recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
            <button id="downloadReportBtn" class="pixel-button small">Download PDF</button>
        `;
        
        document.getElementById('downloadReportBtn')?.addEventListener('click', () => {
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `whistleblower_report_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
        
    } catch (error) {
        console.error('Error generating report:', error);
    }
});

// Submit to FTC
submitFTCBtn.addEventListener('click', async () => {
    try {
        const response = await fetch('http://localhost:8000/api/manipulation/submit-ftc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ store: storeFilter.value === 'all' ? null : storeFilter.value })
        });
        
        const result = await response.json();
        showStatus(`✅ FTC complaint submitted! Reference: ${result.reference_id}`);
        
    } catch (error) {
        console.error('Error submitting to FTC:', error);
        showStatus('❌ Failed to submit to FTC. Please try again.', true);
    }
});

// Subscribe to alerts
subscribeAlertsBtn.addEventListener('click', () => {
    const email = prompt('Enter your email to receive price manipulation alerts:');
    if (email && email.includes('@')) {
        fetch('http://localhost:8000/api/manipulation/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, stores: [storeFilter.value] })
        }).then(() => showStatus('✅ Subscribed! You will receive alerts when manipulation is detected.'));
    } else if (email) {
        showStatus('Please enter a valid email address.', true);
    }
});

// Search product across stores
searchProductBtn.addEventListener('click', async () => {
    const product = productSearch.value.trim();
    if (!product) return;
    
    try {
        const response = await fetch(`http://localhost:8000/api/manipulation/compare?product=${encodeURIComponent(product)}`);
        const data = await response.json();
        
        crossStoreResults.style.display = 'block';
        crossStoreResults.innerHTML = `
            <h4>💰 ${data.product}</h4>
            <div class="price-summary">
                <span>Cheapest: ${data.cheapest?.store} - $${data.cheapest?.price}</span>
                <span>Most expensive: ${data.most_expensive?.store} - $${data.most_expensive?.price}</span>
            </div>
            <div class="comparison-list">
                ${data.comparisons.map(store => `
                    <div class="store-comparison-row">
                        <span class="store-name">${store.store}</span>
                        <span class="store-price ${store.price === data.cheapest?.price ? 'cheapest' : store.price === data.most_expensive?.price ? 'most-expensive' : ''}">
                            $${store.price}
                            ${store.requires_membership ? '<span class="membership-badge">membership</span>' : ''}
                            ${!store.in_stock ? '<span class="out-of-stock">(Out of Stock)</span>' : ''}
                        </span>
                    </div>
                `).join('')}
            </div>
            <div class="savings-tip">
                💡 Save $${(data.most_expensive?.price - data.cheapest?.price).toFixed(2)} by shopping at ${data.cheapest?.store}
            </div>
        `;
        
    } catch (error) {
        console.error('Error comparing stores:', error);
    }
});

// Auto-refresh every 5 minutes
refreshManipBtn.addEventListener('click', loadManipulationAlerts);
setInterval(loadManipulationAlerts, 300000);
loadManipulationAlerts();

// Cross-store comparison for common items
const commonItems = ['milk', 'eggs', 'bread', 'butter', 'coffee'];
commonItems.forEach(item => {
    const btn = document.createElement('button');
    btn.textContent = item;
    btn.className = 'quick-compare-btn';
    btn.onclick = () => {
        productSearch.value = item;
        searchProductBtn.click();
    };
    document.querySelector('.comparison-search')?.appendChild(btn);
});