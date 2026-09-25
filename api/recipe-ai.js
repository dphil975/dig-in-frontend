/**
 * Vercel serverless function — AI recipe generation & photo analysis
 *
 * POST /api/recipe-ai
 *   mode "recipes": { ingredients: string[] }
 *     → { recipes: [{id, name, tag, description, time, difficulty, steps, tips, substitutions}] }
 *
 *   mode "photo":   { image: "data:image/jpeg;base64,...", step: string, recipe: string }
 *     → { match, texture, tip }
 *
 *   mode "trending": { area: string, existingNames: string[], count: number }
 *     → { dishes: [{id, name, emoji, cuisine, restaurant, deliveryBase, cookTime,
 *                    servings, difficulty, chefNote, ingredients, instructions}] }
 *
 * Returns { fallback: true } when OPENAI_API_KEY is not set so the client
 * can fall back to curated recipes without surfacing an error to the user.
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function jsonRes(res, status, body) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).end(JSON.stringify(body));
}

async function openai(apiKey, body) {
  const r = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`OpenAI ${r.status}: ${text.slice(0, 200)}`);
  }
  const data = await r.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  // Strip accidental markdown fences
  return JSON.parse(content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return jsonRes(res, 405, { error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return jsonRes(res, 503, { fallback: true, error: 'AI service not configured' });

  const { mode = 'recipes', ingredients = [], image, step, recipe: recipeName,
          question, context = [], tone = 'listener',
          area, existingNames = [], count = 4 } = req.body ?? {};

  try {
    // ── Recipe generation ───────────────────────────────────────────────────
    if (mode === 'recipes') {
      const list = ingredients.filter(Boolean).join(', ');
      if (!list) return jsonRes(res, 400, { error: 'Provide at least one ingredient' });

      const parsed = await openai(apiKey, {
        model:      'gpt-4o-mini',
        max_tokens: 2000,
        temperature: 0.75,
        messages: [
          {
            role: 'system',
            content:
              'You are a practical home cooking assistant for Dig In, an NYC food app. ' +
              'Respond with valid JSON only — no markdown fences, no text outside the JSON.',
          },
          {
            role: 'user',
            content: `I have: ${list}.

Generate exactly 3 recipes I can make (or mostly make) with these.
Return this exact JSON — no extra keys, no comments:
{
  "recipes": [
    {
      "id": 1,
      "name": "Recipe Name",
      "tag": "SHORT WORD naming the dish category, e.g. PASTA, TACOS, SOUP — plain text, no emoji",
      "description": "One sentence, max 80 chars",
      "time": "25 min",
      "difficulty": "Easy",
      "steps": ["Action step 1", "Action step 2"],
      "tips": [
        {"label": "PRO TIP",  "text": "Helpful note", "type": "success"},
        {"label": "WATCH OUT","text": "Common mistake", "type": "danger"}
      ],
      "substitutions": [
        {"ingredient": "X", "substitute": "Y", "note": "Brief reason"}
      ]
    }
  ]
}

Rules:
- 5–8 steps per recipe, each a concrete single action
- 2–3 tips (type must be "success", "warning", "danger", or "")
- 2–3 substitutions for hard-to-find or missing ingredients
- difficulty: "Easy", "Medium", or "Hard"
- Make recipes practical for a standard NYC apartment kitchen`,
          },
        ],
      });

      return jsonRes(res, 200, parsed);
    }

    // ── Photo analysis ──────────────────────────────────────────────────────
    if (mode === 'photo') {
      if (!image) return jsonRes(res, 400, { error: 'image is required' });

      const parsed = await openai(apiKey, {
        model:      'gpt-4o',
        max_tokens: 400,
        messages: [
          {
            role: 'system',
            content: 'You are a cooking instructor reviewing a student photo. Respond with valid JSON only.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `I'm making "${recipeName}" and I'm on this step: "${step}".
Analyse my photo and return this exact JSON:
{
  "match":   {"label": "STEP MATCH",   "text": "...", "type": "success|warning|danger"},
  "texture": {"label": "TEXTURE",      "text": "...", "type": "success||warning"},
  "tip":     {"label": "NEXT ACTION",  "text": "...", "type": ""}
}`,
              },
              { type: 'image_url', image_url: { url: image, detail: 'low' } },
            ],
          },
        ],
      });

      return jsonRes(res, 200, parsed);
    }

    // ── Ask Nova: grounded cooking Q&A in her mood voice ─────────────────────
    if (mode === 'ask') {
      if (!question) return jsonRes(res, 400, { error: 'question is required' });

      const TONE_PERSONA = {
        listener:    'quiet, present, unhurried — you hold space and answer plainly',
        calm:        'grounding and slow; you lower the temperature and reassure',
        coach:       'warm but pointed; you name the fix and the next move',
        cheerleader: 'big encouraging energy; you believe in the cook',
        sassy:       'a little unhinged but deeply on their side — comfort with teeth',
      };
      const sources = (context || [])
        .map(c => `- "${c.name}"${c.source ? ` (${c.source})` : ''}${c.snippet ? `: ${c.snippet}` : ''}`)
        .join('\n') || '(no specific recipe matched)';

      const parsed = await openai(apiKey, {
        model:       'gpt-4o-mini',
        max_tokens:  500,
        temperature: 0.5,
        messages: [
          {
            role: 'system',
            content:
              `You are Nova, the home-cooking brain inside Dig In. Voice: ${TONE_PERSONA[tone] || TONE_PERSONA.listener}. ` +
              'Answer the cooking question practically and accurately — substitutions, technique, troubleshooting, food safety. ' +
              'Be specific and concise (2–5 sentences). Ground your answer in the provided sources when relevant and cite them. ' +
              'For food-safety questions, give the safe answer (temperatures, times) and never guess. Respond with valid JSON only — no markdown fences.',
          },
          {
            role: 'user',
            content: `Question: ${question}

Sources from my cookbooks that may be relevant:
${sources}

Return this exact JSON:
{
  "answer": "your answer in Nova's voice, 2–5 sentences",
  "citations": [{"name": "Recipe or source name", "source": "book name"}]
}
Only cite sources listed above; use an empty array if none apply.`,
          },
        ],
      });

      return jsonRes(res, 200, parsed);
    }

    // ── Trending dishes: what's currently ordered on delivery in this area,
    //    for the Food Cost Arbitrage feed ────────────────────────────────────
    if (mode === 'trending') {
      const avoid = existingNames.length ? `Avoid repeating: ${existingNames.join(', ')}.` : '';

      const parsed = await openai(apiKey, {
        model:       'gpt-4o-mini',
        max_tokens:  1400,
        temperature: 0.8,
        messages: [
          {
            role: 'system',
            content:
              'You generate realistic, currently-popular delivery-app dishes (the kind ordered via UberEats/DoorDash/GrubHub) ' +
              'for a cost-comparison feature that shows a dish\'s delivery price next to its true home-cooked ingredient cost. ' +
              'Prices must be realistic and internally consistent (delivery price > ingredient cost, by a lot). ' +
              'Respond with valid JSON only — no markdown fences, no text outside the JSON.',
          },
          {
            role: 'user',
            content: `Generate ${count} trending delivery dishes for ${area || 'a typical US city'}. ${avoid}

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
      "instructions": ["Step 1", "Step 2", "Step 3", "Step 4"]
    }
  ]
}

Rules:
- deliveryBase is the base menu price only (fees are added separately downstream), realistic for the dish
- 4-5 ingredients per dish with realistic grocery-store prices (their sum should be well under deliveryBase)
- 4-6 concrete instruction steps
- Vary cuisines across the ${count} dishes`,
          },
        ],
      });

      return jsonRes(res, 200, parsed);
    }

    return jsonRes(res, 400, { error: `Unknown mode: ${mode}` });

  } catch (err) {
    console.error('[recipe-ai]', err.message);
    return jsonRes(res, 500, { fallback: true, error: 'AI service error' });
  }
}
