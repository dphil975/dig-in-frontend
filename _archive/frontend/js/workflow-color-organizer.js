/**
 * Dig In Workflow Color Organizer
 * Uses color theory to organize cooking steps
 * Warm colors = active cooking, Cool colors = prep/cleanup
 */

class WorkflowColorOrganizer {
    constructor(colorEngine) {
        this.colorEngine = colorEngine;
        this.workflowSteps = [];
    }

    /**
     * Organize recipe steps by color temperature
     * Creates a visual workflow that's easy to follow
     */
    organizeRecipeByColor(recipe) {
        const organized = {
            preparation: [],
            activeCooking: [],
            finishing: [],
            plating: [],
            cleanup: []
        };
        
        for (const step of recipe.instructions) {
            const stepLower = step.instruction.toLowerCase();
            
            // Categorize by keywords
            if (stepLower.includes('chop') || stepLower.includes('dice') || 
                stepLower.includes('slice') || stepLower.includes('prep') ||
                stepLower.includes('measure') || stepLower.includes('gather')) {
                organized.preparation.push({
                    ...step,
                    workflowColor: this.colorEngine.workflowColors.prep
                });
            }
            else if (stepLower.includes('fry') || stepLower.includes('sauté') ||
                     stepLower.includes('sear') || stepLower.includes('boil') ||
                     stepLower.includes('simmer') || stepLower.includes('bake') ||
                     stepLower.includes('roast') || stepLower.includes('grill')) {
                organized.activeCooking.push({
                    ...step,
                    workflowColor: this.colorEngine.workflowColors.cook
                });
            }
            else if (stepLower.includes('taste') || stepLower.includes('season') ||
                     stepLower.includes('adjust') || stepLower.includes('finish')) {
                organized.finishing.push({
                    ...step,
                    workflowColor: this.colorEngine.workflowColors.assemble
                });
            }
            else if (stepLower.includes('plate') || stepLower.includes('serve') ||
                     stepLower.includes('garnish') || stepLower.includes('present')) {
                organized.plating.push({
                    ...step,
                    workflowColor: this.colorEngine.workflowColors.serve
                });
            }
            else {
                organized.cleanup.push({
                    ...step,
                    workflowColor: this.colorEngine.workflowColors.cleanup
                });
            }
        }
        
        return organized;
    }

    /**
     * Generate color-coded flashcard sequence
     * Each card has a color based on its workflow stage
     */
    generateColorCodedFlashcards(organizedRecipe) {
        const flashcards = [];
        let order = 1;
        
        // Preparation steps (cool colors - focus)
        for (const step of organizedRecipe.preparation) {
            flashcards.push({
                type: 'prep',
                color: step.workflowColor.color,
                psychology: step.workflowColor.psychology,
                step: step,
                order: order++,
                visualHint: this.getVisualHint('prep')
            });
        }
        
        // Active cooking steps (warm colors - energy)
        for (const step of organizedRecipe.activeCooking) {
            flashcards.push({
                type: 'cook',
                color: step.workflowColor.color,
                psychology: step.workflowColor.psychology,
                step: step,
                order: order++,
                visualHint: this.getVisualHint('cook')
            });
        }
        
        // Finishing steps (creative colors)
        for (const step of organizedRecipe.finishing) {
            flashcards.push({
                type: 'finish',
                color: step.workflowColor.color,
                psychology: step.workflowColor.psychology,
                step: step,
                order: order++,
                visualHint: this.getVisualHint('finish')
            });
        }
        
        // Plating steps (excitement colors)
        for (const step of organizedRecipe.plating) {
            flashcards.push({
                type: 'plate',
                color: step.workflowColor.color,
                psychology: step.workflowColor.psychology,
                step: step,
                order: order++,
                visualHint: this.getVisualHint('plate')
            });
        }
        
        return flashcards;
    }

    getVisualHint(stepType) {
        const hints = {
            'prep': {
                icon: '🔪',
                colorHint: 'Green = fresh ingredients, focus time',
                timer: null
            },
            'cook': {
                icon: '🔥',
                colorHint: 'Orange/Red = high energy, pay attention',
                timer: true
            },
            'finish': {
                icon: '✨',
                colorHint: 'Purple = creative touch, taste test',
                timer: null
            },
            'plate': {
                icon: '🍽️',
                colorHint: 'Red = excitement, final presentation',
                timer: null
            }
        };
        return hints[stepType] || hints.prep;
    }

    /**
     * Explain color psychology to user
     * Educational component about why colors are used
     */
    explainColorPsychology(workflowType) {
        const explanations = {
            'prep': {
                title: '🧘 PREPARATION ZONE',
                color: '#4CAF50',
                psychology: 'Green represents freshness, growth, and focus.',
                why: 'Green lowers anxiety and helps with concentration. Perfect for careful ingredient prep!',
                tip: 'Take your time here. Good prep leads to smooth cooking.'
            },
            'cook': {
                title: '🔥 ACTIVE COOKING ZONE',
                color: '#FF9800',
                psychology: 'Orange represents energy, warmth, and excitement.',
                why: 'Warm colors increase heart rate and alertness. Perfect for high-heat cooking!',
                tip: 'Stay present. The heat won\'t wait for you.'
            },
            'finish': {
                title: '✨ FINISHING ZONE',
                color: '#9C27B0',
                psychology: 'Purple represents creativity, magic, and intuition.',
                why: 'Purple engages the creative part of your brain for those final touches!',
                tip: 'Taste as you go. Adjust seasoning with confidence.'
            },
            'plate': {
                title: '🎨 PLATING ZONE',
                color: '#F44336',
                psychology: 'Red represents excitement, passion, and energy.',
                why: 'Red creates urgency and excitement for the final reveal!',
                tip: 'Presentation matters. You eat with your eyes first.'
            }
        };
        
        return explanations[workflowType];
    }
}