import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DiscoverBento.css';

/* Косметология-style bento, rebuilt for recipe discovery:
   2 tall upright cards · 2 landscape cards stacked · 3 underneath.
   Pixel styling, Apple-style display + spacing, + button bottom-right.

   Cards either `to` (a real route, a genuinely different hub) or
   `exploreTab` (a sibling tab inside the same Explore hub this bento
   already lives in — switches in place via the `onExploreTab` callback
   instead of navigating, so it doesn't remount the whole hub to land back
   one tab over). "Global Cuisines" is the one exploreTab card today. */
const CARDS = [
  { key: 'breakfast', label: 'Breakfast',       sub: 'Start the day',     emoji: 'BREAKFAST', to: '/recipe-cards',    slot: 'tall',
    img: 'https://images.unsplash.com/photo-1528207776537-91ae1eecd6ee?auto=format&fit=crop&w=600&q=80' },
  { key: 'dinner',    label: 'Dinner',          sub: 'Mains & feasts',    emoji: 'DINNER', to: '/recipe-cards',    slot: 'tall',
    img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80' },
  { key: 'all',       label: 'All Recipes',     sub: '600+ dishes',       emoji: 'ALL', to: '/recipe-cards',    slot: 'wide',
    img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80' },
  { key: 'craving',   label: 'Craving Compass', sub: 'Find your flavor',  emoji: 'CRAVING', to: '/craving-compass', slot: 'wide',
    img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80' },
  { key: 'lunch',     label: 'Lunch',           sub: 'Midday meals',      emoji: 'LUNCH', to: '/recipe-cards',    slot: 'under',
    img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80' },
  { key: 'dessert',   label: 'Desserts',        sub: 'Sweet finishes',    emoji: 'DESSERTS', to: '/recipe-cards',    slot: 'under',
    img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80' },
  { key: 'quick',     label: 'Under 20 Min',    sub: 'Fast & easy',       emoji: 'UNDER', to: '/recipe-cards',    slot: 'under',
    img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
  { key: 'global',    label: 'Global Cuisines', sub: '70 countries',      emoji: 'GLOBAL', exploreTab: 'global',   slot: 'under',
    img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80' },
  { key: 'reels',     label: 'Recipe Reels',    sub: 'Swipe to discover', emoji: 'RECIPE', to: '/feed',           slot: 'under',
    img: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80' },
];

function BentoCard({ card, onGo }) {
  const [err, setErr] = useState(false);
  return (
    <button className="db-card" onClick={() => onGo(card)} aria-label={card.label}>
      {card.img && !err
        ? <img className="db-card-bg" src={card.img} alt={card.label} loading="lazy" onError={() => setErr(true)} />
        : <div className="db-card-bg db-card-bg-fb"><span>{card.emoji}</span></div>}
      <div className="db-card-shade" />
      <div className="db-card-text">
        <span className="db-sub">{card.sub}</span>
        <span className="db-label">{card.label}</span>
      </div>
      <span className="db-plus" aria-hidden="true">+</span>
    </button>
  );
}

export default function DiscoverBento({ onExploreTab } = {}) {
  const navigate = useNavigate();
  const go = (card) => (card.exploreTab ? onExploreTab?.(card.exploreTab) : navigate(card.to));
  const tall  = CARDS.filter(c => c.slot === 'tall');
  const wide  = CARDS.filter(c => c.slot === 'wide');
  const under = CARDS.filter(c => c.slot === 'under');

  return (
    <section className="discover-bento">
      <div className="db-inner">
        <p className="db-eyebrow">CHOOSE A SECTION</p>
        <h2 className="db-title">Discover <span>recipes.</span></h2>

        {/* 2 tall upright · 2 landscape stacked */}
        <div className="bento-top">
          <div className="bento-tall-pair">
            {tall.map(c => <BentoCard key={c.key} card={c} onGo={go} />)}
          </div>
          <div className="bento-wide-stack">
            {wide.map(c => <BentoCard key={c.key} card={c} onGo={go} />)}
          </div>
        </div>

        {/* 3 underneath */}
        <div className="bento-bottom">
          {under.map(c => <BentoCard key={c.key} card={c} onGo={go} />)}
        </div>

        {/* Single, bold CTA */}
        <button className="db-cta" onClick={() => go({ to: '/recipe-cards' })}>
          CREATE YOUR FIRST REMIX
        </button>
      </div>
    </section>
  );
}
