/* structuredTags.js — tags in two layers, with two different rules.

   Tumblr's tags are pure folksonomy: expressive, useless as filters.
   Instagram's are spam. The fix (Part 4 of docs/product/DIG_IN_ALGORITHM.md) is two layers
   with different rules AND different visual weight:

     Layer 1 — STRUCTURED (computed here, never typed). Each means exactly one
       thing, derived from real recipe data, so tapping one filters reliably.
       Rendered as bordered pixel chips.

     Layer 2 — VOICE (a small, finite whimsy vocabulary; capped at 3). Not
       filters — personality. "#brokebutfancy" is a joke, an identity, and a
       search term at once. Rendered as plain text, no border.

   splitTags() is what the UI calls to give the two layers their two weights.

   Honesty: we compute #vegan / #vegetarian / #dairyfree from the ingredient
   list because getting those subtly wrong is only a preference miss. We do NOT
   auto-assert #gf / #glutenfree — a false gluten-free tag is an allergy hazard,
   and free-text ingredient scanning can't clear that bar. That claim stays with
   the real diet-transform / allergy tools, never a computed feed chip. */

import { priceRecipe } from './tierBudget';

const hashify = (s) => '#' + String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

/* The finite personality vocabulary. A tag is a VOICE tag iff it's in here;
   everything else the feed emits (cuisine, flavor, cost, time, diet, context)
   is a structured tag. Keeping voice a closed set is the whole trick — that's
   what lets the cap-at-3 rule mean "you chose these," not "you spammed these." */
export const VOICE_VOCAB = new Set([
  '#itriedmybest', '#fridgeraid', '#brokebutfancy', '#hesaiditwasfine',
  '#kitchenwasagainstme', '#girldinner', '#useitup', '#swaps', '#thetable',
  '#getoutofyourarea', '#nofilter', '#firsttry', '#latenightcooking',
  '#cookingforone', '#feedingthevoid', '#itsfinediateit',
]);

export function isVoiceTag(tag) { return VOICE_VOCAB.has(tag); }
export function isStructuredTag(tag) { return !!tag && !VOICE_VOCAB.has(tag); }

/** Split a mixed tag list into its two layers, de-duped, order preserved.
    Voice is capped at 3 (the cap is the point — see file header). */
export function splitTags(tags = []) {
  const seen = new Set();
  const structured = [];
  const voice = [];
  for (const t of tags) {
    if (!t || seen.has(t)) continue;
    seen.add(t);
    (isVoiceTag(t) ? voice : structured).push(t);
  }
  return { structured, voice: voice.slice(0, 3) };
}

/* ── Layer 1 computation ─────────────────────────────────────────────────── */

function ingredientLines(recipe) {
  return (recipe?.ingredients || [])
    .map((i) => (typeof i === 'object' ? (i.text || i.name || '') : i))
    .filter(Boolean);
}

function perServingCost(recipe) {
  const lines = ingredientLines(recipe);
  if (!lines.length) return Infinity;
  try { return priceRecipe(lines, recipe, 'budget').perServing; }
  catch { return Infinity; }
}

// Cost family — reuses the already-built tier engine. Budget tier so the chip
// is the cheapest honest path to the dish, matching how tierBudget frames cost.
function costTags(recipe) {
  const c = perServingCost(recipe);
  if (c <= 5)  return ['#under5'];
  if (c <= 10) return ['#under10'];
  return [];
}

// Time family — from whatever total-time field the recipe carries.
function totalMinutes(recipe) {
  const t = recipe?.totalTime ?? recipe?.total_time
    ?? ((recipe?.prepTime || 0) + (recipe?.cookTime || 0)) ?? recipe?.time;
  if (typeof t === 'number' && t > 0) return t;
  const m = String(t || '').match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

function timeTags(recipe) {
  const m = totalMinutes(recipe);
  if (m == null) return [];
  if (m <= 15) return ['#15min'];
  if (m <= 30) return ['#30min'];
  if (m >= 90) return ['#slow'];
  return [];
}

/** How many ingredients a recipe lists (0 if none parseable). */
export function ingredientCount(recipe) {
  return ingredientLines(recipe).length;
}

// Fewer ingredients = less to buy, less to go wrong, less overwhelm — a real
// signal for someone rebuilding a kitchen or new to cooking. Claimed only when
// the list is short AND there's actually a list (not an empty/1-line stub).
function simplicityTags(recipe) {
  const n = ingredientCount(recipe);
  if (n >= 2 && n <= 6) return ['#fewingredients'];
  return [];
}

// Effort family — conservative, name-driven so we don't over-claim.
function effortTags(recipe) {
  const name = `${recipe?.name || ''} ${recipe?.description || ''}`.toLowerCase();
  const out = [];
  if (/one[- ]?pan|sheet ?pan|skillet|one[- ]?pot|dutch oven|traybake/.test(name)) out.push('#onepan');
  // Only claim no-cook when the dish explicitly is, and nothing implies heat.
  if (/no[- ]?cook|overnight oats|raw\b|chilled|ice[- ]?box/.test(name)
      && !/bake|roast|fry|simmer|boil|grill|sear|sauté|saute|broil|braise/.test(name)) {
    out.push('#nocook');
  }
  if (/no[- ]?kitchen|microwave|dorm|hot[- ]?plate|hotel room/.test(name)) out.push('#nokitchen');
  return out;
}

// Diet family — honest, and deliberately WITHOUT #gf (see file header).
const RE_MEAT  = /chicken|beef|pork|bacon|sausage|\bham\b|turkey|lamb|steak|\bmeat\b|fish|salmon|tuna|shrimp|prawn|seafood|anchov|gelatin|prosciutto|pancetta|guanciale|\bduck\b|veal|chorizo|clam|oyster|crab|lobster/;
const RE_DAIRY = /milk|cheese|butter|cream|yogurt|\bghee\b|parmes|parmigiano|mozzarella|cheddar|feta|labneh|paneer|custard|buttermilk|mascarpone|ricotta/;
const RE_EGG   = /\begg/;
const RE_HONEY = /honey/;

function dietTags(recipe) {
  const lines = ingredientLines(recipe);
  if (lines.length < 3) return [];              // too little to make a claim honestly
  const hay = lines.join(' ').toLowerCase();
  const meat  = RE_MEAT.test(hay);
  const dairy = RE_DAIRY.test(hay);
  const egg   = RE_EGG.test(hay);
  const honey = RE_HONEY.test(hay);
  const out = [];
  if (!meat && !dairy && !egg && !honey) out.push('#vegan');
  else if (!meat) out.push('#vegetarian');
  if (!dairy) out.push('#dairyfree');
  return out;
}

/**
 * The full structured-tag set for a recipe, in family order (cost, time,
 * effort, diet), plus any context tags the feed's context layer supplies
 * (#hotday, #firstfrost, #gameday, #inseason — see feedContext.js). Cuisine
 * and flavor tags are added by the caller (buildFeed) since they come from the
 * flavor engine; they're structured too and render as chips.
 *
 * @param recipe recipe object
 * @param ctx    { contextTags?: string[] }  — from feedContext.buildContext()
 * @param limit  cap so a chip row stays readable
 */
export function structuredTags(recipe, ctx = {}, limit = 5) {
  if (!recipe) return [];
  const out = [
    ...costTags(recipe),
    ...timeTags(recipe),
    ...simplicityTags(recipe),
    ...effortTags(recipe),
    ...dietTags(recipe),
    ...(ctx.contextTags || []),
  ];
  return [...new Set(out)].slice(0, limit);
}

export { hashify };
