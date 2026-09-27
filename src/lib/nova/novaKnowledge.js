/* ============================================================================
   Merged module: src/lib/nova/novaKnowledge.js
   Combines the original src/lib/novaKnowledge.js, src/lib/novaNudges.js, and
   src/lib/novaReactions.js. The old top-level files now re-export from here —
   see those files.

   Import path fixes (this file now lives one directory deeper, in
   src/lib/nova/ instead of src/lib/):
     novaKnowledge.js: './foodSafety' -> '../foodSafety', './gutHealth' -> '../gutHealth'
     novaNudges.js:    './flavorProfile' -> '../flavorProfile'
                       '../services/seasoningPairingEngine' -> '../../services/seasoningPairingEngine'
                       './cravingTracker' -> '../cravingTracker'
   ============================================================================ */

import { FOOD_SAFETY_TOPICS } from '../foodSafety';
import { GUT_HEALTH_TOPICS } from '../gutHealth';
import { loadFlavorProfile } from '../flavorProfile';
import { CRAVING_ARCHETYPES } from '../../services/seasoningPairingEngine';
// eslint-disable-next-line no-unused-vars -- kept for parity with the original
// novaNudges.js import list; stockAheadList wasn't referenced in that file's
// body either (todaySchedule/getTopNudge callers pass ctx.stockAhead in).
import { stockAheadList } from '../cravingTracker';

/* ── From novaKnowledge.js ───────────────────────────────────────────────────

   novaKnowledge — the offline half of "Ask Nova".

   Ask Nova answers real cooking questions (substitutes, technique, "why didn't
   it brown", food safety). This module is the DETERMINISTIC brain: a curated
   cooking-knowledge base + keyword retrieval over the user's recipe books
   (recipes_full.json). It always produces a grounded, cited answer with zero
   network — so Ask Nova works on the deployed site with no API key. When the
   kitchen AI is switched on (OPENAI_API_KEY / npm run dev:ai), the endpoint's
   `ask` mode writes a richer answer on top of the SAME retrieved sources.

   SCOPE HONESTY: this is a hand-authored knowledge base + substring retrieval,
   not a model and not a live feed. It's deliberately narrow and practical. */

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

/* ── From novaNudges.js ──────────────────────────────────────────────────────

   novaNudges.js — Nova's contextual "right-moment" nudge engine.

   The idea: the best time to reach a hungry, undecided person is *just before*
   they default to the drive-thru — and that moment is predictable from the
   clock, not from any live foot-traffic feed. This generalizes the Pantry's
   single "beat the drive-thru" intercept into a full day-long playbook of
   states, each with its own trigger window, Nova line, and call to action.

   HONEST SCOPE — the data reality:
   Live store busyness (SafeGraph / Placer / Google Popular Times / Cuebiq) is
   all paid, restricted, or backend-only, and none of it can run in this React
   app. So the timing here is a *behavioral model* (same basis as shopTiming.js),
   not a real-time signal. Everything downstream — the nudge copy, the routing,
   the convenience tier, the notification scheduling — is real and swaps straight
   onto a live feed the day one exists (scraped Popular Times, crowdsourced
   check-ins, or a Cuebiq baseline). Nothing here claims live data it doesn't have.

   The "monetize procrastination" angle is modeled explicitly: the deeper you are
   into the dinner-decision window, the higher the CONVENIENCE tier, and the more
   Nova leans on fast, premium shelf-stable staples (canned tuna, good olives,
   imported pasta). You're not shamed for waiting — you're sold the convenience of
   not thinking. That's a feature.

   CRAVING-AWARE nudges — the "what to eat right now" windows (lunch-rush,
   stress-craving, dinner-rush, friday-treat, late-night) also read the user's
   real learned flavor profile (flavorProfile.js's dig_in_craving_prefs — the
   same TikTok-style signal every recipe view/save/cook/skip already writes
   to) and bridge it into seasoningPairingEngine.js's CRAVING_ARCHETYPES — the
   same neuroscience-grounded craving decoder CravingCompass uses (brain
   state, body need, a real named recipe). That's what makes these nudges
   "logical": Nova isn't just guessing a generic line for the hour, she's
   citing the actual reason a body reaches for rich/salty/sweet/spicy food and
   naming a specific dish for it. Shop-timing nudges (sunday-prep,
   weekend-calm-shop, tuesday-restock) are left alone — those are about
   crowds and time, not personal craving, so forcing craving language into
   them would be dishonest padding, not logic. New users with no signal yet
   fall back to the original generic copy — never a fabricated craving. */

