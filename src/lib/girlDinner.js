/* girlDinner.js — the data + math behind "Girl Dinner, Elevated".

   The thesis (see the page header): "girl dinner" wins because it has almost
   zero activation energy — no real cooking, barely any dishes, no way to fail.
   That's a feature, not laziness. The trap is that low-effort usually gets
   paired with low-INVESTMENT: the cheapest product, a forgettable plate, and
   the boredom that sent you to the fridge is still sitting there afterward.

   So every plate below keeps the girl-dinner effort exactly where it is (still
   no-cook or one-vessel, still 1-2 things to wash) and changes only ONE thing:
   where the money goes. Each plate names the single product worth NOT going
   cheap on, and — where a reputable brand is just a markup on something you can
   assemble yourself — the DIY dupe and what you stop paying for it.

   Costs are honest per-serving grocery estimates, a guide not accounting.
   dupeSavings() annualizes at a modest habit frequency so the number is real
   without being fantasy. This is a sibling in spirit to copycatSavings.js. */

// The honest low-energy states someone is actually in when they open this.
// A plate can answer more than one; chips filter on these ids.
export const MOODS = [
  { id: 'no-dishes',   emoji: '🍽️', label: "Can't face dishes" },
  { id: 'zero-energy', emoji: '🔋', label: 'Running on empty' },
  { id: 'broke',       emoji: '💸', label: 'Broke but bored' },
  { id: 'salty',       emoji: '🧂', label: 'Salty & crunchy' },
  { id: 'sweet',       emoji: '🍯', label: 'Something sweet' },
  { id: 'cozy',        emoji: '🫕', label: 'Warm & cozy' },
  { id: 'protein',     emoji: '💪', label: 'Chasing protein' },
  { id: 'light',       emoji: '🌤️', label: 'Want something lighter' },
];

// ── Why "lighter" plates below aim for satisfying, not just low-number ──────
// Grounded in the actual research on satiety (Encyclopedia of Food Science &
// Nutrition): fullness comes from three sources at once — SENSORY (variety,
// texture, flavor intensity), PHYSIOLOGICAL (protein/fiber slowing digestion),
// and SOCIAL/CULTURAL (plate presentation, portion norms) — not calorie count
// alone. The research also notes a real medical consensus against cutting
// starchy-food energy too far. So the calorie figure on each "light" plate
// is an honest estimate for reference, not the point of the plate — the
// point is hitting all three satiety levers so a smaller plate still reads
// as a full one, the same "girl dinner" no-real-cooking bar as everything
// else on this page.
export const SATIETY_PRINCIPLE = {
  summary: 'Fullness comes from sensory variety + protein/fiber + how the plate looks — not the calorie number alone.',
  levers: [
    { id: 'sensory',       label: 'Sensory variety', why: 'Repeating the exact same bite gets less satisfying each time (habituation) — a few different textures/flavors on the plate reads as more filling than one big pile of one thing.' },
    { id: 'physiological', label: 'Protein + fiber',  why: 'These slow digestion and genuinely delay hunger returning — the reason a lighter plate built around them holds you longer than the same calories in refined carbs alone.' },
    { id: 'social',        label: 'How it looks',      why: 'Portion size and plating are judged culturally, not just physiologically — the same food on a full plate reads as more satisfying than scraps on a big empty one.' },
  ],
};

// How much cleanup + how much cooking, shown as honest badges.
// effort: 'no-cook' (assemble only) | 'one-vessel' (one pan/pot/bowl, that's it)

