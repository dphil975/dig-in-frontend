/**
 * Dig In Color Theory Engine
 * Uses HSL color space for mathematically pleasing variations
 * Generates unique colors per user based on store + random seed
 * Organizes cooking workflows by color temperature
 */

class ColorTheoryEngine {
    constructor() {
        // Color families based on traditional color wheel
        this.colorFamilies = {
            red: {
                baseHue: 0,
                range: 15, // 0° ± 15°
                psychology: ['energy', 'excitement', 'urgency', 'passion'],
                stores: ['walmart', 'kroger', 'safeway', 'target', 'costco', 'wegmans'],
                cookingStyle: 'high_heat',
                hexPalette: ['#FF6B6B', '#E74C3C', '#C0392B', '#F9E79F', '#E67E22']
            },
            orange: {
                baseHue: 30,
                range: 15,
                psychology: ['warmth', 'comfort', 'creativity', 'enthusiasm'],
                stores: ['aldi', 'lidl', 'grocery_outlet', 'save_a_lot', 'winco'],
                cookingStyle: 'baking_roasting',
                hexPalette: ['#FF9800', '#F39C12', '#E67E22', '#D35400', '#F5B041']
            },
            yellow: {
                baseHue: 55,
                range: 15,
                psychology: ['happiness', 'clarity', 'digestion', 'optimism'],
                stores: ['whole_foods', 'sprouts', 'natural_grocers', 'earth_fare'],
                cookingStyle: 'light_fresh',
                hexPalette: ['#FFD700', '#F1C40F', '#F9E79F', '#F7DC6F', '#F4D03F']
            },
            green: {
                baseHue: 120,
                range: 30,
                psychology: ['freshness', 'growth', 'balance', 'harmony'],
                stores: ['farmers_market', 'organic_food', 'produce_stand', 'vegetarian'],
                cookingStyle: 'vegetable_herb',
                hexPalette: ['#4CAF50', '#2ECC71', '#27AE60', '#1E8449', '#A9DFBF']
            },
            blue: {
                baseHue: 210,
                range: 20,
                psychology: ['calm', 'precision', 'trust', 'focus'],
                stores: ['asian_market', 'italian_market', 'mexican_market', 'french_market'],
                cookingStyle: 'delicate_sauces',
                hexPalette: ['#3498DB', '#2980B9', '#5DADE2', '#85C1E9', '#2E86C1']
            },
            purple: {
                baseHue: 270,
                range: 25,
                psychology: ['luxury', 'creativity', 'magic', 'wisdom'],
                stores: ['butcher', 'fishmonger', 'gourmet', 'specialty'],
                cookingStyle: 'complex_presentation',
                hexPalette: ['#9B59B6', '#8E44AD', '#BB8FCE', '#A569BD', '#7D3C98']
            }
        };

        // Cooking workflow color mapping based on color temperature
        this.workflowColors = {
            prep: { color: '#4CAF50', psychology: 'freshness', order: 1 },
            cook: { color: '#FF9800', psychology: 'heat', order: 2 },
            assemble: { color: '#9C27B0', psychology: 'creativity', order: 3 },
            serve: { color: '#F44336', psychology: 'excitement', order: 4 },
            cleanup: { color: '#00BCD4', psychology: 'calm', order: 5 }
        };

        // User seed for persistent unique colors
        this.userSeed = this.loadOrCreateSeed();
        this.colorCache = {};
    }

    loadOrCreateSeed() {
        let seed = localStorage.getItem('colorTheorySeed');
        if (!seed) {
            seed = Math.random().toString(36).substring(2, 15);
            localStorage.setItem('colorTheorySeed', seed);
        }
        return seed;
    }

