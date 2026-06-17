/**
 * Simple Recipe API Server
 * Serves recipes from local JSON files without requiring MongoDB
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:8000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Load all recipe files
const dataDir = path.join(__dirname, 'data');
let allRecipes = [];
let recipesByCountry = {};

function loadRecipes() {
  try {
    // Load COMPLETE recipes first (Phase 1)
    const completeRecipesDir = path.join(dataDir, 'complete-recipes');
    let completeFiles = [];
    if (fs.existsSync(completeRecipesDir)) {
      completeFiles = fs.readdirSync(completeRecipesDir)
        .filter(f => f.endsWith('-complete-authentic.json'));

      completeFiles.forEach(file => {
        try {
          const filePath = path.join(completeRecipesDir, file);
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          if (content && content.country) {
            const country = content.country;
            const categories = ['breakfast', 'lunch', 'dinner', 'snacks', 'desserts', 'nonAlcoholicDrinks', 'alcoholicDrinks'];

            const countryRecipes = [];
            categories.forEach(cat => {
              if (Array.isArray(content[cat])) {
                content[cat].forEach(recipe => {
                  recipe.country = country;
                  recipe.category = cat;
                  recipe.region = content.region || 'Unknown';
                  countryRecipes.push(recipe);
                  allRecipes.push(recipe);
                });
              }
            });
            recipesByCountry[country] = countryRecipes;
          }
        } catch (e) {
          console.warn(`Warning: Error loading ${file}: ${e.message}`);
        }
      });
    }

    // Load PHASE 2 recipes
    const phase2Dir = path.join(dataDir, 'phase2-recipes');
    let phase2Files = [];
    if (fs.existsSync(phase2Dir)) {
      phase2Files = fs.readdirSync(phase2Dir)
        .filter(f => f.endsWith('-phase2-authentic.json'));

      phase2Files.forEach(file => {
        try {
          const filePath = path.join(phase2Dir, file);
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          if (content && content.country) {
            const country = content.country;
            const categories = ['breakfast', 'lunch', 'dinner', 'snacks', 'desserts', 'nonAlcoholicDrinks', 'alcoholicDrinks'];

            const countryRecipes = [];
            categories.forEach(cat => {
              if (Array.isArray(content[cat])) {
                content[cat].forEach(recipe => {
                  recipe.country = country;
                  recipe.category = cat;
                  recipe.region = content.region || 'Unknown';
                  countryRecipes.push(recipe);
                  allRecipes.push(recipe);
                });
              }
            });
            recipesByCountry[country] = countryRecipes;
          }
        } catch (e) {
          console.warn(`Warning: Error loading ${file}: ${e.message}`);
        }
      });
    }

    // Load PHASE 3 recipes
    const phase3Dir = path.join(dataDir, 'phase3-recipes');
    let phase3Files = [];
    if (fs.existsSync(phase3Dir)) {
      phase3Files = fs.readdirSync(phase3Dir)
        .filter(f => f.endsWith('-phase3-authentic.json'));

      phase3Files.forEach(file => {
        try {
          const filePath = path.join(phase3Dir, file);
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          if (content && content.country) {
            const country = content.country;
            const categories = ['breakfast', 'lunch', 'dinner', 'snacks', 'desserts', 'nonAlcoholicDrinks', 'alcoholicDrinks'];

            const countryRecipes = [];
            categories.forEach(cat => {
              if (Array.isArray(content[cat])) {
                content[cat].forEach(recipe => {
                  recipe.country = country;
                  recipe.category = cat;
                  recipe.region = content.region || 'Unknown';
                  countryRecipes.push(recipe);
                  allRecipes.push(recipe);
                });
              }
            });
            recipesByCountry[country] = countryRecipes;
          }
        } catch (e) {
          console.warn(`Warning: Error loading ${file}: ${e.message}`);
        }
      });
    }

    // Load from data/ directory (old format files)
    const dataFiles = fs.readdirSync(dataDir)
      .filter(f => (f.endsWith('-recipes.json') || f.endsWith('-complete-recipes.json')) &&
                    !f.startsWith('.'));

    dataFiles.forEach(file => {
      try {
        const filePath = path.join(dataDir, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const countryKey = Object.keys(content)[0];
        const countryData = content[countryKey];

        if (countryData && countryData.country) {
          // Skip if already loaded from complete-recipes
          if (recipesByCountry[countryData.country]) {
            return;
          }

          const country = countryData.country;
          const categories = ['breakfast', 'lunch', 'dinner', 'snacks', 'desserts', 'nonAlcoholicDrinks', 'alcoholicDrinks', 'vegetarianRecipes', 'specialtyCoffee'];

          const countryRecipes = [];
          categories.forEach(cat => {
            if (Array.isArray(countryData[cat])) {
              countryData[cat].forEach(recipe => {
                recipe.country = country;
                recipe.category = cat;
                recipe.region = countryData.region || 'Unknown';
                countryRecipes.push(recipe);
                allRecipes.push(recipe);
              });
            }
          });
          recipesByCountry[country] = countryRecipes;
        }
      } catch (e) {
        console.warn(`Warning: Error loading ${file}: ${e.message}`);
      }
    });

    const countryCount = Object.keys(recipesByCountry).length;
    console.log(`\n✓ Loaded ${allRecipes.length} recipes from ${countryCount} countries`);
    console.log(`✓ Complete recipe countries: ${Object.keys(recipesByCountry).filter(c => recipesByCountry[c].some(r => r.fun_fact)).length}`);
  } catch (err) {
    console.error('Error loading recipes:', err.message);
  }
}

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'API is running',
    timestamp: new Date(),
    recipesLoaded: allRecipes.length
  });
});

// ============ SEARCH ============
app.get('/api/recipes/search', (req, res) => {
  const { q, country, category, limit = 20, skip = 0 } = req.query;

  let results = allRecipes;

  // Text search
  if (q) {
    const searchLower = q.toLowerCase();
    results = results.filter(r =>
      (r.name && r.name.toLowerCase().includes(searchLower)) ||
      (r.ingredients && JSON.stringify(r.ingredients).toLowerCase().includes(searchLower))
    );
  }

  // Filter by country
  if (country) {
    results = results.filter(r => r.country.toLowerCase() === country.toLowerCase());
  }

  // Filter by category
  if (category) {
    results = results.filter(r => r.category === category);
  }

  const total = results.length;
  const paginated = results.slice(parseInt(skip), parseInt(skip) + parseInt(limit));

  res.json({
    success: true,
    totalResults: total,
    results: paginated,
    filters: {
      countries: [...new Set(allRecipes.map(r => r.country))].sort(),
      categories: [...new Set(allRecipes.map(r => r.category))].sort()
    }
  });
});

// ============ GET RECIPE BY ID ============
app.get('/api/recipes/:recipeId', (req, res) => {
  const { recipeId } = req.params;

  let recipe = allRecipes.find(r =>
    r.id === recipeId ||
    (r.name && r.name.toLowerCase() === decodeURIComponent(recipeId).toLowerCase())
  );

  if (!recipe) {
    return res.status(404).json({
      success: false,
      error: 'Recipe not found'
    });
  }

  res.json({
    success: true,
    recipe
  });
});

// ============ GET ALL RECIPES ============
app.get('/api/recipes', (req, res) => {
  const { country, category, limit = 50, skip = 0 } = req.query;

  let results = allRecipes;

  if (country) {
    results = results.filter(r => r.country.toLowerCase() === country.toLowerCase());
  }

  if (category) {
    results = results.filter(r => r.category === category);
  }

  const total = results.length;
  const paginated = results.slice(parseInt(skip), parseInt(skip) + parseInt(limit));

  res.json({
    success: true,
    total,
    limit: parseInt(limit),
    skip: parseInt(skip),
    recipes: paginated
  });
});

// ============ GET COUNTRIES ============
app.get('/api/countries', (req, res) => {
  const countries = [...new Set(allRecipes.map(r => r.country))].sort();
  const countryStats = countries.map(country => ({
    _id: country,
    count: allRecipes.filter(r => r.country === country).length,
    categories: [...new Set(allRecipes.filter(r => r.country === country).map(r => r.category))]
  }));

  res.json({
    success: true,
    totalCountries: countries.length,
    countries: countryStats
  });
});

// ============ GET CATEGORIES ============
app.get('/api/categories', (req, res) => {
  const categories = [...new Set(allRecipes.map(r => r.category))].sort();

  res.json({
    success: true,
    categories
  });
});

// ============ GET STATS ============
app.get('/api/stats', (req, res) => {
  const categories = [...new Set(allRecipes.map(r => r.category))];
  const countries = [...new Set(allRecipes.map(r => r.country))];

  res.json({
    success: true,
    stats: {
      totalRecipes: allRecipes.length,
      totalCountries: countries.length,
      totalCategories: categories.length,
      categories,
      averageRating: 0
    }
  });
});

// ============ TRENDING ============
app.get('/api/trending', (req, res) => {
  const { limit = 20 } = req.query;
  const trending = allRecipes.slice(0, parseInt(limit));

  res.json({
    success: true,
    trending
  });
});

// ============ RATE RECIPE ============
app.post('/api/recipes/:recipeId/rate', (req, res) => {
  const { rating } = req.body;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      error: 'Rating must be between 1 and 5'
    });
  }

  res.json({
    success: true,
    message: 'Rating recorded'
  });
});

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Server error',
    message: err.message
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// ============ START SERVER ============
loadRecipes();

app.listen(PORT, () => {
  console.log(`\n🍽️  DIG IN Recipe API Server`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`✓ Ready at http://localhost:${PORT}`);
  console.log(`✓ Frontend: http://localhost:8000\n`);
});