export const GIRL_DINNERS = [
  {
    id: 'snack-plate',
    title: 'The Real Snack Plate',
    moods: ['no-dishes', 'salty'],
    effort: 'no-cook',
    cleanup: '1 board · 0 pans',
    plate: 'Cheese, a few olives, cured meat, crackers, a drizzle of honey.',
    steps: ['Put things on a board.', 'That is the entire recipe.'],
    cheapOut: {
      name: 'Individually-wrapped "cheese product" + value crackers',
      cost: 2.40,
      verdict: 'Tastes like the inside of the fridge. Forgotten by 9pm.',
    },
    worthIt: {
      name: 'A wedge of real aged cheddar or manchego + good crackers',
      cost: 4.10,
      upgrade: 'ONE good cheese',
      why: 'A single real cheese carries the whole plate. Everything else is a supporting actor — buy those cheap.',
    },
    payoff: 'Exactly the same zero cooking. Tastes like a wine bar instead of a vending machine.',
  },

  {
    id: 'yogurt-bowl',
    title: "A Yogurt Bowl That Isn't Sad",
    moods: ['sweet', 'zero-energy', 'light'],
    effort: 'no-cook',
    cleanup: '1 bowl · 1 spoon',
    plate: 'Thick plain Greek yogurt, frozen berries, real honey, a handful of nuts.',
    calories: 260,
    satietyWhy: 'Greek yogurt\'s protein is the physiological lever here — it\'s why this holds you longer than the same calories in a pastry.',
    steps: ['Scoop yogurt.', 'Pile on berries + nuts.', 'Drizzle honey to taste.'],
    cheapOut: {
      name: 'Sugary fruit-on-the-bottom cup',
      cost: 1.30,
      verdict: 'Half sugar-syrup. Spikes, then you\'re hungry again in an hour.',
    },
    worthIt: {
      name: 'Full-fat plain Greek yogurt you sweeten yourself',
      cost: 0.85,
      upgrade: 'Plain, full-fat, high-protein',
      why: 'You control the sugar and the protein actually keeps you full. Cheaper per serving AND better — the rare case where investing costs less.',
    },
    dupeDupe: {
      brand: 'Branded "high-protein" yogurt cup',
      storeCost: 2.20,
      homeCost: 0.85,
      how: 'Plain Greek yogurt + your own fruit is the same cup without the marketing.',
    },
    payoff: 'The girl-dinner move, minus the 3pm crash it usually comes with.',
  },

  {
    id: 'tinned-fish',
    title: 'The Tinned Fish Moment',
    moods: ['salty', 'no-dishes', 'broke'],
    effort: 'no-cook',
    cleanup: '1 plate · a fork',
    plate: 'Good sardines or mackerel on toast, lemon, olive oil, flaky salt.',
    steps: ['Toast the bread.', 'Fork the fish on top.', 'Squeeze lemon, drizzle oil, salt.'],
    cheapOut: {
      name: 'Cheapest no-name oil-packed tin on white bread',
      cost: 1.60,
      verdict: 'Mushy and one-note fishy. The reason people think they hate sardines.',
    },
    worthIt: {
      name: 'One good tin of olive-oil sardines + real sourdough',
      cost: 3.50,
      upgrade: 'The tin',
      why: "The whole plate IS the fish — this is the one line item to spend on. The internet's favorite dinner is only good with a good tin.",
    },
    payoff: 'No stove, no dishes, and it eats like a $16 small plate.',
  },

  {
    id: 'ramen-rules',
    title: 'Instant Ramen, Restaurant Rules',
    moods: ['cozy', 'broke', 'zero-energy'],
    effort: 'one-vessel',
    cleanup: '1 pot',
    plate: 'Instant noodles, one egg, a handful of frozen greens, chili crisp, sesame oil.',
    steps: ['Boil noodles.', 'Crack the egg in for the last minute.', 'Stir in greens; finish with chili crisp + sesame oil.'],
    cheapOut: {
      name: 'The packet exactly as-is, dust and all',
      cost: 0.45,
      verdict: 'Salt and sadness in a styrofoam cup.',
    },
    worthIt: {
      name: 'Same packet + one jar of chili crisp (uses half the dust)',
      cost: 1.35,
      upgrade: 'A jar of chili crisp',
      why: 'One jar lasts months and upgrades a hundred lazy meals. Use half the seasoning packet and let the crisp do the flavor.',
    },
    payoff: 'Still six minutes and one pot. Now it\'s actually dinner.',
  },

  {
    id: 'diy-iced-coffee',
    title: 'DIY the $6 Iced Latte',
    moods: ['sweet', 'broke'],
    effort: 'no-cook',
    cleanup: '1 glass',
    plate: 'Cold brew concentrate, milk of choice, real vanilla, a spoon of maple.',
    steps: ['Fill a glass with ice.', 'Half concentrate, half milk.', 'Vanilla + maple to taste, stir.'],
    cheapOut: {
      name: 'The chain vanilla iced latte, on the way in',
      cost: 6.15,
      verdict: 'Great — but you already know how to make this exact drink.',
    },
    worthIt: {
      name: 'Cold brew concentrate + real vanilla extract at home',
      cost: 0.85,
      upgrade: 'Real vanilla + good concentrate',
      why: 'The chain sells consistency, and consistency is easy to own. Buy the two things that matter and skip the counter line.',
    },
    dupeDupe: {
      brand: 'Chain vanilla iced latte',
      storeCost: 6.15,
      homeCost: 0.85,
      how: 'Concentrate + milk + real vanilla + a touch of maple = the same glass. This is a Copycat Lab move.',
    },
    payoff: 'Same drink, in your own kitchen, for the price of the ice.',
  },

  {
    id: 'egg-white-trio',
    title: 'The 3-Ingredient Trio',
    moods: ['light', 'no-dishes', 'salty'],
    effort: 'one-vessel',
    cleanup: '1 pan',
    plate: 'Egg whites scrambled with salsa, topped with a quarter of an avocado.',
    calories: 190,
    satietyWhy: 'Protein (eggs) + fat (avocado) + big flavor (salsa) hits all three satiety levers in three ingredients — the whole idea behind a good trio.',
    steps: ['Scramble egg whites in a dry non-stick pan.', 'Stir in salsa off the heat.', 'Top with sliced avocado.'],
    cheapOut: {
      name: 'A frozen "diet" breakfast sandwich',
      cost: 2.20,
      verdict: 'Spongy and forgettable — gone in four bites, hungry again in an hour.',
    },
    worthIt: {
      name: 'A carton of real egg whites + a good chunky salsa',
      cost: 1.60,
      upgrade: 'A salsa you\'d actually choose to eat on its own',
      why: 'The salsa is doing all the flavor work here since there\'s so little else on the plate — it\'s the one thing worth not going cheap on.',
    },
    payoff: 'Three ingredients, one pan, and it actually holds you — the whole point of a trio.',
  },

  {
    id: 'big-salad-not-sad',
    title: 'The Big Salad That Isn\'t Sad',
    moods: ['light', 'protein', 'zero-energy'],
    effort: 'no-cook',
    cleanup: '1 bowl',
    plate: 'A genuinely big pile of greens, shredded rotisserie chicken, and a real dressing — not three lonely lettuce leaves.',
    calories: 340,
    satietyWhy: 'Volume matters as much as calories for feeling full — this is a big, varied plate, not a small sad one, which is the actual difference between a satisfying light meal and a diet-food cliché.',
    steps: ['Pile a full bowl of mixed greens.', 'Add shredded rotisserie chicken, not a token sprinkle.', 'Dress properly — don\'t skimp on the dressing, that\'s where the satisfaction is.'],
    cheapOut: {
      name: 'A bagged "diet" salad kit, fat-free dressing',
      cost: 3.50,
      verdict: 'Small, sad, and you\'re in the fridge again in forty minutes.',
    },
    worthIt: {
      name: 'A whole rotisserie chicken (use the rest for other meals) + a real olive-oil dressing',
      cost: 2.80,
      upgrade: 'A dressing with actual fat in it',
      why: 'Fat carries flavor and helps you absorb the salad\'s nutrients — a "lite" dressing is why diet salads have a bad reputation.',
    },
    payoff: 'Genuinely a full bowl, genuinely lighter, and you don\'t need a snack forty minutes later.',
  },

  {
    id: 'diy-protein-bar',
    title: 'The $4 Protein Bar, at Home',
    moods: ['protein', 'sweet', 'broke'],
    effort: 'no-cook',
    cleanup: '1 bowl · 1 pan to line',
    plate: 'Oats, peanut butter, a scoop of protein powder, honey, dark chocolate chips — pressed into a pan and sliced.',
    steps: ['Warm peanut butter + honey until stirrable.', 'Mix in oats, protein powder, chocolate chips.', 'Press into a lined pan, chill, slice.'],
    cheapOut: {
      name: 'The gas-station protein bar, $4 a bar',
      cost: 4.00,
      verdict: 'Chalky, one bar, gone in ninety seconds, and you\'re back here again tomorrow.',
    },
    worthIt: {
      name: 'A big batch of oats, peanut butter, and protein powder you already have',
      cost: 0.90,
      upgrade: 'One tub of protein powder you actually like the taste of',
      why: 'The protein powder is doing all the work here, so it\'s the one ingredient worth not going cheap on — everything else is pantry-basic.',
    },
    dupeDupe: {
      brand: 'Name-brand protein bar, per bar',
      storeCost: 4.00,
      homeCost: 0.90,
      how: 'Same macros, same flavor idea, batched into 8 bars for less than the price of one store bar.',
    },
    payoff: 'Still zero real cooking — just a bowl and a fridge — and now the protein snack habit doesn\'t cost $30 a week.',
  },

  {
    id: 'cottage-cheese',
    title: 'Cottage Cheese, Elevated',
    moods: ['salty', 'zero-energy', 'sweet', 'light'],
    effort: 'no-cook',
    cleanup: '1 bowl · 1 spoon',
    plate: 'Full-fat cottage cheese — savory with everything seasoning + cucumber, or sweet with honey + peach.',
    calories: 220,
    satietyWhy: 'Cottage cheese is unusually high-protein for how light it feels — that\'s the physiological satiety lever, not the calorie count.',
    steps: ['Scoop cottage cheese.', 'Go savory OR sweet — never both.', 'Season and eat.'],
    cheapOut: {
      name: 'Low-fat cottage cheese, plain, straight from the tub',
      cost: 0.70,
      verdict: 'Watery and joyless. The diet-food reputation is earned here.',
    },
    worthIt: {
      name: 'Full-fat cottage cheese + a jar of everything seasoning',
      cost: 1.10,
      upgrade: 'Full-fat + a seasoning you like',
      why: 'Fat is flavor and the seasoning is 40 cents a use. High protein, genuinely craveable, still no cooking.',
    },
    payoff: 'The girl-dinner staple that suddenly tastes intentional.',
  },

  {
    id: 'toast-that-counts',
    title: 'The Toast That Counts',
    moods: ['no-dishes', 'cozy'],
    effort: 'no-cook',
    cleanup: '1 plate',
    plate: 'Ricotta or smashed avocado on real toast, olive oil, flaky salt, chili or honey.',
    steps: ['Toast good bread.', 'Spread ricotta or avocado.', 'Oil, salt, and one topping.'],
    cheapOut: {
      name: 'Value white bread + tub margarine',
      cost: 0.90,
      verdict: 'Gone in two bites, leaves no memory. You will be back in the fridge.',
    },
    worthIt: {
      name: 'One loaf of real sourdough + good olive oil',
      cost: 2.20,
      upgrade: 'The bread + the oil',
      why: 'When the dish is basically bread, the bread has to be good. A loaf and a bottle of oil upgrade a whole week of lazy plates.',
    },
    payoff: 'Two minutes, one plate, and toast you don\'t have to apologize for.',
  },

  {
    id: 'dumplings-done-right',
    title: 'Frozen Dumplings, Done Right',
    moods: ['cozy', 'zero-energy', 'no-dishes'],
    effort: 'one-vessel',
    cleanup: '1 pan',
    plate: 'Good frozen dumplings, pan-steamed crispy, with a quick dipping sauce.',
    steps: ['Fry in a splash of oil 1 min.', 'Add water, cover, steam till gone.', 'Dip in soy + vinegar + chili crisp.'],
    cheapOut: {
      name: 'The value bag, microwaved plain',
      cost: 2.30,
      verdict: 'Gummy skins, no crunch, no sauce. Filler, not dinner.',
    },
    worthIt: {
      name: 'A good frozen brand, pan-steamed + a real dipping sauce',
      cost: 3.60,
      upgrade: 'A better bag + crispy bottoms',
      why: 'The technique is free — one pan gets you crispy bottoms. The better bag and a 30-second sauce make it a meal you\'d serve someone.',
    },
    payoff: 'Restaurant-table dumplings from your freezer, one pan to wash.',
  },

  {
    id: 'popcorn-real',
    title: 'Popcorn, Not From a Bag',
    moods: ['salty', 'broke'],
    effort: 'one-vessel',
    cleanup: '1 pot',
    plate: 'Stovetop kernels, real butter, flaky salt — the movie-night snack dinner.',
    steps: ['Heat oil + 3 kernels, covered.', 'When they pop, add the rest.', 'Shake till done; real butter + salt.'],
    cheapOut: {
      name: '"Movie theater butter" microwave bag',
      cost: 1.10,
      verdict: 'Chemical butter smell, half the bag unpopped, a dollar a go.',
    },
    worthIt: {
      name: 'A jar of kernels + real butter + finishing salt',
      cost: 0.25,
      upgrade: 'Loose kernels + real butter',
      why: 'A jar of kernels is pennies per bowl and lasts forever. Real butter and good salt are the only place the money needs to go.',
    },
    dupeDupe: {
      brand: 'Microwave popcorn bag',
      storeCost: 1.10,
      homeCost: 0.25,
      how: 'Loose kernels + a pot are the same snack for a quarter of the cost and none of the mystery coating.',
    },
    payoff: 'Cheaper than the bag, better than the theater, one pot to rinse.',
  },
];

