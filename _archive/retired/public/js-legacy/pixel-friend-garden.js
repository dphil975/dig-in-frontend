/**
 * Dig In Pixel Friend Garden
 * Inspired by classic virtual pets [citation:1][citation:3]
 * Features:
 * - Eggs found at grocery stores (location-based)
 * - Characters evolve based on what you cook
 * - Pets get hungry/full based on your cooking frequency
 * - Mini-games unlock special recipes
 */

class PixelFriendGarden {
    constructor(geolocationService, priceTracker) {
        this.geoService = geolocationService;
        this.priceTracker = priceTracker;
        this.pets = this.loadPets();
        this.eggs = this.loadEggs();
        this.activePet = null;
        this.lastTick = Date.now();
        this.init();
    }

    init() {
        this.startBackgroundLoop();
        this.setupStoreEggDrop();
    }

    loadPets() {
        const saved = localStorage.getItem('pixelFriendPets');
        if (saved) {
            this.pets = JSON.parse(saved);
        } else {
            this.pets = [];
        }
        return this.pets;
    }

    loadEggs() {
        const saved = localStorage.getItem('pixelFriendEggs');
        if (saved) {
            this.eggs = JSON.parse(saved);
        } else {
            this.eggs = [];
        }
        return this.eggs;
    }

    savePets() {
        localStorage.setItem('pixelFriendPets', JSON.stringify(this.pets));
    }

    saveEggs() {
        localStorage.setItem('pixelFriendEggs', JSON.stringify(this.eggs));
    }

    /**
     * Setup store egg drop system
     * Each store visit yields a chance to find an egg
     * Different stores = different egg rarities/types
     */
    setupStoreEggDrop() {
        // Listen for store visits from geolocation
        document.addEventListener('storeVisited', async (event) => {
            const store = event.detail.store;
            const egg = this.generateEggFromStore(store);
            
            if (egg) {
                this.eggs.push(egg);
                this.saveEggs();
                this.showEggFoundNotification(egg, store);
            }
        });
    }

    generateEggFromStore(store) {
        // Different store types yield different egg rarities
        const rarityTable = {
            'chain_grocery': { common: 0.6, rare: 0.3, epic: 0.1 },
            'specialty': { common: 0.3, rare: 0.5, epic: 0.2 },
            'corner_store': { common: 0.7, rare: 0.25, epic: 0.05 },
            'market': { common: 0.4, rare: 0.4, epic: 0.2 }
        };
        
        const rates = rarityTable[store.type] || rarityTable['chain_grocery'];
        const roll = Math.random();
        
        let rarity = 'common';
        if (roll < rates.epic) rarity = 'epic';
        else if (roll < rates.epic + rates.rare) rarity = 'rare';
        
        // 30% chance to find an egg per store visit
        if (Math.random() > 0.3) return null;
        
        return {
            id: Date.now(),
            storeId: store.id,
            storeName: store.name,
            storeType: store.type,
            rarity: rarity,
            collectedAt: new Date().toISOString(),
            hatchProgress: 0,
            requiredCookies: this.getHatchRequirements(rarity),
            character: null
        };
    }

    getHatchRequirements(rarity) {
        const requirements = {
            'common': { meals: 3, daysMin: 1 },
            'rare': { meals: 7, daysMin: 2 },
            'epic': { meals: 15, daysMin: 3 }
        };
        return requirements[rarity];
    }

