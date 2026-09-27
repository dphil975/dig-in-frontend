/* ════════════════════════════════════════════════════════════
   RECIPE ALCHEMIST
   Turn ANYTHING into a format: pasta sauce · sandwich · soup ·
   cookie · brownie · cinnamon roll · cupcake · cake · pie.
   "apple pie cookie" → a real, buildable recipe.

   • Base recipes per format are adapted with the requested flavor.
   • Written at a 6th-grade reading level — clear and direct.
   • The result card shows a quick SUMMARY (not every step); the full
     steps live on the recipe page.
   • The engine learns from each request (dig_in_alchemist) and adapts:
     popular formats float up, recent themes are suggested, and the
     running totals power the metrics strip.

   Consolidated (Recipe & Cooking lib reorg): this file also carries what
   used to be three separate, related "generate a dish" engines —
   recipeBooks.js (the corpus loader Ask Nova retrieval uses), remixEngine.js
   (the 9-base × 9-filling remix generator), and fusionEngine.js (the
   base-mechanics × flavor-region fusion builder). Each keeps its own
   section below, under its own marker. NOTE: recipeAlchemist.js already had
   its own private `BASES` array (a tiny lookup table for genericDish's
   "what carb/protein is this dish built on" guess) which collided by name
   with remixEngine's *exported* `BASES` (the 9 canvas bases). The private
   one has been renamed to `GENERIC_DISH_BASES` to resolve that conflict;
   remixEngine's `BASES` keeps its original name since it's the one other
   files (recipeTransform.js) actually import.
   ════════════════════════════════════════════════════════════ */

const STORE_KEY = 'dig_in_alchemist';

/* ── Flavor library — known themes → real add-ins + a short note ── */
const FLAVOR_LIBRARY = {
  'apple pie':      { addins: ['2 apples, peeled and chopped small', '1 tsp cinnamon', '2 tbsp brown sugar'], note: 'warm and cozy', sweet: true },
  'pumpkin':        { addins: ['1/2 cup pumpkin purée', '1 tsp pumpkin pie spice'], note: 'soft and spiced', sweet: true },
  'pumpkin spice':  { addins: ['1/2 cup pumpkin purée', '1 tsp pumpkin pie spice'], note: 'soft and spiced', sweet: true },
  'chocolate':      { addins: ['1/2 cup chocolate chips', '2 tbsp cocoa powder'], note: 'rich and chocolatey', sweet: true },
  'lemon':          { addins: ['the zest of 1 lemon', '2 tbsp lemon juice'], note: 'bright and zingy', sweet: true },
  'strawberry':     { addins: ['1/2 cup chopped strawberries'], note: 'fruity and sweet', sweet: true },
  'banana':         { addins: ['1 ripe banana, mashed'], note: 'sweet and moist', sweet: true },
  'peanut butter':  { addins: ['1/3 cup peanut butter'], note: 'nutty and creamy', sweet: true },
  'cinnamon':       { addins: ['1 tsp cinnamon', '2 tbsp brown sugar'], note: 'warm and sweet-spiced', sweet: true },
  'birthday cake':  { addins: ['2 tbsp rainbow sprinkles', '1 tsp vanilla'], note: 'fun and festive', sweet: true },
  'matcha':         { addins: ['1 tbsp matcha green tea powder'], note: 'earthy and smooth', sweet: true },
  'red velvet':     { addins: ['1 tbsp cocoa powder', 'a few drops of red food coloring'], note: 'soft and lightly chocolatey', sweet: true },

  // savory themes
  'tomato':         { addins: ['2 cups crushed tomatoes', '1 tsp dried basil'], note: 'tangy and savory', sweet: false },
  'mushroom':       { addins: ['1 cup chopped mushrooms'], note: 'deep and earthy', sweet: false },
  'cheese':         { addins: ['1 cup shredded cheese'], note: 'melty and rich', sweet: false },
  'garlic':         { addins: ['3 cloves garlic, minced'], note: 'savory and bold', sweet: false },
  'pesto':          { addins: ['1/3 cup basil pesto'], note: 'herby and fresh', sweet: false },
  'buffalo chicken':{ addins: ['1 cup cooked shredded chicken', '3 tbsp buffalo hot sauce'], note: 'spicy and bold', sweet: false },
  'broccoli':       { addins: ['1 cup chopped broccoli'], note: 'fresh and hearty', sweet: false },
  'chicken':        { addins: ['1 cup cooked chopped chicken'], note: 'hearty and filling', sweet: false },
  'bacon':          { addins: ['4 strips cooked bacon, crumbled'], note: 'smoky and salty', sweet: false },
};

/* ── Format base recipes ──────────────────────────────────────────
   `summaryLead` is a one-line overview (no full steps). `build` returns
   the full ingredient + step list, written at a 6th-grade level. */
const addLine = (flavor) => flavor.addins.join(', ');
const tasteNote = (flavor) => flavor.note || 'full of flavor';

