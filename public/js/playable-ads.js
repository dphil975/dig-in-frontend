/**
 * Playable Ad Components for Dig In
 * Games that users want to play during transit
 */

class PlayableAdManager {
    constructor() {
        this.currentAd = null;
        this.score = 0;
        this.isPlaying = false;
        this.apiBase = 'http://localhost:8000';
    }
    
    async showPlayableAd(brandName, duration = 30) {
        // Request ad from backend
        const response = await fetch(`${this.apiBase}/ads/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brand: brandName, duration: duration })
        });
        
        this.currentAd = await response.json();
        this.renderGame();
    }
    
    renderGame() {
        const gameContainer = document.getElementById('ad-game-container');
        
        switch(this.currentAd.game_type) {
            case 'food_memory':
                this.renderMemoryMatch(gameContainer);
                break;
            case 'endless_runner':
                this.renderEndlessRunner(gameContainer);
                break;
            case 'stacking':
                this.renderStackingGame(gameContainer);
                break;
            case 'timing_game':
                this.renderTimingGame(gameContainer);
                break;
        }
    }
    
    renderMemoryMatch(container) {
        const ingredients = ['🍅', '🥑', '🥦', '🍗', '🥚', '🧀', '🥕', '🍚'];
        const cards = [...ingredients, ...ingredients];
        
        // Shuffle
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        
        container.innerHTML = `
            <div class="game-header">
                <div class="brand-logo">${this.currentAd.brand_name}</div>
                <div class="timer" id="gameTimer">${this.currentAd.duration_seconds}</div>
                <div class="score" id="gameScore">Matches: 0</div>
            </div>
            <div class="memory-grid" id="memoryGrid">
                ${cards.map((card, i) => `
                    <div class="memory-card" data-card="${card}" data-index="${i}">
                        <div class="card-front">?</div>
                        <div class="card-back">${card}</div>
                    </div>
                `).join('')}
            </div>
            <div class="game-footer">
                <span>Match all pairs for bonus coins!</span>
            </div>
        `;
        
        this.initMemoryMatch();
        this.startTimer();
    }
    
    renderEndlessRunner(container) {
        container.innerHTML = `
            <div class="game-header">
                <div class="brand-logo">${this.currentAd.brand_name}</div>
                <div class="score" id="gameScore">Score: 0</div>
                <div class="lives" id="gameLives">❤️❤️❤️</div>
            </div>
            <canvas id="runnerCanvas" width="400" height="300"></canvas>
            <div class="game-footer">
                <span>Tap to jump! Avoid obstacles, collect food!</span>
            </div>
        `;
        
        this.initEndlessRunner();
    }
    
    renderStackingGame(container) {
        container.innerHTML = `
            <div class="game-header">
                <div class="brand-logo">${this.currentAd.brand_name}</div>
                <div class="score" id="gameScore">Stack: 0</div>
                <div class="timer" id="gameTimer">${this.currentAd.duration_seconds}</div>
            </div>
            <canvas id="stackingCanvas" width="350" height="350"></canvas>
            <div class="game-footer">
                <span>Tap to drop ingredient! Perfect alignment = bonus points!</span>
            </div>
        `;
        
        this.initStackingGame();
    }
    
    renderTimingGame(container) {
        container.innerHTML = `
            <div class="game-header">
                <div class="brand-logo">${this.currentAd.brand_name}</div>
                <div class="score" id="gameScore">Perfect Pours: 0</div>
                <div class="timer" id="gameTimer">${this.currentAd.duration_seconds}</div>
            </div>
            <div class="timing-meter">
                <div class="meter-fill" id="meterFill"></div>
                <div class="target-zone"></div>
            </div>
            <div class="game-footer">
                <span>Tap when the meter hits the green zone!</span>
            </div>
        `;
        
        this.initTimingGame();
    }
    
    initMemoryMatch() {
        let flipped = [];
        let matches = 0;
        let canFlip = true;
        
        const cards = document.querySelectorAll('.memory-card');
        const scoreSpan = document.getElementById('gameScore');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                if (!canFlip || flipped.includes(card) || card.classList.contains('matched')) return;
                
                card.classList.add('flipped');
                flipped.push(card);
                
                if (flipped.length === 2) {
                    canFlip = false;
                    const card1 = flipped[0].dataset.card;
                    const card2 = flipped[1].dataset.card;
                    
                    if (card1 === card2) {
                        flipped.forEach(f => f.classList.add('matched'));
                        matches++;
                        scoreSpan.textContent = `Matches: ${matches}`;
                        flipped = [];
                        canFlip = true;
                        
                        if (matches === 8) {
                            this.endGame(matches * 10);
                        }
                    } else {
                        setTimeout(() => {
                            flipped.forEach(f => f.classList.remove('flipped'));
                            flipped = [];
                            canFlip = true;
                        }, 1000);
                    }
                }
            });
        });
    }
    
    initEndlessRunner() {
        const canvas = document.getElementById('runnerCanvas');
        const ctx = canvas.getContext('2d');
        
        let score = 0;
        let lives = 3;
        let player = { x: 50, y: 250, width: 30, height: 30, jumping: false, velocity: 0 };
        let obstacles = [];
        let frame = 0;
        
        const gameLoop = setInterval(() => {
            // Clear canvas
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw ground
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(0, 280, canvas.width, 20);
            
            // Draw player
            ctx.fillStyle = '#FF6B6B';
            ctx.fillRect(player.x, player.y, player.width, player.height);
            
            // Physics
            if (player.jumping) {
                player.velocity += 1;
                player.y += player.velocity;
                if (player.y >= 250) {
                    player.y = 250;
                    player.jumping = false;
                    player.velocity = 0;
                }
            }
            
            // Generate obstacles
            if (frame % 60 === 0) {
                obstacles.push({ x: canvas.width, y: 250, width: 20, height: 30 });
            }
            
            // Update and draw obstacles
            for (let i = 0; i < obstacles.length; i++) {
                obstacles[i].x -= 5;
                ctx.fillStyle = '#333';
                ctx.fillRect(obstacles[i].x, obstacles[i].y, obstacles[i].width, obstacles[i].height);
                
                // Collision detection
                if (player.x < obstacles[i].x + obstacles[i].width &&
                    player.x + player.width > obstacles[i].x &&
                    player.y < obstacles[i].y + obstacles[i].height &&
                    player.y + player.height > obstacles[i].y) {
                    lives--;
                    document.getElementById('gameLives').innerHTML = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
                    obstacles.splice(i, 1);
                    
                    if (lives === 0) {
                        clearInterval(gameLoop);
                        this.endGame(score);
                    }
                }
                
                // Remove off-screen obstacles
                if (obstacles[i].x + obstacles[i].width < 0) {
                    obstacles.splice(i, 1);
                    score += 10;
                    document.getElementById('gameScore').textContent = `Score: ${score}`;
                }
            }
            
            frame++;
        }, 50);
        
        // Jump on tap/click
        canvas.addEventListener('click', () => {
            if (!player.jumping) {
                player.jumping = true;
                player.velocity = -12;
            }
        });
        
        this.currentGameLoop = gameLoop;
    }
    
    initStackingGame() {
        let stack = [];
        let currentX = 175;
        let currentWidth = 100;
        let score = 0;
        
        const canvas = document.getElementById('stackingCanvas');
        const ctx = canvas.getContext('2d');
        
        function draw() {
            ctx.fillStyle = '#DDD';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw existing stack
            for (let i = 0; i < stack.length; i++) {
                ctx.fillStyle = '#FF6B6B';
                ctx.fillRect(stack[i].x, canvas.height - (i + 1) * 30, stack[i].width, 28);
            }
            
            // Draw current falling ingredient
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(currentX, canvas.height - (stack.length + 1) * 30, currentWidth, 28);
        }
        
        canvas.addEventListener('click', () => {
            const previousWidth = stack.length > 0 ? stack[stack.length - 1].width : 100;
            const previousX = stack.length > 0 ? stack[stack.length - 1].x : 175;
            
            // Calculate offset
            const offset = Math.abs(currentX - previousX);
            const newWidth = Math.max(10, currentWidth - offset);
            
            if (newWidth < 10) {
                this.endGame(score);
                return;
            }
            
            stack.push({ x: currentX, width: newWidth });
            score += 100 - offset;
            document.getElementById('gameScore').textContent = `Stack: ${stack.length}`;
            
            // Reset for next piece
            currentWidth = newWidth;
            currentX = Math.random() * (canvas.width - currentWidth);
        });
        
        setInterval(draw, 50);
        this.currentGameLoop = setInterval(() => draw(), 50);
    }
    
    initTimingGame() {
        let meterPosition = 0;
        let meterDirection = 1;
        let perfectPours = 0;
        let meterInterval;
        
        const meterFill = document.getElementById('meterFill');
        
        meterInterval = setInterval(() => {
            meterPosition += meterDirection * 3;
            if (meterPosition >= 100) {
                meterPosition = 100;
                meterDirection = -1;
            } else if (meterPosition <= 0) {
                meterPosition = 0;
                meterDirection = 1;
            }
            
            meterFill.style.width = `${meterPosition}%`;
        }, 50);
        
        document.querySelector('.timing-meter').addEventListener('click', () => {
            const isPerfect = meterPosition >= 40 && meterPosition <= 60;
            if (isPerfect) {
                perfectPours++;
                document.getElementById('gameScore').textContent = `Perfect Pours: ${perfectPours}`;
                
                // Bonus for consecutive perfects
                if (perfectPours % 3 === 0) {
                    this.showBonusMessage("🔥 Perfect Streak! +50 coins 🔥");
                }
            } else {
                this.showErrorMessage("Missed! Try again.");
            }
        });
        
        this.currentGameLoop = meterInterval;
    }
    
    startTimer() {
        let timeLeft = this.currentAd.duration_seconds;
        const timerSpan = document.getElementById('gameTimer');
        
        const timer = setInterval(() => {
            timeLeft--;
            if (timerSpan) timerSpan.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                this.endGame(this.score);
            }
        }, 1000);
        
        this.currentTimer = timer;
    }
    
    async endGame(finalScore) {
        // Stop game loops
        if (this.currentGameLoop) clearInterval(this.currentGameLoop);
        if (this.currentTimer) clearInterval(this.currentTimer);
        
        // Calculate reward
        const reward = await this.calculateReward(finalScore);
        this.showRewardModal(reward);
    }
    
    async calculateReward(score) {
        const response = await fetch(`${this.apiBase}/ads/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ad_id: this.currentAd.ad_id,
                score: score
            })
        });
        
        return response.json();
    }
    
    showRewardModal(reward) {
        const modal = document.createElement('div');
        modal.className = 'reward-modal';
        modal.innerHTML = `
            <div class="reward-content">
                <h2>🎉 You earned ${reward.base_coins + reward.bonus_coins} coins! 🎉</h2>
                ${reward.unlocked_badge ? `<p>🏆 Unlocked: ${reward.unlocked_badge}</p>` : ''}
                
                ${reward.save_offer ? `
                    <div class="upsell-offer">
                        <h3>Save your high score!</h3>
                        <p>Get your ${finalScore} points on the global leaderboard</p>
                        <button class="save-score-btn" onclick="purchaseSaveScore('${reward.save_offer.cost}')">
                            💾 Save Score - $${reward.save_offer.cost}
                        </button>
                    </div>
                ` : ''}
                
                ${reward.continue_offer ? `
                    <div class="upsell-offer">
                        <h3>Continue playing!</h3>
                        <p>3 more lives to beat your high score</p>
                        <button class="continue-btn" onclick="purchaseContinue('${reward.continue_offer.cost}')">
                            🎮 Continue - $${reward.continue_offer.cost}
                        </button>
                    </div>
                ` : ''}
                
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">Claim Coins</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}