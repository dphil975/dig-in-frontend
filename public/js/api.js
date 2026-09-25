/**
 * Dig In API Client
 * Node.js backend  (localhost:5000) — recipes DB, uploads, knowledge
 * Python service   (localhost:5001) — extraction, ML, menu parsing
 * Flask backend    (localhost:5002) — pantry, rolodex, grocery, timers
 */

const API_BASE    = 'http://localhost:5000';
const PYTHON_BASE = 'http://localhost:5001';
const FLASK_BASE  = 'http://localhost:5002';

const DigInAPI = {

    // ── Core request helpers ─────────────────────────────────────────────────

    async request(path, options = {}) {
        const res = await fetch(`${API_BASE}${path}`, options);
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`API ${res.status}: ${text}`);
        }
        return res.json();
    },

    async pythonRequest(path, options = {}) {
        const res = await fetch(`${PYTHON_BASE}${path}`, options);
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Python API ${res.status}: ${text}`);
        }
        return res.json();
    },

    // ── Health ───────────────────────────────────────────────────────────────

    async checkHealth() {
        return this.request('/health');
    },

    // ── Recipes ──────────────────────────────────────────────────────────────

    async fetchRecipes(limit = 100, cuisine = null) {
        const params = new URLSearchParams({ limit });
        if (cuisine) params.set('type', cuisine);
        const data = await this.request(`/api/recipes?${params}`);
        const rows = Array.isArray(data) ? data : (data.recipes || []);
        return rows.map(r => this.normalizeRecipe(r));
    },

    async searchRecipes(query) {
        const data = await this.request(`/api/recipes/search/${encodeURIComponent(query)}`);
        const rows = Array.isArray(data) ? data : (data.results || []);
        return rows.map(r => this.normalizeRecipe(r));
    },

    // ── Menu Recreation ──────────────────────────────────────────────────────

    async recreateMenuItem(name, description, restaurant) {
        const data = await this.pythonRequest('/api/extract-menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                menuText: description ? `${name}: ${description}` : name,
                menuType: 'restaurant',
            }),
        });
        const first = (data.recipes || [])[0] || {};
        return this.normalizeMenuRecipe({ ...first, original_name: name, restaurant });
    },

    // ── Extractions ──────────────────────────────────────────────────────────

    async _uploadAndPoll(file) {
        const form = new FormData();
        form.append('file', file);
        // Upload is now synchronous — Node waits for Python and returns results directly
        const result = await this.request('/api/uploads', { method: 'POST', body: form });
        return {
            uploadId: result.uploadId,
            book: result.book || file.name.replace(/\.[^.]+$/, ''),
            book_type: result.book_type || ['cookbook'],
            recipes_extracted: result.recipes_extracted || 0,
            recipes: result.recipes || [],
            science_concepts_extracted: result.science_concepts_extracted || 0,
        };
    },

    async uploadPDF(file)       { return this._uploadAndPoll(file); },
    async uploadEPUB(file)      { return this._uploadAndPoll(file); },
    async uploadMenuImage(file) { return this._uploadAndPoll(file); },

    // ── Knowledge ────────────────────────────────────────────────────────────

    async getFoodScience(concept) {
        return this.request(`/api/knowledge/reactions?ingredient=${encodeURIComponent(concept)}`);
    },

    async getSubstitutions(ingredient) {
        return this.request(`/api/knowledge/ingredients/${encodeURIComponent(ingredient)}/substitutes`);
    },

    // ── Flask backend helpers (pantry / rolodex / timers) ────────────────────

    async flaskRequest(path, options = {}) {
        const res = await fetch(`${FLASK_BASE}${path}`, options);
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Flask API ${res.status}: ${text}`);
        }
        return res.json();
    },

    // ── Pantry ───────────────────────────────────────────────────────────────

    async scanPantry(ingredients) {
        return this.flaskRequest('/api/scan_pantry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ingredients }),
        });
    },

    async getIngredientSubstitute(missing, available) {
        return this.flaskRequest('/api/substitute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ missing_ingredient: missing, available_ingredients: available }),
        });
    },

    // ── Rolodex ──────────────────────────────────────────────────────────────

    async spinRolodex(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.flaskRequest(`/api/spin_rolodex?${params}`);
    },

    async searchByIngredient(ingredient) {
        return this.flaskRequest(`/api/search_recipe?q=${encodeURIComponent(ingredient)}`);
    },

    // ── Shopping & Timers ────────────────────────────────────────────────────

    async getShoppingList(ingredients, location) {
        return this.flaskRequest('/api/shopping_list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ingredients, location }),
        });
    },

    async getCookingTimeline(recipeName) {
        return this.flaskRequest('/api/timeline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipe_name: recipeName }),
        });
    },

    async startCookingTimer(durationSeconds, stepName) {
        return this.flaskRequest('/api/start_timer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ duration_seconds: durationSeconds, step_name: stepName }),
        });
    },

    async checkFlaskHealth() {
        return this.flaskRequest('/api/health');
    },

    // ── Normalizers ──────────────────────────────────────────────────────────

    normalizeRecipe(r) {
        const CUISINE_EMOJI = {
            italian: '🍝', mexican: '🌮', japanese: '🍜',
            indian: '🍛', thai: '🫕', chinese: '🥢', french: '🥐',
        };
        const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

        // Handle Node DB schema (cuisine_type, difficulty_level, diet_tags)
        // and old API schema (cuisine, difficulty, dietary_tags)
        const cuisineRaw    = r.cuisine || r.cuisine_type || '';
        const difficultyRaw = (r.difficulty || r.difficulty_level || 'easy').toLowerCase();
        const dietaryTags   = r.dietary_tags || r.diet_tags || [];
        const cuisineKey    = cuisineRaw.toLowerCase();
        const diffLabel     = DIFFICULTY_LABEL[difficultyRaw] || 'Easy';
        const cuisineDisplay = cuisineRaw
            ? cuisineRaw.charAt(0).toUpperCase() + cuisineRaw.slice(1)
            : 'World';

        const description = r.description ||
            (dietaryTags.length
                ? `${dietaryTags.join(', ')} · from ${r.source_book || 'cookbook'}`
                : `From ${r.source_book || 'cookbook'}`);

        // Ingredients may be JSONB objects {name, quantity, unit} or plain strings
        const ingredients = (r.ingredients || []).map(ing => {
            if (typeof ing === 'string') return ing;
            const qty = ing.quantity
                ? `${ing.quantity}${ing.unit ? ' ' + ing.unit : ''}`
                : (ing.amount || '');
            return qty ? `${qty} ${ing.name || ing}` : (ing.name || String(ing));
        });

        // Instructions may be JSONB objects {step, text} or plain strings
        const instructions = (r.instructions || []).map(step => {
            if (typeof step === 'string') return step;
            return step.text || step.instruction || String(step);
        });

        return {
            id: r.id,
            name: r.name,
            cuisine: cuisineDisplay,
            description,
            pixelEmoji: CUISINE_EMOJI[cuisineKey] || '🍳',
            difficulty: diffLabel,
            time: r.total_time || (r.prep_time || 0) + (r.cook_time || 0) || 25,
            skillLevel: diffLabel,
            prepTime: r.prep_time || 10,
            cookTime: r.cook_time || 15,
            totalTime: r.total_time || (r.prep_time || 0) + (r.cook_time || 0) || 25,
            rating: 4,
            ingredients,
            instructions,
            tips: Array.isArray(r.tips) ? r.tips : (r.tips ? [r.tips] : []),
            substitutions: r.substitutions || null,
            dietary_tags: dietaryTags,
        };
    },

    normalizeMenuRecipe(r) {
        const diffLabel = r.difficulty
            ? r.difficulty.charAt(0).toUpperCase() + r.difficulty.slice(1)
            : 'Easy';

        const ingredients = (r.ingredients || []).map(ing => {
            if (typeof ing === 'string') return ing;
            const qty = ing.quantity
                ? `${ing.quantity}${ing.unit ? ' ' + ing.unit : ''}`
                : (ing.amount || '');
            return qty ? `${qty} ${ing.name || ing}` : (ing.name || String(ing));
        });

        const instructions = (r.instructions || []).map(step => {
            if (typeof step === 'string') return step;
            return step.text || step.instruction || String(step);
        });

        return {
            id: `menu_${Date.now()}`,
            name: r.original_name || r.name || 'Recreated Dish',
            cuisine: r.restaurant || 'Restaurant',
            description: `Recreated from ${r.restaurant || 'restaurant'} · Est. $${r.cost_estimate || '?'}`,
            pixelEmoji: '🍽️',
            difficulty: diffLabel,
            time: r.total_time || 30,
            skillLevel: diffLabel,
            prepTime: null,
            cookTime: null,
            totalTime: r.total_time || 30,
            rating: 4,
            ingredients,
            instructions,
            tips: Array.isArray(r.tips) ? r.tips : (r.tips ? [r.tips] : []),
            substitutions: r.substitutions || null,
            shopping_list: r.shopping_list || [],
            store_suggestions: r.store_suggestions || [],
            cost_estimate: r.cost_estimate,
        };
    },
};
