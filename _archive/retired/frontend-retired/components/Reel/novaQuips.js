/* novaQuips.js — the Nova voice line bank for the 7-second Reel Feed.

   Every reel flashes a Nova quip on its final "BOOM" beat (6→7s). Nova is
   reacting to *your* cooking, never narrating it — that's the dopamine hook
   that makes people re-watch to catch what she said. Lines are grouped by
   recipe type so a comfort-food reel never gets a "that's so clean and green"
   quip. Keep every line punchy (roughly ≤9 words) and in Nova's voice:
   proud, a little unhinged, hype-woman energy.

   Writers: add lines freely — `pickNovaQuip` just reads whatever's here.
   Reels reference a category via `quipCategory` in reels.data.js. */

export const NOVA_QUIPS = {
  comfort: [
    'Boom. You just out-cooked the restaurant.',
    "That's giving Michelin. I'm not crying, you are.",
    'A hug you can eat. I felt that.',
    'You made cozy a food group. Respect.',
    "Nobody's ordering out tonight. Not on my watch.",
    'That steam? That’s the sound of winning.',
    'Certified comfort. Go text your mom.',
  ],
  healthy: [
    'Boom. You did that. Green never looked so smug.',
    'Clean, bright, kinda showing off. I love it.',
    'Your body just sent a thank-you note.',
    'That plate glows. So do you now.',
    'Health food that slaps? Groundbreaking. Proud.',
    'Fresh flip, chef. Olympic-level.',
    'You ate the rainbow and won.',
  ],
  indulgent: [
    'Boom. You just made a 5-star meal in 7 seconds.',
    "That's illegal in six states. Keep going.",
    'Diet starts tomorrow. Tonight we feast.',
    'Cheese pull of the century. Framed it.',
    'You maniac. That looks incredible.',
    'No notes. Just drool. Absolute unit of a dish.',
    "I'm vibrating. You cooked that too well.",
  ],
  quick: [
    'Boom. Faster than delivery, better than delivery.',
    'Seven seconds to watch, ten to make. Legend.',
    'You blinked and dinner appeared. Wizard.',
    'Zero regrets. Maximum flavor. Go.',
    'That was quick. That was elite. Bye.',
    'Lazy? No. Efficient? Devastatingly.',
    'One pan. One genius. You.',
  ],
  spicy: [
    'Boom. That heat woke up the whole block.',
    'Spicy AND plated? Show-off. I adore it.',
    'My eyes are watering and I have no eyes.',
    'That kick has a criminal record. Iconic.',
    'You brought the fire. Literally. Chef behavior.',
    'Sweat now, glory forever. Well done.',
    'That sizzle just filed a police report.',
  ],
  showstopper: [
    'Boom. That plating is giving fine dining.',
    'I saw that flip. Olympic-level.',
    "You're a kitchen witch now. It's official.",
    'That took skill. You HAVE skill. Framed.',
    "Restaurants are nervous. As they should be.",
    'A whole event on one plate. Standing ovation.',
    'Chef mode: fully unlocked. Terrifying. Beautiful.',
  ],
  breakfast: [
    'Boom. Brunch could never. You did.',
    'That yolk break just healed me.',
    "Morning person? No. Morning genius? Yes.",
    'You made 8am worth showing up for.',
    'That runny egg deserves an award. Nominating it.',
    'Sunrise on a plate. Absolutely showing off.',
    'Café prices are shaking. Good.',
  ],
  dessert: [
    'Boom. Dentist nervous, everyone else thrilled.',
    "That's a hug with sugar in it.",
    'You sweet, chaotic genius. Beautiful.',
    'One bite and I forgot my problems. Elite.',
    'Bakery-tier. In your kitchen. Illegal.',
    'That drizzle was personal. I felt it.',
    'Life is short. You made it sweeter. Iconic.',
  ],
};

const FALLBACK_CATEGORY = 'comfort';

/* Pick a quip for a reel. Deterministic when you pass a `seed` (so it can be
   stable per loop), random otherwise. `fallback` is used verbatim if the
   category is empty/unknown — reels keep their hand-picked line that way. */
export function pickNovaQuip(category, fallback, seed) {
  const bank = NOVA_QUIPS[category] || NOVA_QUIPS[FALLBACK_CATEGORY];
  if (!bank || !bank.length) return fallback || '';
  const i = typeof seed === 'number'
    ? Math.abs(Math.floor(seed)) % bank.length
    : Math.floor(Math.random() * bank.length);
  return bank[i];
}

/* Total count — handy for the style guide / QA ("50+ lines" claim). */
export const NOVA_QUIP_COUNT = Object.values(NOVA_QUIPS).reduce((n, arr) => n + arr.length, 0);