    /**
     * Generate a deterministic but unique color for a store
     * Same store + same user = same color
     * Different users = different colors
     */
    generateStoreColor(storeId, storeType, storeName) {
        const cacheKey = `store_${storeId}`;
        if (this.colorCache[cacheKey]) return this.colorCache[cacheKey];

        // Determine color family based on store type
        let family = 'orange'; // default
        for (const [familyName, data] of Object.entries(this.colorFamilies)) {
            if (data.stores.some(s => storeType.toLowerCase().includes(s) || storeName.toLowerCase().includes(s))) {
                family = familyName;
                break;
            }
        }

        const familyData = this.colorFamilies[family];
        
        // Generate unique hue within family range using user seed + store ID
        const hash = this.hashString(storeId + this.userSeed);
        const hueOffset = (hash % (familyData.range * 2)) - familyData.range;
        const hue = familyData.baseHue + hueOffset;
        
        // Generate saturation (50-85%) and lightness (40-70%) for pleasant colors
        const saturation = 50 + (hash % 35);
        const lightness = 40 + (hash % 30);
        
        const color = this.hslToHex(hue, saturation, lightness);
        
        this.colorCache[cacheKey] = {
            hex: color,
            hsl: { h: hue, s: saturation, l: lightness },
            family: family,
            psychology: familyData.psychology[0],
            cookingStyle: familyData.cookingStyle,
            hexPalette: familyData.hexPalette
        };
        
        return this.colorCache[cacheKey];
    }

    /**
     * Generate egg color based on store color
     * Egg color is a lighter, pastel version
     */
    generateEggColor(storeColor) {
        // Pastel version: increase lightness to 70-85%
        const pastelLightness = Math.min(85, storeColor.hsl.l + 25);
        const eggHex = this.hslToHex(storeColor.hsl.h, storeColor.hsl.s - 10, pastelLightness);
        
        return {
            hex: eggHex,
            hsl: { h: storeColor.hsl.h, s: storeColor.hsl.s - 10, l: pastelLightness },
            family: storeColor.family,
            pattern: this.getEggPattern(storeColor.family)
        };
    }

    /**
     * Generate pet color based on egg color
     * Pet color can be a complementary or analogous variation
     */
    generatePetColor(eggColor, petType) {
        const hash = this.hashString(petType + this.userSeed);
        const variation = hash % 3; // 0 = complementary, 1 = analogous, 2 = triadic
        
        let newHue = eggColor.hsl.h;
        
        if (variation === 0) {
            // Complementary: opposite side of color wheel
            newHue = (eggColor.hsl.h + 180) % 360;
        } else if (variation === 1) {
            // Analogous: nearby colors (±30°)
            newHue = (eggColor.hsl.h + (hash % 60) - 30) % 360;
            if (newHue < 0) newHue += 360;
        } else {
            // Triadic: 120° apart
            newHue = (eggColor.hsl.h + 120 + (hash % 60)) % 360;
        }
        
        // Pet colors are more saturated and slightly darker
        const saturation = Math.min(90, eggColor.hsl.s + 20);
        const lightness = Math.max(30, eggColor.hsl.l - 15);
        
        const petHex = this.hslToHex(newHue, saturation, lightness);
        
        return {
            hex: petHex,
            hsl: { h: newHue, s: saturation, l: lightness },
            family: this.getColorFamilyFromHue(newHue),
            variation: variation === 0 ? 'complementary' : (variation === 1 ? 'analogous' : 'triadic'),
            psychology: this.getPsychologyFromHue(newHue)
        };
    }

