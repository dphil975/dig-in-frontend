/**
 * Dig In Frog Garden
 * The unexpected amphibian surprise
 *
 * "Why a frog?"
 * "It's a surprise. That's the point."
 *
 * Features:
 * - All eggs hatch into frogs (shhh, don't tell anyone)
 * - Each frog has unique color, pattern, personality
 * - Frogs react to different cuisines
 * - Cooking with frogs = bonus XP
 */

const randomFrogName = [
    "Kero", "Ribberto", "Hopple", "Croaksworth", "Lily",
    "Puddles", "Toadally", "Froggington", "Sir Hops-a-lot",
    "Prince Naveen", "Michigan J.", "Kermit", "Slippy",
    "Glub", "Wart Jr.", "Frogmar", "Leapold", "Hoppocrates"
];

const randomPersonality = [
    "energetic", "calm", "bold", "mysterious", "cheerful",
    "wise", "playful", "creative", "curious", "grounded"
];

class Frog {
    constructor({ name, personality, color, surprise = true }) {
        this.name = Array.isArray(name)
            ? name[Math.floor(Math.random() * name.length)]
            : name;
        this.personality = Array.isArray(personality)
            ? personality[Math.floor(Math.random() * personality.length)]
            : personality;
        this.color = color;
        this.surprise = surprise;
        this.type = "frog";
        this.icon = "🐸";
        this.createdAt = new Date().toISOString();
    }
}

// The surprise is coded into the hatch function
// No hints. No warnings. Just... frog.

function hatchEgg(egg) {
    // User thinks: "I wonder what will hatch?"
    // User expects: Bird, dragon, cat, dog?
    // Reality: 🐸

    return new Frog({
        name: randomFrogName,
        personality: randomPersonality,
        color: egg.color,
        surprise: true  // Always true. Always frog.
    });
}

class FrogGarden extends ColorPixelFriendGarden {
    constructor(geolocationService, priceTracker) {
        super(geolocationService, priceTracker);
        this.frogSpecies = this.loadFrogSpecies();
        this.surpriseMood = "mischievous";
        this.initFrogSystem();
    }

    initFrogSystem() {
        // Add the surprise reveal to the UI
        this.addSurpriseElement();
    }

    loadFrogSpecies() {
        // Different frog "species" based on color and personality
        return {
            red_frogs: {
                species: "Ember Leapfrog",
                traits: ["energetic", "spicy", "bold", "adventurous"],
                favoriteFoods: ["spicy", "grilled", "seared"],
                specialAbility: "Heat Resistance - Cooks faster!",
                sound: "Ribbit! (enthusiastic)"
            },
            orange_frogs: {
                species: "Sunfire Hopper",
                traits: ["warm", "creative", "playful", "sun-loving"],
                favoriteFoods: ["baked", "roasted", "comfort food"],
                specialAbility: "Golden Touch - Extra GP from cooking!",
                sound: "Ribbit! (cheerful)"
            },
            yellow_frogs: {
                species: "Golden Rainette",
                traits: ["cheerful", "optimistic", "bright", "curious"],
                favoriteFoods: ["fresh", "light", "citrus"],
                specialAbility: "Sunbeam - Finds rare ingredients!",
                sound: "Ribbit! (happy)"
            },
            green_frogs: {
                species: "Mossback Croaker",
                traits: ["calm", "wise", "patient", "grounded"],
                favoriteFoods: ["herbs", "vegetables", "fresh produce"],
                specialAbility: "Photosynthesis - Regenerates happiness!",
                sound: "Ribbit... (meditative)"
            },
            blue_frogs: {
                species: "Tide Glider",
                traits: ["calm", "focused", "precise", "deep"],
                favoriteFoods: ["seafood", "delicate sauces", "soups"],
                specialAbility: "Ocean's Grace - Perfect timing bonus!",
                sound: "Ribbit. (focused)"
            },
            purple_frogs: {
                species: "Twilight Leaper",
                traits: ["mysterious", "creative", "magical", "dreamy"],
                favoriteFoods: ["complex", "fusion", "artistic"],
                specialAbility: "Moonlight - Creates unique recipe variations!",
                sound: "Ribbit~ (mysterious)"
            }
        };
    }

