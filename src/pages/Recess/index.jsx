import PathHub from '../../components/shell/PathHub';
import Ritual from './Ritual';
import Nova from './Nova';

/* Recess hub — the two calm, check-in-with-yourself surfaces in one place:
   the daily Recess ritual and Nova's Nest (the Shadow-to-Light companion).
   Merged 2026-09-25; /recess and /nova both still resolve to their tab. */

const TABS = [
  { id: 'ritual', label: 'Recess',       to: '/recess', render: () => <Ritual embedded /> },
  { id: 'nest',   label: "Nova's Nest",  to: '/nova',   render: () => <Nova embedded /> },
];

export default function Recess() {
  return <PathHub tabs={TABS} />;
}
