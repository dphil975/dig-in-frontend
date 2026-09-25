// pixel-ad.js — Retro pixel art ad unit for Dig In
// Renders on a <canvas> using requestAnimationFrame (no GSAP needed).
// Integrates with the app's coin system via localStorage + #coinCount DOM.

class PixelAd {
    constructor(productData, options = {}) {
        this.product    = productData;
        this.duration   = options.duration  || 12000; // ms to watch for full reward
        this.reward     = options.reward    || 50;
        this.skipAfter  = options.skipAfter || 5000;  // ms before skip appears
        this._frame     = null;
        this._startTime = null;
        this._completed = false;
        this._skipped   = false;
        this.canvas     = null;
        this.container  = null;
        this._wrap      = null;
    }

    // ── Static product catalogue (Amazon affiliate placeholders) ──────────
    static get PRODUCTS() {
        return [
            { id:'p1', name:'Kitchen Scale', fullName:'Digital Kitchen Scale',
              price:'14.99', brand:'Ozeri', category:'kitchen',
              asin:'B004164SRA', emoji:'⚖️', accent:'#f4a924' },
            { id:'p2', name:'Cast Iron Skillet', fullName:'Cast Iron Skillet 12"',
              price:'24.99', brand:'Lodge', category:'cookware',
              asin:'B00006JSUA', emoji:'🍳', accent:'#7ae0b0' },
            { id:'p3', name:'Instant Pot Duo', fullName:'Instant Pot 7-in-1 6qt',
              price:'79.99', brand:'Instant Pot', category:'appliances',
              asin:'B00FLYWNYQ', emoji:'🫕', accent:'#a78bfa' },
            { id:'p4', name:'Reusable Bags (10pk)', fullName:'Reusable Grocery Bags',
              price:'12.99', brand:'Baggu', category:'storage',
              asin:'B07BG7NWMB', emoji:'🛍️', accent:'#ff9eb5' },
            { id:'p5', name:'Meal Prep Containers', fullName:'Glass Meal Prep Set (20pc)',
              price:'34.99', brand:'PrepNaturals', category:'storage',
              asin:'B01N7KGWWG', emoji:'🥗', accent:'#60c8f4' },
            { id:'p6', name:'Spice Rack Set', fullName:'Magnetic Spice Rack + Jars',
              price:'19.99', brand:'Kamenstein', category:'storage',
              asin:'B00HG3XKAM', emoji:'🌶️', accent:'#f97316' },
        ];
    }

    static randomProduct() {
        const p = PixelAd.PRODUCTS;
        return p[Math.floor(Math.random() * p.length)];
    }

    // ── Coin helpers ─────────────────────────────────────────────────────
    static getCoins() {
        return parseInt(localStorage.getItem('dig_in_coins') || '0', 10);
    }

    static addCoins(amount) {
        const next = PixelAd.getCoins() + amount;
        localStorage.setItem('dig_in_coins', String(next));
        document.querySelectorAll('#coinCount').forEach(el => {
            el.textContent = next;
        });
        document.querySelectorAll('.coin-counter').forEach(el => {
            el.style.transition = 'transform .12s,background .2s';
            el.style.background = '#f4a924';
            el.style.transform  = 'scale(1.15)';
            setTimeout(() => {
                el.style.background = '';
                el.style.transform  = '';
            }, 380);
        });
    }

    // ── Public API ───────────────────────────────────────────────────────

