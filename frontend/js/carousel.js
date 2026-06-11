/**
 * Dig In Recipe Carousel
 * Features:
 * - Infinite scrolling wheel
 * - Pixel art recipe thumbnails
 * - "Spin to discover" functionality
 * - Category filters (Japanese, Italian, Mexican, etc.)
 */

class DigInCarousel {
    constructor(containerId, recipes) {
        this.container = document.getElementById(containerId);
        this.recipes = recipes;
        this.currentIndex = 0;
        this.isSpinning = false;
        this.categories = ['All', 'Japanese', 'Italian', 'Mexican', 'Chinese', 'French', 'Indian'];
        this.init();
    }

    init() {
        this.render();
        this.attachEvents();
        this.loadPixelArtPreviews();
    }

    render() {
        this.container.innerHTML = `
            <div class="carousel-container">
                <div class="carousel-header">
                    <div class="dig-in-face">🍳</div>
                    <h2 class="carousel-title">WHAT WILL WE COOK TODAY?</h2>
                    <div class="category-filters">
                        ${this.categories.map(cat => `
                            <button class="category-btn ${cat === 'All' ? 'active' : ''}" data-category="${cat}">
                                ${cat}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="carousel-wheel">
                    <button class="carousel-nav prev" aria-label="Previous">◀</button>
                    <div class="carousel-track-container">
                        <div class="carousel-track" style="transform: translateX(-${this.currentIndex * 140}px);">
                            ${this.recipes.map(recipe => `
                                <div class="carousel-card" data-recipe-id="${recipe.id}">
                                    <div class="pixel-art-container" id="pixel-${recipe.id}">
                                        <div class="pixel-loading">◻️◼️◻️</div>
                                    </div>
                                    <div class="recipe-info">
                                        <h3 class="recipe-name">${recipe.name}</h3>
                                        <div class="recipe-meta">
                                            <span class="difficulty ${recipe.difficulty.toLowerCase()}">
                                                ${recipe.difficulty}
                                            </span>
                                            <span class="cooking-time">⏱️ ${recipe.time}min</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <button class="carousel-nav next" aria-label="Next">▶</button>
                </div>
                
                <div class="carousel-controls">
                    <button class="spin-button" id="spinButton">
                        🎰 SPIN THE WHEEL 🎰
                    </button>
                    <button class="random-button" id="randomButton">
                        🔀 SURPRISE ME
                    </button>
                </div>
                
                <div class="selected-recipe-panel" id="selectedPanel" style="display: none;">
                    <div class="selected-pixel-art" id="selectedPixelArt"></div>
                    <div class="selected-details">
                        <h3 id="selectedName"></h3>
                        <p id="selectedDescription"></p>
                        <button class="cook-button" id="cookButton">
                            🍳 LET'S COOK
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents() {
        // Navigation
        this.container.querySelector('.prev').addEventListener('click', () => this.prev());
        this.container.querySelector('.next').addEventListener('click', () => this.next());
        
        // Spin animation
        this.container.querySelector('#spinButton').addEventListener('click', () => this.spinWheel());
        this.container.querySelector('#randomButton').addEventListener('click', () => this.randomRecipe());
        
        // Category filters
        this.container.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterByCategory(e.target.dataset.category));
        });
        
        // Card click
        this.container.querySelectorAll('.carousel-card').forEach(card => {
            card.addEventListener('click', () => this.selectRecipe(card.dataset.recipeId));
        });
        
        // Cook button
        const cookBtn = this.container.querySelector('#cookButton');
        if (cookBtn) {
            cookBtn.addEventListener('click', () => this.startCooking());
        }
    }

    async loadPixelArtPreviews() {
        const converter = new DigInPixelConverter();
        
        for (const recipe of this.recipes) {
            const container = document.getElementById(`pixel-${recipe.id}`);
            if (container && recipe.imageUrl) {
                try {
                    // Convert dish photo to pixel art
                    const pixelArtBlob = await converter.convertToPixelArt(recipe.imageUrl, {
                        pixelSize: 8,
                        paletteSize: 24,
                        dithering: true
                    });
                    
                    const imgUrl = URL.createObjectURL(pixelArtBlob);
                    container.innerHTML = `<img src="${imgUrl}" alt="${recipe.name}" class="pixel-recipe-img">`;
                } catch (error) {
                    console.error(`Failed to generate pixel art for ${recipe.name}:`, error);
                    // Fallback to emoji pixel art
                    container.innerHTML = `<div class="pixel-fallback">${recipe.pixelEmoji || '🍲'}</div>`;
                }
            }
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        } else {
            this.currentIndex = this.recipes.length - 1;
        }
        const track = this.container.querySelector('.carousel-track');
        track.style.transition = 'transform 0.3s ease-out';
        track.style.transform = `translateX(-${this.currentIndex * 140}px)`;
    }

    next() {
        if (this.currentIndex < this.recipes.length - 1) {
            this.currentIndex++;
        } else {
            this.currentIndex = 0;
        }
        const track = this.container.querySelector('.carousel-track');
        track.style.transition = 'transform 0.3s ease-out';
        track.style.transform = `translateX(-${this.currentIndex * 140}px)`;
    }

    spinWheel() {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        const spinButton = this.container.querySelector('#spinButton');
        spinButton.disabled = true;
        spinButton.textContent = '🎡 SPINNING... 🎡';
        
        // Random number of spins (5-15 full rotations)
        const totalCards = this.recipes.length;
        const spins = Math.floor(Math.random() * 10) + 5;
        const targetIndex = Math.floor(Math.random() * totalCards);
        const finalPosition = (spins * totalCards + targetIndex) * 140;
        
        const track = this.container.querySelector('.carousel-track');
        const currentTransform = parseInt(track.style.transform.replace('translateX(', '').replace('px)', '')) || 0;
        const targetTransform = currentTransform - finalPosition;
        
        // Animate the spin
        track.style.transition = 'transform 2s cubic-bezier(0.2, 0.9, 0.4, 1.1)';
        track.style.transform = `translateX(${targetTransform}px)`;
        
        setTimeout(() => {
            // Normalize to actual index
            this.currentIndex = targetIndex;
            track.style.transition = 'none';
            track.style.transform = `translateX(-${this.currentIndex * 140}px)`;
            
            this.isSpinning = false;
            spinButton.disabled = false;
            spinButton.textContent = '🎰 SPIN THE WHEEL 🎰';
            
            // Show the selected recipe
            this.selectRecipe(this.recipes[targetIndex].id);
            
        }, 2000);
    }

    selectRecipe(recipeId) {
        const recipe = this.recipes.find(r => r.id == recipeId);
        if (!recipe) return;
        
        const panel = this.container.querySelector('#selectedPanel');
        const pixelArtContainer = this.container.querySelector('#selectedPixelArt');
        const nameEl = this.container.querySelector('#selectedName');
        const descEl = this.container.querySelector('#selectedDescription');
        
        // Get pixel art from the card
        const cardPixelArt = this.container.querySelector(`#pixel-${recipeId} img`);
        if (cardPixelArt) {
            pixelArtContainer.innerHTML = `<img src="${cardPixelArt.src}" alt="${recipe.name}" class="selected-pixel">`;
        } else {
            pixelArtContainer.innerHTML = `<div class="pixel-fallback large">${recipe.pixelEmoji || '🍳'}</div>`;
        }
        
        nameEl.textContent = recipe.name;
        descEl.textContent = recipe.description || `${recipe.name} is a delicious ${recipe.cuisine} dish that you can make in ${recipe.time} minutes!`;
        
        panel.style.display = 'flex';
        
        // Highlight the selected card
        this.container.querySelectorAll('.carousel-card').forEach(card => {
            card.classList.remove('selected');
        });
        const selectedCard = this.container.querySelector(`.carousel-card[data-recipe-id="${recipeId}"]`);
        if (selectedCard) selectedCard.classList.add('selected');
    }

    filterByCategory(category) {
        const cards = this.container.querySelectorAll('.carousel-card');
        let visibleCount = 0;
        
        cards.forEach((card, index) => {
            const recipe = this.recipes[index];
            if (category === 'All' || recipe.cuisine === category) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Rebuild track width
        const track = this.container.querySelector('.carousel-track');
        track.style.width = `${visibleCount * 140}px`;
        
        // Update active filter button
        this.container.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
    }

    randomRecipe() {
        const randomIndex = Math.floor(Math.random() * this.recipes.length);
        this.currentIndex = randomIndex;
        
        const track = this.container.querySelector('.carousel-track');
        track.style.transition = 'transform 0.5s ease-out';
        track.style.transform = `translateX(-${this.currentIndex * 140}px)`;
        
        setTimeout(() => {
            this.selectRecipe(this.recipes[randomIndex].id);
        }, 500);
    }

    startCooking() {
        const selectedName = this.container.querySelector('#selectedName').textContent;
        const event = new CustomEvent('startCooking', { detail: { recipeName: selectedName } });
        document.dispatchEvent(event);
    }
}