/**
 * Pixel Frog Sprite System
 * 2000s GBA-style sprite rendering
 */

class PixelFrogSprites {
    constructor(pixelRenderer) {
        this.renderer = pixelRenderer;
        this.spriteCache = new Map();
    }

    /**
     * Generate frog sprite from scratch using pixel data
     * No external images - pure code-generated pixel art
     */
    generateFrogSprite(frogColor, personality, size = 64) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        canvas.classList.add('pixel-art');
        
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        const pixelBlock = size / 16; // 16x16 grid of 4px blocks (for 64px sprite)
        const colorHex = frogColor.hex || '#4CAF50';
        
        // Clear canvas
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, size, size);
        
        // Draw frog using pixel grid (16x16)
        // Grid coordinates (x,y) with block size
        const frogShape = this.getFrogShape(personality);
        
        for (let y = 0; y < frogShape.length; y++) {
            for (let x = 0; x < frogShape[y].length; x++) {
                const cell = frogShape[y][x];
                if (cell !== 0) {
                    let fillColor = colorHex;
                    if (cell === 2) fillColor = '#FFFFFF'; // Eye white
                    if (cell === 3) fillColor = '#000000'; // Eye black
                    if (cell === 4) fillColor = '#A5D6A7'; // Belly
                    
                    ctx.fillStyle = fillColor;
                    ctx.fillRect(x * pixelBlock, y * pixelBlock, pixelBlock, pixelBlock);
                }
            }
        }
        
        // Add outline (pixel-perfect)
        this.addPixelOutline(ctx, size, pixelBlock);
        
        return canvas;
    }

    getFrogShape(personality) {
        // Base frog shape (16x16 grid)
        // 0 = empty, 1 = body, 2 = eye white, 3 = eye black, 4 = belly
        const baseShape = [
            [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
            [0,0,0,1,1,2,1,1,2,1,1,0,0,0,0,0],
            [0,0,0,1,1,3,1,1,3,1,1,0,0,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,1,1,1,4,4,4,4,4,4,1,1,1,0,0,0],
            [1,1,1,1,4,4,4,4,4,4,1,1,1,1,0,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,1,1,1,0,0,1,1,0,0,1,1,0,0,0],
            [0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ];
        
        // Modify based on personality
        if (personality === 'happy') {
            // Add smile
            baseShape[10][7] = 0;
            baseShape[10][8] = 0;
            baseShape[11][6] = 3;
            baseShape[11][7] = 3;
            baseShape[11][8] = 3;
            baseShape[11][9] = 3;
        } else if (personality === 'grumpy') {
            // Add frown
            baseShape[10][7] = 3;
            baseShape[10][8] = 3;
            baseShape[11][6] = 0;
            baseShape[11][7] = 0;
            baseShape[11][8] = 0;
            baseShape[11][9] = 0;
        }
        
        return baseShape;
    }

    addPixelOutline(ctx, size, blockSize) {
        // Draw pixel-style outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        
        // Outline the entire sprite
        for (let x = 0; x < size / blockSize; x++) {
            for (let y = 0; y < size / blockSize; y++) {
                const px = x * blockSize;
                const py = y * blockSize;
                const pixelData = ctx.getImageData(px, py, 1, 1).data;
                
                if (pixelData[3] > 0) {
                    // Check if this pixel has a transparent neighbor
                    const neighbors = [
                        [px - blockSize, py], [px + blockSize, py],
                        [px, py - blockSize], [px, py + blockSize]
                    ];
                    
                    for (const [nx, ny] of neighbors) {
                        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                            const neighborData = ctx.getImageData(nx, ny, 1, 1).data;
                            if (neighborData[3] === 0) {
                                // Add outline pixel
                                ctx.fillStyle = '#000000';
                                ctx.fillRect(px, py, blockSize, blockSize);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    createAnimatedIdle(frogColor, personality, frameCount = 4) {
        const frames = [];
        for (let i = 0; i < frameCount; i++) {
            // Slight y-offset for bounce animation
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            
            const bounceOffset = i % 2 === 0 ? 0 : 2;
            const tempCanvas = this.generateFrogSprite(frogColor, personality, 64);
            
            ctx.drawImage(tempCanvas, 0, bounceOffset);
            frames.push(canvas);
        }
        return frames;
    }
}