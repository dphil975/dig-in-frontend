from flask import Flask, request, jsonify
from flask_cors import CORS
from pantry_ai import PantryScanner
from substitution_engine import SubstitutionEngine
from recipe_rolodex import RecipeRolodex
from grocery_locator import GroceryLocator
from time_manager import CookingTimer
from data_monetization import DataMonetization

app = Flask(__name__)
CORS(app)

# Initialize modules
pantry_scanner = PantryScanner()
substitution_engine = SubstitutionEngine()
recipe_rolodex = RecipeRolodex()
grocery_locator = GroceryLocator()
cooking_timer = CookingTimer()
data_monetization = DataMonetization()

# ============= PANTRY ENDPOINTS =============
@app.route('/api/scan_pantry', methods=['POST'])
def scan_pantry():
    """User uploads photo of pantry or types ingredients"""
    data = request.json
    
    if 'image' in data:
        detected = pantry_scanner.scan_image(data['image'])
    else:
        detected = data.get('ingredients', [])
    
    recipes = pantry_scanner.generate_recipe_options(detected)
    
    return jsonify({
        "ingredients_detected": detected,
        "recipes": recipes,
        "message": f"Found {len(recipes)} recipes you can make!"
    })

# ============= SUBSTITUTION ENDPOINTS =============
@app.route('/api/substitute', methods=['POST'])
def substitute():
    """Find substitution for missing ingredient"""
    data = request.json
    missing = data['missing_ingredient']
    available = data['available_ingredients']
    
    result = substitution_engine.suggest_substitution(missing, available)
    return jsonify(result)

# ============= RECIPE ENDPOINTS =============
@app.route('/api/spin_rolodex', methods=['GET'])
def spin_rolodex():
    """Random recipe discovery"""
    filters = request.args.to_dict()
    recipes = recipe_rolodex.spin_rolodex(filters)
    return jsonify(recipes)

@app.route('/api/recipe/<name>', methods=['GET'])
def get_recipe(name):
    """Get full recipe with flashcards"""
    recipe = recipe_rolodex.get_recipe_card(name)
    if recipe:
        timeline = cooking_timer.create_timeline(recipe['recipe'])
        recipe['timeline'] = timeline
    return jsonify(recipe)

@app.route('/api/search_recipe', methods=['GET'])
def search_recipe():
    """Search recipes by ingredient or name"""
    query = request.args.get('q', '')
    if ',' in query:
        ingredients = [i.strip() for i in query.split(',')]
        results = []
        for ing in ingredients:
            results.extend(recipe_rolodex.search_by_ingredient(ing))
        return jsonify(results[:20])
    else:
        return jsonify([])

# ============= GROCERY ENDPOINTS =============
@app.route('/api/nearby_stores', methods=['POST'])
def nearby_stores():
    """Find stores near user"""
    data = request.json
    lat = data.get('latitude')
    lng = data.get('longitude')
    
    stores = grocery_locator.find_nearby_stores(lat, lng)
    return jsonify(stores)

@app.route('/api/shopping_list', methods=['POST'])
def shopping_list():
    """Create optimized shopping list"""
    data = request.json
    recipe_ingredients = data['ingredients']
    location = data['location']
    
    shopping_plan = grocery_locator.create_shopping_list(recipe_ingredients, location)
    time_estimate = cooking_timer.get_shopping_time_estimate([i for plan in shopping_plan for i in plan.get('items', [])])
    
    return jsonify({
        "shopping_plan": shopping_plan,
        "estimated_time_minutes": time_estimate
    })

# ============= COOKING ENDPOINTS =============
@app.route('/api/timeline', methods=['POST'])
def timeline():
    """Get cooking timeline for a recipe"""
    data = request.json
    recipe_name = data['recipe_name']
    recipe = recipe_rolodex.get_recipe_card(recipe_name)
    
    if recipe:
        timeline = cooking_timer.create_timeline(recipe['recipe'])
        return jsonify(timeline)
    return jsonify({"error": "Recipe not found"})

@app.route('/api/start_timer', methods=['POST'])
def start_timer():
    """Start a cooking timer"""
    data = request.json
    result = cooking_timer.start_timer(
        data['duration_seconds'],
        data['step_name'],
        None
    )
    return jsonify(result)

# ============= DATA MONETIZATION ENDPOINTS =============
@app.route('/api/record_cooking', methods=['POST'])
def record_cooking():
    """Record user cooking data (anonymized)"""
    data = request.json
    result = data_monetization.collect_anonymous_data(
        data.get('user_id'),
        data.get('shopping_data', {}),
        data.get('recipe_data', {}),
        data.get('location', {})
    )
    return jsonify(result)

@app.route('/api/trending_insights', methods=['GET'])
def trending_insights():
    """Get trending ingredient data (for stores/brands)"""
    api_key = request.headers.get('X-API-Key')
    if api_key != "premium_api_key_here":
        return jsonify({"error": "Unauthorized"}), 401
    
    insights = data_monetization.get_trending_insights()
    return jsonify(insights)

# ============= HEALTH ENDPOINT =============
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "Dig In is ready!", "version": "1.0.0"})

if __name__ == '__main__':
    print("🍳 Dig In: Pantry to Plate API")
    print("📍 http://localhost:5002")
    print("📡 Ready to cook!")
    app.run(port=5002, debug=True)