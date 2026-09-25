/* recipeTransform.js — turn ANY recipe into a gluten-free, vegan,
   allergy-safe, or cuisine-fusion version, for real: an actual rewritten
   ingredient list + technique notes, not just a filter tag hiding recipes
   that don't already qualify.

   Rule-based and transparent on purpose — every change carries a plain
   "why," so a swap can be inspected and second-guessed instead of taking
   an AI's word for it. Reuses the app's existing substitute data wherever
   it already exists (healthify.js's flour/fat/dairy options, allergyProfile
   .js's per-allergen substitutions) rather than inventing a second, looser
   copy — one dataset per kind of swap, app-wide. */

import { ingredientText } from '../components/recipe/RecipeBoostSections';
import { FLOUR_ALTERNATIVES, FAT_SUBSTITUTES, DAIRY_SUBSTITUTES, SUGAR_SUBSTITUTES, STARCH_SUBSTITUTES } from './healthify';
import { ALLERGEN_KW, SUBSTITUTIONS as ALLERGEN_SUBS, ALLERGENS } from './allergyProfile';
import { REGIONS } from './regions';
import { BASES, FILLINGS } from './remixEngine';

function textOf(ingredients) { return (ingredients || []).map(ingredientText).filter(Boolean); }

// ── Gluten-free ────────────────────────────────────────────────────────
// Order matters: more specific matches (couscous, breadcrumbs, tortilla)
// are checked before the generic "flour" catch-all, so a line only ever
// matches the most specific real substitute for what it actually is.
const GF_FLOUR = FLOUR_ALTERNATIVES.find(f => f.glutenFree) || FLOUR_ALTERNATIVES[0];
const GLUTEN_FREE_RULES = [
  { test: /couscous/i, to: 'cooked quinoa', reason: 'Couscous is tiny wheat pasta — quinoa is a naturally gluten-free stand-in with a similar bite.' },
  { test: /\borzo\b/i, to: 'gluten-free orzo or rice', reason: 'Orzo is a wheat pasta shaped like rice — swap for a gluten-free orzo or just rice.' },
  { test: /\budon\b|\bramen noodles?\b|wonton wrapper|dumpling wrapper|egg noodles?/i, to: 'rice noodles or rice paper wrappers', reason: 'Udon, ramen, wonton/dumpling wrappers, and egg noodles are all wheat-based — rice versions are naturally gluten-free.' },
  { test: /phyllo|\bfilo\b|puff pastry|pie crust/i, to: 'gluten-free phyllo or pastry dough (or a crustless version)', reason: 'Phyllo, puff pastry, and pie crust are all made from wheat flour.' },
  { test: /panko|bread\s?crumbs?/i, to: 'gluten-free breadcrumbs or crushed rice crackers', reason: 'Regular breadcrumbs and panko are made from wheat bread.' },
  { test: /\bnaan\b|flat\s?bread|\bpita\b/i, to: 'gluten-free flatbread or corn tortillas', reason: 'Naan, pita, and most flatbreads are made from wheat flour.' },
  { test: /soy sauce/i, to: 'tamari', reason: 'Regular soy sauce is usually brewed with wheat — tamari is the naturally gluten-free version with the same flavor.' },
  { test: /tortilla/i, to: 'corn tortillas', reason: 'Corn tortillas are naturally gluten-free; flour tortillas aren\'t.' },
  { test: /\bbeer\b/i, to: 'gluten-free beer or sparkling water', reason: 'Most beer is brewed from barley or wheat.' },
  { test: /\bbarley\b/i, to: 'pearled sorghum or rice', reason: 'Barley contains gluten — sorghum or rice give a similar chewy texture.' },
  { test: /pasta|spaghetti|fettuccine|penne|macaroni|linguine|lasagna noodles?/i, to: 'gluten-free pasta', reason: 'Same shape and cook time, made from rice or corn instead of wheat.' },
  { test: /\bbread\b/i, to: 'gluten-free bread', reason: 'Regular bread is made from wheat flour.' },
  { test: /\bwheat\b|all-purpose flour|white flour|\bflour\b/i, to: `${GF_FLOUR.label.toLowerCase()} (1:1 gluten-free blend also works)`, reason: GF_FLOUR.note },
];

