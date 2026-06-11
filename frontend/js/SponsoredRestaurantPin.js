// SponsoredRestaurantPin.js - A restaurant pin that's actually an ad

class SponsoredRestaurantPin {
    constructor(restaurantData, sponsorData) {
        this.restaurant = restaurantData;
        this.sponsor = sponsorData; // Amazon product or DoorDash deal
        this.isSponsored = true;
    }
    
    createMarker() {
        // Create custom marker that looks like regular restaurant pin
        // but with subtle sponsored indicator
        const markerElement = document.createElement('div');
        markerElement.className = 'restaurant-marker sponsored';
        markerElement.innerHTML = `
            <div class="marker-content">
                <span class="marker-icon">${this.getIcon()}</span>
                <span class="sponsored-badge">⭐</span>
            </div>
        `;
        
        // On click, show restaurant details + sponsored content
        markerElement.addEventListener('click', () => {
            this.showPanel();
        });
        
        return markerElement;
    }
    
    showPanel() {
        // Restaurant panel with sponsored section
        const panel = document.createElement('div');
        panel.className = 'restaurant-panel';
        panel.innerHTML = `
            <div class="restaurant-info">
                <h3>${this.restaurant.name}</h3>
                <p>${this.restaurant.cuisine}</p>
            </div>
            <div class="sponsored-section pixel-border">
                <div class="sponsored-label">Featured Deal</div>
                <div class="sponsored-content">
                    <img src="${this.sponsor.image}" class="pixelated">
                    <div class="sponsored-text">
                        <strong>${this.sponsor.product_name}</strong>
                        <span>$${this.sponsor.price}</span>
                        <button class="affiliate-link" data-url="${this.sponsor.affiliate_url}">
                            Shop Now → 
                        </button>
                    </div>
                </div>
            </div>
            <button class="checkin-btn">Check In</button>
        `;
        
        // Handle affiliate link click
        panel.querySelector('.affiliate-link').addEventListener('click', (e) => {
            window.open(e.target.dataset.url, '_blank');
            trackAffiliateClick(this.sponsor.id);
        });
        
        document.body.appendChild(panel);
    }
}// After user checks in at a restaurant
function onCheckinComplete(restaurant, coinsEarned) {
    // Show reward modal with option to watch ad
    const modal = document.createElement('div');
    modal.className = 'reward-modal pixel-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="reward-icon">+${coinsEarned} coins</div>
            <p>You earned coins at ${restaurant.name}!</p>
            <div class="reward-options">
                <button class="keep-btn">Keep ${coinsEarned}</button>
                <button class="watch-btn pixel-btn">
                    Watch 15s ad → Double (${coinsEarned * 2})
                </button>
            </div>
            <div class="mystery-option">
                <button class="mystery-btn">
                    🎁 Watch ad → Mystery Box (50-500 coins)
                </button>
            </div>
        </div>
    `;
    
    // Handle ad watch
    modal.querySelector('.watch-btn').addEventListener('click', () => {
        const pixelAd = new PixelAd(
            { name: "Amazon Kitchen Set", price: "29.99" },
            { reward: coinsEarned, duration: 15000 }
        );
        modal.remove();
        pixelAd.render(document.body);
    });
    
    document.body.appendChild(modal);
}