    addSurpriseElement() {
        // Add hidden surprise message that reveals at hatch time
        const surpriseHint = document.createElement('div');
        surpriseHint.className = 'surprise-hint';
        surpriseHint.innerHTML = `
            <div class="surprise-content">
                <span class="surprise-icon">🥚❓</span>
                <span class="surprise-text">What's inside? It's a surprise...</span>
            </div>
        `;
        surpriseHint.style.display = 'none';
        document.body.appendChild(surpriseHint);
    }

    /**
     * The big reveal: It's a frog!
     * No one expects it. That's the whole point.
     */
    hatchCharacter(egg, mealCooked) {
        const frogColor = this.colorEngine.generatePetColor(egg.color, `frog_${egg.color.family}`);

        // Use hatchEgg for the base surprise — name, personality, color
        const base = hatchEgg({ ...egg, color: frogColor });

        // Enrich with species data based on color family
        const speciesKey = `${egg.color.family}_frogs`;
        const speciesData = this.frogSpecies[speciesKey] || this.frogSpecies.green_frogs;

        const surpriseBonus = {
            hunger: Math.floor(Math.random() * 20),
            happiness: Math.floor(Math.random() * 20),
            special: Math.random() > 0.7 ? this.getRandomSpecialAbility() : null
        };

        const maxHunger = { common: 100, rare: 120, epic: 150 }[egg.rarity] + surpriseBonus.hunger;

        return {
            ...base,
            id: Date.now(),
            species: speciesData.species,
            emoji: this.getFrogEmoji(base.personality),
            rarity: egg.rarity,
            storeOrigin: egg.storeName,
            traits: speciesData.traits,
            favoriteFoods: speciesData.favoriteFoods,
            specialAbility: speciesData.specialAbility,
            surpriseBonus: surpriseBonus.special,
            stats: {
                hunger: 50 + surpriseBonus.hunger,
                happiness: 50 + surpriseBonus.happiness,
                health: 70,
                maxHunger: maxHunger
            },
            level: 1,
            xp: 0,
            discoveredRecipes: [],
            sound: speciesData.sound,
            lastFed: new Date().toISOString(),
            lastPlayed: new Date().toISOString()
        };
    }

    getFrogEmoji(personality) {
        const emojis = {
            'energetic': '🐸⚡',
            'spicy': '🐸🌶️',
            'bold': '🐸👑',
            'adventurous': '🐸🗺️',
            'warm': '🐸🔥',
            'creative': '🐸🎨',
            'playful': '🐸🎮',
            'sun-loving': '🐸☀️',
            'cheerful': '🐸😊',
            'optimistic': '🐸✨',
            'bright': '🐸💡',
            'curious': '🐸🔍',
            'calm': '🐸🧘',
            'wise': '🐸📚',
            'patient': '🐸⏳',
            'grounded': '🐸🌍',
            'focused': '🐸🎯',
            'precise': '🐸📏',
            'deep': '🐸🌊',
            'mysterious': '🐸🌙',
            'magical': '🐸🔮',
            'dreamy': '🐸💭'
        };
        return emojis[personality] || '🐸';
    }

    getRandomSpecialAbility() {
        const secretAbilities = [
            "Double Jump - Cooks two steps at once!",
            "Tongue Grab - Auto-collects ingredients!",
            "Camouflage - Hides burnt food mistakes!",
            "Pond Magic - Makes leftovers taste fresh!",
            "Fly Catching - Finds free ingredients weekly!"
        ];
        return secretAbilities[Math.floor(Math.random() * secretAbilities.length)];
    }

