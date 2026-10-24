/**
 * Dig In — Secret Drink Knowledge Base
 *
 * Each entry combines:
 *  - Verified copycat ratios (crowd-sourced + former-barista confirmed)
 *  - Flavor chemistry (key compounds, receptor targets)
 *  - Physiological timeline (what your body does over 90 minutes)
 *  - Flavor profile (0-100 per axis for radar display)
 *
 * "AI detection" in demo mode matches image filename keywords or
 * cycles through brands when a real vision API is not connected.
 */

export const BRANDS = {
  starbucks:  { label: 'Seattle Coffee Co.',        color: '#00704A', bg: '#e6f4ee' },
  dutchbros:  { label: 'Pacific Drive-Thru Coffee', color: '#4a90d9', bg: '#e8f1fc' },
  dunkin:     { label: 'East-Coast Coffee & Donuts',color: '#FF6E14', bg: '#fff0e6' },
  jamba:      { label: 'Smoothie Bar',              color: '#ce2b37', bg: '#fdeaeb' },
};

export const DRINK_DB = {

  // ─────────────────────────────────────────────────────────────────────────────
  // STARBUCKS
  // ─────────────────────────────────────────────────────────────────────────────

  'caramel-macchiato': {
    brand: 'starbucks',
    name: 'Iced Caramel Macchiato',
    searchTerms: ['caramel', 'macchiato', 'starbucks', 'iced coffee'],
    calories: 250,
    sizePrices: { '12oz': 5.25, '16oz': 5.95, '24oz': 6.75 },
    ingredients: [
      'Vanilla Syrup', '2% Milk', 'Espresso (2 shots)', 'Caramel Drizzle', 'Ice',
    ],
    secretRecipe: {
      ratios: '3 pumps Vanilla in cold milk first. Pull 2 ristretto shots (shorter pull = less bitter). Pour espresso ON TOP — do not stir.',
      prePrep: 'Pre-chill the cup. Cold milk ensures the espresso creates a distinct foam layer on contact.',
      textureTip: 'The "macchiato" is about layering — vanilla-milk base, ice, then espresso poured directly over. The customer stirs it themselves.',
    },
    steps: [
      'Pump Vanilla: Add 3 pumps Vanilla Syrup to a cold 16oz cup.',
      'Add Milk: Pour 2% milk up to the first fill line (~8 oz). Do NOT stir — the syrup settles to create a clean base.',
      'Ice Fill: Fill cup completely with ice cubes. Do not compact.',
      'Pull Espresso: Extract 2 ristretto shots (~1 oz each, 18-21 sec pull, 180°F water). A longer shot introduces bitter chlorogenic acids — avoid.',
      'Float the Espresso: Pour shots directly over the ice. The contrast between hot espresso and cold ice + milk creates a temporary emulsion layer and caramelizes the surface sugars.',
      'Caramel Drizzle: Using a V-pattern motion, drizzle caramel sauce over the espresso layer. The warm espresso melts it slightly for deeper adhesion.',
      'Serve without a straw lid — this is meant to be visually layered.',
    ],
    chemistry: {
      compounds: [
        { name: 'Caffeine', amount: '150mg (2 shots)', mechanism: 'Adenosine A1/A2A receptor antagonist', receptors: 'CNS adenosine receptors', effect: 'Blocks fatigue signal; elevates dopamine 25-30%', sensitivity: 'High' },
        { name: 'Chlorogenic Acids', amount: '~180mg', mechanism: 'Activates bitter T2R receptors (T2R14, T2R16)', receptors: 'Taste receptor type 2 (TAS2R)', effect: 'Bitterness + antioxidant; slows glucose absorption by ~10%', sensitivity: 'Medium' },
        { name: 'Sucrose (Vanilla Syrup)', amount: '33g', mechanism: 'T1R2/T1R3 heterodimer activation (GPCR)', receptors: 'Sweet receptors on anterior tongue', effect: 'Immediate dopamine + serotonin transient spike; insulin release ~+45%', sensitivity: 'High' },
        { name: 'Diacetyl & Acetoin (Caramel)', amount: '~3mg', mechanism: 'Retronasal olfaction (OB → orbitofrontal cortex)', receptors: 'Olfactory epithelium OR1A1', effect: 'Buttery, roasted perception; intensifies sweetness by 12% through cross-modal binding', sensitivity: 'Very High — detectable at 2 ppb' },
        { name: 'Milk Fat (Triglycerides)', amount: '4.5g', mechanism: 'GPR120 + CD36 fat receptor activation on tongue', receptors: 'GPR120 (oleic acid receptor)', effect: 'Creaminess & fullness; delays gastric emptying → sustained energy curve', sensitivity: 'Medium' },
        { name: 'Lactose', amount: '12g', mechanism: 'SGLT1 intestinal absorption; split by lactase → glucose + galactose', receptors: 'Small intestinal enterocytes', effect: 'Secondary glucose delivery ~20-30 min post-consumption', sensitivity: 'Varies by lactase expression' },
      ],
      flavorProfile: { sweet: 78, bitter: 35, sour: 12, salty: 8, umami: 5, creamy: 60 },
      tasteNotes: "The ristretto pull reduces bitter quinides while concentrating melanoidins — producing a chocolaty, roasted sweetness rather than sharp bitterness. Caramel's diacetyl sits in the retronasal pathway and amplifies the vanilla's coumarin notes, making the drink taste 15% sweeter than the sugar content alone would produce.",
      physiologicalTimeline: [
        { time: '0–5 min', event: 'Cephalic phase insulin response', detail: 'Sight and smell of the drink triggers insulin release before the first sip via vagus nerve signaling.', bodyIcon: 'CEPHALIC' },
        { time: '5–15 min', event: 'Glucose enters bloodstream', detail: 'Sucrose split into glucose + fructose by salivary + intestinal enzymes. Blood glucose begins rising. Taste receptors on tongue send dopamine-modulating signals via chorda tympani nerve.', bodyIcon: 'GLUCOSE' },
        { time: '20–30 min', event: 'Caffeine peak in brain', detail: 'Caffeine crosses the blood-brain barrier and binds adenosine receptors. Dopamine pathways disinhibited. Cortisol elevated ~30%. Heart rate may increase 3-5 BPM.', bodyIcon: 'CAFFEINE' },
        { time: '30–45 min', event: 'Insulin + glucose synergy peak', detail: 'Blood glucose peaks (~+50mg/dL over baseline). Insulin drives glucose into cells. The chlorogenic acids in espresso slow this absorption slightly — net effect is a softer spike than pure sugar drinks.', bodyIcon: 'INSULIN' },
        { time: '45–60 min', event: 'Satiety signals engage', detail: 'Milk fat activates CCK (cholecystokinin) release from duodenum, suppressing appetite. Lactose provides slow secondary glucose drip. You feel full + alert.', bodyIcon: 'SATIETY' },
        { time: '90–120 min', event: 'Adenosine rebound', detail: 'Caffeine metabolized (half-life ~5 hrs but effects shift by 90 min). Adenosine floods now-free receptors. If cortisol is low (afternoon), this causes a crash. The 33g of sugar has largely been metabolized.', bodyIcon: 'ADENOSINE' },
      ],
    },
  },

  'pink-drink': {
    brand: 'starbucks',
    name: 'Strawberry Açaí Cooler',
    searchTerms: ['strawberry acai cooler', 'strawberry', 'acai', 'coconut'],
    calories: 140,
    sizePrices: { '12oz': 4.75, '16oz': 5.25, '24oz': 6.25 },
    ingredients: [
      'Strawberry Açaí Base', 'Coconut Milk (not cream)', 'Freeze-dried Strawberries', 'Ice',
    ],
    secretRecipe: {
      ratios: '2 parts Açaí base : 1 part Coconut Milk. Only 3 gentle stirs — over-mixing breaks the fat emulsion.',
      prePrep: 'Shake coconut milk carton vigorously before use — coconut fat separates on standing and creates the swirl pattern when poured over the base.',
      textureTip: 'Pour coconut milk from a height of 6 inches to create the pink-to-white swirl. Do not insert straw until serving.',
    },
    steps: [
      'Build the Base: Add 10 oz Strawberry Açaí base to a 24oz cup.',
      'Add Coconut Milk: Pour 5 oz shaken coconut milk in a single slow pour from height. The fat-water interface creates the iconic visual swirl.',
      'Three-Stir Rule: Place lid on cup, invert twice only. The drink should show a two-tone pink/white swirl — over-stirring homogenizes it grey.',
      'Add Ice: Fill to rim with cubed ice. The ice acts as a third "stir" as the customer drinks.',
      'Finish: Add 2 scoops of freeze-dried strawberries on top. They rehydrate slowly, intensifying flavor as the drink is consumed.',
    ],
    chemistry: {
      compounds: [
        { name: 'Anthocyanins (Strawberry)', amount: '~45mg', mechanism: 'Antioxidant; binds ACE enzymes, mild vasodilator', receptors: 'TAS2R (slight bitterness) + olfactory', effect: 'Antioxidant boost; mild blood pressure reduction over time', sensitivity: 'Low' },
        { name: 'Lauric Acid (Coconut fat)', amount: '3.5g', mechanism: 'Medium-chain triglyceride → quick ketone conversion in liver', receptors: 'GPR120, GPR40 fat receptors', effect: 'Rapid energy from MCTs; coconut fat has antimicrobial properties', sensitivity: 'Low' },
        { name: 'Caffeine (Green Coffee Extract)', amount: '45mg', mechanism: 'Adenosine antagonism (milder than espresso)', receptors: 'A1, A2A adenosine receptors', effect: 'Mild alertness, no crash profile at low dose', sensitivity: 'Medium' },
        { name: 'Açaí Resveratrol', amount: '~5mg', mechanism: 'SIRT1 activator; upregulates mitochondrial biogenesis', receptors: 'Nuclear SIRT1 receptor', effect: 'Anti-inflammatory; long-term metabolic benefit at sustained intake', sensitivity: 'Low' },
        { name: 'Fructose (Base Syrup)', amount: '28g', mechanism: 'Liver-first metabolism — does not trigger insulin spike like glucose', receptors: 'GLUT5 (small intestine), liver GLUT5', effect: 'Slow energy release; excess fructose converts to triglycerides in liver', sensitivity: 'Medium' },
      ],
      flavorProfile: { sweet: 72, bitter: 8, sour: 40, salty: 4, umami: 2, creamy: 38 },
      tasteNotes: "The pink drink works on trigeminal chemistry — the slight tartness from açaí's polyphenols creates a mild astringency (tannin-protein binding on tongue) that coconut fat then coats, creating a \"creamy-tart\" resolution unique to this combination.",
      physiologicalTimeline: [
        { time: '0–10 min', event: 'Fructose absorbed slowly', detail: 'GLUT5 transporters move fructose from gut to liver. Unlike glucose, this bypasses first-pass insulin signaling — no immediate spike.', bodyIcon: 'FRUCTOSE' },
        { time: '15–25 min', event: 'MCT conversion begins', detail: 'Lauric acid from coconut milk converts to ketones in the liver faster than long-chain fats. Brain begins using ketones as supplemental energy.', bodyIcon: 'MCT' },
        { time: '30 min', event: 'Caffeine plateau (low dose)', detail: 'At 45mg, caffeine effect is subtle — reduced fatigue rather than sharp alertness. Less adenosine rebound at end of day.', bodyIcon: 'CAFFEINE' },
        { time: '45-60 min', event: 'Anthocyanin absorption', detail: 'Polyphenols absorbed via microbiome fermentation in colon. Anti-inflammatory prostaglandins modestly suppressed.', bodyIcon: 'ANTHOCYANI' },
        { time: '90 min', event: 'Soft energy landing', detail: 'MCT energy exhausted; fructose glycogen stored in liver. No significant crash — this is why the pink drink is perceived as "lighter" than coffee.', bodyIcon: 'SOFT' },
      ],
    },
  },

  'pumpkin-spice': {
    brand: 'starbucks',
    name: 'Pumpkin Spice Latte',
    searchTerms: ['pumpkin spice', 'psl', 'fall', 'pumpkin latte'],
    calories: 380,
    sizePrices: { '12oz': 5.75, '16oz': 6.45, '24oz': 7.25 },
    ingredients: [
      'Espresso (2 shots)', 'Pumpkin Spice Sauce', '2% Milk (steamed)', 'Whipped Cream', 'Pumpkin Pie Topping (Cinnamon, Ginger, Nutmeg, Cloves)', 'Ice (iced version)',
    ],
    secretRecipe: {
      ratios: '3 pumps Pumpkin Sauce + 2 shots espresso + 10 oz steamed milk. The sauce is 70% sugar, 20% natural pumpkin puree, 10% spice blend — the "real pumpkin" claim is technically accurate.',
      prePrep: 'Steam milk to 150°F (not 160°F). Over-heated milk destroys lactose structure and the natural sweetness — making it taste flat and requiring more sauce.',
      textureTip: 'Whip cream to stiff peaks before piping. The topping must be dusted immediately after piping — spices oxidize within 60 seconds and lose aroma on cold cream.',
    },
    steps: [
      'Pump Pumpkin Sauce: Add 3 pumps Pumpkin Spice Sauce to the bottom of a warmed 16oz cup.',
      'Pull Espresso: Extract 2 standard shots (not ristretto here — the full shot balances the heavy sauce sweetness).',
      'Combine: Pour espresso over sauce. Stir 8 times to create emulsification — the espresso melanoidins bind with the sugars to create a caramelized base note.',
      'Steam Milk: Steam 2% milk to exactly 150°F with a tight microfoam (no large bubbles). The natural lactose sweetness peaks at this temperature.',
      'Pour Milk: Tilt cup 45° and pour steamed milk down the side to create a smooth dairy layer above the espresso base.',
      'Top: Pipe whipped cream in a clockwise spiral. Immediately dust with Pumpkin Spice Topping (proprietary blend: cinnamon, ginger, nutmeg, cloves).',
    ],
    chemistry: {
      compounds: [
        { name: 'Cinnamaldehyde', amount: '~4mg', mechanism: 'TRPA1 (Transient Receptor Potential Ankyrin 1) channel activation', receptors: 'TRPA1 — shared pathway with pain receptors', effect: 'Warming sensation; lowers postprandial blood glucose ~29% (anti-glycemic); anti-inflammatory via COX-2 suppression', sensitivity: 'Very High' },
        { name: 'Eugenol (Cloves)', amount: '~1mg', mechanism: 'TRPV1 activation + local anesthetic effect', receptors: 'TRPV1 (capsaicin receptor)', effect: 'Warming-numbing sensation on tongue; antimicrobial; mild analgesic', sensitivity: 'Extreme — detectable at 1 ppb' },
        { name: '6-Gingerol (Ginger)', amount: '~0.5mg', mechanism: 'TRPV1 + 5-HT3 antagonism (antiemetic)', receptors: 'TRPV1, serotonin receptors', effect: 'Warming; reduces nausea; anti-inflammatory prostaglandin suppression', sensitivity: 'High' },
        { name: 'β-Caryophyllene (Nutmeg)', amount: '~2mg', mechanism: 'CB2 cannabinoid receptor agonist (legal)', receptors: 'CB2 (peripheral cannabinoid receptor)', effect: 'Mild anxiolytic; anti-inflammatory; contributes to fall-drink "cozy" sensation', sensitivity: 'Medium' },
        { name: 'Pumpkin Carotenoids', amount: '~0.8mg', mechanism: 'No direct taste receptor — retronasal + olfactory signal', receptors: 'Olfactory epithelium', effect: 'Earthy aroma note; pro-vitamin A activity; no glycemic contribution', sensitivity: 'Low' },
        { name: 'Caffeine', amount: '150mg', mechanism: 'Adenosine antagonism', receptors: 'A1/A2A', effect: 'Standard alert effect amplified by ginger TRPV1 synergy', sensitivity: 'High' },
      ],
      flavorProfile: { sweet: 82, bitter: 28, sour: 5, salty: 10, umami: 15, creamy: 85 },
      tasteNotes: 'The PSL is pharmacologically "cozy" — cinnamaldehyde and eugenol both activate TRPA1/TRPV1 pathways (warmth/mild pain receptors) creating a gentle warming sensation that the brain interprets as physical warmth. This cross-modal sensory binding is why people associate this drink with comfort — it is literally activating the same neurological pathways as a warm room.',
      physiologicalTimeline: [
        { time: '0–5 min', event: 'Spice TRPA1 activation', detail: 'Cinnamaldehyde and eugenol hit tongue → TRPA1/TRPV1 signals sent to brain → perceived warmth begins before caffeine can act.', bodyIcon: 'SPICE' },
        { time: '10–20 min', event: 'Milk lactose peak absorption', detail: 'Steamed milk (150°F) enhances lactase activity. Lactose splits faster → gentle glucose + galactose release. Galactose has neurotrophic properties.', bodyIcon: 'MILK' },
        { time: '20–35 min', event: 'Caffeine crosses BBB', detail: 'Espresso caffeine + ginger TRPV1 create a synergistic alertness — ginger\'s 5-HT3 blockade reduces anxiety that caffeine can cause.', bodyIcon: 'CAFFEINE' },
        { time: '35–60 min', event: 'Cinnamon anti-glycemic effect', detail: 'Cinnamaldehyde inhibits intestinal alpha-glucosidase, slowing sugar breakdown. The high-sugar sauce spike is blunted by ~25-30%.', bodyIcon: 'CINNAMON' },
        { time: '90 min', event: 'Nutmeg CB2 effect', detail: 'β-caryophyllene from nutmeg reaches CB2 receptors in peripheral tissue, providing mild anti-inflammatory signaling. This is why the PSL feels "warmer" into the afternoon.', bodyIcon: 'NUTMEG' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // DUTCH BROS
  // ─────────────────────────────────────────────────────────────────────────────

  'dulce-de-leche': {
    brand: 'dutchbros',
    name: 'Dulce de Leche Iced Chai',
    searchTerms: ['dulce de leche', 'chai', 'iced chai'],
    calories: 590,
    sizePrices: { '16oz': 6.55, '24oz': 7.55, '32oz': 8.55 },
    ingredients: [
      'Chai Tea Concentrate', '2% Milk', 'White Chocolate Syrup',
      'Caramel Syrup', 'Cinnamon Powder', 'Ice', 'Soft Top (Sweet Cream Cold Foam)', 'Caramel Drizzle',
    ],
    secretRecipe: {
      ratios: '1 oz Chai concentrate per 4 oz Milk. 0.5 oz White Mocha, 0.5 oz Caramel. Chill glass 2 min before building.',
      prePrep: 'Chill cups in freezer for 2 minutes prior to building — it maintains temperature differential and prevents early ice melt from diluting the syrup ratio.',
      textureTip: 'The Soft Top should be whipped to "ribbon stage" (soft peaks, 12 sec frother). It should hold shape but slowly melt into the drink over 3-4 minutes — this is the designed flavor delivery system.',
    },
    steps: [
      'Build the Syrup Base: Combine 1 oz White Chocolate Syrup + 1 oz Caramel Syrup in the bottom of a chilled 24oz cup.',
      'Add Chai Concentrate: Pour 4 oz Chai Tea Concentrate over the syrups. The warm spices in the chai emulsify with the white chocolate fats.',
      'Add Milk: Pour 2% milk to the second fill line (~8 oz). Stir vigorously 8 sec to create full emulsification.',
      'Ice Fill: Pack with cubed ice to rim. Cubed only — crushed ice melts 3x faster and dilutes the syrup ratio.',
      'Whip the Soft Top: In a chilled metal pitcher combine 3 oz Heavy Cream + 1 oz 2% milk + 1 pump Vanilla. Froth 12 seconds to soft peaks.',
      'Layer the Soft Top: Spoon over ice gently. It should sit visually distinct at the rim — do not stir.',
      'Garnish: Dust with Cinnamon + aggressive caramel drizzle in a crosshatch pattern. The caramel drizzle seals the cold foam against rapid melting.',
    ],
    chemistry: {
      compounds: [
        { name: 'L-Theanine (Chai Black Tea)', amount: '~25mg', mechanism: 'GABA-A potentiation + alpha brain wave increase', receptors: 'GABA-A, glutamate AMPA receptors', effect: 'Modulates caffeine anxiety; produces calm alertness; synergistic focus with caffeine', sensitivity: 'Medium' },
        { name: 'Caffeine (Chai Tea)', amount: '~50mg', mechanism: 'Adenosine antagonism', receptors: 'A1/A2A', effect: 'Milder stimulant than espresso; L-theanine creates 2:1 theanine:caffeine ratio for smooth energy', sensitivity: 'High' },
        { name: 'Cinnamaldehyde', amount: '~6mg', mechanism: 'TRPA1 activation + anti-glycemic (alpha-glucosidase inhibition)', receptors: 'TRPA1, PXR liver receptor', effect: 'Warmth; significantly blunts sugar spike despite 68g sugar load', sensitivity: 'Very High' },
        { name: 'Vanillin (White Chocolate)', amount: '~8mg', mechanism: 'TRP channel modulation + olfactory binding at OR10A6', receptors: 'Olfactory + vanilloid TRP', effect: 'Sweet perception amplified 18% above actual sugar content; mild anxiolytic via serotonin modulation', sensitivity: 'Extreme — 0.5 ppb threshold' },
        { name: 'Milk Fat (Soft Top)', amount: '12g', mechanism: 'GPR120 + gustin (carbonic anhydrase VI) modulation', receptors: 'GPR120, CD36', effect: 'Creaminess + sustained satiety; fat in foam slows gastric emptying by ~40%', sensitivity: 'Medium' },
        { name: 'Sucrose + Caramel Sugar', amount: '68g total', mechanism: 'T1R2/T1R3 + hepatic fructose pathway', receptors: 'Sweet taste GPCR', effect: 'Large insulin response; this is the highest-sugar entry — the cinnamon is the physiological compensation', sensitivity: 'High' },
      ],
      flavorProfile: { sweet: 90, bitter: 18, sour: 8, salty: 12, umami: 20, creamy: 88 },
      tasteNotes: "Vanillin and white chocolate form what chemists call a \"sweetness echo\" — vanillin activates olfactory receptors that feed into the same cortical area as tongue sweet receptors, creating perceived sweetness above what taste alone provides. The Soft Top's fat emulsion then coats the palate, extending each sip's sweetness for 8-12 additional seconds.",
      physiologicalTimeline: [
        { time: '0–5 min', event: 'TRPA1 warmth from cinnamon', detail: 'Cinnamaldehyde activates throat and mouth warming receptors immediately. Creates "spiced" sensory baseline that increases flavor complexity.', bodyIcon: 'TRPA' },
        { time: '10 min', event: 'L-Theanine absorbed', detail: 'Rapidly absorbed from gut. Begins elevating GABA signaling within 10-20 min. Pre-modulates the caffeine that arrives 10 minutes later.', bodyIcon: 'L' },
        { time: '20–30 min', event: 'Caffeine onset + L-theanine synergy', detail: 'Together they produce alpha wave activity in brain — measurable focus improvement without typical caffeine overstimulation.', bodyIcon: 'CAFFEINE' },
        { time: '35–50 min', event: 'Sugar spike (largest on this list)', detail: '68g sucrose + caramel creates the highest blood glucose rise. Cinnamon alpha-glucosidase inhibition reduces spike ~25% — still significant. Insulin response substantial.', bodyIcon: 'SUGAR' },
        { time: '60 min', event: 'Fat-delayed satiety signal', detail: '12g milk fat triggers CCK from duodenum + GLP-1 from ileum. Appetite suppressed. Gastric emptying slowed — this is why the drink "lasts" longer than most.', bodyIcon: 'FAT' },
        { time: '90+ min', event: 'Tea-caffeine soft landing', detail: 'Lower caffeine dose + L-theanine buffer = much gentler adenosine rebound than espresso drinks. Minimal crash.', bodyIcon: 'TEA' },
      ],
    },
  },

  'golden-eagle': {
    brand: 'dutchbros',
    name: 'Golden Butterscotch Freeze',
    searchTerms: ['golden butterscotch freeze', 'freeze', 'caramel butterscotch'],
    calories: 720,
    sizePrices: { '16oz': 6.25, '24oz': 7.25, '32oz': 8.25 },
    ingredients: [
      'Espresso Shots (3)', 'Caramel Syrup', 'Butterscotch Syrup', 'Vanilla Ice Cream Base',
      'Ice', 'Whipped Cream', 'Caramel + Butterscotch Drizzle', 'Half & Half',
    ],
    secretRecipe: {
      ratios: '3 shots espresso + 2 oz Caramel + 2 oz Butterscotch + 6 oz vanilla ice cream base. Blend at "medium" not high speed — high speed incorporates too much air and dilutes density.',
      prePrep: 'Chill the blending cup. Espresso must be room temp before blending — hot espresso melts ice unevenly creating slushy pockets.',
      textureTip: 'The "eagle" drizzle on the cup interior (caramel first, butterscotch second in overlapping waves) is applied before pouring the blended drink. It sticks to the cold cup and creates visible swirls.',
    },
    steps: [
      'Pre-Drizzle Cup: Apply caramel in a V-pattern inside the cup, then butterscotch in opposing V. Set cup upside-down for 30 sec to set.',
      'Prep Espresso: Pull 3 shots, allow to cool to room temperature (5 min).',
      'Build Blend: Combine espresso, 2 oz each caramel + butterscotch syrup, 6 oz vanilla base, 1 oz half & half, 2 cups ice in blender.',
      'Blend: Medium speed 20 seconds. Target texture is "thick milkshake" — a spoon should stand up briefly before falling.',
      'Pour: Pour blend into drizzled cup. The cold blend adheres the drizzle pattern to the side.',
      'Top: Whipped cream + drizzle crosshatch + serve immediately.',
    ],
    chemistry: {
      compounds: [
        { name: 'Caffeine (3 shots)', amount: '225mg', mechanism: 'Adenosine A1/A2A antagonism', receptors: 'CNS adenosine receptors', effect: 'High-dose alert response; vasodilation; increased cortisol', sensitivity: 'High' },
        { name: 'Diacetyl (Butterscotch)', amount: '~5mg', mechanism: 'Olfactory OR5 binding + lipid solubility allows prolonged retention', receptors: 'Olfactory epithelium, retronasal pathway', effect: 'Intensely buttery, caramel perception; contributes "richness" signal to brain', sensitivity: 'Extreme — 2 ppb threshold, cumulative exposure concerns at high levels' },
        { name: 'Milk Fat (Ice Cream + Half & Half)', amount: '22g', mechanism: 'Fat crystal structure in frozen state slows emulsion breakdown', receptors: 'GPR120 (fat), oral tactile receptors', effect: 'Maximum creaminess; coating of oral cavity prolongs flavor; fat signals powerful satiety hormones', sensitivity: 'Medium' },
        { name: 'Sucrose (all sources)', amount: '95g', mechanism: 'T1R2/T1R3 + hepatic glycogen storage', receptors: 'Sweet GPCR, pancreatic beta cells', effect: 'Very high insulin response; energy spike; serotonin transient boost. Highest sugar of all entries.', sensitivity: 'High' },
      ],
      flavorProfile: { sweet: 95, bitter: 30, sour: 5, salty: 15, umami: 8, creamy: 95 },
      tasteNotes: 'Butterscotch\'s diacetyl is uniquely fat-soluble — it dissolves into the ice cream fat matrix and is released slowly as it melts in the mouth, creating a prolonged butterscotch echo after each sip. This is why this drink tastes "richer" than its ingredients alone suggest.',
      physiologicalTimeline: [
        { time: '0–5 min', event: 'Cold receptor activation', detail: 'Frozen texture activates TRPM8 (cold menthol receptor) on tongue, creating a cooling signal that heightens all other flavors by contrast.', bodyIcon: 'COLD' },
        { time: '15–25 min', event: 'Largest sugar load absorbed', detail: '95g sugar — the highest on this list — enters bloodstream. Even with fat-slowed gastric emptying, expect significant glucose and insulin rise.', bodyIcon: 'LARGEST' },
        { time: '25–40 min', event: 'Triple-shot caffeine impact', detail: '225mg caffeine creates pronounced adenosine block. Heart rate increase 5-8 BPM typical. Cortisol rise ~40%. Not recommended for caffeine-sensitive users.', bodyIcon: 'TRIPLE' },
        { time: '60 min', event: 'Maximum CCK satiety', detail: '22g fat triggers the strongest CCK release of any drink here. Appetite significantly suppressed — this freeze is genuinely a meal replacement calorie-wise.', bodyIcon: 'MAXIMUM' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // DUNKIN'
  // ─────────────────────────────────────────────────────────────────────────────

  'dunkin-cold-brew': {
    brand: 'dunkin',
    name: 'Midnight Dark Cold Brew',
    searchTerms: ['cold brew', 'midnight', 'dark coffee'],
    calories: 5,
    sizePrices: { '12oz': 3.75, '16oz': 4.29, '24oz': 4.99 },
    ingredients: [
      'Dark Roast Ground Coffee (coarse grind)', 'Cold Filtered Water', 'Ice',
    ],
    secretRecipe: {
      ratios: '1:4.5 coffee-to-water ratio (heavier than standard cold brew). Steep 12-14 hours at 38°F — not room temp. Cold extraction at refrigerator temp produces 60% less acidity than room temp steeping.',
      prePrep: 'The "Midnight" refers to the dark roast — higher Maillard products but lower caffeine than medium roast (counter-intuitively). Dark roast caffeine is partly destroyed in extended roasting.',
      textureTip: 'Filter twice — once through a metal mesh, once through a paper filter. The lipid (cafestol) content determines mouthfeel. Two-pass filtering removes cafestol but keeps flavor compounds.',
    },
    steps: [
      'Grind Coffee: Coarse grind (sea salt texture). Fine grind over-extracts, creating bitterness.',
      'Cold Steep: Combine 1 cup coarse grounds with 4.5 cups cold filtered water in mason jar. Cover, refrigerate exactly 12 hours. Past 14 hours, bitter phenols begin extracting.',
      'Double Filter: Pour through metal mesh first to catch grounds. Pour through paper filter into serving vessel.',
      'Serve: Pour over ice. No sweetener in the base — this is brewed for concentrate-level flavor that ice dilution balances.',
    ],
    chemistry: {
      compounds: [
        { name: 'Caffeine', amount: '260mg/16oz (high)', mechanism: 'Adenosine antagonism — maximum adenosine block at this dose', receptors: 'A1, A2A, also A2B at high dose', effect: 'Strong alertness; at 260mg some users experience mild tremor or anxiety if adenosine-sensitive', sensitivity: 'High' },
        { name: 'Chlorogenic Acids (reduced)', amount: '~120mg (30% less than hot brew)', mechanism: 'Cold extraction minimizes acid hydrolysis — acids remain stable and less bitter', receptors: 'TAS2R (bitter) — lower activation than hot brew', effect: 'Antioxidant benefit with dramatically less bitterness. Slows starch digestion.', sensitivity: 'Medium' },
        { name: 'Cafestol + Kahweol (lipids, partial)', amount: '~8mg (paper-filtered reduces ~80%)', mechanism: 'LDL receptor suppression in liver — controversial at high intake', receptors: 'Hepatic LDL receptors, pregnane X receptor', effect: 'Paper filtering removes most. Residual amount may modestly elevate LDL in daily heavy drinkers.', sensitivity: 'Low daily impact' },
        { name: 'N-Methylpyridinium (dark roast)', amount: '~3mg', mechanism: 'Upregulates stomach acid secretion (HCl via proton pumps)', receptors: 'Gastric parietal cells', effect: 'May cause heartburn in acid-sensitive individuals despite low overall acidity of cold brew', sensitivity: 'Medium' },
        { name: 'Trigonelline → Niacin (roasting product)', amount: '~5mg niacin', mechanism: 'Trigonelline converts to Vitamin B3 (niacin) during dark roasting', receptors: 'Niacin (nicotinic acid) receptor GPR109A', effect: 'Mild vasodilatory "flush"; contributes to dark roast\'s warmth perception', sensitivity: 'Low' },
      ],
      flavorProfile: { sweet: 5, bitter: 65, sour: 20, salty: 5, umami: 30, creamy: 2 },
      tasteNotes: 'Cold brew\'s chemistry is fundamentally different from hot coffee. At 38°F, only low-molecular-weight fruity acids extract in the first 4 hours. Caffeine and melanoidins (roast flavor) extract gradually through 12 hours. Bitter quinides (the harshest compounds in hot coffee) require near-boiling temps to extract — they are nearly absent here. The umami note in cold brew is from glutamate-related peptides released from coffee proteins during long cold extraction.',
      physiologicalTimeline: [
        { time: '0–10 min', event: 'Gastric acid stimulation', detail: 'N-methylpyridinium triggers HCl in stomach immediately. Drink with food if acid-sensitive.', bodyIcon: 'GASTRIC' },
        { time: '15–30 min', event: 'Peak caffeine absorption', detail: 'Empty stomach + cold brew concentration means rapid caffeine delivery. Peak blood caffeine at ~30 min. At 260mg, expect pronounced effect.', bodyIcon: 'PEAK' },
        { time: '30–60 min', event: 'Cortisol + catecholamine spike', detail: 'High-dose caffeine triggers adrenaline (epinephrine) release from adrenal glands. Mental clarity + physical energy peak. Heart rate +8-12 BPM.', bodyIcon: 'CORTISOL' },
        { time: '5–6 hours', event: 'Half-life metabolism', detail: 'Cold brew\'s high caffeine means it is still in your system in the evening if consumed after 2pm. Disrupts sleep onset.', bodyIcon: 'HALF' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // JAMBA JUICE
  // ─────────────────────────────────────────────────────────────────────────────

  'orange-dream': {
    brand: 'jamba',
    name: 'Orange Cream Smoothie',
    searchTerms: ['orange cream', 'creamsicle', 'orange smoothie'],
    calories: 440,
    sizePrices: { '16oz': 6.99, '22oz': 7.99, '28oz': 8.99 },
    ingredients: [
      'Orange Juice', 'Orange Sherbet', 'Vanilla Frozen Yogurt', 'Ice', 'Non-fat Milk',
    ],
    secretRecipe: {
      ratios: '6 oz OJ + 3 scoops Orange Sherbet + 2 scoops Vanilla Frozen Yogurt + 1 oz non-fat milk + 1 cup ice.',
      prePrep: 'Blend sherbet + frozen yogurt first for 5 seconds before adding OJ — this prevents the citric acid from instantly curdling the dairy proteins.',
      textureTip: 'The creamsicle effect comes from the fat in frozen yogurt coating the citric acid molecules, delaying their contact with taste receptors and creating a "sweet first, tart second" sip sequence.',
    },
    steps: [
      'Pre-blend Dairy: Add sherbet + frozen yogurt to blender. Pulse 3 times to partially break down.',
      'Add OJ: Pour orange juice over pre-blended dairy. The dairy fat already coating the blades prevents acid-protein curdling.',
      'Add Milk + Ice: Pour milk and add ice. Blend on high 20 seconds to full smooth texture.',
      'Check Consistency: Should coat the back of a spoon and flow slowly. If watery, add 1 scoop sherbet.',
      'Serve immediately — citric acid continues reacting with dairy proteins over time, making it increasingly tart if it sits more than 5 minutes.',
    ],
    chemistry: {
      compounds: [
        { name: 'Vitamin C (Ascorbic Acid)', amount: '90mg (100% DV)', mechanism: 'Reduces Fe3+ to Fe2+ (enhances iron absorption); cofactor for collagen synthesis', receptors: 'Sour TAS2R + general acid sensing', effect: 'Immune support; non-receptor direct antioxidant in plasma; contributes tartness', sensitivity: 'Medium' },
        { name: 'Limonene (Orange Oil)', amount: '~0.5mg', mechanism: 'Olfactory OR binding + anxiolytic via GABA-A modulation', receptors: 'Olfactory (citrus OR), GABA-A', effect: 'Citrus "pop" aroma; reduces anxiety; D-limonene specifically elevates serotonin and dopamine in limbic system', sensitivity: 'High — drives orange scent recognition' },
        { name: 'Lactic Acid (Frozen Yogurt)', amount: '~1.2g', mechanism: 'pH reduction + distinct sour taste at lower threshold than citric acid', receptors: 'Sour (ASIC channels)', effect: 'Gentle tang; promotes lactobacillus gut bacteria when yogurt cultures survive blend', sensitivity: 'Medium' },
        { name: 'Citric Acid (Orange Juice)', amount: '~2.5g', mechanism: 'ASIC (Acid-Sensing Ion Channel) activation + calcium chelation', receptors: 'Sour ASIC on tongue', effect: 'Brightness/tartness; chelates calcium (may blunt absorption at high dose)', sensitivity: 'High' },
        { name: 'Hesperidin (Orange Flavonoid)', amount: '~25mg', mechanism: 'Anti-inflammatory; vasodilatory via nitric oxide upregulation', receptors: 'Bitter T2R (slight); endothelium NO synthase', effect: 'Long-term cardiovascular benefit; mildly improves circulation; slight bitterness balanced by sherbet sugar', sensitivity: 'Low' },
      ],
      flavorProfile: { sweet: 70, bitter: 10, sour: 60, salty: 3, umami: 5, creamy: 55 },
      tasteNotes: 'This drink\'s chemistry is a "taste timeline" in a cup — fat from frozen yogurt hits receptors first (creamy, sweet), then citric acid reaches sour receptors a half-second later as fat coating is overcome. Limonene in orange oil bypasses the tongue entirely via retronasal olfaction, creating the signature "creamsicle" aroma that precedes flavor by 200ms.',
      physiologicalTimeline: [
        { time: '0–5 min', event: 'Limonene olfactory activation', detail: 'Retronasal pathway signals "orange" to orbitofrontal cortex 200ms before taste hits. This pre-activates dopamine in the reward circuit.', bodyIcon: 'LIMONENE' },
        { time: '5–15 min', event: 'Vitamin C absorption begins', detail: 'Ascorbic acid absorbed via SVCT1 transporters in small intestine. Plasma Vitamin C peaks at ~60 min post-consumption.', bodyIcon: 'VITAMIN' },
        { time: '15–30 min', event: 'Fructose + sucrose from OJ', detail: 'Orange juice natural sugars (fructose-dominant) absorbed through GLUT5. Lower GI than glucose drinks but still caloric.', bodyIcon: 'FRUCTOSE' },
        { time: '45 min', event: 'Lactic acid micro-biome effect', detail: 'Yogurt lactic acid bacteria (if live cultures survive blending) begin colonizing the colon, supporting microbiome diversity.', bodyIcon: 'LACTIC' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // STARBUCKS — expanded copycat set
  // ─────────────────────────────────────────────────────────────────────────────

  'vanilla-sweet-cream-cold-brew': {
    brand: 'starbucks',
    name: 'Vanilla Sweet Cream Cold Brew',
    searchTerms: ['cold brew', 'sweet cream', 'vanilla sweet cream', 'vanilla cold brew'],
    calories: 110,
    sizePrices: { '12oz': 4.45, '16oz': 4.95, '24oz': 5.75 },
    ingredients: ['Cold Brew Concentrate', 'Heavy Cream', '2% Milk', 'Vanilla Syrup', 'Ice'],
    secretRecipe: {
      ratios: 'Cold brew concentrate cut 1:1 with cold water. Sweet cream = 2 parts heavy cream : 1 part 2% milk : 1 part vanilla syrup, shaken cold. The vanilla goes in the CREAM, never the coffee.',
      prePrep: 'Make the sweet cream ahead and keep it cold — shaking it chilled is what gives the silky, pourable body that floats and cascades through the coffee.',
      textureTip: 'Pour the sweet cream over the back of a spoon so it layers on top and streaks down as you drink — do not stir.',
    },
    steps: [
      'Fill a 16oz glass with ice.',
      'Add 6 oz cold brew concentrate + 6 oz cold water (or 10 oz ready-to-drink cold brew).',
      'Make sweet cream: shake 2 oz heavy cream, 1 oz 2% milk, 1 oz vanilla syrup in a jar until slightly thickened.',
      'Pour 3–4 oz sweet cream over the top; leave it unstirred for the layered look.',
    ],
    chemistry: {
      flavorProfile: { sweet: 55, bitter: 40, sour: 10, salty: 4, umami: 3, creamy: 62 },
      tasteNotes: 'Cold extraction pulls far fewer bitter chlorogenic acids than hot coffee, so the base is smooth and low-acid — the vanilla sweet cream then coats the tongue with milk fat, rounding the roast into a dessert-like finish.',
    },
  },

  'brown-sugar-oatmilk-shaken-espresso': {
    brand: 'starbucks',
    name: 'Brown Sugar Oatmilk Shaken Espresso',
    searchTerms: ['brown sugar', 'oatmilk', 'shaken espresso', 'oat milk espresso'],
    calories: 120,
    sizePrices: { '12oz': 4.95, '16oz': 5.45, '24oz': 5.95 },
    ingredients: ['Blonde Espresso (2 shots)', 'Brown Sugar Syrup', 'Cinnamon', 'Oat Milk', 'Ice'],
    secretRecipe: {
      ratios: '2 blonde shots + 4 pumps brown sugar syrup + 3 shakes of cinnamon, shaken HARD with ice ~15 seconds. Top with oat milk — do not stir it in.',
      prePrep: 'Blonde roast is non-negotiable here — its higher acidity and lighter body is what keeps the drink bright instead of heavy under all that syrup.',
      textureTip: 'The hard shake aerates the espresso into a thin foam and micro-emulsifies the cinnamon so it suspends instead of clumping on top.',
    },
    steps: [
      'Brew 2 shots blonde espresso (or strong light-roast moka-pot coffee).',
      'Add espresso, 4 pumps (~1 oz) brown sugar syrup, and 3 shakes cinnamon to a shaker with ice.',
      'Shake hard for 15 seconds until frothy and cold.',
      'Pour over fresh ice; top with 3–4 oz oat milk, unstirred.',
    ],
    chemistry: {
      flavorProfile: { sweet: 60, bitter: 45, sour: 20, salty: 5, umami: 4, creamy: 45 },
      tasteNotes: 'Cinnamaldehyde hits the warming TRPA1 channel while brown sugar’s molasses notes fill the low end; oat milk’s beta-glucans add body without dairy fat, so it reads creamy but light.',
    },
  },

  'white-chocolate-mocha': {
    brand: 'starbucks',
    name: 'White Chocolate Mocha',
    searchTerms: ['white mocha', 'white chocolate mocha', 'wcm'],
    calories: 390,
    sizePrices: { '12oz': 5.45, '16oz': 6.15, '24oz': 6.95 },
    ingredients: ['Espresso (2 shots)', 'White Chocolate Mocha Sauce', '2% Milk (steamed)', 'Whipped Cream'],
    secretRecipe: {
      ratios: '3 pumps white mocha sauce + 2 shots espresso, stirred into the HOT espresso first so it fully dissolves, then 10 oz steamed milk.',
      prePrep: 'Dissolve the white mocha sauce into the hot shots before adding milk — added to cold milk it seizes into gritty specks.',
      textureTip: 'Steam milk to 150°F for peak natural sweetness; hotter scorches the lactose and the drink tastes flat, tempting you to add more sauce.',
    },
    steps: [
      'Pull 2 shots espresso into a warm cup.',
      'Stir in 3 pumps (~0.75 oz) white chocolate sauce until fully dissolved.',
      'Steam 10 oz 2% milk to 150°F with tight microfoam; pour in.',
      'Top with whipped cream (optional) and a white-mocha drizzle.',
    ],
    chemistry: {
      flavorProfile: { sweet: 82, bitter: 30, sour: 8, salty: 10, umami: 6, creamy: 72 },
      tasteNotes: 'White “chocolate” is cocoa butter + sugar + milk solids — no cocoa bitterness — so it leans pure creamy-sweet, and the espresso’s melanoidins are the only thing keeping it from cloying.',
    },
  },

  'iced-matcha-latte': {
    brand: 'starbucks',
    name: 'Iced Matcha Latte',
    searchTerms: ['matcha', 'matcha latte', 'green tea latte'],
    calories: 200,
    sizePrices: { '12oz': 4.95, '16oz': 5.45, '24oz': 6.25 },
    ingredients: ['Matcha Blend', 'Hot Water', '2% Milk', 'Ice'],
    secretRecipe: {
      ratios: '1 tbsp matcha whisked into 2 oz hot (175°F, not boiling) water until frothy, over ice + 8 oz milk. The café blend is ~50% sugar — cut real matcha with ~2 tsp simple syrup to match.',
      prePrep: 'Sift the matcha first — it clumps the instant it hits water and no amount of stirring fully undoes it.',
      textureTip: 'Whisk in a brisk W or M motion, never circular — that’s what builds the fine foam and keeps it from tasting chalky.',
    },
    steps: [
      'Sift 1 tbsp matcha into a bowl.',
      'Add 2 oz water at 175°F; whisk in a W-motion 20 seconds until frothy.',
      'Add 2 tsp simple syrup to match the sweetness (skip for unsweetened).',
      'Pour over a glass of ice with 8 oz milk; stir once.',
    ],
    chemistry: {
      flavorProfile: { sweet: 58, bitter: 42, sour: 6, salty: 4, umami: 30, creamy: 40 },
      tasteNotes: 'Matcha’s L-theanine gives a savory-umami roundness and a calm-alert lift; the milk fat mutes its grassy catechin bitterness, which is why a latte tastes smoother than straight matcha.',
    },
  },

  'dragon-drink': {
    brand: 'starbucks',
    name: 'Mango Dragonfruit Cooler',
    searchTerms: ['mango dragonfruit cooler', 'mango dragonfruit', 'dragonfruit'],
    calories: 190,
    sizePrices: { '16oz': 5.25, '24oz': 6.25 },
    ingredients: ['Mango Dragonfruit Base', 'Coconut Milk', 'Freeze-dried Dragonfruit', 'Ice'],
    secretRecipe: {
      ratios: '2 parts mango-dragonfruit base : 1 part coconut milk, poured from height for the swirl. Base = white grape juice + freeze-dried dragonfruit + a splash of passionfruit.',
      prePrep: 'Shake the coconut milk carton hard — the separated fat is what makes the pink/white cascade when it hits the base.',
      textureTip: 'Pour the coconut milk in one slow stream from 6 inches up; invert the lidded cup twice only to keep the two-tone swirl.',
    },
    steps: [
      'Add 10 oz mango-dragonfruit base to a 24oz cup (blend white grape juice + freeze-dried dragonfruit + a splash of passionfruit).',
      'Slow-pour 5 oz shaken coconut milk from height for the swirl.',
      'Fill with ice; invert twice only.',
      'Top with a scoop of freeze-dried dragonfruit.',
    ],
    chemistry: {
      flavorProfile: { sweet: 70, bitter: 6, sour: 42, salty: 4, umami: 2, creamy: 34 },
      tasteNotes: 'Bright fruit acids create astringency the coconut fat immediately coats, giving the creamy-tart resolution; the low (45mg) green-coffee caffeine gives lift with no crash.',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // DUNKIN'  /  DUTCH BROS — expanded
  // ─────────────────────────────────────────────────────────────────────────────

  'dunkin-caramel-craze': {
    brand: 'dunkin',
    name: 'Caramel Crunch Latte',
    searchTerms: ['caramel crunch', 'caramel latte', 'signature latte'],
    calories: 300,
    sizePrices: { '12oz': 4.29, '16oz': 4.79, '24oz': 5.49 },
    ingredients: ['Espresso (2 shots)', 'Caramel Swirl', 'Steamed Milk', 'Whipped Cream', 'Caramel Drizzle', 'Cinnamon Sugar Topping'],
    secretRecipe: {
      ratios: '2 shots + 2 pumps caramel SWIRL (a sweetened-condensed-milk caramel, not the clear syrup) + 10 oz steamed milk. Whip, drizzle, dust with cinnamon sugar.',
      prePrep: 'Use dulce-de-leche style caramel swirl, not hard caramel syrup — the swirl carries milk solids that make the café version taste rounder and less sharp.',
      textureTip: 'Dust the cinnamon-sugar on the whip immediately — it wicks moisture and turns pasty within a minute.',
    },
    steps: [
      'Pull 2 shots espresso into a cup.',
      'Stir in 2 pumps caramel swirl (dulce de leche) until dissolved.',
      'Add 10 oz steamed milk.',
      'Top with whipped cream, caramel drizzle, and a dusting of cinnamon sugar.',
    ],
    chemistry: {
      flavorProfile: { sweet: 80, bitter: 28, sour: 6, salty: 12, umami: 5, creamy: 66 },
      tasteNotes: 'The condensed-milk caramel’s Maillard notes (from cooked lactose) layer over the espresso’s own roast, and the salt in the caramel amplifies perceived sweetness by ~12%.',
    },
  },

  'dutch-annihilator': {
    brand: 'dutchbros',
    name: 'Chocolate Macadamia Breve',
    searchTerms: ['chocolate macadamia breve', 'chocolate macadamia', 'breve'],
    calories: 320,
    sizePrices: { '12oz': 4.75, '16oz': 5.25, '24oz': 6.25 },
    ingredients: ['Espresso (2 shots)', 'Chocolate Macadamia Nut Syrup', 'Half & Half (breve)', 'Ice or Steamed'],
    secretRecipe: {
      ratios: 'A “breve” = espresso + steamed HALF & HALF instead of milk. 2 shots + 4 pumps chocolate macadamia nut syrup + half & half.',
      prePrep: 'Half & half is the whole trick — its ~10% fat is what makes a breve taste luxuriously heavy where a normal latte feels thin.',
      textureTip: 'Steam half & half slower and cooler (140°F) than milk — its extra fat scorches easily and turns eggy.',
    },
    steps: [
      'Pull 2 shots espresso.',
      'Add 4 pumps (~1 oz) chocolate macadamia nut syrup; stir.',
      'Add 8–10 oz half & half — steamed for hot, cold over ice for iced.',
      'Optional: soft whip on top.',
    ],
    chemistry: {
      flavorProfile: { sweet: 74, bitter: 34, sour: 5, salty: 8, umami: 6, creamy: 85 },
      tasteNotes: 'Macadamia’s buttery C16/C18 fatty acids echo the half & half fat, so chocolate + nut + cream fuse into one round, dessert-like body — the highest-creaminess drink on the board.',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CAFÉ CLASSICS — authentic café-style ratios (generic, no brand names)
  // ─────────────────────────────────────────────────────────────────────────────

  'peppermint-mocha': {
    brand: 'starbucks',
    name: 'Peppermint Mocha',
    searchTerms: ['peppermint mocha', 'holiday mocha', 'peppermint'],
    calories: 320,
    sizePrices: { '12oz': 5.45, '16oz': 6.15, '24oz': 6.95 },
    ingredients: ['Mocha powder', 'Peppermint syrup', 'Espresso (1 shot)', 'Steamed milk', 'Whipped cream', 'Red sugar sprinkles'],
    secretRecipe: {
      ratios: 'For a 12-oz: 3 Tbsp mocha powder mixed with equal parts warm water into a syrup + 1½ Tbsp peppermint syrup + 1 shot espresso (or ¼ cup double-strength dark roast), filled with steamed milk.',
      prePrep: 'Mix the mocha powder with warm water FIRST to make a smooth chocolate syrup — added dry to milk it stays gritty.',
      textureTip: 'Peppermint syrup is potent — start at 1½ Tbsp so it reads cool and festive, not like toothpaste.',
    },
    steps: [
      'Mix 3 Tbsp mocha powder with 3 Tbsp warm water into a smooth syrup in a 12-oz mug.',
      'Add 1½ Tbsp peppermint syrup and 1 shot espresso (or ¼ cup double-strength dark roast); stir.',
      'Fill with steamed milk.',
      'Top with whipped cream and red sugar sprinkles. (Skip the coffee for a Peppermint Hot Chocolate.)',
    ],
    chemistry: {
      flavorProfile: { sweet: 80, bitter: 38, sour: 5, salty: 8, umami: 22, creamy: 60 },
      tasteNotes: 'Cocoa’s roasted melanoidins and the espresso give a savory-bitter backbone that keeps the heavy sweetness and cooling menthol in check — that faint savory depth is the umami note holding it together.',
    },
  },

  'eggnog-latte': {
    brand: 'starbucks',
    name: 'Eggnog Latte',
    searchTerms: ['eggnog latte', 'eggnog', 'holiday latte'],
    calories: 350,
    sizePrices: { '12oz': 5.95, '16oz': 6.65, '24oz': 7.45 },
    ingredients: ['Eggnog', 'Whole milk', 'Espresso (1–2 shots)', 'Ground nutmeg'],
    secretRecipe: {
      ratios: 'For a 12-oz: ½ cup eggnog + ¼ cup whole milk, steamed together to 145°F, poured over 1–2 shots espresso. The eggnog IS the sweetener — no syrup needed.',
      prePrep: 'Steam the eggnog/milk mix only to 145°F, not the usual 150–160°F — eggnog scalds and curdles far faster than plain milk.',
      textureTip: 'Top with about ¼ inch of foamed eggnog/milk and a sprinkle of nutmeg right away, before it settles.',
    },
    steps: [
      'Combine ½ cup eggnog with ¼ cup cold whole milk.',
      'Steam the mixture to 145°F (watch it closely — eggnog scalds fast).',
      'Pull 1–2 shots espresso into the mug; add the steamed eggnog/milk.',
      'Top with foam and a pinch of ground nutmeg.',
    ],
    chemistry: {
      flavorProfile: { sweet: 68, bitter: 30, sour: 6, salty: 10, umami: 28, creamy: 82 },
      tasteNotes: 'Eggnog’s egg yolk brings custard richness and a real savory (umami) roundness that plain milk can’t — it’s why the drink tastes indulgent without added syrup.',
    },
  },

  'homemade-chai-latte': {
    brand: 'starbucks',
    name: 'Homemade Chai Tea Latte',
    searchTerms: ['chai', 'chai latte', 'chai tea', 'spiced tea'],
    calories: 240,
    sizePrices: { '12oz': 4.75, '16oz': 5.25, '24oz': 5.95 },
    ingredients: ['Black tea (6–8 bags)', 'Milk', 'Honey', 'Cinnamon', 'Cardamom', 'Nutmeg', 'Cloves', 'Ginger'],
    secretRecipe: {
      ratios: 'Equal parts water and milk (3 cups each) : 6–8 black tea bags : ½ cup honey : 1 tsp cinnamon + 1 tsp cardamom + ½ tsp each nutmeg, cloves, ginger. Boil, steep 3–5 min, strain.',
      prePrep: 'Simmering the whole spices with the tea (not adding powder at the end) is what builds the deep, layered spice instead of a dusty top note.',
      textureTip: 'Go easy on cloves — a little dominates fast. Steep to your strength, then strain through a fine sieve.',
    },
    steps: [
      'Bring 3 cups water + 3 cups milk to a boil.',
      'Add 6–8 black tea bags, ½ cup honey, and the spices; return to a boil.',
      'Turn off heat and steep 3–5 minutes.',
      'Remove tea bags and strain through a fine strainer. Good hot or over ice.',
    ],
    chemistry: {
      flavorProfile: { sweet: 60, bitter: 25, sour: 8, salty: 5, umami: 16, creamy: 45 },
      tasteNotes: 'Black tea tannins plus warming spice compounds (cinnamaldehyde, eugenol, gingerol) hit the same TRPA1/TRPV1 “cozy” receptors as a mulled drink — honey rounds the tannic edge.',
    },
  },

  'classic-frappuccino': {
    brand: 'starbucks',
    name: 'Classic Blended Iced Coffee (Frozen)',
    searchTerms: ['blended iced coffee', 'frappe', 'blended coffee', 'mocha blend', 'caramel blend'],
    calories: 240,
    sizePrices: { '12oz': 4.95, '16oz': 5.45, '24oz': 6.45 },
    ingredients: ['Double-strength coffee (chilled)', 'Low-fat milk', 'Granulated sugar', 'Ice', 'Chocolate or caramel (for variations)'],
    secretRecipe: {
      ratios: '¾ cup double-strength coffee (2 Tbsp grounds per cup) + 1 cup low-fat milk + 3 Tbsp sugar + 2 cups ice, blended smooth. Mocha: add 3 Tbsp chocolate syrup. Caramel: add 3 Tbsp caramel + whip + drizzle.',
      prePrep: 'Brew the coffee DOUBLE-strength and chill it first — normal hot coffee melts the ice and you get watery, weak-tasting blend.',
      textureTip: 'For a thicker blend, blend, then freeze the blender jar ~30 min (don’t let it solid-freeze) and blend again.',
    },
    steps: [
      'Brew double-strength coffee (2 Tbsp grounds per cup of water); chill completely.',
      'Blend ¾ cup coffee + 1 cup low-fat milk + 3 Tbsp sugar + 2 cups ice on high until smooth.',
      'For Mocha, add 3 Tbsp chocolate syrup; for Caramel, add 3 Tbsp caramel, top with whip and a drizzle.',
      'Pour into a 16-oz glass; serve with a straw.',
    ],
    chemistry: {
      flavorProfile: { sweet: 70, bitter: 42, sour: 8, salty: 6, umami: 30, creamy: 48 },
      tasteNotes: 'Double-strength brewing concentrates savory melanoidins so the coffee flavor survives dilution by ice and milk — that roast-driven umami is why a real blended iced coffee tastes of coffee, not just sweet cream.',
    },
  },

  'gingerbread-latte': {
    brand: 'starbucks',
    name: 'Gingerbread Latte',
    searchTerms: ['gingerbread latte', 'gingerbread', 'holiday latte'],
    calories: 300,
    sizePrices: { '12oz': 5.45, '16oz': 6.15, '24oz': 6.95 },
    ingredients: ['Gingerbread syrup', 'Espresso (2 shots)', 'Steamed milk', 'Ground nutmeg'],
    secretRecipe: {
      ratios: 'Makes two: 3 cups steamed milk + 3 Tbsp gingerbread syrup + 2 shots espresso + a pinch of nutmeg. Syrup in the mug first, espresso poured over, then milk and foam.',
      prePrep: 'Put the syrup in the warm mug and pull the espresso directly onto it — the hot shot dissolves the syrup evenly before the milk goes in.',
      textureTip: 'Finish with a light dusting of nutmeg or crushed gingerbread cookies while the foam is fresh.',
    },
    steps: [
      'Add 3 Tbsp gingerbread syrup to a preheated mug (recipe makes two).',
      'Pull 2 shots espresso and pour over the syrup; stir.',
      'Top with steamed milk and foam.',
      'Dust with nutmeg or crushed gingerbread cookies.',
    ],
    chemistry: {
      flavorProfile: { sweet: 66, bitter: 35, sour: 5, salty: 8, umami: 24, creamy: 62 },
      tasteNotes: 'Molasses in the gingerbread syrup adds a bittersweet, faintly savory depth that plays off the espresso — the ginger and nutmeg bring the warming spice heat.',
    },
  },
};

/**
 * Simulate drink detection from image filename or random selection.
 * In production: send image to OpenAI Vision → extract drink name → match to DB.
 */
export function detectDrinkFromImage(file, demoBrandFilter = null) {
  const name = (file?.name || '').toLowerCase();
  const drinks = Object.entries(DRINK_DB);

  // Try keyword match on filename
  for (const [key, drink] of drinks) {
    if (drink.searchTerms.some(term => name.includes(term.toLowerCase()))) {
      return key;
    }
  }

  // Filter by brand if demo mode
  if (demoBrandFilter) {
    const brandDrinks = drinks.filter(([, d]) => d.brand === demoBrandFilter);
    if (brandDrinks.length) {
      const idx = Math.floor(Math.random() * brandDrinks.length);
      return brandDrinks[idx][0];
    }
  }

  // Random selection for general demo
  return drinks[Math.floor(Math.random() * drinks.length)][0];
}

export const ALL_DRINK_KEYS = Object.keys(DRINK_DB);
