/* travelPartners.js — the real slot for the "travel brand partnership /
   referral code" business-dev hook behind City Food Passport.

   Deliberately empty. There is no signed travel, airline, or credit-card
   partnership today, so this ships with zero fabricated brands or codes —
   consistent with every other feature in this app (no fake community data,
   no invented store names). When a real partnership exists, add an entry
   here; FoodPassport renders whatever's in this array and falls back to an
   honest "no partner offers yet" state when it's empty — nothing else in the
   UI needs to change. */

export const TRAVEL_PARTNERS = [
  // Shape for when a real one lands:
  // { id: 'partner-id', name: 'Partner Name', kind: 'airline' | 'hotel' | 'card',
  //   blurb: 'What the perk is.', code: 'REFERRALCODE', url: 'https://...' }
];

export function partnersForRegion(/* regionId */) {
  // No per-region targeting logic exists yet either — return the flat list
  // (empty today) rather than pretending there's a matching engine behind it.
  return TRAVEL_PARTNERS;
}
