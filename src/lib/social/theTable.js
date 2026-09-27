/* theTable.js — the engine behind "The Table", the app's community-warmth hub.

   The pitch, decoded from the founder's brief: the feed is exhausting because
   creators sell, pity, and manufacture chaos to get watched. The Table is the
   opposite — a calm, women-centered place to gather, with nothing trying to
   grab you. It rotates a weekly "drop" (a place visited → a playlist → the
   recipe it inspired → the conversation to have over it), deals warm
   conversation cards across the parts of life women actually talk about, and
   keeps a gentle once-a-month self check-in (a taught system, not a streak to
   shame you). Commerce, when it shows up, is an honest brand partnership — the
   app says so out loud.

   Everything is deterministic and local: the weekly drop rotates by ISO week
   so it changes on its own with no backend, and the check-in lives in
   localStorage. Sibling in spirit to cravingTracker.js (localStorage ritual)
   and the Hosting tab. */

// ── Weekly Drop ──────────────────────────────────────────────────────────────
// One "episode" per week: a place, the people met, the playlist, and the recipe
// + conversation it inspired. Playlists are real, well-known songs picked to set
// a mood — recommendations, not our tracks.
export const WEEKLY_DROPS = [
  {
    place: 'A back porch in Savannah',
    vibe: 'slow and honey-warm',
    story:
      "Miss Corinne has hosted the same Sunday supper for thirty-one years. She doesn't cook to impress — she cooks so nobody eats alone. She told me the secret to a full table is a low bar to enter it.",
    quote: '“Set one more place than you think you need. Somebody always needs it.”',
    quoteBy: 'Corinne, 74',
    question: 'Who set a place for you when you needed it?',
    playlist: {
      title: 'Porch Light',
      mood: 'unhurried Sunday',
      tracks: [
        { song: 'Lovely Day', artist: 'Bill Withers' },
        { song: 'By Your Side', artist: 'Sade' },
        { song: "You've Got a Friend", artist: 'Carole King' },
        { song: 'Come Away With Me', artist: 'Norah Jones' },
        { song: 'The Way You Look Tonight', artist: 'Frank Sinatra' },
      ],
    },
    recipe: 'Slow-Simmered Peach & Bourbon Chicken',
    recipeNote: 'Low effort, long simmer — the kind of dish that cooks while you talk.',
    recipeData: {
      "id": "table_drop_savannah",
      "name": "Slow-Simmered Peach & Bourbon Chicken",
      "description": "Low effort, long simmer — the kind of dish that cooks while you talk.",
      "difficulty": "easy",
      "time": 45,
      "ingredients": [
        "6 bone-in chicken thighs",
        "2 ripe peaches, sliced (or 1 cup frozen)",
        "1/4 cup bourbon (or apple juice)",
        "2 tbsp brown sugar",
        "2 tbsp whole-grain mustard",
        "1 cup chicken stock",
        "Salt, pepper, and fresh thyme"
      ],
      "instructions": [
        "Season the thighs well and sear skin-side down until deeply golden, about 6 minutes.",
        "Flip, then tuck the peaches, brown sugar, and mustard around the chicken.",
        "Off the heat, pour in the bourbon and let it bubble, then add the stock and thyme.",
        "Cover and simmer low for 25–30 minutes while you set the table.",
        "Uncover for the last 5 minutes to thicken the glaze. Spoon over rice."
      ],
      "country": "United States",
      "region": "North America",
      "mealBucket": "dinner"
    },
  },
  {
    place: 'A tiny kitchen in Oaxaca',
    vibe: 'bright and unbothered',
    story:
      'Rosa learned mole from her grandmother by standing on a chair to stir. She never wrote it down. "You learn it in your arms," she said — the recipe is a feeling, not a list.',
    quote: '“Perfect food is nervous food. Cook a little messy and everyone relaxes.”',
    quoteBy: 'Rosa, 58',
    question: 'Where in your life are you cooking scared — trying to be perfect instead of just present?',
    playlist: {
      title: 'Mercado Morning',
      mood: 'sunny and awake',
      tracks: [
        { song: 'September', artist: 'Earth, Wind & Fire' },
        { song: 'Signed, Sealed, Delivered', artist: 'Stevie Wonder' },
        { song: 'Tightrope', artist: 'Janelle Monáe' },
        { song: 'Valerie', artist: 'Amy Winehouse' },
        { song: 'Feeling Good', artist: 'Nina Simone' },
      ],
    },
    recipe: 'Weeknight Mole-ish Chicken Bowls',
    recipeNote: 'A shortcut mole that still tastes like someone loves you.',
    recipeData: {
      "id": "table_drop_oaxaca",
      "name": "Weeknight Mole-ish Chicken Bowls",
      "description": "A shortcut mole that still tastes like someone loves you.",
      "difficulty": "easy",
      "time": 30,
      "ingredients": [
        "2 cups shredded cooked chicken",
        "2 tbsp cocoa powder",
        "1 chipotle in adobo, minced",
        "1 tsp cumin",
        "1 tsp cinnamon",
        "1 can crushed tomatoes",
        "2 cups cooked rice",
        "Cilantro, lime, and toasted sesame to serve"
      ],
      "instructions": [
        "Toast the cumin and cinnamon in a little oil until fragrant, about 30 seconds.",
        "Stir in the chipotle, cocoa, and tomatoes; simmer 10 minutes into a glossy sauce.",
        "Fold in the shredded chicken and warm it through.",
        "Spoon over the rice bowls.",
        "Finish with cilantro, a big squeeze of lime, and sesame."
      ],
      "country": "Mexico",
      "region": "North America",
      "mealBucket": "dinner"
    },
  },
  {
    place: 'A greenhouse cafe outside Portland',
    vibe: 'green, quiet, rained-on',
    story:
      "Dana runs a supper club for women who moved to a new city alone. First rule: you can't talk about your job for the first hour. Turns out people are far more interesting than their work.",
    quote: '“Loneliness isn\'t no people. It\'s no one asking a real question.”',
    quoteBy: 'Dana, 33',
    question: 'When did someone last ask you a question that actually landed?',
    playlist: {
      title: 'Rain Check',
      mood: 'cozy introvert',
      tracks: [
        { song: 'Dreams', artist: 'Fleetwood Mac' },
        { song: 'Motion Picture Soundtrack', artist: 'Radiohead' },
        { song: 'Rivers and Roads', artist: 'The Head and the Heart' },
        { song: 'Holocene', artist: 'Bon Iver' },
        { song: 'To Be Alone With You', artist: 'Sufjan Stevens' },
      ],
    },
    recipe: 'One-Pot Garden Minestrone',
    recipeNote: 'Everything in one pot so you can actually sit down.',
    recipeData: {
      "id": "table_drop_portland",
      "name": "One-Pot Garden Minestrone",
      "description": "Everything in one pot so you can actually sit down.",
      "difficulty": "easy",
      "time": 35,
      "ingredients": [
        "2 tbsp olive oil",
        "1 onion, diced",
        "2 carrots and 2 celery stalks, chopped",
        "3 cloves garlic",
        "1 can white beans",
        "1 can diced tomatoes",
        "6 cups vegetable stock",
        "1 cup small pasta",
        "2 handfuls chopped greens",
        "Parmesan rind (optional)"
      ],
      "instructions": [
        "Sweat the onion, carrot, and celery in olive oil until soft, about 8 minutes.",
        "Add the garlic, tomatoes, beans, stock, and parmesan rind; simmer 15 minutes.",
        "Stir in the pasta and cook until just tender.",
        "Add the greens for the last 2 minutes.",
        "Season well and finish with grated parmesan."
      ],
      "country": "Italy",
      "region": "Europe",
      "mealBucket": "dinner"
    },
  },
  {
    place: 'A rooftop in Beirut',
    vibe: 'loud, generous, late',
    story:
      'Layla sets out twenty small plates and calls it "controlled chaos." Nobody is a guest for long — you get handed a knife within ten minutes. Help is how she says welcome.',
    quote: '“A guest who chops is a guest who comes back.”',
    quoteBy: 'Layla, 41',
    question: 'What job did someone hand you that made you feel part of things?',
    playlist: {
      title: 'Small Plates, Big Night',
      mood: 'warm and buzzing',
      tracks: [
        { song: 'Cornelia Street', artist: 'Taylor Swift' },
        { song: 'Electric Feel', artist: 'MGMT' },
        { song: 'Kiss Me', artist: 'Sixpence None the Richer' },
        { song: 'This Must Be the Place', artist: 'Talking Heads' },
        { song: 'Harvest Moon', artist: 'Neil Young' },
      ],
    },
    recipe: 'Mezze Board for People Who Hate Cooking',
    recipeNote: 'Twenty minutes of assembly, zero actual cooking.',
    recipeData: {
      "id": "table_drop_beirut",
      "name": "Mezze Board for People Who Hate Cooking",
      "description": "Twenty minutes of assembly, zero actual cooking.",
      "difficulty": "easy",
      "time": 20,
      "ingredients": [
        "1 tub good hummus",
        "1 tub labneh or thick yogurt",
        "Warm pita, torn",
        "Cucumbers, tomatoes, and radishes",
        "Olives and pickled turnips",
        "Olive oil, sumac, and za'atar",
        "Lemon"
      ],
      "instructions": [
        "Spread the hummus and labneh onto two plates with the back of a spoon.",
        "Drizzle generously with olive oil and dust with sumac and za'atar.",
        "Pile the cut vegetables, olives, and pickles around them.",
        "Warm the pita and tear it into the middle.",
        "Squeeze lemon over everything and hand someone a plate."
      ],
      "country": "Lebanon",
      "region": "Middle East",
      "mealBucket": "dinner"
    },
  },
  {
    place: 'A farmhouse table in Tuscany',
    vibe: 'golden and grandmotherly',
    story:
      'Nonna Pia is 81 and still makes pasta by hand every Thursday. She said the young women who visit always apologize for being "a mess." She tells them: a mess is just a life in progress.',
    quote: '“You are not behind. You are exactly where the recipe is.”',
    quoteBy: 'Pia, 81',
    question: 'Where do you feel behind — and what if you were right on time?',
    playlist: {
      title: 'Thursday Flour',
      mood: 'golden hour',
      tracks: [
        { song: 'Tu Vuò Fà L\'Americano', artist: 'Renato Carosone' },
        { song: 'La Vie en Rose', artist: 'Édith Piaf' },
        { song: 'Que Sera, Sera', artist: 'Doris Day' },
        { song: 'Moon River', artist: 'Audrey Hepburn' },
        { song: 'Sway', artist: 'Dean Martin' },
      ],
    },
    recipe: 'Forgiving Hand-Rolled Pasta',
    recipeNote: 'Ugly pasta tastes exactly as good. Roll it anyway.',
    recipeData: {
      "id": "table_drop_tuscany",
      "name": "Forgiving Hand-Rolled Pasta",
      "description": "Ugly pasta tastes exactly as good. Roll it anyway.",
      "difficulty": "medium",
      "time": 50,
      "ingredients": [
        "2 cups \"00\" or all-purpose flour",
        "2 large eggs plus 2 yolks",
        "Pinch of salt",
        "Semolina for dusting",
        "Good olive oil and parmesan to serve"
      ],
      "instructions": [
        "Mound the flour, make a well, and crack in the eggs and yolks with the salt.",
        "Beat the eggs with a fork, pulling in flour until a shaggy dough forms.",
        "Knead 8–10 minutes until smooth; rest under a bowl for 30 minutes.",
        "Roll it thin, fold, and cut into ribbons — uneven is welcome.",
        "Boil 2–3 minutes in salted water; toss with olive oil and parmesan."
      ],
      "country": "Italy",
      "region": "Europe",
      "mealBucket": "dinner"
    },
  },
  {
    place: 'A community garden in Detroit',
    vibe: 'proud and rebuilding',
    story:
      'Every Saturday, Mama Jean turns a vacant lot into a kitchen. She feeds the block and asks nothing back. "Charity keeps people small," she said. "I\'m not feeding you. We\'re eating together."',
    quote: '“Pity looks down. Company looks across.”',
    quoteBy: 'Jean, 66',
    question: 'Who looks across at you — not down on you?',
    playlist: {
      title: 'Vacant Lot Gospel',
      mood: 'grounded joy',
      tracks: [
        { song: 'Ain\'t No Mountain High Enough', artist: 'Marvin Gaye & Tammi Terrell' },
        { song: 'Lovely Day', artist: 'Bill Withers' },
        { song: 'Optimistic', artist: 'Sounds of Blackness' },
        { song: 'Golden', artist: 'Jill Scott' },
        { song: 'A Change Is Gonna Come', artist: 'Sam Cooke' },
      ],
    },
    recipe: 'Big-Batch Garden Chili',
    recipeNote: 'Made to double. Feed yourself, then feed a neighbor.',
    recipeData: {
      "id": "table_drop_detroit",
      "name": "Big-Batch Garden Chili",
      "description": "Made to double. Feed yourself, then feed a neighbor.",
      "difficulty": "easy",
      "time": 45,
      "ingredients": [
        "2 tbsp oil",
        "1 large onion and 1 bell pepper, diced",
        "3 cloves garlic",
        "2 tbsp chili powder and 1 tbsp cumin",
        "1 can each: black beans, kidney beans, crushed tomatoes",
        "1 cup corn",
        "2 cups vegetable stock",
        "Salt; toppings: cheese, onion, lime"
      ],
      "instructions": [
        "Soften the onion and pepper in oil, then add the garlic and spices; toast 1 minute.",
        "Add the tomatoes, beans, corn, and stock.",
        "Simmer uncovered 25–30 minutes, stirring now and then.",
        "Taste and season hard — chili needs salt.",
        "Serve with toppings, then ladle the second half into a jar for someone."
      ],
      "country": "United States",
      "region": "North America",
      "mealBucket": "dinner"
    },
  },
  {
    place: 'A seaside kitchen in Lisbon',
    vibe: 'salt-air and easy',
    story:
      'Inês closes her cafe every day at 3 for two hours. Not for a break — for a meal with whoever is around. "Americans eat to keep working," she laughed. "We work so we can eat like this."',
    quote: '“Rest is not the reward for the work. It\'s the point of it.”',
    quoteBy: 'Inês, 47',
    question: 'What would it take to let rest be enough this week?',
    playlist: {
      title: 'Three O\'Clock Quiet',
      mood: 'soft afternoon',
      tracks: [
        { song: 'Águas de Março', artist: 'Elis Regina & Tom Jobim' },
        { song: 'The Girl from Ipanema', artist: 'Astrud Gilberto' },
        { song: 'Fly Me to the Moon', artist: 'Julie London' },
        { song: 'Dindi', artist: 'Antônio Carlos Jobim' },
        { song: 'Corcovado', artist: 'Stan Getz & João Gilberto' },
      ],
    },
    recipe: 'Blistered Tomato & Tinned Fish Toast',
    recipeNote: 'Five minutes, tastes like a vacation.',
    recipeData: {
      "id": "table_drop_lisbon",
      "name": "Blistered Tomato & Tinned Fish Toast",
      "description": "Five minutes, tastes like a vacation.",
      "difficulty": "easy",
      "time": 10,
      "ingredients": [
        "2 thick slices good sourdough",
        "1 tin sardines or mackerel in olive oil",
        "1 cup cherry tomatoes",
        "1 clove garlic",
        "Olive oil and flaky salt",
        "Lemon and parsley"
      ],
      "instructions": [
        "Blister the tomatoes in a hot dry pan until they slump and char, about 3 minutes.",
        "Toast the sourdough and rub each slice with the raw garlic clove.",
        "Drizzle with a little olive oil from the fish tin.",
        "Fork the fish over the toast and pile on the tomatoes.",
        "Finish with flaky salt, lemon, and parsley."
      ],
      "country": "Portugal",
      "region": "Europe",
      "mealBucket": "lunch"
    },
  },
  {
    place: 'A ski-town cabin in Colorado',
    vibe: 'snowed-in and honest',
    story:
      "Priya hosts a 'no-advice dinner' once a month. You can vent about your marriage, your mother, your money — and no one is allowed to fix it. Just witnessed. She says being heard fixes more than advice does.",
    quote: '“Most women don\'t want to be solved. They want to be believed.”',
    quoteBy: 'Priya, 38',
    question: 'When did you last just need to be believed, not fixed?',
    playlist: {
      title: 'No-Advice Dinner',
      mood: 'firelit and frank',
      tracks: [
        { song: 'River', artist: 'Joni Mitchell' },
        { song: 'Landslide', artist: 'Fleetwood Mac' },
        { song: 'Vincent', artist: 'Don McLean' },
        { song: 'Skinny Love', artist: 'Bon Iver' },
        { song: 'Both Sides Now', artist: 'Joni Mitchell' },
      ],
    },
    recipe: 'Slow-Braised Beef, One Pot',
    recipeNote: 'It braises for two hours so the night has room to breathe.',
    recipeData: {
      "id": "table_drop_colorado",
      "name": "Slow-Braised Beef, One Pot",
      "description": "It braises for two hours so the night has room to breathe.",
      "difficulty": "medium",
      "time": 150,
      "ingredients": [
        "2 lb beef chuck, cut into large chunks",
        "Salt, pepper, and flour to dust",
        "1 onion and 2 carrots, chunked",
        "3 cloves garlic",
        "2 tbsp tomato paste",
        "2 cups beef stock and 1 cup red wine (or more stock)",
        "Bay leaf and thyme"
      ],
      "instructions": [
        "Season and flour the beef, then sear hard in a heavy pot until browned all over.",
        "Remove the beef; soften the onion and carrot, then stir in the garlic and tomato paste.",
        "Deglaze with the wine, scraping the bottom, then return the beef.",
        "Add the stock, bay, and thyme; cover and braise low for 2 hours until fork-tender.",
        "Rest 10 minutes — the sauce thickens as it sits. Serve over mash or bread."
      ],
      "country": "United States",
      "region": "North America",
      "mealBucket": "dinner"
    },
  },
];

