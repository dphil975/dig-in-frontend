import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import Nav from '../../../../components/shell/Nav';
import { MOCKTAILS } from './mocktails';
import {
  FLAVOR_AXES, MOODS, MOOD_BY_KEY, FUNCTIONALS,
  recommend, matchesFilters,
} from '../../../../lib/mocktailFlavor';
import './ZeroProof.css';

/* ════════════════════════════════════════════════════════════
   ZERO-PROOF BAR — flavor-intelligent virgin cocktails.

   Take a classic, understand what the alcohol was doing across three
   layers (flavor / mouthfeel / mood), and rebuild it non-alcoholic —
   using functional + adaptogenic ingredients to recreate the "happy
   feeling" the booze gave, not just the taste. Filter by how you want
   to feel or what you want to taste; open a drink to see the full
   deconstruction, the swap table, its flavor radar, and why each
   functional ingredient works.
   ════════════════════════════════════════════════════════════ */

// Small 8-axis flavor radar.
function FlavorRadar({ flavor, color = '#6E8259', size = 168 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 22;
  const n = FLAVOR_AXES.length;
  const pt = (i, radius) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  };
  const rings = [0.33, 0.66, 1];
  const poly = FLAVOR_AXES.map((ax, i) => pt(i, r * (flavor[ax] || 0) / 100).join(',')).join(' ');
  return (
    <svg className="zp-radar" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {rings.map((rr, i) => (
        <polygon key={i} className="zp-radar-ring"
          points={FLAVOR_AXES.map((_, j) => pt(j, r * rr).join(',')).join(' ')} />
      ))}
      {FLAVOR_AXES.map((_, i) => {
        const [x, y] = pt(i, r);
        return <line key={i} className="zp-radar-spoke" x1={cx} y1={cy} x2={x} y2={y} />;
      })}
      <polygon className="zp-radar-shape" points={poly} style={{ fill: color, stroke: color }} />
      {FLAVOR_AXES.map((ax, i) => {
        const [x, y] = pt(i, r + 12);
        return <text key={ax} className="zp-radar-label" x={x} y={y} dominantBaseline="middle" textAnchor="middle">{ax}</text>;
      })}
    </svg>
  );
}

function MoodTags({ moods }) {
  return (
    <div className="zp-mood-tags">
      {moods.map(k => <span key={k} className="zp-mood-tag">{MOOD_BY_KEY[k]?.icon} {MOOD_BY_KEY[k]?.label}</span>)}
    </div>
  );
}