export function transformToGlutenFree(rawIngredients) {
  const lines = textOf(rawIngredients);
  const changes = [];
  const out = lines.map(line => {
    const rule = GLUTEN_FREE_RULES.find(r => r.test.test(line));
    if (!rule) return line;
    changes.push({ original: line, replacement: rule.to, reason: rule.reason });
    return rule.to;
  });
  const techniqueNotes = [];
  if (changes.some(c => /flour/i.test(c.replacement))) {
    techniqueNotes.push('Gluten-free doughs and batters won\'t get stretchy like wheat dough — mix just until combined rather than kneading hard, and expect a slightly denser result.');
  }
  return { ingredients: out, changes, addedIngredients: [], techniqueNotes };
}

// ── Vegan ─────────────────────────────────────────────────────────────
const VEGAN_MILK = ALLERGEN_SUBS.milk[1]; // 'Oat milk'
const VEGAN_EGG = ALLERGEN_SUBS.eggs[3];  // flax egg
const VEGAN_CREAM = DAIRY_SUBSTITUTES[0]; // coconut cream
const VEGAN_FAT = FAT_SUBSTITUTES[1];     // coconut oil — solid at room temp like butter

const VEGAN_RULES = [
  { test: /heavy cream|whipping cream/i, to: `${VEGAN_CREAM.label.toLowerCase()}`, reason: VEGAN_CREAM.note },
  { test: /\bmilk\b/i, to: `${VEGAN_MILK.toLowerCase()}`, reason: 'A neutral 1:1 dairy-free swap in most cooking and baking.' },
  { test: /\byogurt\b/i, to: 'coconut or soy yogurt', reason: 'Plant-based yogurts work the same way — as a tangy, creamy base or topping.' },
  { test: /\bbutter\b/i, to: `${VEGAN_FAT.label.toLowerCase()}`, reason: VEGAN_FAT.note },
  { test: /\bcheese\b/i, to: 'nutritional yeast or a dairy-free cheese shred', reason: 'Nutritional yeast brings a savory, cheesy flavor; dairy-free shreds melt similarly in cooked dishes.' },
  { test: /\begg[s]?\b/i, to: `${VEGAN_EGG}`, reason: 'Acts as a binder the same way an egg does in baking.' },
  { test: /\bhoney\b/i, to: 'maple syrup or agave', reason: 'Honey is an animal product (made by bees) — maple syrup and agave are 1:1 plant-based swaps in most recipes.' },
  { test: /\bfish sauce\b/i, to: 'soy sauce + a squeeze of lime', reason: 'Gets close to fish sauce\'s salty depth without the fish.' },
  { test: /\bshrimp|crab|lobster|scallop\b/i, to: 'marinated hearts of palm or king oyster mushroom', reason: 'Hearts of palm and king oyster mushroom shred into a flaky, seafood-like texture.' },
  { test: /\bfish\b|salmon|tuna|cod|tilapia|halibut/i, to: 'marinated tofu or hearts of palm', reason: 'Tofu takes on the same marinade and seasoning; hearts of palm mimics a flaky texture.' },
  { test: /\bbacon\b|\bsausage\b|\bham\b|deli meat/i, to: 'smoky marinated tempeh or plant-based sausage', reason: 'Tempeh takes on smoky, salty marinades well and holds together when cooked.' },
  { test: /chicken|turkey|\bbeef\b|\bpork\b|\blamb\b|ground beef|steak/i, to: 'extra-firm tofu, tempeh, or shredded jackfruit', reason: 'Tofu and tempeh take on marinades and sauces well; canned young jackfruit shreds like pulled meat.' },
];

export function transformToVegan(rawIngredients) {
  const lines = textOf(rawIngredients);
  const changes = [];
  const out = lines.map(line => {
    const rule = VEGAN_RULES.find(r => r.test.test(line));
    if (!rule) return line;
    changes.push({ original: line, replacement: rule.to, reason: rule.reason });
    return rule.to;
  });
  const techniqueNotes = [];
  if (changes.some(c => /tofu|tempeh|jackfruit/i.test(c.replacement))) {
    techniqueNotes.push('Press tofu (wrap in a towel, set something heavy on top for 15 minutes) before cooking — it browns and takes on marinade far better once the extra water is out.');
  }
  return { ingredients: out, changes, addedIngredients: [], techniqueNotes };
}

