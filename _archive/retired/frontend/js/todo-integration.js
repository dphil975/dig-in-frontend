/**
 * Dig In To-Do Integration
 * Syncs grocery lists across devices
 * Creates shopping lists from recipes
 */

class TodoIntegration {
    constructor() {
        this.groceryList = this.loadGroceryList();
        this.init();
    }

    init() {
        this.setupListUI();
    }

    loadGroceryList() {
        const saved = localStorage.getItem('groceryList');
        if (saved) {
            this.groceryList = JSON.parse(saved);
        } else {
            this.groceryList = {
                items: [],
                lastUpdated: new Date().toISOString(),
                storeFilters: {}
            };
        }
        return this.groceryList;
    }

    saveGroceryList() {
        this.groceryList.lastUpdated = new Date().toISOString();
        localStorage.setItem('groceryList', JSON.stringify(this.groceryList));
        this.updateListUI();
    }

    addItem(itemName, quantity = 1, unit = '', storePreference = null) {
        const existing = this.groceryList.items.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        
        if (existing) {
            existing.quantity += quantity;
            existing.updatedAt = new Date().toISOString();
        } else {
            this.groceryList.items.push({
                id: Date.now(),
                name: itemName,
                quantity: quantity,
                unit: unit,
                checked: false,
                storePreference: storePreference,
                addedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        
        this.saveGroceryList();
        return this.groceryList.items;
    }

    removeItem(itemId) {
        this.groceryList.items = this.groceryList.items.filter(i => i.id !== itemId);
        this.saveGroceryList();
    }

    toggleItem(itemId) {
        const item = this.groceryList.items.find(i => i.id === itemId);
        if (item) {
            item.checked = !item.checked;
            this.saveGroceryList();
        }
    }

    addRecipeIngredients(recipe, servings = 1) {
        for (const ingredient of recipe.ingredients) {
            this.addItem(ingredient.name, ingredient.quantity * servings, ingredient.unit);
        }
        this.saveGroceryList();
    }

    setupListUI() {
        const listContainer = document.getElementById('todoList') || this.createListContainer();
        this.updateListUI();
    }

    createListContainer() {
        const container = document.createElement('div');
        container.id = 'todoList';
        container.className = 'todo-container pixel-border';
        document.querySelector('.app-container')?.appendChild(container);
        return container;
    }

    updateListUI() {
        const container = document.getElementById('todoList');
        if (!container) return;
        
        const unchecked = this.groceryList.items.filter(i => !i.checked);
        const checked = this.groceryList.items.filter(i => i.checked);
        
        container.innerHTML = `
            <div class="todo-header">
                <span class="todo-icon">📝</span>
                <h4>MY GROCERY LIST</h4>
                <span class="todo-count">${unchecked.length} items</span>
                <button class="add-item-btn" id="addItemBtn">+</button>
            </div>
            <div class="todo-items">
                ${unchecked.map(item => `
                    <div class="todo-item" data-id="${item.id}">
                        <input type="checkbox" class="todo-checkbox">
                        <span class="todo-name">${item.name}</span>
                        ${item.quantity > 1 ? `<span class="todo-qty">${item.quantity}${item.unit ? ' ' + item.unit : ''}</span>` : ''}
                        ${item.storePreference ? `<span class="todo-store">📍 ${item.storePreference}</span>` : ''}
                        <button class="todo-delete">🗑️</button>
                    </div>
                `).join('')}
                ${checked.length > 0 ? `
                    <div class="todo-divider">✓ COMPLETED</div>
                    ${checked.map(item => `
                        <div class="todo-item completed" data-id="${item.id}">
                            <input type="checkbox" class="todo-checkbox" checked>
                            <span class="todo-name">${item.name}</span>
                            <button class="todo-delete">🗑️</button>
                        </div>
                    `).join('')}
                ` : ''}
                ${this.groceryList.items.length === 0 ? '<div class="todo-empty">✨ Your list is empty! Add items from recipes or tap +</div>' : ''}
            </div>
        `;
        
        // Attach event listeners
        container.querySelectorAll('.todo-item').forEach(itemDiv => {
            const id = parseInt(itemDiv.dataset.id);
            const checkbox = itemDiv.querySelector('.todo-checkbox');
            const deleteBtn = itemDiv.querySelector('.todo-delete');
            
            if (checkbox) {
                checkbox.addEventListener('change', () => this.toggleItem(id));
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.removeItem(id));
            }
        });
        
        container.querySelector('#addItemBtn')?.addEventListener('click', () => this.showAddItemModal());
    }

    showAddItemModal() {
        const modal = document.createElement('div');
        modal.className = 'add-item-modal pixel-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>➕ ADD TO GROCERY LIST</h3>
                <input type="text" id="newItemName" placeholder="Item name" class="pixel-input" autofocus>
                <div class="quantity-row">
                    <input type="number" id="newItemQty" placeholder="Qty" value="1" class="pixel-input-small">
                    <input type="text" id="newItemUnit" placeholder="Unit (lb, oz, each)" class="pixel-input">
                </div>
                <select id="newItemStore" class="pixel-select">
                    <option value="">Any store</option>
                    <option value="Trader Joe's">Trader Joe's</option>
                    <option value="Whole Foods">Whole Foods</option>
                    <option value="Local Market">Local Market</option>
                </select>
                <div class="modal-buttons">
                    <button id="cancelAdd" class="pixel-button secondary">CANCEL</button>
                    <button id="confirmAdd" class="pixel-button">ADD TO LIST</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('#confirmAdd').addEventListener('click', () => {
            const name = modal.querySelector('#newItemName').value;
            const qty = parseInt(modal.querySelector('#newItemQty').value) || 1;
            const unit = modal.querySelector('#newItemUnit').value;
            const store = modal.querySelector('#newItemStore').value || null;
            
            if (name) {
                this.addItem(name, qty, unit, store);
            }
            modal.remove();
        });
        
        modal.querySelector('#cancelAdd').addEventListener('click', () => modal.remove());
        
        // Enter key support
        modal.querySelector('#newItemName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') modal.querySelector('#confirmAdd').click();
        });
    }

    getShoppingListByStore() {
        const byStore = {};
        
        for (const item of this.groceryList.items.filter(i => !i.checked)) {
            const store = item.storePreference || 'Any Store';
            if (!byStore[store]) byStore[store] = [];
            byStore[store].push(item);
        }
        
        return byStore;
    }

    clearCompleted() {
        this.groceryList.items = this.groceryList.items.filter(i => !i.checked);
        this.saveGroceryList();
    }
}