    /**
     * HSL to HEX conversion
     * https://en.wikipedia.org/wiki/HSL_and_HSV
     */
    hslToHex(h, s, l) {
        s /= 100;
        l /= 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c/2;
        
        let r, g, b;
        
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        
        const toHex = (value) => {
            const hex = Math.round((value + m) * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    }

    /**
     * Simple hash function for deterministic randomness
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    getColorFamilyFromHue(hue) {
        if (hue < 15 || hue >= 345) return 'red';
        if (hue < 45) return 'orange';
        if (hue < 75) return 'yellow';
        if (hue < 165) return 'green';
        if (hue < 240) return 'blue';
        if (hue < 300) return 'purple';
        return 'red';
    }

    getPsychologyFromHue(hue) {
        const families = {
            red: ['energy', 'excitement', 'passion'],
            orange: ['warmth', 'comfort', 'creativity'],
            yellow: ['happiness', 'clarity', 'optimism'],
            green: ['freshness', 'balance', 'harmony'],
            blue: ['calm', 'precision', 'trust'],
            purple: ['luxury', 'creativity', 'magic']
        };
        const family = this.getColorFamilyFromHue(hue);
        const psychologies = families[family];
        return psychologies[Math.floor(Math.random() * psychologies.length)];
    }

    getEggPattern(family) {
        const patterns = {
            red: ['spots', 'stripes', 'speckles', 'gradient'],
            orange: ['swirls', 'dots', 'waves', 'marbled'],
            yellow: ['stars', 'glitter', 'sunburst', 'smooth'],
            green: ['leaves', 'vines', 'scales', 'moss'],
            blue: ['bubbles', 'droplets', 'geometric', 'smooth'],
            purple: ['sparkles', 'crystals', 'nebula', 'gradient']
        };
        const options = patterns[family] || patterns.orange;
        return options[Math.floor(Math.random() * options.length)];
    }

    /**
     * Organize cooking steps by color temperature
     * Warm colors = active cooking, Cool colors = prep/cleanup
     */
    getWorkflowColor(stepType) {
        return this.workflowColors[stepType] || this.workflowColors.prep;
    }

    /**
     * Generate a full color palette for a user session
     * Based on their seed + current date
     */
    generateDailyPalette() {
        const today = new Date().toISOString().split('T')[0];
        const dailySeed = this.hashString(this.userSeed + today);
        
        const palette = [];
        const hueStep = 360 / 8; // 8 colors in palette
        
        for (let i = 0; i < 8; i++) {
            const hue = (dailySeed + (i * hueStep)) % 360;
            const saturation = 60 + (this.hashString(`sat_${i}`) % 30);
            const lightness = 50 + (this.hashString(`light_${i}`) % 25);
            palette.push({
                hex: this.hslToHex(hue, saturation, lightness),
                role: this.getColorRole(i)
            });
        }
        
        return palette;
    }

    getColorRole(index) {
        const roles = ['primary', 'secondary', 'accent', 'background', 'text', 'border', 'highlight', 'shadow'];
        return roles[index % roles.length];
    }

    /**
     * Validate color contrast for accessibility
     * WCAG 2.1 compliance
     */
    getContrastRatio(hex1, hex2) {
        const rgb1 = this.hexToRgb(hex1);
        const rgb2 = this.hexToRgb(hex2);
        
        const lum1 = this.getLuminance(rgb1);
        const lum2 = this.getLuminance(rgb2);
        
        const brighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        
        return (brighter + 0.05) / (darker + 0.05);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    getLuminance(rgb) {
        const rsrgb = rgb.r / 255;
        const gsrgb = rgb.g / 255;
        const bsrgb = rgb.b / 255;
        
        const r = rsrgb <= 0.03928 ? rsrgb / 12.92 : Math.pow((rsrgb + 0.055) / 1.055, 2.4);
        const g = gsrgb <= 0.03928 ? gsrgb / 12.92 : Math.pow((gsrgb + 0.055) / 1.055, 2.4);
        const b = bsrgb <= 0.03928 ? bsrgb / 12.92 : Math.pow((bsrgb + 0.055) / 1.055, 2.4);
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /**
     * Suggest color harmonies for UI elements
     */
    generateHarmonies(baseColor) {
        const baseHue = baseColor.hsl.h;
        
        return {
            complementary: this.hslToHex((baseHue + 180) % 360, baseColor.hsl.s, baseColor.hsl.l),
            analogous1: this.hslToHex((baseHue + 30) % 360, baseColor.hsl.s, baseColor.hsl.l),
            analogous2: this.hslToHex((baseHue - 30 + 360) % 360, baseColor.hsl.s, baseColor.hsl.l),
            triadic1: this.hslToHex((baseHue + 120) % 360, baseColor.hsl.s, baseColor.hsl.l),
            triadic2: this.hslToHex((baseHue + 240) % 360, baseColor.hsl.s, baseColor.hsl.l),
            monochromatic1: this.hslToHex(baseHue, baseColor.hsl.s, baseColor.hsl.l - 15),
            monochromatic2: this.hslToHex(baseHue, baseColor.hsl.s, baseColor.hsl.l + 15)
        };
    }
}