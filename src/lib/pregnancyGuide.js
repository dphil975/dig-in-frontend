/* pregnancyGuide.js — real, ingredient-based support for the "Pregnant" and
   "New baby" life modes.

   Two halves:

   1. THE FEED LENS (original, unchanged): which real recipes are actually
      iron/folate-forward, and a soft flag on the well-established pregnancy
      food-safety categories. nutrientTagsFor() and pregnancyCaution() keep
      their exact original signatures — feedSlots.js and Home/buildFeed.js
      both depend on them. Recipes that match a caution are DEPRIORITIZED
      (the same soft-suppress the season lens uses), never hidden. The user
      decides; we just don't lead with them.

   2. THE STAGE LAYER (new): trimester- and postpartum-aware nutrition
      context, and craving interpretation. Postpartum was missing entirely,
      which is the gap that mattered most — the fourth trimester is when
      people are least able to cook and get the least support for it.

   SCOPE HONESTY. This is a keyword net over public-health-agency-level
   guidance (CDC / FDA / ACOG "foods to avoid" lists), written as education,
   NOT medical advice, NOT exhaustive, and NOT a diagnosis. Pregnancy and
   postpartum nutrition are genuinely individual and genuinely consequential —
   every surface that renders this must carry DISCLAIMER and must defer to an
   OB, midwife, or dietitian. Nothing here tells anyone to take a supplement
   or change a diet.

   ONE DELIBERATE REFUSAL: this file does not repeat lactation-supplement
   marketing. See LACTATION_HONESTY — the evidence for "milk-boosting" foods
   is weak, and an app that exists partly to cut out brands selling you things
   should not sell you lactation cookies. */

const IRON_RICH = /spinach|lentil|chickpea|black beans?|kidney beans?|red meat|\bbeef\b|liver|tofu|quinoa|fortified cereal|pumpkin seed|dark leafy/i;
const FOLATE_RICH = /spinach|leafy greens?|kale|asparagus|avocado|broccoli|lentil|chickpea|black beans?|citrus|\borange\b|fortified/i;

// A keyword net, not a medical database — see file header.
const PREGNANCY_CAUTION = /\bsushi\b|\bsashimi\b|raw (fish|salmon|tuna|oyster|egg)s?|unpasteurized|soft[- ]ripened|\bbrie\b|camembert|blue cheese|roquefort|deli meat|cold cuts|\bprosciutto\b|\bpat[eé]\b|\balcohol\b|\bwine\b|\bbeer\b|\brum\b|\bvodka\b|\bwhiskey\b|swordfish|king mackerel|\bahi\b|shark meat/i;

function ingredientText(recipe) {
  const lines = (recipe?.ingredients || []).map((i) => (typeof i === 'object' ? i.text || i.name || '' : i));
  return `${recipe?.name || ''} ${lines.join(' ')}`.toLowerCase();
}

/** Real structured tags for a recipe that's actually iron- and/or
    folate-forward by ingredient — only added when the recipe earns them. */
export function nutrientTagsFor(recipe) {
  const hay = ingredientText(recipe);
  const out = [];
  if (IRON_RICH.test(hay)) out.push('#ironrich');
  if (FOLATE_RICH.test(hay)) out.push('#folate');
  return out;
}

/** Does this recipe hit one of the common pregnancy-caution categories? */
export function pregnancyCaution(recipe) {
  return PREGNANCY_CAUTION.test(ingredientText(recipe));
}

/* ── Disclaimers ─────────────────────────────────────────────────────────── */

export const DISCLAIMER =
  'General nutrition education, not medical advice. Pregnancy and postpartum nutrition are individual and consequential — your OB, midwife, or a registered dietitian is the actual source here, not an app.';

export const CAUTION_DISCLAIMER =
  'A keyword flag over public-health "foods to avoid" lists (CDC/FDA/ACOG), not a lab test and not exhaustive. It can miss things and it can over-flag. Nothing is hidden from you — flagged recipes just stop leading the feed.';

/* ── Why each caution category exists ────────────────────────────────────────
   The original code returned a bare boolean, which tells someone their dinner
   is wrong without telling them why — the exact "trust me" posture this app is
   supposed to be the opposite of. Each category now carries its real reason so
   a person can make their own call, including deciding the risk is fine. */

