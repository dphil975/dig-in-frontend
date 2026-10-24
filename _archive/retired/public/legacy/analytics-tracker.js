/**
 * Dig In Analytics Tracker
 * Tracks user engagement, recipe interactions, and app metrics
 * Stores locally and sends to analytics service
 */

class DigInAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.sessionStart = new Date();
        this.events = [];
        this.pageViews = 0;
        this.recipesViewed = new Set();
        this.recipesLiked = new Set();
        this.recipesSearched = new Set();

        // Initialize Google Analytics if available
        this.initializeGoogleAnalytics();

        // Load persisted data
        this.loadPersistedData();

        // Track page view
        this.trackPageView();

        // Save data periodically
        setInterval(() => this.saveData(), 30000); // Every 30 seconds
    }

    /**
     * Initialize Google Analytics
     */
    initializeGoogleAnalytics() {
        // Google Analytics 4 Tag
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-DIGIN123456'; // Replace with your GA ID
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', 'G-DIGIN123456', {
            'user_id': this.userId,
            'session_id': this.sessionId
        });
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get or create user ID
     */
    getUserId() {
        let userId = localStorage.getItem('dig_in_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('dig_in_user_id', userId);
        }
        return userId;
    }

    /**
     * Track page view
     */
    trackPageView() {
        this.pageViews++;
        this.track('page_view', {
            page_path: window.location.pathname,
            page_title: document.title,
            page_views: this.pageViews
        });
    }

    /**
     * Track recipe view
     */
    trackRecipeView(recipeId, recipeName, country, category) {
        this.recipesViewed.add(recipeId);
        this.track('recipe_view', {
            recipe_id: recipeId,
            recipe_name: recipeName,
            country: country,
            category: category,
            total_recipes_viewed: this.recipesViewed.size
        });
    }

    /**
     * Track recipe favorite/like
     */
    trackRecipeLike(recipeId, recipeName, liked) {
        if (liked) {
            this.recipesLiked.add(recipeId);
        } else {
            this.recipesLiked.delete(recipeId);
        }
        this.track('recipe_like', {
            recipe_id: recipeId,
            recipe_name: recipeName,
            action: liked ? 'liked' : 'unliked',
            total_likes: this.recipesLiked.size
        });
    }

    /**
     * Track recipe search
     */
    trackRecipeSearch(searchQuery, resultsCount) {
        this.recipesSearched.add(searchQuery.toLowerCase());
        this.track('recipe_search', {
            search_query: searchQuery,
            results_count: resultsCount,
            unique_searches: this.recipesSearched.size
        });
    }

    /**
     * Track filter usage
     */
    trackFilterUsage(filterType, filterValue, resultsCount) {
        this.track('filter_usage', {
            filter_type: filterType, // 'country', 'category', 'search'
            filter_value: filterValue,
            results_found: resultsCount,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Track recipe view steps
     */
    trackViewSteps(recipeId, recipeName) {
        this.track('view_steps', {
            recipe_id: recipeId,
            recipe_name: recipeName,
            action: 'opened_detailed_steps'
        });
    }

    /**
     * Track adapt recipe click
     */
    trackAdaptRecipe(recipeId, recipeName, adaptType) {
        this.track('adapt_recipe', {
            recipe_id: recipeId,
            recipe_name: recipeName,
            adapt_type: adaptType, // '+Protein', '+Fiber', 'Lower Carbs', '+Veggies'
            action: 'opened_customization'
        });
    }

    /**
     * Track step completion
     */
    trackStepCompletion(recipeId, recipeName, currentStep, totalSteps) {
        this.track('step_completed', {
            recipe_id: recipeId,
            recipe_name: recipeName,
            step_number: currentStep,
            total_steps: totalSteps,
            completion_percentage: Math.round((currentStep / totalSteps) * 100)
        });
    }

    /**
     * Track recipe completion
     */
    trackRecipeCompletion(recipeId, recipeName, timeSpent) {
        this.track('recipe_completed', {
            recipe_id: recipeId,
            recipe_name: recipeName,
            time_spent_seconds: timeSpent,
            session_id: this.sessionId
        });
    }

    /**
     * Track shuffle/random
     */
    trackShuffle() {
        this.track('recipe_shuffle', {
            action: 'user_clicked_shuffle'
        });
    }

    /**
     * Track engagement metric
     */
    trackEngagement(metricName, metricValue) {
        this.track('custom_metric', {
            metric_name: metricName,
            metric_value: metricValue,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Generic track method
     */
    track(eventName, eventData = {}) {
        const event = {
            event_name: eventName,
            event_data: {
                ...eventData,
                session_id: this.sessionId,
                user_id: this.userId,
                timestamp: new Date().toISOString(),
                session_duration: Math.floor((Date.now() - this.sessionStart) / 1000)
            }
        };

        this.events.push(event);

        // Send to Google Analytics
        if (window.gtag) {
            window.gtag('event', eventName, eventData);
        }

        // Log to console in development. This file is a plain browser script (not
        // bundled), so `process` is undefined here — gate on the hostname instead.
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.log('Analytics Event:', event);
        }

        return event;
    }

    /**
     * Get current session metrics
     */
    getSessionMetrics() {
        const sessionDuration = Math.floor((Date.now() - this.sessionStart) / 1000);
        return {
            session_id: this.sessionId,
            user_id: this.userId,
            session_duration_seconds: sessionDuration,
            page_views: this.pageViews,
            recipes_viewed: this.recipesViewed.size,
            recipes_liked: this.recipesLiked.size,
            unique_searches: this.recipesSearched.size,
            total_events: this.events.length,
            session_start: this.sessionStart.toISOString(),
            current_time: new Date().toISOString()
        };
    }

    /**
     * Save data to local storage
     */
    saveData() {
        const metrics = this.getSessionMetrics();
        localStorage.setItem('dig_in_session_metrics', JSON.stringify(metrics));
        localStorage.setItem('dig_in_events', JSON.stringify(this.events.slice(-100))); // Keep last 100 events
    }

    /**
     * Load persisted data
     */
    loadPersistedData() {
        const stored = localStorage.getItem('dig_in_session_metrics');
        if (stored) {
            const data = JSON.parse(stored);
            // Could restore previous session data if needed
        }
    }

    /**
     * Get analytics dashboard data
     */
    getDashboardData() {
        return {
            metrics: this.getSessionMetrics(),
            recentEvents: this.events.slice(-20),
            allEvents: this.events,
            favoriteRecipes: Array.from(this.recipesLiked),
            viewedRecipes: Array.from(this.recipesViewed),
            searchQueries: Array.from(this.recipesSearched)
        };
    }

    /**
     * Export analytics data
     */
    exportData() {
        const data = {
            session_metrics: this.getSessionMetrics(),
            events: this.events,
            favorites: Array.from(this.recipesLiked),
            viewed: Array.from(this.recipesViewed),
            searches: Array.from(this.recipesSearched),
            exported_at: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dig-in-analytics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Get engagement score (0-100)
     */
    getEngagementScore() {
        const views = Math.min(this.recipesViewed.size * 10, 30);
        const likes = Math.min(this.recipesLiked.size * 20, 30);
        const searches = Math.min(this.recipesSearched.size * 5, 20);
        const time = Math.min(Math.floor((Date.now() - this.sessionStart) / 60000), 20); // Max 20 for 20+ minutes

        return Math.round(views + likes + searches + time);
    }
}

// Global instance
const digInAnalytics = new DigInAnalytics();

// Expose to window for console access
window.digInAnalytics = digInAnalytics;
