/* health/wellnessGoals.js — consolidated Health & Safety module.
   Merged from src/lib/gutHealth.js + src/lib/hydrationCheck.js +
   src/lib/hydrationDIY.js + src/lib/healthify.js + src/lib/wellnessAdvisory.js
   + src/lib/wellnessGoals.js as part of the lib/ → lib/health/
   reorganization. The old flat files now re-export from here so nothing
   else in the app needs to change.

   Sections are ordered so a module's internal dependencies land above it:
   healthify → gutHealth (uses healthify's healthifySwaps) → hydrationDIY →
   hydrationCheck (uses hydrationDIY's DISCLAIMER) → wellnessAdvisory →
   wellnessGoals (uses healthify's substitute lists).

   IMPORT CONFLICTS RESOLVED:
   - `ingredientText`: healthify.js and gutHealth.js each imported this from
     '../components/recipe/RecipeBoostSections'; the original wellnessGoals.js
     instead defined its own local, null-safe version. Both do the same job
     for every real input these modules pass them (a string or a plain
     ingredient object) — they only differ on a literal `null` element, where
     the imported version throws and the local one returns ''. Kept the
     safer local version as the single shared `ingredientText` for this whole
     file (see "SHARED HELPERS" below) and dropped both external imports —
     this also removes an external dependency the merged file no longer
     needs.
   - `textOf`: healthify.js and gutHealth.js each defined an identical local
     `textOf(ingredients)` built on `ingredientText` — kept as a single
     shared helper instead of two duplicate declarations.
   - `healthifySwaps` (gutHealth.js imported this from './healthify') and
     `DISCLAIMER` (hydrationCheck.js imported this from './hydrationDIY')
     and `SUGAR_SUBSTITUTES`/`FLOUR_ALTERNATIVES`/`FAT_SUBSTITUTES`/
     `DAIRY_SUBSTITUTES`/`STARCH_SUBSTITUTES` (wellnessGoals.js imported these
     from './healthify') are now same-module references — those import
     statements were removed and the calls left as-is.
   - `CRISIS_RESOURCES`: wellnessAdvisory.js's import path moved one
     directory deeper (lib/ → lib/health/), from './shadowToLight' to
     '../shadowToLight'.
   No other identifiers collided across the six originals. */

import { CRISIS_RESOURCES } from '../shadowToLight';

// ── SHARED HELPERS — see "IMPORT CONFLICTS RESOLVED" above. Originally
// wellnessGoals.js's local ingredientText(); now also used by the healthify
// and gutHealth sections in place of their own imports/duplicate textOf(). ──
function ingredientText(ing) {
  return typeof ing === 'object' && ing !== null ? (ing.text || ing.name || '') : (ing || '');
}

function textOf(ingredients) {
  return (ingredients || []).map(ingredientText).join(' ').toLowerCase();
}

/* ════════════════════════════════════════════════════════════════════════
   FROM: src/lib/healthify.js
   ════════════════════════════════════════════════════════════════════════ */

/* healthify.js — the "make anything unhealthy healthy" engine, in two parts:

   1. A canonical substitute dataset (sugar/flour/fat/dairy) richer than a flat
      name list — each option carries a real ratio/note, so swapping actually
      gives control (what to use, how much, what changes), not just a name.
      wellnessGoals.js's healthySwapsFor() (WellnessPanel) sources its option
      labels from here too — one dataset, not two.

   2. HEALTHY_BASES — the "base + add-ins" builder recipeAlchemist.js already
      does for baked-good formats, generalized to health-forward bases
      (smoothie, bread dough). Structured so a new base is just a config
      entry: liquidOptions + tagged addinCategories + a build() function —
      not a rewrite. */

// ── Sugar substitutes — ratio is "how much to use vs. the sugar amount
// called for" (1 = same volume). bestFor tags which contexts it works in. ──
export const SUGAR_SUBSTITUTES = [
  { id: 'dates', label: 'Medjool dates (blended)', ratio: 1, bestFor: ['smoothies', 'baking', 'sauces'], note: 'Blend pitted dates with a splash of water into a paste. Adds fiber and potassium, and the sugar hits your bloodstream slower than table sugar.' },
  { id: 'maple-syrup', label: 'Maple syrup', ratio: 0.75, bestFor: ['baking', 'smoothies', 'drinks'], note: "It's a liquid — use 3/4 the amount and cut another liquid in the recipe by about 3 tbsp per cup used." },
  { id: 'honey', label: 'Honey', ratio: 0.75, bestFor: ['baking', 'drinks', 'dressings'], note: 'Sweeter than sugar by volume — use 3/4 the amount, and drop the oven temp about 25°F since honey browns faster.' },
  { id: 'coconut-sugar', label: 'Coconut sugar', ratio: 1, bestFor: ['baking'], note: 'Lower glycemic impact than table sugar with the same 1:1 swap and a similar texture in most baking.' },
  { id: 'monk-fruit', label: 'Monk fruit sweetener', ratio: 1, bestFor: ['baking', 'drinks'], note: 'Zero-calorie, no blood-sugar impact — the closest 1:1 swap with no liquid adjustment needed.' },
  { id: 'stevia', label: 'Stevia', ratio: 0.06, bestFor: ['drinks', 'smoothies'], note: 'Very concentrated — start with about 1/16 the amount and adjust to taste. Can read bitter in baked goods.' },
  { id: 'applesauce', label: 'Unsweetened applesauce', ratio: 1, bestFor: ['baking'], note: 'Replaces sugar AND some of the fat in baked goods 1:1 — pull back other liquid slightly since it adds moisture.' },
  { id: 'mashed-banana', label: 'Mashed ripe banana', ratio: 1, bestFor: ['baking', 'smoothies'], note: 'Sweetens and binds at once — works best where banana flavor actually fits (muffins, pancakes, quick bread).' },
];

