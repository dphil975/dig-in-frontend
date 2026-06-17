/**
 * Dig In Recipe Card System
 * Features:
 * - Recipe card with pixel art thumbnail
 * - Skill level, prep time, total time
 * - 1-5 star rating system
 * - Page dots navigation
 * - Save to favorites
 */

class RecipeCard {
    constructor(containerId, recipe, onSave, onPageChange) {
        this.container = document.getElementById(containerId);
        this.recipe = recipe;
        this.currentPage = 0;
        this.onSave = onSave;
        this.onPageChange = onPageChange;
        this.isSaved = this.checkIfSaved();
        this.render();
    }

    checkIfSaved() {
        const saved = localStorage.getItem('savedRecipes');
        if (saved) {
            const savedIds = JSON.parse(saved);
            return savedIds.includes(this.recipe.id);
        }
        return false;
    }

    render() {
        this.container.innerHTML = `
            <div class="recipe-card-container">
                <div class="recipe-card">
                    <!-- Top Section: Pixel Art + Title -->
                    <div class="recipe-card-header">
                        <div class="pixel-art-section">
                            <div class="pixel-recipe-image" id="recipePixelArt">
                                <div class="pixel-loading-small">◻️◼️◻️</div>
                            </div>
                            <button class="save-recipe-btn ${this.isSaved ? 'saved' : ''}" id="saveRecipeBtn">
                                ${this.isSaved ? '❤️ SAVED' : '🤍 SAVE'}
                            </button>
                        </div>
                        <div class="title-section">
                            <h2 class="recipe-title">${this.recipe.name}</h2>
                            <div class="recipe-cuisine-tag">${this.recipe.cuisine}</div>
                        </div>
                    </div>

                    <!-- Brief Description -->
                    <div class="recipe-description">
                        <p>${this.recipe.description}</p>
                    </div>

                    <!-- Stats Row -->
                    <div class="recipe-stats">
                        <div class="stat-box">
                            <span class="stat-icon">⭐</span>
                            <div class="star-rating" id="starRating">
                                ${this.generateStars(this.recipe.rating || 4)}
                            </div>
                        </div>
                        <div class="stat-box">
                            <span class="stat-icon">📋</span>
                            <span class="stat-value">${this.recipe.skillLevel || 'Medium'}</span>
                            <span class="stat-label">Skill Level</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-icon">⏰</span>
                            <span class="stat-value">${this.recipe.prepTime || 10}min</span>
                            <span class="stat-label">Prep</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-icon">🍳</span>
                            <span class="stat-value">${this.recipe.cookTime || 15}min</span>
                            <span class="stat-label">Cook</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-icon">⏱️</span>
                            <span class="stat-value">${this.recipe.totalTime || 25}min</span>
                            <span class="stat-label">Total</span>
                        </div>
                    </div>

                    <!-- Ingredients & Instructions Pages -->
                    <div class="recipe-pages">
                        <div class="pages-container" id="pagesContainer">
                            <!-- Page 1: Ingredients -->
                            <div class="recipe-page ${this.currentPage === 0 ? 'active' : ''}" data-page="0">
                                <h3 class="page-title">🥬 INGREDIENTS</h3>
                                <ul class="ingredients-list">
                                    ${this.recipe.ingredients.map(ing => `
                                        <li>
                                            <label class="ingredient-checkbox">
                                                <input type="checkbox" class="ingredient-check">
                                                <span>${ing}</span>
                                            </label>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>

                            <!-- Page 2: Instructions -->
                            <div class="recipe-page ${this.currentPage === 1 ? 'active' : ''}" data-page="1">
                                <h3 class="page-title">📖 INSTRUCTIONS</h3>
                                <ol class="instructions-list">
                                    ${this.recipe.instructions.map((step, i) => `
                                        <li>
                                            <div class="step-content">
                                                <span class="step-number">${i + 1}</span>
                                                <span class="step-text">${step}</span>
                                            </div>
                                            <button class="step-timer" data-minutes="${this.estimateStepTime(step)}">
                                                ⏰ ${this.estimateStepTime(step)}min
                                            </button>
                                        </li>
                                    `).join('')}
                                </ol>
                            </div>

                            <!-- Page 3: Chef's Tips -->
                            <div class="recipe-page ${this.currentPage === 2 ? 'active' : ''}" data-page="2">
                                <h3 class="page-title">👩‍🍳 CHEF'S TIPS</h3>
                                <div class="tips-content">
                                    ${this.recipe.tips ? this.recipe.tips.map(tip => `
                                        <div class="tip-card">
                                            <span class="tip-icon">💡</span>
                                            <p>${tip}</p>
                                        </div>
                                    `).join('') : `
                                        <div class="tip-card">
                                            <span class="tip-icon">💡</span>
                                            <p>Use day-old rice for better texture in fried dishes!</p>
                                        </div>
                                        <div class="tip-card">
                                            <span class="tip-icon">🔥</span>
                                            <p>Always preheat your pan before adding oil.</p>
                                        </div>
                                        <div class="tip-card">
                                            <span class="tip-icon">🧂</span>
                                            <p>Season in layers, not just at the end.</p>
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>

                        <!-- Page Navigation Dots -->
                        <div class="page-dots">
                            <button class="page-dot ${this.currentPage === 0 ? 'active' : ''}" data-page="0"></button>
                            <button class="page-dot ${this.currentPage === 1 ? 'active' : ''}" data-page="1"></button>
                            <button class="page-dot ${this.currentPage === 2 ? 'active' : ''}" data-page="2"></button>
                        </div>
                    </div>

                    <!-- Substitution Suggestions (if any) -->
                    ${this.recipe.substitutions ? `
                        <div class="substitutions-section">
                            <h4>🔄 SUBSTITUTIONS</h4>
                            <div class="substitutions-grid">
                                ${Object.entries(this.recipe.substitutions).map(([original, sub]) => `
                                    <div class="sub-card">
                                        <span class="original">${original}</span>
                                        <span class="arrow">→</span>
                                        <span class="substitute">${sub}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        this.attachEvents();
        this.loadPixelArt();
    }

    generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="star ${i <= rating ? 'filled' : 'empty'}" data-value="${i}">★</span>`;
        }
        return stars;
    }

    estimateStepTime(step) {
        const stepLower = step.toLowerCase();
        if (stepLower.includes('simmer') || stepLower.includes('boil')) return 10;
        if (stepLower.includes('fry') || stepLower.includes('sauté')) return 5;
        if (stepLower.includes('bake') || stepLower.includes('roast')) return 20;
        if (stepLower.includes('chop') || stepLower.includes('dice')) return 3;
        if (stepLower.includes('rest') || stepLower.includes('cool')) return 5;
        return 4;
    }

    attachEvents() {
        // Save button
        const saveBtn = this.container.querySelector('#saveRecipeBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.toggleSave());
        }

        // Star rating
        const stars = this.container.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                const value = parseInt(e.target.dataset.value);
                this.updateRating(value);
            });
        });

        // Page dots
        const dots = this.container.querySelectorAll('.page-dot');
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                this.goToPage(page);
            });
        });

        // Step timers
        const timers = this.container.querySelectorAll('.step-timer');
        timers.forEach(timer => {
            timer.addEventListener('click', (e) => {
                const minutes = parseInt(e.target.dataset.minutes);
                this.startTimer(minutes);
                e.target.textContent = `⏰ ${minutes}min (RUNNING)`;
                setTimeout(() => {
                    e.target.textContent = `⏰ ${minutes}min`;
                    alert('⏰ Timer done! Check your dish!');
                }, minutes * 60 * 1000);
            });
        });

        // Ingredient checkboxes - save progress
        const checkboxes = this.container.querySelectorAll('.ingredient-check');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                this.saveIngredientProgress();
            });
        });

        this.loadIngredientProgress();
    }

    async loadPixelArt() {
        const container = this.container.querySelector('#recipePixelArt');
        if (!container) return;

        const converter = new DigInPixelConverter();
        
        try {
            // Try to load pre-existing pixel art from database
            let pixelImg = null;
            
            if (this.recipe.pixelArtUrl) {
                // Use existing pixel art
                pixelImg = document.createElement('img');
                pixelImg.src = this.recipe.pixelArtUrl;
                pixelImg.className = 'pixel-recipe-img';
                container.innerHTML = '';
                container.appendChild(pixelImg);
            } else if (this.recipe.imageUrl) {
                // Generate pixel art from dish photo
                const pixelArtBlob = await converter.convertToPixelArt(this.recipe.imageUrl, {
                    pixelSize: 8,
                    paletteSize: 24,
                    dithering: true
                });
                const imgUrl = URL.createObjectURL(pixelArtBlob);
                pixelImg = document.createElement('img');
                pixelImg.src = imgUrl;
                pixelImg.className = 'pixel-recipe-img';
                container.innerHTML = '';
                container.appendChild(pixelImg);
            } else {
                // Fallback to emoji
                container.innerHTML = `<div class="pixel-fallback-small">${this.recipe.pixelEmoji || '🍳'}</div>`;
            }
        } catch (error) {
            console.error('Pixel art generation failed:', error);
            container.innerHTML = `<div class="pixel-fallback-small">${this.recipe.pixelEmoji || '🍳'}</div>`;
        }
    }

    toggleSave() {
        this.isSaved = !this.isSaved;
        const saveBtn = this.container.querySelector('#saveRecipeBtn');
        
        if (this.isSaved) {
            saveBtn.classList.add('saved');
            saveBtn.innerHTML = '❤️ SAVED';
            this.saveToLocalStorage();
        } else {
            saveBtn.classList.remove('saved');
            saveBtn.innerHTML = '🤍 SAVE';
            this.removeFromLocalStorage();
        }
        
        if (this.onSave) {
            this.onSave(this.recipe.id, this.isSaved);
        }
    }

    saveToLocalStorage() {
        const saved = localStorage.getItem('savedRecipes');
        let savedIds = saved ? JSON.parse(saved) : [];
        if (!savedIds.includes(this.recipe.id)) {
            savedIds.push(this.recipe.id);
            localStorage.setItem('savedRecipes', JSON.stringify(savedIds));
        }
    }

    removeFromLocalStorage() {
        const saved = localStorage.getItem('savedRecipes');
        let savedIds = saved ? JSON.parse(saved) : [];
        savedIds = savedIds.filter(id => id !== this.recipe.id);
        localStorage.setItem('savedRecipes', JSON.stringify(savedIds));
    }

    saveIngredientProgress() {
        const checkboxes = this.container.querySelectorAll('.ingredient-check');
        const progress = Array.from(checkboxes).map(cb => cb.checked);
        localStorage.setItem(`recipe_${this.recipe.id}_progress`, JSON.stringify(progress));
    }

    loadIngredientProgress() {
        const saved = localStorage.getItem(`recipe_${this.recipe.id}_progress`);
        if (saved) {
            const progress = JSON.parse(saved);
            const checkboxes = this.container.querySelectorAll('.ingredient-check');
            checkboxes.forEach((cb, i) => {
                if (progress[i]) cb.checked = true;
            });
        }
    }

    updateRating(rating) {
        const stars = this.container.querySelectorAll('.star');
        stars.forEach((star, i) => {
            if (i < rating) {
                star.classList.add('filled');
                star.classList.remove('empty');
            } else {
                star.classList.add('empty');
                star.classList.remove('filled');
            }
        });
        
        // Save rating
        const ratings = JSON.parse(localStorage.getItem('recipeRatings') || '{}');
        ratings[this.recipe.id] = rating;
        localStorage.setItem('recipeRatings', JSON.stringify(ratings));
    }

    goToPage(page) {
        this.currentPage = page;
        
        // Update pages
        const pages = this.container.querySelectorAll('.recipe-page');
        pages.forEach((p, i) => {
            if (i === page) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });
        
        // Update dots
        const dots = this.container.querySelectorAll('.page-dot');
        dots.forEach((dot, i) => {
            if (i === page) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        if (this.onPageChange) {
            this.onPageChange(page);
        }
    }

    startTimer(minutes) {
        alert(`⏰ Timer started for ${minutes} minutes! I'll remind you when it's done.`);
    }
}

