/* mocktailFlavor.js — the flavor + mood engine behind the Zero-Proof Bar.

   The core idea the app "understands": a cocktail is three things stacked, and
   the alcohol contributes to all three —
     1. FLAVOR      — the taste axes (sweet, sour, bitter, spicy, smoky, …)
     2. MOUTHFEEL   — warmth, body, the burn, the silky weight
     3. MOOD        — the actual reason people drink it (the "happy feeling")
   To make a classic virgin you can't just delete the spirit — you have to
   rebuild each layer. This module models the flavor axes, the mood outcomes,
   and the functional-ingredient glossary that recreates the MOOD layer without
   ethanol (adaptogens, nervines, aromatics), plus a recommender that ranks
   drinks by how you want to feel and what you want to taste. */

// Eight taste axes used for the radar + matching.
export const FLAVOR_AXES = ['sweet', 'sour', 'bitter', 'spicy', 'smoky', 'fruity', 'floral', 'herbal'];

// The mood outcomes a drink can be built toward. `drivers` are the functional
// ingredients (below) that produce that feeling — the swap for the buzz.
export const MOODS = [
  { key: 'happy',     label: 'Happy & Social',    icon: '✨', blurb: 'The uplifted, chatty, special-occasion glow — without the buzz or the hangover.', drivers: ['elderflower', 'damiana', 'hibiscus'] },
  { key: 'calm',      label: 'Calm & Unwind',     icon: '🌙', blurb: 'The exhale at the end of the day. Lowered shoulders, softened edges.',           drivers: ['ashwagandha', 'passionflower', 'cbd'] },
  { key: 'focus',     label: 'Clear & Focused',   icon: '🎯', blurb: 'Alert but never jittery — the productive-evening or working-lunch sip.',          drivers: ['lionsmane', 'ltheanine', 'yerbamate'] },
  { key: 'cozy',      label: 'Cozy & Warm',       icon: '🔥', blurb: 'Blanket-in-a-glass. Warming spice and grounding roots.',                          drivers: ['ginger', 'reishi', 'elderberry'] },
  { key: 'energized', label: 'Bright & Energized',icon: '⚡', blurb: 'A clean lift for the pre-dinner reset or the mid-afternoon wall.',                drivers: ['rhodiola', 'cordyceps', 'yerbamate'] },
  { key: 'sensual',   label: 'Warm & Sensual',    icon: '🌹', blurb: 'The slow, low-lit, date-night pour.',                                             drivers: ['damiana', 'cacao', 'rose'] },
];

export const MOOD_BY_KEY = Object.fromEntries(MOODS.map(m => [m.key, m]));

/* ── What actually makes a drink feel exciting ────────────────────────────
   The real sensory-science answer to "why does a cocktail feel like an
   event": it isn't the alcohol doing the exciting part — it's contrast.
   Bitter against sweet, cold against a warm spice note, a fizzy texture
   against a syrupy one, a sharp aromatic hit before the first sip even
   lands. Alcohol was never the only thing capable of supplying that
   contrast; it's just one ingredient among several that can. This is the
   actual mechanism the swaps above are built on, made explicit. */
export const TASTE_ACTIVATION = [
  { id: 'bitterness',  label: 'Bitterness',        why: 'The "adult" flavor signal — it\'s what makes a drink read as sophisticated rather than sweet and simple. Delivered here by hibiscus, cacao, and non-alcoholic bitters instead of Campari or vermouth.' },
  { id: 'acidity',     label: 'Acid & brightness',  why: 'Cuts richness and wakes up every other flavor on the palate — fresh citrus does this job identically whether or not there\'s alcohol in the glass.' },
  { id: 'aromatics',   label: 'Aromatic lift',      why: 'Most of what you register as "flavor" is actually smell — a garnish you crush or express (mint, citrus peel, fresh ginger) hits the nose before the first sip, building anticipation.' },
  { id: 'contrast',    label: 'Temperature & texture contrast', why: 'A cold, fizzy drink against a warming spice note, or a silky foam cap on a sharp base — contrast is what a palate reads as "interesting," independent of alcohol content.' },
];

