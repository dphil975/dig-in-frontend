import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';   // Leaflet base CSS — bundled, loads on every page
import './styles/leaflet.css';       // Global popup safety net (see file header)
import { pullAndMerge } from './lib/syncService';
import AuthGate from './components/shell/AuthGate';
import SideRail from './components/shell/SideRail';   // the app's one vertical nav (global)

// ── Pages, one lazy chunk per realm hub ────────────────────────
// Lazy-loaded: with 51 routes statically imported, the whole app was
// shipping on first paint (77MB dist/). Route-level code-splitting means
// each page's JS is only fetched when its route is actually visited.
//
// src/pages is organized as six realms (see src/ARCHITECTURE.md): each
// folder is a hub, and every page that only ever renders as one of its tabs
// lives inside it. The routes below are the realm hubs plus the handful of
// pages with their own address (recipe view, shared links, detail views).
const Home          = lazy(() => import('./pages/Home'));
const Recess        = lazy(() => import('./pages/Recess'));   // Recess ritual + Nova's Nest

// Recipes realm
const Recipes       = lazy(() => import('./pages/Recipes'));
const RecipeFull    = lazy(() => import('./pages/Recipes/RecipeFull'));
const BuildBar      = lazy(() => import('./pages/Recipes/BuildBar'));
const MyCookbookHub = lazy(() => import('./pages/Recipes/Cookbook'));
const SharedBoard   = lazy(() => import('./pages/Recipes/Cookbook/Boards/Shared'));
const WhimsyShared  = lazy(() => import('./pages/Recipes/Cookbook/WhimsyWeek/Shared'));

// Explore realm
const Explore       = lazy(() => import('./pages/Explore'));
const Craving       = lazy(() => import('./pages/Explore/Craving'));
const KitchenSkills = lazy(() => import('./pages/Explore/KitchenSkills'));   // tools/hydration/condiments/zero-proof
const Nibblers      = lazy(() => import('./pages/Explore/Nibblers'));
const PantryHub     = lazy(() => import('./pages/Explore/Pantry'));
const Shopping      = lazy(() => import('./pages/Explore/Pantry/Shopping'));
const OutThere      = lazy(() => import('./pages/Explore/OutThere'));
const CircleDetail  = lazy(() => import('./pages/Explore/OutThere/Circles/Detail'));
const PublicIssue   = lazy(() => import('./pages/Explore/OutThere/PublicIssue'));
const Commute       = lazy(() => import('./pages/Explore/Commute'));   // route planner + city/Chicago/Texas store maps

// Community realm
const Community     = lazy(() => import('./pages/Community'));
const CreateReel    = lazy(() => import('./pages/Community/ReelFeed/Create'));
const TagHub        = lazy(() => import('./pages/Community/TagHub'));   // a tag's own address — see lib/communityHub.js

// You realm — Profile, Your Read, Badges, Leaderboard, Passport, Memories, Health
const You           = lazy(() => import('./pages/You'));

// ── Always-on ─────────────────────────────────────────────────
// Kept as eager imports: small overlays that render on every route, not
// route-gated pages — lazy-loading these would just delay first paint
// everywhere instead of only on their own route.
import NovaNudge from './components/shell/NovaNudge';
import AskNova from './components/shell/AskNova';
import RunTimerBar from './components/shell/RunTimerBar';
import CookReflectionPrompt from './components/shell/CookReflectionPrompt';