    showEggFoundNotification(egg, store) {
        const notification = document.createElement('div');
        notification.className = 'egg-found-notification';
        notification.innerHTML = `
            <div class="egg-content">
                <div class="egg-icon ${egg.rarity}">🥚✨</div>
                <div class="egg-details">
                    <strong>EGG FOUND!</strong>
                    <span>You found a ${egg.rarity} egg at ${egg.storeName}</span>
                    <span class="egg-hint">Cook ${egg.requiredCookies.meals} meals to hatch it!</span>
                </div>
                <button class="view-garden-btn">VIEW GARDEN</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        notification.querySelector('.view-garden-btn').addEventListener('click', () => {
            this.showGardenModal();
            notification.remove();
        });
        
        setTimeout(() => {
            if (notification.parentElement) notification.remove();
        }, 8000);
    }

    /**
     * Hatch eggs when user cooks enough meals
     * Evolution based on cooking style [citation:3]
     */
    advanceEggHatching(mealCooked) {
        let hatchedAny = false;
        
        for (const egg of this.eggs) {
            if (!egg.character) {
                egg.hatchProgress++;
                
                if (egg.hatchProgress >= egg.requiredCookies.meals) {
                    // Hatch the egg!
                    const character = this.hatchCharacter(egg, mealCooked);
                    egg.character = character;
                    this.pets.push(character);
                    hatchedAny = true;
                }
            }
        }
        
        if (hatchedAny) {
            this.saveEggs();
            this.savePets();
            this.showHatchNotification();
        }
    }

    hatchCharacter(egg, mealCooked) {
        // Character stats based on egg rarity and what you cooked
        const baseStats = {
            'common': { hunger: 50, happiness: 50, health: 70, maxHunger: 100 },
            'rare': { hunger: 60, happiness: 60, health: 80, maxHunger: 120 },
            'epic': { hunger: 70, happiness: 70, health: 90, maxHunger: 150 }
        };
        
        const stats = baseStats[egg.rarity];
        
        // Determine character type based on cuisine of first meal
        const cuisineTypes = {
            'Japanese': { name: 'Wavecook', icon: '🍣', specialty: 'seafood' },
            'Italian': { name: 'Pastino', icon: '🍝', specialty: 'pasta' },
            'Mexican': { name: 'Salsito', icon: '🌮', specialty: 'spicy' },
            'French': { name: 'Briochon', icon: '🥐', specialty: 'baking' },
            'Chinese': { name: 'Wokbit', icon: '🥟', specialty: 'dumplings' },
            'Indian': { name: 'Spicebit', icon: '🍛', specialty: 'spices' },
            'Thai': { name: 'Lemongrass', icon: '🥥', specialty: 'herbs' },
            'Default': { name: 'Chef Pixel', icon: '👩‍🍳', specialty: 'general' }
        };
        
        const charType = cuisineTypes[mealCooked?.cuisine] || cuisineTypes['Default'];
        
        return {
            id: Date.now(),
            name: charType.name,
            icon: charType.icon,
            specialty: charType.specialty,
            rarity: egg.rarity,
            storeOrigin: egg.storeName,
            stats: stats,
            level: 1,
            xp: 0,
            favoriteFoods: [],
            discoveredRecipes: [],
            createdAt: new Date().toISOString(),
            lastFed: new Date().toISOString(),
            lastPlayed: new Date().toISOString()
        };
    }

    /**
     * Feed your pet by cooking
     * Ties directly to recipe completion [citation:5]
     */
    feedPet(petId, recipeCooked) {
        const pet = this.pets.find(p => p.id === petId);
        if (!pet) return false;
        
        // Feeding increases hunger, happiness, and XP
        pet.stats.hunger = Math.min(pet.stats.maxHunger, pet.stats.hunger + 25);
        pet.stats.happiness = Math.min(100, pet.stats.happiness + 10);
        pet.xp += 25;
        
        // Favorite food tracking
        if (!pet.favoriteFoods.includes(recipeCooked.name)) {
            pet.favoriteFoods.push(recipeCooked.name);
        }
        
        // Discovered recipes
        if (!pet.discoveredRecipes.includes(recipeCooked.id)) {
            pet.discoveredRecipes.push(recipeCooked.id);
        }
        
        // Level up check
        if (pet.xp >= pet.level * 100) {
            this.levelUpPet(pet);
        }
        
        pet.lastFed = new Date().toISOString();
        this.savePets();
        this.showPetFeedAnimation(pet, recipeCooked);
        
        return true;
    }

    levelUpPet(pet) {
        pet.level++;
        pet.stats.maxHunger += 10;
        pet.stats.hunger = pet.stats.maxHunger;
        pet.stats.health += 5;
        
        // Evolution at certain levels
        if (pet.level === 5 || pet.level === 10) {
            this.evolvePet(pet);
        }
        
        this.showLevelUpNotification(pet);
    }

    evolvePet(pet) {
        const evolutions = {
            5: { suffix: ' (Chef)', icon: pet.icon + '⭐' },
            10: { suffix: ' (Master Chef)', icon: pet.icon + '👑' }
        };
        
        const evo = evolutions[pet.level];
        if (evo) {
            pet.name = pet.name.replace(/\s*\(.*\)/, '') + evo.suffix;
            pet.icon = evo.icon;
            this.showEvolutionAnimation(pet);
        }
    }

    /**
     * Background decay system
     * Pets get hungry over time [citation:3]
     */
    startBackgroundLoop() {
        setInterval(() => {
            const now = Date.now();
            const hoursPassed = (now - this.lastTick) / (1000 * 60 * 60);
            
            if (hoursPassed >= 1) {
                for (const pet of this.pets) {
                    // Decay over time
                    pet.stats.hunger = Math.max(0, pet.stats.hunger - (5 * hoursPassed));
                    pet.stats.happiness = Math.max(0, pet.stats.happiness - (3 * hoursPassed));
                    
                    // Sick if hunger too low
                    if (pet.stats.hunger < 20) {
                        pet.stats.health = Math.max(0, pet.stats.health - 10);
                    }
                }
                this.lastTick = now;
                this.savePets();
                this.updateGardenUI();
            }
        }, 60000); // Check every minute
    }

    showGardenModal() {
        const modal = document.createElement('div');
        modal.className = 'pixel-friend-modal pixel-modal';
        modal.innerHTML = `
            <div class="modal-header">
                <span class="modal-icon">🥚🌱</span>
                <h3>MY PIXEL FRIEND GARDEN</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="garden-content">
                <div class="eggs-section">
                    <h4>🥚 HATCHING EGGS</h4>
                    <div class="eggs-grid" id="eggsGrid">
                        ${this.renderEggs()}
                    </div>
                </div>
                <div class="pets-section">
                    <h4>🐣 MY PETS</h4>
                    <div class="pets-grid" id="petsGrid">
                        ${this.renderPets()}
                    </div>
                </div>
                <div class="garden-tips">
                    <div class="tip-card">
                        <span class="tip-icon">💡</span>
                        <span>Visit different stores to find rare eggs!</span>
                    </div>
                    <div class="tip-card">
                        <span class="tip-icon">🍳</span>
                        <span>Cook meals to hatch eggs and feed your pets</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        
        // Pet click handlers
        modal.querySelectorAll('.pet-card').forEach(card => {
            card.addEventListener('click', () => {
                const petId = parseInt(card.dataset.petId);
                this.showPetDetails(petId);
                modal.remove();
            });
        });
    }

