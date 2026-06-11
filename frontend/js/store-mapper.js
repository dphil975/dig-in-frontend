/**
 * Dig In Store Mapper
 * Community-powered aisle locations, stock status, and price reporting
 * Like Pokémon GO for grocery shopping
 */

class StoreMapper {
    constructor(geolocationService) {
        this.geoService = geolocationService;
        this.storeData = this.loadStoreData();
        this.userReports = [];
        this.init();
    }

    init() {
        this.setupReportInterface();
    }

    loadStoreData() {
        const saved = localStorage.getItem('storeMappings');
        if (saved) {
            this.storeData = JSON.parse(saved);
        } else {
            this.storeData = {
                stores: {},
                aisles: {},
                stockReports: [],
                priceReports: []
            };
        }
        return this.storeData;
    }

    saveStoreData() {
        localStorage.setItem('storeMappings', JSON.stringify(this.storeData));
    }

    setupReportInterface() {
        // Create report button that appears when near stores
        const reportBtn = document.createElement('button');
        reportBtn.id = 'reportStoreDataBtn';
        reportBtn.className = 'pixel-button report-btn';
        reportBtn.innerHTML = '📝 REPORT STORE INFO';
        reportBtn.style.position = 'fixed';
        reportBtn.style.bottom = '80px';
        reportBtn.style.right = '20px';
        reportBtn.style.zIndex = '1000';
        
        reportBtn.addEventListener('click', () => this.showReportModal());
        document.body.appendChild(reportBtn);
    }

