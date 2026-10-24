import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { loaders } from './routeLoaders';
import RouteFallback from '../components/shell/RouteFallback';

// ── Pages — top-level, lazy-loaded ─────────────────────────────
const Welcome       = lazy(loaders.welcome);
const Nova          = lazy(loaders.nova);
const Nest          = lazy(loaders.nest);

const RecipeCards   = lazy(loaders.recipes);
const RecipeFull    = lazy(loaders.recipe);
const Cookbook       = lazy(() => import('../pages/Cookbook'));
const PublicBoard   = lazy(() => import('../pages/PublicBoard'));
const WhimsyShared  = lazy(() => import('../pages/Cookbook/WhimsyWeek/Shared'));

const Discover      = lazy(loaders.discover);
const Explore       = lazy(() => import('../pages/Explore'));
const Craving       = lazy(() => import('../pages/Explore/Craving'));
const KitchenSkills = lazy(() => import('../pages/Explore/KitchenSkills'));
const Nibblers      = lazy(() => import('../pages/Explore/Nibblers'));
const OutThere      = lazy(() => import('../pages/Explore/OutThere'));
const CircleDetail  = lazy(() => import('../pages/Explore/OutThere/Circles/Detail'));
const Commute       = lazy(() => import('../pages/Explore/Commute'));

const Shopping      = lazy(() => import('../pages/Pantry/Shopping'));

const Community     = lazy(() => import('../pages/Community'));
const TagHub        = lazy(() => import('../pages/Community/TagHub'));

const Profile       = lazy(loaders.profile);
const Settings      = lazy(loaders.settings);
const PublicIssue   = lazy(() => import('../pages/PublicIssue'));

export default function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      {/* Onboarding */}
      <Route path="/welcome"        element={<Welcome />} />

      {/* Nova — the home screen. /nova is the same place; /nest is the quiet
          "sit with Nova" space. */}
      <Route path="/"               element={<Nova />} />
      <Route path="/nova"           element={<Navigate to="/" replace />} />
      <Route path="/nest"           element={<Nest />} />

      {/* Recipes */}
      <Route path="/recipes"        element={<RecipeCards />} />
      <Route path="/recipe-cards"   element={<RecipeCards defaultTab="browse" />} />
      <Route path="/recipe-ai"      element={<RecipeCards defaultTab="invent" />} />
      <Route path="/recipe"         element={<RecipeFull />} />
      <Route path="/build-bar"      element={<RecipeCards defaultTab="invent" />} />
      <Route path="/my-cookbook"    element={<Cookbook />} />
      <Route path="/boards"         element={<Cookbook defaultTab="collections" />} />
      <Route path="/pixel-creator"  element={<Cookbook defaultTab="pixelstudio" />} />
      <Route path="/meal-plan"      element={<Cookbook defaultTab="mealplan" />} />
      <Route path="/whimsy"         element={<Cookbook defaultTab="whimsy" />} />
      <Route path="/archive"        element={<Cookbook defaultTab="liked" />} />
      <Route path="/board"          element={<PublicBoard />} />
      <Route path="/whimsy-card"    element={<WhimsyShared />} />

      {/* Discover — one page: safety, places, categories, community, flavors.
          Global Food and Deals keep their own tabs behind the Explore hub. */}
      <Route path="/explore"         element={<Discover />} />
      <Route path="/discover"        element={<Discover />} />
      <Route path="/global-food"     element={<Explore defaultTab="global" />} />
      <Route path="/deals"           element={<Explore defaultTab="deals" />} />
      <Route path="/craving"         element={<Craving />} />
      <Route path="/craving-compass" element={<Craving defaultTab="compass" />} />
      <Route path="/cravings"        element={<Craving defaultTab="tracker" />} />
      <Route path="/kitchen-skills"  element={<KitchenSkills />} />
      <Route path="/kitchen-skills/hydration"  element={<KitchenSkills defaultTab="hydration" />} />
      <Route path="/kitchen-skills/condiments" element={<KitchenSkills defaultTab="condiments" />} />
      <Route path="/zero-proof"      element={<KitchenSkills defaultTab="zeroproof" />} />
      <Route path="/copycat"         element={<Navigate to="/kitchen-skills" replace />} />
      <Route path="/drink-scan"      element={<Navigate to="/zero-proof" replace />} />
      <Route path="/nibblers"        element={<Nibblers />} />
      <Route path="/out-there"       element={<OutThere />} />
      <Route path="/occasions"       element={<OutThere defaultTab="occasions" />} />
      <Route path="/checkin"         element={<OutThere defaultTab="checkin" />} />
      <Route path="/circles"         element={<OutThere defaultTab="circles" />} />
      <Route path="/table"           element={<OutThere defaultTab="table" />} />
      <Route path="/circles/:id"     element={<CircleDetail />} />
      <Route path="/commute"         element={<Commute defaultTab="route" />} />
      <Route path="/grocery-commute" element={<Commute defaultTab="route" />} />
      <Route path="/city-explorer"   element={<Commute defaultTab="city" />} />
      <Route path="/stores/chicago"  element={<Commute defaultTab="chicago" />} />
      <Route path="/stores/texas"    element={<Commute defaultTab="texas" />} />

      {/* Pantry lives in the Profile hub (Profile → Pantry) */}
      <Route path="/pantry"          element={<Profile />} />
      <Route path="/pantry-recipes"  element={<Profile />} />
      <Route path="/barcode"         element={<Profile />} />
      <Route path="/shopping"        element={<Shopping />} />

      {/* Community */}
      <Route path="/feed"            element={<Community />} />
      <Route path="/social"          element={<Community defaultTab="posts" />} />
      <Route path="/reels"           element={<Navigate to="/feed" replace />} />
      <Route path="/tag/:name"       element={<TagHub />} />

      {/* Profile hub — Thread · Collection · Coins · Pantry · Trophies (+ hidden Gratitude) */}
      <Route path="/profile"         element={<Profile />} />
      <Route path="/check-ins"       element={<Profile />} />
      <Route path="/collection"      element={<Profile />} />
      <Route path="/coins"           element={<Profile />} />
      <Route path="/leaderboard"     element={<Profile />} />
      <Route path="/trophies"        element={<Profile />} />
      <Route path="/badges"          element={<Profile />} />
      <Route path="/passport"        element={<Profile />} />
      <Route path="/memories"        element={<Profile />} />
      <Route path="/your-read"       element={<Profile />} />
      <Route path="/gratitude"       element={<Profile />} />

      {/* Settings hub — Dietary · Life context · Location · Account · How it works */}
      <Route path="/settings"          element={<Settings />} />
      <Route path="/settings/life"     element={<Settings />} />
      <Route path="/settings/location" element={<Settings />} />
      <Route path="/settings/account"  element={<Settings />} />
      <Route path="/settings/how-it-works" element={<Settings />} />
      <Route path="/allergies"         element={<Settings />} />
      <Route path="/wellness"          element={<Settings />} />

      {/* Public */}
      <Route path="/issue"           element={<PublicIssue />} />

      {/* Anything unknown goes home */}
      <Route path="*"                element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