/* Functional-ingredient glossary — the heart of "make it virgin but keep the
   feeling". Each carries what it tastes like (axes) and the mood it drives, so
   the app can explain WHY a swap recreates the original's effect. `kind`:
   adaptogen (stress/mood over time), nervine (calming), nootropic (focus),
   aromatic (warmth/flavor), botanical (floral/fruit character). */
export const FUNCTIONALS = {
  elderflower:  { name: 'Elderflower',        kind: 'botanical', flavor: ['floral', 'sweet'],   mood: 'happy',     note: 'Honeyed floral lift that reads as “celebration” and rounds off sharp edges — the job a splash of liqueur used to do.' },
  ashwagandha:  { name: 'Ashwagandha',        kind: 'adaptogen', flavor: ['bitter', 'herbal'],  mood: 'calm',      note: 'Adaptogenic root shown to blunt cortisol — the calm, body-warm glow that stands in for alcohol’s relaxation, minus the crash.' },
  ltheanine:    { name: 'L-Theanine (matcha)',kind: 'nootropic', flavor: ['herbal', 'bitter'],  mood: 'focus',     note: 'The amino acid in green tea that smooths caffeine into calm, alert focus — “relaxed but sharp.”' },
  passionflower:{ name: 'Passionflower',      kind: 'nervine',   flavor: ['herbal', 'floral'],  mood: 'calm',      note: 'A gentle nervine that quiets a racing mind — the settle without the sedation.' },
  damiana:      { name: 'Damiana',            kind: 'botanical', flavor: ['herbal', 'bitter'],  mood: 'sensual',   note: 'Long used for a mild, euphoric, mood-lifting warmth — the closest botanical to alcohol’s social glow.' },
  rhodiola:     { name: 'Rhodiola',           kind: 'adaptogen', flavor: ['bitter', 'herbal'],  mood: 'energized', note: 'Adaptogen for stamina and mood under stress — a clean lift with no jitter.' },
  lionsmane:    { name: "Lion's Mane",        kind: 'nootropic', flavor: ['herbal'],            mood: 'focus',     note: 'Functional mushroom linked to mental clarity — grounds an energizing drink in focus.' },
  cordyceps:    { name: 'Cordyceps',          kind: 'adaptogen', flavor: ['bitter'],            mood: 'energized', note: 'Mushroom for oxygen use and clean energy — the pre-dinner spark.' },
  reishi:       { name: 'Reishi',             kind: 'adaptogen', flavor: ['bitter'],            mood: 'cozy',      note: 'Grounding mushroom for the “settled, warm, low-lit” body feel that replaces a nightcap.' },
  ginger:       { name: 'Fresh Ginger',       kind: 'aromatic',  flavor: ['spicy'],             mood: 'cozy',      note: 'The warming burn on the way down — this is what literally replaces alcohol’s heat, no proof required.' },
  cbd:          { name: 'CBD',                kind: 'nervine',   flavor: ['herbal'],            mood: 'calm',      note: 'Takes the edge off tension — the unclenched-jaw feeling.' },
  hibiscus:     { name: 'Hibiscus',           kind: 'botanical', flavor: ['sour', 'fruity'],    mood: 'happy',     note: 'Tart, cranberry-bright and ruby-red — carries the vibrancy a red aperitivo used to.' },
  elderberry:   { name: 'Elderberry',         kind: 'botanical', flavor: ['fruity', 'sweet'],   mood: 'cozy',      note: 'Deep, jammy and immune-friendly — the cozy depth of a spiced winter liqueur.' },
  cacao:        { name: 'Raw Cacao',          kind: 'aromatic',  flavor: ['bitter'],            mood: 'sensual',   note: 'Theobromine gives a gentle mood lift; its bitterness reads as “grown-up,” like a dark liqueur.' },
  rose:         { name: 'Rose',               kind: 'botanical', flavor: ['floral'],            mood: 'sensual',   note: 'Soft floral romance — the low-lit garnish note.' },
  yerbamate:    { name: 'Yerba Maté',         kind: 'botanical', flavor: ['bitter', 'herbal'],  mood: 'energized', note: 'Smooth, sustained caffeine — a lift without the coffee crash.' },

  // Chinese tea varieties — real teas (Camellia sinensis) differ by oxidation
  // level, which drives both flavor and body. Flower/herbal tisanes (already
  // above: hibiscus, rose, elderflower) aren't technically "tea" at all — they
  // don't come from the tea plant and carry no caffeine, which is why they're
  // filed separately from the true teas below.
  greentea:   { name: 'Green Tea',     kind: 'tea', flavor: ['herbal', 'bitter'],  mood: 'focus',     note: 'Minimally oxidized — grassy, vegetal, umami-edged. Its natural L-theanine pairs with caffeine for the same calm-alert focus matcha is known for.' },
  whitetea:   { name: 'White Tea',     kind: 'tea', flavor: ['floral', 'sweet'],   mood: 'calm',      note: 'The least-processed true tea — delicate and subtly sweet. The gentlest, quietest of the true teas rather than a jolt.' },
  oolong:     { name: 'Oolong Tea',    kind: 'tea', flavor: ['floral', 'fruity'],  mood: 'happy',     note: 'Partially oxidized, spanning green-floral to dark-roasted depending on style. Traditionally poured after a rich meal as a palate-cleansing digestif in Chinese dining.' },
  blacktea:   { name: 'Black Tea',     kind: 'tea', flavor: ['bitter', 'smoky'],   mood: 'energized', note: 'Fully oxidized — malty and robust, the most full-bodied of the true teas. A steady lift with real backbone, no jitter.' },
  puerh:      { name: 'Pu-erh Tea',    kind: 'tea', flavor: ['smoky', 'bitter'],   mood: 'cozy',      note: 'A post-fermented, aged tea — earthy, deep, sometimes smoky. Served at Chinese banquets specifically to cut through rich, fatty food.' },
  jasmine:    { name: 'Jasmine Tea',   kind: 'tea', flavor: ['floral', 'sweet'],   mood: 'happy',     note: 'Green tea scented with jasmine blossoms — perfumed and bright, one of the most recognizable floral teas worldwide.' },
  osmanthus:  { name: 'Osmanthus Tea', kind: 'tea', flavor: ['floral', 'fruity'],  mood: 'sensual',   note: 'Delicate apricot-like sweetness from dried osmanthus blossoms, often blended into oolong or black tea for a honeyed floral note.' },
};

