/**
 * Dig In User Metrics Tracker
 * Tracks signups, DAU/MAU, engagement time, recipe saves, return rate
 */

class UserMetricsTracker {
    constructor() {
        this.userData = this.loadUserData();
        this.sessionData = this.loadSessionData();
        this.recipeStats = this.loadRecipeStats();
        this.engagementData = this.loadEngagementData();
        this.initializeUser();
        this.trackSessionStart();
    }

    /**
     * Load user data from storage
     */
    loadUserData() {
        const saved = localStorage.getItem('dig_in_user_data');
        if (saved) {
            return JSON.parse(saved);
        }

        // New user
        const userId = this.generateUserId();
        const newUserData = {
            userId: userId,
            signupDate: new Date().toISOString(),
            firstVisit: new Date().toISOString(),
            lastVisit: new Date().toISOString(),
            isReturningUser: false,
            signupSource: 'organic', // organic, referral, paid, social
            country: this.getCountry(),
            deviceType: this.getDeviceType(),
            browser: this.getBrowser(),
            customProperties: {}
        };

        localStorage.setItem('dig_in_user_data', JSON.stringify(newUserData));
        return newUserData;
    }

    /**
     * Load session data
     */
    loadSessionData() {
        const saved = localStorage.getItem('dig_in_session_data');
        return saved ? JSON.parse(saved) : {
            sessions: [],
            totalSessions: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastSessionDate: null
        };
    }

    /**
     * Load recipe stats
     */
    loadRecipeStats() {
        const saved = localStorage.getItem('dig_in_recipe_stats');
        return saved ? JSON.parse(saved) : {
            totalRecipesViewed: 0,
            recipeSaves: {},
            totalSaves: 0,
            savedRecipes: [],
            viewedRecipes: [],
            completedRecipes: []
        };
    }

    /**
     * Load engagement data
     */
    loadEngagementData() {
        const saved = localStorage.getItem('dig_in_engagement_data');
        return saved ? JSON.parse(saved) : {
            totalEngagementTime: 0, // in seconds
            dailyEngagementTime: {}, // by date
            sessionEngagementTimes: [],
            avgSessionDuration: 0,
            features: {
                recipeBrowsing: 0,
                barcodeScan: 0,
                mealReminder: 0,
                recipeAdapt: 0,
                recipeMix: 0,
                analytics: 0
            }
        };
    }