// Cut from the user-facing router (see docs/legal/UX_UI_PATENT_REVIEW.md-adjacent audit,
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
//   - You              (2026-09-25, new — was: /profile, /your-read, /badges,
//                        /leaderboard, /passport, /memories, /allergies,
//                        /wellness as separate pages. Tabs driven by path.)
//   - Recess           (2026-09-25 — /recess and /nova became one hub.)
//   - Retired 2026-09-25 (source moved to _archive/frontend-retired/, out of
//     the bundle): Copycat Lab + Drink Scan (built on reproducing named
//     brands' menu items — IP risk), and the unrouted EducationalHelper,
//     Nudges, PixelStylePopUp and StoresPages. /copycat and /drink-scan now
//     redirect to Kitchen Skills, where the Zero-Proof bar lives.
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
        {/* Home & Recess */}
        <Route path="/"               element={<Home />} />
        <Route path="/recess"         element={<Recess />} />
        <Route path="/nova"           element={<Recess />} />

        {/* Recipes realm */}
        <Route path="/recipes"        element={<Recipes />} />
        <Route path="/recipe-cards"   element={<Recipes defaultTab="browse" />} />
        {/* /recipe-ai: the old standalone AI Recipe Helper page — merged into
            Kitchen Alchemist's "From Ingredients" mode on the Invent tab
            (2026-07-30). Recipes reads the pathname itself to land here AND
            preselect that mode. */}
        <Route path="/recipe-ai"      element={<Recipes defaultTab="invent" />} />
        <Route path="/recipe"         element={<RecipeFull />} />
        <Route path="/build-bar"      element={<BuildBar />} />
        <Route path="/my-cookbook"    element={<MyCookbookHub />} />
        <Route path="/boards"         element={<MyCookbookHub defaultTab="collections" />} />
        <Route path="/pixel-creator"  element={<MyCookbookHub defaultTab="pixelstudio" />} />
        <Route path="/meal-plan"      element={<MyCookbookHub defaultTab="mealplan" />} />
        <Route path="/whimsy"         element={<MyCookbookHub defaultTab="whimsy" />} />
        <Route path="/archive"        element={<MyCookbookHub defaultTab="liked" />} />
        <Route path="/board"          element={<SharedBoard />} />
        <Route path="/whimsy-card"    element={<WhimsyShared />} />

        {/* Explore realm */}
        <Route path="/explore"         element={<Explore />} />
        <Route path="/discover"        element={<Explore defaultTab="discover" />} />
        <Route path="/global-food"     element={<Explore defaultTab="global" />} />
        <Route path="/deals"           element={<Explore defaultTab="deals" />} />
        <Route path="/craving"         element={<Craving />} />
        <Route path="/craving-compass" element={<Craving defaultTab="compass" />} />
        <Route path="/cravings"        element={<Craving defaultTab="tracker" />} />
        <Route path="/chaos-night"     element={<Navigate to="/cravings" replace />} />
        <Route path="/kitchen-skills"  element={<KitchenSkills />} />
        <Route path="/kitchen-skills/hydration"  element={<KitchenSkills defaultTab="hydration" />} />
        <Route path="/kitchen-skills/condiments" element={<KitchenSkills defaultTab="condiments" />} />
        <Route path="/zero-proof"      element={<KitchenSkills defaultTab="zeroproof" />} />
        <Route path="/copycat"         element={<Navigate to="/kitchen-skills" replace />} />
        <Route path="/drink-scan"      element={<Navigate to="/zero-proof" replace />} />
        <Route path="/nibblers"        element={<Nibblers />} />
        <Route path="/girl-dinner"     element={<Navigate to="/nibblers" replace />} />
        <Route path="/pantry"          element={<PantryHub />} />
        <Route path="/pantry-recipes"  element={<PantryHub defaultTab="recipes" />} />
        <Route path="/barcode"         element={<PantryHub defaultTab="scan" />} />
        <Route path="/shopping"        element={<Shopping />} />
        <Route path="/out-there"       element={<OutThere />} />
        <Route path="/occasions"       element={<OutThere defaultTab="occasions" />} />
        <Route path="/checkin"         element={<OutThere defaultTab="checkin" />} />
        <Route path="/circles"         element={<OutThere defaultTab="circles" />} />
        <Route path="/table"           element={<OutThere defaultTab="table" />} />
        <Route path="/circles/:id"     element={<CircleDetail />} />
        <Route path="/issue"           element={<PublicIssue />} />
        {/* Commute hub — SideRail shell + tabs (Grocery Commute route planner,
            City Explorer, and the Chicago/Texas store maps), mirroring the
            Recipes hub so the tab swaps only the center. Grocery Commute is
            real multi-stop routing over NYC_STORES + the MTA subway/bus line
            reference — do not re-cut without asking. */}
        <Route path="/commute"         element={<Commute defaultTab="route" />} />
        <Route path="/grocery-commute" element={<Commute defaultTab="route" />} />
        <Route path="/city-explorer"   element={<Commute defaultTab="city" />} />
        <Route path="/stores/chicago"  element={<Commute defaultTab="chicago" />} />
        <Route path="/stores/texas"    element={<Commute defaultTab="texas" />} />

        {/* Community realm */}
        <Route path="/feed"            element={<Community />} />
        <Route path="/social"          element={<Community defaultTab="posts" />} />
        <Route path="/reels"           element={<Community defaultTab="reels" />} />
        <Route path="/reels/create"    element={<CreateReel />} />
        <Route path="/tag/:name"       element={<TagHub />} />

        {/* You realm — one hub; the path picks the tab (see pages/You). */}
        <Route path="/profile"         element={<You />} />
        {/* The archetype lens, shown to the person it's about — see YourRead. */}
        <Route path="/your-read"       element={<You />} />
        <Route path="/badges"          element={<You />} />
        <Route path="/leaderboard"     element={<You />} />
        <Route path="/passport"        element={<You />} />
        <Route path="/memories"        element={<You />} />
        <Route path="/allergies"       element={<You />} />
        <Route path="/wellness"        element={<You />} />
      </Routes>
      </Suspense>
      </div>{/* .app-main */}
      </div>{/* .app-shell */}
      {/* Right-moment nudge card — self-hides unless a timing window is open. */}
      <NovaNudge />
      {/* 15-min-later "how'd it go?" — re-checked on every navigation. */}
      <CookReflectionPrompt />
      {/* Shopping-run clock — renders nothing unless a run is actually open,
          so it costs every other page nothing. Bottom-left; Ask Nova owns
          bottom-right. */}
      <RunTimerBar />
      {/* Ask Nova — the global cooking brain, on every page. */}
      <AskNova />
      </AuthGate>
    </BrowserRouter>
  );
}
