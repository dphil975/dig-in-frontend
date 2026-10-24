/**
 * Pixel Friend Garden - Color Theory Integration
 * Every egg and pet has unique, procedurally generated colors
 */

class ColorPixelFriendGarden extends PixelFriendGarden {
    constructor(geolocationService, priceTracker) {
        super(geolocationService, priceTracker);
        this.colorEngine = new ColorTheoryEngine();
        this.initColorSystem();
    }

    initColorSystem() {
        // Generate daily palette for UI
        this.dailyPalette = this.colorEngine.generateDailyPalette();
        this.applyUIPalette();
    }

    applyUIPalette() {
        const root = document.documentElement;
        
        for (const color of this.dailyPalette) {
            root.style.setProperty(`--color-${color.role}`, color.hex);
        }
        
        // Apply workflow colors for cooking steps
        for (const [step, data] of Object.entries(this.colorEngine.workflowColors)) {
            root.style.setProperty(`--workflow-${step}-color`, data.color);
        }
    }

    generateEggFromStore(store) {
        // Get store color using color theory engine
        const storeColor = this.colorEngine.generateStoreColor(store.id, store.type, store.name);
        
        // Generate egg color (pastel version of store color)
        const eggColor = this.colorEngine.generateEggColor(storeColor);
        
        // Random rarity based on color family
        const rarityTable = {
            'red': { common: 0.5, rare: 0.35, epic: 0.15 },
            'orange': { common: 0.6, rare: 0.3, epic: 0.1 },
            'yellow': { common: 0.55, rare: 0.35, epic: 0.1 },
            'green': { common: 0.5, rare: 0.35, epic: 0.15 },
            'blue': { common: 0.45, rare: 0.4, epic: 0.15 },
            'purple': { common: 0.4, rare: 0.4, epic: 0.2 }
        };
        
        const rates = rarityTable[eggColor.family] || rarityTable.orange;
        const roll = Math.random();
        
        let rarity = 'common';
        if (roll < rates.epic) rarity = 'epic';
        else if (roll < rates.epic + rates.rare) rarity = 'rare';
        
        // 35% chance to find an egg per store visit
        if (Math.random() > 0.35) return null;
        
        return {
            id: Date.now(),
            storeId: store.id,
            storeName: store.name,
            storeType: store.type,
            rarity: rarity,
            color: eggColor,
            collectedAt: new Date().toISOString(),
            hatchProgress: 0,
            requiredCookies: this.getHatchRequirements(rarity),
            character: null
        };
    }

    hatchCharacter(egg, mealCooked) {
        // Generate pet color from egg color
        const petType = `${mealCooked?.cuisine || 'default'}_${egg.rarity}`;
        const petColor = this.colorEngine.generatePetColor(egg.color, petType);
        
        // Determine character type based on cuisine + color psychology
        const cuisineTypes = {
            'Japanese': {
                name: 'Wavecook',
                icon: '🍣',
                specialty: 'seafood',
                personality: petColor.psychology
            },
            'Italian': {
                name: 'Pastino',
                icon: '🍝',
                specialty: 'pasta',
                personality: petColor.psychology
            },
            'Mexican': {
                name: 'Salsito',
                icon: '🌮',
                specialty: 'spicy',
                personality: petColor.psychology
            },
            'French': {
                name: 'Briochon',
                icon: '🥐',
                specialty: 'baking',
                personality: petColor.psychology
            },
            'Default': {
                name: 'Chef Pixel',
                icon: '👩‍🍳',
                specialty: 'general',
                personality: petColor.psychology
            }
        };
        
        const charType = cuisineTypes[mealCooked?.cuisine] || cuisineTypes['Default'];
        
        // Base stats influenced by color psychology
        const psychologyBonuses = {
            'energy': { hunger: 55, happiness: 60 },
            'passion': { hunger: 65, happiness: 55 },
            'warmth': { hunger: 60, happiness: 65 },
            'creativity': { hunger: 50, happiness: 70 },
            'happiness': { hunger: 55, happiness: 75 },
            'clarity': { hunger: 60, happiness: 60 },
            'freshness': { hunger: 65, happiness: 55 },
            'balance': { hunger: 60, happiness: 60 },
            'calm': { hunger: 55, happiness: 55 },
            'precision': { hunger: 70, happiness: 50 },
            'luxury': { hunger: 60, happiness: 65 },
            'magic': { hunger: 55, happiness: 70 }
        };
        
        const bonus = psychologyBonuses[petColor.psychology] || { hunger: 60, happiness: 60 };
        
        const baseStats = {
            'common': { maxHunger: 100 },
            'rare': { maxHunger: 120 },
            'epic': { maxHunger: 150 }
        };
        
        const maxHunger = baseStats[egg.rarity].maxHunger;
        
        return {
            id: Date.now(),
            name: charType.name,
            icon: charType.icon,
            specialty: charType.specialty,
            rarity: egg.rarity,
            color: petColor,
            storeOrigin: egg.storeName,
            stats: {
                hunger: bonus.hunger,
                happiness: bonus.happiness,
                health: 70,
                maxHunger: maxHunger
            },
            personality: petColor.psychology,
            level: 1,
            xp: 0,
            favoriteFoods: [],
            discoveredRecipes: [],
            createdAt: new Date().toISOString(),
            lastFed: new Date().toISOString(),
            lastPlayed: new Date().toISOString()
        };
    }

