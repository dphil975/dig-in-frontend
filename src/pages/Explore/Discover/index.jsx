import Nav from '../../../components/shell/Nav';
import DiscoverBento from '../../../components/social/DiscoverBento';
import DiscoverPanel from '../../../components/social/DiscoverPanel';

/* Discover — the default tab of the Explore hub: the recipe-discovery bento
   (Breakfast, Lunch, Dinner, All Recipes, Craving Compass, Desserts, Under 20
   Min, Global Cuisines, Recipe Reels) plus DiscoverPanel, a retro pixel-menu
   styled feature showcase.

   `onExploreTab` (passed down from Explore) lets a bento card switch to a
   SIBLING Explore tab in place, instead of doing a full navigate that
   remounts the whole hub just to land back on a tab one click away — see
   DiscoverBento's "Global Cuisines" card, which used to hard-navigate to
   /global-food even though Global Food is a tab right above it now. Cards
   that go to genuinely different hubs (Recipes, Craving, Community) still
   navigate normally. */
export default function Discover({ embedded = false, onExploreTab } = {}) {
  return (
    <div>
      {!embedded && <Nav />}
      <DiscoverBento onExploreTab={onExploreTab} />
      <DiscoverPanel />
    </div>
  );
}
