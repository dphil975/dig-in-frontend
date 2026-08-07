/* buildFeed.js — assembles the Home column.

   The old Home was a uniform recipe GRID. Then it became a hand-woven Tumblr
   COLUMN. This version keeps every one of those honest post shapes but stops
   weaving them by hand: the body is now DEALT by the slot allocator
   (lib/feedSlots.js) through the context lens (lib/feedContext.js), so the
   column is quota-fair, MIR-ranked within each slot, and reshaped by season and
   life mode — the algorithm described in DIG_IN_ALGORITHM.md, wired to real
   data. See that doc for the why; the honesty rules below still hold:

     • Dish / Chain posts come from the REAL judged-cook feed (journalApi).
     • Nova / in-season / pantry picks are REAL recipes from the loaded pool,
       framed as a person choosing FOR you — never invented inventory.
     • Place posts come from REAL metro flavor data (localFlavor) + a saved ZIP.
     • Cooking-Now reflects the user's OWN in-progress cook — never "3 strangers
       are on step 4," which we can't verify without a presence backend.
     • "Seen by few" (slot 7) surfaces REAL judged dishes almost nobody has
       rated yet — a genuine small-account floor, not a fabricated newcomer.
     • Slots with no real candidate (an account you follow, a local event) are
       SKIPPED, never filled with a fake. The lane exists; it fills when its
       backend does. */

import { recipeFlavors } from '../../lib/flavorProfile';
import { getRecommendedRecipes, getCuisinePreferences } from '../../services/behaviorTracker';
import { pickLocalFavorite, metroForZip, DENSE_METROS } from '../../lib/localFlavor';
import { currentMealWindow } from '../../lib/mealTimeBanner';
import { itemCoversIngredient } from '../../lib/pantryTools';
import { buildContext } from '../../lib/feedContext';
import { allocateSlots } from '../../lib/feedSlots';
import { lensFeed } from '../../lib/archetypeEngine';
import { structuredTags, hashify } from '../../lib/structuredTags';
import { weatherLabel } from '../../lib/weatherService';
import { keyForRecipe } from '../../lib/madeItRate';
import { loadUserPosts } from '../../lib/userPosts';
import { daysSinceMoved, movingPhase, freezerStorageRecipes } from '../../lib/movingGuide';
import { cheapProteinPicks } from '../../lib/affordableProtein';
import { REELS } from '../ReelFeed/reels.data';
import { loadUserReels } from '../ReelFeed/userReels';
import { loadDislikedReels } from '../ReelFeed/reelFeedback';
import { nutrientTagsFor } from '../../lib/pregnancyGuide';
import { viralityOf, viralScore } from '../../lib/virality';

/* ── Tags ───────────────────────────────────────────────────────────────
   Cuisine + flavor come from the flavor engine (structured, reliable). The
   cost / time / effort / diet / context families come from structuredTags().
   The whimsy VOICE tags are attached only where they're actually true; the UI
   (PostTypes) renders the two layers with two different weights. Nutrient
   tags (#ironrich/#folate) only compute at all when the Pregnant/New-baby
   mode is on (ctx.pregnancyAware) — real, per-recipe, ingredient-based (see
   lib/pregnancyGuide.js) — and lead the list so they survive the 5-tag cap. */
export function tagsForRecipe(recipe, ctx = {}) {
  if (!recipe) return [];
  const out = [];
  const cuisine = (recipe.country || recipe.cuisine || '').trim();
  if (cuisine) out.push(hashify(cuisine));
  if (ctx.pregnancyAware) out.push(...nutrientTagsFor(recipe));
  for (const f of recipeFlavors(recipe).slice(0, 2)) out.push('#' + f);
  out.push(...structuredTags(recipe, ctx));
  return [...new Set(out)].slice(0, 5);
}

/* ── Ask posts ──────────────────────────────────────────────────────────
   App-authored open cooking questions — honestly prompts that route to Nova
   or the Table (real places to talk), never dressed up as a stranger's post. */
