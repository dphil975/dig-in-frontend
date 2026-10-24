/**
 * Dig In Brand Scanner
 * Features:
 * - Scan barcode or search brand name
 * - Detect recipe changes (old vs new)
 * - Highlight changed brands in yellow
 * - Provide DIY recipe for original version
 */

class BrandScanner {
    constructor() {
        this.brandDatabase = this.loadBrandDatabase();
        this.scannedItems = [];
        this.notificationQueue = [];
        this.init();
    }

    loadBrandDatabase() {
        // Database of original recipes before brands changed them
        return {
            // Crackers & Snacks
            "goldfish": {
                brand: "Goldfish",
                currentRecipe: {
                    ingredients: ["enriched flour", "vegetable oil", "yeast", "salt", "monoglycerides", "autolyzed yeast extract"],
                    additives: ["monoglycerides", "autolyzed yeast extract"],
                    quality: "cheapened"
                },
                originalRecipe: {
                    ingredients: ["real cheddar cheese", "wheat flour", "butter", "salt", "baking soda"],
                    additives: [],
                    quality: "original",
                    yearChanged: 2018,
                    changeNote: "Replaced real cheese with cheese powder & added preservatives"
                },
                diyInstructions: {
                    time: 45,
                    difficulty: "Medium",
                    tools: ["mixing bowl", "rolling pin", "cookie cutters", "baking sheet", "parchment paper"],
                    ingredients: ["1 cup sharp cheddar (finely grated)", "1 cup flour", "4 tbsp cold butter", "1/4 tsp salt", "2-3 tbsp cold water"],
                    steps: [
                        "Mix flour and salt in a bowl",
                        "Cut in cold butter until mixture looks like breadcrumbs",
                        "Stir in grated cheddar cheese",
                        "Add water 1 tbsp at a time until dough forms",
                        "Roll dough 1/8 inch thick on floured surface",
                        "Cut into small fish shapes (or use Goldfish-shaped cutter from Amazon)",
                        "Place on parchment-lined baking sheet",
                        "Bake at 375°F for 12-15 minutes until edges are golden",
                        "Cool completely before eating"
                    ],
                    tips: ["Use extra sharp cheddar for more flavor", "Dough can be frozen for up to 3 months"]
                },
                pixelArt: "🎣🐟"
            },
            
            // Cookies
            "oreo": {
                brand: "Oreo",
                currentRecipe: {
                    ingredients: ["sugar", "enriched flour", "palm oil", "cocoa", "high fructose corn syrup", "soy lecithin"],
                    additives: ["palm oil", "high fructose corn syrup", "soy lecithin"],
                    quality: "cheapened"
                },
                originalRecipe: {
                    ingredients: ["sugar", "wheat flour", "vegetable shortening", "cocoa", "vanilla extract"],
                    additives: [],
                    quality: "original",
                    yearChanged: 1990,
                    changeNote: "Replaced vegetable shortening with palm oil, added corn syrup"
                },
                diyInstructions: {
                    time: 90,
                    difficulty: "Medium",
                    tools: ["stand mixer", "rolling pin", "round cutter", "baking sheets", "piping bag"],
                    ingredients: {
                        cookies: ["1 cup flour", "1/2 cup cocoa powder", "1/2 cup butter", "1/2 cup sugar", "1 egg"],
                        filling: ["1/2 cup butter", "1 cup powdered sugar", "1 tsp vanilla"]
                    },
                    steps: [
                        "Cream butter and sugar until light and fluffy",
                        "Mix in egg and vanilla",
                        "Sift together flour and cocoa, gradually add to wet mixture",
                        "Chill dough for 30 minutes",
                        "Roll dough 1/8 inch thick, cut into rounds",
                        "Bake at 350°F for 9 minutes",
                        "For filling: beat butter until creamy, add powdered sugar gradually",
                        "Pipe filling onto half the cookies, sandwich with remaining cookies"
                    ],
                    tips: ["Don't overbake - cookies should be soft when they come out", "Store in airtight container for up to 1 week"]
                },
                pixelArt: "🍪⚫"
            },
            
            // Soda
            "coca-cola": {
                brand: "Coca-Cola",
                currentRecipe: {
                    ingredients: ["carbonated water", "high fructose corn syrup", "caramel color", "phosphoric acid", "natural flavors", "caffeine"],
                    additives: ["high fructose corn syrup", "phosphoric acid"],
                    quality: "cheapened"
                },
                originalRecipe: {
                    ingredients: ["carbonated water", "sugar", "coca leaf extract", "kola nut extract", "citrus oils", "vanilla", "cinnamon", "nutmeg"],
                    additives: [],
                    quality: "original",
                    yearChanged: 1985,
                    changeNote: "Switched from sugar to high fructose corn syrup"
                },
                diyInstructions: {
                    time: 30,
                    difficulty: "Easy",
                    tools: ["saucepan", "fine mesh strainer", "glass bottle", "funnel"],
                    ingredients: ["2 cups sugar", "2 cups water", "1/2 cup cocoa nibs", "1/4 cup coffee beans", "1 tbsp vanilla extract", "1 tsp cinnamon", "1/2 tsp nutmeg", "1 tsp lime zest", "1 tsp orange zest", "carbonated water"],
                    steps: [
                        "Combine sugar and water in saucepan, heat until sugar dissolves",
                        "Add cocoa nibs, coffee beans, cinnamon, nutmeg, lime zest, orange zest",
                        "Simmer for 20 minutes, don't boil",
                        "Remove from heat, add vanilla extract",
                        "Let cool completely (at least 2 hours)",
                        "Strain through fine mesh strainer or cheesecloth",
                        "Mix 1 part syrup with 4 parts carbonated water",
                        "Pour into glass bottles and refrigerate"
                    ],
                    tips: ["Adjust sweetness to taste", "Syrup keeps in fridge for up to 2 weeks"]
                },
                pixelArt: "🥤🧪"
            },
            
            // Peanut Butter
            "skippy-peanut-butter": {
                brand: "Skippy Peanut Butter",
                currentRecipe: {
                    ingredients: ["roasted peanuts", "sugar", "hydrogenated vegetable oil", "salt", "molasses"],
                    additives: ["hydrogenated vegetable oil", "sugar"],
                    quality: "cheapened"
                },
                originalRecipe: {
                    ingredients: ["roasted peanuts", "salt"],
                    additives: [],
                    quality: "original",
                    yearChanged: 1950,
                    changeNote: "Added sugar and hydrogenated oils"
                },
                diyInstructions: {
                    time: 10,
                    difficulty: "Easy",
                    tools: ["food processor", "glass jar", "spatula"],
                    ingredients: ["2 cups roasted peanuts", "1/2 tsp salt", "1-2 tbsp peanut oil (optional)"],
                    steps: [
                        "Add peanuts to food processor",
                        "Process for 2-3 minutes until ground",
                        "Scrape down sides, continue processing",
                        "After 5-7 minutes, peanuts will become creamy",
                        "Add salt, process to combine",
                        "Add oil if thinner consistency desired",
                        "Transfer to glass jar, store in fridge"
                    ],
                    tips: ["Use honey roasted peanuts for sweet version", "Stir before each use as oil separates naturally"]
                },
                pixelArt: "🥜🫙"
            },
            
            // Mac & Cheese
            "kraft-mac-cheese": {
                brand: "Kraft Mac & Cheese",
                currentRecipe: {
                    ingredients: ["enriched macaroni", "cheese sauce mix (whey, milkfat, salt, sodium tripolyphosphate)", "artificial color"],
                    additives: ["sodium tripolyphosphate", "yellow #5", "yellow #6"],
                    quality: "cheapened"
                },
                originalRecipe: {
                    ingredients: ["macaroni", "cheddar cheese", "milk", "butter", "salt"],
                    additives: [],
                    quality: "original",
                    yearChanged: 2015,
                    changeNote: "Removed artificial preservatives but added artificial colors"
                },
                diyInstructions: {
                    time: 20,
                    difficulty: "Easy",
                    tools: ["pot", "colander", "whisk", "saucepan"],
                    ingredients: ["8 oz elbow macaroni", "2 cups sharp cheddar (shredded)", "1 cup milk", "2 tbsp butter", "2 tbsp flour", "1/2 tsp salt", "1/4 tsp paprika"],
                    steps: [
                        "Cook macaroni according to package directions, drain",
                        "In saucepan, melt butter over medium heat",
                        "Whisk in flour, cook 1 minute",
                        "Slowly whisk in milk, cook until thickened (3-4 minutes)",
                        "Remove from heat, add shredded cheddar, stir until melted",
                        "Add salt and paprika",
                        "Combine cheese sauce with macaroni",
                        "Serve immediately"
                    ],
                    tips: ["Use block cheese and shred yourself for best melting", "Add breadcrumbs on top and broil for baked version"]
                },
                pixelArt: "🧀🍝"
            }
        };
    }

