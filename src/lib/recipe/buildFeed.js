/* buildFeed.js — assembles the Home column.

   The old Home was a uniform recipe GRID. Then it became a hand-woven Tumblr
   COLUMN. This version keeps every one of those honest post shapes but stops
   weaving them by hand: the body is now DEALT by the slot allocator
   (originally lib/feedSlots.js, now the "Slot allocator" section below)
   through the context lens (originally lib/feedContext.js, now the "Context
   lens" section below), so the column is quota-fair, MIR-ranked within each
   slot, and reshaped by season and life mode — the algorithm described in
   docs/product/DIG_IN_ALGORITHM.md, wired to real data. See that doc for the
   why; the honesty rules below still hold:

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
       backend does.

   Consolidated (Recipe & Cooking lib reorg): this file now also carries what
   used to be feedSlots.js (the ten-slot allocator) and feedContext.js (the
   season/calendar/life-mode lens), since the three always worked as one
   pipeline (buildFeed → buildContext → allocateSlots) and were never useful
   independently. Each keeps its own section below, under its own marker.
   Their former mutual imports (buildFeed importing buildContext/allocateSlots;
   feedSlots importing isAspirational from feedContext) are now just plain
   in-file references — the import statements have been removed accordingly. */

import { recipeFlavors } from '../flavorProfile';
import { getRecommendedRecipes, getCuisinePreferences } from '../../services/behaviorTracker';
import { pickLocalFavorite, metroForZip, DENSE_METROS } from '../localFlavor';
import { currentMealWindow } from '../mealTimeBanner';
import { itemCoversIngredient } from '../pantryTools';
import { lensFeed } from '../archetypeEngine';
import { structuredTags, hashify } from '../structuredTags';
import { weatherLabel } from '../weatherService';
import { keyForRecipe, keyForPost, rankByMIR } from '../madeItRate';
import { loadUserPosts } from '../userPosts';
import { OPEN_QUESTIONS } from '../social/openQuestions';
import { daysSinceMoved, movingPhase, freezerStorageRecipes } from '../movingGuide';
import { cheapProteinPicks } from '../affordableProtein';
import { nutrientTagsFor, pregnancyCaution } from '../pregnancyGuide';
import { viralityOf, viralScore } from '../virality';
import { depthScore, returnsFor } from '../depthRank';
import { isActive, isLive, EXPERIMENTS, blendRankings, logShadowDecision } from '../rankRollout';
import { HOLIDAYS } from '../holidayCalendar';

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
const ASK_PROMPTS = OPEN_QUESTIONS;

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

/* ── Viral / catching posts — real community spread (lib/virality.js) ──────
   Judged dishes that have crossed the interaction threshold on the shared
   backend — genuinely spreading across the community, so they belong in
   everyone's feed. Dealt EARLY (see the DEAL_ORDER below) so a dish that's
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
export function buildFeed({ recipes = [], judged = [], zip = null, now = new Date(), followed = null, userPosts = null, userId = null }) {
  const followedSet = followed instanceof Set ? followed : new Set(followed || []);
  // Followed tags flow into the context lens so the WHOLE feed leans toward
  // them (soft weight across every slot + an extra deal of the tag-follow
  // lane), while the ten slots still deal randomized discovery. See
  // buildContext() + processPool() below.
  const ctx = buildContext({ now, followed: followedSet });
  // Not part of buildContext's own season/lifeMode contract — added here so
  // processPool() can deterministically bucket this user for the staged
  // ranking rollout (rankRollout.js). null is fine: bucketFor() just hashes
  // 'anon', same as anyone before their id resolves.
  ctx.userId = userId;
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

/* ════════════════════════════════════════════════════════════════════════
   Originally feedSlots.js — compose the feed like a plate, not sort it like
   a list.

   The reason every feed homogenizes is that ONE number sorts everything, so
   whatever wins that number takes over. The fix (Part 3 of
   docs/product/DIG_IN_ALGORITHM.md) is to stop using one number. The feed is dealt from ten
   slots, each with its own eligibility rule. Content competes WITHIN a slot,
   never across slots — MIR ranks the candidates inside a slot, but it never
   decides which slot type wins, because slot types don't compete for the same
   space. Even if one format got wildly popular it could only ever win the slots
   it's eligible for; nine-tenths of the feed is reserved for other things. That
   is why this structurally cannot collapse into a monoculture.

   Slots 6 (cooking now) and 10 (in person, near you) are the in-person engine —
   20% of the feed by construction — because the whole point is getting an idea
   into a real kitchen, not holding a thumb on glass.

   Honesty: a slot with no real candidate is simply SKIPPED. We never fabricate
   a stranger, a live count, or an event to fill it. Some slots (an account
   you follow, live presence, local events) ship mostly empty today and fill in
   as the real backend arrives — but the slot exists now so the muscle exists
   before we need it.
   ════════════════════════════════════════════════════════════════════════ */

