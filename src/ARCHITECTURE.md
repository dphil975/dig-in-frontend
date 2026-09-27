# DIG-IN frontend architecture

The complete map of what is in `src/` today, what is live and what is not.
Updated 2026-09-26 after the Nova-first redesign (section 11): the import graph
was walked from `src/main.jsx` with `node scripts/frontend-map.mjs`, the new
flows and every route were driven in a browser, and `vite build` passes. Re-run
the script after big moves; its numbers are the source of the "live / unwired"
figures below.

**Contents:** 1 At a glance · 2 Stack · 3 Boot and shell · 4 Navigation and
routes · 5 Pages · 6 Components · 7 lib · 8 Services, hooks, utils, styles,
data · 9 State and storage · 10 Data and backends · 11 How the main flows
connect · 12 Cut and archived · 13 Still in `src`, wired to nothing · 14 Known
gaps · 15 Where to change what · 16 Rules for where files live

---

## 1. At a glance

DIG-IN ("come eat with people") is a **local-first React app**: recipes,
a pantry and store-run companion, a community feed, and Nova, a cooking
companion who is the home screen. Nova's job is three things: learn what you like,
pick the right recipe, and be there when you return. It is a single-page app and
an installable PWA. It runs with no
backend at all: the recipe corpus ships as static JSON, all personal state
lives in the browser, and Supabase is used for sign-in and a small amount of
cross-device sync.

| | |
|---|---|
| Routes | 74 (65 render a page, 9 redirect), over 22 lazy-loaded pages in 13 page folders |
| `src/` | 599 files: **537 live** (about 60k lines JS/JSX + 26k lines CSS) and **61 wired to nothing** (27 code files, 34 stylesheets; section 13) |
| Recipe corpus | 575 recipes, 71 cuisines, 361 with a Wikimedia photo |
| Device state | 132 `dig_in_*` names (`localStorage` keys, plus window events) |
| Sidebar | **Nova · Recipes · Discover · Profile · Settings**, no sub-menus (the wordmark also goes to Nova) |
| First load | entry chunk 248 KB (79 KB gzipped); the Nova home route adds about 126 KB of its own JS (132 KB gzipped in total with the entry) plus the 171 KB gzipped recipe file, which loads while the greeting is already on screen |

```
 index.html ─▶ src/main.jsx ─▶ app/main.jsx ─▶ app/App.jsx ─▶ app/router.jsx
                                                                   │
              pages/  13 folders, 22 lazy pages  ◀─────────────────┘
                 │ compose
                 ▼
              components/  8 groups: shell nova recipe cook health pantry social you
                 │ call
                 ▼
   lib/ 11 domains   services/ API clients   hooks/   data/ static content
                 │
                 ▼
   localStorage / sessionStorage ⇄ Supabase (sign-in, profile sync)
   /data/*.json (recipes)        ⇄ optional backends behind /api/*
```

## 2. Stack

| Concern | What is used |
|---|---|
| UI | React 19.2, `react-router-dom` 6.26 (`BrowserRouter`, `lazy` pages, `Suspense fallback={null}`) |
| Build | Vite 5.4 with `@vitejs/plugin-react` and `vite-plugin-pwa` (auto-update service worker; 5 MiB precache cap; runtime caches for fonts, Unsplash images, `/api/`, and the self-hosted Tesseract engine; the service worker is off in dev and `app/main.jsx` unregisters any leftover one) |
| Styling | Hand-written CSS: one 4.6k-line global `styles/styles.css`, `theme.css`, `catalog.css`, plus a stylesheet beside almost every component. Tailwind 3 is loaded (`styles/tailwind.css`) but only 4 files use utility classes. Fonts: Press Start 2P and DotGothic16, self-hosted (`public/fonts/`, Latin subsets, `styles/fonts.css`, preloaded in `index.html`; nothing loads from Google Fonts). Skins and display prefs: `lib/visual/appSkins.js` (`applyDisplay()` runs at boot) |
| Libraries | `lucide-react` icons · `leaflet` + `react-leaflet` maps (Commute) · `three` (voxel creature, Pixel Studio) · `tesseract.js` (receipt OCR in the pantry) · `html2canvas` (`utils/shareImage.js`) · `gif.js` (pixel GIFs) · `posthog-js` (analytics) · `@supabase/supabase-js` (auth, sync) |
| Declared, not imported by `src` | `@capacitor-community/safe-area` (no native shell is in this repo; `lib/platform/native.js` is the seam), `express` and `cors` (used only by `api-server.js`) |

## 3. Boot and shell

`index.html` loads `src/main.jsx`, which only does `import './app/main'`.
`app/main.jsx` imports analytics and four global stylesheets (tailwind, styles,
catalog, theme), calls `applyDisplay()`, and renders `<App />` in `StrictMode`.
`app/App.jsx` adds Leaflet's stylesheet and is the whole shell:

```
<BrowserRouter>                      (pullAndMerge() runs once at mount: pulls synced data)
  <AuthGate>                         Supabase sign-in wall. Bypassed in dev when VITE_SUPABASE_* is unset;
                                     a production build with them unset shows a "not configured" screen.
    <OnboardingGate />               renders nothing; sends a brand-new account to /welcome once per session
    <div.app-shell>
      <SideRail />                   the only navigation: the DIG-IN wordmark (goes to Nova) and the 5 entries.
                                     Off-canvas drawer on phones.
      <div.app-main> <AppRouter /> </div>
    </div>
    <RunTimerBar />                  the store-run clock, on every page (a tiny gate; the bar loads only during a run)
    <AskNova />                      floating cooking Q&A launcher; the panel loads on first open. The window
                                     event `dig_in_open_nova` opens it, optionally with `detail.question` typed in.
  </AuthGate>
</BrowserRouter>
```

