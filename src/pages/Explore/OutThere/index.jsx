import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import Occasions from './Occasions';
import CheckIn from './CheckIn';
import MyCircles from './Circles';
import Table from './Table';
import './OutThere.css';

/* Out There — the app's one home for "gather people." Occasions, Check-In,
   Kitchen Table Circles, and The Table were four separate-ish surfaces all
   answering the same real need; this merges them behind one Nav and a tab
   bar, following the same pattern as every other hub built this session
   (useSearchParams + TABS + pick()). Canonical URL is /out-there;
   /occasions, /checkin, /circles, and /table all stay as aliases (see
   App.jsx + Nav). /circles/:id (CircleDetail) stays its own standalone
   route, unmerged — same treatment as a recipe detail page living outside
   its hub. */

const TABS = [
  { id: 'occasions', label: 'Plan an Occasion' },
  { id: 'checkin', label: 'Check In' },
  { id: 'circles', label: 'My Circles' },
  { id: 'table', label: 'The Table' },
];

export default function OutThere({ defaultTab = 'occasions' } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromQuery = searchParams.get('tab');
  const valid = TABS.some(t => t.id === fromQuery);
  const [tab, setTab] = useState(valid ? fromQuery : defaultTab);

  function pick(id) {
    setTab(id);
    setSearchParams(id === 'occasions' ? {} : { tab: id }, { replace: true });
  }

  return (
    <div className="ot-hub">
      <Nav />
      <div className="ot-hub-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`ot-hub-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => pick(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'occasions' && <Occasions embedded />}
      {tab === 'checkin' && <CheckIn embedded />}
      {tab === 'circles' && <MyCircles />}
      {tab === 'table' && <Table embedded />}
    </div>
  );
}