/* The ten slots, with the copy the mockup + a future "why am I seeing this?"
   affordance can show. `n` matches the table in the doc. */
export const SLOTS = [
  { id: 'follow',       n: 1,  label: 'Someone you follow',  rule: 'Accounts you chose' },
  { id: 'local',        n: 2,  label: 'Within 20 miles',     rule: 'Geo-tagged, local. Always present' },
  { id: 'pantry',       n: 3,  label: 'You can make right now', rule: 'Cross-checked against your pantry' },
  { id: 'inSeason',     n: 4,  label: 'In season',           rule: 'Weather + calendar layer' },
  { id: 'ask',          n: 5,  label: 'An ask',              rule: 'A question you can answer in ten seconds' },
  { id: 'cookingNow',   n: 6,  label: 'Cooking now',         rule: 'Someone is mid-recipe right now' },
  { id: 'smallAccount', n: 7,  label: 'Seen by few',         rule: 'Reserved for small / new accounts' },
  { id: 'tagFollow',    n: 8,  label: 'A tag you follow',    rule: 'Sideways travel' },
  { id: 'chain',        n: 9,  label: 'A chain',             rule: 'Someone made someone else\'s dish' },
  { id: 'inPerson',     n: 10, label: 'In person, near you', rule: 'An event you could physically attend' },
];

// The order candidates are dealt in — a pleasant reading rhythm across the ten
// slots, plus three bridge lanes ('dish' = the real judged body, 'nova' = a
// person picking for you, 'editorial' = the reused below-the-fold systems).
const DEAL_ORDER = [
  'local', 'viral', 'pantry', 'inSeason', 'ask', 'cookingNow',
  'smallAccount', 'tagFollow', 'dish', 'chain', 'inPerson', 'nova', 'dish', 'editorial',
];

const DEFAULT_LIMIT = 30;   // the feed ENDS (Part 7) — thirty posts, then "come back tomorrow"

function recipeOf(post) {
  return post?.recipe || post?.entry?.recipeSnapshot || null;
}