// The 8-flavor vocabulary flavorProfile.js learns (spicy/sweet/savory/rich/
// light/earthy/smoky/tangy) and the 7 CRAVING_ARCHETYPES (rich/salty/sweet/
// spicy/fresh/umami/warming) come from two different systems built for
// different jobs — this is a nearest-neighbor bridge between them, not a
// scientific claim. savory→umami and rich→rich are near-exact; light/tangy→
// fresh and earthy/smoky→warming are the closest reasonable match among the 7.
const FLAVOR_TO_ARCHETYPE = {
  spicy: 'spicy', sweet: 'sweet', savory: 'umami', rich: 'rich',
  light: 'fresh', tangy: 'fresh', earthy: 'warming', smoky: 'warming',
};

/** The craving archetype (brainState/bodyNeed/a real named recipe) behind
 * whichever flavor this user has actually been gravitating toward — or null
 * for a new user with no learned signal yet. Reused as-is by CravingCompass;
 * this just reads the SAME learned profile to feed Nova's nudges. */
export function dominantCravingArchetype() {
  const profile = loadFlavorProfile();
  const positive = Object.entries(profile).filter(([, v]) => v > 0);
  if (!positive.length) return null;
  positive.sort((a, b) => b[1] - a[1]);
  const [topFlavor] = positive[0];
  const archetypeId = FLAVOR_TO_ARCHETYPE[topFlavor];
  return archetypeId ? CRAVING_ARCHETYPES[archetypeId] : null;
}

// Short, sentence-ready "why" hook — the archetype's brainState is a full
// paragraph; a nudge card needs one punchy clause, not a lecture.
function cravingWhy(archetype) {
  return archetype.brainState.split('.')[0].trim() + '.';
}

// ── Time helpers ────────────────────────────────────────────────
const hourOf = (d) => d.getHours() + d.getMinutes() / 60;
const isWeekday = (d) => d.getDay() >= 1 && d.getDay() <= 5;
const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

function dayMatch(rule, d) {
  if (rule === 'all') return true;
  if (rule === 'weekday') return isWeekday(d);
  if (rule === 'weekend') return isWeekend(d);
  if (Array.isArray(rule)) return rule.includes(d.getDay());
  return false;
}

function fmtTime(h) {
  const hr = Math.floor(h) % 24;
  const min = Math.round((h - Math.floor(h)) * 60);
  const ampm = hr < 12 ? 'am' : 'pm';
  const h12 = hr % 12 === 0 ? 12 : hr % 12;
  return `${h12}:${String(min).padStart(2, '0')}${ampm}`;
}

/* How deep into the dinner-decision window are we? 0 = plenty of time (chill),
   1 = the rush is on, 2 = drive-thru is basically winning. Drives both Nova's
   tone and how hard she pushes fast/premium pantry recipes. */
export function convenienceLevel(now = new Date()) {
  if (!isWeekday(now)) {
    // Weekends drift later; a light single-step ramp in the evening.
    const t = hourOf(now);
    return t >= 18 ? 1 : 0;
  }
  const t = hourOf(now);
  if (t >= 17.5) return 2;   // 5:30pm+ — you waited, pay for speed
  if (t >= 16.5) return 1;   // 4:30pm  — the rush is starting
  return 0;                  // 4:00pm  — you're early, cook the real thing
}

const CONVENIENCE_COPY = [
  { tag: 'AHEAD OF IT', note: "You've got time — cook the real thing." },
  { tag: 'RUSH IS ON',  note: 'Fast wins now. Grab something 15-minute.' },
  { tag: 'DRIVE-THRU O’CLOCK', note: 'Lean on premium staples — canned tuna, good olives, imported pasta. Pay to not think.' },
];

