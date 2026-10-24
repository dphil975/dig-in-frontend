import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, TrendingDown, FlaskConical } from 'lucide-react';
import Nav from '../../components/Nav';
import { DRINK_DB, BRANDS, ALL_DRINK_KEYS } from '../DrinkScan/drinkKnowledgeBase';
import { FOOD_COPYCATS, FOOD_BY_ID, FOOD_BRANDS } from './restaurantCopycats';
import {
  TASTE_FACTORS, FACTOR_BY_KEY, dominantFactors, balanceRead, troubleshoot, umamiInsight,
} from '../../lib/tasteEngine';
import { SKILL_LEVELS, loadSkill, saveSkill, adaptToSkill } from '../../lib/skillLevel';
import {
  storePrice, homeCost, savingsPerDrink, markupMultiple,
  projectSavings, projectValues, formatMoney, formatMoneyRound, savingsReframe,
} from '../../lib/copycatSavings';
import './CopycatLab.css';

/* ════════════════════════════════════════════════════════════
   COPYCAT LAB — buy the consistency back. Two modes:
   • Drinks — café copycats from the DrinkScan knowledge base.
   • Food  — restaurant & fast-food dishes, deconstructed by TASTE
     FACTOR (lib/tasteEngine): what's carrying the dish, the one or
     two brand-defining hooks, the recipe, and a nail-it self-test.
   Both put a dollar figure on the markup you stop paying.
   ════════════════════════════════════════════════════════════ */

const DRINK_FLAVOR_AXES = ['sweet', 'bitter', 'sour', 'salty', 'umami', 'creamy'];
const BRAND_ORDER = ['starbucks', 'dunkin', 'dutchbros', 'jamba'];

/* ─────────────── shared savings slider ─────────────── */
function SavingsCalc({ projection }) {
  const [perWeek, setPerWeek] = useState(4);
  const p = projection(perWeek);
  return (
    <div className="cl-calc">
      <div className="cl-calc-head">
        <TrendingDown size={16} />
        <span>How often do you buy it?</span>
        <span className="cl-calc-perweek">{perWeek}/week</span>
      </div>
      <input className="cl-calc-slider" type="range" min="1" max="14" value={perWeek}
        onChange={e => setPerWeek(Number(e.target.value))} />
      <div className="cl-calc-grid">
        <div><span className="cl-calc-num">{formatMoney(p.monthly)}</span><span className="cl-calc-lbl">/ month</span></div>
        <div className="cl-calc-year"><span className="cl-calc-num">{formatMoneyRound(p.yearly)}</span><span className="cl-calc-lbl">/ year</span></div>
        <div><span className="cl-calc-num">{formatMoneyRound(p.fiveYear)}</span><span className="cl-calc-lbl">/ 5 years</span></div>
      </div>
      <p className="cl-calc-reframe">That’s <b>{savingsReframe(p.yearly)}</b> — kept in your pocket, not theirs.</p>
    </div>
  );
}

