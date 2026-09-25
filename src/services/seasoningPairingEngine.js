/**
 * seasoningPairingEngine.js
 *
 * Seasoning is exactly like putting on makeup — you don't do it all at once.
 * You build in layers. Each layer does a different job, and each one depends on
 * the one before it. Skip a layer and the whole thing falls flat. Layer them
 * correctly and the dish looks (and tastes) effortless.
 *
 * This engine also encodes the neuroscience of taste — how food interacts with
 * the brain, why we crave what we crave, and what a craving is actually asking
 * for. That model feeds the CravingCompass so recommendations match not just
 * your mood but the biology behind it.
 */

// ── THE SIX SEASONING LAYERS (The Makeup Analogy) ──────────────────────────
// Every dish has all six. Many home cooks only do stages 2–4. The difference
// between a good dish and a restaurant dish is usually stages 0 and 5.

export const SEASONING_LAYERS = [
  {
    stage:   0,
    name:    'Foundation — The Primer',
    timing:  '30 min to 24 hrs before cooking',
    makeup:  'Primer',
    emoji:   'FOUNDATION',
    what:    'Dry brine (salt directly on protein or veg)',
    why:     'Salt applied early travels through the food via osmosis, seasoning it from the inside. If you only salt at the end you season a thin shell — inside is bland. Like primer, this layer is invisible but everything else sticks to it.',
    rule:    "Salt earlier than feels right. A 30-minute sit beats a 30-second toss every single time.",
    howMuch: '¾ tsp kosher salt per pound of protein. ¼ tsp per cup of vegetables.',
    doNot:   'Do not cover tightly — moisture needs to evaporate off the surface. Dry skin = better crust.',
  },
  {
    stage:   1,
    name:    'Aromatics — The Base Coat',
    timing:  'First 2-3 minutes of cooking, in fat',
    makeup:  'Base coat / foundation',
    emoji:   'AROMATICS',
    what:    'Onion, shallot, garlic, ginger, whole spices (bloom in oil or butter)',
    why:     "Aromatics build the direction of the dish. Their most powerful flavor compounds — allicin (garlic), gingerols, limonene (citrus zest) — are fat-soluble. They bond to the oil and then coat every ingredient that follows. You can't add this layer later. Once you add liquid, that window closes forever.",
    rule:    "Cook aromatics until soft and golden, not until done. You want them transparent, not caramelized, unless that is the flavor you are building toward.",
    howMuch: '1 medium onion and 3 garlic cloves is a base for 2-4 servings. Use more than you think.',
    doNot:   "Don't rush this step. Undercooked raw garlic is the most common reason a dish tastes sharp and unpleasant.",
  },
  {
    stage:   2,
    name:    'Primary Spices — The Color',
    timing:  '60-90 seconds in the hot fat, before any liquid',
    makeup:  'Eye shadow / the main color story',
    emoji:   'PRIMARY',
    what:    'Dried spices (cumin, turmeric, paprika, chili, coriander, garam masala)',
    why:     'Dried spices contain fat-soluble aroma compounds that are released by heat. Blooming them in oil for 60 seconds before any liquid makes them 4–10× more potent than if added later. Added to liquid they stay flat. Added too early without fat they burn. This is the layer most cooks skip — and it is why dishes taste flat.',
    rule:    'Add spices after aromatics have softened, before stock or water or tomatoes. Stir constantly for 60-90 seconds.',
    howMuch: 'Start with half the amount you expect. You can always add more. Ground spice is more concentrated than fresh.',
    doNot:   "Don't add chili powder to raw oil over high heat — it burns in under 30 seconds and turns bitter. Reduce heat first.",
  },
  {
    stage:   3,
    name:    'Depth Builders — The Contour',
    timing:  'Mid-cook, with your main liquid or protein',
    makeup:  'Contouring / bronzer',
    emoji:   'DEPTH',
    what:    'Tomato paste, miso, soy sauce, fish sauce, worcestershire, anchovies, parmesan rind, mushroom powder',
    why:     "These are all umami bombs — concentrated glutamates that tell your brain 'protein found, satisfaction incoming.' Like contouring, they add shadow and dimension. They make flavor 3D instead of flat. Too much reads obvious (too salty, too dark). Just right and people say it 'tastes like a restaurant' without knowing why.",
    rule:    'Pick one or two, not five. Tomato paste + soy is a common pairing. Miso + fish sauce is another. These are concentrates — treat them like makeup, not paint.',
    howMuch: '1 tbsp tomato paste per cup of sauce. 1 tsp soy per serving. Start small.',
    doNot:   "Don't add all your umami sources at once. Layer them in — add half, taste, then decide if more is needed.",
  },
  {
    stage:   4,
    name:    'Final Seasoning — The Setting Spray',
    timing:  'Last 2 minutes, or off heat',
    makeup:  'Setting spray',
    emoji:   'FINAL',
    what:    'Acid (lemon, lime, vinegar, wine), final salt adjustment, black pepper',
    why:     "Acid is the most overlooked seasoning in home cooking. It does not make things sour — used correctly, it makes everything else taste more like itself. It brightens, lifts, and sharpens. It works like setting spray: locks the whole look in. But acid evaporates fast under heat, so it only works added at the very end. A squeeze of lemon right before plating will change more than another pinch of salt.",
    rule:    "Taste before you add acid. You are looking for the moment when things come into focus — like adjusting the brightness on a photo.",
    howMuch: '½ tsp per serving as a starting point. Less than you think. More available at the table.',
    doNot:   "Never add lemon juice to a cream sauce while it is actively boiling — it will break (curdle). Remove from heat first, then add.",
  },
  {
    stage:   5,
    name:    'Finishing Touches — The Highlighter',
    timing:  'On the plate, right before it hits the table',
    makeup:  'Highlighter / finishing touches',
    emoji:   'FINISHING',
    what:    'Fresh herbs, flaky sea salt, finishing-grade olive oil, chili crisp, toasted nuts, citrus zest',
    why:     "Fresh herbs, raw high-quality olive oil, and flaky salt all have aroma and texture compounds that disappear under heat. They are the catch-the-light moment — they elevate the dish from 'cooked' to 'presented.' Like highlighter on your cheekbones, they should be used lightly and intentionally, not dumped on.",
    rule:    'Everything in this layer goes on cold, raw, and last. If it would survive in the pan, it does not belong here.',
    howMuch: '5-6 torn basil leaves, a 3-second drizzle of finishing oil, a pinch of Maldon, ½ tsp lemon zest.',
    doNot:   "Never cook with finishing olive oil — heat destroys its aroma compounds. Keep two bottles: a cooking oil and a finishing oil.",
  },
];