// ── Flour alternatives — canMillAtHome + millFrom/millNote give the real
// "grind your own" picture instead of just naming a store-bought bag. ──
export const FLOUR_ALTERNATIVES = [
  { id: 'whole-wheat', label: 'Whole wheat flour', glutenFree: false, canMillAtHome: true, millFrom: 'whole wheat berries', millNote: 'A dedicated grain mill (or a high-powered blender with a dry-grain container) turns wheat berries into flour — coarser than store-bought unless you sift it.', bestFor: ['bread', 'dough'], note: 'More fiber than white flour. Swap up to half the white flour before the texture gets noticeably denser.' },
  { id: 'oat', label: 'Oat flour', glutenFree: true, canMillAtHome: true, millFrom: 'rolled oats', millNote: 'The easiest flour to mill at home — blend rolled oats 30–60 seconds in any blender or food processor until fine.', bestFor: ['cookie', 'batter', 'bread'], note: 'Mild flavor — works close to 1:1 in most quick breads, pancakes, and muffins.' },
  { id: 'almond', label: 'Almond flour', glutenFree: true, canMillAtHome: true, millFrom: 'blanched almonds', millNote: "A food processor or high-powered blender grinds blanched almonds into flour — pulse in short bursts, since grinding too long turns it into almond butter.", bestFor: ['cookie', 'cake', 'batter'], note: 'Lower carb, higher fat and protein — baked goods come out denser and more moist.' },
  { id: 'chickpea', label: 'Chickpea (garbanzo) flour', glutenFree: true, canMillAtHome: true, millFrom: 'dried chickpeas', millNote: "A dedicated grain mill handles dried chickpeas best — a regular blender can struggle with how hard they are.", bestFor: ['bread', 'dough', 'sauce'], note: 'High protein and fiber with a slightly nutty, savory edge — best in savory breads and flatbreads.' },
  { id: 'rice', label: 'Rice flour', glutenFree: true, canMillAtHome: true, millFrom: 'white or brown rice', millNote: 'A dedicated grain mill or a very high-powered blender grinds dry rice into flour — a standard blender leaves it gritty.', bestFor: ['bread', 'batter'], note: "Light and neutral — often blended with another gluten-free flour for better structure." },
  { id: 'coconut', label: 'Coconut flour', glutenFree: true, canMillAtHome: false, millFrom: null, millNote: "Made from dried, defatted coconut meat — not practical to mill at home; buy it ready-made.", bestFor: ['cookie', 'batter'], note: 'Very absorbent — use only about 1/4 the amount of wheat flour and add an extra egg per cup used.' },
];

// ── Fat + dairy substitutes — same option shape, ported from the smaller
// set wellnessGoals.js used to own directly. ──
export const FAT_SUBSTITUTES = [
  { id: 'avocado-oil', label: 'Avocado oil', note: 'Neutral flavor, swaps 1:1 for butter or vegetable oil — mostly unsaturated fat.' },
  { id: 'coconut-oil', label: 'Coconut oil', note: 'Swaps 1:1 for butter — solid at room temp like butter, so it behaves similarly in baking.' },
  { id: 'olive-oil', label: 'Olive oil', note: 'Great in savory bakes and sautéing — use about 3/4 the amount of butter called for.' },
  { id: 'applesauce-fat', label: 'Unsweetened applesauce', note: 'Replaces up to half the butter or oil in most quick breads and muffins — adds moisture, cuts fat.' },
];
export const DAIRY_SUBSTITUTES = [
  { id: 'coconut-cream', label: 'Coconut cream', note: 'Swaps 1:1 for heavy cream — chill a can of coconut milk and scoop the solid cream off the top.' },
  { id: 'cashew-cream', label: 'Cashew cream', note: 'Blend soaked raw cashews with water until smooth — swaps 1:1 for heavy cream in savory or sweet dishes.' },
  { id: 'silken-tofu', label: 'Silken tofu (blended)', note: 'Blend until completely smooth — adds protein and swaps 1:1 for heavy cream in soups and sauces.' },
];
export const STARCH_SUBSTITUTES = [
  { id: 'zucchini-noodles', label: 'Zucchini noodles', note: 'Spiralize raw zucchini — cooks in 2–3 minutes, so add it at the very end.' },
  { id: 'spaghetti-squash', label: 'Spaghetti squash', note: 'Roast a halved squash, then scrape the strands out with a fork — naturally noodle-shaped.' },
  { id: 'chickpea-pasta', label: 'Chickpea pasta', note: 'Cooks like regular pasta — roughly triple the protein and fiber of wheat pasta.' },
  { id: 'lentil-pasta', label: 'Lentil pasta', note: 'Cooks like regular pasta with about double the protein and fiber of wheat pasta.' },
];

// ── Reverse-engineer: what swaps apply to a given ingredient list ────────
const SWAP_TYPES = [
  { type: 'sugar', label: 'Sugar', trigger: /\bsugar\b/i, options: SUGAR_SUBSTITUTES,
    lightest: ['monk-fruit', 'stevia'], lighter: ['coconut-sugar', 'maple-syrup', 'honey', 'dates', 'applesauce', 'mashed-banana'] },
  { type: 'flour', label: 'Flour', trigger: /white flour|all-purpose flour|\bflour\b/i, options: FLOUR_ALTERNATIVES,
    lightest: FLOUR_ALTERNATIVES.filter(f => f.glutenFree).map(f => f.id), lighter: FLOUR_ALTERNATIVES.map(f => f.id) },
  { type: 'fat', label: 'Butter / Oil', trigger: /\bbutter\b/i, options: FAT_SUBSTITUTES,
    lightest: ['applesauce-fat', 'avocado-oil'], lighter: FAT_SUBSTITUTES.map(f => f.id) },
  { type: 'dairy', label: 'Heavy Cream', trigger: /heavy cream/i, options: DAIRY_SUBSTITUTES,
    lightest: ['silken-tofu'], lighter: DAIRY_SUBSTITUTES.map(f => f.id) },
  { type: 'starch', label: 'Pasta', trigger: /\bpasta\b/i, options: STARCH_SUBSTITUTES,
    lightest: ['zucchini-noodles', 'spaghetti-squash'], lighter: STARCH_SUBSTITUTES.map(f => f.id) },
];

/** What swap types apply to this ingredient list, and which options to
 * suggest for them — 'lightest' is a more aggressive/lower-impact subset,
 * 'lighter' is the fuller, gentler-swap list. */
export function healthifySwaps(ingredients, level = 'lighter') {
  const text = textOf(ingredients);
  if (!text) return [];
  const out = [];
  for (const swap of SWAP_TYPES) {
    if (!swap.trigger.test(text)) continue;
    const idSet = new Set(level === 'lightest' ? swap.lightest : swap.lighter);
    const options = swap.options.filter(o => idSet.has(o.id));
    if (options.length) out.push({ type: swap.type, label: swap.label, options });
  }
  return out;
}