export const CAUTION_CATEGORIES = [
  {
    id: 'raw-fish',
    label: 'Raw or undercooked fish/shellfish',
    test: /\bsushi\b|\bsashimi\b|raw (fish|salmon|tuna|oyster)s?|\bceviche\b|raw oysters?/i,
    why: 'Risk of listeria and parasites. Listeria is the specific concern in pregnancy because it can cross the placenta, and pregnancy raises susceptibility to it considerably.',
    instead: 'The same dish cooked through — a seared or fully-cooked version of the same fish is not on the avoid list.',
  },
  {
    id: 'high-mercury',
    label: 'High-mercury fish',
    test: /swordfish|king mackerel|\bahi\b|bigeye|shark meat|tilefish|marlin/i,
    why: 'Methylmercury accumulates in large, long-lived predator fish and can affect fetal neurological development. This is about which species, not about fish in general.',
    instead: 'FDA/EPA "best choices" — salmon, sardines, shrimp, cod, tilapia, canned light tuna. Fish is actively recommended in pregnancy; it is specifically the high-mercury species that are not.',
  },
  {
    id: 'unpasteurized',
    label: 'Unpasteurized dairy & soft-ripened cheese',
    test: /unpasteurized|raw milk|soft[- ]ripened|\bbrie\b|camembert|blue cheese|roquefort|gorgonzola|queso fresco|feta/i,
    why: 'Listeria again — it survives refrigeration, which is why soft cheeses specifically come up. Pasteurization is the step that removes the risk.',
    instead: 'The pasteurized version of the same cheese. Most supermarket brie, feta, and blue cheese in the US already are — it says so on the label.',
  },
  {
    id: 'deli-meat',
    label: 'Deli meat, cold cuts, pâté',
    test: /deli meat|cold cuts|\bprosciutto\b|\bpat[eé]\b|\bsalami\b|\bbologna\b/i,
    why: 'Listeria risk from ready-to-eat meats held cold. The commonly-given workaround is heat, not abstinence.',
    instead: 'Heating it until steaming (roughly 165°F) is the standard guidance — a hot sandwich rather than a cold one.',
  },
  {
    id: 'raw-egg',
    label: 'Raw or runny egg',
    test: /raw eggs?|runny eggs?|\bmeringue\b|raw (cookie )?dough|homemade (mayo|mayonnaise|aioli|caesar)/i,
    why: 'Salmonella risk. Comes up more often than people expect, because it hides in homemade dressings, aioli, mousse, and batter.',
    instead: 'Pasteurized eggs, which are sold specifically for this and work in the same recipes.',
  },
  {
    id: 'alcohol',
    label: 'Alcohol',
    test: /\balcohol\b|\bwine\b|\bbeer\b|\brum\b|\bvodka\b|\bwhiskey\b|\bbourbon\b|\bbrandy\b|\bliqueur\b/i,
    why: 'No amount has been established as safe in pregnancy, which is why the guidance is categorical rather than a threshold.',
    instead: 'The app\'s Zero Proof section exists for this. Cooking does not reliably remove all alcohol, so "it burns off" is not a safe assumption.',
  },
];

/**
 * Which caution categories a recipe hits, and why. Returns [] for a clear
 * recipe. This is the explainable version of pregnancyCaution() — same net,
 * but it can say what it caught and offer the ordinary workaround.
 */
export function cautionDetail(recipe) {
  const hay = ingredientText(recipe);
  return CAUTION_CATEGORIES
    .filter((c) => c.test.test(hay))
    .map(({ id, label, why, instead }) => ({ id, label, why, instead }));
}

/* ── Stages ──────────────────────────────────────────────────────────────────
   Including the fourth trimester as a real stage, because it is the one where
   cooking is hardest and the one every food app forgets. */