// ── Allergy-safe — rewrites only the allergens THIS user has actually
// flagged, reusing the exact keyword set + substitution list scanRecipe
// Allergens()/AllergyPanel already use, so this can't disagree with the
// warnings shown elsewhere on the same recipe. ──────────────────────────
export function transformForAllergies(rawIngredients, flaggedAllergenIds = []) {
  const lines = textOf(rawIngredients);
  const changes = [];
  const flagged = ALLERGENS.filter(a => flaggedAllergenIds.includes(a.id));
  const out = lines.map(line => {
    const lower = line.toLowerCase();
    for (const a of flagged) {
      const kws = ALLERGEN_KW[a.id] || [];
      const hit = kws.find(kw => lower.includes(kw));
      if (!hit) continue;
      const sub = (ALLERGEN_SUBS[a.id] || [])[0];
      if (!sub) continue;
      changes.push({ original: line, replacement: sub, reason: `Replaced because "${hit}" matches ${a.label}, which you've flagged in your allergy profile.` });
      return sub;
    }
    return line;
  });
  return { ingredients: out, changes, addedIngredients: [], techniqueNotes: [] };
}

// ── Fusion — swap the seasoning base toward a target region's real,
// well-known flavor building blocks, leaving the protein/starch structure
// of the dish alone. Same "it's all in the seasoning" idea the landing
// page's TransformationExamples already shows off as a static example —
// this is the real, general engine behind that idea. ────────────────────
export const REGION_FLAVOR_PROFILES = {
  'east-asia': {
    signatureWords: ['soy sauce', 'sesame oil', 'five-spice', 'rice vinegar', 'miso', 'oyster sauce'],
    coreAdd: [
      { text: '2 tbsp soy sauce', key: 'soy sauce' },
      { text: '1 tsp toasted sesame oil', key: 'sesame oil' },
      { text: '1 tsp grated ginger', key: 'ginger' },
      { text: '2 sliced scallions', key: 'scallion' },
    ],
    techniqueNote: 'Add sesame oil off the heat at the very end — its aroma fades fast if it cooks too long.',
  },
  sea: {
    signatureWords: ['fish sauce', 'lemongrass', 'coconut milk', 'thai basil', 'lime leaf', 'galangal'],
    coreAdd: [
      { text: '1 tbsp fish sauce', key: 'fish sauce' },
      { text: 'juice of 1 lime', key: 'lime' },
      { text: '1 tsp chili, minced', key: 'chili' },
      { text: 'fresh Thai basil or cilantro', key: 'cilantro' },
    ],
    techniqueNote: 'Balance fish sauce\'s saltiness against lime and a touch of sugar — that push-pull is the core of Southeast Asian cooking.',
  },
  'south-asia': {
    signatureWords: ['garam masala', 'turmeric', 'curry leaves', 'ghee', 'cumin seed'],
    coreAdd: [
      { text: '1 tsp turmeric', key: 'turmeric' },
      { text: '1–2 tsp garam masala', key: 'garam masala' },
      { text: '1 tsp ground cumin', key: 'cumin' },
      { text: '2 cloves garlic + 1 inch ginger, minced', key: 'ginger' },
    ],
    techniqueNote: 'Bloom the ground spices in hot oil for about 30 seconds before adding anything else — flavor stays flat if they go in later.',
  },
  mideast: {
    signatureWords: ["za'atar", 'sumac', 'tahini', 'harissa', 'pomegranate molasses'],
    coreAdd: [
      { text: '1 tsp ground cumin', key: 'cumin' },
      { text: '1 tsp sumac', key: 'sumac' },
      { text: 'juice of 1 lemon', key: 'lemon' },
      { text: 'fresh parsley or mint', key: 'parsley' },
    ],
    techniqueNote: 'A squeeze of lemon and a scatter of fresh herbs at the very end brightens up what\'s otherwise a warm, earthy spice base.',
  },
  europe: {
    signatureWords: ['oregano', 'rosemary', 'thyme', 'parmesan', 'balsamic'],
    coreAdd: [
      { text: '2 tbsp olive oil', key: 'olive oil' },
      { text: '1 tsp dried oregano or fresh rosemary', key: 'oregano' },
      { text: 'a squeeze of lemon', key: 'lemon' },
    ],
    techniqueNote: 'Good olive oil added at the end, not just used for cooking, is doing a lot of the flavor work here.',
  },
  africa: {
    signatureWords: ['berbere', 'ras el hanout', 'harissa', 'peri-peri'],
    coreAdd: [
      { text: '1–2 tsp berbere or ras el hanout spice blend', key: 'berbere' },
      { text: 'fresh ginger, minced', key: 'ginger' },
      { text: 'fresh cilantro', key: 'cilantro' },
    ],
    techniqueNote: 'These spice blends are potent — start with less than you\'d think and build up to taste.',
  },
  americas: {
    signatureWords: ['chili powder', 'chipotle', 'smoked paprika', 'adobo'],
    coreAdd: [
      { text: '1 tsp ground cumin', key: 'cumin' },
      { text: '1 tsp chili powder', key: 'chili powder' },
      { text: 'juice of 1 lime', key: 'lime' },
      { text: 'fresh cilantro', key: 'cilantro' },
    ],
    techniqueNote: 'Toast the ground chili and cumin in the dry pan for about a minute before adding liquid — it deepens the flavor a lot.',
  },
  oceania: {
    signatureWords: ['macadamia', 'lemon myrtle', 'bush tomato'],
    coreAdd: [
      { text: '1 tbsp macadamia oil or olive oil', key: 'macadamia' },
      { text: 'zest of 1 lemon', key: 'lemon zest' },
      { text: 'fresh cracked pepper', key: 'cracked pepper' },
    ],
    techniqueNote: 'This region\'s cooking leans on quality ingredients over heavy seasoning — go easy and taste as you go.',
  },
};

