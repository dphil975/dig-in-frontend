/* cravingTracker.js — a craving journal that remembers over time, and turns
   recurring patterns into a "keep the pantry stocked" prep list — the
   homestead instinct of having what you'll want on hand before you have to
   ask for it, instead of a reactive scramble.

   Every logged craving is auto-tagged with flavorProfile.js's same 8-flavor
   vocabulary and fed into recordFlavorSignal() — the SAME learned taste
   profile (dig_in_craving_prefs) that RecipeCards' recommendations and
   novaNudges.js's craving-aware nudges already read. One profile, not a
   second parallel one — logging a craving here measurably shifts what gets
   recommended and what Nova says, the same afternoon.

   Includes an optional life-stage tag (pregnancy/postpartum/general).
   MATERNAL_PATTERNS below are well-known, commonly-reported craving shapes
   during pregnancy — comfort-and-flavor matching, NOT a nutrient
   prescription or a diagnosis. See MATERNAL_NOTE. */

import { flavorsInText, recordFlavorSignal } from './flavorProfile';

const LOG_KEY = 'dig_in_craving_log';

export const LIFE_STAGES = [
  { id: 'general',    label: 'Just craving it' },
  { id: 'pregnancy',  label: 'Pregnancy' },
  { id: 'postpartum', label: 'Postpartum / nursing' },
];

export const INTENSITIES = ['mild', 'medium', 'strong'];

export const MATERNAL_NOTE =
  'These are commonly reported patterns, not a nutrient prescription or medical guidance — cravings (and aversions) vary a lot person to person. Talk to your OB or midwife about actual prenatal or postpartum nutrition.';

// Widely-reported craving shapes during pregnancy, mapped onto the SAME
// 8-flavor vocabulary flavorProfile.js already tags every recipe with, so
// they slot straight into recipe matching instead of needing their own list.
export const MATERNAL_PATTERNS = [
  { id: 'sour',    label: 'Sour & tart',            flavors: ['tangy'],          note: 'Very commonly reported, especially early on — lemon, pickles, sour candy.' },
  { id: 'salty',   label: 'Salty',                  flavors: ['savory'],         note: 'Pickles, chips, salty snacks — one of the most classically reported cravings.' },
  { id: 'sweet',   label: 'Sweet',                  flavors: ['sweet'],          note: 'Fruit, chocolate, something sugary — common throughout, especially later on.' },
  { id: 'cold',    label: 'Cold & icy',             flavors: ['light'],          note: 'Ice, popsicles, cold drinks — if it specifically feels like a pull toward chewing ice, mention it to your doctor.' },
  { id: 'comfort', label: 'Nostalgic comfort food', flavors: ['rich', 'earthy'], note: 'Something from childhood or a family recipe — comfort cravings are just as real as flavor ones.' },
];

function load() {
  try { const v = JSON.parse(localStorage.getItem(LOG_KEY)); return Array.isArray(v) ? v : []; } catch { return []; }
}
function save(list) { try { localStorage.setItem(LOG_KEY, JSON.stringify(list)); } catch { /* ignore */ } }

export function loadCravingLog() { return load(); }

/** Log a craving. Auto-tags it with the 8-flavor vocabulary and records the
 * same learned-taste signal every recipe save already writes to, so this
 * one log entry measurably shapes recommendations and nudges too. */
export function logCraving({ text, lifeStage = 'general', intensity = 'medium' }) {
  const clean = (text || '').trim();
  if (!clean) return load();
  const flavors = flavorsInText(clean);
  const list = load();
  list.unshift({
    id: `cr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    text: clean, lifeStage, intensity, flavors, loggedAt: Date.now(),
  });
  save(list);
  if (flavors.length) recordFlavorSignal({ name: clean, ingredients: [], description: clean }, 'save');
  return list;
}

export function removeCravingEntry(id) {
  const list = load().filter(e => e.id !== id);
  save(list);
  return list;
}

/** Which flavors keep showing up in the log — same "≥2 mentions" bar
 * allergyProfile.js's detectPatterns() uses, so a one-off doesn't read as
 * a pattern. */
export function cravingPatterns() {
  const counts = {};
  for (const entry of load()) {
    for (const f of entry.flavors || []) counts[f] = (counts[f] || 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([flavor, count]) => ({ flavor, count }));
}

// What's worth keeping on hand per flavor, so next time the craving hits
// it's already covered — real pantry items, not a vague "eat healthier."
const STOCK_SUGGESTIONS = {
  spicy:  ['hot sauce', 'chili flakes', 'jalapeños', 'sriracha'],
  sweet:  ['honey', 'dates', 'dark chocolate', 'maple syrup'],
  savory: ['parmesan', 'soy sauce', 'miso paste', 'good broth'],
  rich:   ['butter', 'heavy cream', 'good cheese'],
  light:  ['lemons', 'fresh herbs', 'cucumbers'],
  earthy: ['lentils', 'canned beans', 'root vegetables'],
  smoky:  ['smoked paprika', 'chipotle in adobo'],
  tangy:  ['pickles', 'vinegar', 'plain yogurt'],
};

/** The "keep it stocked" list — pantry items worth having on hand for
 * whichever flavors have actually shown up ≥2 times, so the next craving
 * is already covered instead of a store run. */
export function stockAheadList() {
  return cravingPatterns()
    .map(p => ({ flavor: p.flavor, count: p.count, items: STOCK_SUGGESTIONS[p.flavor] || [] }))
    .filter(p => p.items.length);
}
