import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Search, ShoppingCart, ArrowRight,
  LayoutGrid, RectangleHorizontal, Check, WifiOff, Plus,
} from 'lucide-react';
import Nav from '../../../../components/shell/Nav';
import { buildRolodex, addToShoppingList } from '../../../../lib/pantryTools';
import { RECIPE_INGREDIENTS, RECIPES_STATIC } from '../../../../data/recipesStatic';
import { BOROUGHS, incomeTier } from '../../../../data/storeData';
import './PantryRolodex.css';

/* ════════════════════════════════════════════════════════════════
   PANTRY ROLODEX — the recipes you can make from what you already own,
   as a flip-through card index that travels with you.

   The Pantry page collects what you have; this is the payoff surface: it takes
   those ingredients and spins up a rolodex of real recipes you can cook right
   now, ranked by how close each is. Flip through them like an index-card box,
   or switch to the grid. Everything reads from the same localStorage pantry, so
   it works offline — your pantry (and what it can cook) is always with you.

   SCOPE HONESTY: the matching is the deterministic pantryTools engine
   (two-way ingredient substring + staple assumptions + income-tier nudge), not
   a model call — so it's instant and offline. The AI Recipe Helper (/recipe-ai)
   is where "invent something new from exactly these" would plug in later.
   ════════════════════════════════════════════════════════════════ */

const PANTRY_KEY = 'dig_in_pantry';
const AREA_KEY = 'dig_in_area';

function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
  catch { return fallback; }
}
const titleCase = s => String(s).replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());

const BUCKET_META = {
  ready:   { label: 'Ready now', tone: '#3a9d8f', blurb: 'Everything on hand' },
  almost:  { label: 'Almost',    tone: '#e68a4e', blurb: '1–2 items short' },
  stretch: { label: 'Stretch',   tone: '#6E8259', blurb: 'You own the core' },
};