    // render(container) — injects the ad unit into container, starts animation.
    // Returns the wrapper element.
    render(container) {
        this.container = container;

        const wrap = document.createElement('div');
        wrap.className = 'pixel-ad-wrap';
        this._wrap = wrap;

        // Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width  = 480;
        this.canvas.height = 180;
        Object.assign(this.canvas.style, {
            imageRendering: 'pixelated',
            width: '100%',
            display: 'block',
            cursor: 'pointer',
        });
        this.canvas.getContext('2d').imageSmoothingEnabled = false;
        this.canvas.title = `Shop ${this.product.fullName} on Amazon`;
        this.canvas.addEventListener('click', () => this._shopClick());

        // Controls bar
        const bar = document.createElement('div');
        bar.className = 'pixel-ad-bar';
        bar.innerHTML = `
            <span class="pixel-ad-sponsored">SPONSORED</span>
            <div class="pixel-ad-progress-track">
                <div class="pixel-ad-progress-fill" id="pixelAdFill"></div>
            </div>
            <span class="pixel-ad-skip-btn" id="pixelAdSkip" hidden>Skip ›</span>
            <span class="pixel-ad-reward-badge">+${this.reward} <span class="pixel-ad-coin-icon">🪙</span></span>
        `;

        wrap.appendChild(this.canvas);
        wrap.appendChild(bar);
        container.appendChild(wrap);

        // Reveal skip button after skipAfter ms
        setTimeout(() => {
            const skip = wrap.querySelector('#pixelAdSkip');
            if (skip) skip.hidden = false;
        }, this.skipAfter);

        wrap.querySelector('#pixelAdSkip')?.addEventListener('click', () => this._skip());

        this._startTime = Date.now();
        this._loop();

        return wrap;
    }

    // destroy() — stop animation and remove from DOM
    destroy() {
        cancelAnimationFrame(this._frame);
        this._wrap?.remove();
    }

    // ── Private: render loop ─────────────────────────────────────────────
    _loop() {
        const elapsed  = Date.now() - this._startTime;
        const progress = Math.min(elapsed / this.duration, 1);

        // Update progress bar
        const fill = this._wrap?.querySelector('#pixelAdFill');
        if (fill) fill.style.width = `${progress * 100}%`;

        this._draw(elapsed);

        if (progress < 1 && !this._skipped) {
            this._frame = requestAnimationFrame(() => this._loop());
        } else if (!this._completed && !this._skipped) {
            this._complete();
        }
    }

    _draw(elapsed) {
        const ctx = this.canvas.getContext('2d');
        const W = 480, H = 180;

        // ── Background: dark pixel rows ──────────────────────────────────
        const bgRows = ['#0d0d1a', '#111126', '#0d0d1a', '#111126'];
        for (let y = 0; y < H; y += 8) {
            ctx.fillStyle = bgRows[Math.floor(y / 8) % bgRows.length];
            ctx.fillRect(0, y, W, 8);
        }

        // ── Pixel stars (static) ─────────────────────────────────────────
        const stars = [[30,20],[80,12],[140,30],[210,8],[300,22],[390,14],[450,28]];
        ctx.fillStyle = '#ffffff';
        for (const [x, y] of stars) {
            ctx.fillRect(x, y, 2, 2);
        }

        // ── Ground ───────────────────────────────────────────────────────
        ctx.fillStyle = '#1a0f00';
        ctx.fillRect(0, H - 20, W, 20);
        ctx.fillStyle = '#2a1a08';
        ctx.fillRect(0, H - 20, W, 6);

        // ── Storefront left side ─────────────────────────────────────────
        this._drawStore(ctx, elapsed);

        // ── Floating coins ───────────────────────────────────────────────
        this._drawCoins(ctx, elapsed);

        // ── Product card right side ──────────────────────────────────────
        this._drawProductCard(ctx);

        // ── Blink CTA on canvas ──────────────────────────────────────────
        const blink = Math.floor(elapsed / 600) % 2;
        if (blink) {
            ctx.font = 'bold 7px monospace';
            ctx.fillStyle = '#f4a924';
            ctx.fillText('TAP TO SHOP ON AMAZON ›', W / 2 - 70, H - 6);
        }
    }

