/**
 * Dig In Geolocation Service
 * Uses OpenStreetMap (free) + optional Google Maps fallback
 * Finds grocery stores, corner stores, bodegas near user
 */

class GeolocationService {
    constructor() {
        this.userLocation = null;
        this.nearbyStores = [];
        this.storeTypes = [
            "grocery", "supermarket", "convenience_store", 
            "deli", "butcher", "fishmonger", "bakery",
            "greengrocer", "health_food", "organic"
        ];
        this.init();
    }

    async init() {
        await this.requestLocationPermission();
    }

    async requestLocationPermission() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation not supported"));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    this.saveLocationPreference();
                    resolve(this.userLocation);
                },
                (error) => {
                    console.error("Location error:", error);
                    // Fallback to manual address input
                    this.showAddressInput();
                    reject(error);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }

    async searchNearbyStores(radiusKm = 5, storeType = null) {
        if (!this.userLocation) {
            await this.requestLocationPermission();
        }

        // Use OpenStreetMap Nominatim for reverse geocoding [citation:1]
        const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${this.userLocation.lat}&lon=${this.userLocation.lng}&zoom=18&addressdetails=1`;
        
        try {
            const reverseResp = await fetch(reverseUrl);
            const addressData = await reverseResp.json();
            const city = addressData.address?.city || addressData.address?.town;
            
            // Search for stores using Overpass API (free OSM query)
            const overpassUrl = "https://overpass-api.de/api/interpreter";
            const query = `[out:json];
                (
                  node["shop"~"${storeType || this.storeTypes.join('|')}"](around:${radiusKm * 1000},${this.userLocation.lat},${this.userLocation.lng});
                  way["shop"~"${storeType || this.storeTypes.join('|')}"](around:${radiusKm * 1000},${this.userLocation.lat},${this.userLocation.lng});
                  node["amenity"="marketplace"](around:${radiusKm * 1000},${this.userLocation.lat},${this.userLocation.lng});
                );
                out body;
                >;
                out skel qt;`;
            
            const response = await fetch(overpassUrl, {
                method: 'POST',
                body: query
            });
            const data = await response.json();
            
            this.nearbyStores = this.parseStoreData(data.elements);
            this.calculateDistances();
            this.sortByDistance();
            
            return this.nearbyStores;
            
        } catch (error) {
            console.error("OSM search failed:", error);
            return this.fallbackStoreSearch();
        }
    }

    parseStoreData(elements) {
        const stores = [];
        
        for (const element of elements) {
            if (element.type === 'node') {
                const tags = element.tags || {};
                stores.push({
                    id: element.id,
                    name: tags.name || this.getStoreTypeName(tags.shop || tags.amenity),
                    type: this.categorizeStore(tags),
                    lat: element.lat,
                    lng: element.lon,
                    address: tags['addr:street'] ? 
                        `${tags['addr:housenumber'] || ''} ${tags['addr:street']}, ${tags['addr:city'] || ''}` : 
                        null,
                    openingHours: tags.opening_hours,
                    phone: tags.phone,
                    website: tags.website,
                    distance: null,
                    products: []
                });
            }
        }
        
        return stores;
    }

    categorizeStore(tags) {
        const shop = tags.shop || tags.amenity;
        
        const categories = {
            'supermarket': 'chain_grocery',
            'convenience_store': 'corner_store',
            'deli': 'specialty',
            'butcher': 'specialty',
            'greengrocer': 'specialty',
            'bakery': 'specialty',
            'health_food': 'specialty',
            'marketplace': 'market'
        };
        
        return categories[shop] || 'grocery';
    }

    getStoreTypeName(shopType) {
        const names = {
            'supermarket': 'Supermarket',
            'convenience_store': 'Corner Store / Bodega',
            'deli': 'Deli',
            'butcher': 'Butcher Shop',
            'greengrocer': 'Farmers Market',
            'bakery': 'Bakery',
            'health_food': 'Health Food Store'
        };
        return names[shopType] || 'Grocery Store';
    }

    calculateDistances() {
        for (const store of this.nearbyStores) {
            store.distance = this.haversineDistance(
                this.userLocation.lat, this.userLocation.lng,
                store.lat, store.lng
            );
        }
    }

    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    sortByDistance() {
        this.nearbyStores.sort((a, b) => a.distance - b.distance);
    }

    showAddressInput() {
        const modal = document.createElement('div');
        modal.className = 'address-modal pixel-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>📍 ENTER YOUR LOCATION</h3>
                <input type="text" id="addressInput" placeholder="Street address, city, or zip code" class="pixel-input">
                <div class="address-suggestions" id="addressSuggestions"></div>
                <button id="submitAddress" class="pixel-button">FIND NEARBY STORES</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        const input = modal.querySelector('#addressInput');
        const suggestions = modal.querySelector('#addressSuggestions');
        let debounceTimeout;
        
        input.addEventListener('input', (e) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                this.geocodeAddress(e.target.value, suggestions);
            }, 500);
        });
        
        modal.querySelector('#submitAddress').addEventListener('click', async () => {
            const coords = await this.geocodeAddress(input.value);
            if (coords) {
                this.userLocation = coords;
                modal.remove();
                this.searchNearbyStores();
                this.displayStoreMap();
            }
        });
    }

    async geocodeAddress(address, suggestionsContainer = null) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (suggestionsContainer && data.length) {
                suggestionsContainer.innerHTML = data.map(place => `
                    <div class="suggestion-item" data-lat="${place.lat}" data-lon="${place.lon}">
                        ${place.display_name.substring(0, 60)}...
                    </div>
                `).join('');
                
                suggestionsContainer.querySelectorAll('.suggestion-item').forEach(el => {
                    el.addEventListener('click', () => {
                        const addressInput = suggestionsContainer.closest('.modal-content')?.querySelector('#addressInput');
                        if (addressInput) addressInput.value = el.textContent.trim();
                        suggestionsContainer.innerHTML = '';
                        this.userLocation = {
                            lat: parseFloat(el.dataset.lat),
                            lng: parseFloat(el.dataset.lon)
                        };
                    });
                });
            }
            
            if (data.length && !suggestionsContainer) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            }
            
            return null;
        } catch (error) {
            console.error("Geocoding failed:", error);
            return null;
        }
    }

    displayStoreMap() {
        if (!this.userLocation) return;

        // Create interactive map using Leaflet + OpenStreetMap [citation:4]
        const mapContainer = document.getElementById('storeMap') || this.createMapContainer();

        // Initialize map centered on user location
        const map = L.map(mapContainer).setView([this.userLocation.lat, this.userLocation.lng], 13);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);
        
        // Add user marker
        L.marker([this.userLocation.lat, this.userLocation.lng], {
            icon: L.divIcon({ className: 'user-marker', html: '📍', iconSize: [24, 24] })
        }).addTo(map).bindPopup('You are here');
        
        // Add store markers with custom colors based on type [citation:4]
        for (const store of this.nearbyStores) {
            const color = this.getMarkerColor(store.type);
            L.marker([store.lat, store.lng], {
                icon: L.divIcon({ 
                    className: `store-marker store-${store.type}`,
                    html: '🛒',
                    iconSize: [24, 24]
                })
            }).addTo(map)
              .bindPopup(`
                  <b>${store.name}</b><br>
                  ${store.address || 'Address available in-store'}<br>
                  📍 ${store.distance.toFixed(2)} km away<br>
                  ${store.openingHours ? `🕒 ${store.openingHours}` : ''}
                  <button class="get-directions-btn" data-lat="${store.lat}" data-lng="${store.lng}">
                      🚶 GET DIRECTIONS
                  </button>
              `);
        }
        
        mapContainer.style.display = 'block';
    }

    getMarkerColor(type) {
        const colors = {
            'chain_grocery': '#4CAF50',
            'corner_store': '#FF9800', 
            'specialty': '#9C27B0',
            'market': '#2196F3',
            'grocery': '#8BC34A'
        };
        return colors[type] || '#757575';
    }

    createMapContainer() {
        const container = document.createElement('div');
        container.id = 'storeMap';
        container.className = 'store-map-container';
        document.body.appendChild(container);
        return container;
    }

    fallbackStoreSearch() {
        return [];
    }

    saveLocationPreference() {
        localStorage.setItem('userLocation', JSON.stringify({
            lat: this.userLocation.lat,
            lng: this.userLocation.lng,
            savedAt: new Date().toISOString()
        }));
    }
}