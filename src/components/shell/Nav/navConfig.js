/* navConfig.js — the app's navigation map, shared by the sidebar (and any other
   nav surface). Extracted from the old top Nav bar when it moved to a vertical
   Tumblr-style left sidebar (see components/shell/SideRail). Two top-level hubs,
   Recipes and Explore, each with their sub-pages; Home and You are flat.

   Keeping this as data (not JSX) means the sidebar, the mobile drawer, and the
   active-highlight logic all read one source of truth. */

export const RECIPE_PATHS = [
  '/recipes', '/recipe-cards', '/recipe', '/recipe-ai', '/my-cookbook', '/boards',
  '/pixel-creator', '/meal-plan', '/whimsy', '/build-bar', '/archive',
];
export const RECIPE_SUBLINKS = [
  { to: '/my-cookbook', label: 'My Cookbook', aliases: ['/boards', '/pixel-creator', '/meal-plan', '/whimsy', '/archive'] },
];

// The Community hub (Posts / Reels / For You / Your Tags — canonical /feed,
// aliased at /social and /reels) used to be buried two levels deep: Explore ▾
// → Community. That's exactly why the redesigned social feed was reported as
// "not showing on the hero page" — it was never one click from Home in the
// first place. It's now its own flat top-level entry (see NAV_GROUPS below),
// same tier as Home/Recipes/You, so SOCIAL_PATHS is kept OUT of EXPLORE_PATHS
// and there's no duplicate "Community" sublink under Explore anymore.
export const SOCIAL_PATHS = ['/feed', '/social', '/reels'];

export const EXPLORE_PATHS = [
  '/explore', '/discover', '/global-food', '/deals',
  '/craving', '/craving-compass', '/cravings', '/chaos-night',
  '/nibblers', '/girl-dinner',
  '/barcode', '/pantry', '/pantry-recipes', '/shopping',
  '/out-there', '/occasions', '/checkin', '/circles', '/table',
  '/commute', '/grocery-commute', '/city-explorer', '/stores/chicago', '/stores/texas',
  '/kitchen-skills', '/kitchen-skills/hydration', '/kitchen-skills/condiments',
  '/zero-proof', '/copycat', '/drink-scan',
];
// Condensed 2026-09-25: Copycat & Drinks retired (Zero-Proof now lives in
// Kitchen Skills), City Food Passport moved to You, and the four map entries
// (Grocery Commute, City Explorer, Chicago, Texas) are one Commute hub.
export const EXPLORE_SUBLINKS = [
  { to: '/craving',        label: 'Craving', aliases: ['/craving-compass', '/cravings', '/chaos-night'] },
  { to: '/kitchen-skills', label: 'Kitchen Skills', aliases: ['/kitchen-skills/hydration', '/kitchen-skills/condiments', '/zero-proof', '/copycat', '/drink-scan'] },
  { to: '/nibblers',       label: 'Nibblers, Elevated', aliases: ['/girl-dinner'] },
  { to: '/pantry',         label: 'Virtual Pantry', aliases: ['/pantry-recipes', '/barcode', '/shopping'],
    subs: [
      { to: '/pantry',         label: 'Inventory' },
      { to: '/barcode',        label: 'Scan a Barcode' },
      { to: '/pantry-recipes', label: 'Recipes I Can Make' },
    ] },
  { to: '/out-there',      label: 'Out There', aliases: ['/occasions', '/checkin', '/circles', '/table'] },
  { to: '/commute',        label: 'Commute & Stores', aliases: ['/grocery-commute', '/city-explorer', '/stores/chicago', '/stores/texas'] },
];

// The You hub (pages/You) — every "about me" page is a tab there now.
export const YOU_PATHS = [
  '/profile', '/your-read', '/badges', '/leaderboard', '/passport', '/memories', '/allergies', '/wellness',
];

/* The vertical nav: flat entries (Home, Social, Recess, You) and two
   expandable hubs. Social sits right after Home — same tier, not a sublink —
   since it's a primary destination (the Reddit-anatomy feed + Reels + For
   You + Your Tags), not a secondary Explore page. */
export const NAV_GROUPS = [
  { id: 'home',    label: 'Home',    emoji: '🍽️', to: '/',        paths: ['/'] },
  { id: 'social',  label: 'Social',  emoji: '💬', to: '/feed',    paths: SOCIAL_PATHS },
  { id: 'recess',  label: 'Recess',  emoji: '🌤️', to: '/recess',  paths: ['/recess', '/nova'] },
  { id: 'recipes', label: 'Recipes', emoji: '🍳', to: '/recipes', paths: RECIPE_PATHS,  sublinks: RECIPE_SUBLINKS },
  { id: 'explore', label: 'Explore', emoji: '🧭', to: '/explore', paths: EXPLORE_PATHS, sublinks: EXPLORE_SUBLINKS },
  { id: 'you',     label: 'You',     emoji: '🙂', to: '/profile', paths: YOU_PATHS },
];

/** Is a sublink the current page (direct path or one of its aliases)? */
export function sublinkActive(sub, pathname) {
  return sub.to === pathname || (sub.aliases || []).includes(pathname);
}

/** Is a group the current page (its own paths, or any of its sublinks)? */
export function groupActive(group, pathname) {
  if ((group.paths || []).includes(pathname)) return true;
  return (group.sublinks || []).some((s) => sublinkActive(s, pathname));
}