// ── The playbook ────────────────────────────────────────────────
// priority: higher wins when multiple windows overlap.
// from/to/sendAt are fractional hours (16.5 = 4:30pm). `body(ctx, now)` returns
// the line Nova shows; ctx = { suggestionCount, pantryCount, tier }.
export const NUDGES = [
  {
    id: 'breakfast-rush',
    category: 'breakfast',
    icon: '☕',
    days: 'weekday', from: 6.5, to: 8.5, sendAt: 6.5,
    whenText: 'Weekdays · 6:30am',
    title: 'Beat the coffee-shop line',
    priority: 5,
    cta: { label: 'Quick breakfasts', route: '/recipes' },
    body: () => "Before you spend $7 on a muffin — 5-min overnight oats or a 3-min egg wrap does it. Future-you at 8am says thanks.",
  },
  {
    id: 'lunch-rush',
    category: 'lunch-rush',
    icon: '🥪',
    days: 'all', from: 11.5, to: 13.5, sendAt: 11.25,
    whenText: 'Daily · 11:15am',
    title: "It's the lunch rush",
    priority: 6,
    cravingAware: true,
    cta: { label: 'What I can make', route: '/pantry' },
    body: (ctx) => {
      const have = ctx?.suggestionCount > 0
        ? `You can plate ${ctx.suggestionCount} thing${ctx.suggestionCount !== 1 ? 's' : ''} from your pantry in less time than the wait. `
        : '';
      const c = ctx?.craving;
      if (c) {
        const dish = c.recipes?.[0];
        return `The drive-thru line is forming. ${have}You've been leaning ${c.label.toLowerCase()} lately. ${cravingWhy(c)}${dish ? ` ${dish.title} (${dish.totalTime} min) scratches that itch without the wait.` : ''}`;
      }
      return `The drive-thru line is forming. ${have || 'Ten minutes and a pantry beats twenty in a line.'}`;
    },
  },
  {
    id: 'stress-craving',
    category: 'stress-craving',
    icon: '🍫',
    days: 'weekday', from: 14, to: 15.25, sendAt: 14,
    whenText: 'Weekdays · 2:00pm',
    title: 'Post-lunch crash incoming',
    priority: 5,
    cravingAware: true,
    cta: { label: '3-minute fix', route: '/recipes' },
    body: (ctx) => {
      const c = ctx?.craving;
      if (c) {
        const dish = c.recipes?.[0];
        return `Your cortisol's spiking and your brain's offline. ${cravingWhy(c)} ${dish ? `${dish.title} (${dish.totalTime} min) meets it head-on — zero brain cells required.` : `A quick ${c.label.toLowerCase()} fix meets it head-on — zero brain cells required.`}`;
      }
      return "Your cortisol's spiking and your brain's offline. 3-minute chocolate mug cake, zero brain cells required. I won't tell.";
    },
  },
  {
    id: 'dinner-rush',
    category: 'dinner-rush',
    icon: '🍔',
    days: 'weekday', from: 16, to: 18.5, sendAt: 16.25,
    whenText: 'Weekdays · 4:15pm',
    title: 'The drive-thru is about to win',
    priority: 9,
    convenience: true,
    cravingAware: true,
    cta: { label: 'Cook from my pantry', route: '/pantry' },
    body: (ctx, now) => {
      const lvl = convenienceLevel(now);
      const conv = CONVENIENCE_COPY[lvl];
      const have = ctx?.suggestionCount > 0
        ? `You already have ${ctx.suggestionCount} recipe${ctx.suggestionCount !== 1 ? 's' : ''} in reach. `
        : '';
      const c = ctx?.craving;
      if (c) {
        const dish = c.recipes?.[0];
        return `${have}${conv.note} You've been craving ${c.label.toLowerCase()} this week — ${cravingWhy(c)}${dish ? ` ${dish.title} (${dish.totalTime} min) hits it.` : ''}`;
      }
      return `${have}${conv.note}`;
    },
  },
  {
    id: 'friday-treat',
    category: 'treat',
    icon: '🎉',
    days: [5], from: 16, to: 19.5, sendAt: 16.5,
    whenText: 'Fridays · 4:30pm',
    title: "It's Friday — cook what you actually want",
    priority: 10,
    cravingAware: true,
    cta: { label: 'Find a showstopper', route: '/recipes' },
    body: (ctx) => {
      const c = ctx?.craving;
      if (c) {
        const dish = c.recipes?.[0];
        return `You made it through the week. Skip the sad takeout — you've been gravitating ${c.label.toLowerCase()} lately, so lean into it. ${dish ? `${dish.title} is the kind of thing you'd screenshot.` : "Make the thing you'd screenshot."}`;
      }
      return "You made it through the week. Skip the sad takeout — make the thing you'd screenshot.";
    },
  },
  {
    id: 'stock-ahead',
    category: 'stock-ahead',
    icon: '🫙',
    days: [6], from: 9, to: 11, sendAt: 9.5,
    whenText: 'Saturdays · 9:30am',
    title: 'Stock the pantry before the craving hits',
    priority: 7,
    cta: { label: 'See my Craving Tracker', route: '/cravings' },
    body: (ctx) => {
      const list = ctx?.stockAhead || [];
      if (!list.length) {
        return "Keep logging what you're craving in the Craving Tracker — once a flavor shows up a couple times, I'll start telling you exactly what to stock up on.";
      }
      const top = list[0];
      return `You've reached for ${top.flavor} ${top.count} times now — grab ${top.items.slice(0, 2).join(' and ')} this trip so it's already on hand next time.`;
    },
  },
  {
    id: 'sunday-prep',
    category: 'meal-prep',
    icon: '🥘',
    days: [0], from: 9, to: 11.5, sendAt: 10,
    whenText: 'Sundays · 10:00am',
    title: 'Future-you needs a favor',
    priority: 8,
    cta: { label: 'Batch-cook ideas', route: '/recipes' },
    body: () => "By Wednesday you'll be too tired to think. One 45-minute batch cook now = 4 meals you don't have to decide on later. Go before the stores get slammed.",
  },
  {
    id: 'weekend-calm-shop',
    category: 'shop-timing',
    icon: '🛒',
    days: 'weekend', from: 7, to: 9, sendAt: 7,
    whenText: 'Weekends · 7:00am',
    title: 'The aisles are empty right now',
    priority: 6,
    cta: { label: 'Open the map', route: '/' },
    body: () => "This is the calmest 90-minute window all weekend — beat the late-morning crowd and the parking lot. Shop now, cruise out.",
  },
  {
    id: 'tuesday-restock',
    category: 'shop-timing',
    icon: '📅',
    days: [2], from: 9.5, to: 11.5, sendAt: 10,
    whenText: 'Tuesdays · 10:00am',
    title: 'Tuesday is the quiet run',
    priority: 5,
    cta: { label: 'Plan a run', route: '/' },
    body: () => "Midweek is the least-busy time to shop and the best-converting day to restock. Get ahead of the weekend rush while it's calm.",
  },
  {
    id: 'late-night',
    category: 'late-night',
    icon: '🌙',
    days: 'all', from: 21.5, to: 23.75, sendAt: 21.5,
    whenText: 'Nightly · 9:30pm',
    title: 'Kitchen’s closing, but you’re hungry',
    priority: 4,
    cravingAware: true,
    cta: { label: 'Something light', route: '/pantry' },
    body: (ctx) => {
      const c = ctx?.craving;
      if (c) {
        const dish = c.recipes?.[0];
        return `Don't doom-order at 10pm. ${cravingWhy(c)} ${dish ? `${dish.title} (${dish.totalTime} min) covers the ${c.label.toLowerCase()} craving without the $18 delivery fee.` : `A quick ${c.label.toLowerCase()} fix beats an $18 delivery fee.`} Then bed.`;
      }
      return "Don't doom-order at 10pm. 5-minute something light from what you've got, then bed. You'll sleep better and save $18.";
    },
  },
];

