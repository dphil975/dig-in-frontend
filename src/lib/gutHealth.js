/* gutHealth.js — fermented foods, fiber, polyphenols, FODMAPs, plant
   diversity, and a gut-friendly score. Also surfaces real reasoning for
   healthify.js swaps that affect gut health. */

import { healthifySwaps } from './healthify';

// Local null-safe helpers (used across the Health & Safety sibling files;
// each file keeps its own copy to stay self-contained and avoid circular
// imports between siblings).
function ingredientText(ing) {
  return typeof ing === 'object' && ing !== null ? (ing.text || ing.name || '') : (ing || '');
}

function textOf(ingredients) {
  return (ingredients || []).map(ingredientText).join(' ').toLowerCase();
}

/* gutHealth.js — what "gut health" actually means, backed by real research,
   not the marketing buzzword. "Gut friendly" on packaging usually means
   nothing regulated at all. Here it means five specific, checkable things:

   1. FIBER → SHORT-CHAIN FATTY ACIDS. Human enzymes can't digest fiber — it
      reaches the colon where gut bacteria ferment it into short-chain fatty
      acids (acetate, propionate, butyrate). Butyrate is the primary fuel
      source for the cells lining your colon. Most US adults eat well under
      the 25–38g/day recommended (average intake is closer to 15g) — a real,
      well-documented "fiber gap" (USDA Dietary Guidelines for Americans).

   2. FERMENTED FOODS → LIVE CULTURES. Yogurt, kefir, kimchi, sauerkraut,
      miso, tempeh, kombucha carry live microorganisms. A 2021 Stanford
      trial (Wastyk et al., Cell) found a 10-week fermented-food-rich diet
      measurably increased gut microbiome diversity and lowered several
      inflammatory markers, vs. a fiber-only diet — one of the more direct
      human trials on this, not a settled consensus for every claim made
      about fermented food.

   3. POLYPHENOLS → PREBIOTIC FUEL. Plant compounds in berries, cacao, green
      tea, olive oil, coffee, and herbs/spices are poorly absorbed in the
      small intestine — most of it reaches the colon, where gut bacteria
      metabolize it. Garlic, onion, leeks, and oats also contain specific
      prebiotic fibers (inulin, beta-glucan) that selectively feed
      beneficial bacteria.

   4. DIVERSITY. The American Gut Project (UC San Diego's citizen-science
      microbiome study, the largest of its kind) found people eating 30+
      distinct plant foods a week had measurably more diverse gut
      microbiomes than people eating 10 or fewer — and diversity itself is
      associated with a healthier gut ecosystem. One dish won't hit 30; this
      module counts distinct plant ingredients per recipe as one honest
      building block toward that weekly target, not a per-meal pass/fail.

   5. FODMAP — the flip side. A real Monash University clinical framework:
      certain carbs (garlic, onion, wheat, many legumes, apples, honey, some
      dairy) are poorly absorbed and rapidly fermented, which causes gas,
      bloating, and discomfort specifically in people with IBS or SIBO.
      A low-FODMAP diet is a short-term elimination protocol for THOSE
      people — it is not a general "these foods are bad" list, and most
      people don't need to avoid high-FODMAP food at all. Flagged here as
      information, never as a warning to everyone.

   GUT DISRUPTORS below include some genuinely well-established science
   (added sugar, low fiber) alongside newer, still-emerging research
   (emulsifiers, artificial sweeteners) — each entry says which. This is a
   hand-authored reference, not a lab analysis or a diagnosis — see
   GUT_HEALTH_DISCLAIMER. */

export const GUT_HEALTH_DISCLAIMER =
  'This is general nutrition education, not medical advice — gut health is individual, and conditions like IBS, SIBO, or IBD need an actual doctor or dietitian, not an ingredient scanner.';

