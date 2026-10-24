// dino-ad.js — Pixel-art dino runner ad unit for Dig In.
// Self-contained canvas game, no external images, no dependencies.
// Coins scale with score (max = options.reward, min = 5).
// API: DinoAd.mount(selectorOrEl, options) → DinoAd instance
// Events fired on document: dinoadGameOver { score, coins }, dinoadSkipped { score }

class DinoAd {

    // ── Pixel sprites ────────────────────────────────────────────────────────
    // 0 = transparent  |  1 = main body colour  |  2 = accent / eye
    static SPRITES = {
        dino_run1: [
            [0,0,0,0,0,0,1,1,1,1,0,0],
            [0,0,0,0,0,1,1,1,1,1,1,0],
            [0,0,0,0,0,1,2,1,0,1,1,0],
            [0,0,0,0,0,1,1,1,1,1,1,0],
            [0,0,0,1,1,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,1,1,1,1,0,0],
            [1,1,1,1,1,1,1,1,1,0,0,0],
            [1,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,1,1,1,0,0,0,0,0,0],
            [0,0,0,1,1,0,0,1,1,0,0,0],
            [0,0,0,1,1,0,0,1,1,0,0,0],
            [0,0,0,1,0,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0],
        ],
        dino_run2: [
            [0,0,0,0,0,0,1,1,1,1,0,0],
            [0,0,0,0,0,1,1,1,1,1,1,0],
            [0,0,0,0,0,1,2,1,0,1,1,0],
            [0,0,0,0,0,1,1,1,1,1,1,0],
            [0,0,0,1,1,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,1,1,1,1,0,0],
            [1,1,1,1,1,1,1,1,1,0,0,0],
            [1,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,1,1,1,0,0,0,0,0,0],
            [0,0,0,1,1,0,0,1,1,0,0,0],
            [0,0,0,0,1,0,0,0,1,0,0,0],
            [0,0,0,0,1,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0],
        ],
        dino_dead: [
            [0,0,0,0,0,0,1,1,1,1,0,0],
            [0,0,0,0,0,1,1,1,1,1,1,0],
            [0,0,0,0,0,2,1,1,0,1,2,0],
            [0,0,0,0,0,1,1,1,1,1,1,0],
            [0,0,0,1,1,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,1,1,1,1,0,0],
            [1,1,1,1,1,1,1,1,1,0,0,0],
            [1,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,1,1,1,0,0,0,0,0,0],
            [0,0,0,1,1,0,0,1,1,0,0,0],
            [0,0,0,1,1,0,0,1,1,0,0,0],
            [0,0,0,1,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0],
        ],
        cactus_sm: [
            [0,0,1,1,0,0,0,0],
            [0,1,1,1,0,1,1,0],
            [1,1,1,1,1,1,1,0],
            [1,1,1,1,0,1,1,0],
            [0,1,1,1,0,0,0,0],
            [0,0,1,1,0,0,0,0],
            [0,0,1,1,0,0,0,0],
            [0,0,1,1,0,0,0,0],
            [0,0,1,1,0,0,0,0],
            [0,0,1,1,0,0,0,0],
            [0,1,1,1,1,0,0,0],
            [0,0,1,1,0,0,0,0],
        ],
        cactus_lg: [
            [0,0,1,1,1,0,0,0,0,0],
            [0,1,1,1,1,0,1,1,1,0],
            [0,1,1,1,1,1,1,1,1,0],
            [1,1,1,1,1,0,0,1,1,0],
            [1,1,1,1,1,0,0,0,0,0],
            [0,1,1,1,1,0,1,1,0,0],
            [0,0,1,1,1,1,1,1,0,0],
            [0,0,1,1,1,0,1,1,0,0],
            [0,0,1,1,1,0,0,0,0,0],
            [0,0,1,1,1,0,0,0,0,0],
            [0,0,1,1,1,0,0,0,0,0],
            [0,0,1,1,1,0,0,0,0,0],
            [0,0,1,1,1,0,0,0,0,0],
            [0,1,1,1,1,1,0,0,0,0],
            [0,0,1,1,1,0,0,0,0,0],
            [0,0,1,1,1,0,0,0,0,0],
        ],
        bird_a: [
            [0,0,1,1,0,0,1,1,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,0,0,0],
            [1,1,1,1,1,1,1,1,1,1,0,0],
            [0,0,1,1,1,0,1,1,1,0,0,0],
            [0,0,0,1,1,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0],
        ],
        bird_b: [
            [0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,1,1,1,1,0,0],
            [0,0,1,1,1,0,1,1,1,0,0,0],
            [0,0,0,1,1,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0],
        ],
        cloud: [
            [0,0,1,1,0,0,0,0],
            [0,1,1,1,1,1,0,0],
            [1,1,1,1,1,1,1,0],
            [0,1,1,1,1,1,0,0],
        ],
    };

