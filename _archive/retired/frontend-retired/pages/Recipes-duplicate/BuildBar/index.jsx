import { useMemo, useState } from 'react';
import {
  STATIONS, QUICK_PICKS, loadQuickPick, setSinglePick, toggleMultiPick,
  pickedItems, buildTotals, buildToRecipe,
} from '../../../lib/buildBar';
import { MACRO_LABELS, MACRO_UNITS, MACRO_EXPLAINERS, NUTRITION_DISCLAIMER, percentDV } from '../../../lib/nutritionFacts';
import { AddToBoard } from '../../../components/recipe/RecipeSlipCard';
import '../../../components/recipe/RecipeSlipCard/RecipeSlipCard.css';
import './BuildBar.css';

const STATION_ORDER = ['salad', 'pizza', 'pasta'];
const MACRO_ORDER = ['protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'];
const VESSEL_HINT = {
  salad: 'Every ingredient you tap drops into the bowl below — same as watching a real salad line build your order.',
  pizza: 'Pick a crust first, then layer sauce, cheese, and toppings — watch the pie fill in as you go.',
  pasta: 'Pick a noodle, then sauce, protein, and mix-ins — see it land on the plate in real time.',
};

function emptySession() { return { picks: {}, addLog: [] }; }

function keyFor(slotKey, id) { return `${slotKey}:${id}`; }

// One-shot handoff from RecipeFull's "Build something like this →" launcher
// (lib/buildBar.js's matchRecipeToBuildBar) — same read-once-then-clear
// sessionStorage pattern RecipeFull itself uses for its own recipe handoff.
const SEED_KEY = 'dig_in_build_bar_seed';
function readSeed() {
  try {
    const raw = sessionStorage.getItem(SEED_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SEED_KEY);
    return JSON.parse(raw);
  } catch { return null; }
}

