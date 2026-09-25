import { useState } from 'react';
import './RankRecipesModal.css';

const keyOf = r => r.id || r.name;

export default function RankRecipesModal({ recipes, onConfirm, onClose }) {
  const [order, setOrder] = useState([]); // array of recipe keys, tap order = rank order

  function toggle(recipe) {
    const k = keyOf(recipe);
    setOrder(o => (o.includes(k) ? o.filter(x => x !== k) : [...o, k]));
  }

  function confirm() {
    const byKey = Object.fromEntries(recipes.map(r => [keyOf(r), r]));
    onConfirm(order.map(k => byKey[k]));
  }

  const done = order.length === recipes.length;

  return (
    <div className="rank-overlay">
      <div className="rank-card">
        <h2 className="rank-title">RANK YOUR {recipes.length} PICKS</h2>
        <p className="rank-body">
          Tap them in the order you want to eat them. #1 opens the full recipe —
          the rest get saved to your profile.
        </p>

        <div className="rank-list">
          {recipes.map(r => {
            const k = keyOf(r);
            const rank = order.indexOf(k);
            return (
              <button key={k} className={`rank-item${rank >= 0 ? ' picked' : ''}`} onClick={() => toggle(r)}>
                <span className="rank-badge">{rank >= 0 ? rank + 1 : ''}</span>
                <span className="rank-name">{r.name}</span>
              </button>
            );
          })}
        </div>

        <div className="rank-actions">
          <button className="rank-btn-back" onClick={onClose}>← BACK TO SWIPING</button>
          <button className="rank-btn-confirm" disabled={!done} onClick={confirm}>
            CONFIRM →
          </button>
        </div>
      </div>
    </div>
  );
}
