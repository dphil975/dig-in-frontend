import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import CommuteRoute from './CommuteRoute';
import CityExplorer from './CityExplorer';
import ChicagoStoreMap from './ChicagoStoreMap';
import TexasStoreMap from './TexasStoreMap';
import './Commute.css';

/* Commute hub — the "Commute" nav target, built exactly like the Recipes hub
   (see src/pages/Recipes): one persistent SideRail on the left, tabs across the
   top, and only the CENTER swaps when you switch tabs. Nothing bounces to a
   brand-new screen — the brand, nav, life mode, and followed tags all stay put,
   so it reads as one continuous surface with the hero.

   City Explorer used to sit under the Explore hub; it's moved here as a tab
   because it answers the same real question as the grocery-commute planner —
   "where do I actually shop, and how do I get there" — now with transit
   awareness baked in (see lib/transitAccess). Grocery Commute is the route
   planner; City Explorer is the store map. Canonical URL is /commute;
   /grocery-commute and /city-explorer stay as aliases (see App.jsx + Nav).
   The regional store maps (/stores/chicago, /stores/texas) folded in as tabs
   (2026-09-25) — same "where do I shop" question, just outside NYC. */

const TABS = [
  { id: 'route', label: 'Grocery Commute' },
  { id: 'city', label: 'City Explorer' },
  { id: 'chicago', label: 'Chicago Stores' },
  { id: 'texas', label: 'Texas Stores' },
];

export default function Commute({ defaultTab = 'route' } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromQuery = searchParams.get('tab');
  const valid = TABS.some((t) => t.id === fromQuery);
  const [tab, setTab] = useState(valid ? fromQuery : defaultTab);

  function pick(id) {
    setTab(id);
    setSearchParams(id === 'route' ? {} : { tab: id }, { replace: true });
  }

  return (
    <div className="cm-hub">
      <Nav />
      {/* The global left SideRail (App.jsx) is the nav — this hub is just its
          tabs + center content, only the center swaps between tabs. */}
      <div className="cm-shell">
        <main className="cm-main">
          <div className="cm-hub-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`cm-hub-tab${tab === t.id ? ' active' : ''}`}
                onClick={() => pick(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'route' && <CommuteRoute embedded />}
          {tab === 'city' && <CityExplorer embedded />}
          {tab === 'chicago' && <ChicagoStoreMap />}
          {tab === 'texas' && <TexasStoreMap />}
        </main>
      </div>
    </div>
  );
}