export const STAGES = [
  {
    id: 't1',
    label: 'First trimester',
    what: 'Nausea and aversions usually run the show. Appetite is unreliable.',
    // Deliberately permission-giving rather than prescriptive: in the first
    // trimester "eat what stays down" is closer to actual clinical advice than
    // any balanced-plate diagram.
    posture: 'Eat what stays down. This is the one stretch where getting calories in at all beats getting them in balanced, and plenty of clinicians will tell you the same thing.',
    nutrients: ['folate'],
    practical: [
      'Cold food smells less. Aversions are often driven by smell more than taste.',
      'Dry and bland early in the day is a real pattern, not fussiness.',
      'Small and frequent tends to beat three meals when nausea is in play.',
    ],
  },
  {
    id: 't2',
    label: 'Second trimester',
    what: 'Appetite usually returns. The stretch where cooking feels possible again.',
    posture: 'The most practical window for building a habit or stocking a freezer — energy is typically at its best here.',
    nutrients: ['iron', 'calcium', 'protein'],
    practical: [
      'A good stretch to batch and freeze, because the third trimester and the newborn weeks will both cash it in.',
      'Iron needs rise substantially through the back half of pregnancy.',
    ],
  },
  {
    id: 't3',
    label: 'Third trimester',
    what: 'Less room to eat, more heartburn, more tiredness.',
    posture: 'Smaller and more often, and front-load the day if lying down after eating is uncomfortable.',
    nutrients: ['iron', 'calcium', 'protein', 'fiber'],
    practical: [
      'Physical stomach capacity is genuinely reduced — smaller meals are mechanics, not discipline.',
      'Freezer meals made now are the ones you actually eat in the newborn weeks.',
    ],
  },
  {
    id: 'postpartum',
    label: 'Fourth trimester (0–12 weeks)',
    what: 'Recovery, blood loss, broken sleep, and often one free hand at most.',
    posture: 'The goal is fed, not impressive. Food you can eat one-handed, cold, or three hours later than you meant to is not a lesser version of cooking right now — it is the correct version.',
    nutrients: ['iron', 'fiber', 'protein', 'hydration'],
    practical: [
      'One-handed food is a real category: wraps, hand pies, overnight oats, cut fruit, hard-boiled eggs, anything on a stick.',
      'Constipation is extremely common after birth — fiber plus water genuinely matters, and iron supplements tend to make it worse.',
      'Put water everywhere you sit. Thirst during nursing is sudden and inconvenient.',
    ],
  },
  {
    id: 'nursing',
    label: 'Nursing',
    what: 'Higher calorie and fluid needs, often at unpredictable hours.',
    posture: 'Eat more than feels necessary and drink more than feels necessary. Hunger while nursing is a real physiological signal, not a lapse.',
    nutrients: ['hydration', 'protein', 'iron', 'calcium'],
    practical: [
      'Milk production adds meaningfully to daily energy needs — commonly cited around 330–400 extra calories a day in the first six months.',
      'Keep snacks where you feed, not where you cook. You will not get up.',
    ],
  },
];

export const stageById = (id) => STAGES.find((s) => s.id === id) || null;

/* ── Nutrients that actually change by stage ─────────────────────────────────
   Only the ones with a genuine stage-specific story. Deliberately no dosages
   and no supplement advice — that is a clinician's call, and a keyword net has
   no business making it. */

