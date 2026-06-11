/**
 * Dig In Go - Map View with Restaurant Pins
 * Phase 1: Basic map functionality - No emojis
 */

const API_BASE = 'http://localhost:8000';

let map;
let userMarker;
let currentLocation = null;
let restaurantMarkers = [];
let currentRestaurant = null;

const restaurantPanel = document.getElementById('restaurantPanel');
const closePanelBtn = document.getElementById('closePanelBtn');
const checkinBtn = document.getElementById('checkinBtn');
const refreshBtn = document.getElementById('refreshBtn');
const locationBtn = document.getElementById('locationBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

function initMap() {
    const defaultCenter = [40.7128, -74.0060];
    
    map = L.map('map').setView(defaultCenter, 14);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: 'Map data OpenStreetMap contributors',
        subdomains: 'abcd',
        maxZoom: 19,
        minZoom: 12
    }).addTo(map);
    
    getUserLocation();
}

function getUserLocation() {
    if (!navigator.geolocation) {
        loadNearbyRestaurants(40.7128, -74.0060);
        return;
    }
    
    loadingOverlay.classList.remove('hidden');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            map.setView([currentLocation.lat, currentLocation.lng], 15);
            
            if (userMarker) {
                map.removeLayer(userMarker);
            }
            
            userMarker = L.marker([currentLocation.lat, currentLocation.lng], {
                icon: L.divIcon({
                    className: 'user-marker',
                    html: '📍',
                    iconSize: [24, 24]
                })
            }).addTo(map).bindPopup('Your location');
            
            loadNearbyRestaurants(currentLocation.lat, currentLocation.lng);
        },
        (error) => {
            console.error('Location error:', error);
            loadingOverlay.classList.add('hidden');
            loadNearbyRestaurants(40.7128, -74.0060);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

async function loadNearbyRestaurants(lat, lng) {
    loadingOverlay.classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_BASE}/restaurants/nearby?lat=${lat}&lng=${lng}&radius=2`);
        const data = await response.json();
        
        restaurantMarkers.forEach(marker => map.removeLayer(marker));
        restaurantMarkers = [];
        
        data.restaurants.forEach(restaurant => {
            addRestaurantMarker(restaurant);
        });
        
        loadingOverlay.classList.add('hidden');
        
    } catch (error) {
        console.error('Failed to load restaurants:', error);
        loadMockRestaurants(lat, lng);
        loadingOverlay.classList.add('hidden');
    }
}

function addRestaurantMarker(restaurant) {
    const iconHtml = getRestaurantIcon(restaurant.cuisine);
    
    const marker = L.marker([restaurant.lat, restaurant.lng], {
        icon: L.divIcon({
            className: 'restaurant-marker',
            html: iconHtml,
            iconSize: [32, 32],
            popupAnchor: [0, -16]
        })
    }).addTo(map);
    
    marker.on('click', () => {
        showRestaurantPanel(restaurant);
    });
    
    marker.bindPopup(`
        <div class="custom-popup">
            <div class="popup-restaurant-name">${restaurant.name}</div>
            <div class="popup-cuisine">${restaurant.cuisine || 'Various'}</div>
            ${restaurant.deal ? `<div class="popup-deal">${restaurant.deal.substring(0, 40)}</div>` : ''}
            <div style="font-size: 10px; color: #999; margin-top: 4px;">Tap for details</div>
        </div>
    `);
    
    restaurantMarkers.push(marker);
}

function getRestaurantIcon(cuisine) {
    const icons = {
        'pizza': '🍕',
        'burger': '🍔',
        'sushi': '🍣',
        'mexican': '🌮',
        'italian': '🍝',
        'chinese': '🥡',
        'indian': '🍛',
        'cafe': '☕',
        'bakery': '🥐',
        'default': '🏪'
    };
    
    const cuisineLower = (cuisine || '').toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
        if (cuisineLower.includes(key)) {
            return icon;
        }
    }
    return icons.default;
}

function showRestaurantPanel(restaurant) {
    currentRestaurant = restaurant;
    
    document.getElementById('restaurantIcon').textContent = getRestaurantIcon(restaurant.cuisine);
    document.getElementById('restaurantName').textContent = restaurant.name;
    document.getElementById('restaurantCuisine').textContent = restaurant.cuisine || 'Various Cuisines';
    document.getElementById('restaurantDeal').textContent = restaurant.deal || 'Check in to see daily specials';
    document.getElementById('visitCount').textContent = restaurant.visit_count || 0;
    document.getElementById('checkinCount').textContent = restaurant.checkin_count || 0;
    
    const badgeElement = document.getElementById('badgeStatus');
    if (restaurant.visit_count >= 3) {
        badgeElement.innerHTML = 'Regular Badge';
        badgeElement.style.color = '#f5a623';
    } else {
        badgeElement.innerHTML = (3 - (restaurant.visit_count || 0)) + ' more visits to unlock badge';
        badgeElement.style.color = '#888';
    }
    
    restaurantPanel.classList.add('visible');
}

function hideRestaurantPanel() {
    restaurantPanel.classList.remove('visible');
    currentRestaurant = null;
}

function handleCheckin() {
    if (!currentRestaurant) return;
    
    const confirmed = confirm(`Check in at ${currentRestaurant.name}? Take a photo of your meal to earn 50 coins.`);
    
    if (confirmed) {
        alert(`Checked in at ${currentRestaurant.name}. +50 coins earned`);
        
        currentRestaurant.checkin_count = (currentRestaurant.checkin_count || 0) + 1;
        document.getElementById('checkinCount').textContent = currentRestaurant.checkin_count;
        
        currentRestaurant.visit_count = (currentRestaurant.visit_count || 0) + 1;
        document.getElementById('visitCount').textContent = currentRestaurant.visit_count;
        
        const badgeElement = document.getElementById('badgeStatus');
        if (currentRestaurant.visit_count >= 3) {
            badgeElement.innerHTML = 'Regular Badge';
            badgeElement.style.color = '#f5a623';
        } else {
            badgeElement.innerHTML = (3 - currentRestaurant.visit_count) + ' more visits to unlock badge';
        }
    }
}

function refreshMap() {
    if (currentLocation) {
        map.setView([currentLocation.lat, currentLocation.lng], 15);
        loadNearbyRestaurants(currentLocation.lat, currentLocation.lng);
    } else {
        getUserLocation();
    }
}

function loadMockRestaurants(lat, lng) {
    restaurantMarkers.forEach(marker => map.removeLayer(marker));
    restaurantMarkers = [];
    
    const mockRestaurants = [
        { id: 1, name: "The Burger Joint", lat: lat + 0.005, lng: lng - 0.003, cuisine: "Burgers, American", deal: "Buy one get one free on Tuesdays", visit_count: 2, checkin_count: 2 },
        { id: 2, name: "Sushi Master", lat: lat - 0.004, lng: lng + 0.006, cuisine: "Japanese, Sushi", deal: "20 percent off lunch special", visit_count: 0, checkin_count: 0 },
        { id: 3, name: "Taco Fiesta", lat: lat + 0.008, lng: lng + 0.002, cuisine: "Mexican, Tacos", deal: "Taco Tuesday - 1.50 per taco", visit_count: 5, checkin_count: 5 },
        { id: 4, name: "Pizza Paradise", lat: lat - 0.007, lng: lng - 0.005, cuisine: "Italian, Pizza", deal: "Large pizza for 12.99", visit_count: 1, checkin_count: 1 },
        { id: 5, name: "Green Leaf Cafe", lat: lat + 0.002, lng: lng - 0.008, cuisine: "Cafe, Sandwiches", deal: "Coffee and pastry for 6", visit_count: 0, checkin_count: 0 }
    ];
    
    mockRestaurants.forEach(restaurant => {
        addRestaurantMarker(restaurant);
    });
}

closePanelBtn.addEventListener('click', hideRestaurantPanel);
checkinBtn.addEventListener('click', handleCheckin);
refreshBtn.addEventListener('click', refreshMap);
locationBtn.addEventListener('click', refreshMap);

map?.on('click', () => {
    hideRestaurantPanel();
});

document.addEventListener('DOMContentLoaded', () => {
    initMap();
});