    renderEggs() {
        const unhatched = this.eggs.filter(e => !e.character);
        if (unhatched.length === 0) {
            return '<div class="empty-garden">✨ Visit grocery stores to find eggs! ✨</div>';
        }
        
        return unhatched.map(egg => `
            <div class="egg-card ${egg.rarity}">
                <div class="egg-image">🥚</div>
                <div class="egg-info">
                    <span class="egg-store">${egg.storeName}</span>
                    <span class="egg-rarity ${egg.rarity}">${egg.rarity.toUpperCase()}</span>
                    <div class="hatch-progress">
                        <div class="progress-bar" style="width: ${(egg.hatchProgress / egg.requiredCookies.meals) * 100}%"></div>
                        <span>${egg.hatchProgress}/${egg.requiredCookies.meals} meals</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPets() {
        if (this.pets.length === 0) return '<div class="empty-garden">✨ Hatch eggs to meet your pets! ✨</div>';
        
        return this.pets.map(pet => `
            <div class="pet-card" data-pet-id="${pet.id}">
                <div class="pet-icon">${pet.icon}</div>
                <div class="pet-info">
                    <span class="pet-name">${pet.name}</span>
                    <span class="pet-level">Lv.${pet.level}</span>
                    <div class="pet-stats">
                        <div class="stat hunger">
                            <span>🍽️</span>
                            <div class="stat-bar"><div style="width: ${(pet.stats.hunger / pet.stats.maxHunger) * 100}%"></div></div>
                        </div>
                        <div class="stat happiness">
                            <span>😊</span>
                            <div class="stat-bar"><div style="width: ${pet.stats.happiness}%"></div></div>
                        </div>
                        <div class="stat health">
                            <span>❤️</span>
                            <div class="stat-bar"><div style="width: ${pet.stats.health}%"></div></div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showPetDetails(petId) {
        const pet = this.pets.find(p => p.id === petId);
        if (!pet) return;
        
        const modal = document.createElement('div');
        modal.className = 'pet-details-modal pixel-modal';
        modal.innerHTML = `
            <div class="modal-header">
                <span class="pet-large-icon">${pet.icon}</span>
                <h3>${pet.name}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="pet-details">
                <div class="stats-panel">
                    <div class="stat-row">
                        <span>🍽️ Hunger</span>
                        <div class="stat-bar-lg"><div style="width: ${(pet.stats.hunger / pet.stats.maxHunger) * 100}%"></div></div>
                        <span>${pet.stats.hunger}/${pet.stats.maxHunger}</span>
                    </div>
                    <div class="stat-row">
                        <span>😊 Happiness</span>
                        <div class="stat-bar-lg"><div style="width: ${pet.stats.happiness}%"></div></div>
                        <span>${pet.stats.happiness}/100</span>
                    </div>
                    <div class="stat-row">
                        <span>❤️ Health</span>
                        <div class="stat-bar-lg"><div style="width: ${pet.stats.health}%"></div></div>
                        <span>${pet.stats.health}/100</span>
                    </div>
                </div>
                <div class="pet-history">
                    <h4>📜 DISCOVERED RECIPES</h4>
                    <div class="discovered-list">
                        ${pet.discoveredRecipes.length > 0 ? 
                            pet.discoveredRecipes.map(id => `<span class="discovered-badge">📖 Recipe #${id}</span>`).join('') :
                            '<span>Cook meals to discover recipes!</span>'}
                    </div>
                    <h4>⭐ FAVORITE FOODS</h4>
                    <div class="favorites-list">
                        ${pet.favoriteFoods.length > 0 ?
                            pet.favoriteFoods.map(f => `<span class="favorite-badge">❤️ ${f}</span>`).join('') :
                            '<span>No favorites yet!</span>'}
                    </div>
                </div>
                <button class="cook-for-pet-btn" data-pet-id="${pet.id}">🍳 COOK FOR ${pet.name.toUpperCase()}</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.cook-for-pet-btn').addEventListener('click', () => {
            // Trigger recipe selection
            const event = new CustomEvent('cookForPet', { detail: { petId: pet.id } });
            document.dispatchEvent(event);
            modal.remove();
        });
        
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    }

    showHatchNotification() {}

    updateGardenUI() {
        const modal = document.querySelector('.pixel-friend-modal');
        if (!modal) return;
        const eggsGrid = modal.querySelector('#eggsGrid');
        const petsGrid = modal.querySelector('#petsGrid');
        if (eggsGrid) eggsGrid.innerHTML = this.renderEggs();
        if (petsGrid) petsGrid.innerHTML = this.renderPets();
    }

    showPetFeedAnimation(pet, recipeCooked) {}

    showLevelUpNotification(pet) {}

    showEvolutionAnimation(pet) {}
}