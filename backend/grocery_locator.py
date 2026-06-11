import requests
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import json

class GroceryLocator:
    """
    Find every store near you + specialized shops
    Monetize by selling data to stores
    """
    
    def __init__(self):
        self.geolocator = Nominatim(user_agent="dig_in")
        self.store_types = {
            "chain_grocery": ["Trader Joe's", "Whole Foods", "Safeway", "Kroger", "Albertsons"],
            "discount": ["Aldi", "Lidl", "Grocery Outlet", "99 Ranch"],
            "corner_store": ["7-Eleven", "CVS", "Walgreens", "Dollar General"],
            "specialty": {
                "asian": ["H Mart", "Mitsuwa", "99 Ranch", "Marukai"],
                "mexican": ["Northgate", "Vallarta", "El Super"],
                "italian": ["Eataly", "local delis"],
                "organic": ["Sprouts", "Mother's Market", "Natural Grocers"]
            }
        }
    
    def find_nearby_stores(self, latitude, longitude, radius_km=5):
        """Find all grocery stores within radius"""
        # In production: Use Google Places API or OpenStreetMap
        # This is a simplified version
        
        stores = []
        
        # Mock data - in production, call actual API
        # url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius={radius_km*1000}&type=grocery_or_supermarket"
        
        # Demo stores in Culver City, LA
        demo_stores = [
            {"name": "Trader Joe's", "address": "9311 W Jefferson Blvd, Culver City", "type": "chain_grocery", "distance": 0.8, "specialties": ["organic", "affordable"]},
            {"name": "Whole Foods", "address": "12746 W Jefferson Blvd, Playa Vista", "type": "chain_grocery", "distance": 2.1, "specialties": ["organic", "specialty"]},
            {"name": "Ralphs", "address": "6000 Sepulveda Blvd, Culver City", "type": "chain_grocery", "distance": 1.2, "specialties": ["general", "affordable"]},
            {"name": "Mitsuwa Marketplace", "address": "3767 S Centinela Ave, Los Angeles", "type": "specialty_asian", "distance": 2.5, "specialties": ["japanese", "asian"]},
            {"name": "Northgate Market", "address": "4050 W Venice Blvd, Los Angeles", "type": "specialty_mexican", "distance": 3.0, "specialties": ["mexican", "latin"]},
            {"name": "Sprouts", "address": "4020 Lincoln Blvd, Marina del Rey", "type": "organic", "distance": 2.8, "specialties": ["organic", "bulk"]}
        ]
        
        for store in demo_stores:
            stores.append({
                "name": store['name'],
                "address": store['address'],
                "distance_km": store['distance'],
                "type": store['type'],
                "specialties": store['specialties'],
                "estimated_walk_time": self.calculate_walk_time(store['distance']),
                "estimated_drive_time": self.calculate_drive_time(store['distance']),
                "deals": self.get_current_deals(store['name'])
            })
        
        # Sort by distance
        stores.sort(key=lambda x: x['distance_km'])
        return stores
    
    def calculate_walk_time(self, distance_km):
        """Average walking speed 5 km/h"""
        minutes = (distance_km / 5) * 60
        return round(minutes)
    
    def calculate_drive_time(self, distance_km):
        """Average driving speed 30 km/h in city"""
        minutes = (distance_km / 30) * 60
        return round(minutes)
    
    def get_current_deals(self, store_name):
        """Fetch current deals (in production: scrape store websites or use API)"""
        deals_db = {
            "Trader Joe's": ["$2.99 organic avocados", "Buy 2 get 1 free pasta", "Seasonal fruit sale"],
            "Whole Foods": ["Prime Member deals: 20% off", "$5 Friday hot bar", "Sale on wild salmon"],
            "Mitsuwa Marketplace": ["Sashimi grade tuna $19.99/lb", "Japanese curry blocks BOGO"]
        }
        return deals_db.get(store_name, ["Check weekly ad in-store"])
    
    def find_ingredient_sources(self, ingredient, latitude, longitude):
        """Find which nearby stores carry a specific ingredient"""
        stores = self.find_nearby_stores(latitude, longitude)
        
        ingredient_sources = []
        
        for store in stores:
            specialty_match = False
            for specialty in store['specialties']:
                if specialty in self.ingredient_to_specialty(ingredient):
                    specialty_match = True
                    break
            
            ingredient_sources.append({
                "store": store['name'],
                "likely_has": specialty_match or store['type'] == "chain_grocery",
                "confidence": "High" if specialty_match else "Medium",
                "distance": store['distance_km'],
                "walk_time": store['estimated_walk_time']
            })
        
        return ingredient_sources
    
    def ingredient_to_specialty(self, ingredient):
        """Map ingredients to store specialties"""
        mapping = {
            "soy sauce": ["asian", "japanese"],
            "tofu": ["asian", "organic"],
            "tortillas": ["mexican", "latin"],
            "quinoa": ["organic", "health"],
            "nori": ["japanese", "asian"],
            "panko": ["japanese"],
            "fish sauce": ["thai", "vietnamese", "asian"],
            "curry leaves": ["indian"],
            "tahini": ["middle eastern"],
            "miso": ["japanese"]
        }
        return mapping.get(ingredient.lower(), [])
    
    def create_shopping_list(self, recipe_ingredients, user_location):
        """Create optimized shopping list by store"""
        stores = self.find_nearby_stores(user_location['lat'], user_location['lng'])
        
        shopping_plan = []
        remaining_ingredients = set(recipe_ingredients)
        
        # Try to get as much from closest store first
        for store in stores[:3]:
            store_items = []
            for ingredient in list(remaining_ingredients):
                sources = self.find_ingredient_sources(ingredient, user_location['lat'], user_location['lng'])
                for source in sources:
                    if source['store'] == store['name'] and source['likely_has']:
                        store_items.append(ingredient)
                        remaining_ingredients.remove(ingredient)
                        break
            
            if store_items:
                shopping_plan.append({
                    "store": store['name'],
                    "address": store['address'],
                    "items": store_items,
                    "distance": store['distance_km'],
                    "walk_time": store['estimated_walk_time']
                })
        
        # What's left? Might need specialty store
        if remaining_ingredients:
            shopping_plan.append({
                "store": "Specialty Store Recommended",
                "items": list(remaining_ingredients),
                "note": "Try a local specialty market or order online"
            })
        
        return shopping_plan