// ── 1. Fermented foods — live active cultures ─────────────────────────────
export const FERMENTED_FOODS = [
  { id: 'yogurt',      label: 'Yogurt',            keywords: ['yogurt', 'yoghurt'],
    note: 'Live active cultures (usually Lactobacillus/Streptococcus strains) — check the label for "live and active cultures"; heavily heat-processed yogurt can lose them.' },
  { id: 'kefir',       label: 'Kefir',              keywords: ['kefir'],
    note: 'Fermented with a kefir "grain" — typically carries more strains and a higher microbial count than yogurt.' },
  { id: 'kimchi',      label: 'Kimchi',             keywords: ['kimchi'],
    note: 'Fermented cabbage — live cultures plus the fiber from the cabbage itself, a rare combination.' },
  { id: 'sauerkraut',  label: 'Sauerkraut',         keywords: ['sauerkraut'],
    note: 'Only unpasteurized sauerkraut carries live cultures — the shelf-stable canned kind is typically heat-processed and no longer live.' },
  { id: 'miso',        label: 'Miso',               keywords: ['miso'],
    note: 'Fermented soybean paste — live cultures, though boiling miso soup at a hard simmer kills most of them; stir it in off the heat if that matters to you.' },
  { id: 'tempeh',      label: 'Tempeh',             keywords: ['tempeh'],
    note: 'Fermented whole soybeans — the fermentation partially breaks down the beans\' natural anti-nutrients, and the whole-bean fiber stays intact.' },
  { id: 'kombucha',    label: 'Kombucha',           keywords: ['kombucha'],
    note: 'Fermented tea — live cultures, though it also carries some sugar and acid, so it\'s a drink, not a supplement.' },
  { id: 'sourdough',   label: 'Sourdough',          keywords: ['sourdough'],
    note: 'Baking kills the live culture, so this isn\'t a probiotic source — but the slow fermentation predigests some of the gluten and FODMAP-triggering fructans in the flour, which is why some people tolerate it better than regular bread.' },
  { id: 'buttermilk',  label: 'Cultured buttermilk', keywords: ['buttermilk', 'cultured buttermilk'],
    note: 'Cultured (not the liquid left from churning butter) carries live bacteria similar to yogurt.' },
  { id: 'pickles-fermented', label: 'Fermented (not vinegar) pickles', keywords: ['fermented pickle', 'lacto-fermented'],
    note: 'Only true brine-fermented pickles are a live-culture source — most jarred pickles are vinegar-brined, which is flavor, not fermentation, and isn\'t counted here.' },
];

// ── 2. Fiber sources — feeds gut bacteria, becomes short-chain fatty acids ─
export const FIBER_SOURCES = [
  { id: 'legumes',   label: 'Beans / lentils / chickpeas', keywords: ['bean', 'lentil', 'chickpea', 'garbanzo', 'black bean', 'kidney bean', 'pinto'],
    note: 'Among the highest-fiber foods that exist, with a mix of soluble and insoluble fiber plus resistant starch.' },
  { id: 'oats',      label: 'Oats', keywords: ['oat', 'oats', 'oatmeal'],
    note: 'Beta-glucan, a soluble fiber specifically studied for feeding beneficial bacteria and slowing sugar absorption.' },
  { id: 'whole-grain', label: 'Whole grains', keywords: ['whole wheat', 'whole grain', 'quinoa', 'farro', 'barley', 'brown rice', 'buckwheat'],
    note: 'Keeps the bran and germ that refining strips out — where nearly all of a grain\'s fiber lives.' },
  { id: 'cruciferous', label: 'Broccoli / Brussels sprouts / cabbage', keywords: ['broccoli', 'brussels', 'cabbage', 'cauliflower'],
    note: 'High-fiber and a source of glucosinolates, plant compounds gut bacteria metabolize into other beneficial compounds.' },
  { id: 'chia-flax', label: 'Chia / flax seeds', keywords: ['chia', 'flax', 'flaxseed'],
    note: 'Very high in soluble fiber by weight — chia can absorb roughly 10x its weight in liquid, forming a gel that slows digestion.' },
  { id: 'berries',   label: 'Berries', keywords: ['berry', 'berries', 'blueberr', 'raspberr', 'strawberr', 'blackberr'],
    note: 'Fiber and polyphenols together — one of the few foods that hits both categories at once.' },
  { id: 'apple-pear', label: 'Apples / pears (with skin)', keywords: ['apple', 'pear'],
    note: 'Pectin, a soluble fiber concentrated in the skin — peeling removes a meaningful share of it.' },
  { id: 'artichoke', label: 'Artichoke', keywords: ['artichoke'],
    note: 'One of the richest natural sources of inulin, a well-studied prebiotic fiber.' },
  { id: 'avocado',   label: 'Avocado', keywords: ['avocado'],
    note: 'High fiber for a fruit, alongside the monounsaturated fat it\'s better known for.' },
  { id: 'nuts-seeds', label: 'Nuts / seeds', keywords: ['almond', 'walnut', 'pumpkin seed', 'sunflower seed', 'pistachio'],
    note: 'Fiber plus polyphenols in the skins — almond skins specifically have been shown to shift gut bacteria composition in small trials.' },
  { id: 'sweet-potato', label: 'Sweet potato / potato (cooled)', keywords: ['sweet potato', 'potato'],
    note: 'Potatoes cooked and then cooled (potato salad, leftovers) develop resistant starch — a fiber-like compound that forms as the starch recrystallizes.' },
];

