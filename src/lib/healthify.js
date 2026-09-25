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

import { ingredientText } from '../components/recipe/RecipeBoostSections';

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

function textOf(ingredients) {
  return (ingredients || []).map(ingredientText).join(' ').toLowerCase();
}

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
