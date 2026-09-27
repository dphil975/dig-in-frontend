/* Saved shopping trips — the receipts you've kept. Extracted out of
   Pantry/index.jsx (was pushing 1,200+ lines) — purely presentational. */
export default function ShoppingTrips({ receipts, onRemove }) {
  if (!receipts.length) return null;
  return (
    <section className="pantry-trips">
      <div className="pantry-section-title">
        YOUR SHOPPING TRIPS <span className="pantry-count">{receipts.length}</span>
      </div>
      <p className="pantry-trips-help">
        Every receipt you upload is saved here — your own record of where, when, and what you bought.
      </p>
      <div className="pantry-trips-list">
        {receipts.slice(0, 12).map(t => (
          <div className="trip-card" key={t.id}>
            <div className="trip-main">
              <div className="trip-store">{t.store}</div>
              {t.address && <div className="trip-addr">{t.address}</div>}
              <div className="trip-meta">
                {[t.date, t.time].filter(Boolean).join(' · ') || 'date unknown'}
                {' · '}{t.itemCount} item{t.itemCount !== 1 ? 's' : ''}
                {t.total != null ? ` · $${Number(t.total).toFixed(2)}` : ''}
              </div>
            </div>
            <button
              type="button"
              className="trip-remove"
              aria-label="Remove this trip"
              onClick={() => onRemove(t.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