const MS_WEEK = 7 * 24 * 60 * 60 * 1000;

/** ISO-ish week index since a fixed epoch, so the drop rotates weekly on its own. */
export function currentWeekIndex(now = new Date()) {
  const epoch = Date.UTC(2026, 0, 5); // a Monday
  const weeks = Math.floor((now.getTime() - epoch) / MS_WEEK);
  return ((weeks % WEEKLY_DROPS.length) + WEEKLY_DROPS.length) % WEEKLY_DROPS.length;
}

export function currentDrop(now = new Date()) {
  return WEEKLY_DROPS[currentWeekIndex(now)];
}

/** Days until the next weekly drop, for the "new drop in N days" line. */
export function daysToNextDrop(now = new Date()) {
  const epoch = Date.UTC(2026, 0, 5);
  const sinceEpoch = now.getTime() - epoch;
  const intoWeek = ((sinceEpoch % MS_WEEK) + MS_WEEK) % MS_WEEK;
  return Math.max(1, Math.ceil((MS_WEEK - intoWeek) / (24 * 60 * 60 * 1000)));
}

/* ── Episodes & the weekly answer loop ───────────────────────────────────────
   A drop is an "episode": place → playlist → recipe → the QUESTION to answer.
   Each drop now carries `question` (real, app-authored). Optional audio fields,
   all absent until a real recording exists (nothing fake ships — no stock voice
   stands in for a real woman):
     audio        a media URL — a bundled /audio/ep-*.mp3, or a file from
                  wherever the podcast is hosted. Enables the in-app player.
     duration     a display label like '14:22'.
     episodeLinks { spotify, apple, youtube } — the off-app reach layer, shown
                  as "Listen on …" chips. Reach lives on those platforms; the
                  app is the retention half.
   To publish an episode: record the guest, host the file, add `audio` (+
   `episodeLinks`) to that drop. The EpisodePlayer lights up on its own.

   The connective trick: a circle post made DURING a drop's week IS the answer
   to that week's question. So "this week's answers" and "6 of 8 answered" are
   derived from post timestamps — no new post field, no schema change. */