    init() {
        this.setupBarcodeScanner();
        this.setupSearchInterface();
        this.loadScannedHistory();
    }

    setupSearchInterface() {
        const scanBtn = document.getElementById('openScannerBtn');
        const manualBtn = document.getElementById('manualBrandBtn');
        if (scanBtn) scanBtn.addEventListener('click', () => this.scanBarcode(null));
        if (manualBtn) manualBtn.addEventListener('click', () => this.showBrandSearchModal());
    }

    setupBarcodeScanner() {
        // Check if browser supports camera
        if ('BarcodeDetector' in window) {
            console.log("Barcode scanner supported!");
            this.barcodeDetector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
        } else {
            console.log("Using fallback manual entry");
        }
    }

    async scanBarcode(imageFile) {
        // In production: Use barcode detection library
        // For demo: Manual brand search
        
        const img = await this.loadImage(imageFile);
        // Simulated barcode detection
        // return this.barcodeDetector.detect(img);
        
        // Manual fallback
        return this.showBrandSearchModal();
    }

    showBrandSearchModal() {
        const modal = document.createElement('div');
        modal.className = 'brand-scanner-modal';
        modal.innerHTML = `
            <div class="modal-content pixel-modal">
                <div class="modal-header">
                    <span class="pixel-camera">📷</span>
                    <h3>SCAN BRAND</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="instruction-text">Type the brand name or scan barcode</p>
                    <input type="text" id="brandSearchInput" placeholder="e.g., Goldfish, Oreo, Coca-Cola" class="brand-search-input">
                    <div class="brand-suggestions" id="brandSuggestions"></div>
                    <button id="manualScanBtn" class="pixel-button">🔍 SEARCH</button>
                </div>
                <div class="modal-footer">
                    <div class="pixel-tip">💡 Tip: Brands change recipes over time to save money</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const input = modal.querySelector('#brandSearchInput');
        const searchBtn = modal.querySelector('#manualScanBtn');
        const suggestions = modal.querySelector('#brandSuggestions');
        
        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const matches = Object.keys(this.brandDatabase).filter(b => b.includes(query));
            suggestions.innerHTML = matches.map(m => `
                <div class="suggestion-item" data-brand="${m}">
                    ${this.brandDatabase[m].brand} ${this.brandDatabase[m].pixelArt}
                </div>
            `).join('');
            
            suggestions.querySelectorAll('.suggestion-item').forEach(el => {
                el.addEventListener('click', () => {
                    input.value = el.dataset.brand;
                    suggestions.innerHTML = '';
                });
            });
        });
        
        searchBtn.addEventListener('click', () => {
            const brand = input.value.toLowerCase();
            if (this.brandDatabase[brand]) {
                this.analyzeBrand(brand);
                modal.remove();
            } else {
                alert("Brand not found in database. Try: goldfish, oreo, coca-cola, skippy-peanut-butter, kraft-mac-cheese");
            }
        });
        
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        
        return new Promise((resolve) => {
            // Resolution handled by click
        });
    }

    analyzeBrand(brandKey) {
        const brandData = this.brandDatabase[brandKey];
        if (!brandData) return;
        
        // Check if recipe has changed
        const hasChanged = brandData.currentRecipe.quality === 'cheapened';
        
        // Create result display
        const resultContainer = document.getElementById('scanResult') || this.createResultContainer();
        
        resultContainer.innerHTML = `
            <div class="brand-result ${hasChanged ? 'recipe-changed' : 'recipe-original'}">
                <div class="result-header">
                    <div class="brand-pixel-icon">${brandData.pixelArt}</div>
                    <div class="brand-info">
                        <h2>${brandData.brand}</h2>
                        ${hasChanged ? '<span class="change-badge">⚠️ RECIPE CHANGED</span>' : '<span class="original-badge">✓ ORIGINAL RECIPE</span>'}
                    </div>
                    <button class="close-result">&times;</button>
                </div>
                
                <div class="recipe-comparison">
                    <div class="recipe-column original">
                        <h4>📜 ORIGINAL RECIPE (Pre-${brandData.originalRecipe.yearChanged})</h4>
                        <ul class="ingredient-list">
                            ${brandData.originalRecipe.ingredients.map(i => `<li>✓ ${i}</li>`).join('')}
                        </ul>
                        ${brandData.originalRecipe.additives.length ? `<p class="additive-note">No artificial additives</p>` : ''}
                    </div>
                    
                    <div class="vs-divider">VS</div>
                    
                    <div class="recipe-column current">
                        <h4>🏭 CURRENT RECIPE (${brandData.currentRecipe.quality})</h4>
                        <ul class="ingredient-list">
                            ${brandData.currentRecipe.ingredients.map(i => {
                                const isAdditive = brandData.currentRecipe.additives.some(a => i.includes(a));
                                return `<li class="${isAdditive ? 'additive' : ''}">${isAdditive ? '⚠️' : '•'} ${i}</li>`;
                            }).join('')}
                        </ul>
                        ${brandData.currentRecipe.additives.length ? `<p class="additive-note">Contains ${brandData.currentRecipe.additives.length} artificial additives</p>` : ''}
                    </div>
                </div>
                
                <div class="change-explanation">
                    <div class="dig-in-speech-bubble">
                        <span class="dig-in-avatar">👩‍🍳</span>
                        <p>"${brandData.originalRecipe.changeNote || 'The recipe changed to save money. But I can teach you the original!'}"</p>
                    </div>
                </div>
                
                <button class="diy-button pixel-button" data-brand="${brandKey}">
                    🏠 MAKE IT YOURSELF 🏠
                </button>
            </div>
        `;
        
        // Add to scanned history
        this.scannedItems.unshift({
            brand: brandData.brand,
            timestamp: new Date().toISOString(),
            hasChanged: hasChanged
        });
        this.saveScannedHistory();
        this.updateHistoryDisplay();
        
        // Add DIY button event
        const diyBtn = resultContainer.querySelector('.diy-button');
        if (diyBtn) {
            diyBtn.addEventListener('click', () => {
                this.showDIYInstructions(brandKey);
            });
        }
        
        // Close button
        const closeBtn = resultContainer.querySelector('.close-result');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                resultContainer.style.display = 'none';
            });
        }
        
        resultContainer.style.display = 'block';
        
        // Send notification
        if (hasChanged) {
            this.sendBlitzNotification(brandData);
        }
        
        return brandData;
    }

    sendBlitzNotification(brandData) {
        // Create notification bubble
        const notification = document.createElement('div');
        notification.className = 'blitz-notification';
        notification.innerHTML = `
            <div class="notification-content pixel-border">
                <div class="notification-header">
                    <span class="notification-icon">⚠️</span>
                    <span class="notification-title">BLITZ ALERT!</span>
                    <button class="notification-dismiss">OK</button>
                </div>
                <div class="notification-body">
                    <p><strong>${brandData.brand}</strong> changed their recipe in ${brandData.originalRecipe.yearChanged}.</p>
                    <p>The original used ${brandData.originalRecipe.ingredients[0]} instead of cheaper alternatives.</p>
                    <div class="notification-learning-gap">
                        <span class="lightbulb">💡</span>
                        <span>Learning Gap: Most people don't know these changes happen. Now you do!</span>
                    </div>
                </div>
                <div class="notification-footer">
                    <button class="learn-more-btn">📖 Show me how to make the original</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Dismiss button
        notification.querySelector('.notification-dismiss').addEventListener('click', () => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        });
        
