import { useState, useEffect, useRef } from 'react';
import { recordRecipeView } from '../../services/behaviorTracker';
import './RecipeSlider.css';

const CUISINE_GRADIENT = {
  italian:    ['#2a1010', '#7a2020'],
  japanese:   ['#0a1530', '#1a3060'],
  mexican:    ['#2a1000', '#6a3000'],
  indian:     ['#2a0e00', '#703000'],
  thai:       ['#051a08', '#0a4015'],
  chinese:    ['#2a0000', '#680000'],
  american:   ['#080820', '#141445'],
  french:     ['#14142a', '#282860'],
  korean:     ['#220018', '#520038'],
  vietnamese: ['#002510', '#004a20'],
  greek:      ['#002535', '#004a68'],
  world:      ['#121212', '#33302A'],
};

const CUISINE_ACCENT = {
  italian:    '#e8533b',
  japanese:   '#4d9fff',
  mexican:    '#ff9040',
  indian:     '#ffb840',
  thai:       '#7dde6e',
  chinese:    '#ff4444',
  american:   '#6e8fff',
  french:     '#c9b8ff',
  korean:     '#ff6eac',
  vietnamese: '#6effb3',
  greek:      '#6ed0ff',
  world:      '#6E8259',
};

function getCuisineStyle(cuisineRaw = '') {
  const key    = cuisineRaw.toLowerCase();
  const grad   = CUISINE_GRADIENT[key] || CUISINE_GRADIENT.world;
  const accent = CUISINE_ACCENT[key]   || CUISINE_ACCENT.world;
  return { grad, accent };
}

function dishTag(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'DISH';
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function stripAmount(str) {
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/^[\d\s\/¼½¾⅓⅔⅛]+\s*(cups?|tbsp?|tablespoons?|tsp?|teaspoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|ml|liters?|l|cloves?|pieces?|medium|large|small|pinch\s*of)?\s*/i, '')
    .split(',')[0]
    .trim();
}

export default function RecipeSlider({ recipes = [] }) {
  const [previewIdx, setPreviewIdx] = useState(null);
  const [elapsed,    setElapsed]    = useState(0);
  const [phase,      setPhase]      = useState(0);
  const timerRef = useRef(null);

  function closePreview() {
    clearInterval(timerRef.current);
    setPreviewIdx(null);
    setElapsed(0);
    setPhase(0);
  }

  function openPreview(idx) {
    clearInterval(timerRef.current);
    const r = recipes[idx];
    if (r) recordRecipeView({ id: r.id, name: r.name, cuisine: r.cuisine });
    setPreviewIdx(idx);
    setElapsed(0);
    setPhase(0);

    let t = 0;
    timerRef.current = setInterval(() => {
      t++;
      setElapsed(t);
      if (t === 3) setPhase(1);
      if (t === 7) setPhase(2);
      if (t >= 10) closePreview();
    }, 1000);
  }

  // Keyboard dismiss
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') closePreview(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearInterval(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!recipes.length) return null;

  const active      = previewIdx !== null ? recipes[previewIdx] : null;
  const activeStyle = active ? getCuisineStyle(active.cuisine) : null;

  return (
    <section className="rs-section">
      <div className="rs-header">
        <span className="rs-live-dot" />
        <span className="rs-header-title">PICKED FOR YOU</span>
        <span className="rs-header-sub">tap to preview · updates with your taste history</span>
      </div>

      <div className="rs-track">
        {recipes.map((r, i) => (
          <button
            key={r.id || i}
            className="rs-card"
            onClick={() => openPreview(i)}
          >
            {i < 2 && <span className="rs-card-badge">FOR YOU</span>}

            {/* Gradient header — same language as the recipe "method card" */}
            <div className="rs-card-head">
              <div className="rs-card-name">{r.name}</div>
              <div className="rs-card-tags">
                {r.cuisine && <span className="rs-tag">{r.cuisine}</span>}
                {r.time    && <span className="rs-tag">{r.time}min</span>}
              </div>
            </div>

            {/* Image band — pixel-tag placeholder (no photo in DB) */}
            <div className="rs-card-img" style={{ color: getCuisineStyle(r.cuisine).accent }}>{dishTag(r.name)}</div>

            {/* Body */}
            <div className="rs-card-body">
              <div className="rs-card-meta">
                {r.difficulty || 'Easy'}{r.time ? ` · ${r.time} min` : ''}
              </div>
              <div className="rs-card-hint">TAP TO PREVIEW →</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Full-screen preview overlay ── */}
      {active && (
        <div
          className="rs-overlay"
          style={{ background: `linear-gradient(155deg, ${activeStyle.grad[0]} 0%, ${activeStyle.grad[1]} 100%)` }}
          onClick={e => { if (e.target === e.currentTarget) closePreview(); }}
        >
          <button className="rs-close" onClick={closePreview}>✕</button>

          <div className="rs-preview">
            {/* Phase 0: pixel tag + title burst in */}
            <div
              className={`rs-emoji rs-anim-scale${elapsed >= 0 ? ' rs-visible' : ''}`}
              style={{ color: activeStyle.accent }}
            >
              {dishTag(active.name)}
            </div>

            <h2
              className={`rs-title rs-anim-up${elapsed >= 1 ? ' rs-visible' : ''}`}
              style={{ color: activeStyle.accent }}
            >
              {active.name}
            </h2>

            <p className={`rs-cuisine-line rs-anim-up${elapsed >= 1 ? ' rs-visible' : ''}`}
               style={{ transitionDelay: '0.1s' }}>
              {active.cuisine}{active.time ? ` · ${active.time} min` : ''}
              {active.difficulty ? ` · ${active.difficulty}` : ''}
            </p>

            {/* Phase 1: ingredients + description slide in */}
            {(active.ingredients?.length > 0) && (
              <div className={`rs-ings rs-anim-up${phase >= 1 ? ' rs-visible' : ''}`}>
                {active.ingredients.slice(0, 4).map((ing, idx) => (
                  <span
                    key={idx}
                    className="rs-ing-chip"
                    style={{
                      borderColor: activeStyle.accent,
                      color: activeStyle.accent,
                      animationDelay: `${idx * 0.12}s`,
                    }}
                  >
                    {stripAmount(ing)}
                  </span>
                ))}
              </div>
            )}

            {active.description && (
              <p className={`rs-desc rs-anim-up${phase >= 1 ? ' rs-visible' : ''}`}
                 style={{ transitionDelay: '0.15s' }}>
                {active.description}
              </p>
            )}

            {/* Phase 2: CTA appears at 7s */}
            <a
              href="/recipes"
              className={`rs-cta rs-anim-up${phase >= 2 ? ' rs-visible' : ''}`}
              style={{ background: activeStyle.accent }}
            >
              COOK THIS TONIGHT →
            </a>
          </div>

          {/* Progress bar */}
          <div className="rs-bar-wrap">
            <div
              className="rs-bar-fill"
              style={{
                width: `${(elapsed / 10) * 100}%`,
                background: activeStyle.accent,
              }}
            />
          </div>

          <div className="rs-countdown" style={{ color: activeStyle.accent }}>
            {10 - elapsed}s
          </div>
        </div>
      )}
    </section>
  );
}
