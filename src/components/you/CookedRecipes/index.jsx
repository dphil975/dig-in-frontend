import { useState, useEffect } from 'react';
import '../../../pages/Recipes/Cookbook/MyCookbook/MyCookbook.css';   // reuse the cookbook card styling
import './CookedRecipes.css';

const HISTORY_KEY = 'dig_in_cook_history';
const PREVIEW = 4;     // cards shown inline on the profile
const PER_PAGE = 10;   // cards per page inside the "view more" modal

const CUISINE_EMOJI = {
  italian:'ITALIAN', mexican:'MEXICAN', japanese:'JAPANESE', chinese:'CHINESE', indian:'INDIAN',
  french:'FRENCH', thai:'THAI', american:'AMERICAN', mediterranean:'MEDITERRAN', greek:'GREEK',
  korean:'KOREAN', vietnamese:'VIETNAMESE', spanish:'SPANISH', caribbean:'CARIBBEAN',
  middle_eastern:'MIDDLE', ethiopian:'ETHIOPIAN',
};
function cuisineEmoji(cuisine) {
  if (!cuisine) return 'DISH';
  const lc = cuisine.toLowerCase().replace(/[\s-]/g, '_');
  const match = Object.keys(CUISINE_EMOJI).find(k => lc.includes(k));
  return match ? CUISINE_EMOJI[match] : 'DISH';
}
const keyOf = (r, i) => r.id || r.name || `r${i}`;

/* A single cooked-recipe card in the My Cookbook visual style */
function CookedCard({ r, idx, expandedKey, onToggle }) {
  const k = keyOf(r, idx);
  const ings = Array.isArray(r.ingredients) ? r.ingredients : [];
  const expanded = expandedKey === k;
  return (
    <div className={`mcb-card${expanded ? ' expanded' : ''}`}>
      <div className="mcb-card-top">
        <div className="mcb-card-emoji">{cuisineEmoji(r.cuisine)}</div>
        <div className="mcb-card-info">
          <h3 className="mcb-card-name">{r.name || 'Recipe'}</h3>
          <div className="mcb-card-meta">
            {r.cuisine   && <span>{r.cuisine}</span>}
            {r.totalTime && <span>{r.totalTime} min</span>}
            {r.servings  && <span>Serves {r.servings}</span>}
          </div>
          {r.date && (
            <div className="mcb-card-dietary">
              <span className="mcb-diet-tag">Cooked {r.date}</span>
            </div>
          )}
        </div>
      </div>
      {ings.length > 0 && (
        <>
          <div className="mcb-card-actions">
            <button className="mcb-steps-btn" onClick={() => onToggle(k)}>
              {expanded ? 'Hide Ingredients ▲' : 'View Ingredients ▼'}
            </button>
          </div>
          {expanded && (
            <div className="mcb-card-detail">
              <div className="mcb-detail-section">
                <h4>INGREDIENTS</h4>
                <ul>
                  {ings.map((ing, i) => (
                    <li key={i}>{typeof ing === 'string' ? ing : (ing.item || ing.name || JSON.stringify(ing))}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CookedRecipes() {
  const [history, setHistory] = useState([]);
  const [open, setOpen]       = useState(false);
  const [page, setPage]       = useState(1);
  const [expandedKey, setExpandedKey] = useState(null);

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')); } catch {}
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggle = (k) => setExpandedKey(prev => (prev === k ? null : k));

  if (history.length === 0) {
    return (
      <p className="profile-hint">
        Your cooked recipes will appear here — cook a dish to fill your cookbook!
      </p>
    );
  }

  const total     = history.length;
  const preview   = history.slice(0, PREVIEW);
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage  = Math.min(page, pageCount);
  const slice     = history.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // First + last always; collapse the middle with an ellipsis
  const pageNums = [];
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - safePage) <= 1) pageNums.push(i);
    else if (pageNums[pageNums.length - 1] !== '…') pageNums.push('…');
  }

  return (
    <div className="ckd">
      <div className="mcb-grid">
        {preview.map((r, i) => (
          <CookedCard key={keyOf(r, i)} r={r} idx={i} expandedKey={expandedKey} onToggle={toggle} />
        ))}
      </div>

      {total > PREVIEW && (
        <button className="ckd-viewmore" onClick={() => { setOpen(true); setPage(1); }}>
          VIEW MORE · {total} COOKED ▸
        </button>
      )}

      {open && (
        <div className="ckd-overlay" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="ckd-modal">
            <div className="ckd-modal-head">
              <span className="ckd-modal-title">COOKED RECIPES · {total}</span>
              <button className="ckd-modal-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>

            <div className="ckd-modal-body">
              <div className="mcb-grid">
                {slice.map((r, i) => {
                  const absIdx = (safePage - 1) * PER_PAGE + i;
                  return <CookedCard key={keyOf(r, absIdx)} r={r} idx={absIdx} expandedKey={expandedKey} onToggle={toggle} />;
                })}
              </div>
            </div>

            {pageCount > 1 && (
              <div className="ckd-pag">
                <button className="ckd-pag-arrow" disabled={safePage === 1}
                  onClick={() => setPage(safePage - 1)} aria-label="Previous page">‹</button>
                <div className="ckd-pag-nums">
                  {pageNums.map((n, i) =>
                    n === '…'
                      ? <span key={`e${i}`} className="ckd-pag-ellipsis">…</span>
                      : <button key={n}
                          className={`ckd-pag-num${n === safePage ? ' active' : ''}`}
                          onClick={() => setPage(n)}>{n}</button>
                  )}
                </div>
                <button className="ckd-pag-arrow" disabled={safePage === pageCount}
                  onClick={() => setPage(safePage + 1)} aria-label="Next page">›</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
