/* novaReactions — Nova as one companion, reacting in-context across the app.

   She already reacts on a cook (CookCelebration) and on expiring pantry items
   (NovaUseItUp). This engine gives her a voice on the other surfaces the app
   asked for: the Vault (your cookbook) and a store check-in. Given a surface +
   a little context, it picks the single most-worth-saying reaction, in her
   current mood voice. Some reactions are "love-letters"/celebrations flagged
   `saveable` — those are what the Memory Vault collects.

   Pure + deterministic: the caller gathers ctx (counts, streak, expiring items)
   and passes it in, so this stays testable and offline. */

// Term of endearment by tone — the lightest possible mood flavor.
const ENDEAR = {
  listener: '', calm: '', coach: 'chef', cheerleader: 'superstar', sassy: 'babe',
};

function endear(tone) { return ENDEAR[tone] || ''; }

// Append the endearment naturally: "... before then, babe." / "... before then."
function warmClose(text, tone) {
  const e = endear(tone);
  if (!e) return text.replace(/\{you\}/g, '').replace(/,\s*\./g, '.').replace(/\s+\./g, '.');
  return text.replace(/\{you\}/g, e);
}

function weekdayIn(days) {
  const n = Math.round(days);
  if (n <= 0) return 'today';
  if (n === 1) return 'tomorrow';
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

const plural = (n, one, many) => (n === 1 ? one : (many || one + 's'));

/**
 * Pick Nova's reaction for a surface, or null if she has nothing to say.
 * @param surface 'vault' | 'checkin' | 'cook'
 * @param ctx     surface context (see callers)
 * @param tone    current Nova tone (novaSettings)
 * @returns { id, kind, text, cta, saveable } | null
 *   kind: 'celebration' | 'love' | 'nudge' | 'observation'
 */
export function pickReaction(surface, ctx = {}, tone = 'listener') {
  const r = surface === 'vault' ? vaultReaction(ctx)
    : surface === 'checkin' ? checkinReaction(ctx)
    : surface === 'cook' ? cookReaction(ctx)
    : null;
  if (!r) return null;
  return { ...r, text: warmClose(r.text, tone) };
}

function vaultReaction(ctx) {
  const {
    savedCount = 0, cookedCount = 0, lastCookDaysAgo = null,
    topCuisine = null, topCuisineCount = 0, expiring = [],
  } = ctx;

  // 1) Time-sensitive: something in the fridge is about to turn.
  if (expiring.length) {
    const soonest = expiring[0];
    return {
      id: 'vault-expiring', kind: 'nudge', saveable: false,
      text: `Heads up — your ${soonest.name.toLowerCase()} turns by ${weekdayIn(soonest.daysLeft)}. Cook it or freeze it before then, {you}.`,
      cta: { label: 'What can I make?', route: '/pantry' },
    };
  }

  // 2) You've cooked before but drifted.
  if (cookedCount > 0 && lastCookDaysAgo != null && lastCookDaysAgo >= 5) {
    return {
      id: 'vault-drift', kind: 'nudge', saveable: false,
      text: `It's been ${lastCookDaysAgo} days since you cooked. Your vault's got ${savedCount} idea${plural(savedCount, '')} waiting — pick one tonight?`,
      cta: { label: 'Open a recipe', route: '/recipe-cards' },
    };
  }

  // 3) Saving but never cooking.
  if (savedCount >= 8 && cookedCount === 0) {
    return {
      id: 'vault-allsaved', kind: 'nudge', saveable: false,
      text: `${savedCount} recipes saved and none cooked yet — let's change that, {you}. Start with the easiest one.`,
      cta: { label: 'Pick one', route: '/recipe-cards' },
    };
  }

  // 4) A love-letter about their taste.
  if (topCuisine && topCuisineCount >= 4) {
    return {
      id: 'vault-taste', kind: 'love', saveable: true,
      text: `${topCuisine} is clearly your love language — ${topCuisineCount} saved. I'm a little in awe of your taste, {you}.`,
      cta: null,
    };
  }

  // 5) Celebrate the body of work.
  if (cookedCount >= 5) {
    return {
      id: 'vault-milestone', kind: 'celebration', saveable: true,
      text: `${cookedCount} dishes cooked and counting. Every one of them, you made real. That's the whole thing.`,
      cta: null,
    };
  }

  // 6) A warm default when there's a collection.
  if (savedCount > 0) {
    return {
      id: 'vault-warm', kind: 'love', saveable: true,
      text: `Your vault's looking good — ${savedCount} recipe${plural(savedCount, '')} you picked because they're you.`,
      cta: null,
    };
  }

  // 7) Empty vault.
  return {
    id: 'vault-empty', kind: 'observation', saveable: false,
    text: `Empty vault, full potential. Save a few recipes and I'll help you actually cook them.`,
    cta: { label: 'Browse recipes', route: '/recipe-cards' },
  };
}

function checkinReaction(ctx) {
  const {
    streak = 0, hitMilestone = false, restaurantName = null,
    restaurantCuisine = null, savedInCuisineCount = 0, checkedInToday = false,
  } = ctx;

  // 1) Milestone celebration — a keepsake.
  if (hitMilestone && streak > 0) {
    return {
      id: 'checkin-milestone', kind: 'celebration', saveable: true,
      text: `${streak}-day streak! You keep showing up — for the food, and for yourself. I see it, {you}.`,
      cta: null,
    };
  }

  // 2) Logged a restaurant you already have recipes for → recreate at home.
  if (restaurantCuisine && savedInCuisineCount > 0) {
    return {
      id: 'checkin-recreate', kind: 'nudge', saveable: false,
      text: `${restaurantName || restaurantCuisine} logged. You've already got ${savedInCuisineCount} ${restaurantCuisine} recipe${plural(savedInCuisineCount, '')} saved — recreate one at home this week?`,
      cta: { label: 'See your saved', route: '/my-cookbook' },
    };
  }

  // 3) New cuisine logged → she'll learn your taste.
  if (restaurantCuisine) {
    return {
      id: 'checkin-newcuisine', kind: 'observation', saveable: false,
      text: `${restaurantCuisine} tonight? Noted. I'll start steering your recipe picks that way.`,
      cta: { label: 'Find recipes', route: '/recipe-cards' },
    };
  }

  // 4) Checked in today — small ritual.
  if (checkedInToday && streak > 0) {
    return {
      id: 'checkin-ritual', kind: 'observation', saveable: false,
      text: `Checked in — day ${streak}. Little rituals, big streaks. Keep going, {you}.`,
      cta: null,
    };
  }

  // 5) Plain hello.
  return {
    id: 'checkin-hello', kind: 'observation', saveable: false,
    text: `Good to see you. Whenever you're ready to cook, I'm right here.`,
    cta: null,
  };
}

// "You made it" — the fourth surface, unified onto this same engine so
// CookCelebration's line is tone-aware and lands in the Vault the same way
// a Vault/check-in reaction does, instead of its own disconnected line bank.
// Every cook is `saveable` (matches the previous CookCelebration behavior —
// each dish you make is its own keepsake, not a once-a-day summary like the
// state-based vault/checkin reactions).
function cookReaction(ctx) {
  const { dishName = 'a dish', totalCooked = 0, streak = 0, newCountry = null } = ctx;

  // 1) A new cuisine unlocked — a real milestone.
  if (newCountry) {
    return {
      id: 'cook-newcountry', kind: 'celebration', saveable: true,
      text: `${dishName} just unlocked ${String(newCountry).toUpperCase()} — your cooking world keeps growing. That's on you, {you}.`,
      cta: null,
    };
  }

  // 2) Streak milestone.
  if (streak > 0 && isStreakMilestone(streak)) {
    return {
      id: 'cook-streak-milestone', kind: 'celebration', saveable: true,
      text: `${streak}-day streak, and you just cooked ${dishName} to prove it. You keep showing up — for the food, and for yourself.`,
      cta: null,
    };
  }

  // 3) Body-of-work celebration, every 5 dishes.
  if (totalCooked > 0 && totalCooked % 5 === 0) {
    return {
      id: 'cook-milestone', kind: 'celebration', saveable: true,
      text: `${totalCooked} dishes cooked and counting. Every one of them, you made real. That's the whole thing.`,
      cta: null,
    };
  }

  // 4) Plain warm default — still worth a line and a keepsake.
  return {
    id: 'cook-warm', kind: 'love', saveable: true,
    text: `You actually made ${dishName}. That's the whole thing — you showed up and cooked.`,
    cta: null,
  };
}

/* Milestone streak days that earn a saved celebration. */
export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 100];
export function isStreakMilestone(streak) {
  return STREAK_MILESTONES.includes(streak);
}
