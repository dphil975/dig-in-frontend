/* starterEngine.js — geometry, resonance, and starter-set generation for
   the onboarding flow. Translates a user's cooking-intent answers into a
   biofield, scores every recipe against it (topology), and picks five
   cards with distinct roles: anchor, bridge, stretch, wildcard, memory.

   The system creates a seamless, personalized first experience — the app
   is trying to spark joy around what the user is capable of, not sell them
   something. */

import { recipeFlavors, FLAVORS } from '../flavorProfile';

// ── Geometry Engine ────────────────────────────────────────────
// Each recipe gets a geometric signature based on its properties.
// The number of sides encodes complexity; the hue encodes flavor.

export const GeometryEngine = {
  signature(recipe) {
    const time = (recipe.prepTime || 0) + (recipe.cookTime || 0) || recipe.time || 0;
    const ingCount = (recipe.ingredients || []).length;
    const stepCount = (recipe.instructions || recipe.steps || []).length;

    const complexity = Math.min(ingCount, 12) + Math.min(stepCount, 10);
    const sides = complexity < 4 ? 3 : complexity < 8 ? 4 : complexity < 14 ? 5 : complexity < 20 ? 6 : 8;

    const flavors = recipeFlavors(recipe);
    const flavorIdx = flavors.length ? FLAVORS.indexOf(flavors[0]) : 0;
    const hue = ((flavorIdx >= 0 ? flavorIdx : 0) * 45 + 30) % 360;

    const shape = sides === 3 ? 'triangle' : sides === 4 ? 'square'
      : sides === 5 ? 'pentagon' : sides === 6 ? 'hexagon' : 'octagon';

    return { sides, hue, shape, complexity, time };
  },
};

// ── Morphogenetic Field ────────────────────────────────────────
// Builds a biofield from the user's onboarding answers, then
// scores every recipe by how well it resonates with that field.

export const MorphogeneticField = {
  fromAnswers(answers) {
    const field = { time: 30, complexity: 'medium', flavors: [], social: 'solo', intent: 'routine' };

    const dish = (answers.dish || '').toLowerCase();
    if (dish.includes('quick')) { field.time = 15; field.complexity = 'simple'; }
    else if (dish.includes('comforting')) { field.flavors.push('rich', 'savory'); field.complexity = 'medium'; }
    else if (dish.includes('fresh')) { field.flavors.push('light', 'tangy'); field.complexity = 'simple'; }
    else if (dish.includes('impressive')) { field.complexity = 'complex'; field.time = 90; }
    else if (dish.includes('familiar')) { field.flavors.push('savory'); field.complexity = 'simple'; }
    else if (dish.includes('new')) { field.complexity = 'complex'; field.flavors.push('spicy'); }

    const time = (answers.time || '').toLowerCase();
    if (time.includes('15')) field.time = 15;
    else if (time.includes('30')) field.time = 30;
    else if (time.includes('1 hour')) field.time = 60;
    else if (time.includes('2 hour')) field.time = 120;
    else if (time.includes('all day') || time.includes('weekend')) field.time = 240;

    const people = (answers.people || '').toLowerCase();
    if (people.includes('just me')) field.social = 'solo';
    else if (people.includes('crowd') || people.includes('family')) field.social = 'group';
    else if (people.includes('two')) field.social = 'couple';
    else if (people.includes('meal prep')) field.social = 'batch';

    const reason = (answers.reason || '').toLowerCase();
    if (reason.includes('love') || reason.includes('celebrating')) field.intent = 'special';
    else if (reason.includes('saving money')) field.intent = 'budget';
    else if (reason.includes('learning')) field.intent = 'growth';
    else if (reason.includes('feel something')) field.intent = 'comfort';

    return field;
  },

  resonance(biofield, recipe) {
    let score = 0;
    let total = 0;

    const recipeTime = (recipe.prepTime || 0) + (recipe.cookTime || 0) || recipe.time || 0;
    if (recipeTime > 0) {
      total += 30;
      const timeDiff = Math.abs(recipeTime - biofield.time);
      score += Math.max(0, 30 - timeDiff * 0.5);
    }

    const flavors = recipeFlavors(recipe);
    total += 30;
    const flavorMatch = biofield.flavors.filter(f => flavors.includes(f)).length;
    score += biofield.flavors.length > 0
      ? (flavorMatch / biofield.flavors.length) * 30
      : flavors.length > 0 ? 15 : 10;

    const geo = GeometryEngine.signature(recipe);
    total += 20;
    if (biofield.complexity === 'simple' && geo.complexity < 8) score += 20;
    else if (biofield.complexity === 'complex' && geo.complexity > 14) score += 20;
    else if (biofield.complexity === 'medium' && geo.complexity >= 6 && geo.complexity <= 16) score += 20;
    else score += 8;

    total += 20;
    if (biofield.intent === 'budget' && recipe.difficulty === 'Easy') score += 15;
    else if (biofield.intent === 'growth' && recipe.difficulty === 'Hard') score += 15;
    else if (biofield.intent === 'comfort') score += (flavors.includes('rich') || flavors.includes('savory')) ? 18 : 8;
    else score += 10;

    return total > 0 ? Math.min(1, score / total) : 0.5;
  },

  sort(biofield, recipes) {
    return [...recipes]
      .map(r => ({ r, score: MorphogeneticField.resonance(biofield, r) + Math.random() * 0.08 }))
      .sort((a, b) => b.score - a.score)
      .map(x => x.r);
  },
};