export const KEY_NUTRIENTS = {
  folate: {
    label: 'Folate',
    when: 'Most critical earliest — often before someone knows they are pregnant.',
    why: 'Involved in neural tube development, which happens in the first weeks. This is why prenatal vitamins are typically recommended before conception rather than after a positive test.',
    foods: ['lentils', 'chickpeas', 'spinach', 'asparagus', 'avocado', 'broccoli', 'fortified cereal', 'oranges'],
  },
  iron: {
    label: 'Iron',
    when: 'Rises through pregnancy, and stays relevant after birth to recover from blood loss.',
    why: 'Blood volume increases substantially during pregnancy, so iron demand rises with it. Deficiency is common and is one of the more frequently flagged things in routine prenatal bloodwork.',
    foods: ['lentils', 'beef', 'spinach', 'tofu', 'pumpkin seeds', 'fortified cereal', 'black beans'],
    tip: 'Vitamin C alongside plant iron measurably improves absorption — lemon on the lentils is doing real work, not garnish.',
  },
  calcium: {
    label: 'Calcium',
    when: 'Second and third trimester, and while nursing.',
    why: 'Fetal skeletal development draws on maternal stores, so intake matters for the person supplying it as much as for the baby.',
    foods: ['yogurt', 'pasteurized cheese', 'canned sardines', 'tofu', 'fortified plant milk', 'kale'],
  },
  protein: {
    label: 'Protein',
    when: 'Rises in the back half, and stays elevated while nursing.',
    why: 'Tissue growth and repair — for the pregnancy, and afterward for recovery from birth.',
    foods: ['eggs', 'beans', 'chicken', 'greek yogurt', 'lentils', 'tofu', 'cottage cheese'],
  },
  fiber: {
    label: 'Fiber',
    when: 'Third trimester and postpartum, especially.',
    why: 'Constipation is one of the most common and least-discussed complaints in both stretches, and iron supplements typically compound it. Fiber and water are the ordinary first answer.',
    foods: ['oats', 'beans', 'pears', 'prunes', 'berries', 'whole grains', 'chia'],
  },
  hydration: {
    label: 'Fluids',
    when: 'All of it, and sharply higher while nursing.',
    why: 'Milk is mostly water, and thirst while nursing tends to arrive suddenly. Dehydration also worsens constipation and fatigue, which are already the two most common complaints.',
    foods: ['water', 'broth', 'soup', 'fruit', 'milk'],
  },
};

/** Nutrients worth knowing about for a stage, resolved to full entries. */
export function nutrientsForStage(stageId) {
  const stage = stageById(stageId);
  if (!stage) return [];
  return stage.nutrients.map((n) => ({ id: n, ...KEY_NUTRIENTS[n] })).filter((n) => n.label);
}

/* ── The lactation-supplement refusal ───────────────────────────────────────*/

export const LACTATION_HONESTY =
  'There is a large industry selling lactation cookies, teas, and supplements, and the evidence that any specific food meaningfully increases milk supply is weak. What is well supported is unglamorous: enough calories, enough fluid, and frequent removal of milk. If supply is a real concern, that is a lactation consultant\'s job, not a cookie\'s.';

/* ── Pica ────────────────────────────────────────────────────────────────────
   Craving ice, clay, chalk, cornstarch, or dirt is a recognized phenomenon in
   pregnancy with a documented association with iron deficiency. This is worth
   surfacing because it is the one craving pattern where "mention it to your
   provider" is genuinely the right response — and because someone
   compulsively chewing ice usually has no idea it is a known thing.

   Flags, never diagnoses. cravingTracker.js's 'cold' pattern already gestures
   at this; this is the fuller version it points toward. */

const PICA_RE = /\b(ice|chalk|clay|dirt|soil|cornstarch|starch|laundry starch|paper|ash|baking soda)\b/i;

export const PICA_NOTE =
  'Craving ice or non-food things like clay, chalk, or cornstarch is a recognized pattern in pregnancy, and it has a well-documented association with low iron. It is worth mentioning at your next appointment — not because something is wrong with you, but because it is the kind of thing routine bloodwork checks for and it is straightforward to look into.';

/** Does a craving description look like pica? Intentionally loose: over-
    surfacing a gentle "mention this to your provider" note is a much cheaper
    error than missing it. */
export function looksLikePica(text) {
  const s = String(text || '').toLowerCase();
  if (!PICA_RE.test(s)) return false;
  // "ice cream", "iced coffee", "ice water" are not pica.
  if (/\bice\b/.test(s) && /\bice (cream|coffee|tea|water|latte|pop)\b/.test(s)) return false;
  return true;
}

/* ── Craving interpretation ──────────────────────────────────────────────────
   Reads a craving and answers it, rather than correcting it. The founder's
   framing throughout is that a craving is information and fighting it directly
   tends to lose — so this maps a craving onto food that actually satisfies the
   same shape, and only ever adds a nutrient note where there is a real one. */

