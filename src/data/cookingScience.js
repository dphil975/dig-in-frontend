/* ════════════════════════════════════════════════════════════
   COOKING SCIENCE → SENSORY CUES
   The standalone Cooking Science page is gone; its core ideas now
   live inside every recipe as taste / smell / sight doneness cues.
   getSensoryCues() reads a recipe's techniques and returns what to
   LOOK, SMELL, and TASTE for — the senses that matter most in
   cooking and baking.
   ════════════════════════════════════════════════════════════ */

// Each technique maps cooking-science principles to the three senses.
const TECHNIQUE_CUES = [
  {
    keys: ['roast', 'bake', 'oven', 'baked'],
    sight: 'Surface turns deep golden-brown — that colour is the Maillard reaction.',
    smell: 'A nutty, toasty aroma means surface sugars and proteins are browning.',
    taste: 'Centre should be tender, not raw; let it rest a few minutes before cutting.',
  },
  {
    keys: ['fry', 'deep fry', 'deep-fry', 'pan-fry', 'panko', 'crispy', 'croquette'],
    sight: 'Crust is even golden-brown and bubbling slows as moisture cooks off.',
    smell: 'Clean, toasty smell — sharp or acrid means the oil is too hot.',
    taste: 'Shatteringly crisp outside, moist inside. Salt the moment it leaves the oil.',
  },
  {
    keys: ['sear', 'grill', 'char', 'griddle', 'caramelis', 'carameliz'],
    sight: 'A dark, glossy crust forms; sugars at the edge turn amber.',
    smell: 'Deep, smoky-sweet aroma signals caramelization is underway.',
    taste: 'Bittersweet, roasted notes — pull it before the edges taste burnt.',
  },
  {
    keys: ['simmer', 'stew', 'braise', 'broth', 'soup', 'stock', 'curry', 'ragout', 'ramen'],
    sight: 'Liquid reduces and turns glossy; it should coat the back of a spoon.',
    smell: 'Aromas deepen and round out as the broth concentrates.',
    taste: 'Flavours meld and richen — taste for salt and acid right before serving.',
  },
  {
    keys: ['garlic', 'onion', 'shallot', 'aromatic', 'sauté', 'saute', 'sweat'],
    sight: 'Onions turn translucent then pale gold; garlic just barely blonde.',
    smell: 'Fragrant and sweet — the instant it smells sharp or acrid, it has burnt.',
    taste: 'Mellow and sweet, with no raw bite left.',
  },
  {
    keys: ['bread', 'dough', 'yeast', 'proof', 'knead', 'bun', 'pan', 'loaf'],
    sight: 'Dough roughly doubles; a baked loaf is deep gold and pulls from the tin.',
    smell: 'Warm, yeasty aroma while proofing; toasty crust when baked.',
    taste: 'Tap the base — a hollow knock means the crumb is set inside.',
  },
  {
    keys: ['rice', 'onigiri', 'risotto'],
    sight: 'Grains are plump and the surface looks dry, with steam holes forming.',
    smell: 'Faintly sweet, starchy steam.',
    taste: 'Tender with a little chew — never chalky in the centre.',
  },
  {
    keys: ['pasta', 'noodle', 'udon', 'dumpling', 'mochi', 'dango'],
    sight: 'Noodles loosen and float; dumplings turn glossy and translucent.',
    smell: 'Clean, wheaty steam.',
    taste: 'Al dente — a slight resistance at the very centre when you bite.',
  },
  {
    keys: ['egg', 'omelette', 'custard', 'katsudon'],
    sight: 'Whites just set, yolk still glossy; custard wobbles like loose jelly.',
    smell: 'Mild and buttery — sulphurous means it is overcooking.',
    taste: 'Silky and just-set; carry-over heat finishes it off the heat.',
  },
  {
    keys: ['chocolate', 'melt', 'matcha', 'tea', 'sugar', 'sweet', 'crepe', 'taiyaki'],
    sight: 'Melted chocolate is glossy; sugar syrups go from cloudy to clear.',
    smell: 'Sweet and rich; a hint of bitterness as sugar starts to caramelize.',
    taste: 'Balance the sweetness with a pinch of salt or a squeeze of acid.',
  },
];

const SENSE_ORDER = { sight: 0, smell: 1, taste: 2 };

/**
 * Return up to 3 sensory doneness cues (one each of sight/smell/taste where
 * possible) based on the recipe's name + instructions.
 */
export function getSensoryCues(recipe) {
  const text = (
    (recipe?.name || '') + ' ' +
    (recipe?.description || '') + ' ' +
    (recipe?.instructions || recipe?.steps || []).join(' ')
  ).toLowerCase();

  const picked = { sight: null, smell: null, taste: null };
  for (const cue of TECHNIQUE_CUES) {
    if (!cue.keys.some(k => text.includes(k))) continue;
    for (const sense of ['sight', 'smell', 'taste']) {
      if (!picked[sense] && cue[sense]) picked[sense] = cue[sense];
    }
    if (picked.sight && picked.smell && picked.taste) break;
  }

  // Always give the cook at least a taste cue
  if (!picked.taste) picked.taste = 'Taste before serving and adjust salt, fat, and acid until it pops.';

  return Object.entries(picked)
    .filter(([, text]) => text)
    .map(([sense, text]) => ({ sense, text }))
    .sort((a, b) => SENSE_ORDER[a.sense] - SENSE_ORDER[b.sense]);
}