/** Plates that answer a given mood id (or all of them when moodId is null). */
export function platesForMood(moodId) {
  if (!moodId) return GIRL_DINNERS;
  return GIRL_DINNERS.filter((p) => p.moods.includes(moodId));
}

/** The money you stop paying by DIY-ing a reputable brand, per serving + per year.
    Assumes a modest ~3x/week habit so the annual figure is honest, not hype. */
export function dupeSavings(plate, perWeek = 3) {
  const d = plate?.dupeDupe;
  if (!d) return null;
  const perServing = +(d.storeCost - d.homeCost).toFixed(2);
  const perYear = Math.round(perServing * perWeek * 52);
  return { perServing, perYear, perWeek };
}

/** The extra you invest to go from the cheap-out plate to the worth-it one. */
export function upgradeCost(plate) {
  if (!plate?.cheapOut || !plate?.worthIt) return null;
  return +(plate.worthIt.cost - plate.cheapOut.cost).toFixed(2);
}

export const EFFORT_LABEL = {
  'no-cook': 'No-Cook',
  'one-vessel': 'One-Vessel',
};

// ── Read & Reset ─────────────────────────────────────────────────────────────
// The "meet yourself halfway" idea: pairing the low-effort plate with a real
// piece of writing and a walk you can actually take, instead of another hour
// of scrolling. Reads are described honestly (title/author/why), not linked
// to a specific article we can't verify still exists — the button opens a
// genuine Substack search for the topic instead of a fabricated URL. Same
// honesty rule for the walk: a real Spotify search query, deliberately not
// labeled with any "hot girl" branding — just what the walk is actually for.
export const READS = [
  { title: 'On doing less and still liking your life', author: 'a slow-living newsletter', why: 'The exact reframe: low-effort isn\'t giving up, it\'s a different kind of trying.', query: 'slow living low effort' },
  { title: 'Cooking for one without it feeling sad', author: 'a home-cooking newsletter', why: 'Permission to make something real even when no one else is watching.', query: 'cooking for one' },
  { title: 'What "treating yourself" actually costs', author: 'a personal-finance newsletter', why: 'The money side of the cheap-out vs. worth-it math on this page.', query: 'cost of treating yourself' },
  { title: 'Boredom is not an emergency', author: 'a mental-health newsletter', why: 'The feeling this whole tab is built around, named plainly.', query: 'boredom is not an emergency' },
];