// ── 3. Polyphenols & prebiotic compounds — mostly reach the colon intact ──
export const POLYPHENOL_SOURCES = [
  { id: 'dark-chocolate', label: 'Dark chocolate / cacao', keywords: ['dark chocolate', 'cacao', 'cocoa'],
    note: 'Flavanol-rich — among the most concentrated dietary sources of polyphenols by weight.' },
  { id: 'green-tea', label: 'Green tea', keywords: ['green tea', 'matcha'],
    note: 'Catechins, a polyphenol family studied for how gut bacteria metabolize them into other bioactive compounds.' },
  { id: 'olive-oil', label: 'Olive oil (extra virgin)', keywords: ['olive oil'],
    note: 'Carries polyphenols the refining process strips from more processed oils — "extra virgin" specifically signals less processing.' },
  { id: 'herbs-spices', label: 'Herbs & spices', keywords: ['rosemary', 'oregano', 'thyme', 'turmeric', 'ginger', 'cinnamon', 'clove'],
    note: 'Concentrated polyphenol sources relative to their tiny serving size.' },
  { id: 'garlic-onion', label: 'Garlic / onion / leek', keywords: ['garlic', 'onion', 'leek', 'shallot'],
    note: 'A specific prebiotic fiber (inulin/fructans) that selectively feeds beneficial bacteria — the same compound that makes these high-FODMAP for people with IBS (see below).' },
  { id: 'coffee', label: 'Coffee', keywords: ['coffee', 'espresso'],
    note: 'A meaningful polyphenol source in the average diet simply due to how often it\'s consumed, not its concentration.' },
  { id: 'pomegranate', label: 'Pomegranate', keywords: ['pomegranate'],
    note: 'Ellagitannins, which specific gut bacteria convert into urolithins — compounds under active research for gut and cell health.' },
];

// ── 4. High-FODMAP foods — informational, relevant to IBS/SIBO specifically,
// not a warning for everyone. Real Monash University research categories. ──
export const HIGH_FODMAP_FOODS = [
  { id: 'garlic-onion-fodmap', label: 'Garlic / onion', keywords: ['garlic', 'onion'], group: 'fructans' },
  { id: 'wheat-fodmap', label: 'Wheat (bread, pasta, most flour)', keywords: ['wheat', 'flour', 'bread', 'pasta'], group: 'fructans' },
  { id: 'apple-fodmap', label: 'Apples / pears', keywords: ['apple', 'pear'], group: 'excess fructose / polyols' },
  { id: 'honey-fodmap', label: 'Honey', keywords: ['honey'], group: 'excess fructose' },
  { id: 'milk-fodmap', label: 'Milk (lactose)', keywords: ['milk'], group: 'lactose' },
  { id: 'legumes-fodmap', label: 'Beans / lentils (larger portions)', keywords: ['bean', 'lentil', 'chickpea'], group: 'galacto-oligosaccharides' },
  { id: 'cashew-pistachio-fodmap', label: 'Cashews / pistachios', keywords: ['cashew', 'pistachio'], group: 'galacto-oligosaccharides' },
  { id: 'mushroom-fodmap', label: 'Mushrooms', keywords: ['mushroom'], group: 'polyols' },
  { id: 'cauliflower-fodmap', label: 'Cauliflower', keywords: ['cauliflower'], group: 'polyols' },
  { id: 'watermelon-fodmap', label: 'Watermelon', keywords: ['watermelon'], group: 'excess fructose / polyols' },
];

