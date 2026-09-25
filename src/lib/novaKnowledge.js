/* novaKnowledge — the offline half of "Ask Nova".

   Ask Nova answers real cooking questions (substitutes, technique, "why didn't
   it brown", food safety). This module is the DETERMINISTIC brain: a curated
   cooking-knowledge base + keyword retrieval over the user's recipe books
   (recipes_full.json). It always produces a grounded, cited answer with zero
   network — so Ask Nova works on the deployed site with no API key. When the
   kitchen AI is switched on (OPENAI_API_KEY / npm run dev:ai), the endpoint's
   `ask` mode writes a richer answer on top of the SAME retrieved sources.

   SCOPE HONESTY: this is a hand-authored knowledge base + substring retrieval,
   not a model and not a live feed. It's deliberately narrow and practical. */

import { FOOD_SAFETY_TOPICS } from './foodSafety';
import { GUT_HEALTH_TOPICS } from './gutHealth';

/* ── Substitutions ──────────────────────────────────────────────────────────
   Keyed by the missing ingredient; the first entry is the go-to swap. */
export const SUBSTITUTIONS = {
  butter:        [['equal olive oil or coconut oil', 'for sautéing'], ['¾ the amount in oil', 'for baking, by volume']],
  egg:           [['¼ cup unsweetened applesauce', 'per egg, in baking'], ['1 tbsp ground flax + 3 tbsp water, rested 5 min', 'binder']],
  eggs:          [['¼ cup applesauce or mashed banana each', 'in baking'], ['flax egg (1 tbsp flax + 3 tbsp water) each', 'vegan binder']],
  buttermilk:    [['1 cup milk + 1 tbsp lemon juice or vinegar, rest 5 min', 'the classic fix']],
  milk:          [['equal water or any unsweetened plant milk', 'in most cooking'], ['½ cream + ½ water', 'for richness']],
  cream:         [['equal evaporated milk', 'for sauces'], ['whole milk + 1 tbsp butter per cup', 'in a pinch']],
  'sour cream':  [['plain Greek yogurt, 1:1', 'nearly identical'], ['buttermilk in batters']],
  yogurt:        [['sour cream, 1:1'], ['buttermilk for thinner batters']],
  'brown sugar': [['1 cup white sugar + 1 tbsp molasses', 'exact match']],
  sugar:         [['honey or maple (use ¾ cup, cut other liquid by 3 tbsp)', 'per cup']],
  flour:         [['equal gluten-free 1:1 blend'], ['for thickening: half as much cornstarch']],
  'baking powder':[['¼ tsp baking soda + ½ tsp cream of tartar', 'per 1 tsp']],
  'baking soda': [['3× the amount of baking powder', 'weaker, but works']],
  cornstarch:    [['2 tbsp flour per 1 tbsp cornstarch', 'for thickening'], ['arrowroot, 1:1']],
  garlic:        [['⅛ tsp garlic powder per clove']],
  onion:         [['1 tbsp onion powder per medium onion'], ['shallots or leeks, milder']],
  shallot:       [['½ a small onion + a pinch of garlic']],
  wine:          [['equal stock + 1 tsp vinegar or lemon', 'deglazing / braises']],
  'white wine':  [['stock + a squeeze of lemon']],
  'red wine':    [['beef stock + 1 tsp balsamic']],
  stock:         [['water + a bouillon cube', 'or just well-salted water']],
  broth:         [['water + bouillon, or water + a parmesan rind simmered in']],
  lemon:         [['equal lime, or 1 tbsp vinegar per lemon']],
  'lemon juice': [['equal lime juice or ½ the amount of vinegar']],
  honey:         [['equal maple syrup or agave']],
  'soy sauce':   [['tamari (gluten-free), or fish sauce for savory depth']],
  breadcrumbs:   [['crushed crackers, oats, or panko']],
  parmesan:      [['pecorino, or grana padano, 1:1']],
  cilantro:      [['flat-leaf parsley (loses citrus note)']],
  'heavy cream': [['⅔ cup milk + ⅓ cup melted butter per cup']],
  mayonnaise:    [['plain Greek yogurt, for tang and less fat']],
  'bread flour': [['all-purpose + 1 tsp vital wheat gluten per cup, or just all-purpose']],
};

