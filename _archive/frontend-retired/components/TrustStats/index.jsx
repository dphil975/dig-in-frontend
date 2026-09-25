import './TrustStats.css';

/* Trust strip — 3 numbers that sell the premise of the whole app. */
const STATS = [
  { value: '600+',   label: 'Recipes',      note: 'authentic home kitchens' },
  { value: '70',     label: 'Countries',    note: 'every region of the globe' },
  { value: '9,000+', label: 'Combinations', note: 'flavors × cuisines × formats' },
];

export default function TrustStats() {
  return (
    <section className="trust-stats">
      <div className="ts-inner">
        <div className="ts-row">
          {STATS.map(s => (
            <div className="ts-card" key={s.label}>
              <span className="ts-label">{s.label}</span>
              <span className="ts-value">{s.value}</span>
              <span className="ts-note">{s.note}</span>
            </div>
          ))}
        </div>
        <p className="ts-subtext">
          Same ingredients. <b>Different cuisines.</b> <b>Different seasonings.</b>
        </p>
      </div>
    </section>
  );
}