/** Rewrite the ingredient list with chosen substitutes — choices is
 * { sugar: substituteId|null, flour: ..., fat: ..., dairy: ..., starch: ... }.
 * Returns a NEW ingredient array; the original recipe is left untouched. */
export function applySwapChoices(ingredients, choices = {}) {
  return (ingredients || []).map(raw => {
    const text = ingredientText(raw);
    for (const swap of SWAP_TYPES) {
      const choiceId = choices[swap.type];
      if (!choiceId || !swap.trigger.test(text)) continue;
      const opt = swap.options.find(o => o.id === choiceId);
      if (!opt) continue;
      return `${text} → swapped for ${opt.label}`;
    }
    return text;
  });
}

// Raw add-in picks (e.g. "banana", "chia seeds") come from the builder UI
// with no quantity — these turn them into real ingredient lines.
function quantifySmoothie(item) {
  if (/banana|avocado/.test(item)) return `1 ${item}`;
  if (/seed|cinnamon|ginger|flax/.test(item)) return `1 tbsp ${item}`;
  if (/yogurt|nut butter|tofu|cottage cheese|protein powder/.test(item)) return `1/3 cup ${item}`;
  return `1/2 cup ${item}`;
}
function quantifyDough(item) {
  if (/cinnamon|garlic powder|everything bagel/.test(item)) return `1 tsp ${item}`;
  if (/rosemary/.test(item)) return `1 tbsp chopped ${item}`;
  return `1/2 cup ${item}`;
}

// ── HEALTHY_BASES — the generalized "base + add-ins" builder ─────────────
export const HEALTHY_BASES = [
  {
    id: 'smoothie', label: 'Smoothie / Fruit-Veggie Blend', emoji: 'SMOOTHIE', time: 5, servings: 1,
    liquidOptions: ['1 cup milk', '1 cup almond milk', '1 cup oat milk', '1 cup coconut water', '1/2 cup orange juice + 1/2 cup water'],
    addinCategories: [
      { id: 'fruit', label: 'Fruit', picks: ['banana', 'mixed berries', 'mango', 'pineapple', 'peach', 'avocado'] },
      { id: 'veggie', label: 'Veggie', picks: ['spinach', 'kale', 'frozen riced cauliflower', 'cucumber', 'carrot', 'beet'] },
      { id: 'protein', label: 'Protein', picks: ['greek yogurt', 'protein powder', 'nut butter', 'silken tofu', 'cottage cheese'] },
      { id: 'boost', label: 'Boost-In', picks: ['chia seeds', 'ground flax seed', 'rolled oats', 'cinnamon', 'fresh ginger'] },
    ],
    usesFlour: false,
    build({ liquid, addins = [], sweetener }) {
      const lines = addins.map(quantifySmoothie);
      const ingredients = [liquid || '1 cup milk', '1/2 cup ice', ...lines];
      if (sweetener) ingredients.push(`sweeten to taste with ${sweetener.label.toLowerCase()} (${sweetener.note})`);
      const name = addins.length ? `${addins.slice(0, 2).join(' ')} Smoothie` : 'Custom Smoothie';
      return {
        name: titleCase(name),
        summary: `Blend everything until smooth. ${addins.length ? `Built around ${addins.length} real add-ins` : 'A simple base'} — ready in 5 minutes, serves 1.`,
        ingredients,
        steps: [
          `Add the ${liquid || 'milk'} to the blender first, so everything else blends easily.`,
          addins.length ? `Add the ${addins.join(', ')}.` : 'Add your fruit, veggie, and protein add-ins.',
          sweetener ? `Add a little ${sweetener.label.toLowerCase()} to sweeten, then taste and adjust.` : 'Taste and add a splash more liquid if it’s too thick.',
          'Blend on high for 30–45 seconds, until completely smooth.',
          'Pour into a glass and drink right away, while it’s cold.',
        ],
      };
    },
  },
  {
    id: 'dough', label: 'Bread Dough', emoji: 'DOUGH', time: 100, servings: 8,
    liquidOptions: ['1 cup warm water', '1 cup warm milk', '1 cup warm milk alternative'],
    addinCategories: [
      { id: 'mixin', label: 'Mix-In', picks: ['rolled oats', 'chia seeds', 'shredded carrot', 'chopped walnuts', 'raisins', 'sunflower seeds'] },
      { id: 'spice', label: 'Spice / Herb', picks: ['cinnamon', 'rosemary', 'garlic powder', 'everything bagel seasoning'] },
    ],
    usesFlour: true,
    build({ liquid, addins = [], sweetener, flour }) {
      const f = flour || FLOUR_ALTERNATIVES[0];
      const sweetLine = sweetener ? `1 tbsp ${sweetener.label.toLowerCase()}` : '1 tbsp honey';
      const lines = addins.map(quantifyDough);
      const ingredients = [
        `2 1/2 cups ${f.label.toLowerCase()}`, '1 packet active dry yeast', liquid || '1 cup warm water',
        sweetLine, '1 tsp salt', '2 tbsp olive oil', ...lines,
      ];
      const name = `${f.label} Bread${addins.length ? ` with ${addins[0]}` : ''}`;
      return {
        name: titleCase(name),
        summary: `A real yeast bread built on ${f.label.toLowerCase()}${f.canMillAtHome ? ` — millable at home from ${f.millFrom}` : ''}. Ready in about 100 minutes (mostly rising time), makes 8 slices.`,
        ingredients,
        steps: [
          `Stir the yeast and ${sweetLine} into the ${liquid || 'warm water'}. Wait 5 minutes until it looks foamy.`,
          `Mix in the ${f.label.toLowerCase()}, salt, and olive oil${addins.length ? `, plus the ${addins.join(', ')}` : ''} until a shaggy dough forms.`,
          f.glutenFree
            ? 'Gluten-free doughs won’t get stretchy like wheat dough — mix until evenly combined rather than kneading hard.'
            : 'Knead the dough on a floured counter for about 8 minutes, until smooth and elastic.',
          'Place it in an oiled bowl, cover, and let it rise about 60 minutes, until roughly doubled.',
          'Punch the dough down, shape it into a loaf, and place it in a greased loaf pan.',
          'Cover and let it rise again for 30 minutes.',
          'Bake at 375°F for 30–35 minutes, until the top is golden and it sounds hollow when tapped.',
          'Cool at least 15 minutes before slicing.',
        ],
      };
    },
  },
];

function titleCase(s = '') { return s.replace(/\b\w/g, c => c.toUpperCase()); }

