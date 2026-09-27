import { useNavigate } from 'react-router-dom';
import Section from './Section';

/* Discover → Categories — ways into the recipes, and the rest of the places to
   explore. The first group opens Recipes with a real filter already applied;
   the second is every other corner of the app that used to have its own
   sidebar entry. */

const CATEGORIES = [
  { label: 'Budget',      sub: 'Under $2 a serving, for real',   to: '/recipe-cards?special=budget' },
  { label: 'Quick',       sub: '15 minutes or less',             to: '/recipe-cards?time=15' },
  { label: 'Gluten-free', sub: 'Every recipe, actually gluten-free', to: '/recipe-cards?diet=gluten-free' },
  { label: 'Bread',       sub: 'Loaves, rolls, flatbreads',      to: '/recipe-cards?special=bread' },
  { label: 'Boy dinner',  sub: 'Protein-forward, minimal effort', to: '/recipe-cards?special=boy-dinner' },
  { label: 'Nibblers',    sub: 'Zero cooking, still a meal',     to: '/nibblers' },
  { label: 'Hosting',     sub: "It's an art form — learn how",   to: '/occasions' },
];

const MORE = [
  { label: 'Craving',          sub: 'Answer one feeling, get a dish', to: '/craving' },
  { label: 'Kitchen skills',   sub: 'Tools, hydration, condiments',   to: '/kitchen-skills' },
  { label: 'Global food',      sub: 'Country by country',             to: '/global-food' },
  { label: 'Deals',            sub: 'What things really cost',        to: '/deals' },
  { label: 'Stores & commute', sub: 'Where to buy, how to get there', to: '/commute' },
  { label: 'Out there',        sub: 'Check in, circles, occasions',   to: '/out-there' },
];

function Tiles({ items, navigate }) {
  return (
    <div className="dsc-tiles">
      {items.map((c) => (
        <button key={c.to} type="button" className="dsc-tile" onClick={() => navigate(c.to)}>
          <span className="dsc-tile-label">{c.label}</span>
          <span className="dsc-tile-sub">{c.sub}</span>
        </button>
      ))}
    </div>
  );
}

export default function Categories() {
  const navigate = useNavigate();
  return (
    <Section id="categories" title="Categories" sub="Start from what you're after.">
      <Tiles items={CATEGORIES} navigate={navigate} />
      <p className="dsc-kicker dsc-kicker-gap">More ways in</p>
      <Tiles items={MORE} navigate={navigate} />
    </Section>
  );
}