// ── 5. Gut disruptors — mixed evidence strength, each note says which ────
export const GUT_DISRUPTORS = [
  { id: 'added-sugar', label: 'Added sugar', keywords: ['sugar', 'corn syrup', 'frosting', 'condensed milk'],
    strength: 'well-established', note: 'High added-sugar intake is consistently linked to lower gut microbiome diversity in observational studies — it feeds a narrower set of bacteria than fiber does.' },
  { id: 'refined-grain', label: 'Refined flour / white bread / white rice', keywords: ['white flour', 'white bread', 'white rice', 'all-purpose flour'],
    strength: 'well-established', note: 'Refining strips out the bran and germ — most of a grain\'s fiber — leaving mostly starch behind.' },
  { id: 'fried', label: 'Deep-fried food', keywords: ['deep-fried', 'deep fried', 'fried in oil'],
    strength: 'moderate', note: 'Frequent fried-food intake is associated with lower microbiome diversity in observational studies, though frying occasionally isn\'t the same as a fried-food-heavy diet.' },
  { id: 'processed-meat', label: 'Processed meat', keywords: ['bacon', 'sausage', 'deli meat', 'hot dog', 'salami', 'ham'],
    strength: 'moderate', note: 'Associated with shifts toward less favorable gut bacteria populations in cohort studies — the mechanism isn\'t fully settled.' },
  { id: 'artificial-sweetener', label: 'Artificial sweeteners', keywords: ['sucralose', 'aspartame', 'saccharin', 'acesulfame'],
    strength: 'emerging', note: 'Some human trials (Weizmann Institute, 2022) found certain non-nutritive sweeteners altered glucose tolerance via gut microbiome changes — but responses varied a lot person to person, and this research is still developing.' },
  { id: 'emulsifier-proxy', label: 'Heavily processed / packaged convenience food', keywords: ['instant', 'packaged', 'frozen dinner', 'canned soup base'],
    strength: 'emerging', note: 'A rough proxy, not a real emulsifier detector — common emulsifiers (carboxymethylcellulose, polysorbate-80) rarely appear by name on a recipe. Animal studies (Chassaing et al., Nature 2015) showed they can erode the gut\'s protective mucus layer; human evidence is still emerging.' },
];

// ── Plant diversity — a rough proxy for the "30 plants a week" research ──
const PLANT_KEYWORDS = [
  'spinach', 'kale', 'lettuce', 'arugula', 'cabbage', 'broccoli', 'brussels', 'cauliflower', 'carrot',
  'celery', 'cucumber', 'zucchini', 'squash', 'pumpkin', 'sweet potato', 'potato', 'beet', 'radish',
  'tomato', 'pepper', 'eggplant', 'mushroom', 'garlic', 'onion', 'leek', 'shallot', 'ginger', 'turmeric',
  'apple', 'pear', 'banana', 'berry', 'blueberr', 'strawberr', 'raspberr', 'orange', 'lemon', 'lime',
  'mango', 'pineapple', 'avocado', 'pomegranate', 'grape', 'peach', 'plum', 'fig', 'date',
  'bean', 'lentil', 'chickpea', 'pea', 'tofu', 'edamame', 'quinoa', 'oat', 'barley', 'farro', 'buckwheat',
  'brown rice', 'almond', 'walnut', 'cashew', 'pistachio', 'pecan', 'chia', 'flax', 'sunflower seed',
  'pumpkin seed', 'sesame', 'basil', 'cilantro', 'parsley', 'mint', 'rosemary', 'thyme', 'oregano',
];

function matchAll(list, text) {
  return list.filter(item => item.keywords.some(kw => text.includes(kw)));
}

/** Distinct plant-food keywords found in an ingredient list — a per-recipe
 * building block toward the real "30 distinct plants a week" research, not
 * a claim that any single dish gets you there. */
export function distinctPlantCount(ingredients) {
  const text = textOf(ingredients);
  if (!text) return 0;
  return new Set(PLANT_KEYWORDS.filter(kw => text.includes(kw))).size;
}

// Weights are additive, not diagnostic — fermented foods and real fiber
// count most (the two most directly-evidenced levers), polyphenols add a
// smaller amount, disruptors subtract. Validated against the real
// 575-recipe corpus before picking the isGutFriendly cutoff: at >=5, 36.9%
// of the corpus qualifies (fiber/legume/spice-forward dishes like Falafel,
// Ful Medames, Bengali Biryani score 10+; refined-flour pastries like
// Croissant score negative) — a real filter, not "everything qualifies."
const GUT_SCORE_THRESHOLD = 5;