/** Assemble a full recipe object from a base + the user's picks — same
 * shape recipeAlchemist.js's alchemize() returns, so it drops straight into
 * saveRecipe() / the "send to grocery route" flow unchanged. */
export function buildHealthyBase(baseId, { liquid, addinPicks = [], sweetenerId, flourId } = {}) {
  const base = HEALTHY_BASES.find(b => b.id === baseId);
  if (!base) return { error: 'unknown-base' };
  const sweetener = SUGAR_SUBSTITUTES.find(s => s.id === sweetenerId) || null;
  const flour = base.usesFlour ? (FLOUR_ALTERNATIVES.find(f => f.id === flourId) || FLOUR_ALTERNATIVES[0]) : null;
  const built = base.build({ liquid, addins: addinPicks, sweetener, flour });
  return {
    id: `healthify-${baseId}-${Date.now().toString(36)}`,
    name: built.name,
    format: baseId, formatLabel: base.label,
    kind: 'healthy', emoji: base.emoji,
    difficulty: 'Easy', time: base.time, totalTime: base.time, servings: base.servings,
    summary: built.summary, description: built.summary,
    ingredients: built.ingredients, instructions: built.steps,
    _healthified: true,
  };
}

/* ════════════════════════════════════════════════════════════════════════
   FROM: src/lib/gutHealth.js
   ════════════════════════════════════════════════════════════════════════ */

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

/* ════════════════════════════════════════════════════════════════════════
   FROM: src/lib/hydrationDIY.js
   ════════════════════════════════════════════════════════════════════════ */

/* hydrationDIY.js — "Content module, low engineering." Real electrolyte
   science, real ratios, real DIY recipes — the same "you're paying for a
   mechanism you can replicate at home" thesis as Copycat Lab and Girl
   Dinner, pointed at sports drinks and hydration powders this time.

   The mechanism these recipes lean on is real, not marketing: sodium
   absorption in the small intestine is enhanced when co-transported with
   glucose (the SGLT1 transporter) — it's why oral rehydration solutions
   include a little sugar, and it's the actual physiology every branded
   "cellular transport" hydration product is describing in trademarked
   language. Real mechanism, replicable with what's in most kitchens.

   SCOPE HONESTY: these are everyday, palatable ratios for exercise/heat/a
   hangover — not the clinical WHO Oral Rehydration Solution formula (which
   is stronger, less palatable on purpose, and exists for treating real
   dehydration from illness, especially in infants and the elderly, under
   medical guidance). See DISCLAIMER — it says so plainly, every time. */

export const DISCLAIMER =
  'General hydration education for everyday use (exercise, heat, a hangover) — not a treatment for real dehydration from illness. Vomiting, diarrhea, or dehydration in an infant, an elderly person, or anyone who can\'t keep fluids down needs a doctor or real oral rehydration therapy, not a recipe.';

export const MECHANISM =
  'Sodium gets absorbed faster when it travels into your gut alongside a little glucose — the two share a transporter (SGLT1) in the small intestine. That\'s the entire "advanced electrolyte technology" behind most branded hydration products: real physiology, and it works exactly the same whether the sodium and sugar come from a $2 packet or a squeezed lemon and a spoon of honey.';

// ── When water alone isn't quite enough — real, ordinary reasons ──────────
export const WHEN_YOU_NEED_MORE = [
  { id: 'exercise', label: 'Sustained exercise, 60+ minutes', why: 'Sweat carries real sodium loss, and past about an hour, plain water alone can\'t keep pace — this is also why over-hydrating with only water during endurance exercise is a real, documented risk (exercise-associated hyponatremia), not a myth.' },
  { id: 'heat', label: 'Heavy sweating in heat', why: 'Same mechanism as exercise — the sweat itself is the electrolyte loss, regardless of whether you\'re moving.' },
  { id: 'illness', label: 'Vomiting or diarrhea', why: 'Real fluid AND electrolyte loss, fast. Mild cases in healthy adults are a reasonable place for a DIY drink; anything more than mild, or affecting an infant, elderly person, or anyone who can\'t keep fluids down, needs real medical care — see DISCLAIMER.' },
  { id: 'nursing', label: 'Nursing', why: 'Milk production raises fluid needs sharply and thirst tends to hit suddenly mid-feed — the same real mechanism pregnancyGuide.js\'s hydration section already covers for that stage.' },
  { id: 'hangover', label: 'A hangover', why: 'Alcohol is a real diuretic — it suppresses the hormone that helps you retain water, which is a genuine, mechanical reason a hangover feels dehydrated, not just tiredness.' },
];

// ── Real DIY recipes — per 1 liter (about 4 cups) unless noted. Ratios are
// deliberately on the light/palatable side for everyday use, not clinical
// rehydration strength (see DISCLAIMER). ────────────────────────────────────
export const RECIPES = [
  {
    id: 'classic-citrus',
    name: 'Classic Citrus Electrolyte Water',
    ingredients: ['1 liter water', '1/4 tsp salt', '2–3 tbsp fresh lemon or lime juice', '2 tbsp honey or sugar'],
    method: 'Stir the salt into a splash of warm water until it dissolves, then combine with the rest. Taste — more citrus if it\'s flat, more honey if it\'s too salty.',
    why: 'The base ratio: real sodium (the salt), real glucose for the cotransport mechanism (the honey), and citrus for both potassium and flavor.',
  },
  {
    id: 'coconut-potassium',
    name: 'Coconut Potassium Boost',
    ingredients: ['2 cups coconut water', '2 cups regular water', '1/4 tsp salt', 'squeeze of lime'],
    method: 'Combine and chill.',
    why: 'Coconut water is a genuinely good potassium source (roughly 600mg a cup) — but it\'s naturally LOW in sodium, which is the more common myth here: "coconut water" and "electrolyte drink" get used interchangeably, but on its own it\'s missing the half of the equation your sweat actually loses the most of. The added salt is what makes this one balanced, not decorative.',
  },
  {
    id: 'watermelon-mint',
    name: 'Watermelon Mint Cooler',
    ingredients: ['2 cups watermelon, blended and strained', '2 cups water', '1/4 tsp salt', 'small handful mint, torn', 'squeeze of lime'],
    method: 'Blend the watermelon, strain out the pulp if you want it smooth, stir in the rest.',
    why: 'Watermelon brings real potassium and natural sugar (the glucose half of the mechanism) along with a lot of actual water content — genuinely one of the more hydrating things to blend.',
  },
  {
    id: 'ginger-ade',
    name: 'Ginger-Ade (for an unsettled stomach)',
    ingredients: ['1 liter water', '1 tbsp fresh ginger, grated or thinly sliced', '1/4 tsp salt', '2 tbsp honey', 'squeeze of lemon'],
    method: 'Steep the ginger in hot water 10 minutes, strain, stir in the rest, then chill or drink warm.',
    why: 'Ginger has real, reasonably well-studied anti-nausea effects — a sensible pairing for the illness use case specifically. Mild cases only; see DISCLAIMER.',
  },
  {
    id: 'chocolate-milk',
    name: 'Chocolate Milk (the one nobody has to make)',
    ingredients: ['Milk you already have', 'Chocolate syrup or cocoa + sugar'],
    method: 'Mix. That\'s it.',
    why: 'Genuinely real sports-recovery science: protein + carbohydrate + fluid + some natural sodium and potassium in one familiar drink. Not a myth or a stretch — it\'s a commonly cited real post-exercise recovery option, and it\'s usually already in the fridge.',
  },
];