function Detail({ m, onClose }) {
  return (
    <div className="zp-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="zp-modal" style={{ '--tint': m.tint }}>
        <button className="zp-modal-x" onClick={onClose} aria-label="Close"><X size={18} /></button>

        <div className="zp-modal-hero">
          <p className="zp-modal-eyebrow">VIRGIN {m.classic.toUpperCase()}</p>
          <h2 className="zp-modal-name">{m.name}</h2>
          <p className="zp-modal-tagline">{m.tagline}</p>
          <MoodTags moods={m.moods} />
        </div>

        <div className="zp-modal-body">
          {/* Deconstruction: what the booze did */}
          <section className="zp-block">
            <h3 className="zp-block-title">What the alcohol was doing</h3>
            <div className="zp-spirit">
              <p className="zp-spirit-name">{m.spiritRole.spirit}</p>
              <ul className="zp-spirit-list">
                <li><b>Flavor</b> — {m.spiritRole.flavor}</li>
                <li><b>Mouthfeel</b> — {m.spiritRole.mouthfeel}</li>
                <li><b>Mood</b> — {m.spiritRole.mood}</li>
              </ul>
            </div>
          </section>

          {/* The swaps */}
          <section className="zp-block">
            <h3 className="zp-block-title">The swaps</h3>
            <div className="zp-swaps">
              {m.swaps.map((s, i) => (
                <div className="zp-swap" key={i}>
                  <div className="zp-swap-row">
                    <span className="zp-swap-from">{s.from}</span>
                    <ArrowRight size={15} className="zp-swap-arrow" />
                    <span className="zp-swap-to">{s.to}</span>
                  </div>
                  <p className="zp-swap-why">{s.why}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Flavor radar */}
          <section className="zp-block zp-block-radar">
            <div>
              <h3 className="zp-block-title">Flavor build</h3>
              <p className="zp-radar-note">Same shape as the original — that’s how it still reads as the classic.</p>
            </div>
            <FlavorRadar flavor={m.flavor} color={m.tint} />
          </section>

          {/* The "happy feeling" — functional breakdown */}
          <section className="zp-block">
            <h3 className="zp-block-title">Where the feeling comes from</h3>
            <div className="zp-func-list">
              {m.functionals.map(k => {
                const f = FUNCTIONALS[k];
                if (!f) return null;
                return (
                  <div className="zp-func" key={k}>
                    <div className="zp-func-head">
                      <span className="zp-func-name">{f.name}</span>
                      <span className="zp-func-kind">{f.kind}</span>
                    </div>
                    <p className="zp-func-note">{f.note}</p>
                  </div>
                );
              })}
            </div>
            <p className="zp-feel-note">{m.feelNote}</p>
          </section>

          {/* Build + method */}
          <div className="zp-recipe">
            <section className="zp-block">
              <h3 className="zp-block-title">Build</h3>
              <p className="zp-glass">{m.glass}</p>
              <ul className="zp-build">{m.build.map((b, i) => <li key={i}>{b}</li>)}</ul>
            </section>
            <section className="zp-block">
              <h3 className="zp-block-title">Method</h3>
              <ol className="zp-method">{m.method.map((s, i) => <li key={i}>{s}</li>)}</ol>
              <p className="zp-garnish"><b>Garnish:</b> {m.garnish}</p>
            </section>
          </div>

          <p className="zp-disclaimer">
            A flavor guide, not medical advice — dose functional ingredients to label directions, and check with a
            professional if you’re pregnant, nursing, or on medication.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ZeroProof({ embedded = false } = {}) {
  const navigate = useNavigate();
  const [mood, setMood] = useState(null);
  const [flavor, setFlavor] = useState(null);
  const [open, setOpen] = useState(null);

  const filters = { mood, flavor };
  const cards = useMemo(() => {
    const anyFilter = mood || flavor;
    const matched = MOCKTAILS.filter(m => matchesFilters(m, filters));
    return anyFilter ? recommend(matched, filters) : MOCKTAILS;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, flavor]);

  return (
    <div className="zp-page">
      {!embedded && <Nav />}
      <div className="zp-wrap">
        {!embedded && <button className="zp-back" onClick={() => navigate(-1)}>← BACK</button>}

        <header className="zp-head">
          <p className="zp-eyebrow">ZERO-PROOF BAR</p>
          <h1 className="zp-title">Classic cocktails, made virgin — feeling included.</h1>
          <p className="zp-sub">
            Every drink here starts as a classic, gets taken apart into <em>flavor</em>, <em>mouthfeel</em> and
            <em> mood</em>, then rebuilt with zero alcohol. Functional and adaptogenic ingredients recreate the
            “happy feeling” the booze used to give — the lift, the calm, the warmth — without the buzz or the crash.
          </p>
        </header>

        {/* Mood filter — the headline way in */}
        <div className="zp-filter-label">How do you want to feel?</div>
        <div className="zp-moods">
          {MOODS.map(mo => (
            <button key={mo.key} className={`zp-moodchip${mood === mo.key ? ' is-on' : ''}`}
              onClick={() => setMood(mood === mo.key ? null : mo.key)}>
              <span className="zp-moodchip-icon">{mo.icon}</span> {mo.label}
            </button>
          ))}
        </div>
        {mood && <p className="zp-mood-blurb">{MOOD_BY_KEY[mood].blurb}</p>}

        {/* Flavor filter */}
        <div className="zp-filter-label">…or by flavor</div>
        <div className="zp-flavors">
          {FLAVOR_AXES.map(ax => (
            <button key={ax} className={`zp-flavchip${flavor === ax ? ' is-on' : ''}`}
              onClick={() => setFlavor(flavor === ax ? null : ax)}>{ax}</button>
          ))}
        </div>

        {(mood || flavor) && (
          <button className="zp-clear" onClick={() => { setMood(null); setFlavor(null); }}>Clear filters ✕</button>
        )}

        {/* Cards */}
        <div className="zp-grid">
          {cards.map(m => (
            <button key={m.id} className="zp-card" style={{ '--tint': m.tint }} onClick={() => setOpen(m)}>
              <div className="zp-card-top">
                <span className="zp-card-classic">VIRGIN {m.classic}</span>
                <h3 className="zp-card-name">{m.name}</h3>
              </div>
              <FlavorRadar flavor={m.flavor} color="#ffffff" size={128} />
              <div className="zp-card-bottom">
                <MoodTags moods={m.moods} />
                <span className="zp-card-open">See the build <ArrowRight size={14} /></span>
              </div>
            </button>
          ))}
          {cards.length === 0 && <p className="zp-empty">No drink matches that combo yet — try a different feeling or flavor.</p>}
        </div>

        {/* How flavor works — the model, explained */}
        <section className="zp-lab">
          <div className="zp-lab-head">
            <Sparkles size={18} />
            <h2>How the flavor engine thinks</h2>
          </div>
          <div className="zp-lab-cols">
            <div className="zp-lab-col">
              <p className="zp-lab-num">01</p>
              <h4>Three layers, not one</h4>
              <p>A cocktail is <b>flavor</b> + <b>mouthfeel</b> + <b>mood</b>. Alcohol quietly does all three, so deleting it leaves three holes — we fill each on purpose.</p>
            </div>
            <div className="zp-lab-col">
              <p className="zp-lab-num">02</p>
              <h4>Match the shape</h4>
              <p>We map every drink across eight taste axes. The virgin build aims for the <b>same radar shape</b> as the original, so your palate still recognizes it.</p>
            </div>
            <div className="zp-lab-col">
              <p className="zp-lab-num">03</p>
              <h4>Rebuild the feeling</h4>
              <p>The burn becomes <b>ginger</b>; the buzz becomes <b>adaptogens &amp; botanicals</b> — ashwagandha, elderflower, damiana, L-theanine — chosen for the exact mood the spirit delivered.</p>
            </div>
            <div className="zp-lab-col">
              <p className="zp-lab-num">04</p>
              <h4>It was never the alcohol doing the exciting part</h4>
              <p><b>Bitterness</b>, <b>acidity</b>, <b>aromatic lift</b>, and <b>temperature/texture contrast</b> are what a palate actually reads as "interesting" — alcohol is one ingredient that can supply that, not the only one.</p>
            </div>
          </div>
        </section>
      </div>

      {open && <Detail m={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