/** Absolute drop-week index for any date (same rotation as currentWeekIndex,
    without the modulo into the drop array — good for comparing two dates). */
export function weekEpochIndex(now = new Date()) {
  const epoch = Date.UTC(2026, 0, 5);
  return Math.floor((new Date(now).getTime() - epoch) / MS_WEEK);
}

/** Parse whatever timestamp a post carries (Supabase created_at ISO, or a
    local `at` ms) into ms, or null. */
function postMs(p) {
  if (!p) return null;
  if (p.created_at) { const t = Date.parse(p.created_at); return Number.isNaN(t) ? null : t; }
  if (typeof p.at === 'number') return p.at;
  return null;
}

/** True when a post falls inside the CURRENT drop week — i.e. it answers this
    week's question. */
export function isAnswerThisWeek(post, now = new Date()) {
  const ms = postMs(post);
  return ms != null && weekEpochIndex(ms) === weekEpochIndex(now);
}

/** The set of member ids who have answered THIS week (posted during it). */
export function answeredThisWeekIds(posts, now = new Date()) {
  const ids = new Set();
  for (const p of posts || []) if (isAnswerThisWeek(p, now) && p.user_id) ids.add(p.user_id);
  return ids;
}

/** Just this week's answers (posts), newest first — the magazine's body. */
export function answersThisWeek(posts, now = new Date()) {
  return (posts || []).filter((p) => isAnswerThisWeek(p, now)).sort((a, b) => (postMs(b) || 0) - (postMs(a) || 0));
}

