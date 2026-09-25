/* tasteEngine.js — how the app "breaks down" a savory dish's taste.

   Copycatting a restaurant dish is not copying an ingredient list — it's hitting
   the same TASTE FACTORS in the same balance. This engine encodes the eight
   levers that actually decide whether a home version tastes like the real thing,
   plus the reasoning that reads a dish's factor profile and tells you what's
   carrying it and how to fix it when it's off. That reasoning is the "AI
   understands how to break down a recipe" piece — deterministic and inspectable,
   not a black box.

   Drinks use a sweeter axis set (see DrinkScan flavorProfile). Savory food turns
   on salt / fat / acid / umami / heat / browning / crunch instead. */

export const TASTE_FACTORS = [
  { key: 'salt',     label: 'Salt',            role: 'The amplifier — it makes every other flavor taste more like itself. The #1 reason home food tastes “flat.”', fixLow: 'salt in layers: brine or season early, then adjust at the very end', fixHigh: 'add acid, fat, or unsalted bulk (more rice/bread) to stretch it' },
  { key: 'fat',      label: 'Fat / Richness',  role: 'Carries flavor and coats the tongue — the mouthfeel and the crave. Butter, oil, cheese, egg yolk, tallow.', fixLow: 'finish with butter, a fattier cut, or a fat-based sauce', fixHigh: 'cut with acid and a crisp/fresh element' },
  { key: 'acid',     label: 'Acid / Tang',     role: 'The brightener that cuts richness and wakes a dish up. Missing acid is why food reads “heavy” or “boring.”', fixLow: 'a squeeze of lemon, a splash of vinegar, or pickle brine at the end', fixHigh: 'a pinch of sugar and more fat to round it' },
  { key: 'sweet',    label: 'Sweet',           role: 'Rounds sharp edges and balances heat, acid and salt. Often the hidden note in “secret” sauces.', fixLow: 'a little honey, sugar, or caramelized onion', fixHigh: 'more acid and salt to counter it' },
  { key: 'umami',    label: 'Umami / Savory',  role: 'The deep, meaty, more-ish pull. MSG, soy, tomato paste, parmesan, mushroom, anchovy, browned meat.', fixLow: 'MSG, soy/fish sauce, tomato paste, or a parmesan rind', fixHigh: 'brighten with acid and fresh herbs' },
  { key: 'heat',     label: 'Heat / Spice',    role: 'Not a taste but a sensation — it adds urgency and length to each bite.', fixLow: 'cayenne, fresh chili, or hot sauce built into the layers', fixHigh: 'dairy, sugar, or starch to tame it' },
  { key: 'maillard', label: 'Char / Browning', role: 'The Maillard reaction — the seared, roasted, toasted crust that instantly reads “restaurant.” Home cooks under-brown out of fear.', fixLow: 'higher heat, dry the surface, don’t crowd the pan, let it sit undisturbed', fixHigh: 'pull earlier; deglaze to move browning into a sauce' },
  { key: 'crunch',   label: 'Texture / Crunch',role: 'Contrast that makes each bite exciting — the reason fried and toasted things win.', fixLow: 'toast the bun, double-fry, add a fresh crisp element', fixHigh: 'add a soft/creamy counterpoint' },
];

export const FACTOR_BY_KEY = Object.fromEntries(TASTE_FACTORS.map(f => [f.key, f]));
export const FACTOR_KEYS = TASTE_FACTORS.map(f => f.key);

/** Top factors carrying a dish, highest first. */
export function dominantFactors(tf, n = 3) {
  return FACTOR_KEYS
    .map(k => [k, tf?.[k] ?? 0])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .filter(([, v]) => v >= 40)
    .map(([k]) => k);
}

/* A plain-English read of what makes the dish tick — the "deconstruction".
   Generated from the factor profile so it stays honest to the numbers. */
export function balanceRead(tf) {
  const dom = dominantFactors(tf, 3);
  if (!dom.length) return 'A balanced, gentle profile with no single factor dominating — season and brown boldly to give it a backbone.';
  const names = dom.map(k => FACTOR_BY_KEY[k].label.split(' ')[0].toLowerCase());
  let read = `This dish lives on ${listJoin(names)}.`;
  if ((tf.salt ?? 0) >= 55 && !dom.includes('salt')) read += ' Salt is the quiet amplifier tying it together.';
  if ((tf.acid ?? 0) >= 45 && !dom.includes('acid')) read += ' A bright acid pop keeps it from feeling heavy — skip it and the copy tastes “off.”';
  else if ((tf.acid ?? 0) < 30) read += ' There’s deliberately little acid, so richness and browning have to carry it.';
  if ((tf.maillard ?? 0) >= 60) read += ' Get the browning right and you’re 80% there.';
  if ((tf.crunch ?? 0) >= 65) read += ' The textural crunch is doing as much work as the flavor.';
  return read;
}

/* Troubleshooting: given a factor profile, what usually goes wrong copying it,
   and the fix. Surfaces the low factors most likely to make the home version
   miss, using each factor's own fixLow guidance. */
export function troubleshoot(tf) {
  const out = [];
  const low = k => (tf?.[k] ?? 0) < 35;
  // These three are the classic "why doesn't mine taste like theirs" culprits.
  if (low('salt'))  out.push({ symptom: 'Tastes flat / like it’s “missing something”', fix: `Under-salted. ${FACTOR_BY_KEY.salt.fixLow}.` });
  if (low('acid') && (tf?.fat ?? 0) >= 55) out.push({ symptom: 'Feels heavy or one-note', fix: `Needs brightness. ${FACTOR_BY_KEY.acid.fixLow}.` });
  if (low('umami')) out.push({ symptom: 'Not craveable / lacks depth', fix: `Low umami. ${FACTOR_BY_KEY.umami.fixLow}.` });
  if ((tf?.maillard ?? 0) < 45) out.push({ symptom: 'Looks & tastes “home-made,” not restaurant', fix: `Under-browned. ${FACTOR_BY_KEY.maillard.fixLow}.` });
  if ((tf?.crunch ?? 0) >= 60) out.push({ symptom: 'Goes soggy fast', fix: 'Texture is core here — serve immediately, and toast/fry right before plating.' });
  return out;
}

/* Umami is the factor home copies miss most — it's savory depth with no obvious
   source, so people don't know to build it. Call it out explicitly whenever it's
   meaningfully present. Works on a food tasteFactors object OR a drink
   flavorProfile (both carry an `umami` key). */
export function umamiInsight(profile) {
  const u = profile?.umami ?? 0;
  if (u >= 55) return `Heavy umami (${u}/100). That deep, savory “moreish” pull is the flavor most home copies miss — it comes from browning, roast, soy/fish sauce, tomato, cheese or MSG. Build it on purpose or the copy tastes thin.`;
  if (u >= 28) return `A quiet umami note (${u}/100) is doing background work — the savory depth that makes it taste “complete” rather than flat. Don’t skip whatever browns or roasts.`;
  return null;
}

function listJoin(arr) {
  if (arr.length <= 1) return arr[0] || '';
  if (arr.length === 2) return `${arr[0]} + ${arr[1]}`;
  return `${arr.slice(0, -1).join(' + ')} + ${arr[arr.length - 1]}`;
}
