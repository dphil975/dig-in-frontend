/**
 * Dig In Smart Pairing Intelligence
 * AI that learns which foods and drinks pair well together
 */

class PairingIntelligence {
    constructor() {
        this.pairingDatabase = this.loadPairingDatabase();
        this.scanHistory = this.loadScanHistory();
        this.userPreferences = this.loadUserPreferences();
    }

    /**
     * Load pairing database from storage
     */
    loadPairingDatabase() {
        const saved = localStorage.getItem('dig_in_pairing_db');
        return saved ? JSON.parse(saved) : {
            foodItems: {},
            drinkItems: {},
            pairings: {},
            mealSequences: []
        };
    }

    /**
     * Load scan history
     */
    loadScanHistory() {
        const saved = localStorage.getItem('dig_in_scan_history');
        return saved ? JSON.parse(saved) : [];
    }

    /**
     * Load user preferences
     */
    loadUserPreferences() {
        const saved = localStorage.getItem('dig_in_preferences');
        return saved ? JSON.parse(saved) : {
            calorieGoal: 2000,
            proteinGoal: 50,
            preferredFoods: [],
            dislikedCombos: []
        };
    }

    /**
     * Record a scanned item
     */
    recordScan(item, timestamp = new Date()) {
        const scanRecord = {
            id: Date.now(),
            name: item.name,
            type: item.type, // 'food' or 'drink'
            calories: item.calories || 0,
            protein: item.protein || 0,
            carbs: item.carbs || 0,
            fat: item.fat || 0,
            timestamp: timestamp,
            mealType: item.mealType // breakfast, lunch, dinner, snack
        };

        this.scanHistory.push(scanRecord);
        this.saveScanHistory();

        // Update pairing database
        this.updatePairingDatabase(scanRecord);

        // Learn patterns
        this.learnPairingPatterns();

        return scanRecord;
    }

    /**
     * Update pairing database with new item
     */
    updatePairingDatabase(item) {
        const itemKey = item.name.toLowerCase();

        if (item.type === 'food') {
            if (!this.pairingDatabase.foodItems[itemKey]) {
                this.pairingDatabase.foodItems[itemKey] = {
                    name: item.name,
                    scans: 0,
                    calories: item.calories,
                    pairedDrinks: {}
                };
            }
            this.pairingDatabase.foodItems[itemKey].scans++;

            // Find if drink was scanned in same meal
            const recentScans = this.scanHistory.filter(s =>
                Math.abs(s.timestamp - item.timestamp) < 1800000 && // 30 minutes
                s.mealType === item.mealType
            );

            recentScans.forEach(scan => {
                if (scan.type === 'drink') {
                    const drinkKey = scan.name.toLowerCase();
                    if (!this.pairingDatabase.foodItems[itemKey].pairedDrinks[drinkKey]) {
                        this.pairingDatabase.foodItems[itemKey].pairedDrinks[drinkKey] = 0;
                    }
                    this.pairingDatabase.foodItems[itemKey].pairedDrinks[drinkKey]++;
                }
            });
        } else if (item.type === 'drink') {
            if (!this.pairingDatabase.drinkItems[itemKey]) {
                this.pairingDatabase.drinkItems[itemKey] = {
                    name: item.name,
                    scans: 0,
                    pairedFoods: {}
                };
            }
            this.pairingDatabase.drinkItems[itemKey].scans++;

            // Track what food this drink was paired with
            const recentFood = this.scanHistory
                .reverse()
                .find(s =>
                    s.type === 'food' &&
                    Math.abs(s.timestamp - item.timestamp) < 1800000 &&
                    s.mealType === item.mealType
                );

            if (recentFood) {
                const foodKey = recentFood.name.toLowerCase();
                if (!this.pairingDatabase.drinkItems[itemKey].pairedFoods[foodKey]) {
                    this.pairingDatabase.drinkItems[itemKey].pairedFoods[foodKey] = 0;
                }
                this.pairingDatabase.drinkItems[itemKey].pairedFoods[foodKey]++;
            }
        }

        this.savePairingDatabase();
    }