export default function BuildBar({ embedded = false } = {}) {
  const [seed] = useState(readSeed);
  const [station, setStation] = useState(seed?.station || 'salad');
  const [sessions, setSessions] = useState(() => {
    const base = { salad: emptySession(), pizza: emptySession(), pasta: emptySession() };
    if (seed?.station && seed.picks) {
      const items = pickedItems(seed.station, seed.picks);
      base[seed.station] = { picks: seed.picks, addLog: items.map((i) => keyFor(i.slotKey, i.id)) };
    }
    return base;
  });
  const [buildName, setBuildName] = useState(seed?.name || '');
  const [openMacro, setOpenMacro] = useState(null);

  const stationMeta = STATIONS[station];
  const { picks, addLog } = sessions[station];

  const items = useMemo(() => pickedItems(station, picks), [station, picks]);
  const totals = useMemo(() => buildTotals(station, picks), [station, picks]);
  const pcts = useMemo(() => percentDV(totals), [totals]);

  const orderedItems = useMemo(() => {
    const byKey = new Map(items.map((i) => [keyFor(i.slotKey, i.id), i]));
    return addLog.map((k) => byKey.get(k)).filter(Boolean);
  }, [items, addLog]);

  const recipeId = useMemo(
    () => `build-${station}-${Object.values(picks).flat().join('-') || 'empty'}`,
    [station, picks]
  );
  const hasBase = Boolean(picks.base);
  const recipe = useMemo(
    () => (hasBase ? buildToRecipe(station, picks, buildName, recipeId) : null),
    [station, picks, buildName, recipeId, hasBase]
  );

  function updateSession(next) {
    setSessions((prev) => ({ ...prev, [station]: next }));
  }

  function handleSingle(slotKey, id) {
    const already = picks[slotKey];
    const next = setSinglePick(picks, slotKey, id);
    let log = addLog.filter((k) => k !== keyFor(slotKey, already));
    if (next[slotKey] === id) log = [...log, keyFor(slotKey, id)];
    updateSession({ picks: next, addLog: log });
  }

  function handleMulti(slotKey, id) {
    const next = toggleMultiPick(picks, slotKey, id);
    const nowHas = (next[slotKey] || []).includes(id);
    const log = nowHas ? [...addLog, keyFor(slotKey, id)] : addLog.filter((k) => k !== keyFor(slotKey, id));
    updateSession({ picks: next, addLog: log });
  }

  function handleQuickPick(qpId) {
    const next = loadQuickPick(station, qpId);
    const nextItems = pickedItems(station, next);
    updateSession({ picks: next, addLog: nextItems.map((i) => keyFor(i.slotKey, i.id)) });
    setBuildName(QUICK_PICKS[station].find((q) => q.id === qpId)?.name || '');
  }

  function handleClear() {
    updateSession(emptySession());
    setBuildName('');
  }

  function isSelected(slot, id) {
    return slot.multi ? (picks[slot.key] || []).includes(id) : picks[slot.key] === id;
  }

  return (
    <div className="bb-page">
      <header className="bb-header">
        <h1>Build It & Watch It Happen</h1>
        <p className="bb-sub">Pick a station, add ingredients one at a time, and watch the real nutrition total build with you — no scanning a finished plate after the fact.</p>
      </header>

      <div className="bb-stations">
        {STATION_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={`bb-station-tab${station === id ? ' active' : ''}`}
            onClick={() => setStation(id)}
          >
            <span className="bb-station-emoji">{STATIONS[id].emoji}</span>
            {STATIONS[id].label}
          </button>
        ))}
      </div>

      <div className="bb-quickpicks">
        {QUICK_PICKS[station].map((qp) => (
          <button key={qp.id} type="button" className="bb-chip bb-quickpick-chip" onClick={() => handleQuickPick(qp.id)}>
            {qp.name}
          </button>
        ))}
        {addLog.length > 0 && (
          <button type="button" className="bb-chip bb-chip-clear" onClick={handleClear}>Clear</button>
        )}
      </div>

      <div className="bb-layout">
        {/* ── Palette ── */}
        <div className="bb-palette">
          {stationMeta.slots.map((slot) => (
            <div className="bb-slot" key={slot.key}>
              <div className="bb-slot-label">{slot.label}</div>
              <div className="bb-slot-options">
                {slot.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`bb-chip${isSelected(slot, opt.id) ? ' active' : ''}`}
                    onClick={() => (slot.multi ? handleMulti(slot.key, opt.id) : handleSingle(slot.key, opt.id))}
                  >
                    {opt.label}
                    <span className="bb-chip-cal">{opt.calories} cal</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Visual build area ── */}
        <div className="bb-visual">
          <p className="bb-vessel-hint">{VESSEL_HINT[station]}</p>
          <div className={`bb-vessel bb-vessel-${stationMeta.vessel}${orderedItems.length === 0 ? ' empty' : ''}`}>
            {orderedItems.length === 0 && <span className="bb-vessel-empty-text">Nothing added yet</span>}
            {orderedItems.map((item, i) => (
              <span key={keyFor(item.slotKey, item.id) + i} className="bb-vessel-item" style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}>
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Live nutrition panel ── */}
        <div className="bb-nutrition">
          <div className="bb-cal-total">
            <span className="bb-cal-number">{totals.calories}</span>
            <span className="bb-cal-label">calories</span>
          </div>
          {MACRO_ORDER.map((key) => (
            <div className="bb-macro-row" key={key}>
              <button type="button" className="bb-macro-label" onClick={() => setOpenMacro(openMacro === key ? null : key)}>
                {MACRO_LABELS[key]}
                <span className="bb-macro-info">?</span>
              </button>
              <div className="bb-macro-bar-track">
                <div className="bb-macro-bar-fill" style={{ width: `${Math.min(100, pcts[key])}%` }} />
              </div>
              <span className="bb-macro-value">{Math.round(totals[key] * 10) / 10}{MACRO_UNITS[key]} <em>({pcts[key]}% DV)</em></span>
              {openMacro === key && (
                <div className="bb-macro-explainer">
                  <strong>{MACRO_EXPLAINERS[key].title}</strong>
                  <p>{MACRO_EXPLAINERS[key].body}</p>
                </div>
              )}
            </div>
          ))}
          <p className="bb-dv-note">% DV based on a 2,000-calorie diet (the same reference used on every US nutrition label). {NUTRITION_DISCLAIMER}</p>

          {hasBase && (
            <div className="bb-save">
              <input
                type="text"
                className="bb-name-input"
                placeholder={`Name this ${stationMeta.label.toLowerCase().replace(' bar', '')}…`}
                value={buildName}
                onChange={(e) => setBuildName(e.target.value)}
              />
              <AddToBoard recipe={recipe} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
