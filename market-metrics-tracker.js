/**
 * Market Metrics Tracker
 * Tracks global recipe market trends, at-home cooking behavior, food discovery patterns
 */

class MarketMetricsTracker {
    constructor() {
        this.marketData = this.loadMarketData();
        this.initializeMarketTracking();
    }

    /**
     * Load market data from storage
     */
    loadMarketData() {
        const saved = localStorage.getItem('dig_in_market_data');
        if (saved) {
            return JSON.parse(saved);
        }

        return {
            globalRecipeMarket: {
                countriesRepresented: 0,
                countryCuisineViews: {}, // {country: count}
                cuisinePopularity: {}, // {cuisine: count}
                totalRecipesViewed: 0,
                viewsByCountry: {}, // {country: [recipeIds]}
                topCountries: [] // [{country, views, percentage}]
            },
            athomesCookingTrend: {
                recipeSavesIntent: 0, // Users who save recipes (intent to cook)
                recipesCompleted: 0, // Users who actually cook
                barcodeScanActivity: 0, // Grocery shopping indicator
                groceryShoppingDays: [], // Days with barcode scans
                mealPrepPatterns: {}, // {dayOfWeek: avgScans}
                cookingVsInspiration: 0 // ratio of completed to viewed
            },
            foodDiscoveryMarket: {
                usersExploringNewCuisines: 0, // Users outside comfort zone
                cuisinesPerUser: {}, // {userId: [cuisines]}
                newCuisineAdoptionRate: 0, // % month-over-month
                cuisineExplorationScore: {}, // {userId: score 0-100}
                firstTimeCountryViews: 0, // Total first-time country views
                crossCulturalAdoption: {} // {cuisine: adoptionRate}
            },
            timeSeriesData: {
                dailyMetrics: {}, // {date: {marketOpportunity data}}
                weeklyMetrics: {}, // {week: {aggregated data}}
                monthlyMetrics: {} // {month: {aggregated data}}
            }
        };
    }

    /**
     * Initialize market tracking
     */
    initializeMarketTracking() {
        // Initialize country/cuisine data from recipes
        if (window.recipes && Array.isArray(window.recipes)) {
            const countries = new Set();
            const cuisines = new Set();

            window.recipes.forEach(recipe => {
                if (recipe.country) countries.add(recipe.country);
                if (recipe.cuisine) cuisines.add(recipe.cuisine);
            });

            this.marketData.globalRecipeMarket.countriesRepresented = countries.size;
            countries.forEach(country => {
                this.marketData.globalRecipeMarket.countryCuisineViews[country] = 0;
            });
            cuisines.forEach(cuisine => {
                this.marketData.globalRecipeMarket.cuisinePopularity[cuisine] = 0;
            });

            this.saveMarketData();
        }
    }

    /**
     * Track recipe view for market metrics
     */
    trackRecipeViewMarket(recipeId, recipeName, country, cuisine) {
        // Global recipe market
        this.marketData.globalRecipeMarket.totalRecipesViewed++;

        if (country) {
            this.marketData.globalRecipeMarket.countryCuisineViews[country] =
                (this.marketData.globalRecipeMarket.countryCuisineViews[country] || 0) + 1;

            if (!this.marketData.globalRecipeMarket.viewsByCountry[country]) {
                this.marketData.globalRecipeMarket.viewsByCountry[country] = [];
            }
            if (!this.marketData.globalRecipeMarket.viewsByCountry[country].includes(recipeId)) {
                this.marketData.globalRecipeMarket.viewsByCountry[country].push(recipeId);
            }
        }

        if (cuisine) {
            this.marketData.globalRecipeMarket.cuisinePopularity[cuisine] =
                (this.marketData.globalRecipeMarket.cuisinePopularity[cuisine] || 0) + 1;
        }

        // Track first-time cuisine exploration
        this.trackCuisineExploration(country, cuisine);

        this.updateTopCountries();
        this.saveMarketData();
    }

