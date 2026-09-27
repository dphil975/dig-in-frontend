import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Nav from '../../components/shell/Nav';
import MyCookbook from './MyCookbook';
import Boards from './Boards';
import PixelCreator from './PixelCreator';
import MealPlan from './MealPlan';
import WhimsyWeek from './WhimsyWeek';
import Archive from './Archive';
import './MyCookbookHub.css';

/* My Cookbook hub — merges My Cookbook (saved recipes + cook history),
   Boards (Pinterest-style custom recipe collections, now labeled
   "Collections"), Pixel Creator (pixel-art/voxel food drawing, now labeled
   "Pixel Studio" — pairs naturally with a dish you've saved or cooked),
   Meal Plan, and Whimsy Week (both are forward-looking, planning-a-week
   tools — moved here from their own nav destinations since that's what they
   actually are, not a browse-recipes-now surface) behind one Nav and a tab
   bar. Canonical URL is /my-cookbook; /boards, /pixel-creator, /meal-plan,
   and /whimsy stay as aliases (see App.jsx + Nav). The singular /board
   (SharedBoard) and /whimsy-card (read-only gift-kit share) routes are
   untouched — both are public deep links, not this management UI.
   The Liked Archive (/archive) joined as a tab (2026-09-25): it's your own
   saved-things shelf, same job as Saved Recipes and Collections. */

const TABS = [
  { id: 'saved', label: 'Saved Recipes' },
  { id: 'collections', label: 'Collections' },
  { id: 'pixelstudio', label: 'Pixel Studio' },
  { id: 'mealplan', label: 'Meal Plan' },
  { id: 'whimsy', label: 'Whimsy Week' },
  { id: 'liked', label: 'Liked' },
];

export default function MyCookbookHub({ defaultTab = 'saved' } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromQuery = searchParams.get('tab');
  const valid = TABS.some(t => t.id === fromQuery);
  const [tab, setTab] = useState(valid ? fromQuery : defaultTab);

  function pick(id) {
    setTab(id);
    setSearchParams(id === 'saved' ? {} : { tab: id }, { replace: true });
  }

  return (
    <div className="mch-hub">
      <Nav />
      <div className="mch-hub-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`mch-hub-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => pick(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'saved' && <MyCookbook embedded />}
      {tab === 'collections' && <Boards embedded />}
      {tab === 'pixelstudio' && <PixelCreator embedded />}
      {tab === 'mealplan' && <MealPlan embedded />}
      {tab === 'whimsy' && <WhimsyWeek embedded />}
      {tab === 'liked' && <Archive />}
    </div>
  );
}
