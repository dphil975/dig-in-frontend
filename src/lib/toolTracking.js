/* toolTracking.js — "Tools aren't modeled anywhere. This is a real data-model
   addition." They weren't: equipmentDetector.js can tell you what a RECIPE
   calls for, and EquipmentGate shows it as a sponsored "shop this" card, but
   nothing anywhere tracks what tools YOU actually own, and nothing has ever
   offered a substitute when you don't have one. This is that model, built on
   the SAME TOOL_CATALOG equipmentDetector.js already describes well — one
   list of tools, not two.

   Three real capabilities:
     1. OWNED TOOLS       a real inventory, same client-only pattern as the
                          pantry (dig_in_owned_tools).
     2. SUBSTITUTION      for each catalog tool, real technique guidance for
                          cooking WITHOUT it — genuine kitchen craft knowledge
                          (how heat/time/method actually changes), not a
                          guess. No citations needed here the way nutrition
                          claims need them — this is technique, not a health
                          claim, and TOOL_CATALOG's own existing entries are
                          already written in this same confident, first-person
                          instructor voice.
     3. EQUIPPED-FOR      the reverse of pantry's "what can I cook" — given
                          what you own, which recipes in the pool don't need
                          anything you're missing. Reuses equipmentDetector's
                          real per-recipe detection; never guesses a recipe
                          needs a tool it never mentions. */

import { TOOL_CATALOG, detectEquipment } from './equipmentDetector';

const KEY = 'dig_in_owned_tools';   // string[] of TOOL_CATALOG ids

function read() {
  try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return new Set(Array.isArray(v) ? v : []); }
  catch { return new Set(); }
}
function write(set) {
  try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch { /* ignore */ }
}

export function loadOwnedTools() { return read(); }

export function toggleOwnedTool(id) {
  const set = read();
  if (set.has(id)) set.delete(id); else set.add(id);
  write(set);
  return set;
}

// ── Substitution guidance ───────────────────────────────────────────────
// What to do instead, for each catalog tool. `use` is the real stand-in;
// `adjust` is what actually changes (time/heat/technique) — the part a
// bare "use X instead" always skips and the part that actually matters.
export const SUBSTITUTIONS = {
  cast_iron: {
    use: 'Any heavy-bottomed stainless or nonstick skillet',
    adjust: 'You lose some heat retention, so preheat a beat longer and expect a slightly lighter crust — the food still cooks fine, it just won\'t hold a sear quite as evenly at the edges.',
  },
  wok: {
    use: 'Your widest, deepest skillet or a sauté pan, on the highest heat your stove has',
    adjust: 'A flat pan holds heat less evenly at the edges than a wok\'s sloped sides, so cook in smaller batches and keep things moving rather than trying to toss a full wok\'s worth at once.',
  },
  sheet_pan: {
    use: 'Any oven-safe baking dish, a broiler pan, or a foil-lined roasting pan',
    adjust: 'The main risk is crowding — a smaller or deeper dish traps steam instead of letting things brown, so spread in a single layer even if that means two batches.',
  },
  dutch_oven: {
    use: 'Any heavy pot with a tight-fitting lid, or a slow cooker on high, or an Instant Pot (sauté then pressure-cook)',
    adjust: 'A lighter pot scorches more easily on the bottom — drop the heat a notch and stir a little more often than the recipe says.',
  },
  rice_cooker: {
    use: 'A regular pot with a tight lid on the stovetop',
    adjust: 'Real ratio: 1 part rice to 1.5 parts water for white rice. Bring to a boil, drop to the lowest simmer, cover, and don\'t lift the lid for 18 minutes — then rest, still covered, for 10 more.',
  },
  air_fryer: {
    use: 'A conventional oven at 425–450°F, food on a wire rack over a sheet pan',
    adjust: 'Flip halfway through since there\'s no fan circulating around it. It won\'t get quite as shatter-crisp, but a wire rack (so air reaches the underside) gets you most of the way there.',
  },
  grill: {
    use: 'A stovetop grill pan for the char marks, or your oven\'s broiler (top rack, door cracked) for the direct high heat',
    adjust: 'You lose the smoke flavor — no real substitute for that indoors — but both get you the actual high, direct heat that does the cooking.',
  },
  blender: {
    use: 'An immersion (stick) blender in a tall, narrow container, or a whisk plus fine mincing by hand',
    adjust: 'For emulsifying (dressings, mayo), a whisk works — just stream the oil in slowly and constantly rather than all at once, which is what a blender does for you automatically.',
  },
  slow_cooker: {
    use: 'A covered Dutch oven (or any heavy oven-safe pot) in a 275–300°F oven',
    adjust: 'Similar total time to a slow cooker\'s LOW setting. Check the liquid level once partway through — an oven runs a little drier than a sealed slow-cooker insert.',
  },
};

/** Real substitution guidance for one tool id, or null if this tool has none
    modeled yet (never fabricated — an unmodeled tool just isn't offered). */
export function substitutionFor(toolId) {
  return SUBSTITUTIONS[toolId] || null;
}

/**
 * What a specific recipe actually calls for (via equipmentDetector's real
 * text detection) that you DON'T own, each with its real substitution
 * attached. Returns [] when the recipe needs nothing special, or needs
 * nothing you're missing — never a fabricated "you need a food processor"
 * for a recipe that never mentions one.
 */
export function missingToolsFor(recipe, ings, steps, ownedIds = loadOwnedTools()) {
  const detected = detectEquipment(recipe, ings, steps) || [];
  return detected
    .filter((tool) => !ownedIds.has(tool.id))
    .map((tool) => ({ ...tool, substitution: substitutionFor(tool.id) }));
}

/**
 * The reverse of the pantry's "what can I cook": given what you own, which
 * recipes in the pool call for nothing you're missing. A recipe that
 * mentions no tool at all (equipmentDetector finds no match) always counts
 * as equipped-for — it's not gated by tools it never asked for.
 */
export function recipesEquippedFor(recipes = [], ownedIds = loadOwnedTools(), limit = 12) {
  return recipes
    .filter((r) => {
      const ings = (r.ingredients || []).map((i) => (typeof i === 'object' ? i.text || i.name || '' : i));
      const steps = r.instructions || r.steps || [];
      const detected = detectEquipment(r, ings, steps);
      if (!detected) return true;                       // nothing tool-specific detected — always fine
      return detected.every((t) => ownedIds.has(t.id));
    })
    .slice(0, limit);
}

/** Every catalog tool, annotated with whether you own it and its real
    substitution — the full list for a "My Tools" grid. */
export function allToolsWithStatus(ownedIds = loadOwnedTools()) {
  return TOOL_CATALOG.map((t) => ({
    id: t.id, name: t.name, description: t.description,
    owned: ownedIds.has(t.id),
    substitution: substitutionFor(t.id),
  }));
}