    /**
     * Track recipe save (intent to cook at home)
     */
    trackRecipeSaveMarket(recipeId, userId, isSaving) {
        if (isSaving) {
            this.marketData.athomesCookingTrend.recipeSavesIntent++;
        }

        // Calculate cooking intent rate
        if (window.userMetricsTracker) {
            const metrics = window.userMetricsTracker.getUserMetrics();
            if (metrics.recipes.totalRecipesViewed > 0) {
                this.marketData.athomesCookingTrend.cookingVsInspiration =
                    (metrics.recipes.totalRecipesSaved / metrics.recipes.totalRecipesViewed) * 100;
            }
        }

        this.saveMarketData();
    }

    /**
     * Track recipe completion (actually cooking at home)
     */
    trackRecipeCompletionMarket(recipeId, userId) {
        this.marketData.athomesCookingTrend.recipesCompleted++;
        this.saveMarketData();
    }

    /**
     * Track barcode scan (grocery shopping / at-home cooking indicator)
     */
    trackBarcodeActivityMarket() {
        this.marketData.athomesCookingTrend.barcodeScanActivity++;

        const today = new Date().toDateString();
        if (!this.marketData.athomesCookingTrend.groceryShoppingDays.includes(today)) {
            this.marketData.athomesCookingTrend.groceryShoppingDays.push(today);
        }

        // Track daily patterns
        const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
        this.marketData.athomesCookingTrend.mealPrepPatterns[dayOfWeek] =
            (this.marketData.athomesCookingTrend.mealPrepPatterns[dayOfWeek] || 0) + 1;

        this.saveMarketData();
    }

    /**
     * Track cuisine exploration (food discovery market)
     */
    trackCuisineExploration(country, cuisine) {
        const userId = window.userMetricsTracker?.userData?.userId || 'unknown';

        // Initialize user's cuisine set if needed
        if (!this.marketData.foodDiscoveryMarket.cuisinesPerUser[userId]) {
            this.marketData.foodDiscoveryMarket.cuisinesPerUser[userId] = [];
        }

        // Check if this is a new cuisine for user
        const isNewCuisine = !this.marketData.foodDiscoveryMarket.cuisinesPerUser[userId].includes(cuisine);

        if (isNewCuisine && cuisine) {
            this.marketData.foodDiscoveryMarket.cuisinesPerUser[userId].push(cuisine);
            this.marketData.foodDiscoveryMarket.firstTimeCountryViews++;

            // Mark user as exploring new cuisines
            if (this.marketData.foodDiscoveryMarket.cuisinesPerUser[userId].length > 3) {
                this.marketData.foodDiscoveryMarket.usersExploringNewCuisines++;
            }
        }

        // Update cross-cultural adoption
        if (cuisine) {
            this.marketData.foodDiscoveryMarket.crossCulturalAdoption[cuisine] =
                (this.marketData.foodDiscoveryMarket.crossCulturalAdoption[cuisine] || 0) + 1;
        }

        this.updateExplorationScores();
        this.saveMarketData();
    }

    /**
     * Update exploration scores (0-100 scale)
     */
    updateExplorationScores() {
        Object.keys(this.marketData.foodDiscoveryMarket.cuisinesPerUser).forEach(userId => {
            const cuisineCount = this.marketData.foodDiscoveryMarket.cuisinesPerUser[userId].length;
            const baseScore = Math.min((cuisineCount / 10) * 100, 100); // 0-100 based on diversity
            this.marketData.foodDiscoveryMarket.cuisineExplorationScore[userId] = Math.round(baseScore);
        });
    }

    /**
     * Update monthly adoption rate
     */
    updateAdoptionRate() {
        const today = new Date();
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Calculate new cuisines discovered this month
        const newCuisinesThisMonth = Object.values(this.marketData.foodDiscoveryMarket.cuisinesPerUser)
            .reduce((sum, cuisines) => sum + cuisines.length, 0);

        const previousMonth = this.marketData.timeSeriesData.monthlyMetrics[`${monthAgo.getFullYear()}-${String(monthAgo.getMonth() + 1).padStart(2, '0')}`];

        if (previousMonth) {
            const oldRate = previousMonth.firstTimeCountryViews || 1;
            this.marketData.foodDiscoveryMarket.newCuisineAdoptionRate =
                Math.round(((newCuisinesThisMonth - oldRate) / oldRate) * 100);
        }

        this.saveMarketData();
    }

