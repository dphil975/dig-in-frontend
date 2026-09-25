/**
 * Dig In Price Tracker
 * Tracks price history, detects increases, calculates inflation
 * Community-powered price reporting
 */

class PriceTracker {
    constructor() {
        this.priceHistory = this.loadPriceHistory();
        this.inflationAlerts = [];
        this.init();
    }

    init() {
        this.checkForPriceIncreases();
    }

    loadPriceHistory() {
        const saved = localStorage.getItem('priceHistory');
        if (saved) {
            this.priceHistory = JSON.parse(saved);
        } else {
            this.priceHistory = {};
        }
        return this.priceHistory;
    }

    savePriceHistory() {
        localStorage.setItem('priceHistory', JSON.stringify(this.priceHistory));
    }

    async processReceipt(receiptData) {
        const store = receiptData.store;
        const date = receiptData.date || new Date().toISOString().split('T')[0];
        
        for (const item of receiptData.items) {
            const productKey = `${store}|${item.name.toLowerCase()}`;
            
            if (!this.priceHistory[productKey]) {
                this.priceHistory[productKey] = [];
            }
            
            // Add new price entry
            this.priceHistory[productKey].push({
                price: item.price,
                date: date,
                store: store,
                quantity: item.quantity
            });
            
            // Check for price increase
            const previousPrice = this.getPreviousPrice(productKey);
            if (previousPrice && item.price > previousPrice) {
                const increase = ((item.price - previousPrice) / previousPrice) * 100;
                if (increase >= 5) { // Alert on 5%+ increase
                    this.createInflationAlert(productKey, previousPrice, item.price, increase);
                }
            }
        }
        
        this.savePriceHistory();
        return { updated: receiptData.items.length, alerts: this.inflationAlerts };
    }

    getPreviousPrice(productKey) {
        const history = this.priceHistory[productKey];
        if (!history || history.length < 2) return null;
        
        // Sort by date and get second most recent
        const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
        return sorted[1]?.price || null;
    }

    calculateInflationRate(currentPrice, previousPrice) {
        if (!previousPrice || previousPrice === 0) return 0;
        return ((currentPrice - previousPrice) / previousPrice) * 100;
    }

    createInflationAlert(productKey, oldPrice, newPrice, increasePercent) {
        const [store, product] = productKey.split('|');
        
        const alert = {
            id: Date.now(),
            product: product,
            store: store,
            oldPrice: oldPrice,
            newPrice: newPrice,
            increasePercent: increasePercent,
            detectedAt: new Date().toISOString(),
            dismissed: false
        };
        
        this.inflationAlerts.unshift(alert);
        this.saveInflationAlerts();
        this.displayPriceAlert(alert);
        
        return alert;
    }

    saveInflationAlerts() {
        localStorage.setItem('inflationAlerts', JSON.stringify(this.inflationAlerts));
    }

    displayPriceAlert(alert) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'price-alert-notification';
        alertDiv.innerHTML = `
            <div class="price-alert-content">
                <div class="alert-icon">⚠️</div>
                <div class="alert-details">
                    <strong>PRICE INCREASE DETECTED!</strong><br>
                    ${alert.product} at ${alert.store}<br>
                    Was: $${alert.oldPrice.toFixed(2)} → Now: $${alert.newPrice.toFixed(2)}<br>
                    <span class="increase-badge">↑ ${alert.increasePercent.toFixed(1)}% increase</span>
                </div>
                <button class="alert-dismiss">OK</button>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        alertDiv.querySelector('.alert-dismiss').addEventListener('click', () => {
            alertDiv.remove();
            alert.dismissed = true;
            this.saveInflationAlerts();
        });
        
        // Auto-dismiss after 8 seconds
        setTimeout(() => {
            if (alertDiv.parentElement) alertDiv.remove();
        }, 8000);
    }

    checkForPriceIncreases() {
        // Check all tracked products for significant increases
        const alerts = [];
        
        for (const [productKey, history] of Object.entries(this.priceHistory)) {
            if (history.length >= 2) {
                const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
                const current = sorted[0];
                const previous = sorted[1];
                
                if (current && previous && current.price > previous.price) {
                    const increase = ((current.price - previous.price) / previous.price) * 100;
                    if (increase >= 5) {
                        alerts.push({
                            productKey,
                            current: current.price,
                            previous: previous.price,
                            increasePercent: increase
                        });
                    }
                }
            }
        }
        
        return alerts;
    }

    getProductPriceTrend(productKey, days = 30) {
        const history = this.priceHistory[productKey];
        if (!history || history.length === 0) return null;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const recentHistory = history.filter(h => new Date(h.date) >= cutoffDate);
        
        if (recentHistory.length === 0) return null;
        
        const sorted = recentHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        return {
            product: productKey.split('|')[1],
            store: productKey.split('|')[0],
            firstPrice: sorted[0].price,
            lastPrice: sorted[sorted.length - 1].price,
            percentChange: ((sorted[sorted.length - 1].price - sorted[0].price) / sorted[0].price) * 100,
            dataPoints: sorted.length,
            history: sorted
        };
    }

    comparePrices(productName, userLocation) {
        // Compare prices across different stores for the same product
        const productLower = productName.toLowerCase();
        const storePrices = [];
        
        for (const [productKey, history] of Object.entries(this.priceHistory)) {
            const [store, product] = productKey.split('|');
            if (product.toLowerCase().includes(productLower) && history.length > 0) {
                const latest = [...history].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                storePrices.push({
                    store: store,
                    price: latest.price,
                    date: latest.date,
                    isBestDeal: false
                });
            }
        }
        
        // Find best deal
        if (storePrices.length > 0) {
            const bestPrice = Math.min(...storePrices.map(s => s.price));
            storePrices.forEach(s => s.isBestDeal = s.price === bestPrice);
        }
        
        return storePrices.sort((a, b) => a.price - b.price);
    }
}