const FORMATS = {
  cookie: { label: 'Cookie', emoji: 'COOKIE', kind: 'sweet', time: 25, servings: 24,
    summaryLead: 'Cream the butter and sugars, work in the flour, fold in your mix-ins, then scoop and bake until the edges turn golden.',
    build: (star, f) => {
      const t = (star || '').toLowerCase();
      // ── Sugar cookie: all white sugar, no chips ──
      if (/sugar/.test(t)) {
        return {
          ingredients: ['1 cup soft butter', '2 cups white sugar', '2 eggs', '1 tsp vanilla', '2 3/4 cups flour', '1 tsp baking powder', '1/2 tsp salt'],
          steps: [
            'Heat the oven to 350°F.',
            'In a big bowl, beat the soft butter and white sugar until pale and fluffy.',
            'Crack in the 2 eggs and the vanilla, and stir until blended.',
            'Add the flour, baking powder, and salt. Mix until it forms a soft dough.',
            'Scoop spoonfuls onto a baking tray, leaving space between them.',
            'Bake 9–11 minutes, until just set but still pale — sugar cookies should not brown much.',
            'Let them cool before eating.',
          ],
        };
      }
      // ── Chocolate-chip cookie base (the default). A named flavor (apple
      //    pie, lemon…) swaps the chips for that add-in instead. ──
      const flavored = !!t && !/chocolate chip|choc chip|chocolate|chip|classic|plain/.test(t);
      const base = ['1 cup soft butter', '1 cup brown sugar', '1 1/2 cups white sugar', '2 eggs', '1 tsp vanilla', '2 1/4 cups flour', '1 tsp baking soda', '1/2 tsp salt'];
      return {
        ingredients: flavored ? [...base, ...f.addins] : [...base, '2 cups chocolate chips'],
        steps: [
          'Heat the oven to 350°F.',
          'In a big bowl, beat the soft butter with the brown sugar and white sugar until pale and fluffy.',
          'Crack in the 2 eggs and the vanilla, and stir until blended.',
          'Add the flour, baking soda, and salt. Mix until it forms a soft dough.',
          flavored ? `Fold in the ${addLine(f)} so every bite is ${tasteNote(f)}.` : 'Fold in the 2 cups of chocolate chips.',
          'Scoop spoonfuls of dough onto a baking tray, leaving space between them to spread.',
          'Bake 10–12 minutes, until the edges turn golden.',
          'Let them cool for a few minutes before eating — they start out hot.',
        ],
      };
    } },
  brownie: { label: 'Brownie', emoji: 'BROWNIE', kind: 'sweet', time: 35, servings: 9,
    summaryLead: 'Whisk melted butter with sugar and egg, work in the flour — cocoa for chocolate brownies, brown sugar and chips for blondies — then bake until set.',
    build: (star, f) => {
      const t = (star || '').toLowerCase();
      // ── Blondie / blonde bars: brown sugar, NO cocoa ──
      if (/blond/.test(t) || /butterscotch/.test(t)) {
        return {
          ingredients: ['1/2 cup melted butter', '1 cup brown sugar', '1 egg', '1 tsp vanilla', '1 cup flour', '1/2 tsp baking powder', 'a pinch of salt', '3/4 cup chocolate chips'],
          steps: [
            'Heat the oven to 350°F and grease a square pan.',
            'Stir the melted butter and brown sugar together until smooth.',
            'Mix in the egg and vanilla until the batter is glossy.',
            'Stir in the flour, baking powder, and salt — leave out cocoa, which is what keeps blondies blonde.',
            'Fold in the chocolate chips.',
            'Spread the batter in the pan and bake about 22 minutes, until the top is golden.',
            'Cool completely, then cut into bars.',
          ],
        };
      }
      // ── Chocolate brownie (the default) ──
      return {
        ingredients: ['1/2 cup melted butter', '1 cup white sugar', '2 eggs', '1/2 cup cocoa powder', '3/4 cup flour', 'a pinch of salt', ...f.addins],
        steps: [
          'Heat the oven to 350°F and grease a square pan.',
          'Stir the melted butter and sugar together in a bowl.',
          'Add the eggs and mix until the batter is smooth and shiny.',
          'Stir in the cocoa powder, flour, and a pinch of salt until no dry streaks remain.',
          `Fold in the ${addLine(f)} to make it ${tasteNote(f)}.`,
          'Pour the batter into the pan and spread it flat.',
          'Bake about 25 minutes. A toothpick in the center should come out with a few moist crumbs.',
          'Cool completely, then cut into squares.',
        ],
      };
    } },
  'cinnamon roll': { label: 'Cinnamon Roll', emoji: 'CINNAMON', kind: 'sweet', time: 90, servings: 8,
    summaryLead: 'Make a soft yeast dough, roll it up with cinnamon sugar, slice it into spirals, and bake until golden.',
    build: (star, f) => ({
      ingredients: ['2 cups flour', '1 packet yeast', '1/2 cup warm milk', '2 tbsp sugar', '2 tbsp soft butter', '1 egg', 'FILLING: 1/4 cup brown sugar + 1 tbsp cinnamon', ...f.addins],
      steps: [
        'Stir the warm milk, yeast, and sugar in a bowl. Wait 5 minutes until it looks foamy.',
        'Mix in the flour, soft butter, and egg until it forms a soft dough.',
        'Knead the dough for 5 minutes, then let it rest 30 minutes until it doubles in size.',
        'Roll the dough out into a large rectangle.',
        `Sprinkle the brown sugar, cinnamon, and ${addLine(f)} evenly across it so it tastes ${tasteNote(f)}.`,
        'Roll it up tightly, then slice it into spirals.',
        'Place the spirals in a pan and bake at 350°F for about 20 minutes, until golden.',
        'Drizzle icing over the top while they are still warm.',
      ],
    }) },
  cupcake: { label: 'Cupcake', emoji: 'CUPCAKE', kind: 'sweet', time: 30, servings: 12,
    summaryLead: 'Whip up a simple batter, fold in the flavor, and bake into little cakes you can frost.',
    build: (star, f) => ({
      ingredients: ['1 1/2 cups flour', '1 cup sugar', '1/2 cup soft butter', '2 eggs', '1/2 cup milk', '1 1/2 tsp baking powder', '1 tsp vanilla', ...f.addins],
      steps: [
        'Heat the oven to 350°F and line a muffin tray with paper cups.',
        'Beat the soft butter and sugar until light and fluffy.',
        'Mix in the eggs, vanilla, and milk.',
        'Add the flour and baking powder. Stir until just smooth — do not overmix.',
        `Fold in the ${addLine(f)} so they turn out ${tasteNote(f)}.`,
        'Fill each paper cup about halfway with batter.',
        'Bake about 18 minutes, until they spring back when you tap the top.',
        'Cool, then frost and decorate.',
      ],
    }) },
  cake: { label: 'Cake', emoji: 'CAKE', kind: 'sweet', time: 50, servings: 10,
    summaryLead: 'Build a fluffy batter, bake it in a round pan, and frost it once it cools.',
    build: (star, f) => ({
      ingredients: ['2 cups flour', '1 1/2 cups sugar', '1/2 cup soft butter', '3 eggs', '1 cup milk', '2 tsp baking powder', '1 tsp vanilla', ...f.addins],
      steps: [
        'Heat the oven to 350°F and grease a round cake pan.',
        'Beat the butter and sugar until light and fluffy.',
        'Add the eggs one at a time, then the vanilla.',
        'Mix in the flour and baking powder, then the milk, until the batter is smooth.',
        `Fold in the ${addLine(f)} so the whole cake is ${tasteNote(f)}.`,
        'Pour the batter into the pan and smooth the top.',
        'Bake 30–35 minutes. A toothpick in the center should come out clean.',
        'Cool completely, then frost and slice.',
      ],
    }) },
  pie: { label: 'Pie', emoji: 'PIE', kind: 'both', time: 60, servings: 8,
    summaryLead: 'Fill a crust with the flavor, top it off, and bake until the filling sets and the crust turns golden.',
    build: (star, f) => (f.sweet ? {
      ingredients: ['1 pie crust (store-bought is fine)', '1/3 cup sugar', '2 tbsp cornstarch', '1 tsp cinnamon', ...f.addins],
      steps: [
        'Heat the oven to 375°F.',
        'Press the pie crust into a pie dish.',
        `In a bowl, toss the ${addLine(f)} with the sugar, cornstarch, and cinnamon until it is ${tasteNote(f)}.`,
        'Pour the filling into the crust and spread it level.',
        'Add a top crust in strips if you have extra dough.',
        'Bake about 40 minutes, until the filling bubbles and the crust is golden.',
        'Let it cool so the filling sets before slicing.',
      ],
    } : {
      ingredients: ['1 pie crust (store-bought is fine)', '1 cup cooked veggies', '1 cup gravy or cream sauce', 'salt and pepper', ...f.addins],
      steps: [
        'Heat the oven to 375°F.',
        'Press the pie crust into a pie dish.',
        `In a bowl, stir the ${addLine(f)} with the veggies and gravy until it is ${tasteNote(f)}.`,
        'Season with salt and pepper, then taste and adjust.',
        'Pour the filling into the crust, add a top crust, and poke a few holes in it.',
        'Bake about 35 minutes, until the top is golden and crispy.',
        'Let it cool a few minutes before serving.',
      ],
    }) },
  'pasta sauce': { label: 'Pasta Sauce', emoji: 'PASTA', kind: 'savory', time: 25, servings: 4,
    summaryLead: 'Soften onion and garlic, simmer in the main flavor, and cook it down into a thick sauce.',
    build: (star, f) => ({
      ingredients: ['2 tbsp olive oil', '1 small onion, chopped', '2 cloves garlic, minced', 'salt and pepper', ...f.addins],
      steps: [
        'Heat the olive oil in a pot over medium heat.',
        'Add the chopped onion and cook until soft and clear, about 4 minutes.',
        'Stir in the garlic and cook 1 minute, until it smells fragrant.',
        `Add the ${addLine(f)} and stir everything together.`,
        'Lower the heat and simmer 15 minutes, until the sauce thickens.',
        `Season with salt and pepper, then taste — it should be ${tasteNote(f)}.`,
        'Toss with cooked pasta and top with cheese if you like.',
      ],
    }) },
  sandwich: { label: 'Sandwich', emoji: 'SANDWICH', kind: 'savory', time: 10, servings: 1,
    summaryLead: 'Layer the filling, cheese, and something crunchy between two slices of bread.',
    build: (star, f) => ({
      ingredients: ['2 slices of bread', '1 tbsp butter or mayo', 'a handful of lettuce', 'a slice of cheese', ...f.addins],
      steps: [
        'Lay two slices of bread on a plate.',
        'Spread a thin layer of butter or mayo on each slice.',
        `Pile the ${addLine(f)} onto one slice so it is ${tasteNote(f)}.`,
        'Add the cheese and lettuce for crunch.',
        'Top with the other slice, spread-side down.',
        'Cut it in half and serve.',
      ],
    }) },
  soup: { label: 'Soup', emoji: 'SOUP', kind: 'savory', time: 35, servings: 4,
    summaryLead: 'Build a flavor base, add broth, and simmer everything until it is warm and tasty.',
    build: (star, f) => ({
      ingredients: ['1 tbsp olive oil', '1 onion, chopped', '2 cloves garlic, minced', '4 cups broth (chicken or veggie)', 'salt and pepper', ...f.addins],
      steps: [
        'Heat the oil in a large pot over medium heat.',
        'Add the onion and cook until soft, about 4 minutes, then add the garlic for 1 minute.',
        `Stir in the ${addLine(f)} and cook 2 minutes.`,
        'Pour in the broth.',
        'Simmer gently for about 20 minutes so the flavors blend.',
        `Season with salt and pepper until it is ${tasteNote(f)}.`,
        'For a smooth soup, blend it; for a chunky soup, leave it as is.',
        'Ladle into bowls and serve hot.',
      ],
    }) },
};

