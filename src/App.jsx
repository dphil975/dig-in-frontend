import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';   // Leaflet base CSS — bundled, loads on every page
import './styles/leaflet.css';       // Global popup safety net (see file header)
import { pullAndMerge } from './lib/syncService';
import AuthGate from './components/AuthGate';
import SideRail from './components/SideRail';   // the app's one vertical nav (global)

// ── Core pages ────────────────────────────────────────────────
// Lazy-loaded: with 51 routes statically imported, the whole app was
// shipping on first paint (77MB dist/). Route-level code-splitting means
// each page's JS is only fetched when its route is actually visited.
const Home          = lazy(() => import('./pages/Home'));
const Recess        = lazy(() => import('./pages/Recess'));   // calm daily ritual (childhood-simple)
const Recipes       = lazy(() => import('./pages/Recipes'));
const RecipeFull    = lazy(() => import('./pages/RecipeFull'));
const Shopping      = lazy(() => import('./pages/Shopping'));
const PantryHub     = lazy(() => import('./pages/PantryHub'));
const HealthProfile = lazy(() => import('./pages/HealthProfile'));
const MyCookbookHub = lazy(() => import('./pages/MyCookbookHub'));
const MemoryVault   = lazy(() => import('./pages/MemoryVault'));
const OutThere      = lazy(() => import('./pages/OutThere'));
const CircleDetail  = lazy(() => import('./pages/Circles/Detail'));

// ── Discovery & social ────────────────────────────────────────
const Explore        = lazy(() => import('./pages/Explore'));
const Community      = lazy(() => import('./pages/Community'));
const Craving        = lazy(() => import('./pages/Craving'));
const CreateReel     = lazy(() => import('./pages/ReelFeed/Create'));