const CRAVING_SHAPES = [
  {
    id: 'sour',
    test: /sour|tart|lemon|lime|vinegar|pickle|citrus|sour candy|kimchi|tamarind/i,
    label: 'Sour & tart',
    read: 'One of the most commonly reported pregnancy cravings, and it often shows up alongside nausea — sour genuinely does cut through it for a lot of people.',
    satisfy: ['lemon on everything', 'pickles and their brine', 'greek yogurt with citrus', 'tamarind candy', 'vinegar slaw'],
    bonus: 'Citrus alongside plant iron improves absorption, so a sour craving and an iron need can be answered by the same plate.',
  },
  {
    id: 'salty',
    test: /salt|salty|chips|fries|pickle|olive|pretzel|crisps|popcorn/i,
    label: 'Salty',
    read: 'Classically reported, and blood volume expands a lot during pregnancy, which is part of why salt can start tasting different. Not a reason to salt without limit, and worth raising with your provider if you have been told to watch blood pressure.',
    satisfy: ['olives', 'salted nuts', 'popcorn', 'miso soup', 'feta on a tomato'],
  },
  {
    id: 'sweet',
    test: /sweet|sugar|candy|chocolate|dessert|cake|ice cream|donut|cookie/i,
    label: 'Sweet',
    read: 'Extremely common, and more so later on. The version that holds you longer is sweet with fat or protein attached rather than sugar alone.',
    satisfy: ['dates with peanut butter', 'greek yogurt and honey', 'dark chocolate', 'baked fruit with cream', 'frozen banana'],
  },
  {
    id: 'carb',
    test: /bread|pasta|potato|rice|noodle|carb|toast|bagel|cereal/i,
    label: 'Plain starch',
    read: 'Very typical when nausea is around — bland starch is one of the few things that reliably stays down, and that is a legitimate reason to eat it.',
    satisfy: ['buttered toast', 'plain rice', 'crackers by the bed', 'congee', 'baked potato'],
  },
  {
    id: 'cold',
    test: /cold|icy|ice|frozen|slush|popsicle|smoothie/i,
    label: 'Cold & icy',
    read: 'Common, and cold food carries less smell — which matters a lot when smell is the thing driving aversions.',
    satisfy: ['smoothies', 'frozen grapes', 'popsicles', 'cold noodle salad', 'yogurt from the freezer'],
  },
  {
    id: 'protein',
    test: /meat|steak|burger|chicken|egg|protein|beef|bacon/i,
    label: 'Meat & protein',
    read: 'Often shows up in the second and third trimester when protein and iron needs are climbing. A craving landing on the thing you need more of is not unusual.',
    satisfy: ['beef and broccoli', 'eggs any way', 'lentil bolognese', 'chicken with lemon'],
    bonus: 'Worth pairing with vitamin C if the source is plant-based.',
  },
  {
    id: 'comfort',
    test: /comfort|childhood|my mom|grandma|nostalgi|home|familiar/i,
    label: 'Nostalgic comfort',
    read: 'A comfort craving is as real as a flavor one, and it is usually pointing at wanting to feel looked after rather than at a specific nutrient. Worth taking literally.',
    satisfy: ['whatever the actual dish is', 'the version someone else makes for you', 'a phone call while you cook it'],
  },
];

/**
 * Read a craving. Returns the matched shape plus, when relevant, a pica flag
 * and stage-appropriate nutrient context.
 *
 * Never corrective — there is deliberately no "instead of that, eat this."
 * The craving gets answered; the nutrient note rides along only when it is
 * genuinely related.
 */
export function cravingInsight(text, stageId = null) {
  const s = String(text || '').trim();
  if (!s) return null;

  const shape = CRAVING_SHAPES.find((c) => c.test.test(s)) || null;
  const pica = looksLikePica(s);
  const stage = stageById(stageId);

  return {
    text: s,
    shape: shape ? { id: shape.id, label: shape.label, read: shape.read, satisfy: shape.satisfy, bonus: shape.bonus || null } : null,
    pica,
    picaNote: pica ? PICA_NOTE : null,
    stage: stage ? { id: stage.id, label: stage.label, posture: stage.posture } : null,
    nutrients: stage ? nutrientsForStage(stage.id) : [],
    disclaimer: DISCLAIMER,
  };
}

/** Every craving shape, for a picker UI. */
export const CRAVING_SHAPE_LIST = CRAVING_SHAPES.map(({ id, label }) => ({ id, label }));