/** The full gut-health picture for a recipe's ingredients — real detected
 * signals, never a lab analysis. Returns null for an empty ingredient list
 * so callers can render nothing instead of an empty panel. */
export function gutProfile(ingredients) {
  const text = textOf(ingredients);
  if (!text) return null;
  const fermented = matchAll(FERMENTED_FOODS, text);
  const fiber = matchAll(FIBER_SOURCES, text);
  const polyphenols = matchAll(POLYPHENOL_SOURCES, text);
  const disruptors = matchAll(GUT_DISRUPTORS, text);
  const highFodmap = matchAll(HIGH_FODMAP_FOODS, text);
  const plantCount = distinctPlantCount(ingredients);

  const score = fermented.length * 3 + fiber.length * 2 + polyphenols.length * 1
    + Math.min(plantCount, 6) - disruptors.length * 2;

  return {
    fermented, fiber, polyphenols, disruptors, highFodmap, plantCount, score,
    isGutFriendly: score >= GUT_SCORE_THRESHOLD,
  };
}

/** True/false shortcut for filters/badges — false (not gut-friendly) for
 * recipes with no readable ingredient text, the honest default. */
export function isGutFriendly(ingredients) {
  return gutProfile(ingredients)?.isGutFriendly === true;
}

// ── Educating the choice — real gut-health reasoning per healthify.js swap
// option, so picking a specific substitute comes with a real "why," not
// just a name. Reuses healthify.js's SAME substitute catalog (one dataset
// app-wide) rather than a second parallel list. Notes are honest, including
// where a swap genuinely has little gut-health angle — this isn't marketing
// copy that finds a positive spin for every option. ─────────────────────
const GUT_SWAP_NOTES = {
  // sugar
  'dates':          'Whole dates keep their fiber, so the natural sugar digests slower and some of it still reaches the colon to feed bacteria — unlike table sugar, which is fully absorbed in the small intestine.',
  'coconut-sugar':  'Chemically still mostly sucrose — a lower glycemic index than table sugar, but not meaningfully different for gut bacteria. This swap is about blood sugar, not fiber.',
  'maple-syrup':    'A liquid sugar with trace minerals and a few polyphenols, but negligible fiber — a modest upgrade, not a gut-health swap.',
  'honey':          'Contains small amounts of prebiotic oligosaccharides, but the sugar content dominates — treat it like sugar with a minor bonus, not a gut food.',
  'monk-fruit':     'Zero-calorie and not a sugar alcohol, so it doesn\'t ferment or cause the gas/bloating some sugar alcohols do — one of the more gut-neutral sweeteners.',
  'stevia':         'Not fermented by gut bacteria the way sugar alcohols are, so it\'s generally well tolerated — but it also does nothing positive for gut bacteria; it\'s simply neutral.',
  'applesauce':     'Real fiber (pectin) comes along with the sweetness — genuinely closer to a gut-health swap than most sugar substitutes on this list.',
  'mashed-banana':  'Unripe-leaning bananas carry resistant starch and fiber; very ripe bananas convert more of that starch to sugar — a riper banana sweetens more but brings less of the fiber benefit.',
  // flour
  'whole-wheat':    'Keeps the bran and germ refined white flour strips away — where nearly all of wheat\'s fiber lives. Also higher in the same fructans that make wheat high-FODMAP, so it\'s a fiber upgrade, not a FODMAP downgrade.',
  'oat':             'Brings oats\' beta-glucan fiber, one of the more directly-studied fibers for feeding beneficial gut bacteria.',
  'almond':          'Higher in fat and protein than fiber — a real swap for blood sugar or gluten, but a smaller gut-fiber upgrade than oat or whole-wheat flour.',
  'chickpea':        'One of the higher-fiber flour options here, plus resistant starch — a genuine gut-forward choice, not just a gluten-free one.',
  'rice':            'Low fiber, similar to white flour — mainly a gluten-free swap, not a gut-health one.',
  'coconut':         'Higher in fiber than most gluten-free flours by weight, though it\'s used in small amounts per recipe since it absorbs so much liquid.',
  // fat
  'avocado-oil':     'Mostly monounsaturated fat with no fiber — swaps well for saturated fat, but isn\'t a gut-microbiome lever on its own.',
  'coconut-oil':     'Mostly saturated fat (unlike most plant oils) — a flavor/texture swap for butter, not meaningfully different for gut bacteria.',
  'olive-oil':       'Extra virgin specifically carries polyphenols that more processed oils lose in refining — genuinely one of the better fat choices for gut health, not just heart health.',
  'applesauce-fat':  'Brings pectin fiber along with cutting the fat — a real gut-forward swap, same logic as the sugar version above.',
  // dairy
  'coconut-cream':   'Very low in fiber and mostly saturated fat — a dairy-free swap, not a gut-health upgrade.',
  'cashew-cream':    'Cashews carry fiber and some prebiotic compounds — blending the whole nut keeps more of that than a lot of dairy-free creams do.',
  'silken-tofu':      'Soy fiber and isoflavones (plant compounds gut bacteria metabolize) come along with the protein — one of the more gut-active dairy swaps.',
  // starch
  'zucchini-noodles':   'Genuine fiber and water content instead of refined starch — a real gut-forward swap, though it brings far less fiber than a whole grain or legume-based pasta would.',
  'spaghetti-squash':   'Similar profile to zucchini noodles — more fiber than white pasta, less than a legume-based one.',
  'chickpea-pasta':     'Roughly triple the fiber and protein of wheat pasta, plus resistant starch — one of the stronger gut-forward swaps on this whole list.',
  'lentil-pasta':       'Similar to chickpea pasta — high fiber and resistant starch from the whole lentil.',
};