// ── User & gamification ───────────────────────────────────────
const Profile     = lazy(() => import('./pages/Profile'));
const YourRead    = lazy(() => import('./pages/YourRead'));
const Archive     = lazy(() => import('./pages/Archive'));
const Badges      = lazy(() => import('./pages/Badges'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const SharedBoard = lazy(() => import('./pages/Boards/Shared'));

// ── Tools & scanners ─────────────────────────────────────────
const CopycatDrinks   = lazy(() => import('./pages/CopycatDrinks'));
const BuildBar        = lazy(() => import('./pages/BuildBar'));
const Commute         = lazy(() => import('./pages/Commute'));
const ChicagoStoreMap = lazy(() => import('./Chicago/ChicagoStoreMap'));
const TexasStoreMap   = lazy(() => import('./Regions/TexasStoreMap'));
const Nibblers        = lazy(() => import('./pages/Nibblers'));
const WhimsyShared    = lazy(() => import('./pages/WhimsyWeek/Shared'));
const FoodPassport    = lazy(() => import('./pages/FoodPassport'));
const PublicIssue     = lazy(() => import('./pages/PublicIssue'));
const Nova            = lazy(() => import('./pages/Nova'));

// ── Always-on ─────────────────────────────────────────────────
// Kept as eager imports: small overlays that render on every route, not
// route-gated pages — lazy-loading these would just delay first paint
// everywhere instead of only on their own route.
import NovaNudge from './components/NovaNudge';
import AskNova from './components/AskNova';
import CookReflectionPrompt from './components/CookReflectionPrompt';

// Cut from the user-facing router (see UX_UI_PATENT_REVIEW.md-adjacent audit,
// 2026-07-24): /analytics, /market-metrics, /user-metrics (internal B2B —
// belong behind a separate admin login, not deleted, just unrouted here),
// /rural-trend, /carplay, /pixel-map, /pixel-ingredient,
// /widget (internal/demo/dev tools), /nudges (Nova Nudges are ambient —
// NovaNudge renders on every page below; a standalone destination worked
// against that), /education (redundant standalone page). Page source
// for all of these still exists under src/pages — only the public route
// was removed.
//
// Hub consolidation (2026-07-25): 12 groups of overlapping/duplicate routes
// were merged into tabbed hubs so the nav reads as coherent products rather
// than a long flat list of routes. Each hub keeps every merged page's own
// file + logic untouched (just given an `embedded` prop to hide its own
// Nav/back-button), and every old path still resolves via a `defaultTab`
// alias route below plus a matching `aliases` entry in Nav — nothing that
// used to work is now a dead link. See:
//   - Recipes         (was: /recipes legacy static grid, /recipe-cards, /recipe-ai)
//   - PantryHub        (was: /pantry, /pantry-recipes, and — 2026-07-27 — /barcode,
//                        since the scanner is an input method for the pantry, not
//                        a sibling destination)
//   - HealthProfile    (was: /allergies, /wellness — the Craving Tracker tab
//                        moved OUT to the Craving hub below, it's a flavor-
//                        personalization tool, not a health/allergy concern.
//                        2026-07-27: also demoted off the main Nav entirely —
//                        embedded directly inside Profile/"You" Settings instead,
//                        these routes still resolve, just no longer nav-reachable)
//   - Craving          (was: /craving, /craving-compass — now also owns
//                        /cravings and the Craving Tracker as a 3rd tab, and
//                        — 2026-07-27 — Chaos Night as a 4th, since it was
//                        answering the same "I don't know what to make" question)
//   - MyCookbookHub    (was: /my-cookbook, /boards, /pixel-creator, and —
//                        2026-07-27 — /meal-plan and /whimsy, both forward-
//                        looking planning tools that belong here, not in Explore)
//   - Explore          (was: /discover, /global-food, /city-explorer, and
//                        /deals — /deals had been retired 2026-07-24 and
//                        repointed to /recipe-cards?special=budget; it's
//                        back as a real tab here per this session's call,
//                        the budget-filter shortcut still works too)
//   - Community        (was: /feed, /social, /reels)
//   - Kitchen Lab dissolved entirely (2026-07-27) — it never becomes a hub.
//     /kitchen-alchemist, /fusion, and /remix are gone: Fusion/Healthier/Remix
//     became modes on RecipeFull's RecipeTransformPanel (the fixed recipe you
//     view gets reshaped in place, no separate destination needed). /build-bar
//     survives as its own direct route (BuildBar page, below) — it's still a
//     real standalone builder, just reached via a "Build something like this →"
//     launcher on RecipeFull or the Recipes hub's new Invent tab instead of a
//     Kitchen Lab nav entry. HealthifyLab's old Reverse-Engineer mode retired
//     (superseded by RecipeTransformPanel's HEALTHIER mode); its Build a
//     Healthy Base mode moved to Invent as HealthyBaseBuilder.
//   - OutThere         (2026-07-27, new — was: Occasions + Check-In (formerly
//                        OccasionsHub) + Circles + The Table, four separate-ish
//                        surfaces all answering "gather people." /occasions,
//                        /checkin, /circles, /table all still resolve here.)

export default function App() {
  useEffect(() => { pullAndMerge(); }, []);

  return (
    <BrowserRouter>
      <AuthGate>
      {/* One global vertical nav (Tumblr-style sidebar) + an offset content
          column. The old per-page top bar (<Nav/>) is now a no-op. */}
      <div className="app-shell">
      <SideRail />
      <div className="app-main">
      <Suspense fallback={null}>
      <Routes>
        {/* Core */}
        <Route path="/"               element={<Home />} />
        <Route path="/recess"         element={<Recess />} />
        <Route path="/recipes"        element={<Recipes />} />
        <Route path="/recipe-cards"   element={<Recipes defaultTab="browse" />} />
        {/* /recipe-ai: the old standalone AI Recipe Helper page — merged into
            Kitchen Alchemist's "From Ingredients" mode on the Invent tab
            (2026-07-30). Recipes reads the pathname itself to land here AND
            preselect that mode. */}
        <Route path="/recipe-ai"      element={<Recipes defaultTab="invent" />} />
        <Route path="/recipe"         element={<RecipeFull />} />
        <Route path="/shopping"       element={<Shopping />} />
        <Route path="/pantry"         element={<PantryHub />} />
        <Route path="/pantry-recipes" element={<PantryHub defaultTab="recipes" />} />
        <Route path="/occasions"      element={<OutThere defaultTab="occasions" />} />
        <Route path="/checkin"        element={<OutThere defaultTab="checkin" />} />
        <Route path="/allergies"      element={<HealthProfile />} />
        <Route path="/wellness"       element={<HealthProfile defaultTab="wellness" />} />
        <Route path="/cravings"       element={<Craving defaultTab="tracker" />} />
        <Route path="/my-cookbook"    element={<MyCookbookHub />} />
        <Route path="/boards"         element={<MyCookbookHub defaultTab="collections" />} />
        <Route path="/pixel-creator"  element={<MyCookbookHub defaultTab="pixelstudio" />} />
        <Route path="/memories"       element={<MemoryVault />} />
        <Route path="/meal-plan"      element={<MyCookbookHub defaultTab="mealplan" />} />

        {/* Discovery & social */}
        <Route path="/explore"         element={<Explore />} />
        <Route path="/discover"        element={<Explore defaultTab="discover" />} />
        <Route path="/global-food"     element={<Explore defaultTab="global" />} />
        <Route path="/city-explorer"   element={<Commute defaultTab="city" />} />
        <Route path="/deals"           element={<Explore defaultTab="deals" />} />
        <Route path="/chaos-night"     element={<Navigate to="/cravings" replace />} />
        <Route path="/out-there"       element={<OutThere />} />
        <Route path="/circles"         element={<OutThere defaultTab="circles" />} />
        <Route path="/circles/:id"     element={<CircleDetail />} />
        <Route path="/table"           element={<OutThere defaultTab="table" />} />
        <Route path="/feed"            element={<Community />} />
        <Route path="/social"          element={<Community defaultTab="posts" />} />
        <Route path="/reels"           element={<Community defaultTab="reels" />} />
        <Route path="/reels/create"    element={<CreateReel />} />
        <Route path="/craving"         element={<Craving />} />
        <Route path="/craving-compass" element={<Craving defaultTab="compass" />} />
        <Route path="/nova"            element={<Nova />} />

        {/* User & gamification */}
        <Route path="/profile"     element={<Profile />} />
        {/* The archetype lens, shown to the person it's about — see YourRead. */}
        <Route path="/your-read"   element={<YourRead />} />
        <Route path="/archive"     element={<Archive />} />
        <Route path="/badges"      element={<Badges />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/board"       element={<SharedBoard />} />

        {/* Tools & scanners */}
        <Route path="/barcode"           element={<PantryHub defaultTab="scan" />} />
        <Route path="/drink-scan"        element={<CopycatDrinks defaultTab="scan" />} />
        <Route path="/zero-proof"        element={<CopycatDrinks defaultTab="zeroproof" />} />
        <Route path="/copycat"           element={<CopycatDrinks />} />
        <Route path="/build-bar"         element={<BuildBar />} />
        {/* Commute hub — SideRail shell + tabs (Grocery Commute route planner +
            City Explorer store map), mirroring the Recipes hub so the tab swaps
            only the center and stays continuous with the hero (2026-07-30).
            City Explorer moved here FROM the Explore hub at the user's request.
            Grocery Commute is real multi-stop routing over NYC_STORES + the MTA
            subway/bus line reference — do not re-cut without asking. */}
        <Route path="/commute"           element={<Commute defaultTab="route" />} />
        <Route path="/grocery-commute"   element={<Commute defaultTab="route" />} />
        <Route path="/stores/chicago"    element={<ChicagoStoreMap />} />
        <Route path="/stores/texas"      element={<TexasStoreMap />} />
        <Route path="/nibblers"          element={<Nibblers />} />
        <Route path="/girl-dinner"       element={<Navigate to="/nibblers" replace />} />
        <Route path="/whimsy"            element={<MyCookbookHub defaultTab="whimsy" />} />
        <Route path="/whimsy-card"       element={<WhimsyShared />} />
        <Route path="/passport"          element={<FoodPassport />} />
        <Route path="/issue"             element={<PublicIssue />} />
      </Routes>
      </Suspense>
      </div>{/* .app-main */}
      </div>{/* .app-shell */}
      {/* Right-moment nudge card — self-hides unless a timing window is open. */}
      <NovaNudge />
      {/* 15-min-later "how'd it go?" — re-checked on every navigation. */}
      <CookReflectionPrompt />
      {/* Ask Nova — the global cooking brain, on every page. */}
      <AskNova />
      </AuthGate>
    </BrowserRouter>
  );
}