const ALL_SIGNATURE_WORDS = Object.entries(REGION_FLAVOR_PROFILES)
  .flatMap(([id, p]) => p.signatureWords.map(w => ({ word: w, region: id })));

export function transformToFusion(rawIngredients, targetRegionId) {
  const profile = REGION_FLAVOR_PROFILES[targetRegionId];
  const regionMeta = REGIONS.find(r => r.id === targetRegionId);
  if (!profile || !regionMeta) return { ingredients: textOf(rawIngredients), changes: [], addedIngredients: [], techniqueNotes: [], regionLabel: null };

  const lines = textOf(rawIngredients);
  const changes = [];
  let addIdx = 0;
  const out = lines.map(line => {
    const lower = line.toLowerCase();
    const foreignHit = ALL_SIGNATURE_WORDS.find(s => s.region !== targetRegionId && lower.includes(s.word));
    if (!foreignHit) return line;
    const replacement = profile.coreAdd[addIdx % profile.coreAdd.length];
    addIdx += 1;
    changes.push({ original: line, replacement: replacement.text, reason: `Swapped for a ${regionMeta.label}-style seasoning instead.` });
    return replacement.text;
  });

  // Only add the target region's own core items that aren't already present
  // (after swaps) — so a dish that already has garlic/ginger doesn't get a
  // redundant second line of it.
  const finalText = out.join(' ').toLowerCase();
  const addedIngredients = profile.coreAdd
    .filter(item => !finalText.includes(item.key))
    .map(item => item.text)
    .slice(0, 3);

  return {
    ingredients: [...out, ...addedIngredients],
    changes,
    addedIngredients,
    techniqueNotes: [profile.techniqueNote],
    regionLabel: regionMeta.label,
  };
}

