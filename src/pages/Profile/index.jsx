import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import PathHub from '../../components/shell/PathHub';
import ProfileHeader from './ProfileHeader';
import Thread from './Thread';
import Collection from './Collection';
import Coins from './Coins';
import Trophies from './Trophies';
import Gratitude from './Gratitude';
import './Profile.css';

// The Pantry is the heaviest tab (inventory, barcode scanner, recipes-from-pantry),
// so it loads only when you open it.
const PantryHub = lazy(() => import('../Pantry'));

/* Profile hub — who you are and what you've kept, in five tabs:

     Thread      you and Nova, newest first: check-ins, picks, cooks, how it went
     Collection  saved recipes and boards, what you've cooked, your cook journal
     Coins       coins, daily quests, leaderboard
     Pantry      what's in your kitchen, scan an item, recipes you can make now,
                 and what to use up first
     Trophies    badges, wins, passport, keepsakes, store check-ins

   Everything about how the app is set up for you (dietary, life context,
   location, account) lives in Settings. The Gratitude log has no tab: it's behind
   the "⋯" menu. Every old address (/check-ins, /badges, /passport, /memories,
   /leaderboard, /your-read, /pantry-recipes, /barcode) still resolves — to its
   place inside a tab. */

const TABS = [
  { id: 'thread',     label: 'Thread',     to: '/profile',    aliases: ['/check-ins'], render: () => <Thread /> },
  { id: 'collection', label: 'Collection', to: '/collection', render: () => <Collection /> },
  { id: 'coins',      label: 'Coins',      to: '/coins',      aliases: ['/leaderboard'], render: (p) => <Coins path={p} /> },
  { id: 'pantry',     label: 'Pantry',     to: '/pantry',     aliases: ['/pantry-recipes', '/barcode'],
    render: () => <Suspense fallback={null}><PantryHub /></Suspense> },
  { id: 'trophies',   label: 'Trophies',   to: '/trophies',   aliases: ['/badges', '/passport', '/memories', '/your-read'],
    render: (p) => <Trophies path={p} /> },
  { id: 'gratitude',  label: 'Gratitude',  to: '/gratitude',  hidden: true, render: () => <Gratitude /> },
];

function MoreMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="pmore" ref={ref}>
      <button
        type="button"
        className="pmore-btn"
        aria-label="More"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ⋯
      </button>
      {open && (
        <div className="pmore-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); navigate('/gratitude'); }}>
            Gratitude log
          </button>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  return (
    <>
      <ProfileHeader />
      <PathHub tabs={TABS} trailing={<MoreMenu />} />
    </>
  );
}
