#!/usr/bin/env python3
"""
PHASE 6 BATCH 1: Nordic & Eastern Europe expansion
Iceland, Sweden, Poland (extended)
"""
import json, os

PHASE_6_BATCH_1 = {
    "Iceland": {
        "country": "Iceland",
        "region": "Europe",
        "breakfast": [
            {"id": "ice-break-laufabraud", "name": "Laufabraud (Leaf Bread)", "difficulty": "Medium", "servings": 12, "prepTime": 30, "cookTime": 30, "description": "Icelandic decorated rye bread with butter", "seasonings": ["salt"], "ingredients": ["2 cups rye flour", "1 cup wheat flour", "1 tsp salt", "1 cup warm water", "Butter for topping"], "instructions": ["Mix rye flour, wheat flour, salt", "Add water to form dough", "Knead until smooth", "Divide into 12 pieces", "Roll thin between parchment", "Cut decorative leaf patterns", "Place on baking sheet", "Bake at 400°F for 20-25 minutes", "Brush with butter while warm", "Serve fresh"], "notes": "Traditional Christmas bread", "fun_fact": "Laufabraud is Icelandic Christmas tradition and is decorated with intricate patterns", "alternatives": ["Different decorative patterns", "Without rye flour", "Store-bought dough"]}
        ],
        "lunch": [
            {"id": "ice-lunch-fish-stew", "name": "Icelandic Fish Stew", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 45, "description": "Hearty Icelandic fish soup with potatoes", "seasonings": ["bay leaf", "thyme"], "ingredients": ["2 lbs white fish", "6 potatoes, diced", "2 onions", "4 carrots", "6 cups fish broth", "1 cup cream", "Bay leaf", "Thyme", "Salt", "Pepper", "Butter"], "instructions": ["Melt butter, sauté onion", "Add carrots and potatoes", "Pour broth and add bay leaf", "Simmer 20 minutes", "Add fish pieces", "Simmer 15 minutes", "Add thyme and cream", "Season with salt and pepper", "Serve hot"], "notes": "Don't overcook fish", "fun_fact": "Fish stew is staple Icelandic comfort food", "alternatives": ["Different fish type", "Add mussels", "Less cream"]}
        ],
        "dinner": [
            {"id": "ice-dinner-lamb-stew", "name": "Icelandic Lamb Stew", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 90, "description": "Traditional Icelandic lamb and potato stew", "seasonings": ["thyme", "bay leaf"], "ingredients": ["2 lbs lamb, cubed", "6 potatoes, diced", "2 onions, diced", "4 cups broth", "2 bay leaves", "1 tsp thyme", "Salt", "Pepper", "Butter"], "instructions": ["Brown lamb in butter", "Add onion, cook 2 minutes", "Add potatoes and broth", "Add bay leaves and thyme", "Bring to boil", "Reduce heat, cover", "Simmer 60-75 minutes", "Lamb and potatoes should be tender", "Season with salt and pepper"], "notes": "Simple and hearty", "fun_fact": "Lamb stew is Icelandic national dish", "alternatives": ["Beef instead of lamb", "Add carrots", "Different herbs"]}
        ],
        "snacks": [
            {"id": "ice-snack-kleina", "name": "Kleina (Fried Pastry)", "difficulty": "Hard", "servings": 24, "prepTime": 30, "cookTime": 30, "description": "Icelandic twisted fried pastry", "seasonings": ["cardamom"], "ingredients": ["3 cups flour", "1/2 cup butter", "1/4 cup sugar", "2 eggs", "1/2 cup cream", "1 tsp cardamom", "Oil for frying"], "instructions": ["Mix flour, sugar, cardamom", "Rub in cold butter", "Add eggs and cream", "Knead until smooth", "Roll thin", "Cut into strips", "Twist each strip", "Deep fry at 350°F until golden", "Drain on paper towels"], "notes": "Requires twisting skill", "fun_fact": "Kleina is traditional Icelandic fried pastry", "alternatives": ["Different shape", "Without cardamom", "Baked version"]}
        ],
        "desserts": [
            {"id": "ice-dessert-skyr", "name": "Skyr with Berries", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 0, "description": "Icelandic yogurt-like dessert with fresh berries", "seasonings": [], "ingredients": ["2 cups skyr (Icelandic yogurt)", "1 cup fresh berries", "2 tbsp honey", "1/4 cup granola"], "instructions": ["Place skyr in bowl", "Top with fresh berries", "Drizzle with honey", "Sprinkle with granola", "Serve immediately", "Can chill beforehand"], "notes": "Skyr is creamy and thick", "fun_fact": "Skyr is ancient Icelandic dairy product and is now popular worldwide", "alternatives": ["Different berries", "Different toppings", "Plain skyr"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "ice-drink-hot-spring", "name": "Geothermal Hot Spring Water", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Iceland's naturally heated spring water", "seasonings": [], "ingredients": ["Natural hot spring water"], "instructions": ["Fill cup with naturally heated spring water", "Drink straight from source or cooled", "Enjoy the natural warmth", "Rich in minerals"], "notes": "Naturally hot from geothermal", "fun_fact": "Iceland has abundant natural hot spring water", "alternatives": ["Cooled version", "Different spring", "Add lemon"]}
        ],
        "alcoholicDrinks": [
            {"id": "ice-drink-brennivín", "name": "Brennivín (Caraway Spirit)", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Icelandic caraway spirit", "seasonings": [], "ingredients": ["Brennivín"], "instructions": ["Serve ice-cold", "Drink as shot", "Often followed by dried fish", "Traditional celebration drink"], "notes": "Very strong spirit", "fun_fact": "Brennivín is Icelandic national spirit", "alternatives": ["Room temperature", "Mixed drinks"]}
        ]
    },
    "Sweden": {
        "country": "Sweden",
        "region": "Europe",
        "breakfast": [
            {"id": "swe-break-smorgastarta", "name": "Swedish Breakfast Smörgåsbord", "difficulty": "Medium", "servings": 6, "prepTime": 20, "cookTime": 0, "description": "Swedish breakfast spread with breads and toppings", "seasonings": ["salt"], "ingredients": ["Various breads", "Cheeses", "Cured meats", "Fish (herring, salmon)", "Eggs", "Cucumber", "Tomato", "Butter", "Jam", "Honey"], "instructions": ["Arrange various breads on board", "Add cheeses and cured meats", "Add smoked fish", "Prepare hard-boiled eggs", "Add fresh vegetables", "Set out butter, jam, honey", "Let guests assemble own breakfast", "Serve with coffee or tea"], "notes": "Self-serve traditional style", "fun_fact": "Swedish breakfast smörgåsbord reflects abundance and variety", "alternatives": ["Fewer items", "Different cheeses", "Vegetarian"]}
        ],
        "lunch": [
            {"id": "swe-lunch-meatballs", "name": "Swedish Meatballs with Lingonberry", "difficulty": "Medium", "servings": 4, "prepTime": 20, "cookTime": 30, "description": "Tender Swedish meatballs in sauce with lingonberry jam", "seasonings": ["nutmeg"], "ingredients": ["1.5 lbs ground beef", "1/2 cup breadcrumbs", "1/4 cup milk", "1 egg", "1 onion, minced", "1/4 tsp nutmeg", "2 tbsp butter", "1 cup broth", "1/2 cup cream", "2 tbsp lingonberry jam", "Salt", "Pepper"], "instructions": ["Soak breadcrumbs in milk", "Mix with beef, egg, onion, nutmeg, salt, pepper", "Form into 1-inch balls", "Brown in butter in batches", "Make gravy: whisk flour into drippings", "Add broth, simmer 5 minutes", "Add cream and lingonberry jam", "Return meatballs to gravy", "Simmer 10 minutes"], "notes": "Must be tender", "fun_fact": "Swedish Meatballs are famous worldwide", "alternatives": ["Beef and pork mix", "Without jam", "Mushroom sauce"]}
        ],
        "dinner": [
            {"id": "swe-dinner-gravlax", "name": "Gravlax with Mustard Sauce", "difficulty": "Hard", "servings": 8, "prepTime": 20, "cookTime": 0, "description": "Nordic cured salmon with Swedish mustard", "seasonings": ["dill"], "ingredients": ["2 lbs salmon", "3 tbsp salt", "2 tbsp sugar", "1 tbsp pepper", "1 tbsp coriander", "Large bunch dill", "For sauce: Dijon mustard, honey, oil, dill"], "instructions": ["Mix salt, sugar, pepper, coriander", "Place dill in dish", "Rub salmon with mixture", "Layer more dill", "Cover and refrigerate 5-7 days", "Slice thin", "Make sauce: mix mustard, honey, oil, dill", "Serve with toast and sauce"], "notes": "Requires curing time", "fun_fact": "Gravlax is Swedish cured salmon tradition", "alternatives": ["Different fish", "Faster cure", "Different sauce"]}
        ],
        "snacks": [
            {"id": "swe-snack-kanelbullar", "name": "Kanelbullar (Cinnamon Bun)", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 25, "description": "Swedish sweet cinnamon and cardamom bun", "seasonings": ["cinnamon", "cardamom"], "ingredients": ["Dough: 3 cups flour, yeast, milk, butter, sugar, egg, salt", "Filling: butter, sugar, cinnamon, cardamom", "Pearl sugar topping"], "instructions": ["Make yeast dough", "Let rise 1 hour", "Roll thin", "Spread with butter, sugar, spices", "Roll tightly", "Cut into spirals", "Let proof 30 minutes", "Brush with egg", "Sprinkle pearl sugar", "Bake at 400°F for 20-25 minutes"], "notes": "Cardamom is key", "fun_fact": "Kanelbullar is Swedish beloved pastry", "alternatives": ["Without cardamom", "Different shape", "Plain sugar"]}
        ],
        "desserts": [
            {"id": "swe-dessert-kladdkaka", "name": "Kladdkaka (Sticky Chocolate Cake)", "difficulty": "Medium", "servings": 8, "prepTime": 15, "cookTime": 25, "description": "Swedish warm chocolate cake with gooey center", "seasonings": ["vanilla"], "ingredients": ["1 cup butter", "1 cup sugar", "2 eggs", "1 cup flour", "1/2 cup cocoa", "1 tsp vanilla", "Pinch salt", "Whipped cream"], "instructions": ["Melt butter and sugar", "Add eggs one at a time", "Mix flour, cocoa, salt", "Combine wet and dry", "Add vanilla", "Pour into greased pan", "Bake at 350°F for 20-25 minutes", "Center should be slightly underdone", "Serve warm with whipped cream"], "notes": "Sticky inside is correct", "fun_fact": "Kladdkaka is favorite Swedish chocolate cake", "alternatives": ["Add coffee", "Serve with ice cream", "Baked longer"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "swe-drink-fika-coffee", "name": "Fika Coffee Break", "difficulty": "Easy", "servings": 1, "prepTime": 5, "cookTime": 5, "description": "Swedish strong coffee with pastry", "seasonings": [], "ingredients": ["Strong coffee", "Pastry"], "instructions": ["Brew strong Swedish coffee", "Serve hot", "Enjoy with sweet pastry", "Fika is social coffee break tradition"], "notes": "Social tradition", "fun_fact": "Fika is Swedish coffee break culture and is important social ritual", "alternatives": ["Different pastry", "Tea instead", "Black coffee"]}
        ],
        "alcoholicDrinks": [
            {"id": "swe-drink-aquavit-extended", "name": "Swedish Aquavit", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Swedish caraway spirit chilled ice-cold", "seasonings": [], "ingredients": ["Swedish aquavit"], "instructions": ["Freeze aquavit in freezer", "Serve as shot", "Drink quickly", "Often followed by beer"], "notes": "Must be ice-cold", "fun_fact": "Swedish Aquavit is traditional spirit", "alternatives": ["Different temperature", "Mixed drinks", "Different brand"]}
        ]
    },
    "Poland": {
        "country": "Poland",
        "region": "Europe",
        "breakfast": [
            {"id": "pol-break-jajecznica", "name": "Jajecznica (Scrambled Eggs)", "difficulty": "Easy", "servings": 2, "prepTime": 5, "cookTime": 10, "description": "Polish scrambled eggs with additions", "seasonings": ["salt", "pepper"], "ingredients": ["4 eggs", "2 tbsp butter", "1/2 cup mushrooms, sliced", "1/4 cup ham, diced", "1/4 onion, diced", "Salt", "Pepper", "Fresh dill"], "instructions": ["Heat butter in pan", "Sauté mushrooms, ham, onion", "Pour beaten eggs over", "Scramble until cooked", "Season with salt and pepper", "Garnish with dill", "Serve hot with bread"], "notes": "Variations common", "fun_fact": "Jajecznica is Polish breakfast staple", "alternatives": ["Different additions", "Plain version", "With cheese"]}
        ],
        "lunch": [
            {"id": "pol-lunch-zurek", "name": "Żurek (Sour Rye Soup)", "difficulty": "Medium", "servings": 4, "prepTime": 20, "cookTime": 60, "description": "Polish traditional sour soup with rye", "seasonings": ["caraway"], "ingredients": ["1 cup rye starter (or sour rye liquid)", "4 cups broth", "1/2 lb ham", "3 potatoes, diced", "1 onion", "2 bay leaves", "1 tsp caraway", "Salt", "Pepper", "Sour cream"], "instructions": ["Strain rye liquid", "Heat broth with bay leaves", "Add potatoes and onion", "Simmer 15 minutes", "Add ham pieces", "Add rye liquid", "Add caraway", "Simmer 30 minutes", "Potatoes should be tender", "Serve with dollop of sour cream"], "notes": "Rye fermentation is key", "fun_fact": "Żurek is traditional Polish Easter soup", "alternatives": ["Without fermentation", "Different meat", "Add mushrooms"]}
        ],
        "dinner": [
            {"id": "pol-dinner-placki-ziemniaczane", "name": "Placki Ziemniaczane (Potato Pancakes)", "difficulty": "Medium", "servings": 4, "prepTime": 20, "cookTime": 20, "description": "Polish shredded potato pancakes with sour cream", "seasonings": ["salt", "pepper"], "ingredients": ["2 lbs potatoes", "1 onion", "2 eggs", "1/2 cup flour", "Oil for frying", "Salt", "Pepper", "Sour cream", "Apple sauce"], "instructions": ["Grate potatoes and onion", "Press out liquid", "Mix with eggs and flour", "Season with salt and pepper", "Heat oil in skillet", "Drop spoonfuls and flatten", "Fry until golden and crispy on both sides", "Drain on paper towels", "Serve with sour cream and apple sauce"], "notes": "Must press out liquid", "fun_fact": "Placki are Polish comfort food", "alternatives": ["Without onion", "Served plain", "Different toppings"]}
        ],
        "snacks": [
            {"id": "pol-snack-obwarzanek", "name": "Obwarzanek (Bread Ring)", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 30, "description": "Polish bagel-like bread ring with seeds", "seasonings": ["salt"], "ingredients": ["3 cups flour", "1 packet yeast", "3/4 cup warm water", "1 tbsp sugar", "1 tsp salt", "2 tbsp oil", "Sesame seeds", "Poppy seeds"], "instructions": ["Make yeast dough", "Let rise 1 hour", "Shape into rings", "Let proof 20 minutes", "Boil rings briefly", "Place on baking sheet", "Sprinkle with seeds", "Bake at 400°F for 25-30 minutes", "Should be golden"], "notes": "Boiling before baking", "fun_fact": "Obwarzanek is traditional Polish bread ring from Kraków", "alternatives": ["Different seeds", "Skip boiling step", "Different shape"]}
        ],
        "desserts": [
            {"id": "pol-dessert-paczki", "name": "Paczki (Fried Donut)", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 30, "description": "Polish fried pastry filled with jam", "seasonings": ["vanilla"], "ingredients": ["Dough: 3 cups flour, yeast, milk, butter, eggs, sugar, salt", "Filling: jam or prune", "Oil for frying", "Powdered sugar"], "instructions": ["Make rich yeast dough", "Let rise 1 hour", "Roll thin", "Cut circles", "Fill with jam", "Seal edges", "Let proof 20 minutes", "Deep fry at 350°F until golden", "Drain on paper towels", "Dust with powdered sugar"], "notes": "Rich and indulgent", "fun_fact": "Paczki is traditional Polish donut especially at celebrations", "alternatives": ["Different filling", "Smaller size", "Less sugar"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "pol-drink-mors", "name": "Mors (Berry Juice)", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 15, "description": "Polish berry compote drink", "seasonings": ["sugar"], "ingredients": ["2 cups berries (fresh or frozen)", "4 cups water", "1/4 cup sugar", "Cinnamon stick"], "instructions": ["Combine berries and water", "Heat to simmer", "Add sugar and cinnamon", "Simmer 10 minutes", "Strain if desired", "Chill thoroughly", "Serve over ice"], "notes": "Can use any berries", "fun_fact": "Mors is traditional Polish summer drink", "alternatives": ["One berry type", "Without cinnamon", "Hot version"]}
        ],
        "alcoholicDrinks": [
            {"id": "pol-drink-zubrowka", "name": "Żubrówka (Bison Grass Vodka)", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Polish vodka with bison grass infusion", "seasonings": [], "ingredients": ["Żubrówka vodka"], "instructions": ["Chill in freezer", "Serve as shot", "Often with apple juice", "Drink quickly"], "notes": "Distinctive grass flavor", "fun_fact": "Żubrówka is iconic Polish vodka with bison grass", "alternatives": ["With apple juice", "Room temperature", "Different brand"]}
        ]
    }
}

def expand_phase_6_batch_1():
    os.makedirs('data/phase6-recipes', exist_ok=True)
    for country, data in PHASE_6_BATCH_1.items():
        filename = f"data/phase6-recipes/{country.lower()}-phase6-authentic.json"
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        recipes = sum(len(data.get(cat, []))
                     for cat in ['breakfast', 'lunch', 'dinner', 'snacks',
                                'desserts', 'nonAlcoholicDrinks', 'alcoholicDrinks'])
        print(f"✓ {country:<15} | {recipes} recipes")

if __name__ == "__main__":
    print("\n🌍 PHASE 6 BATCH 1: Nordic & Eastern Europe Extended")
    print("="*80 + "\n")
    expand_phase_6_batch_1()
    print("\n✓ Batch 1 complete!")