export const NUDGE_CATEGORIES = [...new Set(NUDGES.map(n => n.category))];

// ── Preferences (which categories the user allows) ──────────────
const PREFS_KEY = 'dig_in_nudge_prefs';       // { disabled: [category, …] }
const DISMISS_KEY = 'dig_in_nudge_dismissed'; // { 'YYYY-MM-DD': [id, …] }

export function loadDisabledCategories() {
  try {
    const v = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    return new Set(Array.isArray(v.disabled) ? v.disabled : []);
  } catch { return new Set(); }
}
export function setCategoryEnabled(category, enabled) {
  const disabled = loadDisabledCategories();
  if (enabled) disabled.delete(category); else disabled.add(category);
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ disabled: [...disabled] })); } catch { /* ignore */ }
  return disabled;
}

const dayKey = (d) => d.toISOString().slice(0, 10);
export function isDismissedToday(id, now = new Date()) {
  try {
    const v = JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}');
    return (v[dayKey(now)] || []).includes(id);
  } catch { return false; }
}
export function dismissNudge(id, now = new Date()) {
  try {
    const v = JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}');
    const k = dayKey(now);
    const list = new Set(v[k] || []); list.add(id);
    localStorage.setItem(DISMISS_KEY, JSON.stringify({ [k]: [...list] })); // keep only today
  } catch { /* ignore */ }
}

