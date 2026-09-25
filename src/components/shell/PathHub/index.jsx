import { useLocation, useNavigate } from 'react-router-dom';
import './PathHub.css';

/* PathHub — a tabbed hub whose tabs ARE routes. The older hubs (Recipes,
   Explore, Craving…) keep tab state in `?tab=`; that collides as soon as a hub
   nests another hub (You → Health), so newer hubs use this instead: the URL
   picks the tab, clicking a tab navigates to its path, and every old
   standalone address still lands on the right tab.

   tabs: [{ id, label, to, aliases?: string[], render: (pathname) => node }] */
export default function PathHub({ tabs }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = tabs.find((t) => t.to === pathname || (t.aliases || []).includes(pathname)) || tabs[0];

  return (
    <div className="phub">
      <div className="phub-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t === active}
            className={`phub-tab${t === active ? ' active' : ''}`}
            onClick={() => { if (t !== active) navigate(t.to, { replace: true }); }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {active.render(pathname)}
    </div>
  );
}
