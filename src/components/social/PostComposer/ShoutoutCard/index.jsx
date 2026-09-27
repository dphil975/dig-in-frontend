import { sponsorshipsForPlacement } from '../../../../data/sponsorships';
import { recordSponsorClick, buildReferralLink } from '../../../../lib/sponsorships';
import './ShoutoutCard.css';

/* ShoutoutCard — a curated "I used this" moment, not a banner ad. Renders
   nothing when its placement has no sponsor configured (src/data/
   sponsorships.js ships empty) — an unsold slot should be invisible, not
   apologize for itself to every visitor. Always shows a plain disclosure
   line regardless of what a sponsor entry provides: this reads like a
   friend's recommendation, but a friend doesn't get paid for it, so saying
   so plainly is what keeps it honest instead of deceptive. */

function Shoutout({ sponsor }) {
  function go() {
    recordSponsorClick({ id: sponsor.id, placement: sponsor.placement });
    window.open(buildReferralLink(sponsor), '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="shoutout-card">
      <div className="shoutout-head">
        {sponsor.logo
          ? <img className="shoutout-logo" src={sponsor.logo} alt={sponsor.brandName} />
          : <span className="shoutout-logo shoutout-logo-ph">{(sponsor.brandName || '?')[0]}</span>}
        <span className="shoutout-brand">{sponsor.brandName}</span>
      </div>
      <p className="shoutout-testimonial">"{sponsor.testimonial}"</p>
      <button type="button" className="shoutout-cta" onClick={go}>
        {sponsor.ctaLabel || 'Check it out'} →
      </button>
      <p className="shoutout-disclosure">
        {sponsor.disclosure || 'Sponsored — Dig In may earn a commission if you buy through this link.'}
      </p>
    </div>
  );
}

export default function ShoutoutCard({ placement }) {
  const sponsors = sponsorshipsForPlacement(placement);
  if (!sponsors.length) return null;
  return (
    <div className="shoutout-wrap">
      {sponsors.map(s => <Shoutout key={s.id} sponsor={s} />)}
    </div>
  );
}