// ── Healthier — lighter but still-real substitutes, one gentle pick per
// category (healthify.js's own dataset), applied automatically so this stays
// a one-click mode like every other one here rather than a second picker. ──
const HEALTHIER_SUGAR = SUGAR_SUBSTITUTES.find(s => s.id === 'monk-fruit');
const HEALTHIER_FLOUR = FLOUR_ALTERNATIVES.find(f => f.id === 'oat');
const HEALTHIER_FAT = FAT_SUBSTITUTES.find(f => f.id === 'applesauce-fat');
const HEALTHIER_DAIRY = DAIRY_SUBSTITUTES.find(f => f.id === 'silken-tofu');
const HEALTHIER_STARCH = STARCH_SUBSTITUTES.find(f => f.id === 'zucchini-noodles');

const HEALTHIER_RULES = [
  { test: /\bsugar\b/i, to: `${HEALTHIER_SUGAR.label.toLowerCase()} (use about 1/16 the amount)`, reason: HEALTHIER_SUGAR.note },
  { test: /pasta|spaghetti|fettuccine|penne|macaroni|linguine/i, to: HEALTHIER_STARCH.label.toLowerCase(), reason: HEALTHIER_STARCH.note },
  { test: /heavy cream|whipping cream/i, to: HEALTHIER_DAIRY.label.toLowerCase(), reason: HEALTHIER_DAIRY.note },
  { test: /\bbutter\b/i, to: HEALTHIER_FAT.label.toLowerCase(), reason: HEALTHIER_FAT.note },
  { test: /white flour|all-purpose flour|\bflour\b/i, to: `${HEALTHIER_FLOUR.label.toLowerCase()} (start by replacing about half)`, reason: HEALTHIER_FLOUR.note },
];

export function transformToHealthier(rawIngredients) {
  const lines = textOf(rawIngredients);
  const changes = [];
  const out = lines.map(line => {
    const rule = HEALTHIER_RULES.find(r => r.test.test(line));
    if (!rule) return line;
    changes.push({ original: line, replacement: rule.to, reason: rule.reason });
    return rule.to;
  });
  const techniqueNotes = [];
  if (changes.some(c => /flour/i.test(c.replacement))) {
    techniqueNotes.push('Swapping in a lighter flour works best as a partial swap, not a full one — start around half and adjust next time.');
  }
  return { ingredients: out, changes, addedIngredients: [], techniqueNotes };
}

// ── Remix — the arbitrary-recipe version of remixEngine.js's "same base,
// new filling" idea: detect which of the 9 bases this dish is actually built
// on, reframe everything else as the swappable "filling" layer, and suggest
// a different filling from a contrasting flavor family. remixEngine.js's
// curated 9×9 SIGNATURES table only knows its own 81 combos, so it can't be
// reused directly — this composes straight from its BASES/FILLINGS data
// against real ingredient text instead. ─────────────────────────────────
const CARRIER_RULES = [
  { test: /tortilla|\bwrap\b/i, baseId: 'tortilla' },
  { test: /\bpasta\b|spaghetti|fettuccine|penne|macaroni|linguine/i, baseId: 'pasta' },
  { test: /\brice\b/i, baseId: 'rice' },
  { test: /\bpotato(es)?\b/i, baseId: 'potato' },
  { test: /\btoast\b|\bbread\b/i, baseId: 'toast' },
  { test: /\begg[s]?\b/i, baseId: 'eggs' },
  { test: /\boats?\b/i, baseId: 'oats' },
  { test: /pancake batter|\bpancakes?\b/i, baseId: 'pancake' },
  { test: /\bdough\b/i, baseId: 'roll-dough' },
];
const REMIX_STAPLE = /^(salt|pepper|black pepper|kosher salt|olive oil|vegetable oil|butter|water|cooking spray)\b/i;
const REMIX_FAMILY_HINTS = [
  { family: 'sweet', test: /sugar|cinnamon|honey|maple|chocolate|vanilla|berries|\bfruit\b/i },
  { family: 'spicy', test: /buffalo|hot sauce|\bchili\b|cayenne|sriracha|jalape[ñn]o/i },
  { family: 'global', test: /curry|\bfeta\b|mediterranean|masala|tahini|harissa/i },
];

function detectRemixFamily(text) {
  const hit = REMIX_FAMILY_HINTS.find(h => h.test.test(text));
  return hit ? hit.family : 'savory';
}