/* Coverage ring — how much of the recipe the pantry covers. */
function Ring({ pct, tone, size = 58 }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <svg className="nr-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} className="nr-ring-track" />
      <circle
        cx={size / 2} cy={size / 2} r={r} className="nr-ring-fill"
        style={{ stroke: tone, strokeDasharray: c, strokeDashoffset: c * (1 - pct) }}
      />
      <text x="50%" y="50%" className="nr-ring-label" dominantBaseline="central" textAnchor="middle">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

/* Chips of what you have (green) / need (amber). */
function Chips({ items, kind, max = 6 }) {
  const shown = items.slice(0, max);
  const extra = items.length - shown.length;
  return (
    <div className={`nr-chips nr-chips-${kind}`}>
      {shown.map((it, i) => <span key={i} className="nr-chip">{titleCase(it)}</span>)}
      {extra > 0 && <span className="nr-chip nr-chip-more">+{extra}</span>}
    </div>
  );
}

export default function PantryRolodex({ embedded = false } = {}) {
  const navigate = useNavigate();

  // Pantry lives on the /pantry page; read it live and re-read when the tab
  // regains focus so edits made there show up here without a reload.
  const [pantry, setPantry] = useState(() => load(PANTRY_KEY, []));
  useEffect(() => {
    const refresh = () => setPantry(load(PANTRY_KEY, []));
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const tier = useMemo(() => {
    try {
      const meta = BOROUGHS.find(b => b.id === localStorage.getItem(AREA_KEY));
      return meta?.income != null ? incomeTier(meta.income) : null;
    } catch { return null; }
  }, []);

  const [view, setView]       = useState('rolodex'); // 'rolodex' | 'index'
  const [bucket, setBucket]   = useState('all');
  const [mealType, setMeal]   = useState(null);
  const [query, setQuery]     = useState('');
  const [pos, setPos]         = useState(0);
  const [dir, setDir]         = useState(0);          // -1 / +1 for flip direction
  const [toast, setToast]     = useState('');
  const flipKey = useRef(0);

  // Full reachable set (drives the meal-type filter + is the source of truth).
  const base = useMemo(
    () => buildRolodex(pantry, RECIPE_INGREDIENTS, RECIPES_STATIC, { tier }),
    [pantry, tier]);
  const mealOptions = useMemo(() => {
    const seen = new Map();
    for (const c of base.cards) {
      const m = c.recipe.mealType || c.recipe.recipe_type;
      if (m) seen.set(m, (seen.get(m) || 0) + 1);
    }
    return [...seen.keys()].sort();
  }, [base]);

  // Meal + text filtered (all buckets), so bucket tabs can show scoped counts.
  const scoped = useMemo(
    () => buildRolodex(pantry, RECIPE_INGREDIENTS, RECIPES_STATIC, { tier, mealType, query }),
    [pantry, tier, mealType, query]);
  const counts = useMemo(() => {
    const c = { all: scoped.cards.length, ready: 0, almost: 0, stretch: 0 };
    for (const x of scoped.cards) c[x.bucket] += 1;
    return c;
  }, [scoped]);
  const cards = useMemo(
    () => (bucket === 'all' ? scoped.cards : scoped.cards.filter(c => c.bucket === bucket)),
    [scoped, bucket]);

  // Keep the rolodex position in range whenever the filtered set changes.
  useEffect(() => { setPos(p => (cards.length ? Math.min(p, cards.length - 1) : 0)); }, [cards.length]);

  const move = useCallback((delta) => {
    if (cards.length < 2) return;
    setDir(delta); flipKey.current += 1;
    setPos(p => (p + delta + cards.length) % cards.length);
  }, [cards.length]);

  // Arrow-key flipping in rolodex mode.
  useEffect(() => {
    if (view !== 'rolodex') return;
    const onKey = e => {
      if (e.key === 'ArrowRight') move(1);
      else if (e.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, move]);

  const flash = useCallback((m) => { setToast(m); setTimeout(() => setToast(t => (t === m ? '' : t)), 2400); }, []);

  const cook = useCallback((recipe) => {
    try {
      sessionStorage.setItem('dig_in_full_recipe', JSON.stringify(recipe));
      sessionStorage.setItem('dig_in_full_recipe_adapt', 'null');
    } catch { /* ignore */ }
    navigate('/recipe');
  }, [navigate]);

  const addMissing = useCallback((card) => {
    const n = addToShoppingList(card.missing);
    flash(n > 0 ? `Added ${n} item${n !== 1 ? 's' : ''} to your shopping list` : 'Already on your list');
  }, [flash]);

  const pantryCount = pantry.length;
  const current = cards[pos];

  return (
    <div className="nr-page">
      {!embedded && <Nav />}
      <div className="nr-wrap">
        {!embedded && <button className="nr-back" onClick={() => navigate('/pantry')}>← PANTRY</button>}

        <header className="nr-head">
          <p className="nr-eyebrow"><WifiOff size={12} /> ALWAYS WITH YOU · WORKS OFFLINE</p>
          <h1 className="nr-title">Pantry Rolodex</h1>
          <p className="nr-sub">
            Everything you can cook from what's in your pantry <em>right now</em>, as a card
            index you can flip through. Ranked by how close each recipe is — pick from what you have.
          </p>
          <div className="nr-pantry-line">
            <span className="nr-pantry-count">{pantryCount}</span>
            item{pantryCount !== 1 ? 's' : ''} in your pantry
            <button className="nr-pantry-edit" onClick={() => navigate('/pantry')}><Plus size={13} /> add more</button>
          </div>
        </header>

        {pantryCount === 0 ? (
          <div className="nr-empty">
            <p className="nr-empty-big">Your pantry is empty.</p>
            <p>Scan or add a few ingredients and your rolodex fills itself in.</p>
            <button className="nr-cta" onClick={() => navigate('/pantry')}>Stock your pantry <ArrowRight size={15} /></button>
          </div>
        ) : base.cards.length === 0 ? (
          <div className="nr-empty">
            <p className="nr-empty-big">No matches yet.</p>
            <p>Add a few more common ingredients and recipes will start showing up here.</p>
            <button className="nr-cta" onClick={() => navigate('/pantry')}>Add ingredients <ArrowRight size={15} /></button>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="nr-controls">
              <div className="nr-buckets">
                {['all', 'ready', 'almost', 'stretch'].map(b => (
                  <button
                    key={b}
                    className={`nr-bucket ${bucket === b ? 'is-on' : ''}`}
                    style={bucket === b && b !== 'all' ? { '--bk': BUCKET_META[b].tone } : undefined}
                    onClick={() => { setBucket(b); setPos(0); }}
                  >
                    {b === 'all' ? 'All' : BUCKET_META[b].label}
                    <span className="nr-bucket-n">{counts[b] ?? 0}</span>
                  </button>
                ))}
              </div>
              <div className="nr-tools">
                <div className="nr-search">
                  <Search size={14} />
                  <input
                    placeholder="Search recipes or ingredients…"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setPos(0); }}
                  />
                </div>
                {mealOptions.length > 1 && (
                  <select
                    className="nr-meal"
                    value={mealType || ''}
                    onChange={e => { setMeal(e.target.value || null); setPos(0); }}
                  >
                    <option value="">All meals</option>
                    {mealOptions.map(m => <option key={m} value={m}>{titleCase(m)}</option>)}
                  </select>
                )}
                <div className="nr-viewtoggle">
                  <button className={view === 'rolodex' ? 'is-on' : ''} onClick={() => setView('rolodex')} aria-label="Rolodex view">
                    <RectangleHorizontal size={15} />
                  </button>
                  <button className={view === 'index' ? 'is-on' : ''} onClick={() => setView('index')} aria-label="Grid view">
                    <LayoutGrid size={15} />
                  </button>
                </div>
              </div>
            </div>

            {cards.length === 0 ? (
              <div className="nr-empty nr-empty-sm">Nothing in this filter — try “All”.</div>
            ) : view === 'rolodex' ? (
              /* ── Rolodex: one flip card at a time ── */
              <div className="nr-rolodex">
                <button className="nr-flip nr-flip-prev" onClick={() => move(-1)} aria-label="Previous"><ChevronLeft size={22} /></button>

                <div className="nr-cardstage">
                  <article
                    key={flipKey.current}
                    className={`nr-card ${dir >= 0 ? 'flip-next' : 'flip-prev'}`}
                  >
                    <div className="nr-card-punches"><span /><span /></div>
                    <div className="nr-card-top">
                      <span className="nr-badge" style={{ '--bk': BUCKET_META[current.bucket].tone }}>
                        {BUCKET_META[current.bucket].label}
                      </span>
                      <span className="nr-card-meta">
                        {[current.recipe.mealType && titleCase(current.recipe.mealType),
                          (current.recipe.prepTime || current.recipe.cookTime) &&
                            `${(current.recipe.prepTime || 0) + (current.recipe.cookTime || 0)} min`,
                          current.recipe.difficulty && titleCase(current.recipe.difficulty)]
                          .filter(Boolean).join(' · ')}
                      </span>
                    </div>

                    <div className="nr-card-body">
                      <div className="nr-card-left">
                        <h2 className="nr-card-name">{current.recipe.name}</h2>
                        {current.recipe.description && (
                          <p className="nr-card-desc">{current.recipe.description}</p>
                        )}
                        <div className="nr-card-block">
                          <span className="nr-block-label nr-have">You have</span>
                          <Chips items={current.have} kind="have" />
                        </div>
                        {current.missing.length > 0 && (
                          <div className="nr-card-block">
                            <span className="nr-block-label nr-need">You need</span>
                            <Chips items={current.missing} kind="need" />
                          </div>
                        )}
                      </div>
                      <div className="nr-card-right">
                        <Ring pct={current.coverage} tone={BUCKET_META[current.bucket].tone} />
                        <span className="nr-ring-cap">in pantry</span>
                      </div>
                    </div>

                    <div className="nr-card-actions">
                      <button className="nr-btn nr-btn-primary" onClick={() => cook(current.recipe)}>
                        COOK THIS <ArrowRight size={15} />
                      </button>
                      {current.missing.length > 0 && (
                        <button className="nr-btn nr-btn-ghost" onClick={() => addMissing(current)}>
                          <ShoppingCart size={14} /> Add {current.missing.length} to list
                        </button>
                      )}
                    </div>
                  </article>
                  <div className="nr-pager">{pos + 1} / {cards.length}</div>
                </div>

                <button className="nr-flip nr-flip-next" onClick={() => move(1)} aria-label="Next"><ChevronRight size={22} /></button>
              </div>
            ) : (
              /* ── Index: the whole rolodex as a grid ── */
              <div className="nr-grid">
                {cards.map(c => (
                  <article className="nr-mini" key={c.recipe.id}>
                    <div className="nr-mini-top">
                      <span className="nr-badge nr-badge-sm" style={{ '--bk': BUCKET_META[c.bucket].tone }}>
                        {BUCKET_META[c.bucket].label}
                      </span>
                      <span className="nr-mini-cov" style={{ color: BUCKET_META[c.bucket].tone }}>
                        {Math.round(c.coverage * 100)}%
                      </span>
                    </div>
                    <h3 className="nr-mini-name">{c.recipe.name}</h3>
                    <div className="nr-mini-bar"><span style={{ width: `${Math.round(c.coverage * 100)}%`, background: BUCKET_META[c.bucket].tone }} /></div>
                    <p className="nr-mini-have">
                      {c.missing.length === 0
                        ? <><Check size={12} /> You have it all</>
                        : `Need: ${c.missing.slice(0, 3).map(titleCase).join(', ')}${c.missing.length > 3 ? '…' : ''}`}
                    </p>
                    <div className="nr-mini-actions">
                      <button className="nr-btn nr-btn-primary nr-btn-sm" onClick={() => cook(c.recipe)}>Cook →</button>
                      {c.missing.length > 0 && (
                        <button className="nr-btn nr-btn-ghost nr-btn-sm" onClick={() => addMissing(c)} aria-label="Add missing to shopping list">
                          <ShoppingCart size={13} />
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {toast && <div className="nr-toast">{toast}</div>}
      </div>
    </div>
  );
}
