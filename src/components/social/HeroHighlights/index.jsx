import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './HeroHighlights.css';

/* HeroHighlights — "Get the highlights," Apple macbook-air style: a
   horizontal, scroll-snap carousel of big tiles instead of a filter menu.
   Each one deep-links into /recipe-cards with a REAL filter pre-applied
   (see RecipeCards' URL-seeding effect) — not just a link to an unfiltered
   page — except Hosting and Nibblers, which go straight to their own
   dedicated pages (/occasions, /nibblers) instead of a generic filtered
   recipe grid, since both already have a purpose-built experience that a
   filter alone can't reproduce. */

const CARDS = [
  { key: 'budget',  label: 'Budget Friendly', sub: 'Under $2/serving, for real', tag: 'BUDGET',  tint: '#96B36B', to: '/recipe-cards?special=budget' },
  { key: 'nibblers', label: 'Nibblers',        sub: 'Nuggets + Caesar + something fruity, or salad + protein + wine — zero cooking either way', tag: 'NIBBLERS', tint: '#FF6D8B', to: '/nibblers' },
  { key: 'boy',     label: 'Boy Dinner',       sub: 'Protein-forward, minimal effort', tag: 'BOY DINNER', tint: '#5d61a8', to: '/recipe-cards?special=boy-dinner' },
  { key: 'quick',   label: 'Quick Bite',       sub: '15 minutes or less', tag: 'QUICK', tint: '#6E8259', to: '/recipe-cards?time=15' },
  { key: 'gf',      label: 'Gluten Free',      sub: 'Every recipe, actually gluten-free', tag: 'GF', tint: '#96B36B', to: '/recipe-cards?diet=gluten-free' },
  { key: 'bread',   label: 'Bread',            sub: 'Loaves, rolls, flatbreads', tag: 'BREAD', tint: '#D8CAB4', tintText: '#33302A', to: '/recipe-cards?special=bread' },
  { key: 'hosting', label: 'Hosting',          sub: "It's an art form — learn how", tag: 'HOST', tint: '#6E8259', to: '/occasions' },
];

export default function HeroHighlights() {
  const navigate = useNavigate();
  const trackRef = useRef(null);

  function scroll(dir) {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * 260, behavior: 'smooth' });
  }

  return (
    <section className="hh-wrap">
      <div className="hh-inner">
        <div className="hh-head">
          <div>
            <p className="hh-eyebrow">DISCOVER</p>
            <h2 className="hh-title">Get the <span>highlights.</span></h2>
          </div>
          <div className="hh-ctrls">
            <button className="hh-arrow" onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>
            <button className="hh-arrow" onClick={() => scroll(1)} aria-label="Scroll right">›</button>
          </div>
        </div>

        <div className="hh-track" ref={trackRef}>
          {CARDS.map(c => (
            <button
              key={c.key}
              className="hh-card"
              style={{ '--tint': c.tint, '--tint-text': c.tintText || '#fff' }}
              onClick={() => navigate(c.to)}
            >
              <div className="hh-card-visual">
                <span className="hh-card-tag">{c.tag}</span>
              </div>
              <div className="hh-card-body">
                <span className="hh-card-label">{c.label}</span>
                <span className="hh-card-sub">{c.sub}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