// ── THE MISSING ELEMENTS ────────────────────────────────────────────────────
// Every recipe card gives you the ingredients. Almost none of them tell you
// the one extra step or ingredient that makes it taste like a restaurant.
// These are the things professional cooks do automatically — and home cooks
// don't know to look for.

export const MISSING_ELEMENTS = {
  pasta: {
    emoji:     'DISH',
    secret:    'Reserve pasta water — the real sauce emulsifier',
    why:       'Pasta water is starchy, salty water that acts as a natural emulsifier. When you toss it into the sauce, the starch binds the fat and water together, creating a silky coating instead of a greasy separation. Without it, your sauce slides off the noodles. Restaurants never skip this step.',
    technique: 'Scoop out ½ cup of the cloudy pasta water just before draining. Add it 1-2 tbsp at a time while tossing, until the sauce coats the noodles.',
    stage:     4,
  },
  curry: {
    emoji:     'DISH',
    secret:    'Bloom whole spices in ghee before anything else',
    why:       'Cardamom pods, cumin seeds, a bay leaf, and a dried chili bloomed in ghee for 30 seconds release fat-soluble compounds that powdered spice simply cannot replicate. This is Stage 1 taken seriously. The ghee becomes perfumed and every ingredient that follows gets coated in that aromatic base.',
    technique: 'Heat ghee until shimmering. Add whole spices first. Wait until you hear a sizzle and the aroma blooms (30-60 seconds). Then add onion.',
    stage:     1,
  },
  steak: {
    emoji:     'DISH',
    secret:    'Compound butter baste in the final 90 seconds',
    why:       'Cold butter added to the pan at the very end, along with crushed garlic cloves and fresh thyme, creates a self-basting foam when you tilt the pan and spoon it continuously. The milk solids in the butter brown and coat the crust with Maillard compounds. This is the biggest single difference between a home-cooked steak and a steakhouse steak.',
    technique: 'Flip the steak. Add 2 tbsp cold butter + 2 smashed garlic cloves + 2 thyme sprigs. Tilt pan toward you. Spoon the foaming butter over the steak continuously for 90 seconds.',
    stage:     5,
  },
  soup: {
    emoji:     'DISH',
    secret:    'Parmesan rind simmered in the broth',
    why:       "A parmesan rind costs nothing (save them in the freezer) and turns a decent soup into something that makes people ask what the secret is. As it simmers, it releases glutamates — the same flavor compounds as MSG — into the broth. It makes every spoonful taste deeper without adding any obvious dairy flavor.",
    technique: "Add 1-2 parmesan rinds at the start of the simmer. Remove before serving. The rind will be soft but won't dissolve.",
    stage:     3,
  },
  rice: {
    emoji:     'DISH',
    secret:    'Toast dry in butter before adding water',
    why:       "Toasting raw rice in butter for 2-3 minutes triggers the Maillard reaction — the same browning that makes bread toast and steak crust. You get nutty, popcorn-like flavor compounds that boiled rice can never develop. Some grains will turn translucent or faintly golden. That is the flavor developing.",
    technique: 'Add dry, rinsed rice to the pot with 1 tbsp butter. Stir over medium heat for 2-3 minutes until fragrant and some grains look translucent. Then add your liquid.',
    stage:     1,
  },
  chicken: {
    emoji:     'DISH',
    secret:    'Dry brine uncovered in the fridge — not a wet brine',
    why:       "Salting chicken 30 minutes to 24 hours in advance draws out surface moisture via osmosis, which then reabsorbs back in (with the salt dissolved into it). This seasons the meat from inside and dries the skin — dry skin in a hot pan crisps instead of steaming. Wet brines add flavor but also water weight, which undoes the crispy skin.",
    technique: 'Salt generously (both sides, under skin if possible). Place on a rack uncovered in the fridge for at least 30 minutes, up to 24 hours. Pat dry before cooking.',
    stage:     0,
  },
  fish: {
    emoji:     'DISH',
    secret:    'Start in a cold pan, bring the heat up slowly',
    why:       'When you place room-temperature fish in a screaming-hot pan, the proteins on the outside contract and seize instantly, squeezing moisture to the surface (steam = no crust) while the inside stays raw. Starting cold lets the fish cook more evenly from edge to center, building a crust gradually without shocking the protein.',
    technique: 'Pat the fish completely dry. Place skin-side down in a cold non-stick pan. Turn heat to medium. Do not touch it for 4-5 minutes. The skin will release on its own when crispy.',
    stage:     0,
  },
  beans: {
    emoji:     'DISH',
    secret:    'Salt the cooking water + add epazote herb',
    why:       "Old advice said never salt beans until after cooking (it toughens them). Modern food science (J. Kenji López-Alt, Americas Test Kitchen) has reversed this — early salting seasons the interior deeply while keeping the skin intact. Epazote is a Mexican herb specifically used in traditional bean cooking because it contains compounds (ascaridole) that break down the oligosaccharides responsible for gas.",
    technique: "For every cup of dried beans, add 1 tsp kosher salt and 2 fresh epazote leaves (or ¼ tsp dried) to the cooking water from the start.",
    stage:     0,
  },
  eggs: {
    emoji:     'DISH',
    secret:    'Low heat, cold butter, constant motion — pull off early',
    why:       "Scrambled eggs cooked over high heat contract the proteins too fast, squeezing out moisture and turning them rubbery. Low heat and constant movement keeps the protein curds small and creamy. Cold butter added mid-cook slows the heat transfer further. The most important rule: pull them off the heat while they still look underdone — carryover heat finishes them.",
    technique: 'Medium-low heat. Add ½ tbsp butter. Add beaten eggs. Stir constantly with a rubber spatula, moving it in slow S-shapes. Add another cold ½ tbsp butter halfway through. Remove from heat when 80% set.',
    stage:     4,
  },
  bread: {
    emoji:     'DISH',
    secret:    'Steam in the oven for the first 15 minutes',
    why:       "Steam keeps the outer crust pliable during the first phase of baking. This allows the loaf to expand fully ('oven spring') before the crust sets hard. Without steam, the crust hardens too early and the interior can't rise to its full potential. This is how bakers get those dramatic open crumbs and blistered, caramelized crusts.",
    technique: "Place an empty cast iron skillet on the bottom rack. When the bread goes in, carefully pour ½ cup of boiling water into the skillet. Close the door quickly. Remove the skillet at the 15-minute mark.",
    stage:     2,
  },
  sauce: {
    emoji:     'DISH',
    secret:    'Deglaze the pan — never waste the brown bits',
    why:       "The brown bits stuck to the bottom of the pan after searing protein are not burned food — they are concentrated Maillard compounds, pure concentrated flavor. Acid (wine, stock, lemon juice, vinegar) dissolves them instantly when added to a hot pan. This is called deglazing, and it is how pan sauces get that depth that bottled sauce can never replicate.",
    technique: 'After searing, remove the protein. With the pan still hot, add ¼ cup of wine, stock, or acid. Scrape the bottom vigorously with a wooden spoon. All of it will dissolve into the liquid within 30 seconds.',
    stage:     3,
  },
  vegetables: {
    emoji:     'DISH',
    secret:    'High heat, single layer, do not stir — let them brown',
    why:       "Vegetables roasted over medium heat steam instead of roast — they turn grey and soft. Crowding has the same effect: trapped steam prevents moisture from escaping so no caramelization can happen. Caramelization is the chemical conversion of sugars into hundreds of flavor compounds. It turns a sweet potato into something that tastes like candy and a broccoli floret into something nutty and complex.",
    technique: 'Preheat oven to 425°F+. Single layer on the baking sheet — at least 1 inch of space between pieces. Do not stir until the 20-minute mark. Flip once. Cook until deeply browned, not just cooked through.',
    stage:     2,
  },
};

