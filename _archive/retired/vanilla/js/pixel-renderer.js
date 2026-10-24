/**
 * Cooking Mama Pixel Art Renderer
 * Authentic 2000s-era pixel art rendering
 * No blur. No smoothing. Just pixels.
 */

class PixelArtRenderer {
    constructor() {
        this.pixelSize = 8; // Base pixel block size
        this.canvasCache = new Map();
        this.initRenderer();
    }

    initRenderer() {
        // Set global pixel rendering context
        this.addGlobalPixelStyles();
        this.setupCanvasContext();
    }

    addGlobalPixelStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* CRITICAL: Pixel art rendering rules */
            canvas, img, .pixel-art {
                image-rendering: crisp-edges;
                image-rendering: pixelated;
                image-rendering: pixelated;
                image-rendering: crisp-edges;
                -ms-interpolation-mode: nearest-neighbor;
            }
            
            /* Disable anti-aliasing on all pixel elements */
            .pixel-perfect {
                image-rendering: optimizeSpeed;
                image-rendering: -moz-crisp-edges;
                image-rendering: -o-crisp-edges;
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
                image-rendering: pixelated;
                -ms-interpolation-mode: nearest-neighbor;
            }
            
            /* 2000s pixel font */
            @font-face {
                font-family: 'Pixelated';
                src: local('Press Start 2P'), local('Courier New');
                font-smooth: never;
                -webkit-font-smoothing: none;
            }
            
