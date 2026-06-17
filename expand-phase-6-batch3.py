#!/usr/bin/env python3
"""
PHASE 6 BATCH 3: Americas expansion
Costa Rica, Ecuador, Senegal
"""
import json, os

PHASE_6_BATCH_3 = {
    "Costa Rica": {
        "country": "Costa Rica",
        "region": "Americas",
        "breakfast": [
            {"id": "cr-break-gallo-pinto", "name": "Gallo Pinto (Rice and Beans)", "difficulty": "Easy", "servings": 4, "prepTime": 10, "cookTime": 15, "description": "Costa Rican rice and beans breakfast", "seasonings": ["cumin", "cilantro"], "ingredients": ["2 cups cooked rice", "1 cup black beans", "1 onion", "1 bell pepper", "2 cloves garlic", "2 tbsp oil", "Cumin", "Cilantro", "Salt", "Pepper"], "instructions": ["Heat oil, sauté onion and garlic", "Add bell pepper", "Add cooked rice and beans", "Add cumin", "Stir frequently 10 minutes", "Season with salt and pepper", "Garnish with cilantro", "Serve with eggs if desired"], "notes": "Should be crispy and mixed", "fun_fact": "Gallo Pinto is Costa Rican national breakfast", "alternatives": ["Refried beans", "Add meat", "Extra spice"]}
        ],
        "lunch": [
            {"id": "cr-lunch-casado", "name": "Casado (Plate of the Day)", "difficulty": "Medium", "servings": 1, "prepTime": 15, "cookTime": 45, "description": "Costa Rican set meal with multiple components", "seasonings": ["cumin", "cilantro"], "ingredients": ["Rice", "Black beans", "Salad", "Plantain", "Protein (chicken/fish/beef)", "Vegetables", "Tortillas"], "instructions": ["Prepare rice", "Prepare beans", "Make mixed salad", "Cook protein with spices", "Fry plantain", "Cook vegetables", "Arrange all on plate", "Serve with fresh tortillas"], "notes": "Must have all components", "fun_fact": "Casado is everyday Costa Rican lunch", "alternatives": ["Different proteins", "Different vegetables", "Skip plantain"]}
        ],
        "dinner": [
            {"id": "cr-dinner-picadillo", "name": "Picadillo (Spiced Ground Beef)", "difficulty": "Medium", "servings": 4, "prepTime": 15, "cookTime": 30, "description": "Costa Rican ground beef hash", "seasonings": ["cumin", "cilantro"], "ingredients": ["1.5 lbs ground beef", "2 potatoes, diced", "1 carrot, diced", "1 onion", "3 cloves garlic", "2 tbsp cumin", "1/2 cup broth", "Cilantro", "Oil", "Salt", "Pepper"], "instructions": ["Brown beef in oil", "Add onion and garlic", "Add potatoes and carrot", "Cook 15 minutes", "Add cumin and broth", "Simmer 10 minutes", "Vegetables should be tender", "Season with salt and pepper", "Garnish with cilantro"], "notes": "Diced vegetables", "fun_fact": "Picadillo is popular Costa Rican dinner", "alternatives": ["Pork instead of beef", "Different vegetables", "Add raisins"]}
        ],
        "snacks": [
            {"id": "cr-snack-empanada", "name": "Costa Rican Empanada", "difficulty": "Hard", "servings": 12, "prepTime": 30, "cookTime": 25, "description": "Fried pastry with meat or cheese filling", "seasonings": ["cumin"], "ingredients": ["Dough: flour, water, salt, oil", "Filling: meat/cheese, onion, garlic, cumin", "Oil for frying"], "instructions": ["Make dough with flour, water, salt, oil", "Let rest 20 minutes", "Brown filling ingredients", "Roll dough thin", "Cut into circles", "Fill and fold", "Deep fry at 350°F until golden", "Drain on paper towels"], "notes": "Filling must cool before sealing", "fun_fact": "Empanadas are popular Costa Rican street food", "alternatives": ["Baked version", "Different filling", "Vegetarian"]}
        ],
        "desserts": [
            {"id": "cr-dessert-flan", "name": "Costa Rican Flan", "difficulty": "Medium", "servings": 8, "prepTime": 15, "cookTime": 45, "description": "Caramel custard dessert", "seasonings": ["vanilla"], "ingredients": ["1 cup sugar (for caramel)", "6 eggs", "1 can condensed milk", "1 can evaporated milk", "1 tsp vanilla", "Salt"], "instructions": ["Preheat oven to 350°F", "Melt 1/2 cup sugar in saucepan", "Pour into flan dish", "Blend eggs, milks, vanilla, salt", "Pour over caramel", "Place in water bath", "Bake 40-45 minutes", "Center should jiggle slightly", "Cool and refrigerate"], "notes": "Don't overbake", "fun_fact": "Flan is popular Costa Rican dessert", "alternatives": ["Add cinnamon", "Different sweetener", "Individual flans"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "cr-drink-horchata", "name": "Costa Rican Horchata", "difficulty": "Easy", "servings": 4, "prepTime": 10, "cookTime": 0, "description": "Sweet rice and cinnamon drink", "seasonings": ["cinnamon", "vanilla"], "ingredients": ["1 cup rice flour", "4 cups water", "1/4 cup sugar", "1 tsp cinnamon", "1 tsp vanilla", "Ice"], "instructions": ["Mix rice flour with small amount water", "Make smooth paste", "Add remaining water slowly", "Add sugar, cinnamon, vanilla", "Stir well", "Chill thoroughly", "Serve over ice"], "notes": "Can be thick or thin", "fun_fact": "Horchata is traditional Costa Rican drink", "alternatives": ["Thinner or thicker", "Almond version", "Different spices"]}
        ],
        "alcoholicDrinks": [
            {"id": "cr-drink-guaro", "name": "Guaro (Sugarcane Spirit)", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Costa Rican sugarcane spirit", "seasonings": [], "ingredients": ["Guaro"], "instructions": ["Serve at room temperature", "Can mix with fruit juice", "Popular social drink", "Strong spirit"], "notes": "Very strong", "fun_fact": "Guaro is Costa Rican national spirit", "alternatives": ["Mixed drinks", "Chilled", "Different brand"]}
        ]
    },
    "Ecuador": {
        "country": "Ecuador",
        "region": "Americas",
        "breakfast": [
            {"id": "ecu-break-llapingachos", "name": "Llapingachos (Potato Cakes)", "difficulty": "Medium", "servings": 4, "prepTime": 20, "cookTime": 20, "description": "Ecuadorian stuffed potato cakes", "seasonings": ["salt", "pepper"], "ingredients": ["2 lbs potatoes", "1 cup cheese", "1 onion", "2 tbsp oil", "Salt", "Pepper", "Fried egg", "Avocado"], "instructions": ["Boil and mash potatoes", "Sauté onion", "Mix onion into mashed potatoes", "Form into cakes", "Stuff with cheese", "Flatten and press edges", "Pan fry in oil until golden", "Serve with fried egg and avocado"], "notes": "Cheese stays inside", "fun_fact": "Llapingachos is Ecuadorian breakfast staple", "alternatives": ["Different cheese", "No stuffing", "Larger cakes"]}
        ],
        "lunch": [
            {"id": "ecu-lunch-locro", "name": "Locro (Andean Stew)", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 60, "description": "Ecuadorian mountain stew with squash and corn", "seasonings": ["cumin"], "ingredients": ["1.5 lbs meat", "3 potatoes", "1 large squash", "3 ears corn", "1 onion", "4 cloves garlic", "6 cups broth", "1 tsp cumin", "Oil", "Salt", "Pepper"], "instructions": ["Brown meat in oil", "Sauté onion and garlic", "Add broth and bring to boil", "Add potatoes, squash, corn", "Add cumin", "Simmer 45 minutes", "Vegetables should be tender", "Season with salt and pepper"], "notes": "Hearty and filling", "fun_fact": "Locro is traditional Andean Ecuadorian stew", "alternatives": ["Different vegetables", "Vegetarian version", "Different protein"]}
        ],
        "dinner": [
            {"id": "ecu-dinner-ceviche", "name": "Ecuadorian Ceviche", "difficulty": "Medium", "servings": 4, "prepTime": 30, "cookTime": 0, "description": "Fresh white fish cured in citrus", "seasonings": ["lime", "cilantro"], "ingredients": ["1.5 lbs white fish", "1 cup lime juice", "1/2 cup orange juice", "1 red onion", "3 hot peppers", "Cilantro", "Corn", "Sweet potato", "Lime"], "instructions": ["Cube raw fish", "Mix with lime and orange juice", "Let sit 15-20 minutes (fish cures)", "Fish should be opaque", "Dice onion, add with peppers", "Serve with boiled corn and sweet potato", "Garnish with cilantro and lime"], "notes": "Fish must be very fresh", "fun_fact": "Ceviche is popular Ecuadorian coastal dish", "alternatives": ["Shrimp instead of fish", "Different citrus", "Add avocado"]}
        ],
        "snacks": [
            {"id": "ecu-snack-humita", "name": "Humita (Corn Pastry)", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 30, "description": "Ecuadorian corn dough pastry", "seasonings": ["cumin"], "ingredients": ["6 ears corn", "1 onion", "2 tbsp cumin", "1 cup cheese", "Corn husks", "Salt", "Pepper"], "instructions": ["Grind corn kernels", "Sauté onion", "Mix corn, onion, cumin, cheese", "Season with salt and pepper", "Wrap in corn husks", "Steam 20-30 minutes", "Serve warm"], "notes": "Corn husks add flavor", "fun_fact": "Humita is traditional Ecuadorian pastry", "alternatives": ["No cheese", "Different seasonings", "Baked version"]}
        ],
        "desserts": [
            {"id": "ecu-dessert-flan", "name": "Ecuadorian Flan with Cinnamon", "difficulty": "Medium", "servings": 8, "prepTime": 15, "cookTime": 45, "description": "Creamy custard with cinnamon", "seasonings": ["cinnamon"], "ingredients": ["1 cup sugar (caramel)", "6 eggs", "1 can condensed milk", "1 can evaporated milk", "1 tsp vanilla", "1/2 tsp cinnamon"], "instructions": ["Make caramel with 1/2 cup sugar", "Pour into flan dish", "Blend eggs, milks, vanilla, cinnamon", "Pour over caramel", "Water bath", "Bake at 350°F for 40-45 minutes", "Cool and chill"], "notes": "Cinnamon adds Ecuadorian touch", "fun_fact": "Flan is favorite Ecuadorian dessert", "alternatives": ["Without cinnamon", "Individual flans", "Different spices"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "ecu-drink-morocho", "name": "Morocho (Corn Drink)", "difficulty": "Easy", "servings": 4, "prepTime": 10, "cookTime": 30, "description": "Ecuadorian sweet corn beverage", "seasonings": ["cinnamon", "vanilla"], "ingredients": ["2 cups corn flour", "4 cups water", "1/4 cup sugar", "1 tsp cinnamon", "1 tsp vanilla", "Milk (optional)"], "instructions": ["Mix corn flour with 1 cup water", "Heat remaining water", "Add corn mixture to hot water", "Stir constantly", "Add sugar, cinnamon, vanilla", "Cook 20 minutes", "Can add milk if desired", "Serve warm"], "notes": "Thick and creamy", "fun_fact": "Morocho is traditional Ecuadorian drink", "alternatives": ["Thinner consistency", "Without milk", "Different spices"]}
        ],
        "alcoholicDrinks": [
            {"id": "ecu-drink-chicha", "name": "Chicha (Corn Spirit)", "difficulty": "Hard", "servings": 4, "prepTime": 10, "cookTime": 0, "description": "Traditional Ecuadorian fermented corn drink", "seasonings": [], "ingredients": ["Fermented corn"], "instructions": ["Traditional fermented drink", "Various regional recipes", "Strong and complex flavor", "Often shared in ceremonies"], "notes": "Ancient beverage", "fun_fact": "Chicha is ancient Andean drink with ceremonial importance", "alternatives": ["Store-bought chicha", "Different regional version"]}
        ]
    },
    "Senegal": {
        "country": "Senegal",
        "region": "Africa",
        "breakfast": [
            {"id": "sen-break-thieboudienne", "name": "Thieboudienne Breakfast Rice", "difficulty": "Hard", "servings": 6, "prepTime": 20, "cookTime": 60, "description": "Senegalese breakfast rice dish", "seasonings": ["bay leaf", "thyme"], "ingredients": ["3 cups rice", "1.5 lbs fish", "2 onions", "3 carrots", "1 turnip", "1 small cabbage", "2 tbsp tomato paste", "4 cups broth", "Oil", "Bay leaf", "Salt", "Pepper"], "instructions": ["Brown fish in oil", "Sauté onion", "Add tomato paste", "Add broth with bay leaf", "Cook vegetables partially", "Add rice", "Simmer until rice is tender", "Fish should be cooked through", "Serve hot"], "notes": "Complex and flavorful", "fun_fact": "Thieboudienne is Senegal's national dish", "alternatives": ["Chicken instead of fish", "Fewer vegetables", "White rice"]}
        ],
        "lunch": [
            {"id": "sen-lunch-yassa", "name": "Chicken Yassa", "difficulty": "Medium", "servings": 4, "prepTime": 20, "cookTime": 45, "description": "Senegalese marinated chicken with onions", "seasonings": ["lemon", "mustard"], "ingredients": ["2 lbs chicken", "6 onions, sliced", "4 cloves garlic", "1/4 cup lemon juice", "2 tbsp Dijon mustard", "2 tbsp oil", "Hot peppers", "Bay leaf", "Salt", "Pepper"], "instructions": ["Marinate chicken in lemon juice 20 minutes", "Heat oil, brown chicken", "Sauté onions separately", "Add garlic and mustard to onions", "Layer chicken and onions", "Add bay leaf and peppers", "Cover and simmer 30 minutes", "Chicken should be tender"], "notes": "Very lemony", "fun_fact": "Yassa is popular Senegalese dish", "alternatives": ["Fish instead of chicken", "More or less lemon", "Less spicy"]}
        ],
        "dinner": [
            {"id": "sen-dinner-mafe", "name": "Mafe (Peanut Butter Stew)", "difficulty": "Medium", "servings": 6, "prepTime": 15, "cookTime": 50, "description": "Senegalese peanut butter beef stew", "seasonings": ["garlic", "cumin"], "ingredients": ["2 lbs beef", "3/4 cup peanut butter", "1 onion", "4 cloves garlic", "2 tbsp tomato paste", "4 cups broth", "3 potatoes", "2 carrots", "Oil", "Salt", "Pepper"], "instructions": ["Brown beef in oil", "Sauté onion and garlic", "Add tomato paste, cook 2 minutes", "Add broth", "Mix in peanut butter", "Add potatoes and carrots", "Simmer 40 minutes", "Vegetables should be tender", "Season with salt and pepper"], "notes": "Rich and hearty", "fun_fact": "Mafe is Senegalese comfort food", "alternatives": ["Chicken instead of beef", "Less peanut butter", "Add spinach"]}
        ],
        "snacks": [
            {"id": "sen-snack-accras", "name": "Accras (Fried Fritters)", "difficulty": "Medium", "servings": 12, "prepTime": 15, "cookTime": 20, "description": "Senegalese fried vegetable fritters", "seasonings": ["cumin", "garlic"], "ingredients": ["2 cups flour", "2 eggs", "1 cup water", "1 onion, minced", "3 cloves garlic", "1 tsp cumin", "Oil for frying", "Salt", "Pepper"], "instructions": ["Mix flour and water to make batter", "Add eggs, onion, garlic, cumin", "Season with salt and pepper", "Heat oil to 350°F", "Drop spoonfuls into oil", "Fry until golden on both sides", "Drain on paper towels", "Serve with sauce"], "notes": "Should be crispy", "fun_fact": "Accras are popular Senegalese snack", "alternatives": ["Different vegetables", "Shrimp version", "Baked version"]}
        ],
        "desserts": [
            {"id": "sen-dessert-cake-fruits", "name": "Senegalese Fruit Cake", "difficulty": "Medium", "servings": 12, "prepTime": 20, "cookTime": 45, "description": "Dense cake with tropical fruits", "seasonings": ["vanilla"], "ingredients": ["2 cups flour", "1 cup sugar", "1/2 cup butter", "3 eggs", "1 tsp baking powder", "1 tsp vanilla", "1 cup mixed fruit (pineapple, banana, papaya)", "1/4 cup rum (optional)"], "instructions": ["Cream butter and sugar", "Add eggs one at a time", "Mix flour and baking powder", "Combine wet and dry", "Add vanilla and fruit", "Pour into greased pan", "Bake at 350°F for 40-45 minutes", "Cool before serving"], "notes": "Moist and fruity", "fun_fact": "Fruit cakes are popular in Senegal", "alternatives": ["Without rum", "Different fruits", "Chocolate version"]}
        ],
        "nonAlcoholicDrinks": [
            {"id": "sen-drink-bissap", "name": "Bissap (Hibiscus Drink)", "difficulty": "Easy", "servings": 4, "prepTime": 5, "cookTime": 20, "description": "Senegalese hibiscus flower drink", "seasonings": ["ginger"], "ingredients": ["2 cups dried hibiscus petals", "6 cups water", "1/4 cup sugar", "1-inch ginger", "Lemon juice", "Ice"], "instructions": ["Boil water with ginger", "Add hibiscus petals", "Simmer 15 minutes", "Strain through fine sieve", "Add sugar and lemon juice", "Chill thoroughly", "Serve over ice"], "notes": "Beautiful red color", "fun_fact": "Bissap is popular Senegalese drink", "alternatives": ["More or less sugar", "Add mint", "Different spices"]}
        ],
        "alcoholicDrinks": [
            {"id": "sen-drink-palm-wine", "name": "Palm Wine", "difficulty": "Easy", "servings": 1, "prepTime": 0, "cookTime": 0, "description": "Traditional Senegalese palm wine", "seasonings": [], "ingredients": ["Palm wine"], "instructions": ["Serve at room temperature or chilled", "Slightly sweet and fermented", "Often shared socially"], "notes": "Fresh ferments quickly", "fun_fact": "Palm wine is traditional Senegalese drink", "alternatives": ["Aged version", "Different preparation", "Regional variation"]}
        ]
    }
}

def expand_phase_6_batch_3():
    os.makedirs('data/phase6-recipes', exist_ok=True)
    for country, data in PHASE_6_BATCH_3.items():
        filename = f"data/phase6-recipes/{country.lower()}-phase6-authentic.json"
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        recipes = sum(len(data.get(cat, []))
                     for cat in ['breakfast', 'lunch', 'dinner', 'snacks',
                                'desserts', 'nonAlcoholicDrinks', 'alcoholicDrinks'])
        print(f"✓ {country:<15} | {recipes} recipes")

if __name__ == "__main__":
    print("\n🌍 PHASE 6 BATCH 3: Americas & Africa")
    print("="*80 + "\n")
    expand_phase_6_batch_3()
    print("\n✓ Batch 3 complete!")
