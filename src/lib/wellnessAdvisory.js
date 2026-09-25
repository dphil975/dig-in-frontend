/* wellnessAdvisory.js — the "yo, that's not good" bar.

   The founder's ask, verbatim in spirit: the app can't stop harmful content
   from existing, but when a hashtag or a community is organized around
   disordered eating — "skinny at any cost," starvation-as-a-goal, pro-ana /
   thinspo content — it can at least say something caring and point to real
   help. Food is fuel and growth; a body isn't a number to minimize.

   Two hard rules so this HELPS instead of moralizing:

   1. CONSERVATIVE. Normal healthy eating is NOT flagged — #healthy, #lowcarb,
      #highprotein, #weightloss, #caloriedeficit, #glp1, a diet, a cut, "clean
      eating" are legitimate goals and get NOTHING. We only fire on the
      genuinely disordered cluster (restriction-as-identity, pro-ED community
      tags, purging, starvation framed as an aesthetic). A false "you're
      unhealthy" nag at someone eating a salad is its own harm.

   2. HONEST resources only. We reuse the app's already-vetted, real crisis
      lines (shadowToLight.CRISIS_RESOURCES — 988, Crisis Text Line,
      findahelpline.com, which covers eating disorders internationally). We do
      NOT invent an ED hotline number that might be dead.

   The tone is supportive, not scolding — same family as AllergyPanel's
   ANAPHYLAXIS_NOTE and Nova's crisis routing. */

import { CRISIS_RESOURCES } from './shadowToLight';

// Coined pro-ED terms — these are basically ONLY used to organize harmful
// content, so a substring match on a tag is safe (and #proana / "pro ana" all
// normalize to the same thing).
const PRO_ED_CONTAINS = [
  'proana', 'promia', 'thinspo', 'thinspiration', 'bonespo', 'meanspo',
  'skinnycheck', 'wannabeskinny', 'edtwt', 'chewandspit',
  'sizezero', 'thighgap', 'zerocalories', '0calories', 'fastingtolose',
  'goalbody', 'skinnychallenge',
];

// Ambiguous single words — flag ONLY as an exact standalone tag (a community
// literally named this), never as a substring (so "#starvingartist",
// "#anaheim", "#bananabread" never trip it).
const PRO_ED_EXACT = [
  'ana', 'mia', 'anamia', 'ednos', 'starvation', 'purge', 'purging',
  'anorexia', 'anorexic', 'bulimia', 'nofood', 'noteating', 'skipmeals',
];

// RECOVERY is the good direction — communities built around getting better use
// exactly these words (#edrecovery, #anorexiarecovery, "recovering"). Flagging
// them with "that's not good" would be actively harmful, so recovery context
// is a hard allow: it overrides every match above.
const RECOVERY_RE = /recover|recovery|healing|survivor|edrecovery|anti[-]?diet|intuitiveeating|allfoodsfit|foodfreedom/i;

// Phrase-level signals for free text (a written post), where a full clause
// gives real context — so these can be longer/clearer than the tag list.
const DISORDERED_PHRASES = [
  'starve myself', 'as skinny as possible', "don't deserve to eat",
  'punish myself for eating', 'earn my food', 'never thin enough',
  'nothing tastes as good as skinny', 'how to not eat', 'ways to skip meals',
];

function norm(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function hasDisorderedTag(tag) {
  const raw = String(tag || '');
  if (RECOVERY_RE.test(raw)) return false;      // recovery is the good direction — never flag
  const n = norm(tag);
  if (!n) return false;
  if (PRO_ED_EXACT.includes(n)) return true;    // exact standalone tag only
  return PRO_ED_CONTAINS.some((d) => n.includes(norm(d)));
}

/** Does any tag in the list read as pro-ED / disordered? Returns the first hit
    or null. Normal health/diet tags return null. */
export function concerningTag(tags = []) {
  for (const t of tags) if (hasDisorderedTag(t)) return t;
  return null;
}

/** Free-text scan (for a written post / recipe blurb). Recovery context is a
    hard allow here too. */
export function concerningText(text = '') {
  const raw = String(text).toLowerCase();
  if (RECOVERY_RE.test(raw)) return false;
  if (DISORDERED_PHRASES.some((p) => raw.includes(p))) return true;
  const n = norm(text);
  return PRO_ED_CONTAINS.some((d) => n.includes(norm(d)));
}

const SUPPORT_MESSAGE =
  "Heads up — this looks like it's organized around restriction, not nourishment. " +
  "Food is how a body grows, heals, and thinks; you deserve to eat, and a number was never the goal. " +
  "You're welcome to keep looking, but if any of this is hitting close to home, real, kind help is a tap away.";

/**
 * Advisory for a community/tag view or a post. Returns null (the common case —
 * nothing to say) or { level, title, message, resources }.
 * @param tags  string[] — the hashtags defining the view/community
 * @param text  string   — optional free text (a written post) to also scan
 */
export function wellnessAdvisory({ tags = [], text = '' } = {}) {
  const tagHit = concerningTag(tags);
  const textHit = text ? concerningText(text) : false;
  if (!tagHit && !textHit) return null;
  return {
    level: 'concern',
    title: 'A note on this one',
    message: SUPPORT_MESSAGE,
    resources: CRISIS_RESOURCES,
    tag: tagHit || null,
  };
}