export function transformToRemix(rawIngredients) {
  const lines = textOf(rawIngredients);
  const text = lines.join(' ').toLowerCase();
  const carrierRule = CARRIER_RULES.find(r => r.test.test(text));
  if (!carrierRule) return { ingredients: lines, changes: [], addedIngredients: [], techniqueNotes: [], carrierLabel: null, fillingLabel: null };

  const base = BASES.find(b => b.id === carrierRule.baseId);
  const currentFamily = detectRemixFamily(text);
  const filling = FILLINGS.find(f => f.family !== currentFamily) || FILLINGS[0];

  const changes = [];
  const kept = lines.filter(line => {
    if (carrierRule.test.test(line) || REMIX_STAPLE.test(line.trim())) return true;
    changes.push({ original: line, replacement: '(removed — replaced by the new filling below)', reason: `Keeping the ${base.label.toLowerCase()} — only the filling is changing.` });
    return false;
  });

  const addedIngredients = [filling.mixins, filling.topping]
    .map(s => s.charAt(0).toUpperCase() + s.slice(1));

  return {
    ingredients: [...kept, ...addedIngredients],
    changes,
    addedIngredients,
    techniqueNotes: [`Same ${base.label.toLowerCase()}, same technique (${base.cookLine.toLowerCase()}) — only the filling changed. That's the whole trick.`],
    carrierLabel: base.label,
    fillingLabel: filling.label,
  };
}

// ── Unified dispatcher — returns a full new recipe-shaped object that
// drops straight into the same sessionStorage → /recipe handoff every
// other generated recipe in this app uses (healthify.js's buildHealthyBase,
// recipeAlchemist.js's alchemize). ───────────────────────────────────────
const MODE_LABEL = { 'gluten-free': 'gluten-free', vegan: 'vegan', 'allergy-safe': 'your allergy profile', fusion: null, healthier: 'a lighter version', remix: null };

export function transformRecipe(recipe, mode, opts = {}) {
  const rawIngredients = recipe.ingredients?.length ? recipe.ingredients : [];
  let result;
  let suffix;

  if (mode === 'gluten-free') { result = transformToGlutenFree(rawIngredients); suffix = 'Gluten-Free'; }
  else if (mode === 'vegan') { result = transformToVegan(rawIngredients); suffix = 'Vegan'; }
  else if (mode === 'allergy-safe') { result = transformForAllergies(rawIngredients, opts.allergenIds || []); suffix = 'Allergy-Safe'; }
  else if (mode === 'fusion') {
    if (!opts.regionId) return null;
    result = transformToFusion(rawIngredients, opts.regionId);
    suffix = `${result.regionLabel} Fusion`;
  } else if (mode === 'healthier') { result = transformToHealthier(rawIngredients); suffix = 'Healthier'; }
  else if (mode === 'remix') {
    result = transformToRemix(rawIngredients);
    if (!result.carrierLabel) return { noChangesNeeded: true, modeLabel: 'remix', noRemixBase: true };
    suffix = `${result.fillingLabel} Remix`;
  } else return null;

  const noChangesNeeded = result.changes.length === 0 && (result.addedIngredients || []).length === 0;
  const modeLabel = mode === 'fusion' ? `${result.regionLabel} flavors`
    : mode === 'remix' ? `${result.fillingLabel} filling`
    : MODE_LABEL[mode];

  if (noChangesNeeded) {
    return { noChangesNeeded: true, modeLabel };
  }

  const baseSteps = recipe.instructions || recipe.steps || [];
  return {
    ...recipe,
    id: `${recipe.id || recipe.name || 'recipe'}-${mode}-${Date.now().toString(36)}`,
    name: `${recipe.name || 'Recipe'} (${suffix})`,
    ingredients: result.ingredients,
    instructions: [...baseSteps, ...result.techniqueNotes],
    noChangesNeeded: false,
    modeLabel,
    _transform: {
      mode, regionLabel: result.regionLabel || null,
      changes: result.changes, addedIngredients: result.addedIngredients || [], techniqueNotes: result.techniqueNotes,
    },
  };
}
