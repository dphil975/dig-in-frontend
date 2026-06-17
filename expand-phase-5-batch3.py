#!/usr/bin/env python3
"""
PHASE 5 BATCH 3: Africa & Americas expansion
Kenya, Ethiopia, Ghana, Colombia
"""
import json, os

PHASE_5_BATCH_3 = {
    "Kenya": {
        "country": "Kenya",
        "region": "Africa",
        "breakfast": [
            {"id": "ken-break-ugali", "name": "Ugali (Corn Porridge)", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 20, "description": "Kenyan staple corn meal porridge", "seasonings": ["salt"], "ingredients": ["2 cups water or broth", "1 cup cornmeal", "Salt to taste", "Butter", "Vegetables or meat on side"], "instructions": ["Bring water or broth to boil", "Add salt", "Slowly add cornmeal, stirring constantly", "Keep stirring to avoid lumps", "Cook 15 minutes until thick", "Stir in butter", "Serve as side with vegetables or meat"], "notes": "Must stir constantly", "fun_fact": "Ugali is Kenya's national staple and is eaten daily throughout the country", "alternatives": ["Add cheese", "Thinner consistency", "Savory or sweet"]}
        ],
        "lunch": [
            {"id": "ken-lunch-nyama-choma", "name": "Nyama Choma (Grilled Meat)", "difficulty": "Easy", "servings": 4, "prepTime": 10, "cookTime": 20, "description": "Kenyan grilled meat with lime and chili", "seasonings": ["lime", "chili", "salt"], "ingredients": ["2 lbs meat (beef or goat)", "Lime juice", "Fresh chili peppers", "Salt", "Pepper", "Oil", "Onions"], "instructions": ["Cube meat into chunks", "Marinate with lime, chili, salt, pepper, oil", "Heat grill or charcoal", "Grill meat pieces until charred outside", "Inside should be juicy", "Serve hot with grilled onions", "Squeeze fresh lime over meat"], "notes": "Should be charred and juicy inside", "fun_fact": "Nyama Choma is Kenya's favorite meal and is sold at every street corner", "alternatives": ["Chicken instead of beef", "Less spice", "Different marinade"]}
        ],
        "lunch": [
            {"id": "ken-lunch-sukuma-wiki", "name": "Sukuma Wiki (Collard Greens)", "difficulty": "Easy", "servings": 4, "prepTime": 10, "cookTime": 20, "description": "Kenyan collard greens with tomato and onion", "seasonings": ["garlic"], "ingredients": ["1 bunch collard greens", "3 tbsp oil", "2 onions, chopped", "3 cloves garlic", "2 tomatoes, chopped", "Salt", "Pepper"], "instructions": ["Heat oil", "Sauté onions and garlic", "Add tomatoes", "Cook 3 minutes", "Add chopped greens", "Stir well", "Cover and simmer 10 minutes", "Greens should be tender", "Season with salt and pepper"], "notes": "Quick and nutritious", "fun_fact": "Sukuma Wiki means 'push the week' and is eaten throughout Kenya", "alternatives": ["Add beans", "With potatoes", "Spicier version"]}
        ],
        "dinner": [
            {"id": "ken-dinner-mandazi", "name": "Mandazi (Fried Dough)", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 20, "description": "Kenyan fried dough pastry", "seasonings": ["salt", "sugar"], "ingredients": ["2 cups flour", "1 tsp baking powder", "1/2 tsp salt", "2 eggs", "1/2 cup milk", "1 tbsp sugar", "Oil for frying"], "instructions": ["Mix flour, baking powder, salt, sugar", "Beat eggs with milk", "Combine wet and dry", "Form dough, let rest 10 minutes", "Roll thin, cut into pieces", "Deep fry at 350°F until golden", "Drain on paper towels", "Serve warm"], "notes": "Should be fluffy inside, crispy outside", "fun_fact": "Mandazi is Kenya's most popular street snack", "alternatives": ["Sweet with more sugar", "Savory cheese filling", "Different shaped"]}
        ],
        "snacks": [
            {"id": "ken-snack-chapati", "name": "Chapati (Flatbread)", "difficulty": "Medium", "servings": 4, "prepTime": 20, "cookTime": 20, "description": "Kenyan layered flatbread", "seasonings": ["salt"], "ingredients": ["2 cups flour", "1/2 tsp salt", "1/2 cup water", "2 tbsp oil", "Extra oil for layers"], "instructions": ["Make dough with flour, salt, water, oil", "Knead smooth, let rest", "Divide into 4 balls", "Roll thin", "Brush with oil", "Roll up", "Coil and flatten", "Pan fry on griddle until golden and crispy", "Serve hot"], "notes": "Creates layers through folding", "fun_fact": "Chapati is Kenyan staple eaten daily", "alternatives": ["Savory version", "Add honey", "Different shapes"]}
        ],
        "desserts": [
            {"id": "ken-dessert-mandazi-sweet", "name": "Sweet Mandazi", "difficulty": "Medium", "servings": 12, "prepTime": 15, "cookTime": 20, "description": "Kenyan fried sweet pastry", "seasonings": ["cinnamon"], "ingredients": ["2 cups flour", "1 tsp baking powder", "1/2 tsp salt", "1/4 cup sugar", "2 eggs", "1/2 cup milk", "Oil for frying", "Cinnamon and sugar for coating"], "instructions": ["Mix flour, baking powder, salt, sugar", "Add eggs and milk", "Form dough", "Roll, cut into pieces", "Deep fry until golden", "Drain on paper towels", "Dust with cinnamon sugar"], "notes": "Sweet version of savory mandazi", "fun_fact": "Sweet Mandazi is popular at celebrations", "alternatives": ["Add honey drizzle", "Different coating", "Smaller size"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "ken-drink-chai", "name": "Kenyan Chai", "difficulty": "Easy", "servings": 2, "prepTime": 5, "cookTime": 15, "description": "Kenyan spiced tea with milk", "seasonings": ["ginger", "cinnamon"], "ingredients": ["2 cups water", "2 tsp black tea", "1 cup milk", "1 tbsp sugar", "1-inch ginger, sliced", "Cinnamon stick", "Cloves"], "instructions": ["Heat water with ginger, cinnamon, cloves", "Simmer 3 minutes", "Add tea", "Steep 2 minutes", "Add milk and sugar", "Strain into cups", "Serve hot"], "notes": "Strong and aromatic", "fun_fact": "Kenyan Chai is served throughout the day and is social ritual", "alternatives": ["More or less milk", "Different spices", "Without spices"]}
        ],
        "alcoholicDrinks": [
            {"id": "ken-drink-tusker", "name": "Tusker Beer", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Kenyan lager beer", "seasonings": [], "ingredients": ["Tusker beer"], "instructions": ["Serve ice-cold", "Pour into glass", "Enjoy with food or socially"], "notes": "Most popular beer in Kenya", "fun_fact": "Tusker is Kenya's iconic beer brand", "alternatives": ["Different Kenyan beers", "Mixed drinks"]}
        ]
    },
    "Ethiopia": {
        "country": "Ethiopia",
        "region": "Africa",
        "breakfast": [
            {"id": "eth-break-injera", "name": "Injera (Sourdough Bread)", "difficulty": "Hard", "servings": 6, "prepTime": 20, "cookTime": 60, "description": "Ethiopian fermented flatbread", "seasonings": ["salt"], "ingredients": ["2 cups teff flour", "4 cups water", "Salt", "Baking soda"], "instructions": ["Mix teff flour with water", "Let ferment 3-5 days at room temperature", "Mixture should smell sour", "Add salt and small amount baking soda", "Heat large non-stick skillet or crepe pan", "Pour thin batter", "Cover and cook until top is porous", "Don't flip", "Remove when top is set", "Cool and store"], "notes": "Fermentation is essential", "fun_fact": "Injera is Ethiopia's staple bread and plate for meals", "alternatives": ["Shorter fermentation", "Store-bought teff", "Different flours"]}
        ],
        "lunch": [
            {"id": "eth-lunch-doro-wot", "name": "Doro Wot (Chicken Stew)", "difficulty": "Medium", "servings": 6, "prepTime": 20, "cookTime": 45, "description": "Ethiopian spiced chicken stew", "seasonings": ["berbere spice", "ginger", "garlic"], "ingredients": ["2 lbs chicken, chunked", "4 onions, diced", "4 cloves garlic, minced", "2-inch ginger, minced", "3 tbsp berbere spice", "3 tbsp tomato paste", "2 cups broth", "Hard-boiled eggs", "Oil"], "instructions": ["Sauté onions until brown", "Add garlic and ginger", "Add berbere spice, cook 2 minutes", "Add tomato paste", "Add chicken, cook 5 minutes", "Add broth", "Simmer 35 minutes until chicken is tender", "Add hard-boiled eggs", "Simmer 5 more minutes"], "notes": "Berbere gives distinctive flavor", "fun_fact": "Doro Wot is Ethiopian national dish", "alternatives": ["Beef instead of chicken", "Vegetarian version", "More or less spice"]}
        ],
        "dinner": [
            {"id": "eth-dinner-misir-wot", "name": "Misir Wot (Red Lentil Stew)", "difficulty": "Easy", "servings": 6, "prepTime": 10, "cookTime": 40, "description": "Ethiopian red lentil stew", "seasonings": ["berbere", "ginger"], "ingredients": ["2 cups red lentils", "3 cups water or broth", "2 onions, diced", "4 cloves garlic", "2-inch ginger", "3 tbsp berbere spice", "2 tbsp oil", "Salt", "Pepper"], "instructions": ["Heat oil", "Sauté onions until brown", "Add garlic and ginger", "Add berbere spice, cook 1 minute", "Add lentils and water", "Bring to boil", "Reduce heat, simmer 35-40 minutes", "Stir occasionally", "Lentils should be soft and mashed", "Season with salt and pepper"], "notes": "Quick and nutritious", "fun_fact": "Misir Wot is Ethiopian comfort food and vegetarian favorite", "alternatives": ["Add potatoes", "Less spice", "Thicker or thinner"]}
        ],
        "snacks": [
            {"id": "eth-snack-kik-alicha", "name": "Kik Alicha (Mild Split Pea Stew)", "difficulty": "Easy", "servings": 4, "prepTime": 10, "cookTime": 40, "description": "Ethiopian mild pea stew", "seasonings": ["ginger", "turmeric"], "ingredients": ["2 cups split peas", "3 cups water", "1 onion, diced", "3 cloves garlic, minced", "1-inch ginger", "1 tsp turmeric", "2 tbsp oil", "Salt", "Pepper"], "instructions": ["Heat oil", "Sauté onion, garlic, ginger", "Add turmeric", "Add peas and water", "Bring to boil", "Reduce heat, simmer 35-40 minutes", "Peas should break down into paste-like consistency", "Stir occasionally", "Season with salt and pepper"], "notes": "Mild and soothing", "fun_fact": "Kik Alicha is mild version of Ethiopian stew", "alternatives": ["Add potatoes", "Spicier with berbere", "Thicker or thinner"]}
        ],
        "desserts": [
            {"id": "eth-dessert-debla", "name": "Debla (Fried Cookie)", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 30, "description": "Ethiopian fried cookies in honey", "seasonings": ["anise"], "ingredients": ["3 cups flour", "2 eggs", "1/2 cup milk", "1 tsp salt", "Oil for frying", "1 cup honey", "1 tsp anise seeds"], "instructions": ["Mix flour, eggs, milk, salt into dough", "Knead until smooth", "Roll thin", "Cut into shapes", "Fry in oil at 350°F until golden", "Drain on paper towels", "Combine honey with anise", "Dip cookies in honey", "Serve warm or at room temperature"], "notes": "Should be light and crispy", "fun_fact": "Debla is Ethiopian festive cookie served at celebrations", "alternatives": ["Different shapes", "Without anise", "Dry instead of honey-dipped"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "eth-drink-coffee", "name": "Ethiopian Coffee Ceremony", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 15, "description": "Traditional Ethiopian coffee ceremony", "seasonings": ["cardamom"], "ingredients": ["Whole coffee beans", "Charcoal", "Water", "Cardamom pods", "Incense", "Sugar"], "instructions": ["Roast whole beans over charcoal until brown", "Cool and grind by hand", "Brew in jebena (clay pot)", "Add water and bring to simmer", "Pour into small handleless cups", "Add cardamom", "Add sugar to taste", "Pour back and forth between cups to cool", "Serve with ceremony and socializing"], "notes": "Social and ceremonial experience", "fun_fact": "Ethiopian Coffee Ceremony is UNESCO-recognized cultural heritage", "alternatives": ["Without roasting", "Different beans", "Simplified version"]}
        ],
        "alcoholicDrinks": [
            {"id": "eth-drink-tej", "name": "Tej (Honey Wine)", "difficulty": "Hard", "servings": 4, "prepTime": 10, "cookTime": 0, "description": "Traditional Ethiopian honey wine", "seasonings": ["spices"], "ingredients": ["Honey", "Water", "Spices (cloves, cinnamon, fenugreek)", "Yeast"], "instructions": ["Mix honey and water in ratio", "Add spices", "Add small amount yeast", "Ferment 2-4 weeks at room temperature", "Strain", "Serve at room temperature", "Slightly sweet and bubbly"], "notes": "Requires fermentation time", "fun_fact": "Tej is traditional Ethiopian honey wine dating back centuries", "alternatives": ["Quick fermentation", "Different spices", "Store-bought tej"]}
        ]
    },
    "Ghana": {
        "country": "Ghana",
        "region": "Africa",
        "breakfast": [
            {"id": "gha-break-waakye", "name": "Waakye (Rice and Beans)", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 60, "description": "Ghanaian rice and beans with herbs", "seasonings": ["bay leaf", "onion"], "ingredients": ["1 cup rice", "1 cup beans (kidney or black)", "Millet or sorghum leaves for color", "2 onions", "3 tbsp oil", "Salt", "Pepper", "Tomatoes", "Hard-boiled eggs"], "instructions": ["Boil beans with leaves for color until soft", "Add rice to beans", "Add water, onion, oil", "Bring to boil", "Reduce heat, cover", "Cook 20-30 minutes until rice is tender", "Season with salt and pepper", "Serve with hard-boiled eggs and tomatoes"], "notes": "Leaves give unique purple tint", "fun_fact": "Waakye is Ghana's national breakfast and street food", "alternatives": ["Without leaves", "Add meat", "Different bean type"]}
        ],
        "lunch": [
            {"id": "gha-lunch-jollof-rice", "name": "Ghanaian Jollof Rice", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 45, "description": "Ghanaian one-pot rice dish", "seasonings": ["paprika", "cayenne"], "ingredients": ["2 cups rice", "3 tbsp tomato paste", "4 tomatoes", "1 onion", "4 cloves garlic", "3 cups broth", "Oil", "Paprika", "Cayenne", "Carrots", "Peas"], "instructions": ["Heat oil, sauté onion and garlic", "Add tomato paste", "Blend tomatoes, add to pot", "Add broth and spices", "Bring to boil", "Add rice", "Add carrots and peas", "Reduce heat, cover", "Cook 35 minutes until rice is tender", "Let rest 5 minutes"], "notes": "Rice should be fluffy", "fun_fact": "Ghanaian Jollof is said to be the best version in West Africa", "alternatives": ["Add chicken or meat", "Less spice", "Add beans"]}
        ],
        "dinner": [
            {"id": "gha-dinner-light-soup", "name": "Light Soup", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 45, "description": "Ghanaian palm-based soup", "seasonings": ["garlic", "pepper"], "ingredients": ["1.5 lbs fish or meat", "1 can palm oil", "3 tomatoes", "1 onion", "4 cloves garlic", "6 cups broth", "Hot peppers", "Vegetables", "Spices", "Salt"], "instructions": ["Heat palm oil", "Add onion and garlic", "Add blended tomatoes", "Cook 5 minutes", "Add meat or fish", "Add broth", "Add peppers and vegetables", "Simmer 30 minutes", "Fish should be cooked through", "Season with salt and spices"], "notes": "Palm oil gives characteristic color", "fun_fact": "Light Soup is Ghanaian everyday soup", "alternatives": ["Different protein", "Without palm oil", "Vegetarian version"]}
        ],
        "snacks": [
            {"id": "gha-snack-chin-chin", "name": "Chin Chin (Fried Snack)", "difficulty": "Medium", "servings": 24, "prepTime": 20, "cookTime": 30, "description": "Ghanaian fried pastry snack", "seasonings": ["nutmeg"], "ingredients": ["2 cups flour", "1/2 cup butter", "1/4 cup milk", "1 egg", "1 tsp baking powder", "1 tsp nutmeg", "Oil for frying", "Sugar"], "instructions": ["Mix flour, baking powder, nutmeg", "Rub in butter", "Add egg and milk", "Knead until dough holds", "Roll thin", "Cut into strips or cubes", "Deep fry in batches at 350°F until golden", "Drain on paper towels", "Dust with cinnamon sugar"], "notes": "Should be crispy", "fun_fact": "Chin Chin is Ghanaian street snack and favorite treat", "alternatives": ["Savory without sugar", "Different shapes", "Baked version"]}
        ],
        "desserts": [
            {"id": "gha-dessert-fufu", "name": "Fufu Dessert", "difficulty": "Medium", "servings": 4, "prepTime": 10, "cookTime": 20, "description": "Ghanaian plantain pudding", "seasonings": ["cinnamon"], "ingredients": ["2 ripe plantains", "1 cup milk", "1/4 cup sugar", "2 tbsp butter", "Cinnamon", "Vanilla", "Nutmeg"], "instructions": ["Boil plantains until soft", "Peel and mash", "Heat milk with butter and sugar", "Combine plantain and milk", "Add vanilla and cinnamon", "Cook 10 minutes until thick", "Spoon into serving dishes", "Dust with cinnamon", "Serve warm or cold"], "notes": "Should be creamy", "fun_fact": "Plantain-based desserts are popular in Ghana", "alternatives": ["Add chocolate", "Different spices", "Thicker or thinner"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "gha-drink-zobo", "name": "Zobo (Hibiscus Drink)", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 30, "description": "Ghanaian hibiscus flower drink", "seasonings": ["ginger"], "ingredients": ["2 cups dried hibiscus petals", "6 cups water", "1 tbsp ginger", "1/2 cup sugar", "Lemon juice", "Ice"], "instructions": ["Boil water with ginger", "Add hibiscus petals", "Simmer 20 minutes", "Strain through fine sieve", "Add sugar and lemon juice", "Chill thoroughly", "Serve over ice"], "notes": "Beautiful red color", "fun_fact": "Zobo is popular Ghanaian drink", "alternatives": ["More or less ginger", "Add mint", "Different sweetener"]}
        ],
        "alcoholicDrinks": [
            {"id": "gha-drink-beer", "name": "Ghanaian Beer", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Ghanaian lager beer", "seasonings": [], "ingredients": ["Ghanaian beer"], "instructions": ["Serve ice-cold", "Pour into glass", "Enjoy socially"], "notes": "Popular beer culture", "fun_fact": "Ghana has several popular beer brands", "alternatives": ["Different beer brands", "Mixed drinks"]}
        ]
    },
    "Colombia": {
        "country": "Colombia",
        "region": "Americas",
        "breakfast": [
            {"id": "col-break-arepas", "name": "Arepas (Corn Cakes)", "difficulty": "Medium", "servings": 4, "prepTime": 10, "cookTime": 20, "description": "Colombian corn cakes served with fillings", "seasonings": ["salt"], "ingredients": ["2 cups corn flour (arepa)", "1.5 cups water", "1 tsp salt", "Oil for cooking", "Fillings: cheese, ham, chicken, avocado"], "instructions": ["Mix corn flour with water and salt", "Let rest 5 minutes", "Form into 4 cakes", "Heat oil on griddle", "Cook arepas 5-7 minutes per side until golden", "Split and fill with cheese, ham, or other fillings", "Serve hot"], "notes": "Can be filled before cooking", "fun_fact": "Arepas are Colombian staple and are eaten for any meal", "alternatives": ["Different fillings", "Baked instead of fried", "Different corn flour"]}
        ],
        "lunch": [
            {"id": "col-lunch-bandeja", "name": "Bandeja Paisa (Platter)", "difficulty": "Hard", "servings": 2, "prepTime": 20, "cookTime": 60, "description": "Colombian hearty platter with rice, beans, meat", "seasonings": ["cumin", "cilantro"], "ingredients": ["Red beans with lard", "Rice", "Ground beef", "Pork", "Sausage", "Bacon", "Egg", "Plantain", "Avocado", "Arepa", "Tomato", "Cilantro"], "instructions": ["Prepare red beans with lard and cilantro", "Cook rice", "Fry ground beef with spices", "Cook sausage and bacon", "Fry pork", "Fry plantain", "Fry egg", "Cook arepa", "Arrange all components on large platter", "Serve with avocado and tomato"], "notes": "Large and hearty", "fun_fact": "Bandeja Paisa is Colombian national dish from Antioquia region", "alternatives": ["Smaller portions", "Skip some items", "Vegetarian version"]}
        ],
        "dinner": [
            {"id": "col-dinner-ajiaco", "name": "Ajiaco (Potato Soup)", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 45, "description": "Colombian creamy potato soup", "seasonings": ["cilantro", "garlic"], "ingredients": ["2 lbs chicken", "4 potatoes, diced", "2 plantains, sliced", "1 onion", "4 cloves garlic", "6 cups broth", "1 cup cream", "Cilantro", "Avocado", "Corn", "Lime"], "instructions": ["Boil chicken in broth", "Remove and shred chicken", "Sauté onion and garlic", "Add to broth", "Add potatoes and plantains", "Simmer 25 minutes", "Add chicken and corn", "Simmer 10 more minutes", "Stir in cream", "Serve with avocado, cilantro, lime wedges"], "notes": "Creamy and comforting", "fun_fact": "Ajiaco is Colombian national soup", "alternatives": ["Vegetarian version", "Less cream", "Add cheese"]}
        ],
        "snacks": [
            {"id": "col-snack-empanada", "name": "Empanada", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 25, "description": "Colombian fried pastry with filling", "seasonings": ["cumin", "salt"], "ingredients": ["Dough: 2 cups flour, 1 cup butter, 3/4 cup water", "Filling: 1 lb ground meat, 1 onion, Spices, Corn, Raisins", "Oil for frying"], "instructions": ["Make dough, let rest", "Brown meat with onion", "Add spices, corn, raisins", "Cool filling", "Roll dough thin", "Cut circles", "Fill each", "Fold and seal", "Heat oil to 350°F", "Deep fry until golden", "Drain on paper towels"], "notes": "Filling must be cool before sealing", "fun_fact": "Empanadas are Colombian street food", "alternatives": ["Baked version", "Vegetarian filling", "Different shaped"]}
        ],
        "desserts": [
            {"id": "col-dessert-flan", "name": "Flan (Caramel Custard)", "difficulty": "Medium", "servings": 8, "prepTime": 15, "cookTime": 45, "description": "Colombian caramel custard", "seasonings": ["vanilla"], "ingredients": ["1 cup sugar (for caramel)", "6 eggs", "1 can condensed milk", "1 can evaporated milk", "1 tsp vanilla", "Pinch salt"], "instructions": ["Preheat oven to 350°F", "Melt 1/2 cup sugar in saucepan", "Pour caramel into flan dish", "Blend eggs, condensed milk, evaporated milk, vanilla, salt", "Pour into caramel-lined dish", "Place in water bath", "Bake 40-45 minutes", "Center should be slightly jiggly", "Cool and refrigerate", "Invert onto plate"], "notes": "Don't overbake", "fun_fact": "Flan is Colombian favorite dessert", "alternatives": ["Add coconut", "Baked differently", "Different milk ratios"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "col-drink-chocolate", "name": "Hot Chocolate Colombiano", "difficulty": "Easy", "servings": 2, "prepTime": 5, "cookTime": 10, "description": "Colombian thick hot chocolate", "seasonings": ["cinnamon"], "ingredients": ["4 oz dark chocolate", "2 cups milk", "1 tbsp sugar", "Cinnamon stick", "Vanilla"], "instructions": ["Heat milk with cinnamon", "Add chopped chocolate", "Whisk until completely melted", "Add sugar", "Pour into cups", "Serve hot", "Often with cheese or bread"], "notes": "Should be thick and rich", "fun_fact": "Hot Chocolate Colombiano is traditional breakfast drink", "alternatives": ["Add cream", "Different chocolate", "Cold version"]}
        ],
        "alcoholicDrinks": [
            {"id": "col-drink-aguardiente", "name": "Aguardiente (Anise Spirit)", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Colombian anise-flavored spirit", "seasonings": [], "ingredients": ["Aguardiente"], "instructions": ["Serve at room temperature", "Pour small shot", "Sip or drink quickly", "Often followed by beer", "Traditional social drink"], "notes": "Strong spirit", "fun_fact": "Aguardiente is Colombian national spirit", "alternatives": ["Different brands", "Mixed drinks", "Chilled"]}
        ]
    }
}

def expand_phase_5_batch_3():
    os.makedirs('data/phase5-recipes', exist_ok=True)
    for country, data in PHASE_5_BATCH_3.items():
        filename = f"data/phase5-recipes/{country.lower()}-phase5-authentic.json"
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        recipes = sum(len(data.get(cat, []))
                     for cat in ['breakfast', 'lunch', 'dinner', 'snacks',
                                'desserts', 'nonAlcoholicDrinks', 'alcoholicDrinks'])
        print(f"✓ {country:<15} | {recipes} recipes")

if __name__ == "__main__":
    print("\n🌍 PHASE 5 BATCH 3: Africa & Americas")
    print("="*80 + "\n")
    expand_phase_5_batch_3()
    print("\n✓ Batch 3 complete!")
