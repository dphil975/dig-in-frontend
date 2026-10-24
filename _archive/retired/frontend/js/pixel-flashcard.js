/**
 * Dig In Pixel Flashcard System
 * Features:
 * - Interactive flashcards with pixel animations
 * - Step-by-step cooking instructions
 * - Timer integration
 */

class PixelFlashcardSystem {
    constructor(brandData) {
        this.brandData = brandData;
        this.currentCard = 0;
        this.cards = this.generateCards();
        this.isPlaying = false;
        this.timers = [];
        this.mamaMood = "happy";
    }

    generateCards() {
        const diy = this.brandData.diyInstructions;
        const cards = [];
        
        // Intro card
        cards.push({
            type: "intro",
            title: `🍳 MAKE YOUR OWN ${this.brandData.brand.toUpperCase()}!`,
            content: `The original recipe before they changed it. Let's cook together!`,
            mamaSay: "I'll show you step by step. Ready?",
            mamaFace: "😊",
            pixelArt: this.brandData.pixelArt,
            timeEstimate: diy.time,
            difficulty: diy.difficulty
        });
        
        // Tools card
        cards.push({
            type: "tools",
            title: "🛠️ TOOLS YOU'LL NEED",
            content: diy.tools.map(tool => `• ${tool}`).join('<br>'),
            mamaSay: "Get these ready first. Mise en place is key!",
            mamaFace: "👩‍🍳",
            pixelArt: "🔧⚒️🔨"
        });
        
        // Ingredients card
        cards.push({
            type: "ingredients",
            title: "🥬 INGREDIENTS",
            content: this.formatIngredients(diy.ingredients),
            mamaSay: "Measure everything before you start!",
            mamaFace: "📏",
            pixelArt: "🥚🧀🥛"
        });
        
        // Cooking steps (one per card)
        diy.steps.forEach((step, i) => {
            cards.push({
                type: "step",
                stepNumber: i + 1,
                totalSteps: diy.steps.length,
                title: `STEP ${i + 1}: ${step.substring(0, 40)}${step.length > 40 ? '...' : ''}`,
                content: step,
                mamaSay: this.getMamaTip(step, i),
                mamaFace: this.getMamaFace(i),
                pixelArt: this.getStepPixelArt(i),
                timer: this.getStepTimer(step),
                tip: diy.tips[i % diy.tips.length]
            });
        });
        
        // Completion card
        cards.push({
            type: "complete",
            title: "🎉 COMPLETE! 🎉",
            content: `You made your own ${this.brandData.brand} from scratch!`,
            mamaSay: "You did it! Taste the difference? No artificial additives!",
            mamaFace: "🥰",
            pixelArt: "🏆⭐👏"
        });
        
        return cards;
    }

    formatIngredients(ingredients) {
        if (typeof ingredients === 'string') {
            return ingredients;
        }
        if (typeof ingredients === 'object' && !Array.isArray(ingredients)) {
            let html = '';
            for (const [category, items] of Object.entries(ingredients)) {
                html += `<strong>${category.toUpperCase()}:</strong><br>`;
                html += items.map(i => `• ${i}`).join('<br>');
                html += '<br><br>';
            }
            return html;
        }
        return ingredients.map(i => `• ${i}`).join('<br>');
    }

    getMamaTip(step, index) {
        const tips = [
            "Patience is the secret ingredient!",
            "Temperature control makes all the difference.",
            "Taste as you go!",
            "Your kitchen should smell amazing right now.",
            "Almost there! Don't rush the final step.",
            "Look at that color! Perfect.",
            "You're doing great! Keep going!"
        ];
        return tips[index % tips.length];
    }

    getMamaFace(stepIndex) {
        const faces = ["😊", "😌", "🤔", "😮", "😄", "🥰", "😎"];
        return faces[stepIndex % faces.length];
    }

    getStepPixelArt(stepIndex) {
        const arts = ["🥣", "⏲️", "🔥", "🍳", "🧂", "👩‍🍳", "🍽️"];
        return arts[stepIndex % arts.length];
    }

    getStepTimer(step) {
        // Parse time mentions in step
        if (step.includes("minute") || step.includes("min")) {
            const match = step.match(/(\d+)\s*(?:minute|min)/i);
            if (match) return parseInt(match[1]) * 60;
        }
        if (step.includes("hour")) {
            const match = step.match(/(\d+)\s*hour/i);
            if (match) return parseInt(match[1]) * 3600;
        }
        return null;
    }