    /**
     * Update top countries list
     */
    updateTopCountries() {
        const countries = Object.entries(this.marketData.globalRecipeMarket.countryCuisineViews)
            .map(([country, count]) => ({
                country,
                views: count,
                percentage: this.marketData.globalRecipeMarket.totalRecipesViewed > 0
                    ? Math.round((count / this.marketData.globalRecipeMarket.totalRecipesViewed) * 100)
                    : 0
            }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10);

        this.marketData.globalRecipeMarket.topCountries = countries;
    }

    /**
     * Get market metrics summary
     */
    getMarketMetrics() {
        const userCount = Object.keys(this.marketData.foodDiscoveryMarket.cuisinesPerUser).length;
        const avgCuisinesPerUser = userCount > 0
            ? (Object.values(this.marketData.foodDiscoveryMarket.cuisinesPerUser)
                .reduce((sum, cuisines) => sum + cuisines.length, 0) / userCount).toFixed(1)
            : 0;

        const exploringUsers = Object.values(this.marketData.foodDiscoveryMarket.cuisineExplorationScore)
            .filter(score => score > 30).length;

        return {
            globalRecipeMarket: {
                countriesRepresented: this.marketData.globalRecipeMarket.countriesRepresented,
                totalRecipesViewed: this.marketData.globalRecipeMarket.totalRecipesViewed,
                topCountries: this.marketData.globalRecipeMarket.topCountries,
                topCuisines: Object.entries(this.marketData.globalRecipeMarket.cuisinePopularity)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([cuisine, count]) => ({ cuisine, count }))
            },
            athomesCookingTrend: {
                recipeSavesIntent: this.marketData.athomesCookingTrend.recipeSavesIntent,
                recipesCompleted: this.marketData.athomesCookingTrend.recipesCompleted,
                barcodeScanActivity: this.marketData.athomesCookingTrend.barcodeScanActivity,
                groceryShoppingDays: this.marketData.athomesCookingTrend.groceryShoppingDays.length,
                cookingCompletionRate: this.marketData.athomesCookingTrend.recipesCompleted > 0
                    ? Math.round((this.marketData.athomesCookingTrend.recipesCompleted /
                        this.marketData.athomesCookingTrend.recipeSavesIntent) * 100)
                    : 0,
                mealPrepPatterns: this.marketData.athomesCookingTrend.mealPrepPatterns
            },
            foodDiscoveryMarket: {
                usersExploringNewCuisines: exploringUsers,
                avgCuisinesPerUser: parseFloat(avgCuisinesPerUser),
                newCuisineAdoptionRate: this.marketData.foodDiscoveryMarket.newCuisineAdoptionRate + '%',
                firstTimeCountryViews: this.marketData.foodDiscoveryMarket.firstTimeCountryViews,
                topAdoptedCuisines: Object.entries(this.marketData.foodDiscoveryMarket.crossCulturalAdoption)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([cuisine, count]) => ({ cuisine, count }))
            }
        };
    }

    /**
     * Record daily snapshot for trend analysis
     */
    recordDailySnapshot() {
        const today = new Date().toDateString();
        this.marketData.timeSeriesData.dailyMetrics[today] = this.getMarketMetrics();
        this.saveMarketData();
    }

    /**
     * Save market data
     */
    saveMarketData() {
        localStorage.setItem('dig_in_market_data', JSON.stringify(this.marketData));
    }

    /**
     * Export market data
     */
    exportMarketData() {
        const metrics = this.getMarketMetrics();
        const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `market-metrics-${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Global instance
const marketMetricsTracker = new MarketMetricsTracker();

// Record daily snapshot
window.addEventListener('load', () => {
    marketMetricsTracker.recordDailySnapshot();
});

// Expose to window
window.marketMetricsTracker = marketMetricsTracker;
