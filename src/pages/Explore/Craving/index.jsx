import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import CravingSearch from './CravingSearch';
import CravingCompass from './CravingCompass';
import CravingTracker from './CravingTracker';
import './Craving.css';

/* Craving hub — the app's one surface for "I don't know what to make."
   Merges CravingSearch ("what do I make?"), CravingCompass ("where's it
   cheapest right now?"), and CravingTracker (log cravings, build the shared
   learned flavor profile) behind one Nav and a tab bar. Chaos Night (pantry-
   only, time-boxed picks) was absorbed in as a 4th tab in a prior pass, then
   cut entirely — it was answering the same indecision question as the other
   three with nothing distinct of its own; /chaos-night now redirects to this
   hub instead (see App.jsx). Tracker moved here from HealthProfile — it's
   about flavor personalization, not an allergy/wellness concern. All
   children keep 100% of their own logic; `embedded` just tells them to skip
   their own Nav/back-button chrome. Canonical URL is /cravings; /craving and
   /craving-compass are kept alive as aliases in App.jsx + Nav. */

const TABS = [
  { id: 'search', label: 'Search Recipes' },
  { id: 'compass', label: 'Find It Near Me Now' },
  { id: 'tracker', label: 'Craving Tracker' },
];

export default function Craving({ defaultTab = 'search' } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromQuery = searchParams.get('tab');
  const valid = TABS.some(t => t.id === fromQuery);
  const [tab, setTab] = useState(valid ? fromQuery : defaultTab);

  function pick(id) {
    setTab(id);
    setSearchParams(id === 'search' ? {} : { tab: id }, { replace: true });
  }

  return (
    <div className="crv-hub">
      <Nav />
      <div className="crv-hub-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`crv-hub-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => pick(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'search' && <CravingSearch embedded />}
      {tab === 'compass' && <CravingCompass embedded />}
      {tab === 'tracker' && <CravingTracker embedded />}
    </div>
  );
}