// ── NEUROSCIENCE OF TASTE ───────────────────────────────────────────────────
// Based on published neuroscience and food science research.
// Key sources: Shepherd "Neurogastronomy" (2012); Volkow et al. on dopamine
// and food reward; Zampini & Spence (2004) on cross-modal flavor perception;
// Gordon Shepherd (Yale) on retronasal olfaction; gut-brain axis research.

export const NEURO_TASTE_FACTS = [
  {
    id:      'smell-is-flavor',
    title:   '80% of what you taste is actually smell',
    body:    "Your tongue detects only five basic qualities: salty, sweet, sour, bitter, and umami. Everything else — the difference between a strawberry and a raspberry, between basil and oregano — comes from smell. Specifically retronasal olfaction: aroma compounds that travel from your mouth up through the back of your throat to your olfactory receptors while you chew and swallow. This is why food tastes flat when you have a stuffy nose. The flavor 'lives' in the brain, not the tongue.",
    brain:   'Olfactory bulb → orbitofrontal cortex (flavor perception) → amygdala (emotional response)',
    applies: ['all'],
  },
  {
    id:      'dopamine-reward',
    title:   'High fat + high sugar is the dopamine jackpot',
    body:    "The mesolimbic pathway (the brain's reward circuit) evolved to motivate animals toward calorie-dense food for survival. The combination of fat and sugar triggers a dopamine spike in the nucleus accumbens that is disproportionately large — larger than either alone. This is why fast food, ice cream, and cookies are genuinely harder to stop eating than plain rice. The brain is not malfunctioning. It is working exactly as designed for an environment that no longer exists.",
    brain:   'VTA → nucleus accumbens (dopamine surge) → prefrontal cortex (decision override)',
    applies: ['rich', 'sweet'],
  },
  {
    id:      'ghrelin-anticipation',
    title:   'Hunger is learned — ghrelin spikes on your usual schedule',
    body:    "Ghrelin is the hormone that signals hunger. Critically, it does not just rise when you need food — it rises at your usual mealtimes even if you just ate. Your body learns when you normally eat and pre-emptively triggers appetite. If you skip a meal you normally eat, ghrelin will still spike at that time. This explains phantom hunger on intermittent fasting, and why eating at irregular times can feel harder than expected.",
    brain:   'Stomach → bloodstream → hypothalamus (ARC nucleus) → appetite signal',
    applies: ['all'],
  },
  {
    id:      'capsaicin-endorphin',
    title:   "Chili heat is pain — and the brain responds with endorphins",
    body:    "Capsaicin binds to TRPV1 receptors on your tongue — the same receptors that respond to actual heat above 43°C. Your brain receives a legitimate pain signal. The paradox is that the brain also releases endorphins and enkephalins (natural opioids) in response to that pain signal, creating a mild euphoric effect. Experienced chili eaters get the endorphin hit without overwhelming pain. This is why people become 'addicted' to spicy food — they are literally chasing the endorphin response.",
    brain:   'TRPV1 receptor → trigeminal nerve → brain stem → endorphin release (periaqueductal gray)',
    applies: ['spicy'],
  },
  {
    id:      'umami-satiety',
    title:   'Umami tells your brain protein has arrived — creating deep satisfaction',
    body:    "Umami is detected by T1R1+T1R3 receptor complexes specifically tuned to glutamate — the most abundant amino acid in protein. When these receptors fire, they send 'protein detected' signals to the hypothalamus, which responds by modulating satiety hormones (reducing ghrelin, nudging leptin). This is why a miso soup or a parmesan-rich pasta feels more satisfying than its calorie count would suggest. The brain is satisfied because the protein signal was strong, not just because calories were consumed.",
    brain:   'T1R1+T1R3 receptors → nucleus of the solitary tract → hypothalamus → satiety signals',
    applies: ['umami', 'savory'],
  },
  {
    id:      'crunch-amplifies',
    title:   'The sound of crunch makes food taste better',
    body:    "In a landmark 2004 Oxford study, Zampini and Spence gave participants Pringles while playing back altered sounds of the chip crunching through headphones. Chips paired with louder, higher-pitched crunch sounds were rated as significantly crisper and fresher — even when participants were eating the same exact chip. The brain uses auditory input as part of the flavor experience. Crunch activates more sensory brain regions simultaneously, increasing overall perceived pleasantness.",
    brain:   'Auditory cortex + somatosensory cortex + gustatory cortex → multisensory integration (superior temporal sulcus)',
    applies: ['crunchy', 'texture'],
  },
  {
    id:      'salt-stress',
    title:   'Salt cravings can signal elevated cortisol',
    body:    "The adrenal glands sit on top of your kidneys and regulate both the stress hormone cortisol and aldosterone (which controls sodium retention). Under chronic stress, elevated cortisol disrupts aldosterone signaling, causing the kidneys to excrete more sodium than usual. The brain compensates by increasing the palatability of salty foods — the reward signal from salt rises when you are sodium-depleted. A strong persistent salt craving, especially combined with fatigue, can be a signal of adrenal dysregulation.",
    brain:   'Adrenal axis → aldosterone → renal sodium sensing → nucleus accumbens (salt reward salience)',
    applies: ['salty'],
  },
  {
    id:      'sweet-serotonin',
    title:   'Sugar cravings are often the brain asking for serotonin',
    body:    "Serotonin — the neurotransmitter most associated with calm, contentment, and mood stability — is synthesized from tryptophan, an amino acid. Complex carbohydrates cause an insulin response that clears competing amino acids from the bloodstream, making it easier for tryptophan to cross the blood-brain barrier and convert to serotonin. The brain has learned this shortcut. When serotonin is low (stress, seasonal changes, poor sleep), the brain craves the carbohydrate that creates the conditions for serotonin synthesis. Chocolate adds mild MAO inhibition on top of this — blocking the enzyme that breaks down serotonin.",
    brain:   'Gut tryptophan → insulin release → blood-brain barrier → raphe nuclei serotonin synthesis',
    applies: ['sweet'],
  },
  {
    id:      'memory-flavor',
    title:   "A flavor can unlock a memory before the brain knows why",
    body:    "The olfactory bulb — which processes smell and therefore most of 'flavor' — has direct neural projections to the amygdala (emotional memory) and hippocampus (episodic memory). No other sensory system has this direct routing. All other senses pass through the thalamus first. This is why smell and flavor memories are so emotionally vivid and involuntary. A single aroma can trigger complete recall of a moment from 30 years ago before you have consciously identified the smell. Comfort food works partly through this pathway — the food re-activates the emotional memory of safety, warmth, or connection.",
    brain:   'Olfactory bulb → amygdala (direct) + hippocampus (direct) → emotional and episodic memory',
    applies: ['comfort', 'rich', 'all'],
  },
  {
    id:      'gut-brain-axis',
    title:   'Your gut bacteria influence what you crave',
    body:    "The gut-brain axis is a bidirectional communication highway via the vagal nerve. Gut bacteria produce signaling molecules — including short-chain fatty acids (butyrate, propionate), serotonin precursors (90% of the body's serotonin is made in the gut), and GABA. Certain bacterial strains (Lactobacillus, Bacteroides) have been shown to influence food preference in rodents and correlate with cravings in human observational studies. When microbiome diversity is low, this signaling pathway destabilizes — one mechanism thought to contribute to binge cravings.",
    brain:   'Gut microbiome → vagal nerve → nucleus of the solitary tract → hypothalamus + limbic system',
    applies: ['all'],
  },
];

