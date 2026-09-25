# src layout

Reorganized 2026-09-25. Two rules decide where a file lives:

- **Topology (what connects to what).** A page that only ever renders as a tab
  of a hub lives *inside* that hub's folder. The folder tree follows the
  navigation graph, so `pages/` has one folder per destination in the sidebar,
  and nothing else. Anything two or more realms share moves out of `pages/`
  into `components/`, `lib/` or `data/`.
- **Cosmology (what orbits where).** Components are grouped by the part of the
  app they serve. `shell/` is on every screen. The other groups each serve one
  domain.

```
src/
  App.jsx, main.jsx   routes + boot
  pages/              six routed realms (below)
  components/         eight groups (below)
  lib/                logic: engines, storage, API clients
  services/           API + tracking services
  data/               static content (recipes, stores, seed reels)
  hooks/ utils/ styles/
  prototypes/         unwired drafts; nothing imports them (see its README)
```

## pages/: six realms

| Realm | Hub routes | Tabs / sub-pages inside |
|---|---|---|
| `Home/` | `/` | the home feed, fresh panel, post composer |
| `Recess/` | `/recess`, `/nova` | `Ritual/` (daily Recess), `Nova/` (Nova's Nest) |
| `Recipes/` | `/recipes`, `/recipe`, `/build-bar` | `RecipeCards/`, `InventTab/`, `RecipeFull/`, `BuildBar/`, `Cookbook/` → `MyCookbook/`, `Boards/`, `PixelCreator/`, `MealPlan/`, `WhimsyWeek/`, `Archive/` (Liked) |
| `Explore/` | `/explore` + sub-hubs | `Discover/`, `GlobalFood/`, `Deals/`, `Explorer/`, `Craving/` (Compass, Search, Tracker), `KitchenSkills/` (+ `ZeroProof/`), `Nibblers/`, `Pantry/` (Inventory, PantryRolodex, BarcodeScanner, Shopping), `OutThere/` (Occasions, CheckIn, Table, Circles, PublicIssue), `Commute/` (CommuteRoute, CityExplorer, ChicagoStoreMap, TexasStoreMap) |
| `Community/` | `/feed`, `/tag/:name`, `/reels/create` | `Feed/`, `SocialFeed/`, `ReelFeed/`, `TagHub/`, `FollowedTagsFeed.jsx` |
| `You/` | `/profile` and aliases | `Profile/`, `YourRead/`, `Badges/`, `Leaderboard/`, `FoodPassport/`, `MemoryVault/`, `Health/` (Allergies, Wellness) |

Every URL that existed before still resolves. Merged pages keep their old
path as an alias, and that alias opens the right tab. Newer hubs (You, Recess)
use `components/shell/PathHub`, where the URL picks the tab. Older hubs keep
tab state in `?tab=`.

## components/: eight groups

| Group | What it holds |
|---|---|
| `shell/` | On every screen: AuthGate (+ its `Auth/` sign-in screen), SideRail, Nav (+ `navConfig.js`, the site map), AskNova, NovaNudge, RunTimerBar, CookReflectionPrompt, PathHub |
| `nova/` | Nova's sprite and reactions: NovaSprite, NovaReaction, NovaUseItUp, NovaNudgeSettings |
| `recipe/` | Browsing and reading a recipe: step viewer, transform panel, slip/flip cards, RecipeReelFeed, Kitchen Alchemist, HealthyBaseBuilder, boosts/extras |
| `cook/` | While cooking and right after: timer HUD, celebration, dish pixelator, dish submission |
| `health/` | Safety and wellbeing panels: allergy, food safety, gut, hydration, wellness, recall alerts |
| `pantry/` | Pantry, budget and shopping: buckets, category grid, store run, swap helper, spend/tier budget, restaurant favorites |
| `social/` | Feed and community: **PostTypes** (every feed card type) and **Reel** (the 7-second player), DiscoverBento/Panel, CloserLook, hero cards, shoutouts, podcast/episode player, voice recorder, area picker |
| `you/` | Profile-only pieces: skin picker, flavor quiz, cook journal, cooked recipes |

Adding something new: if one page uses it, put it in the matching group. If
it renders on every route, put it in `shell/`.

### The feed engine

The home feed, a tag's page, your followed tags and the Liked archive all
render the same feed. They share one engine:
`lib/buildFeed.js` (assembles the feed), `components/social/PostTypes`
(renders each card), `components/social/Reel` (reel player),
`data/reels.data.js` (seed reels and the 5-stage arc), and
`lib/userReels.js` + `lib/reelFeedback.js` (your reels, likes and dislikes).

### Shared stylesheets (intentional)

- `pages/Home/Home.css` holds the post-card styles for every feed host, so
  TagHub, FollowedTagsFeed and CommuteRoute import it too.
- `components/you/CookedRecipes` reuses the cookbook card styles from
  `pages/Recipes/Cookbook/MyCookbook/MyCookbook.css`.

## Unwired but kept

These `lib/`/`data/` files aren't imported by anything yet. Each looks like
work in progress, so they stay put: `reachControl.js` and `timeline.js`
(author-controlled reach / distribution layer), `creatureSnapshot.js` (Nova
widget data), `discoverFeed.js`, `dynamicPricing.js`, `foodAccessStress.js`,
`data/liveDeals.js`. Wire them in or archive them.

## Retired from the bundle

Moved to `/_archive/frontend-retired/`, outside `src`, so none of it ships:

- **Copycat Lab, Drink Scan, Copycat & Drinks hub, CopycatPanel,
  copycatSavings, skillLevel, tasteEngine.** The whole feature reproduced named
  chains' menu items: brand IDs and brand colors, trademarked product names,
  and step-by-step in-store build instructions. `/copycat` and `/drink-scan`
  now redirect to Kitchen Skills.
- **Unrouted pages:** EducationalHelper, Nudges, PixelStylePopUp, StoresPages.
- **Unused components:** ChefAIAssistant, ClinicalNutritionAI,
  CulturalMealSwitcher, DiscoveryThreadView, FlavorAI, FlavorReverseEngineer,
  FoodMap (+ `lib/storePopup.js`), MealTimeBanner, OnboardingModal,
  RecipeScienceViewer, RecipeSlider, SmartFinder, StoreMemoryCard,
  StoreMiniMap, StorePopup, TransformationExamples, TrustStats,
  Nav/Leaderboard, Nav/RecipeSubmissionForm, RecipeProgressTracker,
  TravelModeToggle.

Book-derived data files and legacy `public/` scripts were removed too; see
`/_archive/copyright-removed/README.md` and `/_archive/public-legacy/`.

To restore any code here, move the folder back and re-add its route.
