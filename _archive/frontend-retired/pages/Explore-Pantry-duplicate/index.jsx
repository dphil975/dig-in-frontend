import { useLocation, useSearchParams } from 'react-router-dom';
import Nav from '../../../components/shell/Nav';
import Pantry from './Inventory';
import PantryRolodex from './PantryRolodex';
import BarcodeScanner from './BarcodeScanner';
import './PantryHub.css';

/* Pantry hub — merges the Virtual Pantry (in-store shopping companion:
   scan/log items, buy vs. put-back, inventory), the Barcode Scanner (an
   input method for the pantry), and the Pantry Rolodex (recipes you can make
   from what's already in your pantry).

   The section tabs used to sit in a top tab bar on this page. They now live in
   the global left SideRail, nested under "Virtual Pantry" (Inventory / Scan /
   Recipes) — click Virtual Pantry in the nav and they expand out. Each maps to
   a real route (/pantry, /barcode, /pantry-recipes), so the active section is
   derived from the URL rather than local tab state (this component doesn't
   remount between those routes, so it must read the path live). */

const ROUTE_TAB = { '/barcode': 'scan', '/pantry-recipes': 'recipes' };
const VALID = new Set(['inventory', 'scan', 'recipes']);

export default function PantryHub({ defaultTab = 'inventory' } = {}) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const q = searchParams.get('tab');
  const tab = ROUTE_TAB[pathname] || (VALID.has(q) ? q : defaultTab);

  return (
    <div className="ph-hub">
      <Nav />
      {tab === 'inventory' && <Pantry embedded />}
      {tab === 'scan' && <BarcodeScanner embedded />}
      {tab === 'recipes' && <PantryRolodex embedded />}
    </div>
  );
}