// ── CRAVING ARCHETYPES ──────────────────────────────────────────────────────
// Each archetype describes a category of craving, its likely brain state,
// what the body may actually need, and how seasoning can meet that need.

export const CRAVING_ARCHETYPES = {
  rich: {
    id:          'rich',
    label:       'Rich & Comforting',
    emoji:       'RICH',
    keywords:    ['creamy','rich','heavy','comfort','mac','cheese','potato','cheesy','pasta','butter','filling','warm','cozy','heavy cream','thick'],
    brainState:  'Dopamine + serotonin seeking. Your brain may be in a low-reward or low-mood state. Cold weather, stress, or emotional fatigue all suppress dopamine and push the brain toward calorie-dense, familiar food.',
    bodyNeed:    'Tryptophan (serotonin precursor) + complex carbohydrates. The carbs help tryptophan cross the blood-brain barrier. Fat triggers the dopamine hit. Together they feel like a hug.',
    seasoningFocus: ['Foundation (salt) — season aggressively early', 'Depth builders (parmesan, miso, worcestershire) — umami amplifies satisfaction', 'Acid at the end — cuts the heaviness, prevents one-note richness'],
    layersToFocus:  [0, 3, 4],
    missingElementCategory: 'pasta',
    recipeDirection:  'lean into fat + starch combinations, umami depth, and finish with acid to prevent it feeling too heavy',
    recipes: [
      {
        title:          'Spicy Cajun Chicken Alfredo',
        totalTime:      28,
        description:    'Creamy pasta tossed with blackened chicken and a kick of heat. The acid from lemon at the end makes it taste less heavy than it looks.',
        ingredientsList: ['Chicken thighs', 'Heavy cream', 'Pappardelle pasta', 'Parmesan', 'Cajun seasoning', 'Lemon', 'Fresh parsley'],
        instructions: [
          'Dry brine chicken with Cajun spice + salt 30 minutes before cooking.',
          'Sear in a cast iron over high heat, 6 min per side. Rest and slice thin.',
          'In the same pan, add garlic (Stage 1). Add a tsp of tomato paste and bloom 60 seconds (Stage 3).',
          'Pour in heavy cream. Simmer and add parmesan. Toss with pasta + pasta water.',
          'Off heat: squeeze half a lemon over the pan (Stage 4). Top with parsley and flaky salt (Stage 5).',
        ],
        missingElement: 'pasta',
        flavorNotes:    'The lemon is not optional — without it the creaminess has no counterpoint and the dish feels one-dimensional.',
      },
      {
        title:          'Brown Butter Sage Gnocchi',
        totalTime:      22,
        description:    'Pan-fried gnocchi in nutty brown butter, wilted sage, and parmesan. 22 minutes from fridge to table.',
        ingredientsList: ['Store-bought gnocchi', 'Butter', 'Fresh sage', 'Parmesan', 'Lemon zest', 'Black pepper'],
        instructions: [
          'Boil gnocchi per package. Drain. Reserve ¼ cup pasta water.',
          'In a wide pan, melt butter over medium. Keep going until it smells nutty and turns amber (brown butter — Maillard on milk solids).',
          'Add sage leaves. They will crisp in about 30 seconds.',
          'Add gnocchi. Do not stir for 2 minutes — let a crust develop.',
          'Add pasta water. Toss with parmesan. Finish with lemon zest and pepper.',
        ],
        missingElement: 'pasta',
        flavorNotes:    'Brown butter takes an extra 3 minutes but converts flat dairy into 100+ new flavor compounds. It is the whole point.',
      },
    ],
  },

  salty: {
    id:         'salty',
    label:      'Salty & Crunchy',
    emoji:      'SALTY',
    keywords:   ['salty','crunchy','crispy','chips','crackers','pretzels','popcorn','pickle','fried','crisp','snack','peanut','nachos','salt'],
    brainState: 'Elevated cortisol (stress) or electrolyte depletion. The brain registers increased reward value for salt when sodium levels are low or when the adrenal system is taxed by stress. Crunchy textures additionally activate multisensory brain regions — the sound of crunch has been shown to increase perceived freshness and pleasantness.',
    bodyNeed:   'Sodium + potassium + magnesium — electrolyte replenishment. Ironically, if you feed this craving with pure junk salt, the body resets and craves more. Mineral-rich salt sources (miso, seaweed, olives) satisfy at lower volumes.',
    seasoningFocus: ['Umami over pure salt — satisfy at lower sodium', 'Textural contrast — the crunch is neurologically part of the flavor', 'Acid as a counterpoint — makes salt taste more intense without adding more'],
    layersToFocus:  [2, 3, 5],
    missingElementCategory: 'vegetables',
    recipeDirection:  'lean into textural contrast and umami-heavy seasoning rather than raw saltiness',
    recipes: [
      {
        title:          'Miso-Glazed Roasted Chickpeas + Greens Bowl',
        totalTime:      35,
        description:    'Crispy chickpeas in white miso glaze over wilted greens and rice. Hits the crunchy-umami craving without the crash.',
        ingredientsList: ['Canned chickpeas', 'White miso', 'Sesame oil', 'Soy sauce', 'Rice vinegar', 'Cooked rice', 'Any leafy green'],
        instructions: [
          'Drain, rinse, and aggressively dry chickpeas. Dry brine with salt 20 min (Stage 0).',
          'Roast at 425°F on a single layer sheet — do not crowd. 25 minutes until deeply crispy.',
          'Mix miso + soy + sesame oil + a splash of rice vinegar.',
          'Toss hot chickpeas in the glaze right out of the oven.',
          'Serve over rice and wilted greens. The contrast of crispy + soft + bright is the point.',
        ],
        missingElement: 'vegetables',
        flavorNotes:    'The miso provides glutamate satisfaction at half the sodium of straight salt. The vinegar makes it feel lighter.',
      },
      {
        title:          'Shoyu Popcorn with Nori',
        totalTime:      12,
        description:    'Stovetop popcorn finished with butter, soy sauce, and crumbled nori. Salty and crunchy but balanced with umami.',
        ingredientsList: ['Popcorn kernels', 'Neutral oil', 'Butter', 'Soy sauce', 'Nori sheets', 'Sesame seeds'],
        instructions: [
          'Pop corn in a pot with oil. Transfer immediately to a large bowl.',
          'Melt butter. Add ½ tsp soy sauce to the butter.',
          'Pour soy butter over popcorn while still hot. Toss quickly.',
          'Crumble nori over the top. Add sesame seeds.',
          'The nori adds oceanic umami that makes the saltiness feel more complete.',
        ],
        missingElement: 'vegetables',
        flavorNotes:    'Nori and soy share similar glutamate sources — doubling them makes the savory hit land harder without adding more salt.',
      },
    ],
  },

  sweet: {
    id:         'sweet',
    label:      'Sweet & Indulgent',
    emoji:      'SWEET',
    keywords:   ['sweet','chocolate','dessert','candy','caramel','sugar','cake','cookie','ice cream','brownie','sweet tooth','honey','vanilla','maple'],
    brainState: 'Low blood glucose, low serotonin, or emotional eating trigger. The brain craves the carbohydrate-tryptophan-serotonin pathway, or a fast glucose spike for acute cognitive energy. Chocolate specifically also provides phenylethylamine (PEA) and mild MAO-inhibition that together slow serotonin breakdown.',
    bodyNeed:   'Tryptophan access (complex carbs) or acute glucose (simple carbs). The question is which: emotional / mood-driven cravings respond better to a tryptophan-heavy sweet (dark chocolate + almonds, sweet potato). Energy-deficit cravings respond better to a fast-glucose source.',
    seasoningFocus: ['Salt amplifies sweetness — a pinch of flaky salt on a dessert reduces bitterness and makes it taste sweeter', 'Acid brightens sweet — lemon zest in baked goods does the same thing', 'Brown the butter — converts dairy into caramel-adjacent compounds'],
    layersToFocus:  [0, 5],
    missingElementCategory: 'bread',
    recipeDirection:  'add a contrasting layer (salt, acid, bitterness from cocoa) to prevent one-dimensional sweetness',
    recipes: [
      {
        title:          'Salted Dark Chocolate Oat Cookies',
        totalTime:      25,
        description:    'Chewy oat cookies with 70% dark chocolate and flaky salt. The salt and bitterness of the chocolate balances the sweetness — you stop after one or two instead of the whole batch.',
        ingredientsList: ['Rolled oats', 'Butter (browned)', 'Brown sugar', 'Egg', '70% dark chocolate', 'Vanilla', 'Flaky sea salt'],
        instructions: [
          'Brown the butter first (5 min): melt until nutty and amber-colored. Cool 5 minutes.',
          'Whisk brown butter + sugar + egg + vanilla until slightly fluffy.',
          'Mix in oats and chocolate chunks. Chill 10 minutes.',
          'Scoop and bake at 375°F for 11-13 min. Pull out while still soft-looking.',
          'Immediately add a pinch of flaky salt to each cookie while hot.',
        ],
        missingElement: 'bread',
        flavorNotes:    'Brown butter converts simple dairy fat into over 100 new Maillard compounds including diacetyl (butterscotch) and furans (nutty). It is the biggest single upgrade in this recipe.',
      },
      {
        title:          'Miso Caramel Sweet Potato',
        totalTime:      40,
        description:    'Roasted sweet potato with a white miso + honey glaze. The miso adds umami depth that makes it taste more complex than dessert.',
        ingredientsList: ['Sweet potatoes', 'White miso', 'Honey', 'Butter', 'Vanilla', 'Flaky salt', 'Toasted sesame'],
        instructions: [
          'Halve sweet potatoes. Brush cut side with oil. Roast cut-side down at 425°F for 25 min.',
          'Mix miso + honey + a splash of warm water until smooth.',
          'Flip potatoes. Brush with miso glaze. Return to oven 10 more minutes.',
          'Finish with a tiny knob of cold butter and flaky salt while hot.',
          'The miso prevents the sweetness from feeling cloying — it adds savory depth to a sweet dish.',
        ],
        missingElement: 'vegetables',
        flavorNotes:    'Miso and honey at a 1:2 ratio create a flavor that reads as both sweet and savory simultaneously — it engages more taste receptors at once.',
      },
    ],
  },

  spicy: {
    id:         'spicy',
    label:      'Spicy & Bold',
    emoji:      'SPICY',
    keywords:   ['spicy','hot','jalapeño','sriracha','fire','burn','chili','pepper','tabasco','habanero','buffalo','heat','kick'],
    brainState: 'Endorphin-seeking. Capsaicin binds TRPV1 (heat/pain receptors). The brain releases endorphins and enkephalins in response — natural opioids. Repeat spicy-food eaters have calibrated this: they get the endorphin high with diminished pain perception. If you are stressed, tired, or emotionally flat, this is one of the few food experiences that reliably produces a rapid mood shift.',
    bodyNeed:   'Endorphin stimulation. Spicy food can also promote circulation and trigger mild diaphoresis (sweating) which some people find physically relieving. Capsaicin also has mild anti-inflammatory properties at culinary doses.',
    seasoningFocus: ['Bloom dried chili in oil (Stage 2) for maximum impact', 'Fresh chili added at the end (Stage 5) gives heat without depth loss', 'Acid balances spice — lemon or lime brings heat into focus', 'Fat carries capsaicin compounds and moderates the burn'],
    layersToFocus:  [2, 4, 5],
    missingElementCategory: 'sauce',
    recipeDirection:  'layer heat at multiple stages for complexity: dried for depth, fresh for brightness, finishing oil for lingering warmth',
    recipes: [
      {
        title:          'Mapo Tofu',
        totalTime:      30,
        description:    'Silken tofu in a numbing, spicy, deeply savory sauce. Sichuan peppercorn creates the "mala" sensation — numbing and heat simultaneously. One of the most neurologically interesting dishes to eat.',
        ingredientsList: ['Silken tofu', 'Ground pork (or mushrooms)', 'Doubanjiang (chili bean paste)', 'Sichuan peppercorn', 'Garlic', 'Ginger', 'Soy sauce', 'Sesame oil', 'Cornstarch slurry', 'Green onion'],
        instructions: [
          'Toast Sichuan peppercorn in dry pan until fragrant. Grind coarsely. Set aside.',
          'Bloom doubanjiang in oil over medium heat, 2 minutes, until oil turns red (Stage 2).',
          'Add garlic and ginger (Stage 1 is technically here — but in Sichuan cooking, spice paste often leads).',
          'Add pork or mushrooms. Cook until done. Add soy sauce (Stage 3).',
          'Add cubed tofu gently. Add just enough water to simmer. Thicken with cornstarch slurry.',
          'Off heat: sesame oil drizzle. Plate and top with ground Sichuan pepper and green onion.',
        ],
        missingElement: 'sauce',
        flavorNotes:    'The doubanjiang is a fermented chili + soybean paste — umami and heat together. This is what makes mapo different from just "spicy." The Sichuan peppercorn creates actual neural disruption (tingling numbing) distinct from capsaicin heat.',
      },
    ],
  },

  fresh: {
    id:         'fresh',
    label:      'Fresh & Light',
    emoji:      'FRESH',
    keywords:   ['fresh','light','salad','clean','healthy','green','crisp','bright','raw','detox','citrus','herb','simple'],
    brainState: 'Micronutrient-seeking, possibly post-heavy-meal recalibration, or hedonic reset. After repeated dopamine spikes from rich food, the brain sometimes craves lower-stimulation inputs. Bright, acidic, crunchy fresh food creates a different sensory profile that feels like a contrast.',
    bodyNeed:   'Vitamin C, folate, magnesium, chlorophyll. Post-heavy-eating, the gut microbiome also signals for fiber-rich, lighter food via the vagal nerve.',
    seasoningFocus: ['Acid is your primary seasoning — citrus, good vinegar, even pickled elements', 'Fresh herbs are load-bearing in this style, not garnish', 'Salt should come last and lightly — these flavors are delicate', 'Texture contrast: creamy + crunchy within the same dish'],
    layersToFocus:  [4, 5],
    missingElementCategory: 'vegetables',
    recipeDirection:  'let acid and fresh herbs carry the flavor; resist the urge to add fat or salt beyond what the dish truly needs',
    recipes: [
      {
        title:          'Herb-Forward Grain Bowl',
        totalTime:      20,
        description:    'Farro or quinoa with cucumbers, cherry tomatoes, loads of fresh herbs, feta, and a bright lemon-tahini dressing. The herbs are not garnish here — they are a vegetable.',
        ingredientsList: ['Farro or quinoa (cooked)', 'Cucumber', 'Cherry tomatoes', 'Fresh mint', 'Fresh parsley', 'Fresh dill', 'Feta', 'Lemon', 'Tahini', 'Olive oil', 'Flaky salt'],
        instructions: [
          'Cook grain with a pinch of salt. Cool to room temperature.',
          'Chop herbs aggressively — you want at least 1 cup of mixed fresh herbs per 2 servings.',
          'Whisk lemon juice + tahini + a splash of water + a tiny pinch of salt until smooth.',
          'Combine grain, veg, and herbs. Dress right before eating — acid wilts herbs on contact.',
          'Top with feta, a drizzle of finishing olive oil, and flaky salt.',
        ],
        missingElement: 'vegetables',
        flavorNotes:    'The herbs at this volume are transformative — they are no longer background. Mint + parsley + dill together create a layered fresh profile that no single herb can.',
      },
    ],
  },

  umami: {
    id:         'umami',
    label:      'Umami & Savory Depth',
    emoji:      'UMAMI',
    keywords:   ['umami','savory','broth','ramen','miso','mushroom','soy','steak','meat','deep','rich umami','salty savory','parmesan','anchovy'],
    brainState: 'Protein-sensing hypothalamic signaling. Low amino acid availability in the blood triggers T1R1+T1R3 receptor upregulation — the umami receptors become more sensitive. Your brain is looking for the satisfaction signal that only glutamate-rich protein provides.',
    bodyNeed:   'Amino acids, particularly glutamate and cysteine. The umami craving is one of the more directly physiological food cravings — the body is quite specifically asking for protein and the compounds associated with cooked protein.',
    seasoningFocus: ['Layer glutamate sources — each one adds to the last: parmesan + soy + mushroom powder is exponentially better than any one alone', 'Long, slow heat develops glutamates in proteins — braise over roast', 'Acid sharpens the umami signal — a splash of soy + lime together is stronger than either alone'],
    layersToFocus:  [1, 3, 4],
    missingElementCategory: 'soup',
    recipeDirection:  'stack glutamate sources and use long cooking techniques to develop depth',
    recipes: [
      {
        title:          'Mushroom + Miso Ramen Broth',
        totalTime:      45,
        description:    'A deeply satisfying vegetarian broth built on dried mushroom, kombu, miso, and soy. Serves as a base for any ramen build.',
        ingredientsList: ['Dried shiitake mushrooms', 'Kombu (dried kelp)', 'White and red miso', 'Soy sauce', 'Mirin', 'Garlic', 'Ginger', 'Ramen noodles', 'Toppings of choice'],
        instructions: [
          'Cold-soak kombu + dried shiitake in 4 cups cold water for 30 min. This is a cold dashi — gentle extraction.',
          'Bring to 140°F (just below simmer) and hold for 20 minutes. Do not boil kombu — it goes bitter.',
          'Remove kombu. Bring to a simmer, add garlic and ginger (Stage 1).',
          'Whisk in miso (white for sweetness, red for depth) off heat — boiling destroys miso enzymes (Stage 3).',
          'Add soy and mirin. Taste. The goal: you should feel it in your chest, not just your tongue.',
        ],
        missingElement: 'soup',
        flavorNotes:    'Kombu + dried shiitake is the original MSG — both are loaded with glutamates and nucleotides (IMP, GMP) that synergistically amplify each other. Together they create umami 8× stronger than either alone.',
      },
    ],
  },

  warming: {
    id:         'warming',
    label:      'Warming & Spiced',
    emoji:      'WARMING',
    keywords:   ['warming','spiced','cinnamon','cloves','turmeric','curry','ginger','cardamom','chai','stew','braised','autumn','winter','comfort spice'],
    brainState: 'Circulatory self-regulation and anti-inflammatory signaling. Warming spices increase peripheral circulation (ginger, cinnamon, black pepper). Turmeric is a COX-2 inhibitor with published anti-inflammatory mechanisms. Cold environments, inflammation from overexertion, or seasonal immune cycling can all trigger warming-spice cravings.',
    bodyNeed:   'Circulation support, anti-inflammatory compounds (curcumin, gingerols, cinnamaldehyde), warmth from the inside.',
    seasoningFocus: ['Warming spices are almost exclusively fat-soluble — bloom them in fat, never water', 'Whole spices before ground spices: cardamom pods before cardamom powder', 'Black pepper with turmeric: piperine in black pepper increases curcumin bioavailability by 2000%', 'Fresh ginger and dried ginger taste different — use both for full spectrum'],
    layersToFocus:  [1, 2],
    missingElementCategory: 'curry',
    recipeDirection:  'build on fat-soluble spice blooming and use long simmer times to allow compounds to develop',
    recipes: [
      {
        title:          'Golden Turmeric Lentil Soup',
        totalTime:      40,
        description:    'Red lentil soup built on whole spice bloom, turmeric, ginger, and lemon. Anti-inflammatory, deeply warming, and satisfying.',
        ingredientsList: ['Red lentils', 'Ghee or coconut oil', 'Whole cumin seeds', 'Whole coriander', 'Turmeric powder', 'Fresh ginger (2-inch piece)', 'Garlic', 'Onion', 'Coconut milk', 'Lemon', 'Fresh cilantro'],
        instructions: [
          'Heat ghee until shimmering. Add whole cumin seeds + whole coriander seeds. Wait for sizzle (Stage 1).',
          'Add grated ginger + garlic. Cook 90 seconds.',
          'Add turmeric powder + black pepper (do not skip — pepper unlocks turmeric bioavailability). Bloom 60 seconds (Stage 2).',
          'Add onion. Cook until soft. Add lentils + 3 cups water or stock.',
          'Simmer 20 minutes until lentils dissolve. Add coconut milk. Blend half if desired.',
          'Off heat: lemon juice + salt to taste. Top with cilantro and a drizzle of raw ghee.',
        ],
        missingElement: 'curry',
        flavorNotes:    'The whole spice bloom in Stage 1 cannot be replaced by dried powder alone. Whole cumin seeds in hot fat create a completely different aromatic compound (pyrazines) than the same seeds ground and added to liquid.',
      },
    ],
  },
};

