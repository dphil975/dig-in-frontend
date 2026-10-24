#!/usr/bin/env python3
"""
PHASE 7 BATCH 3: More Africa expansion
Kenya-expanded, Nigeria-expanded, Tunisia, Ghana-expanded
"""
import json, os

PHASE_7_BATCH_3 = {
    "Kenya": {
        "country": "Kenya",
        "region": "East Africa",
        "breakfast": [
            {"id": "ken-break-ugali", "name": "Ugali (Corn Porridge)", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 20, "description": "Kenyan cornmeal staple", "seasonings": ["salt"], "ingredients": ["Cornmeal", "Water", "Salt", "Butter"], "instructions": ["Boil water with salt", "Slowly add cornmeal", "Stir constantly", "Cook 15 minutes", "Turn onto plate", "Smooth with wet hands"], "notes": "Smooth and firm", "fun_fact": "Ugali is East African staple", "alternatives": ["Different thickness", "With butter", "Without butter"]}
        ],
        "lunch": [
            {"id": "ken-lunch-sukuma", "name": "Sukuma Wiki (Greens)", "difficulty": "Easy", "servings": 4, "prepTime": 10, "cookTime": 15, "description": "Kenyan sautéed leafy greens", "seasonings": ["garlic"], "ingredients": ["Collard greens", "Onion", "Tomato", "Garlic", "Oil"], "instructions": ["Chop greens", "Sauté onion and garlic", "Add greens", "Add tomato", "Cook until tender", "Season to taste"], "notes": "Very nutritious", "fun_fact": "Sukuma wiki means 'push through the week'", "alternatives": ["Different greens", "Spicier", "With beans"]}
        ],
        "dinner": [
            {"id": "ken-dinner-nyama", "name": "Nyama Choma (Grilled Meat)", "difficulty": "Medium", "servings": 4, "prepTime": 10, "cookTime": 20, "description": "Kenyan grilled meat", "seasonings": ["garlic", "lemon"], "ingredients": ["1.5 lbs meat", "Garlic", "Lemon juice", "Chili", "Oil"], "instructions": ["Marinate meat in lemon and garlic", "Grill over charcoal", "Cook until charred", "Serve with ugali and greens"], "notes": "Char the meat", "fun_fact": "Nyama choma is Kenyan favorite", "alternatives": ["Chicken instead of beef", "Different marinade", "Less charred"]}
        ],
        "snacks": [
            {"id": "ken-snack-samosa", "name": "Samosa (Fried Pastry)", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 20, "description": "Kenyan spiced pastry", "seasonings": ["cumin"], "ingredients": ["Pastry sheets", "Potato", "Peas", "Onion", "Cumin", "Oil for frying"], "instructions": ["Cook potato and peas", "Mix with onion and spices", "Fill pastry triangles", "Deep fry until golden", "Drain on paper towels"], "notes": "Crispy outside", "fun_fact": "Samosa is East African favorite", "alternatives": ["Meat filling", "Different shape", "Baked version"]}
        ],
        "desserts": [
            {"id": "ken-dessert-mandazi", "name": "Mandazi (Fried Dough)", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 15, "description": "Kenyan fried dough", "seasonings": [], "ingredients": ["Flour", "Eggs", "Sugar", "Oil for frying"], "instructions": ["Mix flour and eggs", "Add sugar", "Rest 30 minutes", "Roll out", "Cut into pieces", "Deep fry until golden"], "notes": "Serve warm", "fun_fact": "Mandazi is street food favorite", "alternatives": ["With coconut", "Sweeter", "Less oil"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "ken-drink-chai", "name": "Kenyan Chai (Spiced Tea)", "difficulty": "Easy", "servings": 2, "prepTime": 5, "cookTime": 15, "description": "Strong spiced milk tea", "seasonings": ["cinnamon", "ginger"], "ingredients": ["Black tea", "Milk", "Water", "Sugar", "Ginger", "Cinnamon"], "instructions": ["Heat water", "Add tea and spices", "Steep 5 minutes", "Add milk and sugar", "Serve hot"], "notes": "Very strong", "fun_fact": "Chai culture in Kenya", "alternatives": ["Without milk", "Less sugar", "Different spices"]}
        ],
        "alcoholicDrinks": [
            {"id": "ken-drink-beer", "name": "Kenyan Beer", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Local Kenyan beer brands", "seasonings": [], "ingredients": ["Kenyan beer"], "instructions": ["Serve cold", "Enjoy with food"], "notes": "Refreshing", "fun_fact": "Kenyan beer industry growing", "alternatives": ["Different brands", "Different strength", "Local brews"]}
        ]
    },
    "Nigeria": {
        "country": "Nigeria",
        "region": "West Africa",
        "breakfast": [
            {"id": "nga-break-akamu", "name": "Akamu (Corn Pudding)", "difficulty": "Medium", "servings": 4, "prepTime": 10, "cookTime": 20, "description": "Nigerian corn pudding breakfast", "seasonings": [], "ingredients": ["Corn flour", "Water", "Salt", "Sugar", "Milk"], "instructions": ["Mix corn flour with water", "Boil and stir constantly", "Cook 15 minutes", "Add salt and sugar", "Add milk", "Serve warm"], "notes": "Smooth texture", "fun_fact": "Akamu is Nigerian breakfast", "alternatives": ["Sweeter version", "With honey", "Different preparation"]}
        ],
        "lunch": [
            {"id": "nga-lunch-jollof", "name": "Jollof Rice (Nigerian)", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 45, "description": "Nigerian red rice", "seasonings": ["paprika"], "ingredients": ["Rice", "Tomatoes", "Onion", "Paprika", "Broth", "Oil"], "instructions": ["Sauté onion", "Add tomato paste", "Add rice", "Toast lightly", "Add broth", "Bring to boil", "Cover, simmer 25 minutes"], "notes": "Slightly smoky", "fun_fact": "Jollof rice varies by country", "alternatives": ["With meat", "With vegetables", "Spicier version"]}
        ],
        "dinner": [
            {"id": "nga-dinner-egusi", "name": "Egusi Soup (Melon Soup)", "difficulty": "Medium", "servings": 6, "prepTime": 20, "cookTime": 40, "description": "Nigerian melon seed soup", "seasonings": ["crayfish"], "ingredients": ["Egusi (melon seeds)", "Spinach", "Meat", "Crayfish", "Onion", "Oil", "Broth"], "instructions": ["Brown onion", "Add meat, brown", "Add broth", "Grind egusi", "Add to broth", "Cook 20 minutes", "Add spinach and crayfish"], "notes": "Creamy and rich", "fun_fact": "Egusi soup is Nigerian favorite", "alternatives": ["More vegetables", "Less meat", "Different greens"]}
        ],
        "snacks": [
            {"id": "nga-snack-puff", "name": "Puff Puff (Fried Dough Balls)", "difficulty": "Medium", "servings": 16, "prepTime": 20, "cookTime": 20, "description": "Nigerian fried dough snack", "seasonings": [], "ingredients": ["Flour", "Yeast", "Sugar", "Water", "Oil for frying"], "instructions": ["Make yeast dough", "Add sugar", "Let rise 1 hour", "Drop spoonfuls in oil", "Fry until golden", "Dust with sugar"], "notes": "Puffy and light", "fun_fact": "Puff puff is street food", "alternatives": ["With spices", "Honey coating", "Larger size"]}
        ],
        "desserts": [
            {"id": "nga-dessert-chin-chin", "name": "Chin Chin (Crunchy Snack)", "difficulty": "Medium", "servings": 20, "prepTime": 20, "cookTime": 20, "description": "Nigerian fried crispy snack", "seasonings": [], "ingredients": ["Flour", "Butter", "Sugar", "Eggs", "Oil for frying"], "instructions": ["Cream butter and sugar", "Add eggs", "Add flour", "Roll thin", "Cut into squares", "Deep fry until golden", "Drain and cool"], "notes": "Very crispy", "fun_fact": "Chin chin is popular snack", "alternatives": ["Savory version", "With spices", "Different shape"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "nga-drink-zobo", "name": "Zobo (Hibiscus Drink)", "difficulty": "Easy", "servings": 4, "prepTime": 10, "cookTime": 20, "description": "Nigerian hibiscus tea", "seasonings": ["ginger"], "ingredients": ["Dried hibiscus", "Water", "Sugar", "Ginger", "Lemon"], "instructions": ["Boil water", "Add hibiscus", "Simmer 15 minutes", "Add ginger and sugar", "Strain", "Serve cold or hot"], "notes": "Tart and refreshing", "fun_fact": "Zobo is Nigerian favorite", "alternatives": ["More ginger", "Different sweetener", "With fruit juice"]}
        ],
        "alcoholicDrinks": [
            {"id": "nga-drink-palm", "name": "Palm Wine", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Traditional Nigerian palm wine", "seasonings": [], "ingredients": ["Palm wine"], "instructions": ["Serve in glass", "Drink fresh for best taste", "Sweet and light"], "notes": "Fermented drink", "fun_fact": "Palm wine is traditional drink", "alternatives": ["Different sources", "More fermented", "Less fermented"]}
        ]
    },
    "Tunisia": {
        "country": "Tunisia",
        "region": "North Africa",
        "breakfast": [
            {"id": "tun-break-makroudh", "name": "Makroudh (Semolina Cookie)", "difficulty": "Medium", "servings": 16, "prepTime": 20, "cookTime": 30, "description": "Tunisian semolina date cookie", "seasonings": [], "ingredients": ["Semolina", "Butter", "Dates", "Honey", "Oil for frying"], "instructions": ["Mix semolina and butter", "Form dough", "Stuff with dates", "Roll out", "Cut into pieces", "Fry until golden", "Soak in honey"], "notes": "Sweet and sticky", "fun_fact": "Makroudh is Tunisian classic", "alternatives": ["Without honey", "Different filling", "Baked version"]}
        ],
        "lunch": [
            {"id": "tun-lunch-couscous", "name": "Couscous Tunisien", "difficulty": "Hard", "servings": 6, "prepTime": 30, "cookTime": 60, "description": "Tunisian couscous with vegetables", "seasonings": ["harissa"], "ingredients": ["Couscous", "Chickpeas", "Vegetables", "Meat (optional)", "Harissa", "Broth", "Oil"], "instructions": ["Steam couscous separately", "Make harissa broth with meat/vegetables", "Simmer 45 minutes", "Fluff couscous", "Layer couscous and stew", "Serve with harissa on side"], "notes": "Complex dish", "fun_fact": "Couscous is Tunisian staple", "alternatives": ["Without meat", "Different vegetables", "Different spices"]}
        ],
        "dinner": [
            {"id": "tun-dinner-brik", "name": "Brik (Phyllo Pastry)", "difficulty": "Hard", "servings": 4, "prepTime": 20, "cookTime": 15, "description": "Tunisian fried pastry with egg", "seasonings": [], "ingredients": ["Phyllo dough", "Egg", "Tuna (optional)", "Harissa", "Oil for frying"], "instructions": ["Place phyllo on cloth", "Add filling in corner", "Fold into triangle", "Seal edges", "Fry until golden", "Drain on paper towels"], "notes": "Egg should be runny", "fun_fact": "Brik is Tunisian classic", "alternatives": ["Meat filling", "Without harissa", "Cheese filling"]}
        ],
        "snacks": [
            {"id": "tun-snack-donut", "name": "Tunisian Donut (Loukouma)", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 20, "description": "Fried dough puffs with honey", "seasonings": [], "ingredients": ["Dough: flour, yeast", "Oil for frying", "Honey", "Orange blossom water"], "instructions": ["Make yeast dough", "Let rise", "Fry spoonfuls until golden", "Soak in honey", "Drizzle with orange blossom water"], "notes": "Very sweet", "fun_fact": "Loukouma is Tunisian treat", "alternatives": ["Without orange blossom", "Different honey", "Smaller size"]}
        ],
        "desserts": [
            {"id": "tun-dessert-halva", "name": "Halva Tunisienne", "difficulty": "Hard", "servings": 12, "prepTime": 20, "cookTime": 60, "description": "Tunisian sesame halva", "seasonings": [], "ingredients": ["Sesame seeds", "Honey", "Oil", "Almonds", "Pistachio"], "instructions": ["Toast sesame seeds", "Grind finely", "Heat honey", "Mix sesame with honey", "Press into pan", "Cut into pieces", "Top with nuts"], "notes": "Requires patience", "fun_fact": "Halva is ancient confection", "alternatives": ["Different nuts", "More or less honey", "Different shape"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "tun-drink-coffee", "name": "Tunisian Coffee", "difficulty": "Easy", "servings": 1, "prepTime": 5, "cookTime": 10, "description": "Strong Turkish-style coffee", "seasonings": ["cardamom"], "ingredients": ["Coffee grounds", "Water", "Sugar", "Cardamom"], "instructions": ["Heat water", "Add coffee and cardamom", "Simmer 5 minutes", "Pour into cup", "Serve strong"], "notes": "Very strong", "fun_fact": "Coffee culture in Tunisia", "alternatives": ["Without cardamom", "Different spices", "Less strong"]}
        ],
        "alcoholicDrinks": [
            {"id": "tun-drink-wine", "name": "Tunisian Wine", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "North African wine", "seasonings": [], "ingredients": ["Tunisian wine"], "instructions": ["Serve chilled", "Pair with food", "Enjoy Mediterranean flavors"], "notes": "Growing wine region", "fun_fact": "Tunisia has ancient wine tradition", "alternatives": ["Different varieties", "Red or white", "Different regions"]}
        ]
    },
    "Ghana": {
        "country": "Ghana",
        "region": "West Africa",
        "breakfast": [
            {"id": "gha-break-fufu", "name": "Fufu (Pounded Yam)", "difficulty": "Hard", "servings": 4, "prepTime": 20, "cookTime": 30, "description": "Ghanaian pounded yam and plantain", "seasonings": ["salt"], "ingredients": ["Yam", "Plantain", "Salt", "Water"], "instructions": ["Boil yam and plantain", "Pound until smooth", "Add salt to taste", "Form into balls", "Serve with soup"], "notes": "Requires strong arm", "fun_fact": "Fufu is West African staple", "alternatives": ["Only yam", "Only plantain", "Different vegetables"]}
        ],
        "lunch": [
            {"id": "gha-lunch-jollof", "name": "Jollof Rice (Ghanaian)", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 45, "description": "Ghanaian version of jollof", "seasonings": ["paprika", "ginger"], "ingredients": ["Rice", "Tomatoes", "Onion", "Paprika", "Ginger", "Broth", "Oil"], "instructions": ["Sauté onion and ginger", "Add tomato paste", "Add rice, toast", "Add broth", "Bring to boil", "Cover, simmer 25 minutes"], "notes": "Slightly spicy", "fun_fact": "Jollof rice competition between nations", "alternatives": ["With meat", "More vegetables", "Less spicy"]}
        ],
        "dinner": [
            {"id": "gha-dinner-light-soup", "name": "Light Soup (Vegetable Soup)", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 40, "description": "Ghanaian vegetable soup", "seasonings": ["onion"], "ingredients": ["Meat", "Tomatoes", "Onion", "Vegetables", "Spices", "Broth", "Oil"], "instructions": ["Brown meat", "Add onion", "Add tomato base", "Add broth", "Add vegetables", "Simmer 30 minutes", "Season to taste"], "notes": "Light and healthy", "fun_fact": "Light soup is everyday meal", "alternatives": ["Vegetarian version", "More meat", "Different vegetables"]}
        ],
        "snacks": [
            {"id": "gha-snack-waakye", "name": "Waakye (Rice and Beans)", "difficulty": "Medium", "servings": 4, "prepTime": 10, "cookTime": 45, "description": "Ghanaian rice and beans", "seasonings": ["onion"], "ingredients": ["Rice", "Beans", "Leaves", "Onion", "Oil", "Salt"], "instructions": ["Boil beans", "Add leaves for color", "Cook rice in bean water", "Mix beans and rice", "Serve with sauce"], "notes": "Pink colored rice", "fun_fact": "Waakye is Ghanaian breakfast", "alternatives": ["Different beans", "Without leaves", "More oil"]}
        ],
        "desserts": [
            {"id": "gha-dessert-coconut", "name": "Coconut Candy", "difficulty": "Medium", "servings": 12, "prepTime": 15, "cookTime": 20, "description": "Ghanaian coconut confection", "seasonings": [], "ingredients": ["Fresh coconut", "Sugar", "Water", "Ginger (optional)"], "instructions": ["Grate coconut", "Make sugar syrup", "Add coconut", "Cook until thick", "Add ginger if desired", "Pour onto oiled paper", "Cut when cool"], "notes": "Chewy texture", "fun_fact": "Coconut candy is traditional", "alternatives": ["With ginger", "Firmer texture", "Different shape"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "gha-drink-ginger", "name": "Ginger Drink", "difficulty": "Easy", "servings": 2, "prepTime": 10, "cookTime": 10, "description": "Ghanaian fresh ginger drink", "seasonings": ["ginger"], "ingredients": ["Fresh ginger", "Water", "Sugar", "Lemon"], "instructions": ["Peel and chop ginger", "Boil in water", "Strain", "Add sugar", "Add lemon juice", "Serve hot or cold"], "notes": "Warming and spicy", "fun_fact": "Ginger drink in Ghana", "alternatives": ["More ginger", "Less sugar", "With honey"]}
        ],
        "alcoholicDrinks": [
            {"id": "gha-drink-beer", "name": "Ghanaian Beer", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Local Ghanaian beer", "seasonings": [], "ingredients": ["Ghanaian beer"], "instructions": ["Serve cold", "Enjoy with food"], "notes": "Refreshing", "fun_fact": "Ghanaian beer brands popular", "alternatives": ["Different brands", "Local brews", "Different strength"]}
        ]
    }
}

def expand_phase_7_batch_3():
    os.makedirs('data/phase7-recipes', exist_ok=True)
    for country, data in PHASE_7_BATCH_3.items():
        filename = f"data/phase7-recipes/{country.lower().replace(' ', '_')}-phase7-authentic.json"
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        recipes = sum(len(data.get(cat, []))
                     for cat in ['breakfast', 'lunch', 'dinner', 'snacks',
                                'desserts', 'nonAlcoholicDrinks', 'alcoholicDrinks'])
        print(f"✓ {country:<25} | {recipes} recipes")

if __name__ == "__main__":
    print("\n🌍 PHASE 7 BATCH 3: More Africa Expansion")
    print("="*80 + "\n")
    expand_phase_7_batch_3()
    print("\n✓ Batch 3 complete!")
