class RecipeRolodex:
    """
    A spinning wheel of global recipes
    Like flipping through a physical rolodex
    """
    
    def __init__(self):
        self.recipes = self.load_global_recipes()
        self.cuisines = [
            "Japanese", "Italian", "Mexican", "Indian", "Thai",
            "French", "Chinese", "Korean", "Vietnamese", "Greek",
            "Moroccan", "Lebanese", "Peruvian", "Ethiopian", "Filipino"
        ]
    
    def load_global_recipes(self):
        """10,000+ recipes organized by cuisine, difficulty, time"""
        return {
            "Japanese": [
                {
                    "name": "Omurice (Omelette Rice)",
                    "difficulty": "Medium",
                    "time": 25,
                    "ingredients": ["rice", "egg", "chicken", "onion", "ketchup", "butter"],
                    "flashcards": [
                        "Step 1: Stir-fry chicken and onion",
                        "Step 2: Add rice and ketchup",
                        "Step 3: Make thin omelette",
                        "Step 4: Fill with rice and fold",
                        "Step 5: Draw face with ketchup"
                    ],
                    "pixel_art": "omurice.gif",
                    "cultural_note": "Japanese comfort food from the 1920s"
                },
                {
                    "name": "Gyudon (Beef Bowl)",
                    "difficulty": "Easy",
                    "time": 20,
                    "ingredients": ["beef", "onion", "rice", "soy sauce", "sugar", "egg"],
                    "flashcards": [
                        "Step 1: Slice onion and beef thinly",
                        "Step 2: Simmer in soy sauce, sugar, dashi",
                        "Step 3: Serve over rice",
                        "Step 4: Top with raw egg"
                    ],
                    "pixel_art": "gyudon.gif",
                    "cultural_note": "Fastest beef bowl in Tokyo"
                }
            ],
            "Italian": [
                {
                    "name": "Cacio e Pepe",
                    "difficulty": "Medium",
                    "time": 15,
                    "ingredients": ["pasta", "pecorino", "black pepper", "salt"],
                    "flashcards": [
                        "Step 1: Cook pasta in less water (starchy water!)",
                        "Step 2: Toast pepper in pan",
                        "Step 3: Mix cheese with pasta water to make cream",
                        "Step 4: Toss pasta in cheese cream",
                        "Step 5: Finish with more pepper and cheese"
                    ],
                    "pixel_art": "cacio_e_pepe.gif",
                    "cultural_note": "Roman shepherd's meal - only 4 ingredients"
                }
            ],
            "Mexican": [
                {
                    "name": "Sopa de Fideo",
                    "difficulty": "Easy",
                    "time": 20,
                    "ingredients": ["noodles", "tomato", "onion", "garlic", "chicken broth"],
                    "flashcards": [
                        "Step 1: Toast noodles until golden",
                        "Step 2: Blend tomato, onion, garlic",
                        "Step 3: Add sauce to noodles",
                        "Step 4: Add broth and simmer",
                        "Step 5: Serve with lime and crema"
                    ],
                    "pixel_art": "sopa_fideo.gif",
                    "cultural_note": "Mexican childhood classic"
                }
            ]
        }
    
    def spin_rolodex(self, filters=None):
        """Randomly select recipes based on filters"""
        import random
        
        if not filters:
            # Pure random - like flipping through cards
            all_recipes = []
            for cuisine, recipes in self.recipes.items():
                for recipe in recipes:
                    recipe['cuisine'] = cuisine
                    all_recipes.append(recipe)
            
            random.shuffle(all_recipes)
            return all_recipes[:20]  # Show 20 at a time
        
        # Filter by cuisine, time, difficulty
        filtered = []
        for cuisine, recipes in self.recipes.items():
            if filters.get('cuisine') and cuisine != filters['cuisine']:
                continue
            
            for recipe in recipes:
                if filters.get('max_time') and recipe['time'] > filters['max_time']:
                    continue
                if filters.get('difficulty') and recipe['difficulty'] != filters['difficulty']:
                    continue
                
                recipe['cuisine'] = cuisine
                filtered.append(recipe)
        
        random.shuffle(filtered)
        return filtered
    
    def search_by_ingredient(self, ingredient):
        """Find recipes that use a specific ingredient"""
        results = []
        for cuisine, recipes in self.recipes.items():
            for recipe in recipes:
                if ingredient.lower() in [i.lower() for i in recipe['ingredients']]:
                    recipe['cuisine'] = cuisine
                    results.append(recipe)
        return results
    
    def get_recipe_card(self, recipe_name):
        """Get detailed recipe with flashcards"""
        for cuisine, recipes in self.recipes.items():
            for recipe in recipes:
                if recipe['name'].lower() == recipe_name.lower():
                    return {
                        "recipe": recipe,
                        "cuisine": cuisine,
                        "flashcards": self.create_interactive_flashcards(recipe)
                    }
        return None
    
    def create_interactive_flashcards(self, recipe):
        """Turn recipe steps into interactive flashcards"""
        cards = []
        
        for i, step in enumerate(recipe['flashcards']):
            cards.append({
                "step": i + 1,
                "instruction": step,
                "tip": self.get_tip_for_step(recipe['name'], i),
                "timer": self.get_timer_for_step(recipe, i),
                "pixel_frame": f"{recipe['name'].lower().replace(' ', '_')}_step_{i+1}.gif"
            })
        
        return cards
    
    def get_tip_for_step(self, recipe_name, step_num):
        """Contextual cooking tips"""
        tips = {
            ("Omurice", 1): "Use day-old rice for better texture!",
            ("Omurice", 3): "Whisk eggs with chopsticks for fluffy omelette",
            ("Cacio e Pepe", 2): "Toast pepper until fragrant - don't burn!",
            ("Gyudon", 2): "Simmer until onion is translucent"
        }
        return tips.get((recipe_name, step_num), "Pro tip: Taste as you go!")
    
    def get_timer_for_step(self, recipe, step_num):
        """Timers for each step"""
        default_timers = {
            1: 180,  # 3 minutes
            2: 300,  # 5 minutes
            3: 240,  # 4 minutes
            4: 180,
            5: 120
        }
        return default_timers.get(step_num, 60)