            /* Pixel cursor for authenticity */
            .pixel-cursor {
                cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="8" height="8" fill="black"/><rect x="8" y="8" width="8" height="8" fill="black"/></svg>') 0 0, auto;
            }
        `;
        document.head.appendChild(style);
    }

    setupCanvasContext() {
        // Override canvas context to force pixelated rendering
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, attributes) {
            const ctx = originalGetContext.call(this, type, {
                ...attributes,
                alpha: true,
                antialias: false,
                desynchronized: true
            });
            
            if (ctx && type === '2d') {
                // Disable image smoothing globally
                ctx.imageSmoothingEnabled = false;
                ctx.webkitImageSmoothingEnabled = false;
                ctx.mozImageSmoothingEnabled = false;
                ctx.msImageSmoothingEnabled = false;
            }
            return ctx;
        };
    }

    /**
     * Create a pixel art canvas from an image
     * Scales down to pixel size, then scales up cleanly
     */
    createPixelArtFromImage(imageElement, targetWidth, targetHeight) {
        // Step 1: Calculate pixel dimensions
        const pixelWidth = Math.floor(targetWidth / this.pixelSize);
        const pixelHeight = Math.floor(targetHeight / this.pixelSize);
        
        // Step 2: Create off-screen canvas at pixel resolution
        const pixelCanvas = document.createElement('canvas');
        pixelCanvas.width = pixelWidth;
        pixelCanvas.height = pixelHeight;
        const pixelCtx = pixelCanvas.getContext('2d');
        pixelCtx.imageSmoothingEnabled = false;
        
        // Step 3: Draw image at pixel resolution (this creates the pixelation)
        pixelCtx.drawImage(imageElement, 0, 0, pixelWidth, pixelHeight);
        
        // Step 4: Scale back up with nearest-neighbor
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = targetWidth;
        finalCanvas.height = targetHeight;
        const finalCtx = finalCanvas.getContext('2d');
        finalCtx.imageSmoothingEnabled = false;
        finalCtx.drawImage(pixelCanvas, 0, 0, targetWidth, targetHeight);
        
        return finalCanvas;
    }

    /**
     * Generate procedural pixel art for recipe icons
     * Using pure canvas pixel manipulation (2000s style)
     */
    generateRecipePixelArt(recipeName, baseColor, width = 64, height = 64) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.classList.add('pixel-art');
        
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        // Clear with transparency
        ctx.clearRect(0, 0, width, height);
        
        // Generate pixel pattern based on recipe name hash
        const hash = this.hashString(recipeName);
        const patternType = hash % 8;
        
        // Draw pixel pattern
        const pixelBlockSize = 8; // 8x8 pixel blocks
        const blocksX = width / pixelBlockSize;
        const blocksY = height / pixelBlockSize;
        
        for (let x = 0; x < blocksX; x++) {
            for (let y = 0; y < blocksY; y++) {
                const pixelHash = this.hashString(`${recipeName}_${x}_${y}`);
                const shouldDraw = (pixelHash % 2) === 0;
                
                if (shouldDraw) {
                    // Vary color slightly for texture
                    const variation = (pixelHash % 30) - 15;
                    const color = this.adjustColor(baseColor, variation);
                    ctx.fillStyle = color;
                    ctx.fillRect(x * pixelBlockSize, y * pixelBlockSize, pixelBlockSize, pixelBlockSize);
                }
            }
        }
        
        // Add outline pixel effect (2000s sprite style)
        this.addPixelOutline(ctx, width, height, pixelBlockSize);
        
        return canvas;
    }

    addPixelOutline(ctx, width, height, blockSize) {
        // Draw 1-pixel black outline around the sprite
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, width, height);
        
        // Add inner shadow (pixel-style)
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,0,0,${0.3 - i * 0.1})`;
            ctx.strokeRect(i, i, width - (i * 2), height - (i * 2));
        }
    }

    /**
     * Create animated pixel frog sprite
     * Frame-by-frame pixel animation like 2000s GBA games
     */
    createAnimatedFrogSprite(frogColor, personality) {
        const spriteSheet = document.createElement('canvas');
        const frameWidth = 32;
        const frameHeight = 32;
        const frameCount = 4; // Idle animation frames
        
        spriteSheet.width = frameWidth * frameCount;
        spriteSheet.height = frameHeight;
        
        const ctx = spriteSheet.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        // Draw each frame
        for (let frame = 0; frame < frameCount; frame++) {
            const offsetX = frame * frameWidth;
            
            // Frog body (pixel by pixel)
            const frogColorHex = frogColor.hex || '#4CAF50';
            
            // Draw frog shape using pixel blocks
            // Row 1
            this.drawPixelBlock(ctx, offsetX + 8, 4, 16, 4, frogColorHex);
            // Row 2 (eyes)
            this.drawPixelBlock(ctx, offsetX + 6, 8, 4, 4, '#FFFFFF');
            this.drawPixelBlock(ctx, offsetX + 22, 8, 4, 4, '#FFFFFF');
            this.drawPixelBlock(ctx, offsetX + 7, 9, 2, 2, '#000000');
            this.drawPixelBlock(ctx, offsetX + 23, 9, 2, 2, '#000000');
            // Row 3 (body)
            this.drawPixelBlock(ctx, offsetX + 4, 12, 24, 8, frogColorHex);
            // Row 4 (belly)
            this.drawPixelBlock(ctx, offsetX + 8, 20, 16, 4, '#A5D6A7');
            // Row 5 (legs - animated by frame)
            const legOffset = frame % 2 === 0 ? 4 : 8;
            this.drawPixelBlock(ctx, offsetX + 4, 24, 6, 4, frogColorHex);
            this.drawPixelBlock(ctx, offsetX + 22, 24, 6, 4, frogColorHex);
            
            // Add personality expression based on mood
            this.addFrogExpression(ctx, offsetX, personality, frame);
        }
        
        return spriteSheet;
    }

    drawPixelBlock(ctx, x, y, width, height, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
    }

    addFrogExpression(ctx, offsetX, personality, frame) {
        // Different expressions based on personality
        ctx.fillStyle = '#000000';
        
        if (personality === 'happy') {
            // Happy mouth (pixel smile)
            ctx.fillRect(offsetX + 12, 18, 2, 2);
            ctx.fillRect(offsetX + 18, 18, 2, 2);
            ctx.fillRect(offsetX + 13, 19, 6, 2);
        } else if (personality === 'grumpy') {
            // Grumpy mouth
            ctx.fillRect(offsetX + 12, 20, 2, 2);
            ctx.fillRect(offsetX + 18, 20, 2, 2);
            ctx.fillRect(offsetX + 13, 19, 6, 1);
        } else {
            // Neutral/open mouth (blinking animation)
            if (frame % 2 === 0) {
                ctx.fillRect(offsetX + 13, 18, 6, 3);
            }
        }
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    adjustColor(hex, variation) {
        // Parse hex to RGB
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        // Adjust with variation, keep within bounds
        const newR = Math.min(255, Math.max(0, r + variation));
        const newG = Math.min(255, Math.max(0, g + variation));
        const newB = Math.min(255, Math.max(0, b + variation));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    /**
     * Convert regular image to pixel art using canvas manipulation
     * Authentic 2000s method (no ML, just math)
     */
    convertToPixelArt(imageFile, pixelBlockSize = 8, callback) {
        const img = new Image();
        img.onload = () => {
            // Step 1: Downscale to pixel dimensions
            const pixelWidth = Math.floor(img.width / pixelBlockSize);
            const pixelHeight = Math.floor(img.height / pixelBlockSize);
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = pixelWidth;
            tempCanvas.height = pixelHeight;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.imageSmoothingEnabled = false;
            tempCtx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
            
            // Step 2: Extract pixel data
            const imageData = tempCtx.getImageData(0, 0, pixelWidth, pixelHeight);
            const data = imageData.data;
            
            // Step 3: Quantize colors to 256-color palette (2000s style)
            const palette = this.generatePalette(data, 64);
            
            // Step 4: Remap colors to palette
            for (let i = 0; i < data.length; i += 4) {
                const nearest = this.findNearestPaletteColor(
                    { r: data[i], g: data[i+1], b: data[i+2] },
                    palette
                );
                data[i] = nearest.r;
                data[i+1] = nearest.g;
                data[i+2] = nearest.b;
            }
            
            tempCtx.putImageData(imageData, 0, 0);
            
            // Step 5: Scale back up with pixel-perfect scaling
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = img.width;
            finalCanvas.height = img.height;
            const finalCtx = finalCanvas.getContext('2d');
            finalCtx.imageSmoothingEnabled = false;
            finalCtx.drawImage(tempCanvas, 0, 0, img.width, img.height);
            
            callback(finalCanvas);
        };
        img.src = URL.createObjectURL(imageFile);
    }

    generatePalette(data, targetColors) {
        // Simple color quantization
        const colors = new Map();
        
        for (let i = 0; i < data.length; i += 4) {
            const key = `${data[i]},${data[i+1]},${data[i+2]}`;
            colors.set(key, (colors.get(key) || 0) + 1);
        }
        
        // Sort by frequency and take top targetColors
        const sorted = Array.from(colors.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, targetColors);
        
        return sorted.map(([key]) => {
            const [r, g, b] = key.split(',').map(Number);
            return { r, g, b };
        });
    }

    findNearestPaletteColor(color, palette) {
        let nearest = palette[0];
        let minDistance = Infinity;
        
        for (const palColor of palette) {
            const distance = Math.sqrt(
                Math.pow(color.r - palColor.r, 2) +
                Math.pow(color.g - palColor.g, 2) +
                Math.pow(color.b - palColor.b, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                nearest = palColor;
            }
        }
        
        return nearest;
    }
}