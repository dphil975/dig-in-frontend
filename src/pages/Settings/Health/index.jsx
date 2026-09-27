import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import Allergies from './Allergies';
import Wellness from './Wellness';
import './HealthProfile.css';

/* My Health — merges Allergies & Sensitivities and Wellness Goals behind one
   Nav and a tab bar. Allergies/Wellness feed RecipeFull's panels (AllergyPanel,
   WellnessPanel) which still link back to '/allergies' and '/wellness'
   respectively — both resolve here via defaultTab. The Craving Tracker used
   to live here as a third tab; it moved to the Craving hub (/cravings) since
   it's a flavor-personalization tool, not a health/allergy concern. */

const TAB_IDS = ['allergies', 'wellness'];
const TABS = [
  { id: 'allergies', label: 'Allergies & Sensitivities' },
  { id: 'wellness', label: 'Wellness Goals' },
];

export default function HealthProfile({ defaultTab = 'allergies' } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromQuery = searchParams.get('tab');
  const [tab, setTab] = useState(TAB_IDS.includes(fromQuery) ? fromQuery : defaultTab);

  function pick(id) {
    setTab(id);
    setSearchParams(id === 'allergies' ? {} : { tab: id }, { replace: true });
  }

  return (
    <div className="hp-hub">
      <Nav />
      <div className="hp-hub-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`hp-hub-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => pick(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'allergies' && <Allergies embedded />}
      {tab === 'wellness' && <Wellness embedded />}
    </div>
  );
}