`<Nav />` is still rendered by about 60 files. It is a stub that renders nothing
(the sidebar replaced the top bar) and is kept only so those files need no edits.

**Load time and navigation.** The shell stays small on purpose: pages are lazy; PostHog, Leaflet,
the feed engine, the allergy engine, Ask Nova's panel and the run-timer bar are all
loaded only when something needs them (`lib/platform/analytics` queues events until
PostHog arrives; `lib/maps/{regions,metros,leafletSetup}` and `lib/personalization/lifeMode`
were split out so a light import does not drag in a heavy module). The two web fonts are
same-origin, so first paint no longer waits on a third party.

Page chunks are loaded through `app/routeLoaders.js`. The sidebar and "Cook with Nova"
call `prefetchRoute` on hover, focus or touch, so the chunk is usually already there by
the click. `BrowserRouter` runs with `v7_startTransition`, so a tab change keeps the
current page on screen until the next one is ready; the tapped sidebar entry pulses
meanwhile (`useTransition` in `SideRail`). Only a direct link or first load, with nothing
on screen yet, shows `RouteFallback` (three dots, invisible for the first 250 ms).

## 4. Navigation and routes

The site map is data, in `components/shell/Nav/navConfig.js`. The sidebar, the
mobile drawer and the active-highlight logic all read it.

### 4.1 Sidebar

Five entries, no sub-menus. The old sub-links moved into the pages: Discover →
Categories links to Craving, Kitchen Skills, Nibblers, Global Food, Deals, Commute
and Out There; My Cookbook is Profile → Collection; the Virtual Pantry is Profile →
Pantry. The "season of life" control moved to Settings → Life context and the tags
you follow to Discover → Community.

| Entry | Opens | Highlights for |
|---|---|---|
| Nova | `/` | `/` `/nova` `/nest` `/welcome` |
| Recipes | `/recipes` | `/recipes` `/recipe-cards` `/recipe` `/recipe-ai` `/my-cookbook` `/boards` `/pixel-creator` `/meal-plan` `/whimsy` `/build-bar` `/archive` |
| Discover | `/explore` | `/explore` `/discover`, the Explore family (`/global-food` `/deals` `/craving*` `/kitchen-skills*` `/nibblers` `/out-there` `/commute*` …), Community (`/feed` `/social` `/tag/*`) |
| Profile | `/profile` | `/profile` `/check-ins` `/collection` `/coins` `/leaderboard` `/pantry` `/pantry-recipes` `/barcode` `/shopping` `/trophies` `/badges` `/passport` `/memories` `/your-read` `/gratitude` |
| Settings | `/settings` | `/settings`, `/settings/{life,location,account,how-it-works}`, `/allergies`, `/wellness` |

### 4.2 Every route

| Area | Paths |
|---|---|
| Onboarding | `/welcome` |
| Nova | `/` (the home screen) · `/nest` (sit with Nova) |
| Recipes | `/recipes` · `/recipe-cards` (Browse) · `/recipe-ai` (Invent, ingredients mode) · `/build-bar` (Invent → Build Bar) · `/recipe` (recipe page) |
| Cookbook | `/my-cookbook` (Saved) · `/boards` (Collections) · `/pixel-creator` (Pixel Studio) · `/meal-plan` · `/whimsy` · `/archive` (Liked) · `/board` (a shared board) · `/whimsy-card` (a shared Whimsy card) |
| Discover | `/explore` · `/discover` |
| Explore hub | `/global-food` · `/deals` |
| Craving | `/craving` · `/craving-compass` · `/cravings` (tracker) |
| Kitchen Skills | `/kitchen-skills` · `/kitchen-skills/hydration` · `/kitchen-skills/condiments` · `/zero-proof` |
| Nibblers | `/nibblers` |
| Out There | `/out-there` · `/occasions` · `/checkin` · `/circles` · `/table` · `/circles/:id` |
| Commute | `/commute` · `/grocery-commute` · `/city-explorer` · `/stores/chicago` · `/stores/texas` |
| Pantry (a Profile tab) | `/pantry` · `/pantry-recipes` · `/barcode` · and `/shopping` (its own page) |
| Community | `/feed` · `/social` · `/tag/:name` |
| Profile | `/profile` (Thread) · `/check-ins` · `/collection` · `/coins` · `/leaderboard` · `/trophies` · `/badges` · `/passport` · `/memories` · `/your-read` · `/gratitude` (hidden tab) |
| Settings | `/settings` · `/settings/life` · `/settings/location` · `/settings/account` · `/settings/how-it-works` · `/allergies` · `/wellness` |
| Public | `/issue` (the weekly Issue) |
| Redirects (9) | `/nova` and `/recess`→`/` · `/reels` and `/reels/create`→`/feed` · `/chaos-night`→`/cravings` · `/copycat`→`/kitchen-skills` · `/drink-scan`→`/zero-proof` · `/girl-dinner`→`/nibblers` · anything unknown→`/` |

### 4.3 How hubs pick a tab

- **`PathHub`** (`components/shell/PathHub`): the URL picks the tab, a tab click
  navigates, and old addresses are `aliases`. A tab can be `hidden` (routable, no
  button; Profile's Gratitude log) and the row has a `trailing` slot (Profile's
  "⋯" menu). Used by **Profile and Settings**.
