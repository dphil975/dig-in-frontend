/* navConfig.js — the app's navigation map, shared by the sidebar (and any other
   nav surface). Five entries, no sub-menus:

     Nova      the home screen: check-in, Nova's pick, search — the default, and
               where you come back to
     Recipes   the four quadrants, recipe cards, recipe detail
     Discover  safety, places, categories, community, flavors
     Profile   the thread, collection, coins, pantry, trophies
     Settings  diet, life context, location, sign in/out, how it works

   The wordmark also goes to Nova. Every older address still resolves — each path
   below just says which of the five it lights up.

   Keeping this as data (not JSX) means the sidebar, the mobile drawer, and the
   active-highlight logic all read one source of truth. */

export const NOVA_PATHS = ['/', '/nova', '/nest', '/welcome'];

export const RECIPE_PATHS = [
  '/recipes', '/recipe-cards', '/recipe', '/recipe-ai', '/my-cookbook', '/boards',
  '/pixel-creator', '/meal-plan', '/whimsy', '/build-bar', '/archive',
];

export const DISCOVER_PATHS = [
  '/explore', '/discover', '/global-food', '/deals',
  '/craving', '/craving-compass', '/cravings',
  '/nibblers',
  '/out-there', '/occasions', '/checkin', '/circles', '/table',
  '/commute', '/grocery-commute', '/city-explorer', '/stores/chicago', '/stores/texas',
  '/kitchen-skills', '/kitchen-skills/hydration', '/kitchen-skills/condiments',
  '/zero-proof', '/copycat', '/drink-scan',
  '/feed', '/social',
];

// Pantry lives inside Profile; the shopping list is its neighbour.
export const PROFILE_PATHS = [
  '/profile', '/check-ins', '/collection', '/coins', '/leaderboard',
  '/pantry', '/pantry-recipes', '/barcode', '/shopping',
  '/trophies', '/badges', '/passport', '/memories', '/your-read', '/gratitude',
];

export const SETTINGS_PATHS = [
  '/settings', '/settings/life', '/settings/location', '/settings/account', '/settings/how-it-works',
  '/allergies', '/wellness',
];

export const NAV_GROUPS = [
  { id: 'nova',     label: 'Nova',     emoji: '🌤️', to: '/',         paths: NOVA_PATHS },
  { id: 'recipes',  label: 'Recipes',  emoji: '🍳', to: '/recipes',  paths: RECIPE_PATHS },
  { id: 'discover', label: 'Discover', emoji: '🧭', to: '/explore',  paths: DISCOVER_PATHS, prefixes: ['/tag/', '/circles/'] },
  { id: 'profile',  label: 'Profile',  emoji: '🙂', to: '/profile',  paths: PROFILE_PATHS },
  { id: 'settings', label: 'Settings', emoji: '⚙️', to: '/settings', paths: SETTINGS_PATHS },
];

/** Is a group the current page? */
export function groupActive(group, pathname) {
  return (group.paths || []).includes(pathname)
    || (group.prefixes || []).some((p) => pathname.startsWith(p));
}