// ── Real, honestly-hedged cost comparison ──────────────────────────────────
export const STORE_REFERENCE = [
  { name: 'Liquid I.V. (single stick)', approxCost: 1.25 },
  { name: 'Gatorade (20oz bottle)', approxCost: 1.75 },
  { name: 'Pedialyte (single bottle)', approxCost: 2.5 },
];

// Rough per-liter DIY ingredient cost — salt is negligible, citrus and honey
// carry the real cost. Deliberately approximate, said out loud as such.
const DIY_COST_PER_LITER = 0.3;
const SERVINGS_PER_LITER = 4;

export function savingsSummary() {
  const diyPerServing = DIY_COST_PER_LITER / SERVINGS_PER_LITER;
  return STORE_REFERENCE.map((s) => ({
    name: s.name,
    storeCost: s.approxCost,
    diyCost: Math.round(diyPerServing * 100) / 100,
    savedPct: Math.round((1 - diyPerServing / s.approxCost) * 100),
  }));
}

export const SAVINGS_NOTE =
  'Rough, real-world estimates, not a price quote — salt is basically free, citrus and honey are the real cost. The gap holds regardless of the exact grocery prices near you.';

/* ════════════════════════════════════════════════════════════════════════
   FROM: src/lib/hydrationCheck.js
   ════════════════════════════════════════════════════════════════════════ */

/* hydrationCheck.js — "this meal will make you thirsty, and here's the actual
   reason why."

   hydrationDIY.js already held real electrolyte science, but it lived alone in
   Kitchen Skills: you had to go looking for it. Nothing ever connected it to
   the food you were about to cook. This does — it reads a recipe's own
   ingredient list and names the real mechanisms in it.

   EVERY DRIVER BELOW IS A GENUINE, CITED-IN-PLAIN-LANGUAGE MECHANISM. Two
   deliberate choices keep this from drifting into wellness noise:

   1. Fiber is the honest centerpiece. Soluble fiber (psyllium, chia, oats,
      beans) works BY absorbing water and forming a gel — so a big fiber load
      without enough fluid can genuinely do the opposite of what you wanted.
      That is a real, mechanical "you need water for this to work," not a
      vibe. It's also the least-known one, which makes it the most worth
      saying.

   2. Caffeine is deliberately DE-escalated. Its diuretic reputation is
      bigger than its effect — for habitual drinkers a coffee still nets you
      fluid. Saying so costs us a scary-sounding warning and buys the whole
      feature its credibility. An app that cries wolf about coffee doesn't
      get believed about fiber.

   No numbers are invented. There is no "drink 3.2 cups" output, because the
   real answer depends on body size, heat, and activity, and a fabricated
   precise number would be worse than an honest qualitative one.

   NOTE: DISCLAIMER referenced below is hydrationDIY.js's export, defined
   just above in this same file (originally imported from './hydrationDIY';
   now a same-module reference — see file header). */

/* Keyword → mechanism. Ordered by how much a cook actually needs to hear it.
   Matching is substring-on-the-ingredient-line, same approach as the app's
   other real keyword classifiers (freshness.js, pantryCategories.js). */
const DRIVERS = [
  {
    id: 'fiber',
    label: 'A real fiber load',
    why: 'Soluble fiber works by absorbing water and forming a gel — that\'s the mechanism, not a side effect. Eat a big fiber load without drinking alongside it and you can get the opposite of what you were going for. This is the one that genuinely needs the water to work.',
    advice: 'Drink a full glass with the meal, and keep water nearby for the next few hours.',
    kw: ['psyllium', 'chia', 'flaxseed', 'flax seed', 'ground flax', 'bran', 'oat bran',
      'black bean', 'kidney bean', 'pinto bean', 'chickpea', 'garbanzo', 'lentil', 'split pea',
      'navy bean', 'cannellini', 'rolled oats', 'steel cut oat', 'whole wheat', 'barley', 'farro'],
  },
  {
    id: 'sodium',
    label: 'Salty by design',
    why: 'Sodium draws water into your bloodstream, and your kidneys need water to clear what\'s extra. The thirst after a salty meal is a real signal doing a real job — it isn\'t you being dramatic.',
    advice: 'Water with dinner, and expect to want more later tonight.',
    kw: ['soy sauce', 'tamari', 'fish sauce', 'oyster sauce', 'miso', 'bouillon', 'stock cube',
      'anchovy', 'capers', 'olives', 'brine', 'pickle', 'kimchi', 'sauerkraut', 'bacon',
      'pancetta', 'prosciutto', 'salami', 'pepperoni', 'ham', 'cured', 'parmesan', 'pecorino',
      'feta', 'halloumi', 'salted', 'kosher salt', 'sea salt', 'soy'],
  },
  {
    id: 'capsaicin',
    label: 'Actual heat',
    why: 'Capsaicin triggers real thermoregulatory sweating — your body cools itself as though it were genuinely hot. The sweat is real, so the fluid you lose to it is too.',
    advice: 'Keep a glass going through the meal. Something with a little salt or sugar in it works better than plain ice water.',
    kw: ['chili', 'chilli', 'chile', 'jalapeno', 'jalapeño', 'serrano', 'habanero', 'ghost pepper',
      'cayenne', 'sriracha', 'gochujang', 'gochugaru', 'harissa', 'hot sauce', 'red pepper flake',
      'chipotle', 'scotch bonnet', 'sambal', 'peri peri'],
  },
  {
    id: 'alcohol',
    label: 'Alcohol in the pan or the glass',
    why: 'Alcohol suppresses vasopressin — the hormone that tells your kidneys to hold onto water. That\'s a real, mechanical diuretic effect, and it\'s the actual reason a hangover feels like drought.',
    advice: 'Alternate with water as you go. Cooked-off wine in a sauce is negligible; a glass alongside is not.',
    kw: ['wine', 'red wine', 'white wine', 'beer', 'vodka', 'rum', 'bourbon', 'whiskey', 'whisky',
      'tequila', 'brandy', 'sherry', 'vermouth', 'sake', 'mirin', 'liqueur', 'cognac'],
  },
  {
    id: 'protein',
    label: 'A big protein load',
    why: 'Clearing the nitrogen from a lot of protein takes water. Real, but modest — worth a glass with dinner, not worth worrying about.',
    advice: 'A glass with the meal covers it.',
    kw: ['protein powder', 'whey', 'casein', 'ribeye', 'sirloin', 'brisket', 'pork shoulder',
      'whole chicken', 'ground beef', 'steak'],
  },
  {
    id: 'caffeine',
    label: 'Caffeine (a smaller deal than you\'ve heard)',
    why: 'Mildly diuretic, but the effect is well short of its reputation — for a habitual drinker, a coffee still leaves you net ahead on fluid. Worth knowing, not worth worrying about.',
    advice: 'No action needed. Just don\'t count on it instead of water in the heat.',
    kw: ['espresso', 'coffee', 'cold brew', 'matcha', 'black tea', 'green tea', 'yerba mate'],
  },
];