    /**
     * The surprise reveal animation
     * This is where everyone finds out... it's a FROG!
     */
    showHatchNotification() {
        const hatchedPet = this.pets[this.pets.length - 1];
        if (!hatchedPet) return;
        
        // Dramatic pause... then reveal
        const notification = document.createElement('div');
        notification.className = 'hatch-notification frog-reveal';
        notification.innerHTML = `
            <div class="hatch-content">
                <div class="hatch-animation">
                    <span class="egg-cracking">🥚💥</span>
                    <span class="surprise-reveal hidden">🐸✨</span>
                </div>
                <div class="hatch-details">
                    <div class="surprise-banner">🎉 SURPRISE! 🎉</div>
                    <strong>IT'S A ${hatchedPet.species.toUpperCase()}!</strong>
                    <div class="frog-big-icon">🐸</div>
                    <span>Meet ${hatchedPet.name} the ${hatchedPet.personality} frog!</span>
                    <span style="color: ${hatchedPet.color.hex};">✨ ${hatchedPet.specialAbility} ✨</span>
                    <div class="surprise-message">
                        "You expected a bird? A dragon? 
                         <br>Nope. It's a frog. 
                         <br>That's the surprise."
                    </div>
                </div>
                <button class="view-pet-btn" style="background: ${hatchedPet.color.hex};">MEET YOUR FROG</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate the reveal
        setTimeout(() => {
            const eggCracking = notification.querySelector('.egg-cracking');
            const frogReveal = notification.querySelector('.surprise-reveal');
            if (eggCracking && frogReveal) {
                eggCracking.style.display = 'none';
                frogReveal.classList.remove('hidden');
                frogReveal.style.display = 'block';
            }
        }, 1500);
        
        notification.querySelector('.view-pet-btn').addEventListener('click', () => {
            this.showPetDetails(hatchedPet.id);
            notification.remove();
        });
        
        // Play frog sound effect (conceptual)
        this.playFrogSound(hatchedPet.sound);
        
        setTimeout(() => {
            if (notification.parentElement) notification.remove();
        }, 12000);
    }

    playFrogSound(soundText) {
        // Visual sound representation since audio requires user interaction
        const soundBubble = document.createElement('div');
        soundBubble.className = 'frog-sound-bubble';
        soundBubble.textContent = soundText;
        soundBubble.style.position = 'fixed';
        soundBubble.style.bottom = '20%';
        soundBubble.style.left = '50%';
        soundBubble.style.transform = 'translateX(-50%)';
        soundBubble.style.background = '#2E7D32';
        soundBubble.style.color = 'white';
        soundBubble.style.padding = '8px 16px';
        soundBubble.style.borderRadius = '30px';
        soundBubble.style.fontFamily = 'monospace';
        soundBubble.style.zIndex = '2000';
        soundBubble.style.animation = 'floatUp 2s ease-out forwards';
        
        document.body.appendChild(soundBubble);
        
        setTimeout(() => soundBubble.remove(), 2000);
    }

    /**
     * Feed your frog — they have favorite cuisines!
     */
    feedPet(petId, recipeCooked) {
        const pet = this.pets.find(p => p.id === petId);
        if (!pet || pet.type !== 'frog') return false;
        
        // Check if this recipe matches frog's favorite food type
        const recipeCuisine = recipeCooked.cuisine?.toLowerCase() || '';
        const isFavorite = pet.favoriteFoods.some(food => 
            recipeCuisine.includes(food) || 
            recipeCooked.name?.toLowerCase().includes(food)
        );
        
        // Bonus for favorite foods
        const bonusMultiplier = isFavorite ? 1.5 : 1;
        
        pet.stats.hunger = Math.min(pet.stats.maxHunger, pet.stats.hunger + (25 * bonusMultiplier));
        pet.stats.happiness = Math.min(100, pet.stats.happiness + (10 * bonusMultiplier));
        pet.xp += 25 * bonusMultiplier;
        
        // Frog-specific reaction
        this.showFrogReaction(pet, isFavorite);
        
        // Favorite food tracking
        if (isFavorite && !pet.favoriteFoods.includes(recipeCooked.name)) {
            pet.favoriteFoods.push(recipeCooked.name);
        }
        
        // Discovered recipes
        if (!pet.discoveredRecipes.includes(recipeCooked.id)) {
            pet.discoveredRecipes.push(recipeCooked.id);
        }
        
        // Level up
        if (pet.xp >= pet.level * 100) {
            this.levelUpPet(pet);
        }
        
        pet.lastFed = new Date().toISOString();
        this.savePets();
        this.showPetFeedAnimation(pet, recipeCooked, isFavorite);
        
        return true;
    }

    showFrogReaction(pet, isFavorite) {
        const reactions = {
            favorite: [
                "🐸 RIBBIT! (ecstatic)",
                "🐸 *happy frog noises*",
                "🐸 Does a little hop of joy!",
                "🐸 Licks lips with long tongue"
            ],
            normal: [
                "🐸 Ribbit.",
                "🐸 *content frog sounds*",
                "🐸 Blinks slowly",
                "🐸 Nods approvingly"
            ]
        };
        
        const reactionList = isFavorite ? reactions.favorite : reactions.normal;
        const reaction = reactionList[Math.floor(Math.random() * reactionList.length)];
        
        const bubble = document.createElement('div');
        bubble.className = 'frog-reaction';
        bubble.textContent = reaction;
        bubble.style.position = 'fixed';
        bubble.style.bottom = '30%';
        bubble.style.right = '20%';
        bubble.style.background = pet.color.hex;
        bubble.style.color = 'white';
        bubble.style.padding = '6px 12px';
        bubble.style.borderRadius = '20px';
        bubble.style.fontSize = '10px';
        bubble.style.zIndex = '2000';
        bubble.style.animation = 'floatUp 2s ease-out forwards';
        
        document.body.appendChild(bubble);
        setTimeout(() => bubble.remove(), 2000);
    }

    /**
     * Render frogs with their unique personalities
     */
    renderPets() {
        if (this.pets.length === 0) {
            return '<div class="empty-garden">✨ Hatch eggs to meet your surprise frogs! ✨</div>';
        }
        
        return this.pets.map(pet => `
            <div class="pet-card frog-card" data-pet-id="${pet.id}" style="background: ${pet.color.hex}15; border-color: ${pet.color.hex};">
                <div class="pet-icon frog-icon" style="background: ${pet.color.hex}30;">
                    ${pet.emoji || '🐸'}
                </div>
                <div class="pet-info">
                    <span class="pet-name" style="color: ${pet.color.hex};">${pet.name}</span>
                    <span class="pet-species">${pet.species}</span>
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
                    ${pet.surpriseBonus ? `<div class="surprise-bonus">✨ ${pet.surpriseBonus} ✨</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * Frog-specific details panel
     */
    showPetDetails(petId) {
        const pet = this.pets.find(p => p.id === petId);
        if (!pet) return;
        
        const modal = document.createElement('div');
        modal.className = 'pet-details-modal frog-modal pixel-modal';
        modal.innerHTML = `
            <div class="modal-header" style="background: ${pet.color.hex}20;">
                <span class="pet-large-icon frog-large">${pet.emoji || '🐸'}</span>
                <h3>${pet.name} <span style="font-size: 12px;">the ${pet.species}</span></h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="pet-details frog-details">
                <div class="surprise-badge">
                    🎁 SURPRISE PET! 🎁
                    <div class="surprise-subtle">(You expected something else, didn't you?)</div>
                </div>
                
                <div class="stats-panel">
                    <div class="stat-row">
                        <span>🍽️ Hunger</span>
                        <div class="stat-bar-lg"><div style="width: ${(pet.stats.hunger / pet.stats.maxHunger) * 100}%; background: ${pet.color.hex};"></div></div>
                        <span>${pet.stats.hunger}/${pet.stats.maxHunger}</span>
                    </div>
                    <div class="stat-row">
                        <span>😊 Happiness</span>
                        <div class="stat-bar-lg"><div style="width: ${pet.stats.happiness}%; background: ${pet.color.hex};"></div></div>
                        <span>${pet.stats.happiness}/100</span>
                    </div>
                    <div class="stat-row">
                        <span>❤️ Health</span>
                        <div class="stat-bar-lg"><div style="width: ${pet.stats.health}%; background: ${pet.color.hex};"></div></div>
                        <span>${pet.stats.health}/100</span>
                    </div>
                </div>
                
                <div class="frog-personality">
                    <h4>🐸 PERSONALITY</h4>
                    <div class="personality-badge">${pet.personality}</div>
                    <p>${this.getPersonalityDescription(pet.personality)}</p>
                </div>
                
                <div class="frog-abilities">
                    <h4>✨ SPECIAL ABILITY</h4>
                    <div class="ability-card" style="border-color: ${pet.color.hex};">
                        <span class="ability-icon">🐸</span>
                        <span class="ability-text">${pet.specialAbility}</span>
                    </div>
                    ${pet.surpriseBonus ? `
                        <div class="secret-ability" style="background: ${pet.color.hex}20;">
                            <span>🔮 SECRET BONUS</span>
                            <span>${pet.surpriseBonus}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="frog-favorites">
                    <h4>🍽️ FAVORITE FOODS</h4>
                    <div class="favorites-list">
                        ${pet.favoriteFoods.length > 0 ?
                            pet.favoriteFoods.map(f => `<span class="favorite-badge">❤️ ${f}</span>`).join('') :
                            '<span>Cook different cuisines to discover favorites!</span>'}
                    </div>
                    <div class="frog-tip">
                        💡 Feed ${pet.name} their favorite foods for bonus XP!
                    </div>
                </div>
                
                <div class="frog-sound">
                    <h4>🔊 FROG SOUND</h4>
                    <div class="sound-button" onclick="this.textContent = '${pet.sound}'">
                        🎵 Play Sound
                    </div>
                </div>
                
                <button class="cook-for-pet-btn" data-pet-id="${pet.id}" style="background: ${pet.color.hex};">
                    🍳 COOK FOR ${pet.name.toUpperCase()}
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.cook-for-pet-btn').addEventListener('click', () => {
            const event = new CustomEvent('cookForPet', { detail: { petId: pet.id } });
            document.dispatchEvent(event);
            modal.remove();
        });
        
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        
        // Sound button
        const soundBtn = modal.querySelector('.sound-button');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                const bubble = document.createElement('div');
                bubble.className = 'frog-sound-bubble';
                bubble.textContent = pet.sound;
                bubble.style.position = 'fixed';
                bubble.style.bottom = '50%';
                bubble.style.left = '50%';
                bubble.style.transform = 'translate(-50%, -50%)';
                bubble.style.background = pet.color.hex;
                bubble.style.color = 'white';
                bubble.style.padding = '12px 24px';
                bubble.style.borderRadius = '40px';
                bubble.style.fontSize = '16px';
                bubble.style.zIndex = '2100';
                bubble.style.animation = 'floatUp 1.5s ease-out forwards';
                document.body.appendChild(bubble);
                setTimeout(() => bubble.remove(), 1500);
            });
        }
    }

    getPersonalityDescription(personality) {
        const descriptions = {
            'energetic': "This frog bounces with excitement while you cook! Loves fast-paced recipes.",
            'spicy': "A bold frog who isn't afraid of heat. Literally. Enjoys spicy dishes.",
            'bold': "Confident in the kitchen. Never second-guesses a recipe.",
            'adventurous': "Always curious about new cuisines. Loves exploring global recipes.",
            'warm': "A cozy frog perfect for comfort food cooking sessions.",
            'creative': "Suggests wild recipe modifications. Sometimes they work!",
            'playful': "Turns cooking into a game. Makes kitchen time fun!",
            'sun-loving': "Thrives in bright kitchens. Extra happy during daytime cooking.",
            'cheerful': "Always optimistic. Even burnt food gets an 'almost perfect!'",
            'optimistic': "Believes every dish can be saved with the right garnish.",
            'bright': "Quick learner. Masters new recipes faster than other frogs.",
            'curious': "Always peeking at what you're cooking. Asks lots of questions.",
            'calm': "Meditative presence in the kitchen. Reduces cooking stress.",
            'wise': "Offers ancient frog wisdom about traditional cooking methods.",
            'patient': "Never rushes a simmer or a proof. Good things take time.",
            'grounded': "Keeps you connected to simple, wholesome ingredients.",
            'focused': "Zero distractions. Laser focus on the recipe.",
            'precise': "Insists on exact measurements. Your baking will improve!",
            'deep': "Contemplative about flavor combinations. Philosopher frog.",
            'mysterious': "Keeps secrets about their magical ingredients.",
            'magical': "Sometimes makes ingredients appear when you're not looking.",
            'dreamy': "Gets lost in daydreams about faraway cuisines."
        };
        return descriptions[personality] || "A unique frog with their own special way of cooking!";
    }
}