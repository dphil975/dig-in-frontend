import { useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import Nav from '../../components/shell/Nav';
import RecipeCards from './RecipeCards';
import InventTab from './InventTab';
import SpendPlanner from '../../components/pantry/SpendPlanner';
import './Recipes.css';

/* Recipes hub — the main nav "Recipes" landing target. This used to render a
   separate, older static-data grid (hardcoded fake recipes, a legacy
   pixel-ingredient-system.js script). RecipeCards is the app's real,
   data-driven, personalized recipe surface — the old grid was a genuine
   duplicate of it, so it's retired in favor of Browse (same call as the
   earlier "Catalog Removed" cleanup, where a legacy page was cut once a real
   superset existed). A 2nd tab, Invent, was added in the Kitchen Lab
   dissolution (see InventTab) for "generate a dish from nothing" tools, a
   different verb from Browse's "find a real recipe."

   The former standalone "Ask AI" tab (RecipeAiHelper) is GONE — it did the
   same job as Kitchen Alchemist (invent a recipe from what you have), just
   from a different starting point, so it's now a mode INSIDE Kitchen
   Alchemist on the Invent tab instead of a separate tab (2026-07-30 merge).
   The old /recipe-ai URL still works as an alias straight into that mode.

   Canonical URL is /recipes; /recipe-cards and /recipe-ai stay as aliases
   (see App.jsx + Nav). */

const TABS = [
  { id: 'browse', label: 'Browse' },
  { id: 'invent', label: 'Invent' },
];

export default function Recipes({ defaultTab = 'browse' } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();
  const fromQuery = searchParams.get('tab');
  const valid = TABS.some(t => t.id === fromQuery);
  const [tab, setTab] = useState(valid ? fromQuery : (pathname === '/recipe-ai' ? 'invent' : defaultTab));

  function pick(id) {
    setTab(id);
    setSearchParams(id === 'browse' ? {} : { tab: id }, { replace: true });
  }

  return (
    <div className="rcp-hub">
      <Nav />
      {/* The global left SideRail (App.jsx) is the nav now — this hub is just its
          tabs + center content. */}
      <div className="rcp-shell">
        <main className="rcp-main">
          <div className="rcp-hub-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                type="button"
                className={`rcp-hub-tab${tab === t.id ? ' active' : ''}`}
                onClick={() => pick(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'browse' && <><SpendPlanner /><RecipeCards embedded /></>}
          {tab === 'invent' && <InventTab initialAlchemistMode={pathname === '/recipe-ai' ? 'ingredients' : undefined} />}
        </main>
      </div>
    </div>
  );
}