    renderEggs() {
        const unhatched = this.eggs.filter(e => !e.character);
        if (unhatched.length === 0) {
            return '<div class="empty-garden">✨ Visit grocery stores to find eggs! ✨</div>';
        }
        
        return unhatched.map(egg => `
            <div class="egg-card ${egg.rarity}" style="background: ${egg.color.hex}20; border-color: ${egg.color.hex};">
                <div class="egg-image" style="color: ${egg.color.hex};">🥚</div>
                <div class="egg-info">
                    <span class="egg-store">${egg.storeName}</span>
                    <span class="egg-rarity ${egg.rarity}" style="color: ${egg.color.hex};">${egg.rarity.toUpperCase()}</span>
                    <span class="egg-pattern">${egg.color.pattern} pattern</span>
                    <div class="hatch-progress">
                        <div class="progress-bar" style="width: ${(egg.hatchProgress / egg.requiredCookies.meals) * 100}%; background: ${egg.color.hex};"></div>
                        <span>${egg.hatchProgress}/${egg.requiredCookies.meals} meals</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPets() {
        if (this.pets.length === 0) return '<div class="empty-garden">✨ Hatch eggs to meet your pets! ✨</div>';
        
        return this.pets.map(pet => `
            <div class="pet-card" data-pet-id="${pet.id}" style="background: ${pet.color.hex}15; border-color: ${pet.color.hex};">
                <div class="pet-icon" style="background: ${pet.color.hex}30;">${pet.icon}</div>
                <div class="pet-info">
                    <span class="pet-name" style="color: ${pet.color.hex};">${pet.name}</span>
                    <span class="pet-level">Lv.${pet.level}</span>
                    <span class="pet-personality">✨ ${pet.personality}</span>
                    <div class="pet-stats">
                        <div class="stat hunger">
                            <span>🍽️</span>
                            <div class="stat-bar"><div style="width: ${(pet.stats.hunger / pet.stats.maxHunger) * 100}%; background: ${pet.color.hex};"></div></div>
                        </div>
                        <div class="stat happiness">
                            <span>😊</span>
                            <div class="stat-bar"><div style="width: ${pet.stats.happiness}%; background: ${pet.color.hex};"></div></div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showEggFoundNotification(egg, store) {
        const notification = document.createElement('div');
        notification.className = 'egg-found-notification';
        notification.style.borderLeft = `4px solid ${egg.color.hex}`;
        notification.innerHTML = `
            <div class="egg-content">
                <div class="egg-icon ${egg.rarity}" style="color: ${egg.color.hex};">🥚✨</div>
                <div class="egg-details">
                    <strong>${egg.rarity.toUpperCase()} EGG FOUND!</strong>
                    <span>${egg.color.pattern} pattern • ${egg.color.family} toned</span>
                    <span>Found at ${egg.storeName}</span>
                    <span class="egg-hint">Cook ${egg.requiredCookies.meals} meals to hatch!</span>
                </div>
                <button class="view-garden-btn" style="background: ${egg.color.hex};">VIEW GARDEN</button>
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

    showHatchNotification() {
        const hatchedPet = this.pets[this.pets.length - 1];
        if (!hatchedPet) return;
        
        const notification = document.createElement('div');
        notification.className = 'hatch-notification';
        notification.style.background = `linear-gradient(135deg, ${hatchedPet.color.hex}20, ${hatchedPet.color.hex}40)`;
        notification.style.border = `2px solid ${hatchedPet.color.hex}`;
        notification.innerHTML = `
            <div class="hatch-content">
                <div class="hatch-animation">🐣✨🥚</div>
                <div class="hatch-details">
                    <strong>EGG HATCHED!</strong>
                    <span>Meet ${hatchedPet.name}!</span>
                    <span style="color: ${hatchedPet.color.hex};">✨ ${hatchedPet.personality} personality ✨</span>
                    <span>Color: ${hatchedPet.color.variation} harmony</span>
                </div>
                <button class="view-pet-btn" style="background: ${hatchedPet.color.hex};">VIEW PET</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        notification.querySelector('.view-pet-btn').addEventListener('click', () => {
            this.showPetDetails(hatchedPet.id);
            notification.remove();
        });
        
        setTimeout(() => {
            if (notification.parentElement) notification.remove();
        }, 10000);
    }
}