function minutesOf(recipe) {
  const t = recipe?.totalTime ?? recipe?.total_time
    ?? ((recipe?.prepTime || 0) + (recipe?.cookTime || 0)) ?? recipe?.time;
  if (typeof t === 'number' && t > 0) return t;
  const m = String(t || '').match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

// A real, stable author id when one exists (dish/viral/chain posts carry the
// journal entry's real userId); null for post shapes with no stable id today
// (write-ups key authorship by a free-text display name, not an id — scoring
// those against a fabricated id would let two different people named the
// same thing collide, so they're honestly skipped rather than guessed at).
function authorIdOf(post) {
  return post?.entry?.userId || null;
}

// depthRank's ranking of the SAME pool, for the staged rollout below. Real
// inputs only: `likes` from the entry's actual ratingCount, `returns` from
// depthRank's own local return-log. `replies` stays honestly empty — no
// per-post reply/comment list flows through the feed read path yet (see
// rankRollout.js's header) — so today this mostly reduces to likes+returns
// until that data is real. Posts with no extractable authorId are left out
// entirely; blendRankings keeps them at their baseline MIR position.
function depthRankOrder(pool) {
  return pool
    .map((post) => {
      const authorId = authorIdOf(post);
      if (!authorId) return null;
      const likes = post.entry?.ratingCount || 0;
      const { score } = depthScore({ authorId }, { replies: [], likes, returns: returnsFor(authorId) });
      return { post, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.post);
}

/* ── Context modulation, applied to one slot's candidates before ranking ──── */
function processPool(list, ctx) {
  if (!Array.isArray(list) || !list.length) return [];

  // 1. Hard filters — the mode said "not this," so it doesn't enter.
  let pool = list.filter((post) => {
    const r = recipeOf(post);
    if (!r) return true;                                   // non-recipe posts (ask/editorial) pass
    if (ctx.capMinutes) { const m = minutesOf(r); if (m != null && m > ctx.capMinutes) return false; }
    if (ctx.suppressAspirational && isAspirational(r)) return false;
    return true;
  });
  if (!pool.length) return [];

  // 2. MIR ranks within the slot (identity on a cold feed — see madeItRate).
  pool = rankByMIR(pool, keyForPost);

  // 2b. Staged ranking rollout (rankRollout.js) — depthRank starts at
  // 'shadow': computed and logged against every real candidate in this slot,
  // but blendWeight resolves to 0 until the experiment is actually live for
  // this user, and blendRankings(..., 0) returns `pool` untouched by an early
  // return — not a no-op blend, an actual skipped code path. Ramping the
  // stage in rankRollout.js is the only thing that ever changes that.
  if (isActive('depthRank')) {
    const alt = depthRankOrder(pool);
    if (alt.length) {
      const basePos = new Map(pool.map((p, i) => [keyForPost(p), i]));
      const altPos = new Map(alt.map((p, i) => [keyForPost(p), i]));
      for (const [key, altRank] of altPos) {
        const baselineRank = basePos.get(key);
        if (baselineRank != null) logShadowDecision('depthRank', { postId: key, baselineRank, altRank });
      }
      const weight = isLive(ctx.userId, 'depthRank') ? EXPERIMENTS.depthRank.blendWeight : 0;
      pool = blendRankings(pool, alt, keyForPost, weight);
    }
  }

  // 3. Context WEIGHTS (soft) — stable-sorted so MIR order survives ties.
  const forced = new Set(ctx.forceTags || []);
  const followed = new Set(ctx.followedTags || []);
  const scored = pool.map((post, i) => {
    const r = recipeOf(post);
    let s = 0;
    if (r) {
      const hay = `${r.name || ''} ${r.description || ''}`;
      if (ctx.seasonSuppress && ctx.seasonSuppress.test(hay)) s -= 2;
      if (ctx.seasonSurface && ctx.seasonSurface.test(hay)) s += 1;
      if (ctx.softCapMinutes) { const m = minutesOf(r); if (m != null && m > ctx.softCapMinutes) s -= 1; }
      // Pregnant / new-baby: common food-safety categories quietly pushed
      // down, never removed (see lib/pregnancyGuide.js) — the user still
      // decides, this just doesn't lead with them.
      if (ctx.pregnancyAware && pregnancyCaution(r)) s -= 2;
    }
    for (const t of post.tags || []) if (forced.has(t)) s += 2;
    // Followed hashtags lean the whole feed (every slot) toward them — a soft
    // nudge (+1.5/tag, capped) so followed content surfaces more often
    // everywhere WITHOUT ever crowding out the discovery the other slots deal.
    if (followed.size) {
      let fb = 0;
      for (const t of post.tags || []) if (followed.has(t)) fb += 1.5;
      s += Math.min(fb, 4.5);
    }
    return { post, i, s };
  });
  scored.sort((a, b) => (b.s - a.s) || (a.i - b.i));   // stable within equal weight
  return scored.map((x) => x.post);
}

// The deal pattern, boosted: a life mode can make a lane appear twice per pass
// (≈2× presence) — e.g. "cooking for one" boosts cookingNow, "just moved"
// boosts local + pantry.
function dealPattern(ctx) {
  const pattern = [...DEAL_ORDER];
  for (const slot of ctx.boostSlots || []) {
    if (pattern.includes(slot)) pattern.splice(pattern.indexOf(slot) + 1, 0, slot);
  }
  return pattern;
}

/**
 * Deal the feed body from the slot pools.
 * @param pools  { [slotId|'dish'|'nova'|'editorial']: post[] } — honest, pre-built candidates
 * @param ctx    from buildContext()
 * @param opts   { limit }
 * @returns ordered post[] — quota-fair, MIR-ranked-within-slot, context-modulated
 */
export function allocateSlots(pools = {}, ctx = {}, opts = {}) {
  const limit = Math.min(opts.limit || DEFAULT_LIMIT, ctx.maxPosts || DEFAULT_LIMIT);
  const pattern = dealPattern(ctx);

  const ranked = {};
  for (const id of new Set(pattern)) ranked[id] = processPool(pools[id] || [], ctx);

  const cursors = {};
  const out = [];
  const seenId = new Set();
  const seenKey = new Set();
  let lastSponsoredAt = -Infinity;   // 1-in-20 ad cap (Part 6), enforced here

  let guard = 0;
  while (out.length < limit && guard < limit * 4) {
    let progressed = false;
    for (const id of pattern) {
      if (out.length >= limit) break;
      const list = ranked[id];
      if (!list) continue;
      let idx = cursors[id] || 0;
      // advance to the next not-yet-shown, ad-cap-legal candidate in this slot
      while (idx < list.length) {
        const post = list[idx];
        idx += 1;
        const k = keyForPost(post);
        if (seenId.has(post.id) || (k && seenKey.has(k))) continue;
        if (post.sponsored && (out.length - lastSponsoredAt) < 20) continue;   // hold sponsored back
        // take it
        cursors[id] = idx;
        out.push(post);
        seenId.add(post.id);
        if (k) seenKey.add(k);
        if (post.sponsored) lastSponsoredAt = out.length;
        progressed = true;
        break;
      }
      if (idx >= list.length) cursors[id] = idx;   // slot exhausted
    }
    if (!progressed) break;
    guard += 1;
  }
  return out;
}

/** For the "why you're seeing this" label — the slot a post was dealt from.
    Keyed strictly on the slot id so a regular body dish (slot 'dish') stays
    unlabelled and only the slot-7 floor reads "Seen by few". Null = no label. */
// Only the placements a reader would actually wonder about — the ones whose own
// card doesn't already state why it's here. The self-explaining cards (Nova, in
// season with its weather kicker, cooking-now's live banner, place's "popular
// near you") get no chip, so the label never just echoes the headline.
const SLOT_LABELS = {
  smallAccount: 'Seen by few',
  tagFollow:    'A tag you follow',
  inPerson:     'In person, near you',
};
export function slotLabelFor(post) {
  return SLOT_LABELS[post?.slot] || null;
}

/* ════════════════════════════════════════════════════════════════════════
   Originally feedContext.js — the lens every slot passes through before
   it's ranked.

   This is Part 5 of docs/product/DIG_IN_ALGORITHM.md: environment, calendar, and life
   events don't get their own slot — they MODULATE all the slots. A braise
   isn't wrong in July, it's just not what July wants; a $60 roast isn't wrong,
   it's wrong for someone who told us they're broke this month.

   Three layers, each honest about what it actually knows:

     • SEASON — derived from the calendar (real), not a fabricated temperature.
       We say "in season," not "it's 85° out." If some future module writes a
       real, fresh reading to `dig_in_weather`, we'll upgrade a seasonal tag to
       a true weather tag (#hotday) — but we never invent the reading.

     • CALENDAR — a holiday is a six-week ARC, not a banner. And only for
       holidays the user DECLARED (onboarding). We never infer someone's
       religion from behavior.

     • LIFE MODE — the user tells us what season of life they're in, and the
       feed reshapes for weeks. The grief mode ("someone died") is the most
       important thing here: the feed gets QUIET — fewer posts, no streak
       pressure, no confetti. An app that knows to get quiet is an app that's
       taking care of you. Modes expire and ask to be renewed; nobody should be
       stuck in grief mode six months later.
   ════════════════════════════════════════════════════════════════════════ */

const DAY_MS = 86400000;

/* ── Season ──────────────────────────────────────────────────────────────── */
export function seasonOf(now = new Date()) {
  const m = now.getMonth(); // 0=Jan
  if (m <= 1 || m === 11) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'fall';
}

// A real, fresh weather reading if any module has written one — else null.
// We only trust it for ~6h so a stale reading never drives the feed.
function realWeather() {
  try {
    const w = JSON.parse(localStorage.getItem('dig_in_weather') || 'null');
    if (w && Number.isFinite(w.tempF) && (Date.now() - (w.ts || 0)) < 6 * 3600 * 1000) return w;
  } catch { /* ignore */ }
  return null;
}

/**
 * What the season wants surfaced and pushed down. `suppress` is a regex tested
 * against a recipe's name/type — matched dishes are DEPRIORITIZED, never
 * removed (the doc's "suppress braises above 85°," done seasonally + honestly).
 * `contextTags` are structured chips that ride along on in-season recipes.
 */
export function seasonLens(now = new Date()) {
  const season = seasonOf(now);
  const base = {
    winter: { surface: /soup|stew|braise|roast|chili|bake|bread|dumpling|hot pot|curry/i,
              suppress: /cold noodle|no[- ]?cook|ice[- ]?pop|gazpacho/i,
              softCapMinutes: null, contextTags: ['#soupweather'] },
    spring: { surface: /asparagus|pea|herb|salad|radish|greens|lemon|light/i,
              suppress: null, softCapMinutes: null, contextTags: ['#springpicks'] },
    summer: { surface: /no[- ]?cook|grill|salad|cold noodle|chilled|ceviche|gazpacho|ice|slaw/i,
              suppress: /braise|stew|roast|casserole|slow[- ]?cook|pot roast/i,
              softCapMinutes: 40, contextTags: ['#summereats'] },
    fall:   { surface: /squash|apple|pumpkin|roast|braise|stew|cider|harvest|soup/i,
              suppress: null, softCapMinutes: null, contextTags: ['#fallharvest'] },
  }[season];

  // Upgrade to a TRUE weather tag only when we actually have a fresh reading.
  const w = realWeather();
  const contextTags = [...base.contextTags];
  let softCapMinutes = base.softCapMinutes;
  let suppress = base.suppress;
  if (w) {
    if (w.tempF >= 85) { contextTags.unshift('#hotday'); softCapMinutes = 40; suppress = /braise|stew|roast|casserole|slow[- ]?cook/i; }
    else if (w.tempF <= 32) { contextTags.unshift('#coldsnap'); }
    if (/rain|storm|snow/i.test(w.condition || '')) contextTags.push('#pantrycooking');
  }
  return { season, surface: base.surface, suppress, softCapMinutes, contextTags, live: !!w };
}

/* ── Calendar ramps ──────────────────────────────────────────────────────── */
const RAMP_PHASES = [
  { id: 'planning',  from: 42,  to: 15,  label: 'planning',  copy: 'starts coming into view' },
  { id: 'shopping',  from: 14,  to: 4,   label: 'shopping',  copy: 'time to shop' },
  { id: 'prepping',  from: 3,   to: 1,   label: 'prepping',  copy: 'prep days' },
  { id: 'day',       from: 0,   to: 0,   label: 'the day',   copy: 'today' },
  { id: 'leftovers', from: -1,  to: -3,  label: 'leftovers', copy: 'the leftovers window' },
  { id: 'aftermath', from: -4,  to: -10, label: 'aftermath', copy: 'winding down' },
];

function daysBetween(iso, now) {
  if (!iso) return null;
  const target = new Date(iso + 'T00:00:00').setHours(0, 0, 0, 0);
  return Math.round((target - new Date(now).setHours(0, 0, 0, 0)) / DAY_MS);
}

/** Which declared holiday's arc are we inside right now, and which phase.
    `declaredIds` comes from onboarding (localStorage 'dig_in_holidays') — we
    only ramp holidays the user claimed as theirs. Returns null otherwise. */
export function holidayRamp(now = new Date(), declaredIds = null) {
  const declared = declaredIds || loadDeclaredHolidays();
  if (!declared.length) return null;
  let best = null;
  for (const h of HOLIDAYS) {
    if (!declared.includes(h.id) || !h.dateISO) continue;
    const d = daysBetween(h.dateISO, now);
    if (d == null) continue;
    const phase = RAMP_PHASES.find((p) => d <= p.from && d >= p.to);
    if (!phase) continue;
    // Prefer the arc whose "peak" is nearest (smallest |days|).
    if (!best || Math.abs(d) < Math.abs(best.daysAway)) {
      best = { holiday: h, phase, daysAway: d, contextTags: [`#${h.id.replace(/-/g, '')}`] };
    }
  }
  return best;
}

export function loadDeclaredHolidays() {
  try { const v = JSON.parse(localStorage.getItem('dig_in_holidays') || '[]'); return Array.isArray(v) ? v : []; }
  catch { return []; }
}
export function saveDeclaredHolidays(ids) {
  try { localStorage.setItem('dig_in_holidays', JSON.stringify([...new Set(ids)])); } catch { /* quota */ }
}

/* Life modes moved to lib/personalization/lifeMode.js (light — no feed engine).
   Imported here because the feed reads the active mode, and re-exported so
   existing `from '.../buildFeed'` imports keep working. */
import { LIFE_MODES, setLifeMode, clearLifeMode, activeLifeMode } from '../personalization/lifeMode';
export { LIFE_MODES, setLifeMode, clearLifeMode, activeLifeMode };

/* ── Aspirational check (for the broke-mode suppression) ─────────────────── */
const LUXURY = /truffle|caviar|foie gras|wagyu|lobster|king crab|saffron|dry[- ]?aged|a5|osetra|uni\b|gold leaf/i;
export function isAspirational(recipe) {
  const hay = `${recipe?.name || ''} ${(recipe?.ingredients || []).map((i) => (typeof i === 'object' ? i.text || i.name : i)).join(' ')}`;
  return LUXURY.test(hay);
}

/* ── The one object the allocator + tag layer consume ────────────────────── */
/**
 * Assemble the full context lens for a feed build. Everything downstream reads
 * from this — the allocator for weighting/suppression, structuredTags for the
 * context chips. Pure w.r.t. its inputs (reads localStorage + `now`).
 */
export function buildContext({ now = new Date(), followed = null } = {}) {
  const lens = seasonLens(now);
  const holiday = holidayRamp(now);
  const mode = activeLifeMode(now);
  const shape = mode?.shape || {};

  const contextTags = [...lens.contextTags];
  if (holiday) contextTags.push(...holiday.contextTags);

  // Tags the user follows lean the WHOLE feed toward them — not as a hard
  // filter (that's the "Your Tags" tab), but as a soft weight applied across
  // every slot (processPool() above) PLUS an extra deal of the tag-follow
  // lane, so followed content shows up more everywhere while the ten slots
  // still deal you randomized discovery you didn't ask for. Following is a
  // dial, not a wall.
  const followedTags = followed instanceof Set ? [...followed] : (Array.isArray(followed) ? followed : []);
  const followBoost = followedTags.length ? ['tagFollow'] : [];

  return {
    now,
    season: lens.season,
    seasonSurface: lens.surface,
    seasonSuppress: lens.suppress,
    softCapMinutes: shape.capMinutes || lens.softCapMinutes || null,
    capMinutes: shape.capMinutes || null,
    contextTags,
    holiday,
    lifeMode: mode,
    followedTags,
    // Flattened shape hints the allocator reads directly:
    quiet: !!shape.quiet,
    noGamification: !!shape.noGamification,
    maxPosts: shape.maxPosts || null,
    budgetTier: shape.budgetTier || null,
    suppressAspirational: !!shape.suppressAspirational,
    boostSlots: [...(shape.boostSlots || []), ...followBoost],
    forceTags: shape.forceTags || [],
    // Pregnant / new-baby: real iron+folate tagging turns on (see
    // tagsForRecipe → lib/pregnancyGuide.js) and the common pregnancy
    // food-safety categories get softly deprioritized (processPool() above).
    pregnancyAware: !!shape.pregnancyAware,
  };
}