    /**
     * Learn pairing patterns from meal sequences
     */
    learnPairingPatterns() {
        // Group scans by meal
        const mealGroups = {};

        this.scanHistory.forEach(scan => {
            const mealKey = `${scan.mealType}-${new Date(scan.timestamp).toDateString()}`;
            if (!mealGroups[mealKey]) {
                mealGroups[mealKey] = [];
            }
            mealGroups[mealKey].push(scan);
        });

        // Analyze sequences
        Object.values(mealGroups).forEach(meal => {
            const foods = meal.filter(s => s.type === 'food').map(s => s.name);
            const drinks = meal.filter(s => s.type === 'drink').map(s => s.name);

            if (foods.length > 0 && drinks.length > 0) {
                const sequence = {
                    foods: foods,
                    drinks: drinks,
                    timestamp: new Date()
                };
                this.pairingDatabase.mealSequences.push(sequence);
            }
        });

        this.savePairingDatabase();
    }

    /**
     * Get pairing recommendations for a food item
     */
    getRecommendedDrinks(foodName) {
        const foodKey = foodName.toLowerCase();
        const food = this.pairingDatabase.foodItems[foodKey];

        if (!food || Object.keys(food.pairedDrinks).length === 0) {
            return this.getDefaultDrinkPairings(foodName);
        }

        // Sort drinks by frequency
        const drinks = Object.entries(food.pairedDrinks)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([drink]) => drink);

