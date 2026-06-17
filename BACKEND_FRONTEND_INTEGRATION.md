# Backend-Frontend Integration Guide

## ✅ System Status

### Backend (API Server)
- **Server**: Node.js Express on `http://localhost:5000`
- **Recipes Loaded**: 26,022 recipes from 249 countries
- **Data Source**: Local JSON files (no MongoDB required)
- **File**: `api-server.js`

### Frontend (Web App)
- **Server**: Python HTTP server on `http://localhost:8000`
- **Files**: Recipe pages, recipe cards, interactive components
- **Connection**: Automatic fallback to API + local files

---

## 🚀 Running the System

### Step 1: Start the API Server
```bash
cd /Users/olivephillips/Dig\ In-Frontend
node api-server.js
```

Expected output:
```
✓ Loaded 26022 recipes from 249 countries
🍽️  DIG IN Recipe API Server
📍 Port: 5000
✓ Ready at http://localhost:5000
```

### Step 2: Start the Frontend Server
```bash
cd /Users/olivephillips/Dig\ In-Frontend
python3 -m http.server 8000
```

### Step 3: Open in Browser
- Main app: `http://localhost:8000`
- Recipe detail: `http://localhost:8000/recipe.html`
- Recipe final card: `http://localhost:8000/recipe-final.html`

---

## 📡 API Endpoints

### Health Check
```bash
GET http://localhost:5000/api/health
```

### Search Recipes
```bash
GET http://localhost:5000/api/recipes/search?q=chicken&limit=10
```

### Get Recipe by ID
```bash
GET http://localhost:5000/api/recipes/alg_lunch_001
```

### Get All Recipes
```bash
GET http://localhost:5000/api/recipes?country=Algeria&limit=10
```

### Get Countries
```bash
GET http://localhost:5000/api/countries
```

### Get Categories
```bash
GET http://localhost:5000/api/categories
```

### Get Stats
```bash
GET http://localhost:5000/api/stats
```

### Search by Name
```bash
GET http://localhost:5000/api/recipes/search?q=Couscous
```

---

## 🔌 Frontend Integration Points

### recipe.html - Recipe Detail Page
- **Loads from**: API (port 5000) or local cache
- **Fallback**: `data/recipes_full.json`
- **Parameters**: `?id=recipe-id` or `?name=recipe-name`

### recipe-final.html - Enhanced Recipe Card
- **Features**: 
  - Interactive tabs (Ingredients, Instructions, Adapt, Drinks)
  - Flip cards with cooking stages
  - Recipe adaptation options
  - Drink pairings
  - "What are you missing" indicator
- **Data**: Uses sample data (ready for API integration)

### recipe-card-2.html - Comparison Version
- Identical to recipe-final.html
- Available for design comparison/modifications

---

## 🔧 How It Works

1. **User loads recipe.html with recipe ID**
2. **JavaScript in recipe.html attempts:**
   - Session storage check
   - Backend API call to `http://localhost:5000/api/recipes/{id}`
   - Local file fallback to `data/recipes_full.json`
3. **Recipe data is rendered** with full interactivity
4. **API provides** search, filtering, trending, and stats

---

## 📊 Data Flow

```
Frontend (HTML/JS)
    ↓
    ├→ SessionStorage (quick cache)
    ├→ Backend API (port 5000)
    │   ↓
    │   ├→ Searches 26,022 recipes
    │   ├→ Filters by country/category
    │   ├→ Returns JSON results
    │   └→ Stored in allRecipes array
    │
    └→ Local JSON files (offline fallback)
        ↓
        └→ data/recipes_full.json
            └→ Aggregates all country recipes
```

---

## ✨ Features Working

✅ **Recipe Search** - Search by name, country, category
✅ **Recipe Detail** - Full recipe with steps, ingredients, notes
✅ **Interactive Cards** - Flip cards, carousels, tabs
✅ **Drink Pairings** - Suggests beverages with recipes
✅ **Recipe Adaptation** - Modify for protein, fiber, carbs, veggies
✅ **Missing Indicator** - Shows what ingredients you need
✅ **Navigation** - Working hamburger menu and dropdowns
✅ **Offline Support** - Works with local JSON fallback

---

## 🐛 Troubleshooting

### API not responding
```bash
# Check if server is running
curl http://localhost:5000/api/health

# Restart the server
kill %1  # Stop background job
node api-server.js
```

### Recipe page shows "not found"
```bash
# Verify recipes are loaded
curl http://localhost:5000/api/stats | jq '.stats.totalRecipes'

# Should show: 26022
```

### Frontend can't reach API
- Check CORS settings in `api-server.js`
- Ensure both servers are running
- Check firewall/network settings

---

## 📝 Environment

- **Node.js**: v22.13.1
- **Express**: Latest (installed via npm)
- **Data Format**: JSON (country-recipes.json files)
- **Frontend**: Vanilla HTML/CSS/JS
- **No Database Required**: Everything is file-based

---

## 🎯 Next Steps

1. **Modify recipe-card-2.html** with your preferred design changes
2. **Integrate drink data** from your drinks database
3. **Add user authentication** if needed
4. **Deploy to production** with real backend services

---

Last Updated: 2026-06-17
