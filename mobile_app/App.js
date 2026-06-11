import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Animated,
} from 'react-native';
import { Camera } from 'expo-camera';

// Pixel art components
const PixelIcon = ({ name, size = 24 }) => {
  const pixelStyles = {
    omurice: '🍳',
    gyudon: '🥩',
    cacio: '🍝',
    default: '🍲',
  };
  
  return (
    <Text style={{ fontSize: size, imageRendering: 'pixelated' }}>
      {pixelStyles[name] || pixelStyles.default}
    </Text>
  );
};
// app.js
const pixelRenderer = new PixelArtRenderer();
const pixelUI = new PixelUI();
const frogSprites = new PixelFrogSprites(pixelRenderer);

// Generate frog sprite for each pet
function renderFrogPet(pet) {
    const sprite = frogSprites.generateFrogSprite(pet.color, pet.personality);
    return sprite;
}
const DigInApp = () => {
  const [pantry, setPantry] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [rolodexRecipes, setRolodexRecipes] = useState([]);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [activeFlashcard, setActiveFlashcard] = useState(0);
  const [cookingTimer, setCookingTimer] = useState(null);
  
  // Scan pantry with camera
  const scanPantry = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      setShowCamera(true);
    }
  };
  
  // Add ingredients manually
  const addIngredient = (ingredient) => {
    setPantry([...pantry, ingredient]);
  };
  
  // Find recipes from pantry
  const findRecipes = async () => {
    const response = await fetch('http://localhost:5000/api/scan_pantry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients: pantry }),
    });
    const data = await response.json();
    setRecipes(data.recipes);
  };
  
  // Spin rolodex for random recipes
  const spinRolodex = async () => {
    const response = await fetch('http://localhost:5000/api/spin_rolodex');
    const data = await response.json();
    setRolodexRecipes(data);
  };
  
  // Get nearby grocery stores
  const getNearbyStores = async () => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const response = await fetch('http://localhost:5000/api/nearby_stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });
      const data = await response.json();
      setNearbyStores(data);
    });
  };
  
  // Interactive cooking flashcards
  const startCooking = (recipe) => {
    setSelectedRecipe(recipe);
    setActiveFlashcard(0);
  };
  
  const nextFlashcard = () => {
    if (activeFlashcard < selectedRecipe.flashcards.length - 1) {
      setActiveFlashcard(activeFlashcard + 1);
    } else {
      setSelectedRecipe(null); // Cooking complete!
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Header with pixel art */}
      <View style={styles.header}>
        <PixelIcon name="omurice" size={40} />
        <Text style={styles.title}>DIG IN</Text>
        <Text style={styles.subtitle}>Pantry to Plate</Text>
      </View>
      
      {/* Pantry Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🥫 WHAT'S IN YOUR PANTRY?</Text>
        <View style={styles.pantryRow}>
          <TouchableOpacity style={styles.cameraButton} onPress={scanPantry}>
            <Text>📸 Scan</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Add ingredient..."
            onSubmitEditing={(e) => addIngredient(e.nativeEvent.text)}
          />
        </View>
        
        <View style={styles.ingredientList}>
          {pantry.map((item, i) => (
            <View key={i} style={styles.ingredientTag}>
              <Text>{item}</Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity style={styles.findButton} onPress={findRecipes}>
          <Text style={styles.buttonText}>🔍 WHAT CAN I MAKE?</Text>
        </TouchableOpacity>
      </View>
      
      {/* Recipe Results */}
      {recipes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍽️ YOU CAN MAKE:</Text>
          <FlatList
            horizontal
            data={recipes}
            keyExtractor={(item) => item.recipe.name}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.recipeCard}
                onPress={() => startCooking(item.recipe)}
              >
                <PixelIcon name={item.recipe.name.toLowerCase()} size={32} />
                <Text style={styles.recipeName}>{item.recipe.name}</Text>
                <Text style={styles.matchText}>{Math.round(item.match)}% match</Text>
                {item.substitutions && Object.keys(item.substitutions).length > 0 && (
                  <Text style={styles.subText}>✨ {Object.keys(item.substitutions).length} substitutions</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}
      
      {/* Rolodex Section - Random Discovery */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎰 SPIN THE ROLODEX</Text>
        <TouchableOpacity style={styles.spinButton} onPress={spinRolodex}>
          <Text style={styles.spinText}>↻ SPIN</Text>
        </TouchableOpacity>
        
        <FlatList
          horizontal
          data={rolodexRecipes}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.rolodexCard}
              onPress={() => startCooking(item)}
            >
              <Text style={styles.cuisineTag}>{item.cuisine}</Text>
              <Text style={styles.recipeName}>{item.name}</Text>
              <Text style={styles.timeText}>⏱️ {item.time} min</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      
      {/* Nearby Stores Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 NEARBY STORES</Text>
        <TouchableOpacity style={styles.locationButton} onPress={getNearbyStores}>
          <Text>📍 Find Stores Near Me</Text>
        </TouchableOpacity>
        
        {nearbyStores.map((store, i) => (
          <View key={i} style={styles.storeCard}>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.storeAddress}>{store.address}</Text>
            <Text style={styles.storeDistance}>🚶 {store.walk_time} min walk</Text>
            {store.deals && store.deals[0] && (
              <Text style={styles.dealText}>💰 {store.deals[0]}</Text>
            )}
          </View>
        ))}
      </View>
      
      {/* Cooking Flashcards Modal */}
      <Modal visible={!!selectedRecipe} animationType="slide">
        {selectedRecipe && (
          <View style={styles.flashcardContainer}>
            <View style={styles.flashcardHeader}>
              <PixelIcon name={selectedRecipe.name.toLowerCase()} size={48} />
              <Text style={styles.flashcardTitle}>{selectedRecipe.name}</Text>
              <Text style={styles.stepCounter}>
                Step {activeFlashcard + 1} of {selectedRecipe.flashcards.length}
              </Text>
            </View>

            <View style={styles.flashcardBody}>
              <Text style={styles.stepInstruction}>
                {selectedRecipe.flashcards[activeFlashcard]}
              </Text>

              {/* Pixel animation placeholder */}
              <View style={styles.pixelAnimation}>
                <Text style={styles.pixelText}>
                  {'◼️◼️◼️\n◼️🍳◼️\n◼️◼️◼️'}
                </Text>
              </View>

              {cookingTimer && (
                <View style={styles.timerDisplay}>
                  <Text>⏰ {cookingTimer}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={nextFlashcard}>
              <Text style={styles.nextButtonText}>
                {activeFlashcard === selectedRecipe.flashcards.length - 1 ? '🎉 COMPLETE!' : '➡️ NEXT STEP'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </View>
  );
};
/**
 * Dig In - Main Application
 * Combines recipe book, restaurant finder, and recipe recreator
 */

// Load recipe database
const RECIPE_DATABASE = {
  smoothie_bowls: [],
  breakfast_bowls: [],
  grain_bowls: [],
  salad_bowls: [],
  soup_bowls: [],
  noodle_bowls: [],
  dessert_bowls: [],
  bowl_necessities: []
};

// Import all recipes (see recipes.json above)
async function loadRecipes() {
  const response = await fetch('/data/recipes.json');
  const data = await response.json();
  Object.assign(RECIPE_DATABASE, data);
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  await loadRecipes();
  
  // Initialize restaurant finder
  const restaurantFinder = new RestaurantFinder();
  
  // Setup category navigation
  setupCategoryNavigation();
  
  // Setup recipe cards
  renderRecipeCategories();
  
  // Setup pixel renderer
  const pixelRenderer = new PixelArtRenderer();
  
  // Setup event listeners for menu item recreation
  document.addEventListener('click', (e) => {
      if (e.target.classList.contains('recreate-btn')) {
          const menuItem = e.target.closest('.menu-item');
          if (menuItem) {
              const dishName = menuItem.querySelector('.dish-name')?.textContent;
              const dishDesc = menuItem.querySelector('.dish-desc')?.textContent;
              const restaurantCard = menuItem.closest('.restaurant-card');
              const restaurantName = restaurantCard?.querySelector('.restaurant-name')?.textContent;
              
              if (dishName && restaurantName) {
                  restaurantFinder.recreateRestaurantDish(dishName, dishDesc, restaurantName);
              }
          }
      }
  });
});

function setupCategoryNavigation() {
  const categories = document.querySelectorAll('.category-btn');
  categories.forEach(btn => {
      btn.addEventListener('click', () => {
          const category = btn.dataset.category;
          showCategory(category);
      });
  });
}

function renderRecipeCategories() {
  const container = document.getElementById('recipesContainer');
  if (!container) return;
  
  const categories = [
      { name: 'Smoothie Bowls', key: 'smoothie_bowls', icon: '🥤' },
      { name: 'Breakfast Bowls', key: 'breakfast_bowls', icon: '🍳' },
      { name: 'Grain Bowls', key: 'grain_bowls', icon: '🌾' },
      { name: 'Salad Bowls', key: 'salad_bowls', icon: '🥗' },
      { name: 'Soup Bowls', key: 'soup_bowls', icon: '🍲' },
      { name: 'Noodle Bowls', key: 'noodle_bowls', icon: '🍜' },
      { name: 'Dessert Bowls', key: 'dessert_bowls', icon: '🍰' }
  ];
  
  container.innerHTML = categories.map(cat => `
      <div class="recipe-category" data-category="${cat.key}">
          <h3 class="category-title">${cat.icon} ${cat.name}</h3>
          <div class="recipe-grid">
              ${RECIPE_DATABASE[cat.key]?.slice(0, 4).map(recipe => `
                  <div class="recipe-card-small pixel-card" data-recipe-id="${recipe.id}">
                      <div class="recipe-preview">
                          <div class="pixel-preview-icon">🍳</div>
                          <div class="recipe-name">${recipe.name}</div>
                          <div class="recipe-time">⏱️ ${recipe.prepTime + (recipe.cookTime || 0)} min</div>
                      </div>
                  </div>
              `).join('')}
          </div>
      </div>
  `).join('');
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Courier',
    color: '#FFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    marginBottom: 12,
    color: '#333',
  },
  pantryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cameraButton: {
    backgroundColor: '#DDD',
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  ingredientList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  ingredientTag: {
    backgroundColor: '#FFE0B5',
    padding: 6,
    borderRadius: 4,
    margin: 4,
  },
  findButton: {
    backgroundColor: '#FF6B6B',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  recipeCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  recipeName: {
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  matchText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
  },
  subText: {
    fontSize: 10,
    color: '#FF9800',
    marginTop: 4,
  },
  spinButton: {
    backgroundColor: '#9C27B0',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  spinText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  rolodexCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  cuisineTag: {
    fontSize: 10,
    color: '#9C27B0',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  locationButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  storeCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  storeName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  storeAddress: {
    fontSize: 12,
    color: '#666',
  },
  storeDistance: {
    fontSize: 11,
    color: '#4CAF50',
    marginTop: 4,
  },
  dealText: {
    fontSize: 11,
    color: '#FF9800',
    marginTop: 4,
  },
  flashcardContainer: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    padding: 24,
  },
  flashcardHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  flashcardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    marginTop: 8,
  },
  stepCounter: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  flashcardBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInstruction: {
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 32,
  },
  pixelAnimation: {
    backgroundColor: '#DDD',
    padding: 40,
    borderRadius: 8,
    marginBottom: 32,
  },
  pixelText: {
    fontFamily: 'monospace',
    fontSize: 24,
    lineHeight: 24,
  },
  timerDisplay: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DigInApp;