        return drinks.map(drinkKey => {
            const drinkData = this.pairingDatabase.drinkItems[drinkKey];
            return {
                name: drinkData ? drinkData.name : drinkKey,
                score: this.calculatePairingScore(foodName, drinkKey)
            };
        });
    }

    /**
     * Get pairing recommendations for a drink
     */
    getRecommendedFoods(drinkName) {
        const drinkKey = drinkName.toLowerCase();
        const drink = this.pairingDatabase.drinkItems[drinkKey];

        if (!drink || Object.keys(drink.pairedFoods).length === 0) {
            return this.getDefaultFoodPairings(drinkName);
        }

        // Sort foods by frequency
        const foods = Object.entries(drink.pairedFoods)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([food]) => food);

        return foods.map(foodKey => {
            const foodData = this.pairingDatabase.foodItems[foodKey];
            return {
                name: foodData ? foodData.name : foodKey,
                score: this.calculatePairingScore(foodKey, drinkName)
            };
        });
    }

    /**
     * Calculate pairing score (0-100)
     */
    calculatePairingScore(foodKey, drinkKey) {
        const food = this.pairingDatabase.foodItems[foodKey.toLowerCase()];
        const drink = this.pairingDatabase.drinkItems[drinkKey.toLowerCase()];

        if (!food || !drink) return 50; // Default neutral score

        const foodDrinkCount = food.pairedDrinks[drinkKey.toLowerCase()] || 0;
        const drinkFoodCount = drink.pairedFoods[foodKey.toLowerCase()] || 0;

        const totalPairings = foodDrinkCount + drinkFoodCount;
        const score = Math.min(totalPairings * 10, 100);

        return score;
    }

    /**
     * Default drink pairings (until we learn user preferences)
     */
    getDefaultDrinkPairings(foodName) {
        const defaults = {
            'coffee': ['Water', 'Black Coffee', 'Espresso'],
            'sandwich': ['Iced Tea', 'Lemonade', 'Water'],
            'pasta': ['Red Wine', 'White Wine', 'Water'],
            'burger': ['Iced Cola', 'Lager Beer', 'Root Beer'],
            'salad': ['Iced Tea', 'Sparkling Water', 'Lemonade'],
            'fish': ['White Wine', 'Light Beer', 'Sparkling Water']
        };

        // Find closest match
        for (const [key, drinks] of Object.entries(defaults)) {
            if (foodName.toLowerCase().includes(key)) {
                return drinks.map(d => ({ name: d, score: 65 }));
            }
        }

        return [
            { name: 'Water', score: 50 },
            { name: 'Coffee', score: 45 }
        ];
    }

    /**
     * Default food pairings for drinks
     */
    getDefaultFoodPairings(drinkName) {
        const defaults = {
            'wine': ['Cheese', 'Pasta', 'Steak'],
            'beer': ['Pizza', 'Burger', 'Wings'],
            'coffee': ['Pastry', 'Toast', 'Oatmeal'],
            'tea': ['Toast', 'Cookies', 'Sandwich'],
            'water': ['Any', 'Everything', 'Anything']
        };

        for (const [key, foods] of Object.entries(defaults)) {
            if (drinkName.toLowerCase().includes(key)) {
                return foods.map(f => ({ name: f, score: 65 }));
            }
        }

        return [
            { name: 'Any Food', score: 50 }
        ];
    }

    /**
     * Get nutrition analysis for today
     */
    getTodayNutrition() {
        const today = new Date().toDateString();
        const todayScans = this.scanHistory.filter(s =>
            new Date(s.timestamp).toDateString() === today
        );

        return {
            totalCalories: todayScans.reduce((sum, s) => sum + s.calories, 0),
            totalProtein: todayScans.reduce((sum, s) => sum + s.protein, 0),
            totalCarbs: todayScans.reduce((sum, s) => sum + s.carbs, 0),
            totalFat: todayScans.reduce((sum, s) => sum + s.fat, 0),
            mealCount: new Set(todayScans.map(s => s.mealType)).size,
            items: todayScans
        };
    }

    /**
     * Generate nutrition insights
     */
    getNutritionInsights() {
        const today = this.getTodayNutrition();
        const insights = [];

        if (today.totalCalories > this.userPreferences.calorieGoal) {
            insights.push(`⚠️ Exceeded calorie goal: ${today.totalCalories} / ${this.userPreferences.calorieGoal}`);
        } else if (today.totalCalories > this.userPreferences.calorieGoal * 0.8) {
            insights.push(`📊 Near calorie goal: ${today.totalCalories} / ${this.userPreferences.calorieGoal}`);
        } else {
            insights.push(`✅ Under calorie goal: ${today.totalCalories} / ${this.userPreferences.calorieGoal}`);
        }

        if (today.totalProtein < this.userPreferences.proteinGoal) {
            insights.push(`💪 Consider more protein (${today.totalProtein}g)`);
        }

        return insights;
    }

    /**
     * Get most popular pairings
     */
    getMostPopularPairings() {
        const pairings = [];

        Object.entries(this.pairingDatabase.foodItems).forEach(([foodKey, food]) => {
            Object.entries(food.pairedDrinks).forEach(([drinkKey, count]) => {
                if (count >= 2) { // Only show pairings used twice+
                    pairings.push({
                        food: food.name,
                        drink: this.pairingDatabase.drinkItems[drinkKey]?.name || drinkKey,
                        count: count,
                        score: this.calculatePairingScore(foodKey, drinkKey)
                    });
                }
            });
        });

        return pairings.sort((a, b) => b.score - a.score).slice(0, 5);
    }

    /**
     * Save pairing database
     */
    savePairingDatabase() {
        localStorage.setItem('dig_in_pairing_db', JSON.stringify(this.pairingDatabase));
    }

    /**
     * Save scan history
     */
    saveScanHistory() {
        localStorage.setItem('dig_in_scan_history', JSON.stringify(this.scanHistory));
    }

    /**
     * Save user preferences
     */
    saveUserPreferences() {
        localStorage.setItem('dig_in_preferences', JSON.stringify(this.userPreferences));
    }

    /**
     * Export all pairing data for analysis
     */
    exportData() {
        const data = {
            pairingDatabase: this.pairingDatabase,
            scanHistory: this.scanHistory,
            insights: this.getNutritionInsights(),
            topPairings: this.getMostPopularPairings(),
            exported: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dig-in-pairing-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Global instance
const pairingIntelligence = new PairingIntelligence();

// Expose to window
window.pairingIntelligence = pairingIntelligence;
