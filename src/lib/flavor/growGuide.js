/* growGuide.js — real, evergreen "grow it / regrow it" knowledge for the Fresh
   tab. App-authored horticultural fact, not a live feed and not a fabricated
   brand: every entry is something you can genuinely do from scraps or seeds on
   a windowsill, a counter, or a fire escape. The point under Fresh is
   stewardship — growing (or regrowing) some of what you eat means less waste
   and a little less dependence on a supply chain that keeps getting recalled.
   (A lot of people discovered during the 2020 lockdowns that this is far easier
   and more forgiving than it looks — that's the spirit here.)

   HONESTY RULE: where something makes a nice plant but won't realistically fruit
   indoors (avocado pit, pineapple top), the tip says so — no promising a
   harvest that isn't coming.

   Shape per entry:
     id       unique key
     name     what you're (re)growing
     cat      herb | leafy | root | allium | fruiting | sprout — for grouping
     from     'regrow' (from a kitchen scrap) or 'seed'
     effort   1–3 dots of fuss
     days     honest rough time-to-usable
     space    'windowsill' | 'counter' | 'balcony' | 'grow-light' | 'deep-pot'
     how      the actual method, one line
     tip      a second, real detail that makes it work (or an honest caveat)
*/

export const GROW_ITEMS = [
  /* ── Alliums — the "you already threw this away" tier ─────────────────── */
  {
    id: 'scallions', name: 'Scallions / green onions', cat: 'allium', from: 'regrow', effort: 1, days: '5–7 days', space: 'windowsill',
    how: 'Keep the white root ends (about 1 in), stand them root-down in a glass with an inch of water on a sunny sill.',
    tip: 'Change the water every couple of days. The green tops regrow and can be cut again and again — pot them in soil after the second harvest for a longer run.',
  },
  {
    id: 'onion', name: 'Onion', cat: 'allium', from: 'regrow', effort: 2, days: '8–10 wks for greens', space: 'deep-pot',
    how: "Save the root base (the hairy bottom ~1 in) when you chop an onion, dry it a day, then plant it root-down just under the soil in a pot.",
    tip: "Indoors you're growing it for the green onion-tops (great snipped over anything), not a whole new bulb — that needs a garden bed and a full season. A sprouted onion from the back of the cupboard works too: just plant it.",
  },
  {
    id: 'garlic-greens', name: 'Garlic greens', cat: 'allium', from: 'regrow', effort: 1, days: '7–10 days', space: 'windowsill',
    how: 'A clove that\'s started to sprout? Push it pointy-end up into a little soil or even a glass of water.',
    tip: 'You won\'t get a new bulb indoors, but the green shoots are milder than a chive and great snipped over eggs or soup.',
  },
  {
    id: 'leek', name: 'Leek', cat: 'allium', from: 'regrow', effort: 1, days: '2 weeks', space: 'windowsill',
    how: 'Keep the root end (about 2 in) and stand it in a shallow glass of water, roots down, bright spot.',
    tip: 'Regrows just like scallions — refresh the water, and move to soil once it\'s established for a longer harvest.',
  },
  {
    id: 'lemongrass', name: 'Lemongrass', cat: 'herb', from: 'regrow', effort: 1, days: '2–3 weeks to roots', space: 'windowsill',
    how: 'Stand a leftover stalk with its base intact in an inch of water; roots and a new shoot appear from the middle.',
    tip: 'Pot it once roots form and it\'ll keep throwing new stalks — one grocery stalk can become an endless supply.',
  },

  /* ── Leafy greens & stems — regrow from the base ─────────────────────── */
  {
    id: 'lettuce', name: 'Romaine / leaf lettuce', cat: 'leafy', from: 'regrow', effort: 1, days: '10–14 days', space: 'windowsill',
    how: 'Save the intact bottom heart, set it cut-side up in a shallow dish with a little water, somewhere bright.',
    tip: "You won't get a whole new head, but the fresh center leaves are perfect for a sandwich or a taco. Move it to soil once roots show for more.",
  },
  {
    id: 'celery', name: 'Celery', cat: 'leafy', from: 'regrow', effort: 1, days: '2–3 weeks', space: 'windowsill',
    how: 'Cut the base off the bunch, sit it in a bowl with an inch of water; new stalks push up from the center.',
    tip: 'Once you see leafy growth and small roots, plant the base in soil up to the new shoots — that\'s when it really takes off.',
  },
  {
    id: 'bok-choy', name: 'Bok choy / pak choi', cat: 'leafy', from: 'regrow', effort: 1, days: '1–2 weeks', space: 'windowsill',
    how: 'Same as lettuce — set the root base in a little water, cut-side up, bright spot.',
    tip: 'The center regrows fast for a stir-fry green. Pot it up for a second, bigger flush.',
  },
  {
    id: 'cabbage', name: 'Cabbage', cat: 'leafy', from: 'regrow', effort: 1, days: '2 weeks', space: 'windowsill',
    how: 'Sit the leftover core in a shallow dish of water; small tender leaves regrow from the middle.',
    tip: 'Not a whole new head — a handful of baby leaves for a slaw or a wrap. Free, though.',
  },
  {
    id: 'spinach-kale', name: 'Spinach, kale & chard', cat: 'leafy', from: 'seed', effort: 2, days: '4–6 weeks', space: 'counter',
    how: 'Sow seeds in a pot of soil, thin the seedlings, and harvest outer leaves as "cut-and-come-again."',
    tip: 'Leafy greens tolerate less sun than fruiting plants — a bright counter or a north window is enough. Pick outer leaves and the plant keeps producing for weeks.',
  },

  /* ── Roots — tops, greens, and whole crops ───────────────────────────── */
  {
    id: 'carrot-tops', name: 'Carrot tops', cat: 'root', from: 'regrow', effort: 1, days: '1–2 weeks', space: 'windowsill',
    how: "Save the top inch of a carrot, sit it cut-side down in a shallow dish of water; feathery greens sprout up.",
    tip: "The carrot itself won't regrow, but the greens are real food — chop them into a chimichurri or pesto instead of composting them.",
  },
  {
    id: 'beet-turnip-tops', name: 'Beet & turnip greens', cat: 'root', from: 'regrow', effort: 1, days: '1–2 weeks', space: 'windowsill',
    how: 'Same trick as carrot tops — the cut top in a little water regrows edible leafy greens.',
    tip: 'Beet greens sautéed with garlic taste like chard. You bought the whole vegetable; this is the half most people throw out.',
  },
  {
    id: 'potatoes', name: 'Potatoes', cat: 'root', from: 'regrow', effort: 2, days: '10–12 weeks', space: 'deep-pot',
    how: 'Let a potato sprout eyes, cut it into chunks with an eye each, dry them a day, then plant a few inches deep in a deep pot or bucket.',
    tip: 'Pile more soil over the stems as they grow ("hilling") — that\'s where the new potatoes form. A 5-gallon bucket with drainage holes is plenty for a balcony.',
  },
  {
    id: 'sweet-potato', name: 'Sweet potato', cat: 'root', from: 'regrow', effort: 2, days: '4+ months', space: 'deep-pot',
    how: 'Half-submerge one in water with toothpicks until it sprouts "slips," twist those off, root them in water, then plant.',
    tip: 'The leaves are edible too (a common green across West Africa and Asia). A big pot on a sunny balcony can yield a real handful of tubers.',
  },
  {
    id: 'ginger', name: 'Ginger & turmeric', cat: 'root', from: 'regrow', effort: 2, days: '8+ weeks', space: 'counter',
    how: 'Take a knob with a visible bud ("eye"), half-bury it eye-up in a wide, shallow pot of soil, keep it warm and lightly moist.',
    tip: "It's slow but nearly hands-off and doesn't need strong sun. Harvest a piece off the edge whenever you need it and let the rest keep growing.",
  },
  {
    id: 'radish', name: 'Radishes', cat: 'root', from: 'seed', effort: 1, days: '3–4 weeks', space: 'counter',
    how: 'Sow seeds an inch apart in a pot at least 6 in deep, keep moist; they\'re one of the fastest crops there is.',
    tip: 'Genuinely beginner-proof and quick — great for kids or a first try. The leafy tops are edible too.',
  },

  /* ── Fruiting crops — need the most light, worth it on a sunny spot ───── */
  {
    id: 'tomatoes', name: 'Cherry tomatoes', cat: 'fruiting', from: 'seed', effort: 3, days: '2–3 months', space: 'balcony',
    how: 'Squeeze seeds from an overripe tomato, dry them, start indoors in a sunny window, then move to a large pot once it\'s reliably warm.',
    tip: 'They need a lot of light — 6+ hours of direct sun or a grow light. Water deep and steady to avoid split fruit and blossom-end rot.',
  },
  {
    id: 'peppers', name: 'Chili & bell peppers', cat: 'fruiting', from: 'seed', effort: 3, days: '3+ months', space: 'balcony',
    how: 'Save and dry seeds from a ripe pepper, start them warm and bright, and grow on in a good-sized pot.',
    tip: 'Peppers love warmth and patience. A sunny balcony in summer will out-produce a windowsill every time.',
  },
  {
    id: 'peas-beans', name: 'Peas & bush beans', cat: 'fruiting', from: 'seed', effort: 2, days: '6–9 weeks', space: 'balcony',
    how: 'Poke dried peas or beans (yes, from the bag) an inch into a deep pot; give peas a few sticks or string to climb.',
    tip: 'Fast, generous, and cheap from pantry beans. Even the shoots and tendrils are edible if you thin them out.',
  },
  {
    id: 'strawberries', name: 'Strawberries', cat: 'fruiting', from: 'seed', effort: 3, days: 'a full season', space: 'balcony',
    how: 'Easiest from a small nursery plant or a runner from someone else\'s; they thrive in hanging pots and railing planters.',
    tip: 'Perfect for a balcony rail where space is tight and they can trail. One plant sends out "runners" you can root into free new plants.',
  },
  {
    id: 'avocado', name: 'Avocado (from the pit)', cat: 'fruiting', from: 'regrow', effort: 2, days: 'weeks to sprout', space: 'windowsill',
    how: 'Suspend the pit broad-end down over water with toothpicks until it splits and roots; pot it once the stem is a few inches.',
    tip: "Honest truth: indoors it makes a lovely leafy houseplant but almost never fruits — grow it for the plant, not guacamole.",
  },
  {
    id: 'pineapple', name: 'Pineapple (from the top)', cat: 'fruiting', from: 'regrow', effort: 2, days: 'very slow', space: 'counter',
    how: 'Twist the leafy crown off, strip the lowest leaves, dry a day, then root it in water or straight into soil.',
    tip: 'A striking plant from a scrap — but be honest with yourself: fruiting indoors takes years and rarely happens. It\'s for the fun of it.',
  },

  /* ── Herbs & sprouts — the fastest wins in the least space ────────────── */
  {
    id: 'herbs-soft', name: 'Basil, mint, cilantro & soft herbs', cat: 'herb', from: 'regrow', effort: 2, days: '2–3 weeks to roots', space: 'windowsill',
    how: 'Snip a 4-in stem below a leaf node, strip the lower leaves, and stand it in water until white roots appear, then pot it.',
    tip: 'Mint roots almost too eagerly — give it its own pot so it doesn\'t take over. Basil hates cold, so keep it off a chilly sill at night.',
  },
  {
    id: 'microgreens', name: 'Microgreens', cat: 'sprout', from: 'seed', effort: 1, days: '7–14 days', space: 'counter',
    how: 'Scatter seeds thickly on damp soil in a shallow tray, barely cover, keep moist and bright; snip when a couple inches tall.',
    tip: 'The fastest, cheapest fresh thing you can grow indoors year-round — pea, radish, sunflower, and broccoli seeds are the easy wins. No sun required, just light.',
  },
  {
    id: 'sprouts', name: 'Bean & seed sprouts', cat: 'sprout', from: 'seed', effort: 1, days: '3–5 days', space: 'counter',
    how: 'Soak a spoonful of dried lentils/mung beans overnight in a jar, drain, then rinse twice a day; they sprout on the counter.',
    tip: 'No soil, no light, no windowsill needed — literally a jar in a dark cupboard. The single lowest-barrier way to grow food there is.',
  },
];

