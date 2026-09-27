import PathHub from '../../components/shell/PathHub';
import HealthProfile from './Health';
import LifeContext from './LifeContext';
import Location from './Location';
import Account from './Account';
import HowItWorks from './HowItWorks';
import './Settings.css';

/* Settings hub — how the app is set up for you, in five tabs:

     Diet          allergies & sensitivities, wellness goals
     Life context  "season of life" (reshapes what Nova picks for a while), and how
                   she responds when you tell her how you feel
     Location      home borough + ZIP
     Account       sign in / out, taste quiz, appearance
     How it works  the short tour of what Dig In does

   These used to be sections buried in the middle of the Profile page. The old
   /allergies and /wellness addresses (linked from recipe pages) still land on the
   Diet tab. The signup questions in /welcome pre-fill these same settings, so a
   new account starts with them already set. */

const TABS = [
  { id: 'dietary',  label: 'Diet', to: '/settings', aliases: ['/allergies', '/wellness'],
    // keyed by path: /allergies ↔ /wellness must remount to pick up the new defaultTab
    render: (p) => <HealthProfile key={p} defaultTab={p === '/wellness' ? 'wellness' : 'allergies'} /> },
  { id: 'life',     label: 'Life context', to: '/settings/life',     render: () => <LifeContext /> },
  { id: 'location', label: 'Location',     to: '/settings/location', render: () => <Location /> },
  { id: 'account',  label: 'Account',      to: '/settings/account',  render: () => <Account /> },
  { id: 'how',      label: 'How it works', to: '/settings/how-it-works', render: () => <HowItWorks /> },
];

export default function Settings() {
  return <PathHub tabs={TABS} />;
}
