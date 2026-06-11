/**
 * Scientific Cooking Reactions
 * Explains WHY cooking works the way it does
 * Open-source food science knowledge base
 */

class ScientificCooking {
    constructor() {
        this.scientificConcepts = this.loadConcepts();
    }

    loadConcepts() {
        return {
            'maillard_reaction': {
                name: 'Maillard Reaction',
                description: 'The chemical reaction between amino acids and reducing sugars that creates browning and complex flavors.',
                temperature: '280-330°F (140-165°C)',
                example: 'The brown crust on bread, seared steak, roasted coffee',
                tip: 'Pat food dry before searing - water prevents browning',
                pixelArt: '🔥🧪'
            },
            'emulsification': {
                name: 'Emulsification',
                description: 'The process of combining two liquids that don\'t normally mix, like oil and water.',
                example: 'Mayonnaise, hollandaise sauce, vinaigrette',
                tip: 'Add oil slowly while whisking constantly',
                pixelArt: '🥚🫒'
            },
            'denaturation': {
                name: 'Protein Denaturation',
                description: 'Heat causes proteins to unfold and change structure, changing texture and color.',
                example: 'Egg whites turning from clear to white, meat browning',
                tip: 'Different proteins denature at different temperatures',
                pixelArt: '🥚🔥'
            },
            'gelatinization': {
                name: 'Starch Gelatinization',
                description: 'Starch granules absorb water and swell when heated, thickening liquids.',
                example: 'Gravy, pudding, risotto creaminess',
                tip: 'Use cold liquid for slurry, hot for roux',
                pixelArt: '🌾💧'
            },
            'caramelization': {
                name: 'Caramelization',
                description: 'The browning of sugar at high temperatures (above 320°F/160°C).',
                example: 'Caramel sauce, crème brûlée top',
                tip: 'Don\'t stir - swirl the pan instead',
                pixelArt: '🍬🔥'
            },
            'osmosis': {
                name: 'Osmosis in Cooking',
                description: 'Salt draws moisture out of cells through the process of osmosis.',
                example: 'Brining meat, salting eggplant, curing fish',
                tip: 'Salt draws out moisture, sugar draws it back in',
                pixelArt: '🧂💧'
            },
            'acid_denaturation': {
                name: 'Acid Denaturation',
                description: 'Acids can cook proteins without heat, as in ceviche or pickling.',
                example: 'Ceviche, pickled vegetables, buttermilk marinades',
                tip: 'Citrus juice works for no-heat \"cooking\"',
                pixelArt: '🍋⚡'
            }
        };
    }

    analyzeRecipe(recipe) {
        const scientificSteps = [];
        
        for (const step of recipe.instructions) {
            const appliedConcepts = [];
            
            for (const [key, concept] of Object.entries(this.scientificConcepts)) {
                if (this.stepMatchesConcept(step.instruction, key)) {
                    appliedConcepts.push(concept);
                }
            }
            
            if (appliedConcepts.length > 0) {
                scientificSteps.push({
                    step: step.stepNumber,
                    instruction: step.instruction,
                    science: appliedConcepts
                });
            }
        }
        
        return scientificSteps;
    }

    stepMatchesConcept(instruction, conceptKey) {
        const keywords = {
            'maillard_reaction': ['brown', 'sear', 'golden', 'crust', 'roast'],
            'emulsification': ['whisk', 'combine oil', 'mayonnaise', 'sauce'],
            'denaturation': ['egg white', 'cook until set', 'curdle'],
            'gelatinization': ['thicken', 'roux', 'slurry', 'starch'],
            'caramelization': ['caramel', 'brown sugar', 'melt sugar'],
            'osmosis': ['brine', 'salt', 'marinate', 'cure'],
            'acid_denaturation': ['lemon', 'lime', 'vinegar', 'ceviche', 'pickle']
        };
        
        const stepLower = instruction.toLowerCase();
        const conceptKeywords = keywords[conceptKey] || [];
        
        return conceptKeywords.some(keyword => stepLower.includes(keyword));
    }

    getExplanationForIngredient(ingredient) {
        const ingredientScience = {
            'egg': {
                concept: 'denaturation',
                note: 'Eggs are mostly protein and water. Heat causes proteins to unfold and bond together, turning liquid to solid.'
            },
            'flour': {
                concept: 'gelatinization',
                note: 'Flour contains starch granules. When heated with liquid, they absorb water and swell, thickening mixtures.'
            },
            'sugar': {
                concept: 'caramelization',
                note: 'Sugar molecules break down and recombine at high heat, creating hundreds of new flavor compounds.'
            },
            'meat': {
                concept: 'maillard_reaction',
                note: 'The proteins and sugars in meat react at high heat to create the brown crust and savory flavor.'
            }
        };
        
        return ingredientScience[ingredient.toLowerCase()] || null;
    }

    generateScienceFlashcard(concept) {
        const data = this.scientificConcepts[concept];
        if (!data) return null;

        return {
            title: `🔬 ${data.name}`,
            explanation: data.description,
            example: data.example,
            proTip: data.tip,
            temperature: data.temperature,
            pixelArt: data.pixelArt
        };
    }

    /**
     * Fetch a concept from the backend and merge any new fields into the
     * local knowledge base. Falls back silently if the backend is offline.
     */
    async enrichFromBackend(concept) {
        try {
            const data = await DigInAPI.getFoodScience(concept);
            if (data && !data.error) {
                const key = concept.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
                this.scientificConcepts[key] = {
                    ...this.scientificConcepts[key],
                    name:        data.name        || this.scientificConcepts[key]?.name,
                    description: data.description || this.scientificConcepts[key]?.description,
                    example:     (data.examples   || []).join(', ') || this.scientificConcepts[key]?.example,
                    tip:         (data.tips        || [])[0]        || this.scientificConcepts[key]?.tip,
                    temperature: data.temperature  || this.scientificConcepts[key]?.temperature,
                };
            }
            return this.scientificConcepts[concept.toLowerCase().replace(/\s+/g, '_')] || null;
        } catch (_) {
            return this.scientificConcepts[concept] || null;
        }
    }
}