export const FORMAT_LIST = Object.entries(FORMATS).map(([key, f]) => ({ key, ...f }));

/* ── Parsing a free-text request ──────────────────────────────────── */
const FILLER = new Set(['i','want','to','make','a','an','the','some','turn','into','please','can','you','my','of','with','flavored','flavor','style','version','for','me','it','this','that','like','as']);

// Words that mean a format but don't contain the format's own name.
const FORMAT_ALIASES = {
  'blondie':      'brownie',
  'blonde bars':  'brownie',
  'blonde bar':   'brownie',
  'blond brownie':'brownie',
};

function detectFormat(text) {
  const t = text.toLowerCase();
  let best = null;
  // prefer the LONGEST match (so "cupcake" beats "cake", "apple pie cookie"
  // → cookie beats pie, "blondie" → brownie); tie-break on later position
  const consider = (matchStr, target) => {
    const idx = t.lastIndexOf(matchStr);
    if (idx === -1) return;
    if (!best || matchStr.length > best.len || (matchStr.length === best.len && idx > best.idx)) {
      best = { key: target, idx, len: matchStr.length };
    }
  };
  for (const key of Object.keys(FORMATS)) consider(key, key);
  for (const [alias, target] of Object.entries(FORMAT_ALIASES)) consider(alias, target);
  return best ? best.key : null;
}