/* Small-space reality: you do not need a yard. This maps the space you actually
   have to what genuinely grows there — the answer to "I live in an apartment."
   Each `id` lines up with the `space` field on GROW_ITEMS. */
export const SPACE_GUIDE = [
  {
    id: 'counter', place: 'No sun at all? A countertop.',
    blurb: 'Sprouts and microgreens need light, not direct sun — a normal kitchen counter is enough. Sprouts in a jar need nothing but rinsing.',
    grows: ['Bean & seed sprouts', 'Microgreens', 'Ginger', 'Radishes', 'Mushroom kits'],
  },
  {
    id: 'windowsill', place: 'One bright windowsill.',
    blurb: 'The single most productive spot in a small home. Regrow scraps in glasses of water right on the ledge — scallions, herbs, celery, lettuce.',
    grows: ['Scallions & leeks', 'Soft herbs', 'Celery & bok choy', 'Carrot & beet tops', 'Garlic greens'],
  },
  {
    id: 'balcony', place: 'A balcony, fire escape or sunny rail.',
    blurb: 'Six-plus hours of sun unlocks the fruiting crops. Railing planters and hanging pots use vertical space, not floor space.',
    grows: ['Cherry tomatoes', 'Peppers', 'Peas & beans', 'Strawberries (railing pots)', 'Leafy greens'],
  },
  {
    id: 'deep-pot', place: 'Room for one deep bucket.',
    blurb: 'A single 5-gallon bucket with drainage holes grows a surprising amount of a root crop — no bed, no yard.',
    grows: ['Potatoes', 'Sweet potato', 'Onion greens'],
  },
];

/** A deterministic-per-day rotation so Fresh doesn't reshuffle on every render
    but still feels alive across days. Regrow-from-scraps entries lead because
    they're the lowest-friction, most-on-theme (waste less) place to start. */
export function growPicks(n = 4, now = new Date()) {
  const ordered = [...GROW_ITEMS].sort((a, b) => {
    if (a.from !== b.from) return a.from === 'regrow' ? -1 : 1;   // regrow first
    return a.effort - b.effort;                                   // then easiest
  });
  // Rotate the starting point by day-of-year so the lead card changes daily.
  const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const start = doy % ordered.length;
  const out = [];
  for (let i = 0; i < Math.min(n, ordered.length); i++) {
    out.push(ordered[(start + i) % ordered.length]);
  }
  return out;
}