    _drawStore(ctx, elapsed) {
        const bx = 18, by = 30;
        const accent = this.product.accent || '#f4a924';

        // Building body
        ctx.fillStyle = '#222';
        ctx.fillRect(bx, by, 90, 130);

        // Accent wall stripe
        ctx.fillStyle = accent;
        ctx.fillRect(bx, by, 90, 6);

        // Window
        ctx.fillStyle = '#1a3a5a';
        ctx.fillRect(bx + 10, by + 14, 70, 44);
        ctx.fillStyle = 'rgba(135,206,235,0.25)';
        ctx.fillRect(bx + 12, by + 16, 66, 40);
        // Window shine
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(bx + 14, by + 18, 12, 36);

        // Awning stripes
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = i % 2 === 0 ? accent : '#1a1a1a';
            ctx.fillRect(bx + i * 18, by - 20, 18, 14);
        }

        // Door
        ctx.fillStyle = '#5a3800';
        ctx.fillRect(bx + 28, by + 80, 34, 50);
        ctx.fillStyle = accent + '99';
        ctx.fillRect(bx + 30, by + 82, 14, 24);

        // Sign
        ctx.fillStyle = accent;
        ctx.fillRect(bx + 8, by + 62, 74, 16);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 7px monospace';
        ctx.fillText('DIG-IN SPONSOR', bx + 10, by + 74);

        // Door knob
        ctx.fillStyle = '#f4a924';
        ctx.fillRect(bx + 55, by + 97, 4, 4);

        // Sidewalk light animation
        const pulseAlpha = 0.4 + 0.3 * Math.sin(elapsed / 500);
        ctx.fillStyle = `rgba(244,169,36,${pulseAlpha})`;
        ctx.fillRect(bx, H - 20, 90, 4);
    }

    _drawCoins(ctx, elapsed) {
        for (let i = 0; i < 4; i++) {
            const period = 1600 + i * 300;
            const t      = ((elapsed + i * period * 0.4) % period) / period;
            const x      = 130 + i * 16;
            const y      = 140 - t * 90;
            const alpha  = t < 0.7 ? 1 : (1 - t) / 0.3;
            ctx.globalAlpha = alpha;

            // Coin circle
            ctx.fillStyle = '#f4a924';
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();

            // Coin inner
            ctx.fillStyle = '#c17a00';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
        }
    }

    _drawProductCard(ctx) {
        const W = 480;
        const px = W - 220, py = 14, pw = 208, ph = 148;
        const accent = this.product.accent || '#f4a924';

        // Card background
        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        ctx.fillRect(px, py, pw, ph);

        // Border
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2);

        // Accent top bar
        ctx.fillStyle = accent;
        ctx.fillRect(px, py, pw, 4);

        // Emoji
        ctx.font = '36px serif';
        ctx.fillText(this.product.emoji || '🛍️', px + 10, py + 50);

        // Product name
        ctx.font = 'bold 9px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffffff';
        const name = this.product.name.length > 14
            ? this.product.name.slice(0, 14) + '…'
            : this.product.name;
        ctx.fillText(name, px + 60, py + 30);

        // Brand
        ctx.font = '8px monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(this.product.brand, px + 60, py + 46);

        // Price — big gold
        ctx.font = 'bold 18px "Press Start 2P", monospace';
        ctx.fillStyle = accent;
        ctx.fillText(`$${this.product.price}`, px + 60, py + 74);

        // Category tag
        ctx.fillStyle = accent + '33';
        ctx.fillRect(px + 60, py + 82, 70, 16);
        ctx.fillStyle = accent;
        ctx.font = '7px monospace';
        ctx.fillText(this.product.category.toUpperCase(), px + 64, py + 93);

        // Amazon button
        ctx.fillStyle = '#ff9900';
        ctx.fillRect(px + 10, ph + py - 32, pw - 20, 24);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('› Shop on Amazon', px + 34, ph + py - 16);
    }

    // ── Private: events ──────────────────────────────────────────────────
    _shopClick() {
        const url = `https://www.amazon.com/dp/${this.product.asin}?tag=digin-20`;
        window.open(url, '_blank', 'noopener,noreferrer');
        // Partial coin reward for clicking (even before full watch)
        if (!this._completed) {
            PixelAd.addCoins(Math.floor(this.reward * 0.4));
            this._complete();
        }
    }

    _complete() {
        if (this._completed) return;
        this._completed = true;
        cancelAnimationFrame(this._frame);
        PixelAd.addCoins(this.reward);
        this._showRewardFeedback();
        document.dispatchEvent(new CustomEvent('pixeladCompleted', {
            detail: { reward: this.reward, product: this.product },
        }));
    }

    _skip() {
        if (this._skipped || this._completed) return;
        this._skipped = true;
        cancelAnimationFrame(this._frame);
        document.dispatchEvent(new CustomEvent('pixeladSkipped', {
            detail: { product: this.product },
        }));
        this._wrap?.remove();
    }

    _showRewardFeedback() {
        const fb = document.createElement('div');
        fb.className = 'pixel-ad-reward-pop';
        fb.textContent = `+${this.reward} 🪙`;
        this._wrap?.appendChild(fb);
        setTimeout(() => {
            fb.style.opacity = '0';
            setTimeout(() => this._wrap?.remove(), 400);
        }, 1600);
    }
}

