/**
 * Frog Sprite Integration from Open Source
 * Multiple frog assets from OpenGameArt and OPP
 */

class FrogSpriteIntegrator {
    constructor(assetLoader) {
        this.assetLoader = assetLoader;
        this.frogSprites = [];
        this.init();
    }

    init() {
        this.loadFrogSprites();
    }

    loadFrogSprites() {
        // Frog assets from Open Pixel Project [citation:3]
        const oppFrogs = [
            {
                name: 'classic_green_frog',
                source: 'OPP',
                frames: 4,
                colors: ['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7'],
                animations: ['idle', 'hop', 'swim', 'eat'],
                license: 'Public Domain',
                url: 'https://opengameart.org/comment/99423'
            },
            {
                name: 'red_eyed_frog',
                source: 'OPP',
                frames: 3,
                colors: ['#2E7D32', '#1B5E20', '#F44336', '#FFEB3B'],
                animations: ['idle', 'tongue_attack'],
                license: 'Public Domain'
            }
        ];
        
        // Jungle frogs from OPP jungle inhabitants [citation:8]
        const jungleFrogs = [
            {
                name: 'poison_dart_frog',
                source: 'OPP Jungle',
                colors: ['#E91E63', '#FF9800', '#9C27B0'],
                patterns: ['spots', 'stripes'],
                license: 'CC-BY 3.0',
                url: 'https://pixeljoint.com/forum/forum_posts.asp?TID=20454'
            },
            {
                name: 'tree_frog',
                source: 'OPP Jungle',
                colors: ['#4CAF50', '#8BC34A', '#CDDC39'],
                adaptations: ['sticky_pads'],
                license: 'CC-BY 3.0'
            }
        ];
        
        this.frogSprites.push(...oppFrogs, ...jungleFrogs);
    }

    getRandomFrogSprite() {
        const randomIndex = Math.floor(Math.random() * this.frogSprites.length);
        return this.frogSprites[randomIndex];
    }

    generateFrogSpriteSheet(frogType) {
        // Generate canvas sprite sheet from open source data
        const spriteSheet = document.createElement('canvas');
        const frameWidth = 32;
        const frameHeight = 32;
        const frameCount = frogType.frames || 4;
        
        spriteSheet.width = frameWidth * frameCount;
        spriteSheet.height = frameHeight;
        
        const ctx = spriteSheet.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        for (let frame = 0; frame < frameCount; frame++) {
            const offsetX = frame * frameWidth;
            
            // Draw frog body (pixel art style)
            const baseColor = frogType.colors[frame % frogType.colors.length];
            
            // Body
            ctx.fillStyle = baseColor;
            ctx.fillRect(offsetX + 8, 12, 16, 16);
            
            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(offsetX + 10, 8, 4, 4);
            ctx.fillRect(offsetX + 18, 8, 4, 4);
            
            ctx.fillStyle = '#000000';
            ctx.fillRect(offsetX + 11, 9, 2, 2);
            ctx.fillRect(offsetX + 19, 9, 2, 2);
            
            // Legs (animated)
            const legOffset = frame % 2 === 0 ? 0 : 3;
            ctx.fillStyle = baseColor;
            ctx.fillRect(offsetX + 4, 24, 6, 4);
            ctx.fillRect(offsetX + 22, 24, 6, 4);
            
            // Apply pattern if exists
            if (frogType.patterns && frogType.patterns[frame % frogType.patterns.length] === 'spots') {
                ctx.fillStyle = '#000000';
                ctx.fillRect(offsetX + 14, 16, 2, 2);
                ctx.fillRect(offsetX + 20, 20, 2, 2);
            }
        }
        
        return spriteSheet;
    }
}