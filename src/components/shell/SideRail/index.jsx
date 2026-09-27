import { useState, useEffect, useTransition } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SideRail.css';
import { NAV_GROUPS, groupActive } from '../Nav/navConfig';
import { prefetchRoute } from '../../../app/routeLoaders';

/* SideRail — the app's ONE navigation surface: a vertical sidebar pinned to the
   left on every page (rendered once in App.jsx). Five entries and nothing else —
   Nova · Recipes · Discover · Profile · Settings. The DIG-IN wordmark goes home
   (Nova). The "season of life" control now lives in Settings, and the tags you
   follow live in Discover → Community.

   On a narrow screen it collapses: a slim top bar (brand + hamburger) shows,
   and the sidebar slides in as a drawer with a backdrop. */

const TAGLINE = 'come eat with people.';

export default function SideRail({ active = null }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);          // mobile drawer
  // A tab change is a transition: the page you're on stays put until the next one is
  // ready, and the entry you tapped shows a small pulse meanwhile.
  const [isPending, startTransition] = useTransition();
  const [tappedId, setTappedId] = useState(null);
  const go = (g) => { setTappedId(g.id); setMenuOpen(false); startTransition(() => navigate(g.to)); };

  // Close the mobile drawer on navigation.
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const isGroupActive = (g) => (active ? active === g.id : groupActive(g, pathname));

  return (
    <>
      {/* Narrow-screen top strip: brand + hamburger (the sidebar is off-canvas). */}
      <div className="srail-topbar">
        <button type="button" className="srail-topbrand" onClick={() => navigate('/')}>DIG-IN</button>
        <button
          type="button"
          className={`srail-burger${menuOpen ? ' open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>
      {menuOpen && <div className="srail-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <aside className={`srail${menuOpen ? ' open' : ''}`} aria-label="Primary navigation">
        <div className="srail-brand">
          <button type="button" className="srail-wordmark" onClick={() => navigate('/')}>DIG-IN</button>
          <p className="srail-tagline">{TAGLINE}</p>
        </div>

        <nav className="srail-nav" aria-label="Sections">
          {NAV_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`srail-nav-btn${isGroupActive(g) ? ' active' : ''}${isPending && tappedId === g.id ? ' is-pending' : ''}`}
              onClick={() => go(g)}
              onPointerEnter={() => prefetchRoute(g.id)}
              onFocus={() => prefetchRoute(g.id)}
              aria-current={isGroupActive(g) ? 'page' : undefined}
              aria-busy={isPending && tappedId === g.id ? 'true' : undefined}
            >
              <span aria-hidden="true">{g.emoji}</span> {g.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