- **`?tab=` hubs** keep tab state in the query string; the router passes a
  `defaultTab` for each alias (so `/boards` is the Cookbook with the Collections
  tab open). Used by Recipes, Cookbook, Explore, Craving, Kitchen Skills, Out There,
  Commute and Community. The **Pantry** tab reads its section (Inventory, Scan an
  item, Recipes I can make) from the URL.
- **Opening a recipe never uses an id in the URL.** The caller stores the recipe
  JSON in `sessionStorage['dig_in_full_recipe']` (plus `…_adapt`) and navigates to
  `/recipe`. About 25 files do this.

## 5. Pages

`pages/` has one folder per destination. Line counts are JS/JSX only and
approximate.

| Folder | Routes | What it is |
|---|---|---|
| `Nova/` (0.6k) | `/` `/nest` | **The home screen** (`index.jsx`): greeting → follow-up / "How'd it go?" → check-in → Nova's pick → search → "that's today. come back tomorrow." Redirects to `/welcome` until onboarded. It only orchestrates; the pieces are `components/nova/*` and the logic is `lib/nova/*` (section 11). `Nest/`: the Shadow-to-Light companion (protocol player; tone and Kindness Protocol tucked into one collapsed panel). |
| `Welcome/` (0.3k) | `/welcome` | The signup "madlib": eight fill-in-the-blank questions with a live sentence. The first five tell Nova what you're after; what you avoid, your season of life and where you cook are optional and are written into Settings' stores. The last answer saves everything, gives 10 coins, and lands on Nova (no starter screen any more). |
| `Discover/` (0.5k) | `/explore` `/discover` | One page, five sections: **Safety** (Recall Watch, Grow & Regrow, use-it-up link, community tips; each a one-line collapsed row, so the section is the same height while the FDA feed loads), **Places** (somewhere else today, your city, featured cities), **Categories** (budget, quick, gluten-free, bread, hosting … and the other hubs), **Community** (open questions, tag hubs, The Table, "Share a tip" composer), **Flavors** (one recipe in 8 flavors on its own dark panel, the flavor quiz). Only the slim jump bar is sticky. |
| `RecipeCards/` (1.9k) | `/recipes` + aliases | The Recipes hub. **Browse** opens on the four quadrants (Nova · Family · Celebration · Crowd: solo or shared × daily or special, starting from your welcome answers) and Nova's quick picks, then the recipe cards (`Browse/`, 1.5k: rows of cards, the meal pills, the Discover swipe game, the slip-card modal). Filters, the spend planner and the context chips sit behind one "Filters" toggle. **Invent** (`InventTab/`: Kitchen Alchemist, healthy base builder, `BuildBar/`). |
| `RecipeFull/` (0.4k) | `/recipe` | The recipe page and cook mode. Composes the step viewer, timer HUD, equipment gate, the allergy/wellness/gut/food-safety/hydration/budget/transform panels, celebration, dish submission, and the pixelator. |
| `Cookbook/` (2.9k) | `/my-cookbook` + aliases | Six tabs: Saved Recipes (`MyCookbook/`), Collections (`Boards/`), Pixel Studio (`PixelCreator/`, with a three.js voxel builder), Meal Plan, Whimsy Week (+ a shared-card page), Liked (`Archive/`). |
| `PublicBoard/` | `/board` | Read-only view of a shared board. |
| `Explore/` (7.3k live) | `/global-food` `/deals` + sub-hubs | Hub tabs Global Food · Deals (the old Explorer masonry grid and the Discover bento tabs were retired). Sub-hubs, reached from Discover → Categories: `Craving/` (search, compass, tracker) · `KitchenSkills/` (tools, hydration, condiments, `ZeroProof/`) · `Nibblers/` · `OutThere/` (occasions, check-in, circles, the Table) · `Commute/` (grocery commute, City Explorer, Chicago and Texas store maps). |
| `Pantry/` (2.1k) | `/pantry` + aliases (rendered by Profile) | The Pantry tab: pills for `Inventory/` (in-store companion: scan or key in items, a "deciding" tray, then file to pantry/fridge/freezer; receipt OCR; a recall banner and badge; Nova's "Use it up first" card), `BarcodeScanner/` (Scan an item), `PantryRolodex/` (Recipes I can make); `Shopping/` is its own page. |
| `Community/` (1.4k) | `/feed` `/tag/:name` | Tabs Posts (`SocialFeed/`) and Your Tags (`FollowedTagsFeed.jsx`); `TagHub/` is a tag's own page. |
| `Profile/` (1.7k) | `/profile` + tabs | **Thread** (you and Nova, newest first, and "The return is N") · **Collection** (saved recipes and boards, cooked recipes, cook journal) · **Coins** (quests; `/leaderboard`) · **Pantry** (lazy) · **Trophies** (trophies, badges, passport, keepsakes, pixel diary, store check-ins; `/badges` `/passport` `/memories` `/your-read` open inside it) · a hidden Gratitude log behind "⋯". |
| `Settings/` (0.7k) | `/settings` + tabs | **Diet** (`Health/`: allergies, wellness goals) · **Life context** (season of life; "just listen — don't offer fixes") · **Location** · **Account** (sign out, taste quiz, appearance) · **How it works** (the six-card tour). |
| `PublicIssue/` | `/issue` | The public weekly Issue (community answers made public). |

## 6. Components

Eight groups. `shell/` renders on every route; the others each serve one domain.
Inside a group, related pieces are **nested under one parent folder**, and the
old top-level path is kept as a **stub folder** (48 of them) whose `index.jsx` is a
one-line re-export. Most callers still import through the stubs, so the stubs are
load-bearing: keep them until callers are updated.

| Group | Parent → nested parts | Standalone |
|---|---|---|
| `shell/` | `AskNova` (launcher + lazy `Panel`) · `AuthGate` → Auth · `SideRail` → Nav | OnboardingGate, PathHub, RouteFallback, RunTimerBar (gate + lazy `Bar`) |
| `nova/` | `NovaSprite` → NovaReaction · `NovaNudgeSettings` → NovaUseItUp ("Use it up first") | **CheckIn** (Calm · Stressed · Tired · Happy · Skip, more feelings), **PickCard** (Nova's pick), **ReturnCards** (the follow-up and "How'd it go?"), **HomeSearch** (search that listens for feelings and crisis language) |
| `recipe/` | `RecipeCard` → RecipeSlipCard, DishFlipCard, DishPixelPreview · `RecipeStepViewer` → RecipeTransformPanel, StepBoomerang · `RecipeAlchemist` → DescribeMode, IngredientsMode, Teaser, HealthyBaseBuilder · `RankRecipesModal` → MoodPrompt | RecipeExtras, RecipeBoostSections, EquipmentGate, **RecipeReelFeed** (the Discover swipe stack: left = no, right = open, up = super-like; the name is historical) |
| `cook/` | `CookTimerHUD` → CookCelebration, DishSubmissionModal, FinishedDishPixelator | none |
| `health/` | `HealthPanel` → AllergyPanel, FoodSafetyPanel, RecallAlert, **RecallBar** (the recall banner: pantry scope, or recipe scope when given `ingredients`) · `WellnessPanel` → GutHealthPanel, HealthAdvisory, HydrationPanel | **FreshPanel** (`RecallWatch`, `GrowAndRegrow`, `CommunityTips`; used by Discover → Safety) |
| `pantry/` | `PantryTools` → StoreRun, SwapHelper, SpendPlanner, SmartPrepping, ShoppingTrips, PutbackInsight, RestaurantFavorites · `PantryGrid` → PantryBuckets, PantryCategoryGrid · `BudgetPanel` → CashStack, TierBudgetPanel | CookFromPantry |
| `social/` | `PostComposer` → **PostTypes** (every feed card), ShoutoutCard, PodcastRow, EpisodePlayer, VoiceRecorder, AreaPicker · `DiscoverPanel` → DiscoverBento, CloserLook, HeroHighlights, InteractiveHeroRecipe | none |
| `you/` | `CookJournal` → CookedRecipes · `SkinPicker` → FlavorQuizModal | none |

## 7. `lib/`

Eleven domain folders hold the logic (about 24k lines in 65 merged modules).
`lib/` also holds **123 one-line re-export shims** (`lib/flavorProfile.js` →
`./flavor/flavorProfile`) from the reorganization; old imports go through them.
New code imports from the domain folder and adds no new flat files.

| Domain | What it holds | Main modules |
|---|---|---|
| `recipe/` | Building the feed, generating and transforming recipes, cooking | `buildFeed` (the community feed's lanes and slot order), `recipeAlchemist`, `recipeBooks` (`loadRecipeBooks`, the cached 575-recipe fetch), `recipeTransform`, `recipeRecommender`, `mealPlanEngine`, `mealWindows` (breakfast / lunch / dinner / late night by the clock), `quadrants` (Nova · Family · Celebration · Crowd, and which a recipe falls in), `starterEngine` (biofield resonance, the recall check), `cookTimer`, `cookJournal`, `cookAchievements`, `equipmentDetector`, `ingredientSwap`, `buildBar` |
| `nova/` | Nova's brain. Pure logic, no React, meant to move to a backend. | **`thread`** (the log of you and Nova: check-ins, picks, swaps, saves, cooks, reflections, follow-ups; the return count; what to steer away from), **`pick`** (`pickForNow`, `quickPicks`, pick-me-up ingredients), **`voice`** (every line she says: the "Nova Says" table), `novaKnowledge` (deterministic Q&A from the corpus + the nudge playbook), `kindnessProtocol` (moods, nurture responses, `solveQuery`, moderation rungs), `shadowToLight` (the 7-phase protocol), `novaSettings` (tone, voice) |
| `pantry/` | Pantry, store runs, budget | `pantryTools`, `storeRun`, `budgetTarget`, `freshness` (+ scanned-item recipes), `shelfLife` (how long an item has left; split out so the home screen stays light), `barcodeLookup` (Open Food Facts + receipt OCR), `restaurantFavorites`, `restaurantHints` |
| `health/` | Allergy, wellness, safety | `allergyProfile` (+ food-safety temps), `wellnessGoals` (+ gut, hydration, healthify, pregnancy guide), **`recalls`** (FDA recalls: the pantry cache, the general feed, recipe matching), `recallWatch` (re-exports `recalls`, plus nutrition facts and the pregnancy guide) |
| `flavor/` | Taste model | `flavorProfile` (8-flavor profile, swipe learning, pairing, diet match, and Nova's gratitude / wins / lightness), `cravingTracker`, `mealMood`, `growGuide` |
| `personalization/` | You over time | `onboarding`, `lifeMode` (the seasons of life), `archetypeEngine`, `foodPassport`, `memoryVault`, `occasions`, `whimsyWeek`, `holidayCalendar` |
| `social/` | Community | `communityHub` (tags, circles), `theTable`, `nibblers`, `userPosts`, `openQuestions`, `wordFilter` (+ `bannedWords`), `reelFeedback` (now just the virality signal) |
| `maps/` | Place and weather | `commutePlanner`, `localFlavor` (ZIP→state, moving guide), `metros` (the named metros), `regions`, `weatherService`, `leafletSetup` (just the marker-icon fix) |
| `monetization/` | Ranking and sponsors | `madeItRate` (the Meals-Made signal; also reply-depth rank, owned-tools tracking, spins), `rankRollout` (staged ranking rollout + author reach controls), `sponsorships` (click tracking, referral links, dynamic pricing) |
| `visual/` | Look and pixel art | `appSkins`, `pixelArt` (palette extraction, dithering, GIF), `voxelArt` (three.js) |
| `platform/` | Plumbing | `supabase` (client + sync), `analytics` (PostHog, loaded lazily), `native` (device seam), `loadScript` |

## 8. Services, hooks, utils, styles, data

| Folder | Contents |
|---|---|
| `services/` | `api.js` (API client for the Node, Python and Flask backends; `fetchRecipes` falls back to the static corpus), `authService.js`, `geoService.js` (location + store check-ins), `novaAI.js` (`/api/recipe-ai` client + store photo missions), `saveService.js` (saved recipes and boards). Five more files are re-export shims (`behaviorTracker`, `boardsService`, `checkinService`, `photoMissionEngine`, `seasoningPairingEngine`). |
| `hooks/` | `useAuth`, `useCoins`. |
| `utils/` | `shareImage.js` (element → PNG, share or download), `loadScript.js` (loads the legacy `public/js/*` scripts the Deals page still uses). |
| `styles/` | `styles.css` (global, 4.6k lines), `theme.css`, `catalog.css`, `tailwind.css`, `leaflet.css`. |
| `data/` | Bundled datasets: `recipes/` (`recipesStatic`, `extraRecipes`, `cookingScience`, `recipeBoosts`), `city/` (`cityFoodData`, `parkAndRide`, `travelPartners`), `stores/` (`storeData`, `sponsorships`, `liveDeals` (unwired)). Ten flat shims re-export them. |

## 9. State and storage

**Local-first.** `localStorage` is the source of truth, so the UI never waits on a
network. `sessionStorage` carries the recipe hand-off to `/recipe`. Three window
events wire distant parts together: `dig_in_lifemode` (the season changed),
`dig_in_thread` (something was written to the thread) and `dig_in_open_nova` (open
Ask Nova, optionally with a question).

**What syncs.** Only coins, home borough, check-in state, badges and saved
recipes, through `lib/platform/supabase.js` (`pullAndMerge()` on load and login;
`push*` calls are fire-and-forget) to the Node backend's `/api/users/*`. Everything
else is per device.

| Family | Examples | Owner |
|---|---|---|
| Account and onboarding | `dig_in_user_id`, `dig_in_onboarded`, `dig_in_onboarded_uid`, `dig_in_needs_onboarding`, `dig_in_onboarding_answers` | `lib/platform/supabase`, `lib/personalization/onboarding` |
| Progress | `dig_in_coins`, `dig_in_badges`, `dig_in_quests`, `dig_in_checkins`, `dig_in_food_passport` | `hooks/useCoins`, `foodPassport`, Profile |
| Recipes and cooking | `dig_in_saved`, `dig_in_boards`, `dig_in_cook_history`, `dig_in_cook_journal`, `dig_in_meal_plan_*`, `dig_in_whimsy_week` | `services/saveService`, `lib/recipe/*` |
| Pantry and shopping | `dig_in_pantry`, `dig_in_shopping_list`, `dig_in_store_run`, `dig_in_receipts`, `dig_in_budget_target` | `lib/pantry/*` |
| Health | `dig_in_allergy_profile`, `dig_in_allergy_journal`, `dig_in_wellness_goals`, `dig_in_recall_cache` (per-item FDA checks, daily), `dig_in_recall_feed` (the general recall feed, daily) | `lib/health/*` |
| Nova | **`dig_in_thread`** (the event log, last 500), **`dig_in_returns`** (`{count, lastDay}`: the ♥), **`dig_in_nova_shown`** (dishes put in front of you, so tomorrow's pick differs), `dig_in_nova_settings`, `dig_in_nova_session`, `dig_in_nova_gratitude`, `dig_in_nova_wins`, `dig_in_nova_memories`, `dig_in_nurture_checkin` (the Nest's older check-in log, kept in step) | `lib/nova/*`, `lib/flavor/flavorProfile`, `memoryVault` |
| Personalization | `dig_in_life_mode`, `dig_in_craving_prefs` (the 8-flavor profile), `dig_in_flavor_quiz_done`, `dig_in_swipe_learning`, `dig_in_archetype` | `lib/personalization/lifeMode`, `lib/flavor/*` |
| Location | `dig_in_home_borough`, `dig_in_zip`, `dig_in_weather` | Settings, `lib/maps/*` |
| Feed and social | `dig_in_followed_tags`, `dig_in_user_posts`, `dig_in_area` | Discover → Community, `lib/social/*` |
| Appearance | `dig_in_skin`, `dig_in_display_prefs` | `lib/visual/appSkins` |
| Ranking and metrics | `dig_in_mir_impressions`, `dig_in_spins`, `dig_in_rollout_shadow_log` | `lib/monetization/*` |

## 10. Data and backends

**The recipe corpus.** Per-country JSON files in `data/` (107 `*-phaseN-authentic.json`,
47 legacy `*-authentic-recipes.json`, indexes) are flattened by
`python3 scripts/build-recipes-full.py` into `public/data/recipes_full.json`
(`public/data` is a symlink to `../data`). A recipe carries `image` and
`imageCredit` (author, source, license, URL) when a verified photo exists.
It is read two ways:

- **Flattened:** `loadRecipeBooks()` (the Nova home screen and its pick, Recipes' quick
  picks, Discover → Places, Ask Nova, Alchemist, meal plan) and `services/api`
  (`searchRecipes` for Nova's search box, `fetchRecipes`; it normalizes and drops the photo fields).
- **Per file:** Recipes Browse reads `data/recipes-index.json`, fetches each country file,
  and merges two bundled sets (`RECIPES_STATIC`, `EXTRA_RECIPES`) plus `cafe-menu.json`.

**Backends (all optional).** The frontend calls them only when configured, and fails soft.

| Service | Where | Reached at | Used for |
|---|---|---|---|
| Node backend | separate repo (`../Dig In-backend`), port 5000 | `/api/*` (generic proxy), `VITE_API_BASE` | user sync, recipes DB, journal, circles, podcast, knowledge, uploads, nearby stores, live deals |
| Python/Flask | `backend/` (`app.py`, `pantry_ai.py`, `recipe_rolodex.py`, `substitution_engine.py`, `time_manager.py`, `grocery_locator.py`, `data_monetization.py`), port 5001; deployed to Render | `/api/scan_pantry` `spin_rolodex` `substitute` `search_recipe` `shopping_list` `timeline` `start_timer`, `/food/*`, `/badges/progress`; `VITE_FLASK_BASE` | pantry scan, rolodex, substitutions, timers, craving search |
| Vercel functions | `api/` (`recipe-ai.js` → OpenAI, `recalls.js` + `_fdaRecalls.mjs` → FDA); `api-server.js` runs them locally on 5003 (`npm run dev:ai`) | `/api/recipe-ai`, `/api/recalls` | Kitchen Alchemist, Nova's LLM answers, recall bar |
| Supabase | `supabase/migrations/…_profiles.sql` | client SDK | sign-in (email, phone OTP, Google), profile |

**Public services the browser calls directly:** Nominatim (geocoding), Overpass
and OSRM (stores, routes), Open-Meteo (weather), Open Food Facts (barcodes), FDA
(recalls), OpenStreetMap tiles, PostHog (analytics), and Google Maps deep links.

**Environment:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE`,
`VITE_PYTHON_BASE`, `VITE_FLASK_BASE`, `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`;
server side `OPENAI_API_KEY`, `AI_API_PORT`.

## 11. How the main flows connect

**The Nova loop** is the spine of the app. Sign up, answer the madlib, then Nova
takes over and looks after the rest: learn what you like, pick the right recipe,
be there when you return.

- **Sign-up to first pick.** `Auth` (`AuthGate/Auth`) flags the sign-up →
  `OnboardingGate` sends the new account to `/welcome` → eight madlib answers →
  `applyAnswersToProfile` writes allergies, season and location, `saveAnswers`
  keeps the rest (including your quadrant), 10 coins → `/` where Nova introduces
  herself ("I'm Nova. I'm here to learn what you like.") and makes the first pick.
  "Done" is remembered per account, so a second person on the same browser is asked
  too. (Not run against a real Supabase project.)
- **A visit.** `pages/Nova` reads `lib/nova/thread` and shows, in order: the
  greeting ("Good afternoon. It's lunch time."; the ♥ counts days you've come back;
  hidden in a quiet "someone died" season) → a **follow-up** if you had a heavy
  check-in on an earlier day (within 3 days) → **"How'd it go?"** if you cooked and
  haven't said → the **check-in** (Calm · Stressed · Tired · Happy · Skip, and more
  feelings) → **Nova's pick** → search → "that's today. come back tomorrow."
- **How she picks** (`lib/nova/pick.pickForNow`). Scores every recipe on: the meal
  window (by the clock), today's mood, your season of life and who you cook for, the
  biofield built from your welcome answers (`MorphogeneticField.resonance`), the
  8-flavor taste profile, what's in your pantry about to turn, and the thread
  (nothing shown yesterday, swapped, or cooked lately comes back). Then, on the
  ranked list only, it drops anything with an allergen you flagged or an ingredient
  on a live recall. The reason line ("Because you're tired, I picked something
  quick.") comes from `lib/nova/voice`.
- **She learns from what you do.** "Cook with Nova" → `view`; "Show me something
  else" → `skip`; Save → `save`; "I made this" on the recipe page → `cook`; "Loved it"
  → `superlike`, "Not for me" → three `skip`s (all `recordFlavorSignal`). Each is also
  an event in the thread. Nothing here says "Nova is learning": she says what she
  noticed, in the first person.
- **Being there when you return.** A heavy check-in (tired, stressed, angry, sad,
  anxious, overwhelmed, lonely) is saved with its timestamp. On the next visit on a
  later day she asks how you are; if it's still rough she offers a pick-me-up, chosen
  by ingredients that suit the mood (`PICK_ME_UP` in `lib/nova/pick`; comfort and
  ease, never medicine). After a cook, the next visit starts with "How'd it go?".
  After a gap: "Welcome back. You cooked three days ago."
- **Find and cook.** Search, Recipes (quadrants) or Nova's pick → `/recipe` →
  `RecipeStepViewer` + `CookTimerHUD` + the health panels → "I made this" →
  `CookCelebration` → `DishSubmissionModal`, `FinishedDishPixelator`, the cook journal
  and the thread.
- **Recalls.** One banner (`components/health/RecallBar`) in three places: Nova (what
  in your pantry is on a live FDA recall, and the same check on the dish she picked),
  the recipe page (a recall that matches something you own, or a serious recent one
  from the general feed that names an ingredient) and, with the per-item badge and
  alert, the Pantry. Discover → Safety shows the general feed. Only live recalls raise
  a banner (ongoing, or recent and not closed out); an old terminated match does not.
- **The community feed.** `buildFeed` deals lanes in a fixed order, shaped by the
  season of life (`LIFE_MODES`), weather and the Meals-Made ranking; `PostTypes` draws
  each card. Community → Your Tags, TagHub and the Liked archive share it. The home
  screen no longer uses it.
- **Nova outside the home screen.** `AskNova` (floating Q&A; deterministic answers
  from the corpus, upgraded by `/api/recipe-ai` when available; opened with a question
  from Discover → Community), `Nova/Nest` (sit with the feeling: a quiet door from any
  heavy check-in, and from feelings typed into search). It is all client-side today;
  the intent is to move Nova's logic to the backend, so keep UI and logic separate:
  `lib/nova/*` has no React in it.
- **Pixel art and photos.** `lib/visual/pixelArt.js` turns a photo into pixel art
  for `DishPixelPreview` (natural palette by default), step photos, the
  `FinishedDishPixelator` and Pixel Studio. Recipe photos are Wikimedia files with
  attribution (shown under the photo on Nova's card and the recipe page); a recipe
  without a verified photo shows a "no photo yet" placeholder.
- **Pantry and store runs.** Inventory holds items you scan or type; `RunTimerBar`
  shows the run clock everywhere; recipes-you-can-make and Nova's pick read
  `dig_in_pantry`.
- **Health.** Allergy statuses (Settings, or the welcome quiz) drive the warnings and
  substitutions on every recipe and keep flagged foods out of Nova's picks.

## 12. Cut and archived

Nothing was deleted; it all lives under `_archive/` (not shipped).

| Where | What |
|---|---|
| `_archive/return-back/phase-2/` | To revisit later: Pixel Studio's legacy pages, Cooking Science, the old Cookbook page, Mini Games |
| `_archive/return-back/phase-3/` | To revisit later: Educational Helper, the old Social Feed page, Frog Garden, Pixel Friend Garden |
| `_archive/frontend-retired/` | **Recess** (Ritual page and `recess.js`), **Reels** (feed, creator, player, seed data), the old 17-section Profile page, the Copycat/Drink Scan feature, unrouted pages, unused components, and dead duplicate page trees (`You-duplicate`, `Recipes-duplicate`, `Explore-Pantry-duplicate`, `OutThere-PublicIssue-duplicate`, `Cookbook-Boards-Shared-duplicate`). Re-export shims for retired libs are in `lib/shims/`. |
| `_archive/frontend-retired/` (the Nova-first redesign) | `pages/Home-feed` (the old home: For You / Fresh / Your Tags tabs, Cooking Now, right rail, tag-union search), `pages/Nova-Today`, `pages/Welcome-starter-set` (the five-card starter screen), `pages/Explore-Explorer` and `pages/Explore-Discover` (the masonry tab and the bento), `components/CookReflectionPrompt` + `lib/cookReflection` (replaced by "How'd it go?" on the home screen), `components/NovaNudge*`, `components/DiscoverBento`, `hooks/useSave.js`. `FreshPanel` and `PostComposer` were not retired: they moved to `components/health/FreshPanel` (Discover → Safety) and `pages/Discover` ("Share a tip"). |
| `_archive/{html,frontend,js,css,public-legacy,python,mobile_app,docs}` | The legacy multi-page site and its tooling |
| `_archive/{prototypes,copyright-removed}` | Unwired drafts; book-derived recipe data removed for copyright |

To restore anything: move the folder back into `src/` and re-add its route.

## 13. Still in `src`, wired to nothing

`node scripts/frontend-map.mjs` reports 27 code files and 34 stylesheets that
nothing loads. None of it is needed to run the app; most is reorganization residue.

| What | Files |
|---|---|
| **Re-export shims nobody imports** (22) | `App.jsx`, `components/{health/HealthPanel, pantry/PantryGrid, pantry/PantryTools, recipe/RecipeCard, social/PostComposer}/index.jsx`, `components/shell/SideRail/Nav/navConfig.js`, `data/liveDeals.js`, `lib/{creatureSnapshot, discoverFeed, dynamicPricing, explorer, feedContext, foodAccessStress, growGuide, novaNudges, nurture, reachControl, recallWatch, remixEngine, timeline, wordFilter}.js` (the redesign moved several callers onto the domain modules, which left these unused) |
| **An unrouted page** | `pages/Community/Feed/` (a full-screen swipe page built on `RecipeReelFeed`) |
| **Unfinished modules** (4 real files) | `data/stores/liveDeals.js`, `lib/health/foodAccessStress.js` (area-level "how hard is it to feed a household" index), `lib/personalization/timeline.js` (author-controlled reach layer), `lib/social/discoverFeed.js` |
| **Stale stylesheet copies** (34) | Left behind in old component folders when components were nested. Most are byte-identical to a live copy; `components/cook/CookCelebration/CookCelebration.css` is an older copy of the live one (it lacks the photo-credit style). The live copies are the nested ones. |

Dead code also sits **inside live modules**: `lib/social/userPosts.js` still
contains the reels-era persistence (`loadUserReels`, `publishUserReel`, founding
numbers) and `lib/social/reelFeedback.js` its like/dislike helpers; only the text
posts and the virality signal are used.

## 14. Known gaps

Each of these was checked in a browser or in the code.

1. **The static store datasets are gone.** `public/stores-*.json` (39 files the app
   expects: 38 states plus `stores.json`) are not in the working tree; their deletion
   is staged in git. City Explorer and Texas Stores load them, fail quietly, and show
   **0 stores**. Chicago Stores calls `/api/stores/nearby` and shows an error ("Is the
   Python service running?") when no backend answers. The grocery-commute planner
   queries OpenStreetMap live and is unaffected.
2. **Some surfaces show no photos.** `services/api.normalizeRecipe` drops
   `image`/`imageCredit`, so Nova's search results are text. The Nova card, Browse and
   the other `loadRecipeBooks` consumers show photos.
3. **Styles are global.** Once a stylesheet is loaded, its class names apply to any
   page that uses them (`.section-title` is defined in
   `pages/Pantry/BarcodeScanner/BarcodeScanner.css`). Scope new styles under a page
   or component class. `RecipeSlipCard.css` has two live copies (the component
   imports the nested one; `RecipeCards/BuildBar` imports the old path): edit both.
4. **Two recipe loaders** (section 10): fields and photos can differ by surface.
5. **Most state is per device.** Allergies, season, check-ins, the thread and the
   return count, gratitude, onboarding answers and the pantry do not sync, so Nova
   starts fresh on a new device.
6. **Nova runs in the browser.** The pick, the thread, the follow-up and the voice are
   client-side (`lib/nova/*`, no React). Moving them to a backend means replacing the
   `localStorage` reads inside `thread.js` and `pick.js` (`loadNovaContext`) and
   sending the recipe list and the context; the home screen would not change.
7. **Recall checks depend on the FDA.** The pantry check hits openFDA once a day per
   item; the general feed needs `/api/recalls` (Vercel) or falls back to openFDA
   directly. Offline or blocked, no banner shows: an honest empty, never a guess.
8. **Meal windows are by the device clock**, not the person's schedule. "You have 30
   minutes" is the answer they gave in the welcome madlib, not a calendar.
9. **The recipe quadrants are a heuristic** (`lib/recipe/quadrants`): portion size (6+
   servings is shared) and effort (a dessert, a Hard recipe or 90+ minutes is special).
   Recipes carry no quadrant of their own.
10. **Some older widgets assume a dark background.** `InteractiveHeroRecipe` was made for
   the old feed's dark editorial card and uses light text; on a light surface it needs its
   own dark panel (Discover → Flavors has one). Check contrast when reusing old components.

## 15. Where to change what

| To change | Go to |
|---|---|
| Sidebar entries, which paths highlight | `components/shell/Nav/navConfig.js` |
| A route or redirect | `app/router.jsx` |
| Tabs of Profile, Settings | the `TABS` array in that page's `index.jsx` |
| Tabs of an older hub | its `index.jsx` (`TABS` plus `?tab=`) |
| What Nova says on the home screen | `lib/nova/voice.js` (every line; first person, positive but not fake) |
| How Nova picks (weights, moods, pick-me-up ingredients) | `lib/nova/pick.js` |
| What is remembered, what "a return" is, when she follows up | `lib/nova/thread.js` |
| The home screen's order and behavior | `pages/Nova/index.jsx`; pieces in `components/nova/*` |
| What appears in the community feed, and in what order | `lib/recipe/buildFeed.js` (`DEAL_ORDER`, the lanes) |
| A feed card's look | `components/social/PostComposer/PostTypes/index.jsx` and `PostTypes.css` |
| Discover's sections, categories, featured cities | `pages/Discover/*` (`Categories.jsx` for the tiles) |
| Recall rules (what is "live", what raises a banner) | `lib/health/recalls.js`; the banner is `components/health/HealthPanel/RecallBar` |
| The four recipe quadrants | `lib/recipe/quadrants.js`, `pages/RecipeCards/index.jsx` |
| Nova's Q&A, nudge playbook, tone | `lib/nova/novaKnowledge.js`, `novaSettings.js`, `shadowToLight.js` |
| Welcome questions | `pages/Welcome/index.jsx` (`STEPS`); storage in `lib/personalization/onboarding.js` |
| Settings fields | `pages/Settings/*`; allergens in `lib/health/allergyProfile.js`; seasons in `LIFE_MODES` (`lib/personalization/lifeMode.js`) |
| Recipes and photos | per-country files in `data/`, then `python3 scripts/build-recipes-full.py` |
| Global look, skins | `styles/styles.css`, `styles/theme.css`, `lib/visual/appSkins.js` |
| Pixel-art rendering | `lib/visual/pixelArt.js` |
| Dev proxies, PWA, aliases | `vite.config.js` |
| API base URLs, endpoints | `services/api.js`; sync in `lib/platform/supabase.js` |

## 16. Rules for where files live

Reorganized 2026-09-25 by two rules, still in force:

- **Topology (what connects to what).** A page that only ever renders as a tab of a
  hub lives inside that hub's folder. `pages/` has one folder per destination, and
  nothing else. Anything two or more realms share moves out of `pages/` into
  `components/`, `lib/` or `data/`.
- **Cosmology (what orbits where).** Components are grouped by the part of the app
  they serve. `shell/` is on every screen; each other group serves one domain.

Adding something new: if one page uses it, put it in the matching component group;
if it renders on every route, put it in `shell/`; put logic in the matching `lib/`
domain folder, never as a new flat file. Keep the sidebar at five entries by folding
a new feature into an existing tab.

**Shared stylesheets (intentional).** `components/social/PostComposer/PostTypes/PostTypes.css`
(the old home feed's stylesheet, pruned) holds the post-card styles; `PostTypes`
imports it, and CommuteRoute imports it too.
`components/you/CookJournal/CookedRecipes` reuses the cookbook card styles from
`pages/Cookbook/MyCookbook/MyCookbook.css`. `pages/RecipeFull` imports the Recipes
hub stylesheet.
