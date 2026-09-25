/* topicShift.js — notices when the conversation's subject changes turn to
   turn, so Ask Nova can acknowledge the switch ("switching gears — ") before
   answering, instead of plowing ahead as if nothing changed. Deterministic:
   compares this turn's resolved category/citation against the previous
   turn's — same small-heuristic, not-a-classifier pattern as
   complaintDetector.js. Nova already re-answers each question fresh
   (novaKnowledge.js has no memory of prior turns), so a shift was always
   handled correctly underneath; this just makes it read like she noticed. */

// Citations track "the dish we're discussing" meaningfully only for these
// two categories. For substitution/food-safety/general questions, citations
// are just loosely keyword-matched recipes for grounding — "substitute for
// buttermilk" and "substitute for eggs" naturally cite different recipes
// without the user having changed subject at all, so checking dish identity
// there would false-fire on almost every follow-up.
const DISH_TRACKING_CATEGORIES = new Set(['technique', 'troubleshooting']);

const TRANSITIONS = {
  listener:    ['Okay, switching gears — ', 'Sure, different topic — '],
  calm:        ["Alright, let's shift focus — ", 'Okay, new direction — '],
  coach:       ['New question, got it — ', 'Switching lanes — '],
  cheerleader: ['Ooh, new topic! ', 'Love a good subject change — '],
  sassy:       ["Okay we're switching gears, I see you — ", 'New topic, noted — '],
};

/**
 * Did the subject change between the previous answered turn and this one?
 * @param prev    the previous entry ({ category, citations }) or null/undefined for the first turn
 * @param current this turn's { category, citations } (same shape answerQuestion() returns)
 */
export function detectShift(prev, current) {
  if (!prev) return false;

  // Category shift: was troubleshooting a broken sauce, now it's a
  // substitution question. 'general' is too vague on either side to count —
  // it would fire on almost every turn otherwise.
  if (prev.category && current.category
      && prev.category !== current.category
      && prev.category !== 'general' && current.category !== 'general') {
    return true;
  }

  // Subject shift: the top cited dish changed — still "technique" both
  // times, say, but now about a different recipe entirely. Only checked
  // within the categories where that's a meaningful signal (see above).
  if (DISH_TRACKING_CATEGORIES.has(prev.category) && DISH_TRACKING_CATEGORIES.has(current.category)) {
    const prevDish = prev.citations?.[0]?.name;
    const curDish = current.citations?.[0]?.name;
    if (prevDish && curDish && prevDish !== curDish) return true;
  }

  return false;
}

export function transitionLine(tone = 'listener', seed) {
  const bank = TRANSITIONS[tone] || TRANSITIONS.listener;
  const i = typeof seed === 'number' ? Math.abs(Math.floor(seed)) % bank.length : Math.floor(Math.random() * bank.length);
  return bank[i];
}