const ASK_PROMPTS = [
  { q: 'what do i do with half a fennel?', tags: ['#fridgeraid', '#useitup'], to: '/nova' },
  { q: 'greek yogurt instead of sour cream — fine or not?', tags: ['#swaps'], to: '/nova' },
  { q: 'dinner from eggs, bread, and whatever\'s in the fridge door?', tags: ['#girldinner', '#brokebutfancy'], to: '/craving' },
  { q: 'my rice went mushy. can i still save it?', tags: ['#itriedmybest'], to: '/nova' },
  { q: 'what\'s everyone actually cooking tonight?', tags: ['#thetable'], to: '/table' },
];

/* ── Nova / in-season / pantry picks — one person picking, three reasons ─── */
function novaPickPost(recipes, ctx) {
  if (!recipes.length) return null;
  const [pick] = getRecommendedRecipes(recipes, 1);
  if (!pick) return null;
  const prefs = getCuisinePreferences();
  const reason = prefs.length
    ? `You've been leaning ${prefs[0].cuisine.toLowerCase()} lately — this is in that lane.`
    : 'A good place to start while I learn what you like.';
  return { type: 'nova', slot: 'nova', id: `nova-${pick.id || pick.name}`, recipe: pick, reason, tags: tagsForRecipe(pick, ctx) };
}

// Slot 4 — in season. A real recipe the season (and, if we have a real reading,
// the actual weather) is asking for. Its own post shape, not Nova's.
function seasonPickPost(recipes, ctx) {
  if (!recipes.length || !ctx.seasonSurface) return null;
  const match = recipes.find((r) => ctx.seasonSurface.test(`${r.name || ''} ${r.description || ''}`));
  if (!match) return null;
  const wx = weatherLabel();   // real reading, or null → season-only wording
  const note = wx
    ? `It's ${wx} where you are — ${ctx.season} cooking that fits the day.`
    : `${ctx.season[0].toUpperCase()}${ctx.season.slice(1)} is asking for exactly this.`;
  return {
    type: 'season', slot: 'inSeason', id: `season-${match.id || match.name}`, recipe: match,
    season: ctx.season, weather: wx, note,
    tags: tagsForRecipe(match, ctx),
    to: '/recipe',
  };
}

// Slot 3 — you can make it right now. Real pantry cross-check (best available),
// with the honest coverage shown as a bar.
function pantryPickPost(recipes, ctx) {
  let names = [];
  try {
    const raw = JSON.parse(localStorage.getItem('dig_in_pantry') || '[]');
    names = (Array.isArray(raw) ? raw : []).map((i) => (typeof i === 'object' ? i.name : i)).filter(Boolean);
  } catch { /* none */ }
  if (!names.length) return null;
  let best = null, bestCov = 0, bestHave = 0, bestTotal = 0;
  for (const r of recipes) {
    const ings = (r.ingredients || []).map((i) => (typeof i === 'object' ? i.text || i.name : i)).filter(Boolean);
    if (ings.length < 3) continue;
    const have = ings.filter((ing) => names.some((n) => itemCoversIngredient(n, ing))).length;
    const cov = have / ings.length;
    if (cov > bestCov) { bestCov = cov; best = r; bestHave = have; bestTotal = ings.length; }
  }
  if (!best || bestCov < 0.6) return null;   // only claim it if it's honestly close
  return {
    type: 'pantry', slot: 'pantry', id: `pantry-${best.id || best.name}`, recipe: best,
    coverage: bestCov, haveCount: bestHave, totalCount: bestTotal,
    tags: tagsForRecipe(best, ctx),
    to: '/recipe',
  };
}

/* ── Slot 10 — in person, near you (honest) ───────────────────────────────
   No events backend yet, so this fills ONLY during a declared holiday's
   go-shop window (planning / shopping / prepping) with a real routed nudge to
   the FoodMap grocer finder for the store types that holiday actually needs —
   real holiday + real store types, no fabricated event or count. Outside that
   window it returns [] and the slot is skipped. */
function inPersonPosts(ctx) {
  const h = ctx.holiday;
  if (!h) return [];
  const goShop = ['planning', 'shopping', 'prepping'].includes(h.phase.id);
  if (!goShop || !h.holiday.ethnicStoreTypes?.length) return [];
  const away = h.daysAway > 0 ? `${h.daysAway} day${h.daysAway === 1 ? '' : 's'} out` : 'today';
  return [{
    type: 'inPerson', slot: 'inPerson', id: `inperson-${h.holiday.id}`,
    title: h.holiday.label, phase: h.phase.label, away,
    blurb: `${h.holiday.label} is ${h.phase.copy} — ${away}. ${h.holiday.blurb} Find the grocers near you that carry what you'll need.`,
    tags: [...h.contextTags, '#inperson'],
    to: '/global-food',
  }];
}

