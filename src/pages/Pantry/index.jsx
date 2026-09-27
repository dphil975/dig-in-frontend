import { useLocation, useNavigate } from 'react-router-dom';
import Nav from '../../components/shell/Nav';
import Pantry from './Inventory';
import PantryRolodex from './PantryRolodex';
import BarcodeScanner from './BarcodeScanner';
import './PantryHub.css';

/* Pantry — the tab inside Profile that holds your kitchen:

     Inventory           what you have, a recall banner (and a badge on the item)
                         for anything on a live FDA recall, and Nova's "Use it up
                         first" card for whatever is about to turn
     Scan an item        the barcode scanner (an input method for the pantry)
     Recipes I can make  the rolodex of recipes from what's already here

   The three sections are real routes (/pantry, /barcode, /pantry-recipes), so the
   active one is read from the URL. This component doesn't remount between them,
   so it has to read the path live. */

const SECTIONS = [
  { id: 'inventory', label: 'Inventory',          to: '/pantry' },
  { id: 'scan',      label: 'Scan an item',       to: '/barcode' },
  { id: 'recipes',   label: 'Recipes I can make', to: '/pantry-recipes' },
];
const ROUTE_SECTION = { '/barcode': 'scan', '/pantry-recipes': 'recipes' };

export default function PantryHub() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = ROUTE_SECTION[pathname] || 'inventory';

  return (
    <div className="ph-hub">
      <Nav />
      <nav className="psub ph-sections" aria-label="Pantry">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`psub-pill${active === s.id ? ' active' : ''}`}
            onClick={() => { if (active !== s.id) navigate(s.to, { replace: true }); }}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {active === 'inventory' && <Pantry embedded />}
      {active === 'scan' && <BarcodeScanner embedded />}
      {active === 'recipes' && <PantryRolodex embedded />}
    </div>
  );
}
