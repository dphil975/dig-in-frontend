#!/usr/bin/env python3
"""
PHASE 5 BATCH 2: Nordic & Eastern Europe expansion
Norway, Denmark, Finland, Czech Republic
"""
import json, os

PHASE_5_BATCH_2 = {
    "Norway": {
        "country": "Norway",
        "region": "Europe",
        "breakfast": [
            {"id": "nor-break-porridge", "name": "Norwegian Porridge (Grøt)", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 30, "description": "Norwegian oat porridge served with butter and sugar", "seasonings": ["salt", "cinnamon"], "ingredients": ["1 cup steel-cut oats", "4 cups milk or water", "Pinch salt", "Butter", "Brown sugar", "Cinnamon", "Berries"], "instructions": ["Heat liquid", "Add oats and salt", "Stir frequently", "Simmer 25-30 minutes until creamy", "Stir in butter", "Serve in bowl", "Top with brown sugar and cinnamon", "Add berries if available"], "notes": "Constant stirring prevents lumps", "fun_fact": "Porridge is traditional Norwegian winter breakfast", "alternatives": ["Different grains", "Add honey", "Savory version"]}
        ],
        "lunch": [
            {"id": "nor-lunch-salmon", "name": "Gravlax (Cured Salmon)", "difficulty": "Hard", "servings": 8, "prepTime": 20, "cookTime": 0, "description": "Norwegian salt-cured salmon with dill", "seasonings": ["dill", "salt", "pepper"], "ingredients": ["2 lbs salmon fillet", "3 tbsp salt", "2 tbsp sugar", "1 tbsp white pepper", "1 tbsp coriander seeds", "Large bunch dill", "Lemon juice"], "instructions": ["Mix salt, sugar, pepper, coriander", "Place dill in dish", "Rub salmon with salt mixture", "Layer more dill over salmon", "Cover and refrigerate", "Turn daily for 5-7 days", "Slice thin at angle", "Serve on bread with mustard sauce"], "notes": "Requires proper curing time", "fun_fact": "Gravlax is Norwegian cured salmon tradition dating back centuries", "alternatives": ["Different fish", "Quicker cure with heat", "Different flavoring"]}
        ],
        "dinner": [
            {"id": "nor-dinner-fish-stew", "name": "Norwegian Fish Stew", "difficulty": "Medium", "servings": 6, "prepTime": 20, "cookTime": 40, "description": "Norwegian seafood stew with white fish and potatoes", "seasonings": ["bay leaf", "thyme"], "ingredients": ["2 lbs white fish", "8 oz shrimp", "6 potatoes, diced", "2 onions", "4 carrots", "6 cups fish broth", "1 cup cream", "Butter", "Bay leaf", "Thyme", "Salt", "Pepper"], "instructions": ["Sauté onions and carrots", "Add potatoes and broth", "Simmer 20 minutes", "Add fish pieces", "Simmer 10 minutes", "Add shrimp", "Simmer 5 more minutes", "Stir in cream", "Season with salt and pepper", "Serve hot"], "notes": "Don't overcook fish", "fun_fact": "Norwegian fish stew reflects country's fishing heritage", "alternatives": ["Different fish type", "Add mussels", "Less cream"]}
        ],
        "snacks": [
            {"id": "nor-snack-brunost", "name": "Brunost (Brown Cheese)", "difficulty": "Easy", "servings": 8, "prepTime": 5, "cookTime": 0, "description": "Norwegian sweet brown cheese served on bread", "seasonings": [], "ingredients": ["Brunost (brown cheese)", "Bread", "Butter"], "instructions": ["Slice brunost thin", "Toast bread", "Butter toast", "Layer brunost on toast", "Eat while warm", "Often paired with jam"], "notes": "Unique sweet cheese flavor", "fun_fact": "Brunost is uniquely Norwegian and is served for breakfast or snack", "alternatives": ["Different bread type", "With jam", "On crackers"]}
        ],
        "desserts": [
            {"id": "nor-dessert-cake", "name": "Norwegian Almond Cake", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 45, "description": "Norwegian almond and fruit cake", "seasonings": ["almond", "lemon zest"], "ingredients": ["1.5 cups butter", "1.5 cups sugar", "6 eggs", "2 cups flour", "1 cup ground almonds", "1 tbsp lemon zest", "2 tsp baking powder", "Candied fruit", "Powdered sugar"], "instructions": ["Cream butter and sugar", "Add eggs one at a time", "Fold in flour, almonds, lemon zest, baking powder", "Pour into greased pan", "Top with candied fruit", "Bake at 350°F for 40-45 minutes", "Cool completely", "Dust with powdered sugar"], "notes": "Should be moist inside", "fun_fact": "Almond cake is popular at Norwegian celebrations", "alternatives": ["Different nuts", "Without candied fruit", "Chocolate version"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "nor-drink-berry-compote", "name": "Norwegian Berry Compote", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 20, "description": "Norwegian berry drink served hot or cold", "seasonings": ["sugar"], "ingredients": ["2 cups mixed berries", "1 cup water", "1/4 cup sugar", "Cinnamon stick"], "instructions": ["Combine berries and water", "Heat to simmer", "Add sugar and cinnamon", "Simmer 15 minutes", "Strain if desired", "Serve hot or cold", "Can add more water for lighter drink"], "notes": "Can use fresh or frozen berries", "fun_fact": "Berry compote is traditional Norwegian drink", "alternatives": ["Just one berry type", "With cream", "As dessert topping"]}
        ],
        "alcoholicDrinks": [
            {"id": "nor-drink-aquavit", "name": "Aquavit (Caraway Spirit)", "difficulty": "Easy", "servings": 4, "prepTime": 0, "cookTime": 0, "description": "Norwegian spirit with caraway and spices", "seasonings": [], "ingredients": ["Aquavit"], "instructions": ["Chill aquavit in freezer", "Serve as ice-cold shot", "Often followed by beer", "Traditional with heavy foods"], "notes": "Very strong spirit", "fun_fact": "Aquavit is traditional Norwegian spirit and is served at celebrations", "alternatives": ["Room temperature", "Mixed with beer", "Different brands"]}
        ]
    },
    "Denmark": {
        "country": "Denmark",
        "region": "Europe",
        "breakfast": [
            {"id": "den-break-smørrebrød", "name": "Smørrebrød (Open Sandwich)", "difficulty": "Easy", "servings": 2, "prepTime": 10, "cookTime": 0, "description": "Danish open sandwich with various toppings", "seasonings": ["salt", "pepper"], "ingredients": ["Dark rye bread", "Butter", "Various toppings: cheese, ham, herring, hard-boiled egg", "Pickled cucumber", "Lettuce", "Tomato"], "instructions": ["Slice dark rye bread", "Butter generously", "Top with main ingredient", "Arrange garnishes attractively", "Serve immediately", "Eat with knife and fork"], "notes": "Presentation is important", "fun_fact": "Smørrebrød is Denmark's iconic lunch and breakfast item", "alternatives": ["Different toppings", "Different bread", "Multiple sandwiches"]}
        ],
        "lunch": [
            {"id": "den-lunch-meatballs", "name": "Danish Meatballs", "difficulty": "Medium", "servings": 4, "prepTime": 20, "cookTime": 30, "description": "Danish small meatballs in sauce", "seasonings": ["nutmeg", "onion"], "ingredients": ["1.5 lbs ground pork and beef", "1/2 cup breadcrumbs", "1/4 cup milk", "1 egg", "1 onion, minced", "Salt", "Pepper", "Nutmeg", "Butter", "Flour", "Broth", "Cream"], "instructions": ["Soak breadcrumbs in milk", "Mix with meat, egg, onion, salt, pepper, nutmeg", "Form into small balls", "Brown in butter", "Make sauce: whisk flour into drippings", "Add broth, simmer 10 minutes", "Add cream", "Add meatballs back", "Simmer 10 more minutes"], "notes": "Keep meatballs small", "fun_fact": "Danish meatballs are served at every celebration", "alternatives": ["All pork or beef", "Mushroom sauce", "Served with pasta"]}
        ],
        "dinner": [
            {"id": "den-dinner-flødeboller", "name": "Flødeboller (Chocolate Cream Cake)", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 30, "description": "Danish chocolate-covered cream cake", "seasonings": ["vanilla"], "ingredients": ["Almond base", "Cream filling", "Chocolate coating"], "instructions": ["Make almond base: crush almonds with sugar and egg white", "Form into small cakes", "Bake at 350°F for 25-30 minutes", "Cool completely", "Make whipped cream filling", "Top each cake with cream", "Melt chocolate", "Dip entire cake in chocolate", "Set on baking paper", "Refrigerate until set"], "notes": "Requires multiple steps", "fun_fact": "Flødeboller is Denmark's favorite treat and comfort food", "alternatives": ["Different toppings", "Smaller size", "Without chocolate coating"]}
        ],
        "snacks": [
            {"id": "den-snack-pastry", "name": "Danish Pastry", "difficulty": "Hard", "servings": 12, "prepTime": 45, "cookTime": 25, "description": "Buttery laminated Danish pastry", "seasonings": ["vanilla"], "ingredients": ["Dough: 3 cups flour, 1 tsp salt, 1 tsp yeast, 3/4 cup milk", "Butter for laminating", "Various fillings (jam, custard, chocolate)", "Egg wash"], "instructions": ["Make dough, let rise", "Laminate with butter layers", "Fold and turn multiple times", "Chill between folds", "Shape into croissants or twists", "Let proof", "Brush with egg wash", "Bake at 400°F for 20-25 minutes", "Serve warm or at room temperature"], "notes": "Requires patient lamination", "fun_fact": "Danish pastry is world-famous and is eaten throughout the world", "alternatives": ["Store-bought dough", "Different fillings", "Simpler shapes"]}
        ],
        "desserts": [
            {"id": "den-dessert-æbleskiver", "name": "Æbleskiver (Pancake Balls)", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 30, "description": "Danish spherical pancakes filled with jam", "seasonings": ["cinnamon", "sugar"], "ingredients": ["2 cups flour", "2 tbsp sugar", "1 tsp baking powder", "2 eggs", "1.5 cups milk", "Butter", "Apple slices or jam", "Powdered sugar", "Cinnamon"], "instructions": ["Make batter from flour, sugar, baking powder, eggs, milk", "Heat æbleskiver pan (special pan with round molds)", "Add butter to each mold", "Pour batter halfway", "Add apple slice or jam", "Pour more batter", "Bake until golden on outside", "Use needle to turn while baking", "Cook until spheres are done", "Dust with powdered sugar and cinnamon"], "notes": "Requires special pan", "fun_fact": "Æbleskiver are traditional Danish dessert and street food", "alternatives": ["Without apples", "Different filling", "Made in regular pan"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "den-drink-gløgg", "name": "Gløgg (Mulled Wine - Non-Alcoholic)", "difficulty": "Easy", "servings": 6, "prepTime": 10, "cookTime": 20, "description": "Danish spiced drink", "seasonings": ["cinnamon", "cloves", "ginger"], "ingredients": ["4 cups apple cider or juice", "1 cup grape juice", "Cinnamon stick", "Cloves", "Star anise", "Ginger", "Orange slices"], "instructions": ["Heat cider and juice", "Add spices", "Simmer 15 minutes", "Strain if desired", "Pour into cups", "Add orange slice", "Serve hot"], "notes": "Warming winter drink", "fun_fact": "Gløgg is traditional Danish Christmas drink", "alternatives": ["With wine for alcoholic version", "Different spices", "Add nuts and raisins"]}
        ],
        "alcoholicDrinks": [
            {"id": "den-drink-beer", "name": "Danish Beer", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Danish lager beer", "seasonings": [], "ingredients": ["Danish beer"], "instructions": ["Serve ice-cold", "Pour with head", "Enjoy", "Cheers"], "notes": "Strong beer culture", "fun_fact": "Denmark has strong beer tradition and many breweries", "alternatives": ["Different beer styles", "Local breweries", "Craft beers"]}
        ]
    },
    "Finland": {
        "country": "Finland",
        "region": "Europe",
        "breakfast": [
            {"id": "fin-break-rye-bread", "name": "Finnish Rye Bread", "difficulty": "Hard", "servings": 12, "prepTime": 20, "cookTime": 60, "description": "Dense Finnish dark rye bread", "seasonings": ["caraway"], "ingredients": ["3 cups rye flour", "1 cup wheat flour", "1 packet yeast", "1.5 cups warm water", "1 tbsp salt", "1 tbsp caraway seeds", "Oil"], "instructions": ["Mix flours, yeast, water, salt, caraway", "Knead until smooth", "Let rise 1 hour", "Shape into round loaf", "Let proof 30 minutes", "Slash top", "Bake at 400°F for 50-60 minutes", "Crust should be dark", "Cool on rack"], "notes": "Dense texture is traditional", "fun_fact": "Rye bread is staple of Finnish breakfast and culture", "alternatives": ["Without caraway", "Larger loaf", "Different shape"]}
        ],
        "lunch": [
            {"id": "fin-lunch-karelian", "name": "Karelian Stew", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 90, "description": "Finnish layered meat and potato stew", "seasonings": ["bay leaf", "thyme"], "ingredients": ["1.5 lbs beef", "1.5 lbs pork", "1.5 lbs lamb", "4 potatoes", "2 onions", "6 cups broth", "3 bay leaves", "Thyme", "Salt", "Pepper", "Butter"], "instructions": ["Layer potatoes, onions, meats in pot", "Add bay leaves and thyme", "Pour broth to cover", "Dot with butter", "Bring to boil", "Cover and simmer 60-90 minutes", "Meats and potatoes should be tender", "Season with salt and pepper", "Serve in bowls"], "notes": "Low slow cooking", "fun_fact": "Karelian Stew is Finnish national dish from eastern region", "alternatives": ["Different meat combinations", "All beef", "Add mushrooms"]}
        ],
        "dinner": [
            {"id": "fin-dinner-salmon-soup", "name": "Salmon Soup (Lohikeitto)", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 30, "description": "Finnish creamy salmon soup", "seasonings": ["dill", "bay leaf"], "ingredients": ["1.5 lbs salmon", "4 potatoes, diced", "1 onion", "4 cups broth", "1 cup cream", "2 tbsp butter", "Fresh dill", "Bay leaf", "Salt", "Pepper"], "instructions": ["Sauté onion in butter", "Add potatoes and broth", "Simmer 15 minutes", "Add salmon pieces", "Simmer 10 minutes", "Stir in cream", "Add dill and bay leaf", "Season with salt and pepper", "Simmer 5 more minutes", "Serve hot"], "notes": "Don't overcook salmon", "fun_fact": "Salmon Soup is classic Finnish dish and comfort food", "alternatives": ["Different fish type", "Less cream", "Add peas"]}
        ],
        "snacks": [
            {"id": "fin-snack-pasties", "name": "Finnish Pasties (Karjalanpiirakka)", "difficulty": "Hard", "servings": 8, "prepTime": 30, "cookTime": 30, "description": "Finnish rice-filled pastry", "seasonings": ["salt"], "ingredients": ["Rye dough: 2 cups rye flour, 1 cup wheat flour, 1 cup water, Salt", "Filling: 1 cup cooked rice, 1 cup broth, Butter", "Egg for glaze"], "instructions": ["Make rye dough", "Let rest 20 minutes", "Roll thin between parchment", "Cut into oval shapes", "Mix rice with broth", "Spread rice filling on one half", "Fold dough over filling", "Seal edges with fork", "Brush with egg wash", "Bake at 425°F for 25-30 minutes", "Serve hot with butter"], "notes": "Filling slightly overflows", "fun_fact": "Karjalanpiirakka is traditional Finnish pastry from Karelia", "alternatives": ["Different filling", "Potato filling", "Larger size"]}
        ],
        "desserts": [
            {"id": "fin-dessert-pulla", "name": "Pulla (Finnish Cardamom Bread)", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 40, "description": "Finnish sweet cardamom bread with pearl sugar", "seasonings": ["cardamom"], "ingredients": ["3 cups flour", "1 packet yeast", "3/4 cup milk", "1/3 cup sugar", "1/4 cup butter", "1 egg", "1 tsp cardamom", "Salt", "Pearl sugar"], "instructions": ["Heat milk with butter", "Cool to warm", "Mix with yeast", "Add flour, sugar, egg, cardamom, salt", "Knead until smooth", "Let rise 1 hour", "Shape into braids or rolls", "Let proof 30 minutes", "Brush with egg", "Sprinkle pearl sugar", "Bake at 400°F for 30-40 minutes", "Serve warm"], "notes": "Pearl sugar is traditional", "fun_fact": "Pulla is Finland's most loved sweet bread and is served with coffee", "alternatives": ["Without cardamom", "Different shape", "Regular sugar"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "fin-drink-berry-juice", "name": "Finnish Berry Juice", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 0, "description": "Refreshing Finnish berry drink", "seasonings": ["sugar"], "ingredients": ["2 cups mixed berries", "2 cups water", "1/4 cup sugar", "Ice"], "instructions": ["Combine berries and water", "Simmer 10 minutes", "Strain through sieve", "Add sugar", "Chill thoroughly", "Serve over ice", "Can add more water for lighter drink"], "notes": "Can use frozen berries", "fun_fact": "Berry juice is traditional Finnish drink especially in summer", "alternatives": ["One berry type", "Without sugar", "Smoothie version"]}
        ],
        "alcoholicDrinks": [
            {"id": "fin-drink-koskenkorva", "name": "Koskenkorva (Rye Spirit)", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Finnish rye-based spirit served ice-cold", "seasonings": [], "ingredients": ["Koskenkorva"], "instructions": ["Chill in freezer", "Serve as shot", "Drink quickly", "Often with beer chaser"], "notes": "Very strong", "fun_fact": "Koskenkorva is Finland's national spirit and is consumed at celebrations", "alternatives": ["Room temperature", "Mixed with drinks", "Different brand"]}
        ]
    },
    "Czech Republic": {
        "country": "Czech Republic",
        "region": "Europe",
        "breakfast": [
            {"id": "cze-break-kolache", "name": "Koláče (Sweet Bun)", "difficulty": "Medium", "servings": 12, "prepTime": 30, "cookTime": 25, "description": "Czech sweet yeast bun with fruit filling", "seasonings": ["vanilla", "cinnamon"], "ingredients": ["Dough: 4 cups flour, 1 packet yeast, 1 cup milk, 1/3 cup butter, 1/3 cup sugar, 2 eggs", "Filling: jam or fruit", "Streusel: 1/2 cup flour, 1/4 cup sugar, 1/4 cup butter"], "instructions": ["Make yeast dough", "Let rise 1 hour", "Shape into small buns", "Let proof 30 minutes", "Make indent in center of each", "Add jam or fruit to indent", "Make streusel topping", "Sprinkle on buns", "Bake at 375°F for 20-25 minutes", "Serve warm"], "notes": "Indent catches filling", "fun_fact": "Koláče are Czech national bread and are served at every celebration", "alternatives": ["Different fillings", "Larger size", "Without streusel"]}
        ],
        "lunch": [
            {"id": "cze-lunch-schnitzel", "name": "Czech Schnitzel", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 20, "description": "Breaded Czech pork cutlet", "seasonings": ["salt", "pepper"], "ingredients": ["4 pork cutlets", "1 cup flour", "2 eggs, beaten", "1 cup breadcrumbs", "Salt", "Pepper", "Oil for frying", "Lemon"], "instructions": ["Pound pork thin", "Season with salt and pepper", "Set up breading: flour, egg, breadcrumbs", "Coat each cutlet", "Heat oil to 350°F", "Fry 3-4 minutes per side until golden", "Drain on paper towels", "Serve with lemon"], "notes": "Pound thin for tender meat", "fun_fact": "Schnitzel is Czech favorite and is served throughout the country", "alternatives": ["Veal instead of pork", "Chicken", "Different sauce"]}
        ],
        "dinner": [
            {"id": "cze-dinner-goulash", "name": "Czech Goulash", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 90, "description": "Czech beef stew with paprika", "seasonings": ["paprika", "caraway"], "ingredients": ["2 lbs beef, cubed", "3 onions, diced", "3 tbsp paprika", "2 tbsp tomato paste", "4 cups broth", "3 carrots", "2 potatoes", "Caraway seeds", "Bay leaf", "Salt", "Pepper"], "instructions": ["Brown beef in batches", "Sauté onions", "Add paprika, cook 1 minute", "Add tomato paste", "Add broth, bay leaf, caraway", "Return beef", "Simmer 45 minutes", "Add vegetables", "Simmer 30 more minutes", "Season with salt and pepper"], "notes": "Low and slow cooking", "fun_fact": "Goulash is Czech national dish shared with Hungary", "alternatives": ["Pork instead of beef", "Add sour cream", "More paprika"]}
        ],
        "snacks": [
            {"id": "cze-snack-trdelnik", "name": "Trdelník (Sugar Bread)", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 30, "description": "Czech spiral pastry with sugar and cinnamon", "seasonings": ["cinnamon", "sugar"], "ingredients": ["Dough: 3 cups flour, 1 packet yeast, 3/4 cup milk, 1/4 cup sugar, 2 tbsp oil", "Filling: 1/2 cup sugar, 2 tbsp cinnamon", "Oil for frying or baking"], "instructions": ["Make yeast dough", "Let rise 1 hour", "Roll thin", "Brush with oil", "Sprinkle cinnamon sugar", "Roll tightly into spiral", "Wind around metal cone", "Bake at 375°F for 25-30 minutes rotating", "Slide off cone", "Serve warm"], "notes": "Traditional at Czech fairs", "fun_fact": "Trdelník is iconic Czech street food found at fairs and celebrations", "alternatives": ["Baked instead of fried", "Different toppings", "Without cone"]}
        ],
        "desserts": [
            {"id": "cze-dessert-medovina", "name": "Medovina (Honey Cake)", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 45, "description": "Czech layered honey cake", "seasonings": ["cinnamon", "cloves"], "ingredients": ["Cake: 1 cup honey, 1 cup sugar, 3 eggs, 3 cups flour, 1 tsp baking soda", "Filling: chocolate or plum jam", "Frosting: powdered sugar, egg white"], "instructions": ["Make honey cake batter", "Bake in thin layers", "Cool completely", "Assemble layers with filling", "Make frosting", "Cover cake with frosting", "Decorate with patterns", "Let dry before serving"], "notes": "Multiple layers", "fun_fact": "Medovina is traditional Czech festive cake", "alternatives": ["Different filling", "Simpler frosting", "One layer cake"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "cze-drink-juice", "name": "Czech Fruit Juice", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 0, "description": "Fresh Czech fruit juice", "seasonings": [], "ingredients": ["Fresh fruit", "Water", "Sugar", "Ice"], "instructions": ["Blend fresh fruit with water", "Strain if desired", "Add sugar to taste", "Chill", "Serve over ice"], "notes": "Seasonal fruit available", "fun_fact": "Fresh juice is popular in Czech Republic", "alternatives": ["Smoothie version", "Different fruits", "With sparkling water"]}
        ],
        "alcoholicDrinks": [
            {"id": "cze-drink-beer", "name": "Czech Beer", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Czech Pilsner or Lager", "seasonings": [], "ingredients": ["Czech beer"], "instructions": ["Serve ice-cold in proper glass", "Pour with head", "Enjoy the craftsmanship", "Pair with food"], "notes": "Czech beer is world-famous", "fun_fact": "Czech Republic produces world's best beers and has strong beer culture", "alternatives": ["Different beer styles", "Local breweries", "Traditional vs modern"]}
        ]
    }
}

def expand_phase_5_batch_2():
    os.makedirs('data/phase5-recipes', exist_ok=True)
    for country, data in PHASE_5_BATCH_2.items():
        filename = f"data/phase5-recipes/{country.lower()}-phase5-authentic.json"
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        recipes = sum(len(data.get(cat, []))
                     for cat in ['breakfast', 'lunch', 'dinner', 'snacks',
                                'desserts', 'nonAlcoholicDrinks', 'alcoholicDrinks'])
        print(f"✓ {country:<15} | {recipes} recipes")

if __name__ == "__main__":
    print("\n🌍 PHASE 5 BATCH 2: Nordic & Eastern Europe")
    print("="*80 + "\n")
    expand_phase_5_batch_2()
    print("\n✓ Batch 2 complete!")