/* ── Place post — "get out of your area" enters the feed ─────────────────── */
function placePost(recipes, zip, ctx) {
  const local = zip ? pickLocalFavorite(recipes, zip, 'home-feed') : null;
  if (local) {
    return {
      type: 'place', slot: 'local', id: `place-${local.metro.city}`,
      city: local.metro.city, here: true, recipe: local.recipe,
      blurb: `What ${local.metro.city} is known for — make it at home for a fraction of the corner-store price.`,
      tags: [hashify(local.metro.city), ...tagsForRecipe(local.recipe, ctx)].slice(0, 4),
      to: '/recipe',
    };
  }
  const away = DENSE_METROS[(new Date().getDate()) % DENSE_METROS.length];
  return {
    type: 'place', slot: 'local', id: `place-away-${away.city}`,
    city: away.city, here: false,
    blurb: `${away.city} eats ${away.keywords.slice(0, 3).join(', ')}. Take a trip through its food without leaving the couch.`,
    tags: [hashify(away.city), '#getoutofyourarea'],
    to: '/city-explorer',
  };
}

/* ── Cooking-Now — honest live presence (your own cook, or an invitation) ── */
function cookingNowPost(recipes, ctx) {
  let activeId = null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('dig_in_cook_timer_')) { activeId = k.slice('dig_in_cook_timer_'.length); break; }
    }
  } catch { /* storage blocked */ }

  if (activeId) {
    const started = Number(localStorage.getItem(`dig_in_cook_timer_${activeId}`) || 0);
    const mins = started ? Math.max(1, Math.round((Date.now() - started) / 60000)) : null;
    const recipe = recipes.find((r) => String(r.id) === String(activeId) || r.name === activeId);
    return {
      type: 'cookingNow', slot: 'cookingNow', id: 'cooking-now-self', self: true,
      dish: recipe?.name || 'your dish', minutes: mins, recipe,
      tags: ['#cookingnow'], to: '/recipe',
    };
  }
  const invite = recipes[Math.floor((Date.now() / 3.6e6)) % Math.max(1, recipes.length)];
  if (!invite) return null;
  return {
    type: 'cookingNow', slot: 'cookingNow', id: 'cooking-now-invite', self: false,
    dish: invite.name, recipe: invite,
    tags: ['#cookingnow', ...tagsForRecipe(invite, ctx)].slice(0, 3), to: '/recipe',
  };
}

/* ── Write-up posts (the user's own long-form text / "Substack" posts) ─────
   Real content the user wrote (lib/userPosts) — a title, body, and optional
   numbered method. Mapped to feed posts; newest-first. These are the user's
   OWN posts, so they lead the column (like your own fresh post on any feed),
   and they carry tags so they also join the tag-search union below. */
function writeupPosts(userPosts) {
  return (userPosts || [])
    .filter((p) => p && p.kind === 'writeup' && (p.title || p.body || p.steps?.length))
    .map((p) => ({ ...p, type: 'writeup', slot: 'writeup' }));
}

/* ── "I just moved" — the timeline card ────────────────────────────────────
   Only when the user is in the moved life mode. Phase-driven by DAYS SINCE the
   move: week one is cook-from-boxes gear + no-cook/one-pot; then pantry + start
   the freezer; then batch-cook to stock it. Gear is honest product CATEGORIES
   (no fabricated brands — a real sponsor slots into the card's ShoutoutCard);
   recipes are REAL, matched to how well they freeze/store. Points at City
   Explorer so a new arrival can actually find their grocery store. */
function movingPost(recipes, ctx, now) {
  const mode = ctx.lifeMode;
  if (!mode || mode.id !== 'moved') return null;
  const days = daysSinceMoved(mode, now);
  const phase = movingPhase(days);
  const picks = freezerStorageRecipes(recipes, phase, { limit: 3 })
    .map((r) => ({ recipe: r, tags: tagsForRecipe(r, ctx) }));
  return {
    type: 'moving', slot: 'moving', id: `moving-${phase.id}`,
    days, phase, picks,
    // Non-meat protein that stretches — the reality when money's tight.
    proteins: cheapProteinPicks(3),
    tags: ['#justmoved', '#fewingredients', '#onepan', '#under5', '#freezerfriendly'],
    to: '/recipe', storeTo: '/city-explorer',
  };
}