/* ── Cooking knowledge base — technique, troubleshooting, food safety ─────── */
export const KNOWLEDGE = [
  { id: 'browning', category: 'technique',
    keywords: ['brown', 'browning', 'didn\'t brown', 'not browning', 'sear', 'searing', 'maillard', 'caramel', 'caramelize', 'grey', 'gray', 'pale', 'no color', 'won\'t crisp', 'not crispy', 'soggy sear'],
    title: 'Why it didn\'t brown',
    answer: 'Browning (the Maillard reaction) needs three things: high heat, a dry surface, and space. The usual culprits — the pan wasn\'t hot enough (preheat 2–3 min until it shimmers), the food was wet (pat it bone-dry first), or the pan was crowded so it steamed instead of seared. Work in batches, don\'t move the food for the first couple minutes, and use a little oil with a high smoke point.' },
  { id: 'caramelize-onion', category: 'technique',
    keywords: ['onion', 'onions', 'caramelize onion', 'caramelized onion', 'onions not brown', 'onions burning'],
    title: 'Caramelizing onions',
    answer: 'Real caramelized onions take 30–45 minutes — there\'s no true shortcut. Medium-low heat, a wide pan so they\'re not piled up, and stir every few minutes. If they\'re burning at the edges, drop the heat and add a splash of water to deglaze. A pinch of salt early pulls out moisture and speeds things along. If you rushed and they\'re pale, they just need more time.' },
  { id: 'chicken-temp', category: 'food-safety',
    keywords: ['chicken done', 'chicken safe', 'chicken temp', 'chicken temperature', 'raw chicken', 'is my chicken', 'poultry', 'undercooked chicken', 'pink chicken'],
    title: 'Chicken doneness & safety',
    answer: 'Chicken is safe at 165°F / 74°C at the thickest part — that\'s the only reliable test; use an instant-read thermometer. Juices running clear is a rough sign but not proof. Whole birds: check the inner thigh, not touching bone. Let it rest 5 minutes after; carryover heat finishes it and keeps it juicy. When in doubt, cook it a touch more — undercooked poultry isn\'t worth the risk.' },
  { id: 'leftovers', category: 'food-safety',
    keywords: ['leftover', 'leftovers', 'how long', 'fridge safe', 'still good', 'go bad', 'store cooked', 'keep in fridge', 'days in fridge'],
    title: 'Storing leftovers safely',
    answer: 'Cooked leftovers keep 3–4 days in the fridge (below 40°F / 4°C). Get them refrigerated within 2 hours of cooking — 1 hour if the kitchen\'s hot. Cool large batches faster by splitting into shallow containers. Reheat to 165°F / 74°C, and only reheat a portion once. If it smells off, is slimy, or you\'re unsure how long it\'s been — toss it. Freeze anything you won\'t eat in time.' },
  { id: 'rice-safety', category: 'food-safety',
    keywords: ['rice', 'reheat rice', 'leftover rice', 'rice safe', 'fried rice'],
    title: 'Rice safety (the important one)',
    answer: 'Cooked rice can grow Bacillus cereus, which survives reheating — so cool it fast and refrigerate within 1 hour. Keep no more than a day, reheat once until steaming hot, and never leave cooked rice sitting at room temperature. This is exactly why day-old, properly chilled rice is the move for fried rice — just don\'t let it sit out.' },
  { id: 'thaw', category: 'food-safety',
    keywords: ['thaw', 'defrost', 'frozen meat', 'thawing', 'defrosting'],
    title: 'Thawing safely',
    answer: 'Thaw in the fridge (safest, plan a day ahead), in a cold-water bath changed every 30 min (faster), or in the microwave if you\'re cooking it right away. Never thaw on the counter — the outside hits the bacterial danger zone (40–140°F) while the middle\'s still frozen. Meat thawed in cold water or microwave should be cooked immediately, not refrigerated for later.' },
  { id: 'rest-meat', category: 'technique',
    keywords: ['rest meat', 'resting', 'steak dry', 'juices', 'rest steak', 'let it rest', 'cutting too soon'],
    title: 'Resting meat',
    answer: 'Rest cooked meat before slicing — 5 minutes for a steak or chops, 10–20 for a roast. Cutting straight away dumps all the juices onto the board and leaves the meat dry. During the rest the muscle fibers relax and reabsorb moisture. Tent loosely with foil so it stays warm without steaming the crust you worked for.' },
  { id: 'sauce-thin', category: 'troubleshooting',
    keywords: ['sauce thin', 'sauce watery', 'thicken', 'too runny', 'watery', 'thin sauce', 'gravy thin', 'soup thin'],
    title: 'Thickening a thin sauce',
    answer: 'Fastest fix: a slurry — 1 tbsp cornstarch whisked into 2 tbsp cold water, stirred in, then simmered a minute until it clears and thickens. Or just simmer uncovered to reduce and concentrate. For creamy sauces, a knob of cold butter swirled in at the end (a "monté") adds body and shine. Add thickener gradually; you can always add more, but you can\'t un-thicken easily.' },
  { id: 'sauce-thick', category: 'troubleshooting',
    keywords: ['sauce thick', 'too thick', 'paste', 'gloopy', 'thin out', 'loosen sauce'],
    title: 'Loosening a too-thick sauce',
    answer: 'Whisk in warm liquid a splash at a time — pasta water, stock, milk, or cream depending on the sauce — until it flows again. Pasta water is best for pasta sauces; the starch keeps it glossy instead of watery. Go slow; it thins faster than you\'d think.' },
  { id: 'over-salted', category: 'troubleshooting',
    keywords: ['too salty', 'over salted', 'oversalted', 'salty', 'fix salt', 'too much salt'],
    title: 'Fixing over-salted food',
    answer: 'You can\'t remove salt, only dilute or balance it. Add more unsalted liquid or bulk (water, stock, more veg, a peeled potato simmered in and removed), or stretch the batch. A squeeze of acid (lemon, vinegar) or a little sweetness distracts the palate. For soups and braises, adding unsalted broth is the surest fix.' },
  { id: 'emulsion-broke', category: 'troubleshooting',
    keywords: ['broke', 'broken sauce', 'split', 'curdled sauce', 'separated', 'emulsion', 'hollandaise broke', 'mayo broke', 'vinaigrette separated'],
    title: 'Rescuing a broken sauce',
    answer: 'A broken emulsion (mayo, hollandaise, vinaigrette, butter sauce) usually means the fat went in too fast or the temperature spiked. Rescue it by starting a new base — a fresh egg yolk or a teaspoon of mustard or warm water in a clean bowl — and whisking the broken sauce into it drop by drop until it comes back together. Slow and steady re-forms the emulsion.' },
  { id: 'curdled', category: 'troubleshooting',
    keywords: ['curdle', 'curdled', 'cream split', 'dairy split', 'grainy sauce', 'yogurt split'],
    title: 'Curdled dairy',
    answer: 'Dairy curdles from too much heat or acid. Prevent it: temper first (whisk a little hot liquid into the cold dairy before adding it back), keep it below a simmer, and add acidic ingredients off the heat. Once fully curdled it rarely comes back, but a quick blitz with an immersion blender can smooth a lightly grainy sauce.' },
  { id: 'dense-cake', category: 'troubleshooting',
    keywords: ['dense cake', 'cake dense', 'flat cake', 'didn\'t rise', 'not rise', 'heavy cake', 'gummy', 'tough cake'],
    title: 'Dense or flat baked goods',
    answer: 'Usual suspects: dead leavener (baking soda/powder older than ~6 months), overmixing (develops gluten — mix just until combined), or too much flour (spoon it into the cup and level, don\'t scoop). Cold ingredients and an unheated oven also flatten a rise. Measure by weight if you can, and don\'t open the oven early.' },
  { id: 'sticky-pan', category: 'technique',
    keywords: ['sticking', 'stuck', 'sticks to pan', 'food stuck', 'won\'t release', 'stuck to pan'],
    title: 'Food sticking to the pan',
    answer: 'Two things: heat and patience. Preheat the pan before the oil, and the oil before the food — a properly hot pan sears a release layer. Then leave it alone; protein sticks hard at first and naturally releases once it\'s browned, so if it won\'t lift, it\'s not ready to flip. Give it another minute.' },
  { id: 'soggy-veg', category: 'technique',
    keywords: ['soggy', 'mushy veg', 'steamed not roasted', 'vegetables soggy', 'limp', 'not crispy veg', 'roast veg'],
    title: 'Soggy roasted vegetables',
    answer: 'Sogginess is steam with nowhere to go. Crank the oven (425–450°F), dry the veg well, toss with enough oil, and spread them in a single layer with space between — crowding traps moisture. Don\'t flip too early; let a crust form first. A preheated sheet pan helps too.' },
  { id: 'season', category: 'technique',
    keywords: ['bland', 'no flavor', 'flavorless', 'needs something', 'tastes flat', 'under seasoned', 'season'],
    title: 'Food tastes flat',
    answer: 'Flat food is usually missing salt or acid. Salt in layers as you cook, not just at the end, and taste as you go. If it\'s salted enough but still dull, add acid — a squeeze of lemon or a splash of vinegar wakes everything up. A little fat (butter, oil, cheese) carries flavor, and fresh herbs or a pinch of sugar can balance the last bit.' },
  { id: 'tough-meat', category: 'troubleshooting',
    keywords: ['tough meat', 'chewy', 'dry meat', 'rubbery', 'overcooked meat', 'tough steak', 'tough beef'],
    title: 'Tough or dry meat',
    answer: 'Two different problems: lean cuts (steak, chicken breast) go dry when overcooked — pull them earlier and use a thermometer. Tough cuts (chuck, shoulder, brisket) are the opposite: they need long, low, moist cooking to break down collagen, so if they\'re chewy they\'re undercooked — keep braising. Always slice across the grain to shorten the fibers.' },
  { id: 'pasta', category: 'technique',
    keywords: ['pasta sticky', 'pasta stuck', 'gummy pasta', 'pasta water', 'salt pasta', 'mushy pasta'],
    title: 'Better pasta',
    answer: 'Salt the water like the sea and use plenty of it. Stir in the first minute so it doesn\'t clump, and don\'t add oil to the water — it just makes sauce slide off. Pull it a minute before the box says (al dente) and finish it in the sauce with a splash of the starchy pasta water; that\'s what makes the sauce cling.' },
  // Food-handler-exam-grade food safety (danger zone, safe temps by protein,
  // cross-contamination, hand-washing, marinade reuse, produce washing,
  // sanitizing, storage temps) — see foodSafety.js for the source data.
  ...FOOD_SAFETY_TOPICS,
  // Real gut-health science (fiber/SCFAs, fermented foods, prebiotics vs
  // polyphenols, plant diversity, FODMAP, gut disruptors, gut-brain axis) —
  // see gutHealth.js for the source data + citations.
  ...GUT_HEALTH_TOPICS,
];

