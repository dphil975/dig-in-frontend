/**
 * Dig In Save System
 * Manages saved recipes, collections, and user progress
 */

class SaveSystem {
    constructor() {
        this.storageKey = 'digInData';
        this.loadData();
    }

    loadData() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            this.data = JSON.parse(saved);
        } else {
            this.data = {
                savedRecipes: [],
                recipeRatings: {},
                cookingHistory: [],
                unlockedCountries: ['japan', 'italy', 'mexico'],
                achievements: {},
                totalRecipesCooked: 0,
                joinDate: new Date().toISOString()
            };
            this.saveData();
        }
    }

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    saveRecipe(recipeId) {
        if (!this.data.savedRecipes.includes(recipeId)) {
            this.data.savedRecipes.push(recipeId);
            this.saveData();
            this.updateAchievements();
            return true;
        }
        return false;
    }

    unsaveRecipe(recipeId) {
        this.data.savedRecipes = this.data.savedRecipes.filter(id => id !== recipeId);
        this.saveData();
        return true;
    }

    isSaved(recipeId) {
        return this.data.savedRecipes.includes(recipeId);
    }

    rateRecipe(recipeId, rating) {
        this.data.recipeRatings[recipeId] = rating;
        this.saveData();
    }

    getRating(recipeId) {
        return this.data.recipeRatings[recipeId] || 0;
    }

    logCookedRecipe(recipeId) {
        this.data.cookingHistory.push({
            recipeId,
            timestamp: new Date().toISOString()
        });
        this.data.totalRecipesCooked++;
        this.saveData();
        this.checkUnlockConditions();
    }

    checkUnlockConditions() {
        // Unlock countries based on recipes cooked
        if (this.data.totalRecipesCooked >= 3 && !this.data.unlockedCountries.includes('france')) {
            this.data.unlockedCountries.push('france');
        }
        if (this.data.totalRecipesCooked >= 6 && !this.data.unlockedCountries.includes('china')) {
            this.data.unlockedCountries.push('china');
        }
        if (this.data.totalRecipesCooked >= 9 && !this.data.unlockedCountries.includes('india')) {
            this.data.unlockedCountries.push('india');
        }
        if (this.data.totalRecipesCooked >= 12 && !this.data.unlockedCountries.includes('thailand')) {
            this.data.unlockedCountries.push('thailand');
        }
        if (this.data.totalRecipesCooked >= 15 && !this.data.unlockedCountries.includes('greece')) {
            this.data.unlockedCountries.push('greece');
        }
        this.saveData();
    }

    updateAchievements() {
        const achievements = {
            'first_save': this.data.savedRecipes.length >= 1,
            'five_saves': this.data.savedRecipes.length >= 5,
            'ten_saves': this.data.savedRecipes.length >= 10,
            'twenty_saves': this.data.savedRecipes.length >= 20,
            'world_traveler': this.data.unlockedCountries.length >= 5,
            'master_chef': this.data.totalRecipesCooked >= 25
        };
        
        this.data.achievements = achievements;
        this.saveData();
        
        // Dispatch achievement event
        const event = new CustomEvent('achievementUpdate', { detail: achievements });
        document.dispatchEvent(event);
    }

    getSavedRecipes() {
        return this.data.savedRecipes;
    }

    getCookingStats() {
        return {
            totalSaved: this.data.savedRecipes.length,
            totalCooked: this.data.totalRecipesCooked,
            unlockedCountries: this.data.unlockedCountries.length,
            joinDate: this.data.joinDate
        };
    }

    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dig-in-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            this.data = { ...this.data, ...imported };
            this.saveData();
            return true;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    }
}