/* ── 7-second preview — the recipe's own trailer, folded into the feed ────
   This used to live only on a separate "Reels" tab. Brought into the main
   column instead, and deliberately never called a "reel" in its own copy —
   framed as exactly what it is: a quick, honest preview of the dish you're
   about to make, the same job a real ad would do, so it rides the SAME
   1-in-20 sponsored cap the allocator already enforces (see feedSlots.js) —
   `sponsored: true` here isn't a real paid placement, it's reusing that
   throttle for a lane that plays the identical role. Real user-published
   previews lead; the built-in seed set fills in behind them — the exact
   same source-merge ReelFeed's own page already uses, just reused here
   instead of invented fresh. Disliked ones (shared state) stay filtered out
   everywhere, feed included. */
function reelPreviewPosts(now) {
  const disliked = loadDislikedReels();
  const notDisliked = (r) => !disliked[r.id];
  const userReels = loadUserReels().filter(notDisliked);
  const seed = REELS.filter(notDisliked);
  // Deterministic hourly rotation through the seed set — which one shows
  // changes through the day, but never reshuffles on every render/refresh.
  const hour = Math.floor(now.getTime() / 3.6e6);
  const at = seed.length ? hour % seed.length : 0;
  const rotatedSeed = seed.length ? [...seed.slice(at), ...seed.slice(0, at)] : [];
  return [...userReels, ...rotatedSeed].slice(0, 3).map((r) => ({
    type: 'reelPreview', slot: 'reelPreview', id: `reelpreview-${r.id}`,
    reel: r, sponsored: true,
    tags: [...new Set([
      ...(r.flavor ? [hashify(r.flavor)] : []),
      ...(r.hashtags || []).map(hashify),
    ])].slice(0, 4),
  }));
}

/* ── Viral / catching posts — real community spread (lib/virality.js) ──────
   Judged dishes that have crossed the interaction threshold on the shared
   backend — genuinely spreading across the community, so they belong in
   everyone's feed. Dealt EARLY (see feedSlots DEAL_ORDER) so a dish that's
   taking off shows in its viral form; the allocator's key-dedup then skips
   its plain copy in the dish lane automatically. */
function viralPosts(judged, ctx) {
  return (judged || [])
    .map((entry) => ({ entry, v: viralityOf(entry) }))
    .filter((x) => x.v)
    .sort((a, b) => viralScore(b.v) - viralScore(a.v))
    .slice(0, 4)
    .map(({ entry, v }) => ({
      type: 'viral', slot: 'viral', id: `viral-${entry.id}`,
      entry, viral: v, tags: tagsForRecipe(entry.recipeSnapshot || {}, ctx),
    }));
}

/* ── Dish + Chain posts (real judged feed) ─────────────────────────────── */
function dishPosts(judged, ctx) {
  return (judged || [])
    .filter((e) => e && (e.dish || e.username))
    .map((entry) => {
      const snap = entry.recipeSnapshot || {};
      const isChain = entry.isFaithful === true && (snap.name || snap.ingredients?.length);
      // "Seen by few" (slot 7): a real dish almost nobody has rated yet. This is
      // a genuine small-account floor — the dish exists, it's just undiscovered.
      const ratingCount = entry.ratingCount || 0;
      const slot = isChain ? 'chain' : (ratingCount < 3 ? 'smallAccount' : 'dish');
      return {
        type: isChain ? 'chain' : 'dish',
        slot,
        id: `dish-${entry.id}`,
        entry,
        tags: tagsForRecipe(snap, ctx),
      };
    });
}

/* ── Assembly ───────────────────────────────────────────────────────────
   Build honest candidate pools, then DEAL them through the slot allocator
   under the context lens. Meal-time leads; whimsy on Sunday (never in a quiet
   life mode); the feed ENDS. */