/** How many DISTINCT weeks this circle has answers in — powers the "you've
    gathered N weeks together, want to actually meet?" offline unlock. */
export function distinctAnswerWeeks(posts) {
  const weeks = new Set();
  for (const p of posts || []) { const ms = postMs(p); if (ms != null) weeks.add(weekEpochIndex(ms)); }
  return weeks.size;
}

/** The back-catalogue: every drop ordered newest → oldest relative to this
    week, each tagged with how long ago it ran. Powers the archive tab. */
export function archiveDrops(now = new Date()) {
  const cur = currentWeekIndex(now);
  const n = WEEKLY_DROPS.length;
  const out = [];
  for (let ago = 0; ago < n; ago++) {
    const idx = ((cur - ago) % n + n) % n;
    const label = ago === 0 ? 'This week' : ago === 1 ? 'Last week' : `${ago} weeks ago`;
    out.push({ drop: WEEKLY_DROPS[idx], index: idx, weeksAgo: ago, label });
  }
  return out;
}

/** True once a drop has something to play — a hosted recording or platform
    links. Used to decide whether an episode control belongs on a card. */
export function dropHasEpisode(drop) {
  if (!drop) return false;
  if (drop.audio) return true;
  const l = drop.episodeLinks;
  return !!(l && (l.spotify || l.apple || l.youtube));
}

