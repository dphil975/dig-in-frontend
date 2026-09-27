import { freshnessFor, freshnessLabel, categorize } from '../../../../lib/freshness';
import { getItemPhoto } from '../../../../lib/storeMemory';
import { LOCATIONS, LOCATION_LABEL } from '../../../../lib/pantryTools';

/* The virtual pantry itself — real shelves you can actually look at, not a
   settings list. Each item is a small tile: a real reference photo if you've
   captured one, otherwise a category icon from the SAME real keyword
   categorizer freshness.js already uses to estimate shelf life (leafy greens,
   dairy, meat, dry goods, etc.) — never a fabricated picture, just an honest
   stand-in from the item's actual name. The tile's border color IS its
   freshness (matcha=fresh, honey=soon, amber=urgent, red=past its estimate) —
   glanceable the way an actual fridge shelf is, not a badge you have to read.

   Extracted out of Pantry/index.jsx (was pushing 1,200+ lines). `photoTick`
   is only read as a prop to force a re-render after a new reference photo is
   captured (getItemPhoto reads localStorage directly). */

const LOCATION_ICON = { pantry: '🫙', fridge: '🧊', freezer: '❄️' };

// A real icon per real category (freshness.js's categorize() — keyword-driven
// off the item's actual name, the same classification that sets its shelf
// life). Never invented per-item — just a category's honest stand-in art.
const CATEGORY_ICON = {
  leafy: '🥬', berries: '🫐', seafood: '🐟', meat: '🥩', leftover: '🍱',
  dairy: '🥛', eggs: '🥚', bread: '🍞', roots: '🥔', produce: '🍎',
  dry: '🥫', other: '📦',
};

const FRESH_COLOR = {
  fresh: 'var(--dig-matcha, #6E8259)',
  soon: 'var(--dig-honey, #E0A32E)',
  urgent: '#c9701f',
  expired: '#d32f2f',
};

export default function PantryBuckets({ buckets, onRemove, onCapturePhoto, photoTick, filterLabel = null }) {
  return (
    <section className="pantry-buckets" data-photo-tick={photoTick} data-filtered={filterLabel ? 'true' : undefined}>
      {LOCATIONS.map(loc => (
        <div className={`bucket bucket-${loc}`} key={loc}>
          <div className="bucket-title">
            <span className="bucket-icon" aria-hidden="true">{LOCATION_ICON[loc]}</span>
            {LOCATION_LABEL[loc]} <span className="pantry-count">{buckets[loc].length}</span>
          </div>
          {buckets[loc].length === 0 ? (
            // When a shelf category is selected the count is a filtered one, so
            // say which shelf is empty rather than implying the whole thing is.
            <div className="bucket-empty">{filterLabel ? `no ${filterLabel.toLowerCase()} here` : 'empty shelf'}</div>
          ) : (
            <div className="bucket-grid">
              {buckets[loc].map(i => {
                const fresh = freshnessFor(i);
                const photo = getItemPhoto(i.name); // photoTick forces this to re-read after a capture
                const icon = CATEGORY_ICON[categorize(i.name).cat] || CATEGORY_ICON.other;
                return (
                  <div className="bucket-item" key={i.id} style={{ '--fresh-color': FRESH_COLOR[fresh.status] }}>
                    <button className="bucket-remove" onClick={() => onRemove(i.id)} aria-label={`Remove ${i.name}`}>×</button>
                    {photo ? (
                      <span className="bucket-item-frame">
                        <img className="bucket-item-photo" src={photo} alt="" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="bucket-item-frame bucket-item-frame-add"
                        onClick={() => onCapturePhoto(i.name)}
                        title="Add a reference photo — so anyone shopping for you knows exactly what to grab"
                      >
                        <span className="bucket-item-icon" aria-hidden="true">{icon}</span>
                        <span className="bucket-item-cam">📷</span>
                      </button>
                    )}
                    <span className="bucket-item-name">{i.name}</span>
                    <span className="bucket-item-tags">
                      {fresh.status !== 'fresh' && (
                        <span className={`chip chip-fresh chip-fresh-${fresh.status}`}>{freshnessLabel(fresh.daysLeft)}</span>
                      )}
                      {i.snap && <span className="chip chip-snap">SNAP</span>}
                      {i.wic && <span className="chip chip-wic">WIC</span>}
                      {i.recall?.length > 0 && <span className="chip chip-recall" title="Possible FDA recall match">⚠</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
