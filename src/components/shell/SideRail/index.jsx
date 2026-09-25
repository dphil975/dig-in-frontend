import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SideRail.css';
import { LIFE_MODES, activeLifeMode, setLifeMode, clearLifeMode } from '../../../lib/feedContext';
import { metroForZip } from '../../../lib/localFlavor';
import { NAV_GROUPS, groupActive, sublinkActive } from '../Nav/navConfig';

/* SideRail — the app's ONE navigation surface: a Tumblr-style vertical sidebar
   pinned to the left on every page (rendered once in App.jsx). It replaced the
   old horizontal top bar — the whole site map now lives here as expandable
   groups (Home · Recipes ▸ · Explore ▸ incl. City Explorer · You), above the
   life-mode control and your followed tags.

   On a narrow screen it collapses: a slim top bar (brand + hamburger) shows,
   and the full sidebar slides in as a drawer with a backdrop — the same
   minimize-then-expand behavior Tumblr's nav uses.

   Self-contained: reads its own state from localStorage (place, life mode,
   followed tags) so it needs no host wiring. */

const TAGLINE = 'come eat with people.';

function loadFollowed() {
  try { return JSON.parse(localStorage.getItem('dig_in_followed_tags') || '[]'); }
  catch { return []; }
}

export default function SideRail({ active = null }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [now, setNow] = useState(() => new Date());
  const [lifeMode, setLifeModeState] = useState(() => activeLifeMode());
  const [modeOpen, setModeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);          // mobile drawer
  const [expanded, setExpanded] = useState(null);           // which hub's sub-pages are open
  const followed = loadFollowed();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Close the mobile drawer on navigation; auto-expand the hub you're inside.
  useEffect(() => {
    setMenuOpen(false);
    const g = NAV_GROUPS.find((x) => x.sublinks && groupActive(x, pathname));
    if (g) setExpanded(g.id);
  }, [pathname]);

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const isGroupActive = (g) => (active ? active === g.id : groupActive(g, pathname));

  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const placeLabel = (() => {
    try {
      const borough = localStorage.getItem('dig_in_home_borough');
      if (borough) return borough;
      const zip = localStorage.getItem('dig_in_zip');
      const metro = zip ? metroForZip(zip) : null;
      return metro?.city || 'your kitchen';
    } catch { return 'your kitchen'; }
  })();

  function chooseMode(id) {
    if (id) setLifeMode(id); else clearLifeMode();
    setLifeModeState(activeLifeMode());
    setModeOpen(false);
    // Let any open page (the Home feed) re-evaluate under the new mode without
    // a reload — the sidebar is now separate from the page that reads it.
    try { window.dispatchEvent(new Event('dig_in_lifemode')); } catch { /* ignore */ }
  }

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

        <div className="srail-place">
          <span className="srail-place-dot" />
          <span className="srail-place-txt">{placeLabel} · {timeStr}</span>
        </div>

        <button type="button" className="srail-cta" onClick={() => navigate('/reels/create')}>
          + Post a dish
        </button>

        <nav className="srail-nav" aria-label="Sections">
          {NAV_GROUPS.map((g) => {
            const hasSub = g.sublinks?.length > 0;
            const open = expanded === g.id;
            return (
              <div key={g.id} className="srail-group">
                <div className="srail-navrow">
                  <button
                    type="button"
                    className={`srail-nav-btn${isGroupActive(g) ? ' active' : ''}`}
                    onClick={() => navigate(g.to)}
                    aria-current={isGroupActive(g) ? 'page' : undefined}
                  >
                    <span aria-hidden="true">{g.emoji}</span> {g.label}
                  </button>
                  {hasSub && (
                    <button
                      type="button"
                      className={`srail-expand${open ? ' open' : ''}`}
                      aria-label={`${g.label} sub-pages`}
                      aria-expanded={open}
                      onClick={() => setExpanded((e) => (e === g.id ? null : g.id))}
                    >
                      ▾
                    </button>
                  )}
                </div>
                {hasSub && open && (
                  <div className="srail-sublinks">
                    {g.sublinks.map((s) => {
                      const subActive = sublinkActive(s, pathname);
                      return (
                        <div key={s.to} className="srail-sublink-wrap">
                          <button
                            type="button"
                            className={`srail-sublink${subActive ? ' active' : ''}`}
                            onClick={() => navigate(s.to)}
                          >
                            {s.label}
                          </button>
                          {/* A sublink can carry its own tabs (e.g. Virtual Pantry
                              → Inventory / Scan / Recipes). They live in the nav
                              instead of a top tab bar, and reveal when you're
                              inside that sublink. */}
                          {s.subs && subActive && (
                            <div className="srail-subsublinks">
                              {s.subs.map((ss) => (
                                <button
                                  key={ss.to}
                                  type="button"
                                  className={`srail-subsublink${pathname === ss.to ? ' active' : ''}`}
                                  onClick={() => navigate(ss.to)}
                                >
                                  {ss.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Life mode — "where are you in life right now?" The feed follows. */}
        <div className="srail-mode">
          <button
            type="button"
            className={`srail-mode-cur${lifeMode ? ' set' : ''}`}
            onClick={() => setModeOpen((o) => !o)}
          >
            {lifeMode ? (
              <>
                <span className="srail-mode-emoji">{lifeMode.emoji}</span>
                <span className="srail-mode-label">{lifeMode.label}</span>
                {lifeMode.daysLeft != null && <span className="srail-mode-days">{lifeMode.daysLeft}d</span>}
              </>
            ) : (
              <><span className="srail-mode-emoji">＋</span><span className="srail-mode-label">set your season</span></>
            )}
          </button>
          {modeOpen && (
            <div className="srail-mode-menu">
              <p className="srail-mode-hint">where are you in life right now? the feed will follow.</p>
              {Object.values(LIFE_MODES).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`srail-mode-opt${lifeMode?.id === m.id ? ' active' : ''}`}
                  onClick={() => chooseMode(m.id)}
                >
                  <span className="srail-mode-opt-emoji">{m.emoji}</span>
                  <span className="srail-mode-opt-txt"><b>{m.label}</b><em>{m.blurb}</em></span>
                </button>
              ))}
              {lifeMode && (
                <button type="button" className="srail-mode-clear" onClick={() => chooseMode(null)}>
                  clear — I'm good now
                </button>
              )}
            </div>
          )}
        </div>

        <div className="srail-tags">
          <span className="srail-tags-head">TAGS YOU FOLLOW</span>
          {followed.length ? (
            <div className="srail-tag-list">
              {followed.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="srail-tag"
                  onClick={() => navigate(`/tag/${encodeURIComponent(t)}`)}
                >
                  {t}
                </button>
              ))}
            </div>
          ) : (
            <p className="srail-tags-empty">Right-click a tag on any post to follow it.</p>
          )}
        </div>
      </aside>
    </>
  );
}
