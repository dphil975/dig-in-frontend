import { useState, useRef, useEffect } from 'react';
import { BOROUGHS } from '../../../../data/storeData';
import './AreaPicker.css';

/* AreaPicker — a small, reusable "pick your area" control shared across
   features that want to be hyper-local without sending the user to the food
   map first (Trending Arbitrage, Social Feed's regional trending). Reads/
   writes the SAME `dig_in_area` key the map's own borough picker uses, so
   switching it here updates everywhere else that reads it too. */

const AREA_KEY = 'dig_in_area';

export function loadArea() {
  try { return localStorage.getItem(AREA_KEY); } catch { return null; }
}
export function saveArea(id) {
  try { id ? localStorage.setItem(AREA_KEY, id) : localStorage.removeItem(AREA_KEY); } catch { /* ignore */ }
}

export default function AreaPicker({ value, onChange, label = 'Area' }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const selected = BOROUGHS.find(b => b.id === value);
  const options = BOROUGHS.filter(b =>
    !q || b.label.toLowerCase().includes(q.toLowerCase()) || b.county.toLowerCase().includes(q.toLowerCase())
  );

  function pick(id) {
    saveArea(id);
    onChange?.(id);
    setOpen(false);
    setQ('');
  }

  return (
    <div className="area-picker" ref={wrapRef}>
      <button type="button" className="area-picker-btn" onClick={() => setOpen(o => !o)}>
        <span className="area-picker-label">{label}</span>
        <span className="area-picker-value">{selected ? selected.label : 'Choose your area'}</span>
        <span className="area-picker-caret">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="area-picker-panel">
          <input
            className="area-picker-search"
            placeholder="Search state or county…"
            value={q}
            onChange={e => setQ(e.target.value)}
            autoFocus
          />
          <div className="area-picker-list">
            {options.map(b => (
              <button
                key={b.id}
                type="button"
                className={`area-picker-option${value === b.id ? ' active' : ''}`}
                onClick={() => pick(b.id)}
              >
                {b.label}
              </button>
            ))}
            {options.length === 0 && <div className="area-picker-empty">No match</div>}
          </div>
        </div>
      )}
    </div>
  );
}