export const WALK_PLAYLISTS = [
  { label: 'Clear Your Head Loop', mood: 'a plain, no-plot walk', query: 'walking clear your head playlist' },
  { label: 'Main Character Errand Run', mood: 'grocery run with a soundtrack', query: 'main character energy playlist' },
  { label: 'Golden Hour Reset', mood: 'evening, unwinding', query: 'golden hour walk playlist' },
];

export function substackSearchUrl(query) {
  return `https://substack.com/search/${encodeURIComponent(query)}`;
}
export function spotifySearchUrl(query) {
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}

// ── Spend Trail: the "food noise" money log ─────────────────────────────────
// The idea: someone can't always control the impulse to order out, but they
// CAN stay organized about what it costs them — the "least you can do" version
// of getting on top of it. A running, honest log, not a shame counter.
const SPEND_KEY = 'dig_in_food_noise_spend';

function loadSpend() {
  try { const v = JSON.parse(localStorage.getItem(SPEND_KEY)); return Array.isArray(v) ? v : []; }
  catch { return []; }
}
function saveSpend(list) { try { localStorage.setItem(SPEND_KEY, JSON.stringify(list)); } catch { /* ignore */ } }

/** Log one entry: a takeout/delivery spend, or a cooked-at-home stand-in cost. */
export function logSpend({ amount, kind }) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return loadSpend();
  const list = loadSpend();
  list.unshift({ id: Date.now(), amount: n, kind: kind === 'cooked' ? 'cooked' : 'takeout', at: Date.now() });
  saveSpend(list);
  return list;
}

export function loadSpendLog() {
  return loadSpend().slice().sort((a, b) => b.at - a.at);
}

export function removeSpendEntry(id) {
  const list = loadSpend().filter((e) => e.id !== id);
  saveSpend(list);
  return list;
}

/** This week's honest money trail: total takeout, total home-cooked stand-in
    cost, and what staying home kept in your pocket — not a judgment, just
    the number made visible. */
export function weeklySpendSummary(now = new Date()) {
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const recent = loadSpend().filter((e) => e.at >= weekAgo);
  const takeout = recent.filter((e) => e.kind === 'takeout').reduce((s, e) => s + e.amount, 0);
  const cooked = recent.filter((e) => e.kind === 'cooked').reduce((s, e) => s + e.amount, 0);
  return {
    takeout: +takeout.toFixed(2),
    cooked: +cooked.toFixed(2),
    count: recent.length,
    entries: recent,
  };
}