    static _stylesInjected = false;

    static _injectStyles() {
        if (DinoAd._stylesInjected) return;
        DinoAd._stylesInjected = true;
        const s = document.createElement('style');
        s.textContent = `
        .dino-ad-wrap {
            position: relative; background: #0d0d1a;
            border-radius: 10px; overflow: hidden;
            border: 1.5px solid #2a2a3a; user-select: none;
        }
        .dino-ad-wrap canvas { display: block; width: 100%; cursor: pointer; image-rendering: pixelated; }
        .dino-ad-bar {
            display: flex; align-items: center; gap: 8px;
            padding: 5px 10px; background: #1a1a2a; border-top: 1px solid #2a2a3a;
        }
        .dino-ad-sponsored {
            font-family: monospace; font-size: 8px; font-weight: 700;
            color: #555; text-transform: uppercase; letter-spacing: .5px; flex: 1;
        }
        .dino-ad-score {
            font-family: 'Press Start 2P', monospace; font-size: 8px;
            color: #f4a924; letter-spacing: 1px; min-width: 50px; text-align: right;
        }
        .dino-ad-coins-badge { font-family: monospace; font-size: 9px; font-weight: 700; color: #7ae0b0; }
        .dino-ad-skip {
            font-family: monospace; font-size: 9px; color: #555; cursor: pointer;
            border: 1px solid #333; border-radius: 4px; padding: 2px 7px;
            transition: color .12s, border-color .12s; flex-shrink: 0;
        }
        .dino-ad-skip:hover { color: #eee; border-color: #666; }
        .dino-ad-gameover {
            position: absolute; inset: 0; background: rgba(13,13,26,.88);
            display: flex; align-items: center; justify-content: center;
            animation: dino-go-in .22s ease;
        }
        @keyframes dino-go-in { from { opacity:0; transform:scale(.92); } to { opacity:1; transform:scale(1); } }
        .dino-ad-gameover-inner { text-align: center; padding: 20px; }
        .dino-ad-gameover-title {
            font-family: 'Press Start 2P', monospace; font-size: 14px;
            color: #ff6b6b; letter-spacing: 2px; margin-bottom: 8px;
        }
        .dino-ad-gameover-score {
            font-family: 'Press Start 2P', monospace; font-size: 9px;
            color: #eee; letter-spacing: 1px; margin-bottom: 6px;
        }
        .dino-ad-gameover-coins {
            font-family: monospace; font-size: 14px; font-weight: 700;
            color: #f4a924; margin-bottom: 14px;
        }
        .dino-ad-restart-btn {
            font-family: 'Press Start 2P', monospace; font-size: 8px;
            background: #f4a924; color: #1a1a1a; border: none;
            border-bottom: 3px solid #8b5a00; border-radius: 5px;
            padding: 8px 18px; cursor: pointer; letter-spacing: 1px;
            transition: transform .1s, box-shadow .1s;
        }
        .dino-ad-restart-btn:hover  { transform: translateY(1px); box-shadow: 0 2px 0 #8b5a00; }
        .dino-ad-restart-btn:active { transform: translateY(3px); box-shadow: none; border-bottom-width: 0; }
        `;
        document.head.appendChild(s);
    }

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor(options = {}) {
        this.reward    = options.reward    || 50;
        this.skipAfter = options.skipAfter || 5000;

        // Canvas dimensions
        this.W  = 480;
        this.H  = 155;
        this.S  = 3;     // px per sprite pixel
        this.GY = 122;   // ground Y

        // Dino dimensions (sprite: 12 cols × 14 rows)
        this._dinoW = 12 * this.S;   // 36
        this._dinoH = 14 * this.S;   // 42
        this._dinoX = 48;
        this._dinoY = this.GY - this._dinoH;

        // Physics
        this._velY     = 0;
        this._gravity  = 0.52;
        this._jumpPow  = -11.5;
        this._onGround = true;

        // Obstacles & birds
        this._obstacles  = [];
        this._birds      = [];
        this._spawnClock = 0;

        // Scroll state
        this._groundOff = 0;
        this._speed     = 5;

        // Game state
        this._score       = 0;
        this._tick        = 0;
        this._raf         = null;
        this._running     = false;
        this._started     = false;
        this._dead        = false;
        this._skipped     = false;
        this._coinsEarned = 0;
        this._flash       = null;   // { text, until }

        // DOM
        this.canvas      = null;
        this._wrap       = null;
        this._container  = null;
        this._keyHandler = null;
    }