/** The listenable back-catalogue: past drops that actually have an episode,
    newest first. Empty until recordings exist — the "Past episodes" strip
    shows nothing rather than faking a feed. */
export function episodeArchive(now = new Date()) {
  return archiveDrops(now).filter(({ drop }) => dropHasEpisode(drop));
}

/** Stash a drop's recipe for the full-page recipe view (/recipe reads this). */
export function stageDropRecipe(drop) {
  if (!drop?.recipeData) return false;
  try {
    sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(drop.recipeData));
    sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    return true;
  } catch { return false; }
}

// ── Conversation cards ───────────────────────────────────────────────────────
// The things women actually talk about at a real table — dealt, not lectured.
export const CONVERSATION_DECKS = [
  {
    id: 'love', label: 'Love', emoji: '💌',
    cards: [
      'What does being loved well actually look like to you — specifically?',
      'When did you last feel chosen, not just kept?',
      'What do you give in love that you wish you received back?',
      'What did you learn about love from watching your parents — good or bad?',
      "What's a small thing that makes you feel adored?",
    ],
  },
  {
    id: 'life', label: 'Life', emoji: '🌿',
    cards: [
      'What are you adapting to right now that no one can see?',
      'What version of yourself are you quietly proud of?',
      "What's something you used to want that you've let go of — on purpose?",
      'If this season of your life had a title, what would it be?',
      'What would "enough" look like, if you let it be enough?',
    ],
  },
  {
    id: 'family', label: 'Family', emoji: '🏡',
    cards: [
      'What did your mother teach you that you\'re still unlearning?',
      'What tradition do you want to keep, and what will you leave behind?',
      "Who in your family do you wish understood you more?",
      'What kind of home are you trying to build — even alone?',
      'What did you need as a kid that you can give yourself now?',
    ],
  },
  {
    id: 'faith', label: 'Faith', emoji: '🕯️',
    cards: [
      'What do you believe in that keeps you steady?',
      'When was the last time you felt genuinely held by something bigger?',
      'What are you praying for — or hoping for — this season?',
      'What helps you forgive yourself?',
      'Where do you find quiet when everything is loud?',
    ],
  },
  {
    id: 'finances', label: 'Money', emoji: '💷',
    cards: [
      'What did you learn about money that you\'re still untangling?',
      "What's one thing you refuse to go cheap on, and why?",
      'What would financial peace — not wealth, peace — feel like?',
      'What do you spend on that actually makes your life better?',
      'What money story did you inherit that isn\'t yours to carry?',
    ],
  },
  {
    id: 'friendship', label: 'Friendship', emoji: '🤝',
    cards: [
      'What do you need from a friend that you find hard to ask for?',
      'When did another woman surprise you with kindness?',
      "Who do you want to be closer to — and what's stopping you?",
      'What kind of friend are you trying to become?',
      'Whose company makes you feel most like yourself?',
    ],
  },
];