// ── Ley Line Engine ────────────────────────────────────────────
// Finds connections between recipes — shared ingredients, cuisines,
// or flavor profiles that create a web of related dishes.

export const LeyLineEngine = {
  connections(recipe, allRecipes) {
    const flavors = new Set(recipeFlavors(recipe));
    const country = (recipe.country || '').toLowerCase();
    const ings = new Set((recipe.ingredients || []).map(i =>
      (typeof i === 'string' ? i : i?.name || i?.text || '').toLowerCase().trim()
    ).filter(Boolean));

    const links = [];
    for (const other of allRecipes) {
      if (other.id === recipe.id) continue;
      let strength = 0;

      const otherFlavors = recipeFlavors(other);
      const shared = otherFlavors.filter(f => flavors.has(f)).length;
      if (shared > 0) strength += shared * 10;

      if (country && (other.country || '').toLowerCase() === country) strength += 15;

      const otherIngs = (other.ingredients || []).map(i =>
        (typeof i === 'string' ? i : i?.name || i?.text || '').toLowerCase().trim()
      );
      const ingOverlap = otherIngs.filter(i => ings.has(i)).length;
      strength += ingOverlap * 5;

      if (strength > 0) links.push({ recipe: other, strength });
    }

    return links.sort((a, b) => b.strength - a.strength).slice(0, 8);
  },
};

// ── Starter Set Generator ──────────────────────────────────────
// Five cards, each with a distinct role:
//   anchor   — highest resonance, the "this is your dish"
//   bridge   — second-highest, similar but slightly different
//   stretch  — something outside the comfort zone
//   wildcard — different cuisine from the anchor
//   memory   — if they've saved anything before, reconnect to it

export function generateStarterSet(biofield, allRecipes) {
  const sorted = MorphogeneticField.sort(biofield, allRecipes);
  if (sorted.length < 5) return sorted.map((r, i) => ({ role: ['anchor', 'bridge', 'stretch', 'wildcard', 'memory'][i] || 'anchor', recipe: r }));

  const anchor = sorted[0];
  const bridge = sorted[1];

  const stretchPool = sorted.slice(Math.floor(sorted.length * 0.4));
  const stretch = stretchPool[Math.floor(Math.random() * Math.min(stretchPool.length, 10))];

  const anchorCountry = (anchor.country || '').toLowerCase();
  const wildcard = sorted.find(r => r !== anchor && r !== bridge && r !== stretch && (r.country || '').toLowerCase() !== anchorCountry) || sorted[3];

  let memory = sorted[4];
  try {
    const saved = JSON.parse(localStorage.getItem('dig_in_collection') || '[]');
    if (saved.length > 0) {
      const remembered = saved.find(s => sorted.some(r => (r.id ?? r.name) === (s.id ?? s.name)));
      if (remembered) {
        const full = sorted.find(r => (r.id ?? r.name) === (remembered.id ?? remembered.name));
        if (full) memory = full;
      }
    }
  } catch { /* ignore */ }

  return [
    { role: 'anchor', recipe: anchor },
    { role: 'bridge', recipe: bridge },
    { role: 'stretch', recipe: stretch },
    { role: 'wildcard', recipe: wildcard },
    { role: 'memory', recipe: memory },
  ];
}

// ── Ingredient Recall Check ────────────────────────────────────
// Cross-reference a recipe's ingredients against the recall cache.
// Used inline in RecipeFull to warn about recalled ingredients.

export function checkRecipeRecalls(ingredients) {
  let cache;
  try { cache = JSON.parse(localStorage.getItem('dig_in_recall_cache') || '{}'); } catch { return []; }

  const hits = [];
  for (const ing of ingredients || []) {
    const text = (typeof ing === 'string' ? ing : ing?.name || ing?.text || '').toLowerCase().trim();
    if (!text) continue;

    for (const [key, entry] of Object.entries(cache)) {
      if (!entry?.recalls?.length) continue;
      if (text.includes(key) || key.includes(text)) {
        hits.push({ ingredient: text, recalls: entry.recalls, name: entry.name || key });
        break;
      }
    }
  }
  return hits;
}