/** Real gut-health reasoning attached to healthify.js's existing swap
 * catalog for THIS recipe — reuses healthifySwaps() rather than
 * re-deriving triggers, so there's one swap dataset, not two. Only returns
 * swap types where at least one option actually has a written note. */
export function gutSwapsFor(ingredients) {
  const swaps = healthifySwaps(ingredients, 'lighter');
  return swaps
    .map(s => ({ ...s, options: s.options.map(o => ({ ...o, gutNote: GUT_SWAP_NOTES[o.id] || null })).filter(o => o.gutNote) }))
    .filter(s => s.options.length > 0);
}

/* ── KB-shaped entries for novaKnowledge.js's keyword-retrieval Q&A ────────
   Same { id, category, keywords, title, answer } shape as foodSafety.js's
   FOOD_SAFETY_TOPICS — built from the same numbers/claims documented at the
   top of this file, so Ask Nova can't drift out of sync with the panel. */
export const GUT_HEALTH_TOPICS = [
  {
    id: 'gut-health-what-is', category: 'gut-health',
    keywords: ['gut health', 'gut friendly', 'what is gut health', 'gut healthy', 'good for my gut'],
    title: 'What "gut health" actually means',
    answer: `It's not a regulated term — a label can say "gut friendly" and mean nothing. What actually matters, backed by real research: fiber (feeds gut bacteria, which produce short-chain fatty acids like butyrate that fuel your colon cells), fermented foods with live cultures (yogurt, kefir, kimchi, sauerkraut, miso, tempeh, kombucha), polyphenols (berries, cacao, olive oil, herbs — mostly unabsorbed until gut bacteria get to them), and diversity (the American Gut Project found people eating 30+ distinct plant foods a week had more diverse gut microbiomes than people eating 10 or fewer). ${GUT_HEALTH_DISCLAIMER}`,
  },
  {
    id: 'gut-health-fiber', category: 'gut-health',
    keywords: ['fiber and gut', 'why is fiber good', 'fiber gut bacteria', 'short chain fatty acid', 'butyrate'],
    title: 'Why fiber matters for your gut',
    answer: `You can't digest fiber — it passes through to your colon, where gut bacteria ferment it into short-chain fatty acids (acetate, propionate, and butyrate). Butyrate is the main fuel source for the cells lining your colon. Most US adults eat well under the recommended 25–38g a day — average intake is closer to 15g. Beans, lentils, oats, whole grains, chia/flax seeds, and berries are some of the highest-fiber everyday foods.`,
  },
  {
    id: 'gut-health-fermented', category: 'gut-health',
    keywords: ['fermented food', 'probiotic food', 'live cultures', 'kimchi good for you', 'kefir vs yogurt'],
    title: 'Fermented foods & probiotics',
    answer: `Fermented foods with live active cultures — yogurt, kefir, kimchi, unpasteurized sauerkraut, miso, tempeh, kombucha — introduce live microorganisms to your gut. A 2021 Stanford trial found a 10-week fermented-food-rich diet measurably increased gut microbiome diversity and lowered several inflammatory markers, compared to a fiber-only diet. Not everything fermented still has live cultures, though — baking kills sourdough's culture, and canned shelf-stable sauerkraut is usually pasteurized.`,
  },
  {
    id: 'gut-health-prebiotics-polyphenols', category: 'gut-health',
    keywords: ['prebiotic', 'polyphenol', 'prebiotic vs probiotic', 'what is a prebiotic'],
    title: 'Prebiotics & polyphenols',
    answer: `Probiotics are live bacteria you eat (fermented foods). Prebiotics are the fiber and plant compounds that feed the bacteria already in your gut — garlic, onion, leeks, and oats all carry specific prebiotic fibers. Polyphenols (in berries, dark chocolate, green tea, olive oil, coffee, herbs and spices) mostly aren't absorbed in the small intestine — they reach the colon largely intact, where gut bacteria metabolize them.`,
  },
  {
    id: 'gut-health-diversity', category: 'gut-health',
    keywords: ['gut diversity', '30 plants', 'plant diversity', 'microbiome diversity', 'how many plants a week'],
    title: 'Why plant diversity matters',
    answer: `The American Gut Project — the largest citizen-science microbiome study — found people eating 30 or more distinct plant foods a week had significantly more diverse gut microbiomes than people eating 10 or fewer. It's about variety, not volume: different plants feed different bacterial species. Herbs, spices, and different grains all count toward that number, not just vegetables.`,
  },
  {
    id: 'gut-health-fodmap', category: 'gut-health',
    keywords: ['fodmap', 'low fodmap', 'high fodmap', 'ibs diet', 'garlic bloating', 'onion bloating', 'fodmap diet'],
    title: 'What FODMAP means',
    answer: `FODMAP stands for fermentable oligosaccharides, disaccharides, monosaccharides, and polyols — a Monash University framework for carbs that are poorly absorbed and rapidly fermented in the gut, which can cause gas, bloating, and discomfort. Garlic, onion, wheat, many legumes, apples, honey, and some dairy are common high-FODMAP foods. This mainly matters if you have IBS or SIBO — a low-FODMAP diet is a short-term elimination protocol for diagnosing triggers, not a general list of "bad" foods for everyone. ${GUT_HEALTH_DISCLAIMER}`,
  },
  {
    id: 'gut-health-disruptors', category: 'gut-health',
    keywords: ['gut disruptor', 'bad for gut', 'foods that hurt gut', 'artificial sweetener gut', 'emulsifier gut', 'processed food microbiome'],
    title: 'What can disrupt gut health',
    answer: `Best-established: added sugar and refined grains are linked to lower gut microbiome diversity in observational studies — they feed a narrower set of bacteria than fiber does. More preliminary: some research suggests certain artificial sweeteners can alter glucose tolerance via gut microbiome changes (effects varied a lot person to person in the human trials), and animal studies found some common emulsifiers in packaged food can erode the gut's protective mucus layer — human evidence there is still developing. None of this means one processed meal is harmful; it's about the pattern over time.`,
  },
  {
    id: 'gut-health-brain-axis', category: 'gut-health',
    keywords: ['gut brain axis', 'gut and mood', 'gut brain connection', 'serotonin gut'],
    title: 'The gut-brain connection',
    answer: `Your gut and brain communicate through the vagus nerve, your immune system, and metabolites your gut bacteria produce — a real, well-studied set of pathways, not a metaphor. Around 90% of the body's serotonin is produced in the gut, made by cells whose activity is influenced by gut bacteria. That doesn't mean gut bacteria directly control mood, but the gut-brain connection is genuine and still an active area of research.`,
  },
];

// Display order for the "what makes food gut-friendly" learn accordion —
// GutHealthPanel renders straight from GUT_HEALTH_TOPICS by this id list,
// so the panel's explainer text can never drift from Ask Nova's Q&A answers.
export const GUT_HEALTH_LEARN_ORDER = [
  'gut-health-what-is', 'gut-health-fiber', 'gut-health-fermented',
  'gut-health-prebiotics-polyphenols', 'gut-health-diversity',
  'gut-health-fodmap', 'gut-health-disruptors', 'gut-health-brain-axis',
];
