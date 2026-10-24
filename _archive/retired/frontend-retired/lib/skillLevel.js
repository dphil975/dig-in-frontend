/* skillLevel.js — adapt a reverse-engineered recipe to the cook making it.

   The same drink handed to three people gets three different results, because
   consistency depends on the maker, not just the ratio. So the Copycat Lab
   asks what level you're at and reshapes the guidance:
   - beginner: nail the ONE ratio/hook that carries the flavor, shortcut the
     rest — a forgiving path that still tastes right.
   - home: the full method as written.
   - pro: the precision cues (weights, temps, timing, texture) that make it
     identical cup after cup — the actual "chain-café consistency" the brand
     sells.
   Guidance is generated from the recipe's own fields, so it works for any
   drink or dish without hand-authoring three versions of each. */

export const SKILL_LEVELS = [
  { key: 'beginner', label: 'Beginner',     blurb: 'First few times. Get the ratio right and don’t sweat the rest.' },
  { key: 'home',     label: 'Home Barista', blurb: 'Comfortable cooking. Follow the full method.' },
  { key: 'pro',      label: 'Pro · Exact',  blurb: 'You want it identical every single time — temps, weights, timing.' },
];

const KEY = 'dig_in_skill_level';

export function loadSkill() {
  const v = localStorage.getItem(KEY);
  return SKILL_LEVELS.some(s => s.key === v) ? v : 'home';
}
export function saveSkill(level) {
  try { localStorage.setItem(KEY, level); } catch { /* ignore */ }
}

function firstSentence(s) {
  if (!s) return '';
  const m = String(s).match(/^[^.!?]*[.!?]/);
  return (m ? m[0] : String(s)).trim();
}

/* Reshape an item's guidance for a skill level. `kind` = 'drink' | 'food'.
   Drinks lean on secretRecipe (ratios/prePrep/textureTip); food on
   theSecret / signatureHooks. Returns { headline, points[] }. */
export function adaptToSkill(item, level, kind = 'drink') {
  const secret = kind === 'drink' ? item.secretRecipe : null;

  if (level === 'beginner') {
    const points = ['Get the ratio right first — that’s ~80% of the flavor. Everything else is polish.'];
    if (kind === 'drink') {
      if (secret?.ratios) points.push(`The one that matters: ${firstSentence(secret.ratios)}`);
      points.push('Store-bought syrups and pre-ground espresso are totally fine — same taste, less fuss.');
    } else {
      if (item.theSecret) points.push(`Do the one thing that makes it: ${item.theSecret}`);
      points.push('Take shortcuts on the rest (store sauce, pre-cut) and put your effort into that hook.');
    }
    return { headline: 'Nail the one thing, skip the fuss', points };
  }

  if (level === 'pro') {
    const points = ['Measure by weight and repeat the exact same steps every time — consistency is the whole game.'];
    if (kind === 'drink') {
      if (secret?.prePrep) points.push(secret.prePrep);
      if (secret?.textureTip) points.push(secret.textureTip);
      points.push('Log your ratio once it’s perfect so every cup is a copy of the last.');
    } else {
      (item.signatureHooks || []).slice(0, 2).forEach(h => points.push(`${h.secret} — ${h.why}`));
      points.push('Weigh your seasoning and control your heat so the browning lands the same each time.');
    }
    return { headline: 'Dial it in for exact, every-time consistency', points };
  }

  // home
  return {
    headline: 'Follow the full method',
    points: [
      kind === 'drink' ? 'Make it as written — you’ve got this.' : 'Cook it as written and hit the signature hooks.',
      'Then taste and nudge salt / acid / sweet at the end until it matches your memory of the real thing.',
    ],
  };
}
