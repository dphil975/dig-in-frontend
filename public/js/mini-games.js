/**
 * Dig In Mini-Games
 * Earn Friend Points to feed and care for pets
 * Games unlock special recipes and evolution items
 */

class DigInMiniGames {
    constructor(pixelFriendGarden) {
        this.pixelFriend = pixelFriendGarden;
        this.friendPoints = this.loadFriendPoints();
        this.init();
    }

    init() {
        this.setupGameButtons();
    }

    loadFriendPoints() {
        const saved = localStorage.getItem('friendPoints');
        return saved ? parseInt(saved) : 500; // Starting currency
    }

    saveFriendPoints() {
        localStorage.setItem('friendPoints', this.friendPoints);
    }

    setupGameButtons() {
        // Add game center button
        const gameBtn = document.createElement('button');
        gameBtn.className = 'game-center-btn pixel-button';
        gameBtn.innerHTML = '🎮 GAME CENTER';
        gameBtn.onclick = () => this.showGameCenter();
        document.querySelector('.app-container')?.appendChild(gameBtn);
    }

    showGameCenter() {
        const modal = document.createElement('div');
        modal.className = 'game-center-modal pixel-modal';
        modal.innerHTML = `
            <div class="modal-header">
                <span class="modal-icon">🎮</span>
                <h3>PIXEL FRIEND GAME CENTER</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="game-center-content">
                <div class="friend-balance">
                    <span class="gp-icon">🍬</span>
                    <span class="gp-amount">${this.friendPoints} GP</span>
                </div>
                <div class="games-grid">
                    <div class="game-card" data-game="memory">
                        <div class="game-icon">🧠</div>
                        <div class="game-name">Memory Match</div>
                        <div class="game-reward">Reward: 50 GP</div>
                        <div class="game-desc">Match ingredient pairs!</div>
                    </div>
                    <div class="game-card" data-game="timing">
                        <div class="game-icon">⏱️</div>
                        <div class="game-name">Perfect Timing</div>
                        <div class="game-reward">Reward: 75 GP</div>
                        <div class="game-desc">Stop the timer at the right moment!</div>
                    </div>
                    <div class="game-card" data-game="stack">
                        <div class="game-icon">🍽️</div>
                        <div class="game-name">Plate Stacker</div>
                        <div class="game-reward">Reward: 100 GP</div>
                        <div class="game-desc">Stack plates without toppling!</div>
                    </div>
                    <div class="game-card" data-game="recipe">
                        <div class="game-icon">📖</div>
                        <div class="game-name">Recipe Recall</div>
                        <div class="game-reward">Reward: 150 GP</div>
                        <div class="game-desc">Remember the recipe steps!</div>
                    </div>
                </div>
                <div class="game-tips">
                    💡 Play games to earn GP! Spend GP on pet food and special items!
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const game = card.dataset.game;
                this.launchGame(game);
                modal.remove();
            });
        });
        
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    }

    launchGame(gameType) {
        const gameModal = document.createElement('div');
        gameModal.className = 'game-modal pixel-modal';
        
        if (gameType === 'memory') {
            gameModal.innerHTML = this.renderMemoryGame();
        } else if (gameType === 'timing') {
            gameModal.innerHTML = this.renderTimingGame();
        } else if (gameType === 'stack') {
            gameModal.innerHTML = this.renderStackGame();
        } else {
            gameModal.innerHTML = this.renderRecipeRecall();
        }
        
        document.body.appendChild(gameModal);
        
        // Initialize game logic
        if (gameType === 'memory') this.initMemoryGame(gameModal);
        else if (gameType === 'timing') this.initTimingGame(gameModal);
        else if (gameType === 'stack') this.initStackGame(gameModal);
        else this.initRecipeRecall(gameModal);
        
        gameModal.querySelector('.close-modal')?.addEventListener('click', () => gameModal.remove());
    }

    renderMemoryGame() {
        return `
            <div class="modal-header">
                <h3>🧠 MEMORY MATCH</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="memory-game-board" id="memoryBoard"></div>
            <div class="game-stats">
                <span>Matches: <span id="matchCount">0</span>/8</span>
                <span>Time: <span id="gameTimer">00:00</span></span>
            </div>
            <button id="winGameBtn" style="display:none;">CLAIM 50 GP</button>
        `;
    }

    initMemoryGame(modal) {
        const ingredients = [
            '🍅', '🧀', '🥚', '🌶️', '🧄', '🧅', '🥕', '🥦'
        ];
        const cards = [...ingredients, ...ingredients];
        
        // Shuffle
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        
        const board = modal.querySelector('#memoryBoard');
        board.innerHTML = cards.map((card, i) => `
            <div class="memory-card" data-index="${i}" data-value="${card}">
                <div class="card-front">?</div>
                <div class="card-back">${card}</div>
            </div>
        `).join('');
        
        let flipped = [];
        let matches = 0;
        let canFlip = true;
        
        const matchCountSpan = modal.querySelector('#matchCount');
        const winBtn = modal.querySelector('#winGameBtn');
        
        board.querySelectorAll('.memory-card').forEach(card => {
            card.addEventListener('click', () => {
                if (!canFlip || flipped.includes(card) || card.classList.contains('matched')) return;
                
                card.classList.add('flipped');
                flipped.push(card);
                
                if (flipped.length === 2) {
                    canFlip = false;
                    const val1 = flipped[0].dataset.value;
                    const val2 = flipped[1].dataset.value;
                    
                    if (val1 === val2) {
                        // Match!
                        flipped.forEach(f => f.classList.add('matched'));
                        matches++;
                        matchCountSpan.textContent = matches;
                        flipped = [];
                        canFlip = true;
                        
                        if (matches === 8) {
                            this.awardGameWin(50, winBtn);
                        }
                    } else {
                        // No match
                        setTimeout(() => {
                            flipped.forEach(f => f.classList.remove('flipped'));
                            flipped = [];
                            canFlip = true;
                        }, 1000);
                    }
                }
            });
        });
        
        // Timer
        let seconds = 0;
        const timerSpan = modal.querySelector('#gameTimer');
        const timer = setInterval(() => {
            seconds++;
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            timerSpan.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
        
        winBtn.addEventListener('click', () => {
            clearInterval(timer);
            modal.remove();
        });
    }

    renderTimingGame() {
        return `
            <div class="modal-header">
                <h3>⏱️ PERFECT TIMING</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="timing-game">
                <div class="timing-target">Stop at <span class="target-value">3.00</span> seconds</div>
                <div class="timing-meter">
                    <div class="timing-fill" id="timingFill"></div>
                </div>
                <div class="timing-display" id="timingDisplay">0.00</div>
                <button id="startTimingBtn">START</button>
                <button id="stopTimingBtn" style="display:none;">STOP</button>
                <div class="timing-result" id="timingResult"></div>
                <button id="claimTimingBtn" style="display:none;">CLAIM 75 GP</button>
            </div>
        `;
    }

    initTimingGame(modal) {
        const target = 3.00;
        let startTime = null;
        let animationFrame = null;
        let running = false;
        
        const display = modal.querySelector('#timingDisplay');
        const fill = modal.querySelector('#timingFill');
        const startBtn = modal.querySelector('#startTimingBtn');
        const stopBtn = modal.querySelector('#stopTimingBtn');
        const resultDiv = modal.querySelector('#timingResult');
        const claimBtn = modal.querySelector('#claimTimingBtn');
        
        startBtn.addEventListener('click', () => {
            startTime = performance.now();
            running = true;
            startBtn.style.display = 'none';
            stopBtn.style.display = 'block';
            
            function update() {
                if (!running) return;
                const elapsed = (performance.now() - startTime) / 1000;
                display.textContent = elapsed.toFixed(2);
                const percent = Math.min(100, (elapsed / 5) * 100);
                fill.style.width = `${percent}%`;
                
                if (elapsed < 5) {
                    animationFrame = requestAnimationFrame(update);
                } else {
                    running = false;
                    display.textContent = '5.00';
                    resultDiv.innerHTML = '❌ Too slow! Try again.';
                    startBtn.style.display = 'block';
                    stopBtn.style.display = 'none';
                }
            }
            
            animationFrame = requestAnimationFrame(update);
        });
        
        stopBtn.addEventListener('click', () => {
            if (!running) return;
            running = false;
            cancelAnimationFrame(animationFrame);
            
            const elapsed = parseFloat(display.textContent);
            const difference = Math.abs(elapsed - target);
            const accuracy = Math.max(0, 100 - (difference * 50));
            
            if (difference < 0.2) {
                resultDiv.innerHTML = `🎉 PERFECT! ${elapsed.toFixed(2)}s! +75 GP 🎉`;
                this.awardGameWin(75, claimBtn);
            } else if (difference < 0.5) {
                resultDiv.innerHTML = `👍 Close! ${elapsed.toFixed(2)}s (${accuracy.toFixed(0)}% accuracy)`;
                startBtn.style.display = 'block';
                stopBtn.style.display = 'none';
            } else {
                resultDiv.innerHTML = `❌ Missed! ${elapsed.toFixed(2)}s. Try again.`;
                startBtn.style.display = 'block';
                stopBtn.style.display = 'none';
            }
            
            fill.style.width = '0%';
        });
        
        claimBtn.addEventListener('click', () => modal.remove());
    }

    renderStackGame() {
        return `
            <div class="modal-header">
                <h3>🍽️ PLATE STACKER</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="stack-game">
                <div class="plate-stack" id="plateStack"></div>
                <div class="stack-controls">
                    <button id="addPlateBtn">➕ ADD PLATE</button>
                    <button id="balanceBtn">⚖️ BALANCE</button>
                </div>
                <div class="stack-stats">
                    <span>Stack Height: <span id="stackHeight">0</span></span>
                    <span>Balance: <span id="stackBalance">100</span>%</span>
                </div>
                <div id="stackResult"></div>
                <button id="claimStackBtn" style="display:none;">CLAIM 100 GP</button>
            </div>
        `;
    }

    initStackGame(modal) {
        let plates = [];
        let balance = 100;
        
        const stackDiv = modal.querySelector('#plateStack');
        const heightSpan = modal.querySelector('#stackHeight');
        const balanceSpan = modal.querySelector('#stackBalance');
        const addBtn = modal.querySelector('#addPlateBtn');
        const balanceBtn = modal.querySelector('#balanceBtn');
        const resultDiv = modal.querySelector('#stackResult');
        const claimBtn = modal.querySelector('#claimStackBtn');
        
        function updateDisplay() {
            stackDiv.innerHTML = plates.map((p, i) => `
                <div class="plate" style="transform: rotate(${p.rotation}deg)">🍽️</div>
            `).join('');
            heightSpan.textContent = plates.length;
            balanceSpan.textContent = balance;
            
            if (balance <= 0) {
                resultDiv.innerHTML = '💥 CRASH! The plates fell! Game over.';
                addBtn.disabled = true;
                balanceBtn.disabled = true;
            }
        }
        
        addBtn.addEventListener('click', () => {
            if (balance <= 0) return;
            
            const rotation = (Math.random() - 0.5) * 20;
            plates.push({ rotation: rotation });
            balance = Math.max(0, balance - Math.abs(rotation) * 2);
            updateDisplay();
            
            if (plates.length >= 10 && balance > 50) {
                resultDiv.innerHTML = '🎉 MASTER STACKER! You stacked 10 plates! +100 GP 🎉';
                this.awardGameWin(100, claimBtn);
                addBtn.disabled = true;
                balanceBtn.disabled = true;
            }
        });
        
        balanceBtn.addEventListener('click', () => {
            if (balance <= 0 || plates.length === 0) return;
            
            // Fix balance by recentering
            plates = plates.map(p => ({ rotation: p.rotation * 0.5 }));
            balance = Math.min(100, balance + 20);
            updateDisplay();
        });
        
        claimBtn.addEventListener('click', () => modal.remove());
    }

    renderRecipeRecall() {
        const sampleRecipe = {
            name: 'Omurice',
            steps: [
                'Stir-fry chicken and onion',
                'Add rice and ketchup',
                'Make a thin omelette',
                'Fill omelette with rice',
                'Decorate with ketchup'
            ]
        };
        
        return `
            <div class="modal-header">
                <h3>📖 RECIPE RECALL</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="recipe-recall">
                <div class="recipe-display" id="recipeDisplay">
                    <h4>${sampleRecipe.name}</h4>
                    <div class="steps-list">
                        ${sampleRecipe.steps.map((step, i) => `
                            <div class="step-hidden" data-step="${i + 1}" style="display:none;">${step}</div>
                        `).join('')}
                    </div>
                </div>
                <div class="recall-inputs" id="recallInputs">
                    ${sampleRecipe.steps.map((_, i) => `
                        <input type="text" placeholder="Step ${i + 1}" class="recall-field" data-step="${i + 1}">
                    `).join('')}
                </div>
                <button id="checkRecallBtn">CHECK ANSWERS</button>
                <div id="recallResult"></div>
                <button id="claimRecallBtn" style="display:none;">CLAIM 150 GP</button>
            </div>
        `;
    }

    initRecipeRecall(modal) {
        const inputs = modal.querySelectorAll('.recall-field');
        const checkBtn = modal.querySelector('#checkRecallBtn');
        const resultDiv = modal.querySelector('#recallResult');
        const claimBtn = modal.querySelector('#claimRecallBtn');
        
        const correctSteps = [
            'Stir-fry chicken and onion',
            'Add rice and ketchup',
            'Make a thin omelette',
            'Fill omelette with rice',
            'Decorate with ketchup'
        ];
        
        checkBtn.addEventListener('click', () => {
            let correct = 0;
            inputs.forEach((input, i) => {
                if (input.value.toLowerCase().trim() === correctSteps[i].toLowerCase()) {
                    correct++;
                    input.style.borderColor = '#4CAF50';
                } else {
                    input.style.borderColor = '#f44336';
                }
            });
            
            if (correct === correctSteps.length) {
                resultDiv.innerHTML = '🎉 PERFECT RECALL! +150 GP 🎉';
                this.awardGameWin(150, claimBtn);
                checkBtn.disabled = true;
            } else {
                resultDiv.innerHTML = `📚 ${correct}/${correctSteps.length} correct. Try again!`;
            }
        });
        
        claimBtn.addEventListener('click', () => modal.remove());
    }

    awardGameWin(gpAmount, claimButton) {
        this.friendPoints += gpAmount;
        this.saveFriendPoints();
        claimButton.style.display = 'block';
        this.showGameWinAnimation(gpAmount);
    }

    showGameWinAnimation(gpAmount) {
        const animation = document.createElement('div');
        animation.className = 'game-win-animation';
        animation.innerHTML = `
            <div class="win-content">
                <span class="win-icon">🏆</span>
                <span class="win-text">+${gpAmount} GP!</span>
                <div class="win-sparkles">✨✨✨</div>
            </div>
        `;
        document.body.appendChild(animation);
        
        setTimeout(() => animation.remove(), 2000);
    }

    spendFriendPoints(amount) {
        if (this.friendPoints >= amount) {
            this.friendPoints -= amount;
            this.saveFriendPoints();
            return true;
        }
        return false;
    }

    getFriendPoints() {
        return this.friendPoints;
    }
}