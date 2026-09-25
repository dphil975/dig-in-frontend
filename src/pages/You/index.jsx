import PathHub from '../../components/shell/PathHub';
import Profile from './Profile';
import YourRead from './YourRead';
import Badges from './Badges';
import Leaderboard from './Leaderboard';
import FoodPassport from './FoodPassport';
import MemoryVault from './MemoryVault';
import HealthProfile from './Health';

/* You hub — everything about the person, one destination. Profile used to
   link out to five separate full pages (Badges, Leaderboard, Passport, Memory
   Vault, and the unlinked Your Read) plus the Health hub; they're tabs here
   now (2026-09-25). Every old address still resolves to its tab. */

const TABS = [
  { id: 'profile',     label: 'Profile',     to: '/profile',     render: () => <Profile /> },
  { id: 'read',        label: 'Your Read',   to: '/your-read',   render: () => <YourRead embedded /> },
  { id: 'badges',      label: 'Badges',      to: '/badges',      render: () => <Badges /> },
  { id: 'leaderboard', label: 'Leaderboard', to: '/leaderboard', render: () => <Leaderboard /> },
  { id: 'passport',    label: 'Passport',    to: '/passport',    render: () => <FoodPassport /> },
  { id: 'memories',    label: 'Memories',    to: '/memories',    render: () => <MemoryVault /> },
  { id: 'health',      label: 'Health',      to: '/allergies',   aliases: ['/wellness'],
    // keyed by path: /allergies ↔ /wellness must remount to pick up the new defaultTab
    render: (p) => <HealthProfile key={p} defaultTab={p === '/wellness' ? 'wellness' : 'allergies'} /> },
];

export default function You() {
  return <PathHub tabs={TABS} />;
}
