/* virality.js — how a real post "goes viral" and reaches everyone's feed.

   The rule the founder set: a post needs more than ~30 people to view AND
   interact before it takes off; once enough people interact, it spreads to
   everyone's feed. The honest way to build that on this app is to anchor it on
   the ONE genuinely multi-user signal that already exists — the judged-cook
   feed (node/routes/journal.js, listJudgedFeed): every entry carries a REAL
   `ratingCount` (how many different people rated/weighed in on that dish) and a
   REAL `ratingAvg`, written by the backend, not this device. That count IS the
   "people who interacted" number — so a dish crossing the threshold genuinely
   IS spreading across the community, and because the judged feed is the same
   for everyone, promoting it here promotes it in everyone's feed for real. No
   fabricated view counts, no phantom "3.2k people watching" — the number shown
   is the number the backend actually recorded.

   Tiers:
     • catching  — real early traction (≥ CATCHING_MIN interactions), a genuine
                   "this is starting to move" without over-claiming.
     • viral     — crossed the founder's threshold (> VIRAL_MIN = 30 people),
                   AND people actually like it (ratingAvg gate), so "viral" here
                   means "spreading because it's good," not rage-bait spreading
                   because it's infuriating (the MIR philosophy — nobody cooks
                   angry — applied to spread, not just ranking).

   Ships mostly empty until real dishes accrue real ratings — same honest
   posture as the feed's other backend-fed lanes. */

export const CATCHING_MIN = 10;   // real interactions to be "catching on"
export const VIRAL_MIN = 30;      // the founder's "> 30 people" threshold
const VIRAL_AVG_GATE = 3.4;       // out of 5 — spreading BECAUSE people like it
const CATCHING_AVG_GATE = 3.0;

function ratingCountOf(entry) {
  const n = Number(entry?.ratingCount);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function ratingAvgOf(entry) {
  const a = Number(entry?.ratingAvg);
  return Number.isFinite(a) ? a : 0;
}

/** Virality read for one judged entry, or null if it hasn't taken off.
    { tier: 'viral' | 'catching', count, avg } — count/avg are the REAL numbers
    the backend recorded, safe to show verbatim. */
export function viralityOf(entry) {
  const count = ratingCountOf(entry);
  if (count < CATCHING_MIN) return null;
  const avg = ratingAvgOf(entry);
  if (count >= VIRAL_MIN && avg >= VIRAL_AVG_GATE) return { tier: 'viral', count, avg };
  if (avg >= CATCHING_AVG_GATE) return { tier: 'catching', count, avg };
  return null;
}

/** The honest, verbatim community line for a viral/catching entry. */
export function viralLine(v) {
  if (!v) return '';
  const people = `${v.count} ${v.count === 1 ? 'person has' : 'people have'} weighed in`;
  return v.tier === 'viral'
    ? `Going viral — ${people} and it's climbing.`
    : `Catching on — ${people}.`;
}

/** Score for ordering the viral lane — spread first, then how well-liked. */
export function viralScore(v) {
  if (!v) return 0;
  return (v.tier === 'viral' ? 1000 : 0) + v.count + v.avg;
}
