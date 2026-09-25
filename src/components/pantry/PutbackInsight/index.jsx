import { useMemo } from 'react';

/* Why you said no — put-back insight. Extracted out of Pantry/index.jsx
   (was pushing 1,200+ lines) — purely presentational given the raw log. */
export default function PutbackInsight({ putbackLog }) {
  const reasonBreakdown = useMemo(() => {
    const m = {};
    for (const p of putbackLog) m[p.reason] = (m[p.reason] || 0) + 1;
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [putbackLog]);

  if (!reasonBreakdown.length) return null;

  return (
    <section className="pantry-insight">
      <div className="pantry-section-title">WHY YOU PUT THINGS BACK</div>
      <div className="insight-rows">
        {reasonBreakdown.map(([reason, n]) => (
          <div className="insight-row" key={reason}>
            <span className="insight-reason">{reason}</span>
            <span className="insight-bar"><span style={{ width: `${(n / putbackLog.length) * 100}%` }} /></span>
            <span className="insight-n">{n}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
