import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Nav from '../../components/shell/Nav';
import Explorer from './Explorer';
import Discover from './Discover';
import GlobalFood from './GlobalFood';
import Deals from './Deals';
import './Explore.css';

/* Explore hub — merges Discover (recipe-discovery bento + feature showcase),
   Global Food (country-by-country cuisine explorer), and Deals (NYC deals &
   prices) behind one Nav and a tab bar. Deals was previously retired from the
   router (2026-07-24, repointed to /recipe-cards?special=budget) — it's back
   here as a real Explore tab per the founder's explicit call this session; the
   budget-filter shortcut inside Recipes still works too. City Explorer MOVED
   OUT to the Commute hub (2026-07-30, src/pages/Explore/Commute) — it answers the same
   "where do I shop and how do I get there" question as the grocery-commute
   planner, so they live together now. Canonical URL is /explore (also the Nav
   "Explore" top-level target); /discover, /global-food, /deals stay as aliases
   (see App.jsx + Nav). */

const TABS = [
  { id: 'explore', label: 'Explore' },
  { id: 'discover', label: 'Discover' },
  { id: 'global', label: 'Global Food' },
  { id: 'deals', label: 'Deals' },
];

export default function Explore({ defaultTab = 'explore' } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromQuery = searchParams.get('tab');
  const valid = TABS.some(t => t.id === fromQuery);
  const [tab, setTab] = useState(valid ? fromQuery : defaultTab);

  function pick(id) {
    setTab(id);
    setSearchParams(id === 'explore' ? {} : { tab: id }, { replace: true });
  }

  return (
    <div className="ex-hub">
      <Nav />
      <div className="ex-hub-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`ex-hub-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => pick(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'explore' && <Explorer embedded />}
      {tab === 'discover' && <Discover embedded onExploreTab={pick} />}
      {tab === 'global' && <GlobalFood embedded />}
      {tab === 'deals' && <Deals embedded />}
    </div>
  );
}
