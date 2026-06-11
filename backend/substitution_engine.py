class SubstitutionEngine:
    """
    "You don't have X? Use Y. Here's how."
    """
    
    def __init__(self):
        self.substitution_rules = self.load_rules()
    
    def load_rules(self):
        return {
            # Dairy
            "buttermilk": {
                "substitutes": {
                    "milk + lemon juice": {"ratio": "1 cup milk + 1 tbsp lemon juice", "wait": "5 minutes"},
                    "yogurt": {"ratio": "1:1", "note": "thin with milk if too thick"},
                    "sour cream": {"ratio": "1:1", "note": "works in baked goods"}
                }
            },
            "heavy cream": {
                "substitutes": {
                    "milk + butter": {"ratio": "3/4 cup milk + 1/4 cup melted butter"},
                    "coconut milk": {"ratio": "1:1", "note": "adds coconut flavor"},
                    "greek yogurt": {"ratio": "1:1", "note": "works in sauces"}
                }
            },
            
            # Eggs
            "egg": {
                "substitutes": {
                    "mashed banana": {"ratio": "1/4 cup = 1 egg", "note": "best for sweet dishes"},
                    "applesauce": {"ratio": "1/4 cup = 1 egg", "note": "adds moisture"},
                    "flax egg": {"ratio": "1 tbsp flax + 3 tbsp water", "wait": "10 minutes"},
                    "tofu": {"ratio": "1/4 cup silken tofu = 1 egg", "note": "great for quiche"}
                }
            },
            
            # Flour
            "all-purpose flour": {
                "substitutes": {
                    "whole wheat flour": {"ratio": "3/4 cup = 1 cup AP", "note": "adds 2 tbsp liquid"},
                    "oat flour": {"ratio": "1:1", "note": "blend oats until fine"},
                    "almond flour": {"ratio": "1:1", "note": "adds 1 egg for binding"},
                    "coconut flour": {"ratio": "1/4 cup = 1 cup AP", "note": "adds 6 eggs per cup"}
                }
            },
            
            # Fats
            "butter": {
                "substitutes": {
                    "coconut oil": {"ratio": "1:1", "note": "adds slight coconut taste"},
                    "olive oil": {"ratio": "3/4 cup = 1 cup butter", "note": "works in savory dishes"},
                    "applesauce": {"ratio": "1/2 cup = 1 cup butter", "note": "reduces fat"},
                    "greek yogurt": {"ratio": "1/2 cup = 1 cup butter", "note": "adds protein"}
                }
            },
            
            # Herbs & Spices
            "fresh herbs": {
                "substitutes": {
                    "dried herbs": {"ratio": "1 tsp dried = 1 tbsp fresh"},
                    "herb paste": {"ratio": "1 tsp = 1 tbsp fresh"}
                }
            },
            
            # Vegetables
            "onion": {
                "substitutes": {
                    "shallot": {"ratio": "1:1", "note": "milder flavor"},
                    "leek": {"ratio": "1:1", "note": "use white/light green parts"},
                    "scallion": {"ratio": "2:1", "note": "adds green onion flavor"},
                    "onion powder": {"ratio": "1 tbsp powder = 1 medium onion"}
                }
            },
            
            "garlic": {
                "substitutes": {
                    "garlic powder": {"ratio": "1/2 tsp = 1 clove"},
                    "shallot": {"ratio": "1 small shallot = 2 cloves"},
                    "asafoetida": {"ratio": "1/8 tsp = 1 clove", "note": "Indian cooking"}
                }
            },
            
            # Protein
            "chicken breast": {
                "substitutes": {
                    "chicken thigh": {"ratio": "1:1", "note": "more flavorful, cook longer"},
                    "tofu": {"ratio": "1:1", "note": "press and marinate first"},
                    "seitan": {"ratio": "1:1", "note": "great texture substitute"}
                }
            },
            
            "ground beef": {
                "substitutes": {
                    "ground turkey": {"ratio": "1:1", "note": "add oil for moisture"},
                    "lentils": {"ratio": "1 cup cooked = 1 lb beef", "note": "great for tacos/bolognese"},
                    "mushrooms": {"ratio": "8 oz chopped = 1 lb", "note": "umami bomb"}
                }
            }
        }
    
    def suggest_substitution(self, missing_ingredient, available_ingredients):
        """Find best substitution from what user has"""
        missing = missing_ingredient.lower()
        
        if missing not in self.substitution_rules:
            return {
                "has_substitution": False,
                "message": f"Can't substitute {missing}? Try omitting or using more of something else."
            }
        
        rules = self.substitution_rules[missing]
        possible_subs = []
        
        for sub_name, details in rules['substitutes'].items():
            # Check if user has this ingredient
            user_has = any(sub_name.lower() in ing.lower() for ing in available_ingredients)
            
            possible_subs.append({
                "name": sub_name,
                "details": details,
                "user_has": user_has,
                "priority": 1 if user_has else 2
            })
        
        # Sort by what user already has
        possible_subs.sort(key=lambda x: x['priority'])
        
        return {
            "has_substitution": True,
            "missing": missing,
            "suggestions": possible_subs,
            "teaching_moment": rules.get('teaching_note', f"Did you know? You can use {possible_subs[0]['name']} instead of {missing}!")
        }
    
    def generate_alternative_method(self, recipe_step, missing_ingredient, substitution):
        """Rewrite recipe step using the substitution"""
        original = recipe_step
        adapted = original.replace(missing_ingredient, substitution['name'])
        
        return {
            "original": original,
            "adapted": adapted,
            "note": substitution['details'].get('note', ''),
            "ratio": substitution['details'].get('ratio', '1:1')
        }