function linesOf(recipe) {
  if (Array.isArray(recipe)) return recipe.map(String);
  const ings = recipe?.ingredients || [];
  return ings.map(i => (typeof i === 'string' ? i : (i?.name || i?.item || i?.ingredient || '')));
}

/**
 * Real hydration read on a recipe, from its own ingredient list.
 *
 * @returns {{drivers: Array, level: 'none'|'mild'|'notable', headline: string|null, disclaimer: string}}
 *   `drivers` carries which ingredient lines actually matched, so the UI can
 *   show its work ("soy sauce, miso") rather than assert a conclusion.
 *   Returns level 'none' with an empty list when nothing genuinely matches —
 *   silence is the correct output for a plain bowl of pasta, and a feature
 *   that fires on everything teaches people to ignore it.
 */
export function hydrationFor(recipe) {
  const lines = linesOf(recipe).filter(Boolean);
  const lower = lines.map(l => l.toLowerCase());

  const drivers = [];
  for (const d of DRIVERS) {
    const matched = [];
    lines.forEach((line, i) => {
      if (d.kw.some(k => lower[i].includes(k))) matched.push(line.trim());
    });
    if (matched.length) drivers.push({ ...d, matched, kw: undefined });
  }

  // "Notable" means either a driver that genuinely needs water to work
  // (fiber), or enough separate mechanisms stacking that thirst is a real
  // prediction rather than a guess. Caffeine alone never escalates — see the
  // header's second design note.
  const ids = new Set(drivers.map(d => d.id));
  const serious = drivers.filter(d => d.id !== 'caffeine' && d.id !== 'protein');
  const level = (ids.has('fiber') || serious.length >= 2) ? 'notable'
    : drivers.length ? 'mild'
    : 'none';

  let headline = null;
  if (level === 'notable') {
    headline = ids.has('fiber')
      ? 'This one actually needs the water to work.'
      : 'This is going to make you thirsty, and here\'s why.';
  } else if (level === 'mild') {
    headline = 'One thing worth a glass of water.';
  }

  return { drivers, level, headline, disclaimer: DISCLAIMER };
}

/** One-line version for a compact surface (a recipe card, a run summary). */
export function hydrationLine(recipe) {
  const { drivers, level } = hydrationFor(recipe);
  if (level === 'none') return null;
  const names = drivers.map(d => d.label.toLowerCase());
  const list = names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `Keep water close — ${list}.`;
}

/* ════════════════════════════════════════════════════════════════════════
   FROM: src/lib/wellnessAdvisory.js
   ════════════════════════════════════════════════════════════════════════ */

/* wellnessAdvisory.js — the "yo, that's not good" bar.

   The founder's ask, verbatim in spirit: the app can't stop harmful content
   from existing, but when a hashtag or a community is organized around
   disordered eating — "skinny at any cost," starvation-as-a-goal, pro-ana /
   thinspo content — it can at least say something caring and point to real
   help. Food is fuel and growth; a body isn't a number to minimize.

   Two hard rules so this HELPS instead of moralizing:

   1. CONSERVATIVE. Normal healthy eating is NOT flagged — #healthy, #lowcarb,
      #highprotein, #weightloss, #caloriedeficit, #glp1, a diet, a cut, "clean
      eating" are legitimate goals and get NOTHING. We only fire on the
      genuinely disordered cluster (restriction-as-identity, pro-ED community
      tags, purging, starvation framed as an aesthetic). A false "you're
      unhealthy" nag at someone eating a salad is its own harm.

   2. HONEST resources only. We reuse the app's already-vetted, real crisis
      lines (shadowToLight.CRISIS_RESOURCES — 988, Crisis Text Line,
      findahelpline.com, which covers eating disorders internationally). We do
      NOT invent an ED hotline number that might be dead.

   The tone is supportive, not scolding — same family as AllergyPanel's
   ANAPHYLAXIS_NOTE and Nova's crisis routing. */

// Coined pro-ED terms — these are basically ONLY used to organize harmful
// content, so a substring match on a tag is safe (and #proana / "pro ana" all
// normalize to the same thing).
const PRO_ED_CONTAINS = [
  'proana', 'promia', 'thinspo', 'thinspiration', 'bonespo', 'meanspo',
  'skinnycheck', 'wannabeskinny', 'edtwt', 'chewandspit',
  'sizezero', 'thighgap', 'zerocalories', '0calories', 'fastingtolose',
  'goalbody', 'skinnychallenge',
];

// Ambiguous single words — flag ONLY as an exact standalone tag (a community
// literally named this), never as a substring (so "#starvingartist",
// "#anaheim", "#bananabread" never trip it).
const PRO_ED_EXACT = [
  'ana', 'mia', 'anamia', 'ednos', 'starvation', 'purge', 'purging',
  'anorexia', 'anorexic', 'bulimia', 'nofood', 'noteating', 'skipmeals',
];

