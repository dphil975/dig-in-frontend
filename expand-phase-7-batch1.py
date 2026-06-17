#!/usr/bin/env python3
"""
PHASE 7 BATCH 1: Middle East expansion
Lebanon, Saudi Arabia, Israel, UAE
"""
import json, os

PHASE_7_BATCH_1 = {
    "Lebanon": {
        "country": "Lebanon",
        "region": "Middle East",
        "breakfast": [
            {"id": "leb-break-fattoush", "name": "Fattoush Salad for Breakfast", "difficulty": "Easy", "servings": 4, "prepTime": 20, "cookTime": 5, "description": "Lebanese salad with pita chips and vegetables", "seasonings": ["sumac", "lemon"], "ingredients": ["Mixed greens", "Tomatoes", "Cucumber", "Radish", "Pita bread", "Parmesan", "Lemon juice", "Olive oil", "Sumac", "Salt", "Pepper"], "instructions": ["Cut pita into chips, toast until crispy", "Chop vegetables finely", "Combine in large bowl", "Make dressing: lemon juice, olive oil, sumac", "Toss salad with dressing", "Top with pita chips", "Serve immediately"], "notes": "Pita chips must stay crispy", "fun_fact": "Fattoush is Lebanese salad that comes to life with bread", "alternatives": ["Different vegetables", "Without sumac", "Add chickpeas"]}
        ],
        "lunch": [
            {"id": "leb-lunch-shawarma", "name": "Chicken Shawarma", "difficulty": "Hard", "servings": 6, "prepTime": 30, "cookTime": 60, "description": "Spiced marinated chicken cooked on vertical spit", "seasonings": ["cumin", "coriander", "paprika"], "ingredients": ["3 lbs chicken", "Yogurt marinade", "Spices: cumin, coriander, paprika, turmeric", "Garlic", "Onion", "Pita bread", "Tahini sauce", "Pickled vegetables"], "instructions": ["Marinate chicken 4+ hours", "Cook on vertical spit or oven at 425°F", "Slice thin from outside as it cooks", "Grill/fry thinly sliced onions", "Warm pita bread", "Make tahini sauce", "Assemble: pita, chicken, onions, tahini, pickles"], "notes": "Requires vertical spit ideally", "fun_fact": "Shawarma is Lebanese favorite street food", "alternatives": ["Lamb instead of chicken", "Different sauce", "Grilled instead of spit"]}
        ],
        "dinner": [
            {"id": "leb-dinner-kibbeh", "name": "Kibbeh (Meat Croquettes)", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 30, "description": "Lebanese fried bulgur and meat croquettes", "seasonings": ["cumin", "cinnamon"], "ingredients": ["1 cup bulgur", "1 lb ground lamb", "Onions", "Pine nuts", "Cumin", "Cinnamon", "Salt", "Pepper", "Oil for frying"], "instructions": ["Soak bulgur in water", "Brown lamb with onions", "Add pine nuts, spices", "Cool lamb filling", "Mix bulgur with salt, pepper", "Form oval shells with filling inside", "Fry at 350°F until golden", "Drain on paper towels"], "notes": "Requires shaping skill", "fun_fact": "Kibbeh is Lebanese national dish", "alternatives": ["Beef instead of lamb", "Baked version", "Different stuffing"]}
        ],
        "snacks": [
            {"id": "leb-snack-manakish", "name": "Manakish (Flatbread)", "difficulty": "Medium", "servings": 8, "prepTime": 30, "cookTime": 20, "description": "Lebanese zaatar flatbread", "seasonings": ["zaatar"], "ingredients": ["Dough: flour, water, oil, salt, yeast", "Zaatar: thyme, sumac, sesame", "Olive oil", "Cheese (optional)"], "instructions": ["Make yeast dough", "Let rise 1 hour", "Divide into pieces", "Flatten on sheet", "Mix zaatar with olive oil", "Spread on dough", "Add cheese if desired", "Bake at 425°F for 15-20 minutes"], "notes": "Zaatar is essential", "fun_fact": "Manakish is Lebanese breakfast staple", "alternatives": ["Cheese version", "Meat filling", "Different herbs"]}
        ],
        "desserts": [
            {"id": "leb-dessert-baklava", "name": "Baklava with Pistachios", "difficulty": "Hard", "servings": 24, "prepTime": 45, "cookTime": 40, "description": "Crispy phyllo with pistachios and honey", "seasonings": ["cinnamon"], "ingredients": ["Phyllo dough", "2 cups pistachios", "1 cup butter", "Honey syrup", "Cinnamon", "Lemon juice"], "instructions": ["Layer phyllo with butter", "Sprinkle pistachios between layers", "Top with phyllo", "Cut into diamonds", "Bake at 350°F for 35-40 minutes", "Heat honey with cinnamon and lemon", "Pour hot honey over hot baklava"], "notes": "Hot honey on hot baklava essential", "fun_fact": "Baklava perfected in Lebanese kitchens", "alternatives": ["Walnuts instead of pistachios", "Different nuts", "Less honey"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "leb-drink-mint-lemonade", "name": "Lebanese Mint Lemonade", "difficulty": "Easy", "servings": 4, "prepTime": 10, "cookTime": 0, "description": "Refreshing mint and lemon drink", "seasonings": ["mint"], "ingredients": ["6 fresh mint leaves (per glass)", "1 lemon (per glass)", "1 tbsp sugar (per glass)", "Ice", "Water"], "instructions": ["Muddle mint with sugar", "Squeeze lemon juice", "Add ice", "Fill with water", "Stir well", "Serve immediately"], "notes": "Fresh mint essential", "fun_fact": "Mint lemonade is summer Lebanese drink", "alternatives": ["Add rose water", "Different citrus", "More or less sugar"]}
        ],
        "alcoholicDrinks": [
            {"id": "leb-drink-arak", "name": "Arak (Anise Spirit)", "difficulty": "Easy", "servings": 4, "prepTime": 0, "cookTime": 0, "description": "Lebanese anise spirit served with water", "seasonings": [], "ingredients": ["Arak"], "instructions": ["Pour 1 oz arak in glass", "Add ice", "Add 3 oz water", "Drink slowly with food", "Turns milky white when water added"], "notes": "Called 'milk of lions'", "fun_fact": "Arak is Lebanese national spirit", "alternatives": ["Different water ratio", "Neat", "Different arak type"]}
        ]
    },
    "Saudi Arabia": {
        "country": "Saudi Arabia",
        "region": "Middle East",
        "breakfast": [
            {"id": "ksa-break-fuul", "name": "Fuul (Fava Beans)", "difficulty": "Easy", "servings": 4, "prepTime": 10, "cookTime": 20, "description": "Saudi Arabian cooked fava beans with olive oil", "seasonings": ["garlic", "cumin"], "ingredients": ["2 cans fava beans", "4 cloves garlic", "1/4 cup olive oil", "1 tsp cumin", "Lemon juice", "Salt", "Pepper"], "instructions": ["Heat olive oil", "Sauté garlic until fragrant", "Add fava beans with liquid", "Add cumin", "Warm through", "Mash some beans", "Add lemon juice", "Season with salt and pepper", "Serve with bread"], "notes": "Should be creamy", "fun_fact": "Fuul is Saudi Arabian breakfast staple", "alternatives": ["Skip mashing", "Add egg", "Different beans"]}
        ],
        "lunch": [
            {"id": "ksa-lunch-kabsa", "name": "Kabsa (Spiced Rice)", "difficulty": "Hard", "servings": 6, "prepTime": 20, "cookTime": 45, "description": "Saudi rice with meat and spices", "seasonings": ["cumin", "cinnamon", "cardamom"], "ingredients": ["3 cups basmati rice", "1.5 lbs meat", "3 onions", "Spices: cumin, cinnamon, cardamom, bay", "Tomato paste", "Broth", "Oil", "Nuts"], "instructions": ["Brown meat with onion", "Add spices, cook 2 minutes", "Add tomato paste", "Add broth", "Bring to boil", "Add rice", "Cover, simmer 30 minutes", "Fluff and serve", "Top with roasted nuts"], "notes": "Spices are key", "fun_fact": "Kabsa is Saudi Arabia's national dish", "alternatives": ["Chicken instead of meat", "Different nuts", "More vegetables"]}
        ],
        "dinner": [
            {"id": "ksa-dinner-shawarma", "name": "Lamb Shawarma", "difficulty": "Hard", "servings": 6, "prepTime": 30, "cookTime": 60, "description": "Spiced marinated lamb cooked on spit", "seasonings": ["cumin", "paprika", "garlic"], "ingredients": ["3 lbs lamb", "Yogurt", "Spices", "Garlic", "Onion", "Pita bread", "Tahini sauce"], "instructions": ["Marinate lamb 4+ hours", "Cook on vertical spit or oven", "Slice thin as it cooks", "Grill onions", "Warm pita", "Make tahini sauce", "Assemble with meat, onions, sauce"], "notes": "Requires spit ideally", "fun_fact": "Shawarma is popular Saudi Arabian street food", "alternatives": ["Chicken instead of lamb", "Beef", "Different sauce"]}
        ],
        "snacks": [
            {"id": "ksa-snack-samosa", "name": "Samosa", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 20, "description": "Fried pastry with meat or potato filling", "seasonings": ["cumin", "coriander"], "ingredients": ["Pastry: flour, water, oil", "Filling: meat, potato, onion, spices", "Oil for frying"], "instructions": ["Make pastry dough", "Brown filling ingredients", "Roll dough thin", "Cut triangles", "Fill and fold", "Deep fry at 350°F", "Drain on paper towels"], "notes": "Filling must be cool", "fun_fact": "Samosa popular in Saudi Arabia", "alternatives": ["Vegetarian filling", "Different shape", "Baked version"]}
        ],
        "desserts": [
            {"id": "ksa-dessert-ma-amoul", "name": "Ma'amoul (Date Cookies)", "difficulty": "Hard", "servings": 24, "prepTime": 40, "cookTime": 30, "description": "Saudi date-filled butter cookies", "seasonings": ["orange blossom"], "ingredients": ["2 cups flour", "1 cup butter", "1/4 cup water", "Date filling", "Orange blossom water", "Sugar"], "instructions": ["Cream butter and flour", "Add water", "Form into dough", "Let rest", "Form small balls", "Press date filling inside", "Close dough over filling", "Bake at 350°F for 25-30 minutes", "Cool, dust with sugar"], "notes": "Requires mold or shaping skill", "fun_fact": "Ma'amoul is traditional Saudi cookie", "alternatives": ["Walnut filling", "Different shape", "Different spices"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "ksa-drink-coffee", "name": "Saudi Arabian Coffee", "difficulty": "Easy", "servings": 1, "prepTime": 5, "cookTime": 10, "description": "Strong Arabic coffee with cardamom", "seasonings": ["cardamom"], "ingredients": ["Coffee beans", "Cardamom pods", "Water"], "instructions": ["Roast coffee beans", "Grind finely", "Crush cardamom", "Heat water", "Add coffee and cardamom", "Simmer 5 minutes", "Pour into small cups", "Serve black"], "notes": "Very strong and aromatic", "fun_fact": "Saudi coffee is traditional hospitality drink", "alternatives": ["Without cardamom", "Different spices", "Less strong"]}
        ],
        "alcoholicDrinks": [
            {"id": "ksa-drink-non-alcoholic-note", "name": "Non-Alcoholic Beverage Culture", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Saudi Arabia has strict alcohol prohibition", "seasonings": [], "ingredients": ["Water", "Coffee", "Tea", "Juice"], "instructions": ["Saudi Arabia is alcohol-free", "Focus on coffee, tea, traditional drinks", "Water and juice are main beverages", "Hospitality centered on non-alcoholic drinks"], "notes": "Religious and cultural prohibition", "fun_fact": "Saudi Arabia is completely alcohol-free nation", "alternatives": ["Different hot beverages", "Fruit juices", "Herbal teas"]}
        ]
    },
    "Israel": {
        "country": "Israel",
        "region": "Middle East",
        "breakfast": [
            {"id": "isr-break-shakshuka", "name": "Shakshuka (Eggs in Tomato Sauce)", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 20, "description": "Israeli eggs poached in spiced tomato sauce", "seasonings": ["cumin", "paprika"], "ingredients": ["4 eggs", "2 cups tomato sauce", "1 onion", "3 cloves garlic", "1 tsp cumin", "1 tsp paprika", "Olive oil", "Parsley", "Feta cheese (optional)"], "instructions": ["Heat olive oil", "Sauté onion and garlic", "Add tomato sauce", "Add spices", "Simmer 5 minutes", "Make wells in sauce", "Crack eggs into wells", "Cover, simmer until eggs set (5-8 minutes)", "Garnish with parsley and feta"], "notes": "Eggs should be runny", "fun_fact": "Shakshuka is Middle Eastern favorite", "alternatives": ["Add peppers", "Use chickpeas", "Different spices"]}
        ],
        "lunch": [
            {"id": "isr-lunch-falafel", "name": "Falafel", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 20, "description": "Israeli fried chickpea fritters", "seasonings": ["cumin", "coriander"], "ingredients": ["2 cups chickpeas (dried)", "1 onion", "3 cloves garlic", "1/2 cup parsley", "1/4 cup cilantro", "Spices: cumin, coriander", "Flour", "Oil for frying"], "instructions": ["Soak dried chickpeas overnight", "Drain thoroughly", "Grind with onion, garlic, herbs", "Add spices and flour", "Form into balls", "Deep fry at 350°F until golden", "Drain on paper towels", "Serve with tahini sauce"], "notes": "Use dried, not canned chickpeas", "fun_fact": "Falafel is Israeli street food favorite", "alternatives": ["Larger patties", "Baked version", "Different herbs"]}
        ],
        "dinner": [
            {"id": "isr-dinner-hummus", "name": "Hummus with Meat (Hummus M'sara)", "difficulty": "Medium", "servings": 6, "prepTime": 20, "cookTime": 30, "description": "Israeli hummus topped with spiced meat", "seasonings": ["cumin", "sumac"], "ingredients": ["2 cups hummus", "1 lb ground lamb", "1 onion", "Pine nuts", "Olive oil", "Paprika", "Cumin", "Sumac", "Pita bread"], "instructions": ["Brown lamb with onion", "Add spices and pine nuts", "Prepare or buy hummus", "Spread hummus on plate", "Top with meat mixture", "Drizzle with olive oil", "Sprinkle sumac", "Serve with pita"], "notes": "Meat topping is key", "fun_fact": "Hummus M'sara is Lebanese-Israeli dish", "alternatives": ["Chicken instead of lamb", "Vegetarian hummus", "Different toppings"]}
        ],
        "snacks": [
            {"id": "isr-snack-pita", "name": "Pita Bread", "difficulty": "Hard", "servings": 8, "prepTime": 30, "cookTime": 25, "description": "Israeli pocket bread", "seasonings": ["salt"], "ingredients": ["3 cups flour", "1 packet yeast", "1 cup warm water", "1 tbsp oil", "1 tsp salt"], "instructions": ["Mix flour, salt, yeast", "Add water and oil", "Knead until smooth", "Let rise 1 hour", "Divide into 8 pieces", "Roll into thin rounds", "Let rest 20 minutes", "Bake at 475°F for 5-7 minutes until puffed"], "notes": "Puffs when hot", "fun_fact": "Pita is essential to Israeli meals", "alternatives": ["Whole wheat", "Smaller pitas", "Seeded"]}
        ],
        "desserts": [
            {"id": "isr-dessert-halva", "name": "Halva (Tahini Confection)", "difficulty": "Hard", "servings": 16, "prepTime": 20, "cookTime": 30, "description": "Israeli tahini sweet candy", "seasonings": ["vanilla"], "ingredients": ["2 cups tahini", "1 cup sugar", "1/2 cup honey", "1 tsp vanilla", "Oil", "Chocolate (optional)"], "instructions": ["Mix tahini with honey and sugar", "Add vanilla", "Heat on low, stirring constantly", "Pour into oiled pan", "Cool partially", "Mark into pieces", "Cool completely", "Top with melted chocolate if desired"], "notes": "Requires constant stirring", "fun_fact": "Halva is Middle Eastern favorite", "alternatives": ["Pistachio halva", "Different nuts", "Chocolate layer"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "isr-drink-mint-tea", "name": "Israeli Mint Tea", "difficulty": "Easy", "servings": 2, "prepTime": 5, "cookTime": 10, "description": "Fresh mint tea with lemon", "seasonings": ["mint", "lemon"], "ingredients": ["Fresh mint leaves", "Water", "Lemon juice", "Honey", "Sugar"], "instructions": ["Heat water", "Add fresh mint", "Steep 5 minutes", "Add lemon juice and sweetener", "Serve hot or cold"], "notes": "Fresh mint essential", "fun_fact": "Mint tea is Israeli tradition", "alternatives": ["Different herbs", "Served cold", "Add spices"]}
        ],
        "alcoholicDrinks": [
            {"id": "isr-drink-wine", "name": "Israeli Wine", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Quality Israeli wine from local vineyards", "seasonings": [], "ingredients": ["Israeli wine"], "instructions": ["Serve at appropriate temperature", "Red wines at room temperature", "White wines chilled", "Pair with food", "Enjoy Israeli viticulture"], "notes": "Growing wine industry", "fun_fact": "Israeli wine industry is rapidly expanding", "alternatives": ["Different wine regions", "Different grape varieties", "Red or white"]}
        ]
    },
    "United Arab Emirates": {
        "country": "United Arab Emirates",
        "region": "Middle East",
        "breakfast": [
            {"id": "uae-break-khubz", "name": "Khubz (Traditional Bread)", "difficulty": "Medium", "servings": 8, "prepTime": 20, "cookTime": 30, "description": "UAE traditional bread for breakfast", "seasonings": ["salt"], "ingredients": ["3 cups flour", "1 tsp salt", "1 tbsp oil", "1 cup water", "Yeast"], "instructions": ["Mix flour, salt, yeast", "Add oil and water", "Knead until smooth", "Let rise 1 hour", "Divide into 8 balls", "Roll thin", "Bake on griddle or oven", "Until golden and puffed"], "notes": "Thin and puffed", "fun_fact": "Khubz is essential UAE breakfast", "alternatives": ["Thicker version", "Whole wheat", "Seeded bread"]}
        ],
        "lunch": [
            {"id": "uae-lunch-mandi", "name": "Mandi (Spiced Rice and Lamb)", "difficulty": "Hard", "servings": 6, "prepTime": 30, "cookTime": 90, "description": "UAE slow-cooked spiced lamb and rice", "seasonings": ["cumin", "coriander", "cloves"], "ingredients": ["2 lbs lamb", "3 cups rice", "Spices", "Onions", "Tomato paste", "Broth", "Oil"], "instructions": ["Sear lamb", "Create spice bed with onions and spices", "Layer rice", "Add broth", "Cover tightly", "Slow cook at 300°F for 60+ minutes", "Fluff rice", "Serve with meat"], "notes": "Low and slow cooking", "fun_fact": "Mandi is UAE and Yemen dish", "alternatives": ["Chicken instead of lamb", "Different spices", "Faster cooking method"]}
        ],
        "dinner": [
            {"id": "uae-dinner-zarbiyan", "name": "Zarbiyan (Meat and Rice)", "difficulty": "Medium", "servings": 6, "prepTime": 20, "cookTime": 45, "description": "UAE rice dish with ground meat", "seasonings": ["cumin", "turmeric"], "ingredients": ["1.5 lbs ground meat", "2 cups rice", "1 onion", "2 cloves garlic", "Turmeric", "Cumin", "Broth", "Cinnamon stick"], "instructions": ["Brown meat with onion and garlic", "Add spices", "Add rice, toast lightly", "Add broth and cinnamon", "Bring to boil", "Cover, simmer 25-30 minutes", "Rice should be tender", "Fluff and serve"], "notes": "Rice should be fluffy", "fun_fact": "Zarbiyan is everyday UAE meal", "alternatives": ["Chicken instead of meat", "Different spices", "Add chickpeas"]}
        ],
        "snacks": [
            {"id": "uae-snack-luqaimat", "name": "Luqaimat (Fried Dough)", "difficulty": "Medium", "servings": 24, "prepTime": 20, "cookTime": 20, "description": "UAE fried dough balls with honey", "seasonings": ["saffron"], "ingredients": ["2 cups flour", "1 tsp baking powder", "1/2 cup water", "1 egg", "Honey", "Saffron strands", "Oil for frying"], "instructions": ["Mix flour and baking powder", "Add water and egg", "Form into balls", "Heat oil to 350°F", "Fry until golden", "Drain on paper towels", "Coat with honey", "Sprinkle saffron threads"], "notes": "Serve hot with honey", "fun_fact": "Luqaimat is Ramadan favorite", "alternatives": ["Different size", "Different honey", "Add nuts"]}
        ],
        "desserts": [
            {"id": "uae-dessert-umm-ali", "name": "Umm Ali (Bread Pudding)", "difficulty": "Medium", "servings": 8, "prepTime": 15, "cookTime": 30, "description": "UAE baked bread pudding with milk and nuts", "seasonings": ["cinnamon"], "ingredients": ["4 cups bread cubes", "2 cups milk", "1 can condensed milk", "Coconut (shredded)", "Pistachios", "Almonds", "Raisins", "Butter", "Cinnamon"], "instructions": ["Toast bread cubes in oven", "Mix milk and condensed milk", "Layer bread, coconut, nuts, raisins in baking dish", "Pour milk mixture over", "Top with more nuts", "Bake at 350°F for 25-30 minutes", "Top should be golden", "Dust with cinnamon"], "notes": "Should be creamy inside", "fun_fact": "Umm Ali means 'mother of Ali' and is a famous UAE dessert", "alternatives": ["Different nuts", "More or less milk", "Without coconut"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "uae-drink-qahwa", "name": "Qahwa (Arabic Coffee)", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 10, "description": "UAE traditional coffee with cardamom", "seasonings": ["cardamom", "cloves"], "ingredients": ["Coffee beans", "Cardamom pods", "Water"], "instructions": ["Roast coffee beans", "Grind coarsely", "Crush cardamom", "Heat water", "Add coffee and cardamom", "Simmer 5 minutes", "Strain into small cups", "Serve black"], "notes": "Very strong", "fun_fact": "Qahwa is UAE hospitality tradition", "alternatives": ["Without cardamom", "Add cloves", "Different spices"]}
        ],
        "alcoholicDrinks": [
            {"id": "uae-drink-tea", "name": "Traditional Tea (Non-Alcoholic)", "difficulty": "Easy", "servings": 2, "prepTime": 5, "cookTime": 10, "description": "UAE tea culture focuses on non-alcoholic beverages", "seasonings": ["spices"], "ingredients": ["Black tea", "Water", "Spices"], "instructions": ["Heat water", "Add black tea and spices", "Steep 3-5 minutes", "Serve hot or cold"], "notes": "Strong brewed", "fun_fact": "UAE tea culture is central to social gatherings", "alternatives": ["Different tea types", "Herbal tea", "Green tea"]}
        ]
    }
}

def expand_phase_7_batch_1():
    os.makedirs('data/phase7-recipes', exist_ok=True)
    for country, data in PHASE_7_BATCH_1.items():
        filename = f"data/phase7-recipes/{country.lower().replace(' ', '_')}-phase7-authentic.json"
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        recipes = sum(len(data.get(cat, []))
                     for cat in ['breakfast', 'lunch', 'dinner', 'snacks',
                                'desserts', 'nonAlcoholicDrinks', 'alcoholicDrinks'])
        print(f"✓ {country:<25} | {recipes} recipes")

if __name__ == "__main__":
    print("\n🌍 PHASE 7 BATCH 1: Middle East Expansion")
    print("="*80 + "\n")
    expand_phase_7_batch_1()
    print("\n✓ Batch 1 complete!")