/* For-your-skill-level guidance block. */
function SkillBlock({ item, skill, kind }) {
  const g = adaptToSkill(item, skill, kind);
  return (
    <section className="cl-block cl-skillblock">
      <h3 className="cl-block-title">For your level · {SKILL_LEVELS.find(s => s.key === skill)?.label}</h3>
      <p className="cl-skill-headline">{g.headline}</p>
      <ul className="cl-skill-points">{g.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
    </section>
  );
}

/* Umami call-out — the factor most copies miss. */
function UmamiNote({ profile }) {
  const note = umamiInsight(profile);
  if (!note) return null;
  return <div className="cl-umami"><span className="cl-umami-tag">UMAMI</span>{note}</div>;
}

/* ─────────────── DRINKS detail ─────────────── */
function DrinkDetail({ drinkKey, skill, onClose }) {
  const navigate = useNavigate();
  const d = DRINK_DB[drinkKey];
  const brand = BRANDS[d.brand];
  const sp = storePrice(d), hc = homeCost(drinkKey), mult = markupMultiple(drinkKey);
  const fp = d.chemistry?.flavorProfile;

  return (
    <div className="cl-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cl-modal" style={{ '--brand': brand?.color || '#6E8259' }}>
        <button className="cl-modal-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <div className="cl-modal-hero">
          <p className="cl-modal-brand">{brand?.label || d.brand}</p>
          <h2 className="cl-modal-name">{d.name}</h2>
          <PriceRow sp={sp} hc={hc} mult={mult} />
        </div>
        <div className="cl-modal-body">
          {d.secretRecipe && (
            <section className="cl-block cl-formula">
              <h3 className="cl-block-title">The consistency formula</h3>
              <p className="cl-formula-lead">The exact ratio that makes it taste identical every time — the thing you were really paying for.</p>
              <div className="cl-formula-box">{d.secretRecipe.ratios}</div>
              {d.secretRecipe.prePrep && <p className="cl-formula-tip"><b>Pro move:</b> {d.secretRecipe.prePrep}</p>}
              {d.secretRecipe.textureTip && <p className="cl-formula-tip"><b>Texture:</b> {d.secretRecipe.textureTip}</p>}
            </section>
          )}
          <div className="cl-two">
            <section className="cl-block"><h3 className="cl-block-title">What you need</h3>
              <ul className="cl-ings">{d.ingredients.map((i, n) => <li key={n}>{i}</li>)}</ul></section>
            <section className="cl-block"><h3 className="cl-block-title">Make it</h3>
              <ol className="cl-steps">{d.steps.map((s, n) => <li key={n}>{s}</li>)}</ol></section>
          </div>
          {fp && (
            <section className="cl-block"><h3 className="cl-block-title">Flavor build</h3>
              <div className="cl-flavors">
                {DRINK_FLAVOR_AXES.filter(ax => fp[ax] != null).map(ax => (
                  <FactorBar key={ax} name={ax} val={fp[ax]} hot={ax === 'umami' && fp.umami >= 28} />
                ))}
              </div>
              <UmamiNote profile={fp} />
              {d.chemistry?.tasteNotes && <p className="cl-tastenotes">{d.chemistry.tasteNotes}</p>}
            </section>
          )}
          <SkillBlock item={d} skill={skill} kind="drink" />
          <section className="cl-block"><h3 className="cl-block-title">What you keep</h3>
            <SavingsCalc projection={pw => projectSavings(drinkKey, pw)} /></section>
          <button className="cl-scan-link" onClick={() => navigate('/drink-scan')}>
            <Camera size={15} /> Have a cup in hand? Scan it instead
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── FOOD detail (taste-factor deconstruction) ─────────────── */
function FoodDetail({ id, skill, onClose }) {
  const navigate = useNavigate();
  const d = FOOD_BY_ID[id];
  const mult = d.homeCost ? d.storePrice / d.homeCost : 0;
  const dom = dominantFactors(d.tasteFactors, 3);
  const tips = troubleshoot(d.tasteFactors);

  return (
    <div className="cl-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cl-modal" style={{ '--brand': d.tint }}>
        <button className="cl-modal-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <div className="cl-modal-hero">
          <p className="cl-modal-brand">{d.brandLabel} · {d.category}</p>
          <h2 className="cl-modal-name">{d.name}</h2>
          <p className="cl-modal-cult">{d.cult}</p>
          <PriceRow sp={d.storePrice} hc={d.homeCost} mult={mult} />
        </div>

        <div className="cl-modal-body">
          {/* The deconstruction — "how the app breaks it down" */}
          <section className="cl-block">
            <h3 className="cl-block-title"><FlaskConical size={14} /> Taste-factor breakdown</h3>
            <p className="cl-balance">{balanceRead(d.tasteFactors)}</p>
            <div className="cl-flavors">
              {TASTE_FACTORS.map(f => (
                <FactorBar key={f.key} name={f.label} val={d.tasteFactors[f.key] ?? 0} hot={dom.includes(f.key)} />
              ))}
            </div>
            <UmamiNote profile={d.tasteFactors} />
          </section>

          {/* Signature hooks — the make-or-break */}
          <section className="cl-block">
            <h3 className="cl-block-title">What makes it taste like {d.brandLabel}</h3>
            <div className="cl-hooks">
              {d.signatureHooks.map((h, i) => (
                <div className="cl-hook" key={i}>
                  <span className="cl-hook-factor">{FACTOR_BY_KEY[h.factor]?.label || h.factor}</span>
                  <p className="cl-hook-secret">{h.secret}</p>
                  <p className="cl-hook-why">{h.why}</p>
                </div>
              ))}
            </div>
            <div className="cl-formula-box cl-secret-box"><b>The one thing:</b> {d.theSecret}</div>
          </section>

          {/* Recipe */}
          <div className="cl-two">
            <section className="cl-block"><h3 className="cl-block-title">What you need</h3>
              <ul className="cl-ings">{d.ingredients.map((i, n) => <li key={n}>{i}</li>)}</ul></section>
            <section className="cl-block"><h3 className="cl-block-title">Make it</h3>
              <ol className="cl-steps">{d.method.map((s, n) => <li key={n}>{s}</li>)}</ol></section>
          </div>

          <SkillBlock item={d} skill={skill} kind="food" />

          {/* Nail-it self-test = dish notes + engine troubleshooting */}
          <section className="cl-block">
            <h3 className="cl-block-title">Did you nail it?</h3>
            <ul className="cl-nail">
              {d.nailIt.map((n, i) => <li key={`n${i}`}>{n}</li>)}
              {tips.map((t, i) => <li key={`t${i}`}><b>{t.symptom}:</b> {t.fix}</li>)}
            </ul>
          </section>

          <section className="cl-block"><h3 className="cl-block-title">What you keep</h3>
            <SavingsCalc projection={pw => projectValues(d.storePrice, d.homeCost, pw)} /></section>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── small shared bits ─────────────── */
function PriceRow({ sp, hc, mult }) {
  return (
    <div className="cl-price-row">
      <div className="cl-price cl-price-store"><span>{formatMoney(sp)}</span><small>at the counter</small></div>
      <div className="cl-price-arrow">→</div>
      <div className="cl-price cl-price-home"><span>{formatMoney(hc)}</span><small>made at home</small></div>
      <div className="cl-markup">{mult.toFixed(1)}× markup</div>
    </div>
  );
}
function FactorBar({ name, val, hot }) {
  return (
    <div className="cl-flavor">
      <span className="cl-flavor-name">{name}</span>
      <div className="cl-flavor-bar"><div className={`cl-flavor-fill${hot ? ' is-hot' : ''}`} style={{ width: `${val}%` }} /></div>
      <span className="cl-flavor-val">{val}</span>
    </div>
  );
}

export default function CopycatLab({ embedded = false } = {}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('food');   // 'food' | 'drinks'
  const [brand, setBrand] = useState(null);
  const [skill, setSkill] = useState(loadSkill);
  const [openDrink, setOpenDrink] = useState(null);
  const [openFood, setOpenFood] = useState(null);

  function pickSkill(k) { setSkill(k); saveSkill(k); }

  const drinkBrandKeys = useMemo(
    () => [...new Set(ALL_DRINK_KEYS.map(k => DRINK_DB[k].brand))]
      .sort((a, b) => BRAND_ORDER.indexOf(a) - BRAND_ORDER.indexOf(b)), []);
  const drinkKeys = useMemo(
    () => ALL_DRINK_KEYS.filter(k => !brand || DRINK_DB[k].brand === brand), [brand]);
  const foodItems = useMemo(
    () => FOOD_COPYCATS.filter(m => !brand || m.brand === brand), [brand]);

  function switchMode(m) { setMode(m); setBrand(null); }

  return (
    <div className="cl-page">
      {!embedded && <Nav />}
      <div className="cl-wrap">
        {!embedded && <button className="cl-back" onClick={() => navigate(-1)}>← BACK</button>}

        <header className="cl-head">
          <p className="cl-eyebrow">COPYCAT LAB</p>
          <h1 className="cl-title">Buy the consistency back.</h1>
          <p className="cl-sub">
            You’re not addicted to the brand — you’re hooked on it tasting <em>exactly the same</em> every time.
            That’s a formula, and formulas can be copied. Food gets a full <em>taste-factor breakdown</em>: what’s
            carrying the dish, the one or two hooks that make it taste like <em>them</em>, and how to know you nailed it.
          </p>
        </header>

        {/* Mode toggle */}
        <div className="cl-mode">
          <button className={`cl-mode-btn${mode === 'food' ? ' is-on' : ''}`} onClick={() => switchMode('food')}>🍔 Food</button>
          <button className={`cl-mode-btn${mode === 'drinks' ? ' is-on' : ''}`} onClick={() => switchMode('drinks')}>🥤 Drinks</button>
        </div>

        {/* Skill level — reshapes every recipe's guidance to the cook */}
        <div className="cl-skill">
          <span className="cl-skill-q">Your level:</span>
          {SKILL_LEVELS.map(s => (
            <button key={s.key} className={`cl-skill-pill${skill === s.key ? ' is-on' : ''}`}
              title={s.blurb} onClick={() => pickSkill(s.key)}>{s.label}</button>
          ))}
        </div>

        {/* Brand tabs */}
        <div className="cl-brands">
          <button className={`cl-brand${brand == null ? ' is-on' : ''}`} onClick={() => setBrand(null)}>All</button>
          {mode === 'drinks'
            ? drinkBrandKeys.map(b => (
                <button key={b} className={`cl-brand${brand === b ? ' is-on' : ''}`}
                  style={brand === b ? { background: BRANDS[b]?.color, borderColor: 'transparent', color: '#fff' } : { color: BRANDS[b]?.color }}
                  onClick={() => setBrand(b)}>{BRANDS[b]?.label || b}</button>))
            : FOOD_BRANDS.map(b => (
                <button key={b.brand} className={`cl-brand${brand === b.brand ? ' is-on' : ''}`}
                  style={brand === b.brand ? { background: b.tint, borderColor: 'transparent', color: '#fff' } : { color: b.tint }}
                  onClick={() => setBrand(b.brand)}>{b.label}</button>))}
        </div>

        {/* Grid */}
        <div className="cl-grid">
          {mode === 'drinks'
            ? drinkKeys.map(k => {
                const d = DRINK_DB[k], br = BRANDS[d.brand];
                const save = savingsPerDrink(k), yr = projectSavings(k, 4).yearly;
                return (
                  <button key={k} className="cl-card" style={{ '--brand': br?.color || '#6E8259' }} onClick={() => setOpenDrink(k)}>
                    <span className="cl-card-brand" style={{ background: br?.bg, color: br?.color }}>{br?.label || d.brand}</span>
                    <h3 className="cl-card-name">{d.name}</h3>
                    <div className="cl-card-save">
                      <span className="cl-card-save-num">save {formatMoney(save)}</span>
                      <span className="cl-card-save-sub">a cup · ~{formatMoneyRound(yr)}/yr at 4 a week</span>
                    </div>
                    <span className="cl-card-open">See the formula →</span>
                  </button>);
              })
            : foodItems.map(m => {
                const save = Math.max(0, m.storePrice - m.homeCost);
                const yr = projectValues(m.storePrice, m.homeCost, 4).yearly;
                const dom = dominantFactors(m.tasteFactors, 2);
                return (
                  <button key={m.id} className="cl-card" style={{ '--brand': m.tint }} onClick={() => setOpenFood(m.id)}>
                    <span className="cl-card-brand" style={{ background: `${m.tint}1a`, color: m.tint }}>{m.brandLabel}</span>
                    <h3 className="cl-card-name">{m.name}</h3>
                    <div className="cl-card-factors">
                      {dom.map(k => <span key={k} className="cl-card-factor">{FACTOR_BY_KEY[k]?.label}</span>)}
                    </div>
                    <div className="cl-card-save">
                      <span className="cl-card-save-num">save {formatMoney(save)}</span>
                      <span className="cl-card-save-sub">a serving · ~{formatMoneyRound(yr)}/yr at 4 a week</span>
                    </div>
                    <span className="cl-card-open">Break it down →</span>
                  </button>);
              })}
        </div>
      </div>

      {openDrink && <DrinkDetail drinkKey={openDrink} skill={skill} onClose={() => setOpenDrink(null)} />}
      {openFood && <FoodDetail id={openFood} skill={skill} onClose={() => setOpenFood(null)} />}
    </div>
  );
}
