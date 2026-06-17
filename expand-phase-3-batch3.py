#!/usr/bin/env python3
"""
PHASE 3 BATCH 3: Sweden, Ireland, Russia, Australia
Northern Europe, British Isles, and Oceania
"""
import json, os

PHASE_3_BATCH_3 = {
    "Sweden": {
        "country": "Sweden",
        "region": "Europe",
        "breakfast": [
            {"id": "swe-break-smorgastarta", "name": "Swedish Sandwich Cake", "difficulty": "Hard", "servings": 12, "prepTime": 45, "cookTime": 30, "description": "Layered Swedish sandwich cake with bread, ham, cheese, and aspic", "seasonings": ["salt", "pepper"], "ingredients": ["1 loaf white bread", "1/2 lb ham", "1/2 lb roast beef", "1/2 lb shrimp", "1 cup cheese", "2 hard-boiled eggs", "1 cup mayonnaise", "2 tbsp gelatin", "2 cups broth", "Cucumber", "Tomato"], "instructions": ["Slice bread horizontally to make 4-5 layers", "Spread mayonnaise on each layer", "Layer ham on first", "Layer roast beef on second", "Layer cheese on third", "Layer shrimp on fourth", "Cut into rectangular block", "Make aspic: dissolve gelatin in warm broth", "Cool until syrupy", "Frost cake with aspic", "Decorate with sliced eggs, cucumber, tomato", "Refrigerate until set"], "notes": "Must be chilled and set before serving", "fun_fact": "Smörgåstårta is a Swedish party centerpiece and special occasion dish", "alternatives": ["All vegetarian version", "Different meats", "Different seafood"]}
        ],
        "lunch": [
            {"id": "swe-lunch-meatballs", "name": "Swedish Meatballs", "difficulty": "Medium", "servings": 4, "prepTime": 20, "cookTime": 30, "description": "Small tender meatballs in creamy gravy with lingonberry sauce", "seasonings": ["nutmeg", "black pepper"], "ingredients": ["1.5 lbs ground beef", "1/2 cup breadcrumbs", "1/4 cup milk", "1 egg", "1 onion, minced", "1/4 tsp nutmeg", "Black pepper", "2 tbsp butter", "1 cup broth", "1/2 cup cream", "2 tbsp lingonberry jam"], "instructions": ["Soak breadcrumbs in milk", "Mix with ground beef, egg, onion, nutmeg, pepper", "Form into 1-inch balls", "Brown in butter in batches", "Set aside", "Make gravy: whisk flour into butter drippings", "Add broth slowly", "Simmer 5 minutes", "Add cream and lingonberry jam", "Return meatballs to gravy", "Simmer 10 minutes", "Serve with lingonberry sauce"], "notes": "Must be tender, don't overwork meat", "fun_fact": "Swedish Meatballs are served at Christmas and are known worldwide from IKEA", "alternatives": ["Beef and pork mix", "Mushroom gravy", "Served with pasta"]}
        ],
        "dinner": [
            {"id": "swe-dinner-gravlax", "name": "Gravlax (Cured Salmon)", "difficulty": "Hard", "servings": 8, "prepTime": 20, "cookTime": 0, "description": "Nordic salt-cured salmon with dill and mustard sauce", "seasonings": ["dill", "salt", "pepper"], "ingredients": ["2 lbs salmon fillet", "3 tbsp salt", "2 tbsp sugar", "1 tbsp black pepper", "1 tbsp coriander seeds", "1 bunch fresh dill", "For sauce: 1/4 cup Dijon mustard", "1 tbsp honey", "2 tbsp olive oil", "1 tbsp dill"], "instructions": ["Mix salt, sugar, pepper, coriander", "Place dill in bottom of dish", "Rub salt mixture on salmon", "Layer more dill over salmon", "Cover with plastic wrap", "Place weight on top", "Cure in refrigerator 3-7 days", "Slice thin at angle to the skin", "Make sauce: mix mustard, honey, oil, dill", "Serve with toast and sauce"], "notes": "Patience is essential - curing takes days", "fun_fact": "Gravlax dates back to medieval Swedish fishing traditions", "alternatives": ["Different fish", "Skip coriander", "Serve with crème fraîche"]}
        ],
        "snacks": [
            {"id": "swe-snack-open-sandwiches", "name": "Swedish Open Sandwiches", "difficulty": "Easy", "servings": 4, "prepTime": 10, "cookTime": 0, "description": "Rye bread topped with butter, cheese, and various toppings", "seasonings": ["salt", "pepper"], "ingredients": ["Dark rye bread", "Butter", "Various cheeses", "Ham", "Salami", "Pickled herring", "Cucumber", "Tomato", "Lettuce"], "instructions": ["Slice dark rye bread", "Spread generously with butter", "Top with cheese", "Add your choice of: ham, salami, or herring", "Garnish with cucumber, tomato, lettuce", "Arrange artfully on platter", "Serve immediately"], "notes": "Assembly is the key", "fun_fact": "Open sandwiches are a Swedish tradition dating back centuries", "alternatives": ["Different cheeses", "Different meats", "Vegetarian versions"]}
        ],
        "desserts": [
            {"id": "swe-dessert-princess-cake", "name": "Princess Cake", "difficulty": "Hard", "servings": 12, "prepTime": 45, "cookTime": 60, "description": "Swedish layer cake with jam, pastry cream, and green marzipan dome", "seasonings": ["vanilla"], "ingredients": ["Sponge cake layers", "Pastry cream (vanilla)", "Jam", "Whipped cream", "Green marzipan", "Powdered sugar"], "instructions": ["Bake sponge cake layers", "Let cool completely", "Make pastry cream with vanilla", "Layer cake with jam and pastry cream", "Top with whipped cream", "Roll green marzipan into ball", "Cover cake completely with dome of marzipan", "Dust with powdered sugar", "Refrigerate until serving", "Slice with hot knife for clean cuts"], "notes": "Requires multiple steps and patience", "fun_fact": "Princess Cake is Sweden's most iconic cake and has been made since 1918", "alternatives": ["Different colored marzipan", "Different jam", "Strawberry on top"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "swe-drink-lingonberry", "name": "Lingonberry Juice", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 0, "description": "Sweet-tart Swedish berry juice", "seasonings": ["sugar"], "ingredients": ["Lingonberry concentrate", "Water", "Sugar"], "instructions": ["Mix concentrate with water per package", "Sweeten to taste", "Serve cold", "Can be served with soda water"], "notes": "Often served with meatballs", "fun_fact": "Lingonberry is the national berry of Sweden", "alternatives": ["With sparkling water", "Hot as winter drink"]}
        ],
        "alcoholicDrinks": [
            {"id": "swe-drink-aquavit", "name": "Aquavit (Caraway Spirit)", "difficulty": "Easy", "servings": 4, "prepTime": 0, "cookTime": 0, "description": "Nordic spirit flavored with caraway and other spices", "seasonings": [], "ingredients": ["Aquavit"], "instructions": ["Chill aquavit in freezer", "Pour into shot glass", "Serve ice-cold", "Often followed by beer chaser"], "notes": "Typically served as shot", "fun_fact": "Aquavit is the national spirit of Sweden and Scandinavia", "alternatives": ["Room temperature", "Different brands", "Mixed with beer"]}
        ]
    },
    "Ireland": {
        "country": "Ireland",
        "region": "Europe",
        "breakfast": [
            {"id": "ire-break-full-breakfast", "name": "Irish Full Breakfast", "difficulty": "Medium", "servings": 2, "prepTime": 15, "cookTime": 30, "description": "Traditional Irish breakfast with bacon, sausages, eggs, beans, and toast", "seasonings": ["salt", "pepper"], "ingredients": ["4 slices Irish bacon", "2 pork sausages", "2 eggs", "1/2 can baked beans", "2 slices bread", "Tomato", "Mushrooms", "Butter", "Oil"], "instructions": ["Heat oil in skillet", "Fry bacon until crispy", "Fry sausages until golden", "Push to side, fry eggs", "Heat baked beans in small pan", "Toast bread and butter", "Grill tomato and mushrooms", "Arrange all on plate", "Serve immediately with tea"], "notes": "Timing is crucial to serve hot", "fun_fact": "The Irish Full Breakfast (or 'fry') is a national institution and beloved Sunday breakfast", "alternatives": ["Vegetarian version", "Different sausage type", "Hash browns instead of mushrooms"]}
        ],
        "lunch": [
            {"id": "ire-lunch-colcannon", "name": "Colcannon (Potato and Cabbage)", "difficulty": "Easy", "servings": 4, "prepTime": 10, "cookTime": 25, "description": "Creamy mashed potatoes with cabbage and scallions", "seasonings": ["salt", "pepper"], "ingredients": ["2 lbs potatoes", "1/2 head cabbage", "4 scallions", "1 cup milk", "4 tbsp butter", "Salt", "Pepper"], "instructions": ["Boil potatoes until tender", "Chop cabbage, boil until tender", "Drain both", "Heat milk with butter", "Mash potatoes", "Mix in cabbage, scallions, milk mixture", "Season with salt and pepper", "Serve in mound with butter melting in center"], "notes": "Must have lump in center of butter", "fun_fact": "Colcannon is a traditional Irish dish served especially around Halloween", "alternatives": ["With cheese", "Add ham", "Different greens"]}
        ],
        "dinner": [
            {"id": "ire-dinner-irish-stew", "name": "Irish Stew", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 120, "description": "Hearty lamb stew with potatoes, onions, and carrots", "seasonings": ["bay leaf", "thyme", "salt", "pepper"], "ingredients": ["2 lbs lamb stew meat", "4 potatoes", "3 carrots", "3 onions", "6 cups water or broth", "Bay leaf", "Thyme", "Salt", "Pepper"], "instructions": ["Layer potatoes, carrots, onions in pot", "Layer lamb on vegetables", "Add bay leaf and thyme", "Pour water to cover", "Bring to boil", "Reduce heat, cover", "Simmer 1.5-2 hours", "Lamb and vegetables should be tender", "Season with salt and pepper", "Serve in bowls with broth"], "notes": "Low and slow cooking is key", "fun_fact": "Irish Stew is the national dish of Ireland with a history going back centuries", "alternatives": ["Beef instead of lamb", "Add parsnips", "Thickened with flour"]}
        ],
        "snacks": [
            {"id": "ire-snack-coddle", "name": "Dublin Coddle", "difficulty": "Easy", "servings": 4, "prepTime": 10, "cookTime": 45, "description": "Layered Dublin stew of sausages, bacon, potatoes, and onions", "seasonings": ["salt", "pepper"], "ingredients": ["4 Irish sausages", "4 slices Irish bacon", "4 potatoes", "3 onions", "3 cups broth", "Bay leaf", "Salt", "Pepper"], "instructions": ["Layer onions in pot", "Layer potatoes", "Layer sausages and bacon", "Add bay leaf", "Pour broth to almost cover", "Season with salt and pepper", "Bring to boil", "Cover, simmer 40 minutes", "Potatoes and onions should be tender"], "notes": "Simple but comforting", "fun_fact": "Coddle is Dublin's iconic dish, traditionally eaten late at night after pub hopping", "alternatives": ["Add carrots", "More potatoes", "Use different sausages"]}
        ],
        "desserts": [
            {"id": "ire-dessert-guinness-cake", "name": "Guinness Cake", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 50, "description": "Dark Irish stout cake with cream cheese frosting", "seasonings": ["cocoa", "vanilla"], "ingredients": ["1.5 cups Guinness", "2 cups flour", "2 cups sugar", "1/2 cup cocoa powder", "1.5 tsp baking soda", "2 eggs", "1/2 cup oil", "1/2 cup sour cream", "Cream cheese frosting"], "instructions": ["Reduce Guinness by half in saucepan", "Cool completely", "Mix flour, sugar, cocoa, baking soda", "Whisk eggs, oil, sour cream, reduced Guinness", "Combine wet and dry", "Pour into greased pan", "Bake at 350°F for 45-50 minutes", "Cool completely", "Frost with cream cheese frosting"], "notes": "Guinness gives deep chocolate flavor", "fun_fact": "Guinness Cake is a modern Irish dessert celebrating the iconic stout", "alternatives": ["Without Guinness", "Chocolate ganache instead of cream cheese", "Different frosting"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "ire-drink-irish-tea", "name": "Irish Tea", "difficulty": "Easy", "servings": 1, "prepTime": 5, "cookTime": 5, "description": "Strong tea with milk and sugar", "seasonings": [], "ingredients": ["Irish tea (e.g., Barry's)", "Hot water", "Milk", "Sugar"], "instructions": ["Fill kettle with fresh water", "Heat water to boil", "Warm teapot", "Add tea bag", "Pour boiling water", "Steep 3-5 minutes", "Pour into cup", "Add milk and sugar to taste"], "notes": "Irish tea is strong and always served with milk", "fun_fact": "Tea is central to Irish culture and is consumed throughout the day", "alternatives": ["Different brands", "More or less milk", "Different sweetener"]}
        ],
        "alcoholicDrinks": [
            {"id": "ire-drink-guinness", "name": "Guinness", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Irish dry stout with creamy head", "seasonings": [], "ingredients": ["Guinness"], "instructions": ["Pour into pint glass at 45-degree angle", "Let settle halfway", "Complete the pour", "Wait for settle and cascade to finish", "Enjoy immediately"], "notes": "Pour is ritualistic", "fun_fact": "Guinness is the world's best-selling stout and is central to Irish culture", "alternatives": ["Different Irish beers", "Guinness cocktails", "Room temperature"]}
        ]
    },
    "Russia": {
        "country": "Russia",
        "region": "Europe/Asia",
        "breakfast": [
            {"id": "rus-break-blini", "name": "Blini (Russian Pancakes)", "difficulty": "Medium", "servings": 4, "prepTime": 20, "cookTime": 20, "description": "Thin Russian pancakes served with sour cream and caviar", "seasonings": [], "ingredients": ["1 cup flour", "2 eggs", "1 cup milk", "1/4 tsp salt", "2 tbsp melted butter", "Oil for cooking", "Sour cream", "Caviar or smoked salmon"], "instructions": ["Mix flour and salt", "Whisk eggs with milk", "Combine wet and dry", "Add melted butter", "Heat crepe pan or skillet", "Lightly oil", "Pour thin batter", "Cook 1 minute per side until light brown", "Stack on plate", "Serve warm with sour cream and caviar"], "notes": "Batter should be thin for proper texture", "fun_fact": "Blini are a traditional Russian dish with roots in pre-Christian celebrations of spring", "alternatives": ["Jam instead of caviar", "Mushrooms and onions", "Savory with cheese"]}
        ],
        "lunch": [
            {"id": "rus-lunch-borscht", "name": "Borscht (Beet Soup)", "difficulty": "Medium", "servings": 6, "prepTime": 20, "cookTime": 50, "description": "Deep red beet soup with beef and vegetables", "seasonings": ["caraway", "bay leaf"], "ingredients": ["2 large beets", "1.5 lbs beef", "3 carrots", "2 potatoes", "1/2 head cabbage", "1 onion", "6 cloves garlic", "6 cups broth", "3 tbsp tomato paste", "2 tbsp vinegar", "Bay leaf", "Caraway seeds", "Salt", "Pepper"], "instructions": ["Brown beef in pot", "Add broth and bay leaf", "Simmer 20 minutes", "Add diced vegetables except beets", "Simmer 20 minutes", "Add grated beets and tomato paste", "Add vinegar and caraway", "Simmer 10 minutes", "Season with salt and pepper", "Serve hot with sour cream dollop"], "notes": "Vinegar brightens the flavors", "fun_fact": "Borscht is the most iconic Russian soup and is served throughout Eastern Europe", "alternatives": ["Vegetarian version", "With beans", "Add potatoes earlier for softer texture"]}
        ],
        "dinner": [
            {"id": "rus-dinner-beef-stroganoff", "name": "Beef Stroganoff", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 40, "description": "Tender beef in creamy mushroom sauce", "seasonings": ["paprika", "mustard"], "ingredients": ["1.5 lbs beef sirloin", "1 lb mushrooms", "2 onions", "3 cloves garlic", "3 tbsp butter", "2 tbsp flour", "1 cup broth", "1 cup sour cream", "2 tbsp paprika", "1 tbsp Dijon mustard", "Salt", "Pepper"], "instructions": ["Cut beef into strips", "Brown in batches in butter, set aside", "Sauté onions and garlic", "Add sliced mushrooms, cook 5 minutes", "Dust with flour, cook 1 minute", "Add broth and paprika", "Return beef to pan", "Simmer 20 minutes", "Remove from heat", "Stir in sour cream and mustard", "Season with salt and pepper", "Serve over egg noodles or rice"], "notes": "Don't boil sour cream", "fun_fact": "Beef Stroganoff was created in Russia and named after a noble family", "alternatives": ["Chicken instead of beef", "More mushrooms", "Served over pasta"]}
        ],
        "snacks": [
            {"id": "rus-snack-piroshki", "name": "Piroshki (Filled Pastry)", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 30, "description": "Russian fried pastries filled with meat or potato", "seasonings": ["salt", "pepper"], "ingredients": ["Dough: 3 cups flour, 1 tsp salt, 1 egg, 1 cup sour cream", "Filling: 1 lb ground meat, 1 onion, salt, pepper", "Oil for frying"], "instructions": ["Make dough: mix flour, salt, egg, sour cream", "Knead until smooth", "Rest 30 minutes", "Brown meat with onion, season", "Cool filling", "Roll dough thin", "Cut circles", "Fill each with meat", "Fold and seal edges", "Heat oil to 350°F", "Fry until golden on both sides", "Drain on paper towels"], "notes": "Filling must be cool before sealing", "fun_fact": "Piroshki are Russian street food and are served at celebrations", "alternatives": ["Potato and cheese filling", "Cabbage filling", "Baked instead of fried"]}
        ],
        "desserts": [
            {"id": "rus-dessert-medovik", "name": "Medovik (Honey Cake)", "difficulty": "Hard", "servings": 12, "prepTime": 45, "cookTime": 60, "description": "Russian layered honey cake with sour cream frosting", "seasonings": ["cinnamon"], "ingredients": ["Layers: 1 cup honey, 1/2 cup butter, 2 eggs, 2 cups flour, 1 tsp baking soda", "Filling: 2 cups sour cream, 1 cup sugar, 1 tbsp gelatin", "Cinnamon"], "instructions": ["Make dough: heat honey and butter, cool", "Mix with eggs, flour, baking soda", "Form into dough, chill", "Roll between parchment, cut circles", "Bake at 350°F for 8-10 minutes each", "Cool layers", "Make filling: dissolve gelatin, fold into sour cream and sugar", "Layer cakes with filling", "Frost entire cake with remaining filling", "Dust with cinnamon", "Refrigerate overnight"], "notes": "Requires multiple baking stages", "fun_fact": "Medovik is a beloved Russian dessert often made for celebrations", "alternatives": ["Condensed milk filling", "Different spices", "Chocolate coating"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "rus-drink-kvass", "name": "Kvass (Fermented Rye Drink)", "difficulty": "Hard", "servings": 4, "prepTime": 15, "cookTime": 10, "description": "Traditional Russian fermented drink made from rye bread", "seasonings": [], "ingredients": ["1 lb dark rye bread", "3 tbsp sugar", "1/2 tsp dry yeast", "Water", "Raisins", "Mint"], "instructions": ["Cube rye bread", "Toast in oven at 350°F until crisp", "Boil water, pour over bread", "Let cool to room temperature", "Add sugar and yeast", "Cover loosely", "Ferment 1-3 days until sour", "Strain", "Add raisins and mint", "Chill before serving"], "notes": "Fermentation time varies by temperature", "fun_fact": "Kvass is a staple Russian drink with roots dating back over 1000 years", "alternatives": ["Store-bought kvass", "Add honey", "Different herbs"]}
        ],
        "alcoholicDrinks": [
            {"id": "rus-drink-vodka", "name": "Russian Vodka", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Pure vodka served ice-cold", "seasonings": [], "ingredients": ["Vodka"], "instructions": ["Chill vodka in freezer until -20°C", "Serve in small shot glass", "Drink quickly", "Followed by pickle juice chaser"], "notes": "Temperature is essential", "fun_fact": "Vodka is central to Russian culture and history", "alternatives": ["Flavored vodka", "Room temperature", "Mixed drinks"]}
        ]
    }
}

def expand_phase_3_batch_3():
    os.makedirs('data/phase3-recipes', exist_ok=True)
    for country, data in PHASE_3_BATCH_3.items():
        filename = f"data/phase3-recipes/{country.lower()}-phase3-authentic.json"
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        recipes = sum(len(data.get(cat, []))
                     for cat in ['breakfast', 'lunch', 'dinner', 'snacks',
                                'desserts', 'nonAlcoholicDrinks', 'alcoholicDrinks'])
        print(f"✓ {country:<15} | {recipes} recipes")

if __name__ == "__main__":
    print("\n🌍 PHASE 3 BATCH 3: Sweden, Ireland, Russia")
    print("="*80 + "\n")
    expand_phase_3_batch_3()
    print("\n✓ Batch 3 complete!")
