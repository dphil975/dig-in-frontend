#!/usr/bin/env python3
"""
PHASE 4 BATCH 2: Central Europe & Nordic expansion
Austria, Belgium, Netherlands, Denmark, Norway
"""
import json, os

PHASE_4_BATCH_2 = {
    "Austria": {
        "country": "Austria",
        "region": "Europe",
        "breakfast": [
            {"id": "aut-break-kaiserschmarrn", "name": "Kaiserschmarrn (Shredded Pancake)", "difficulty": "Medium", "servings": 4, "prepTime": 10, "cookTime": 15, "description": "Austrian fluffy shredded pancakes with plum sauce", "seasonings": ["vanilla"], "ingredients": ["4 eggs (separated)", "1/2 cup flour", "1/2 cup milk", "Pinch salt", "2 tbsp sugar", "3 tbsp butter", "Plum sauce or jam", "Powdered sugar"], "instructions": ["Beat egg whites until stiff", "Mix yolks with flour, milk, salt", "Fold whites into yolk mixture", "Heat butter in large skillet", "Pour batter, cook 2 minutes", "Shred with spatula into bite-size pieces", "Flip and cook other side 2 minutes", "Transfer to plate", "Dust with powdered sugar", "Serve with plum sauce"], "notes": "Shredding creates the characteristic texture", "fun_fact": "Kaiserschmarrn is named after Emperor Franz Joseph and is Austria's beloved breakfast", "alternatives": ["Serve with apple sauce", "Add berries", "Different jam"]}
        ],
        "lunch": [
            {"id": "aut-lunch-wiener-schnitzel", "name": "Wiener Schnitzel", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 20, "description": "Thin breaded veal cutlet fried until golden", "seasonings": ["salt", "pepper"], "ingredients": ["4 veal cutlets", "1 cup flour", "2 eggs, beaten", "1 cup breadcrumbs", "Salt", "Pepper", "Oil for frying", "Lemon wedges"], "instructions": ["Pound veal thin between plastic wrap", "Season with salt and pepper", "Set up breading station: flour, beaten eggs, breadcrumbs", "Coat each cutlet in flour, then egg, then breadcrumbs", "Heat oil to 350°F", "Fry until golden on both sides, 3-4 minutes total", "Drain on paper towels", "Serve with lemon wedges and parsley"], "notes": "Veal must be pounded thin", "fun_fact": "Wiener Schnitzel is Austria's national dish and is cooked to perfection in Vienna", "alternatives": ["Pork instead of veal", "Chicken breast", "Served with different sauce"]}
        ],
        "dinner": [
            {"id": "aut-dinner-goulash", "name": "Goulash (Paprika Stew)", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 90, "description": "Hungarian-influenced Austrian stew with beef and paprika", "seasonings": ["paprika", "caraway"], "ingredients": ["2 lbs beef, cubed", "3 onions, diced", "4 tbsp paprika", "2 tbsp tomato paste", "4 cups broth", "3 carrots", "2 potatoes", "Caraway seeds", "Bay leaf", "Salt", "Pepper", "Oil"], "instructions": ["Heat oil, brown beef in batches", "Sauté onions until soft", "Add paprika, cook 1 minute", "Add tomato paste", "Add broth, bay leaf, caraway", "Return beef", "Simmer 45 minutes", "Add vegetables", "Simmer 30 more minutes", "Vegetables should be tender", "Season with salt and pepper"], "notes": "Low and slow cooking develops flavor", "fun_fact": "Goulash is shared between Austria and Hungary and is beloved in Vienna", "alternatives": ["Pork instead of beef", "Add dumplings", "Less paprika for lighter flavor"]}
        ],
        "snacks": [
            {"id": "aut-snack-pretzel", "name": "Salzburg Pretzel", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 30, "description": "Traditional Austrian soft pretzel", "seasonings": ["salt"], "ingredients": ["Dough: 3 cups flour, 1 packet yeast, 1 cup water, 1 tsp salt, 2 tbsp butter", "Topping: Coarse sea salt", "Baking soda solution"], "instructions": ["Make dough: combine flour, yeast, water, salt, butter", "Knead until smooth", "Let rise 1 hour", "Divide into pieces, roll into ropes", "Form pretzel shapes", "Let proof 20 minutes", "Dip in boiling baking soda solution", "Place on greased baking sheet", "Sprinkle with salt", "Bake at 425°F for 25-30 minutes", "Should be deep golden brown"], "notes": "Baking soda bath is essential", "fun_fact": "Salzburg Pretzels are from Austria and are enjoyed as snacks or with beer", "alternatives": ["Smaller bite-size pretzels", "Add seeds", "Different shapes"]}
        ],
        "desserts": [
            {"id": "aut-dessert-sachertorte", "name": "Sachertorte (Chocolate Cake)", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 60, "description": "Famous Viennese chocolate cake with apricot jam and chocolate glaze", "seasonings": ["vanilla"], "ingredients": ["6 oz dark chocolate", "1/2 cup butter", "6 eggs (separated)", "2/3 cup sugar", "1/2 cup flour", "Apricot jam", "Chocolate glaze", "Whipped cream"], "instructions": ["Melt chocolate and butter together", "Cool slightly", "Beat yolks with 1/3 sugar until pale", "Mix in chocolate", "Beat whites with remaining sugar until stiff", "Fold whites into chocolate mixture", "Fold in flour", "Pour into greased pan", "Bake at 350°F for 50-60 minutes", "Cool completely", "Slice in half, fill with apricot jam", "Cover with chocolate glaze", "Serve with whipped cream"], "notes": "Don't overbake - should be slightly moist inside", "fun_fact": "Sachertorte is Vienna's most famous cake and is protected by Austrian law", "alternatives": ["Different jam filling", "Different chocolate coating", "Served warm"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "aut-drink-melange", "name": "Melange (Vienna Coffee)", "difficulty": "Easy", "servings": 1, "prepTime": 5, "cookTime": 5, "description": "Austrian strong coffee with steamed milk", "seasonings": [], "ingredients": ["Double espresso", "Steamed milk", "Milk foam"], "instructions": ["Make double espresso", "Steam milk until foamy", "Pour into cup", "Add milk and foam to espresso", "Stir gently", "Serve immediately"], "notes": "Should be smooth and creamy", "fun_fact": "Melange is Vienna's version of cappuccino and is enjoyed throughout Austria", "alternatives": ["More milk for lighter drink", "Different coffee strength", "Add cocoa powder"]}
        ],
        "alcoholicDrinks": [
            {"id": "aut-drink-schnapps", "name": "Austrian Schnapps", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Clear fruit brandy served ice-cold as digestif", "seasonings": [], "ingredients": ["Schnapps (apricot, plum, etc.)"], "instructions": ["Chill schnapps in freezer", "Serve in small shot glass", "Drink slowly or quickly", "Often served after meal as digestif"], "notes": "Many fruit varieties available", "fun_fact": "Austrian Schnapps is a traditional digestif and is made from local fruits", "alternatives": ["Different fruit flavors", "Room temperature", "Mixed with beer"]}
        ]
    },
    "Belgium": {
        "country": "Belgium",
        "region": "Europe",
        "breakfast": [
            {"id": "bel-break-waffle", "name": "Belgian Waffle", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 25, "description": "Belgium's iconic crispy waffle with chocolate and strawberries", "seasonings": ["vanilla"], "ingredients": ["2 cups flour", "1 packet yeast", "3/4 cup warm milk", "2 eggs", "1/2 cup melted butter", "1 tbsp sugar", "Pinch salt", "Chocolate sauce", "Strawberries", "Powdered sugar"], "instructions": ["Mix flour, yeast, milk, eggs, butter, sugar, salt", "Let rise 45 minutes", "Heat waffle iron", "Pour batter into iron", "Cook until golden and crispy", "Transfer to plate", "Top with chocolate sauce", "Add fresh strawberries", "Dust with powdered sugar", "Serve immediately"], "notes": "Batter should be slightly thick", "fun_fact": "Belgian Waffles are world-famous and are topped with chocolate and fruit throughout Belgium", "alternatives": ["Nutella instead of chocolate", "Berries instead of strawberries", "Whipped cream topping"]}
        ],
        "lunch": [
            {"id": "bel-lunch-mussels", "name": "Mussels with Fries", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 20, "description": "Belgian moules frites with white wine broth and Belgian fries", "seasonings": ["thyme", "bay leaf", "garlic"], "ingredients": ["2 lbs mussels", "2 shallots, minced", "4 cloves garlic", "1 cup white wine", "2 tbsp butter", "Thyme", "Bay leaf", "Belgian fries", "Mayonnaise"], "instructions": ["Clean mussels, discard any open ones", "Heat butter, sauté shallots and garlic", "Add wine, thyme, bay leaf", "Add mussels", "Cover and cook 5-8 minutes", "Mussels should open", "Discard any unopened", "Serve in bowl with broth", "Serve with Belgian fries and mayonnaise"], "notes": "Discard any mussels that don't open", "fun_fact": "Moules Frites is Belgium's most iconic dish and is served everywhere", "alternatives": ["Cream instead of wine", "Add beer", "With different herbs"]}
        ],
        "dinner": [
            {"id": "bel-dinner-carbonnade", "name": "Carbonnade Flamande (Beer Stew)", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 90, "description": "Flemish beef stew made with Belgian beer", "seasonings": ["bay leaf", "thyme"], "ingredients": ["2 lbs beef, cubed", "2 bottles Belgian beer", "2 onions, sliced", "2 tbsp tomato paste", "3 tbsp oil", "2 tbsp brown sugar", "Bay leaf", "Thyme", "Salt", "Pepper", "Mustard"], "instructions": ["Brown beef in batches", "Sauté onions until soft", "Add tomato paste, cook 1 minute", "Add beer, bay leaf, thyme", "Return beef", "Bring to boil", "Reduce heat, simmer covered 60-75 minutes", "Add brown sugar", "Stir in mustard", "Season with salt and pepper", "Serve with crusty bread"], "notes": "Belgian beer gives unique flavor", "fun_fact": "Carbonnade Flamande is Flanders' traditional comfort food and is made with local beer", "alternatives": ["Different beer type", "Add vegetables", "Thicker gravy"]}
        ],
        "snacks": [
            {"id": "bel-snack-fries", "name": "Belgian Fries (Frites)", "difficulty": "Easy", "servings": 4, "prepTime": 10, "cookTime": 30, "description": "Golden double-fried Belgian fries with various sauces", "seasonings": ["salt"], "ingredients": ["4 large potatoes", "Oil for frying", "Salt", "Mayonnaise", "Ketchup", "Various Belgian sauces"], "instructions": ["Cut potatoes into thick fries", "Soak in cold water 30 minutes", "Drain and pat dry", "First fry at 325°F for 5-8 minutes (not browning)", "Remove and drain", "Second fry at 375°F for 2-3 minutes until golden", "Drain on paper towels", "Season with salt", "Serve with mayo or other sauces"], "notes": "Double frying is essential for texture", "fun_fact": "Belgian Fries are world-famous and are served with specialty sauces throughout Belgium", "alternatives": ["Curly fries", "Waffle fries", "Different seasonings"]}
        ],
        "desserts": [
            {"id": "bel-dessert-chocolate", "name": "Belgian Praline (Chocolate)", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 20, "description": "Belgium's famous handmade chocolate praline", "seasonings": ["vanilla", "cocoa"], "ingredients": ["8 oz dark chocolate", "4 oz milk chocolate", "1 cup cream", "Various fillings (ganache, praline paste, etc.)", "Cocoa powder"], "instructions": ["Temper dark chocolate", "Mold into half shells in chocolate molds", "Make ganache: heat cream, pour over chopped chocolate", "Let set slightly", "Fill shells with ganache or praline paste", "Set another layer of chocolate on top", "Let set completely", "Dust with cocoa or decorate", "Store in cool place"], "notes": "Requires tempering chocolate", "fun_fact": "Belgian Pralines are world-renowned and each shop has secret recipes", "alternatives": ["Different fillings", "Milk or white chocolate", "Different decorations"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "bel-drink-hot-chocolate", "name": "Belgian Hot Chocolate", "difficulty": "Easy", "servings": 2, "prepTime": 5, "cookTime": 10, "description": "Thick, rich Belgian hot chocolate made with real chocolate", "seasonings": [], "ingredients": ["6 oz dark chocolate, chopped", "2 cups milk", "1/2 cup cream", "Whipped cream", "Chocolate shavings"], "instructions": ["Heat milk and cream until steaming", "Add chopped chocolate", "Stir until completely melted", "Pour into cups", "Top with whipped cream", "Sprinkle with chocolate shavings", "Serve immediately"], "notes": "Should be thick and decadent", "fun_fact": "Belgian Hot Chocolate is luxuriously thick and is made with real chocolate", "alternatives": ["Add vanilla", "Serve with pastry", "Different chocolate type"]}
        ],
        "alcoholicDrinks": [
            {"id": "bel-drink-trappist-beer", "name": "Trappist Beer", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Strong Belgian beer brewed by monks", "seasonings": [], "ingredients": ["Trappist Beer"], "instructions": ["Serve in chalice or special beer glass", "Pour carefully with head", "Sip slowly to appreciate complexity", "Often has fruity and spicy notes"], "notes": "Complex flavor profile", "fun_fact": "Belgian Trappist Beers are brewed by monks and are only made in specific monasteries", "alternatives": ["Different Trappist breweries", "Abbey beers", "Different styles"]}
        ]
    },
    "Netherlands": {
        "country": "Netherlands",
        "region": "Europe",
        "breakfast": [
            {"id": "ned-break-stroopwafel", "name": "Stroopwafel (Syrup Waffle)", "difficulty": "Medium", "servings": 8, "prepTime": 20, "cookTime": 30, "description": "Dutch waffle sandwich filled with caramel syrup", "seasonings": ["cinnamon"], "ingredients": ["1.5 cups flour", "1/2 cup butter", "1/4 cup sugar", "2 eggs", "1/2 cup milk", "Waffle iron", "Caramel syrup filling", "Cinnamon"], "instructions": ["Make batter: mix flour, butter, sugar, eggs, milk", "Heat waffle iron", "Pour batter into iron", "Cook until golden", "Split warm waffle in half", "Spread caramel syrup inside", "Press halves together", "Serve warm"], "notes": "Syrup must be added while waffle is warm", "fun_fact": "Stroopwafels are Netherlands' iconic treat and are enjoyed with hot drinks", "alternatives": ["Honey instead of caramel", "Chocolate filling", "Add nuts to filling"]}
        ],
        "lunch": [
            {"id": "ned-lunch-pea-soup", "name": "Pea Soup (Erwtensoep)", "difficulty": "Easy", "servings": 6, "prepTime": 10, "cookTime": 45, "description": "Dutch thick pea soup with sausage and celery", "seasonings": ["bay leaf"], "ingredients": ["1 lb dried split peas", "6 cups broth", "2 potatoes, diced", "2 carrots, sliced", "3 celery stalks, diced", "2 smoked sausages", "1 onion", "Bay leaf", "Salt", "Pepper"], "instructions": ["Soak peas if desired", "Bring broth to boil", "Add peas, onion, bay leaf", "Simmer 30 minutes", "Add potatoes and carrots", "Simmer 15 minutes", "Add celery and sliced sausage", "Simmer 5 more minutes", "Season with salt and pepper", "Soup should be thick"], "notes": "Should be thick and hearty", "fun_fact": "Pea Soup is a Dutch winter staple and is served throughout the Netherlands", "alternatives": ["Vegetarian without sausage", "Add spinach", "Different sausage type"]}
        ],
        "dinner": [
            {"id": "ned-dinner-bitterballen", "name": "Bitterballen (Fried Croquettes)", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 30, "description": "Dutch fried meat croquettes served as appetizer or main", "seasonings": ["nutmeg", "salt"], "ingredients": ["3 tbsp butter", "3 tbsp flour", "1 cup beef broth", "1/2 lb cooked beef, minced", "Salt", "Pepper", "Nutmeg", "Breadcrumbs", "Eggs", "Oil for frying", "Mustard"], "instructions": ["Make béchamel: melt butter, whisk flour, add broth", "Cook until thick", "Stir in minced meat", "Season with salt, pepper, nutmeg", "Spread on tray to cool", "Once cold, form into balls", "Set up breading: flour, beaten eggs, breadcrumbs", "Coat each ball", "Chill again", "Deep fry at 350°F until golden", "Serve hot with mustard"], "notes": "Must be cold when breading", "fun_fact": "Bitterballen are Dutch pub food and are served as appetizers with beer", "alternatives": ["Cheese filling", "Smaller size", "Chicken meat"]}
        ],
        "snacks": [
            {"id": "ned-snack-pancakes", "name": "Dutch Pancakes (Pannenkoeken)", "difficulty": "Easy", "servings": 4, "prepTime": 10, "cookTime": 20, "description": "Large Dutch pancakes served sweet or savory", "seasonings": ["salt"], "ingredients": ["1 cup flour", "2 eggs", "1.5 cups milk", "Pinch salt", "Oil", "Toppings: jam, cheese, ham, apples"], "instructions": ["Mix flour, eggs, milk, salt until smooth", "Heat large skillet or crepe pan", "Lightly oil", "Pour batter to cover bottom", "Cook until bottom is lightly brown", "Flip and cook other side", "Transfer to plate", "Add sweet toppings (jam, syrup) or savory (cheese, ham)", "Fold and serve"], "notes": "Large and thin like a crepe", "fun_fact": "Dutch Pancakes are eaten for any meal in Netherlands and are casual food", "alternatives": ["Different toppings", "Sweet vs savory", "Rolled or folded"]}
        ],
        "desserts": [
            {"id": "ned-dessert-panettone", "name": "Poffertjes (Mini Pancakes)", "difficulty": "Medium", "servings": 24, "prepTime": 15, "cookTime": 30, "description": "Dutch mini puffy pancakes dusted with powdered sugar", "seasonings": ["vanilla"], "ingredients": ["1 cup flour", "1 packet yeast", "3/4 cup milk", "2 eggs", "1 tbsp sugar", "1/4 tsp salt", "Butter for pan", "Powdered sugar"], "instructions": ["Mix flour, yeast, milk, eggs, sugar, salt", "Let rise 30 minutes", "Heat poffertje pan (special pan with round molds)", "Add small amount butter to each mold", "Spoon batter into molds", "Cook until puffed and golden", "Flip if needed", "Transfer to plate", "Dust generously with powdered sugar", "Serve warm"], "notes": "Requires special poffertje pan", "fun_fact": "Poffertjes are sold at Dutch street fairs and are a childhood favorite", "alternatives": ["Chocolate filling", "Different toppings", "Make without special pan"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "ned-drink-milk", "name": "Dutch Milk", "difficulty": "Easy", "servings": 1, "prepTime": 5, "cookTime": 0, "description": "Netherlands' famous fresh milk served cold", "seasonings": [], "ingredients": ["Fresh Dutch milk", "Ice"], "instructions": ["Pour cold milk into glass", "Add ice if desired", "Enjoy", "Pair with typical Dutch snack"], "notes": "Dutch milk is world-famous for quality", "fun_fact": "Netherlands produces some of the world's best milk and dairy products", "alternatives": ["Different fat content", "Chocolate milk", "Warm milk"]}
        ],
        "alcoholicDrinks": [
            {"id": "ned-drink-genever", "name": "Genever (Dutch Gin)", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Dutch gin spirit served ice-cold as shot", "seasonings": [], "ingredients": ["Genever"], "instructions": ["Chill genever in freezer", "Serve in small shot glass", "Drink quickly or sip slowly", "Served at room temperature in traditional way"], "notes": "National spirit of Netherlands", "fun_fact": "Genever is the ancestor of English gin and has been made in Netherlands for centuries", "alternatives": ["Genever jonge (young)", "Genever oude (aged)", "Mixed with beer"]}
        ]
    }
}

def expand_phase_4_batch_2():
    os.makedirs('data/phase4-recipes', exist_ok=True)
    for country, data in PHASE_4_BATCH_2.items():
        filename = f"data/phase4-recipes/{country.lower()}-phase4-authentic.json"
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        recipes = sum(len(data.get(cat, []))
                     for cat in ['breakfast', 'lunch', 'dinner', 'snacks',
                                'desserts', 'nonAlcoholicDrinks', 'alcoholicDrinks'])
        print(f"✓ {country:<15} | {recipes} recipes")

if __name__ == "__main__":
    print("\n🌍 PHASE 4 BATCH 2: Central Europe")
    print("="*80 + "\n")
    expand_phase_4_batch_2()
    print("\n✓ Batch 2 complete!")