    // ── Public API ───────────────────────────────────────────────────────────

    render(container) {
        DinoAd._injectStyles();
        this._container = container;

        const wrap = document.createElement('div');
        wrap.className = 'dino-ad-wrap';
        this._wrap = wrap;

        // Canvas
        const canvas = document.createElement('canvas');
        canvas.width  = this.W;
        canvas.height = this.H;
        canvas.getContext('2d').imageSmoothingEnabled = false;
        this.canvas = canvas;

        // Controls bar
        const bar = document.createElement('div');
        bar.className = 'dino-ad-bar';
        bar.innerHTML = `
            <span class="dino-ad-sponsored">SPONSORED · PLAY &amp; EARN</span>
            <span class="dino-ad-score" id="_dinoScore">0</span>
            <span class="dino-ad-coins-badge" id="_dinoCoins"></span>
            <span class="dino-ad-skip" id="_dinoSkip" hidden>Skip ›</span>
        `;

        wrap.appendChild(canvas);
        wrap.appendChild(bar);
        container.appendChild(wrap);

        // Jump input (click + touch + keyboard)
        const jump = (e) => {
            if (e && e.type === 'touchstart') e.preventDefault();
            if (!this._started) { this._started = true; this._running = true; }
            if (!this._dead && this._onGround) {
                this._velY = this._jumpPow;
                this._onGround = false;
            }
        };
        canvas.addEventListener('click', jump);
        canvas.addEventListener('touchstart', jump, { passive: false });
        this._keyHandler = (e) => {
            if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); jump(); }
        };
        window.addEventListener('keydown', this._keyHandler);

        // Skip button
        setTimeout(() => {
            const sk = wrap.querySelector('#_dinoSkip');
            if (sk) sk.hidden = false;
        }, this.skipAfter);
        bar.querySelector('#_dinoSkip')?.addEventListener('click', () => this._skip());

        // Start loop
        this._raf = requestAnimationFrame(() => this._loop());
        return wrap;
    }

    destroy() {
        cancelAnimationFrame(this._raf);
        if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
        this._wrap?.remove();
    }

    // ── Game loop ────────────────────────────────────────────────────────────

    _loop() {
        this._update();
        this._paint();
        if (!this._skipped && !this._dead) {
            this._raf = requestAnimationFrame(() => this._loop());
        }
    }

    _update() {
        if (!this._running || this._dead) return;

        this._tick++;
        this._score++;

        // Gradually increase speed, cap at +4
        this._speed = 5 + Math.min(this._score / 400, 4);

        // Score display
        const se = this._wrap?.querySelector('#_dinoScore');
        if (se) se.textContent = this._score;

        // Ground scroll offset
        this._groundOff = (this._groundOff + this._speed) % 80;

        // Dino physics
        this._velY += this._gravity;
        this._dinoY = Math.min(this._dinoY + this._velY, this.GY - this._dinoH);
        if (this._dinoY >= this.GY - this._dinoH) {
            this._velY     = 0;
            this._onGround = true;
        }

        // Obstacle spawning — gap shrinks as score rises
        this._spawnClock++;
        const gap = Math.max(46, 90 - Math.floor(this._score / 280) * 8);
        if (this._spawnClock >= gap) {
            this._spawnClock = 0;
            this._spawnNext();
        }

        // Move obstacles
        for (let i = this._obstacles.length - 1; i >= 0; i--) {
            this._obstacles[i].x -= this._speed;
            if (this._obstacles[i].x < -60) this._obstacles.splice(i, 1);
        }

        // Move birds
        for (let i = this._birds.length - 1; i >= 0; i--) {
            const b = this._birds[i];
            b.x -= this._speed * 0.85;
            if (++b.ftick > 9) { b.frame ^= 1; b.ftick = 0; }
            if (b.x < -50) this._birds.splice(i, 1);
        }

        // Milestone flashes
        if (this._score === 400 || this._score === 800) {
            this._flash = { text: '+ 🪙 KEEP RUNNING!', until: Date.now() + 900 };
        }

        this._collide();
    }

    _spawnNext() {
        const r = Math.random();
        if (r < 0.55) {
            const type = r < 0.28 ? 'cactus_lg' : 'cactus_sm';
            this._obstacles.push({ x: this.W + 12, type });
        } else if (this._score > 350 && r < 0.75) {
            // Birds fly at two height bands: neck-high or mid-jump-high
            const band = Math.random() < 0.55 ? 0 : 1;
            const bY   = this.GY - this._dinoH - band * (this._dinoH * 0.6);
            this._birds.push({ x: this.W + 12, y: bY, frame: 0, ftick: 0 });
        }
    }

    _collide() {
        const pad = 6;
        const dx = this._dinoX + pad;
        const dy = this._dinoY + pad;
        const dw = this._dinoW - pad * 2;
        const dh = this._dinoH - pad;

        for (const obs of this._obstacles) {
            const sp = DinoAd.SPRITES[obs.type];
            const sw = sp[0].length * this.S;
            const sh = sp.length    * this.S;
            const oy = this.GY - sh;
            if (dx < obs.x + sw - 2 && dx + dw > obs.x + 2 && dy < oy + sh && dy + dh > oy + 2) {
                this._die(); return;
            }
        }

        for (const b of this._birds) {
            const bw = 12 * this.S;
            const bh =  5 * this.S;
            if (dx < b.x + bw - 2 && dx + dw > b.x + 2 && dy < b.y + bh && dy + dh > b.y + 2) {
                this._die(); return;
            }
        }
    }

    _die() {
        this._dead = true;
        const ratio = Math.min(this._score / 1200, 1);
        this._coinsEarned = Math.max(5, Math.floor(ratio * this.reward));

        DinoAd.addCoins(this._coinsEarned);

        const ce = this._wrap?.querySelector('#_dinoCoins');
        if (ce) ce.textContent = '';

        document.dispatchEvent(new CustomEvent('dinoadGameOver', {
            detail: { score: this._score, coins: this._coinsEarned },
        }));

        setTimeout(() => this._showGameOver(), 280);
    }

    _showGameOver() {
        const ov = document.createElement('div');
        ov.className = 'dino-ad-gameover';
        ov.innerHTML = `
            <div class="dino-ad-gameover-inner">
                <div class="dino-ad-gameover-title">GAME OVER</div>
                <div class="dino-ad-gameover-score">SCORE: ${this._score}</div>
                <div class="dino-ad-gameover-coins">+${this._coinsEarned} 🪙 EARNED</div>
                <button class="dino-ad-restart-btn" id="_dinoRestart">▶ PLAY AGAIN</button>
            </div>`;
        this._wrap.appendChild(ov);
        ov.querySelector('#_dinoRestart').addEventListener('click', () => {
            ov.remove();
            this._restart();
        });
    }

    _restart() {
        this._dinoY      = this.GY - this._dinoH;
        this._velY       = 0;
        this._onGround   = true;
        this._obstacles  = [];
        this._birds      = [];
        this._score      = 0;
        this._tick       = 0;
        this._spawnClock = 0;
        this._speed      = 5;
        this._dead       = false;
        this._started    = false;
        this._running    = false;
        this._coinsEarned = 0;
        this._flash       = null;

        const se = this._wrap?.querySelector('#_dinoScore');
        if (se) se.textContent = '0';

        this._raf = requestAnimationFrame(() => this._loop());
    }

    _skip() {
        this._skipped = true;
        cancelAnimationFrame(this._raf);
        if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
        document.dispatchEvent(new CustomEvent('dinoadSkipped', {
            detail: { score: this._score },
        }));
        this._wrap?.remove();
    }

    // ── Rendering ────────────────────────────────────────────────────────────

    _paint() {
        const ctx = this.canvas.getContext('2d');
        const { W, H, S, GY } = this;

        // Sky — alternating dark rows for pixel depth
        for (let y = 0; y < GY; y += 8) {
            ctx.fillStyle = y % 16 === 0 ? '#0f0f22' : '#0d0d1a';
            ctx.fillRect(0, y, W, 8);
        }

        // Stars (fixed positions)
        ctx.fillStyle = '#ffffff';
        for (const [sx, sy] of [[22,8],[90,5],[180,13],[290,4],[380,10],[452,7],[130,20],[340,17],[60,25]]) {
            ctx.fillRect(sx, sy, 2, 2);
        }

        // Crescent moon
        ctx.fillStyle = '#ffe8a0';
        ctx.fillRect(416, 12, 12, 12);
        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(420, 12, 12, 10);

        // Scrolling clouds
        const cspd = this._tick * 0.35;
        const cW   = W + 80;
        const c1x  = W - (cspd % cW);
        const c2x  = W - ((cspd + cW / 2) % cW);
        this._drawCloud(ctx, c1x, 28);
        this._drawCloud(ctx, c2x, 14);

        // Ground fill
        ctx.fillStyle = '#1a1200';
        ctx.fillRect(0, GY, W, H - GY);

        // Ground line (gold pixel strip)
        ctx.fillStyle = '#f4a924';
        ctx.fillRect(0, GY, W, 2);

        // Ground texture dashes
        ctx.fillStyle = '#2e2000';
        const goff = this._groundOff;
        for (let gx = -(goff % 80); gx < W; gx += 80) {
            ctx.fillRect(gx,      GY + 5, 28, 2);
            ctx.fillRect(gx + 48, GY + 11, 14, 2);
        }

        // Obstacles (cactus — green)
        for (const obs of this._obstacles) {
            const sp = DinoAd.SPRITES[obs.type];
            const sh = sp.length * S;
            this._blit(ctx, sp, obs.x, GY - sh, S, '#3a9a3a', '#7ae0b0');
        }

        // Birds (cyan)
        for (const b of this._birds) {
            this._blit(ctx, DinoAd.SPRITES[b.frame === 0 ? 'bird_a' : 'bird_b'],
                b.x, b.y, S, '#60c8f4', '#ffffff');
        }

        // Dino
        const dKey = this._dead
            ? 'dino_dead'
            : !this._onGround ? 'dino_run1'
            : this._tick % 16 < 8 ? 'dino_run1' : 'dino_run2';
        const dMain   = this._dead ? '#ff6b6b' : '#f4e04a';
        const dAccent = this._dead ? '#ff2222' : '#ffffff';
        this._blit(ctx, DinoAd.SPRITES[dKey], this._dinoX, this._dinoY, S, dMain, dAccent);

        // Pre-start overlay
        if (!this._started) {
            ctx.fillStyle = 'rgba(13,13,26,.6)';
            ctx.fillRect(0, 38, W, 52);
            ctx.textAlign = 'center';
            ctx.font      = `bold ${S * 2.5}px monospace`;
            ctx.fillStyle = '#f4a924';
            ctx.fillText('SPACE / TAP TO START', W / 2, 64);
            ctx.font      = `bold ${S * 1.5}px monospace`;
            ctx.fillStyle = '#7ae0b0';
            ctx.fillText(`JUMP OVER OBSTACLES · EARN UP TO ${this.reward} \u{1FA99}`, W / 2, 80);
            ctx.textAlign = 'left';
        }

        // Milestone flash
        if (this._flash) {
            if (Date.now() < this._flash.until) {
                ctx.textAlign = 'center';
                ctx.font      = `bold ${S * 2.5}px monospace`;
                ctx.fillStyle = '#f4a924';
                ctx.fillText(this._flash.text, W / 2, 55);
                ctx.textAlign = 'left';
            } else {
                this._flash = null;
            }
        }
    }

    _blit(ctx, sprite, x, y, s, mainCol, accentCol) {
        for (let r = 0; r < sprite.length; r++) {
            for (let c = 0; c < sprite[r].length; c++) {
                const v = sprite[r][c];
                if (!v) continue;
                ctx.fillStyle = v === 2 ? accentCol : mainCol;
                ctx.fillRect(Math.floor(x + c * s), Math.floor(y + r * s), s, s);
            }
        }
    }

    _drawCloud(ctx, x, y) {
        this._blit(ctx, DinoAd.SPRITES.cloud, x, y, 5, '#1e1e34', '#1e1e34');
    }

    // ── Static helpers ───────────────────────────────────────────────────────

    static addCoins(amount) {
        // Delegate to PixelAd if loaded (shares the same coin system)
        if (typeof PixelAd !== 'undefined' && PixelAd.addCoins) {
            PixelAd.addCoins(amount);
            return;
        }
        const next = (parseInt(localStorage.getItem('dig_in_coins') || '0', 10)) + amount;
        localStorage.setItem('dig_in_coins', String(next));
        document.querySelectorAll('#coinCount').forEach(el => { el.textContent = next; });
        document.querySelectorAll('.coin-counter').forEach(el => {
            el.style.transition = 'transform .12s, background .2s';
            el.style.background = '#f4a924';
            el.style.transform  = 'scale(1.15)';
            setTimeout(() => { el.style.background = ''; el.style.transform = ''; }, 380);
        });
    }

    static mount(selectorOrEl, options = {}) {
        const el = typeof selectorOrEl === 'string'
            ? document.querySelector(selectorOrEl) : selectorOrEl;
        if (!el) return null;
        const ad = new DinoAd(options);
        ad.render(el);
        return ad;
    }
}
