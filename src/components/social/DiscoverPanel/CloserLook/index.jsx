import { useState } from 'react';
import { SECTIONS } from '../../DiscoverPanel';
import './CloserLook.css';

/* CloserLook — a "take a closer look" layout: one big frame,
   arrow navigation, not a grid. Reuses DiscoverPanel's "Get to Know Dig In"
   cards (same authored teaser/detail copy, one story about what the app
   does) instead of writing a second version of the same six features.
   Leads with the short teaser — the "without revealing too much" ask —
   the fuller explanation is a tap away, not on-screen by default. */
const SLIDES = SECTIONS.find(s => s.id === 'get-to-know')?.cards || [];

export default function CloserLook() {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  if (!SLIDES.length) return null;
  const slide = SLIDES[index];

  function go(dir) {
    setExpanded(false);
    setIndex(i => (i + dir + SLIDES.length) % SLIDES.length);
  }

  function jump(i) {
    setExpanded(false);
    setIndex(i);
  }

  return (
    <section className="cl-wrap">
      <div className="cl-inner">
        <div className="cl-head">
          <p className="cl-eyebrow">HOW IT WORKS</p>
          <h2 className="cl-title">Take a <span>closer look.</span></h2>
        </div>

        <div className="cl-frame">
          <button type="button" className="cl-nav cl-nav-prev" onClick={() => go(-1)} aria-label="Previous">‹</button>

          <div className="cl-slide" key={slide.id}>
            <div className="cl-slide-visual"><span>{slide.icon}</span></div>
            <div className="cl-slide-body">
              <span className="cl-slide-count">{index + 1} / {SLIDES.length}</span>
              <span className="cl-slide-title">{slide.title}</span>
              <p className="cl-slide-teaser">{slide.teaser}</p>
              {expanded ? (
                <p className="cl-slide-detail">{slide.detail}</p>
              ) : (
                <button type="button" className="cl-slide-more" onClick={() => setExpanded(true)}>Tell me more →</button>
              )}
            </div>
          </div>

          <button type="button" className="cl-nav cl-nav-next" onClick={() => go(1)} aria-label="Next">›</button>
        </div>

        <div className="cl-dots">
          {SLIDES.map((s, i) => (
            <button
              type="button"
              key={s.id}
              className={`cl-dot${i === index ? ' active' : ''}`}
              onClick={() => jump(i)}
              aria-label={`Go to ${s.title}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
