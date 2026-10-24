#!/usr/bin/env python3
"""
PHASE 6 BATCH 2: Southeast & South Asia expansion
Laos, Cambodia, Myanmar, Vietnam-expanded
"""
import json, os

PHASE_6_BATCH_2 = {
    "Laos": {
        "country": "Laos",
        "region": "Asia",
        "breakfast": [
            {"id": "lao-break-jok", "name": "Jok (Lao Rice Porridge)", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 30, "description": "Lao breakfast rice porridge with broth", "seasonings": ["garlic", "ginger"], "ingredients": ["1 cup rice", "4 cups broth", "1 tbsp ginger, minced", "4 cloves garlic", "Scallions", "Hard-boiled egg", "Fish sauce", "Salt"], "instructions": ["Bring broth to boil", "Add rice and ginger", "Simmer 25-30 minutes until rice breaks down", "Add garlic", "Season with fish sauce", "Serve in bowl", "Top with hard-boiled egg and scallions", "Serve with lime and chili"], "notes": "Should be creamy", "fun_fact": "Jok is common Lao breakfast", "alternatives": ["Add chicken", "Different toppings", "Thicker or thinner"]}
        ],
        "lunch": [
            {"id": "lao-lunch-larb", "name": "Larb (Spicy Meat Salad)", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 15, "description": "Lao spicy minced meat salad", "seasonings": ["chili", "lime", "fish sauce"], "ingredients": ["1 lb ground meat (pork, chicken, beef)", "Lime juice", "Fish sauce", "Chili peppers", "Scallions", "Cilantro", "Mint", "Roasted rice powder"], "instructions": ["Cook ground meat until done", "Mix with lime juice and fish sauce", "Add minced chili peppers", "Toss in roasted rice powder", "Add scallions, cilantro, mint", "Serve with lettuce leaves", "Eat by wrapping in lettuce"], "notes": "Very spicy", "fun_fact": "Larb is Lao national dish", "alternatives": ["Less spicy version", "Seafood larb", "Vegetarian version"]}
        ],
        "dinner": [
            {"id": "lao-dinner-khao-poon", "name": "Khao Poon (Rice Noodle Soup)", "difficulty": "Medium", "servings": 4, "prepTime": 20, "cookTime": 30, "description": "Lao curried rice noodle soup", "seasonings": ["curry paste", "lemongrass"], "ingredients": ["8 oz rice noodles", "4 cups coconut milk", "2 cups broth", "2 tbsp red curry paste", "1 tbsp lemongrass, minced", "Fish or meat", "Vegetables", "Fresh herbs"], "instructions": ["Heat coconut milk", "Add curry paste and lemongrass", "Add broth", "Add fish or meat", "Simmer 15 minutes", "Cook rice noodles separately", "Place noodles in bowl", "Pour soup over", "Serve with fresh herbs and vegetables"], "notes": "Rich and aromatic", "fun_fact": "Khao Poon is Lao special occasion dish", "alternatives": ["Different curry paste", "Vegetarian version", "Less coconut milk"]}
        ],
        "snacks": [
            {"id": "lao-snack-spring-rolls", "name": "Lao Spring Rolls", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 15, "description": "Fresh or fried Lao spring rolls", "seasonings": ["fish sauce"], "ingredients": ["Rice paper wrappers", "Pork or shrimp", "Vegetables (lettuce, cucumber)", "Rice vermicelli", "Fresh herbs", "Fish sauce dipping sauce"], "instructions": ["Soak rice paper in water", "Assemble filling on wrapper", "Add meat, noodles, vegetables, herbs", "Roll tightly", "Can serve fresh or fried", "If fried: deep fry until golden", "Serve with fish sauce dipping"], "notes": "Thin and delicate", "fun_fact": "Spring rolls are popular Lao appetizer", "alternatives": ["Fried version", "Different filling", "Sweet sauce"]}
        ],
        "desserts": [
            {"id": "lao-dessert-sticky-mango", "name": "Sticky Rice with Mango", "difficulty": "Medium", "servings": 4, "prepTime": 10, "cookTime": 30, "description": "Lao sweet sticky rice with fresh mango", "seasonings": ["coconut", "salt"], "ingredients": ["2 cups sticky rice", "1 can coconut milk", "1/2 cup sugar", "Pinch salt", "2 ripe mangoes", "Sesame seeds"], "instructions": ["Cook sticky rice in rice cooker or steam", "Heat coconut milk with sugar and salt", "Mix into cooked rice", "Let absorb 10 minutes", "Peel and slice mangoes", "Arrange rice in bowl", "Place mango beside rice", "Sprinkle sesame seeds", "Serve warm or cold"], "notes": "Mangoes should be ripe", "fun_fact": "Sticky rice with mango is Lao favorite dessert", "alternatives": ["Different fruit", "Add egg custard", "Without sesame"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "lao-drink-lemongrass", "name": "Lemongrass Tea", "difficulty": "Easy", "servings": 2, "prepTime": 5, "cookTime": 10, "description": "Refreshing Lao lemongrass tea", "seasonings": ["ginger"], "ingredients": ["4 stalks lemongrass", "1-inch ginger", "4 cups water", "Sugar to taste", "Ice"], "instructions": ["Crush lemongrass and ginger", "Boil water with lemongrass and ginger", "Simmer 5 minutes", "Strain", "Add sugar to taste", "Chill thoroughly", "Serve over ice"], "notes": "Very fragrant", "fun_fact": "Lemongrass tea is refreshing Lao drink", "alternatives": ["Add mint", "Hot version", "Different herbs"]}
        ],
        "alcoholicDrinks": [
            {"id": "lao-drink-lao-lao", "name": "Lao Lao (Rice Whiskey)", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Traditional Lao rice whiskey", "seasonings": [], "ingredients": ["Lao Lao spirit"], "instructions": ["Serve at room temperature", "Pour small glass", "Drink with food", "Often shared in groups"], "notes": "Very strong", "fun_fact": "Lao Lao is traditional Lao spirit", "alternatives": ["Chilled", "Mixed drinks"]}
        ]
    },
    "Cambodia": {
        "country": "Cambodia",
        "region": "Asia",
        "breakfast": [
            {"id": "cam-break-rice-porridge", "name": "Cambodian Rice Porridge", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 30, "description": "Cambodian rice porridge with toppings", "seasonings": ["ginger", "garlic"], "ingredients": ["1 cup rice", "4 cups broth or water", "1-inch ginger, sliced", "3 cloves garlic", "Scallions", "Fried shallots", "Fish sauce"], "instructions": ["Bring broth to boil", "Add rice and ginger", "Simmer 25-30 minutes", "Add garlic", "Season with fish sauce", "Serve in bowl", "Top with fried shallots and scallions"], "notes": "Comfort breakfast", "fun_fact": "Rice porridge is Cambodian everyday breakfast", "alternatives": ["Add meat", "Different toppings", "Add vegetables"]}
        ],
        "lunch": [
            {"id": "cam-lunch-amok", "name": "Amok (Curry Custard)", "difficulty": "Hard", "servings": 4, "prepTime": 20, "cookTime": 30, "description": "Cambodian steamed curry custard with fish", "seasonings": ["curry paste", "coconut"], "ingredients": ["1 can coconut milk", "2 tbsp curry paste", "1 lb fish", "3 eggs", "Lime leaf", "Galangal", "Lemongrass", "Banana leaf for serving"], "instructions": ["Mix coconut milk with curry paste", "Add whisked eggs slowly", "Add cut fish pieces", "Add lime leaf, galangal, lemongrass", "Pour into banana leaf bowls", "Steam 25-30 minutes", "Custard should be set but silky", "Serve in banana leaf"], "notes": "Banana leaf adds flavor", "fun_fact": "Amok is Cambodian national dish", "alternatives": ["Different protein", "Less spicy", "Baked instead of steamed"]}
        ],
        "dinner": [
            {"id": "cam-dinner-samlor-somla", "name": "Samlor Somla (Sour Soup)", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 45, "description": "Cambodian sour soup with sour fruit", "seasonings": ["tamarind", "fish sauce"], "ingredients": ["1.5 lbs fish or meat", "6 cups broth", "2 tbsp tamarind", "2 onions", "4 cloves garlic", "4 potatoes", "Sour fruit (starfruit or lime)", "Fish sauce", "Chili"], "instructions": ["Heat broth with tamarind", "Add onion and garlic", "Add potatoes", "Simmer 20 minutes", "Add fish or meat", "Simmer 15 minutes", "Add sour fruit", "Season with fish sauce and chili", "Serve hot"], "notes": "Balance sour and savory", "fun_fact": "Samlor Somla is traditional Cambodian soup", "alternatives": ["Different protein", "More or less sour", "Vegetarian version"]}
        ],
        "snacks": [
            {"id": "cam-snack-nom-ansom", "name": "Nom Ansom (Banana Cake)", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 45, "description": "Cambodian sticky rice and banana cake", "seasonings": ["salt"], "ingredients": ["2 cups sticky rice", "1 can coconut milk", "4 bananas, sliced", "1/2 cup brown sugar", "Pinch salt", "Banana leaf for wrapping"], "instructions": ["Mix sticky rice with coconut milk and salt", "Spread thin layer in banana leaf", "Layer banana slices", "Sprinkle brown sugar", "Add more rice layer", "Wrap tightly", "Steam 40 minutes", "Serve warm or cold"], "notes": "Banana leaf adds flavor", "fun_fact": "Nom Ansom is popular Cambodian snack", "alternatives": ["Different fruit", "Less sweet", "Baked version"]}
        ],
        "desserts": [
            {"id": "cam-dessert-khmer-custard", "name": "Khmer Custard Tart", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 45, "description": "Cambodian creamy custard tart", "seasonings": ["vanilla"], "ingredients": ["Tart shell: flour, butter, eggs", "Custard: eggs, milk, sugar, vanilla", "Caramelized sugar for top"], "instructions": ["Make tart dough", "Line tart pan", "Make custard: whisk eggs, milk, sugar, vanilla", "Pour into shell", "Bake at 350°F for 35-40 minutes", "Custard should be set but jiggly in center", "Cool completely", "Top with caramelized sugar if desired"], "notes": "Don't overbake", "fun_fact": "Custard tart shows French influence in Cambodian cooking", "alternatives": ["Without caramel", "Different flavoring", "Individual tarts"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "cam-drink-sugar-cane-juice", "name": "Sugar Cane Juice", "difficulty": "Easy", "servings": 2, "prepTime": 5, "cookTime": 0, "description": "Fresh Cambodian sugar cane juice", "seasonings": [], "ingredients": ["Fresh sugar cane", "Lime juice"], "instructions": ["Extract juice from sugar cane", "Squeeze through press or juicer", "Add lime juice", "Serve over ice", "Refreshing street drink"], "notes": "Freshly pressed", "fun_fact": "Sugar cane juice is popular Cambodian street drink", "alternatives": ["With coconut water", "Add ginger", "Different citrus"]}
        ],
        "alcoholicDrinks": [
            {"id": "cam-drink-beer", "name": "Cambodian Beer", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Light Cambodian lager beer", "seasonings": [], "ingredients": ["Cambodian beer"], "instructions": ["Serve ice-cold", "Enjoy with meal", "Popular social drink"], "notes": "Popular brands", "fun_fact": "Beer culture strong in Cambodia", "alternatives": ["Different brands", "Room temperature"]}
        ]
    },
    "Myanmar": {
        "country": "Myanmar",
        "region": "Asia",
        "breakfast": [
            {"id": "mya-break-shan-noodles", "name": "Shan Noodles", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 20, "description": "Burmese rice noodle dish from Shan state", "seasonings": ["garlic", "chili"], "ingredients": ["8 oz rice noodles", "Oil for frying", "Pork or chicken", "Potatoes", "Garlic", "Chili", "Scallions", "Bean sprouts", "Fish sauce"], "instructions": ["Cook rice noodles", "Fry noodles until crispy on outside", "Make sauce: garlic, chili, fish sauce", "Fry meat with potatoes", "Add sauce to meat", "Serve noodles topped with meat mixture", "Garnish with scallions and bean sprouts"], "notes": "Noodles should be crispy", "fun_fact": "Shan noodles are Myanmar's most popular noodle dish", "alternatives": ["Vegetarian version", "Different protein", "Spice level"]}
        ],
        "lunch": [
            {"id": "mya-lunch-ohn-no-khao-swe", "name": "Ohn No Khao Swe (Chicken Noodle Soup)", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 40, "description": "Burmese curried noodle soup", "seasonings": ["curry", "coconut"], "ingredients": ["8 oz egg noodles", "2 lbs chicken", "2 cans coconut milk", "4 cups broth", "3 tbsp curry powder", "Onions", "Garlic", "Ginger", "Oil", "Scallions", "Chickpeas"], "instructions": ["Sauté onion, garlic, ginger", "Add curry powder, cook 1 minute", "Add chicken pieces", "Add coconut milk and broth", "Simmer 30 minutes", "Cook noodles separately", "Place noodles in bowl", "Pour soup over", "Garnish with scallions and chickpeas"], "notes": "Creamy and spiced", "fun_fact": "Ohn No Khao Swe is Myanmar's national dish", "alternatives": ["Less coconut", "Different protein", "More vegetables"]}
        ],
        "dinner": [
            {"id": "mya-dinner-samusa", "name": "Samusa (Fried Pastry)", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 20, "description": "Burmese fried pastry with meat filling", "seasonings": ["cumin", "garlic"], "ingredients": ["Pastry: flour, water, salt", "Filling: beef, onion, garlic, spices", "Oil for frying"], "instructions": ["Make pastry dough", "Brown meat with onion and garlic", "Add spices", "Cool filling", "Roll dough thin", "Cut into squares or triangles", "Fill and fold", "Deep fry at 350°F until golden", "Drain on paper towels"], "notes": "Filling must cool", "fun_fact": "Samusa is popular Burmese street snack", "alternatives": ["Vegetarian filling", "Different shape", "Baked version"]}
        ],
        "snacks": [
            {"id": "mya-snack-laphet-thoke", "name": "Laphet Thoke (Fermented Tea Salad)", "difficulty": "Hard", "servings": 4, "prepTime": 20, "cookTime": 0, "description": "Burmese fermented tea leaf salad", "seasonings": ["fermented tea"], "ingredients": ["Fermented tea leaves", "Cabbage", "Tomato", "Garlic", "Chili", "Peanuts", "Sesame seeds", "Lime juice", "Fish sauce"], "instructions": ["Finely chop fermented tea leaves", "Slice cabbage thin", "Dice tomato", "Mince garlic and chili", "Toss all together", "Add peanuts and sesame", "Dress with lime juice and fish sauce", "Serve at room temperature"], "notes": "Fermented tea is unique", "fun_fact": "Laphet Thoke is Myanmar's national snack", "alternatives": ["Less fermented tea", "Different vegetables", "Skip chili"]}
        ],
        "desserts": [
            {"id": "mya-dessert-shan-tofu", "name": "Shan Tofu Dessert", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 30, "description": "Burmese chickpea flour tofu with syrup", "seasonings": ["palm sugar"], "ingredients": ["1 cup chickpea flour", "3 cups water", "1/2 cup palm sugar", "1/4 cup water", "Sesame seeds", "Oil"], "instructions": ["Mix chickpea flour with water", "Heat in pot, stir constantly", "Cook until thick and pulls away from sides", "Pour into oiled pan", "Cool and cut into squares", "Make syrup: melt palm sugar in water", "Serve tofu with syrup drizzle", "Sprinkle sesame seeds"], "notes": "Requires constant stirring", "fun_fact": "Shan tofu is popular Burmese dessert", "alternatives": ["Without sesame", "Different toppings", "Served cold"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "mya-drink-sugarcane-juice", "name": "Sugarcane Juice", "difficulty": "Easy", "servings": 2, "prepTime": 5, "cookTime": 0, "description": "Fresh Burmese sugarcane juice", "seasonings": [], "ingredients": ["Fresh sugarcane", "Lime"], "instructions": ["Press sugarcane through juicer", "Squeeze fresh lime juice", "Mix together", "Serve over ice", "Popular street beverage"], "notes": "Freshly pressed", "fun_fact": "Sugarcane juice is refreshing Myanmar drink", "alternatives": ["With coconut water", "Add ginger"]}
        ],
        "alcoholicDrinks": [
            {"id": "mya-drink-myanmar-beer", "name": "Myanmar Beer", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Light Burmese lager", "seasonings": [], "ingredients": ["Myanmar beer"], "instructions": ["Serve ice-cold", "Enjoy with meal", "Popular social drink"], "notes": "Popular brands", "fun_fact": "Beer popular in Myanmar", "alternatives": ["Different brands", "Room temperature"]}
        ]
    },
    "Vietnam": {
        "country": "Vietnam",
        "region": "Asia",
        "breakfast": [
            {"id": "vtn-break-banh-mi-breakfast", "name": "Banh Mi Breakfast", "difficulty": "Medium", "servings": 2, "prepTime": 15, "cookTime": 10, "description": "Vietnamese breakfast sandwich with eggs", "seasonings": ["mayo", "chili"], "ingredients": ["French baguette", "Butter", "Mayo", "Fried eggs", "Vietnamese ham", "Pâté", "Pickled vegetables", "Cilantro", "Chili sauce"], "instructions": ["Toast baguette", "Spread butter and mayo", "Layer pâté and ham", "Add fried eggs", "Add pickled vegetables", "Garnish with cilantro", "Add chili sauce", "Serve immediately"], "notes": "Crispy outside, soft inside", "fun_fact": "Banh Mi breakfast is Vietnamese street food", "alternatives": ["Different proteins", "Vegetarian version", "Different sauces"]}
        ],
        "lunch": [
            {"id": "vtn-lunch-hu-tieu", "name": "Hu Tieu (Clear Tapioca Noodle Soup)", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 30, "description": "Vietnamese clear broth with tapioca noodles", "seasonings": ["garlic", "shrimp paste"], "ingredients": ["8 oz tapioca noodles", "6 cups broth", "4 oz shrimp", "4 oz pork", "Garlic", "Scallions", "Cilantro", "Lime", "Fish sauce"], "instructions": ["Make broth with garlic and shrimp paste", "Simmer shrimp and pork in broth", "Cook tapioca noodles separately", "Place noodles in bowl", "Pour broth and meat over", "Garnish with scallions and cilantro", "Serve with lime wedges"], "notes": "Light and aromatic", "fun_fact": "Hu Tieu is popular Vietnamese lunch dish", "alternatives": ["Different noodles", "Vegetarian version", "Different proteins"]}
        ],
        "dinner": [
            {"id": "vtn-dinner-ca-kho-to", "name": "Ca Kho To (Fish in Clay Pot)", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 40, "description": "Vietnamese braised fish in caramel and fish sauce", "seasonings": ["caramel", "fish sauce"], "ingredients": ["2 lbs fish", "2 tbsp caramel sauce", "3 tbsp fish sauce", "2 tbsp oil", "Onion", "Garlic", "Ginger", "Shallots", "Water"], "instructions": ["Heat oil in clay pot", "Sauté garlic, ginger, shallots", "Add fish", "Pour caramel sauce and fish sauce", "Add water halfway", "Cover and simmer 30-35 minutes", "Fish should be tender", "Serve in clay pot"], "notes": "Clay pot adds flavor", "fun_fact": "Ca Kho To is traditional Vietnamese dish", "alternatives": ["Different fish", "Less sweet", "Add vegetables"]}
        ],
        "snacks": [
            {"id": "vtn-snack-che-ba-mau", "name": "Che Ba Mau (Three-Color Dessert Drink)", "difficulty": "Medium", "servings": 4, "prepTime": 20, "cookTime": 0, "description": "Vietnamese colorful layered sweet drink", "seasonings": ["sugar"], "ingredients": ["1/2 cup cooked black beans", "1/2 cup cooked split peas", "1/2 cup cooked corn", "1 cup sugar", "1 cup water", "1 can coconut milk", "Ice", "Tapioca pearls (optional)"], "instructions": ["Make syrup from sugar and water", "Cool syrup", "Layer black beans, split peas, corn in glass", "Add tapioca pearls if desired", "Pour syrup over", "Add ice", "Top with coconut milk", "Stir before drinking"], "notes": "Beautiful layering", "fun_fact": "Che Ba Mau is popular Vietnamese summer drink", "alternatives": ["Different ingredients", "Different layers", "With crushed ice"]}
        ],
        "desserts": [
            {"id": "vtn-dessert-banh-cam", "name": "Banh Cam (Sesame Balls)", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 20, "description": "Vietnamese fried sesame balls", "seasonings": ["sesame"], "ingredients": ["1 cup sticky rice flour", "1/2 cup water", "1/2 cup sesame seeds", "Red bean paste or sugar", "Oil for frying"], "instructions": ["Mix sticky rice flour with water", "Form into balls", "Fill with red bean paste or sugar", "Roll in sesame seeds", "Heat oil to 350°F", "Fry until golden", "Drain on paper towels", "Serve warm"], "notes": "Sesame coating is key", "fun_fact": "Banh Cam is popular Vietnamese dessert", "alternatives": ["Different filling", "Without sesame", "Different shape"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "vtn-drink-egg-coffee", "name": "Vietnamese Egg Coffee", "difficulty": "Medium", "servings": 1, "prepTime": 5, "cookTime": 5, "description": "Vietnamese creamy coffee with egg foam", "seasonings": [], "ingredients": ["Strong coffee", "Egg yolk", "Condensed milk", "Cocoa powder"], "instructions": ["Brew strong Vietnamese coffee", "Heat condensed milk", "Whisk egg yolk until creamy foam", "Pour coffee into cup", "Add condensed milk", "Top with egg foam", "Dust with cocoa powder", "Serve hot"], "notes": "Egg must be fresh", "fun_fact": "Egg coffee is Hanoi specialty", "alternatives": ["Without cocoa", "Different coffee", "Iced version"]}
        ],
        "alcoholicDrinks": [
            {"id": "vtn-drink-saigon-beer", "name": "Saigon Beer", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Vietnamese light lager beer", "seasonings": [], "ingredients": ["Saigon Beer"], "instructions": ["Serve ice-cold", "Pour into glass", "Enjoy with food", "Popular social drink"], "notes": "Most popular beer", "fun_fact": "Saigon Beer is iconic Vietnamese beer", "alternatives": ["Different Vietnamese beers", "Room temperature"]}
        ]
    }
}

def expand_phase_6_batch_2():
    os.makedirs('data/phase6-recipes', exist_ok=True)
    for country, data in PHASE_6_BATCH_2.items():
        filename = f"data/phase6-recipes/{country.lower()}-phase6-authentic.json"
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        recipes = sum(len(data.get(cat, []))
                     for cat in ['breakfast', 'lunch', 'dinner', 'snacks',
                                'desserts', 'nonAlcoholicDrinks', 'alcoholicDrinks'])
        print(f"✓ {country:<15} | {recipes} recipes")

if __name__ == "__main__":
    print("\n🌍 PHASE 6 BATCH 2: Southeast & South Asia")
    print("="*80 + "\n")
    expand_phase_6_batch_2()
    print("\n✓ Batch 2 complete!")