        // Learn more button
        notification.querySelector('.learn-more-btn').addEventListener('click', () => {
            this.showDIYInstructions(brandData.brand.toLowerCase().replace(/\s/g, '-'));
            notification.remove();
        });
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300);
            }
        }, 10000);
    }

    showDIYInstructions(brandKey) {
        const brandData = this.brandDatabase[brandKey];
        if (!brandData) return;
        
        const flashcardSystem = new PixelFlashcardSystem(brandData);
        flashcardSystem.show();
    }

    createResultContainer() {
        const container = document.createElement('div');
        container.id = 'scanResult';
        container.className = 'scan-result-container';
        document.body.appendChild(container);
        return container;
    }

    loadScannedHistory() {
        const saved = localStorage.getItem('scannedBrands');
        if (saved) {
            this.scannedItems = JSON.parse(saved);
            this.updateHistoryDisplay();
        }
    }

    saveScannedHistory() {
        localStorage.setItem('scannedBrands', JSON.stringify(this.scannedItems.slice(0, 20)));
    }

    updateHistoryDisplay() {
        let historyContainer = document.getElementById('scanHistory');
        if (!historyContainer) {
            historyContainer = document.createElement('div');
            historyContainer.id = 'scanHistory';
            historyContainer.className = 'scan-history';
            const resultContainer = document.getElementById('scanResult');
            if (resultContainer) {
                resultContainer.after(historyContainer);
            }
        }
        
        if (this.scannedItems.length === 0) {
            historyContainer.style.display = 'none';
            return;
        }
        
        historyContainer.style.display = 'block';
        historyContainer.innerHTML = `
            <h4>📋 RECENTLY SCANNED</h4>
            <div class="history-list">
                ${this.scannedItems.map(item => `
                    <div class="history-item ${item.hasChanged ? 'changed' : ''}">
                        <span class="history-brand">${item.brand}</span>
                        <span class="history-status">${item.hasChanged ? '⚠️ Recipe Changed' : '✓ Original'}</span>
                        <span class="history-time">${new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }
}