export function parseRequest(text) {
  const format = detectFormat(text || '');
  let theme = (text || '').toLowerCase();
  if (format) theme = theme.replace(format, ' ');
  theme = theme
    .split(/\s+/)
    .filter(w => w && !FILLER.has(w))
    .join(' ')
    .replace(/[^a-z0-9\s'-]/g, '')
    .trim();
  return { format, theme };
}

function resolveFlavor(theme, formatKind) {
  const t = (theme || '').toLowerCase();
  const matched = [];
  for (const key of Object.keys(FLAVOR_LIBRARY)) {
    if (t.includes(key)) matched.push(FLAVOR_LIBRARY[key]);
  }
  if (matched.length) {
    const addins = [...new Set(matched.flatMap(m => m.addins))];
    const sweet = formatKind === 'sweet' ? true : formatKind === 'savory' ? false : matched.some(m => m.sweet);
    return { addins, note: matched[0].note, sweet };
  }
  // Unknown theme → treat the words as the star ingredient itself
  if (t) {
    const sweet = formatKind !== 'savory';
    return { addins: [`1 cup ${t}`], note: `full of ${t} flavor`, sweet };
  }
  // No theme at all → a plain, classic version
  return { addins: formatKind === 'savory' ? ['1 cup of your favorite filling'] : ['1 tsp vanilla'], note: 'simple and classic', sweet: formatKind !== 'savory' };
}

const titleCase = (s = '') => s.replace(/\b\w/g, c => c.toUpperCase());

/* ── Restaurant-dish recreation ───────────────────────────────────
   Type a restaurant dish ("Chipotle burrito bowl") and the engine
   rebuilds it as a simple home recipe, then pairs it into a meal. */
const DISH_LIBRARY = [
  { keys: ['alfredo', 'fettuccine'], label: 'Creamy Alfredo Pasta', emoji: 'CREAMY', kind: 'savory', cuisine: 'italian', time: 25, servings: 4,
    summaryLead: 'Cook the pasta, make a buttery cream-and-parmesan sauce, and toss them together.',
    ingredients: ['12 oz fettuccine', '3 tbsp butter', '1 cup heavy cream', '1 cup grated parmesan', '2 cloves garlic, minced', 'salt and pepper'],
    steps: ['Boil the fettuccine in salted water until tender, then drain.', 'Melt the butter in a pan and cook the garlic for 1 minute.', 'Pour in the cream and warm it up, but do not let it boil.', 'Stir in the parmesan until the sauce is smooth and thick.', 'Add the cooked pasta and toss until every strand is coated.', 'Season with salt and pepper, then serve right away.'] },
  { keys: ['carbonara'], label: 'Spaghetti Carbonara', emoji: 'SPAGHETTI', kind: 'savory', cuisine: 'italian', time: 25, servings: 4,
    summaryLead: 'Toss hot pasta with eggs, cheese, and crispy pork so it turns silky.',
    ingredients: ['12 oz spaghetti', '4 strips bacon, chopped', '2 eggs', '3/4 cup grated parmesan', 'black pepper', 'salt'],
    steps: ['Boil the spaghetti until tender. Save 1 cup of the pasta water, then drain.', 'Cook the bacon in a pan until crispy.', 'Whisk the eggs with the parmesan and lots of black pepper.', 'Turn off the heat, add the hot pasta to the bacon, then quickly stir in the egg mix.', 'Add a splash of pasta water until the sauce is creamy, not scrambled.', 'Serve right away with extra cheese.'] },
  { keys: ['burrito bowl', 'burrito', 'taco', 'quesadilla', 'fajita'], label: 'Burrito Bowl', emoji: 'BURRITO', kind: 'savory', cuisine: 'mexican', time: 30, servings: 4,
    summaryLead: 'Build a bowl of rice, beans, seasoned protein, and fresh toppings.',
    ingredients: ['2 cups cooked rice', '1 can black beans, drained', '1 lb chicken or beef, diced', '1 tsp cumin', '1 tsp chili powder', 'toppings: cheese, salsa, lettuce, avocado'],
    steps: ['Season the protein with cumin, chili powder, and salt.', 'Cook it in a hot pan until browned and cooked through.', 'Warm the beans in a small pot.', 'Scoop the rice into bowls as the base.', 'Add the protein and beans on top.', 'Finish with cheese, salsa, lettuce, and avocado.'] },
  { keys: ['pad thai', 'lo mein', 'chow mein', 'stir fry', 'stir-fry', 'noodle'], label: 'Noodle Stir-Fry', emoji: 'NOODLE', kind: 'savory', cuisine: 'asian', time: 25, servings: 3,
    summaryLead: 'Stir-fry noodles with veggies and a sweet-savory sauce in a hot pan.',
    ingredients: ['8 oz noodles', '2 tbsp soy sauce', '1 tbsp brown sugar', '1 tbsp oil', '2 cups mixed veggies', '1 cup protein (chicken, shrimp, or tofu)', '2 cloves garlic, minced'],
    steps: ['Cook the noodles per the package, then drain.', 'Mix the soy sauce and brown sugar to make the sauce.', 'Heat the oil in a big pan and cook the protein until done.', 'Add the garlic and veggies and stir-fry for 3 minutes.', 'Add the noodles and the sauce, and toss everything together.', 'Cook 2 more minutes, then serve hot.'] },
  { keys: ['ramen', 'pho'], label: 'Noodle Soup Bowl', emoji: 'NOODLE', kind: 'savory', cuisine: 'asian', time: 30, servings: 2,
    summaryLead: 'Simmer a flavorful broth and pour it over noodles and toppings.',
    ingredients: ['4 cups broth', '1 tbsp soy sauce', '1 tsp grated ginger', '2 portions noodles', '1 soft-boiled egg', 'green onions', 'your favorite protein'],
    steps: ['Heat the broth with the soy sauce and ginger until it simmers.', 'Cook the noodles separately, then drain.', 'Put the noodles in bowls.', 'Pour the hot broth over the noodles.', 'Top with the egg, green onions, and protein.', 'Slurp it up while it is hot.'] },
  { keys: ['tikka masala', 'curry', 'korma', 'tikka'], label: 'Creamy Curry', emoji: 'CREAMY', kind: 'savory', cuisine: 'indian', time: 35, servings: 4,
    summaryLead: 'Simmer protein in a spiced tomato-cream sauce and serve over rice.',
    ingredients: ['1 lb chicken or chickpeas', '1 can crushed tomatoes', '1/2 cup cream or coconut milk', '1 onion, chopped', '2 tsp garam masala', '2 cloves garlic, minced', 'cooked rice to serve'],
    steps: ['Cook the onion and garlic in a little oil until soft.', 'Stir in the garam masala and cook 1 minute so it smells fragrant.', 'Add the tomatoes and simmer for 10 minutes.', 'Add the protein and cook until done.', 'Stir in the cream and simmer 5 more minutes.', 'Serve over rice.'] },
  { keys: ['burger', 'cheeseburger', 'smash'], label: 'Smash Burger', emoji: 'SMASH', kind: 'savory', cuisine: 'american', time: 20, servings: 2,
    summaryLead: 'Smash beef into thin patties, melt cheese on top, and stack on a toasted bun.',
    ingredients: ['1/2 lb ground beef', '2 burger buns', '2 slices cheese', 'salt and pepper', 'lettuce, tomato, pickles', 'ketchup and mustard'],
    steps: ['Roll the beef into 2 balls and season with salt and pepper.', 'Heat a pan until very hot, then press each ball flat into a thin patty.', 'Cook 2 minutes, flip, add cheese, and cook 1 more minute.', 'Toast the buns in the same pan.', 'Stack the patty, lettuce, tomato, and pickles on the bun.', 'Add ketchup and mustard, then dig in.'] },
  { keys: ['pizza', 'margherita'], label: 'Margherita Pizza', emoji: 'MARGHERITA', kind: 'savory', cuisine: 'italian', time: 30, servings: 2,
    summaryLead: 'Top dough with sauce, cheese, and basil, then bake until bubbly.',
    ingredients: ['1 ball pizza dough', '1/2 cup tomato sauce', '1 cup mozzarella', 'fresh basil', '1 tbsp olive oil', 'salt'],
    steps: ['Heat the oven as hot as it goes (about 500°F).', 'Stretch the dough into a circle on a tray.', 'Spread the tomato sauce over it, leaving a border.', 'Add the mozzarella and a pinch of salt.', 'Bake 8–10 minutes, until the crust is golden and the cheese bubbles.', 'Top with fresh basil and a drizzle of olive oil.'] },
  { keys: ['poke', 'grain bowl', 'buddha bowl', 'rice bowl'], label: 'Poke / Grain Bowl', emoji: 'POKE', kind: 'savory', cuisine: 'asian', time: 20, servings: 2,
    summaryLead: 'Pile rice with protein, crunchy veggies, and a quick sauce.',
    ingredients: ['2 cups cooked rice', '1 cup protein (salmon, tofu, or chicken)', '1 cup chopped veggies (cucumber, carrot, edamame)', '2 tbsp soy sauce', '1 tsp sesame oil', 'avocado, sesame seeds'],
    steps: ['Scoop the rice into bowls.', 'Mix the soy sauce and sesame oil to make the sauce.', 'Add the protein on top of the rice.', 'Add the veggies and avocado around the bowl.', 'Drizzle the sauce over everything.', 'Sprinkle with sesame seeds and serve.'] },
  { keys: ['fried chicken', 'nashville', 'tenders', 'nuggets'], label: 'Crispy Fried Chicken', emoji: 'CRISPY', kind: 'savory', cuisine: 'american', time: 35, servings: 4,
    summaryLead: 'Coat chicken in seasoned flour and fry until golden and crunchy.',
    ingredients: ['1 lb chicken pieces', '1 cup flour', '1 tsp paprika', '1 tsp garlic powder', '1 egg, beaten', 'oil for frying', 'salt and pepper'],
    steps: ['Mix the flour with paprika, garlic powder, salt, and pepper.', 'Dip each piece of chicken in the egg, then coat it in the flour mix.', 'Heat about 1 inch of oil in a pan over medium-high heat.', 'Fry the chicken until golden, about 6 minutes per side.', 'Place the cooked chicken on paper towels to drain.', 'Let it rest a couple minutes, then serve.'] },
  { keys: ['mac and cheese', 'mac & cheese', 'macaroni'], label: 'Mac and Cheese', emoji: 'MAC', kind: 'savory', cuisine: 'american', time: 25, servings: 4,
    summaryLead: 'Make a cheesy sauce and stir in cooked macaroni until gooey.',
    ingredients: ['2 cups macaroni', '2 tbsp butter', '2 tbsp flour', '2 cups milk', '2 cups shredded cheddar', 'salt and pepper'],
    steps: ['Boil the macaroni until tender, then drain.', 'Melt the butter in a pot, then stir in the flour for 1 minute.', 'Slowly whisk in the milk and cook until it thickens.', 'Stir in the cheese until the sauce is smooth.', 'Add the macaroni and stir until coated.', 'Season with salt and pepper, then serve.'] },
  { keys: ['caesar', 'salad'], label: 'Big Crunchy Salad', emoji: 'BIG', kind: 'savory', cuisine: 'american', time: 15, servings: 2,
    summaryLead: 'Toss crisp greens with toppings and a simple dressing.',
    ingredients: ['1 head romaine, chopped', '1/4 cup dressing', '1/2 cup croutons', '1/4 cup parmesan', '1 cup protein (optional)', 'black pepper'],
    steps: ['Wash and dry the lettuce, then chop it into a big bowl.', 'Add the protein if you are using it.', 'Pour the dressing over the top.', 'Toss until every leaf is lightly coated.', 'Add the croutons and parmesan.', 'Finish with black pepper and serve.'] },
];

function detectDish(name) {
  const t = (name || '').toLowerCase();
  let best = null;
  for (const d of DISH_LIBRARY) {
    for (const k of d.keys) {
      if (t.includes(k) && (!best || k.length > best.len)) best = { dish: d, len: k.length };
    }
  }
  return best ? best.dish : null;
}

const PROTEINS = ['chicken', 'beef', 'steak', 'pork', 'shrimp', 'salmon', 'tofu', 'turkey', 'fish', 'lamb'];
// Renamed from `BASES` (its original recipeAlchemist.js name) to avoid
// colliding with remixEngine's exported `BASES` below — see file header.
const GENERIC_DISH_BASES = [['rice', '2 cups cooked rice'], ['noodle', '8 oz noodles'], ['pasta', '12 oz pasta'], ['bread', '2 slices bread'], ['tortilla', '2 tortillas'], ['lettuce', '4 cups greens'], ['potato', '3 potatoes']];

function genericDish(name) {
  const t = (name || '').toLowerCase();
  const protein = PROTEINS.find(p => t.includes(p));
  const base = GENERIC_DISH_BASES.find(([k]) => t.includes(k));
  return {
    label: 'Home Version', emoji: 'HOME', kind: 'savory', cuisine: 'world', time: 30, servings: 4,
    summaryLead: 'Cook the main parts, bring them together with a simple sauce, and season until it tastes great.',
    ingredients: [
      base ? base[1] : '2 cups of your favorite base (rice, noodles, or greens)',
      protein ? `1 lb ${protein}` : '1 lb protein or 1 can beans',
      '1 onion, chopped', '2 cloves garlic, minced',
      '2 tbsp sauce (soy, tomato, or your favorite)', 'salt and pepper',
    ],
    steps: [
      'Cook the base (rice, noodles, or greens) and set it aside.',
      'Cook the onion and garlic in a little oil until soft.',
      'Add the protein and cook until done.',
      'Stir in the sauce and let it warm through.',
      'Add the base back in and toss everything together.',
      'Season with salt and pepper, taste, and adjust until it is just right.',
    ],
  };
}

export function recreateDish(name) {
  const arch = detectDish(name) || genericDish(name);
  const dishName = titleCase((name || '').trim()) || arch.label;
  const summary = `${arch.summaryLead} It comes out savory and satisfying. Ready in about ${arch.time} minutes and makes ${arch.servings}.`;
  return {
    id: `alc-dish-${(name || 'dish').toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`,
    name: dishName,
    format: 'restaurant',
    formatLabel: 'Restaurant Recreation',
    theme: dishName.toLowerCase(),
    kind: arch.kind,
    emoji: arch.emoji,
    cuisine: arch.cuisine,
    difficulty: 'Easy',
    time: arch.time, totalTime: arch.time, servings: arch.servings,
    summary, description: summary, note: 'a restaurant favorite, made at home',
    ingredients: arch.ingredients,
    instructions: arch.steps,
    archetype: arch.label,
    _recreated: true,
  };
}

/* ── Pairing AI — compile a full meal that pleases the user ───────── */
const SIDES = {
  italian:  ['warm garlic bread', 'a simple arugula salad'],
  mexican:  ['tortilla chips and guacamole', 'street corn (elote)'],
  asian:    ['steamed edamame', 'a cucumber side salad'],
  indian:   ['warm naan bread', 'cooling cucumber raita'],
  american: ['crispy fries', 'a crunchy coleslaw'],
  world:    ['a fresh green salad', 'roasted veggies'],
};
const DRINKS = {
  italian:  ['sparkling water with lemon', 'an Italian soda'],
  mexican:  ['a tangy limeade', 'horchata'],
  asian:    ['iced green tea', 'a cold lychee drink'],
  indian:   ['a sweet mango lassi', 'iced chai'],
  american: ['a classic lemonade', 'an iced tea'],
  world:    ['sparkling water with lime', 'an iced tea'],
};
const SWEET_FORMATS = ['Cookie', 'Brownie', 'Cake', 'Cupcake', 'Pie', 'Cinnamon Roll'];

export function pairMeal(recipe) {
  const cuisine = recipe.cuisine && SIDES[recipe.cuisine] ? recipe.cuisine : 'world';
  const stats = getAlchemistStats();
  let dessert;
  if (recipe.kind === 'sweet') {
    dessert = 'a scoop of vanilla ice cream on the side';
  } else if (stats.topFormatLabel && SWEET_FORMATS.includes(stats.topFormatLabel)) {
    dessert = `a homemade ${stats.topFormatLabel.toLowerCase()} (your favorite!)`;
  } else {
    dessert = 'two warm chocolate-chip cookies';
  }
  const seed = (recipe.name || '').length;
  const pick = (arr, n) => arr[(seed + n) % arr.length];
  return { side: pick(SIDES[cuisine], 0), drink: pick(DRINKS[cuisine], 1), dessert };
}

/* ── The main act: create a recipe from a request ─────────────────── */
export function alchemize(text, opts = {}) {
  const parsed = parseRequest(text);
  const formatKey = opts.format || parsed.format;

  // 1. A format mash-up ("apple pie cookie", or a chosen format chip)
  if (formatKey && FORMATS[formatKey]) {
    const fmt = FORMATS[formatKey];
    const theme = parsed.theme;
    const flavor = resolveFlavor(theme, fmt.kind);
    const built = fmt.build(titleCase(theme), flavor);
    let name = theme ? `${titleCase(theme)} ${fmt.label}` : `Classic ${fmt.label}`;
    if (formatKey === 'cookie' && !theme) name = 'Chocolate Chip Cookies';    // default cookie base
    if (formatKey === 'brownie' && /blond/.test(theme)) name = 'Blondie Bars';
    const summary = `${fmt.summaryLead} It comes out ${flavor.note}. Ready in about ${fmt.time} minutes and makes ${fmt.servings}.`;
    const recipe = {
      id: `alc-${formatKey}-${theme.replace(/\s+/g, '-') || 'classic'}-${Date.now().toString(36)}`,
      name, format: formatKey, formatLabel: fmt.label, theme,
      kind: flavor.sweet ? 'sweet' : 'savory', emoji: fmt.emoji,
      cuisine: flavor.sweet ? 'world' : 'world',
      difficulty: 'Easy', time: fmt.time, totalTime: fmt.time, servings: fmt.servings,
      summary, description: summary, note: flavor.note,
      ingredients: built.ingredients, instructions: built.steps, _alchemized: true,
    };
    recipe.pairings = pairMeal(recipe);
    record({ format: formatKey, theme, addins: flavor.addins });
    return recipe;
  }

  // 2. No format word → recreate it as a restaurant dish + pair a meal
  const dishText = (text || '').trim();
  if (dishText) {
    const recipe = recreateDish(dishText);
    recipe.pairings = pairMeal(recipe);
    record({ format: 'restaurant', theme: recipe.theme, addins: [] });
    return recipe;
  }

  return { error: 'empty' };
}

/* ── Learning store (the engine adapts over time) ─────────────────── */
function loadStore() {
  try {
    return { totalCreated: 0, byFormat: {}, byTheme: {}, byAddin: {}, recent: [], ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') };
  } catch { return { totalCreated: 0, byFormat: {}, byTheme: {}, byAddin: {}, recent: [] }; }
}
function saveStore(s) { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch {} }

function record({ format, theme, addins = [] }) {
  const s = loadStore();
  s.totalCreated += 1;
  s.byFormat[format] = (s.byFormat[format] || 0) + 1;
  if (theme) s.byTheme[theme] = (s.byTheme[theme] || 0) + 1;
  for (const a of addins) s.byAddin[a] = (s.byAddin[a] || 0) + 1;
  s.recent = [{ format, theme, at: Date.now() }, ...s.recent.filter(r => !(r.format === format && r.theme === theme))].slice(0, 24);
  saveStore(s);
}

export function getAlchemistStats() {
  const s = loadStore();
  const topFormat = Object.entries(s.byFormat).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const topThemes = Object.entries(s.byTheme).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t);
  const formatsByPopularity = FORMAT_LIST
    .map(f => ({ ...f, _uses: s.byFormat[f.key] || 0 }))
    .sort((a, b) => b._uses - a._uses);
  return {
    totalCreated: s.totalCreated,
    topFormat,
    topFormatLabel: topFormat ? (FORMATS[topFormat]?.label || 'Restaurant Dish') : null,
    topThemes,
    recent: s.recent.slice(0, 6),
    formatsByPopularity,
  };
}

/* loadRecipeBooks moved to ./recipeBooks.js (kept exported from here too). */
export { loadRecipeBooks } from './recipeBooks';

/* ════════════════════════════════════════════════════════════════════════
   Originally remixEngine.js — the "9 items, dozens of meals" engine.

   The insight, decoded from the founder's brief: most people think a new
   dish requires a new base — new dough, new starch, new technique. It
   doesn't. The base does almost none of the flavor work. The
   filling/condiment layer does all of it. Learn ONE base well (roll it,
   toast it, cook it) and you can walk it through nine completely different
   flavor worlds just by swapping what goes inside or on top — including
   the "wait, that's a thing?" move of a SAVORY cinnamon roll: same dough,
   same roll-and-slice technique, garlic and cheese instead of sugar and
   cinnamon.

   9 bases × 9 fillings = 81 real combinations, generated deterministically
   from two small tables so quality never depends on hand-writing 81
   recipes. A short list of SIGNATURES gets hand-authored copy for the
   combos worth calling out by name; everything else composes cleanly from
   the templates. Sibling in spirit to the fusionEngine section below (base
   × chemistry), simpler because the whole point here is "the base barely
   matters."
   ════════════════════════════════════════════════════════════════════════ */

// ── The 9 bases (the canvas) ─────────────────────────────────────────────────
export const BASES = [
  { id: 'roll-dough', label: 'Roll Dough', noun: 'Rolls', cookLine: 'Roll the dough out into a rectangle.', finishLine: 'Roll it up tight, slice into rounds, and bake at 375°F until golden, about 20 minutes.' },
  { id: 'toast',      label: 'Toast',      noun: 'Toast', cookLine: 'Toast good bread until golden.', finishLine: 'Layer everything on top while it’s still warm.' },
  { id: 'rice',       label: 'Rice',       noun: 'Rice Bowl', cookLine: 'Cook the rice and let it cool for a minute.', finishLine: 'Fold everything through and serve warm.' },
  { id: 'potato',     label: 'Baked Potato', noun: 'Baked Potato', cookLine: 'Bake or microwave the potato until fully tender.', finishLine: 'Split it open, fluff the inside, and pile everything in.' },
  { id: 'eggs',       label: 'Eggs',       noun: 'Omelette', cookLine: 'Whisk the eggs and cook them low and slow.', finishLine: 'Fold everything in just before they fully set.' },
  { id: 'oats',       label: 'Oats',       noun: 'Oats', cookLine: 'Cook the oats with milk or water until creamy.', finishLine: 'Stir everything through and top it off.' },
  { id: 'tortilla',   label: 'Tortilla',   noun: 'Wrap', cookLine: 'Warm the tortilla until pliable.', finishLine: 'Fill it, wrap it tight, and serve whole or sliced.' },
  { id: 'pasta',      label: 'Pasta',      noun: 'Pasta', cookLine: 'Boil the pasta to al dente, saving a splash of the water.', finishLine: 'Toss everything through off the heat, loosening with pasta water.' },
  { id: 'pancake',    label: 'Pancake Batter', noun: 'Pancakes', cookLine: 'Cook the batter into pancakes on a hot griddle.', finishLine: 'Fold everything into the batter, or spoon it on top once cooked.' },
];

// ── The 9 fillings (the flavor layer — this is what actually changes) ───────
export const FILLINGS = [
  { id: 'cinnamon-sugar', label: 'Classic Cinnamon-Sugar', family: 'sweet',
    mixins: 'melted butter, brown sugar, and cinnamon', topping: 'a drizzle of cream cheese glaze' },
  { id: 'garlic-herb-cheese', label: 'Garlic-Herb-Cheese', family: 'savory',
    mixins: 'garlic butter, shredded mozzarella, and chopped parsley', topping: 'a little more parmesan' },
  { id: 'everything-bagel', label: 'Everything Bagel', family: 'savory',
    mixins: 'whipped cream cheese and everything bagel seasoning', topping: 'extra everything seasoning' },
  { id: 'buffalo-chicken', label: 'Buffalo Chicken', family: 'spicy',
    mixins: 'shredded chicken tossed in buffalo sauce and a little ranch', topping: 'crumbled blue cheese and scallion' },
  { id: 'pizza', label: 'Pizza', family: 'savory',
    mixins: 'marinara, mozzarella, and mini pepperoni', topping: 'a scatter of dried oregano' },
  { id: 'sausage-gravy', label: 'Sausage Gravy', family: 'savory',
    mixins: 'browned breakfast sausage in peppery cream gravy', topping: 'extra cracked black pepper' },
  { id: 'curry-veggie', label: 'Curry-Spiced Veggie', family: 'global',
    mixins: 'curry powder, peas, and diced potato', topping: 'a squeeze of lime and cilantro' },
  { id: 'mediterranean', label: 'Mediterranean', family: 'global',
    mixins: 'whipped feta, olives, and sundried tomato', topping: 'a drizzle of good olive oil' },
  { id: 'fruit-honey', label: 'Fruit & Honey', family: 'sweet',
    mixins: 'berries, a little lemon zest, and mascarpone', topping: 'a drizzle of honey' },
];

export const FAMILY_LABEL = { sweet: 'Sweet', savory: 'Savory', spicy: 'Spicy', global: 'Global' };

// ── Hand-authored callouts for the combos worth naming specifically ─────────
// Everything else composes from the templates below — the point is that the
// generic version should never feel broken, just less famous.
const SIGNATURES = {
  'roll-dough:garlic-herb-cheese': {
    name: 'Savory Garlic-Herb Rolls',
    lesson: 'The exact same dough, the exact same roll-and-slice technique as a cinnamon roll — swap the sugar for garlic and cheese and it stops being dessert.',
  },
  'roll-dough:pizza': {
    name: 'Pizza Rolls (Homemade)',
    lesson: 'Same roll, same bake — the filling turns breakfast pastry into a dinner side.',
  },
  'toast:everything-bagel': {
    name: 'Everything Bagel Toast',
    lesson: 'One seasoning blend does the entire transformation from "plain toast" to "bagel shop."',
  },
  'potato:buffalo-chicken': {
    name: 'Buffalo Chicken Baked Potato',
    lesson: 'The potato is just a bowl. The filling is doing 100% of the flavor work.',
  },
  'oats:fruit-honey': {
    name: 'Fruit & Honey Overnight Oats',
    lesson: 'Same base you’d make anyway — the fruit and honey are the only reason it tastes like dessert.',
  },
  'tortilla:sausage-gravy': {
    name: 'Sausage Gravy Breakfast Wrap',
    lesson: 'Biscuits-and-gravy energy, no biscuits required — the tortilla just holds it.',
  },
};

function key(baseId, fillingId) { return `${baseId}:${fillingId}`; }

/** Build one remix: the generated dish from a base + a filling. */
export function buildRemix(baseId, fillingId) {
  const base = BASES.find((b) => b.id === baseId) || BASES[0];
  const filling = FILLINGS.find((f) => f.id === fillingId) || FILLINGS[0];
  const sig = SIGNATURES[key(base.id, filling.id)];

  const dishName = sig?.name || `${filling.label} ${base.noun}`;
  const lesson = sig?.lesson ||
    `Same ${base.label.toLowerCase()}, same technique — only the filling changed. That’s the whole trick.`;

  const steps = [
    base.cookLine,
    `Work in the filling: ${filling.mixins}.`,
    base.finishLine,
    `Finish with ${filling.topping}.`,
  ];

  return { base, filling, dishName, steps, lesson, family: filling.family, isSignature: !!sig };
}

/** Every filling applied to one base, for the "9 doors from this one base" grid. */
export function remixGrid(baseId) {
  return FILLINGS.map((f) => {
    const r = buildRemix(baseId, f.id);
    return { fillingId: f.id, dishName: r.dishName, family: r.family, isSignature: r.isSignature };
  });
}

/** A random base+filling pairing, for "Surprise me." */
export function randomRemix() {
  const base = BASES[Math.floor(Math.random() * BASES.length)];
  const filling = FILLINGS[Math.floor(Math.random() * FILLINGS.length)];
  return buildRemix(base.id, filling.id);
}

/** How many distinct dishes the 9×9 matrix produces — the headline stat. */
export const TOTAL_COMBINATIONS = BASES.length * FILLINGS.length;

/* ════════════════════════════════════════════════════════════════════════
   Originally fusionEngine.js — the generative-culinary brain behind the
   Fusion Builder.

   Give it a Base Item (the *mechanics* — how a dish is assembled and
   cooked) and a Flavor Region (the *chemistry* — the aromatics, heat, fat,
   acid and umami that define a cuisine), and it constructs a brand-new
   fusion recipe by welding one onto the other. Everything is deterministic
   and local — same inputs, same dish — so it works offline and never
   invents an ingredient it can't justify. It speaks the exact JSON
   contract a frontend needs:

     { fusion_name, base_item, region, recipe_steps, flavor_bridge,
       pixel_description, nutritional_macros, pixelSpec }

   The "flavor bridge" isn't flavor text — it's built from the actual
   chemistry of the chosen ingredients (capsaicin is fat-soluble, acid cuts
   richness, umami stacks), naming the real components on the plate.
   pixelSpec feeds the Block-ify pixel renderer (see FusionPixel in the
   page) so the finished dish gets a pixel-art portrait with no photo
   required.

   NOTE: this section's own `REGIONS` (flavor-chemistry regions like
   jamaican/korean/italian) is a different, unrelated list from lib/
   regions.js's `REGIONS` (world geography regions used by recipeTransform
   .js/recipeRecommender.js) — same name, two separate concepts, kept as
   originally written since nothing in this file imports the other one.

   If you later want infinite variety, add a `mode:'fusion'` branch to
   /api/recipe-ai that returns this same shape — the UI already speaks it.
   ════════════════════════════════════════════════════════════════════════ */

// ── Base items: the mechanics ────────────────────────────────────────────────
// Each base knows how it's built (assembly), how the protein is cooked, which
// carb it leans on (+ a gluten-free swap), a baseline macro profile, and which
// pixel silhouette to draw.
export const BASE_ITEMS = [
  {
    id: 'sandwich', label: 'Sandwich', emoji: '🥪', noun: 'Sandwich',
    carb: 'brioche bun', carbGF: 'toasted gluten-free roll',
    cook: 'sear', pixel: 'sandwich',
    assemble: (s) =>
      `Pile the ${s.protein} on the bottom ${s.carb}, spoon over the ${s.sauce}, add ${s.veg}, and cap it.`,
    macros: { calories: 540, protein: 28, carbs: 46, fat: 25 },
  },
  {
    id: 'bowl', label: 'Bowl', emoji: '🍚', noun: 'Bowl',
    carb: 'jasmine rice', carbGF: 'jasmine rice',
    cook: 'sear & slice', pixel: 'bowl',
    assemble: (s) =>
      `Bed of ${s.carb}, ${s.protein} fanned on top, ${s.sauce} spooned over, finished with ${s.veg}.`,
    macros: { calories: 560, protein: 30, carbs: 62, fat: 18 },
  },
  {
    id: 'taco', label: 'Taco', emoji: '🌮', noun: 'Taco',
    carb: 'flour tortilla', carbGF: 'charred corn tortilla',
    cook: 'char', pixel: 'taco',
    assemble: (s) =>
      `Warm the ${s.carb}, load in the ${s.protein}, drizzle the ${s.sauce}, top with ${s.veg}, fold.`,
    macros: { calories: 430, protein: 23, carbs: 38, fat: 20 },
  },
  {
    id: 'pasta', label: 'Pasta', emoji: '🍝', noun: 'Pasta',
    carb: 'rigatoni', carbGF: 'rice-flour pasta',
    cook: 'brown', pixel: 'pasta',
    assemble: (s) =>
      `Toss the ${s.carb} with the ${s.sauce} and ${s.protein}, loosen with a splash of pasta water, plate, top with ${s.veg}.`,
    macros: { calories: 620, protein: 26, carbs: 74, fat: 21 },
  },
];

// ── Flavor regions: the chemistry ────────────────────────────────────────────
// heatLevel 0–4. colors feed the pixel renderer (protein / sauce / veg / accent).
// macroBias nudges the base macros toward the cuisine's fat/carb reality.
export const REGIONS = [
  {
    id: 'jamaican', label: 'Jamaican', emoji: '🇯🇲', dishWord: 'Jerk',
    protein: 'jerk chicken', vegan: 'jerk-spiced jackfruit',
    spiceBlend: 'jerk seasoning', aromatics: 'scallion, garlic, ginger & allspice',
    heat: 'scotch bonnet', heatLevel: 4, fat: 'coconut milk', creamyFat: true,
    acid: 'lime', umami: 'browning & soy', sweet: 'brown sugar', veg: 'pickled red onion', herb: 'fresh thyme',
    sauce: 'mango–scotch-bonnet aioli',
    colors: { protein: '#7a3d18', sauce: '#e8a84a', veg: '#6aaa4a', accent: '#e84a3a' },
    macroBias: { fat: 5 },
  },
  {
    id: 'korean', label: 'Korean', emoji: '🇰🇷', dishWord: 'Gochujang',
    protein: 'bulgogi beef', vegan: 'gochujang tofu',
    spiceBlend: 'gochujang glaze', aromatics: 'garlic, ginger & scallion',
    heat: 'gochugaru', heatLevel: 3, fat: 'toasted sesame oil', creamyFat: false,
    acid: 'rice vinegar', umami: 'gochujang & soy', sweet: 'grated pear', veg: 'quick-pickled cucumber', herb: 'scallion',
    sauce: 'gochujang–sesame glaze',
    colors: { protein: '#904810', sauce: '#e85030', veg: '#508828', accent: '#f8d870' },
    macroBias: { fat: 2, carbs: 3 },
  },
  {
    id: 'italian', label: 'Italian', emoji: '🇮🇹', dishWord: 'Roasted-Tomato',
    protein: 'garlic-herb chicken', vegan: 'white-bean & herb',
    spiceBlend: 'oregano & garlic', aromatics: 'garlic, oregano & chili flake',
    heat: 'chili flake', heatLevel: 1, fat: 'olive oil & parmesan', creamyFat: true,
    acid: 'roasted tomato & lemon', umami: 'parmesan & tomato', sweet: 'roasted tomato', veg: 'peppery arugula', herb: 'torn basil',
    sauce: 'roasted-tomato & basil',
    colors: { protein: '#c47a2a', sauce: '#e84a3a', veg: '#4a8a30', accent: '#f4d44a' },
    macroBias: { fat: 3 },
  },
  {
    id: 'thai', label: 'Thai', emoji: '🇹🇭', dishWord: 'Coconut-Curry',
    protein: 'lemongrass chicken', vegan: 'crispy tofu',
    spiceBlend: 'red curry paste', aromatics: 'lemongrass, garlic & ginger',
    heat: 'thai chili', heatLevel: 4, fat: 'coconut milk', creamyFat: true,
    acid: 'lime', umami: 'fish sauce', sweet: 'palm sugar', veg: 'ribboned carrot & cucumber', herb: 'thai basil & cilantro',
    sauce: 'coconut–lime curry',
    colors: { protein: '#c87820', sauce: '#f4c77a', veg: '#6aaa4a', accent: '#e8a84a' },
    macroBias: { fat: 6 },
  },
  {
    id: 'mexican', label: 'Mexican', emoji: '🇲🇽', dishWord: 'Chipotle',
    protein: 'chipotle carnitas', vegan: 'chipotle black beans',
    spiceBlend: 'adobo', aromatics: 'garlic, onion & cumin',
    heat: 'chipotle', heatLevel: 3, fat: 'avocado crema', creamyFat: true,
    acid: 'lime', umami: 'charred tomato', sweet: 'roasted pineapple', veg: 'pickled onion & radish', herb: 'cilantro',
    sauce: 'chipotle–lime crema',
    colors: { protein: '#8a4820', sauce: '#e07850', veg: '#4a8a30', accent: '#f4d44a' },
    macroBias: { fat: 3 },
  },
  {
    id: 'indian', label: 'Indian', emoji: '🇮🇳', dishWord: 'Tikka',
    protein: 'tikka chicken', vegan: 'chana-masala chickpeas',
    spiceBlend: 'garam masala', aromatics: 'garlic, ginger & cumin',
    heat: 'kashmiri chili', heatLevel: 3, fat: 'ghee & cream', creamyFat: true,
    acid: 'yogurt & lime', umami: 'tomato–onion masala', sweet: 'caramelized onion', veg: 'cucumber–onion kachumber', herb: 'cilantro',
    sauce: 'tikka masala',
    colors: { protein: '#c47a2a', sauce: '#e8a84a', veg: '#6aaa4a', accent: '#e84a3a' },
    macroBias: { fat: 4 },
  },
  {
    id: 'japanese', label: 'Japanese', emoji: '🇯🇵', dishWord: 'Miso',
    protein: 'miso-glazed salmon', vegan: 'miso-glazed eggplant',
    spiceBlend: 'miso glaze', aromatics: 'ginger, garlic & scallion',
    heat: 'shichimi togarashi', heatLevel: 1, fat: 'sesame & kewpie', creamyFat: true,
    acid: 'rice vinegar & yuzu', umami: 'miso & soy (double umami)', sweet: 'mirin', veg: 'quick-pickled cucumber', herb: 'scallion & shiso',
    sauce: 'miso–mirin glaze',
    colors: { protein: '#f07858', sauce: '#d0a848', veg: '#508828', accent: '#f8f0c0' },
    macroBias: { fat: 2 },
  },
  {
    id: 'greek', label: 'Greek', emoji: '🇬🇷', dishWord: 'Lemon-Oregano',
    protein: 'lemon-oregano souvlaki', vegan: 'marinated chickpeas',
    spiceBlend: 'lemon & oregano', aromatics: 'garlic & oregano',
    heat: 'cracked black pepper', heatLevel: 0, fat: 'olive oil & feta', creamyFat: true,
    acid: 'lemon', umami: 'feta & olives', sweet: '', veg: 'tomato & cucumber', herb: 'dill & parsley',
    sauce: 'tzatziki',
    colors: { protein: '#e8b040', sauce: '#f8f0c0', veg: '#4a8a30', accent: '#e84a3a' },
    macroBias: { fat: 3 },
  },
];

// ── Modifications: the interaction ───────────────────────────────────────────
// Each is a pure transform over the resolved dish state + macros. They stack in
// the order the user adds them, and each explains itself in the recipe.
export const MODIFICATIONS = [
  { id: 'more-protein', label: 'More protein',  emoji: '💪' },
  { id: 'vegan',        label: 'Make it vegan', emoji: '🌱' },
  { id: 'gluten-free',  label: 'Gluten-free',   emoji: '🌾' },
  { id: 'healthier',    label: 'Make it lighter', emoji: '🥗' },
  { id: 'spicier',      label: 'Spicier',       emoji: '🔥' },
];

const clamp = (n, lo = 0) => Math.max(lo, Math.round(n));

// Resolve the concrete ingredients for a base+region+mods combo.
function resolveState(base, region, mods) {
  const vegan = mods.includes('vegan');
  const gf = mods.includes('gluten-free');
  const state = {
    protein: vegan ? region.vegan : region.protein,
    carb: gf ? base.carbGF : base.carb,
    sauce: region.sauce,
    veg: region.veg,
    herb: region.herb,
    spiceBlend: region.spiceBlend,
    aromatics: region.aromatics,
    fat: region.fat,
    acid: region.acid,
    umami: region.umami,
    heat: region.heat,
    heatLevel: region.heatLevel + (mods.includes('spicier') ? 1 : 0),
    vegan, gf,
  };
  // Vegan swaps a couple of animal-fat sauces to plant versions so the
  // recipe stays honest.
  if (vegan) {
    state.sauce = region.creamyFat && /cream|feta|kewpie|aioli|crema|tzatziki/.test(region.sauce)
      ? region.sauce.replace(/aioli|crema|tzatziki|cream/i, 'cashew cream').replace(/feta|kewpie/i, 'tahini')
      : region.sauce;
    state.umami = region.umami.replace(/fish sauce/i, 'soy & miso');
  }
  return state;
}

// The recipe, built from base mechanics + region chemistry + the resolved state.
function buildSteps(base, region, state, mods) {
  const steps = [];
  const proteinIsPlant = state.vegan;

  steps.push(
    `Toss the ${state.protein} with ${state.spiceBlend} and ${state.aromatics}; let it marinate 20 minutes.`
  );

  const cookVerb = {
    sear: `Sear the ${state.protein} in a hot pan until deeply caramelized`,
    char: `Char the ${state.protein} over high heat until the edges blacken`,
    brown: `Brown the ${state.protein}, breaking it into craggy bits for surface area`,
    'sear & slice': `Sear the ${state.protein} hard, rest it, then slice against the grain`,
  }[base.cook];
  steps.push(`${cookVerb}${mods.includes('healthier') ? ' — bake or grill instead of pan-frying' : ''}.`);

  const carbStep = {
    sandwich: `Toast the ${state.carb} with a little ${state.fat} until golden.`,
    bowl: `Steam the ${state.carb} and fluff it.`,
    taco: `Blister the ${state.carb} directly over the flame.`,
    pasta: `Boil the ${state.carb} to al dente and reserve a splash of pasta water.`,
  }[base.id];
  steps.push(carbStep);

  const sweetBit = region.sweet ? `, a touch of ${region.sweet}` : '';
  steps.push(
    `Whisk the ${state.sauce}: ${state.fat}, ${state.acid}, ${state.umami}${sweetBit}, and ${state.heat} to taste.`
  );

  steps.push(base.assemble(state));

  steps.push(`Finish with ${state.herb} and a squeeze of ${state.acid}.`);

  if (mods.includes('more-protein')) {
    steps.splice(2, 0, `Double the ${state.protein}${proteinIsPlant ? '' : ', or fold in a soft egg / extra beans'} for a bigger protein hit.`);
  }
  return steps;
}

// The flavor bridge: real chemistry, naming the real ingredients on the plate.
function buildBridge(region, state) {
  const parts = [];
  if (state.heatLevel >= 2 && region.creamyFat) {
    parts.push(
      `Capsaicin from the ${state.heat} is fat-soluble, so the ${region.fat} in the ${state.sauce} binds it into a rounded, lingering heat instead of a sharp burn — a heat-fat emulsion.`
    );
  } else if (state.heatLevel >= 2) {
    parts.push(
      `The ${state.heat} brings clean, upfront heat that the ${region.acid} keeps from turning harsh.`
    );
  }
  parts.push(
    `The ${region.acid} cuts the richness of the ${region.fat} and lifts the ${region.umami}, so each bite resets bright instead of going heavy.`
  );
  parts.push(
    `Layered umami from ${region.umami} deepens the savory base and makes the dish read slow-cooked, even though it isn't.`
  );
  return parts.join(' ');
}

// Macros: base profile → region bias → modification deltas.
function buildMacros(base, region, mods) {
  const m = { ...base.macros };
  const bias = region.macroBias || {};
  m.fat = clamp(m.fat + (bias.fat || 0));
  m.carbs = clamp(m.carbs + (bias.carbs || 0));

  if (mods.includes('more-protein')) { m.protein += 18; m.fat += 6; }
  if (mods.includes('vegan'))        { m.protein = clamp(m.protein - 6); m.fat = clamp(m.fat - 3); }
  if (mods.includes('gluten-free'))  { m.carbs = clamp(m.carbs - 4); }
  if (mods.includes('healthier'))    { m.fat = clamp(m.fat - 10); m.carbs = clamp(m.carbs - 8); }

  m.calories = clamp(m.protein * 4 + m.carbs * 4 + m.fat * 9);
  return {
    calories: m.calories,
    protein_g: m.protein,
    carbs_g: m.carbs,
    fat_g: m.fat,
  };
}

// The pixel spec + human-readable description of the finished dish.
function buildPixel(base, region, state) {
  const c = region.colors;
  const shapeWord = { sandwich: 'stacked sandwich', bowl: 'rounded bowl', taco: 'folded taco', pasta: 'plated pasta nest' }[base.id];
  const description =
    `A blocky ${shapeWord}: charred ${state.protein} in deep warm brown, ` +
    `a glowing ${region.dishWord.toLowerCase()} ${state.sauce} in bright orange-red, ` +
    `flecks of green ${state.veg}, and a golden accent highlight — pixel-art, chunky outlines.`;
  return {
    base: base.pixel,
    colors: c,
    label: `${region.label} ${region.dishWord} ${base.noun}`,
    description,
  };
}

/** Construct a fusion dish. mods is an array of MODIFICATIONS ids (may be empty). */
export function buildFusion(baseId, regionId, mods = []) {
  const base = BASE_ITEMS.find((b) => b.id === baseId) || BASE_ITEMS[0];
  const region = REGIONS.find((r) => r.id === regionId) || REGIONS[0];
  const state = resolveState(base, region, mods);

  const modLabels = mods
    .map((id) => MODIFICATIONS.find((m) => m.id === id)?.label)
    .filter(Boolean);

  return {
    fusion_name: `${region.label} ${region.dishWord} ${base.noun}`,
    base_item: base.label,
    region: region.label,
    recipe_steps: buildSteps(base, region, state, mods),
    flavor_bridge: buildBridge(region, state),
    pixel_description: buildPixel(base, region, state).description,
    nutritional_macros: buildMacros(base, region, mods),
    pixelSpec: buildPixel(base, region, state),
    modifications: modLabels,
  };
}
