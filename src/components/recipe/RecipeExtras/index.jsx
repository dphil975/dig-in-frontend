import { useState } from 'react';
import './RecipeExtras.css';

/* RecipeExtras — the recipe-card sections beyond the core method: scalable
   ingredients, nutrition facts, remix ideas, serving suggestions, expert
   tips, storage/make-ahead, and FAQs. Every piece reads straight off the
   recipe object and renders nothing when that field is absent, so older
   recipes without this content just don't show these sections — no recipe
   needs to be migrated to gain them. */

function formatAmount(n) {
  if (!Number.isFinite(n)) return n;
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : String(r).replace(/0+$/, '').replace(/\.$/, '');
}

/* ── Ingredients — grouped, with a 1x/2x/3x serving multiplier ───────── */
export function IngredientsPanel({ groups, equipment }) {
  const [mult, setMult] = useState(1);
  if (!groups?.length) return null;

  return (
    <div className="rd-section">
      <div className="re-ing-head">
        <div className="rd-title">INGREDIENTS</div>
        <div className="re-mult">
          {[1, 2, 3].map(m => (
            <button
              key={m}
              type="button"
              className={`re-mult-btn${mult === m ? ' active' : ''}`}
              onClick={() => setMult(m)}
            >
              {m}x
            </button>
          ))}
        </div>
      </div>

      {groups.map((g, gi) => (
        <div className="re-ing-group" key={gi}>
          {g.title && <div className="re-ing-group-title">{g.title}</div>}
          <ul className="re-ing-list">
            {g.items.map((it, ii) => (
              <li className="re-ing-item" key={ii}>
                <span className="re-ing-amt">
                  {typeof it.amount === 'number' ? formatAmount(it.amount * mult) : it.amount} {it.unit}
                </span>
                <span className="re-ing-name">{it.name}</span>
                {it.note && <span className="re-ing-note">{it.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {equipment?.length > 0 && (
        <>
          <div className="re-ing-group-title">Equipment</div>
          <div className="re-equip">
            {equipment.map((e, i) => <span className="re-equip-chip" key={i}>{e}</span>)}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Nutrition facts — real numbers from the recipe, not estimated ───── */
const NUTRITION_ROWS = [
  ['carbs', 'Carbohydrates'], ['protein', 'Protein'], ['fat', 'Fat'],
  ['saturatedFat', 'Saturated Fat'], ['monounsaturatedFat', 'Monounsaturated Fat'],
  ['sodium', 'Sodium'], ['potassium', 'Potassium'], ['fiber', 'Fiber'], ['sugar', 'Sugar'],
  ['vitaminA', 'Vitamin A'], ['vitaminC', 'Vitamin C'], ['calcium', 'Calcium'], ['iron', 'Iron'],
];
export function NutritionFacts({ nutrition }) {
  if (!nutrition) return null;
  const rows = NUTRITION_ROWS.filter(([key]) => nutrition[key] != null);
  return (
    <div className="rd-section">
      <div className="rd-title">NUTRITION FACTS</div>
      <div className="re-nutrition">
        <div className="re-nutrition-head">
          <span>Serving: {nutrition.serving || '1 serving'}</span>
          {nutrition.calories != null && <span className="re-nutrition-cal">{nutrition.calories} kcal</span>}
        </div>
        <div className="re-nutrition-grid">
          {rows.map(([key, label]) => (
            <div className="re-nutrition-row" key={key}>
              <span>{label}</span>
              <span>{nutrition[key]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Shared "title + text" tip-card list — remixes, serve-with, expert tips, storage ── */
function TipList({ title, sub, items }) {
  if (!items?.length) return null;
  return (
    <div className="rd-section">
      <div className="rd-title">{title}</div>
      {sub && <p className="rd-sub">{sub}</p>}
      <div className="re-tips">
        {items.map((t, i) => (
          <div className="re-tip" key={i}>
            <div className="re-tip-title">{t.title}</div>
            <div className="re-tip-text">{t.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecipeVariations({ variations }) {
  return <TipList title="WAYS TO REMIX THIS RECIPE" items={variations} />;
}
export function ServeWith({ serveWith }) {
  if (!serveWith) return null;
  return <TipList title="WHAT TO SERVE WITH IT" sub={serveWith.intro} items={serveWith.items} />;
}
export function ExpertTips({ tips }) {
  return <TipList title="EXPERT TIPS" items={tips} />;
}
export function StorageGuide({ storage }) {
  return <TipList title="HOW TO STORE & FREEZE" items={storage} />;
}

/* ── Make ahead — a single paragraph ─────────────────────────────────── */
export function MakeAhead({ text }) {
  if (!text) return null;
  return (
    <div className="rd-section">
      <div className="rd-title">MAKE AHEAD</div>
      <p className="re-makeahead">{text}</p>
    </div>
  );
}

/* ── FAQs — accordion, tap a question to reveal the answer ──────────── */
export function RecipeFAQs({ faqs }) {
  const [open, setOpen] = useState(() => new Set());
  if (!faqs?.length) return null;
  const toggle = (i) => setOpen(prev => {
    const n = new Set(prev);
    n.has(i) ? n.delete(i) : n.add(i);
    return n;
  });
  return (
    <div className="rd-section">
      <div className="rd-title">RECIPE FAQS</div>
      <div className="re-faqs">
        {faqs.map((f, i) => (
          <div className={`re-faq${open.has(i) ? ' open' : ''}`} key={i}>
            <button type="button" className="re-faq-q" onClick={() => toggle(i)}>
              <span>{f.q}</span>
              <span className="re-faq-caret">{open.has(i) ? '▴' : '▾'}</span>
            </button>
            {open.has(i) && <div className="re-faq-a">{f.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