    show() {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'pixel-flashcard-modal';
        modal.id = 'pixelFlashcardModal';
        
        modal.innerHTML = `
            <div class="flashcard-container pixel-border">
                <div class="flashcard-header">
                    <div class="dig-in-character">
                        <div class="dig-in-pixel-face" id="digInFace">😊</div>
                        <div class="dig-in-name">DIG IN</div>
                    </div>
                    <button class="close-flashcard">&times;</button>
                </div>
                
                <div class="flashcard-content" id="flashcardContent">
                    <div class="card-pixel-art" id="cardPixelArt">${this.cards[0].pixelArt}</div>
                    <h2 class="card-title" id="cardTitle">${this.cards[0].title}</h2>
                    <div class="card-body" id="cardBody">${this.cards[0].content}</div>
                    <div class="dig-in-speech" id="digInSpeech">
                        <span class="speech-bubble">${this.cards[0].mamaSay}</span>
                    </div>
                    ${this.cards[0].timeEstimate ? `<div class="time-estimate">⏱️ Est. Time: ${this.cards[0].timeEstimate} min</div>` : ''}
                    ${this.cards[0].difficulty ? `<div class="difficulty-badge">📊 Difficulty: ${this.cards[0].difficulty}</div>` : ''}
                </div>
                
                <div class="flashcard-footer">
                    <div class="progress-indicator">
                        <span id="cardCounter">Card 1/${this.cards.length}</span>
                        <div class="progress-bar-container">
                            <div class="progress-bar" id="progressBar" style="width: ${(1/this.cards.length)*100}%"></div>
                        </div>
                    </div>
                    <div class="nav-buttons">
                        <button class="nav-btn prev-btn" id="prevCard" ${this.currentCard === 0 ? 'disabled' : ''}>◀ PREV</button>
                        <button class="nav-btn next-btn" id="nextCard">${this.currentCard === this.cards.length - 1 ? '🎉 FINISH' : 'NEXT ▶'}</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        this.modal = modal;
        this.updateCardDisplay();
        
        // Event listeners
        modal.querySelector('.close-flashcard').addEventListener('click', () => {
            this.cleanupTimers();
            modal.remove();
        });
        
        modal.querySelector('#prevCard').addEventListener('click', () => {
            if (this.currentCard > 0) {
                this.currentCard--;
                this.updateCardDisplay();
                this.playSwipeSound();
            }
        });
        
        modal.querySelector('#nextCard').addEventListener('click', () => {
            if (this.currentCard < this.cards.length - 1) {
                this.currentCard++;
                this.updateCardDisplay();
                this.playTapSound();
            } else if (this.currentCard === this.cards.length - 1) {
                this.completeCooking();
                modal.remove();
            }
        });
        
        // Play intro sound/effect
        this.playIntroEffect();
    }

    updateCardDisplay() {
        const card = this.cards[this.currentCard];
        if (!card) return;
        
        // Update content
        const mamaFace = this.modal.querySelector('#digInFace');
        const cardPixelArt = this.modal.querySelector('#cardPixelArt');
        const cardTitle = this.modal.querySelector('#cardTitle');
        const cardBody = this.modal.querySelector('#cardBody');
        const mamaSpeech = this.modal.querySelector('#digInSpeech .speech-bubble');
        const cardCounter = this.modal.querySelector('#cardCounter');
        const progressBar = this.modal.querySelector('#progressBar');
        const prevBtn = this.modal.querySelector('#prevCard');
        const nextBtn = this.modal.querySelector('#nextCard');
        
        // Animate face change
        if (mamaFace) {
            mamaFace.style.transform = 'scale(1.2)';
            mamaFace.textContent = card.mamaFace;
            setTimeout(() => {
                mamaFace.style.transform = 'scale(1)';
            }, 200);
        }
        
        if (cardPixelArt) {
            cardPixelArt.style.opacity = '0';
            cardPixelArt.style.transform = 'scale(0.8)';
            setTimeout(() => {
                cardPixelArt.innerHTML = card.pixelArt;
                cardPixelArt.style.opacity = '1';
                cardPixelArt.style.transform = 'scale(1)';
            }, 200);
        }
        
        if (cardTitle) cardTitle.innerHTML = card.title;
        if (cardBody) cardBody.innerHTML = card.content;
        if (mamaSpeech) {
            mamaSpeech.style.opacity = '0';
            setTimeout(() => {
                mamaSpeech.textContent = card.mamaSay;
                mamaSpeech.style.opacity = '1';
            }, 200);
        }
        
        if (cardCounter) cardCounter.textContent = `Card ${this.currentCard + 1}/${this.cards.length}`;
        if (progressBar) progressBar.style.width = `${((this.currentCard + 1) / this.cards.length) * 100}%`;
        
        if (prevBtn) prevBtn.disabled = this.currentCard === 0;
        if (nextBtn) {
            nextBtn.textContent = this.currentCard === this.cards.length - 1 ? '🎉 FINISH' : 'NEXT ▶';
        }
        
        // Handle timer for step cards
        if (card.timer && card.type === 'step') {
            this.startStepTimer(card.timer, card.stepNumber);
        }
        
        // Add tip if present
        if (card.tip) {
            let tipElement = this.modal.querySelector('.step-tip');
            if (!tipElement) {
                const footer = this.modal.querySelector('.flashcard-footer');
                tipElement = document.createElement('div');
                tipElement.className = 'step-tip';
                footer.parentNode.insertBefore(tipElement, footer);
            }
            tipElement.innerHTML = `💡 PRO TIP: ${card.tip}`;
        }
    }

    startStepTimer(seconds, stepNum) {
        // Clear existing timers
        this.cleanupTimers();
        
        const timerElement = document.createElement('div');
        timerElement.className = 'step-timer-display';
        timerElement.innerHTML = `
            <span class="timer-icon">⏰</span>
            <span class="timer-text">Timer: ${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}</span>
            <button class="timer-stop">Skip</button>
        `;
        
        const cardBody = this.modal.querySelector('#cardBody');
        cardBody.appendChild(timerElement);
        
        let timeLeft = seconds;
        const interval = setInterval(() => {
            timeLeft--;
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            timerElement.querySelector('.timer-text').textContent = `Timer: ${mins}:${secs.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                timerElement.innerHTML = '<span class="timer-complete">✓ Timer Complete! ✓</span>';
                setTimeout(() => timerElement.remove(), 2000);
            }
        }, 1000);
        
        this.timers.push(interval);
        
        const stopBtn = timerElement.querySelector('.timer-stop');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                clearInterval(interval);
                timerElement.remove();
            });
        }
    }

    cleanupTimers() {
        this.timers.forEach(timer => clearInterval(timer));
        this.timers = [];
    }

    completeCooking() {
        // Show completion animation
        const completion = document.createElement('div');
        completion.className = 'cooking-completion';
        completion.innerHTML = `
            <div class="completion-animation">
                <div class="sparkles">✨✨✨</div>
                <div class="dig-in-celebrate">🎉 ${this.brandData.brand} COMPLETE! 🎉</div>
                <div class="sparkles">✨✨✨</div>
                <div class="congrats-message">
                    <p>You made it from scratch! No artificial additives.</p>
                    <p>Share your creation with #DigInDIY</p>
                </div>
                <button class="share-button">📸 Share Your Creation</button>
            </div>
        `;
        
        document.body.appendChild(completion);
        
        setTimeout(() => completion.remove(), 5000);
    }

    playIntroEffect() {
        // Visual "ding" effect
        const ding = document.createElement('div');
        ding.className = 'visual-ding';
        ding.textContent = '🔔';
        ding.style.position = 'fixed';
        ding.style.top = '20%';
        ding.style.right = '20%';
        ding.style.fontSize = '48px';
        ding.style.opacity = '1';
        ding.style.transition = 'all 0.5s ease';
        document.body.appendChild(ding);
        
        setTimeout(() => {
            ding.style.opacity = '0';
            ding.style.transform = 'translateY(-50px)';
            setTimeout(() => ding.remove(), 500);
        }, 500);
    }

    playTapSound() {
        // Visual tap feedback
        const tap = document.createElement('div');
        tap.className = 'tap-feedback';
        tap.textContent = '👆';
        tap.style.position = 'fixed';
        tap.style.bottom = '30%';
        tap.style.right = '40%';
        tap.style.fontSize = '32px';
        tap.style.opacity = '1';
        tap.style.transition = 'all 0.3s ease';
        document.body.appendChild(tap);
        
        setTimeout(() => {
            tap.style.opacity = '0';
            tap.style.transform = 'scale(1.5)';
            setTimeout(() => tap.remove(), 300);
        }, 200);
    }

    playSwipeSound() {
        const swipe = document.createElement('div');
        swipe.className = 'swipe-feedback';
        swipe.textContent = '⬅️';
        swipe.style.position = 'fixed';
        swipe.style.left = '30%';
        swipe.style.bottom = '30%';
        swipe.style.fontSize = '32px';
        swipe.style.opacity = '1';
        swipe.style.transition = 'all 0.3s ease';
        document.body.appendChild(swipe);
        
        setTimeout(() => {
            swipe.style.opacity = '0';
            swipe.style.transform = 'translateX(-50px)';
            setTimeout(() => swipe.remove(), 300);
        }, 200);
    }
}