export const FUNCTIONAL_KEYS = Object.keys(FUNCTIONALS);
export const functional = (key) => FUNCTIONALS[key];

// Empty radar template.
export function emptyFlavor() {
  return Object.fromEntries(FLAVOR_AXES.map(a => [a, 0]));
}

/* Rank drinks by how you want to feel + taste. mood match dominates (it's the
   whole point of the feature); flavor adds a graded nudge; a matching functional
   driver breaks ties. Returns a new array, best first, with the score attached. */
export function scoreMocktail(m, { mood, flavor } = {}) {
  let s = 0;
  if (mood && m.moods?.includes(mood)) s += 5;
  if (mood && (m.functionals || []).some(k => FUNCTIONALS[k]?.mood === mood)) s += 1.5;
  if (flavor) s += (m.flavor?.[flavor] || 0) / 20;   // 0..5
  return s;
}

export function recommend(mocktails, filters = {}) {
  return mocktails
    .map(m => ({ m, s: scoreMocktail(m, filters) }))
    .sort((a, b) => b.s - a.s)
    .map(x => x.m);
}

// Which drinks actually satisfy the active chips (used for filtering vs. sorting).
export function matchesFilters(m, { mood, flavor } = {}) {
  if (mood && !m.moods?.includes(mood)) return false;
  if (flavor && (m.flavor?.[flavor] || 0) < 45) return false;   // must be meaningfully that flavor
  return true;
}