// ── CRAVING DECODER FUNCTION ────────────────────────────────────────────────

export function decodeCraving(text) {
  if (!text || text.trim().length < 2) return null;
  const lower = text.toLowerCase();

  let bestMatch = null;
  let bestScore = 0;

  for (const [key, archetype] of Object.entries(CRAVING_ARCHETYPES)) {
    const score = archetype.keywords.reduce(
      (acc, kw) => acc + (lower.includes(kw) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      bestMatch = archetype;
    }
  }

  // Fallback: if nothing matched, try to detect dominant sense words
  if (!bestMatch || bestScore === 0) {
    if (/spic|hot|chili|heat/i.test(text)) bestMatch = CRAVING_ARCHETYPES.spicy;
    else if (/sweet|choc|sugar|cake/i.test(text)) bestMatch = CRAVING_ARCHETYPES.sweet;
    else if (/salt|crunch|crisp/i.test(text)) bestMatch = CRAVING_ARCHETYPES.salty;
    else if (/fresh|light|salad|green/i.test(text)) bestMatch = CRAVING_ARCHETYPES.fresh;
    else bestMatch = CRAVING_ARCHETYPES.rich; // default: comforting
  }

  const missingEl  = MISSING_ELEMENTS[bestMatch.missingElementCategory] || MISSING_ELEMENTS.sauce;
  const neuroFacts = NEURO_TASTE_FACTS.filter(f =>
    f.applies.includes('all') || f.applies.some(a => bestMatch.id.includes(a))
  ).slice(0, 2);

  const seasoningGuide = SEASONING_LAYERS.filter(l =>
    bestMatch.layersToFocus.includes(l.stage)
  );

  return {
    archetype:    bestMatch,
    missingEl,
    neuroFacts,
    seasoningGuide,
    recipes:      bestMatch.recipes || [],
  };
}

// ── GET MISSING ELEMENT FOR A KNOWN DISH TYPE ────────────────────────────────

export function getMissingElement(dishType) {
  const key = (dishType || '').toLowerCase();
  for (const [k, v] of Object.entries(MISSING_ELEMENTS)) {
    if (key.includes(k)) return v;
  }
  return MISSING_ELEMENTS.sauce;
}

// ── GET SEASONING LAYERS FOR A DISH CATEGORY ────────────────────────────────
// Returns all 6 layers with optional dish-specific notes.

export function getSeasoningLayersForDish(category) {
  return SEASONING_LAYERS; // All 6 layers apply to every dish
}