// ── Static helper: build and mount a self-contained ad slot ─────────────
// Usage: PixelAd.mount('#myContainer', { reward: 50 })
PixelAd.mount = function(selectorOrEl, options = {}) {
    const host = typeof selectorOrEl === 'string'
        ? document.querySelector(selectorOrEl)
        : selectorOrEl;
    if (!host) return null;

    const product = options.product || PixelAd.randomProduct();
    const ad      = new PixelAd(product, options);
    ad.render(host);
    return ad;
};

if (typeof module !== 'undefined') module.exports = PixelAd;
// Shake-to-reveal ad mechanic
class ShakeToRevealAd {
    constructor() {
        this.threshold = 15; // shake sensitivity
        this.lastX = 0;
        this.lastY = 0;
        this.shakeCount = 0;
        this.init();
    }
    
    init() {
        window.addEventListener('devicemotion', (e) => {
            const acc = e.accelerationIncludingGravity;
            const deltaX = Math.abs(acc.x - this.lastX);
            const deltaY = Math.abs(acc.y - this.lastY);
            
            if (deltaX > this.threshold || deltaY > this.threshold) {
                this.shakeCount++;
                if (this.shakeCount >= 3) {
                    this.revealAd();
                    this.shakeCount = 0;
                }
            }
            
            this.lastX = acc.x;
            this.lastY = acc.y;
        });
    }
    
    revealAd() {
        // Hidden ad revealed by shaking
        const hiddenBox = document.createElement('div');
        hiddenBox.className = 'mystery-box';
        hiddenBox.innerHTML = `
            <div class="mystery-content">
                <span>???</span>
                <div class="shake-prompt">SHAKE TO REVEAL</div>
            </div>
        `;
        
        // After shake, show ad and reward
        const pixelAd = new PixelAd(
            { name: "Amazon Mystery Deal", price: "???" },
            { reward: 100, duration: 15000 }
        );
        pixelAd.render(hiddenBox);
    }
}// AmazonProductToPixel.js
class AmazonProductToPixel {
    constructor(amazonUrl, asin = null) {
        this.url = amazonUrl;
        this.asin = asin || this.extractAsin(amazonUrl);
        this.productData = null;
    }
    
    extractAsin(url) {
        // Extract ASIN from Amazon URL
        const match = url.match(/(?:dp|product)\/([A-Z0-9]{10})/);
        return match ? match[1] : null;
    }
    
    async fetchProductData() {
        // Using Amazon Product API (requires key)
        // For MVP, use static data or scrape
        this.productData = {
            name: "Product Name",
            price: "29.99",
            imageUrl: "https://...",
            affiliateUrl: `https://amazon.com/dp/${this.asin}?tag=YOUR_TAG`
        };
        return this.productData;
    }
    
    async createPixelAd() {
        await this.fetchProductData();
        
        const pixelAd = new PixelAd({
            name: this.productData.name,
            price: this.productData.price,
            image: this.productData.imageUrl
        }, {
            reward: 50,
            duration: 15000,
            clickUrl: this.productData.affiliateUrl
        });
        
        return pixelAd;
    }
}