export function buildFeed({ recipes = [], judged = [], zip = null, now = new Date(), followed = null, userPosts = null }) {
  const followedSet = followed instanceof Set ? followed : new Set(followed || []);
  // Followed tags flow into the context lens so the WHOLE feed leans toward
  // them (soft weight across every slot + an extra deal of the tag-follow
  // lane), while the ten slots still deal randomized discovery. See
  // feedContext.buildContext + feedSlots.processPool.
  const ctx = buildContext({ now, followed: followedSet });
  const feed = [];

  // Lead — the contextual meal-time moment (skipped when the feed is quiet).
  if (!ctx.quiet) {
    feed.push({ type: 'mealTime', id: 'mealtime', window: currentMealWindow(now) });
  }

  // The user's own write-ups lead the column, newest first — your fresh post
  // shows at the top, the way it does on any feed. Real content only; the rest
  // stay reachable through tag search and (later) your profile.
  const writeups = writeupPosts(userPosts ?? loadUserPosts());
  feed.push(...writeups.slice(0, 3));

  // "I just moved" — the timeline guide leads the column while that mode is on,
  // so the gear + freezer/storage recipes for right-now are the first thing you
  // see (skipped in a quiet mode, and only when the mode is actually moved).
  if (!ctx.quiet) {
    const moving = movingPost(recipes, ctx, now);
    if (moving) feed.push(moving);
  }

  // Candidate pools (honest; some may be empty and get skipped).
  const dishes = dishPosts(judged, ctx);
  const asks = ASK_PROMPTS.map((a, i) => ({ type: 'ask', slot: 'ask', id: `ask-${i}`, ...a }));

  const pools = {
    local:        [placePost(recipes, zip, ctx)].filter(Boolean),
    pantry:       [pantryPickPost(recipes, ctx)].filter(Boolean),
    inSeason:     [seasonPickPost(recipes, ctx)].filter(Boolean),
    ask:          asks,
    cookingNow:   [cookingNowPost(recipes, ctx)].filter(Boolean),
    smallAccount: dishes.filter((d) => d.slot === 'smallAccount'),
    tagFollow:    followedSet.size ? dishes.filter((d) => d.tags?.some((t) => followedSet.has(t))) : [],
    // Real community spread — dishes past the interaction threshold. Dealt
    // early so the viral form wins the key-dedup over the plain dish copy.
    viral:        ctx.quiet ? [] : viralPosts(judged, ctx),
    dish:         dishes.filter((d) => d.type === 'dish'),
    chain:        dishes.filter((d) => d.type === 'chain'),
    // The ad-analog lane — a 7-second preview of a dish, capped 1-in-20 by
    // the allocator's existing sponsored throttle. Quiet mode skips it too
    // (nothing ad-like belongs in a hushed feed).
    reelPreview:  ctx.quiet ? [] : reelPreviewPosts(now),
    // Slot 10 — in person, near you. Real, honest occupant during a declared
    // holiday's shopping window (see inPersonPosts); otherwise empty + skipped.
    // Park events, watch parties, and market days plug in here next.
    inPerson:     inPersonPosts(ctx),
    nova:         [novaPickPost(recipes, ctx)].filter(Boolean),
    editorial: ctx.quiet ? [] : [
      { type: 'highlights', slot: 'editorial', id: 'highlights' },
      { type: 'interactive', slot: 'editorial', id: 'interactive' },
      { type: 'closerLook', slot: 'editorial', id: 'closerlook' },
    ],
  };

  // The slot allocator has already guaranteed quota fairness and MIR-ranked
  // inside each slot. The archetype lens runs AFTER it and never removes a
  // post — it only reorders content so the counterweight to your habit shows
  // up early instead of after five posts that all rhyme. A lens over slots,
  // never an eleventh slot. See lib/archetypeEngine.js.
  const body = lensFeed(allocateSlots(pools, ctx, { limit: 30 }));

  // Whimsy — a post, once a week, on Sunday; never when the feed is quiet.
  if (now.getDay() === 0 && !ctx.quiet) {
    body.splice(Math.min(2, body.length), 0, { type: 'whimsy', id: 'whimsy' });
  }

  feed.push(...body);
  feed.push({ type: 'end', id: 'end' });   // the feed ends — the answer to aimless scroll
  return feed;
}

