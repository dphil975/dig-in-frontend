import { fmtRecallDate } from '../../../../lib/barcodeLookup';
import './RecallAlert.css';

/* RecallAlert — real FDA openFDA Food Enforcement records, text-matched
   against a product's brand/name (not a UPC-exact lookup — openFDA doesn't
   offer one), so this is framed as "possible match, verify it's your exact
   product" rather than a definitive diagnosis. Same honesty rule as every
   other non-diagnostic panel in this app. Renders nothing when there's
   nothing to show. */

export default function RecallAlert({ recalls }) {
  if (!recalls?.length) return null;
  return (
    <div className="recall-alert">
      <div className="recall-alert-head">⚠ POSSIBLE FDA RECALL MATCH</div>
      <p className="recall-alert-note">
        Text-matched against the FDA's public recall feed — verify this is your exact product
        (check the lot/date code) before assuming it applies. Full details at{' '}
        <a href="https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts" target="_blank" rel="noreferrer">FDA.gov</a>.
      </p>
      {recalls.map((r, i) => (
        <div className="recall-item" key={i}>
          <div className="recall-item-top">
            <span className="recall-class">{r.classification || 'Unclassified'}</span>
            <span className="recall-date">{fmtRecallDate(r.date)}</span>
          </div>
          <div className="recall-desc">{r.description}</div>
          {r.reason && <div className="recall-reason"><b>Reason:</b> {r.reason}</div>}
          <div className="recall-meta">{[r.firm, r.state, r.status].filter(Boolean).join(' · ')}</div>
        </div>
      ))}
    </div>
  );
}
