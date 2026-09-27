import { useLocation, useNavigate } from 'react-router-dom';
import './PathHub.css';

/* PathHub — a tabbed hub whose tabs ARE routes. The older hubs (Recipes,
   Explore, Craving…) keep tab state in `?tab=`; that collides as soon as a hub
   nests another hub (You → Health), so newer hubs use this instead: the URL
   picks the tab, clicking a tab navigates to its path, and every old
   standalone address still lands on the right tab.

   tabs: [{ id, label, to, aliases?: string[], hidden?: boolean,
            render: (pathname) => node }]
   A `hidden` tab still resolves by URL but gets no button in the tab row — it
   is reached from somewhere else (e.g. a "more" menu passed as `trailing`).
   trailing: optional node rendered at the right end of the tab row. */
export default function PathHub({ tabs, trailing = null }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = tabs.find((t) => t.to === pathname || (t.aliases || []).includes(pathname)) || tabs[0];

  return (
    <div className="phub">
      <div className="phub-tabs" role="tablist">
        {tabs.filter((t) => !t.hidden).map((t) => (
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
        {trailing && <div className="phub-trailing">{trailing}</div>}
      </div>
      {active.render(pathname)}
    </div>
  );
}