/* ── Pretty-print a source_file into a book-ish citation ─────────────────── */
export function prettyBook(sourceFile) {
  if (!sourceFile) return 'your recipe collection';
  const base = String(sourceFile).replace(/\.json$/i, '');
  const stop = /^(phase\d*|authentic|recipes?|full|final|collection|v\d+|\d+)$/i;
  const nameTokens = [];
  for (const t of base.split(/[-_]/)) { if (stop.test(t)) break; nameTokens.push(t); }
  const country = (nameTokens.length ? nameTokens : [base.split(/[-_]/)[0]])
    .map(w => w.replace(/\b\w/g, c => c.toUpperCase())).join(' ');
  if (/authentic/i.test(base)) return `${country} — Authentic Recipes`;
  if (/phase/i.test(base))     return `${country} Collection`;
  return country;
}

const STOP = new Set(['the','a','an','my','is','are','do','i','how','to','for','of','with','and','why','what','when','it','in','on','can','should','you','me','this','that','not','did','was','get','make','made','cook','cooking','recipe']);

function terms(q) {
  return String(q || '').toLowerCase().replace(/[^\w\s']/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
}

/* ── Retrieval: find the recipes most relevant to the question (citations) ── */
export function retrieveRecipes(question, recipes = [], limit = 3) {
  const t = terms(question);
  if (!t.length || !recipes.length) return [];
  const scored = [];
  for (const r of recipes) {
    const hay = [
      r.name, r.full_name, r.cuisine, r.recipe_type,
      ...(r.ingredients || []).map(i => (typeof i === 'string' ? i : i?.name || '')),
      ...(r.instructions || []).map(s => (typeof s === 'string' ? s : s?.text || s?.instruction || '')),
      ...(Array.isArray(r.tips) ? r.tips : []),
    ].join(' ').toLowerCase();
    let score = 0;
    for (const w of t) if (hay.includes(w)) score += (r.name || '').toLowerCase().includes(w) ? 3 : 1;
    if (score > 0) scored.push({ r, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ r }) => ({
    id: r.id,
    name: r.name || r.full_name || 'Recipe',
    source: prettyBook(r.source_file || r.source_book),
  }));
}

/* ── Intent + deterministic answer ─────────────────────────────────────────── */
export function classify(question) {
  const q = String(question || '').toLowerCase();
  const subMatch = q.match(/(?:substitut\w*|instead of|replace|swap|out of|no more|don'?t have)\s+(?:for\s+)?([a-z\s]+?)(?:\?|$|,|\bin\b|\bfor\b)/);
  if (/substitut|instead of|replace|swap|out of|don'?t have|no more/.test(q)) {
    return { category: 'substitution', subject: (subMatch?.[1] || '').trim() };
  }
  const qTerms = terms(q);
  let best = null, bestScore = 0;
  for (const k of KNOWLEDGE) {
    let s = 0;
    // Full-phrase keyword hit is a strong signal.
    for (const kw of k.keywords) if (q.includes(kw)) s += kw.split(' ').length * 2;
    // Looser: overlap between the question's significant words and this entry's
    // keyword vocabulary, so varied phrasings ("sauce is too thin") still land.
    const vocab = new Set(k.keywords.join(' ').split(' ').filter(w => w.length > 2));
    for (const w of qTerms) if (vocab.has(w)) s += 1;
    if (s > bestScore) { bestScore = s; best = k; }
  }
  // Require a little confidence so a single stray word doesn't force a match.
  return bestScore >= 2 && best ? { category: best.category, entry: best } : { category: 'general' };
}

function findSubstitution(subject) {
  if (!subject) return null;
  const s = subject.toLowerCase().trim();
  if (SUBSTITUTIONS[s]) return { key: s, subs: SUBSTITUTIONS[s] };
  // loose match: the subject contains, or is contained by, a known key
  for (const key of Object.keys(SUBSTITUTIONS)) {
    if (s.includes(key) || key.includes(s)) return { key, subs: SUBSTITUTIONS[key] };
  }
  return null;
}

/**
 * Deterministic answer to a cooking question, grounded in the user's books.
 * @returns { text, citations, category, matched } — always returns something.
 */
export function answerQuestion(question, recipes = []) {
  const cls = classify(question);
  const citations = retrieveRecipes(question, recipes, 3);

  if (cls.category === 'substitution') {
    const found = findSubstitution(cls.subject);
    if (found) {
      const [top, ...rest] = found.subs;
      let text = `Out of ${found.key}? Use ${top[0]}${top[1] ? ` (${top[1]})` : ''}.`;
      if (rest.length) text += ` Or: ${rest.map(r => `${r[0]}${r[1] ? ` — ${r[1]}` : ''}`).join('; ')}.`;
      return { text, citations, category: 'substitution', matched: true };
    }
    return {
      text: cls.subject
        ? `I don't have a tested swap for ${cls.subject} on hand. Safe general moves: match it by role — fat for fat, acid for acid, sweet for sweet — and start with less than the original called for.`
        : `Tell me what you're out of (e.g. "substitute for buttermilk") and I'll give you the swap.`,
      citations, category: 'substitution', matched: false,
    };
  }

  if (cls.entry) {
    return { text: cls.entry.answer, citations, category: cls.category, matched: true };
  }

  // General: no knowledge hit. Lean on retrieval if we found relevant recipes.
  if (citations.length) {
    return {
      text: `I don't have a tuned answer for that yet, but your books cover it — ${citations.map(c => c.name).join(', ')} touch on this. Open one and I'll walk the steps with you.`,
      citations, category: 'general', matched: false,
    };
  }
  return {
    text: `I can help most with substitutions, technique ("why didn't it brown"), fixing a dish that went wrong, and food safety. Ask me one of those and I'll give you a straight answer.`,
    citations, category: 'general', matched: false,
  };
}

/* ── Nova's mood voice — wrap a plain answer in the current tone ──────────── */
const VOICE = {
  listener:    { open: '', close: 'Take it at your pace.' },
  calm:        { open: 'Okay — breathe. ', close: 'Slow and steady; you\'ve got this.' },
  coach:       { open: 'Here\'s the fix. ', close: 'Do that and you\'re set.' },
  cheerleader: { open: 'Ooh, good question! ', close: 'You\'re gonna nail it! 🎉' },
  sassy:       { open: 'Okay, listen — ', close: '…you\'re welcome, babe. 💅' },
};

export function voiceWrap(text, tone = 'listener', { withClose = true, plainLanguage = false } = {}) {
  const v = VOICE[tone] || VOICE.listener;
  const open = v.open && !/^okay/i.test(text) ? v.open : '';
  const close = withClose && v.close ? ` ${v.close}` : '';
  const body = plainLanguage ? simplify(text) : text;
  return `${open}${body}${close}`;
}

/* ── Plain-language pass — accessible phrasing for different comprehension
   levels. Deterministic, rule-based (word swaps + shorter sentences), not a
   readability model — same "honest heuristic, not fake AI" convention as the
   rest of this file. Off by default; on via novaSettings' plainLanguage. */
const JARGON_SWAP = [
  [/\bmaillard reaction\b/gi, 'browning'],
  [/\bemulsion(s)?\b/gi, 'sauce mix$1'],
  [/\bemulsify\b/gi, 'mix smoothly'],
  [/\btemper(ed|ing)?\b/gi, 'warm slowly'],
  [/\bdeglaze\b/gi, 'add liquid to lift the browned bits'],
  [/\bcarryover heat\b/gi, 'heat left in the food after cooking'],
  [/\bmonté\b/gi, 'swirl in cold butter'],
  [/\bcollagen\b/gi, 'the tough connective tissue'],
  [/\binstant-read thermometer\b/gi, 'food thermometer'],
];

// Drop parenthetical asides — usually the technical elaboration, not needed
// once the jargon itself has been swapped for a plain phrase above.
function stripAsides(text) {
  return text.replace(/\s*\([^)]*\)/g, '');
}

// Split on semicolons/dashes into separate sentences, and break any sentence
// still over ~16 words at its nearest comma to the midpoint.
function shortenSentences(text) {
  const pieces = text.split(/;|\s+—\s+|\s+-\s+(?=[a-z])/i);
  const out = [];
  for (let s of pieces) {
    s = s.trim();
    if (!s) continue;
    const words = s.split(/\s+/);
    if (words.length > 16) {
      const commaIdx = s.indexOf(',', Math.floor(s.length / 2) - 10);
      if (commaIdx > 0) {
        out.push(s.slice(0, commaIdx + 1).trim());
        s = s.slice(commaIdx + 1).trim();
      }
    }
    if (s) {
      s = s.charAt(0).toUpperCase() + s.slice(1);
      out.push(/[.!?]$/.test(s) ? s : `${s}.`);
    }
  }
  return out.join(' ');
}

export function simplify(text) {
  if (!text) return text;
  let out = text;
  for (const [re, replacement] of JARGON_SWAP) out = out.replace(re, replacement);
  out = stripAsides(out);
  out = shortenSentences(out);
  return out;
}

export const SUGGESTED_QUESTIONS = [
  'Why didn\'t my onions brown?',
  'Substitute for buttermilk?',
  'How long are leftovers good in the fridge?',
  'My sauce is too thin — how do I fix it?',
  'Is my chicken safe to eat?',
  'Why is my meat tough?',
  'How long can food sit out?',
  'What\'s the safe temp for this?',
];
