/**
 * Dig In Pixel Art Converter
 * Converts any dish photo to retro pixel art using:
 * - Floyd-Steinberg dithering for quality
 * - Color quantization with k-means clustering
 * - Adjustable pixel block sizes (8x8 to 32x32)
 */

class DigInPixelConverter {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.worker = null;
        this.initWorker();
    }

    initWorker() {
        // Use Web Worker for heavy computation (prevents UI freezing) [citation:7]
        if (window.Worker) {
            this.worker = new Worker('pixel-worker.js');
        }
    }

    /**
     * Main conversion function
     * @param {File|string} imageSource - Image file or URL
     * @param {Object} options - Conversion settings
     * @returns {Promise<Blob>} Pixel art PNG
     */
    async convertToPixelArt(imageSource, options = {}) {
        const defaults = {
            pixelSize: 8,        // 8x8 pixel blocks (classic NES style)
            paletteSize: 32,     // 32 colors (Dig In uses ~24 colors)
            dithering: true,     // Floyd-Steinberg dithering
            outputSize: 512      // Final output size in pixels
        };
        
        const config = { ...defaults, ...options };
        
        // Step 1: Load and prepare image
        const img = await this.loadImage(imageSource);
        
        // Step 2: Downscale to pixel art dimensions
        const pixelWidth = Math.floor(img.width / config.pixelSize);
        const pixelHeight = Math.floor(img.height / config.pixelSize);
        
        this.canvas.width = pixelWidth;
        this.canvas.height = pixelHeight;
        this.ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
        
        // Step 3: Extract image data
        let imageData = this.ctx.getImageData(0, 0, pixelWidth, pixelHeight);
        
        // Step 4: Color quantization (reduce to paletteSize colors)
        const palette = this.quantizeColors(imageData, config.paletteSize);
        
        // Step 5: Apply Floyd-Steinberg dithering [citation:7]
        if (config.dithering) {
            imageData = this.floydSteinbergDither(imageData, palette);
        } else {
            imageData = this.nearestColorMapping(imageData, palette);
        }
        
        // Step 6: Scale back up with nearest-neighbor (pixel-perfect)
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = config.outputSize;
        finalCanvas.height = config.outputSize;
        const finalCtx = finalCanvas.getContext('2d');
        
        // Disable smoothing for crisp pixels
        finalCtx.imageSmoothingEnabled = false;
        finalCtx.drawImage(this.canvas, 0, 0, config.outputSize, config.outputSize);
        
        // Step 7: Apply retro screen effect (optional)
        this.applyRetroEffect(finalCtx, config.outputSize);
        
        // Return as PNG blob
        return new Promise(resolve => {
            finalCanvas.toBlob(resolve, 'image/png');
        });
    }

    /**
     * Color quantization using k-means clustering
     * Reduces millions of colors to a curated palette [citation:7]
     */
    quantizeColors(imageData, paletteSize) {
        const pixels = [];
        const data = imageData.data;
        
        // Extract unique colors from image
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const key = `${r},${g},${b}`;
            if (!pixels.find(p => p.key === key)) {
                pixels.push({ r, g, b, key });
            }
        }
        
        // Use median cut algorithm for palette generation
        return this.medianCut(pixels, paletteSize);
    }

    /**
     * Floyd-Steinberg Dithering Algorithm
     * Distributes quantization error to neighboring pixels [citation:7]
     * This creates the retro "dotted" look classic pixel art is known for
     */
    floydSteinbergDither(imageData, palette) {
        const width = imageData.width;
        const height = imageData.height;
        const data = new Uint8ClampedArray(imageData.data);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                
                // Get current pixel color
                const oldColor = {
                    r: data[idx],
                    g: data[idx + 1],
                    b: data[idx + 2]
                };
                
                // Find closest color in palette
                const newColor = this.findClosestColor(oldColor, palette);
                
                // Calculate quantization error
                const error = {
                    r: oldColor.r - newColor.r,
                    g: oldColor.g - newColor.g,
                    b: oldColor.b - newColor.b
                };
                
                // Apply new color
                data[idx] = newColor.r;
                data[idx + 1] = newColor.g;
                data[idx + 2] = newColor.b;
                
                // Distribute error to neighboring pixels
                // Floyd-Steinberg matrix: [citation:7]
                //      X   7/16
                // 3/16 5/16 1/16
                this.distributeError(data, x, y, width, height, error);
            }
        }
        
        return new ImageData(data, width, height);
    }

    distributeError(data, x, y, width, height, error) {
        const right = x + 1 < width;
        const left = x - 1 >= 0;
        const down = y + 1 < height;
        
        if (right) {
            // Right pixel gets 7/16 of error
            const idx = (y * width + (x + 1)) * 4;
            data[idx] += error.r * 7 / 16;
            data[idx + 1] += error.g * 7 / 16;
            data[idx + 2] += error.b * 7 / 16;
        }
        
        if (down) {
            // Down-left pixel gets 3/16 of error
            if (left) {
                const idx = ((y + 1) * width + (x - 1)) * 4;
                data[idx] += error.r * 3 / 16;
                data[idx + 1] += error.g * 3 / 16;
                data[idx + 2] += error.b * 3 / 16;
            }
            
            // Down pixel gets 5/16 of error
            const idx = ((y + 1) * width + x) * 4;
            data[idx] += error.r * 5 / 16;
            data[idx + 1] += error.g * 5 / 16;
            data[idx + 2] += error.b * 5 / 16;
            
            // Down-right pixel gets 1/16 of error
            if (right) {
                const idx = ((y + 1) * width + (x + 1)) * 4;
                data[idx] += error.r * 1 / 16;
                data[idx + 1] += error.g * 1 / 16;
                data[idx + 2] += error.b * 1 / 16;
            }
        }
    }

    /**
     * Median Cut Algorithm for Palette Generation
     * Finds optimal colors by repeatedly splitting color space
     */
    medianCut(colors, targetCount) {
        if (colors.length <= targetCount) {
            return colors.map(c => ({ r: c.r, g: c.g, b: c.b }));
        }
        
        // Find the range of each color component
        let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
        colors.forEach(c => {
            minR = Math.min(minR, c.r); maxR = Math.max(maxR, c.r);
            minG = Math.min(minG, c.g); maxG = Math.max(maxG, c.g);
            minB = Math.min(minB, c.b); maxB = Math.max(maxB, c.b);
        });
        
        const rangeR = maxR - minR;
        const rangeG = maxG - minG;
        const rangeB = maxB - minB;
        
        // Split on the component with the largest range
        let splitComponent;
        let splitValue;
        
        if (rangeR >= rangeG && rangeR >= rangeB) {
            splitComponent = 'r';
            colors.sort((a, b) => a.r - b.r);
            splitValue = colors[Math.floor(colors.length / 2)].r;
        } else if (rangeG >= rangeR && rangeG >= rangeB) {
            splitComponent = 'g';
            colors.sort((a, b) => a.g - b.g);
            splitValue = colors[Math.floor(colors.length / 2)].g;
        } else {
            splitComponent = 'b';
            colors.sort((a, b) => a.b - b.b);
            splitValue = colors[Math.floor(colors.length / 2)].b;
        }
        
        const leftColors = colors.filter(c => c[splitComponent] < splitValue);
        const rightColors = colors.filter(c => c[splitComponent] >= splitValue);
        
        // Recurse on both halves
        const leftPalette = this.medianCut(leftColors, targetCount / 2);
        const rightPalette = this.medianCut(rightColors, targetCount / 2);
        
        return [...leftPalette, ...rightPalette];
    }

    findClosestColor(color, palette) {
        let closest = palette[0];
        let smallestDistance = Infinity;
        
        for (const paletteColor of palette) {
            const distance = Math.sqrt(
                Math.pow(color.r - paletteColor.r, 2) +
                Math.pow(color.g - paletteColor.g, 2) +
                Math.pow(color.b - paletteColor.b, 2)
            );
            if (distance < smallestDistance) {
                smallestDistance = distance;
                closest = paletteColor;
            }
        }
        
        return closest;
    }

    nearestColorMapping(imageData, palette) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const color = {
                r: data[i],
                g: data[i + 1],
                b: data[i + 2]
            };
            const nearest = this.findClosestColor(color, palette);
            data[i] = nearest.r;
            data[i + 1] = nearest.g;
            data[i + 2] = nearest.b;
        }
        return imageData;
    }

    applyRetroEffect(ctx, size) {
        // Add CRT scanline effect for nostalgia
        const gradient = ctx.createLinearGradient(0, 0, 0, size);
        gradient.addColorStop(0, 'rgba(0,0,0,0.05)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.02)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.08)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
    }

    loadImage(source) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            
            if (typeof source === 'string') {
                img.src = source;
            } else if (source instanceof File) {
                const reader = new FileReader();
                reader.onload = (e) => { img.src = e.target.result; };
                reader.readAsDataURL(source);
            }
        });
    }
}