    /**
     * Initialize user (check if returning)
     */
    initializeUser() {
        const lastVisit = new Date(this.userData.lastVisit);
        const today = new Date();
        const daysSinceVisit = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));

        // If more than 30 days, consider it a new signup chain
        if (daysSinceVisit > 30 && !this.userData.isReturningUser) {
            this.userData.isReturningUser = false;
        } else if (daysSinceVisit > 0) {
            this.userData.isReturningUser = true;
        }

        // Update last visit
        this.userData.lastVisit = today.toISOString();
        this.saveUserData();

        // Track metrics
        if (window.digInAnalytics) {
            window.digInAnalytics.track('user_initialized', {
                user_id: this.userData.userId,
                is_returning: this.userData.isReturningUser,
                days_since_visit: daysSinceVisit,
                signup_date: this.userData.signupDate
            });
        }
    }

    /**
     * Track session start
     */
    trackSessionStart() {
        const today = new Date().toDateString();
        const sessionStart = Date.now();

        const session = {
            sessionId: `session_${Date.now()}`,
            startTime: new Date().toISOString(),
            endTime: null,
            duration: 0,
            date: today,
            events: [],
            features: {
                recipeBrowsing: false,
                barcodeScan: false,
                mealReminder: false,
                recipeAdapt: false,
                recipeMix: false,
                analytics: false
            }
        };

        // Store current session
        localStorage.setItem('dig_in_current_session', JSON.stringify(session));

        // Track in analytics
        if (window.digInAnalytics) {
            window.digInAnalytics.track('session_start', {
                user_id: this.userData.userId,
                is_returning: this.userData.isReturningUser
            });
        }
    }

    /**
     * Track engagement time
     */
    trackEngagementTime(duration) {
        const today = new Date().toDateString();

        // Update daily engagement
        if (!this.engagementData.dailyEngagementTime[today]) {
            this.engagementData.dailyEngagementTime[today] = 0;
        }
        this.engagementData.dailyEngagementTime[today] += duration;
        this.engagementData.totalEngagementTime += duration;

        // Calculate average
        const sessionCount = this.sessionData.totalSessions || 1;
        this.engagementData.avgSessionDuration = Math.round(this.engagementData.totalEngagementTime / sessionCount);

        this.saveEngagementData();
    }

    /**
     * Track session end
     */
    trackSessionEnd() {
        const current = localStorage.getItem('dig_in_current_session');
        if (!current) return;

        const session = JSON.parse(current);
        session.endTime = new Date().toISOString();
        session.duration = Math.round((new Date() - new Date(session.startTime)) / 1000);

        // Add to sessions history
        this.sessionData.sessions.push(session);
        this.sessionData.totalSessions++;
        this.sessionData.lastSessionDate = session.date;

        // Calculate streaks
        this.updateStreaks();

        // Track engagement time
        this.trackEngagementTime(session.duration);
        this.saveSessionData();

        // Track feature usage
        Object.entries(session.features).forEach(([feature, used]) => {
            if (used) {
                this.engagementData.features[feature]++;
            }
        });

        this.saveEngagementData();

        // Track in analytics
        if (window.digInAnalytics) {
            window.digInAnalytics.track('session_end', {
                user_id: this.userData.userId,
                session_duration: session.duration,
                features_used: Object.keys(session.features).filter(f => session.features[f])
            });
        }

        // Clear current session
        localStorage.removeItem('dig_in_current_session');
    }

    /**
     * Update streaks
     */
    updateStreaks() {
        const dates = new Set(this.sessionData.sessions.map(s => s.date));
        const sortedDates = Array.from(dates).sort();

        let currentStreak = 1;
        let longestStreak = 1;

        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            const dayDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

            if (dayDiff === 1) {
                currentStreak++;
                longestStreak = Math.max(longestStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }

        this.sessionData.currentStreak = currentStreak;
        this.sessionData.longestStreak = longestStreak;
    }

    /**
     * Track recipe view
     */
    trackRecipeView(recipeId, recipeName) {
        if (!this.recipeStats.viewedRecipes.includes(recipeId)) {
            this.recipeStats.viewedRecipes.push(recipeId);
            this.recipeStats.totalRecipesViewed++;
        }

        // Update current session
        const current = localStorage.getItem('dig_in_current_session');
        if (current) {
            const session = JSON.parse(current);
            session.features.recipeBrowsing = true;
            localStorage.setItem('dig_in_current_session', JSON.stringify(session));
        }

        this.saveRecipeStats();
    }

    /**
     * Track recipe save/favorite
     */
    trackRecipeSave(recipeId, recipeName, isSaving) {
        if (isSaving) {
            if (!this.recipeStats.savedRecipes.includes(recipeId)) {
                this.recipeStats.savedRecipes.push(recipeId);
                this.recipeStats.totalSaves++;
            }
            this.recipeStats.recipeSaves[recipeId] = {
                name: recipeName,
                savedDate: new Date().toISOString(),
                completed: false
            };
        } else {
            const index = this.recipeStats.savedRecipes.indexOf(recipeId);
            if (index > -1) {
                this.recipeStats.savedRecipes.splice(index, 1);
                this.recipeStats.totalSaves--;
            }
            delete this.recipeStats.recipeSaves[recipeId];
        }

        this.saveRecipeStats();

        if (window.digInAnalytics) {
            window.digInAnalytics.track('recipe_save', {
                user_id: this.userData.userId,
                recipe_id: recipeId,
                recipe_name: recipeName,
                action: isSaving ? 'saved' : 'unsaved',
                total_saves: this.recipeStats.totalSaves
            });
        }
    }

    /**
     * Track recipe completion
     */
    trackRecipeCompletion(recipeId, recipeName) {
        if (!this.recipeStats.completedRecipes.includes(recipeId)) {
            this.recipeStats.completedRecipes.push(recipeId);
        }

        if (this.recipeStats.recipeSaves[recipeId]) {
            this.recipeStats.recipeSaves[recipeId].completed = true;
            this.recipeStats.recipeSaves[recipeId].completedDate = new Date().toISOString();
        }

        this.saveRecipeStats();

        if (window.digInAnalytics) {
            window.digInAnalytics.track('recipe_completed', {
                user_id: this.userData.userId,
                recipe_id: recipeId,
                recipe_name: recipeName
            });
        }
    }

    /**
     * Track feature usage
     */
    trackFeatureUsage(featureName) {
        // featureName: recipeBrowsing, barcodeScan, mealReminder, recipeAdapt, recipeMix, analytics

        if (this.engagementData.features[featureName] !== undefined) {
            this.engagementData.features[featureName]++;
        }

        // Update current session
        const current = localStorage.getItem('dig_in_current_session');
        if (current) {
            const session = JSON.parse(current);
            if (session.features[featureName] !== undefined) {
                session.features[featureName] = true;
            }
            localStorage.setItem('dig_in_current_session', JSON.stringify(session));
        }

        this.saveEngagementData();
    }

    /**
     * Calculate DAU/MAU metrics
     */
    getActiveUserMetrics() {
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        // DAU (Daily Active Users - today)
        const todayString = today.toDateString();
        const dau = this.sessionData.sessions.filter(s => s.date === todayString).length > 0 ? 1 : 0;

        // MAU (Monthly Active Users - last 30 days)
        const mau = new Set(
            this.sessionData.sessions
                .filter(s => new Date(s.date) >= thirtyDaysAgo)
                .map(s => s.date)
        ).size;

        return {
            dau: dau,
            mau: mau,
            totalSessions: this.sessionData.totalSessions,
            currentStreak: this.sessionData.currentStreak,
            longestStreak: this.sessionData.longestStreak
        };
    }

    /**
     * Calculate return rate
     */
    getReturnRate() {
        if (this.sessionData.totalSessions < 2) return 0;

        // Get unique dates with sessions
        const datesWithSessions = new Set(this.sessionData.sessions.map(s => s.date));
        const totalDates = datesWithSessions.size;

        // Days between signup and today
        const signupDate = new Date(this.userData.signupDate);
        const today = new Date();
        const daysSinceSignup = Math.ceil((today - signupDate) / (1000 * 60 * 60 * 24)) || 1;

        // Return rate: days with activity / days since signup
        const returnRate = Math.min(Math.round((totalDates / daysSinceSignup) * 100), 100);

        return returnRate;
    }

    /**
     * Get comprehensive user metrics
     */
    getUserMetrics() {
        const activeMetrics = this.getActiveUserMetrics();
        const returnRate = this.getReturnRate();
        const today = new Date().toDateString();
        const todayEngagement = this.engagementData.dailyEngagementTime[today] || 0;

        return {
            user: {
                userId: this.userData.userId,
                signupDate: this.userData.signupDate,
                isReturningUser: this.userData.isReturningUser,
                lastVisit: this.userData.lastVisit,
                country: this.userData.country,
                deviceType: this.userData.deviceType
            },
            activity: {
                dau: activeMetrics.dau,
                mau: activeMetrics.mau,
                totalSessions: activeMetrics.totalSessions,
                currentStreak: activeMetrics.currentStreak,
                longestStreak: activeMetrics.longestStreak,
                returnRate: returnRate + '%'
            },
            engagement: {
                todayEngagementTime: Math.round(todayEngagement / 60) + ' min',
                totalEngagementTime: Math.round(this.engagementData.totalEngagementTime / 60) + ' min',
                avgSessionDuration: this.engagementData.avgSessionDuration + ' sec',
                featureUsage: this.engagementData.features
            },
            recipes: {
                totalRecipesViewed: this.recipeStats.totalRecipesViewed,
                totalRecipesSaved: this.recipeStats.totalSaves,
                completedRecipes: this.recipeStats.completedRecipes.length,
                saveRate: this.recipeStats.totalRecipesViewed > 0
                    ? Math.round((this.recipeStats.totalSaves / this.recipeStats.totalRecipesViewed) * 100) + '%'
                    : '0%'
            }
        };
    }

    /**
     * Generate unique user ID
     */
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get country (basic browser detection)
     */
    getCountry() {
        // In production, would use IP geolocation API
        return 'Unknown';
    }

    /**
     * Get device type
     */
    getDeviceType() {
        const ua = navigator.userAgent;
        if (/mobile/i.test(ua)) return 'mobile';
        if (/tablet/i.test(ua)) return 'tablet';
        return 'desktop';
    }

    /**
     * Get browser
     */
    getBrowser() {
        const ua = navigator.userAgent;
        if (ua.indexOf('Chrome') > -1) return 'Chrome';
        if (ua.indexOf('Safari') > -1) return 'Safari';
        if (ua.indexOf('Firefox') > -1) return 'Firefox';
        if (ua.indexOf('Edge') > -1) return 'Edge';
        return 'Other';
    }

    /**
     * Save methods
     */
    saveUserData() {
        localStorage.setItem('dig_in_user_data', JSON.stringify(this.userData));
    }

    saveSessionData() {
        localStorage.setItem('dig_in_session_data', JSON.stringify(this.sessionData));
    }

    saveRecipeStats() {
        localStorage.setItem('dig_in_recipe_stats', JSON.stringify(this.recipeStats));
    }

    saveEngagementData() {
        localStorage.setItem('dig_in_engagement_data', JSON.stringify(this.engagementData));
    }

    /**
     * Export all user metrics
     */
    exportMetrics() {
        const metrics = this.getUserMetrics();
        const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-metrics-${this.userData.userId}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Global instance
const userMetricsTracker = new UserMetricsTracker();

// Track page unload
window.addEventListener('beforeunload', () => {
    userMetricsTracker.trackSessionEnd();
});

// Expose to window
window.userMetricsTracker = userMetricsTracker;
