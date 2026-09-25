import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Nav from '../../components/Nav';
import CopycatLab from '../CopycatLab';
import DrinkScan from '../DrinkScan';
import ZeroProof from '../ZeroProof';
import './CopycatDrinks.css';

/* Copycat & Drinks hub — merges CopycatLab (food + drink brand copycats,
   savings math), DrinkScan (scan a cup, ID it, get the recipe) and
   ZeroProof (virgin cocktails) behind one Nav and a tab bar. Each child
   keeps its own state/logic untouched; `embedded` only hides its own
   Nav/back-button. */

const TABS = [
  { id: 'copycat', label: 'Copycat Lab' },
  { id: 'scan', label: 'Scan a Drink' },
  { id: 'zeroproof', label: 'Zero-Proof Bar' },
];

export default function CopycatDrinks({ defaultTab = 'copycat' } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromQuery = searchParams.get('tab');
  const valid = TABS.some(t => t.id === fromQuery);
  const [tab, setTab] = useState(valid ? fromQuery : defaultTab);

  function pick(id) {
    setTab(id);
    setSearchParams(id === 'copycat' ? {} : { tab: id }, { replace: true });
  }

  return (
    <div className="cpd-hub">
      <Nav />
      <div className="cpd-hub-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`cpd-hub-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => pick(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'copycat' && <CopycatLab embedded />}
      {tab === 'scan' && <DrinkScan embedded />}
      {tab === 'zeroproof' && <ZeroProof embedded />}
    </div>
  );
}
