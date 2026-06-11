// dig-in/data/recipes.js

export const recipeDatabase = {
    // ============================================
    // SIGNATURE SALADS — Complete with Full Ingredients
    // ============================================
    salads: [
      {
        id: "salad_001",
        name: "Guacamole Greens",
        category: "salad",
        servingSize: "427g",
        calories: 515,
        protein: 27,
        carbs: 27,
        fat: 31,
        fiber: 14,
        sugar: 3,
        sodium: 334,
        cholesterol: 58,
        priceRange: "$",
        prepTime: 10,
        popularity: 94,
        base: ["organic mixed greens", "chopped romaine"],
        toppings: ["guacamole", "roasted chicken", "tomatoes", "red onions", "cilantro"],
        dressing: "lime cilantro jalapeño vinaigrette",
        fullIngredients: [
          "organic mixed greens",
          "chopped romaine",
          "guacamole (avocado, lime juice, red onion, cilantro, salt)",
          "roasted chicken (chicken thighs, extra virgin olive oil, umami seasoning, blackened seasoning)",
          "grape tomatoes",
          "red onions",
          "cilantro",
          "lime cilantro jalapeño vinaigrette"
        ],
        dietary: ["gf"],
        allergens: []
      },
      {
        id: "salad_002",
        name: "Kale Caesar",
        category: "salad",
        servingSize: "319g",
        calories: 405,
        protein: 35,
        carbs: 13,
        fat: 24,
        fiber: 5,
        sugar: 3,
        sodium: 1244,
        cholesterol: 93,
        priceRange: "$",
        prepTime: 8,
        popularity: 88,
        base: ["chopped kale"],
        toppings: ["shaved parmesan", "parmesan crisps", "lemon wedge"],
        dressing: "caesar dressing",
        fullIngredients: [
          "chopped kale",
          "shaved parmesan cheese (pasteurized skim cow's milk, cheese cultures, salt, rennet)",
          "parmesan crisps",
          "lemon wedge",
          "caesar dressing (canola oil, parmesan cheese, egg yolk, dijon mustard, anchovies, garlic, lemon juice, white wine vinegar, salt, black pepper)"
        ],
        dietary: [],
        allergens: ["dairy", "eggs", "fish"]
      },
      {
        id: "salad_003",
        name: "BBQ Chicken Salad",
        category: "salad",
        servingSize: "381g",
        calories: 480,
        protein: 27,
        carbs: 31,
        fat: 25,
        fiber: 9,
        sugar: 15,
        sodium: 904,
        cholesterol: 109,
        priceRange: "$$",
        prepTime: 12,
        popularity: 91,
        base: ["chopped romaine", "organic mixed greens"],
        toppings: ["bbq chicken", "grape tomatoes", "sweet corn", "black beans", "crispy onions", "cilantro"],
        dressing: "honey bbq sauce",
        fullIngredients: [
          "chopped romaine",
          "organic mixed greens",
          "bbq chicken (chicken, honey bbq sauce, blackened seasoning)",
          "grape tomatoes",
          "roasted sweet corn",
          "black beans (black beans, water, salt, calcium chloride)",
          "crispy onions (onions, palm oil, wheat flour, salt)",
          "cilantro",
          "honey bbq sauce (tomato concentrate, honey, distilled vinegar, natural hickory smoke, salt, spices)"
        ],
        dietary: [],
        allergens: ["gluten"]
      },
      {
        id: "salad_004",
        name: "Italian Chopped",
        category: "salad",
        servingSize: "365g",
        calories: 390,
        protein: 17,
        carbs: 20,
        fat: 28,
        fiber: 6,
        sugar: 4,
        sodium: 1919,
        cholesterol: 25,
        priceRange: "$$",
        prepTime: 10,
        popularity: 85,
        base: ["chopped romaine"],
        toppings: ["salami", "sopressata", "roasted chicken", "grape tomatoes", "green olives", "red onions", "parmesan"],
        dressing: "balsamic vinaigrette",
        fullIngredients: [
          "chopped romaine",
          "salami (pork, salt, spices, wine, garlic)",
          "sopressata (pork, salt, spices, wine)",
          "roasted chicken (chicken, extra virgin olive oil, blackened seasoning)",
          "grape tomatoes",
          "green olives (olives, water, salt, lactic acid)",
          "red onions",
          "parmesan cheese",
          "balsamic vinaigrette (balsamic vinegar, extra virgin olive oil, dijon mustard, honey, salt, black pepper)"
        ],
        dietary: [],
        allergens: ["dairy", "pork"]
      },
      {
        id: "salad_005",
        name: "Hummus Crunch Salad",
        category: "salad",
        servingSize: "421g",
        calories: 380,
        protein: 13,
        carbs: 38,
        fat: 21,
        fiber: 7,
        sugar: 4,
        sodium: 1041,
        cholesterol: 0,
        priceRange: "$",
        prepTime: 8,
        popularity: 87,
        base: ["chopped romaine", "organic mixed greens"],
        toppings: ["hummus", "cucumbers", "grape tomatoes", "red onions", "focaccia croutons", "parsley"],
        dressing: "lemon tahini",
        fullIngredients: [
          "chopped romaine",
          "organic mixed greens",
          "hummus (chickpeas, tahini, lemon juice, garlic, salt, extra virgin olive oil)",
          "cucumbers",
          "grape tomatoes",
          "red onions",
          "focaccia croutons (focaccia bread, extra virgin olive oil, salt, rosemary)",
          "parsley",
          "lemon tahini (tahini, lemon juice, garlic, water, salt)"
        ],
        dietary: ["v"],
        allergens: ["sesame", "gluten"]
      }
    ],
  
    // ============================================
    // SIGNATURE BOWLS — Complete with Full Ingredients
    // ============================================
    bowls: [
      {
        id: "bowl_001",
        name: "Harvest Bowl",
        category: "bowl",
        servingSize: "362g",
        calories: 685,
        protein: 37,
        carbs: 62,
        fat: 32,
        fiber: 9,
        sugar: 15,
        sodium: 1090,
        cholesterol: 73,
        priceRange: "$$",
        prepTime: 12,
        popularity: 96,
        base: ["wild rice blend", "chopped kale"],
        toppings: ["roasted chicken", "roasted sweet potatoes", "crispy apples", "goat cheese", "toasted almonds"],
        dressing: "balsamic vinaigrette",
        fullIngredients: [
          "wild rice blend (wild rice, brown rice, white rice)",
          "chopped kale",
          "roasted chicken (chicken thighs, extra virgin olive oil, blackened seasoning)",
          "roasted sweet potatoes (sweet potatoes, extra virgin olive oil, salt, black pepper)",
          "crispy apples (honeycrisp apples, lemon juice)",
          "goat cheese (pasteurized goat milk, salt, cheese cultures, rennet)",
          "toasted almonds",
          "balsamic vinaigrette (balsamic vinegar, extra virgin olive oil, dijon mustard, honey, salt, black pepper)"
        ],
        dietary: [],
        allergens: ["dairy", "tree nuts"]
      },
      {
        id: "bowl_002",
        name: "Chicken Pesto Parm",
        category: "bowl",
        servingSize: "395g",
        calories: 495,
        protein: 36,
        carbs: 41,
        fat: 21,
        fiber: 8,
        sugar: 4,
        sodium: 1410,
        cholesterol: 58,
        priceRange: "$$",
        prepTime: 10,
        popularity: 89,
        base: ["herbed quinoa"],
        toppings: ["roasted chicken", "grape tomatoes", "parmesan cheese", "basil"],
        dressing: "pesto vinaigrette",
        fullIngredients: [
          "herbed quinoa (white quinoa, basil, parsley, salt, extra virgin olive oil)",
          "roasted chicken (chicken, blackened seasoning)",
          "grape tomatoes",
          "parmesan cheese (pasteurized skim cow's milk, salt, cheese cultures, rennet)",
          "fresh basil",
          "pesto vinaigrette (basil, parmesan, garlic, pine nuts, extra virgin olive oil, white wine vinegar, salt)"
        ],
        dietary: [],
        allergens: ["dairy", "tree nuts"]
      },
      {
        id: "bowl_003",
        name: "Shroomami",
        category: "bowl",
        servingSize: "398g",
        calories: 600,
        protein: 21,
        carbs: 49,
        fat: 35,
        fiber: 11,
        sugar: 5,
        sodium: 1118,
        cholesterol: 0,
        priceRange: "$$",
        prepTime: 10,
        popularity: 90,
        base: ["brown rice", "chopped kale"],
        toppings: ["warm portobello mix", "tofu", "cucumbers", "avocado", "sesame seeds", "nori"],
        dressing: "miso sesame ginger",
        fullIngredients: [
          "brown rice",
          "chopped kale",
          "warm portobello mix (portobello mushrooms, button mushrooms, tamari, sesame oil, garlic)",
          "roasted tofu (tofu, tamari, cornstarch)",
          "cucumbers",
          "avocado",
          "toasted sesame seeds",
          "nori (dried seaweed)",
          "miso sesame ginger dressing (white miso paste, rice vinegar, sesame oil, ginger, garlic, maple syrup, water)"
        ],
        dietary: ["v"],
        allergens: ["sesame", "soy"]
      },
      {
        id: "bowl_004",
        name: "Crispy Rice Bowl",
        category: "bowl",
        servingSize: "405g",
        calories: 600,
        protein: 31,
        carbs: 61,
        fat: 26,
        fiber: 9,
        sugar: 7,
        sodium: 979,
        cholesterol: 99,
        priceRange: "$$",
        prepTime: 12,
        popularity: 92,
        base: ["crispy rice"],
        toppings: ["roasted chicken", "avocado", "grape tomatoes", "cucumbers", "red onions", "cilantro"],
        dressing: "spicy cashew",
        fullIngredients: [
          "crispy rice (white rice, canola oil, salt)",
          "roasted chicken (chicken, blackened seasoning)",
          "avocado",
          "grape tomatoes",
          "cucumbers",
          "red onions",
          "cilantro",
          "spicy cashew dressing (cashews, water, red chili peppers, lime juice, garlic, salt, maple syrup)"
        ],
        dietary: [],
        allergens: ["tree nuts"]
      },
      {
        id: "bowl_005",
        name: "Chicken Avocado Ranch",
        category: "bowl",
        servingSize: "450g",
        calories: 695,
        protein: 29,
        carbs: 58,
        fat: 39,
        fiber: 15,
        sugar: 8,
        sodium: 1036,
        cholesterol: 109,
        priceRange: "$$",
        prepTime: 10,
        popularity: 93,
        base: ["chopped romaine", "herbed quinoa"],
        toppings: ["roasted chicken", "avocado", "grape tomatoes", "red onions", "corn"],
        dressing: "green goddess ranch",
        fullIngredients: [
          "chopped romaine",
          "herbed quinoa (white quinoa, basil, parsley, salt, extra virgin olive oil)",
          "roasted chicken (chicken, blackened seasoning)",
          "avocado",
          "grape tomatoes",
          "red onions",
          "roasted sweet corn",
          "green goddess ranch (plain yogurt, sour cream, mayonnaise, herbs, lemon juice, garlic, salt)"
        ],
        dietary: [],
        allergens: ["dairy", "eggs"]
      }
    ],
  
    // ============================================
    // SIGNATURE PLATES — Complete with Full Ingredients
    // ============================================
    plates: [
      {
        id: "plate_001",
        name: "Hot Honey Chicken",
        category: "plate",
        servingSize: "498g",
        calories: 855,
        protein: 49,
        carbs: 73,
        fat: 39,
        fiber: 9,
        sugar: 11,
        sodium: 2090,
        cholesterol: 170,
        priceRange: "$$$",
        prepTime: 15,
        popularity: 95,
        base: ["roasted sweet potatoes", "roasted broccoli"],
        protein: ["hot honey chicken breast"],
        toppings: ["crispy onions"],
        dressing: "hot honey mustard",
        fullIngredients: [
          "roasted sweet potatoes (sweet potatoes, extra virgin olive oil, salt, black pepper)",
          "roasted broccoli (broccoli, extra virgin olive oil, salt, black pepper)",
          "hot honey chicken (chicken breast, hot honey sauce, blackened seasoning)",
          "crispy onions (onions, palm oil, wheat flour, salt)",
          "hot honey mustard (honey, dijon mustard, hot sauce, apple cider vinegar)"
        ],
        dietary: [],
        allergens: ["gluten", "mustard"]
      },
      {
        id: "plate_002",
        name: "Southwest Chicken Fajita",
        category: "plate",
        servingSize: "534g",
        calories: 830,
        protein: 47,
        carbs: 83,
        fat: 34,
        fiber: 9,
        sugar: 6,
        sodium: 1455,
        cholesterol: 180,
        priceRange: "$$$",
        prepTime: 15,
        popularity: 88,
        base: ["wild rice blend", "roasted corn", "black beans"],
        protein: ["southwest chicken"],
        toppings: ["peppers", "onions", "avocado", "cilantro", "lime"],
        dressing: "chipotle crema",
        fullIngredients: [
          "wild rice blend (wild rice, brown rice, white rice)",
          "roasted sweet corn",
          "black beans (black beans, water, salt, calcium chloride)",
          "southwest chicken (chicken, chipotle powder, cumin, garlic, lime juice)",
          "roasted bell peppers",
          "roasted red onions",
          "avocado",
          "cilantro",
          "lime wedge",
          "chipotle crema (sour cream, chipotle peppers, lime juice, garlic, salt)"
        ],
        dietary: [],
        allergens: ["dairy"]
      },
      {
        id: "plate_003",
        name: "Miso Glazed Salmon",
        category: "plate",
        servingSize: "529g",
        calories: 860,
        protein: 33,
        carbs: 88,
        fat: 42,
        fiber: 12,
        sugar: 17,
        sodium: 1272,
        cholesterol: 60,
        priceRange: "$$$",
        prepTime: 18,
        popularity: 94,
        base: ["brown rice", "roasted broccoli"],
        protein: ["miso glazed salmon"],
        toppings: ["nori furikake", "pickled red onions", "sesame seeds"],
        dressing: "miso sesame ginger",
        fullIngredients: [
          "brown rice",
          "roasted broccoli (broccoli, extra virgin olive oil, salt, black pepper)",
          "miso glazed salmon (salmon, white miso, mirin, sake, brown sugar, tamari)",
          "nori furikake (nori seaweed, sesame seeds, salt, sugar)",
          "pickled red onions (red onions, apple cider vinegar, salt, sugar)",
          "toasted sesame seeds",
          "miso sesame ginger dressing (white miso paste, rice vinegar, sesame oil, ginger, garlic, maple syrup, water)"
        ],
        dietary: [],
        allergens: ["fish", "sesame", "soy"]
      }
    ],
  
    // ============================================
    // SIGNATURE SIDES — Complete with Full Ingredients
    // ============================================
    sides: [
      {
        id: "side_001",
        name: "Roasted Sweet Potatoes + Green Goddess Ranch",
        category: "side",
        servingSize: "174g",
        calories: 315,
        protein: 5,
        carbs: 30,
        fat: 20,
        fiber: 5,
        sugar: 5,
        sodium: 739,
        cholesterol: 10,
        priceRange: "$",
        prepTime: 5,
        popularity: 92,
        fullIngredients: [
          "roasted sweet potatoes (sweet potatoes, extra virgin olive oil, salt, black pepper)",
          "green goddess ranch (plain yogurt, sour cream, mayonnaise, herbs, lemon juice, garlic, salt)"
        ],
        dietary: [],
        allergens: ["dairy", "eggs"]
      },
      {
        id: "side_002",
        name: "Rosemary Focaccia",
        category: "side",
        servingSize: "94g",
        calories: 230,
        protein: 8,
        carbs: 34,
        fat: 7,
        fiber: 0,
        sugar: 0,
        sodium: 530,
        cholesterol: 0,
        priceRange: "$",
        prepTime: 2,
        popularity: 96,
        fullIngredients: [
          "focaccia bread (wheat flour, water, extra virgin olive oil, salt, yeast, rosemary)",
          "extra virgin olive oil",
          "rosemary"
        ],
        dietary: ["v"],
        allergens: ["gluten"]
      },
      {
        id: "side_003",
        name: "Hummus + Focaccia",
        category: "side",
        servingSize: "131g",
        calories: 290,
        protein: 10,
        carbs: 37,
        fat: 11,
        fiber: 0,
        sugar: 0,
        sodium: 660,
        cholesterol: 0,
        priceRange: "$",
        prepTime: 2,
        popularity: 88,
        fullIngredients: [
          "hummus (chickpeas, tahini, lemon juice, garlic, salt, extra virgin olive oil)",
          "focaccia bread (wheat flour, water, extra virgin olive oil, salt, yeast)"
        ],
        dietary: ["v"],
        allergens: ["gluten", "sesame"]
      }
    ],
  
    // ============================================
    // DRESSINGS — Complete with Full Ingredients
    // ============================================
    dressings: [
      {
        id: "dressing_001",
        name: "Balsamic Vinaigrette",
        calories: 90,
        dietary: ["v"],
        fullIngredients: [
          "balsamic vinegar",
          "extra virgin olive oil",
          "dijon mustard",
          "honey",
          "salt",
          "black pepper"
        ]
      },
      {
        id: "dressing_002",
        name: "Caesar Dressing",
        calories: 120,
        dietary: [],
        fullIngredients: [
          "canola oil",
          "parmesan cheese",
          "egg yolk",
          "dijon mustard",
          "anchovies",
          "garlic",
          "lemon juice",
          "white wine vinegar",
          "salt",
          "black pepper"
        ],
        allergens: ["eggs", "dairy", "fish"]
      },
      {
        id: "dressing_003",
        name: "Chipotle Crema",
        calories: 100,
        dietary: [],
        fullIngredients: [
          "sour cream",
          "chipotle peppers",
          "lime juice",
          "garlic",
          "salt"
        ],
        allergens: ["dairy"]
      },
      {
        id: "dressing_004",
        name: "Green Goddess Ranch",
        calories: 110,
        dietary: [],
        fullIngredients: [
          "plain yogurt",
          "sour cream",
          "mayonnaise",
          "herbs (parsley, chives, dill)",
          "lemon juice",
          "garlic",
          "salt"
        ],
        allergens: ["dairy", "eggs"]
      },
      {
        id: "dressing_005",
        name: "Hot Honey Mustard",
        calories: 95,
        dietary: [],
        fullIngredients: [
          "honey",
          "dijon mustard",
          "hot sauce",
          "apple cider vinegar"
        ],
        allergens: ["mustard"]
      },
      {
        id: "dressing_006",
        name: "Miso Sesame Ginger",
        calories: 85,
        dietary: ["v"],
        fullIngredients: [
          "white miso paste",
          "rice vinegar",
          "sesame oil",
          "ginger",
          "garlic",
          "maple syrup",
          "water"
        ],
        allergens: ["sesame", "soy"]
      },
      {
        id: "dressing_007",
        name: "Spicy Cashew",
        calories: 130,
        dietary: ["v"],
        fullIngredients: [
          "cashews",
          "water",
          "red chili peppers",
          "lime juice",
          "garlic",
          "salt",
          "maple syrup"
        ],
        allergens: ["tree nuts"]
      },
      {
        id: "dressing_008",
        name: "Pesto Vinaigrette",
        calories: 105,
        dietary: ["v"],
        fullIngredients: [
          "basil",
          "parmesan cheese",
          "garlic",
          "pine nuts",
          "extra virgin olive oil",
          "white wine vinegar",
          "salt"
        ],
        allergens: ["dairy", "tree nuts"]
      },
      {
        id: "dressing_009",
        name: "Lime Cilantro Jalapeño Vinaigrette",
        calories: 60,
        dietary: ["v"],
        fullIngredients: [
          "lime juice",
          "cilantro",
          "jalapeño",
          "extra virgin olive oil",
          "apple cider vinegar",
          "honey",
          "salt"
        ]
      },
      {
        id: "dressing_010",
        name: "Lemon Tahini",
        calories: 95,
        dietary: ["v"],
        fullIngredients: [
          "tahini (sesame paste)",
          "lemon juice",
          "garlic",
          "water",
          "salt"
        ],
        allergens: ["sesame"]
      },
      {
        id: "dressing_011",
        name: "Honey BBQ Sauce",
        calories: 80,
        dietary: [],
        fullIngredients: [
          "tomato concentrate",
          "honey",
          "distilled vinegar",
          "natural hickory smoke",
          "salt",
          "spices"
        ]
      }
    ],
  
    // ============================================
    // PROTEINS — Complete with Full Ingredients
    // ============================================
    proteins: [
      {
        id: "protein_001",
        name: "Roasted Chicken",
        calories: 140,
        protein: 22,
        fat: 5,
        fullIngredients: [
          "chicken thighs",
          "extra virgin olive oil",
          "blackened seasoning (paprika, garlic powder, onion powder, cayenne, oregano, thyme, salt, black pepper)"
        ]
      },
      {
        id: "protein_002",
        name: "Blackened Chicken",
        calories: 150,
        protein: 24,
        fat: 5,
        fullIngredients: [
          "chicken",
          "blackened seasoning"
        ]
      },
      {
        id: "protein_003",
        name: "Miso Glazed Salmon",
        calories: 280,
        protein: 25,
        fat: 18,
        fullIngredients: [
          "salmon",
          "white miso paste",
          "mirin",
          "sake",
          "brown sugar",
          "tamari"
        ],
        allergens: ["fish", "soy"]
      },
      {
        id: "protein_004",
        name: "Roasted Tofu",
        calories: 120,
        protein: 12,
        fat: 7,
        dietary: ["v"],
        fullIngredients: [
          "tofu",
          "tamari",
          "cornstarch"
        ],
        allergens: ["soy"]
      }
    ],
  
    // ============================================
    // BASES — Complete with Full Ingredients
    // ============================================
    bases: [
      {
        id: "base_001",
        name: "Chopped Romaine",
        calories: 15,
        dietary: ["v", "gf"]
      },
      {
        id: "base_002",
        name: "Organic Mixed Greens",
        calories: 10,
        dietary: ["v", "gf"]
      },
      {
        id: "base_003",
        name: "Chopped Kale",
        calories: 20,
        dietary: ["v", "gf"]
      },
      {
        id: "base_004",
        name: "Brown Rice",
        calories: 110,
        dietary: ["v", "gf"]
      },
      {
        id: "base_005",
        name: "Wild Rice Blend",
        calories: 120,
        dietary: ["v", "gf"]
      },
      {
        id: "base_006",
        name: "Herbed Quinoa",
        calories: 130,
        dietary: ["v", "gf"],
        fullIngredients: ["white quinoa", "basil", "parsley", "salt", "extra virgin olive oil"]
      },
      {
        id: "base_007",
        name: "Crispy Rice",
        calories: 180,
        dietary: ["v"],
        fullIngredients: ["white rice", "canola oil", "salt"]
      }
    ],
  
    // ============================================
    // TOPPINGS — Complete with Full Ingredients
    // ============================================
    toppings: [
      {
        id: "topping_001",
        name: "Avocado",
        calories: 80,
        dietary: ["v", "gf"]
      },
      {
        id: "topping_002",
        name: "Grape Tomatoes",
        calories: 15,
        dietary: ["v", "gf"]
      },
      {
        id: "topping_003",
        name: "Red Onions",
        calories: 10,
        dietary: ["v", "gf"]
      },
      {
        id: "topping_004",
        name: "Roasted Sweet Potatoes",
        calories: 120,
        dietary: ["v", "gf"],
        fullIngredients: ["sweet potatoes", "extra virgin olive oil", "salt", "black pepper"]
      },
      {
        id: "topping_005",
        name: "Roasted Broccoli",
        calories: 45,
        dietary: ["v", "gf"],
        fullIngredients: ["broccoli", "extra virgin olive oil", "salt", "black pepper"]
      },
      {
        id: "topping_006",
        name: "Roasted Corn",
        calories: 60,
        dietary: ["v", "gf"]
      },
      {
        id: "topping_007",
        name: "Black Beans",
        calories: 70,
        dietary: ["v", "gf"],
        fullIngredients: ["black beans", "water", "salt", "calcium chloride"]
      },
      {
        id: "topping_008",
        name: "Cucumbers",
        calories: 5,
        dietary: ["v", "gf"]
      },
      {
        id: "topping_009",
        name: "Cilantro",
        calories: 0,
        dietary: ["v", "gf"]
      },
      {
        id: "topping_010",
        name: "Parmesan Cheese",
        calories: 40,
        dietary: [],
        fullIngredients: ["pasteurized skim cow's milk", "salt", "cheese cultures", "rennet"],
        allergens: ["dairy"]
      },
      {
        id: "topping_011",
        name: "Goat Cheese",
        calories: 70,
        dietary: [],
        fullIngredients: ["pasteurized goat milk", "salt", "cheese cultures", "rennet"],
        allergens: ["dairy"]
      },
      {
        id: "topping_012",
        name: "Crispy Onions",
        calories: 45,
        dietary: [],
        fullIngredients: ["onions", "palm oil", "wheat flour", "salt"],
        allergens: ["gluten"]
      },
      {
        id: "topping_013",
        name: "Toasted Almonds",
        calories: 70,
        dietary: ["v"],
        allergens: ["tree nuts"]
      },
      {
        id: "topping_014",
        name: "Sesame Seeds",
        calories: 35,
        dietary: ["v"],
        allergens: ["sesame"]
      },
      {
        id: "topping_015",
        name: "Nori Furikake",
        calories: 15,
        dietary: ["v"],
        fullIngredients: ["nori seaweed", "sesame seeds", "salt", "sugar"],
        allergens: ["sesame"]
      }
    ]
  };