/* restaurantCopycats.js — reverse-engineered restaurant & fast-food dishes.

   Each entry is a full taste-factor deconstruction (see lib/tasteEngine):
   - tasteFactors: 0–100 on the eight savory levers (salt/fat/acid/sweet/umami/
     heat/maillard/crunch) — the shape the copy has to match.
   - signatureHooks: the one or two things that make it taste like THAT brand.
     Miss these and it's just "a burger"; nail them and it's the burger.
   - the real copycat recipe + `theSecret` + `nailIt` self-test.
   - storePrice / homeCost drive the same savings math the drinks use.

   Copycat ratios are widely-documented home reproductions, not proprietary
   recipes — the point is technique, not a leaked binder. */

const S = (brand, tint, label) => ({ brand, tint, brandLabel: label });

export const FOOD_COPYCATS = [
  {
    id: 'innout-double-double',
    ...S('westcoast', '#c8102e', 'West-Coast Stand'),
    name: 'Double Cheeseburger + Spread',
    category: 'Burger',
    storePrice: 5.65, homeCost: 2.60, servingsNote: 'per burger',
    cult: 'A cult of simplicity — four ingredients done perfectly, an unchanged menu since 1948, and the spread.',
    tasteFactors: { salt: 65, fat: 82, acid: 45, sweet: 42, umami: 72, heat: 8, maillard: 78, crunch: 55 },
    signatureHooks: [
      { factor: 'umami', secret: 'Mustard-grill the patties', why: 'Spread a thin layer of yellow mustard on the raw patty and lay THAT side down on the flat-top. It fries into a tangy, deeply savory crust you cannot get any other way.' },
      { factor: 'sweet', secret: 'The spread is Thousand-Island, tuned', why: 'Mayo + ketchup + sweet pickle relish + a pinch of sugar and a splash of white vinegar. The relish + sugar is the flavor people can’t place.' },
      { factor: 'maillard', secret: 'Toast the bun on the griddle in the beef fat', why: 'A real toasted, slightly greasy interior bun face is half the experience.' },
    ],
    ingredients: [
      '2 thin 2-oz beef patties (smashed)', 'Yellow mustard (to grill)', '2 slices American cheese',
      'Soft white bun', 'Spread: 2 tbsp mayo + 1 tbsp ketchup + 1 tbsp sweet relish + ¼ tsp sugar + splash vinegar',
      'Hand-leaf iceberg lettuce', 'Tomato', 'Grilled or raw onion',
    ],
    method: [
      'Mix the spread; toast the bun faces on the griddle until golden.',
      'Smash the patties thin on a screaming-hot flat-top; salt.',
      'Brush the top of each raw patty with a thin layer of mustard, then flip so the mustard side sears ~1 min.',
      'Cheese each patty, stack the two together.',
      'Build: bun, spread, lettuce, tomato, double patty, onion, bun.',
    ],
    theSecret: 'Mustard-grilling the patty. It’s the single move that separates a copy from a “that’s literally it.”',
    nailIt: ['If it tastes like a plain burger, you skipped the mustard-grill.', 'Spread should read sweet-tangy, not just like ketchup — check the relish and sugar.'],
  },
  {
    id: 'chickfila-sandwich',
    ...S('southern-chx', '#e51636', 'Southern Chicken Co.'),
    name: 'Fried Chicken Sandwich',
    category: 'Fried chicken',
    storePrice: 5.29, homeCost: 1.95, servingsNote: 'per sandwich',
    cult: 'The gold standard of fast-food chicken — juicy, subtly sweet, always the same, closed on Sundays so you crave it more.',
    tasteFactors: { salt: 70, fat: 62, acid: 55, sweet: 45, umami: 60, heat: 6, maillard: 60, crunch: 78 },
    signatureHooks: [
      { factor: 'acid', secret: 'Brine the chicken in dill pickle juice', why: 'A full hour (or overnight) in pickle brine seasons the meat all the way through and gives that faint, unmistakable tang. This is THE secret.' },
      { factor: 'sweet', secret: 'Powdered sugar in the breading', why: 'A couple tablespoons of powdered sugar in the flour dredge browns faster and adds the subtle sweetness people can’t identify.' },
      { factor: 'crunch', secret: 'Fry in peanut oil; toast a buttered bun', why: 'Peanut oil is the house flavor; the buttered, griddled bun + exactly two pickles complete it.' },
    ],
    ingredients: [
      'Boneless chicken breast, pounded even', 'Dill pickle juice (to brine)', '1 egg + ¼ cup milk',
      'Flour + 2 tbsp powdered sugar + salt + pepper + paprika', 'Peanut oil for frying',
      'Buttered, toasted bun', '2 dill pickle chips',
    ],
    method: [
      'Brine chicken in pickle juice ≥1 hr (overnight is better).',
      'Dip in egg-milk wash, then the sweetened seasoned flour; press hard for craggy bits.',
      'Fry at 350°F ~4 min until deep golden and 165°F inside.',
      'Butter and griddle the bun; build with 2 pickles.',
    ],
    theSecret: 'Pickle-brine + powdered sugar in the dredge. Tang from within, sweetness you can’t place.',
    nailIt: ['Not tangy enough? Brine longer — the flavor is inside the meat, not on it.', 'Pale and bland crust? Add the powdered sugar; it’s doing the browning.'],
  },
  {
    id: 'mcdonalds-fries',
    ...S('retro', '#c8862e', 'Drive-Thru Classic'),
    name: 'Golden Shoestring Fries',
    category: 'Fries',
    storePrice: 3.19, homeCost: 0.70, servingsNote: 'per medium',
    cult: 'The most consistent fry on earth and the one everyone secretly rates all others against.',
    tasteFactors: { salt: 75, fat: 70, acid: 12, sweet: 25, umami: 58, heat: 0, maillard: 80, crunch: 85 },
    signatureHooks: [
      { factor: 'umami', secret: 'A little beef flavor in the fry oil', why: 'The original fries were cooked in beef tallow — the “natural beef flavor” is still there. At home: fry in a few spoonfuls of beef tallow, or add a pinch of beef bouillon to the oil.' },
      { factor: 'maillard', secret: 'Sugar-water soak + double fry', why: 'Soak the cut potatoes in warm water with a teaspoon of sugar (dextrose) for even golden color, then blanch low (300°F) and crisp high (375°F).' },
      { factor: 'crunch', secret: 'A quick vinegar-water par-boil', why: 'Boiling briefly in acidulated water sets the exterior so it crisps hard while the inside stays fluffy.' },
    ],
    ingredients: [
      'Russet potatoes, cut ¼" batons', '1 tsp sugar (for the soak)', '1 tbsp vinegar (for the par-boil)',
      'Beef tallow or neutral oil + ¼ tsp beef bouillon', 'Fine salt',
    ],
    method: [
      'Par-boil cut fries 4 min in water with the vinegar; drain and dry.',
      'Soak 15 min in warm sugar-water; dry very well.',
      'Blanch at 300°F 4 min; rest. Then fry at 375°F until golden and crisp.',
      'Salt the instant they come out.',
    ],
    theSecret: 'Beef fat/bouillon in the oil + double fry. Flavor from the fat, crunch from the two-temperature fry.',
    nailIt: ['Tastes like a plain fry? You’re missing the beef note in the oil.', 'Soft or bendy? Dry them harder and don’t skip the low-then-high double fry.'],
  },
  {
    id: 'chipotle-barbacoa-bowl',
    ...S('fast-casual-mex', '#a81612', 'Fast-Casual Mexican'),
    name: 'Barbacoa Burrito Bowl',
    category: 'Bowl',
    storePrice: 11.20, homeCost: 3.40, servingsNote: 'per bowl (batch is cheaper)',
    cult: 'Build-your-own consistency at scale — the cilantro-lime rice and smoky barbacoa are the anchors.',
    tasteFactors: { salt: 62, fat: 55, acid: 68, sweet: 30, umami: 70, heat: 40, maillard: 55, crunch: 45 },
    signatureHooks: [
      { factor: 'acid', secret: 'Finish the rice with lime + cilantro OFF the heat', why: 'Cook the rice with a bay leaf, then fold in fresh lime juice and chopped cilantro after it’s done. Added during cooking the brightness cooks off.' },
      { factor: 'umami', secret: 'Barbacoa = chipotle in adobo + a clove note', why: 'Braise the beef with chipotles in adobo, cumin, oregano, a couple of whole cloves and lime. The faint clove is the “what is that” background note.' },
    ],
    ingredients: [
      'Chuck roast', 'Chipotles in adobo', 'Cumin, oregano, 2 whole cloves, bay leaf', 'Lime', 'Garlic',
      'White rice', 'Fresh cilantro', 'Black beans', 'Fajita peppers/onions', 'Toppings: pico, cheese, lettuce',
    ],
    method: [
      'Blend chipotles, garlic, cumin, oregano, cloves, lime and salt; braise chuck 3–4 hrs until it shreds.',
      'Cook rice with a bay leaf; off heat, fold in lime juice + chopped cilantro.',
      'Char peppers and onions hard.',
      'Build: rice, beans, barbacoa, fajitas, toppings.',
    ],
    theSecret: 'Acid timing. Lime goes in AFTER cooking, both in the rice and the beef, or the whole thing tastes dull.',
    nailIt: ['Rice tastes flat? Your lime and cilantro cooked off — add them at the end.', 'Beef not smoky-deep? More adobo, and don’t skip the cloves.'],
  },
  {
    id: 'canes-fingers-sauce',
    ...S('finger-shack', '#d3202a', 'Chicken Finger Shack'),
    name: 'Chicken Fingers + Signature Sauce',
    category: 'Fried chicken',
    storePrice: 6.99, homeCost: 2.80, servingsNote: 'per box (3–4 fingers)',
    cult: 'One thing, done relentlessly — and a sauce people put on everything.',
    tasteFactors: { salt: 66, fat: 64, acid: 40, sweet: 38, umami: 55, heat: 15, maillard: 58, crunch: 80 },
    signatureHooks: [
      { factor: 'heat', secret: 'The sauce is mostly black pepper — and it must rest', why: 'Mayo + ketchup + Worcestershire + garlic powder + a LOT of coarse black pepper, made a day ahead. The overnight rest is non-negotiable; fresh it tastes like nothing.' },
      { factor: 'crunch', secret: 'Buttermilk soak, craggy dredge', why: 'Soak the tenders in buttermilk, then dredge in seasoned flour with a few drops of the buttermilk worked in for craggy bits.' },
    ],
    ingredients: [
      'Chicken tenderloins', 'Buttermilk', 'Flour + salt + pepper + garlic + paprika', 'Oil for frying',
      'Sauce: ½ cup mayo + ¼ cup ketchup + 1 tsp Worcestershire + ½ tsp garlic powder + 1 tsp coarse black pepper',
    ],
    method: [
      'Whisk the sauce and refrigerate overnight (really).',
      'Soak tenders in buttermilk 30 min+.',
      'Dredge in seasoned flour; fry at 350°F ~4–5 min until golden.',
      'Serve with Texas toast and the rested sauce.',
    ],
    theSecret: 'Make the sauce a day ahead and be heavy-handed with black pepper. Time is the ingredient.',
    nailIt: ['Sauce tastes like plain fry sauce? It didn’t rest, or it needs more pepper.'],
  },
  {
    id: 'popeyes-spicy-sandwich',
    ...S('louisiana-chx', '#ff6b00', 'Louisiana Fried Chicken'),
    name: 'Spicy Chicken Sandwich',
    category: 'Fried chicken',
    storePrice: 5.49, homeCost: 2.30, servingsNote: 'per sandwich',
    cult: 'The sandwich that broke the internet in 2019 — shatteringly craggy crust and real heat.',
    tasteFactors: { salt: 70, fat: 66, acid: 48, sweet: 30, umami: 62, heat: 62, maillard: 65, crunch: 88 },
    signatureHooks: [
      { factor: 'crunch', secret: 'Drizzle brine into the flour for craggy shards', why: 'Work a few tablespoons of the wet buttermilk brine into the seasoned flour with your fingers so it clumps — those clumps fry into the signature jagged crunch.' },
      { factor: 'heat', secret: 'Cayenne in BOTH the brine and the dredge', why: 'Heat has to be built in layers — buttermilk + hot sauce + cayenne to marinate, then more cayenne and paprika in the flour.' },
    ],
    ingredients: [
      'Chicken thigh or breast', 'Buttermilk + hot sauce + cayenne (brine)', 'Flour + cayenne + paprika + garlic + salt',
      'Oil for frying', 'Brioche bun', 'Barrel/dill pickles', 'Spicy mayo (mayo + hot sauce + cayenne)',
    ],
    method: [
      'Brine chicken in buttermilk + hot sauce + cayenne ≥2 hrs.',
      'Dredge in spicy seasoned flour; drizzle in a spoon of brine and toss for craggy clumps.',
      'Fry at 350°F until deep golden and cooked through.',
      'Build on a toasted brioche bun with pickles and spicy mayo.',
    ],
    theSecret: 'Wet-into-dry for craggy crust + layered cayenne. Crunch and heat are both built, not sprinkled on.',
    nailIt: ['Smooth, flat coating? You didn’t work brine into the flour.', 'Mild? Add cayenne to the brine, not just the flour.'],
  },
  {
    id: 'panda-orange-chicken',
    ...S('amchinese', '#d1282e', 'American-Chinese Wok'),
    name: 'Orange Chicken',
    category: 'Wok',
    storePrice: 9.40, homeCost: 3.10, servingsNote: 'per plate',
    cult: 'The most-ordered dish in American Chinese-fast-food — sticky, glossy, sweet-tangy crunch.',
    tasteFactors: { salt: 55, fat: 58, acid: 60, sweet: 78, umami: 60, heat: 25, maillard: 55, crunch: 82 },
    signatureHooks: [
      { factor: 'sweet', secret: 'Sauce off-heat, tossed at the last second', why: 'Sugar + rice vinegar + soy + orange juice AND zest + ginger/garlic + chili, thickened with a cornstarch slurry. Toss the fried chicken in it for literally 10 seconds off the heat so it glazes but stays crisp.' },
      { factor: 'crunch', secret: 'Double-fry the battered chicken', why: 'A cornstarch-heavy batter, fried twice, is what survives the sauce without going soggy.' },
    ],
    ingredients: [
      'Chicken thigh, bite-size', 'Cornstarch + flour + egg (batter)', 'Oil for frying',
      'Sauce: ¼ cup sugar + 3 tbsp rice vinegar + 2 tbsp soy + juice & zest of 1 orange + ginger + garlic + chili + 1 tsp cornstarch slurry',
    ],
    method: [
      'Batter chicken in cornstarch-heavy mix; fry, rest, fry again until very crisp.',
      'Simmer the sauce until glossy and thick.',
      'Off the heat, toss the chicken in just enough sauce to coat.',
      'Serve immediately over rice.',
    ],
    theSecret: 'Orange ZEST (not just juice) and saucing off-heat at the last second. Crunch preserved, aroma intact.',
    nailIt: ['Soggy? You sauced too early or over-sauced — coat right before serving.', 'Tastes only sweet? Add zest and more vinegar for the citrus lift.'],
  },
  {
    id: 'tacobell-crunchwrap',
    ...S('taco-stand', '#702082', 'Late-Night Taco Stand'),
    name: 'Folded Crunch Wrap',
    category: 'Taco',
    storePrice: 5.29, homeCost: 1.90, servingsNote: 'per crunchwrap',
    cult: 'Engineered food — a hot/cold, crunchy/soft hexagon that somehow always holds together.',
    tasteFactors: { salt: 68, fat: 60, acid: 42, sweet: 25, umami: 66, heat: 35, maillard: 50, crunch: 78 },
    signatureHooks: [
      { factor: 'umami', secret: 'Masa harina in the seasoned beef', why: 'A spoon of masa harina (or fine cornmeal) simmered into the beef gives that ultra-fine, slightly “refried” texture and corn-savory depth — that’s why it’s not just taco meat.' },
      { factor: 'crunch', secret: 'A whole tostada sealed inside', why: 'The tostada layer between the beef and the cold sour cream/lettuce is the structural crunch — fold the big tortilla in pleats and griddle seam-side down to seal.' },
    ],
    ingredients: [
      'Ground beef + chili powder + cumin + paprika + onion & garlic powder + 1 tbsp masa harina',
      'Large flour tortilla', 'Tostada shell', 'Nacho cheese sauce', 'Sour cream', 'Lettuce', 'Tomato',
    ],
    method: [
      'Brown beef; add spices, masa harina and a splash of water; simmer to a fine, thick texture.',
      'Center beef on the big tortilla, top with cheese sauce, then the tostada, then sour cream, lettuce, tomato.',
      'Fold the tortilla up in pleats over the center; griddle seam-side down to seal, then flip.',
    ],
    theSecret: 'Masa harina in the beef + a sealed tostada. Depth from the corn, structure from the shell.',
    nailIt: ['Meat tastes thin/greasy? Add masa harina — it thickens and deepens it.', 'Falls apart? Griddle the pleated seam-side down first to glue it shut.'],
  },
  {
    id: 'kfc-fried-chicken',
    ...S('bucket-chx', '#a3080c', 'Bucket Fried Chicken'),
    name: 'Pressure-Fried Bucket Chicken',
    category: 'Fried chicken',
    storePrice: 4.99, homeCost: 1.85, servingsNote: 'per 2 pieces',
    cult: '“11 herbs and spices,” a pressure-fryer, and 70 years of the exact same bucket.',
    tasteFactors: { salt: 72, fat: 68, acid: 20, sweet: 22, umami: 65, heat: 30, maillard: 62, crunch: 76 },
    signatureHooks: [
      { factor: 'heat', secret: 'White pepper is the dominant spice', why: 'The leaked blend is heavy on white pepper (plus paprika, garlic & celery salt, ginger, mustard, thyme, basil, oregano, black pepper) — white pepper’s funky heat is the flavor people can’t name.' },
      { factor: 'umami', secret: 'A pinch of MSG + a buttermilk soak', why: 'MSG is what makes it “finger-lickin’.” Soak in buttermilk first so the coating grips and the meat stays juicy.' },
      { factor: 'crunch', secret: 'Fry with a lid (fake the pressure-fryer)', why: 'Covering the pan traps steam and mimics the pressure-fry’s juicy-inside/crisp-outside result.' },
    ],
    ingredients: [
      'Chicken pieces', 'Buttermilk soak', 'Flour + white pepper + paprika + garlic & celery salt + ginger + mustard powder + thyme + basil + oregano + black pepper + ½ tsp MSG',
      'Oil for frying (with a lid)',
    ],
    method: [
      'Soak chicken in buttermilk ≥1 hr.',
      'Dredge heavily in the 11-spice flour.',
      'Fry at 325°F with the pan loosely covered, turning, until deep golden and 165°F inside.',
      'Rest on a rack so it stays crisp.',
    ],
    theSecret: 'White pepper + MSG, and frying covered. The spice you’re missing is white pepper.',
    nailIt: ['Close but “not quite”? It’s almost always the white pepper and the MSG.', 'Dry? Buttermilk-soak longer and fry a touch cooler with the lid on.'],
  },
  {
    id: 'shake-shack-shackburger',
    ...S('smash-stand', '#4c9c2e', 'Fast-Casual Smash Stand'),
    name: 'Smash Burger',
    category: 'Burger',
    storePrice: 7.19, homeCost: 3.00, servingsNote: 'per burger',
    cult: 'The fast-casual smash burger that made people line up in city parks — all about the crust and the sauce.',
    tasteFactors: { salt: 64, fat: 80, acid: 46, sweet: 40, umami: 74, heat: 12, maillard: 85, crunch: 50 },
    signatureHooks: [
      { factor: 'maillard', secret: 'Hard smash on a screaming griddle', why: 'Smash an 80/20 ball paper-thin and don’t move it — you want a deep, lacy, dark-brown crust. That crust IS the flavor.' },
      { factor: 'sweet', secret: 'Signature Smash Sauce', why: 'Mayo + ketchup + yellow mustard + a little pickle brine + a pinch of cayenne. The pickle brine and cayenne are what lift it above plain fry sauce.' },
      { factor: 'fat', secret: 'Potato bun + American cheese melted under a lid', why: 'A soft potato bun and fully-melted American cheese are non-negotiable for the texture.' },
    ],
    ingredients: [
      '80/20 ground beef ball (~3.5 oz)', 'Signature Smash Sauce: 2 tbsp mayo + 1 tbsp ketchup + 1 tsp mustard + ½ tsp pickle brine + pinch cayenne',
      'American cheese', 'Potato bun', 'Lettuce', 'Tomato',
    ],
    method: [
      'Mix the Signature Smash Sauce; toast the potato bun.',
      'Smash the beef ball hard on a very hot griddle; salt.',
      'Flip once a deep crust forms; cheese it and cover to melt.',
      'Build: bun, sauce, lettuce, tomato, patty, bun.',
    ],
    theSecret: 'A brutal smash for maximum crust + Signature Smash Sauce with pickle brine. Browning and sauce carry it.',
    nailIt: ['Grey, no crust? Pan wasn’t hot enough or you moved the patty — smash and leave it.', 'Sauce boring? Add the pickle brine and cayenne.'],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // DRIVE-THRU CLASSICS — old-school production methods (generic, no brand names)
  // ─────────────────────────────────────────────────────────────────────────────

  {
    id: 'old-school-griddle-burger',
    ...S('retro', '#b23f2e', 'Drive-Thru Classic'),
    name: 'Old-School Griddle Burger',
    category: 'Burger',
    storePrice: 2.49, homeCost: 0.80, servingsNote: 'per burger',
    cult: 'The thin, steamy, wax-paper-wrapped burger everyone grew up on — and the taste people swear the modern version lost.',
    tasteFactors: { salt: 72, fat: 68, acid: 40, sweet: 35, umami: 78, heat: 8, maillard: 70, crunch: 42 },
    signatureHooks: [
      { factor: 'umami', secret: 'Season liberally with a salt + MSG blend during cooking', why: 'The classic seasoning is ~4 parts salt : 2 parts MSG : 1 part black pepper + a little onion powder, shaken on hard right after searing. The MSG is the savory “what is that” note — most of it floats off in the fat, so don’t be stingy.' },
      { factor: 'maillard', secret: 'Pressure-sear the frozen patty', why: 'Press a thin frozen patty hard with a spatula for ~2 seconds about 20 sec in. It welds a dark, juicy crust to the meat — the patty should stick and need “cutting” off the griddle.' },
      { factor: 'sweet', secret: 'Rehydrated dried onions', why: 'Soak dried chopped onion 4:1 in water 30 min — those tiny sweet “baby onions” are unmistakable and can’t be faked with fresh.' },
    ],
    ingredients: [
      'Ground chuck (80% lean), pressed thin (~2 oz) and frozen',
      'Classic seasoning: 4 parts salt : 2 parts MSG : 1 part black pepper + a little onion powder',
      'Dried chopped onion, rehydrated (4:1 water, 30 min)',
      'Thin sour dill pickle slices',
      'Plain soft buns',
      'Yellow mustard, ketchup',
    ],
    method: [
      'Freeze the thin patties ≥1 hr so they hold together on the griddle.',
      'Toast the bun faces down with light pressure until evenly tan.',
      'Lay a frozen patty on a hot flat-top; after ~20 sec press hard for 2 sec to sear, then season liberally with the salt/MSG blend.',
      'Flip after ~1 min, season again, add a pinch of rehydrated onion.',
      'Dress the crown: 5 small mustard dots, 5 nickel-size ketchup dabs, one pickle in the middle.',
      'Stack patty on the crown, cap with the heel, wrap in wax paper and rest 5–10 min so it steams and the flavors meld.',
    ],
    theSecret: 'The salt-and-MSG seasoning hit hard right after the sear, then the wax-paper steam-rest. That MSG is the umami note the copy always misses.',
    nailIt: ['Tastes flat / like a plain burger? Not enough salt+MSG — use it liberally, a lot floats off in the fat.', 'No depth? You skipped the pressure-sear or the wrapped rest.'],
  },
  {
    id: 'special-sauce-double-stack',
    ...S('retro', '#c25a2a', 'Drive-Thru Classic'),
    name: 'Special-Sauce Double Stack',
    category: 'Burger',
    storePrice: 5.99, homeCost: 1.85, servingsNote: 'per burger',
    cult: 'Two thin patties, three buns, shredded lettuce and that one sauce nobody can quite name.',
    tasteFactors: { salt: 70, fat: 72, acid: 48, sweet: 50, umami: 75, heat: 6, maillard: 65, crunch: 50 },
    signatureHooks: [
      { factor: 'sweet', secret: 'The special sauce must rest an hour', why: 'Mayo + a spoon of sweet salad dressing (French/Catalina) + sweet pickle relish + dill relish + a little sugar, vinegar, ketchup and minced onion. Made fresh it tastes like nothing — it needs an hour covered in the fridge to meld. The sweet relish + salad dressing is the flavor people can’t place.' },
      { factor: 'umami', secret: 'Salt + MSG on both patties', why: 'Same classic seasoning as the griddle burger — the savory backbone under all that sauce.' },
      { factor: 'crunch', secret: 'The structural middle bun', why: 'A third bun layer keeps the stack from collapsing and gives the cold-lettuce/warm-patty contrast.' },
    ],
    ingredients: [
      'Two thin beef patties + the salt/MSG seasoning',
      'Special sauce: mayo + 2 Tbsp sweet salad dressing + 1 Tbsp sweet relish + 2 tsp dill relish + 1 tsp each sugar/ketchup/minced onion + 1 tsp vinegar',
      'Three bun layers (crown, middle, heel)',
      'Shredded iceberg, American cheese, 2 dill pickle slices, rehydrated onion',
    ],
    method: [
      'Mix the special sauce and rest it, covered, in the fridge ≥1 hr.',
      'Cook two thin patties like the griddle burger, seasoned with the salt/MSG blend.',
      'Toast the three bun faces; spread sauce on the heel and the middle bun, then add shredded lettuce to each.',
      'Heel: cheese on the lettuce. Middle bun: pickles + onion on the lettuce.',
      'Stack: heel + patty, then middle + patty, then crown. Wrap and rest 5–8 min.',
    ],
    theSecret: 'The rested special sauce (sweet relish + salad dressing) and the three-bun build. The hour of rest is not optional.',
    nailIt: ['Sauce flat? It didn’t rest, or it’s missing the sweet relish.', 'Collapses? The middle bun is structural — keep it.'],
  },
  {
    id: 'golden-nuggets',
    ...S('retro', '#c8862e', 'Drive-Thru Classic'),
    name: 'Golden Nuggets',
    category: 'Fried chicken',
    storePrice: 5.49, homeCost: 2.10, servingsNote: 'per 10-piece',
    cult: 'The dunkable, uniform, craggy nugget that defined a generation of kids’ meals.',
    tasteFactors: { salt: 66, fat: 62, acid: 8, sweet: 10, umami: 70, heat: 8, maillard: 55, crunch: 82 },
    signatureHooks: [
      { factor: 'umami', secret: 'MSG in the dredge', why: 'A little tempura mix + MSG + onion & garlic powder in the flour is what gives the coating its savory, craveable pull rather than tasting like plain fried chicken.' },
      { factor: 'crunch', secret: 'Double-coat, then freeze', why: 'Coat → egg wash → coat again, then freeze ≥1 hr and repeat. The double frozen crust is what fries up craggy and stays crisp.' },
      { factor: 'maillard', secret: 'Fry, then finish in the oven', why: 'A short 375°F oven finish after frying sets the crunch and cooks the inside through without greasing out.' },
    ],
    ingredients: [
      'Chicken breast, pounded ¼" and cut into bite pieces',
      'Egg + water wash',
      'Dredge: flour + a little tempura mix + salt + MSG + onion & garlic powder + pepper',
      'Oil for frying',
    ],
    method: [
      'Coat chicken in the seasoned flour, dip in the egg wash, coat again.',
      'Freeze the coated pieces ≥1 hr, then repeat the coat for a double crust.',
      'Fry at 375°F until light golden and crisp.',
      'Finish on a tray in a 375°F oven 5–7 min so they stay crunchy and cook through.',
    ],
    theSecret: 'MSG in the dredge for umami + the double-coat-and-freeze + a short oven finish for crunch that survives dipping.',
    nailIt: ['Bland? Add MSG to the dredge — that’s the savory hit.', 'Soft coating? Double-coat and don’t skip the freeze.'],
  },
  {
    id: 'crispy-fish-sandwich',
    ...S('retro', '#3f7f8f', 'Drive-Thru Classic'),
    name: 'Crispy Fish Sandwich',
    category: 'Seafood',
    storePrice: 5.49, homeCost: 2.20, servingsNote: 'per sandwich',
    cult: 'The soft, steamy, tartar-sauced fish square — the one that’s all about the bun and the sauce, not crunch.',
    tasteFactors: { salt: 58, fat: 64, acid: 45, sweet: 20, umami: 45, heat: 4, maillard: 40, crunch: 55 },
    signatureHooks: [
      { factor: 'acid', secret: 'Steam the bun — never toast it', why: 'The bun is warmed soft and pillowy (a quick steam), not toasted. That soft, slightly damp bun is the whole texture identity of this sandwich.' },
      { factor: 'fat', secret: 'Caper-dill tartar + a half slice of cheese', why: 'Tartar = mayo + dill relish + minced onion + capers + a little lemon and sugar, rested. Only half a slice of American cheese, laid on the hot fish so it just half-melts.' },
    ],
    ingredients: [
      'Square breaded whitefish fillet',
      'Tartar sauce: mayo + dill relish + minced onion + minced capers + parsley + a little lemon + a pinch of sugar',
      'Soft plain bun (steamed, not toasted)',
      'Half slice real American cheese',
    ],
    method: [
      'Make the tartar sauce ahead so it melds; keep it cold.',
      'Fry or bake the fish until crisp; salt lightly.',
      'Steam the bun (~10 sec in a damp paper towel in the microwave) — do not toast.',
      'Sauce the crown, add the fish, lay a half slice of cheese on the hot fish to half-melt, cap with the heel.',
    ],
    theSecret: 'Steam the bun (don’t toast) and use a caper-dill tartar. The soft steamed bun is the identity — toasting it makes it “wrong.”',
    nailIt: ['Feels off / too crusty a bun? You toasted it — steam instead.', 'Tartar flat? Add capers and let it rest.'],
  },
  {
    id: 'egg-and-muffin-sandwich',
    ...S('retro', '#d19a3a', 'Drive-Thru Classic'),
    name: 'Egg & Muffin Breakfast Sandwich',
    category: 'Breakfast',
    storePrice: 4.29, homeCost: 1.10, servingsNote: 'per sandwich',
    cult: 'The neat, round, buttery breakfast sandwich that made mornings a drive-thru habit.',
    tasteFactors: { salt: 62, fat: 66, acid: 12, sweet: 15, umami: 60, heat: 5, maillard: 55, crunch: 40 },
    signatureHooks: [
      { factor: 'fat', secret: 'Cook the egg in a greased ring + butter the muffin', why: 'An egg ring gives the perfect round, evenly-set egg (poke the yolk so it doesn’t dome). Toast the split muffin with light pressure and butter it liberally with real butter.' },
      { factor: 'umami', secret: 'Real American cheese + a quick-seared round bacon', why: 'Real American cheese (not processed “cheese food”) melted on the hot egg, and back/Canadian bacon warmed ~30 sec a side for a light sear.' },
    ],
    ingredients: [
      'English muffin, split',
      'Real butter',
      '1 egg, cooked in a greased egg ring',
      'Round back (Canadian) bacon',
      'Real American cheese',
    ],
    method: [
      'Toast the muffin faces with light pressure until medium brown; butter them well.',
      'Grease an egg ring, crack in an egg, poke the yolk; cook until whites set, then flip briefly.',
      'Warm the back bacon on the griddle ~30 sec per side.',
      'Cheese on the heel, then egg, then bacon, then crown. Wrap and rest a few minutes.',
    ],
    theSecret: 'The egg ring for a clean round set egg + a well-buttered toasted muffin, with real butter and real American cheese.',
    nailIt: ['Egg messy or domed? Use a ring and poke the yolk.', 'Dry or bland? Butter the muffin liberally and use real cheese.'],
  },
];

export const FOOD_BY_ID = Object.fromEntries(FOOD_COPYCATS.map(m => [m.id, m]));

// Distinct brands, in insertion order, for the food filter tabs.
export const FOOD_BRANDS = FOOD_COPYCATS.reduce((acc, m) => {
  if (!acc.some(b => b.brand === m.brand)) acc.push({ brand: m.brand, label: m.brandLabel, tint: m.tint });
  return acc;
}, []);

// ── Match a real recipe's name to the closest copycat entry ───────────────
// Substring phrases per entry, most-specific first — an honest heuristic
// (not a claim the recipe literally IS that brand's dish). MATCH_ORDER puts
// distinctive dishes (e.g. "spicy chicken sandwich") ahead of generic
// fallbacks (plain "fried chicken") so overlapping names resolve sensibly.
const MATCH_PHRASES = {
  'innout-double-double':       ['double cheeseburger', 'cheeseburger'],
  'chickfila-sandwich':         ['fried chicken sandwich', 'chicken sandwich'],
  'mcdonalds-fries':            ['shoestring fries', 'french fries', 'fries'],
  'chipotle-barbacoa-bowl':     ['barbacoa bowl', 'barbacoa', 'burrito bowl'],
  'canes-fingers-sauce':        ['chicken fingers', 'chicken tenders'],
  'popeyes-spicy-sandwich':     ['spicy chicken sandwich', 'spicy fried chicken sandwich'],
  'panda-orange-chicken':       ['orange chicken'],
  'tacobell-crunchwrap':        ['crunchwrap', 'crunch wrap'],
  'kfc-fried-chicken':          ['bucket chicken', 'fried chicken bucket', 'fried chicken'],
  'shake-shack-shackburger':    ['smash burger', 'smashburger'],
  'old-school-griddle-burger':  ['griddle burger', 'diner burger'],
  'special-sauce-double-stack': ['special sauce burger', 'double stack burger'],
  'golden-nuggets':             ['chicken nuggets', 'nuggets'],
  'crispy-fish-sandwich':       ['fish sandwich', 'fried fish sandwich'],
  'egg-and-muffin-sandwich':    ['egg mcmuffin', 'breakfast sandwich', 'egg and muffin'],
};
const MATCH_ORDER = [
  'popeyes-spicy-sandwich', 'panda-orange-chicken', 'tacobell-crunchwrap', 'chipotle-barbacoa-bowl',
  'shake-shack-shackburger', 'old-school-griddle-burger', 'special-sauce-double-stack',
  'canes-fingers-sauce', 'crispy-fish-sandwich', 'egg-and-muffin-sandwich', 'golden-nuggets',
  'innout-double-double', 'chickfila-sandwich', 'kfc-fried-chicken', 'mcdonalds-fries',
];

/** Best FOOD_COPYCATS match for a real recipe's name — null if nothing close
 * enough. Name-only, substring-based. */
export function matchFoodCopycat(recipeName) {
  const text = (recipeName || '').toLowerCase();
  if (!text) return null;
  for (const id of MATCH_ORDER) {
    const phrases = MATCH_PHRASES[id] || [];
    if (phrases.some(p => text.includes(p))) return FOOD_BY_ID[id];
  }
  return null;
}
