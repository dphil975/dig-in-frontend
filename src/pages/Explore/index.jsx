import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Nav from '../../components/shell/Nav';
import GlobalFood from './GlobalFood';
import Deals from './Deals';
import './Explore.css';

/* Explore hub — now just the two big reference tabs: Global Food (the
   country-by-country cuisine explorer) and Deals (prices and what things really
   cost). Everything else that used to live here moved to the Discover page
   (Discover → Categories links to both of these); the old Explorer masonry grid
   and the Discover bento were retired.

   /global-food and /deals are the canonical addresses. */

const TABS = [
  { id: 'global', label: 'Global Food' },
  { id: 'deals', label: 'Deals' },
];

export default function Explore({ defaultTab = 'global' } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromQuery = searchParams.get('tab');
  const valid = TABS.some(t => t.id === fromQuery);
  const [tab, setTab] = useState(valid ? fromQuery : defaultTab);

  function pick(id) {
    setTab(id);
    setSearchParams(id === 'global' ? {} : { tab: id }, { replace: true });
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
      {tab === 'global' && <GlobalFood embedded />}
      {tab === 'deals' && <Deals embedded />}
    </div>
  );
}
