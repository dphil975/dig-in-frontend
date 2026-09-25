/**
 * Dig In - URL Recipe Importer Frontend
 * Handles URL submission, preview, and saving imported recipes
 */

class URLImporter {
    constructor() {
        this.apiBase = 'http://localhost:8000';
        this.currentPreview = null;
        this.init();
    }
    
    init() {
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        const importBtn = document.getElementById('importUrlBtn');
        const urlInput = document.getElementById('recipeUrlInput');
        
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importFromUrl());
        }
        
        if (urlInput) {
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.importFromUrl();
            });
        }
    }
    
    async importFromUrl() {
        const urlInput = document.getElementById('recipeUrlInput');
        const url = urlInput.value.trim();
        
        if (!url) {
            this.showStatus('Please enter a URL', 'error');
            return;
        }
        
        if (!this.isValidUrl(url)) {
            this.showStatus('Please enter a valid URL (e.g., https://...)', 'error');
            return;
        }
        
        this.showStatus('🔄 Importing recipe... This may take a few seconds.', 'loading');
        
        try {
            const response = await fetch(`${this.apiBase}/import/url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Import failed');
            }
            
            const recipe = await response.json();
            this.currentPreview = recipe;
            this.showPreview(recipe);
            this.showStatus('✅ Recipe imported successfully! Review below.', 'success');
            
        } catch (error) {
            console.error('Import error:', error);
            this.showStatus(`❌ Import failed: ${error.message}`, 'error');
        }
    }
    
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
    
    showStatus(message, type) {
        const statusDiv = document.getElementById('importerStatus');
        if (!statusDiv) return;
        
        statusDiv.style.display = 'block';
        statusDiv.className = `importer-status ${type}`;
        
        if (type === 'loading') {
            statusDiv.innerHTML = `<div class="spinner"></div><span>${message}</span>`;
        } else {
            statusDiv.innerHTML = message;
        }
        
        if (type !== 'loading') {
            setTimeout(() => {
                statusDiv.style.opacity = '0.8';
                setTimeout(() => {
                    if (statusDiv.style.opacity === '0.8') {
                        statusDiv.style.display = 'none';
                    }
                }, 3000);
            }, 3000);
        }
    }
    
    showPreview(recipe) {
        const previewDiv = document.getElementById('importPreview');
        if (!previewDiv) return;
        
        // Generate ingredient HTML
        const ingredientsHtml = recipe.ingredients.map(ing => 
            `<li>${ing.amount ? ing.amount + ' ' : ''}${ing.name}</li>`
        ).join('');
        
        // Generate instruction preview (first 3 steps)
        const instructionsPreview = recipe.instructions.slice(0, 3).map(step => 
            `<li>${step.substring(0, 100)}${step.length > 100 ? '...' : ''}</li>`
        ).join('');
        
        previewDiv.innerHTML = `
            <div class="preview-recipe">
                ${recipe.image_url ? `
                    <div class="preview-image">
                        <img src="${recipe.image_url}" alt="${recipe.name}" onerror="this.parentElement.innerHTML='<div style=\'font-size:32px;\'>🍳</div>'">
                    </div>
                ` : `
                    <div class="preview-image" style="font-size: 48px;">
                        🍳
                    </div>
                `}
                <div class="preview-details">
                    <h3>${this.escapeHtml(recipe.name)}</h3>
                    <div class="preview-meta">
                        <span>📖 ${recipe.source_domain}</span>
                        ${recipe.total_time ? `<span>⏱️ ${recipe.total_time} min</span>` : ''}
                        ${recipe.servings ? `<span>🍽️ Serves ${recipe.servings}</span>` : ''}
                        ${recipe.dietary_tags && recipe.dietary_tags.length ? 
                            `<span>🏷️ ${recipe.dietary_tags.join(', ')}</span>` : ''}
                    </div>
                    ${recipe.description ? `<p style="font-size: 13px;">${this.escapeHtml(recipe.description.substring(0, 200))}${recipe.description.length > 200 ? '...' : ''}</p>` : ''}
                    
                    <details>
                        <summary style="cursor: pointer; color: #c8455f;">📋 Ingredients (${recipe.ingredients.length})</summary>
                        <ul class="preview-ingredients" style="margin-top: 10px;">
                            ${ingredientsHtml}
                        </ul>
                    </details>
                    
                    <details>
                        <summary style="cursor: pointer; color: #c8455f;">📖 Instructions (${recipe.instructions.length} steps)</summary>
                        <ol class="preview-ingredients" style="margin-top: 10px;">
                            ${instructionsPreview}
                            ${recipe.instructions.length > 3 ? `<li>... and ${recipe.instructions.length - 3} more steps</li>` : ''}
                        </ol>
                    </details>
                    
                    <div class="preview-actions">
                        <button class="save-btn pixel-button" id="saveImportedBtn">💾 Save to My Cookbook</button>
                        <button class="cancel-btn pixel-button" id="cancelImportBtn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        previewDiv.style.display = 'block';
        
        // Attach buttons
        document.getElementById('saveImportedBtn')?.addEventListener('click', () => this.saveRecipe());
        document.getElementById('cancelImportBtn')?.addEventListener('click', () => {
            previewDiv.style.display = 'none';
            this.currentPreview = null;
        });
    }
    
    async saveRecipe() {
        if (!this.currentPreview) return;
        
        this.showStatus('💾 Saving recipe to your cookbook...', 'loading');
        
        try {
            const response = await fetch(`${this.apiBase}/recipes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.currentPreview)
            });
            
            if (!response.ok) throw new Error('Failed to save');
            
            const saved = await response.json();
            this.showStatus(`✅ "${this.currentPreview.name}" saved to your cookbook!`, 'success');
            
            // Clear preview
            document.getElementById('importPreview').style.display = 'none';
            document.getElementById('recipeUrlInput').value = '';
            this.currentPreview = null;
            
            // Refresh recipe list
            if (typeof loadRecipesFromBackend === 'function') {
                loadRecipesFromBackend();
            }
            
        } catch (error) {
            this.showStatus(`❌ Failed to save: ${error.message}`, 'error');
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize importer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new URLImporter();
});