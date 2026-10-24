/**
 * Dig In - Delivery vs. DIY Analyzer
 * Shows users true cost of delivery apps
 */

class DeliveryAnalyzer {
    constructor() {
        this.apiBase = 'http://localhost:8000';
    }
    
    async analyzeDelivery(itemName, platform, itemPrice, restaurantName) {
        const response = await fetch(`${this.apiBase}/analyze-delivery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dish_name: itemName,
                restaurant_name: restaurantName,
                platform: platform,
                delivery_item_price: itemPrice,
                user_device: this.detectDevice()
            })
        });
        
        return response.json();
    }
    
    detectDevice() {
        const userAgent = navigator.userAgent;
        if (/iPhone|iPad|iPod/.test(userAgent)) return 'iPhone';
        if (/Android/.test(userAgent)) return 'Android';
        return 'Desktop';
    }
    
    renderComparison(analysis) {
        return `
            <div class="delivery-vs-diy-card">
                <div class="savings-header ${analysis.percent_saved > 30 ? 'high-savings' : 'medium-savings'}">
                    <div class="savings-badge">YOU SAVE $${analysis.absolute_savings}</div>
                    <div class="savings-percent">${analysis.percent_saved}% cheaper to cook at home</div>
                </div>
                
                <div class="cost-breakdown">
                    <div class="delivery-column">
                        <h3>🚚 Delivery via ${analysis.platform}</h3>
                        <div class="price-breakdown">
                            <div>Menu price: $${analysis.delivery_item_price}</div>
                            <div>Delivery fee: $${analysis.delivery_fee}</div>
                            <div>Service fee: $${analysis.service_fee}</div>
                            ${analysis.small_order_fee > 0 ? `<div class="warning">Small order fee: $${analysis.small_order_fee}</div>` : ''}
                            <div>Tip (suggested): $${analysis.tip_suggested}</div>
                            <div>Tax: $${analysis.tax}</div>
                            <div class="total"><strong>TOTAL: $${analysis.delivery_total}</strong></div>
                        </div>
                    </div>
                    
                    <div class="vs-divider">VS</div>
                    
                    <div class="diy-column">
                        <h3>🏠 Make It Yourself</h3>
                        <div class="ingredient-list">
                            ${analysis.ingredient_costs.map(ing => `
                                <div>${ing.name}: $${ing.estimated_cost}</div>
                            `).join('')}
                        </div>
                        <div class="time-estimate">
                            ⏱️ Prep: ${analysis.estimated_prep_time} min | Cook: ${analysis.estimated_cook_time} min
                        </div>
                        <div class="total"><strong>TOTAL: $${analysis.grocery_total}</strong></div>
                    </div>
                </div>
                
                ${analysis.price_gouge_warning ? `
                    <div class="price-gouge-warning">
                        <strong>⚠️ Price Alert</strong>
                        <p>${analysis.price_gouge_warning}</p>
                    </div>
                ` : ''}
                
                <div class="educational-message">
                    <h4>💡 The Smart Financial Play</h4>
                    <p>${analysis.educational_message}</p>
                </div>
                
                <div class="meal-prep-suggestions">
                    <h4>🍽️ What Else You Can Make</h4>
                    <div class="other-recipes">
                        ${analysis.other_recipes_from_ingredients.map(recipe => `
                            <div class="recipe-suggestion">
                                <strong>${recipe.name}</strong>
                                <span>Save $${recipe.savings}</span>
                                <span>${recipe.time} min</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="savings-total">
                        Total potential savings from meal prep: <strong>$${(analysis.absolute_savings * analysis.meals_from_ingredients).toFixed(2)}</strong>
                    </div>
                </div>
                
                <div class="action-buttons">
                    <button class="grocery-list-btn" onclick="generateGroceryList()">📝 Get Grocery List</button>
                    <button class="recipe-btn" onclick="showRecipe()">👩‍🍳 Show Recipe</button>
                </div>
            </div>
        `;
    }
}