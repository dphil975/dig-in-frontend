import { useState, useMemo } from 'react';
import { STORE_COLORS, STORE_TYPE_LABELS } from '../../data/storeData';
import { addToShoppingList } from '../../lib/pantryTools';
import {
  getAliases, addAlias, removeAlias, receiptsForStore,
  analyzeStorePurchases, pendingFeedbackForStore, answerFeedback,
  shrinkflationAlertsForStore, getItemPhoto,
} from '../../lib/storeMemory';
import './StoreMemoryCard.css';

/* StoreMemoryCard — a flip card for a marked store. Front: the store, like any
   map popup. Flip it and the back is the store's MEMORY: proof-of-purchase
   receipts, what you usually buy here, what's probably due for a refill, new
   things you tried (with the "did you like it?" loop), shrinkflation alerts,
   and reference photos — so someone else could walk in and know exactly what
   to grab. All of it reads the same pantry/receipt data the Pantry page
   already owns; this component is presentation only. */

function timeAgo(iso) {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function StoreMemoryCard({ store, onClose }) {
  const [flipped, setFlipped] = useState(false);
  const [aliasInput, setAliasInput] = useState('');
  const [aliasTick, setAliasTick] = useState(0);   // bump to re-read aliases after add/remove
  const [addedKeys, setAddedKeys] = useState(() => new Set());
  const [answeredKeys, setAnsweredKeys] = useState(() => new Set());
  const [expandedReceipt, setExpandedReceipt] = useState(null);

  const aliases = useMemo(() => getAliases(store.id), [store.id, aliasTick]);
  const receipts = useMemo(() => receiptsForStore(store), [store]);
  const analysis = useMemo(() => analyzeStorePurchases(store), [store]);
  const pending = useMemo(() => pendingFeedbackForStore(store), [store]);
  const shrinkAlerts = useMemo(() => shrinkflationAlertsForStore(store), [store]);

  const color = STORE_COLORS[store.type] || STORE_COLORS.grocery;
  const label = STORE_TYPE_LABELS[store.type] || 'Store';

  function submitAlias(e) {
    e.preventDefault();
    if (!aliasInput.trim()) return;
    addAlias(store.id, aliasInput.trim());
    setAliasInput('');
    setAliasTick(t => t + 1);
  }
  function deleteAlias(a) {
    removeAlias(store.id, a);
    setAliasTick(t => t + 1);
  }

  function repurchase(name, key) {
    addToShoppingList([name]);
    setAddedKeys(prev => new Set(prev).add(key));
  }
  function respond(key, liked) {
    answerFeedback(key, liked);
    setAnsweredKeys(prev => new Set(prev).add(key));
  }

  return (
    <div className="smc-overlay" onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="smc-stage">
        <button className="smc-close" onClick={onClose} aria-label="Close">✕</button>

        <div className={`smc-card${flipped ? ' is-flipped' : ''}`}>
          {/* ── FRONT ─────────────────────────────────────────────── */}
          <div className="smc-face smc-front" onClick={() => setFlipped(true)}>
            <div className="smc-front-header" style={{ background: color }}>
              <span className="smc-type">{label}</span>
              <h2 className="smc-name">{store.name}</h2>
              {store.address && <p className="smc-addr">{store.address}</p>}
            </div>
            <div className="smc-front-body">
              {aliases.length > 0 && (
                <div className="smc-alias-preview">
                  {aliases.map(a => <span className="smc-alias-pill" key={a}>{a}</span>)}
                </div>
              )}
              <div className="smc-front-stats">
                <div className="smc-stat"><span className="smc-stat-n">{receipts.length}</span><span className="smc-stat-l">receipts</span></div>
                <div className="smc-stat"><span className="smc-stat-n">{analysis.frequent.length}</span><span className="smc-stat-l">regulars</span></div>
                <div className="smc-stat"><span className="smc-stat-n">{analysis.dueToRepurchase.length}</span><span className="smc-stat-l">due soon</span></div>
              </div>
              <button className="smc-flip-btn" onClick={() => setFlipped(true)}>↻ Flip for store memory</button>
            </div>
          </div>

          {/* ── BACK ──────────────────────────────────────────────── */}
          <div className="smc-face smc-back">
            <div className="smc-back-header">
              <span className="smc-back-title">STORE MEMORY</span>
              <button className="smc-flip-btn smc-flip-back" onClick={() => setFlipped(false)}>↺ Flip back</button>
            </div>

            <div className="smc-back-scroll">
              {/* Aliases */}
              <section className="smc-section">
                <h4 className="smc-h">NICKNAMES</h4>
                <div className="smc-alias-row">
                  {aliases.map(a => (
                    <span className="smc-alias-pill smc-alias-del" key={a} onClick={() => deleteAlias(a)}>{a} ✕</span>
                  ))}
                </div>
                <form className="smc-alias-form" onSubmit={submitAlias}>
                  <input
                    className="smc-alias-input"
                    placeholder="e.g. Tony's, the corner spot…"
                    value={aliasInput}
                    onChange={e => setAliasInput(e.target.value)}
                  />
                  <button type="submit" className="smc-alias-add">Add</button>
                </form>
              </section>

              {/* New items — did you like it? */}
              {pending.length > 0 && (
                <section className="smc-section">
                  <h4 className="smc-h">DID YOU LIKE IT?</h4>
                  {pending.map(p => answeredKeys.has(p.key) ? null : (
                    <div className="smc-feedback-row" key={p.key}>
                      <span className="smc-feedback-name">{p.name}</span>
                      <div className="smc-feedback-btns">
                        <button className="smc-fb smc-fb-yes" onClick={() => respond(p.key, true)}>👍 Loved it</button>
                        <button className="smc-fb smc-fb-no" onClick={() => respond(p.key, false)}>👎 Not for me</button>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* Frequent items */}
              {analysis.frequent.length > 0 && (
                <section className="smc-section">
                  <h4 className="smc-h">YOUR REGULARS HERE</h4>
                  <div className="smc-chip-row">
                    {analysis.frequent.map(f => {
                      const photo = getItemPhoto(f.name);
                      return (
                        <span className="smc-chip" key={f.key}>
                          {photo && <img className="smc-chip-photo" src={photo} alt="" />}
                          {f.name} <b>×{f.count}</b>
                        </span>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Due to repurchase */}
              {analysis.dueToRepurchase.length > 0 && (
                <section className="smc-section">
                  <h4 className="smc-h">PROBABLY RUNNING LOW</h4>
                  {analysis.dueToRepurchase.map(d => (
                    <div className="smc-repurchase-row" key={d.key}>
                      <div>
                        <span className="smc-repurchase-name">{d.name}</span>
                        <span className="smc-repurchase-sub">usually every ~{d.avgIntervalDays}d · last {timeAgo(d.lastBoughtAt)}</span>
                      </div>
                      <button
                        className={`smc-add-btn${addedKeys.has(d.key) ? ' added' : ''}`}
                        onClick={() => repurchase(d.name, d.key)}
                        disabled={addedKeys.has(d.key)}
                      >
                        {addedKeys.has(d.key) ? '✓ Added' : '+ Add'}
                      </button>
                    </div>
                  ))}
                </section>
              )}

              {/* Shrinkflation */}
              {shrinkAlerts.length > 0 && (
                <section className="smc-section">
                  <h4 className="smc-h smc-h-warn">SHRINKFLATION WATCH</h4>
                  {shrinkAlerts.map((a, i) => (
                    <div className="smc-shrink-row" key={i}>
                      <b>{a.name}</b> was {a.wasSize}{a.wasPrice != null ? ` for $${a.wasPrice.toFixed(2)}` : ''} — now {a.nowSize}
                      {a.nowPrice != null ? ` for $${a.nowPrice.toFixed(2)}` : ''}. <span className="smc-shrink-pct">{a.percentSmaller}% less</span>
                    </div>
                  ))}
                </section>
              )}

              {/* Receipts / proof of purchase */}
              <section className="smc-section">
                <h4 className="smc-h">PROOF OF PURCHASE</h4>
                {receipts.length === 0 ? (
                  <p className="smc-empty">No receipts logged for this store yet — import one from the Pantry page.</p>
                ) : (
                  <div className="smc-receipt-list">
                    {receipts.slice(0, 8).map(r => (
                      <div className="smc-receipt" key={r.id}>
                        <button className="smc-receipt-head" onClick={() => setExpandedReceipt(x => x === r.id ? null : r.id)}>
                          <span>{r.date || timeAgo(r.importedAt)}</span>
                          <span>{r.itemCount} item{r.itemCount !== 1 ? 's' : ''}{r.total != null ? ` · $${r.total.toFixed(2)}` : ''}</span>
                        </button>
                        {expandedReceipt === r.id && (
                          <div className="smc-receipt-detail">
                            {r.attachment?.dataUrl && (
                              r.attachment.fileType === 'application/pdf' ? (
                                <a className="smc-receipt-pdf" href={r.attachment.dataUrl} target="_blank" rel="noreferrer">
                                  📄 View {r.attachment.fileName || 'receipt PDF'}
                                </a>
                              ) : (
                                <img className="smc-receipt-img" src={r.attachment.dataUrl} alt="Receipt" />
                              )
                            )}
                            <ul className="smc-receipt-items">
                              {(r.items || []).map((it, i) => <li key={i}>{it}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