/** Deal a random card from a deck (id), avoiding an immediate repeat. */
export function dealCard(deckId, lastCard) {
  const deck = CONVERSATION_DECKS.find((d) => d.id === deckId);
  if (!deck) return null;
  const pool = deck.cards.length > 1 ? deck.cards.filter((c) => c !== lastCard) : deck.cards;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Monthly check-in ─────────────────────────────────────────────────────────
// A gentle, taught, once-a-month self-review. Structured on purpose (kind to
// neurodivergent brains), never a streak to break or shame you.
export const CHECK_IN_PROMPTS = [
  { id: 'worked',  q: 'What system actually worked this month?', hint: 'The small thing that made a hard day easier.' },
  { id: 'adapted', q: 'Where did you adapt for the better?',     hint: 'You changed something and it helped. Name it.' },
  { id: 'frayed',  q: 'What frayed you — and one gentler response next time?', hint: 'Yelling never wins. What would land softer?' },
  { id: 'keep',    q: 'What do you want to keep, and what do you want to drop?', hint: 'Next month gets to be lighter.' },
];

const CHECK_IN_KEY = 'dig_in_table_checkins';

function loadRaw() {
  try { const v = JSON.parse(localStorage.getItem(CHECK_IN_KEY)); return Array.isArray(v) ? v : []; }
  catch { return []; }
}
function saveRaw(list) { try { localStorage.setItem(CHECK_IN_KEY, JSON.stringify(list)); } catch { /* ignore */ } }

export function loadCheckIns() { return loadRaw().slice().sort((a, b) => b.at - a.at); }

export function addCheckIn(answers) {
  const list = loadRaw();
  list.push({ id: Date.now(), at: Date.now(), answers: answers || {} });
  saveRaw(list);
  return list;
}

export function lastCheckIn() {
  const list = loadCheckIns();
  return list[0] || null;
}

/** True when there's no check-in in the current calendar month. */
export function checkInDueThisMonth(now = new Date()) {
  const last = lastCheckIn();
  if (!last) return true;
  const d = new Date(last.at);
  return !(d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth());
}

export function daysSinceCheckIn(now = new Date()) {
  const last = lastCheckIn();
  if (!last) return null;
  return Math.floor((now.getTime() - last.at) / (24 * 60 * 60 * 1000));
}

// ── Host a Table: the starter box ────────────────────────────────────────────
// Lower the barrier: you don't need to be perfect or rich, you need a small kit
// and a plan. Framed honestly as a brand partnership, not an influencer sell.
export const HOSTING_BOX = [
  { item: 'One big shareable board or platter', why: 'Everything looks like a feast on one good surface. This is the only "nice" thing you need.' },
  { item: 'A set of mismatched-on-purpose small plates', why: 'Matching sets say formal. Mismatched says relax, nobody\'s being judged here.' },
  { item: 'Cloth napkins (yes, really)', why: 'The cheapest way to make a $6 dinner feel considered. Wash and reuse forever.' },
  { item: 'A candle + a playlist', why: 'Lighting and sound do 80% of the work of "vibe" for almost no money.' },
  { item: 'A deck of the conversation cards', why: 'Removes the pressure to be interesting. The table carries the talk.' },
  { item: 'One good pantry splurge (oil, salt, or cheese)', why: 'The one place not to go cheap — it makes simple food taste hosted.' },
];

export const FIRST_TABLE_PLAN = [
  'Invite two people, not ten. Text, don\'t plan.',
  'Cook one thing that simmers, so you\'re not stuck at the stove.',
  'Light the candle, start the playlist before they arrive.',
  'Put out the board. Hand the first person a task.',
  'Deal one conversation card when it goes quiet.',
  'Send everyone home with leftovers. That\'s the whole trick.',
];

export const PARTNERSHIP_NOTE =
  "The Table doesn't sell you a lifestyle. When a brand shows up here, it's a real partnership we tell you about out loud — never a creator pretending they bought it themselves. If nothing good fits, this space stays empty on purpose.";

// ── Gather Free: a potluck coordinator, not a spending plan ─────────────────
// The problem being solved: money decides who gets to have people around
// them, and plans fall apart because nobody set a clear, low-guilt ask.
// FREE_ROLES interleaves paid and $0 jobs on purpose, so a $0 role always
// lands in the rotation no matter how few people show up — nobody is priced
// out of being included, and "I have nothing to bring" still has an answer.
export const FREE_ROLES = [
  { id: 'main',      label: 'Bring the Main',       note: 'One dish that could be dinner on its own.', cost: '~$8–12', free: false },
  { id: 'playlist',  label: 'Bring the Playlist',    note: 'Queue up this week\'s Table playlist, or your own.', cost: '$0', free: true },
  { id: 'side',      label: 'Bring a Side',          note: 'Something simple — a salad, bread, rice.', cost: '~$4–6', free: false },
  { id: 'cards',     label: 'Bring the Conversation', note: 'Deal from the conversation deck when it goes quiet.', cost: '$0', free: true },
  { id: 'drinks',    label: 'Bring Drinks',          note: 'Whatever you already drink at home is enough.', cost: '~$5', free: false },
  { id: 'cleanup',   label: 'Bring Cleanup Duty',    note: 'Stay 15 minutes after and help pack up.', cost: '$0', free: true },
  { id: 'dessert',   label: 'Bring Dessert',         note: 'Store-bought counts. Truly.', cost: '~$5', free: false },
  { id: 'supplies',  label: 'Bring Plates & Napkins', note: 'The unglamorous job that saves everyone else money.', cost: '~$3', free: false },
  { id: 'presence',  label: 'Just Bring Yourself',   note: 'If money is tight this month, this is still a yes.', cost: '$0', free: true },
];

/** Assign each guest a role, cycling the interleaved list so a $0 option is
    always somewhere in the mix — never bunched at the end where a small
    group might miss it entirely. */
export function splitRoles(guestCount) {
  const n = Math.max(1, Math.min(24, Math.round(guestCount) || 1));
  return Array.from({ length: n }, (_, i) => ({
    guestNumber: i + 1,
    role: FREE_ROLES[i % FREE_ROLES.length],
  }));
}

/** A copy-pasteable invite that sets a low bar, a soft deadline, and makes
    explicit that showing up matters more than what you bring. */
export function inviteScript({ occasion, guestCount, deadline }) {
  const assignments = splitRoles(guestCount);
  const drop = currentDrop();
  const lines = assignments.map(
    (a) => `Guest ${a.guestNumber}: ${a.role.label} (${a.role.cost}) — ${a.role.note}`
  );

  return [
    `You're invited: ${occasion || 'dinner at mine'}.`,
    '',
    `Nobody's covering the whole bill — everyone just brings one thing off this list:`,
    '',
    ...lines,
    '',
    `Feeling stuck on the playlist? "${drop.playlist.title}" — ${drop.playlist.mood} — is already queued up for you.`,
    '',
    deadline
      ? `Let me know by ${deadline} so I can shuffle roles if plans change — life happens, no guilt.`
      : `Let me know a couple days ahead if plans change — life happens, no guilt.`,
    `If you can't bring anything this time, bring yourself. That still counts as a yes.`,
  ].join('\n');
}