// ── Query API ───────────────────────────────────────────────────
function windowMatches(nudge, now) {
  const t = hourOf(now);
  return dayMatch(nudge.days, now) && t >= nudge.from && t < nudge.to;
}

/** A nudge may carry an optional `when(ctx, now) => boolean` gate on top of its
    time window — used to suppress a nudge when its point is already moot (e.g.
    don't surface a nudge to someone who has already done the thing it suggests).
    No `when` means always-eligible, so every existing nudge is unaffected. */
function whenMatches(nudge, ctx, now) {
  return typeof nudge.when !== 'function' || nudge.when(ctx, now);
}

/** All nudges whose window is open right now, honoring category prefs, highest priority first. */
export function getActiveNudges(now = new Date(), ctx = {}) {
  const disabled = loadDisabledCategories();
  return NUDGES
    .filter(n => !disabled.has(n.category) && windowMatches(n, now) && whenMatches(n, ctx, now))
    .sort((a, b) => b.priority - a.priority)
    .map(n => render(n, ctx, now));
}

/** The single nudge to surface now (or null), skipping ones dismissed today. */
export function getTopNudge(now = new Date(), ctx = {}) {
  const disabled = loadDisabledCategories();
  const hit = NUDGES
    .filter(n => !disabled.has(n.category) && windowMatches(n, now) && whenMatches(n, ctx, now) && !isDismissedToday(n.id, now))
    .sort((a, b) => b.priority - a.priority)[0];
  return hit ? render(hit, ctx, now) : null;
}

/** The next nudge later today (for "nothing now — next up at…"). */
export function getNextNudge(now = new Date()) {
  const disabled = loadDisabledCategories();
  const t = hourOf(now);
  const upcoming = NUDGES
    .filter(n => !disabled.has(n.category) && dayMatch(n.days, now) && n.sendAt > t)
    .sort((a, b) => a.sendAt - b.sendAt)[0];
  return upcoming ? { ...renderMeta(upcoming), atText: fmtTime(upcoming.sendAt) } : null;
}

/** Today's full schedule (for the playbook timeline + notification scheduling). */
export function todaySchedule(now = new Date(), ctx = {}) {
  const disabled = loadDisabledCategories();
  return NUDGES
    .filter(n => !disabled.has(n.category) && dayMatch(n.days, now))
    .sort((a, b) => a.sendAt - b.sendAt)
    .map(n => ({ ...render(n, ctx, now), atHour: n.sendAt, atText: fmtTime(n.sendAt) }));
}

/** The whole playbook, every day, for a reference/preview table. */
export function fullPlaybook(ctx = {}, now = new Date()) {
  return NUDGES
    .slice()
    .sort((a, b) => a.sendAt - b.sendAt)
    .map(n => render(n, ctx, now));
}

function renderMeta(n) {
  return {
    id: n.id, category: n.category, icon: n.icon, title: n.title,
    whenText: n.whenText, cta: n.cta, convenience: !!n.convenience, priority: n.priority,
  };
}
function render(n, ctx, now) {
  const meta = renderMeta(n);
  const out = { ...meta, body: n.body(ctx, now) };
  if (n.convenience) {
    const lvl = convenienceLevel(now);
    out.convenienceTag = CONVENIENCE_COPY[lvl].tag;
    out.convenienceLevel = lvl;
  }
  // Only attach craving metadata on nudges that actually used it in their
  // body copy above — so the tag never shows without the text backing it up.
  if (n.cravingAware && ctx?.craving) {
    out.craving = { id: ctx.craving.id, label: ctx.craving.label, emoji: ctx.craving.emoji };
  }
  return out;
}

/* ── From novaReactions.js ───────────────────────────────────────────────────

   novaReactions — Nova as one companion, reacting in-context across the app.

   She already reacts on a cook (CookCelebration) and on expiring pantry
   items (NovaUseItUp). This engine gives her a voice on the other surfaces
   the app asked for: the Vault (your cookbook) and a store check-in. Given a
   surface + a little context, it picks the single most-worth-saying
   reaction, in her current mood voice. Some reactions are
   "love-letters"/celebrations flagged `saveable` — those are what the Memory
   Vault collects.

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
