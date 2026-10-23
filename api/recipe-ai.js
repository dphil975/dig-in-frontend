/**
 * Vercel serverless function -- AI recipe generation, analysis, and planning.
 *
 * POST /api/recipe-ai   { mode: "...", ...params }
 *
 * Modes:
 *   recipes     Generate recipes from ingredients
 *   photo       Analyse a cooking-step photo
 *   ask         Nova Q&A (grounded cooking assistant)
 *   trending    Trending delivery dishes for cost-arbitrage
 *   scale       Scale a recipe to a different serving size
 *   substitute  Find ingredient substitutions
 *   adapt       Adapt a recipe for dietary restrictions
 *   nutrition   Estimate nutritional breakdown
 *   pair        Suggest food and drink pairings
 *   plan        Generate a multi-meal plan
 *   identify    Identify a dish from a photo
 *   fusion      Generate a cross-cuisine fusion recipe
 *   leftovers   Repurpose leftover ingredients
 *   critique    Full recipe critique with improvements
 *   seasonal    Season-appropriate recipe suggestions
 *   budget      Budget-constrained recipe generation
 *   quick       Time-constrained recipe generation
 *
 * Returns { fallback: true } when OPENAI_API_KEY is not set so the client
 * can fall back to curated recipes without surfacing an error to the user.
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// ── Helpers ──────────────────────────────────────────────────────────────────

function jsonRes(res, status, body) {
  res.status(status).end(JSON.stringify(body));
}

function setCommonHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
}

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

function requireFields(body, fields) {
  const missing = fields.filter(f => {
    const v = body[f];
    if (v === undefined || v === null) return true;
    if (typeof v === 'string' && !v.trim()) return true;
    if (Array.isArray(v) && !v.length) return true;
    return false;
  });
  if (missing.length) {
    return { valid: false, error: `Missing required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}` };
  }
  return { valid: true };
}

// ── OpenAI call with retry ───────────────────────────────────────────────────

async function openai(apiKey, body, { retries = 2, timeoutMs = 25000 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const r = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!r.ok) {
        const text = await r.text();
        if (r.status === 429 || r.status >= 500) {
          lastErr = new Error(`OpenAI ${r.status}: ${text.slice(0, 200)}`);
          if (attempt < retries) {
            await new Promise(ok => setTimeout(ok, 1000 * (attempt + 1)));
            continue;
          }
        }
        throw new Error(`OpenAI ${r.status}: ${text.slice(0, 200)}`);
      }

      const data = await r.json();
      const content = data.choices?.[0]?.message?.content ?? '';
      const usage = data.usage || {};

      const parsed = JSON.parse(
        content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim(),
      );

      parsed._usage = {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
        model: body.model,
      };

      return parsed;
    } catch (err) {
      lastErr = err;
      if (err.name === 'AbortError') lastErr = new Error('OpenAI request timed out');
      if (attempt < retries && (err.name === 'AbortError' || /ECONNRESET|ETIMEDOUT|fetch failed/i.test(err.message))) {
        await new Promise(ok => setTimeout(ok, 1000 * (attempt + 1)));
        continue;
      }
    }
  }
  throw lastErr;
}

const SYSTEM_BASE = 'You are a practical home cooking assistant for Dig In, an NYC food app. Respond with valid JSON only -- no markdown fences, no text outside the JSON.';

// ── Mode: recipes ────────────────────────────────────────────────────────────

async function modeRecipes(body, apiKey) {
  const ingredients = (body.ingredients || []).filter(Boolean);
  const check = requireFields({ ingredients }, ['ingredients']);
  if (!check.valid) return { status: 400, body: { error: check.error } };

  const list = ingredients.join(', ');
  const dietary = body.dietary ? `Dietary restrictions: ${body.dietary}. ` : '';
  const cuisine = body.cuisine ? `Prefer ${body.cuisine} cuisine. ` : '';
  const count = Math.min(Math.max(parseInt(body.count) || 3, 1), 6);
  const difficulty = body.difficulty ? `Difficulty: ${body.difficulty} only. ` : '';

  const parsed = await openai(apiKey, {
    model: 'gpt-4o-mini',
    max_tokens: 2500,
    temperature: 0.75,
    messages: [
      { role: 'system', content: SYSTEM_BASE },
      {
        role: 'user',
        content: `I have: ${list}.
${dietary}${cuisine}${difficulty}
Generate exactly ${count} recipes I can make (or mostly make) with these.
Return this exact JSON -- no extra keys, no comments:
{
  "recipes": [
    {
      "id": 1,
      "name": "Recipe Name",
      "tag": "SHORT WORD naming the dish category, e.g. PASTA, TACOS, SOUP -- plain text, no emoji",
      "description": "One sentence, max 80 chars",
      "time": "25 min",
      "difficulty": "Easy",
      "servings": 4,
      "steps": ["Action step 1", "Action step 2"],
      "tips": [
        {"label": "PRO TIP",  "text": "Helpful note", "type": "success"},
        {"label": "WATCH OUT","text": "Common mistake", "type": "danger"}
      ],
      "substitutions": [
        {"ingredient": "X", "substitute": "Y", "note": "Brief reason"}
      ],
      "ingredients": [
        {"name": "Ingredient", "amount": "2 cups", "essential": true}
      ]
    }
  ]
}

Rules:
- 5-8 steps per recipe, each a concrete single action
- 2-3 tips (type must be "success", "warning", "danger", or "")
- 2-3 substitutions for hard-to-find or missing ingredients
- List all ingredients with amounts and mark which are essential
- difficulty: "Easy", "Medium", or "Hard"
- Make recipes practical for a standard NYC apartment kitchen
- Vary the recipes -- different cuisines or cooking methods`,
      },
    ],
  });

  return { status: 200, body: parsed };
}

// ── Mode: photo ──────────────────────────────────────────────────────────────

async function modePhoto(body, apiKey) {
  const check = requireFields(body, ['image']);
  if (!check.valid) return { status: 400, body: { error: check.error } };

  const { image, step = '', recipe: recipeName = '' } = body;

  const parsed = await openai(apiKey, {
    model: 'gpt-4o',
    max_tokens: 600,
    messages: [
      {
        role: 'system',
        content: 'You are a cooking instructor reviewing a student photo. Be specific about what you see. Respond with valid JSON only.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `I'm making "${recipeName}" and I'm on this step: "${step}".
Analyse my photo and return this exact JSON:
{
  "match":     {"label": "STEP MATCH",   "text": "...", "type": "success|warning|danger"},
  "texture":   {"label": "TEXTURE",      "text": "...", "type": "success|warning"},
  "color":     {"label": "COLOR",        "text": "...", "type": "success|warning"},
  "tip":       {"label": "NEXT ACTION",  "text": "...", "type": ""},
  "confidence": 0.85
}
- match: does the photo match what this step should look like?
- texture: assess the visible texture (crispy, soggy, smooth, chunky, etc.)
- color: assess the color (golden, pale, burnt, raw-looking, etc.)
- tip: what should the cook do next based on what you see
- confidence: 0-1 how confident you are in your assessment`,
          },
          { type: 'image_url', image_url: { url: image, detail: 'low' } },
        ],
      },
    ],
  });

  return { status: 200, body: parsed };
}

// ── Mode: ask ────────────────────────────────────────────────────────────────

async function modeAsk(body, apiKey) {
  const check = requireFields(body, ['question']);
  if (!check.valid) return { status: 400, body: { error: check.error } };

  const { question, context = [], tone = 'listener' } = body;

  const TONE_PERSONA = {
    listener:    'quiet, present, unhurried -- you hold space and answer plainly',
    calm:        'grounding and slow; you lower the temperature and reassure',
    coach:       'warm but pointed; you name the fix and the next move',
    cheerleader: 'big encouraging energy; you believe in the cook',
    sassy:       'a little unhinged but deeply on their side -- comfort with teeth',
  };

  const sources = (context || [])
    .map(c => `- "${c.name}"${c.source ? ` (${c.source})` : ''}${c.snippet ? `: ${c.snippet}` : ''}`)
    .join('\n') || '(no specific recipe matched)';

  const parsed = await openai(apiKey, {
    model: 'gpt-4o-mini',
    max_tokens: 600,
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content:
          `You are Nova, the home-cooking brain inside Dig In. Voice: ${TONE_PERSONA[tone] || TONE_PERSONA.listener}. ` +
          'Answer the cooking question practically and accurately -- substitutions, technique, troubleshooting, food safety. ' +
          'Be specific and concise (2-5 sentences). Ground your answer in the provided sources when relevant and cite them. ' +
          'For food-safety questions, give the safe answer (temperatures, times) and never guess. Respond with valid JSON only -- no markdown fences.',
      },
      {
        role: 'user',
        content: `Question: ${question}

Sources from my cookbooks that may be relevant:
${sources}

Return this exact JSON:
{
  "answer": "your answer in Nova's voice, 2-5 sentences",
  "citations": [{"name": "Recipe or source name", "source": "book name"}],
  "followUp": ["A natural follow-up question the cook might have"]
}
Only cite sources listed above; use an empty array if none apply.
Include 1-2 natural follow-up questions they might want to ask next.`,
      },
    ],
  });

  return { status: 200, body: parsed };
}

// ── Mode: trending ───────────────────────────────────────────────────────────

async function modeTrending(body, apiKey) {
  const { area = 'a typical US city', existingNames = [], count: rawCount = 4 } = body;
  const count = Math.min(Math.max(parseInt(rawCount) || 4, 1), 8);
  const avoid = existingNames.length ? `Avoid repeating: ${existingNames.join(', ')}.` : '';

  const parsed = await openai(apiKey, {
    model: 'gpt-4o-mini',
    max_tokens: 1800,
    temperature: 0.8,
    messages: [
      {
        role: 'system',
        content:
          'You generate realistic, currently-popular delivery-app dishes (the kind ordered via UberEats/DoorDash/GrubHub) ' +
          'for a cost-comparison feature that shows a dish\'s delivery price next to its true home-cooked ingredient cost. ' +
          'Prices must be realistic and internally consistent (delivery price > ingredient cost, by a lot). ' +
          'Respond with valid JSON only -- no markdown fences, no text outside the JSON.',
      },
      {
        role: 'user',
        content: `Generate ${count} trending delivery dishes for ${area}. ${avoid}

Return this exact JSON:
{
  "dishes": [
    {
      "name": "Dish Name",
      "emoji": "single emoji",
      "cuisine": "Cuisine",
      "restaurant": "Fictional but plausible restaurant name",
      "deliveryBase": 18.50,
      "cookTime": 25,
      "servings": 3,
      "difficulty": "Easy|Medium|Hard",
      "chefNote": "One punchy sentence on why cooking it is easy/cheap",
      "ingredients": [{"name": "Ingredient", "cost": 1.99}],
      "instructions": ["Step 1", "Step 2", "Step 3", "Step 4"],
      "savingsPercent": 65
    }
  ]
}

Rules:
- deliveryBase is the base menu price only (fees are added separately downstream), realistic for the dish
- 4-5 ingredients per dish with realistic grocery-store prices (their sum should be well under deliveryBase)
- 4-6 concrete instruction steps
- savingsPercent = rough percentage saved by cooking at home
- Vary cuisines across the ${count} dishes`,
      },
    ],
  });

  return { status: 200, body: parsed };
}

// ── Mode: scale ──────────────────────────────────────────────────────────────

async function modeScale(body, apiKey) {
  const check = requireFields(body, ['recipe', 'targetServings']);
  if (!check.valid) return { status: 400, body: { error: check.error } };

  const { recipe, targetServings, originalServings = 4 } = body;
  const recipeName = typeof recipe === 'string' ? recipe : recipe.name || 'this recipe';
  const ingredients = typeof recipe === 'object' && Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map(i => typeof i === 'string' ? i : `${i.amount || ''} ${i.name || i}`).join('\n')
    : '(scale based on the recipe name)';

  const parsed = await openai(apiKey, {
    model: 'gpt-4o-mini',
    max_tokens: 1000,
    temperature: 0.3,
    messages: [
      { role: 'system', content: SYSTEM_BASE },
      {
        role: 'user',
        content: `Scale "${recipeName}" from ${originalServings} servings to ${targetServings} servings.

Current ingredients:
${ingredients}

Return this exact JSON:
{
  "scaledIngredients": [
    {"name": "Ingredient", "originalAmount": "2 cups", "scaledAmount": "3 cups", "note": "optional tip"}
  ],
  "timingAdjustments": [
    {"step": "Baking", "originalTime": "25 min", "adjustedTime": "35 min", "reason": "Larger volume needs more time"}
  ],
  "equipmentNotes": ["You may need a larger pan for this batch size"],
  "warnings": ["Spices don't scale linearly -- use 1.5x, not 2x, for doubled recipes"]
}

Rules:
- Scale amounts precisely but round to practical measurements (nobody measures 2.37 cups)
- Note when something does NOT scale linearly (spices, leavening, salt, oil for frying)
- Flag equipment changes needed for larger batches
- Adjust cooking times when batch size affects them`,
      },
    ],
  });

  return { status: 200, body: parsed };
}

// ── Mode: substitute ─────────────────────────────────────────────────────────

async function modeSubstitute(body, apiKey) {
  const check = requireFields(body, ['ingredient']);
  if (!check.valid) return { status: 400, body: { error: check.error } };

  const { ingredient, recipe: recipeName = '', dietary = '', reason = '' } = body;
  const context = recipeName ? ` in "${recipeName}"` : '';
  const dietNote = dietary ? ` Must be ${dietary}.` : '';
  const reasonNote = reason ? ` Reason for substitution: ${reason}.` : '';

  const parsed = await openai(apiKey, {
    model: 'gpt-4o-mini',
    max_tokens: 800,
    temperature: 0.4,
    messages: [
      { role: 'system', content: SYSTEM_BASE },
      {
        role: 'user',
        content: `I need to substitute "${ingredient}"${context}.${dietNote}${reasonNote}

Return this exact JSON:
{
  "original": "${ingredient}",
  "substitutions": [
    {
      "substitute": "Name",
      "ratio": "1:1 or specific conversion",
      "flavorImpact": "How it changes the taste",
      "textureImpact": "How it changes the texture",
      "bestFor": "What cooking methods this sub works best in",
      "avoid": "When NOT to use this substitute",
      "dietaryTags": ["vegan", "gluten-free"]
    }
  ],
  "emergencySub": {"substitute": "Name", "ratio": "ratio", "note": "Quick fix if you have nothing else"},
  "tip": "General advice about substituting this ingredient"
}

Rules:
- Provide 3-4 substitutions ranked from best to acceptable
- Include at least one common pantry-staple option
- Be honest about flavor/texture trade-offs
- Include dietary tags where relevant (vegan, dairy-free, gluten-free, nut-free, etc.)`,
      },
    ],
  });

  return { status: 200, body: parsed };
}

// ── Mode: adapt ──────────────────────────────────────────────────────────────

async function modeAdapt(body, apiKey) {
  const check = requireFields(body, ['recipe', 'dietary']);
  if (!check.valid) return { status: 400, body: { error: check.error } };

  const { recipe, dietary } = body;
  const recipeName = typeof recipe === 'string' ? recipe : recipe.name || 'this recipe';
  const ingredients = typeof recipe === 'object' && Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map(i => typeof i === 'string' ? i : `${i.amount || ''} ${i.name || i}`).join('\n')
    : '';
  const steps = typeof recipe === 'object' && Array.isArray(recipe.steps)
    ? recipe.steps.join('\n')
    : '';

  const parsed = await openai(apiKey, {
    model: 'gpt-4o-mini',
    max_tokens: 1500,
    temperature: 0.4,
    messages: [
      { role: 'system', content: SYSTEM_BASE },
      {
        role: 'user',
        content: `Adapt "${recipeName}" to be ${dietary}.

${ingredients ? `Current ingredients:\n${ingredients}\n` : ''}
${steps ? `Current steps:\n${steps}\n` : ''}
Return this exact JSON:
{
  "originalName": "${recipeName}",
  "adaptedName": "New name reflecting the adaptation",
  "dietary": "${dietary}",
  "changes": [
    {
      "original": "Original ingredient or step",
      "replacement": "What to use instead",
      "reason": "Why this works",
      "impact": "minimal|moderate|significant"
    }
  ],
  "newIngredients": [
    {"name": "Ingredient", "amount": "2 cups", "note": "why it's needed"}
  ],
  "newSteps": ["Adapted step 1", "Adapted step 2"],
  "warnings": ["Important notes about the adaptation"],
  "nutritionChange": "Brief note on how nutrition profile changes",
  "difficultyChange": "Same|Easier|Harder"
}

Rules:
- Mark each change's impact: minimal (barely noticeable), moderate (different but good), significant (fundamentally changed)
- Provide complete adapted steps, not just the changes
- Be honest if the adaptation fundamentally changes the dish
- Include any new techniques needed (e.g., aquafaba whipping for egg-free meringue)`,
      },
    ],
  });

  return { status: 200, body: parsed };
}

// ── Mode: nutrition ──────────────────────────────────────────────────────────

async function modeNutrition(body, apiKey) {
  const check = requireFields(body, ['recipe']);
  if (!check.valid) return { status: 400, body: { error: check.error } };

  const { recipe, servings = 4 } = body;
  const recipeName = typeof recipe === 'string' ? recipe : recipe.name || 'this recipe';
  const ingredients = typeof recipe === 'object' && Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map(i => typeof i === 'string' ? i : `${i.amount || ''} ${i.name || i}`).join('\n')
    : recipeName;

  const parsed = await openai(apiKey, {
    model: 'gpt-4o-mini',
    max_tokens: 1000,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: SYSTEM_BASE + ' You are knowledgeable about food nutrition. Provide realistic estimates based on USDA data. Always note these are estimates.',
      },
      {
        role: 'user',
        content: `Estimate the nutritional breakdown for "${recipeName}" (${servings} servings).

Ingredients:
${ingredients}

Return this exact JSON:
{
  "recipeName": "${recipeName}",
  "servings": ${servings},
  "perServing": {
    "calories": 450,
    "protein": 28,
    "carbs": 42,
    "fat": 18,
    "fiber": 6,
    "sugar": 8,
    "sodium": 650,
    "saturatedFat": 5
  },
  "totalRecipe": {
    "calories": 1800,
    "protein": 112
  },
  "topNutrients": [
    {"nutrient": "Protein", "amount": "28g", "dailyValue": "56%", "source": "chicken breast"}
  ],
  "dietaryFlags": ["high-protein", "moderate-sodium"],
  "healthNotes": ["Good source of lean protein", "Consider reducing sodium by using low-sodium broth"],
  "allergens": ["gluten", "dairy"],
  "disclaimer": "Estimates based on typical ingredient quantities. Actual values vary."
}

Rules:
- Base estimates on USDA food composition data
- Per-serving values should be realistic and internally consistent
- Flag common allergens present
- Include practical health notes
- Always include the disclaimer that these are estimates`,
      },
    ],
  });

  return { status: 200, body: parsed };
}

// ── Mode: pair ───────────────────────────────────────────────────────────────

async function modePair(body, apiKey) {
  const check = requireFields(body, ['recipe']);
  if (!check.valid) return { status: 400, body: { error: check.error } };

  const { recipe } = body;
  const recipeName = typeof recipe === 'string' ? recipe : recipe.name || 'this dish';

  const parsed = await openai(apiKey, {
    model: 'gpt-4o-mini',
    max_tokens: 1000,
    temperature: 0.6,
    messages: [
      { role: 'system', content: SYSTEM_BASE + ' You are a knowledgeable sommelier and food pairing expert.' },
      {
        role: 'user',
        content: `Suggest pairings for "${recipeName}".

Return this exact JSON:
{
  "dish": "${recipeName}",
  "wine": [
    {"name": "Pinot Noir", "style": "Light red", "why": "Complements the earthy flavors", "priceRange": "$12-18"}
  ],
  "beer": [
    {"name": "Belgian Witbier", "style": "Wheat beer", "why": "Citrus notes cut through richness", "priceRange": "$8-12/6pk"}
  ],
  "nonAlcoholic": [
    {"name": "Sparkling water with lemon", "why": "Cleanses the palate between bites"}
  ],
  "sides": [
    {"name": "Roasted vegetables", "why": "Adds color and balances the plate", "effort": "Easy"}
  ],
  "dessert": [
    {"name": "Lemon sorbet", "why": "Light finish after a rich main", "effort": "Easy"}
  ],
  "pairingPrinciple": "Brief explanation of why these pairings work together"
}

Rules:
- 2-3 options per category
- Include price ranges for drinks
- Include effort level for sides and desserts
- Explain the pairing principle behind your choices
- Include non-alcoholic options always`,
      },
    ],
  });

  return { status: 200, body: parsed };
}

// ── Mode: plan ───────────────────────────────────────────────────────────────

async function modePlan(body, apiKey) {
  const {
    days = 3,
    people = 2,
    dietary = '',
    budget = '',
    preferences = '',
    mealsPerDay = 3,
  } = body;

  const clampedDays = Math.min(Math.max(parseInt(days) || 3, 1), 7);
  const clampedMeals = Math.min(Math.max(parseInt(mealsPerDay) || 3, 1), 4);
  const dietNote = dietary ? `Dietary: ${dietary}. ` : '';
  const budgetNote = budget ? `Budget: ${budget}. ` : '';
  const prefNote = preferences ? `Preferences: ${preferences}. ` : '';

  const parsed = await openai(apiKey, {
    model: 'gpt-4o-mini',
    max_tokens: 2500,
    temperature: 0.7,
    messages: [
      { role: 'system', content: SYSTEM_BASE + ' You create practical, varied meal plans for real home cooks.' },
      {
        role: 'user',
        content: `Create a ${clampedDays}-day meal plan for ${people} people, ${clampedMeals} meals per day.
${dietNote}${budgetNote}${prefNote}

Return this exact JSON:
{
  "plan": [
    {
      "day": 1,
      "dayLabel": "Monday",
      "meals": [
        {
          "meal": "breakfast",
          "name": "Recipe Name",
          "description": "One sentence",
          "time": "15 min",
          "difficulty": "Easy",
          "keyIngredients": ["eggs", "bread", "butter"]
        }
      ]
    }
  ],
  "shoppingList": [
    {"item": "Eggs (1 dozen)", "category": "dairy", "estimatedCost": 3.99, "usedIn": ["Day 1 breakfast", "Day 2 lunch"]}
  ],
  "totalEstimatedCost": 45.00,
  "costPerPerson": 22.50,
  "costPerMeal": 2.50,
  "prepStrategy": ["Sunday: prep grains and chop vegetables", "Batch cook proteins on day 1"],
  "shelfLifeNotes": ["Use fresh fish on day 1-2", "Cooked grains keep 4 days refrigerated"]
}

Rules:
- Vary cuisines and cooking methods across the week
- Reuse ingredients across meals to minimize waste and cost
- Include realistic grocery-store prices
- Meals should progress from simplest to most involved
- Group shopping list by grocery section
- Include a prep strategy for batch cooking
- Note perishable timing`,
      },
    ],
  });

  return { status: 200, body: parsed };
}

// ── Mode: identify ───────────────────────────────────────────────────────────

async function modeIdentify(body, apiKey) {
  const check = requireFields(body, ['image']);
  if (!check.valid) return { status: 400, body: { error: check.error } };

  const parsed = await openai(apiKey, {
    model: 'gpt-4o',
    max_tokens: 1000,
    messages: [
      {
        role: 'system',
        content: 'You are a food identification expert who can recognize dishes, ingredients, and cuisines from photos. Respond with valid JSON only.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Identify the food in this photo. Return this exact JSON:
{
  "dish": "Name of the dish",
  "cuisine": "Cuisine origin",
  "confidence": 0.85,
  "description": "What this dish is and how it's typically made",
  "ingredients": ["Visible or likely ingredients"],
  "dietaryInfo": ["vegetarian", "contains-gluten"],
  "spiceLevel": "mild|medium|hot|very hot",
  "estimatedCalories": "400-500 per serving",
  "similarDishes": [
    {"name": "Similar Dish", "cuisine": "Cuisine", "difference": "How it differs"}
  ],
  "cookingMethod": "grilled|fried|baked|steamed|raw|etc",
  "servingSize": "Estimated portion size visible",
  "presentation": "Brief note on plating quality"
}`,
          },
          { type: 'image_url', image_url: { url: body.image, detail: 'low' } },
        ],
      },
    ],
  });

  return { status: 200, body: parsed };
}

// ── Mode: fusion ─────────────────────────────────────────────────────────────

async function modeFusion(body, apiKey) {
  const check = requireFields(body, ['cuisineA', 'cuisineB']);
  if (!check.valid) return { status: 400, body: { error: check.error } };

  const { cuisineA, cuisineB, base = '', protein = '' } = body;
  const baseNote = base ? `Use "${base}" as the base format. ` : '';
  const proteinNote = protein ? `Feature ${protein} as the protein. ` : '';

  const parsed = await openai(apiKey, {
    model: 'gpt-4o-mini',
    max_tokens: 1500,
    temperature: 0.85,
    messages: [
      {
        role: 'system',
        content: SYSTEM_BASE + ' You are a creative chef who understands the flavor chemistry behind great fusion dishes -- what makes two cuisines click together.',
      },
      {
        role: 'user',
        content: `Create a fusion recipe combining ${cuisineA} and ${cuisineB} cuisines. ${baseNote}${proteinNote}

Return this exact JSON:
{
  "name": "Creative Fusion Name",
  "tagline": "One-line elevator pitch",
  "cuisineA": "${cuisineA}",
  "cuisineB": "${cuisineB}",
  "flavorBridge": "The flavor chemistry that makes these two cuisines work together (e.g., both rely on fermented umami, both use citrus-acid-heat)",
  "ingredients": [
    {"name": "Ingredient", "amount": "2 cups", "origin": "${cuisineA}|${cuisineB}|bridge", "role": "What it does in the dish"}
  ],
  "steps": ["Step 1", "Step 2"],
  "difficulty": "Easy|Medium|Hard",
  "time": "30 min",
  "servings": 4,
  "techniques": [
    {"name": "Technique", "from": "${cuisineA}|${cuisineB}", "purpose": "Why it's used here"}
  ],
  "whyItWorks": "2-3 sentences on the food science behind this fusion",
  "dontDo": "One thing that seems like it would work but actually clashes"
}

Rules:
- The fusion must be grounded in real flavor chemistry, not random mashup
- Mark each ingredient's cuisine of origin or label it "bridge" if it connects the two
- Name the specific techniques borrowed from each cuisine
- Include a "flavor bridge" -- the shared element that makes the fusion coherent
- Include a "don't do" -- a tempting combination that actually doesn't work`,
      },
    ],
  });

  return { status: 200, body: parsed };
}

// ── Mode: leftovers ──────────────────────────────────────────────────────────

async function modeLeftovers(body, apiKey) {
  const check = requireFields(body, ['leftovers']);
  if (!check.valid) return { status: 400, body: { error: check.error } };

  const { leftovers, meals = 2 } = body;
  const items = Array.isArray(leftovers) ? leftovers.filter(Boolean).join(', ') : leftovers;
  const count = Math.min(Math.max(parseInt(meals) || 2, 1), 5);

  const parsed = await openai(apiKey, {
    model: 'gpt-4o-mini',
    max_tokens: 1500,
    temperature: 0.7,
    messages: [
      { role: 'system', content: SYSTEM_BASE + ' You specialize in zero-waste cooking -- turning leftovers into new meals that don\'t taste like leftovers.' },
      {
        role: 'user',
        content: `I have these leftovers: ${items}.

Generate ${count} new meals I can make from them. Return this exact JSON:
{
  "meals": [
    {
      "name": "New Meal Name",
      "description": "What it is and why it works",
      "fromLeftovers": ["Which leftovers are used"],
      "additionalIngredients": [
        {"name": "Ingredient", "amount": "1 tbsp", "pantryStaple": true}
      ],
      "steps": ["Step 1", "Step 2"],
      "time": "15 min",
      "difficulty": "Easy",
      "transformation": "How the leftover is transformed so it doesn't taste like a repeat",
      "shelfLife": "Use within 2 days"
    }
  ],
  "storageAdvice": ["How to store each leftover for best results"],
  "freezerFriendly": ["Which leftovers freeze well and how long"]
}

Rules:
- Each meal should TRANSFORM the leftovers, not just reheat them
- Minimize additional ingredients -- prefer pantry staples
- Note shelf life -- when do these leftovers need to be used by
- Include freezer-friendly options when applicable
- Make meals feel fresh, not like eating the same thing again`,
      },
    ],
  });

  return { status: 200, body: parsed };
}

// ── Mode: critique ───────────────────────────────────────────────────────────

async function modeCritique(body, apiKey) {
  const check = requireFields(body, ['recipe']);
  if (!check.valid) return { status: 400, body: { error: check.error } };

  const { recipe } = body;
  const recipeName = typeof recipe === 'string' ? recipe : recipe.name || 'this recipe';
  const ingredients = typeof recipe === 'object' && Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map(i => typeof i === 'string' ? i : `${i.amount || ''} ${i.name || i}`).join('\n')
    : '';
  const steps = typeof recipe === 'object' && Array.isArray(recipe.steps)
    ? recipe.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : '';

  const parsed = await openai(apiKey, {
    model: 'gpt-4o-mini',
    max_tokens: 1200,
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content: SYSTEM_BASE + ' You are a constructive cooking mentor -- honest but encouraging. Point out what works AND what could improve.',
      },
      {
        role: 'user',
        content: `Critique this recipe: "${recipeName}"

${ingredients ? `Ingredients:\n${ingredients}\n` : ''}
${steps ? `Steps:\n${steps}\n` : ''}
Return this exact JSON:
{
  "recipeName": "${recipeName}",
  "overallRating": 7,
  "strengths": [
    {"point": "What's good about this recipe", "detail": "Why it works"}
  ],
  "improvements": [
    {"issue": "What could be better", "fix": "Specific actionable improvement", "impact": "high|medium|low"}
  ],
  "missingSteps": ["Steps the recipe should include but doesn't"],
  "seasoning": "Assessment of seasoning balance",
  "technique": "Assessment of cooking technique choices",
  "timing": "Are the cooking times realistic and well-ordered?",
  "presentation": "Suggestion for plating",
  "levelUp": "One advanced technique that would elevate this dish"
}

Rules:
- Rate 1-10, be honest but fair
- Start with genuine strengths -- what the recipe does RIGHT
- Improvements should be specific and actionable
- Flag missing steps that a beginner would need
- Include one "level up" technique for the ambitious cook`,
      },
    ],
  });

  return { status: 200, body: parsed };
}

// ── Mode: seasonal ───────────────────────────────────────────────────────────

async function modeSeasonal(body, apiKey) {
  const { season = '', month = '', region = 'northeast US', count: rawCount = 4, dietary = '' } = body;

  const now = new Date();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentMonth = month || monthNames[now.getMonth()];
  const currentSeason = season || (['winter','winter','spring','spring','spring','summer','summer','summer','fall','fall','fall','winter'])[now.getMonth()];
  const count = Math.min(Math.max(parseInt(rawCount) || 4, 1), 6);
  const dietNote = dietary ? `Dietary: ${dietary}. ` : '';

  const parsed = await openai(apiKey, {
    model: 'gpt-4o-mini',
    max_tokens: 1800,
    temperature: 0.7,
    messages: [
      { role: 'system', content: SYSTEM_BASE + ' You are passionate about seasonal cooking and know exactly what\'s at peak flavor each month.' },
      {
        role: 'user',
        content: `It's ${currentMonth} (${currentSeason}) in ${region}. ${dietNote}

Generate ${count} recipes featuring ingredients that are at peak season RIGHT NOW.
Return this exact JSON:
{
  "season": "${currentSeason}",
  "month": "${currentMonth}",
  "region": "${region}",
  "inSeason": ["List of produce at peak this month"],
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "One sentence",
      "hero": "The star seasonal ingredient",
      "whyNow": "Why this ingredient is best right now",
      "time": "30 min",
      "difficulty": "Easy",
      "servings": 4,
      "ingredients": [
        {"name": "Ingredient", "amount": "2 cups", "seasonal": true}
      ],
      "steps": ["Step 1", "Step 2"]
    }
  ],
  "avoidNow": ["Ingredients that are out of season and won't taste good"]
}

Rules:
- Hero ingredient must genuinely be in season for this month and region
- Mark which ingredients are seasonal vs. pantry staples
- Explain WHY the hero is best now (peak sweetness, just harvested, etc.)
- Include a list of what to AVOID buying right now (out of season, shipped from far)
- Vary the recipes across meal types`,
      },
    ],
  });

  return { status: 200, body: parsed };
}

// ── Mode: budget ─────────────────────────────────────────────────────────────

async function modeBudget(body, apiKey) {
  const { budget = 10, people = 2, count: rawCount = 3, dietary = '' } = body;
  const maxBudget = Math.min(Math.max(parseFloat(budget) || 10, 3), 100);
  const count = Math.min(Math.max(parseInt(rawCount) || 3, 1), 5);
  const dietNote = dietary ? `Dietary: ${dietary}. ` : '';

  const parsed = await openai(apiKey, {
    model: 'gpt-4o-mini',
    max_tokens: 1800,
    temperature: 0.65,
    messages: [
      { role: 'system', content: SYSTEM_BASE + ' You specialize in budget cooking -- delicious meals at the lowest possible cost using real grocery-store prices.' },
      {
        role: 'user',
        content: `Generate ${count} recipes for ${people} people with a total ingredient budget of $${maxBudget.toFixed(2)} or less. ${dietNote}

Return this exact JSON:
{
  "budget": ${maxBudget},
  "people": ${people},
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "One sentence",
      "totalCost": 6.50,
      "costPerServing": 1.63,
      "time": "25 min",
      "difficulty": "Easy",
      "servings": 4,
      "ingredients": [
        {"name": "Ingredient", "amount": "1 lb", "cost": 2.99, "where": "Best price location tip"}
      ],
      "steps": ["Step 1", "Step 2"],
      "savingsTips": ["Buy in bulk", "Use frozen instead of fresh"],
      "tag": "PASTA"
    }
  ],
  "budgetHacks": ["General money-saving tips for grocery shopping"]
}

Rules:
- Total ingredient cost for each recipe must be under $${maxBudget.toFixed(2)}
- Use realistic grocery-store prices (NYC area)
- Include cost per serving
- Add tips for where to find the best price (bodega, bulk store, etc.)
- Suggest frozen/canned alternatives where they're just as good
- Recipes should be genuinely delicious, not just cheap`,
      },
    ],
  });

  return { status: 200, body: parsed };
}

// ── Mode: quick ──────────────────────────────────────────────────────────────

async function modeQuick(body, apiKey) {
  const { maxMinutes = 15, count: rawCount = 3, dietary = '', pantry = [] } = body;
  const minutes = Math.min(Math.max(parseInt(maxMinutes) || 15, 5), 30);
  const count = Math.min(Math.max(parseInt(rawCount) || 3, 1), 5);
  const dietNote = dietary ? `Dietary: ${dietary}. ` : '';
  const pantryNote = pantry.length ? `I have on hand: ${pantry.join(', ')}. ` : '';

  const parsed = await openai(apiKey, {
    model: 'gpt-4o-mini',
    max_tokens: 1500,
    temperature: 0.7,
    messages: [
      { role: 'system', content: SYSTEM_BASE + ' You specialize in fast cooking -- genuinely quick meals that are ready start-to-plate in the stated time. No cheating on times.' },
      {
        role: 'user',
        content: `Generate ${count} recipes that take ${minutes} minutes or less, total. ${dietNote}${pantryNote}

Return this exact JSON:
{
  "maxMinutes": ${minutes},
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "One sentence",
      "totalTime": "${minutes} min",
      "prepTime": "5 min",
      "cookTime": "10 min",
      "difficulty": "Easy",
      "servings": 2,
      "ingredients": [
        {"name": "Ingredient", "amount": "1 cup", "pantryStaple": true}
      ],
      "steps": ["Step 1", "Step 2"],
      "timeBreakdown": "5 min prep + 10 min cook = 15 min total",
      "speedTip": "How to make it even faster next time",
      "tag": "STIR-FRY"
    }
  ],
  "speedHacks": ["General tips for cooking faster without sacrificing quality"]
}

Rules:
- TOTAL time (prep + cook) must be under ${minutes} minutes -- be honest, don't cheat
- Include a realistic time breakdown
- Favor one-pan/one-pot methods
- Steps should be concurrent where possible ("While the pasta boils, saute the garlic")
- Include a speed tip for each recipe
- Prefer pantry staples to minimize shopping`,
      },
    ],
  });

  return { status: 200, body: parsed };
}

// ── Router ───────────────────────────────────────────────────────────────────

const MODES = {
  recipes:    modeRecipes,
  photo:      modePhoto,
  ask:        modeAsk,
  trending:   modeTrending,
  scale:      modeScale,
  substitute: modeSubstitute,
  adapt:      modeAdapt,
  nutrition:  modeNutrition,
  pair:       modePair,
  plan:       modePlan,
  identify:   modeIdentify,
  fusion:     modeFusion,
  leftovers:  modeLeftovers,
  critique:   modeCritique,
  seasonal:   modeSeasonal,
  budget:     modeBudget,
  quick:      modeQuick,
};

export default async function handler(req, res) {
  setCommonHeaders(res);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    return jsonRes(res, 204, {});
  }

  if (req.method !== 'POST') {
    return jsonRes(res, 405, { error: 'Method not allowed. Use POST.', availableModes: Object.keys(MODES) });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return jsonRes(res, 503, { fallback: true, error: 'AI service not configured' });
  }

  const body = req.body ?? {};
  const mode = (body.mode || 'recipes').toLowerCase();
  const modeFn = MODES[mode];

  if (!modeFn) {
    return jsonRes(res, 400, {
      error: `Unknown mode: "${mode}"`,
      availableModes: Object.keys(MODES),
    });
  }

  const startTime = Date.now();

  try {
    const result = await modeFn(body, apiKey);
    const responseBody = {
      ...result.body,
      _meta: {
        mode,
        latencyMs: Date.now() - startTime,
        ...(result.body._usage || {}),
      },
    };
    delete responseBody._usage;

    // ETag for identical responses
    const serialized = JSON.stringify(responseBody);
    const etag = `"rai-${simpleHash(serialized)}"`;
    res.setHeader('ETag', etag);

    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    return jsonRes(res, result.status, responseBody);
  } catch (err) {
    console.error(`[recipe-ai:${mode}]`, err.message);
    return jsonRes(res, 500, {
      fallback: true,
      error: 'AI service error',
      _meta: { mode, latencyMs: Date.now() - startTime },
    });
  }
}
