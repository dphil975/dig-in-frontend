#!/usr/bin/env python3
"""
PHASE 7 BATCH 4: More Asia-Pacific expansion
Thailand-expanded, Indonesia-expanded, Singapore-expanded, Philippines-expanded
"""
import json, os

PHASE_7_BATCH_4 = {
    "Thailand": {
        "country": "Thailand",
        "region": "Southeast Asia",
        "breakfast": [
            {"id": "tha-break-congee", "name": "Thai Rice Congee", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 30, "description": "Thai rice porridge", "seasonings": ["ginger"], "ingredients": ["Rice", "Broth", "Ginger", "Chicken", "Green onion"], "instructions": ["Boil broth", "Add rice", "Simmer 25-30 minutes", "Top with chicken", "Add ginger and green onion"], "notes": "Creamy consistency", "fun_fact": "Jok is Thai breakfast", "alternatives": ["Different toppings", "More broth", "With fish"]}
        ],
        "lunch": [
            {"id": "tha-lunch-massaman", "name": "Massaman Curry", "difficulty": "Hard", "servings": 4, "prepTime": 20, "cookTime": 40, "description": "Thai Muslim-style curry", "seasonings": ["cumin", "cinnamon"], "ingredients": ["Beef", "Curry paste", "Coconut milk", "Potato", "Peanuts", "Tamarind"], "instructions": ["Brown beef", "Add curry paste", "Add coconut milk", "Add potato", "Simmer 30 minutes", "Add peanuts and tamarind"], "notes": "Rich and spicy", "fun_fact": "Massaman is Thai classic", "alternatives": ["Chicken instead of beef", "Without peanuts", "More coconut milk"]}
        ],
        "dinner": [
            {"id": "tha-dinner-larb", "name": "Larb (Spicy Meat Salad)", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 20, "description": "Thai spiced ground meat", "seasonings": ["chili", "lime"], "ingredients": ["Ground meat", "Lime juice", "Fish sauce", "Chili", "Mint", "Cilantro", "Rice powder"], "instructions": ["Brown meat", "Mix lime juice and fish sauce", "Add to meat", "Add rice powder", "Add herbs", "Serve warm"], "notes": "Spicy and tangy", "fun_fact": "Larb is Isaan specialty", "alternatives": ["Chicken instead of pork", "Less spicy", "More herbs"]}
        ],
        "snacks": [
            {"id": "tha-snack-satay", "name": "Satay (Peanut Skewers)", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 15, "description": "Thai grilled meat with peanut sauce", "seasonings": ["cumin"], "ingredients": ["Meat", "Coconut milk", "Peanuts", "Garlic", "Cumin", "Oil"], "instructions": ["Marinate meat", "Thread onto skewers", "Grill until charred", "Make peanut sauce", "Serve with sauce"], "notes": "Tender meat", "fun_fact": "Satay is popular snack", "alternatives": ["Chicken instead of beef", "Different sauce", "Without peanuts"]}
        ],
        "desserts": [
            {"id": "tha-dessert-khao", "name": "Khao Maeng Gai (Mango Sticky Rice)", "difficulty": "Medium", "servings": 4, "prepTime": 10, "cookTime": 30, "description": "Thai mango with sticky rice", "seasonings": [], "ingredients": ["Sticky rice", "Coconut milk", "Sugar", "Ripe mango", "Salt"], "instructions": ["Cook sticky rice", "Heat coconut milk with sugar and salt", "Mix into rice", "Let rest 30 minutes", "Serve with sliced mango"], "notes": "Creamy and sweet", "fun_fact": "Khao maeng gai is Thai favorite", "alternatives": ["Different fruit", "Less sugar", "More coconut"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "tha-drink-iced", "name": "Thai Iced Coffee", "difficulty": "Easy", "servings": 1, "prepTime": 5, "cookTime": 10, "description": "Strong iced Thai coffee", "seasonings": [], "ingredients": ["Strong coffee", "Sweetened condensed milk", "Ice"], "instructions": ["Brew strong coffee", "Pour over ice", "Add sweetened condensed milk", "Stir and serve"], "notes": "Very sweet", "fun_fact": "Thai coffee culture", "alternatives": ["With evaporated milk", "Less sweet", "Hot version"]}
        ],
        "alcoholicDrinks": [
            {"id": "tha-drink-beer", "name": "Thai Beer", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Popular Thai beer brands", "seasonings": [], "ingredients": ["Thai beer"], "instructions": ["Serve very cold", "Drink with spicy food"], "notes": "Perfect for heat", "fun_fact": "Thai beer culture", "alternatives": ["Different brands", "Local craft beers", "Different strength"]}
        ]
    },
    "Indonesia": {
        "country": "Indonesia",
        "region": "Southeast Asia",
        "breakfast": [
            {"id": "ido-break-soto", "name": "Soto Ayam (Chicken Soup)", "difficulty": "Medium", "servings": 4, "prepTime": 20, "cookTime": 35, "description": "Indonesian yellow chicken soup", "seasonings": ["turmeric", "cumin"], "ingredients": ["Chicken", "Turmeric", "Cumin", "Garlic", "Ginger", "Onion", "Potato", "Broth"], "instructions": ["Boil chicken", "Make spice paste", "Sauté paste", "Add broth", "Add chicken and potato", "Simmer 20 minutes"], "notes": "Warming and fragrant", "fun_fact": "Soto ayam is street breakfast", "alternatives": ["Without potato", "More spicy", "Different vegetables"]}
        ],
        "lunch": [
            {"id": "ido-lunch-nasi", "name": "Nasi Kuning (Yellow Rice)", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 30, "description": "Indonesian turmeric rice", "seasonings": ["turmeric", "cumin"], "ingredients": ["Rice", "Coconut milk", "Turmeric", "Cumin", "Garlic", "Onion"], "instructions": ["Sauté garlic and onion", "Add rice, toast lightly", "Add coconut milk", "Add turmeric and cumin", "Bring to boil", "Cover, simmer 20 minutes"], "notes": "Golden color", "fun_fact": "Nasi kuning for celebrations", "alternatives": ["Without coconut milk", "More spicy", "With peas"]}
        ],
        "dinner": [
            {"id": "ido-dinner-rendang", "name": "Rendang (Meat Curry)", "difficulty": "Hard", "servings": 4, "prepTime": 25, "cookTime": 60, "description": "Indonesian slow-cooked meat in spice paste", "seasonings": ["cumin", "coriander"], "ingredients": ["Beef", "Coconut milk", "Spice paste", "Garlic", "Ginger", "Chili"], "instructions": ["Make spice paste", "Brown meat", "Add coconut milk", "Simmer 45-60 minutes", "Cook until dry", "Oil coats meat"], "notes": "Rich and complex", "fun_fact": "Rendang is UNESCO dish", "alternatives": ["Chicken instead of beef", "More spicy", "Creamier version"]}
        ],
        "snacks": [
            {"id": "ido-snack-lumpia", "name": "Lumpia (Spring Rolls)", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 15, "description": "Indonesian fried spring rolls", "seasonings": [], "ingredients": ["Spring roll wrappers", "Filling: cabbage, carrots, meat", "Oil for frying"], "instructions": ["Prepare filling", "Place on wrapper", "Roll tightly", "Seal edges with water", "Deep fry until crispy"], "notes": "Serve with sweet sauce", "fun_fact": "Lumpia is street food", "alternatives": ["Vegetarian version", "Larger rolls", "Different filling"]}
        ],
        "desserts": [
            {"id": "ido-dessert-cendol", "name": "Cendol (Green Jelly Dessert)", "difficulty": "Medium", "servings": 4, "prepTime": 20, "cookTime": 30, "description": "Indonesian green rice flour jelly", "seasonings": ["pandan"], "ingredients": ["Rice flour", "Pandan leaves", "Coconut milk", "Sugar", "Ice", "Brown sugar syrup"], "instructions": ["Make pandan rice jelly", "Cut into thin noodles", "Make syrup", "Add brown sugar syrup", "Top with coconut milk", "Serve over ice"], "notes": "Refreshing", "fun_fact": "Cendol is Southeast Asian favorite", "alternatives": ["Without pandan", "Different toppings", "Warmer version"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "ido-drink-fresh", "name": "Fresh Juice (Es Buah)", "difficulty": "Easy", "servings": 2, "prepTime": 10, "cookTime": 0, "description": "Indonesian fresh fruit juice", "seasonings": [], "ingredients": ["Fresh fruit", "Sugar", "Ice", "Water"], "instructions": ["Blend fruit with water", "Strain", "Add sugar", "Serve over ice"], "notes": "Refreshing", "fun_fact": "Street juice vendors in Indonesia", "alternatives": ["Different fruits", "Less sugar", "With condensed milk"]}
        ],
        "alcoholicDrinks": [
            {"id": "ido-drink-arak", "name": "Arak (Rice Spirit)", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Indonesian rice liquor", "seasonings": [], "ingredients": ["Arak"], "instructions": ["Serve neat or mixed", "Drink slowly", "Traditional spirit"], "notes": "Strong spirit", "fun_fact": "Arak is Indonesian spirit", "alternatives": ["Mixed drinks", "Different brands", "Different strength"]}
        ]
    },
    "Singapore": {
        "country": "Singapore",
        "region": "Southeast Asia",
        "breakfast": [
            {"id": "sgp-break-toast", "name": "Kaya Toast", "difficulty": "Easy", "servings": 2, "prepTime": 5, "cookTime": 10, "description": "Singapore coconut jam toast", "seasonings": [], "ingredients": ["Bread", "Kaya (coconut jam)", "Butter", "Eggs", "Sugar"], "instructions": ["Toast bread", "Spread kaya and butter", "Serve with soft boiled eggs", "Mix yolk with sugar", "Dip toast in eggs"], "notes": "Sweet and savory", "fun_fact": "Kaya toast is Singaporean breakfast", "alternatives": ["Without butter", "Thicker kaya", "Different bread"]}
        ],
        "lunch": [
            {"id": "sgp-lunch-chicken", "name": "Hainanese Chicken Rice", "difficulty": "Medium", "servings": 4, "prepTime": 20, "cookTime": 40, "description": "Singapore poached chicken with rice", "seasonings": ["ginger"], "ingredients": ["Whole chicken", "Rice", "Ginger", "Garlic", "Chili sauce", "Soy sauce"], "instructions": ["Poach chicken in broth", "Cook rice in chicken broth", "Slice chicken", "Serve with rice and sauces"], "notes": "Delicate chicken", "fun_fact": "Hainanese chicken is Singaporean favorite", "alternatives": ["Chicken only", "Different sauce", "With soup"]}
        ],
        "dinner": [
            {"id": "sgp-dinner-laksa", "name": "Laksa (Coconut Noodle Soup)", "difficulty": "Hard", "servings": 4, "prepTime": 25, "cookTime": 35, "description": "Singapore spicy coconut noodle soup", "seasonings": ["chili", "turmeric"], "ingredients": ["Noodles", "Coconut milk", "Spice paste", "Shrimp", "Tofu", "Broth"], "instructions": ["Make spice paste", "Cook in coconut milk", "Add broth", "Add noodles and proteins", "Simmer 15 minutes", "Serve hot"], "notes": "Rich and spicy", "fun_fact": "Laksa is Singapore's soul food", "alternatives": ["More vegetables", "Without shrimp", "Simpler version"]}
        ],
        "snacks": [
            {"id": "sgp-snack-popiah", "name": "Popiah (Fresh Spring Rolls)", "difficulty": "Medium", "servings": 12, "prepTime": 25, "cookTime": 0, "description": "Singapore fresh spring rolls", "seasonings": [], "ingredients": ["Popiah wrappers", "Filling: bean sprouts, vegetables", "Peanut sauce", "Chili sauce"], "instructions": ["Prepare fillings", "Warm wrapper", "Fill with vegetables", "Roll tightly", "Serve with sauces"], "notes": "Serve immediately", "fun_fact": "Popiah is fresh and healthy", "alternatives": ["Different fillings", "Without sauce", "Larger rolls"]}
        ],
        "desserts": [
            {"id": "sgp-dessert-chendol", "name": "Chendol", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 20, "description": "Singapore green jelly with coconut", "seasonings": ["pandan"], "ingredients": ["Pandan rice flour jelly", "Coconut milk", "Brown sugar syrup", "Ice"], "instructions": ["Make pandan jelly", "Cut into noodles", "Add syrup", "Top with coconut milk", "Serve over ice"], "notes": "Very refreshing", "fun_fact": "Chendol is popular in Singapore", "alternatives": ["Without pandan", "More coconut", "Different toppings"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "sgp-drink-kopi", "name": "Kopi (Singapore Coffee)", "difficulty": "Easy", "servings": 1, "prepTime": 5, "cookTime": 10, "description": "Strong roasted coffee", "seasonings": [], "ingredients": ["Roasted coffee", "Water", "Condensed milk"], "instructions": ["Brew strong coffee", "Add condensed milk", "Stir well", "Serve hot or iced"], "notes": "Very strong", "fun_fact": "Kopi culture in Singapore", "alternatives": ["Without milk", "Different roast", "Iced version"]}
        ],
        "alcoholicDrinks": [
            {"id": "sgp-drink-beer", "name": "Singapore Beer", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Popular Singapore beer", "seasonings": [], "ingredients": ["Singapore beer"], "instructions": ["Serve very cold", "Enjoy with food"], "notes": "Refreshing", "fun_fact": "Beer culture in Singapore", "alternatives": ["Different brands", "Local craft beers", "Different strength"]}
        ]
    },
    "Philippines": {
        "country": "Philippines",
        "region": "Southeast Asia",
        "breakfast": [
            {"id": "phl-break-lugaw", "name": "Lugaw (Rice Porridge)", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 30, "description": "Filipino chicken rice porridge", "seasonings": ["ginger"], "ingredients": ["Rice", "Chicken broth", "Chicken", "Ginger", "Garlic"], "instructions": ["Boil broth", "Add rice", "Simmer 25-30 minutes", "Add chicken", "Top with ginger and garlic"], "notes": "Comforting", "fun_fact": "Lugaw is Filipino breakfast", "alternatives": ["Only broth", "More chicken", "With egg"]}
        ],
        "lunch": [
            {"id": "phl-lunch-adobo", "name": "Chicken Adobo", "difficulty": "Medium", "servings": 4, "prepTime": 10, "cookTime": 45, "description": "Filipino chicken braised in vinegar", "seasonings": ["bay leaf"], "ingredients": ["Chicken", "Vinegar", "Soy sauce", "Garlic", "Bay leaves", "Oil"], "instructions": ["Brown chicken", "Add vinegar and soy sauce", "Add garlic and bay leaves", "Braise 35 minutes", "Serve with rice"], "notes": "Tangy and savory", "fun_fact": "Adobo is Filipino national dish", "alternatives": ["Pork instead of chicken", "More vinegar", "With potatoes"]}
        ],
        "dinner": [
            {"id": "phl-dinner-kare", "name": "Kare-Kare (Peanut Stew)", "difficulty": "Hard", "servings": 6, "prepTime": 20, "cookTime": 60, "description": "Filipino peanut meat stew", "seasonings": ["garlic"], "ingredients": ["Meat", "Peanut butter", "Onion", "Garlic", "Vegetables", "Broth"], "instructions": ["Brown meat", "Sauté onion and garlic", "Add peanut butter", "Add broth", "Add vegetables", "Simmer 45 minutes"], "notes": "Rich and creamy", "fun_fact": "Kare-kare is special occasion dish", "alternatives": ["Different vegetables", "Without peanuts", "More sauce"]}
        ],
        "snacks": [
            {"id": "phl-snack-lumpia", "name": "Lumpia (Fried Spring Rolls)", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 15, "description": "Filipino spring rolls", "seasonings": [], "ingredients": ["Lumpia wrappers", "Filling: pork, vegetables", "Oil for frying"], "instructions": ["Prepare filling", "Fill wrappers", "Roll tightly", "Seal edges", "Deep fry until golden"], "notes": "Crispy", "fun_fact": "Lumpia is Filipino appetizer", "alternatives": ["Vegetarian", "Shrimp filling", "Baked version"]}
        ],
        "desserts": [
            {"id": "phl-dessert-halo", "name": "Halo-Halo (Mixed Shaved Ice)", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 0, "description": "Filipino rainbow shaved ice", "seasonings": [], "ingredients": ["Shaved ice", "Condensed milk", "Evaporated milk", "Toppings: beans, corn, fruits"], "instructions": ["Layer toppings in glass", "Add shaved ice", "Pour condensed milk", "Add evaporated milk", "Stir before eating"], "notes": "Very refreshing", "fun_fact": "Halo-halo is Filipino summer", "alternatives": ["Different toppings", "More ice", "Less milk"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "phl-drink-buko", "name": "Buko Juice (Young Coconut)", "difficulty": "Easy", "servings": 1, "prepTime": 5, "cookTime": 0, "description": "Fresh young coconut juice", "seasonings": [], "ingredients": ["Young coconut"], "instructions": ["Chop off top", "Drink juice directly", "Scoop flesh with spoon"], "notes": "Naturally sweet", "fun_fact": "Buko juice is Filipino favorite", "alternatives": ["With sugar", "Blended", "Frozen"]}
        ],
        "alcoholicDrinks": [
            {"id": "phl-drink-lambanog", "name": "Lambanog (Coconut Brandy)", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Filipino coconut spirit", "seasonings": [], "ingredients": ["Lambanog"], "instructions": ["Serve neat or mixed", "Traditional spirit", "Strong and warming"], "notes": "Very strong", "fun_fact": "Lambanog is Filipino brandy", "alternatives": ["Mixed drinks", "Different brands", "Different strength"]}
        ]
    }
}

def expand_phase_7_batch_4():
    os.makedirs('data/phase7-recipes', exist_ok=True)
    for country, data in PHASE_7_BATCH_4.items():
        filename = f"data/phase7-recipes/{country.lower().replace(' ', '_')}-phase7-authentic.json"
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        recipes = sum(len(data.get(cat, []))
                     for cat in ['breakfast', 'lunch', 'dinner', 'snacks',
                                'desserts', 'nonAlcoholicDrinks', 'alcoholicDrinks'])
        print(f"✓ {country:<25} | {recipes} recipes")

if __name__ == "__main__":
    print("\n🌍 PHASE 7 BATCH 4: More Asia-Pacific Expansion")
    print("="*80 + "\n")
    expand_phase_7_batch_4()
    print("\n✓ Batch 4 complete!")