/* ── Tag search (the "tag page") ──────────────────────────────────────────
   Clicking a hashtag opens a view that pulls EVERYTHING carrying it — not just
   today's composed feed, but the whole corpus (every judged dish + every
   recipe). The search is a UNION: a post qualifies if it carries ANY of the
   searched tags, so each tag you add WIDENS the results (more tags → more
   posts), the opposite of a narrowing filter. Capped at MAX_SEARCH_TAGS for
   now. Posts that match MORE of your tags rank higher, and real cooked dishes
   outrank plain recipe cards at the same match count. */
export const MAX_SEARCH_TAGS = 10;

export function searchByTags(tags, { recipes = [], judged = [], zip = null, now = new Date(), limit = 80, userPosts = null } = {}) {
  const want = new Set((tags || []).filter(Boolean));
  if (!want.size) return { posts: [], total: 0 };
  const ctx = buildContext({ now });
  const out = [];
  const seen = new Set();   // de-dupe a recipe that appears in more than one shape
  const matchOf = (post) => (post.tags || []).filter((t) => want.has(t)).length;

  // 0. The user's own write-ups whose tags intersect — their real posts belong
  //    in their tag pages too, ranked alongside dishes (isDish so they lead).
  for (const post of writeupPosts(userPosts ?? loadUserPosts())) {
    const matched = matchOf(post);
    if (matched) out.push({ ...post, matched, isDish: true });
  }

  // 1. Real judged dishes whose tags intersect the search.
  for (const entry of judged || []) {
    if (!entry || !(entry.dish || entry.username)) continue;
    const snap = entry.recipeSnapshot || {};
    const tgs = tagsForRecipe(snap, ctx);
    const matched = tgs.filter((t) => want.has(t));
    if (!matched.length) continue;
    const isChain = entry.isFaithful === true && (snap.name || snap.ingredients?.length);
    out.push({
      type: isChain ? 'chain' : 'dish', slot: isChain ? 'chain' : 'dish',
      id: `dish-${entry.id}`, entry, tags: tgs, matched: matched.length, isDish: true,
    });
    const k = keyForRecipe(snap);
    if (k) seen.add(k);
  }

  // 2. Contextual "furniture" — asks, and the current place / in-season /
  //    pantry / in-person posts — when they carry a searched tag. Processed
  //    BEFORE plain recipe cards so a richer season/pantry card wins over a
  //    bare card for the same recipe (its recipe key lands in `seen` first).
  const furniture = [
    ...ASK_PROMPTS.map((a, i) => ({ type: 'ask', slot: 'ask', id: `ask-${i}`, ...a })),
    placePost(recipes, zip, ctx),
    seasonPickPost(recipes, ctx),
    pantryPickPost(recipes, ctx),
    ...inPersonPosts(ctx),
  ].filter(Boolean);
  for (const post of furniture) {
    const matched = matchOf(post);
    if (!matched) continue;
    const k = post.recipe ? keyForRecipe(post.recipe) : null;
    if (k && seen.has(k)) continue;
    if (k) seen.add(k);
    out.push({ ...post, matched, isDish: false });
  }

  // 3. Every remaining recipe whose computed tags intersect → a recipe card.
  for (const r of recipes || []) {
    const tgs = tagsForRecipe(r, ctx);
    const matched = tgs.filter((t) => want.has(t));
    if (!matched.length) continue;
    const k = keyForRecipe(r);
    if (k && seen.has(k)) continue;   // already shown as a dish or a richer card
    if (k) seen.add(k);
    out.push({
      type: 'recipeCard', id: `rc-${r.id || r.name}`, recipe: r,
      tags: tgs, matched: matched.length, isDish: false, to: '/recipe',
    });
  }

  // Rank: match more of the searched tags → higher; real dishes first, then
  // (stable) furniture before plain cards from insertion order above.
  out.sort((a, b) => (b.matched - a.matched) || (Number(b.isDish) - Number(a.isDish)));
  return { posts: out.slice(0, limit), total: out.length };
}

/* Trending tags for the right rail — counted from what's actually in the
   column right now, most-used first. Honest: only tags real posts carry. */
export function trendingTags(feed, limit = 8) {
  const counts = new Map();
  for (const post of feed) {
    for (const t of post.tags || []) counts.set(t, (counts.get(t) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

export { metroForZip };