// RECOVERY is the good direction — communities built around getting better use
// exactly these words (#edrecovery, #anorexiarecovery, "recovering"). Flagging
// them with "that's not good" would be actively harmful, so recovery context
// is a hard allow: it overrides every match above.
const RECOVERY_RE = /recover|recovery|healing|survivor|edrecovery|anti[-]?diet|intuitiveeating|allfoodsfit|foodfreedom/i;

// Phrase-level signals for free text (a written post), where a full clause
// gives real context — so these can be longer/clearer than the tag list.
const DISORDERED_PHRASES = [
  'starve myself', 'as skinny as possible', "don't deserve to eat",
  'punish myself for eating', 'earn my food', 'never thin enough',
  'nothing tastes as good as skinny', 'how to not eat', 'ways to skip meals',
];

function norm(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function hasDisorderedTag(tag) {
  const raw = String(tag || '');
  if (RECOVERY_RE.test(raw)) return false;      // recovery is the good direction — never flag
  const n = norm(tag);
  if (!n) return false;
  if (PRO_ED_EXACT.includes(n)) return true;    // exact standalone tag only
  return PRO_ED_CONTAINS.some((d) => n.includes(norm(d)));
}

/** Does any tag in the list read as pro-ED / disordered? Returns the first hit
    or null. Normal health/diet tags return null. */
export function concerningTag(tags = []) {
  for (const t of tags) if (hasDisorderedTag(t)) return t;
  return null;
}

/** Free-text scan (for a written post / recipe blurb). Recovery context is a
    hard allow here too. */
export function concerningText(text = '') {
  const raw = String(text).toLowerCase();
  if (RECOVERY_RE.test(raw)) return false;
  if (DISORDERED_PHRASES.some((p) => raw.includes(p))) return true;
  const n = norm(text);
  return PRO_ED_CONTAINS.some((d) => n.includes(norm(d)));
}

const SUPPORT_MESSAGE =
  "Heads up — this looks like it's organized around restriction, not nourishment. " +
  "Food is how a body grows, heals, and thinks; you deserve to eat, and a number was never the goal. " +
  "You're welcome to keep looking, but if any of this is hitting close to home, real, kind help is a tap away.";

/**
 * Advisory for a community/tag view or a post. Returns null (the common case —
 * nothing to say) or { level, title, message, resources }.
 * @param tags  string[] — the hashtags defining the view/community
 * @param text  string   — optional free text (a written post) to also scan
 */
export function wellnessAdvisory({ tags = [], text = '' } = {}) {
  const tagHit = concerningTag(tags);
  const textHit = text ? concerningText(text) : false;
  if (!tagHit && !textHit) return null;
  return {
    level: 'concern',
    title: 'A note on this one',
    message: SUPPORT_MESSAGE,
    resources: CRISIS_RESOURCES,
    tag: tagHit || null,
  };
}

/* ════════════════════════════════════════════════════════════════════════
   FROM: src/lib/wellnessGoals.js
   ════════════════════════════════════════════════════════════════════════ */

/* wellnessGoals.js — non-diet wellness support: goal toggles, nutrient tags,
   healthy swaps, and a mindful-eating journal.

   Deliberately avoids "diet" / "weight loss" language throughout, per the
   spec this was built from — "nourishing," "energizing," "supporting"
   instead. Nutrient tags are derived from ingredient text via keyword
   matching (same pattern as flavorProfile.js's 8 flavors), not hand-tagged
   per recipe — an honest heuristic, not a lab nutrition analysis.

   NOTE: this section originally imported SUGAR_SUBSTITUTES,
   FLOUR_ALTERNATIVES, FAT_SUBSTITUTES, DAIRY_SUBSTITUTES, and
   STARCH_SUBSTITUTES from './healthify' — those are now same-module
   references, defined in the healthify section above. It also originally
   defined its own local `ingredientText()`; that definition now lives in
   "SHARED HELPERS" near the top of this file (see header note). */

export const WELLNESS_GOALS = [
  { id: 'nutrient-dense',    label: 'Nutrient-dense meals',   blurb: 'Lean toward recipes packed with vitamins, fiber and protein.' },
  { id: 'reduce-sugar',      label: 'Reduce added sugar',     blurb: 'Flag recipes heavy on refined sugar; suggest a swap.' },
  { id: 'increase-protein',  label: 'Increase protein',       blurb: 'Highlight recipes and swaps that add protein.' },
  { id: 'reduce-processed',  label: 'Reduce processed food',  blurb: 'Favor whole-ingredient swaps over packaged shortcuts.' },
  { id: 'more-plants',       label: 'Eat more plants',        blurb: 'Nudge toward vegetable-forward recipes and swaps.' },
  { id: 'support-energy',    label: 'Support my energy',      blurb: 'Favor balanced meals — protein, fiber, healthy fat together.' },
  { id: 'support-digestion', label: 'Support my digestion',   blurb: 'Lean toward fiber-rich, whole-food ingredients.' },
];

const GOALS_KEY = 'dig_in_wellness_goals';

export function loadGoals() {
  try { const v = JSON.parse(localStorage.getItem(GOALS_KEY)); return Array.isArray(v) ? v : []; } catch { return []; }
}

export function toggleGoal(goalId) {
  const set = new Set(loadGoals());
  if (set.has(goalId)) set.delete(goalId); else set.add(goalId);
  const list = [...set];
  try { localStorage.setItem(GOALS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  return list;
}

// ── Nutrient tags — derived from ingredient text, not hand-tagged ─────────
const NUTRIENT_RULES = [
  { id: 'high-protein', label: 'High-Protein',  test: t => /chicken|beef|pork|salmon|tuna|shrimp|tofu|egg|beans|lentil|chickpea|greek yogurt|cottage cheese|protein powder|whey|casein|collagen|peanut butter|almond butter|protein bar/.test(t) },
  { id: 'high-fiber',   label: 'High-Fiber',     test: t => /beans|lentil|chickpea|oats|whole wheat|quinoa|broccoli|brussels|artichoke|chia|flax/.test(t) },
  { id: 'low-carb',     label: 'Low-Carb',       test: t => !/pasta|rice|bread|flour|potato|sugar|noodles|tortilla/.test(t) && /chicken|beef|salmon|egg|salad|vegetable|zucchini|cauliflower/.test(t) },
  { id: 'vegan',        label: 'Vegan',          test: t => !/chicken|beef|pork|fish|salmon|tuna|shrimp|egg|milk|cream|butter|cheese|yogurt|honey|bacon|lamb/.test(t) && /tofu|vegetable|beans|lentil|quinoa|vegan/.test(t) },
  { id: 'vegetarian',   label: 'Vegetarian',     test: t => !/chicken|beef|pork|fish|salmon|tuna|shrimp|bacon|lamb/.test(t) },
  { id: 'gluten-free',  label: 'Gluten-Free',    test: t => !/flour|wheat|pasta|bread|noodles|panko|breadcrumbs|barley/.test(t) },
];

/** Nutrient tags for a recipe's ingredient list — a small, real derived set. */
export function nutrientTags(ingredients) {
  const text = (ingredients || []).map(ingredientText).join(' ').toLowerCase();
  if (!text) return [];
  return NUTRIENT_RULES.filter(r => r.test(text)).map(r => ({ id: r.id, label: r.label }));
}

// ── Wellness-adaptive recipe scoring — additive weight, not a replacement ──
// Maps each goal to the nutrientTags() ids that count as satisfying it.
// reduce-sugar / reduce-processed have no matching nutrient-tag rule, so
// they're read straight off the ingredient text instead.
const GOAL_NUTRIENT_TAGS = {
  'nutrient-dense':    ['high-protein', 'high-fiber'],
  'increase-protein':  ['high-protein'],
  'more-plants':       ['vegan', 'vegetarian'],
  'support-energy':    ['high-protein', 'high-fiber'],
  'support-digestion': ['high-fiber'],
};

/** How well a recipe's ingredients match a user's active wellness goals —
 * a small additive score (0+), never a hard filter. 0 when there are no
 * active goals, or the recipe just doesn't match any of them. */
export function wellnessScore(ingredients, goals) {
  if (!goals || goals.length === 0) return 0;
  const text = (ingredients || []).map(ingredientText).join(' ').toLowerCase();
  if (!text) return 0;
  const tags = new Set(nutrientTags(ingredients).map(t => t.id));
  let score = 0;
  for (const goalId of goals) {
    if (goalId === 'reduce-sugar') {
      if (!/\bsugar\b|corn syrup|frosting|condensed milk/.test(text)) score += 2;
      continue;
    }
    if (goalId === 'reduce-processed') {
      if (!/\bcanned\b|instant|frozen dinner|packaged|processed/.test(text)) score += 1;
      continue;
    }
    const wantTags = GOAL_NUTRIENT_TAGS[goalId];
    if (wantTags && wantTags.some(t => tags.has(t))) score += 2;
  }
  return score;
}

/** True if a recipe carries any nutrient tag at all — used to guarantee
 * every region reel keeps at least one nutrient-tagged option visible even
 * for users with no wellness goals set, without moralizing about the rest. */
export function hasNutrientTag(ingredients) {
  return nutrientTags(ingredients).length > 0;
}

// ── Healthy swaps — matched against what's actually in the recipe. Option
// labels are sourced from healthify.js's richer canonical substitute data
// (also used by the Healthify Lab builder + HealthifyPanel), so there's one
// sugar/flour/fat/dairy substitute list app-wide, not two. ────────────────
const SWAP_RULES = [
  { trigger: /white flour|all-purpose flour|\bflour\b/, swap: 'White flour', options: FLOUR_ALTERNATIVES.map(o => o.label) },
  { trigger: /\bsugar\b/,       swap: 'White sugar',  options: SUGAR_SUBSTITUTES.map(o => o.label) },
  { trigger: /\bbutter\b/,      swap: 'Butter',        options: FAT_SUBSTITUTES.map(o => o.label) },
  { trigger: /\bheavy cream\b/, swap: 'Heavy cream',   options: DAIRY_SUBSTITUTES.map(o => o.label) },
  { trigger: /\bpasta\b/,       swap: 'Pasta',         options: STARCH_SUBSTITUTES.map(o => o.label) },
];

/** Healthy swaps relevant to this specific recipe's ingredients. */
export function healthySwapsFor(ingredients) {
  const text = (ingredients || []).map(ingredientText).join(' ').toLowerCase();
  if (!text) return [];
  const seen = new Set();
  const out = [];
  for (const rule of SWAP_RULES) {
    if (rule.trigger.test(text) && !seen.has(rule.swap)) {
      seen.add(rule.swap);
      out.push({ swap: rule.swap, options: rule.options });
    }
  }
  return out;
}

// ── "I used this swap" — a real, user-driven counter (not fabricated) ─────
const SWAPS_MADE_KEY = 'dig_in_swaps_made';

export function recordSwapMade() {
  const n = parseInt(localStorage.getItem(SWAPS_MADE_KEY) || '0', 10) + 1;
  try { localStorage.setItem(SWAPS_MADE_KEY, String(n)); } catch { /* ignore */ }
  return n;
}

export function getSwapsMadeCount() {
  return parseInt(localStorage.getItem(SWAPS_MADE_KEY) || '0', 10);
}

// ── Mindful-eating journal ──────────────────────────────────────────────
const JOURNAL_KEY = 'dig_in_mindful_journal';

export function loadMindfulJournal() {
  try { const v = JSON.parse(localStorage.getItem(JOURNAL_KEY)); return Array.isArray(v) ? v : []; } catch { return []; }
}

export function logMindfulEntry({ ate, feltBefore, feltDuring, feltAfter }) {
  const list = loadMindfulJournal();
  list.unshift({
    id: `me_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    ate: (ate || '').trim(),
    feltBefore: feltBefore || '',
    feltDuring: feltDuring || '',
    feltAfter: feltAfter || '',
    ts: Date.now(),
  });
  try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  return list;
}

export function removeMindfulEntry(id) {
  const list = loadMindfulJournal().filter(e => e.id !== id);
  try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  return list;
}

export const FEEL_BEFORE_OPTIONS = ['Hungry', 'Stressed', 'Happy', 'Sad', 'Bored', 'Tired', 'Neutral'];
export const FEEL_DURING_OPTIONS = ['Enjoying it', 'Savoring', 'Rushed', 'Distracted', 'Present'];
export const FEEL_AFTER_OPTIONS  = ['Satisfied', 'Energized', 'Heavy', 'Still hungry', 'Tired'];