    showReportModal() {
        const modal = document.createElement('div');
        modal.className = 'report-modal pixel-modal';
        modal.innerHTML = `
            <div class="modal-header">
                <span class="modal-icon">📝</span>
                <h3>REPORT STORE INFO</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="report-tabs">
                    <button class="tab-btn active" data-tab="aisle">📍 Aisle Location</button>
                    <button class="tab-btn" data-tab="stock">📦 Stock Status</button>
                    <button class="tab-btn" data-tab="price">💰 Price Report</button>
                </div>
                
                <div class="tab-content active" id="aisleTab">
                    <select id="storeSelect" class="pixel-select">
                        <option value="">Select a store...</option>
                        ${this.geoService.nearbyStores.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                    </select>
                    <input type="text" id="productName" placeholder="Product name" class="pixel-input">
                    <input type="text" id="aisleLocation" placeholder="Aisle/section (e.g., 'Aisle 4', 'Dairy Section')" class="pixel-input">
                    <textarea id="locationNotes" placeholder="Additional notes (e.g., 'Near the back wall')" class="pixel-textarea"></textarea>
                    <div class="pixel-tip">💡 Help others find ingredients faster!</div>
                </div>
                
                <div class="tab-content" id="stockTab">
                    <select id="stockStoreSelect" class="pixel-select">
                        <option value="">Select a store...</option>
                        ${this.geoService.nearbyStores.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                    </select>
                    <input type="text" id="stockProductName" placeholder="Product name" class="pixel-input">
                    <div class="stock-status-options">
                        <label><input type="radio" name="stockStatus" value="in-stock"> ✅ In Stock</label>
                        <label><input type="radio" name="stockStatus" value="low-stock"> ⚠️ Low Stock</label>
                        <label><input type="radio" name="stockStatus" value="out-of-stock"> ❌ Out of Stock</label>
                    </div>
                    <input type="date" id="stockDate" class="pixel-input">
                </div>
                
                <div class="tab-content" id="priceTab">
                    <select id="priceStoreSelect" class="pixel-select">
                        <option value="">Select a store...</option>
                        ${this.geoService.nearbyStores.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                    </select>
                    <input type="text" id="priceProductName" placeholder="Product name" class="pixel-input">
                    <input type="number" id="productPrice" placeholder="Price ($)" step="0.01" class="pixel-input">
                    <label><input type="checkbox" id="priceIncrease"> This is a price increase</label>
                </div>
                
                <button id="submitReport" class="pixel-button">SUBMIT REPORT</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Tab switching
        modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                modal.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                modal.querySelector(`#${btn.dataset.tab}Tab`).classList.add('active');
            });
        });
        
        modal.querySelector('#submitReport').addEventListener('click', () => {
            const activeTab = modal.querySelector('.tab-btn.active').dataset.tab;
            this.submitReport(activeTab, modal);
            modal.remove();
        });
        
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    }

    submitReport(type, modal) {
        const report = {
            id: Date.now(),
            type: type,
            timestamp: new Date().toISOString(),
            userId: this.getUserId(),
            location: this.geoService.userLocation
        };
        
        if (type === 'aisle') {
            report.storeId = modal.querySelector('#storeSelect').value;
            report.product = modal.querySelector('#productName').value;
            report.aisle = modal.querySelector('#aisleLocation').value;
            report.notes = modal.querySelector('#locationNotes').value;
            
            // Store aisle mapping
            const storeKey = `store_${report.storeId}`;
            if (!this.storeData.aisles[storeKey]) this.storeData.aisles[storeKey] = {};
            this.storeData.aisles[storeKey][report.product.toLowerCase()] = report.aisle;
            
        } else if (type === 'stock') {
            report.storeId = modal.querySelector('#stockStoreSelect').value;
            report.product = modal.querySelector('#stockProductName').value;
            report.status = modal.querySelector('input[name="stockStatus"]:checked')?.value;
            report.date = modal.querySelector('#stockDate').value;
            
            this.storeData.stockReports.push(report);
            
        } else if (type === 'price') {
            report.storeId = modal.querySelector('#priceStoreSelect').value;
            report.product = modal.querySelector('#priceProductName').value;
            report.price = parseFloat(modal.querySelector('#productPrice').value);
            report.isIncrease = modal.querySelector('#priceIncrease').checked;
            
            this.storeData.priceReports.push(report);
        }
        
        this.saveStoreData();
        this.showConfirmation(report);
    }

    findProductInStore(productName, storeId) {
        const productLower = productName.toLowerCase();
        const storeKey = `store_${storeId}`;
        
        // Check aisle mapping
        const aisle = this.storeData.aisles[storeKey]?.[productLower];
        
        // Check stock reports
        const stockReports = this.storeData.stockReports
            .filter(r => r.storeId === storeId && r.product.toLowerCase().includes(productLower))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Check price reports
        const priceReports = this.storeData.priceReports
            .filter(r => r.storeId === storeId && r.product.toLowerCase().includes(productLower))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return {
            product: productName,
            storeId: storeId,
            aisle: aisle || 'Unknown - ask a staff member!',
            stockStatus: stockReports[0]?.status || 'unknown',
            lastPrice: priceReports[0]?.price || null,
            priceTrend: this.calculatePriceTrend(productLower, storeId),
            communityReports: {
                stock: stockReports.length,
                price: priceReports.length
            }
        };
    }

    calculatePriceTrend(productName, storeId) {
        const relevantReports = this.storeData.priceReports
            .filter(r => r.storeId === storeId && r.product.toLowerCase().includes(productName.toLowerCase()))
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        if (relevantReports.length < 2) return null;
        
        const first = relevantReports[0].price;
        const last = relevantReports[relevantReports.length - 1].price;
        
        return {
            direction: last > first ? 'up' : (last < first ? 'down' : 'stable'),
            percentChange: ((last - first) / first) * 100,
            dataPoints: relevantReports.length
        };
    }

    showConfirmation(report) {
        const confirm = document.createElement('div');
        confirm.className = 'report-confirmation';
        confirm.innerHTML = `
            <div class="confirm-content">
                <span class="confirm-icon">✅</span>
                <span>Thank you, Chef! Your report helps the community.</span>
                <span class="xp-gain">+50 XP</span>
            </div>
        `;
        document.body.appendChild(confirm);
        
        setTimeout(() => confirm.remove(), 3000);
    }

    getUserId() {
        let userId = localStorage.getItem('digInUserId');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('digInUserId', userId);
        }
        return userId;
    }
}