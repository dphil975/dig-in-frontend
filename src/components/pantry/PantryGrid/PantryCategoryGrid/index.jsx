import { useMemo, useState } from 'react';
import { ALL_CATEGORIES, countByCategory, categoryById } from '../../../../lib/pantryCategories';
import { categoryIconUrl } from '../../../../lib/pantryPixelIcons';
import './PantryCategoryGrid.css';

/* PantryCategoryGrid — the shelf wall of the Virtual Pantry.

   Every shelf is a polaroid: a square pixel-art photo in a white frame, a
   centred h3 caption underneath, and the real count of what you have on that
   shelf. The art is drawn on the fly by pantryPixelIcons.js (a basket of
   veggies, a plate of three differently-coloured cookies, a ramen bowl…), so
   the tile is never a photo of food you don't own — the count and the item
   list underneath are the only things claiming anything real.

   Clicking a shelf filters the pantry below it. Clicking an EMPTY shelf isn't
   a dead end: it shows what belongs there, which is the point of having the
   categories laid out as a reference in the first place. */

export default function PantryCategoryGrid({ items = [], selected, onSelect }) {
  const [stockedOnly, setStockedOnly] = useState(false);

  const counts = useMemo(() => countByCategory(items), [items]);
  const stockedCount = useMemo(
    () => ALL_CATEGORIES.filter(c => counts[c.id] > 0).length,
    [counts],
  );

  // Fixed taxonomy order, never re-sorted by count — a shelf that moves every
  // time you buy something is a shelf you can't learn.
  const shown = stockedOnly ? ALL_CATEGORIES.filter(c => counts[c.id] > 0) : ALL_CATEGORIES;
  const active = selected ? categoryById(selected) : null;
  const activeCount = active ? (counts[active.id] || 0) : 0;

  return (
    <section className="pcat" aria-labelledby="pcat-head">
      <div className="pcat-header">
        <h2 className="pcat-title" id="pcat-head">YOUR SHELVES</h2>
        <div className="pcat-header-right">
          <span className="pcat-meta">
            {stockedCount} of {ALL_CATEGORIES.length} stocked
          </span>
          <button
            type="button"
            className={`pcat-toggle${stockedOnly ? ' on' : ''}`}
            aria-pressed={stockedOnly}
            onClick={() => setStockedOnly(v => !v)}
            disabled={stockedCount === 0}
          >
            {stockedOnly ? 'Showing what I have' : 'Only what I have'}
          </button>
        </div>
      </div>

      <p className="pcat-sub">
        Tap a shelf to see just those items. Empty ones still tell you what belongs there.
      </p>

      {shown.length === 0 ? (
        <div className="pcat-none">Nothing stocked yet — turn the filter off to browse every shelf.</div>
      ) : (
        <ul className="pcat-grid">
          {shown.map(cat => {
            const n = counts[cat.id] || 0;
            const isSel = selected === cat.id;
            return (
              <li className="pcat-cell" key={cat.id}>
                <article className={`pcat-card${isSel ? ' is-selected' : ''}${n === 0 ? ' is-empty' : ''}`}>
                  <div className="pcat-photo">
                    <img src={categoryIconUrl(cat.id)} alt="" aria-hidden="true" draggable="false" />
                    {n > 0 && <span className="pcat-badge">{n}</span>}
                  </div>
                  <h3 className="pcat-name">{cat.label}</h3>
                  <p className="pcat-count">{n === 0 ? 'empty shelf' : `${n} item${n === 1 ? '' : 's'}`}</p>
                  <button
                    type="button"
                    className="pcat-hit"
                    aria-pressed={isSel}
                    aria-label={`${cat.label} — ${n === 0 ? 'empty shelf' : `${n} item${n === 1 ? '' : 's'}`}`}
                    onClick={() => onSelect?.(isSel ? null : cat.id)}
                  />
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {active && (
        <div className="pcat-detail">
          <div className="pcat-detail-head">
            <strong>{active.label}</strong>
            <button type="button" className="pcat-clear" onClick={() => onSelect?.(null)}>
              show every shelf ✕
            </button>
          </div>
          <p className="pcat-detail-blurb">{active.blurb}</p>
          {activeCount === 0 && active.examples.length > 0 && (
            <p className="pcat-detail-examples">
              <span>What lives here:</span> {active.examples.join(' · ')}
            </p>
          )}
          {activeCount === 0 && active.examples.length === 0 && (
            <p className="pcat-detail-examples">
              <span>Nothing here.</span> Items land on this shelf only when their name doesn't match a real
              category keyword — rename one and it files itself.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
