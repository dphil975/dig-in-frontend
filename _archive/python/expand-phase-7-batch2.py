#!/usr/bin/env python3
"""
PHASE 7 BATCH 2: Balkans and Eastern Europe expansion
Serbia, Croatia, Hungary, Romania
"""
import json, os

PHASE_7_BATCH_2 = {
    "Serbia": {
        "country": "Serbia",
        "region": "Balkans",
        "breakfast": [
            {"id": "srb-break-kajmak", "name": "Kajmak with Bread", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 10, "description": "Serbian cream cheese served with fresh bread", "seasonings": [], "ingredients": ["Kajmak (Serbian cream cheese)", "Fresh bread", "Salt", "Pepper"], "instructions": ["Slice fresh bread", "Spread kajmak generously", "Add salt and pepper", "Serve with tea or coffee"], "notes": "Kajmak is essential", "fun_fact": "Kajmak is Serbian national treasure", "alternatives": ["Different cheese", "Whole grain bread", "Add honey"]}
        ],
        "lunch": [
            {"id": "srb-lunch-pljeskavica", "name": "Pljeskavica (Serbian Burger)", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 20, "description": "Serbian spiced ground meat patty", "seasonings": ["paprika", "garlic"], "ingredients": ["1.5 lbs ground meat", "Onion", "Garlic", "Paprika", "Bread crumbs", "Egg", "Oil for frying"], "instructions": ["Mix meat with onion, garlic, spices", "Add bread crumbs and egg", "Form large patties", "Fry in oil at medium-high heat", "Cook 10 minutes per side", "Serve with ajvar and bread"], "notes": "Thick and juicy", "fun_fact": "Pljeskavica is Serbian street food favorite", "alternatives": ["Chicken instead of beef", "Baked version", "Different sauce"]}
        ],
        "dinner": [
            {"id": "srb-dinner-ajvar", "name": "Ajvar (Red Pepper Spread)", "difficulty": "Medium", "servings": 6, "prepTime": 20, "cookTime": 45, "description": "Serbian roasted red pepper sauce", "seasonings": ["garlic"], "ingredients": ["8 red peppers", "4 cloves garlic", "1/4 cup oil", "Salt", "Pepper", "Vinegar"], "instructions": ["Roast peppers over flame", "Peel off skin", "Grind or blend peppers", "Sauté garlic in oil", "Add peppers", "Cook down 20 minutes", "Add salt, pepper, vinegar", "Serve at room temperature"], "notes": "Can be canned", "fun_fact": "Ajvar is Serbian staple condiment", "alternatives": ["Add eggplant", "Spicier version", "Blended smooth"]}
        ],
        "snacks": [
            {"id": "srb-snack-burek", "name": "Burek (Meat Pastry)", "difficulty": "Hard", "servings": 8, "prepTime": 30, "cookTime": 40, "description": "Serbian phyllo pastry filled with meat", "seasonings": ["onion"], "ingredients": ["Phyllo dough", "1 lb ground meat", "1 onion", "Egg", "Butter", "Oil"], "instructions": ["Brown meat with onion", "Mix in egg", "Layer phyllo with butter", "Add meat filling", "Roll or fold", "Brush with butter", "Bake at 375°F for 35-40 minutes"], "notes": "Requires patience", "fun_fact": "Burek is Balkan classic", "alternatives": ["Cheese filling", "Vegetable filling", "Different shape"]}
        ],
        "desserts": [
            {"id": "srb-dessert-baklava", "name": "Baklava", "difficulty": "Hard", "servings": 16, "prepTime": 30, "cookTime": 45, "description": "Phyllo with walnuts and honey", "seasonings": ["cinnamon"], "ingredients": ["Phyllo dough", "Walnuts", "Butter", "Honey", "Sugar", "Cinnamon", "Water"], "instructions": ["Layer phyllo with butter", "Sprinkle walnuts", "Layer more phyllo", "Cut into diamonds", "Bake at 350°F for 40 minutes", "Make honey syrup", "Pour over hot baklava"], "notes": "Must be hot", "fun_fact": "Baklava is Balkan treasure", "alternatives": ["Pistachios instead of walnuts", "Different spices", "Lighter honey"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "srb-drink-tea", "name": "Serbian Fruit Tea", "difficulty": "Easy", "servings": 2, "prepTime": 5, "cookTime": 10, "description": "Hot fruit tea with honey", "seasonings": ["honey"], "ingredients": ["Water", "Dried fruit", "Honey", "Lemon"], "instructions": ["Heat water", "Add dried fruit", "Steep 5-8 minutes", "Add honey", "Add lemon juice", "Serve hot"], "notes": "Very soothing", "fun_fact": "Tea culture in Serbia is strong", "alternatives": ["Fresh fruit", "Different fruits", "Cold version"]}
        ],
        "alcoholicDrinks": [
            {"id": "srb-drink-rakija", "name": "Rakija (Fruit Brandy)", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Serbian traditional brandy from plums", "seasonings": [], "ingredients": ["Rakija"], "instructions": ["Serve in small glass", "Drink slowly with food", "Strong and warming"], "notes": "Very strong spirit", "fun_fact": "Rakija is Serbian national drink", "alternatives": ["Different fruit varieties", "Homemade version", "Different alcohol content"]}
        ]
    },
    "Croatia": {
        "country": "Croatia",
        "region": "Balkans",
        "breakfast": [
            {"id": "cro-break-ajvar", "name": "Ajvar and Cheese Toast", "difficulty": "Easy", "servings": 2, "prepTime": 5, "cookTime": 5, "description": "Croatian breakfast toast", "seasonings": [], "ingredients": ["Bread", "Ajvar", "Cheese", "Olive oil"], "instructions": ["Toast bread", "Spread ajvar", "Add cheese", "Drizzle olive oil", "Serve warm"], "notes": "Quick breakfast", "fun_fact": "Toast is Croatian breakfast", "alternatives": ["Without cheese", "Add egg", "Different spreads"]}
        ],
        "lunch": [
            {"id": "cro-lunch-dalmatian", "name": "Dalmatian Pasta Dish", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 30, "description": "Croatian pasta with seafood", "seasonings": ["garlic"], "ingredients": ["Pasta", "Squid", "Shrimp", "Garlic", "White wine", "Oil", "Parsley"], "instructions": ["Cook pasta", "Sauté garlic", "Add squid, cook 15 minutes", "Add shrimp", "Add white wine", "Toss with pasta", "Garnish with parsley"], "notes": "Fresh seafood", "fun_fact": "Dalmatian coast is famous", "alternatives": ["Only squid", "Only shrimp", "With tomato"]}
        ],
        "dinner": [
            {"id": "cro-dinner-pašticada", "name": "Pašticada (Beef Stew)", "difficulty": "Hard", "servings": 6, "prepTime": 20, "cookTime": 120, "description": "Croatian marinated beef stew", "seasonings": ["bay leaf", "thyme"], "ingredients": ["2 lbs beef", "Wine", "Vinegar", "Onion", "Carrot", "Bay leaf", "Thyme", "Prunes"], "instructions": ["Marinate beef overnight", "Brown in pot", "Add vegetables", "Add herbs and wine", "Slow cook 2 hours", "Add prunes", "Serve with gnocchi"], "notes": "Low and slow", "fun_fact": "Pašticada is Croatian classic", "alternatives": ["Without prunes", "More vegetables", "Faster cooking"]}
        ],
        "snacks": [
            {"id": "cro-snack-ćevapčići", "name": "Ćevapčići (Grilled Meat)", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 15, "description": "Croatian grilled meat skewers", "seasonings": ["paprika", "garlic"], "ingredients": ["1.5 lbs ground meat", "Onion", "Paprika", "Garlic", "Oil"], "instructions": ["Mix meat with onion, spices", "Form into long sausages", "Grill over charcoal", "Turn frequently", "Serve with bread and ajvar"], "notes": "Char the outside", "fun_fact": "Ćevapčići are Balkan favorite", "alternatives": ["Chicken version", "Lamb version", "Longer sausages"]}
        ],
        "desserts": [
            {"id": "cro-dessert-krafne", "name": "Krafne (Jam Donuts)", "difficulty": "Medium", "servings": 12, "prepTime": 30, "cookTime": 20, "description": "Croatian jam-filled donuts", "seasonings": [], "ingredients": ["Dough: flour, yeast, milk, sugar", "Jam", "Oil for frying", "Powdered sugar"], "instructions": ["Make yeast dough", "Let rise", "Divide and fill with jam", "Let rise again", "Deep fry until golden", "Roll in powdered sugar"], "notes": "Puffy and tender", "fun_fact": "Krafne are Croatian treat", "alternatives": ["Different jam", "Chocolate filling", "Custard filling"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "cro-drink-coffee", "name": "Croatian Coffee", "difficulty": "Easy", "servings": 1, "prepTime": 5, "cookTime": 10, "description": "Strong Turkish-style coffee", "seasonings": [], "ingredients": ["Coffee grounds", "Water", "Sugar (optional)"], "instructions": ["Heat water in cezve", "Add finely ground coffee", "Add sugar if desired", "Heat until foaming", "Pour into cup", "Serve strong"], "notes": "Very strong", "fun_fact": "Coffee culture in Croatia", "alternatives": ["Without sugar", "Topped with foam", "Different strength"]}
        ],
        "alcoholicDrinks": [
            {"id": "cro-drink-wine", "name": "Croatian Wine", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Quality wine from Croatian regions", "seasonings": [], "ingredients": ["Croatian wine"], "instructions": ["Serve at proper temperature", "Red wines room temperature", "White wines chilled", "Enjoy with food"], "notes": "Growing wine region", "fun_fact": "Dalmatian wine is excellent", "alternatives": ["Different varieties", "Red or white", "Different regions"]}
        ]
    },
    "Hungary": {
        "country": "Hungary",
        "region": "Eastern Europe",
        "breakfast": [
            {"id": "hun-break-langos", "name": "Lángos (Fried Bread)", "difficulty": "Medium", "servings": 8, "prepTime": 30, "cookTime": 15, "description": "Hungarian fried bread with garlic", "seasonings": ["garlic"], "ingredients": ["Dough: flour, yeast, milk, salt", "Oil for frying", "Garlic", "Sour cream"], "instructions": ["Make yeast dough", "Let rise 1 hour", "Divide into pieces", "Deep fry until golden", "Rub with garlic", "Serve with sour cream"], "notes": "Serve hot", "fun_fact": "Lángos is Hungarian favorite", "alternatives": ["Savory version", "Sweet version", "With cheese"]}
        ],
        "lunch": [
            {"id": "hun-lunch-goulash", "name": "Hungarian Goulash", "difficulty": "Hard", "servings": 6, "prepTime": 20, "cookTime": 90, "description": "Hungarian beef stew with paprika", "seasonings": ["paprika"], "ingredients": ["2 lbs beef", "Onions", "Paprika (Hungarian)", "Caraway", "Potato", "Pepper", "Oil", "Broth"], "instructions": ["Brown meat", "Sauté onions", "Add paprika", "Add beef", "Add broth", "Slow cook 60 minutes", "Add potatoes", "Cook 30 more minutes"], "notes": "True paprika essential", "fun_fact": "Goulash is Hungarian national dish", "alternatives": ["Pork instead of beef", "With sour cream", "Extra vegetables"]}
        ],
        "dinner": [
            {"id": "hun-dinner-paprikash", "name": "Paprikash (Chicken Stew)", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 45, "description": "Hungarian chicken in paprika sauce", "seasonings": ["paprika"], "ingredients": ["1.5 lbs chicken", "Onion", "Paprika", "Sour cream", "Broth", "Oil"], "instructions": ["Brown chicken", "Sauté onions", "Add paprika", "Add broth", "Simmer 30 minutes", "Stir in sour cream", "Serve with egg noodles"], "notes": "Creamy and comforting", "fun_fact": "Paprikash is everyday meal", "alternatives": ["Beef instead of chicken", "More sour cream", "Extra vegetables"]}
        ],
        "snacks": [
            {"id": "hun-snack-flódni", "name": "Flódni (Jam Pastry)", "difficulty": "Hard", "servings": 12, "prepTime": 40, "cookTime": 40, "description": "Hungarian pastry with jams and nuts", "seasonings": [], "ingredients": ["Pastry dough", "Apple jam", "Plum jam", "Walnut paste", "Raisins", "Butter"], "instructions": ["Make pastry", "Divide into layers", "Layer with different fillings", "Roll into spiral", "Bake at 375°F for 40 minutes", "Cool and slice"], "notes": "Complex pastry", "fun_fact": "Flódni is traditional Hungarian", "alternatives": ["Different jams", "Without nuts", "Different shape"]}
        ],
        "desserts": [
            {"id": "hun-dessert-dobos", "name": "Dobos Torte", "difficulty": "Hard", "servings": 12, "prepTime": 45, "cookTime": 30, "description": "Hungarian caramel layer cake", "seasonings": ["vanilla"], "ingredients": ["Eggs", "Sugar", "Flour", "Chocolate", "Butter", "Caramel"], "instructions": ["Make thin sponge layers", "Bake each layer", "Make chocolate cream", "Layer with cream", "Make caramel", "Top with caramel and chocolate"], "notes": "Impressive presentation", "fun_fact": "Dobos is Hungarian classic", "alternatives": ["Without caramel", "Different cream", "Fewer layers"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "hun-drink-chocolate", "name": "Hungarian Hot Chocolate", "difficulty": "Easy", "servings": 2, "prepTime": 5, "cookTime": 10, "description": "Rich hot chocolate", "seasonings": [], "ingredients": ["Whole milk", "Dark chocolate", "Sugar", "Whipped cream"], "instructions": ["Heat milk", "Add chopped chocolate", "Whisk until smooth", "Pour into cup", "Top with whipped cream"], "notes": "Very rich", "fun_fact": "Hungarian chocolate tradition", "alternatives": ["With cinnamon", "Less chocolate", "With cognac"]}
        ],
        "alcoholicDrinks": [
            {"id": "hun-drink-pálinka", "name": "Pálinka (Fruit Brandy)", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Hungarian fruit brandy", "seasonings": [], "ingredients": ["Pálinka"], "instructions": ["Serve in small glass", "Room temperature", "Drink slowly"], "notes": "Very strong", "fun_fact": "Pálinka is Hungarian spirit", "alternatives": ["Different fruits", "Homemade", "Different strength"]}
        ]
    },
    "Romania": {
        "country": "Romania",
        "region": "Eastern Europe",
        "breakfast": [
            {"id": "rom-break-mălai", "name": "Mălai (Cornmeal Porridge)", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 30, "description": "Romanian cornmeal breakfast", "seasonings": ["salt"], "ingredients": ["Cornmeal", "Water", "Salt", "Butter", "Cheese"], "instructions": ["Boil water with salt", "Slowly add cornmeal while stirring", "Cook 20-30 minutes, stirring constantly", "Add butter and cheese", "Serve hot"], "notes": "Requires constant stirring", "fun_fact": "Mălai is Romanian staple", "alternatives": ["With sour cream", "Sweet version", "Plain version"]}
        ],
        "lunch": [
            {"id": "rom-lunch-mici", "name": "Mici (Grilled Sausages)", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 15, "description": "Romanian grilled meat rolls", "seasonings": ["garlic", "paprika"], "ingredients": ["1 lb ground meat", "Garlic", "Paprika", "Caraway", "Oil"], "instructions": ["Mix meat with spices", "Form into rolls", "Refrigerate 30 minutes", "Grill over charcoal", "Turn frequently", "Serve with mustard and bread"], "notes": "Must chill first", "fun_fact": "Mici are Romanian street food", "alternatives": ["Lamb instead of beef", "Spicier version", "Longer rolls"]}
        ],
        "dinner": [
            {"id": "rom-dinner-ciorbă", "name": "Ciorbă (Sour Soup)", "difficulty": "Medium", "servings": 6, "prepTime": 20, "cookTime": 60, "description": "Romanian sour beef soup", "seasonings": ["bay leaf"], "ingredients": ["1.5 lbs beef", "Vegetables", "Broth", "Sour cream or vinegar", "Bay leaves", "Oil"], "instructions": ["Brown beef", "Add broth and vegetables", "Simmer 45 minutes", "Add sour cream or vinegar", "Simmer 15 more minutes", "Season to taste"], "notes": "Sour is key", "fun_fact": "Ciorbă is Romanian classic", "alternatives": ["With cabbage", "More vegetables", "Less sour"]}
        ],
        "snacks": [
            {"id": "rom-snack-cozonac", "name": "Cozonac (Sweet Bread)", "difficulty": "Hard", "servings": 12, "prepTime": 40, "cookTime": 50, "description": "Romanian walnut-filled bread", "seasonings": ["vanilla"], "ingredients": ["Dough: flour, milk, yeast", "Walnuts", "Honey", "Butter", "Sugar", "Raisins"], "instructions": ["Make yeast dough", "Let rise", "Make walnut filling", "Roll dough", "Spread walnut filling", "Roll into loaf", "Let rise again", "Bake at 375°F for 45-50 minutes"], "notes": "Complex filling", "fun_fact": "Cozonac is Easter specialty", "alternatives": ["Without raisins", "Chocolate filling", "Plainer version"]}
        ],
        "desserts": [
            {"id": "rom-dessert-papanasi", "name": "Papanasi (Fried Dough)", "difficulty": "Medium", "servings": 8, "prepTime": 20, "cookTime": 20, "description": "Romanian fried dough with jam and sour cream", "seasonings": [], "ingredients": ["Dough: flour, yogurt, eggs", "Jam", "Sour cream", "Honey", "Oil for frying"], "instructions": ["Make yogurt dough", "Let rest", "Form into balls", "Deep fry until golden", "Fill with jam", "Top with sour cream", "Drizzle with honey"], "notes": "Serve warm", "fun_fact": "Papanasi are Romanian treat", "alternatives": ["Custard filling", "Different jam", "Without honey"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "rom-drink-tea", "name": "Romanian Herbal Tea", "difficulty": "Easy", "servings": 2, "prepTime": 5, "cookTime": 10, "description": "Traditional herbal tea", "seasonings": ["honey"], "ingredients": ["Herbs: linden, mint, chamomile", "Water", "Honey", "Lemon"], "instructions": ["Heat water", "Add dried herbs", "Steep 5-10 minutes", "Add honey", "Add lemon juice", "Serve hot"], "notes": "Very traditional", "fun_fact": "Herbal tea in Romanian culture", "alternatives": ["Different herbs", "Without lemon", "Cold version"]}
        ],
        "alcoholicDrinks": [
            {"id": "rom-drink-tuica", "name": "Tuică (Plum Brandy)", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Romanian plum spirit", "seasonings": [], "ingredients": ["Tuică"], "instructions": ["Serve in small glass", "Room temperature", "Drink slowly with food"], "notes": "Very strong", "fun_fact": "Tuică is Romanian staple", "alternatives": ["Different brands", "Homemade", "Different strength"]}
        ]
    }
}

def expand_phase_7_batch_2():
    os.makedirs('data/phase7-recipes', exist_ok=True)
    for country, data in PHASE_7_BATCH_2.items():
        filename = f"data/phase7-recipes/{country.lower().replace(' ', '_')}-phase7-authentic.json"
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        recipes = sum(len(data.get(cat, []))
                     for cat in ['breakfast', 'lunch', 'dinner', 'snacks',
                                'desserts', 'nonAlcoholicDrinks', 'alcoholicDrinks'])
        print(f"✓ {country:<25} | {recipes} recipes")

if __name__ == "__main__":
    print("\n🌍 PHASE 7 BATCH 2: Balkans & Eastern Europe Expansion")
    print("="*80 + "\n")
    expand_phase_7_batch_2()
    print("\n✓ Batch 2 complete!")
