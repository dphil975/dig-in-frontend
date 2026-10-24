/* sponsorships.js — the real config for "Referral Shoutout" placements: a
   curated, friend-recommendation-styled card ("I use this because...") with
   a referral link, shown on a specific page (a "placement"), instead of a
   banner ad.

   Deliberately empty. There is no signed brand or affiliate deal today, so
   this ships with zero fabricated sponsors, products, or referral codes —
   same posture as travelPartners.js and every other feature in this app (no
   fake community data, no invented store names, no invented partnerships).
   <ShoutoutCard placement="..."/> renders NOTHING when a placement has no
   entry, the same way an unsold ad slot shows nothing rather than a filler
   message — a monetization surface shouldn't narrate its own emptiness to
   every visitor.

   When a real deal exists, add one entry here; nothing else needs to change
   — ShoutoutCard, the click tracking, and every placement already work. */

export const SPONSORSHIPS = [
  // Shape for when a real one lands:
  // {
  //   id: 'brand-id',                 // stable, used for click tracking
  //   placement: 'nibblers',          // which page's <ShoutoutCard placement="..."/> shows this
  //   brandName: 'Brand Name',
  //   logo: '/path/or/https://...',   // optional
  //   testimonial: "I keep a tin of this on the counter — it's what I reach for on the nights in this section.",
  //   ctaLabel: 'Try it',
  //   referralUrl: 'https://brand.example/?ref=digin',
  //   disclosure: 'Dig In may earn a commission if you buy through this link.',
  // },
];

export function sponsorshipsForPlacement(placement) {
  return SPONSORSHIPS.filter(s => s.placement === placement);
}
