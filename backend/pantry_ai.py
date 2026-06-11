import cv2
import numpy as np
from PIL import Image
import requests
import json

class PantryScanner:
    """
    Computer vision + manual input = what you can cook
    """
    
    def __init__(self):
        self.common_ingredients = [
            "rice", "pasta", "eggs", "onion", "garlic", "tomato",
            "chicken", "beef", "tofu", "broccoli", "carrot", "potato",
            "milk", "cheese", "butter", "flour", "sugar", "salt",
            "soy sauce", "oil", "vinegar", "spices"
        ]
        
    def scan_image(self, image_path):
        """Scan a photo of your pantry/fridge"""
        # In production: Use ML model for ingredient detection
        # For demo: Manual entry + recognition
        
        detected = []
        # Placeholder for actual CV model
        # model = load_model('ingredient_detector.h5')
        # detected = model.predict(image)
        
        return detected
    
    def manual_entry(self, ingredients_list):
        """User types or speaks what they have"""
        return [i.lower().strip() for i in ingredients_list]
    
    def generate_recipe_options(self, ingredients):
        """Find recipes using available ingredients"""
        matches = []
        
        # Load recipe database
        with open('../data/recipes.json', 'r') as f:
            recipes = json.load(f)
        
        for recipe in recipes:
            needed = recipe['ingredients']
            match_percentage = self.calculate_match(ingredients, needed)
            
            if match_percentage > 60:  # 60%+ match threshold
                matches.append({
                    'recipe': recipe,
                    'match': match_percentage,
                    'missing': [i for i in needed if i not in ingredients],
                    'substitutions': self.find_substitutions(ingredients, needed)
                })
        
        # Sort by highest match percentage
        matches.sort(key=lambda x: x['match'], reverse=True)
        return matches[:10]  # Top 10
    
    def calculate_match(self, have, need):
        """Calculate ingredient match percentage"""
        have_set = set(have)
        need_set = set(need)
        
        if not need_set:
            return 0
        
        matches = len(have_set.intersection(need_set))
        return (matches / len(need_set)) * 100
    
    def find_substitutions(self, have, need):
        """Find creative substitutions for missing ingredients"""
        try:
            with open('../data/substitutions.json', 'r') as f:
                subs_db = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            subs_db = {}

        substitutions = {}
        for missing in need:
            if missing not in have:
                for possible in have:
                    if possible in subs_db.get(missing, {}).get('substitutes', []):
                        substitutions[missing] = {
                            'use': possible,
                            'ratio': subs_db[missing]['substitutes'][possible],
                            'note': subs_db[missing].get('note', '')
                        }

        return substitutions